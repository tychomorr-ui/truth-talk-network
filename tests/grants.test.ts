import { describe, expect, it } from "vitest";
import { fetchGrantOpportunityDetail, GRANTS_DETAIL_URL, GRANTS_SEARCH_URL, localTopicSignals, searchGrantOpportunities } from "../src/lib/grants";

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}
function fetcherReturning(payload: unknown, status = 200) {
  let called = false;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  const fetcher: typeof fetch = async (input, init) => {
    called = true;
    capturedUrl = String(input);
    capturedInit = init;
    return response(payload, status);
  };
  return { fetcher, wasCalled: () => called, request: () => ({ url: capturedUrl, init: capturedInit }) };
}

const liveShapeSearch = {
  errorcode: 0,
  msg: "success",
  token: "provider-token-is-discarded",
  data: {
    hitCount: 71,
    oppHits: [{ id: "364136", number: "DE-FOA-0003467", title: "Provider-returned opportunity title", agency: "Agency returned by Grants.gov", openDate: "10/21/2026", closeDate: "11/20/2026", oppStatus: "posted" }],
  },
};

describe("Grants.gov live read-only adapter", () => {
  it("sends only the search phrase, status, and provider pagination and records live provenance", async () => {
    const stub = fetcherReturning(liveShapeSearch);
    const result = await searchGrantOpportunities("energy storage", false, 0, stub.fetcher);
    const request = stub.request();
    expect(stub.wasCalled()).toBe(true);
    expect(request.url).toBe(GRANTS_SEARCH_URL);
    expect(request.init?.method).toBe("POST");
    expect(request.init?.mode).toBe("cors");
    expect(request.init?.cache).toBe("no-store");
    expect(request.init?.headers).toEqual({ "Content-Type": "text/plain;charset=UTF-8" });
    expect(JSON.parse(String(request.init?.body))).toEqual({ keyword: "energy storage", oppStatuses: "posted", rows: 25, startRecordNum: 0 });
    expect(String(request.init?.body)).not.toMatch(/profile|founder|private|localStorage/i);
    expect(result.source).toBe("Grants.gov");
    expect(result.total).toBe(71);
    expect(result.hits[0]).toMatchObject({ id: 364136, status: "posted", agency: "Agency returned by Grants.gov", sourceUrl: "https://www.grants.gov/search-results-detail/364136" });
    expect(result.retrievedAt).toMatch(/^\d{4}-\d\d-\d\dT/);
    expect(JSON.stringify(result)).not.toContain("provider-token-is-discarded");
  });

  it("preserves verified fetchOpportunity eligibility, date, award, and CFDA fields without inventing missing values", async () => {
    const stub = fetcherReturning({
      errorcode: 0,
      token: "discard-this-token",
      data: {
        id: 364136,
        opportunityNumber: "DE-FOA-0003467",
        opportunityTitle: "Provider detail title",
        listed: "Y",
        owningAgencyCode: "DOE-ARPAE",
        synopsis: {
          synopsisDesc: "Provider-returned synopsis text.",
          postingDate: "Oct 21, 2026 12:00:00 AM EDT",
          responseDate: "Nov 20, 2026 12:00:00 AM EST",
          lastUpdatedDate: "Oct 21, 2026 02:34:18 PM EDT",
          applicantEligibilityDesc: "See Section II.A. of the NOFO.",
          applicantTypes: [{ id: "99", description: "Unrestricted, subject to notice clarification" }],
          awardFloorFormatted: "3,000,000",
          awardCeilingFormatted: "5,000,000",
          costSharing: true,
          fundingInstruments: [{ description: "Cooperative Agreement" }],
        },
        agencyDetails: { agencyName: "Provider agency" },
        cfdas: [{ cfdaNumber: "81.135", programTitle: "Advanced Research Projects Agency - Energy" }],
      },
    });
    const detail = await fetchGrantOpportunityDetail(364136, stub.fetcher);
    const request = stub.request();
    expect(request.url).toBe(GRANTS_DETAIL_URL);
    expect(JSON.parse(String(request.init?.body))).toEqual({ opportunityId: 364136 });
    expect(detail.additionalEligibility).toContain("See Section II.A. of the NOFO.");
    expect(detail.applicantTypes).toEqual(["Unrestricted, subject to notice clarification"]);
    expect(detail.postedDate).toContain("Oct 21, 2026");
    expect(detail.closeDate).toContain("Nov 20, 2026");
    expect(detail.updatedDate).toContain("Oct 21, 2026");
    expect(detail.awardFloor).toBe("3,000,000");
    expect(detail.awardCeiling).toBe("5,000,000");
    expect(detail.costSharing).toBe("Yes, per provider");
    expect(detail.fundingInstruments).toEqual(["Cooperative Agreement"]);
    expect(detail.assistanceListings).toEqual(["81.135 — Advanced Research Projects Agency - Energy"]);
    expect(detail.sourceUrl).toBe("https://www.grants.gov/search-results-detail/364136");
    expect(JSON.stringify(detail)).not.toContain("discard-this-token");
  });

  it("does not call the provider for invalid input and maps a provider error to an explicit failure", async () => {
    const invalid = fetcherReturning(liveShapeSearch);
    await expect(searchGrantOpportunities("x", false, 0, invalid.fetcher)).rejects.toThrow("2–120 characters");
    expect(invalid.wasCalled()).toBe(false);
    const providerFailure = fetcherReturning({ errorcode: 13, msg: "Provider reports request failure", data: null });
    await expect(searchGrantOpportunities("energy", false, 0, providerFailure.fetcher)).rejects.toThrow("Provider reports request failure");
    const httpFailure = fetcherReturning({}, 503);
    await expect(searchGrantOpportunities("energy", false, 0, httpFailure.fetcher)).rejects.toThrow("HTTP 503");
  });

  it("keeps declared topic overlap local and labels it as text presence, not program fit", () => {
    const hit = { title: "Advanced Energy Systems", agency: "Department of Energy", number: "TEST-01" };
    expect(localTopicSignals("energy, privacy", hit)).toEqual(["energy"]);
    expect(localTopicSignals("privacy", hit)).toEqual([]);
    expect(localTopicSignals("", hit)).toEqual([]);
  });
});


describe("Grants.gov result-bound pagination", () => {
  it("keeps page requests tied to the completed query and filter, and rejects an out-of-range page", async () => {
    const stub = fetcherReturning(liveShapeSearch);
    const result = await searchGrantOpportunities(" open source ", true, 3, stub.fetcher);
    const { grantPageRequest, grantSearchInputsMatch } = await import("../src/lib/grants");

    expect(result.keyword).toBe("open source");
    expect(result.requestedStatuses).toEqual(["posted", "forecasted"]);
    expect(result.page).toBe(3);
    expect(JSON.parse(String(stub.request().init?.body))).toEqual({ keyword: "open source", oppStatuses: "posted|forecasted", rows: 25, startRecordNum: 75 });
    expect(grantSearchInputsMatch(result, "open source", true)).toBe(true);
    expect(grantSearchInputsMatch(result, "different phrase", true)).toBe(false);
    expect(grantSearchInputsMatch(result, "open source", false)).toBe(false);
    expect(grantPageRequest(result, 4)).toEqual({ keyword: "open source", includeForecasted: true, page: 4 });
    expect(grantPageRequest(result, 401)).toBeNull();
  });
});
