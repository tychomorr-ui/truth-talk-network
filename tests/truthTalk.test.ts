import { describe, expect, it } from "vitest";
import { CHANNELS, EMPTY_PROFILE, broadcasts, readiness, sha256, witness, type Profile } from "../src/lib/truthTalk";

const declaredProfile: Profile = {
  projectName: "Test-only evidence project",
  oneLine: "A deterministic test fixture for the local Truth-Talk domain engine.",
  problem: "Test-only fixture text describing a problem statement and how a reviewer might understand its stated context.",
  solution: "Test-only fixture text describing a solution and the current scope without asserting any real-world outcome.",
  founderStory: "Test-only fixture text for the local founder/team context input; it is never loaded by the application.",
  fundingAsk: "Test-only fixture text for the funding request and intended use input; no real amount or application is asserted.",
  website: "https://test.invalid/project",
  repositoryUrl: "https://test.invalid/repository",
  license: "MIT",
  demoUrl: "https://test.invalid/demo",
  goals: ["GRANTS"],
  tags: "evidence, privacy",
  evidenceLinks: "https://test.invalid/evidence",
  limitations: "Test-only fixture: no project facts are independently verified and this text is not production data.",
};

describe("browser-local Truth-Talk domain engine", () => {
  it("starts with no seeded identity or user/project facts", () => {
    for (const value of Object.values(EMPTY_PROFILE)) {
      expect(Array.isArray(value) ? value : value.trim()).toEqual(Array.isArray(value) ? [] : "");
    }
  });

  it("creates deterministic constructive and Dark Mirror reviews across 11 axes", async () => {
    const [first, second] = await Promise.all([readiness(declaredProfile), readiness(declaredProfile)]);
    expect(first.constructive).toHaveLength(11);
    expect(first.darkMirror).toHaveLength(11);
    expect(first.constructive.every((axis) => axis.status === "READY")).toBe(true);
    expect(first.darkMirror.every((axis) => axis.status === "HUMAN_REVIEW")).toBe(true);
    expect(first.receiptHash).toBe(second.receiptHash);
    expect(first.noEgress).toBe(true);
    expect(first.boundary).toBe("LOCAL_REVIEW_NOT_ELIGIBILITY_AWARD_LEGAL_ADVICE_OR_ENDORSEMENT");
    expect(first.constructive.every((axis) => axis.evidence.length > 0 && axis.recommendation.length > 0)).toBe(true);
  });

  it("marks missing declarations as incomplete and adversarial risks, never as verified readiness", async () => {
    const incomplete = { ...EMPTY_PROFILE, projectName: "Test", oneLine: "A short test declaration.", evidenceLinks: "", limitations: "" };
    const result = await readiness(incomplete);
    expect(result.constructive.some((axis) => axis.status === "NEEDS_INPUT")).toBe(true);
    expect(result.darkMirror.some((axis) => axis.status === "RISK_FLAG")).toBe(true);
    expect(result.constructive[1].evidence.some((item) => item.state === "MISSING")).toBe(true);
  });

  it("refuses to generate an empty-profile broadcast and includes only an explicitly supplied source record", async () => {
    await expect(broadcasts(EMPTY_PROFILE, ["NOSTR"])).rejects.toThrow("project name and one-line description");
    const opportunity = {
      id: 42,
      title: "Test-only provider record title",
      number: "TEST-ONLY-42",
      agency: "Test provider agency",
      status: "posted",
      openDate: "01/01/2099",
      closeDate: "02/01/2099",
      sourceUrl: "https://www.grants.gov/search-results-detail/42",
      retrievedAt: "2099-01-01T12:00:00.000Z",
    };
    const result = await broadcasts(declaredProfile, ["NOSTR", "HACKER_NEWS"], opportunity);
    expect(result.localGeneration).toBe(true);
    expect(result.outboundAction).toBe("NO_ACTION_UNTIL_CHANNEL_SPECIFIC_CONSENT");
    expect(result.drafts.map((draft) => draft.channel)).toEqual(["NOSTR", "HACKER_NEWS"]);
    expect(result.drafts.find((draft) => draft.channel === "NOSTR")?.status).toBe("DRAFT_APPROVAL_REQUIRED");
    expect(result.drafts.find((draft) => draft.channel === "HACKER_NEWS")?.status).toBe("HUMAN_AUTHORING_REQUIRED");
    for (const draft of result.drafts) {
      expect(draft.body).toContain("Test-only provider record title");
      expect(draft.body).toContain("no application or eligibility determination");
      expect(draft.contentHash).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(CHANNELS).toContain("NOSTR");
  });

  it("reports local identifier observation, timestamp, and content digest without retaining raw artifact text", async () => {
    const payload = JSON.stringify({ result: { txid: "abc123", block_hash: "test-only-block", confirmations: 3 } });
    const receipt = await witness({ chain: "BITCOIN", network: "mainnet", transactionHash: "AbC123", declaration: "Test-only operator artifact", payload });
    expect(receipt.status).toBe("LOCAL_IDENTIFIER_MATCH");
    expect(receipt.verificationLevel).toBe("LOCAL_CONTENT_OBSERVATION_ONLY");
    expect(receipt.createdAt).toMatch(/^\d{4}-\d\d-\d\dT/);
    expect(receipt.liveNetworkQuery).toBe(false);
    expect(receipt.sourcePayloadHash).toBe(await sha256(payload));
    expect(JSON.stringify(receipt)).not.toContain(payload);
    expect(receipt.boundary).toContain("NOT_LIVE_CHAIN_FINALITY_OR_OWNERSHIP");
  });

  it("does not treat identifier substrings or unrelated fields as a local identifier match", async () => {
    const base = { chain: "BITCOIN", network: "mainnet", transactionHash: "0xabc123", declaration: "Test-only artifact" };
    const substring = await witness({ ...base, payload: JSON.stringify({ note: "prefix-0xabc123-suffix", block_hash: "test-only-block" }) });
    const unrelatedHash = await witness({ ...base, payload: JSON.stringify({ hash: "0xabc123", block_hash: "test-only-block" }) });
    const plainText = await witness({ ...base, payload: "test-only transaction 0xabc123 confirmations 3" });
    expect(substring.status).toBe("INSUFFICIENT_LOCAL_CHAIN_EVIDENCE");
    expect(unrelatedHash.status).toBe("INSUFFICIENT_LOCAL_CHAIN_EVIDENCE");
    expect(plainText.status).toBe("INSUFFICIENT_LOCAL_CHAIN_EVIDENCE");
  });

});
