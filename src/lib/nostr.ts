import { schnorr } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";

export type NostrEvent = {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
};

export type NostrUnsignedEvent = Omit<NostrEvent, "id" | "pubkey" | "sig">;
export type NostrSigner = {
  getPublicKey: () => Promise<string>;
  signEvent: (event: NostrUnsignedEvent) => Promise<NostrEvent>;
};
export type RelayOutcome = "ACCEPTED" | "REJECTED" | "CLOSED" | "ERROR" | "TIMEOUT";
export type RelayResult = { relay: string; host: string; accepted: boolean; outcome: RelayOutcome; response: string; notices: string[] };
export type RelayQueryResult = {
  relay: string;
  host: string;
  outcome: "EOSE" | "TIMEOUT" | "CLOSED" | "ERROR";
  events: unknown[];
  notices: string[];
  error?: string;
};
export type VerifiedEvent = { event: NostrEvent; valid: boolean; reason: string; relayHosts: string[] };
export type FeedReadResult = { entries: VerifiedEvent[]; relayResults: RelayQueryResult[]; malformedCount: number; retrievedAt: string };

const encoder = new TextEncoder();
const FEED_EVENT_LIMIT = 50;
const MAX_EVENT_BYTES = 256_000;
const MAX_FRAME_BYTES = 512_000;
const MAX_TAGS = 200;
const MAX_TAG_PARTS = 30;
const MAX_TAG_TEXT = 4_096;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string): Uint8Array {
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasLoneSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) return true;
  }
  return false;
}

export function isNostrEvent(value: unknown): value is NostrEvent {
  if (!isPlainObject(value)) return false;
  const expectedKeys = ["content", "created_at", "id", "kind", "pubkey", "sig", "tags"];
  if (Object.keys(value).length !== expectedKeys.length || expectedKeys.some((key) => !Object.hasOwn(value, key))) return false;
  if (typeof value.id !== "string" || !/^[0-9a-f]{64}$/.test(value.id) || typeof value.pubkey !== "string" || !/^[0-9a-f]{64}$/.test(value.pubkey) || typeof value.sig !== "string" || !/^[0-9a-f]{128}$/.test(value.sig)) return false;
  if (!Number.isSafeInteger(value.created_at) || Number(value.created_at) < 0 || !Number.isInteger(value.kind) || Number(value.kind) < 0 || Number(value.kind) > 65_535) return false;
  if (typeof value.content !== "string" || hasLoneSurrogate(value.content) || encoder.encode(value.content).byteLength > MAX_EVENT_BYTES) return false;
  if (!Array.isArray(value.tags) || value.tags.length > MAX_TAGS) return false;
  for (const tag of value.tags) {
    if (!Array.isArray(tag) || tag.length > MAX_TAG_PARTS || !tag.every((part) => typeof part === "string" && !hasLoneSurrogate(part) && part.length <= MAX_TAG_TEXT)) return false;
  }
  return encoder.encode(JSON.stringify(value)).byteLength <= MAX_EVENT_BYTES;
}

export function serializeNip01IdPayload(event: Pick<NostrEvent, "pubkey" | "created_at" | "kind" | "tags" | "content">): string {
  return JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]);
}

export function calculateNostrEventId(event: Pick<NostrEvent, "pubkey" | "created_at" | "kind" | "tags" | "content">): string {
  return bytesToHex(sha256(encoder.encode(serializeNip01IdPayload(event))));
}

export async function verifyNostrEvent(value: unknown): Promise<{ valid: boolean; event: NostrEvent | null; reason: string }> {
  if (!isNostrEvent(value)) return { valid: false, event: null, reason: "Malformed NIP-01 event envelope." };
  const event = value;
  if (calculateNostrEventId(event) !== event.id) return { valid: false, event, reason: "Event ID does not match NIP-01 serialization." };
  let signatureValid = false;
  try { signatureValid = schnorr.verify(hexToBytes(event.sig), hexToBytes(event.id), hexToBytes(event.pubkey)); }
  catch { signatureValid = false; }
  return signatureValid ? { valid: true, event, reason: "BIP-340 signature verifies for this event and public key." } : { valid: false, event, reason: "BIP-340 signature is invalid." };
}

