import { schnorr } from "@noble/curves/secp256k1.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateNostrEventId, fetchNostrParent, parseRelayUrls, publishToRelay, serializeNip01IdPayload, validateSignedEvent, verifyNostrEvent, type NostrEvent } from "../src/lib/nostr";

const encoder = new TextEncoder();
const secretKey = Uint8Array.from({ length: 32 }, (_, index) => index === 31 ? 1 : 0);
const publicKey = Array.from(schnorr.getPublicKey(secretKey), (byte) => byte.toString(16).padStart(2, "0")).join("");
function fromHex(value: string): Uint8Array { return Uint8Array.from(value.match(/.{2}/g) ?? [], (part) => Number.parseInt(part, 16)); }
function toHex(value: Uint8Array): string { return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join(""); }

function makeEvent(content: string): NostrEvent {
  const unsigned = { pubkey: publicKey, created_at: 1_800_000_000, kind: 1, tags: [] as string[][], content };
  const id = calculateNostrEventId(unsigned);
  const sig = toHex(schnorr.sign(fromHex(id), secretKey, new Uint8Array(32)));
  return { ...unsigned, id, sig };
}

function emitFrame(socket: EventTarget, frame: unknown) {
  const message = new Event("message") as MessageEvent;
  Object.defineProperty(message, "data", { value: JSON.stringify(frame) });
  socket.dispatchEvent(message);
}

function installSocketMock(onSend: (wire: string, socket: EventTarget) => void) {
  class MockSocket extends EventTarget {
    constructor(readonly url: string) { super(); queueMicrotask(() => this.dispatchEvent(new Event("open"))); }
    send(wire: string) { onSend(wire, this); }
    close() { /* The isolated test socket has no network resource. */ }
  }
  vi.stubGlobal("WebSocket", MockSocket as unknown as typeof WebSocket);
}

