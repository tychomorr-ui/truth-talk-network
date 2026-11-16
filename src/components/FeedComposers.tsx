import { useState } from "react";
import { GitBranch, MessageSquareText, ShieldAlert } from "lucide-react";
import { createBranchEvent, createEndorsementEvent, type BranchType, type EvidenceRefType, type EndorsementPayload } from "../lib/feedProtocol";
import type { NostrEvent, NostrUnsignedEvent } from "../lib/nostr";
import { Field, StatusPill } from "./ui";

const branchKinds: BranchType[] = ["DERIVES_FROM", "DISPUTES", "EXTENDS", "LICENSES"];
const evidenceKinds: EvidenceRefType[] = ["URL", "MANIFEST_CID", "RECEIPT_HASH", "SUBSTRATE_CID", "CLAIM_PACKET_ID"];
const relationships: EndorsementPayload["relationship"][] = ["READ_USEFUL", "DISSENT", "AMPLIFY", "CITE"];

function parseEvidenceLines(value: string): Array<{ type: EvidenceRefType; value: string; resolution: "UNRESOLVED" }> {
  return value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf("|");
    if (separator < 1) throw new Error("Enter each evidence reference as TYPE|value; references are never fetched automatically.");
    const type = line.slice(0, separator).trim() as EvidenceRefType;
    const referenceValue = line.slice(separator + 1).trim();
    if (!evidenceKinds.includes(type) || !referenceValue) throw new Error("Evidence type must be URL, MANIFEST_CID, RECEIPT_HASH, SUBSTRATE_CID, or CLAIM_PACKET_ID, followed by a value.");
    return { type, value: referenceValue, resolution: "UNRESOLVED" as const };
  });
}

export function BranchComposer({ selectedParent, onPrepare }: { selectedParent: NostrEvent | null; onPrepare: (event: NostrUnsignedEvent, label: string) => void }) {
  const [parentId, setParentId] = useState(selectedParent?.id ?? "");
  const [parentAuthor, setParentAuthor] = useState(selectedParent?.pubkey ?? "");
  const [branchType, setBranchType] = useState<BranchType>("EXTENDS");
  const [statement, setStatement] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [error, setError] = useState("");

  const prepare = () => {
    setError("");
    try {
      const event = createBranchEvent({ kind: "BRANCH", parentEventId: parentId.trim(), parentAuthorPubkey: parentAuthor.trim(), branchType, claimStatement: statement, evidenceRefs: parseEvidenceLines(evidenceText) });
      onPrepare(event, "TruthTalk signed branch · kind 40001");
    } catch (errorValue) { setError(errorValue instanceof Error ? errorValue.message : "Branch payload is invalid."); }
  };

  return <div className="composerStack">
    <div className="notice warning"><GitBranch size={17} /><p><strong>Vendor-specific event kind 40001.</strong> It is not a universally supported Nostr standard. The branch event is independently signed; its parent may remain unresolved or have an invalid signature without changing the child event’s own verification result.</p></div>
    <section className="panel"><div className="panelTop"><div><p className="eyebrow">RFC 8785 · STRICT SCHEMA</p><h2>Branch from an idea or evidence record</h2></div><StatusPill tone="warn">Parent unresolved by default</StatusPill></div>
      <div className="fieldGrid"><Field label="Parent event ID · lowercase hex"><input maxLength={64} value={parentId} onChange={(event) => setParentId(event.target.value)} /></Field><Field label="Expected parent author key · lowercase hex"><input maxLength={64} value={parentAuthor} onChange={(event) => setParentAuthor(event.target.value)} /></Field></div>
      <Field label="Branch relationship"><select value={branchType} onChange={(event) => setBranchType(event.target.value as BranchType)}>{branchKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></Field>
      <Field label="New self-authored claim" hint="1–5,000 Unicode code points. A child event does not make its parent true."><textarea maxLength={10_000} rows={5} value={statement} onChange={(event) => setStatement(event.target.value)} /></Field>
      <Field label="Ordered evidence references · optional" hint="One per line: URL|<your HTTPS reference> or RECEIPT_HASH|… or SUBSTRATE_CID|… or CLAIM_PACKET_ID|…. Each stays UNRESOLVED in this client."><textarea rows={4} maxLength={30_000} value={evidenceText} onChange={(event) => setEvidenceText(event.target.value)} placeholder="Add an unresolved reference only if you choose" /></Field>
      {error ? <p className="fine warningText" role="alert">{error}</p> : null}
      <button type="button" className="button primary" onClick={prepare}>Review exact branch event</button>
      <p className="fine">The payload will be canonical RFC 8785 JSON inside `content`; NIP-01 event IDs still use their own protocol serialization. No parent lookup happens until you click the explicit fetch action on a displayed branch.</p>
    </section>
  </div>;
}

export function EndorsementComposer({ selectedTarget, onPrepare }: { selectedTarget: NostrEvent | null; onPrepare: (event: NostrUnsignedEvent, label: string) => void }) {
  const [targetId, setTargetId] = useState(selectedTarget?.id ?? "");
  const [targetAuthor, setTargetAuthor] = useState(selectedTarget?.pubkey ?? "");
  const [reason, setReason] = useState("");
  const [relationship, setRelationship] = useState<EndorsementPayload["relationship"]>("READ_USEFUL");
  const [error, setError] = useState("");
  const prepare = () => {
    setError("");
    try {
      const event = createEndorsementEvent({ endorsedEventId: targetId.trim(), endorsedAuthorPubkey: targetAuthor.trim(), reason, relationship });
      onPrepare(event, "TruthTalk reasoned endorsement · kind 40002");
    } catch (errorValue) { setError(errorValue instanceof Error ? errorValue.message : "Endorsement payload is invalid."); }
  };
  return <div className="composerStack">
    <div className="notice warning"><MessageSquareText size={17} /><p><strong>Reasoned endorsement, not a like.</strong> Kind 40002 is vendor-specific and may not be indexed or accepted by other clients. A reason is mandatory. It is not a vote, truth score, quality score, or endorsement of the author’s identity.</p></div>
    <section className="panel"><div className="panelTop"><div><p className="eyebrow">SIGNED REASON · JCS CONTENT</p><h2>Endorse, dissent, amplify, or cite</h2></div><StatusPill tone="warn">No engagement score</StatusPill></div>
      <div className="fieldGrid"><Field label="Target event ID · lowercase hex"><input maxLength={64} value={targetId} onChange={(event) => setTargetId(event.target.value)} /></Field><Field label="Target author key · lowercase hex"><input maxLength={64} value={targetAuthor} onChange={(event) => setTargetAuthor(event.target.value)} /></Field></div>
      <Field label="Relationship"><select value={relationship} onChange={(event) => setRelationship(event.target.value as EndorsementPayload["relationship"])}>{relationships.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></Field>
      <Field label="Reason · required · maximum 280 Unicode code points"><textarea maxLength={560} rows={4} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why you are citing, amplifying, dissenting, or finding the item useful." /><small className="fieldHint">{Array.from(reason).length}/280 code points</small></Field>
      {error ? <p className="fine warningText" role="alert">{error}</p> : null}
      <button type="button" className="button primary" onClick={prepare}>Review signed endorsement</button>
      <p className="fine">Counts are displayed only as observed valid signatures and number of reasons. This composer does not query a profile or identity service.</p>
    </section>
  </div>;
}

export function PublicActionBoundary() {
  return <div className="notice warning"><ShieldAlert size={17} /><p>Signing and broadcasting are separate. Review the complete content, signed tags, key, and relay list. Never include credentials, private keys, access tokens, confidential material, or identifiable people without the necessary consent.</p></div>;
}