export function parseRelayUrls(input: string): string[] {
  const raw = input.split(/[\n,\s]+/).map((item) => item.trim()).filter(Boolean);
  if (raw.length > 5) throw new Error("Use no more than five relays in one action.");
  const urls = raw.map((item) => {
    let url: URL;
    try { url = new URL(item); } catch { throw new Error(`Invalid relay URL: ${item}`); }
    if (url.protocol !== "wss:" || !url.hostname || url.username || url.password || url.hash || url.search) {
      throw new Error("Relays must use wss:// and may not include credentials, query parameters, or a fragment.");
    }
    return url.toString().replace(/\/$/, "");
  });
  if (urls.length === 0) throw new Error("Enter at least one wss:// relay you intentionally choose.");
  if (new Set(urls.map((url) => url.toLowerCase())).size !== urls.length) throw new Error("Remove duplicate relays before saving.");
  return urls;
}

export function getNostrSigner(): NostrSigner | null {
  return typeof window !== "undefined" && window.nostr ? window.nostr : null;
}

export async function validateSignedEvent(event: NostrEvent, expected: { pubkey: string; content: string; createdAt: number; kind?: number; tags?: string[][] }): Promise<void> {
  if (!isNostrEvent(event)) throw new Error("The signer returned a malformed Nostr event envelope.");
  if (event.pubkey !== expected.pubkey.toLowerCase() || event.content !== expected.content || event.kind !== (expected.kind ?? 1)) {
    throw new Error("The signer changed the approved public key, content, or event kind; nothing was sent to a relay.");
  }
  if (event.created_at !== expected.createdAt || JSON.stringify(event.tags) !== JSON.stringify(expected.tags ?? [])) {
    throw new Error("The signer changed the approved event timestamp or tags; nothing was sent to a relay.");
  }
  const verification = await verifyNostrEvent(event);
  if (!verification.valid) throw new Error(`The signer returned an event that did not verify: ${verification.reason}`);
}

export async function connectNostrSigner(): Promise<string> {
  const signer = getNostrSigner();
  if (!signer) throw new Error("No NIP-07 signer was detected. Install and enable a signer you control, then use this action again.");
  const pubkey = await signer.getPublicKey();
  if (!/^[0-9a-f]{64}$/i.test(pubkey)) throw new Error("The signer returned an invalid public key.");
  return pubkey.toLowerCase();
}

export async function signNostrEvent(pubkey: string, unsigned: NostrUnsignedEvent): Promise<NostrEvent> {
  const signer = getNostrSigner();
  if (!signer) throw new Error("No NIP-07 signer is available.");
  const approved = { created_at: unsigned.created_at, kind: unsigned.kind, tags: unsigned.tags.map((tag) => [...tag]), content: unsigned.content };
  const event = await signer.signEvent(approved);
  await validateSignedEvent(event, { pubkey, content: unsigned.content, createdAt: unsigned.created_at, kind: unsigned.kind, tags: unsigned.tags });
  return event;
}

export async function signNostrDraft(pubkey: string, content: string, now = Date.now()): Promise<NostrEvent> {
  return signNostrEvent(pubkey, { created_at: Math.floor(now / 1000), kind: 1, tags: [], content });
}

