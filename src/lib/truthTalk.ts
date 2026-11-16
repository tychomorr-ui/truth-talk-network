export const ENGINE_VERSION = "TRUTH_TALK/v3" as const;
export const GOALS = ["GRANTS", "MICROGRANTS", "CLOUD_CREDITS", "INVESTOR_INTROS", "COLLABORATORS", "COMMUNITY_DISCOVERY"] as const;
export const CHANNELS = ["NOSTR", "GITHUB", "REDDIT", "DISCORD", "LINKEDIN", "HACKER_NEWS"] as const;
export type Goal = (typeof GOALS)[number];
export type Channel = (typeof CHANNELS)[number];

export type Profile = {
  projectName: string; oneLine: string; problem: string; solution: string; founderStory: string;
  fundingAsk: string; website: string; repositoryUrl: string; license: string; demoUrl: string;
  goals: Goal[]; tags: string; evidenceLinks: string; limitations: string;
};

export const EMPTY_PROFILE: Profile = {
  projectName: "", oneLine: "", problem: "", solution: "", founderStory: "", fundingAsk: "",
  website: "", repositoryUrl: "", license: "", demoUrl: "", goals: [], tags: "", evidenceLinks: "", limitations: "",
};

export type AxisStatus = "READY" | "NEEDS_INPUT" | "RISK_FLAG" | "HUMAN_REVIEW";
export type AxisEvidence = { field: keyof Profile; label: string; state: "DECLARED" | "MISSING"; excerpt: string };
export type Axis = {
  n: number; id: string; name: string; status: AxisStatus; finding: string; recommendation: string;
  evidence: AxisEvidence[]; sourceLinks: string[]; interpretation: string;
};
export type Broadcast = {
  channel: Channel; title: string; body: string;
  status: "DRAFT_APPROVAL_REQUIRED" | "HUMAN_AUTHORING_REQUIRED";
  contentHash: string; limitations: string[];
};

