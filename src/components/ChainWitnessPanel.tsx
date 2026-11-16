import { useState, type ReactNode } from "react";
import { Copy, ExternalLink, Fingerprint, LoaderCircle, Radio, ShieldCheck } from "lucide-react";
import { BITCOIN_NETWORKS, lookupBitcoinTransaction, validBitcoinTxid, type BitcoinNetwork, type BitcoinStatus } from "../lib/bitcoin";
import { sha256, witness } from "../lib/truthTalk";
import type { ReceiptKind } from "../lib/receipts";
import { EmptyState, Field, SectionHeader, StatusPill } from "./ui";

type RecordFn = (kind: ReceiptKind, details: Record<string, unknown>) => Promise<boolean>;
type OfflineReceipt = Awaited<ReturnType<typeof witness>>;

export function ChainWitnessPanel({ record, notify }: { record: RecordFn; notify: (message: string) => void }) {
  const [mode, setMode] = useState<"offline" | "bitcoin">("offline");
  const [chain, setChain] = useState("BITCOIN");
  const [offlineNetwork, setOfflineNetwork] = useState("mainnet");
  const [bitcoinNetwork, setBitcoinNetwork] = useState<BitcoinNetwork>("mainnet");
  const [txid, setTxid] = useState("");
  const [declaration, setDeclaration] = useState("");
  const [payload, setPayload] = useState("");
  const [offlineReceipt, setOfflineReceipt] = useState<OfflineReceipt | null>(null);
  const [liveStatus, setLiveStatus] = useState<BitcoinStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const makeOffline = async () => {
    if (busy || !txid.trim() || payload.trim().length < 2 || declaration.trim().length < 8) return;
    setBusy(true);
    setError("");
    setOfflineReceipt(null);
    try {
      const receipt = await witness({ chain, network: offlineNetwork, transactionHash: txid, declaration, payload });
      const saved = await record("CHAIN_WITNESS_CREATED", {
        mode: "offline-artifact",
        chain,
        network: offlineNetwork,
        transactionIdSha256: await sha256(txid.trim()),
        declarationSha256: await sha256(declaration.trim()),
        artifactSha256: receipt.sourcePayloadHash,
        witnessSha256: receipt.receiptHash,
        result: receipt.status,
      });
      setOfflineReceipt(receipt);
      notify(saved ? "Offline witness receipt created. Artifact text was not saved to the receipt ledger." : "Witness created locally, but its audit-ledger receipt could not be saved.");
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : "The local artifact could not be processed.");
    } finally {
      setBusy(false);
    }
  };

  const lookupLive = async () => {
    if (busy || !validBitcoinTxid(txid)) return;
    setBusy(true);
    setError("");
    setLiveStatus(null);
    const normalized = txid.trim().toLowerCase();
    const intentSaved = await record("BITCOIN_LOOKUP_STARTED", {
      provider: "Blockstream Esplora",
      network: bitcoinNetwork,
      transactionIdSha256: await sha256(normalized),
      apiUrl: bitcoinApiUrl(bitcoinNetwork),
      initiatedBy: "operator-click",
      operation: "read-only transaction status",
    });
    if (!intentSaved) {
      setBusy(false);
      setError("No provider request was sent because the lookup intent could not be recorded locally.");
      return;
    }
    try {
      const status = await lookupBitcoinTransaction(normalized, bitcoinNetwork);
      setLiveStatus(status);
      const saved = await record("BITCOIN_LOOKUP_COMPLETED", {
        provider: status.source,
        network: status.network,
        sourceUrl: status.sourceUrl,
        apiUrl: status.apiUrl,
        transactionIdSha256: await sha256(normalized),
        retrievedAt: status.retrievedAt,
        responseSha256: await sha256(status),
        found: status.found,
        confirmed: status.confirmed,
        blockHeight: status.blockHeight,
        outcome: status.found ? "status-returned" : "not-found-or-not-indexed",
      });
      if (!saved) setError("Live status arrived, but its completion receipt could not be saved. The initial lookup receipt remains in the ledger.");
    } catch (errorValue) {
      const message = errorValue instanceof Error ? errorValue.message : "The provider request failed.";
      setError(message);
      await record("BITCOIN_LOOKUP_FAILED", {
        provider: "Blockstream Esplora",
        network: bitcoinNetwork,
        transactionIdSha256: await sha256(normalized),
        status: "provider-or-network-error",
      });
    } finally {
      setBusy(false);
    }
  };

  const copyReceipt = async (value: unknown) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
      notify("Receipt JSON copied locally. Nothing was sent.");
    } catch {
      notify("Clipboard access is unavailable.");
    }
  };

  return (
    <div className="module">
      <SectionHeader
        number="05"
        eyebrow="LOCAL ARTIFACT OR EXPLICIT LIVE READ"
        title="Chain Witness"
        description="Two different operations, two different trust boundaries: inspect an operator-provided artifact locally, or request a current Bitcoin transaction status from a public read-only explorer."
        action={<StatusPill tone={mode === "offline" ? "neutral" : "live"}>{mode === "offline" ? "Offline mode" : "Live read-only"}</StatusPill>}
      />

      <div className="lensSwitch modeSwitch" role="group" aria-label="Chain Witness mode">
        <button type="button" aria-pressed={mode === "offline"} className={mode === "offline" ? "selected" : ""} onClick={() => { setMode("offline"); setError(""); }}>01 / Offline artifact</button>
        <button type="button" aria-pressed={mode === "bitcoin"} className={mode === "bitcoin" ? "selected" : ""} onClick={() => { setMode("bitcoin"); setError(""); }}>02 / Bitcoin status lookup</button>
      </div>

      {mode === "offline" ? (
        <section className="panel">
          <div className="panelTop"><div><p className="eyebrow">NO RPC · NO EXPLORER REQUEST</p><h2>Hash a local artifact</h2></div><StatusPill>Browser-only</StatusPill></div>
          <div className="notice"><ShieldCheck size={18} /><p>The artifact is processed in memory and represented in receipts by its SHA-256 digest and recognized structured fields. Raw artifact contents are not stored in the receipt ledger.</p></div>
          <div className="fieldGrid">
            <Field label="Chain"><select value={chain} onChange={(event) => setChain(event.target.value)}><option value="BITCOIN">Bitcoin</option><option value="ETHEREUM">Ethereum</option><option value="OTHER">Other</option></select></Field>
            <Field label="Network label" hint="Operator-declared; no network is contacted in offline mode."><input maxLength={120} value={offlineNetwork} onChange={(event) => setOfflineNetwork(event.target.value)} /></Field>
            <Field label="Transaction identifier"><input maxLength={160} value={txid} onChange={(event) => setTxid(event.target.value)} autoComplete="off" /></Field>
            <Field label="Artifact declaration"><input maxLength={500} value={declaration} onChange={(event) => setDeclaration(event.target.value)} placeholder="Where did this artifact come from?" /></Field>
            <Field label="Authorized raw artifact or JSON" className="wide" hint="Not persisted. Do not paste material you are not authorized to process in this browser."><textarea rows={9} maxLength={500_000} value={payload} onChange={(event) => setPayload(event.target.value)} /></Field>
          </div>
          <div className="buttonRow actionSpacing">
            <button className="button primary" type="button" disabled={busy || !txid.trim() || payload.trim().length < 2 || declaration.trim().length < 8} onClick={() => void makeOffline()}>{busy ? <LoaderCircle className="spin" size={16} /> : <Fingerprint size={16} />} Create offline receipt</button>
            <span className="fine">No chain state, confirmation, ownership, or finality is queried.</span>
          </div>
          {offlineReceipt ? (
            <ReceiptResult
              title="Offline artifact digest"
              status={offlineReceipt.status}
              hash={offlineReceipt.receiptHash}
              content={<>
                <p><b>Created</b>{offlineReceipt.createdAt}</p>
                <p><b>Source</b>{offlineReceipt.source}</p>
                <p><b>Artifact SHA-256</b><code>{offlineReceipt.sourcePayloadHash}</code></p>
                <p><b>Exact transaction ID observed in a recognized field</b>{offlineReceipt.transactionHashObservedInPayload ? "Yes" : "No"}</p>
                <p><b>Recognized fields</b>{offlineReceipt.structuredFieldsObserved.join(", ") || "None"}</p>
                <p className="fine">{offlineReceipt.boundary}. The artifact body was not retained.</p>
              </>}
              onCopy={() => void copyReceipt(offlineReceipt)}
            />
          ) : null}
        </section>
      ) : (
        <section className="panel">
          <div className="panelTop"><div><p className="eyebrow">BITCOIN · READ-ONLY PROVIDER REQUEST</p><h2>Look up transaction status</h2></div><StatusPill tone="live"><span className="liveDot" /> ON DEMAND</StatusPill></div>
          <div className="notice warning"><Radio size={18} /><p>After you click Lookup, the Bitcoin transaction identifier and selected network are sent to Blockstream Esplora. No wallet, address, balance, or private key is queried.</p></div>
          <div className="fieldGrid">
            <Field label="Bitcoin network"><select value={bitcoinNetwork} onChange={(event) => setBitcoinNetwork(event.target.value as BitcoinNetwork)}>{BITCOIN_NETWORKS.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
            <Field label="Transaction ID"><input maxLength={64} value={txid} onChange={(event) => setTxid(event.target.value)} placeholder="64 hexadecimal characters" autoComplete="off" /></Field>
          </div>
          <p className="fine requestLine">Endpoint: <code>{bitcoinApiUrl(bitcoinNetwork)}</code> · No request is made until you click Lookup.</p>
          <div className="buttonRow"><button className="button primary" type="button" disabled={busy || !validBitcoinTxid(txid)} onClick={() => void lookupLive()}>{busy ? <LoaderCircle className="spin" size={16} /> : <ExternalLink size={16} />} Lookup live status</button></div>
          {liveStatus ? <LiveResult status={liveStatus} onCopy={() => void copyReceipt(liveStatus)} /> : null}
        </section>
      )}

      {error ? <div className="notice errorNotice" role="alert"><strong>Lookup status</strong><p>{error}</p></div> : null}
      {((mode === "offline" && !offlineReceipt) || (mode === "bitcoin" && !liveStatus)) && !error ? <EmptyState index="SHA-256" title="No witness receipt yet" description="Choose an explicit mode above. No blockchain request is made when the page opens or when you switch modes." /> : null}
    </div>
  );
}

