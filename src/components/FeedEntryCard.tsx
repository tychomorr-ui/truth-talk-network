import { useEffect, useState } from "react";
import { GitBranch, Link2, MessageSquareText, Play, ShieldAlert, Trash2 } from "lucide-react";
import type { FeedRecord } from "../lib/discovery";
import type { NostrEvent, NostrUnsignedEvent } from "../lib/nostr";
import {
  createNip09DeletionRequest,
  createNip56ReportEvent,
  parseFileMetadata,
  parseVideoMetadata,
  type ReportType,
} from "../lib/feedProtocol";
import {
  fetchRemoteVideoPreview,
  MAX_MEDIA_BYTES,
  safePublicHttpsUrl,
  verifyRemoteFile,
  type MediaVerificationEvidence,
  type VideoPreviewResult,
} from "../lib/attestations";
import { StatusPill } from "./ui";

const reportTypes: ReportType[] = ["nudity", "malware", "profanity", "illegal", "spam", "impersonation"];
const formatTime = (seconds: number) => {
  const date = new Date(seconds * 1_000);
  return Number.isNaN(date.getTime()) ? "Invalid timestamp" : date.toISOString();
};

function evidenceFromVideo(result: Omit<VideoPreviewResult, "blob">): MediaVerificationEvidence {
  return {
    sourceUrl: result.sourceUrl,
    expectedDigest: result.expectedDigest,
    digest: result.digest,
    matches: result.digestMatches,
    bytes: result.bytes,
    mediaType: result.responseMime,
    verifiedAt: result.verifiedAt,
  };
}

function ParentContext({ parent, expectedAuthorPubkey }: { parent: FeedRecord; expectedAuthorPubkey: string }) {
  const authorMatches = parent.event.pubkey === expectedAuthorPubkey;
  const status = !parent.signatureValid
    ? "SIGNATURE INVALID"
    : authorMatches
      ? "SIGNATURE VALID · AUTHOR MATCH"
      : "SIGNATURE VALID · WRONG AUTHOR";
  const body = parent.branch
    ? `${parent.branch.branchType} branch: ${parent.branch.claimStatement}`
    : parent.endorsement
      ? `${parent.endorsement.relationship}: ${parent.endorsement.reason}`
      : parent.event.content || "(empty event content)";

  return (
    <aside className="resolvedParent" aria-label="Parent event context">
      <div className="feedMediaTitle">
        <Link2 size={15} />
        <strong>Parent context · kind {parent.event.kind}</strong>
        <StatusPill tone={!parent.signatureValid || !authorMatches ? "bad" : "good"}>{status}</StatusPill>
      </div>
      <p className="fine">Expected author: <code>{expectedAuthorPubkey}</code></p>
      <p className="fine">Returned author: <code>{parent.event.pubkey}</code> · event <code>{parent.event.id}</code></p>
      {!parent.signatureValid ? (
        <p className="fine warningText">{parent.reason ?? "The parent signature did not verify."} Parent content is withheld.</p>
      ) : parent.payloadValid === false ? (
        <p className="fine warningText">The parent's signed TruthTalk payload failed schema validation. Its content is withheld.</p>
      ) : (
        <p className="parentPreviewContent">{body}</p>
      )}
      <p className="fine">This is a one-level, explicitly resolved context preview. It is not a truth, identity, ownership, or endorsement determination.</p>
    </aside>
  );
}

