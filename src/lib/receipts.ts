import { canonicalJson, sha256 } from "./truthTalk";

export const RECEIPT_STORAGE_KEY = "truth-talk.receipts.v1";
export const RECEIPT_SCHEMA = "truth-talk-receipt-ledger/v1";
export const ZERO_HASH = "0".repeat(64);
const MAX_LEDGER_BYTES = 4_000_000;
const MAX_RECEIPTS = 5_000;

export type ReceiptKind =
  | "REVIEW_CREATED"
  | "ROOT_HANDOFF_ACCEPTED"
  | "SOURCE_LOOKUP_STARTED"
  | "SOURCE_LOOKUP_COMPLETED"
  | "SOURCE_LOOKUP_FAILED"
  | "DRAFTS_CREATED"
  | "DRAFT_APPROVED"
  | "CHAIN_WITNESS_CREATED"
  | "EXPORT_CREATED"
  | "NOSTR_ACTION_ATTEMPTED"
  | "NOSTR_ACTION_RESULT"
  | "FEED_LOOKUP_STARTED"
  | "FEED_LOOKUP_COMPLETED"
  | "FEED_LOOKUP_FAILED"
  | "MEDIA_HASH_CREATED"
  | "MEDIA_URL_VERIFIED"
  | "MEDIA_HASH_RESULT"
  | "CLAIM_PACKET_CREATED"
  | "LOCAL_MESSAGE_STATE"
  | "BITCOIN_LOOKUP_STARTED"
  | "BITCOIN_LOOKUP_COMPLETED"
  | "BITCOIN_LOOKUP_FAILED";

export type Receipt = {
  sequence: number;
  createdAt: string;
  kind: ReceiptKind;
  previousHash: string;
  details: Record<string, unknown>;
  hash: string;
};

export type LedgerDocument = {
  schema: typeof RECEIPT_SCHEMA;
  version: 1;
  anchorHash: string;
  headHash: string;
  receipts: Receipt[];
};

export type LedgerCheck = {
  ok: boolean;
  checked: number;
  headHash: string;
  message: string;
};

export type LedgerSnapshot = { ledger: LedgerDocument; check: LedgerCheck; bytes: number };

function emptyLedger(): LedgerDocument {
  return { schema: RECEIPT_SCHEMA, version: 1, anchorHash: ZERO_HASH, headHash: ZERO_HASH, receipts: [] };
}

function asLedger(value: unknown): LedgerDocument {
  if (!value || typeof value !== "object") throw new Error("The saved receipt ledger is not a valid object; it was not replaced.");
  const candidate = value as Partial<LedgerDocument>;
  if (candidate.schema !== RECEIPT_SCHEMA || candidate.version !== 1 || typeof candidate.anchorHash !== "string" || typeof candidate.headHash !== "string" || !Array.isArray(candidate.receipts)) {
    throw new Error("The saved receipt ledger schema is unsupported or damaged; it was not replaced.");
  }
  return candidate as LedgerDocument;
}

export async function verifyReceiptChain(ledger: LedgerDocument): Promise<LedgerCheck> {
  try {
    let previous = ledger.anchorHash;
    for (let index = 0; index < ledger.receipts.length; index += 1) {
      const receipt = ledger.receipts[index];
      const { hash, ...core } = receipt;
      if (receipt.sequence !== index + 1 || receipt.previousHash !== previous) {
        return { ok: false, checked: index, headHash: ledger.headHash, message: `Chain break at receipt ${index + 1}.` };
      }
      if (await sha256(core) !== hash) {
        return { ok: false, checked: index, headHash: ledger.headHash, message: `Receipt ${index + 1} hash does not match its content.` };
      }
      previous = hash;
    }
    if (previous !== ledger.headHash) return { ok: false, checked: ledger.receipts.length, headHash: ledger.headHash, message: "Stored head does not match the last receipt; a tail may be missing or altered." };
    return { ok: true, checked: ledger.receipts.length, headHash: ledger.headHash, message: "Every retained receipt links and hashes consistently. This local check is not a signature or remote trust anchor." };
  } catch {
    return { ok: false, checked: 0, headHash: ledger.headHash, message: "The receipt chain could not be verified in this browser." };
  }
}

