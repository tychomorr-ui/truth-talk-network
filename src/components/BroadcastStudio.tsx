import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, LoaderCircle, Megaphone, Radio, Save, ShieldCheck, TriangleAlert } from "lucide-react";
import { broadcasts, CHANNELS, sha256, type Broadcast, type Channel, type OpportunityDraftContext, type Profile } from "../lib/truthTalk";
import { connectNostrSigner, getNostrSigner, parseRelayUrls, publishToRelays, signNostrDraft, type RelayResult } from "../lib/nostr";
import { loadRelays, saveRelays } from "../lib/storage";
import type { ReceiptKind } from "../lib/receipts";
import { EmptyState, Field, SectionHeader, StatusPill } from "./ui";

type RecordFn = (kind: ReceiptKind, details: Record<string, unknown>) => Promise<boolean>;
const labels: Record<Channel, string> = { NOSTR: "Nostr", GITHUB: "GitHub", REDDIT: "Reddit", DISCORD: "Discord", LINKEDIN: "LinkedIn", HACKER_NEWS: "Hacker News" };

export function BroadcastStudio({ profile, opportunity, record, notify }: { profile: Profile; opportunity: OpportunityDraftContext | null; record: RecordFn; notify: (message: string) => void }) {
  const [selected, setSelected] = useState<Channel[]>(["NOSTR"]);
  const [drafts, setDrafts] = useState<Broadcast[]>([]);
  const [bodyByChannel, setBodyByChannel] = useState<Partial<Record<Channel, string>>>({});
  const [approvedHash, setApprovedHash] = useState<Partial<Record<Channel, string>>>({});
  const [relayText, setRelayText] = useState(() => { try { return loadRelays().join("\n"); } catch { return ""; } });
  const [signerPubkey, setSignerPubkey] = useState("");
  const [consent, setConsent] = useState<{ hash: string; relays: string[]; checked: boolean } | null>(null);
  const [relayResults, setRelayResults] = useState<RelayResult[] | null>(null);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState("");
  const signerPresent = Boolean(getNostrSigner());
  const hasDraftBasis = profile.projectName.trim().length >= 2 && profile.oneLine.trim().length >= 12;

  const hashFor = async (channel: Channel, body: string) => sha256({ channel, body });
  const currentBodies = useMemo(() => bodyByChannel, [bodyByChannel]);
  const setBody = (channel: Channel, value: string) => {
    setBodyByChannel((current) => ({ ...current, [channel]: value }));
    setApprovedHash((current) => ({ ...current, [channel]: undefined }));
    setConsent(null);
    setRelayResults(null);
  };
  const toggleChannel = (channel: Channel) => setSelected((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]);

  const buildDrafts = async () => {
    if (!selected.length || working || !hasDraftBasis) return;
    setWorking(true); setRelayResults(null); setConsent(null);
    try {
      const result = await broadcasts(profile, selected, opportunity);
      const bodies: Partial<Record<Channel, string>> = {};
      for (const draft of result.drafts) bodies[draft.channel] = draft.body;
      setDrafts(result.drafts); setBodyByChannel(bodies); setApprovedHash({});
      const saved = await record("DRAFTS_CREATED", { profileAndContextSha256: result.fingerprint, opportunityId: opportunity?.id ?? null, sourceUrl: opportunity?.sourceUrl ?? null, sourceRetrievedAt: opportunity?.retrievedAt ?? null, draftHashes: result.drafts.map((draft) => ({ channel: draft.channel, contentSha256: draft.contentHash })), outboundAction: "none" });
      notify(saved ? "Drafts created locally. Nothing has been published." : "Drafts were created locally, but the ledger receipt could not be saved.");
    } catch { notify("Draft generation failed locally."); }
    finally { setWorking(false); }
  };

  const approve = async (channel: Channel) => {
    const body = currentBodies[channel] ?? "";
    const contentHash = await hashFor(channel, body);
    const saved = await record("DRAFT_APPROVED", { channel, contentSha256: contentHash, approvalScope: channel === "NOSTR" ? "exact text for later consent-gated public Nostr action" : "exact text approved for local copy only" });
    if (saved) {
      setApprovedHash((current) => ({ ...current, [channel]: contentHash }));
      setConsent(null); setRelayResults(null);
      notify(channel === "NOSTR" ? "This exact text is approved as a draft. It is still private." : "Approved for local copy only. No destination was contacted.");
    }
  };

  const copyDraft = async (channel: Channel) => {
    const body = currentBodies[channel] ?? "";
    const expected = await hashFor(channel, body);
    if (approvedHash[channel] !== expected) { notify("Approve the exact current text before copying it."); return; }
    try { await navigator.clipboard.writeText(body); setCopied(channel); notify("Copied locally. TruthTalk did not publish or send it."); }
    catch { notify("Clipboard access is unavailable. Nothing was sent."); }
  };

  const persistRelays = () => {
    try {
      const relays = parseRelayUrls(relayText);
      saveRelays(relays);
      setRelayText(relays.join("\n")); setConsent(null); setRelayResults(null);
      notify(`${relays.length} relay${relays.length === 1 ? "" : "s"} saved in this browser. No connection was opened.`);
    } catch (error) { notify(error instanceof Error ? error.message : "Relay configuration is invalid."); }
  };

  const connectSigner = async () => {
    if (working) return;
    setWorking(true);
    const intent = await record("NOSTR_ACTION_ATTEMPTED", { stage: "browser-signer-access", destination: "operator-installed NIP-07 extension", networkBroadcast: false });
    if (!intent) { setWorking(false); return; }
    try {
      const pubkey = await connectNostrSigner();
      setSignerPubkey(pubkey);
      await record("NOSTR_ACTION_RESULT", { stage: "browser-signer-access", outcome: "public-key-returned", publicKeySha256: await sha256(pubkey), networkBroadcast: false });
      notify("Signer authorized for this tab. No key was imported or stored.");
    } catch {
      await record("NOSTR_ACTION_RESULT", { stage: "browser-signer-access", outcome: "missing-rejected-or-cancelled", networkBroadcast: false });
      notify("Signer access was not granted. No event was sent.");
    } finally { setWorking(false); }
  };

  const reviewPublication = async () => {
    const body = currentBodies.NOSTR ?? "";
    const hash = await hashFor("NOSTR", body);
    if (approvedHash.NOSTR !== hash) { notify("Approve the exact Nostr text before opening the publication consent gate."); return; }
    try {
      const relays = parseRelayUrls(relayText);
      setConsent({ hash, relays, checked: false }); setRelayResults(null);
    } catch (error) { notify(error instanceof Error ? error.message : "Choose valid relay destinations first."); }
  };

  const publish = async () => {
    if (!consent || !consent.checked || !signerPubkey || working) return;
    const body = currentBodies.NOSTR ?? "";
    const hash = await hashFor("NOSTR", body);
    let relays: string[];
    try { relays = parseRelayUrls(relayText); }
    catch (error) { setConsent(null); notify(error instanceof Error ? error.message : "Relay list changed."); return; }
    if (approvedHash.NOSTR !== hash || consent.hash !== hash || JSON.stringify(relays) !== JSON.stringify(consent.relays)) {
      setConsent(null); notify("Text or relay destinations changed. Review and approve the exact payload again."); return;
    }
    setWorking(true); setRelayResults(null);
    const relayEvidence = await Promise.all(relays.map(async (relay) => ({ host: new URL(relay).host, relayUrlSha256: await sha256(relay) })));
    const intentSaved = await record("NOSTR_ACTION_ATTEMPTED", { stage: "public-relay-publication", contentSha256: hash, relayDestinations: relayEvidence, eventKind: 1, consent: true });
    if (!intentSaved) { setWorking(false); return; }
    try {
      const event = await signNostrDraft(signerPubkey, body);
      const results = await publishToRelays(relays, event);
      setRelayResults(results);
      const accepted = results.filter((result) => result.accepted).length;
      const resultEvidence = await Promise.all(results.map(async ({ relay, host, accepted: ok, response }) => ({ host, relayUrlSha256: await sha256(relay), accepted: ok, response })));
      const resultsHash = await sha256(resultEvidence);
      const logged = await record("NOSTR_ACTION_RESULT", { stage: "public-relay-publication", outcome: accepted ? "relay-acknowledged" : "no-positive-relay-acknowledgement", eventId: event.id, contentSha256: hash, relayResults: resultEvidence, resultsSha256: resultsHash });
      if (accepted) notify(`${accepted} of ${results.length} relay${results.length === 1 ? "" : "s"} acknowledged this event. Check each relay result below.`);
      else notify("No relay positively acknowledged the event. A timed-out attempt may still have reached a relay; do not assume it was not seen.");
      if (!logged) notify("Relay results arrived, but the result receipt could not be saved. Do not retry blindly; inspect the relay outcomes.");
    } catch {
      await record("NOSTR_ACTION_RESULT", { stage: "public-relay-publication", outcome: "signing-cancelled-or-client-error", contentSha256: hash, networkSend: false });
      notify("Signing was cancelled or failed before a relay event was sent. No publication is claimed.");
    } finally { setWorking(false); }
  };

  return <div className="module">
    <SectionHeader number="04" eyebrow="PRIVATE DRAFTS · OUTBOUND ACTIONS OFF BY DEFAULT" title="Broadcast studio" description="Build from your current profile, edit every line, then approve the exact text. Only Nostr has a live, optional publishing path; other destinations are copy-only." action={<StatusPill tone="warn">No post until explicit consent</StatusPill>} />
    <div className="notice"><ShieldCheck size={18} /><p>Drafts contain operator-declared claims, not independently checked facts. Draft creation and approval are local; public actions require a separate destination review and consent step.</p></div>
    <section className="panel"><div className="panelTop"><div><p className="eyebrow">CHANNEL SELECTION</p><h2>Choose a draft format</h2></div><span className="panelIndex">LOCAL ONLY</span></div>
      <div className="choiceRow">{CHANNELS.map((channel) => <button key={channel} type="button" disabled={working} className={`choice ${selected.includes(channel) ? "selected" : ""}`} aria-pressed={selected.includes(channel)} onClick={() => toggleChannel(channel)}>{labels[channel]}</button>)}</div>
      {opportunity ? <p className="fine contextLine"><b>Next draft context:</b> {opportunity.title} · {opportunity.agency} · provider record retrieved {new Date(opportunity.retrievedAt).toLocaleString()}. This will be cited, not represented as an application or eligibility claim. Existing drafts remain unchanged; click Build selected drafts to apply this context.</p> : <p className="fine contextLine">No opportunity record is selected. You can add one from the live Opportunity signals panel; nothing is included automatically.</p>}
      <div className="buttonRow actionSpacing"><button className="button primary" type="button" disabled={!selected.length || working || !hasDraftBasis} onClick={() => void buildDrafts()}>{working ? <LoaderCircle className="spin" size={16} /> : <Megaphone size={16} />} Build selected drafts</button><span className="fine">No network request is made.</span></div>
    </section>
    {!drafts.length ? <EmptyState index="00" title="No drafts created" description={hasDraftBasis ? "Drafts appear only after you choose channels and click Build selected drafts." : "Enter a project name and a one-line description in Signal packet before generating a draft."} /> : <div className="draftList">{drafts.map((draft) => {
      const body = currentBodies[draft.channel] ?? draft.body;
      const isApproved = approvedHash[draft.channel] !== undefined;
      const requiresHumanAuthor = draft.channel === "HACKER_NEWS";
      return <article className="panel draftCard" key={draft.channel}>
        <div className="panelTop"><div><p className="eyebrow">{requiresHumanAuthor ? "HUMAN AUTHORING REQUIRED" : "EDITABLE · NOT PUBLIC"}</p><h2>{labels[draft.channel]}</h2></div><StatusPill tone={isApproved ? "good" : "warn"}>{isApproved ? "Approved exact text" : "Approval required"}</StatusPill></div>
        <Field label="Draft text" hint={requiresHumanAuthor ? "This is only a starting point; a person must author and submit any final post." : "Editing any character invalidates its previous approval."}><textarea rows={9} maxLength={32_000} disabled={working} value={body} onChange={(event) => setBody(draft.channel, event.target.value)} /></Field>
        <ul className="limitationList">{draft.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="buttonRow"><button className="button secondary" type="button" disabled={working || !body.trim()} onClick={() => void approve(draft.channel)}><Check size={15} /> Approve exact text</button><button className="button secondary" type="button" disabled={working || !isApproved} onClick={() => void copyDraft(draft.channel)}><Copy size={15} /> Copy for manual handoff</button>{copied === draft.channel ? <span className="fine">Copied locally.</span> : null}</div>
        {draft.channel === "NOSTR" ? <NostrPublisher
          body={body}
          approved={isApproved}
          signerPresent={signerPresent}
          signerPubkey={signerPubkey}
          relayText={relayText}
          consent={consent}
          results={relayResults}
          busy={working}
          onRelayText={(value) => { setRelayText(value); setConsent(null); setRelayResults(null); }}
          onSaveRelays={persistRelays}
          onConnect={connectSigner}
          onReview={reviewPublication}
          onConsent={(checked) => setConsent((current) => current ? { ...current, checked } : current)}
          onPublish={publish}
        /> : <p className="fine channelBoundary">Manual-copy only. TruthTalk has no live connection for {labels[draft.channel]} and does not claim to publish there.</p>}
      </article>;
    })}</div>}
  </div>;
}

function NostrPublisher({ body, approved, signerPresent, signerPubkey, relayText, consent, results, busy, onRelayText, onSaveRelays, onConnect, onReview, onConsent, onPublish }: {
  body: string; approved: boolean; signerPresent: boolean; signerPubkey: string; relayText: string;
  consent: { hash: string; relays: string[]; checked: boolean } | null; results: RelayResult[] | null; busy: boolean;
  onRelayText: (value: string) => void; onSaveRelays: () => void; onConnect: () => void; onReview: () => void;
  onConsent: (checked: boolean) => void; onPublish: () => void;
}) {
  const approvedTextMatches = useMemo(() => Boolean(approved && body.trim()), [approved, body]);
  return <div className="nostrBox"><div className="subsectionHeading"><div><p className="eyebrow">LIVE CONNECTOR · USER-SIGNED</p><h3><Radio size={17} /> Nostr publication</h3><p>Uses only a detected NIP-07 signer and the relays you enter. TruthTalk never receives or stores your private key.</p></div><StatusPill tone={signerPubkey ? "good" : signerPresent ? "live" : "warn"}>{signerPubkey ? "Signer authorized in tab" : signerPresent ? "Signer detected" : "No signer detected"}</StatusPill></div>
    <Field label="Relay destinations" hint="Enter one relay per line. Only wss:// URLs are accepted; up to five. No relay is preselected or contacted while saving."><textarea rows={3} disabled={busy} value={relayText} onChange={(event) => onRelayText(event.target.value)} placeholder="wss://relay.example" /></Field>
    <div className="buttonRow"><button className="button secondary" type="button" disabled={busy} onClick={onSaveRelays}><Save size={14} /> Validate & save relays locally</button><button className="button secondary" type="button" disabled={!signerPresent || busy} onClick={onConnect}><ShieldCheck size={14} /> Authorize signer</button>{signerPubkey ? <code className="pubkey">{signerPubkey.slice(0, 12)}…{signerPubkey.slice(-8)}</code> : null}</div>
    <div className="publishGate"><div><p className="eyebrow">PUBLIC ACTION GATE</p><h4>Review before any relay connection</h4><p>The exact text above will be signed as a kind-1 event. Relay operators may retain, copy, or redistribute it. The selected relays and final content are rechecked before signing.</p></div><button className="button primary" type="button" disabled={!approvedTextMatches || !signerPubkey || busy} onClick={onReview}>Review exact public action <ExternalLink size={14} /></button></div>
    {consent ? <div className="consentCard" role="group" aria-label="Nostr publication consent"><div className="consentTitle"><TriangleAlert size={18} /><div><strong>Final consent · irreversible public broadcast</strong><p>Destination(s) shown here are the only relays that will be contacted.</p></div></div><div className="destinationList">{consent.relays.map((relay) => <code key={relay}>{relay}</code>)}</div><pre className="exactPayload">{body}</pre><label className="consentCheck"><input type="checkbox" disabled={busy} checked={consent.checked} onChange={(event) => onConsent(event.target.checked)} /><span>I reviewed this exact text and relay list. I authorize TruthTalk to ask my signer to sign and send this public event; relay operators may retain and redistribute it.</span></label><button className="button danger" type="button" disabled={!consent.checked || busy} onClick={onPublish}>{busy ? <LoaderCircle className="spin" size={16} /> : <Radio size={16} />} {busy ? "Signing / waiting for relay acknowledgements…" : "Sign & publish to listed relays"}</button></div> : null}
    {results ? <div className="relayOutcome"><h4>Observed relay outcomes</h4>{results.map((result) => <div className="relayResult" key={result.relay}><StatusPill tone={result.accepted ? "good" : "bad"}>{result.accepted ? "OK · accepted" : "No positive acknowledgement"}</StatusPill><code>{result.host}</code><span>{result.response}</span></div>)}<p className="fine">A relay `OK` acknowledges receipt of this event ID only; it is not a guarantee of permanence, visibility, identity, or truth.</p></div> : null}
  </div>;
}
