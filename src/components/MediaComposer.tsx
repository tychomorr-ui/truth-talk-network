import { useState } from "react";
import { FileCheck2, Film, LoaderCircle, ShieldAlert } from "lucide-react";
import { createFileMetadataEvent, createShortVideoEvent, hashLocalFile, MAX_MEDIA_BYTES, safePublicHttpsUrl, verifyRemoteFile, type MediaHashResult, type RemoteHashResult } from "../lib/attestations";
import { sha256HexText } from "../lib/hash";
import type { NostrUnsignedEvent } from "../lib/nostr";
import type { ReceiptKind } from "../lib/receipts";
import { Field, StatusPill } from "./ui";

type RecordFn = (kind: ReceiptKind, details: Record<string, unknown>) => Promise<boolean>;
type MediaMode = "video" | "file";

export function MediaComposer({ record, notify, onPrepare }: { record: RecordFn; notify: (message: string) => void; onPrepare: (event: NostrUnsignedEvent, label: string) => void }) {
  const [mode, setMode] = useState<MediaMode>("video");
  const [file, setFile] = useState<File | null>(null);
  const [localHash, setLocalHash] = useState<MediaHashResult | null>(null);
  const [remoteHash, setRemoteHash] = useState<RemoteHashResult | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [mime, setMime] = useState("");
  const [digest, setDigest] = useState("");
  const [bytes, setBytes] = useState("");
  const [originalDigest, setOriginalDigest] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [alt, setAlt] = useState("");
  const [markAsClaim, setMarkAsClaim] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ read: number; total: number } | null>(null);
  const [error, setError] = useState("");

  const chooseFile = (picked: File | null) => {
    setFile(picked); setLocalHash(null); setRemoteHash(null); setError(""); setProgress(null);
    if (picked) {
      setBytes(String(picked.size));
      if (picked.type) setMime(picked.type.toLowerCase());
      setDigest("");
    }
  };

  const hashSelectedFile = async () => {
    if (!file || busy) return;
    setBusy(true); setError(""); setProgress({ read: 0, total: file.size });
    try {
      const result = await hashLocalFile(file, (read, total) => {
        if (read === total || read % (16 * 1024 * 1024) < 2 * 1024 * 1024) setProgress({ read, total });
      });
      setLocalHash(result); setDigest(result.digest); setBytes(String(result.bytes));
      const saved = await record("MEDIA_HASH_CREATED", { sha256: result.digest, bytes: result.bytes, mediaType: result.mediaType, verifiedAt: result.verifiedAt, fileNameSha256: sha256HexText(file.name), upload: false });
      notify(saved ? "Selected-file bytes hashed in this browser. No upload occurred." : "Selected-file hash is available, but its local receipt could not be saved. No upload occurred.");
    } catch (errorValue) { setError(errorValue instanceof Error ? errorValue.message : "The selected file could not be hashed in this browser."); }
    finally { setBusy(false); }
  };

  const verifyRemote = async () => {
    if (busy || !url.trim() || !digest.trim()) return;
    let normalizedUrl: string;
    try { normalizedUrl = safePublicHttpsUrl(url); }
    catch (errorValue) { setError(errorValue instanceof Error ? errorValue.message : "Remote URL is not valid."); return; }
    const expected = digest.trim();
    if (!window.confirm(`Fetch the complete media bytes from this public HTTPS URL to compare the SHA-256 now?\n\n${normalizedUrl}\n\nThe host may observe your IP address. Cookies, credentials, and referrer are omitted. The browser caps the response at ${Math.round(MAX_MEDIA_BYTES / 1024 / 1024)} MiB; a CORS or network failure will be shown as unverifiable.`)) return;
    const urlHash = sha256HexText(normalizedUrl);
    const host = new URL(normalizedUrl).host;
    const started = await record("MEDIA_URL_VERIFIED", { stage: "requested", sourceUrlSha256: urlHash, host, expectedSha256: expected, outbound: "user-confirmed GET", credentials: "omit" });
    if (!started) { setError("The verification-intent receipt could not be saved; no fetch was made."); return; }
    setBusy(true); setError(""); setRemoteHash(null);
    try {
      const result = await verifyRemoteFile(normalizedUrl, expected);
      setRemoteHash(result);
      const saved = await record("MEDIA_URL_VERIFIED", { stage: "completed", sourceUrlSha256: urlHash, host, matches: result.matches, actualSha256: result.digest, expectedSha256: result.expectedDigest, bytes: result.bytes, mediaType: result.mediaType, verifiedAt: result.verifiedAt });
      notify(result.matches ? saved ? "The fetched bytes match the stated SHA-256." : "The fetched bytes match, but the local result receipt could not be saved." : "The fetched bytes do not match the stated SHA-256. No match is claimed.");
    } catch (errorValue) {
      const reason = errorValue instanceof Error ? errorValue.message.slice(0, 240) : "Network, CORS, or response verification failed.";
      setError(`UNVERIFIABLE — ${reason}`);
      await record("MEDIA_URL_VERIFIED", { stage: "failed", sourceUrlSha256: urlHash, host, expectedSha256: expected, outcome: "UNVERIFIABLE", reason });
      notify("Remote bytes could not be verified. A network/CORS failure is not a digest mismatch.");
    } finally { setBusy(false); }
  };

  const prepareEvent = () => {
    if (busy) return;
    try {
      const event = mode === "video"
        ? createShortVideoEvent({ title, description, url, mediaType: mime, sha256: digest, dimensions: dimensions || undefined, alt: alt || undefined, markAsClaim })
        : createFileMetadataEvent({ description, url, mediaType: mime, sha256: digest, bytes: bytes ? Number(bytes) : undefined, originalSha256: originalDigest || undefined, alt: alt || undefined, markAsClaim });
      onPrepare(event, mode === "video" ? "NIP-71 regular short-video event" : "NIP-94 file metadata event");
    } catch (errorValue) { setError(errorValue instanceof Error ? errorValue.message : "Media event fields are invalid."); }
  };

  const progressPercent = progress && progress.total ? Math.min(100, Math.round(progress.read / progress.total * 100)) : 0;
  return <div className="composerStack">
    <div className="notice warning"><ShieldAlert size={17} /><p><strong>Reference only; no upload.</strong> TruthTalk hashes only a file you select, or fetches remote bytes only after a separate confirmation. It never hosts media. A digest match proves byte equality against the signed digest, not authorship, identity, truth, capture time, or future availability.</p></div>
    <section className="panel"><div className="panelTop"><div><p className="eyebrow"><Film size={14} /> NOSTR MEDIA ATTESTATION</p><h2>Attach the evidence, not a claim of truth</h2></div><StatusPill tone="neutral">No file upload</StatusPill></div>
      <div className="choiceRow"><button className={`choice ${mode === "video" ? "selected" : ""}`} type="button" aria-pressed={mode === "video"} onClick={() => { setMode("video"); setError(""); setRemoteHash(null); }}>Short video · NIP-71 kind 22</button><button className={`choice ${mode === "file" ? "selected" : ""}`} type="button" aria-pressed={mode === "file"} onClick={() => { setMode("file"); setError(""); setRemoteHash(null); }}>Document / file · NIP-94 kind 1063</button></div>
      {mode === "video" ? <Field label="Short-video title" hint="NIP-71 regular short-video kind 22 requires a title; protocol support varies by relay."><input maxLength={400} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title the referenced video" /></Field> : null}
      <Field label="Description" hint="Optional, self-authored context. It is signed as event content."><textarea rows={4} maxLength={10_000} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
      <Field label="Public media URL" hint="Paste the direct public HTTPS file link from a host you choose. It may become part of a public signed event; never include a password or access token."><input type="url" maxLength={2_048} value={url} onChange={(event) => { setUrl(event.target.value); setRemoteHash(null); }} placeholder="Paste a public HTTPS media URL" autoComplete="off" /></Field>
      <details className="synopsisDetails mediaUrlHelp">
        <summary>How do I get this URL?</summary>
        <ol>
          <li>Choose a file/video host that you control and review its privacy, retention, deletion, and cost rules. Upload the final file using that service; TruthTalk does not upload or host it.</li>
          <li>Copy the host’s direct public HTTPS link to the file—not a sign-in page or share-page link. Test it while signed out: it should serve the file without requiring an account. Avoid private links, passwords, and tokenized URLs because the media address may be published to your chosen Nostr relays.</li>
          <li>If the host transcodes or changes the file, download the final hosted version and select that copy below. Click <strong>Hash selected file locally</strong>; this calculates a digest in this browser and does not upload anything. Enter the direct URL, its MIME type, and the SHA-256 of those exact served bytes.</li>
          <li>Use <strong>Verify remote bytes now</strong> only if you want this browser to fetch the file. You will first see the exact URL for confirmation. The host may see your IP address; the request omits cookies, credentials, and referrer, refuses redirects, and is limited to 250 MiB. The host must allow browser CORS access.</li>
        </ol>
        <p className="fine">A network, CORS, or redirect failure means “unverifiable,” not “digest mismatch.” A matching digest proves byte equality only; it does not establish authorship, identity, truth, rights, or future availability. Video preview additionally requires matching bytes, a video MIME type, and a file of 50 MiB or less.</p>
      </details>
      <div className="fieldGrid"><Field label="MIME type · lowercase"><input maxLength={140} value={mime} onChange={(event) => setMime(event.target.value.toLowerCase())} placeholder={mode === "video" ? "video/mp4" : "application/pdf"} /></Field><Field label="SHA-256 · exact served bytes"><input maxLength={64} value={digest} onChange={(event) => { setDigest(event.target.value); setRemoteHash(null); }} placeholder="64 lowercase hexadecimal characters" /></Field></div>
      <div className="localFileHash"><div><p className="fieldLabel">LOCAL FILE HASHING · USER SELECTED</p><p className="fine">The browser reads the selected file in 2 MiB chunks, up to {Math.round(MAX_MEDIA_BYTES / 1024 / 1024)} MiB. The file stays in this tab and is not sent anywhere.</p></div><input type="file" accept={mode === "video" ? "video/*" : "image/*,application/pdf,text/plain,application/zip,application/octet-stream"} disabled={busy} onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />{file ? <p className="fine">Selected locally: {file.name} · {file.size.toLocaleString()} bytes · {file.type || "unknown MIME"}</p> : null}<button type="button" className="button secondary" disabled={!file || busy} onClick={() => void hashSelectedFile()}>{busy && progress ? <LoaderCircle className="spin" size={14} /> : <FileCheck2 size={14} />} {busy && progress ? `Hashing ${progressPercent}%` : "Hash selected file locally"}</button></div>
      {mode === "video" ? <Field label="Dimensions · optional · widthxheight"><input value={dimensions} maxLength={11} onChange={(event) => setDimensions(event.target.value)} placeholder="1920x1080" /></Field> : <div className="fieldGrid"><Field label="Byte size · optional"><input type="number" min={1} max={MAX_MEDIA_BYTES} value={bytes} onChange={(event) => setBytes(event.target.value)} placeholder="From local-file hashing" /></Field><Field label="Original SHA-256 · only if distinct"><input maxLength={64} value={originalDigest} onChange={(event) => setOriginalDigest(event.target.value)} placeholder="NIP-94 ox; do not copy x" /></Field></div>}
      <Field label="Alternative text · optional"><input maxLength={1_000} value={alt} onChange={(event) => setAlt(event.target.value)} /></Field>
      <label className="consentCheck claimMarkCheck"><input type="checkbox" checked={markAsClaim} onChange={(event) => setMarkAsClaim(event.target.checked)} /><span>Mark this media event as a self-declared claim candidate for the reasoned-discovery filter. This does not assert its contents are true.</span></label>
      {localHash ? <div className="mediaHashResult"><StatusPill tone="good">LOCAL SHA-256</StatusPill><code>{localHash.digest}</code><span>{localHash.bytes.toLocaleString()} bytes · {localHash.mediaType} · {localHash.verifiedAt}</span></div> : null}
      <div className="remoteVerifyBox"><div><p className="fieldLabel">VERIFY REMOTE BYTES · OPTIONAL PUBLIC GET</p><p className="fine">Only compare after you have reviewed the URL and digest. The fetch omits credentials, refuses redirects, and can fail due to CORS.</p></div><button className="button secondary" type="button" disabled={busy || !url.trim() || !digest.trim()} onClick={() => void verifyRemote()}>{busy && !progress ? <LoaderCircle className="spin" size={14} /> : <FileCheck2 size={14} />} Verify remote bytes now</button>{remoteHash ? <div className={`remoteHashResult ${remoteHash.matches ? "match" : "mismatch"}`}><StatusPill tone={remoteHash.matches ? "good" : "bad"}>{remoteHash.matches ? "DIGEST MATCH" : "DIGEST MISMATCH"}</StatusPill><code>Expected {remoteHash.expectedDigest}</code><code>Actual&nbsp;&nbsp;&nbsp; {remoteHash.digest}</code><span>{remoteHash.bytes.toLocaleString()} bytes · {remoteHash.mediaType} · {remoteHash.verifiedAt}</span></div> : null}{error ? <p className="fine warningText" role="alert">{error}</p> : null}</div>
      <div className="buttonRow"><button className="button primary" type="button" disabled={busy} onClick={prepareEvent}>Review {mode === "video" ? "short-video" : "file"} event</button></div>
    </section>
  </div>;
}