export async function publishToRelay(relay: string, event: NostrEvent, timeoutMs = 12_000): Promise<RelayResult> {
  const url = new URL(relay);
  if (url.protocol !== "wss:" || !url.hostname || url.username || url.password || url.search || url.hash) return { relay, host: url.host, accepted: false, outcome: "ERROR", response: "Relay destination is outside the allowed wss:// contract.", notices: [] };
  const verification = await verifyNostrEvent(event);
  if (!verification.valid) return { relay: url.toString().replace(/\/$/, ""), host: url.host, accepted: false, outcome: "ERROR", response: `Event refused locally: ${verification.reason}`, notices: [] };
  return new Promise((resolve) => {
    let settled = false;
    let socket: WebSocket | undefined;
    const notices: string[] = [];
    const finish = (outcome: RelayOutcome, response: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket?.close(); } catch { /* Socket may already be closed. */ }
      resolve({ relay: url.toString().replace(/\/$/, ""), host: url.host, accepted: outcome === "ACCEPTED", outcome, response, notices: [...notices] });
    };
    const timer = setTimeout(() => finish("TIMEOUT", "No matching EVENT OK acknowledgement arrived before the timeout."), timeoutMs);
    try { socket = new WebSocket(url.toString()); }
    catch { finish("ERROR", "WebSocket connection could not be created."); return; }
    socket.addEventListener("open", () => {
      try { socket?.send(JSON.stringify(["EVENT", event])); }
      catch { finish("ERROR", "The event could not be sent over the WebSocket."); }
    }, { once: true });
    socket.addEventListener("message", (message) => {
      if (typeof message.data !== "string") return;
      if (message.data.length > 16_384) { if (notices.length < 5) notices.push("Relay response frame exceeded the 16 KiB display limit and was omitted."); return; }
      let parsed: unknown;
      try { parsed = JSON.parse(message.data) as unknown; } catch { return; }
      if (!Array.isArray(parsed)) return;
      if (parsed[0] === "NOTICE" && typeof parsed[1] === "string") {
        if (notices.length < 5) notices.push(parsed[1].slice(0, 240));
        return;
      }
      if (parsed[0] === "CLOSED") {
        const subscriptionId = typeof parsed[1] === "string" ? parsed[1].slice(0, 120) : "unknown";
        const responseText = typeof parsed[2] === "string" ? parsed[2].slice(0, 240) : "No relay message.";
        finish("CLOSED", `Relay CLOSED ${subscriptionId}: ${responseText}`);
        return;
      }
      if (parsed[0] !== "OK" || typeof parsed[2] !== "boolean") return;
      if (parsed[1] !== event.id) {
        if (notices.length < 5) notices.push("Relay returned an OK for a different event ID; it was ignored.");
        return;
      }
      const responseText = typeof parsed[3] === "string" ? parsed[3].slice(0, 240) : "No relay message.";
      finish(parsed[2] ? "ACCEPTED" : "REJECTED", responseText);
    });
    socket.addEventListener("error", () => finish("ERROR", "Relay WebSocket reported a connection error."), { once: true });
    socket.addEventListener("close", () => { if (!settled) finish("CLOSED", "Relay closed without a matching EVENT OK acknowledgement."); }, { once: true });
  });
}

export async function publishToRelays(relays: string[], event: NostrEvent): Promise<RelayResult[]> {
  const parsed = parseRelayUrls(relays.join("\n"));
  return Promise.all(parsed.map((relay) => publishToRelay(relay, event)));
}

