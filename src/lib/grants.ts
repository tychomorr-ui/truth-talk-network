export const GRANTS_SEARCH_URL = "https://api.grants.gov/v1/api/search2";
export const GRANTS_DETAIL_URL = "https://api.grants.gov/v1/api/fetchOpportunity";
export const GRANTS_API_TERMS = "https://www.grants.gov/api/terms-conditions";
export const GRANTS_API_NOTICE = "This product uses the Grants.gov API but is not endorsed or certified by the U.S. Department of Health and Human Services.";

export type GrantOpportunityHit = {
  id: number;
  title: string;
  number: string;
  agency: string;
  status: string;
  openDate: string;
  closeDate: string;
  sourceUrl: string;
};

export type SelectedOpportunity = GrantOpportunityHit & { retrievedAt: string };

export type GrantSearchResult = {
  source: "Grants.gov";
  endpoint: string;
  retrievedAt: string;
  keyword: string;
  requestedStatuses: string[];
  total: number | null;
  page: number;
  pageSize: number;
  hits: GrantOpportunityHit[];
};

export type GrantPageRequest = { keyword: string; includeForecasted: boolean; page: number };

export function grantSearchInputsMatch(result: GrantSearchResult, keyword: string, includeForecasted: boolean): boolean {
  const expectedStatuses = includeForecasted ? ["posted", "forecasted"] : ["posted"];
  return result.keyword === keyword.trim() && result.requestedStatuses.length === expectedStatuses.length && expectedStatuses.every((status, index) => result.requestedStatuses[index] === status);
}

export function grantPageRequest(result: GrantSearchResult, page: number): GrantPageRequest | null {
  if (!Number.isSafeInteger(page) || page < 0 || page > 400) return null;
  return { keyword: result.keyword, includeForecasted: result.requestedStatuses.includes("forecasted"), page };
}

export function localTopicSignals(tags: string, hit: Pick<GrantOpportunityHit, "title" | "agency" | "number">): string[] {
  const providerText = `${hit.title} ${hit.agency} ${hit.number}`.toLocaleLowerCase();
  return [...new Set(tags.split(",").map((tag) => tag.trim()).filter((tag) => tag.length >= 2 && providerText.includes(tag.toLocaleLowerCase())))];
}

export type GrantOpportunityDetail = {
  id: number;
  title: string;
  number: string;
  agency: string;
  status: string;
  postedDate: string;
  closeDate: string;
  updatedDate: string;
  applicantTypes: string[];
  additionalEligibility: string;
  synopsis: string;
  awardFloor: string;
  awardCeiling: string;
  costSharing: string;
  fundingInstruments: string[];
  assistanceListings: string[];
  sourceUrl: string;
  apiEndpoint: string;
  retrievedAt: string;
};

type Json = Record<string, unknown>;
type Fetcher = typeof fetch;
const PAGE_SIZE = 25;
const MAX_KEYWORD_LENGTH = 120;

