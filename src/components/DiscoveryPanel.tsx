import { useMemo, useState } from "react";
import { Compass, ExternalLink } from "lucide-react";
import { DISCOVERY_EXPLANATION, filterLowFollowerDiscovery, type FeedRecord } from "../lib/discovery";
import { EmptyState, Field, StatusPill } from "./ui";

export function DiscoveryPanel({ records, onOpenEvent }: { records: FeedRecord[]; onOpenEvent: (eventId: string) => void }) {
  const [thresholdText, setThresholdText] = useState("5");
  const threshold = Number(thresholdText);
  const validThreshold = Number.isInteger(threshold) && threshold >= 1 && threshold <= 100;
  const matches = useMemo(() => validThreshold ? filterLowFollowerDiscovery(records, threshold) : [], [records, threshold, validThreshold]);
  return <section className="discoveryPanel">
    <div className="discoveryIntro"><div><p className="eyebrow"><Compass size={14} /> DISCLOSED FILTER · RECENCY ONLY</p><h2>Early, reasoned claims</h2><p>{validThreshold ? DISCOVERY_EXPLANATION(threshold) : "Set N to an integer between 1 and 100."}</p></div><StatusPill tone="neutral">No score · no rank</StatusPill></div>
    <div className="discoveryScope"><strong>Observed scope only.</strong> “Prior posts” means valid signed events observed by this browser in the results from the relays selected above—not followers and not a network-wide lifetime total. A matching signature is not a real-world identity or truth check.</div>
    <Field label="Threshold N" hint="A claim is included only if fewer than N prior valid signed events by that key appear in the current selected-relay results."><input type="number" min={1} max={100} step={1} value={thresholdText} onChange={(event) => setThresholdText(event.target.value)} /></Field>
    {matches.length ? <div className="discoveryList">{matches.map(({ record, reason }) => <article key={record.event.id} className="discoveryRow"><div><StatusPill tone="good">{reason.priorObservedEvents} prior observed</StatusPill><p>{record.branch?.claimStatement ?? record.event.content ?? "Verified claim event"}</p><code>{record.event.pubkey.slice(0, 16)}… · {new Date(record.event.created_at * 1000).toISOString()}</code><p className="fine">{reason.reasonedExternalEndorsements} reasoned endorsement{reason.reasonedExternalEndorsements === 1 ? "" : "s"} from a different key · source: selected relays only</p></div><button className="button secondary" type="button" onClick={() => onOpenEvent(record.event.id)}>Inspect event <ExternalLink size={14} /></button></article>)}</div> : <EmptyState index="D / 04" title="No claims meet this filter in the current results" description="This is not evidence that none exist on the wider network. Read a user-selected relay first; the filter uses only valid events returned to this browser." />}
  </section>;
}