function readLedger(storage: Storage): LedgerDocument {
  const raw = storage.getItem(RECEIPT_STORAGE_KEY);
  if (!raw) return emptyLedger();
  try { return asLedger(JSON.parse(raw)); }
  catch (error) { throw error instanceof Error ? error : new Error("The saved receipt ledger could not be read."); }
}

export async function getLedgerSnapshot(storage: Storage = window.localStorage): Promise<LedgerSnapshot> {
  const ledger = readLedger(storage);
  const raw = storage.getItem(RECEIPT_STORAGE_KEY) ?? "";
  const check = await verifyReceiptChain(ledger);
  return { ledger, check, bytes: new TextEncoder().encode(raw).byteLength };
}

export async function appendReceipt(
  kind: ReceiptKind,
  details: Record<string, unknown>,
  storage: Storage = window.localStorage,
  now = new Date(),
): Promise<Receipt> {
  const current = readLedger(storage);
  const prior = await verifyReceiptChain(current);
  if (!prior.ok) throw new Error(`Receipt ledger integrity failed: ${prior.message}`);
  if (current.receipts.length >= MAX_RECEIPTS && kind !== "EXPORT_CREATED") throw new Error("The local receipt ledger reached its 5,000-entry limit. Export and archive it before continuing audited actions.");
  const safeDetails = JSON.parse(JSON.stringify(details)) as Record<string, unknown>;
  const timestamp = now.toISOString();
  const core = {
    sequence: current.receipts.length + 1,
    createdAt: timestamp,
    kind,
    previousHash: current.headHash,
    details: safeDetails,
  };
  const receipt: Receipt = { ...core, hash: await sha256(core) };
  const next: LedgerDocument = { ...current, headHash: receipt.hash, receipts: [...current.receipts, receipt] };
  const serialized = JSON.stringify(next);
  const nextSize = new TextEncoder().encode(serialized).byteLength;
  const allowedSize = kind === "EXPORT_CREATED" ? MAX_LEDGER_BYTES : MAX_LEDGER_BYTES - 64_000;
  if (nextSize > allowedSize) throw new Error("The browser-local receipt ledger is near its storage limit. Export it before continuing audited actions.");
  storage.setItem(RECEIPT_STORAGE_KEY, serialized);
  if (storage.getItem(RECEIPT_STORAGE_KEY) !== serialized) throw new Error("The browser did not persist the receipt; the gated action was not performed.");
  return receipt;
}

export async function createLedgerExport(storage: Storage = window.localStorage): Promise<{ fileName: string; artifactHash: string; json: string; throughSequence: number }> {
  const snapshot = await getLedgerSnapshot(storage);
  if (!snapshot.check.ok) throw new Error(`Cannot export an unverified ledger: ${snapshot.check.message}`);
  const body = {
    schema: "truth-talk-ledger-export/v1",
    exportedAt: new Date().toISOString(),
    note: "Browser-local hash-linked receipts; not digitally signed, remotely anchored, immutable, or a VALKYRIE export/import contract.",
    anchorHash: snapshot.ledger.anchorHash,
    throughSequence: snapshot.ledger.receipts.length,
    headHash: snapshot.ledger.headHash,
    receipts: snapshot.ledger.receipts,
  };
  const artifactHash = await sha256(body);
  const exported = JSON.stringify({ ...body, artifactHash }, null, 2);
  await appendReceipt("EXPORT_CREATED", { artifactHash, throughSequence: snapshot.ledger.receipts.length, priorHeadHash: snapshot.ledger.headHash }, storage);
  return { fileName: `truthtalk-ledger-${new Date().toISOString().slice(0, 10)}.json`, artifactHash, json: exported, throughSequence: snapshot.ledger.receipts.length };
}
