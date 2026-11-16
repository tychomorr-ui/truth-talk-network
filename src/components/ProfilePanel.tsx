import { ArrowUpRight, Save, Trash2 } from "lucide-react";
import { GOALS, type Goal, type Profile } from "../lib/truthTalk";
import { Field, SectionHeader, StatusPill } from "./ui";

const goalLabels: Record<Goal, string> = {
  GRANTS: "Federal / public grants",
  MICROGRANTS: "Microgrants",
  CLOUD_CREDITS: "Cloud credits",
  INVESTOR_INTROS: "Investor introductions",
  COLLABORATORS: "Collaborators",
  COMMUNITY_DISCOVERY: "Community discovery",
};

export function ProfilePanel({
  profile,
  onChange,
  storageAvailable,
  profileRestored,
  onRunReview,
  onClear,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
  storageAvailable: boolean;
  profileRestored: boolean;
  onRunReview: () => void;
  onClear: () => void;
}) {
  const set = (key: keyof Profile, value: string) => onChange({ ...profile, [key]: value });
  const toggleGoal = (goal: Goal) => onChange({ ...profile, goals: profile.goals.includes(goal) ? profile.goals.filter((item) => item !== goal) : [...profile.goals, goal] });
  const hasIdentity = profile.projectName.trim().length >= 2 && profile.oneLine.trim().length >= 12;

  return <div className="module">
    <SectionHeader number="01" eyebrow="BROWSER-LOCAL · OPERATOR-DECLARED" title="Signal packet" description="Start with facts you control. Nothing here is prefilled with a sample identity, and this profile is never included in a provider request." action={<StatusPill tone={storageAvailable ? "good" : "bad"}>{!storageAvailable ? "Storage unavailable" : profileRestored ? "Profile restored locally" : "Blank / current session"}</StatusPill>} />

    {!storageAvailable ? <div className="notice warning" role="alert"><strong>Browser storage is unavailable.</strong> Profile changes remain in this tab and may not survive a reload. The app will not send them to a server.</div> : null}

    <section className="panel">
      <div className="panelTop"><div><p className="eyebrow">IDENTITY · WHAT EXISTS</p><h2>Describe the work, not the promise</h2></div><span className="panelIndex">A / 04</span></div>
      <div className="fieldGrid">
        <Field label="Project name" hint="Use the name shown in your authoritative materials."><input maxLength={160} value={profile.projectName} onChange={(event) => set("projectName", event.target.value)} autoComplete="off" /></Field>
        <Field label="Declared license" hint="Not checked against the repository."><input maxLength={160} value={profile.license} onChange={(event) => set("license", event.target.value)} autoComplete="off" /></Field>
        <Field label="One-line description" className="wide" hint="Say what the project does today."><textarea maxLength={1_000} rows={2} value={profile.oneLine} onChange={(event) => set("oneLine", event.target.value)} /></Field>
        <Field label="Problem and evidence context" className="wide" hint="This is a local note; evidence links below are not fetched during reviews."><textarea maxLength={8_000} rows={4} value={profile.problem} onChange={(event) => set("problem", event.target.value)} /></Field>
        <Field label="Solution and current scope" className="wide"><textarea maxLength={8_000} rows={4} value={profile.solution} onChange={(event) => set("solution", event.target.value)} /></Field>
        <Field label="Founder / team context" className="wide" hint="Include only information you choose to keep in this browser."><textarea maxLength={8_000} rows={3} value={profile.founderStory} onChange={(event) => set("founderStory", event.target.value)} /></Field>
      </div>
    </section>

    <section className="panel">
      <div className="panelTop"><div><p className="eyebrow">INTENT · PROVENANCE</p><h2>Funding context and evidence</h2></div><span className="panelIndex">B / 04</span></div>
      <div className="fieldGrid">
        <Field label="Funding request and intended use" className="wide" hint="If amount or currency is unknown, say so instead of guessing."><textarea maxLength={8_000} rows={4} value={profile.fundingAsk} onChange={(event) => set("fundingAsk", event.target.value)} /></Field>
        <Field label="Known limits / verification gaps" className="wide"><textarea maxLength={8_000} rows={4} value={profile.limitations} onChange={(event) => set("limitations", event.target.value)} /></Field>
        <Field label="Website URL" hint="Operator-declared; not fetched by the readiness review."><input maxLength={1_000} type="url" value={profile.website} onChange={(event) => set("website", event.target.value)} autoComplete="url" /></Field>
        <Field label="Repository URL"><input maxLength={1_000} type="url" value={profile.repositoryUrl} onChange={(event) => set("repositoryUrl", event.target.value)} autoComplete="url" /></Field>
        <Field label="Demonstration URL"><input maxLength={1_000} type="url" value={profile.demoUrl} onChange={(event) => set("demoUrl", event.target.value)} /></Field>
        <Field label="Routing tags" hint="Comma-separated. Tags are not eligibility criteria."><input maxLength={500} value={profile.tags} onChange={(event) => set("tags", event.target.value)} /></Field>
        <Field label="Evidence links" className="wide" hint="One URL per line. They are retained locally and not opened automatically."><textarea maxLength={4_000} rows={3} value={profile.evidenceLinks} onChange={(event) => set("evidenceLinks", event.target.value)} autoComplete="off" /></Field>
      </div>
      <div className="goalField"><span className="fieldLabel">Declared goals</span><p className="fieldHint">Used only for local organization; it cannot establish fit or eligibility.</p><div className="choiceRow">{GOALS.map((goal) => <button key={goal} type="button" className={`choice ${profile.goals.includes(goal) ? "selected" : ""}`} aria-pressed={profile.goals.includes(goal)} onClick={() => toggleGoal(goal)}>{goalLabels[goal]}</button>)}</div></div>
    </section>

    <section className="actionBar"><div><p className="eyebrow">NO NETWORK ACTION</p><p>Review runs in this browser. Its receipt stores hashes and field-level findings—not the full profile.</p></div><div className="buttonRow"><button className="button secondary" type="button" onClick={onClear}><Trash2 size={16} /> Clear profile</button><button className="button primary" type="button" disabled={!hasIdentity} onClick={onRunReview}><Save size={16} /> Run 11-axis review <ArrowUpRight size={15} /></button></div></section>
  </div>;
}
