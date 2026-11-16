import { useState } from "react";
import { AlertTriangle, ArrowUpRight, Check, Clipboard, FileText, Megaphone, ShieldCheck } from "lucide-react";
import { SectionHeader, StatusPill } from "./ui";
import { fourReelsBrand } from "../lib/fourReelsBrand";

export function FourReelsBrandPanel() {
  return <section className="reelsBrandPanel" aria-label="4Reels brand and launch strategy">
    <SectionHeader
      number="08"
      eyebrow="4REELS / BRAND SYSTEM"
      title="A feed with a reason to exist."
      description="A focused positioning and launch draft for provenance-minded short-form work—not a live campaign, growth claim, or promise of truth."
      action={<StatusPill tone="warn">STRATEGY DRAFT</StatusPill>}
    />

    <div className="reelsBrandHero">
      <div className="reelsBrandHeroMain">
        <div className="reelsBrandKicker"><Megaphone size={15} /> POSITIONING / WORKING NAME</div>
        <h2>{fourReelsBrand.name}</h2>
        <p className="reelsBrandPrimaryTagline">“{fourReelsBrand.primaryTagline}”</p>
        <p className="reelsBrandSupport">{fourReelsBrand.positioning}</p>
        <CopyButton value={fourReelsBrand.primaryTagline} label="Copy primary tagline" />
      </div>
      <aside className="reelsBrandHeroAside">
        <StatusPill tone="warn">Name clearance pending</StatusPill>
        <p>{fourReelsBrand.nameCaveat}</p>
        <a href="https://www.uspto.gov/trademarks/basics/why-search-similar-trademarks" target="_blank" rel="noreferrer noopener">Read USPTO’s similar-mark guidance <ArrowUpRight size={13} /></a>
      </aside>
    </div>

    <div className="reelsBrandPositionGrid">
      <article className="reelsBrandCard reelsBrandLeadCard">
        <p className="reelsBrandEyebrow">THE FIRST NICHE</p>
        <h3>{fourReelsBrand.niche}</h3>
        <p>{fourReelsBrand.audience}</p>
        <p><strong>Secondary audience:</strong> {fourReelsBrand.secondaryAudience}</p>
      </article>
      <article className="reelsBrandCard">
        <p className="reelsBrandEyebrow">THE DISTINCTION</p>
        <h3>Context, not clout.</h3>
        <p>{fourReelsBrand.differentiator}</p>
        <div className="reelsBrandCallouts"><span>Signed to a key ≠ verified person</span><span>Matching bytes ≠ true claim</span><span>Relay receipt ≠ permanent reach</span></div>
      </article>
    </div>

    <div className="reelsBrandSectionHeading">
      <div><p className="reelsBrandEyebrow">EDITORIAL SYSTEM</p><h2>Four repeatable story shapes</h2></div>
      <p>Each piece starts from material its author has permission to share.</p>
    </div>
    <div className="reelsBrandPillars">
      {fourReelsBrand.pillars.map((pillar, index) => <article className="reelsBrandPillar" key={pillar.name}>
        <span className="reelsBrandIndex">0{index + 1}</span>
        <div><h3>{pillar.name}</h3><p>{pillar.purpose}</p><small>{pillar.format}</small></div>
      </article>)}
    </div>

    <div className="reelsBrandTwoColumn">
      <section className="reelsBrandCard">
        <p className="reelsBrandEyebrow">SUGGESTED EPISODE OUTLINE</p>
        <h2>One claim. One trail. One limit.</h2>
        <ol className="reelsBrandBeats">
          {fourReelsBrand.episodeOutline.map((beat, index) => <li key={beat.beat}><span>0{index + 1}</span><div><b>{beat.beat}</b><p>{beat.guide}</p></div></li>)}
        </ol>
        <small className="reelsBrandFootnote">Editorial guidance only; no length, quality score, or posting requirement is enforced by TruthTalk.</small>
      </section>
      <section className="reelsBrandCard">
        <p className="reelsBrandEyebrow">TAGLINE OPTIONS</p>
        <h2>Keep it plain. Keep it honest.</h2>
        <ul className="reelsBrandTaglines">
          {fourReelsBrand.taglines.map((tagline, index) => <li key={tagline}><span>{tagline}</span><CopyButton value={tagline} label={`Copy tagline ${index + 1}`} compact /></li>)}
        </ul>
      </section>
    </div>

    <section className="reelsBrandCard reelsBrandTemplates">
      <div className="reelsBrandSectionHeading">
        <div><p className="reelsBrandEyebrow">COPY TEMPLATES</p><h2>Prompts, not sample posts</h2></div>
        <p>Every bracket is for real author-supplied material. These templates create no feed data.</p>
      </div>
      <ul>{fourReelsBrand.templates.map((template, index) => <li key={template}><code>{template}</code><CopyButton value={template} label={`Copy content template ${index + 1}`} compact /></li>)}</ul>
    </section>

    <div className="reelsBrandSectionHeading">
      <div><p className="reelsBrandEyebrow">LAUNCH SEQUENCE</p><h2>Proposals—not a running campaign</h2></div>
      <StatusPill tone="neutral">NO DATES SET</StatusPill>
    </div>
    <div className="reelsBrandRollout">
      {fourReelsBrand.rollout.map((phase) => <article className="reelsBrandPhase" key={phase.phase}>
        <div className="reelsBrandPhaseTop"><span>{phase.phase}</span><StatusPill tone="neutral">{phase.status}</StatusPill></div>
        <p>{phase.detail}</p>
      </article>)}
    </div>

    <div className="reelsBrandTwoColumn">
      <section className="reelsBrandCard">
        <p className="reelsBrandEyebrow">MEASURE ONLY IF APPROVED</p>
        <h2>Candidate signals</h2>
        <ul className="reelsBrandSignals">{fourReelsBrand.signals.map((signal) => <li key={signal}><Check size={14} />{signal}</li>)}</ul>
        <p className="reelsBrandFootnote">{fourReelsBrand.measurementBoundary}</p>
      </section>
      <section className="reelsBrandCaution">
        <div className="reelsBrandCautionTitle"><AlertTriangle size={16} /><b>Preflight is still required</b></div>
        <p>{fourReelsBrand.nameCaveat}</p>
        <p>{fourReelsBrand.productBoundary}</p>
        <p><ShieldCheck size={14} /> {fourReelsBrand.status}</p>
      </section>
    </div>

    <div className="reelsBrandFooterNote"><FileText size={15} /><p>{fourReelsBrand.supportingLine} The full written plan and copy-ready project prompts are part of the project documentation. Nothing in this panel contacts a relay, provider, ecosystem site, Lovable, or GitHub.</p></div>
  </section>;
}

function CopyButton({ value, label, compact = false }: { value: string; label: string; compact?: boolean }) {
  const [status, setStatus] = useState<"idle" | "copied" | "unavailable">("idle");
  async function copy() {
    if (!navigator.clipboard?.writeText) { setStatus("unavailable"); return; }
    try { await navigator.clipboard.writeText(value); setStatus("copied"); }
    catch { setStatus("unavailable"); }
  }
  return <span className={`reelsBrandCopyWrap ${compact ? "compact" : ""}`}>
    <button className="reelsBrandCopyButton" type="button" onClick={() => void copy()} aria-label={label}><Clipboard size={13} />{compact ? "Copy" : "Copy line"}</button>
    <span className="reelsBrandCopyStatus" role="status" aria-live="polite">{status === "copied" ? "Copied locally" : status === "unavailable" ? "Clipboard unavailable—select text to copy" : ""}</span>
  </span>;
}
