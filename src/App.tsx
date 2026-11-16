import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowRight, BookOpenCheck, CircleAlert, FileSearch, Fingerprint, LoaderCircle, Megaphone, MessageSquare, RadioTower, ScrollText, ShieldCheck, Sparkles, Video, Waypoints } from "lucide-react";
import { ChainWitnessPanel } from "./components/ChainWitnessPanel";
import { EcosystemReferencePanel } from "./components/EcosystemReferencePanel";
import { OpportunityPanel } from "./components/OpportunityPanel";
import { ProfilePanel } from "./components/ProfilePanel";
import { ReadinessPanel } from "./components/ReadinessPanel";
import { ReceiptLedgerPanel } from "./components/ReceiptLedgerPanel";
import { StatusPill } from "./components/ui";
import { appendReceipt, getLedgerSnapshot, type LedgerSnapshot, type ReceiptKind } from "./lib/receipts";
import type { SelectedOpportunity } from "./lib/grants";
import { cloneEmptyProfile, loadProfile, saveProfile } from "./lib/storage";
import { readiness, sha256, type Profile } from "./lib/truthTalk";
import { isRootHandoffMessage, ROOT_HANDOFF_ISSUER_ORIGIN, verifyRootHandoff } from "./lib/rootHandoff";
import "./styles.css";

const BroadcastStudio = lazy(() => import("./components/BroadcastStudio").then(({ BroadcastStudio: Component }) => ({ default: Component })));
const FeedStudio = lazy(() => import("./components/FeedStudio").then(({ FeedStudio: Component }) => ({ default: Component })));
const LocalMessengerPanel = lazy(() => import("./components/LocalMessengerPanel").then(({ LocalMessengerPanel: Component }) => ({ default: Component })));
const FourReelsBrandPanel = lazy(() => import("./components/FourReelsBrandPanel").then(({ FourReelsBrandPanel: Component }) => ({ default: Component })));

type ModuleId = "packet" | "review" | "opportunities" | "broadcast" | "witness" | "ledger" | "feed" | "reelsBrand" | "directory" | "messaging";
const modules: Array<{ id: ModuleId; label: string; sub: string; icon: typeof FileSearch; number: string }> = [
  { id: "packet", label: "Signal packet", sub: "Your declared record", icon: FileSearch, number: "01" },
  { id: "review", label: "Readiness / mirror", sub: "11 axes · two lenses", icon: BookOpenCheck, number: "02" },
  { id: "opportunities", label: "Opportunity signals", sub: "Live U.S. federal source", icon: Activity, number: "03" },
  { id: "broadcast", label: "Broadcast studio", sub: "Private until approved", icon: Megaphone, number: "04" },
  { id: "witness", label: "Chain Witness", sub: "Offline + live Bitcoin", icon: Fingerprint, number: "05" },
  { id: "ledger", label: "Receipt ledger", sub: "Local hash chain", icon: ScrollText, number: "06" },
  { id: "feed", label: "4Reels feed", sub: "Signed events · file hashes", icon: Video, number: "07" },
  { id: "reelsBrand", label: "4Reels brand", sub: "Launch strategy · copy", icon: Megaphone, number: "08" },
  { id: "directory", label: "Sovereign Mesh map", sub: "12 role/site refs · 3 apps", icon: Waypoints, number: "09" },
  { id: "messaging", label: "Local messenger", sub: "Same-browser tabs only", icon: MessageSquare, number: "10" },
];

function boot() {
  try { return { ...loadProfile(), storageAvailable: true }; }
  catch { return { profile: cloneEmptyProfile(), restored: false, storageAvailable: false }; }
}

