import { describe, expect, it } from "vitest";
import { lookupBitcoinTransaction, validBitcoinTxid } from "../src/lib/bitcoin";

const genesisTxid = "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b";

describe("Blockstream Esplora read-only adapter", () => {
  it("accepts only 64-character hexadecimal Bitcoin transaction IDs", () => {
    expect(validBitcoinTxid(genesisTxid)).toBe(true);
    expect(validBitcoinTxid(` ${genesisTxid.toUpperCase()} `)).toBe(true);
    expect(validBitcoinTxid("abc123")).toBe(false);
    expect(validBitcoinTxid("g".repeat(64))).toBe(false);
  });

  it("returns the exact provider confirmation/block fields and source URLs", async () => {
    let requestUrl = "";
    const fetcher: typeof fetch = async (input) => {
      requestUrl = String(input);
      return new Response(JSON.stringify({ confirmed: true, block_height: 0, block_hash: "0".repeat(64), block_time: 1231006505 }), { status: 200 });
    };
    const result = await lookupBitcoinTransaction(genesisTxid, "mainnet", fetcher);
    expect(requestUrl).toBe(`https://blockstream.info/api/tx/${genesisTxid}/status`);
    expect(result).toMatchObject({ found: true, confirmed: true, blockHeight: 0, blockHash: "0".repeat(64), blockTime: 1231006505 });
    expect(result.sourceUrl).toBe(`https://blockstream.info/tx/${genesisTxid}`);
    expect(result.retrievedAt).toMatch(/^\d{4}-\d\d-\d\dT/);
  });

  it("reports a provider 404 as not found or not indexed, not proof of nonexistence", async () => {
    const fetcher: typeof fetch = async () => new Response("", { status: 404 });
    const result = await lookupBitcoinTransaction(genesisTxid, "signet", fetcher);
    expect(result.found).toBe(false);
    expect(result.confirmed).toBe(null);
    expect(result.network).toBe("signet");
    expect(result.apiUrl).toContain("/signet/api/");
  });

  it("fails closed on invalid identifiers and provider/network failures instead of using cached state", async () => {
    let called = false;
    const fetcher: typeof fetch = async () => { called = true; return new Response("{}", { status: 200 }); };
    await expect(lookupBitcoinTransaction("bad-id", "mainnet", fetcher)).rejects.toThrow("64-character");
    expect(called).toBe(false);
    const failingFetch: typeof fetch = async () => { throw new Error("offline"); };
    await expect(lookupBitcoinTransaction(genesisTxid, "mainnet", failingFetch)).rejects.toThrow("could not be reached");
  });
});