function ReceiptResult({ title, status, hash, content, onCopy }: { title: string; status: string; hash: string; content: ReactNode; onCopy: () => void }) {
  return (
    <div className="witnessReceipt">
      <div className="resultsHeader"><div><p className="eyebrow">LOCAL RECEIPT</p><h3>{title}</h3></div><StatusPill tone={status === "LOCAL_IDENTIFIER_MATCH" ? "neutral" : "warn"}>{status.replaceAll("_", " ")}</StatusPill></div>
      {content}
      <p><b>Receipt SHA-256</b><code>{hash}</code></p>
      <button className="button secondary" type="button" onClick={onCopy}><Copy size={14} /> Copy receipt JSON</button>
    </div>
  );
}

function LiveResult({ status, onCopy }: { status: BitcoinStatus; onCopy: () => void }) {
  const tone = !status.found ? "bad" : status.confirmed ? "good" : "warn";
  const label = !status.found ? "Not found / not indexed" : status.confirmed ? "Provider reports confirmed" : "Provider reports unconfirmed";
  const statusLabel = !status.found ? "NO RECORD" : status.confirmed ? "CONFIRMED" : "UNCONFIRMED";
  return (
    <div className="liveResult">
      <div className="resultsHeader"><div><p className="eyebrow">OBSERVED {new Date(status.retrievedAt).toLocaleString()}</p><h3>{label}</h3></div><StatusPill tone={tone}>{statusLabel}</StatusPill></div>
      <div className="detailGrid">
        <Detail label="Network" value={status.network} />
        <Detail label="Block height" value={status.blockHeight?.toString() ?? "Not supplied"} />
        <Detail label="Block hash" value={status.blockHash ?? "Not supplied"} />
        <Detail label="Block time (Unix seconds)" value={status.blockTime?.toString() ?? "Not supplied"} />
      </div>
      <div className="buttonRow"><a className="textLink" href={status.sourceUrl} target="_blank" rel="noreferrer noopener">Open provider explorer <ExternalLink size={14} /></a><button className="button secondary" type="button" onClick={onCopy}>Copy observed receipt JSON <Copy size={14} /></button></div>
      <p className="fine">One provider observation at the recorded time. It does not establish finality, ownership, intent, value, or legal effect. “Not found” may also mean the provider has not indexed the transaction.</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><p>{value}</p></div>;
}

function bitcoinApiUrl(network: BitcoinNetwork): string {
  const root: Record<BitcoinNetwork, string> = {
    mainnet: "https://blockstream.info/api",
    testnet: "https://blockstream.info/testnet/api",
    signet: "https://blockstream.info/signet/api",
  };
  return `${root[network]}/tx/<txid>/status`;
}