export default function App() {
  const [initial] = useState(boot);
  const [profile, setProfile] = useState<Profile>(initial.profile);
  const [profileRestored] = useState(initial.restored);
  const [storageAvailable, setStorageAvailable] = useState(initial.storageAvailable);
  const [active, setActive] = useState<ModuleId>("packet");
  const [review, setReview] = useState<Awaited<ReturnType<typeof readiness>> | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<SelectedOpportunity | null>(null);
  const [ledger, setLedger] = useState<LedgerSnapshot | null>(null);
  const [ledgerError, setLedgerError] = useState("");
  const [toast, setToast] = useState("");
  const [rootIdentity, setRootIdentity] = useState<{ subject: string; displayName: string | null; expiresAt: string } | null>(null);
  const acceptedHandoffIds = useRef(new Set<string>());

  useEffect(() => {
    try { saveProfile(profile); setStorageAvailable(true); }
    catch { setStorageAvailable(false); }
  }, [profile]);

  const refreshLedger = useCallback(async () => {
    try {
      const snapshot = await getLedgerSnapshot();
      setLedger(snapshot); setLedgerError("");
    } catch (error) {
      setLedger(null); setLedgerError(error instanceof Error ? error.message : "Browser-local ledger storage could not be read.");
    }
  }, []);

  useEffect(() => { void refreshLedger(); }, [refreshLedger]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4_800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = useCallback((message: string) => setToast(message), []);
  const record = useCallback(async (kind: ReceiptKind, details: Record<string, unknown>) => {
    try {
      await appendReceipt(kind, details);
      await refreshLedger();
      return true;
    } catch (error) {
      await refreshLedger();
      setToast(error instanceof Error ? error.message : "The local receipt could not be saved.");
      return false;
    }
  }, [refreshLedger]);

  useEffect(() => {
    if (window.opener && window.opener !== window) {
      window.opener.postMessage({ type: "ROOT_TRUTHTALK_HANDOFF_READY", version: "ROOT_TRUTHTALK_HANDOFF/v1" }, ROOT_HANDOFF_ISSUER_ORIGIN);
    }
    const receive = (event: MessageEvent<unknown>) => {
      if (event.origin !== ROOT_HANDOFF_ISSUER_ORIGIN || !isRootHandoffMessage(event.data)) return;
      void verifyRootHandoff(event.data.envelope).then(async identity => {
        if (acceptedHandoffIds.current.has(identity.jti)) return;
        acceptedHandoffIds.current.add(identity.jti);
        setRootIdentity({ subject: identity.subject, displayName: identity.displayName, expiresAt: identity.expiresAt });
        await record("ROOT_HANDOFF_ACCEPTED", { version: "ROOT_TRUTHTALK_HANDOFF/v1", jti: identity.jti, scope: ["member_code", "display_name"], subjectHash: await sha256(identity.subject) });
        if (event.source && "postMessage" in event.source) {
          (event.source as Window).postMessage({ type: "ROOT_TRUTHTALK_HANDOFF_ACCEPTED", jti: identity.jti }, event.origin);
        }
        notify(identity.displayName ? `ROOT identity verified for ${identity.displayName}.` : "ROOT identity verified for this TruthTalk session.");
      }).catch(() => {
        if (event.source && "postMessage" in event.source) {
          (event.source as Window).postMessage({ type: "ROOT_TRUTHTALK_HANDOFF_REJECTED" }, event.origin);
        }
        notify("The ROOT identity handoff was rejected; no identity was imported.");
      });
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [notify, record]);

  const runReview = useCallback(async () => {
    const result = await readiness(profile);
    setReview(result);
    const saved = await record("REVIEW_CREATED", { engine: result.schema, profileSha256: result.fingerprint, reviewSha256: result.receiptHash, constructiveAxes: result.constructive.length, darkMirrorAxes: result.darkMirror.length });
    setActive("review");
    notify(saved ? "Review completed locally and recorded by hash." : "Review completed locally, but its ledger receipt could not be saved.");
  }, [profile, record, notify]);

  const clearProfile = useCallback(() => {
    if (!window.confirm("Clear this browser’s local TruthTalk profile? This does not affect other devices or erase the receipt ledger.")) return;
    setProfile(cloneEmptyProfile()); setReview(null); notify("Profile cleared in this browser.");
  }, [notify]);

  const activeModule = useMemo(() => modules.find((item) => item.id === active) ?? modules[0], [active]);
  const profileLabel = !storageAvailable ? "SESSION ONLY" : profileRestored ? "LOCAL PROFILE RESTORED" : "BLANK / LOCAL";
  const ActiveIcon = activeModule.icon;

  return <div className="appFrame">
    <aside className="sideRail">
      <a className="brandLockup" href="#packet" onClick={(event) => { event.preventDefault(); setActive("packet"); }} aria-label="TruthTalk home">
        <SignalMark /><span className="wordmark"><b>TRUTH</b><b>TALK<span className="brandPeriod">.</span></b></span>
      </a>
      <div className="sideCaption"><span>INDEPENDENT EVIDENCE STUDIO</span><span>PACKAGE / 0.4.1</span></div>
      <nav className="moduleNav" aria-label="TruthTalk modules">{modules.map((item) => {
        const Icon = item.icon;
        return <button key={item.id} type="button" className={`moduleNavItem ${active === item.id ? "active" : ""}`} aria-current={active === item.id ? "page" : undefined} aria-controls="active-module-panel" onClick={() => setActive(item.id)}><span className="navNumber">{item.number}</span><Icon size={16} /><span className="navLabel"><b>{item.label}</b><small>{item.sub}</small></span><ArrowRight className="navArrow" size={14} /></button>;
      })}</nav>
      <div className="railFoot"><div className="railScope"><span className="liveDot" /><div><small>DATA BOUNDARY</small><b>Local first. Action last.</b></div></div><p>Profile stays in this browser. Live requests happen only after a deliberate click.</p><a href="https://www.grants.gov/api/terms-conditions" target="_blank" rel="noreferrer noopener">Grants.gov terms <ArrowRight size={12} /></a></div>
    </aside>

    <main className="workspace" id="active-module-panel">
      <header className="topBar"><div className="breadcrumb"><ActiveIcon size={15} /><span>WORKSPACE</span><span className="crumbSlash">/</span><strong>{activeModule.label}</strong></div><div className="topStatus"><StatusPill tone={rootIdentity ? "good" : "neutral"}>{rootIdentity ? "ROOT IDENTITY VERIFIED" : "STANDALONE SESSION"}</StatusPill><StatusPill tone={storageAvailable ? "good" : "warn"}>{profileLabel}</StatusPill><StatusPill tone={ledger?.check.ok ? "good" : ledgerError ? "bad" : "neutral"}>{ledger?.check.ok ? `${ledger.ledger.receipts.length} RECEIPTS · CHAIN OK` : ledgerError ? "LEDGER ISSUE" : "LEDGER …"}</StatusPill></div></header>

      <section className="introBand"><div><p className="eyebrow"><span className="introGlyph"><Sparkles size={12} /></span> PROVENANCE OVER PERFORMANCE</p><p className="introHeadline">Make the record legible.<br /><em>Keep the claim honest.</em></p></div><div className="introNote"><span>01—10 / OPERATOR CONTROL</span><p>Evidence in. Assumptions out.<br />A deliberate next move, never an automatic one.</p></div></section>

      <div className="scopeRibbon"><ShieldCheck size={16} /><p><strong>Standalone by design.</strong> TruthTalk has no live VALKYRIE connection. Any future connection requires a versioned, operator-approved signed export/import contract. Nothing here shares VALKYRIE files, routes, keys, tables, runtime state, or adapters.</p></div>

      {active === "packet" ? <div className="tabPanel"><ProfilePanel profile={profile} onChange={setProfile} storageAvailable={storageAvailable} profileRestored={profileRestored} onRunReview={() => void runReview()} onClear={clearProfile} /></div> : null}
      {active === "review" ? <div className="tabPanel"><ReadinessPanel result={review} onRunReview={() => void runReview()} /></div> : null}
      {active === "opportunities" ? <div className="tabPanel"><OpportunityPanel profile={profile} selectedOpportunityId={selectedOpportunity?.id ?? null} onUseInDraft={(opportunity) => { setSelectedOpportunity(opportunity); notify(opportunity ? "Provider record selected as local draft context. No application was started." : "Opportunity context removed from the next draft."); }} record={record} /></div> : null}
      {active === "broadcast" ? <div className="tabPanel"><Suspense fallback={<div className="loadingState" role="status"><LoaderCircle className="spin" size={16} /><p>Loading broadcast tools…</p></div>}><BroadcastStudio profile={profile} opportunity={selectedOpportunity} record={record} notify={notify} /></Suspense></div> : null}
      {active === "witness" ? <div className="tabPanel"><ChainWitnessPanel record={record} notify={notify} /></div> : null}
      {active === "ledger" ? <div className="tabPanel"><ReceiptLedgerPanel snapshot={ledger} error={ledgerError} onRefresh={refreshLedger} notify={notify} /></div> : null}
      {active === "feed" ? <div className="tabPanel"><Suspense fallback={<div className="loadingState" role="status"><LoaderCircle className="spin" size={16} /><p>Loading signed-feed tools…</p></div>}><FeedStudio record={record} notify={notify} /></Suspense></div> : null}
      {active === "reelsBrand" ? <div className="tabPanel"><Suspense fallback={<div className="loadingState" role="status"><LoaderCircle className="spin" size={16} /><p>Loading 4Reels strategy…</p></div>}><FourReelsBrandPanel /></Suspense></div> : null}
      {active === "directory" ? <div className="tabPanel"><EcosystemReferencePanel /></div> : null}
      {active === "messaging" ? <div className="tabPanel"><Suspense fallback={<div className="loadingState" role="status"><LoaderCircle className="spin" size={16} /><p>Loading local messenger…</p></div>}><LocalMessengerPanel record={record} notify={notify} /></Suspense></div> : null}

      <footer className="appFooter"><span className="footerMark">T / T</span><p>TruthTalk Network <span>·</span> Standalone browser workspace <span>·</span> No award, eligibility, identity, or legal determination</p><div><CircleAlert size={14} /> <span>Live actions are individually consent-gated</span></div></footer>
    </main>
    {toast ? <div className="toast" role="status" aria-live="polite">{toast}</div> : null}
  </div>;
}

function SignalMark() {
  return <span className="signalMark" aria-hidden="true"><RadioTower size={19} strokeWidth={1.8} /><span /></span>;
}
