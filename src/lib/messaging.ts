import { ed25519 } from "@noble/curves/ed25519.js";
import { sha256 } from "@noble/hashes/sha2.js";
import * as dagJson from "@ipld/dag-json";
import { CID } from "multiformats/cid";
import { sha256 as sha2_256 } from "multiformats/hashes/sha2";
import { canonicalizeJcs, codePointLength, isLowerHex, isPlainRecord } from "./jcs";

export const MESSAGE_CHANNEL = "truth-talk-local-messenger-v1";
export const MAX_MESSAGE_CODE_POINTS = 4_096;
export const MAX_ATTEMPTS = 20;
export const MAX_BACKOFF_MS = 600_000;
const utf8 = new TextEncoder();

export type MessageType = "message" | "ack";
export type MessageUnsigned = {
  schema: "truth-talk-local-message/v1";
  msg_id: string;
  sender_peer_id: string;
  sender_public_key: string;
  sender_tab_id: string;
  recipient_peer_id: string;
  recipient_tab_id?: string;
  body: string;
  created_at: number;
  prev_cid?: string;
  type: MessageType;
  in_reply_to?: string;
};
export type MessageEnvelope = MessageUnsigned & { sig: string; cid: string };
export type LocalIdentity = { publicKey: string; privateKey: string; createdAt: string };
export type EnvelopeVerification = { ok: true; envelope: MessageEnvelope } | { ok: false; reason: string };

export type RetryPatch = { state: "queued-retry" | "failed"; attempts: number; reason: string; next_retry_at?: number };

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(value: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/.test(value)) throw new Error("Expected lowercase even-length hexadecimal bytes.");
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

function digestJson(value: unknown): string {
  return bytesToHex(sha256(utf8.encode(canonicalizeJcs(value))));
}

function localPeerId(publicKey: string): string {
  return `ed25519:${digestJson({ publicKey }).slice(0, 48)}`;
}

function identityFromPrivateKey(privateKeyHex: string): { publicKey: string; privateKey: Uint8Array; peerId: string } {
  if (!isLowerHex(privateKeyHex, 64)) throw new Error("Local Ed25519 secret must be 32 bytes represented as lowercase hex.");
  const privateKey = hexToBytes(privateKeyHex);
  const publicKey = bytesToHex(ed25519.getPublicKey(privateKey));
  return { publicKey, privateKey, peerId: localPeerId(publicKey) };
}

export function generateLocalIdentity(): LocalIdentity {
  const secret = crypto.getRandomValues(new Uint8Array(32));
  const privateKey = bytesToHex(secret);
  const publicKey = bytesToHex(ed25519.getPublicKey(secret));
  return { publicKey, privateKey, createdAt: new Date().toISOString() };
}

export function validateLocalIdentity(value: unknown): value is LocalIdentity {
  if (!isPlainRecord(value) || !isLowerHex(value.publicKey, 64) || !isLowerHex(value.privateKey, 64) || typeof value.createdAt !== "string" || !Number.isFinite(Date.parse(value.createdAt))) return false;
  try { return identityFromPrivateKey(value.privateKey).publicKey === value.publicKey; }
  catch { return false; }
}

export async function valueToCid(value: unknown): Promise<string> {
  const canonical = canonicalizeJcs(value);
  const normalized = JSON.parse(canonical) as unknown;
  const digest = await sha2_256.digest(dagJson.encode(normalized));
  return CID.createV1(dagJson.code, digest).toString();
}

export function backoffMs(attempts: number): number {
  if (!Number.isInteger(attempts) || attempts < 1) throw new Error("Attempt number must be a positive integer.");
  return Math.min(30_000 * 2 ** Math.max(0, attempts - 1), MAX_BACKOFF_MS);
}

export function retryPatch(attempts: number, reason: string, at = Date.now()): RetryPatch {
  if (!Number.isInteger(attempts) || attempts < 1) throw new Error("Attempt number must be a positive integer.");
  if (attempts >= MAX_ATTEMPTS) return { state: "failed", attempts, reason, next_retry_at: undefined };
  return { state: "queued-retry", attempts, reason, next_retry_at: at + backoffMs(attempts) };
}

export async function createMessageEnvelope(input: {
  privateKey: string;
  senderTabId: string;
  recipientTabId?: string;
  body: string;
  type?: MessageType;
  inReplyTo?: string;
  previousCid?: string;
  createdAt?: number;
}): Promise<MessageEnvelope> {
  const body = input.body;
  if (codePointLength(body) > MAX_MESSAGE_CODE_POINTS) throw new Error(`Message exceeds the ${MAX_MESSAGE_CODE_POINTS.toLocaleString()} Unicode code-point limit.`);
  const identity = identityFromPrivateKey(input.privateKey);
  const type = input.type ?? "message";
  if (type === "ack" && body !== "") throw new Error("An acknowledgement envelope must not include a message body.");
  if (type === "ack" && !input.inReplyTo) throw new Error("An acknowledgement must refer to the message it acknowledges.");
  const createdAt = input.createdAt ?? Date.now();
  if (!Number.isSafeInteger(createdAt) || createdAt < 0) throw new Error("Message time must be a non-negative safe integer.");
  const base = {
    schema: "truth-talk-local-message/v1" as const,
    sender_peer_id: identity.peerId,
    sender_public_key: identity.publicKey,
    sender_tab_id: input.senderTabId,
    recipient_peer_id: "local-peer",
    ...(input.recipientTabId ? { recipient_tab_id: input.recipientTabId } : {}),
    body,
    created_at: createdAt,
    ...(input.previousCid ? { prev_cid: input.previousCid } : {}),
    type,
    ...(input.inReplyTo ? { in_reply_to: input.inReplyTo } : {}),
  };
  const msgId = digestJson(base);
  const unsigned: MessageUnsigned = { ...base, msg_id: msgId };
  const signature = bytesToHex(ed25519.sign(utf8.encode(canonicalizeJcs(unsigned)), identity.privateKey));
  const signed = { ...unsigned, sig: signature };
  const cid = await valueToCid(signed);
  return { ...signed, cid };
}