export function FeedEntryCard({
  record,
  records,
  signerPubkey,
  localHidden,
  localMuted,
  parentStatus,
  resolvedParent,
  onHide,
  onMute,
  onBranch,
  onEndorse,
  onPrepare,
  onFetchParent,
  onMediaAttempt,
  onMediaVerification,
}: {
  record: FeedRecord;
  records: FeedRecord[];
  signerPubkey: string;
  localHidden: boolean;
  localMuted: boolean;
  parentStatus?: string;
  resolvedParent?: FeedRecord;
  onHide: (eventId: string, hidden: boolean) => void;
  onMute: (pubkey: string, muted: boolean) => void;
  onBranch: (event: NostrEvent) => void;
  onEndorse: (event: NostrEvent) => void;
  onPrepare: (event: NostrUnsignedEvent, label: string) => void;
  onFetchParent: (event: NostrEvent) => void;
  onMediaAttempt: (event: NostrEvent, sourceUrl: string, expectedDigest: string, stage: "requested" | "failed", reason?: string) => Promise<boolean>;
  onMediaVerification: (event: NostrEvent, result: MediaVerificationEvidence) => Promise<boolean>;
}) {
  const event = record.event;
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [reportNote, setReportNote] = useState("");
  const [videoBlobUrl, setVideoBlobUrl] = useState("");
  const [videoLoadBusy, setVideoLoadBusy] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState("");
  const [videoCheck, setVideoCheck] = useState<Omit<VideoPreviewResult, "blob"> | null>(null);
  const [fileCheck, setFileCheck] = useState<MediaVerificationEvidence | null>(null);
  const [fileCheckBusy, setFileCheckBusy] = useState(false);
  const [fileCheckError, setFileCheckError] = useState("");

  useEffect(() => {
    if (!videoBlobUrl) return;
    return () => URL.revokeObjectURL(videoBlobUrl);
  }, [videoBlobUrl]);

  const isUsable = record.signatureValid && record.payloadValid !== false;
  const isClaim = event.kind === 40001 || event.tags.some((tag) => tag[0] === "t" && (tag[1] === "truth-talk-claim" || tag[1] === "truth-talk-ip-claim"));
  const endorsements = records.filter((item) => item.signatureValid && item.payloadValid !== false && item.event.kind === 40002 && item.endorsement?.endorsedEventId === event.id && item.endorsement.endorsedAuthorPubkey === event.pubkey);
  const reasoned = endorsements.filter((item) => Boolean(item.endorsement?.reason.trim()));
  const selfEndorsements = endorsements.filter((item) => item.event.pubkey === event.pubkey).length;
  const video = parseVideoMetadata(event);
  const file = parseFileMetadata(event);
  let safeVideoUrl: string | null = null;
  let safeFileUrl: string | null = null;
  try { if (video) safeVideoUrl = safePublicHttpsUrl(video.url); } catch { /* Untrusted tags remain inert. */ }
  try { if (file) safeFileUrl = safePublicHttpsUrl(file.url); } catch { /* Untrusted tags remain inert. */ }

  const parent = resolvedParent ?? (record.branch ? records.find((item) => item.event.id === record.branch?.parentEventId) : undefined);
  let parentResolution = parentStatus ?? "UNRESOLVED";
  if (record.branch && parent) {
    parentResolution = parent.event.pubkey !== record.branch.parentAuthorPubkey
      ? "WRONG AUTHOR KEY"
      : parent.signatureValid
        ? "RESOLVED · SIGNATURE VALID"
        : "FOUND · PARENT SIGNATURE INVALID";
  }
  const createdAt = formatTime(event.created_at);

  const submitReport = () => {
    if (!reportType || !isUsable) return;
    try {
      onPrepare(createNip56ReportEvent(event, reportType, reportNote), "NIP-56 voluntary report");
      setReportOpen(false);
    } catch (error) { window.alert(error instanceof Error ? error.message : "Could not build report event."); }
  };

  const requestDeletion = () => {
    try { onPrepare(createNip09DeletionRequest(event, signerPubkey), "NIP-09 deletion request"); }
    catch (error) { window.alert(error instanceof Error ? error.message : "Could not build deletion request."); }
  };

  const loadVideo = async () => {
    if (!video || !safeVideoUrl || videoLoadBusy) return;
    const confirmed = window.confirm(
      `Fetch and hash up to 50 MiB from this public HTTPS URL now?\n\n${safeVideoUrl}\n\nThis is a CORS GET with no credentials, no referrer, and redirects rejected. The host may observe your IP address. A local Blob preview is created only when SHA-256 matches the signed digest.`,
    );
    if (!confirmed) return;
    const intentSaved = await onMediaAttempt(event, safeVideoUrl, video.sha256, "requested").catch(() => false);
    if (!intentSaved) {
      setVideoLoadError("The local verification-intent receipt could not be saved; no media request was made.");
      return;
    }

    setVideoLoadBusy(true);
    setVideoLoadError("");
    setVideoCheck(null);
    try {
      const result = await fetchRemoteVideoPreview(safeVideoUrl, video.sha256, video.mime);
      const { blob, ...evidence } = result;
      setVideoCheck(evidence);
      const receiptSaved = await onMediaVerification(event, evidenceFromVideo(evidence)).catch(() => false);
      const warnings = [];
      if (!receiptSaved) warnings.push("The digest outcome could not be saved to the local receipt ledger.");
      if (!result.digestMatches || !blob) warnings.push("The signed digest did not match, or no safe preview was produced; playback is withheld.");
      setVideoLoadError(warnings.join(" "));
      if (result.digestMatches && blob && receiptSaved) setVideoBlobUrl(URL.createObjectURL(blob));
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : "This media URL could not be verified safely.";
      const failedReceiptSaved = await onMediaAttempt(event, safeVideoUrl, video.sha256, "failed", reason).catch(() => false);
      setVideoLoadError(`${reason}${failedReceiptSaved ? " The failed/unverifiable attempt was saved locally." : " The failed-attempt receipt could not be saved."}`);
    } finally { setVideoLoadBusy(false); }
  };

  const verifyFile = async () => {
    if (!file || !safeFileUrl || fileCheckBusy) return;
    const limit = Math.round(MAX_MEDIA_BYTES / 1024 / 1024);
    const confirmed = window.confirm(
      `Fetch and hash up to ${limit} MiB from this public HTTPS URL now?\n\n${safeFileUrl}\n\nThis is a CORS GET with no credentials, no referrer, and redirects rejected. The host may observe your IP address. No file is uploaded to TruthTalk.`,
    );
    if (!confirmed) return;
    const intentSaved = await onMediaAttempt(event, safeFileUrl, file.sha256, "requested").catch(() => false);
    if (!intentSaved) {
      setFileCheckError("The local verification-intent receipt could not be saved; no file request was made.");
      return;
    }

    setFileCheckBusy(true);
    setFileCheckError("");
    setFileCheck(null);
    try {
      const result = await verifyRemoteFile(safeFileUrl, file.sha256);
      setFileCheck(result);
      const receiptSaved = await onMediaVerification(event, result).catch(() => false);
      if (!receiptSaved) setFileCheckError("The digest result is shown, but its local receipt could not be saved.");
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : "The file bytes could not be verified safely.";
      const failedReceiptSaved = await onMediaAttempt(event, safeFileUrl, file.sha256, "failed", reason).catch(() => false);
      setFileCheckError(`${reason} This is unverifiable, not a digest mismatch.${failedReceiptSaved ? " The failed attempt was saved locally." : " The failed-attempt receipt could not be saved."}`);
    } finally { setFileCheckBusy(false); }
  };

  const discardVideo = () => { setVideoBlobUrl(""); setVideoCheck(null); setVideoLoadError(""); };

  return (
    <article className={`feedEntry ${!record.signatureValid ? "feedEntry-invalid" : ""}`} id={`event-${event.id}`}>
      <div className="feedEntryHead">
        <div className="feedEntryKind">
          <span className="feedEventKind">KIND {event.kind}</span>
          <time dateTime={Number.isNaN(new Date(event.created_at * 1_000).getTime()) ? undefined : new Date(event.created_at * 1_000).toISOString()}>{createdAt}</time>
        </div>
        <StatusPill tone={record.signatureValid ? "good" : "bad"}>{record.signatureValid ? "KEY SIGNATURE VALID" : "SIGNATURE INVALID"}</StatusPill>
      </div>
      <div className="feedEventIdentity"><span>PUBLIC KEY</span><code>{event.pubkey}</code><span>EVENT ID</span><code>{event.id}</code></div>
      {record.signatureValid
        ? <p className="fine feedMeaning">This verifies that the event bytes were signed by this public key. It does not verify a real-world person, factual truth, capture time, or exclusive ownership.</p>
        : <p className="fine feedMeaning warningText">{record.reason ?? "The event did not pass NIP-01/BIP-340 validation."} Unverified content is not rendered or counted.</p>}
      {record.signatureValid && record.payloadValid === false ? <p className="fine warningText">{record.reason ?? "This signed TruthTalk event does not match the required payload schema."} Payload text is not rendered or counted.</p> : null}

      {record.signatureValid && record.branch ? (
        <div className="feedBranch">
          <p><b>{record.branch.branchType}</b> · signed branch</p>
          <p>{record.branch.claimStatement}</p>
          <div className="parentStatus"><span>Parent</span><StatusPill tone={parentResolution === "RESOLVED · SIGNATURE VALID" ? "good" : parentResolution === "WRONG AUTHOR KEY" || parentResolution.includes("INVALID") ? "bad" : "warn"}>{parentResolution}</StatusPill></div>
          <code>{record.branch.parentEventId} · expected author {record.branch.parentAuthorPubkey}</code>
          {parent ? <ParentContext parent={parent} expectedAuthorPubkey={record.branch.parentAuthorPubkey} /> : null}
          {record.branch.evidenceRefs.length
            ? <ul>{record.branch.evidenceRefs.map((reference, index) => <li key={`${reference.type}-${index}`}><b>{reference.type}</b> · {reference.value} <StatusPill tone="warn">UNRESOLVED</StatusPill></li>)}</ul>
            : <p className="fine">No evidence references were included.</p>}
          {!parent ? <button className="linkButton" type="button" onClick={() => onFetchParent(event)}><Link2 size={13} /> Try fetching the exact parent ID</button> : null}
        </div>
      ) : null}

      {record.signatureValid && record.endorsement ? (
        <div className="feedEndorsement">
          <p><b>{record.endorsement.relationship}</b> · signed reasoned endorsement</p>
          <blockquote>{record.endorsement.reason}</blockquote>
          <code>Targets {record.endorsement.endorsedEventId} · author {record.endorsement.endorsedAuthorPubkey}</code>
        </div>
      ) : null}

      {record.signatureValid && !record.branch && !record.endorsement && video ? (
        <div className="feedMedia">
          <div className="feedMediaTitle"><Play size={16} /><strong>{video.title}</strong></div>
          <p>{event.content || "No description."}</p>
          <code>{video.mime} · signed SHA-256 {video.sha256}</code>
          <code className="feedMediaUrl">Signed media URL · {video.url}</code>
          <p className="fine">Video bytes are not requested until you explicitly fetch and verify them. Playback uses a temporary in-memory Blob only after the SHA-256 matches and its local result receipt is saved; there is no direct remote media element.</p>
          {videoCheck ? <div className="videoIntegrityResult"><StatusPill tone={videoCheck.digestMatches ? "good" : "bad"}>{videoCheck.digestMatches ? "SHA-256 MATCH" : "DIGEST MISMATCH"}</StatusPill><code>Expected {videoCheck.expectedDigest}<br />Observed {videoCheck.digest}</code><span>{videoCheck.bytes.toLocaleString()} bytes · response MIME {videoCheck.responseMime} · checked {new Date(videoCheck.verifiedAt).toLocaleString()}</span></div> : null}
          {safeVideoUrl
            ? videoBlobUrl
              ? <><video controls preload="metadata" aria-label={video.alt || video.title} src={videoBlobUrl} /><button className="linkButton" type="button" onClick={discardVideo}>Discard local preview</button></>
              : <button className="button secondary" type="button" disabled={videoLoadBusy} onClick={() => void loadVideo()}>{videoLoadBusy ? "Fetching and hashing (maximum 50 MiB)…" : videoCheck ? "Verify again from the signed URL" : "Verify bytes and load preview"}</button>
            : <p className="fine warningText">The signed URL is not eligible for safe loading in this browser.</p>}
          {videoLoadError ? <p className="fine warningText" role="alert">{videoLoadError}</p> : null}
        </div>
      ) : null}

      {record.signatureValid && !record.branch && !record.endorsement && file ? (
        <div className="feedMedia">
          <div className="feedMediaTitle"><Link2 size={16} /><strong>Document / file attestation</strong></div>
          <p>{event.content || "No description."}</p>
          <code>Served-file MIME {file.mime} · signed SHA-256 {file.sha256}{file.bytes ? ` · ${file.bytes.toLocaleString()} bytes declared` : ""}{file.originalSha256 ? ` · publisher-supplied original digest (ox), not checked ${file.originalSha256}` : ""}</code>
          <code className="feedMediaUrl">Signed file URL · {file.url}</code>
          <p className="fine">The signed digest is compared with served bytes only after you explicitly approve an HTTPS request below. TruthTalk does not upload the file or treat a failed/CORS-blocked fetch as a mismatch.</p>
          {fileCheck ? <div className="videoIntegrityResult"><StatusPill tone={fileCheck.matches ? "good" : "bad"}>{fileCheck.matches ? "SHA-256 MATCH" : "DIGEST MISMATCH"}</StatusPill><code>Expected {fileCheck.expectedDigest}<br />Observed {fileCheck.digest}</code><span>{fileCheck.bytes.toLocaleString()} bytes · response MIME {fileCheck.mediaType}{file.bytes !== undefined && file.bytes !== fileCheck.bytes ? " · signed size tag differs" : ""} · checked {new Date(fileCheck.verifiedAt).toLocaleString()}</span></div> : null}
          {safeFileUrl ? <div className="buttonRow"><button className="button secondary" type="button" disabled={fileCheckBusy} onClick={() => void verifyFile()}>{fileCheckBusy ? "Fetching and hashing…" : fileCheck ? "Verify file bytes again" : "Verify bytes against the signed SHA-256"}</button><a className="button secondary" href={safeFileUrl} target="_blank" rel="noreferrer noopener" referrerPolicy="no-referrer" aria-label={`Open this exact file URL in a new tab: ${safeFileUrl}`}>Open this exact URL after review</a></div> : <p className="fine warningText">The signed URL is not eligible for safe opening in this browser.</p>}
          {fileCheckError ? <p className="fine warningText" role="alert">{fileCheckError}</p> : null}
        </div>
      ) : null}

      {record.signatureValid && record.payloadValid !== false && !record.branch && !record.endorsement && !video && !file ? <pre className="feedContent">{event.content || "(empty event content)"}</pre> : null}
      {record.signatureValid && isClaim ? <div className="endorsementCount">{endorsements.length} signed endorsement{endorsements.length === 1 ? "" : "s"}, {reasoned.length} of which include a reason{selfEndorsements ? ` · ${selfEndorsements} by this claim’s own key` : ""}. Counts are limited to events observed from the selected relays.</div> : null}
      {record.signatureValid ? <div className="feedRelayLine"><span>OBSERVED ON</span>{record.relayHosts.map((host) => <code key={host}>{host}</code>)}</div> : null}

      <div className="feedCardActions">
        <button type="button" className="linkButton" onClick={() => onHide(event.id, !localHidden)}>{localHidden ? "Unhide locally" : "Hide locally"}</button>
        <button type="button" className="linkButton" onClick={() => onMute(event.pubkey, !localMuted)}>{localMuted ? "Unmute key" : "Mute key locally"}</button>
        {isUsable && isClaim ? <button type="button" className="linkButton" onClick={() => onBranch(event)}><GitBranch size={13} /> Branch</button> : null}
        {isUsable && isClaim ? <button type="button" className="linkButton" onClick={() => onEndorse(event)}><MessageSquareText size={13} /> Endorse</button> : null}
        {isUsable ? <button type="button" className="linkButton" onClick={() => setReportOpen((open) => !open)}><ShieldAlert size={13} /> Report</button> : null}
        {isUsable && signerPubkey && signerPubkey === event.pubkey ? <button type="button" className="linkButton" onClick={requestDeletion}><Trash2 size={13} /> Request deletion</button> : null}
      </div>

      {reportOpen ? (
        <div className="reportComposer">
          <p><b>NIP-56 voluntary report</b> · This signed event is a report, not enforcement, a truth judgment, or a guarantee of removal.</p>
          <label className="field"><span className="fieldLabel">Report type</span><select value={reportType} onChange={(change) => setReportType(change.target.value as ReportType | "")}><option value="">Choose a reason</option>{reportTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
          <label className="field"><span className="fieldLabel">Optional note</span><textarea maxLength={1_000} rows={3} value={reportNote} onChange={(change) => setReportNote(change.target.value)} /></label>
          <div className="buttonRow"><button className="button secondary" type="button" disabled={!reportType} onClick={submitReport}>Review signed report</button><button className="button secondary" type="button" onClick={() => setReportOpen(false)}>Cancel</button></div>
        </div>
      ) : null}
    </article>
  );
}