describe("NIP-01 relay boundary", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("accepts only explicitly selected wss relays without embedded credentials or query tokens", () => {
    expect(parseRelayUrls("wss://relay.example\nwss://relay2.example:443")).toEqual(["wss://relay.example", "wss://relay2.example"]);
    expect(() => parseRelayUrls("https://relay.example")).toThrow("wss://");
    expect(() => parseRelayUrls("wss://user:secret@relay.example")).toThrow("credentials");
    expect(() => parseRelayUrls("wss://relay.example/?token=secret")).toThrow("query parameters");
    expect(() => parseRelayUrls("wss://relay.example\nwss://RELAY.example/")).toThrow("duplicate");
    expect(() => parseRelayUrls(Array.from({ length: 6 }, (_, index) => `wss://r${index}.example`).join("\n"))).toThrow("five relays");
  });

  it("uses NIP-01 event serialization and verifies a real BIP-340 signature over the 32-byte event ID", async () => {
    const event = makeEvent("Test-only exact approved text");
    await expect(verifyNostrEvent(event)).resolves.toMatchObject({ valid: true, event, reason: expect.stringContaining("BIP-340") });
    await expect(validateSignedEvent(event, { pubkey: event.pubkey, content: event.content, createdAt: event.created_at })).resolves.toBeUndefined();
    await expect(validateSignedEvent({ ...event, content: "altered" }, { pubkey: event.pubkey, content: event.content, createdAt: event.created_at })).rejects.toThrow();
    await expect(validateSignedEvent({ ...event, id: "ef".repeat(32) }, { pubkey: event.pubkey, content: event.content, createdAt: event.created_at })).rejects.toThrow("Event ID");
    await expect(verifyNostrEvent({ ...event, sig: "00".repeat(64) })).resolves.toMatchObject({ valid: false, reason: "BIP-340 signature is invalid." });
    expect(serializeNip01IdPayload(event)).toBe(JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]));
    expect(calculateNostrEventId(event)).toBe(event.id);
  });

  it("treats a relay publication as successful only for an OK acknowledgement of the exact event ID", async () => {
    class MockSocket extends EventTarget {
      constructor(readonly url: string) {
        super();
        queueMicrotask(() => this.dispatchEvent(new Event("open")));
      }
      send(wire: string) {
        const [kind, event] = JSON.parse(wire) as [string, NostrEvent];
        expect(kind).toBe("EVENT");
        queueMicrotask(() => {
          const message = new Event("message") as MessageEvent;
          Object.defineProperty(message, "data", { value: JSON.stringify(["OK", event.id, true, "stored by isolated test relay"]) });
          this.dispatchEvent(message);
        });
      }
      close() { this.dispatchEvent(new Event("close")); }
    }
    vi.stubGlobal("window", { setTimeout: globalThis.setTimeout.bind(globalThis) } as unknown as Window);
    vi.stubGlobal("WebSocket", MockSocket as unknown as typeof WebSocket);
    const event = makeEvent("Test-only consent-gated text");
    const result = await publishToRelay("wss://test-relay.invalid", event, 500);
    expect(result.accepted).toBe(true);
    expect(result.outcome).toBe("ACCEPTED");
    expect(result.response).toBe("stored by isolated test relay");
    expect(result.notices).toEqual([]);
    expect(result.host).toBe("test-relay.invalid");
  });

  it("preserves an exact relay rejection rather than collapsing it into a timeout", async () => {
    installSocketMock((wire, socket) => {
      const [, event] = JSON.parse(wire) as [string, NostrEvent];
      queueMicrotask(() => emitFrame(socket, ["OK", event.id, false, "blocked by relay policy"]));
    });
    const result = await publishToRelay("wss://reject-relay.invalid", makeEvent("Test-only rejected event"), 100);
    expect(result).toMatchObject({ accepted: false, outcome: "REJECTED", response: "blocked by relay policy", notices: [] });
  });

  it("retains bounded NOTICE text and an explicit CLOSED outcome per relay", async () => {
    installSocketMock((wire, socket) => {
      const [, event] = JSON.parse(wire) as [string, NostrEvent];
      queueMicrotask(() => {
        emitFrame(socket, ["NOTICE", "maintenance window"]);
        emitFrame(socket, ["CLOSED", "event-publish", "temporarily unavailable"]);
        emitFrame(socket, ["OK", event.id, true, "late acknowledgement"]);
      });
    });
    const result = await publishToRelay("wss://notice-relay.invalid", makeEvent("Test-only closed event"), 100);
    expect(result).toMatchObject({ accepted: false, outcome: "CLOSED", response: "Relay CLOSED event-publish: temporarily unavailable", notices: ["maintenance window"] });
  });

  it("retains NOTICE frames when the actual EVENT acknowledgement times out", async () => {
    installSocketMock((_wire, socket) => queueMicrotask(() => emitFrame(socket, ["NOTICE", "relay is rate limiting"])))
    const result = await publishToRelay("wss://slow-relay.invalid", makeEvent("Test-only uncertain event"), 25);
    expect(result).toMatchObject({ accepted: false, outcome: "TIMEOUT", notices: ["relay is rate limiting"] });
    expect(result.response).toContain("No matching EVENT OK acknowledgement");
  });

  it("reports exact-parent success, absence, and wrong-author results using isolated relay frames", async () => {
    const parent = makeEvent("Test-only parent event");
    const installQueryMock = (events: NostrEvent[]) => installSocketMock((wire, socket) => {
      const [kind, requestId, filter] = JSON.parse(wire) as [string, string, { ids?: string[] }];
      expect(kind).toBe("REQ");
      expect(filter.ids).toEqual([parent.id]);
      queueMicrotask(() => {
        for (const event of events) emitFrame(socket, ["EVENT", requestId, event]);
        emitFrame(socket, ["EOSE", requestId]);
      });
    });

    installQueryMock([parent]);
    const found = await fetchNostrParent(["wss://parent-relay.invalid"], parent.id, publicKey);
    expect(found.entries).toHaveLength(1);
    expect(found.entries[0]).toMatchObject({ valid: true, event: parent });

    installQueryMock([]);
    const missing = await fetchNostrParent(["wss://parent-relay.invalid"], parent.id, publicKey);
    expect(missing.entries).toEqual([]);
    expect(missing.relayResults[0].outcome).toBe("EOSE");

    installQueryMock([parent]);
    const wrongAuthor = await fetchNostrParent(["wss://parent-relay.invalid"], parent.id, "ab".repeat(32));
    expect(wrongAuthor.entries[0].event.pubkey).not.toBe("ab".repeat(32));
    expect(wrongAuthor.entries[0].valid).toBe(true);
  });
});
