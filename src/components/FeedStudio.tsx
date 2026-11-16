import { useMemo, useRef, useState } from "react";
import { BookOpenCheck, CircleAlert, LoaderCircle, Radio, ShieldCheck, TriangleAlert } from "lucide-react";
import { BranchComposer, EndorsementComposer } from "./FeedComposers";
import { ClaimComposer } from "./ClaimComposer";
import { DiscoveryPanel } from "./DiscoveryPanel";
import { FeedEntryCard } from "./FeedEntryCard";
import { MediaComposer } from "./MediaComposer";
import { SectionHeader, StatusPill } from "./ui";
import { FEED_KINDS, parseBranchPayload, parseEndorsementPayload } from "../lib/feedProtocol";
import { filterLowFollowerDiscovery, type FeedRecord } from "../lib/discovery";
import { loadFeedLocalFilters, saveFeedLocalFilters, type FeedLocalFilters } from "../lib/feedStorage";
import { sha256HexText } from "../lib/hash";
import { calculateNostrEventId, connectNostrSigner, fetchNostrParent, getNostrSigner, parseRelayUrls, publishToRelays, readNostrFeed, signNostrEvent, type FeedReadResult, type NostrEvent, type NostrUnsignedEvent, type RelayResult } from "../lib/nostr";
import { readiness } from "../lib/truthTalk";
import { safePublicHttpsUrl, type MediaVerificationEvidence } from "../lib/attestations";
import type { ReceiptKind } from "../lib/receipts";

type RecordFn = (kind: ReceiptKind, details: Record<string, unknown>) => Promise<boolean>;
type FeedView = "feed" | "discovery" | "claim" | "media" | "branch" | "endorse";
type PendingEvent = {
  label: string;
  unsigned: NostrUnsignedEvent;
  relays: string[];
  pubkey: string;
  eventId: string;
  contentHash: string;
  rightsChecked: boolean;
  peopleChecked: boolean;
  publicChecked: boolean;
  signedEvent?: NostrEvent;
  broadcastChecked: boolean;
  busy: boolean;
  error: string;
};

type ParentStatus = "UNRESOLVED" | "WRONG AUTHOR KEY" | "FOUND · SIGNATURE INVALID" | "RESOLVED · SIGNATURE VALID";
const emptyFilters: FeedLocalFilters = { hiddenEventIds: [], mutedPubkeys: [] };

function readStoredFilters(): FeedLocalFilters {
  try { return loadFeedLocalFilters(); } catch { return { ...emptyFilters }; }
}

function ageGateAccepted(): boolean {
  try { return window.sessionStorage.getItem("truth-talk.public-feed.18plus.v1") === "true"; }
  catch { return false; }
}

function toFeedRecordEntry(entry: FeedReadResult["entries"][number]): FeedRecord {
  const base: FeedRecord = { event: entry.event, signatureValid: entry.valid, reason: entry.reason, relayHosts: [...entry.relayHosts] };
  if (!entry.valid) return base;
  if (entry.event.kind === 40001) {
    try { base.branch = parseBranchPayload(entry.event.content); base.payloadValid = true; }
    catch (error) { base.payloadValid = false; base.reason = `Signed event, but invalid TruthTalk branch schema: ${error instanceof Error ? error.message : "content is not valid"}`; }
  } else if (entry.event.kind === 40002) {
    try { base.endorsement = parseEndorsementPayload(entry.event.content); base.payloadValid = true; }
    catch (error) { base.payloadValid = false; base.reason = `Signed event, but invalid TruthTalk endorsement schema: ${error instanceof Error ? error.message : "content is not valid"}`; }
  }
  return base;
}

function toFeedRecord(result: FeedReadResult): FeedRecord[] {
  return result.entries.map(toFeedRecordEntry);
}

function localEventHash(eventId: string): string { return sha256HexText(eventId); }

