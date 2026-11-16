import { useMemo, useState } from "react";
import { Download, FileText, Fingerprint, ShieldAlert } from "lucide-react";
import { APPLICATION_DIRECTORY, CORE_DIRECTORY, SUPPLEMENTAL_REFERENCES, isAsciiHttpsUrl } from "../lib/ecosystem";
import { makeClaimPacket, canonicalClaimPacket, makeClaimReference, type ClaimReference } from "../lib/claimPacket";
import { createIpClaimEvent } from "../lib/claimEvents";
import { sha256HexText } from "../lib/hash";
import type { NostrUnsignedEvent } from "../lib/nostr";
import type { ReceiptKind } from "../lib/receipts";
import { Field, StatusPill } from "./ui";

type RecordFn = (kind: ReceiptKind, details: Record<string, unknown>) => Promise<boolean>;
const allSites = [...CORE_DIRECTORY, ...APPLICATION_DIRECTORY];

function downloadPacket(json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `truth-talk-claim-packet-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function referenceFromCustom(value: string): ClaimReference {
  const reference = value.trim();
  if (isAsciiHttpsUrl(reference)) return makeClaimReference(reference, "AUTHOR-DECLARED-HTTPS-REFERENCE");
  if (/^[0-9a-f]{64}$/.test(reference)) return makeClaimReference(reference, "SHA256-RECEIPT-HASH");
  if (/^(?:b[a-z2-7]{20,120}|Qm[1-9A-HJ-NP-Za-km-z]{44})$/.test(reference)) return makeClaimReference(reference, "CID-REFERENCE");
  throw new Error("Use an HTTPS URL with an ASCII hostname, a 64-character lowercase SHA-256 digest, or a CIDv0/v1 reference.");
}

export function ClaimComposer({ signerPubkey, record, notify, onPrepare }: { signerPubkey: string; record: RecordFn; notify: (message: string) => void; onPrepare: (event: NostrUnsignedEvent, label: string) => void }) {
  const [statement, setStatement] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customReference, setCustomReference] = useState("");
  const [includeCustom, setIncludeCustom] = useState(false);
  const [createdAt] = useState(() => new Date().toISOString());
  const [preparing, setPreparing] = useState(false);
  const chosenReferences = useMemo(() => {
    const selected = allSites.filter((entry) => selectedIds.includes(entry.id)).map((entry) => makeClaimReference(entry.url, `${entry.category} · ${entry.name}`));
    const supplemental = SUPPLEMENTAL_REFERENCES.filter((reference) => selectedIds.includes(reference.id)).map((reference) => makeClaimReference(reference.url, `SUPPLEMENTAL · ${reference.name}`));
    if (includeCustom && customReference.trim()) selected.push(referenceFromCustom(customReference));
    return [...selected, ...supplemental];
  }, [selectedIds, includeCustom, customReference]);

  const packet = useMemo(() => {
    if (!statement.trim()) return { json: "", digest: "", error: "Write an original claim statement to create a local packet." };
    try {
      const value = makeClaimPacket({ claimStatement: statement, ...(signerPubkey ? { authorPubkey: signerPubkey } : {}), references: chosenReferences, createdAt });
      const json = canonicalClaimPacket(value);
      return { json, digest: sha256HexText(json), error: "" };
    } catch (error) { return { json: "", digest: "", error: error instanceof Error ? error.message : "The claim packet could not be created." }; }
  }, [statement, signerPubkey, chosenReferences, createdAt]);

  const toggleReference = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const reviewClaim = async () => {
    if (!packet.digest || preparing) return;
    setPreparing(true);
    try {
      const saved = await record("CLAIM_PACKET_CREATED", { schema: "truth-talk-claim-packet/v0", contractVersion: "v0.0-draft", resolutionStatus: "UNRESOLVED", packetSha256: packet.digest, referenceCount: chosenReferences.length, outboundAction: "none" });
      if (!saved) { notify("The packet hash could not be recorded locally. The claim was not prepared for publication."); return; }
      onPrepare(createIpClaimEvent({ statement, references: chosenReferences, packetSha256: packet.digest }), "Self-declared IP claim");
      notify("The local claim packet hash is recorded. No file was uploaded and no relay has been contacted.");
    } catch (error) { notify(error instanceof Error ? error.message : "Claim packet preparation failed."); }
    finally { setPreparing(false); }
  };

  const customError = (() => {
    if (!includeCustom || !customReference.trim()) return "";
    try { referenceFromCustom(customReference); return ""; }
    catch (error) { return error instanceof Error ? error.message : "Reference format is not supported."; }
  })();

  return <div className="composerStack">
    <div className="notice warning"><ShieldAlert size={17} /><p><strong>Self-declared only.</strong> This is not a legal attestation, a finding of ownership, originality, infringement, liability, valuation, or payment owed. Listed node/app references are supplied by the owner and remain <b>UNRESOLVED</b>; TruthTalk does not fetch them.</p></div>
    <section className="panel"><div className="panelTop"><div><p className="eyebrow"><FileText size={14} /> AUTHOR DECLARATION · LOCAL FIRST</p><h2>Your claim, in your words</h2></div><StatusPill tone="warn">No legal determination</StatusPill></div>
      <Field label="Self-authored claim" hint="1–5,000 Unicode code points. State the claim you want to document; do not add credentials, private keys, or confidential material."><textarea maxLength={20_000} rows={6} value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="Describe what you claim, in your own words. TruthTalk does not determine who owns it." /></Field>
      <div className="referenceSelection"><div><p className="fieldLabel">OPTIONAL UNVERIFIED REFERENCES</p><p className="fine">Selecting a row creates a local unresolved reference. It sends no request to the destination.</p></div><div className="referenceChoiceList">{allSites.map((entry) => <label key={entry.id} className="referenceChoice"><input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => toggleReference(entry.id)} /><span><b>{entry.name}</b><small>{entry.role}</small><code>{entry.url}</code></span><StatusPill tone="warn">UNRESOLVED</StatusPill></label>)}</div></div>
      <div className="referenceChoiceList supplementalReferences">{SUPPLEMENTAL_REFERENCES.map((reference) => <label key={reference.id} className="referenceChoice"><input type="checkbox" checked={selectedIds.includes(reference.id)} onChange={() => toggleReference(reference.id)} /><span><b>{reference.name}</b><small>{reference.note}</small><code>{reference.url}</code></span><StatusPill tone="warn">UNRESOLVED</StatusPill></label>)}</div>
      <div className="customReference"><label className="consentCheck"><input type="checkbox" checked={includeCustom} onChange={(event) => setIncludeCustom(event.target.checked)} /><span>Include one reference I supply</span></label><Field label="User-authored HTTPS URL, SHA-256, or CID" hint="This is not fetched or verified. It is carried only as a string in the local packet."><input value={customReference} maxLength={2_048} disabled={!includeCustom} onChange={(event) => setCustomReference(event.target.value)} placeholder="https://… or a lowercase digest/CID" /></Field>{customError ? <p className="fine warningText">{customError}</p> : null}</div>
      <div className="claimPacketPreview"><div className="subsectionHeading"><div><p className="eyebrow"><Fingerprint size={14} /> JCS / RFC 8785</p><h3>Local reference packet</h3><p>The packet is canonicalized, versioned as a draft, and remains unresolved. It is not signed by the listed nodes.</p></div><StatusPill tone={packet.digest ? "good" : "neutral"}>{packet.digest ? "Packet prepared locally" : "Waiting for a claim"}</StatusPill></div>{packet.error ? <p className="fine">{packet.error}</p> : <><p className="packetHash"><span>PACKET SHA-256</span><code>{packet.digest}</code></p><pre className="exactPayload">{packet.json}</pre><div className="buttonRow"><button className="button secondary" type="button" onClick={() => downloadPacket(packet.json)}><Download size={14} /> Download packet JSON</button><button className="button primary" type="button" disabled={preparing || Boolean(customError)} onClick={() => void reviewClaim()}>{preparing ? "Recording locally…" : "Review self-claim for Nostr"}</button></div></>}</div>
      <p className="fine">The Nostr kind-1 claim will contain your exact statement and a signed `x` tag binding this packet hash. The packet remains a separate local file; TruthTalk does not upload or host it. A signature proves only that a key signed the event.</p>
    </section>
  </div>;
}
