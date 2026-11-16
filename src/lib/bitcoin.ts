export const BITCOIN_NETWORKS = ["mainnet", "testnet", "signet"] as const;
export type BitcoinNetwork = (typeof BITCOIN_NETWORKS)[number];
export type BitcoinStatus = {
  source: "Blockstream Esplora";
  network: BitcoinNetwork;
  transactionHash: string;
  found: boolean;
  confirmed: boolean | null;
  blockHeight: number | null;
  blockHash: string | null;
  blockTime: number | null;
  retrievedAt: string;
  apiUrl: string;
  sourceUrl: string;
};

const API_ROOT: Record<BitcoinNetwork, string> = {
  mainnet: "https://blockstream.info/api",
  testnet: "https://blockstream.info/testnet/api",
  signet: "https://blockstream.info/signet/api",
};
const WEB_ROOT: Record<BitcoinNetwork, string> = {
  mainnet: "https://blockstream.info",
  testnet: "https://blockstream.info/testnet",
  signet: "https://blockstream.info/signet",
};

export function validBitcoinTxid(value: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(value.trim());
}

export async function lookupBitcoinTransaction(
  txid: string,
  network: BitcoinNetwork,
  fetcher: typeof fetch = fetch,
): Promise<BitcoinStatus> {
  const normalized = txid.trim().toLowerCase();
  if (!validBitcoinTxid(normalized)) throw new Error("Enter a 64-character hexadecimal Bitcoin transaction ID.");
  if (!BITCOIN_NETWORKS.includes(network)) throw new Error("Choose a supported Bitcoin network.");
  const apiUrl = `${API_ROOT[network]}/tx/${normalized}/status`;
  let response: Response;
  try {
    response = await fetcher(apiUrl, { method: "GET", mode: "cors", cache: "no-store", signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new Error("Blockstream Esplora could not be reached. No cached chain state was substituted.");
  }
  const base = {
    source: "Blockstream Esplora" as const,
    network,
    transactionHash: normalized,
    retrievedAt: new Date().toISOString(),
    apiUrl,
    sourceUrl: `${WEB_ROOT[network]}/tx/${normalized}`,
  };
  if (response.status === 404) return { ...base, found: false, confirmed: null, blockHeight: null, blockHash: null, blockTime: null };
  if (!response.ok) throw new Error(`Blockstream Esplora returned HTTP ${response.status}; the chain state could not be verified.`);
  let data: unknown;
  try { data = await response.json(); } catch { throw new Error("Blockstream Esplora returned an invalid status response."); }
  if (!data || typeof data !== "object" || !("confirmed" in data)) throw new Error("Blockstream Esplora returned no recognizable confirmation status.");
  const status = data as { confirmed?: unknown; block_height?: unknown; block_hash?: unknown; block_time?: unknown };
  return {
    ...base,
    found: true,
    confirmed: typeof status.confirmed === "boolean" ? status.confirmed : null,
    blockHeight: Number.isSafeInteger(status.block_height) ? Number(status.block_height) : null,
    blockHash: typeof status.block_hash === "string" ? status.block_hash : null,
    blockTime: Number.isSafeInteger(status.block_time) ? Number(status.block_time) : null,
  };
}