export async function verifyEnvelope(value: unknown, expectedPublicKey?: string): Promise<EnvelopeVerification> {
  if (!isPlainRecord(value)) return { ok: false, reason: "Envelope is not a JSON object." };
  const required = ["schema", "msg_id", "sender_peer_id", "sender_public_key", "sender_tab_id", "recipient_peer_id", "body", "created_at", "type", "sig", "cid"];
  const optional = ["recipient_tab_id", "prev_cid", "in_reply_to"];
  if (Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key)) || required.some((key) => !Object.hasOwn(value, key))) {
    return { ok: false, reason: "Envelope contains missing or unknown fields." };
  }
  const envelope = value as unknown as MessageEnvelope;
  if (envelope.schema !== "truth-talk-local-message/v1" || !isLowerHex(envelope.msg_id, 64) || !isLowerHex(envelope.sender_public_key, 64) || !isLowerHex(envelope.sig, 128)) return { ok: false, reason: "Envelope schema, identifier, public key, or signature is malformed." };
  if (envelope.recipient_peer_id !== "local-peer" || typeof envelope.sender_tab_id !== "string" || envelope.sender_tab_id.length < 8 || envelope.sender_tab_id.length > 80 || typeof envelope.body !== "string" || codePointLength(envelope.body) > MAX_MESSAGE_CODE_POINTS || !Number.isSafeInteger(envelope.created_at) || envelope.created_at < 0 || (envelope.type !== "message" && envelope.type !== "ack")) return { ok: false, reason: "Envelope fields are outside the local message contract." };
  if (envelope.type === "ack" && (envelope.body !== "" || typeof envelope.in_reply_to !== "string" || !isLowerHex(envelope.in_reply_to, 64))) return { ok: false, reason: "Acknowledgement must have an empty body and a valid reply identifier." };
  if (envelope.recipient_tab_id !== undefined && (typeof envelope.recipient_tab_id !== "string" || envelope.recipient_tab_id.length < 8 || envelope.recipient_tab_id.length > 80)) return { ok: false, reason: "Recipient tab identifier is invalid." };
  if (envelope.prev_cid !== undefined && (typeof envelope.prev_cid !== "string" || envelope.prev_cid.length > 160)) return { ok: false, reason: "Previous CID field is invalid." };
  if (expectedPublicKey && envelope.sender_public_key !== expectedPublicKey) return { ok: false, reason: "Envelope does not match the locally pinned browser key." };
  const expectedPeerId = localPeerId(envelope.sender_public_key);
  if (envelope.sender_peer_id !== expectedPeerId) return { ok: false, reason: "Sender peer identifier does not match the signed public key." };
  const { msg_id: _msgId, sig: _sig, cid: _cid, ...base } = envelope;
  if (digestJson(base) !== envelope.msg_id) return { ok: false, reason: "Message identifier does not match the unsigned payload." };
  const { sig, cid, ...unsigned } = envelope;
  let signatureValid = false;
  try { signatureValid = ed25519.verify(hexToBytes(sig), utf8.encode(canonicalizeJcs(unsigned)), hexToBytes(envelope.sender_public_key)); }
  catch { signatureValid = false; }
  if (!signatureValid) return { ok: false, reason: "Ed25519 signature is invalid." };
  let computedCid = "";
  try { computedCid = await valueToCid({ ...unsigned, sig }); }
  catch { return { ok: false, reason: "DAG-JSON CID could not be recomputed." }; }
  if (computedCid !== cid) return { ok: false, reason: "CIDv1 does not match the signed envelope bytes." };
  return { ok: true, envelope };
}

export async function createAcknowledgement(sent: MessageEnvelope, identity: LocalIdentity, receiverTabId: string, createdAt?: number): Promise<MessageEnvelope> {
  const verified = await verifyEnvelope(sent, identity.publicKey);
  if (!verified.ok || sent.type !== "message") throw new Error("Cannot acknowledge an invalid or non-message envelope.");
  return createMessageEnvelope({ privateKey: identity.privateKey, senderTabId: receiverTabId, recipientTabId: sent.sender_tab_id, body: "", type: "ack", inReplyTo: sent.msg_id, previousCid: sent.cid, createdAt });
}

export async function verifyAcknowledgement(ack: MessageEnvelope, sent: MessageEnvelope, expectedPublicKey: string): Promise<boolean> {
  if (ack.type !== "ack" || ack.in_reply_to !== sent.msg_id || ack.recipient_tab_id !== sent.sender_tab_id || ack.sender_tab_id === sent.sender_tab_id || ack.sender_public_key !== expectedPublicKey) return false;
  return (await verifyEnvelope(ack, expectedPublicKey)).ok;
}
