import { useState } from "react";
import { Check, Download, FileCheck2, LoaderCircle, RotateCcw } from "lucide-react";
import { createLedgerExport, type LedgerSnapshot } from "../lib/receipts";
import { EmptyState, SectionHeader, StatusPill } from "./ui";

export function ReceiptLedgerPanel({ snapshot, error, onRefresh, notify }: { snapshot: LedgerSnapshot | null; error: string; onRefresh: () => Promise<void>; notify: (message: string) => void }) {
  const [working, setWorking] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const verify = async () => {
    setWorking(true);
    try { await onRefresh(); notify("Ledger verification completed. Read the current integrity result below."); }
    finally { setWorking(false); }
  };
  const exportLedger = async () => {
    setWorking(true);
    try {
      const exported = await createLedgerExport();
      const blob = new Blob([exported.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = exported.fileName; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      await onRefresh();
      notify(`Exported ${exported.throughSequence} receipts through the recorded head. Export hash ${exported.artifactHash.slice(0, 12)}…`);
    } catch (errorValue) { notify(errorValue instanceof Error ? errorValue.message : "Ledger export failed."); }
    finally { setWorking(false); }
  };

  return <div className="module">
    <SectionHeader number="06" eyebrow="BROWSER-LOCAL · SHA-256 HASH CHAIN" title="Receipt ledger" description="Inspect, verify, and export the record of material local reviews, provider lookups, approvals, and external-action attempts." action={<StatusPill tone={snapshot?.check.ok ? "good" : error ? "bad" : "neutral"}>{snapshot?.check.ok ? "Chain self-consistent" : error ? "Integrity unavailable" : "Checking local store"}</StatusPill>} />
    <div className="notice warning"><FileCheck2 size={18} /><p><strong>Useful integrity, limited trust.</strong> The browser hashes each receipt with its predecessor and checks the stored head. It is not digitally signed, remotely anchored, immutable, or a legal attestation. A person who can alter this browser’s storage can also rewrite the local ledger.</p></div>
    {error ? <div className="notice errorNotice" role="alert"><strong>Ledger read failed</strong><p>{error}</p><p>The app will not silently replace the damaged record or claim a clean chain.</p></div> : null}
    {snapshot ? <><div className="ledgerSummary"><div><span>Receipts retained</span><strong>{snapshot.ledger.receipts.length.toLocaleString()}</strong></div><div><span>Head hash</span><code>{snapshot.ledger.headHash}</code></div><div><span>Storage size</span><strong>{snapshot.bytes.toLocaleString()} bytes</strong></div></div>
      <div className={`integrityBanner ${snapshot.check.ok ? "good" : "bad"}`}><div className="integrityIcon">{snapshot.check.ok ? <Check size={18} /> : <FileCheck2 size={18} />}</div><div><strong>{snapshot.check.ok ? "Retained chain verifies" : "Chain integrity could not be confirmed"}</strong><p>{snapshot.check.message} Checked {snapshot.check.checked} receipt{snapshot.check.checked === 1 ? "" : "s"}.</p></div></div>
      <div className="buttonRow"><button className="button secondary" type="button" disabled={working} onClick={() => void verify()}>{working ? <LoaderCircle className="spin" size={15} /> : <RotateCcw size={15} />} Verify now</button><button className="button primary" type="button" disabled={working || !snapshot.check.ok} onClick={() => void exportLedger()}>{working ? <LoaderCircle className="spin" size={15} /> : <Download size={15} />} Export JSON ledger</button></div>
      <p className="fine">An export includes the verified ledger head at its export start, then the live ledger appends an `EXPORT_CREATED` receipt binding the file hash. The export is not a signed VALKYRIE contract.</p>
      {!snapshot.ledger.receipts.length ? <EmptyState index="00" title="No receipt events yet" description="Receipts appear only after you run a review, search a source, approve a draft, create a witness, export, or attempt an external action." /> : <div className="receiptList">{[...snapshot.ledger.receipts].reverse().slice(0, 50).map((receipt) => <article className="receiptRow" key={receipt.sequence}><div className="receiptIdentity"><span className="receiptSequence">{String(receipt.sequence).padStart(4, "0")}</span><div><strong>{receipt.kind.replaceAll("_", " ")}</strong><time dateTime={receipt.createdAt}>{new Date(receipt.createdAt).toLocaleString()}</time></div></div><StatusPill tone="good">LINKED</StatusPill><button className="linkButton" type="button" aria-expanded={expanded === receipt.sequence} onClick={() => setExpanded((current) => current === receipt.sequence ? null : receipt.sequence)}>{expanded === receipt.sequence ? "Hide" : "Inspect"}</button>{expanded === receipt.sequence ? <div className="receiptDetails"><p><b>Previous</b> <code>{receipt.previousHash}</code></p><p><b>Receipt</b> <code>{receipt.hash}</code></p><pre>{JSON.stringify(receipt.details, null, 2)}</pre></div> : null}</article>)}</div>}
      {snapshot.ledger.receipts.length > 50 ? <p className="fine">Showing the most recent 50 of {snapshot.ledger.receipts.length} retained receipts. The export contains the full verified ledger.</p> : null}
    </> : !error ? <div className="loadingState"><LoaderCircle className="spin" size={20} /><p>Reading the browser-local ledger…</p></div> : null}
  </div>;
}