export function FeedStudio({ record, notify }: { record: RecordFn; notify: (message: string) => void }) {
  const [ageOk, setAgeOk] = useState(ageGateAccepted);
  const [view, setView] = useState<FeedView>("feed");
  const [relayText, setRelayText] = useState("");
  const [readResult, setReadResult] = useState<FeedReadResult | null>(null);
  const [feedBusy, setFeedBusy] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [showLocallyFiltered, setShowLocallyFiltered] = useState(false);
  const [filters, setFilters] = useState<FeedLocalFilters>(readStoredFilters);
  const [signerPubkey, setSignerPubkey] = useState("");
  const [signerBusy, setSignerBusy] = useState(false);
  const [pending, setPending] = useState<PendingEvent | null>(null);
  const [published, setPublished] = useState<{ eventId: string; label: string; results: RelayResult[] } | null>(null);
  const [parentStatuses, setParentStatuses] = useState<Record<string, ParentStatus>>({});
  const [resolvedParents, setResolvedParents] = useState<Record<string, FeedRecord>>({});
  const [selectedParent, setSelectedParent] = useState<NostrEvent | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<NostrEvent | null>(null);
  const attemptedEventIds = useRef(new Set<string>());
  const signerAvailable = Boolean(getNostrSigner());

  const records = useMemo(() => readResult ? toFeedRecord(readResult) : [], [readResult]);
  const visibleRecords = useMemo(() => records.filter((item) => showLocallyFiltered || (!filters.hiddenEventIds.includes(item.event.id) && !filters.mutedPubkeys.includes(item.event.pubkey))), [records, showLocallyFiltered, filters]);
  const validCount = records.filter((item) => item.signatureValid).length;
  const invalidCount = records.length - validCount;

  const updateFilters = (next: FeedLocalFilters, action: string) => {
    setFilters(next);
    try { saveFeedLocalFilters(next); notify(`${action} applies only in this browser. No relay or node was contacted.`); }
    catch { notify(`${action} applies only for this tab; browser storage could not persist it.`); }
  };

  const acceptAgeGate = () => {
    try { window.sessionStorage.setItem("truth-talk.public-feed.18plus.v1", "true"); } catch { /* Keep this tab's self-attestation in memory only. */ }
    setAgeOk(true);
  };

  const connectSigner = async () => {
    if (signerBusy || !signerAvailable) return;
    setSignerBusy(true);
    const intent = await record("NOSTR_ACTION_ATTEMPTED", { stage: "feed-signer-access", destination: "operator-installed NIP-07 extension", networkBroadcast: false });
    if (!intent) { setSignerBusy(false); notify("The signer-access receipt could not be saved; no signer request was made."); return; }
    try {
      const pubkey = await connectNostrSigner();
      setSignerPubkey(pubkey);
      await record("NOSTR_ACTION_RESULT", { stage: "feed-signer-access", outcome: "public-key-returned", publicKeySha256: sha256HexText(pubkey), networkBroadcast: false });
      notify("Signer public key authorized for this tab. No private key was imported or stored; no relay was contacted.");
    } catch (error) {
      await record("NOSTR_ACTION_RESULT", { stage: "feed-signer-access", outcome: "missing-rejected-or-cancelled", networkBroadcast: false });
      notify(error instanceof Error ? error.message : "Signer access was not granted. Nothing was sent.");
    } finally { setSignerBusy(false); }
  };

  const readSelectedRelays = async () => {
    if (!ageOk || feedBusy) return;
    let relays: string[];
    try { relays = parseRelayUrls(relayText); }
    catch (error) { setFeedError(error instanceof Error ? error.message : "Relay list is invalid."); return; }
    const hostList = relays.map((relay) => new URL(relay).host);
    const confirmed = window.confirm(`Open read-only WebSocket requests to these exact relay destinations now?\n\n${relays.join("\n")}\n\nThe relay operators may observe your IP address. TruthTalk will request only kinds ${FEED_KINDS.join(", ")}; no profile or media fetch is automatic.`);
    if (!confirmed) return;
    const started = await record("FEED_LOOKUP_STARTED", { relayHosts: hostList, kinds: [...FEED_KINDS], limitPerRelay: 50, userConfirmed: true });
    if (!started) { setFeedError("The local lookup-intent receipt could not be saved; no relay was contacted."); return; }
    setFeedBusy(true); setFeedError(""); setPublished(null);
    try {
      const result = await readNostrFeed(relays, [...FEED_KINDS]);
      setReadResult(result); setParentStatuses({}); setResolvedParents({});
      const mapped = toFeedRecord(result);
      const verifiedIds = mapped.filter((item) => item.signatureValid).map((item) => item.event.id).slice(0, 250);
      const completed = await record("FEED_LOOKUP_COMPLETED", { relayOutcomes: result.relayResults.map((item) => ({ host: item.host, outcome: item.outcome, eventCount: item.events.length, ...(item.error ? { error: item.error } : {}), notices: item.notices })), retrievedAt: result.retrievedAt, verifiedEventIds: verifiedIds, verifiedCount: validCountFrom(mapped), invalidCount: mapped.length - validCountFrom(mapped), malformedCount: result.malformedCount });
      notify(completed ? `Read ${mapped.length} event${mapped.length === 1 ? "" : "s"} from the selected relay list; ${validCountFrom(mapped)} passed the local key-signature check.` : "Feed results arrived, but the local receipt could not be saved. Do not assume the lookup was not observed by relays.");
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : "Relay lookup failed.";
      setFeedError(reason);
      await record("FEED_LOOKUP_FAILED", { relayHosts: hostList, kinds: [...FEED_KINDS], outcome: "failed", reason });
      notify("Relay lookup failed. No site or node directory lookup was attempted.");
    } finally { setFeedBusy(false); }
  };

  const preparePublication = (unsigned: NostrUnsignedEvent, label: string) => {
    if (!ageOk) { notify("Complete the 18+ self-attestation before preparing a public-feed action."); return; }
    if (!signerPubkey) { notify("Connect the NIP-07 signer you control before reviewing a public event. No signer was contacted automatically."); return; }
    let relays: string[];
    try { relays = parseRelayUrls(relayText); }
    catch (error) { notify(error instanceof Error ? error.message : "Enter the relay destinations you choose before preparing a public event."); return; }
    try {
      const eventId = calculateNostrEventId({ pubkey: signerPubkey, created_at: unsigned.created_at, kind: unsigned.kind, tags: unsigned.tags, content: unsigned.content });
      if (attemptedEventIds.current.has(eventId)) { notify("This exact event ID has already had a broadcast attempt. Do not retry it blindly; create a deliberate new event instead."); return; }
      setPending({ label, unsigned: { ...unsigned, tags: unsigned.tags.map((tag) => [...tag]) }, relays, pubkey: signerPubkey, eventId, contentHash: sha256HexText(unsigned.content), rightsChecked: false, peopleChecked: false, publicChecked: false, broadcastChecked: false, busy: false, error: "" });
      setPublished(null);
    } catch (error) { notify(error instanceof Error ? error.message : "Could not prepare the event preview."); }
  };

  const signPreparedEvent = async () => {
    if (!pending || pending.busy || pending.signedEvent || !pending.rightsChecked || !pending.peopleChecked || !pending.publicChecked) return;
    const started = await record("NOSTR_ACTION_ATTEMPTED", { stage: "explicit-feed-event-signing", kind: pending.unsigned.kind, eventId: pending.eventId, contentSha256: pending.contentHash, relayHosts: pending.relays.map((relay) => new URL(relay).host), networkBroadcast: false, userConfirmed: true });
    if (!started) { setPending((current) => current ? { ...current, error: "Signing-intent receipt could not be saved; the signer was not called." } : current); return; }
    setPending((current) => current ? { ...current, busy: true, error: "" } : current);
    try {
      const event = await signNostrEvent(pending.pubkey, pending.unsigned);
      if (event.id !== pending.eventId) throw new Error("The signed event ID differs from the exact reviewed preview.");
      const saved = await record("NOSTR_ACTION_RESULT", { stage: "explicit-feed-event-signing", outcome: "signer-returned-verified-event", eventId: event.id, contentSha256: pending.contentHash, kind: event.kind, networkBroadcast: false });
      if (!saved) { setPending((current) => current ? { ...current, busy: false, error: "The signer returned a valid signature, but its receipt could not be saved. No relay was contacted." } : current); return; }
      setPending((current) => current ? { ...current, signedEvent: event, busy: false, error: "" } : current);
      notify("The signer returned a signature that matches the reviewed event. Nothing has been published yet.");
    } catch (error) {
      await record("NOSTR_ACTION_RESULT", { stage: "explicit-feed-event-signing", outcome: "signing-rejected-cancelled-or-invalid", eventId: pending.eventId, networkBroadcast: false });
      setPending((current) => current ? { ...current, busy: false, error: error instanceof Error ? error.message : "Signer rejected or changed the event." } : current);
    }
  };

  const publishPreparedEvent = async () => {
    if (!pending?.signedEvent || pending.busy || !pending.broadcastChecked) return;
    let relays: string[];
    try { relays = parseRelayUrls(relayText); }
    catch (error) { setPending((current) => current ? { ...current, error: error instanceof Error ? error.message : "Relay list is invalid." } : current); return; }
    if (JSON.stringify(relays) !== JSON.stringify(pending.relays) || pending.signedEvent.id !== pending.eventId || attemptedEventIds.current.has(pending.eventId)) {
      setPending((current) => current ? { ...current, error: "The event ID or destinations changed, or an attempt already occurred. Close this review and prepare the exact action again." } : current); return;
    }
    const destinations = relays.map((relay) => ({ host: new URL(relay).host, relayUrlSha256: sha256HexText(relay) }));
    const started = await record("NOSTR_ACTION_ATTEMPTED", { stage: "public-feed-relay-broadcast", kind: pending.signedEvent.kind, eventId: pending.eventId, contentSha256: pending.contentHash, relayDestinations: destinations, rightsAndConsentConfirmed: true, broadcastAuthorized: true });
    if (!started) { setPending((current) => current ? { ...current, error: "The broadcast-intent receipt could not be saved; the event was not sent." } : current); return; }
    attemptedEventIds.current.add(pending.eventId);
    setPending((current) => current ? { ...current, busy: true, error: "" } : current);
    try {
      const results = await publishToRelays(relays, pending.signedEvent);
      setPublished({ eventId: pending.eventId, label: pending.label, results });
      const acceptedCount = results.filter((item) => item.accepted).length;
      const evidence = results.map((item) => ({ host: item.host, relayUrlSha256: sha256HexText(item.relay), accepted: item.accepted, outcome: item.outcome, response: item.response, notices: item.notices }));
      const resultReceipt = await record("NOSTR_ACTION_RESULT", { stage: "public-feed-relay-broadcast", outcome: acceptedCount ? "relay-acknowledged" : "no-positive-relay-acknowledgement", eventId: pending.eventId, contentSha256: pending.contentHash, relayResults: evidence });
      setPending(null);
      if (acceptedCount) notify(`${acceptedCount} of ${results.length} selected relays positively acknowledged this event. This does not prove propagation or permanence.`);
      else notify("No selected relay positively acknowledged this event. A timeout may still have reached a relay; do not repeat the same event automatically.");
      if (!resultReceipt) notify("Relay results were received, but the result receipt could not be saved. Inspect the outcomes and do not retry blindly.");
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : "Publication result is unknown.";
      await record("NOSTR_ACTION_RESULT", { stage: "public-feed-relay-broadcast", outcome: "result-unknown-do-not-retry", eventId: pending.eventId, contentSha256: pending.contentHash, reason });
      setPending((current) => current ? { ...current, busy: false, error: `Outcome uncertain: ${reason}. Do not retry this event ID.` } : current);
      notify("Broadcast outcome is uncertain. The exact event ID is blocked from automatic retry.");
    }
  };

  const fetchParent = async (branchEvent: NostrEvent) => {
    const branch = records.find((item) => item.event.id === branchEvent.id)?.branch;
    if (!branch || feedBusy) return;
    let relays: string[];
    try { relays = parseRelayUrls(relayText); }
    catch (error) { notify(error instanceof Error ? error.message : "Select relay destinations first."); return; }
    const confirmed = window.confirm(`Make an exact-ID read-only query for this branch's parent on the selected relays?\n\nEvent ID: ${branch.parentEventId}\nExpected author key: ${branch.parentAuthorPubkey}\n\nThe relay operators may observe your IP address. TruthTalk will not fetch any node URLs or media.`);
    if (!confirmed) return;
    const hosts = relays.map((relay) => new URL(relay).host);
    const started = await record("FEED_LOOKUP_STARTED", { relayHosts: hosts, parentEventId: branch.parentEventId, expectedAuthorPubkeySha256: sha256HexText(branch.parentAuthorPubkey), queryScope: "exact event id", userConfirmed: true });
    if (!started) { notify("The parent-query receipt could not be saved; no relay query was sent."); return; }
    setFeedBusy(true);
    try {
      const result = await fetchNostrParent(relays, branch.parentEventId, branch.parentAuthorPubkey);
      const found = result.entries.find((item) => item.event.id === branch.parentEventId);
      let status: ParentStatus = "UNRESOLVED";
      if (found) status = found.event.pubkey !== branch.parentAuthorPubkey ? "WRONG AUTHOR KEY" : found.valid ? "RESOLVED · SIGNATURE VALID" : "FOUND · SIGNATURE INVALID";
      setParentStatuses((current) => ({ ...current, [branchEvent.id]: status }));
      if (found) setResolvedParents((current) => ({ ...current, [branchEvent.id]: toFeedRecordEntry(found) }));
      else setResolvedParents((current) => { const next = { ...current }; delete next[branchEvent.id]; return next; });
      await record("FEED_LOOKUP_COMPLETED", { queryScope: "exact event id", parentEventId: branch.parentEventId, expectedAuthorPubkeySha256: sha256HexText(branch.parentAuthorPubkey), outcome: status, relayOutcomes: result.relayResults.map((item) => ({ host: item.host, outcome: item.outcome, ...(item.error ? { error: item.error } : {}) })) });
      notify(status === "RESOLVED · SIGNATURE VALID" ? "Exact parent event and expected author key were found; its signature verifies." : `Parent check result: ${status}. The child branch's own signature state is separate.`);
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 240) : "Parent lookup failed.";
      setParentStatuses((current) => ({ ...current, [branchEvent.id]: "UNRESOLVED" }));
      await record("FEED_LOOKUP_FAILED", { queryScope: "exact event id", parentEventId: branch.parentEventId, outcome: "UNRESOLVED", reason });
      notify("Parent is unresolved. TruthTalk did not query the referenced node or fetch its media.");
    } finally { setFeedBusy(false); }
  };

  const recordMediaAttempt = async (event: NostrEvent, sourceUrl: string, expectedDigest: string, stage: "requested" | "failed", reason?: string) => {
    const safeUrl = safePublicHttpsUrl(sourceUrl);
    const saved = await record("MEDIA_URL_VERIFIED", {
      stage,
      outcome: stage === "requested" ? "user-confirmed-request" : "unverifiable",
      eventId: event.id,
      mediaUrlSha256: sha256HexText(safeUrl),
      host: new URL(safeUrl).host,
      expectedSha256: expectedDigest,
      ...(reason ? { reason: reason.slice(0, 240) } : {}),
    });
    if (!saved) notify("The media request state could not be saved to this browser's local receipt ledger.");
    return saved;
  };

  const recordMediaVerification = async (event: NostrEvent, result: MediaVerificationEvidence) => {
    const saved = await record("MEDIA_HASH_RESULT", {
      eventId: event.id,
      mediaUrlSha256: sha256HexText(result.sourceUrl),
      expectedSha256: result.expectedDigest,
      observedSha256: result.digest,
      digestMatches: result.matches,
      bytes: result.bytes,
      responseMime: result.mediaType,
      verifiedAt: result.verifiedAt,
    });
    if (!saved) notify("The video hash result could not be saved to this browser's local receipt ledger.");
    return saved;
  };

  const changeFilter = (key: "hiddenEventIds" | "mutedPubkeys", value: string, enabled: boolean) => {
    const current = filters[key];
    const nextValues = enabled ? [...new Set([...current, value])] : current.filter((item) => item !== value);
    updateFilters({ ...filters, [key]: nextValues }, key === "hiddenEventIds" ? enabled ? "Event hidden" : "Event unhidden" : enabled ? "Public key muted" : "Public key unmuted");
  };

  const closeReview = async () => {
    if (pending?.signedEvent) await record("NOSTR_ACTION_RESULT", { stage: "signed-event-review-closed", eventId: pending.eventId, networkBroadcast: false });
    setPending(null);
  };

  const jumpToEvent = (eventId: string) => {
    setView("feed");
    setShowLocallyFiltered(true);
    window.setTimeout(() => document.getElementById(`event-${eventId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const menu: Array<{ id: FeedView; label: string; title: string }> = [
    { id: "feed", label: "Feed", title: "Selected relays" },
    { id: "discovery", label: "Discovery", title: "Reasoned claims" },
    { id: "claim", label: "IP claim", title: "Self-declared packet" },
    { id: "media", label: "Short video / files", title: "Media attestations" },
    { id: "branch", label: "Branch", title: "Build from evidence" },
    { id: "endorse", label: "Endorse", title: "A reason, not a like" },
  ];

  return <div className="module">
    <SectionHeader number="07" eyebrow="NOSTR · USER-SELECTED RELAYS · KEY-SIGNATURE CHECKS" title="4Reels verified feed" description="A browser-local client for signed posts, branches, reasoned endorsements, short-video and file attestations. A valid key signature is not real-world identity verification or proof that a post is true." action={<StatusPill tone={readResult ? "good" : "neutral"}>{readResult ? `${validCount} valid key signatures` : "No relay read yet"}</StatusPill>} />
    <div className="notice warning"><ShieldCheck size={17} /><p><strong>“Verified” means only key-level cryptographic validity.</strong> Hashes and signatures do not eliminate catfishing, prove a human identity, validate the content, prove capture time, or establish ownership. Relay support, moderation, retention, and distribution vary.</p></div>
    {!ageOk ? <section className="ageGate" aria-labelledby="feed-age-title"><div className="ageGateIcon"><CircleAlert size={22} /></div><div><p className="eyebrow">PUBLIC-FEED SELF-ATTESTATION</p><h2 id="feed-age-title">Before entering the public feed</h2><p>TruthTalk's hosted user-content surface is intended for adults 18 and older. This is a self-attestation only; it does not collect your date of birth and does not verify your age.</p><button className="button primary" type="button" onClick={acceptAgeGate}>I confirm I am 18 or older</button></div></section> : <>
      <nav className="feedTabs" aria-label="4Reels workspaces">{menu.map((item) => <button type="button" key={item.id} className={view === item.id ? "selected" : ""} aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}</button>)}</nav>
      <section className="panel feedRelayPanel"><div className="panelTop"><div><p className="eyebrow">USER-ENTERED DESTINATIONS · NO DEFAULTS</p><h2>Choose where to read</h2></div><StatusPill tone="warn">No requests until you click</StatusPill></div><label className="field"><span className="fieldLabel">Nostr relay URLs · wss:// · up to five</span><textarea rows={3} maxLength={1_500} disabled={feedBusy || Boolean(pending)} value={relayText} onChange={(event) => setRelayText(event.target.value)} autoComplete="off" aria-describedby="relay-disclosure" /><small id="relay-disclosure" className="fieldHint">Relays can observe your IP and query. TruthTalk reads only kinds {FEED_KINDS.join(", ")} and stores no event text in the receipt ledger. This list is held in this tab, not prefilled or contacted automatically.</small></label><div className="buttonRow"><button className="button primary" type="button" disabled={feedBusy || !relayText.trim() || Boolean(pending)} onClick={() => void readSelectedRelays()}>{feedBusy ? <LoaderCircle className="spin" size={15} /> : <Radio size={15} />} {feedBusy ? "Contacting selected relays…" : "Read selected relays"}</button><button className="button secondary" type="button" disabled={!signerAvailable || signerBusy || Boolean(pending)} onClick={() => void connectSigner()}>{signerBusy ? <LoaderCircle className="spin" size={15} /> : <ShieldCheck size={15} />} {signerPubkey ? `Signer ${signerPubkey.slice(0, 10)}…` : signerAvailable ? "Connect NIP-07 signer" : "No NIP-07 signer detected"}</button>{readResult ? <StatusPill tone="neutral">Last read {new Date(readResult.retrievedAt).toLocaleTimeString()}</StatusPill> : null}</div>{feedError ? <p className="fine warningText" role="alert">{feedError}</p> : null}</section>
      <div className="feedSafetyStrip"><TriangleAlert size={15} /><p>Do not publish credentials, private keys, tokens, confidential documents, private contact details, or identifiable people without appropriate rights and consent. Local hide/mute affects only this browser. Reports and deletion requests are separate signed events and may not remove content from relays or media hosts.</p></div>
      {view === "feed" ? <section className="feedWorkspace"><div className="feedResultsHeader"><div><p className="eyebrow">CURRENT CLIENT RESULTS</p><h2>{records.length ? `${records.length} events observed` : "No events loaded"}</h2><p className="fine">{records.length ? `${validCount} key signatures valid · ${invalidCount} invalid · ${readResult?.malformedCount ?? 0} malformed event frame(s) omitted.` : "No test or sample posts are seeded. Read a relay you select above."}</p></div>{records.length ? <label className="consentCheck"><input type="checkbox" checked={showLocallyFiltered} onChange={(event) => setShowLocallyFiltered(event.target.checked)} /><span>Include locally hidden / muted items</span></label> : null}</div>
        {readResult?.relayResults.length ? <div className="relayReadResults" aria-label="Per-relay read outcomes">{readResult.relayResults.map((item) => <div className="relayReadResult" key={item.relay}><StatusPill tone={item.outcome === "EOSE" ? "good" : item.outcome === "TIMEOUT" || item.outcome === "CLOSED" ? "warn" : "bad"}>{item.outcome}</StatusPill><code>{item.host}</code><span>{item.events.length} event frame(s){item.error ? ` · ${item.error}` : ""}{item.notices.length ? ` · ${item.notices.join("; ")}` : ""}</span></div>)}</div> : null}
        {visibleRecords.length ? <div className="feedList">{visibleRecords.map((feedRecord) => <FeedEntryCard
          key={feedRecord.event.id}
          record={feedRecord}
          records={records}
          signerPubkey={signerPubkey}
          localHidden={filters.hiddenEventIds.includes(feedRecord.event.id)}
          localMuted={filters.mutedPubkeys.includes(feedRecord.event.pubkey)}
          parentStatus={parentStatuses[feedRecord.event.id]}
          resolvedParent={resolvedParents[feedRecord.event.id]}
          onHide={(id, hidden) => changeFilter("hiddenEventIds", id, hidden)}
          onMute={(pubkey, muted) => changeFilter("mutedPubkeys", pubkey, muted)}
          onBranch={(event) => { setSelectedParent(event); setView("branch"); }}
          onEndorse={(event) => { setSelectedTarget(event); setView("endorse"); }}
          onPrepare={preparePublication}
          onFetchParent={(event) => void fetchParent(event)}
          onMediaAttempt={recordMediaAttempt}
          onMediaVerification={recordMediaVerification}
        />)}</div> : records.length ? <div className="emptyState"><span className="emptyIndex">LOCAL FILTER</span><div><h2>All loaded events are hidden or muted locally</h2><p>Show locally filtered events above, or unhide/unmute them. This setting does not send a mute list to relays.</p></div></div> : <div className="emptyState"><span className="emptyIndex">01 / NO SEED DATA</span><div><h2>Nothing is shown until you read a relay</h2><p>TruthTalk contains no fake accounts, sample posts, preview media, or fabricated activity. Enter exact relay URLs and deliberately request the feed.</p></div></div>}
      </section> : null}
      {view === "discovery" ? <DiscoveryPanel records={records} onOpenEvent={jumpToEvent} /> : null}
      {view === "claim" ? <ClaimComposer signerPubkey={signerPubkey} record={record} notify={notify} onPrepare={preparePublication} /> : null}
      {view === "media" ? <MediaComposer record={record} notify={notify} onPrepare={preparePublication} /> : null}
      {view === "branch" ? <BranchComposer key={selectedParent?.id ?? "manual-parent"} selectedParent={selectedParent} onPrepare={preparePublication} /> : null}
      {view === "endorse" ? <EndorsementComposer key={selectedTarget?.id ?? "manual-target"} selectedTarget={selectedTarget} onPrepare={preparePublication} /> : null}
      <p className="fine feedNonGuarantee">A valid signature and matching bytes are limited technical statements. They do not establish a person, fact, ownership right, provenance of capture, relay permanence, or universal moderation. “4Reels” is a working title pending trademark review.</p>
    </>}
    {published ? <section className="panel publishedResult"><div className="panelTop"><div><p className="eyebrow">OBSERVED AFTER EXPLICIT BROADCAST</p><h2>{published.label}</h2><p>Event ID <code>{published.eventId}</code></p></div><StatusPill tone={published.results.some((item) => item.accepted) ? "good" : "warn"}>{published.results.filter((item) => item.accepted).length}/{published.results.length} relays acknowledged</StatusPill></div><div className="relayOutcome" aria-label="Actual per-relay broadcast responses">{published.results.map((result) => <div className="relayResult" key={result.relay}><StatusPill tone={result.accepted ? "good" : result.outcome === "REJECTED" || result.outcome === "ERROR" ? "bad" : "warn"}>{result.outcome}</StatusPill><code>{result.host}</code><span>{result.response}{result.notices.map((notice, index) => <span className="relayNotice" key={`${index}-${notice}`}>NOTICE: {notice}</span>)}</span></div>)}</div><p className="fine">A positive `OK` is a relay acknowledgement for this event ID. It is not a guarantee of propagation, retention, visibility, identity, truth, or exclusive ownership. Notices and non-positive responses are shown per relay. No retry was scheduled.</p></section> : null}
    {pending ? <div className="eventReviewBackdrop"><section className="eventReviewDialog" role="dialog" aria-modal="true" aria-labelledby="event-review-title"><div className="panelTop"><div><p className="eyebrow">EXACT EVENT · SEPARATE SIGN AND BROADCAST</p><h2 id="event-review-title">Review before signing</h2><p className="fine">{pending.label}. Signing creates a key-level cryptographic statement; it does not verify a real-world person or the claim.</p></div><button className="linkButton" type="button" disabled={pending.busy} onClick={() => void closeReview()}>Close</button></div><div className="reviewEventMeta"><div><span>EVENT KIND</span><code>{pending.unsigned.kind}</code></div><div><span>SIGNING KEY</span><code>{pending.pubkey}</code></div><div><span>EXPECTED NIP-01 EVENT ID</span><code>{pending.eventId}</code></div><div><span>CONTENT SHA-256</span><code>{pending.contentHash}</code></div></div><p className="fieldLabel">EXACT RELAY DESTINATIONS</p><div className="destinationList">{pending.relays.map((relay) => <code key={relay}>{relay}</code>)}</div><p className="fieldLabel">EXACT TAGS</p><pre className="eventTagPreview">{JSON.stringify(pending.unsigned.tags, null, 2)}</pre><p className="fieldLabel">EXACT CONTENT TO BE SIGNED</p><pre className="exactPayload">{pending.unsigned.content}</pre>
      {!pending.signedEvent ? <><label className="consentCheck"><input type="checkbox" checked={pending.rightsChecked} disabled={pending.busy} onChange={(event) => setPending((current) => current ? { ...current, rightsChecked: event.target.checked } : current)} /><span>I have the necessary rights to share this material, and this exact public content is mine to approve.</span></label><label className="consentCheck"><input type="checkbox" checked={pending.peopleChecked} disabled={pending.busy} onChange={(event) => setPending((current) => current ? { ...current, peopleChecked: event.target.checked } : current)} /><span>I have consent for identifiable people shown or recorded, or no identifiable person is shown.</span></label><label className="consentCheck"><input type="checkbox" checked={pending.publicChecked} disabled={pending.busy} onChange={(event) => setPending((current) => current ? { ...current, publicChecked: event.target.checked } : current)} /><span>I inspected this exact event and did not include credentials, private keys, tokens, personal information, or confidential material I should keep private.</span></label><button className="button secondary" type="button" disabled={pending.busy || !pending.rightsChecked || !pending.peopleChecked || !pending.publicChecked} onClick={() => void signPreparedEvent()}>{pending.busy ? <LoaderCircle className="spin" size={15} /> : <ShieldCheck size={15} />} {pending.busy ? "Waiting for signer…" : "Ask my signer to sign this event"}</button></> : <><div className="notice"><ShieldCheck size={16} /><p>The signer returned the exact event ID above; its BIP-340 signature was verified locally. No relay has been contacted yet.</p></div><label className="consentCheck"><input type="checkbox" checked={pending.broadcastChecked} disabled={pending.busy} onChange={(event) => setPending((current) => current ? { ...current, broadcastChecked: event.target.checked } : current)} /><span>I authorize public broadcast of this exact signed event to only the relay destinations listed above. Those operators may retain or redistribute it.</span></label><button className="button danger" type="button" disabled={pending.busy || !pending.broadcastChecked} onClick={() => void publishPreparedEvent()}>{pending.busy ? <LoaderCircle className="spin" size={15} /> : <Radio size={15} />} {pending.busy ? "Waiting for relay outcomes…" : "Broadcast this signed event"}</button></>}
      {pending.error ? <p className="fine warningText" role="alert">{pending.error}</p> : null}<p className="fine">A failed, timed-out, or uncertain attempt is not automatically retried. Check each relay’s actual response before taking further action.</p></section></div> : null}
  </div>;
}

function validCountFrom(records: FeedRecord[]): number { return records.filter((item) => item.signatureValid).length; }
