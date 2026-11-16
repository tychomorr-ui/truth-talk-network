import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CircleAlert, KeyRound, LoaderCircle, MessageSquare, Radio, Trash2 } from "lucide-react";
import { clearLocalMessengerData, loadLocalIdentity, loadLocalMessage, loadLocalMessages, saveLocalIdentity, saveLocalMessage, type StoredMessage } from "../lib/localMessengerStore";
import { backoffMs, createAcknowledgement, createMessageEnvelope, generateLocalIdentity, MAX_ATTEMPTS, MAX_BACKOFF_MS, MAX_MESSAGE_CODE_POINTS, MESSAGE_CHANNEL, retryPatch, validateLocalIdentity, verifyAcknowledgement, verifyEnvelope, type LocalIdentity, type MessageEnvelope } from "../lib/messaging";
import { sha256HexText } from "../lib/hash";
import type { ReceiptKind } from "../lib/receipts";
import { SectionHeader, StatusPill } from "./ui";

type RecordFn = (kind: ReceiptKind, details: Record<string, unknown>) => Promise<boolean>;
function newTabId(): string { return Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) => byte.toString(16).padStart(2, "0")).join(""); }
function formatCountdown(target?: number, now = Date.now()): string {
  if (!target) return "retry limit reached";
  const remaining = Math.max(0, target - now);
  if (!remaining) return "retry available now";
  const seconds = Math.ceil(remaining / 1_000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}
function statusLabel(message: StoredMessage): string {
  if (message.state === "acknowledged") return "ACKNOWLEDGED · LOCAL TAB";
  if (message.state === "received") return "RECEIVED · LOCAL TAB";
  if (message.state === "cancelled") return "RETRY CANCELLED · NOT RECALLED";
  if (message.state === "failed") return "RETRY LIMIT / ERROR · DELIVERY MAY BE UNKNOWN";
  return "PENDING · LOCAL CHANNEL";
}

export function LocalMessengerPanel({ record, notify }: { record: RecordFn; notify: (message: string) => void }) {
  const [identity, setIdentity] = useState<LocalIdentity | null>(null);
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelRequested, setChannelRequested] = useState(false);
  const [channelReady, setChannelReady] = useState(false);
  const [channelError, setChannelError] = useState("");
  const [storeError, setStoreError] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const [tabId] = useState(newTabId);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const upsertMessage = useCallback((message: StoredMessage) => {
    setMessages((current) => {
      const next = current.filter((item) => item.id !== message.id);
      next.push(message);
      return next.sort((left, right) => left.envelope.created_at - right.envelope.created_at);
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([loadLocalIdentity(), loadLocalMessages()]).then(([storedIdentity, storedMessages]) => {
      if (!active) return;
      if (storedIdentity && !validateLocalIdentity(storedIdentity)) {
        setStoreError("The saved messenger key pair does not validate. It was not used; delete it before creating a new identity.");
        setIdentity(null);
      } else {
        setIdentity(storedIdentity);
      }
      setMessages(storedMessages);
    }).catch((error) => {
      if (active) setStoreError(error instanceof Error ? error.message : "IndexedDB could not be read.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!channelRequested || !identity) return;
    if (typeof BroadcastChannel === "undefined") {
      setChannelError("BroadcastChannel is unavailable in this browser."); setChannelReady(false); return;
    }
    let active = true;
    const channel = new BroadcastChannel(MESSAGE_CHANNEL);
    channelRef.current = channel;
    setChannelError(""); setChannelReady(true);

    const handleMessage = async (value: unknown) => {
      if (!active) return;
      const verification = await verifyEnvelope(value, identity.publicKey);
      if (!verification.ok) { setChannelError(`Same-origin message rejected: ${verification.reason}`); return; }
      const envelope = verification.envelope;
      if (envelope.sender_tab_id === tabId) return;
      if (envelope.recipient_tab_id && envelope.recipient_tab_id !== tabId) return;

      if (envelope.type === "ack") {
        const target = envelope.in_reply_to ? await loadLocalMessage(envelope.in_reply_to) : null;
        if (!target || target.direction !== "outgoing" || !(await verifyAcknowledgement(envelope, target.envelope, identity.publicKey))) return;
        const acknowledged: StoredMessage = { ...target, state: "acknowledged", nextRetryAt: undefined, acknowledgement: envelope, reason: undefined };
        await saveLocalMessage(acknowledged); upsertMessage(acknowledged);
        const saved = await record("LOCAL_MESSAGE_STATE", { direction: "outgoing", state: "acknowledged", messageId: envelope.in_reply_to, acknowledgementMessageId: envelope.msg_id, acknowledgementCid: envelope.cid, bodyStoredSeparately: true });
        notify(saved ? "A separate TruthTalk tab acknowledged this message. This proves only same-origin key/tab activity." : "A local acknowledgement arrived, but its receipt could not be recorded.");
        return;
      }

      let received = await loadLocalMessage(envelope.msg_id);
      if (!received) {
        received = { id: envelope.msg_id, envelope, direction: "incoming", state: "received", attempts: 1, receivedAt: new Date().toISOString() };
        await saveLocalMessage(received); upsertMessage(received);
        const saved = await record("LOCAL_MESSAGE_STATE", { direction: "incoming", state: "received", messageId: envelope.msg_id, cid: envelope.cid, bodyStoredSeparately: true });
        if (!saved) { setChannelError("Message was persisted locally, but the receipt could not be saved; no acknowledgement was sent."); return; }
      }
      let acknowledgement = received.acknowledgement;
      if (!acknowledgement) {
        acknowledgement = await createAcknowledgement(envelope, identity, tabId);
        const withAck = { ...received, acknowledgement };
        await saveLocalMessage(withAck); upsertMessage(withAck);
        const saved = await record("LOCAL_MESSAGE_STATE", { direction: "incoming", state: "acknowledgement-prepared", messageId: envelope.msg_id, cid: envelope.cid, acknowledgementMessageId: acknowledgement.msg_id, acknowledgementCid: acknowledgement.cid, bodyStoredSeparately: true });
        if (!saved) { setChannelError("The message was stored, but the acknowledgement receipt failed; no acknowledgement was posted."); return; }
      }
      channel.postMessage(acknowledgement);
      notify("A local tab received the message and returned a signed acknowledgement. It does not verify a remote person or peer.");
    };

    channel.onmessage = (event: MessageEvent<unknown>) => { void handleMessage(event.data).catch((error) => setChannelError(error instanceof Error ? error.message : "Same-origin message handling failed.")); };
    channel.onmessageerror = () => setChannelError("The local channel could not deserialize a same-origin message.");
    return () => {
      active = false; channel.close();
      if (channelRef.current === channel) channelRef.current = null;
      setChannelReady(false);
    };
  }, [channelRequested, identity, tabId, record, notify, upsertMessage]);

  const createIdentity = async () => {
    if (identity || busy) return;
    if (!window.confirm("Create a separate Ed25519 messenger key and store its private key in this browser's IndexedDB? The key is unencrypted; same-origin scripts can access it. It will not be reused for Nostr, VALKYRIE, or a mesh node.")) return;
    const intent = await record("LOCAL_MESSAGE_STATE", { action: "identity-creation-requested", storage: "browser IndexedDB", keySeparation: "messenger only" });
    if (!intent) { notify("The identity-creation receipt could not be saved; no key was generated."); return; }
    setBusy(true); setStoreError("");
    try {
      const generated = generateLocalIdentity();
      await saveLocalIdentity(generated);
      setIdentity(generated);
      const saved = await record("LOCAL_MESSAGE_STATE", { action: "identity-created", publicKeySha256: sha256HexText(generated.publicKey), storage: "browser IndexedDB", encrypted: false, bodyStoredSeparately: true });
      notify(saved ? "Separate local messenger identity created. Its private key is stored only in this browser's IndexedDB." : "Identity was created but its result receipt could not be saved.");
    } catch (error) { setStoreError(error instanceof Error ? error.message : "A local messenger identity could not be created."); }
    finally { setBusy(false); }
  };

  const sendMessage = async () => {
    if (!identity || !channelReady || !channelRef.current || !body.trim() || busy) return;
    setBusy(true); setStoreError("");
    try {
      const previousCid = [...messages].reverse().find((message) => message.direction === "outgoing")?.envelope.cid;
      const envelope = await createMessageEnvelope({ privateKey: identity.privateKey, senderTabId: tabId, body, previousCid, createdAt: Date.now() });
      const stored: StoredMessage = { id: envelope.msg_id, envelope, direction: "outgoing", state: "pending", attempts: 1, nextRetryAt: Date.now() + backoffMs(1), receivedAt: new Date().toISOString() };
      const saved = await record("LOCAL_MESSAGE_STATE", { direction: "outgoing", state: "pending", messageId: envelope.msg_id, cid: envelope.cid, attempts: 1, nextRetryAt: stored.nextRetryAt, bodyStoredSeparately: true });
      if (!saved) { notify("The local message receipt could not be saved; the message was not broadcast to other tabs."); return; }
      await saveLocalMessage(stored); upsertMessage(stored);
      channelRef.current.postMessage(envelope);
      setBody("");
      notify("Signed envelope sent to the same-origin BroadcastChannel. It was not sent to a server or remote peer.");
    } catch (error) { setStoreError(error instanceof Error ? error.message : "Local message was not sent."); }
    finally { setBusy(false); }
  };

  const manualRetry = async (message: StoredMessage) => {
    if (!identity || !channelReady || !channelRef.current || busy || message.direction !== "outgoing" || message.state === "acknowledged" || message.state === "cancelled" || (message.nextRetryAt && Date.now() < message.nextRetryAt) || message.attempts >= MAX_ATTEMPTS) return;
    setBusy(true); setStoreError("");
    try {
      const nextAttempts = message.attempts + 1;
      const retry = retryPatch(nextAttempts, "Manual retry requested by the author; automatic retries are disabled.", Date.now());
      const atLimit = nextAttempts >= MAX_ATTEMPTS;
      const updated: StoredMessage = { ...message, state: atLimit ? "failed" : "pending", attempts: nextAttempts, ...(atLimit ? { nextRetryAt: undefined, reason: "20 local attempts reached; acknowledgement may still arrive." } : { nextRetryAt: retry.next_retry_at, reason: retry.reason }) };
      const saved = await record("LOCAL_MESSAGE_STATE", { direction: "outgoing", state: updated.state, messageId: message.id, cid: message.envelope.cid, attempts: nextAttempts, ...(updated.nextRetryAt ? { nextRetryAt: updated.nextRetryAt } : {}), manualRetry: true, bodyStoredSeparately: true });
      if (!saved) { notify("Retry receipt could not be saved; this message was not retransmitted."); return; }
      await saveLocalMessage(updated); upsertMessage(updated);
      channelRef.current.postMessage(message.envelope);
      notify(atLimit ? "Final local attempt sent; retry limit reached. A later acknowledgement is still possible." : `Message manually retried. Next retry window: ${formatCountdown(updated.nextRetryAt)}.`);
    } catch (error) { setStoreError(error instanceof Error ? error.message : "Local message retry failed."); }
    finally { setBusy(false); }
  };

  const cancelRetry = async (message: StoredMessage) => {
    if (busy || message.direction !== "outgoing" || message.state !== "pending") return;
    const updated: StoredMessage = { ...message, state: "cancelled", nextRetryAt: undefined, reason: "Author cancelled future manual retries; a message already received in another tab cannot be recalled." };
    const saved = await record("LOCAL_MESSAGE_STATE", { direction: "outgoing", state: "cancelled", messageId: message.id, cid: message.envelope.cid, attempts: message.attempts, futureRetries: "cancelled", bodyStoredSeparately: true });
    if (!saved) { notify("Cancellation receipt could not be saved; no retry state was changed."); return; }
    try { await saveLocalMessage(updated); upsertMessage(updated); notify("Future manual retries cancelled. This cannot recall a message already received by another tab."); }
    catch (error) { setStoreError(error instanceof Error ? error.message : "Retry state could not be updated."); }
  };

  const deleteLocalData = async () => {
    if (busy || !window.confirm("Delete this browser's messenger identity and all local message bodies/receipts from its messenger IndexedDB? Other already-open tabs may retain the private key in memory until closed. This does not recall messages already received there.")) return;
    const intent = await record("LOCAL_MESSAGE_STATE", { action: "local-messenger-data-deletion-requested", store: "browser IndexedDB" });
    if (!intent) { notify("Deletion-intent receipt could not be saved; local data was not deleted."); return; }
    setChannelRequested(false); setBusy(true);
    try {
      await clearLocalMessengerData(); setIdentity(null); setMessages([]); setBody(""); setStoreError("");
      await record("LOCAL_MESSAGE_STATE", { action: "local-messenger-data-deleted", store: "browser IndexedDB", keyMaterialDeleted: true, messageBodiesDeleted: true });
      notify("Local messenger IndexedDB was cleared. Other tabs may still hold a key in memory until they close.");
    } catch (error) { setStoreError(error instanceof Error ? error.message : "Local messenger data could not be deleted."); }
    finally { setBusy(false); }
  };

  return <div className="module">
    <SectionHeader number="09" eyebrow="BROWSER-LOCAL · ED25519 · BROADCASTCHANNEL" title="Same-browser messenger" description="A local signed-message experiment that delivers only between explicitly open TruthTalk tabs on this exact browser origin. There is no HTTP peer, server, relay, or remote listener." action={<StatusPill tone={channelReady ? "good" : "neutral"}>{channelReady ? "LOCAL CHANNEL OPEN" : "CHANNEL CLOSED"}</StatusPill>} />
    <div className="notice warning"><CircleAlert size={17} /><p><strong>Not a mesh messenger.</strong> A valid Ed25519 envelope and a signed acknowledgement show that a same-origin tab with this browser-local key handled matching bytes. They do not verify another person, remote peer, node, or VALKYRIE endpoint. TruthTalk does not perform the peer verification the owner reserved for themselves.</p></div>
    <section className="panel"><div className="panelTop"><div><p className="eyebrow"><KeyRound size={14} /> SEPARATE LOCAL KEY · NO NOSTR REUSE</p><h2>Local messenger identity</h2></div>{loading ? <StatusPill tone="neutral">Checking IndexedDB</StatusPill> : identity ? <StatusPill tone="good">Key pair validated</StatusPill> : <StatusPill tone="warn">No key in this browser</StatusPill>}</div>
      {loading ? <div className="loadingState"><LoaderCircle className="spin" size={16} /><p>Reading this site’s messenger IndexedDB only. No network access.</p></div> : identity ? <div className="identityRecord"><div><span>PUBLIC KEY</span><code>{identity.publicKey}</code></div><div><span>LOCAL TAB ID · EPHEMERAL</span><code>{tabId}</code></div><div><span>CREATED</span><time>{new Date(identity.createdAt).toLocaleString()}</time></div><p className="fine">The separate 32-byte Ed25519 private key is stored unencrypted in this origin’s IndexedDB. Any same-origin script that runs here can access it. It is not exported, uploaded, placed in the general receipt ledger, or reused for Nostr/VALKYRIE.</p><div className="buttonRow"><button className="button secondary" type="button" disabled={busy || channelReady} onClick={() => setChannelRequested(true)}><Radio size={14} /> Open same-origin channel</button><button className="button secondary" type="button" disabled={!channelReady || busy} onClick={() => setChannelRequested(false)}>Close channel</button><button className="button danger" type="button" disabled={busy} onClick={() => void deleteLocalData()}><Trash2 size={14} /> Delete local messenger data</button></div></div> : <div className="identityEmpty"><p>{storeError || "No messenger key or example messages are preloaded. Create a separate local key only if you want to message another TruthTalk tab open in this same browser."}</p><button className="button primary" type="button" disabled={loading || busy} onClick={() => void createIdentity()}><KeyRound size={14} /> Create local messenger identity</button></div>}
      {channelError ? <p className="fine warningText" role="alert">{channelError}</p> : null}
    </section>
    {identity ? <><section className="panel localMessagePanel"><div className="panelTop"><div><p className="eyebrow"><MessageSquare size={14} /> SIGNED LOCAL ENVELOPES</p><h2>Send to another open tab</h2><p className="fine">The message body is stored separately in messenger IndexedDB. The general receipt ledger holds message IDs/CIDs and state transitions only.</p></div><StatusPill tone={channelReady ? "good" : "warn"}>{channelReady ? "CHANNEL OPEN" : "OPEN IT MANUALLY"}</StatusPill></div><label className="field"><span className="fieldLabel">Message · maximum {MAX_MESSAGE_CODE_POINTS.toLocaleString()} Unicode code points</span><textarea rows={4} maxLength={MAX_MESSAGE_CODE_POINTS * 2} disabled={!channelReady || busy} value={body} onChange={(event) => setBody(event.target.value)} placeholder={channelReady ? "Only other open tabs on this same origin can receive this." : "Open the same-origin channel before composing a message."} /><small className="fieldHint">{Array.from(body).length.toLocaleString()}/{MAX_MESSAGE_CODE_POINTS.toLocaleString()} code points · no remote destination exists</small></label><div className="buttonRow"><button className="button primary" type="button" disabled={!channelReady || !body.trim() || Array.from(body).length > MAX_MESSAGE_CODE_POINTS || busy} onClick={() => void sendMessage()}><ArrowUpRight size={14} /> Send to open tabs</button><p className="fine">Retry schedule: 30 seconds, then 60, 120, 240… capped at 10 minutes. All retries are manual, at most {MAX_ATTEMPTS} attempts; no automatic resend.</p></div></section>
      <section className="panel"><div className="panelTop"><div><p className="eyebrow">LOCAL MESSAGE HISTORY</p><h2>{messages.length ? `${messages.length} stored envelope${messages.length === 1 ? "" : "s"}` : "No messages in this browser"}</h2></div><StatusPill tone="neutral">No server copy</StatusPill></div>{messages.length ? <div className="localMessageList">{[...messages].reverse().map((message) => <article className="localMessageCard" key={message.id}><div className="localMessageHead">{message.direction === "outgoing" ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}<div><b>{message.direction === "outgoing" ? "SENT FROM THIS TAB" : "RECEIVED FROM ANOTHER TAB"}</b><time>{new Date(message.receivedAt).toLocaleString()}</time></div><StatusPill tone={message.state === "acknowledged" || message.state === "received" ? "good" : message.state === "failed" ? "bad" : message.state === "cancelled" ? "warn" : "neutral"}>{statusLabel(message)}</StatusPill></div><pre className="localMessageBody">{message.envelope.type === "ack" ? "Signed acknowledgement envelope; no message body." : message.envelope.body}</pre><div className="localMessageMeta"><span>MSG ID <code>{message.id}</code></span><span>CIDv1 <code>{message.envelope.cid}</code></span><span>ATTEMPTS <code>{message.attempts}/{MAX_ATTEMPTS}</code></span><span>RETRY <code>{message.state === "pending" ? formatCountdown(message.nextRetryAt, clock) : "not scheduled"}</code></span></div>{message.reason ? <p className="fine">{message.reason}</p> : null}{message.acknowledgement ? <details className="ackDetails"><summary>Inspect signed local acknowledgement</summary><pre>{JSON.stringify(message.acknowledgement, null, 2)}</pre><p className="fine">The acknowledgement shares the local messenger key and identifies a distinct tab ID; it is not an independent identity verification.</p></details> : null}{message.direction === "outgoing" && message.state === "pending" ? <div className="buttonRow"><button className="button secondary" type="button" disabled={!channelReady || busy || (message.nextRetryAt !== undefined && message.nextRetryAt > clock)} onClick={() => void manualRetry(message)}>Retry manually {message.nextRetryAt && message.nextRetryAt > clock ? `in ${formatCountdown(message.nextRetryAt, clock)}` : "now"}</button><button className="linkButton" type="button" disabled={busy} onClick={() => void cancelRetry(message)}>Cancel future retries</button></div> : null}{message.direction === "outgoing" && message.state === "failed" && message.attempts >= MAX_ATTEMPTS ? <p className="fine">The local retry cap has been reached. A late signed acknowledgement may still arrive; status is not proof of non-delivery.</p> : null}</article>)}</div> : <div className="emptyState"><span className="emptyIndex">NO SEED DATA</span><div><h2>No sample conversations</h2><p>Open this same app in another tab yourself, explicitly open the local channel there, then send a message if you choose. No remote peer test is run by TruthTalk.</p></div></div>}</section></> : null}
    <p className="fine">Local key deletion only clears this browser’s messenger IndexedDB. It does not delete the separate receipt ledger, erase copies already received in other open tabs, or affect Nostr events.</p>
  </div>;
}
