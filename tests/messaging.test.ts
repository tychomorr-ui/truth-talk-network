import { ed25519 } from "@noble/curves/ed25519.js";
import { describe, expect, it } from "vitest";
import { backoffMs, createAcknowledgement, createMessageEnvelope, MAX_ATTEMPTS, MAX_BACKOFF_MS, MAX_MESSAGE_CODE_POINTS, retryPatch, validateLocalIdentity, verifyAcknowledgement, verifyEnvelope, valueToCid } from "../src/lib/messaging";

const privateKey = `${"0".repeat(62)}01`;
const publicKey = Array.from(ed25519.getPublicKey(Uint8Array.from(privateKey.match(/.{2}/g) ?? [], (part) => Number.parseInt(part, 16))), (byte) => byte.toString(16).padStart(2, "0")).join("");
const identity = { publicKey, privateKey, createdAt: "2026-10-26T00:00:00.000Z" };

describe("same-browser signed messaging primitives", () => {
  it("creates and validates an Ed25519-signed envelope with a reproducible DAG-JSON CIDv1", async () => {
    const input = { privateKey, senderTabId: "tab-sender-0001", body: "A local test message.", createdAt: 1_800_000_000 };
    const envelope = await createMessageEnvelope(input);
    const checked = await verifyEnvelope(envelope, publicKey);
    expect(checked.ok).toBe(true);
    const { cid, ...signedPayload } = envelope;
    expect(cid).toBe(await valueToCid(signedPayload));
    expect(envelope.cid.startsWith("b")).toBe(true);
    const tampered = { ...envelope, body: "changed after signing" };
    expect((await verifyEnvelope(tampered, publicKey)).ok).toBe(false);
    expect((await verifyEnvelope({ ...envelope, cid: "bafkreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }, publicKey)).ok).toBe(false);
  });

  it("generates a same-key acknowledgement for a different local tab and checks the exact message ID", async () => {
    const sent = await createMessageEnvelope({ privateKey, senderTabId: "tab-sender-0001", body: "hello", createdAt: 1_800_000_000 });
    const acknowledgement = await createAcknowledgement(sent, identity, "tab-receiver-0002", 1_800_000_001);
    expect(acknowledgement.type).toBe("ack");
    expect(acknowledgement.body).toBe("");
    expect(await verifyAcknowledgement(acknowledgement, sent, publicKey)).toBe(true);
    expect(await verifyAcknowledgement(acknowledgement, { ...sent, msg_id: "11".repeat(32) }, publicKey)).toBe(false);
  });

  it("checks the stored Ed25519 key pair and enforces the exact Unicode message cap", async () => {
    expect(validateLocalIdentity(identity)).toBe(true);
    expect(validateLocalIdentity({ ...identity, publicKey: "ff".repeat(32) })).toBe(false);
    await expect(createMessageEnvelope({ privateKey, senderTabId: "tab-sender-0001", body: "😀".repeat(MAX_MESSAGE_CODE_POINTS + 1), createdAt: 1 })).rejects.toThrow("code-point limit");
  });

  it("uses 30-second exponential backoff with a ten-minute cap and stops at twenty attempts", () => {
    expect(backoffMs(1)).toBe(30_000);
    expect(backoffMs(2)).toBe(60_000);
    expect(backoffMs(3)).toBe(120_000);
    expect(backoffMs(20)).toBe(MAX_BACKOFF_MS);
    expect(retryPatch(1, "manual", 100).next_retry_at).toBe(30_100);
    expect(retryPatch(MAX_ATTEMPTS, "limit reached", 100)).toMatchObject({ state: "failed", attempts: MAX_ATTEMPTS });
  });
});
