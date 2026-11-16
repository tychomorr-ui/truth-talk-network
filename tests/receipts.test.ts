import { describe, expect, it } from "vitest";
import { appendReceipt, createLedgerExport, getLedgerSnapshot, RECEIPT_STORAGE_KEY, verifyReceiptChain, type LedgerDocument } from "../src/lib/receipts";
import { sha256 } from "../src/lib/truthTalk";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

describe("browser-local receipt ledger", () => {
  it("creates a verifiable hash-linked chain with inspectable provenance", async () => {
    const storage = new MemoryStorage();
    await appendReceipt("REVIEW_CREATED", { profileSha256: "a".repeat(64), source: "browser-local engine" }, storage, new Date("2026-10-25T17:00:00.000Z"));
    await appendReceipt("SOURCE_LOOKUP_STARTED", { provider: "Grants.gov", endpoint: "https://api.grants.gov/v1/api/search2" }, storage, new Date("2026-10-25T17:01:00.000Z"));
    const snapshot = await getLedgerSnapshot(storage);
    expect(snapshot.check.ok).toBe(true);
    expect(snapshot.check.checked).toBe(2);
    expect(snapshot.ledger.receipts[0].previousHash).toBe(snapshot.ledger.anchorHash);
    expect(snapshot.ledger.receipts[1].previousHash).toBe(snapshot.ledger.receipts[0].hash);
    expect(snapshot.ledger.receipts[0].createdAt).toBe("2026-10-25T17:00:00.000Z");
  });

  it("detects altered content and removed tail receipts without replacing the damaged ledger", async () => {
    const storage = new MemoryStorage();
    await appendReceipt("DRAFT_APPROVED", { channel: "NOSTR", contentSha256: "b".repeat(64) }, storage);
    const parsed = JSON.parse(storage.getItem(RECEIPT_STORAGE_KEY)!) as LedgerDocument;
    parsed.receipts[0].details.channel = "REDDIT";
    storage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(parsed));
    expect((await getLedgerSnapshot(storage)).check.ok).toBe(false);
    const stillDamaged = JSON.parse(storage.getItem(RECEIPT_STORAGE_KEY)!) as LedgerDocument;
    expect(stillDamaged.receipts[0].details.channel).toBe("REDDIT");

    const tailStorage = new MemoryStorage();
    await appendReceipt("SOURCE_LOOKUP_STARTED", { provider: "Grants.gov" }, tailStorage);
    const tail = JSON.parse(tailStorage.getItem(RECEIPT_STORAGE_KEY)!) as LedgerDocument;
    tail.receipts = [];
    tailStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(tail));
    expect((await getLedgerSnapshot(tailStorage)).check.message).toContain("tail may be missing");
  });

  it("exports a self-hashed verified snapshot and appends a receipt binding that artifact", async () => {
    const storage = new MemoryStorage();
    await appendReceipt("BITCOIN_LOOKUP_COMPLETED", { provider: "Blockstream Esplora", found: true, responseSha256: "c".repeat(64) }, storage);
    const exported = await createLedgerExport(storage);
    const document = JSON.parse(exported.json) as Record<string, unknown> & { artifactHash: string; receipts: unknown[]; throughSequence: number };
    const { artifactHash, ...body } = document;
    expect(artifactHash).toBe(exported.artifactHash);
    expect(await sha256(body)).toBe(artifactHash);
    expect(document.throughSequence).toBe(1);
    expect(document.receipts).toHaveLength(1);
    const snapshot = await getLedgerSnapshot(storage);
    expect(snapshot.check.ok).toBe(true);
    expect(snapshot.ledger.receipts.at(-1)?.kind).toBe("EXPORT_CREATED");
    expect(snapshot.ledger.receipts.at(-1)?.details.artifactHash).toBe(artifactHash);
  });

  it("fails without overwriting history when browser persistence throws", async () => {
    const storage = new MemoryStorage();
    storage.setItem = () => { throw new DOMException("quota exceeded", "QuotaExceededError"); };
    await expect(appendReceipt("REVIEW_CREATED", { profileSha256: "d".repeat(64) }, storage)).rejects.toThrow("quota exceeded");
    expect(storage.getItem(RECEIPT_STORAGE_KEY)).toBe(null);
  });

  it("keeps local detail payloads JSON-serializable before hashing", async () => {
    const storage = new MemoryStorage();
    await appendReceipt("NOSTR_ACTION_ATTEMPTED", { networkSend: false, optionalValue: undefined }, storage);
    const snapshot = await getLedgerSnapshot(storage);
    expect(snapshot.check).toMatchObject({ ok: true, checked: 1 });
  });
});