function object(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
}
function text(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return "";
}
function list(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(object(item).description) || text(item)).filter(Boolean);
}
function nullableCount(value: unknown): number | null {
  return Number.isFinite(Number(value)) && value !== null && value !== "" ? Number(value) : null;
}
function resultUrl(id: number): string {
  return `https://www.grants.gov/search-results-detail/${id}`;
}
async function postJson(url: string, body: object, fetcher: Fetcher): Promise<Json> {
  let response: Response;
  try {
    response = await fetcher(url, {
      method: "POST",
      mode: "cors",
      cache: "no-store",
      // Grants.gov returns 403 to browser JSON preflights; this JSON-encoded text/plain POST is CORS-simple and the official API accepts it.
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") throw new Error("Grants.gov did not respond within 20 seconds. No results were substituted.");
    throw new Error("The browser could not reach Grants.gov. Check the network and try a fresh user-initiated search.");
  }
  if (!response.ok) throw new Error(`Grants.gov returned HTTP ${response.status}. No cached or sample results were substituted.`);
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new Error("Grants.gov returned a response that was not valid JSON."); }
  const envelope = object(payload);
  if (Number(envelope.errorcode ?? 0) !== 0) throw new Error(text(envelope.msg) || "Grants.gov reported that the request did not succeed.");
  return object(envelope.data);
}

export async function searchGrantOpportunities(
  keyword: string,
  includeForecasted = false,
  page = 0,
  fetcher: Fetcher = fetch,
): Promise<GrantSearchResult> {
  const query = keyword.trim();
  if (query.length < 2 || query.length > MAX_KEYWORD_LENGTH) throw new Error("Enter 2–120 characters for a live Grants.gov search.");
  if (!Number.isSafeInteger(page) || page < 0 || page > 400) throw new Error("The selected result page is outside the supported range.");
  const statuses = includeForecasted ? ["posted", "forecasted"] : ["posted"];
  const data = await postJson(GRANTS_SEARCH_URL, {
    keyword: query,
    oppStatuses: statuses.join("|"),
    rows: PAGE_SIZE,
    startRecordNum: page * PAGE_SIZE,
  }, fetcher);
  const rawHits = Array.isArray(data.oppHits) ? data.oppHits : [];
  const hits: GrantOpportunityHit[] = rawHits.flatMap((raw) => {
    const item = object(raw);
    const id = Number(item.id ?? item.opportunityId);
    if (!Number.isSafeInteger(id) || id <= 0) return [];
    const agencyValue = text(item.agencyName) || text(item.agency) || text(item.agencyCode) || text(item.agencyCodeName);
    return [{
      id,
      title: text(item.title) || text(item.opportunityTitle) || "Title not supplied by provider",
      number: text(item.number) || text(item.opportunityNumber) || text(item.oppNum),
      agency: agencyValue || "Agency not supplied by provider",
      status: text(item.oppStatus) || text(item.status) || text(item.docType) || "Status not supplied by provider",
      openDate: text(item.openDate) || text(item.openingDate) || text(item.postingDate),
      closeDate: text(item.closeDate) || text(item.dueDate),
      sourceUrl: resultUrl(id),
    }];
  });
  return {
    source: "Grants.gov",
    endpoint: GRANTS_SEARCH_URL,
    retrievedAt: new Date().toISOString(),
    keyword: query,
    requestedStatuses: statuses,
    total: nullableCount(data.hitCount ?? data.totalHits ?? data.total),
    page,
    pageSize: PAGE_SIZE,
    hits,
  };
}

export async function fetchGrantOpportunityDetail(id: number, fetcher: Fetcher = fetch): Promise<GrantOpportunityDetail> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Opportunity ID must be a positive provider-issued integer.");
  const data = await postJson(GRANTS_DETAIL_URL, { opportunityId: id }, fetcher);
  const synopsis = object(data.synopsis);
  const number = text(data.opportunityNumber) || text(synopsis.opportunityNumber);
  const title = text(data.opportunityTitle) || text(synopsis.opportunityTitle) || "Title not supplied by provider";
  const agency = text(synopsis.agencyName) || text(object(data.agencyDetails).agencyName) || text(data.owningAgencyCode) || "Agency not supplied by provider";
  const eligibilityFields = [
    synopsis.applicantEligibilityDesc,
    synopsis.additionalInformationOnEligibility,
    synopsis.additionalInfoOnEligibility,
    synopsis.applicantEligibilityDescription,
    synopsis.eligibleApplicantsDescription,
  ].map(text).filter(Boolean);
  const alnItems = Array.isArray(data.cfdas) ? data.cfdas : Array.isArray(data.alns) ? data.alns : [];
  return {
    id,
    title,
    number,
    agency,
    status: text(data.listed) || text(data.status) || "Status not supplied by provider",
    postedDate: text(synopsis.postingDate) || text(synopsis.postingDateStr),
    closeDate: text(synopsis.closeDate) || text(synopsis.responseDate) || text(synopsis.originalDueDate),
    updatedDate: text(synopsis.lastUpdatedDate) || text(synopsis.updatedDate),
    applicantTypes: list(synopsis.applicantTypes),
    additionalEligibility: eligibilityFields.join("\n\n"),
    synopsis: text(synopsis.synopsisDesc),
    awardFloor: text(synopsis.awardFloorFormatted) || text(synopsis.awardFloor),
    awardCeiling: text(synopsis.awardCeilingFormatted) || text(synopsis.awardCeiling),
    costSharing: typeof synopsis.costSharing === "boolean" ? (synopsis.costSharing ? "Yes, per provider" : "No, per provider") : text(synopsis.costSharing),
    fundingInstruments: list(synopsis.fundingInstruments),
    assistanceListings: alnItems.map((item) => {
      const value = object(item);
      return [text(value.cfdaNumber) || text(value.alnNumber), text(value.programTitle)].filter(Boolean).join(" — ");
    }).filter(Boolean),
    sourceUrl: resultUrl(id),
    apiEndpoint: GRANTS_DETAIL_URL,
    retrievedAt: new Date().toISOString(),
  };
}