export function queryNostrRelay(relay: string, filter: Record<string, unknown>, timeoutMs = 12_000): Promise<RelayQueryResult> {
  const url = new URL(relay);
  if (url.protocol !== "wss:" || !url.hostname || url.username || url.password || url.search || url.hash) return Promise.resolve({ relay, host: url.host, outcome: "ERROR", events: [], notices: [], error: "Relay destination is outside the allowed wss:// contract." });
  const requestId = `tt-${bytesToHex(crypto.getRandomValues(new Uint8Array(8)))}`;
  return new Promise((resolve) => {
    let settled = false;
    let opened = false;
    let socket: WebSocket | undefined;
    const events: unknown[] = [];
    const notices: string[] = [];
    const finish = (outcome: RelayQueryResult["outcome"], error?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket?.close(); } catch { /* Socket may already be closed. */ }
      resolve({ relay: url.toString().replace(/\/$/, ""), host: url.host, outcome, events, notices, ...(error ? { error } : {}) });
    };
    const timer = setTimeout(() => finish("TIMEOUT", opened ? "Relay did not send EOSE before the read timeout." : "Relay connection timed out."), timeoutMs);
    try { socket = new WebSocket(url.toString()); }
    catch { finish("ERROR", "WebSocket connection could not be created."); return; }
    socket.addEventListener("open", () => {
      opened = true;
      try { socket?.send(JSON.stringify(["REQ", requestId, filter])); }
      catch { finish("ERROR", "Read request could not be sent."); }
    }, { once: true });
    socket.addEventListener("message", (message) => {
      if (typeof message.data !== "string" || message.data.length > MAX_FRAME_BYTES) return;
      let parsed: unknown;
      try { parsed = JSON.parse(message.data) as unknown; } catch { notices.push("Relay sent a malformed JSON frame."); return; }
      if (!Array.isArray(parsed)) return;
      if (parsed[0] === "EVENT" && parsed[1] === requestId) {
        if (events.length < FEED_EVENT_LIMIT && parsed.length >= 3) events.push(parsed[2]);
      } else if (parsed[0] === "EOSE" && parsed[1] === requestId) finish("EOSE");
      else if (parsed[0] === "CLOSED" && parsed[1] === requestId) finish("CLOSED", typeof parsed[2] === "string" ? parsed[2].slice(0, 240) : "Relay closed the subscription.");
      else if (parsed[0] === "NOTICE" && typeof parsed[1] === "string" && notices.length < 5) notices.push(parsed[1].slice(0, 240));
    });
    socket.addEventListener("error", () => finish("ERROR", "Relay WebSocket reported a connection error."), { once: true });
    socket.addEventListener("close", () => { if (!settled) finish("CLOSED", "Relay closed before EOSE."); }, { once: true });
  });
}

export async function readNostrFeed(relays: string[], kinds: number[] = [1, 22, 1063, 40001, 40002]): Promise<FeedReadResult> {
  const urls = parseRelayUrls(relays.join("\n"));
  const allowedKinds = new Set(kinds);
  const relayResults = await Promise.all(urls.map((relay) => queryNostrRelay(relay, { kinds, limit: FEED_EVENT_LIMIT })));
  const byId = new Map<string, VerifiedEvent>();
  let malformedCount = 0;
  for (const result of relayResults) {
    for (const raw of result.events) {
      const verification = await verifyNostrEvent(raw);
      if (!verification.event) { malformedCount += 1; continue; }
      const event = verification.event;
      if (!allowedKinds.has(event.kind)) { malformedCount += 1; continue; }
      const current = byId.get(event.id);
      if (current) {
        if (verification.valid && !current.valid) byId.set(event.id, { event, valid: true, reason: verification.reason, relayHosts: [...new Set([...current.relayHosts, result.host])] });
        else if (!current.relayHosts.includes(result.host)) current.relayHosts.push(result.host);
      } else byId.set(event.id, { event, valid: verification.valid, reason: verification.reason, relayHosts: [result.host] });
    }
  }
  const entries = [...byId.values()].sort((left, right) => right.event.created_at - left.event.created_at || left.event.id.localeCompare(right.event.id));
  return { entries, relayResults, malformedCount, retrievedAt: new Date().toISOString() };
}

export async function fetchNostrParent(relays: string[], eventId: string, expectedAuthor: string): Promise<{ entries: VerifiedEvent[]; relayResults: RelayQueryResult[] }> {
  if (!/^[0-9a-f]{64}$/.test(eventId) || !/^[0-9a-f]{64}$/.test(expectedAuthor)) throw new Error("Parent event ID and author must be 64 lowercase hexadecimal characters.");
  const urls = parseRelayUrls(relays.join("\n"));
  const relayResults = await Promise.all(urls.map((relay) => queryNostrRelay(relay, { ids: [eventId], limit: 1 })));
  const entries = new Map<string, VerifiedEvent>();
  for (const result of relayResults) for (const raw of result.events) {
    const verification = await verifyNostrEvent(raw);
    if (!verification.event) continue;
    const event = verification.event;
    if (event.id !== eventId) continue;
    const current = entries.get(event.id);
    if (current) current.relayHosts.push(result.host);
    else entries.set(event.id, { event, valid: verification.valid, reason: verification.reason, relayHosts: [result.host] });
  }
  return { entries: [...entries.values()], relayResults };
}