export type OpportunityDraftContext = {
  id: number; title: string; number: string; agency: string; status: string;
  openDate: string; closeDate: string; sourceUrl: string; retrievedAt: string;
};

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(",")}}`;
}

export async function sha256(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalJson(value)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password ? url.toString() : null;
  } catch { return null; }
}

export function evidenceLinks(profile: Profile): string[] {
  return profile.evidenceLinks.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

function isPresent(profile: Profile, field: keyof Profile, minimum = 1): boolean {
  const value = profile[field];
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length >= minimum;
}

const axes: Array<{
  id: string; name: string; inputs: Array<{ field: keyof Profile; label: string; minimum: number }>;
  constructive: { ready: string; missing: string; recommendation: string };
  darkMirror: { complete: string; missing: string; recommendation: string };
}> = [
  {
    id: "project-clarity", name: "Project clarity",
    inputs: [{ field: "projectName", label: "Project name", minimum: 2 }, { field: "oneLine", label: "One-line description", minimum: 12 }],
    constructive: { ready: "The declared record identifies the project and its purpose in one concise description.", missing: "A reviewer may struggle to tell what this project is or what it does.", recommendation: "Write a specific project name and a plain-language one-line description. Avoid unsubstantiated superlatives." },
    darkMirror: { complete: "A clear description can still overstate maturity if the wording does not separate shipped work from plans.", missing: "An unclear identity makes the project difficult to distinguish, evaluate, or route.", recommendation: "Separate what exists today from the roadmap, and support each material claim with dated evidence." },
  },
  {
    id: "problem-evidence", name: "Problem and evidence",
    inputs: [{ field: "problem", label: "Problem statement", minimum: 40 }, { field: "evidenceLinks", label: "Evidence links", minimum: 8 }],
    constructive: { ready: "A problem statement and operator-declared supporting references are present.", missing: "The record does not yet contain a sufficiently specific problem statement and evidence references.", recommendation: "State who encounters the problem, in what context, and what evidence supports it. Add dated primary sources where possible." },
    darkMirror: { complete: "A link list does not establish that the sources are current, independent, or supportive of the stated claim.", missing: "A reviewer could read the problem as an assertion without visible supporting evidence.", recommendation: "For each link, note its date, author, relevant finding, and the specific claim it supports; do not imply independent verification." },
  },
  {
    id: "solution-scope", name: "Solution and scope",
    inputs: [{ field: "solution", label: "Solution description", minimum: 40 }, { field: "limitations", label: "Known limitations", minimum: 20 }],
    constructive: { ready: "The solution and known limits are declared for a human reviewer.", missing: "The solution or its known limitations are not yet described in enough detail.", recommendation: "Describe the current system, what remains unfinished, important dependencies, and how the limits will be addressed." },
    darkMirror: { complete: "Self-disclosed limits are useful, but they do not prove that the solution works at its claimed scale or maturity.", missing: "A reviewer may infer that unlisted limitations, dependencies, or unfinished work are being overlooked.", recommendation: "Label shipped, tested, planned, and unverified features separately. Do not present a plan as a working capability." },
  },
  {
    id: "founder-context", name: "Founder context",
    inputs: [{ field: "founderStory", label: "Founder or team context", minimum: 40 }],
    constructive: { ready: "Founder or team context is available as operator-declared information.", missing: "The record has little context about the people or team responsible for the work.", recommendation: "Add a concise human-authored account of relevant experience, responsibilities, and any conflicts or gaps." },
    darkMirror: { complete: "A biography is not independent confirmation of experience, ownership, authority, or delivery capacity.", missing: "A reviewer may have no basis to assess who is accountable for the work or whether the team can deliver it.", recommendation: "Use verifiable public references where appropriate and distinguish individual, contractor, and organization roles." },
  },
  {
    id: "funding-ask", name: "Funding request",
    inputs: [{ field: "fundingAsk", label: "Funding request and intended use", minimum: 40 }],
    constructive: { ready: "The record states a funding request or intended use for a human to review.", missing: "The intended funding use is not stated in enough detail for meaningful review.", recommendation: "Specify currency, amount or range if known, uses, milestones, duration, and what changes if funding is not obtained." },
    darkMirror: { complete: "A stated use of funds is not yet a budget, cost estimate, or evidence of financial controls.", missing: "A reviewer may see the request as uncosted or disconnected from measurable deliverables.", recommendation: "Map each cost to a realistic estimate, owner, milestone, and measurable output; keep assumptions visible." },
  },
  {
    id: "public-presence", name: "Public presence",
    inputs: [{ field: "website", label: "Website URL", minimum: 8 }, { field: "repositoryUrl", label: "Repository URL", minimum: 8 }],
    constructive: { ready: "Website and repository references are declared; TruthTalk does not fetch or validate them during this review.", missing: "A public website or source repository reference is incomplete or absent.", recommendation: "Supply real URLs that a reviewer can access, and manually confirm they load and describe the same project." },
    darkMirror: { complete: "A URL can be private, stale, unrelated, or inaccessible; its presence does not verify public availability.", missing: "Without public references, a reviewer may be unable to inspect the work or its history.", recommendation: "Check access in a logged-out browser and keep project identity, status, license, and contact details consistent." },
  },
  {
    id: "open-source-posture", name: "Open-source posture",
    inputs: [{ field: "repositoryUrl", label: "Repository URL", minimum: 8 }, { field: "license", label: "Declared license", minimum: 3 }],
    constructive: { ready: "A repository and declared license are available for human review; neither has been fetched or verified.", missing: "The repository or licensing posture is not sufficiently declared.", recommendation: "Confirm the actual repository license, third-party dependencies, contribution rights, and any restricted components." },
    darkMirror: { complete: "A license label in a profile does not establish that the repository contains a valid license or that all dependencies are compatible.", missing: "A reviewer may question whether the project can be used, inspected, or funded under clear terms.", recommendation: "Link to the authoritative license file and document ownership and dependency exceptions accurately." },
  },
  {
    id: "demonstration", name: "Demonstration",
    inputs: [{ field: "demoUrl", label: "Demonstration URL", minimum: 8 }],
    constructive: { ready: "A demonstration reference is declared for manual inspection; it has not been opened by this review.", missing: "No demonstration URL is declared.", recommendation: "Provide a reproducible demonstration with a dated version, stated prerequisites, and an honest description of what it proves." },
    darkMirror: { complete: "A demonstration link may be a screenshot, unstable preview, or non-representative path; it does not prove production readiness.", missing: "A reviewer may be unable to reproduce or inspect the stated capability.", recommendation: "Provide steps to reproduce and identify exactly which claims the demonstration does and does not support." },
  },
  {
    id: "provenance", name: "Evidence provenance",
    inputs: [{ field: "evidenceLinks", label: "Evidence references", minimum: 8 }, { field: "limitations", label: "Known limits and verification gaps", minimum: 20 }],
    constructive: { ready: "Evidence references and verification limitations are declared, but sources are not authenticated by this local review.", missing: "The record is missing source references or an account of its verification gaps.", recommendation: "Record source, author, publication date, retrieval date, and the exact claim supported; preserve contradictions instead of smoothing them over." },
    darkMirror: { complete: "Declared provenance can be incomplete or selective; this tool has not opened or authenticated any operator-supplied evidence URL.", missing: "A reviewer may be unable to distinguish a verifiable fact from an unsupported claim.", recommendation: "Maintain a claim-to-source trail and label estimates, opinions, copied statements, and independently verified facts distinctly." },
  },
  {
    id: "opportunity-routing", name: "Opportunity routing",
    inputs: [{ field: "goals", label: "Declared goals", minimum: 1 }, { field: "tags", label: "Routing tags", minimum: 2 }],
    constructive: { ready: "At least one declared goal and topical routing tag can guide local presentation.", missing: "No goal or topical signal is declared for routing.", recommendation: "Choose concrete goals and a short set of specific topics; do not treat topical overlap as eligibility or funder fit." },
    darkMirror: { complete: "Tags and goals are self-selected and cannot establish geographic, applicant, technical, or program eligibility.", missing: "Without routing signals, the search can be unfocused; adding broad tags alone would not establish fit.", recommendation: "Compare the official eligibility requirements to operator-confirmed facts for every opportunity." },
  },
  {
    id: "risk-and-limitations", name: "Risk and limitations",
    inputs: [{ field: "limitations", label: "Known limitations", minimum: 40 }],
    constructive: { ready: "Known limitations and verification gaps are explicitly declared.", missing: "Material limitations or verification gaps are not fully documented.", recommendation: "State the largest technical, financial, operational, privacy, and evidence risks, with an owner and next mitigation step." },
    darkMirror: { complete: "A self-described risk list may omit difficult issues; no independent audit or legal review has occurred.", missing: "An absent risk statement can look like limited diligence or a reluctance to disclose uncertainty.", recommendation: "Ask a disinterested reviewer to challenge the list and preserve unresolved objections as unresolved." },
  },
];

function makeEvidence(profile: Profile, field: keyof Profile, label: string, minimum: number): AxisEvidence {
  const raw = profile[field];
  const excerpt = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "").trim();
  return { field, label, state: isPresent(profile, field, minimum) ? "DECLARED" : "MISSING", excerpt: excerpt ? excerpt.slice(0, 220) : "Not declared" };
}

export async function readiness(profile: Profile) {
  const sourceLinks = evidenceLinks(profile).map(safeHttpUrl).filter((url): url is string => Boolean(url));
  const constructive: Axis[] = axes.map((axis, index) => {
    const evidence = axis.inputs.map((input) => makeEvidence(profile, input.field, input.label, input.minimum));
    const complete = evidence.every((item) => item.state === "DECLARED");
    return {
      n: index + 1, id: axis.id, name: axis.name, status: complete ? "READY" : "NEEDS_INPUT",
      finding: complete ? axis.constructive.ready : axis.constructive.missing,
      recommendation: axis.constructive.recommendation, evidence, sourceLinks,
      interpretation: "Local completeness heuristic over operator-declared values; linked sources were not fetched or independently verified.",
    };
  });
  const darkMirror: Axis[] = axes.map((axis, index) => {
    const evidence = axis.inputs.map((input) => makeEvidence(profile, input.field, input.label, input.minimum));
    const complete = evidence.every((item) => item.state === "DECLARED");
    return {
      n: index + 1, id: axis.id, name: axis.name, status: complete ? "HUMAN_REVIEW" : "RISK_FLAG",
      finding: complete ? axis.darkMirror.complete : axis.darkMirror.missing,
      recommendation: axis.darkMirror.recommendation, evidence, sourceLinks,
      interpretation: "Adversarial review prompt generated from field presence only; not a prediction of a funder's decision.",
    };
  });
  const fingerprint = await sha256(profile);
  const withoutHash = { schema: ENGINE_VERSION, fingerprint, noEgress: true, boundary: "LOCAL_REVIEW_NOT_ELIGIBILITY_AWARD_LEGAL_ADVICE_OR_ENDORSEMENT", constructive, darkMirror };
  return { ...withoutHash, receiptHash: await sha256(withoutHash) };
}

export async function broadcasts(profile: Profile, selected: Channel[], opportunity: OpportunityDraftContext | null = null) {
  if (profile.projectName.trim().length < 2 || profile.oneLine.trim().length < 12) {
    throw new Error("Enter a project name and one-line description before generating a draft.");
  }
  const lines = [
    profile.projectName.trim() ? `Project: ${profile.projectName.trim()}` : "",
    profile.oneLine.trim() ? `In one line: ${profile.oneLine.trim()}` : "",
    profile.problem.trim() ? `\nProblem: ${profile.problem.trim()}` : "",
    profile.solution.trim() ? `\nWhat we are building: ${profile.solution.trim()}` : "",
    profile.fundingAsk.trim() ? `\nFunding context: ${profile.fundingAsk.trim()}` : "",
    profile.repositoryUrl.trim() ? `\nRepository (operator-declared): ${profile.repositoryUrl.trim()}` : "",
    profile.website.trim() ? `\nProject site (operator-declared): ${profile.website.trim()}` : "",
    opportunity ? `\nOpportunity context (operator-selected Grants.gov record; no application or eligibility determination):` : "",
    opportunity ? `Opportunity: ${opportunity.title}${opportunity.number ? ` (${opportunity.number})` : ""}` : "",
    opportunity ? `Agency as listed by provider: ${opportunity.agency}` : "",
    opportunity ? `Provider status/date fields: ${opportunity.status}; open/posting date ${opportunity.openDate || "not supplied"}; close date ${opportunity.closeDate || "not supplied"}.` : "",
    opportunity ? `Official source: ${opportunity.sourceUrl} · Retrieved ${opportunity.retrievedAt}.` : "",
  ].filter(Boolean);
  const base = lines.join("\n");
  const drafts: Broadcast[] = await Promise.all(selected.map(async (channel) => {
    const humanOnly = channel === "HACKER_NEWS";
    const suffix = humanOnly
      ? "\n\nHuman authorship is required before any Hacker News submission. This draft is only a starting point and has not been checked against current community rules."
      : channel === "NOSTR"
        ? "\n\nOperator-declared project notes; claims and links require human review before publication."
        : "\n\nClaims and links are operator-declared and require human review. Check the destination community's current disclosure and self-promotion rules.";
    const body = `${base}${suffix}`;
    const draft = {
      channel,
      title: channel === "HACKER_NEWS" ? (profile.projectName.trim() || "Human-authored title required") : `${profile.projectName.trim() || "Project"} — introduction`,
      body,
      status: humanOnly ? "HUMAN_AUTHORING_REQUIRED" as const : "DRAFT_APPROVAL_REQUIRED" as const,
      limitations: humanOnly
        ? ["TruthTalk cannot submit or participate in the discussion.", "A person must write and submit the final post and follow current Hacker News rules."]
        : ["Creating or approving this draft does not publish it.", "No external connection is used for this channel unless the interface explicitly shows a live, consent-gated Nostr action."],
    };
    return { ...draft, contentHash: await sha256({ channel, title: draft.title, body }) };
  }));
  const fingerprint = await sha256({ profile, opportunity });
  const withoutHash = { schema: ENGINE_VERSION, fingerprint, localGeneration: true, outboundAction: "NO_ACTION_UNTIL_CHANNEL_SPECIFIC_CONSENT", opportunityId: opportunity?.id ?? null, drafts };
  return { ...withoutHash, receiptHash: await sha256(withoutHash) };
}

export async function witness(input: { chain: string; network: string; transactionHash: string; declaration: string; payload: string }) {
  const observed = new Set<string>();
  let transactionHashObservedInPayload = false;
  const transactionKeys = new Set(["txid", "transactionHash", "transaction_hash", "txHash", "tx_hash", "transactionId", "transaction_id"]);
  const observedKeys = new Set([...transactionKeys, "blockHash", "block_hash", "block_height", "blockNumber", "block_number", "confirmations", "timestamp", "time"]);
  try {
    const parsed: unknown = JSON.parse(input.payload);
    const visit = (item: unknown): void => {
      if (Array.isArray(item)) item.forEach(visit);
      else if (item && typeof item === "object") Object.entries(item as Record<string, unknown>).forEach(([key, child]) => {
        if (observedKeys.has(key)) observed.add(key);
        if (transactionKeys.has(key) && typeof child === "string" && child.trim().toLowerCase() === input.transactionHash.trim().toLowerCase()) transactionHashObservedInPayload = true;
        visit(child);
      });
    };
    visit(parsed);
  } catch { /* Raw or malformed artifacts are still hashed, but cannot satisfy structured verification. */ }
  const structuredFieldsObserved = [...observed].sort();
  const status = transactionHashObservedInPayload ? "LOCAL_IDENTIFIER_MATCH" : "INSUFFICIENT_LOCAL_CHAIN_EVIDENCE";
  const createdAt = new Date().toISOString();
  const withoutHash = {
    schema: "TRUTH_TALK_CHAIN_WITNESS/v3", createdAt, source: "OPERATOR_PROVIDED_ARTIFACT",
    chain: input.chain, network: input.network,
    transactionHash: input.transactionHash.trim(), declaration: input.declaration.trim(),
    sourcePayloadHash: await sha256(input.payload), structuredFieldsObserved,
    transactionHashObservedInPayload, status, verificationLevel: "LOCAL_CONTENT_OBSERVATION_ONLY", liveNetworkQuery: false,
    boundary: "OFFLINE_ARTIFACT_WITNESS_NOT_LIVE_CHAIN_FINALITY_OR_OWNERSHIP",
    limitations: [
      "No blockchain RPC, explorer API, wallet, relay, or address query was contacted for this receipt.",
      "Only the SHA-256 digest and recognized structured-field observations are retained; supplied artifact contents are not stored in this receipt.",
      "This does not establish chain finality, ownership, intent, value, theft, or legal effect.",
    ],
  };
  return { ...withoutHash, receiptHash: await sha256(withoutHash) };
}
