import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, LoaderCircle, Search } from "lucide-react";
import { fetchGrantOpportunityDetail, GRANTS_API_NOTICE, GRANTS_API_TERMS, GRANTS_DETAIL_URL, GRANTS_SEARCH_URL, localTopicSignals, searchGrantOpportunities, type GrantOpportunityDetail, type GrantSearchResult, type SelectedOpportunity } from "../lib/grants";
import { sha256, type Profile } from "../lib/truthTalk";
import type { ReceiptKind } from "../lib/receipts";
import { EmptyState, Field, SectionHeader, StatusPill } from "./ui";
import { grantPageRequest, grantSearchInputsMatch } from "../lib/grants";

type RecordFn = (kind: ReceiptKind, details: Record<string, unknown>) => Promise<boolean>;

type OpportunityPanelProps = {
  profile: Profile;
  selectedOpportunityId: number | null;
  onUseInDraft: (opportunity: SelectedOpportunity | null) => void;
  record: RecordFn;
};

export function OpportunityPanel({ profile, selectedOpportunityId, onUseInDraft, record }: OpportunityPanelProps) {
  const [query, setQuery] = useState("");
  const [includeForecasted, setIncludeForecasted] = useState(false);
  const [result, setResult] = useState<GrantSearchResult | null>(null);
  const [details, setDetails] = useState<Record<number, GrantOpportunityDetail>>({});
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [receiptWarning, setReceiptWarning] = useState("");
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const search = async (requestedPage = 0, searchKeyword = query, searchIncludeForecasted = includeForecasted) => {
    const value = searchKeyword.trim();
    if (value.length < 2 || value.length > 120 || loading) return;
    setLoading(true);
    setError("");
    setReceiptWarning("");
    setResult(null);
    setDetails({});
    let queryHash: string;
    try {
      queryHash = await sha256(value);
    } catch {
      setLoading(false);
      setError("This browser could not create the local query receipt. No provider request was sent.");
      return;
    }
    const statuses = searchIncludeForecasted ? ["posted", "forecasted"] : ["posted"];
    const intentSaved = await record("SOURCE_LOOKUP_STARTED", {
      provider: "Grants.gov",
      endpoint: GRANTS_SEARCH_URL,
      keywordSha256: queryHash,
      statuses,
      page: requestedPage,
      initiatedBy: "operator-click",
    });
    if (!intentSaved) {
      setLoading(false);
      setError("The source lookup was not sent because its audit intent could not be saved locally.");
      return;
    }
    try {
      const response = await searchGrantOpportunities(value, searchIncludeForecasted, requestedPage);
      setResult(response);
      const responseHash = await sha256({ hits: response.hits, total: response.total, statuses: response.requestedStatuses });
      const saved = await record("SOURCE_LOOKUP_COMPLETED", {
        provider: response.source,
        endpoint: response.endpoint,
        keywordSha256: queryHash,
        retrievedAt: response.retrievedAt,
        sourceUrls: response.hits.map((hit) => hit.sourceUrl),
        resultCount: response.hits.length,
        reportedTotal: response.total,
        responseSha256: responseHash,
        page: response.page,
        status: "provider-response-received",
      });
      if (!saved) setReceiptWarning("The live response arrived, but its completion receipt could not be saved. The initial attempt remains in the ledger; check storage before another action.");
    } catch (errorValue) {
      const message = errorValue instanceof Error ? errorValue.message : "The provider request failed.";
      setError(message);
      await record("SOURCE_LOOKUP_FAILED", { provider: "Grants.gov", endpoint: GRANTS_SEARCH_URL, keywordSha256: queryHash, status: "provider-or-network-error" });
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (id: number) => {
    if (detailLoading !== null) return;
    setDetailLoading(id);
    setError("");
    setReceiptWarning("");
    const intentSaved = await record("SOURCE_LOOKUP_STARTED", { provider: "Grants.gov", endpoint: GRANTS_DETAIL_URL, opportunityId: id, initiatedBy: "operator-click" });
    if (!intentSaved) {
      setDetailLoading(null);
      setError("The detail lookup was not sent because its audit intent could not be saved locally.");
      return;
    }
    try {
      const detail = await fetchGrantOpportunityDetail(id);
      setDetails((current) => ({ ...current, [id]: detail }));
      const detailHash = await sha256(detail);
      const saved = await record("SOURCE_LOOKUP_COMPLETED", {
        provider: "Grants.gov",
        endpoint: GRANTS_DETAIL_URL,
        opportunityId: id,
        sourceUrl: detail.sourceUrl,
        retrievedAt: detail.retrievedAt,
        applicantTypeCount: detail.applicantTypes.length,
        responseSha256: detailHash,
        status: "provider-detail-received",
      });
      if (!saved) setReceiptWarning("Details arrived, but the completion receipt could not be saved; the lookup intent remains recorded.");
    } catch (errorValue) {
      const message = errorValue instanceof Error ? errorValue.message : "The detail request failed.";
      setError(message);
      await record("SOURCE_LOOKUP_FAILED", { provider: "Grants.gov", endpoint: GRANTS_DETAIL_URL, opportunityId: id, status: "provider-or-network-error" });
    } finally {
      setDetailLoading(null);
    }
  };

  const resultMatchesInput = Boolean(result && grantSearchInputsMatch(result, query, includeForecasted));
  const providerHasMore = Boolean(result && result.hits.length > 0 && (result.total === null ? result.hits.length === result.pageSize : (result.page + 1) * result.pageSize < result.total));
  const canContinue = Boolean(result && result.page < 400 && providerHasMore);
  const pageLimitReached = Boolean(result && result.page === 400 && providerHasMore);
  const goToPage = (nextPage: number) => {
    if (!result || loading || !resultMatchesInput) return;
    const request = grantPageRequest(result, nextPage);
    if (request) void search(request.page, request.keyword, request.includeForecasted);
  };
  const ageMinutes = result ? Math.max(0, Math.floor((clock - new Date(result.retrievedAt).getTime()) / 60_000)) : 0;
  const freshness = ageMinutes < 5 ? "Just fetched" : ageMinutes < 60 ? `${ageMinutes}m since fetch` : `Stale · ${Math.floor(ageMinutes / 60)}h old`;

  return (
    <div className="module">
      <SectionHeader
        number="03"
        eyebrow="LIVE READ-ONLY · OPERATOR-INITIATED"
        title="Opportunity signals"
        description="Query the official Grants.gov API from this browser. Search terms and selected status filters go to Grants.gov; your project profile does not."
        action={<StatusPill tone="live"><span className="liveDot" /> LIVE SOURCE</StatusPill>}
      />
      <div className="notice providerNotice">
        <div><strong>Coverage boundary</strong><p>Live coverage is U.S. federal Grants.gov opportunity records only. Private foundations, investors, and cloud-credit programs are not included in this live query.</p></div>
        <p className="attribution">{GRANTS_API_NOTICE}</p>
        <a href={GRANTS_API_TERMS} target="_blank" rel="noreferrer noopener">API terms <ExternalLink size={13} /></a>
      </div>

      <section className="panel searchPanel">
        <div className="panelTop"><div><p className="eyebrow">POSTED OPPORTUNITIES · NO AUTO-REFRESH</p><h2>Search current federal records</h2></div><span className="panelIndex">LIVE / POST</span></div>
        <div className="searchForm">
          <Field label="Search phrase" hint="2–120 characters. This term is sent to Grants.gov only when you search.">
            <input value={query} maxLength={120} autoComplete="off" placeholder="Enter a topic, program, or keyword" onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void search(0); }} />
          </Field>
          <label className="inlineCheck"><input type="checkbox" checked={includeForecasted} onChange={(event) => setIncludeForecasted(event.target.checked)} /><span>Include forecasted records</span></label>
          <button className="button primary" type="button" disabled={loading || query.trim().length < 2} onClick={() => void search(0)}>{loading ? <LoaderCircle className="spin" size={16} /> : <Search size={16} />}{loading ? "Requesting source…" : "Search Grants.gov"}</button>
        </div>
        <p className="fine requestLine">Destination: <code>{GRANTS_SEARCH_URL}</code> · Each search is logged locally before it is sent. No background provider refresh or automatic retry.</p>
      </section>

      {error ? <div className="notice errorNotice" role="alert"><strong>Source status</strong><p>{error}</p><p>No cached or example opportunities are substituted.</p></div> : null}
      {receiptWarning ? <div className="notice warning" role="alert">{receiptWarning}</div> : null}
      {!result && !loading && !error ? <EmptyState index="—" title="No search has been run" description="Enter a topic and click Search. Results appear only when the provider returns them." /> : null}
      {loading ? <div className="loadingState"><LoaderCircle className="spin" size={20} /><p>Waiting for the live provider response…</p></div> : null}

      {result ? (
        <section className="resultSection">
          <div className="resultsHeader">
            <div>
              <p className="eyebrow">SOURCE-DATED RESPONSE</p>
              <h2>{result.hits.length} returned {result.hits.length === 1 ? "record" : "records"}{result.total !== null ? ` · ${result.total} reported total` : ""}</h2>
              <p><strong>Search:</strong> “{result.keyword}” · Retrieved {new Date(result.retrievedAt).toLocaleString()} · page {result.page + 1} · status filter {result.requestedStatuses.join(" + ")}.</p>
            </div>
            <StatusPill tone={ageMinutes >= 60 ? "warn" : "live"}>{freshness}</StatusPill>
          </div>
          {!resultMatchesInput ? <div className="notice warning" role="status"><strong>Search form changed.</strong><p>The results below remain tied to “{result.keyword}” and status filter {result.requestedStatuses.join(" + ")}. Page controls are paused; click Search to fetch the current form values.</p></div> : null}
          {result.hits.length === 0 ? <EmptyState index="0" title="No provider records returned" description="Grants.gov returned no hits for this query and status filter. Try a different term; TruthTalk does not fill an empty result with local sample data." /> : (
            <div className="opportunityList">
              {result.hits.map((hit) => {
                const detail = details[hit.id];
                const localSignals = localTopicSignals(profile.tags, hit);
                const selected = selectedOpportunityId === hit.id;
                return (
                  <article className="opportunityCard" key={hit.id}>
                    <div className="opportunityTop">
                      <div><p className="eyebrow">{hit.number || `PROVIDER ID ${hit.id}`}</p><h3>{hit.title}</h3><p className="agencyLine">{hit.agency}</p></div>
                      <StatusPill tone={hit.status.toLowerCase().includes("forecast") ? "warn" : "neutral"}>{hit.status}</StatusPill>
                    </div>
                    <div className="dateStrip"><DateValue label="Provider open / posting date" value={hit.openDate} /><DateValue label="Provider close date" value={hit.closeDate} /></div>
                    <div className="localSignal">
                      <span>LOCAL TOPIC SIGNAL · NOT A FIT OR ELIGIBILITY SCORE</span>
                      <p>{!profile.tags.trim() ? "No project tags declared; no local topic-overlap signal is available." : localSignals.length ? `Declared topic text present in provider title/agency: ${localSignals.join(", ")}. This does not establish eligibility or fit.` : "No declared project tag appears in this provider title/agency. This does not mean the project is ineligible or a poor fit."}</p>
                    </div>
                    <div className="opportunityActions">
                      <a className="textLink" href={hit.sourceUrl} target="_blank" rel="noreferrer noopener">Open official notice <ExternalLink size={14} /></a>
                      <button className="button secondary" type="button" disabled={detailLoading !== null} onClick={() => void loadDetails(hit.id)}>{detailLoading === hit.id ? <LoaderCircle className="spin" size={14} /> : <ArrowRight size={14} />}{detail ? "Refresh provider details" : "Load provider details"}</button>
                      <button className={`button ${selected ? "secondary" : "primary"}`} type="button" aria-pressed={selected} onClick={() => onUseInDraft(selected ? null : { ...hit, retrievedAt: result.retrievedAt })}>{selected ? "Remove draft context" : "Use as private draft context"}</button>
                    </div>
                    {detail ? (
                      <div className="detailPanel">
                        <div className="resultsHeader compact"><div><p className="eyebrow">DETAIL RESPONSE · {new Date(detail.retrievedAt).toLocaleString()}</p><h4>{detail.agency}</h4></div><StatusPill>{detail.status === "Status not supplied by provider" ? detail.status : `Provider listed flag: ${detail.status}`}</StatusPill></div>
                        <p className="fine">These are fields returned by Grants.gov, not a TruthTalk eligibility determination. Check the full official notice.</p>
                        <div className="detailGrid">
                          <DetailValue label="Applicant types in provider response" value={detail.applicantTypes.length ? detail.applicantTypes.join("; ") : "Not supplied in this API response; inspect the official notice."} />
                          <DetailValue label="Eligibility text in provider response" value={detail.additionalEligibility || "No separate eligibility field returned; inspect the official announcement."} />
                          <DetailValue label="Posted" value={detail.postedDate} />
                          <DetailValue label="Closing / response date" value={detail.closeDate} />
                          <DetailValue label="Last updated by provider" value={detail.updatedDate} />
                          <DetailValue label="Award floor / ceiling" value={[detail.awardFloor, detail.awardCeiling].filter(Boolean).join(" / ") || "Not supplied by provider"} />
                          <DetailValue label="Cost sharing" value={detail.costSharing} />
                          <DetailValue label="Funding instruments" value={detail.fundingInstruments.join("; ")} />
                          <DetailValue label="Assistance listings" value={detail.assistanceListings.join("; ")} />
                        </div>
                        {detail.synopsis ? <details className="synopsisDetails"><summary>Read provider synopsis text</summary><p>{detail.synopsis}</p></details> : <p className="fine">No synopsis text was supplied in the provider response.</p>}
                        <a className="textLink" href={detail.sourceUrl} target="_blank" rel="noreferrer noopener">Verify full notice on Grants.gov <ExternalLink size={14} /></a>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
          {result.hits.length ? <div className="pager"><button className="button secondary" type="button" disabled={result.page === 0 || !resultMatchesInput || loading} onClick={() => goToPage(result.page - 1)}><ArrowLeft size={14} /> Previous</button><span>Page {result.page + 1}</span><button className="button secondary" type="button" disabled={!canContinue || !resultMatchesInput || loading} onClick={() => goToPage(result.page + 1)}>Next <ArrowRight size={14} /></button></div> : null}
          {pageLimitReached ? <p className="fine warningText">TruthTalk’s live pager is capped at page 401. Narrow the search phrase to inspect a smaller set.</p> : null}
          <p className="fine sourceCaveat">Source content is displayed as returned and may be delayed or incomplete. “Posted” is a provider status, not an independent eligibility or availability finding. Recheck the official notice before applying. The freshness clock is local only; no refresh is automatic.</p>
        </section>
      ) : null}
    </div>
  );
}

function DateValue({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value || "Not supplied by provider"}</strong></div>;
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><p>{value || "Not supplied by provider"}</p></div>;
}
