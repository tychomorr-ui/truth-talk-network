import { useState } from "react";
import { ArrowUpRight, ExternalLink, RotateCcw } from "lucide-react";
import type { readiness } from "../lib/truthTalk";
import { SectionHeader, StatusPill, EmptyState } from "./ui";

type Review = Awaited<ReturnType<typeof readiness>>;

export function ReadinessPanel({ result, onRunReview }: { result: Review | null; onRunReview: () => void }) {
  const [lens, setLens] = useState<"constructive" | "darkMirror">("constructive");
  const axes = result ? result[lens] : [];
  const readyCount = result?.constructive.filter((item) => item.status === "READY").length ?? 0;
  const riskCount = result?.darkMirror.filter((item) => item.status === "RISK_FLAG").length ?? 0;

  return <div className="module">
    <SectionHeader number="02" eyebrow="LOCAL REVIEW · NO EXTERNAL SOURCES FETCHED" title="Readiness / Dark Mirror" description="Two deterministic lenses over the same 11 axes. One asks what is legible; the other asks what a skeptical reviewer could still challenge." action={<button className="button secondary" type="button" onClick={onRunReview}><RotateCcw size={15} /> Run again</button>} />
    {!result ? <EmptyState index="11×2" title="No review has been run" description="Run an 11-axis pass from Signal packet. Empty and incomplete fields remain visible; the engine does not invent values." /> : <>
      <div className="metricsRow"><Metric label="Constructive complete" value={`${readyCount} / 11`} note="Required fields present" /><Metric label="Dark Mirror risks" value={`${riskCount} / 11`} note="Missing inputs flagged" /><Metric label="Review receipt" value={`${result.receiptHash.slice(0, 14)}…`} note="SHA-256 · local" /></div>
      <div className="reviewBanner"><span className="liveDot" /><p><strong>Scope.</strong> Local completeness heuristic over operator-declared values. Evidence URLs were not fetched or authenticated; results are not eligibility, funding, legal, valuation, or endorsement decisions.</p></div>
      <div className="lensSwitch" role="group" aria-label="Review lens">
        <button type="button" aria-pressed={lens === "constructive"} className={lens === "constructive" ? "selected" : ""} onClick={() => setLens("constructive")}>01 / Constructive <span>{readyCount} ready</span></button>
        <button type="button" aria-pressed={lens === "darkMirror"} className={lens === "darkMirror" ? "selected" : ""} onClick={() => setLens("darkMirror")}>02 / Dark Mirror <span>{riskCount} open flags</span></button>
      </div>
      <div className="axisList">{axes.map((axis) => <article className="axisCard" key={axis.id}>
        <div className="axisNumber">{String(axis.n).padStart(2, "0")}</div>
        <div className="axisContent"><div className="axisTitle"><h2>{axis.name}</h2><StatusPill tone={axis.status === "READY" ? "good" : axis.status === "RISK_FLAG" ? "bad" : "warn"}>{axis.status.replaceAll("_", " ")}</StatusPill></div><p className="axisFinding">{axis.finding}</p><div className="axisRecommendation"><span>Next useful move</span><p>{axis.recommendation}</p></div>
          <details className="evidenceDetails"><summary>Inspect fields, excerpts, and source context</summary><div className="evidenceGrid">{axis.evidence.map((item) => <div className="evidenceItem" key={item.field}><div><b>{item.label}</b><StatusPill tone={item.state === "DECLARED" ? "good" : "warn"}>{item.state}</StatusPill></div><p>{item.excerpt}</p></div>)}</div><p className="evidenceDisclaimer">{axis.interpretation}</p>{axis.sourceLinks.length ? <ul className="sourceLinkList">{axis.sourceLinks.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer noopener">{url}<ExternalLink size={13} /></a></li>)}</ul> : <p className="fine">No valid HTTP(S) evidence link has been declared.</p>}</details>
        </div>
      </article>)}</div>
      <p className="fine hashLine">Profile fingerprint <code>{result.fingerprint}</code> · Review receipt <code>{result.receiptHash}</code> <ArrowUpRight size={13} /></p>
    </>}
  </div>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="metricCard"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
