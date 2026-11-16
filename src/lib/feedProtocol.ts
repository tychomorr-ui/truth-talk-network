import { canonicalizeJcs, codePointLength, isLowerHex, isPlainRecord, parseCanonicalJcs } from "./jcs";
import type { UnsignedNostrEvent } from "./attestations";
import type { NostrEvent } from "./nostr";

export const BRANCH_KIND = 40001;
export const ENDORSEMENT_KIND = 40002;
export const FEED_KINDS = [1, 22, 1063, BRANCH_KIND, ENDORSEMENT_KIND] as const;

export type BranchType = "DERIVES_FROM" | "DISPUTES" | "EXTENDS" | "LICENSES";
export type EvidenceRefType = "URL" | "MANIFEST_CID" | "RECEIPT_HASH" | "SUBSTRATE_CID" | "CLAIM_PACKET_ID";
export type BranchPayload = {
  kind: "BRANCH";
  parentEventId: string;
  parentAuthorPubkey: string;
  branchType: BranchType;
  claimStatement: string;
  evidenceRefs: Array<{ type: EvidenceRefType; value: string; resolution: "UNRESOLVED" }>;
};
export type EndorsementPayload = {
  endorsedEventId: string;
  endorsedAuthorPubkey: string;
  reason: string;
  relationship: "READ_USEFUL" | "DISSENT" | "AMPLIFY" | "CITE";
};
export type ReportType = "nudity" | "malware" | "profanity" | "illegal" | "spam" | "impersonation";

const branchTypes = new Set<BranchType>(["DERIVES_FROM", "DISPUTES", "EXTENDS", "LICENSES"]);
const evidenceTypes = new Set<EvidenceRefType>(["URL", "MANIFEST_CID", "RECEIPT_HASH", "SUBSTRATE_CID", "CLAIM_PACKET_ID"]);
const relationshipTypes = new Set<EndorsementPayload["relationship"]>(["READ_USEFUL", "DISSENT", "AMPLIFY", "CITE"]);
const reportTypes = new Set<ReportType>(["nudity", "malware", "profanity", "illegal", "spam", "impersonation"]);

export function normalizeBranchPayload(value: unknown): BranchPayload {
  if (!isPlainRecord(value)) throw new Error("Branch content must be a JSON object.");
  const required = ["kind", "parentEventId", "parentAuthorPubkey", "branchType", "claimStatement", "evidenceRefs"];
  if (Object.keys(value).length !== required.length || required.some((key) => !Object.hasOwn(value, key))) throw new Error("Branch payload has missing or unknown properties.");
  if (value.kind !== "BRANCH" || !isLowerHex(value.parentEventId, 64) || !isLowerHex(value.parentAuthorPubkey, 64) || typeof value.branchType !== "string" || !branchTypes.has(value.branchType as BranchType)) throw new Error("Branch relationship, parent ID, or author is invalid.");
  if (typeof value.claimStatement !== "string" || !value.claimStatement.trim() || codePointLength(value.claimStatement) > 5_000) throw new Error("Branch claim must contain 1–5,000 Unicode code points.");
  if (!Array.isArray(value.evidenceRefs) || value.evidenceRefs.length > 20) throw new Error("Branch evidence references must be an ordered array of at most 20 entries.");
  const evidenceRefs = value.evidenceRefs.map((item) => {
    if (!isPlainRecord(item) || Object.keys(item).length !== 3 || !["type", "value", "resolution"].every((key) => Object.hasOwn(item, key))) throw new Error("Each branch reference must contain only type, value, and resolution.");
    if (typeof item.type !== "string" || !evidenceTypes.has(item.type as EvidenceRefType) || typeof item.value !== "string" || !item.value.trim() || codePointLength(item.value) > 2_048 || item.resolution !== "UNRESOLVED") throw new Error("Branch references must use a known type, value, and UNRESOLVED status.");
    return { type: item.type as EvidenceRefType, value: item.value, resolution: "UNRESOLVED" as const };
  });
  return { kind: "BRANCH", parentEventId: value.parentEventId, parentAuthorPubkey: value.parentAuthorPubkey, branchType: value.branchType as BranchType, claimStatement: value.claimStatement, evidenceRefs };
}

export function normalizeEndorsementPayload(value: unknown): EndorsementPayload {
  if (!isPlainRecord(value)) throw new Error("Endorsement content must be a JSON object.");
  const required = ["endorsedEventId", "endorsedAuthorPubkey", "reason", "relationship"];
  if (Object.keys(value).length !== required.length || required.some((key) => !Object.hasOwn(value, key))) throw new Error("Endorsement payload has missing or unknown properties.");
  if (!isLowerHex(value.endorsedEventId, 64) || !isLowerHex(value.endorsedAuthorPubkey, 64)) throw new Error("Endorsement target ID and author must be lowercase hexadecimal.");
  if (typeof value.reason !== "string" || !value.reason.trim() || codePointLength(value.reason) > 280) throw new Error("A non-empty endorsement reason of at most 280 Unicode code points is required.");
  if (typeof value.relationship !== "string" || !relationshipTypes.has(value.relationship as EndorsementPayload["relationship"])) throw new Error("Endorsement relationship is not recognized.");
  return { endorsedEventId: value.endorsedEventId, endorsedAuthorPubkey: value.endorsedAuthorPubkey, reason: value.reason, relationship: value.relationship as EndorsementPayload["relationship"] };
}

export function parseBranchPayload(content: string): BranchPayload {
  return normalizeBranchPayload(parseCanonicalJcs(content, 64_000));
}

export function serializeBranchPayload(payload: BranchPayload): string {
  return canonicalizeJcs(normalizeBranchPayload(payload));
}

export function parseEndorsementPayload(content: string): EndorsementPayload {
  return normalizeEndorsementPayload(parseCanonicalJcs(content, 8_000));
}

export function serializeEndorsementPayload(payload: EndorsementPayload): string {
  return canonicalizeJcs(normalizeEndorsementPayload(payload));
}

export function createBranchEvent(payload: BranchPayload, createdAt = Math.floor(Date.now() / 1000)): UnsignedNostrEvent {
  const normalized = normalizeBranchPayload(payload);
  return { created_at: createdAt, kind: BRANCH_KIND, tags: [["e", normalized.parentEventId], ["p", normalized.parentAuthorPubkey], ["t", "truth-talk-branch"]], content: canonicalizeJcs(normalized) };
}

export function createEndorsementEvent(payload: EndorsementPayload, createdAt = Math.floor(Date.now() / 1000)): UnsignedNostrEvent {
  const normalized = normalizeEndorsementPayload(payload);
  return { created_at: createdAt, kind: ENDORSEMENT_KIND, tags: [["e", normalized.endorsedEventId], ["p", normalized.endorsedAuthorPubkey], ["t", "truth-talk-reasoned-endorsement"]], content: canonicalizeJcs(normalized) };
}

export function createNip56ReportEvent(target: NostrEvent, reportType: ReportType, note = "", createdAt = Math.floor(Date.now() / 1000)): UnsignedNostrEvent {
  if (!reportTypes.has(reportType)) throw new Error("Choose a NIP-56 report type from the supported list.");
  const content = note.trim();
  if (codePointLength(content) > 1_000) throw new Error("Report note may not exceed 1,000 Unicode code points.");
  return { created_at: createdAt, kind: 1984, tags: [["e", target.id, reportType], ["p", target.pubkey]], content };
}

export function createNip09DeletionRequest(target: NostrEvent, signerPubkey: string, note = "", createdAt = Math.floor(Date.now() / 1000)): UnsignedNostrEvent {
  if (target.pubkey !== signerPubkey.toLowerCase()) throw new Error("Only the key that authored this event may request its deletion.");
  const content = note.trim();
  if (codePointLength(content) > 500) throw new Error("Deletion-request note may not exceed 500 Unicode code points.");
  return { created_at: createdAt, kind: 5, tags: [["e", target.id], ["k", String(target.kind)]], content };
}

export function parseVideoMetadata(event: { kind: number; tags: string[][]; content: string }): { title: string; url: string; mime: string; sha256: string; dimensions?: string; alt?: string } | null {
  if (event.kind !== 22) return null;
  const title = event.tags.find((tag) => tag[0] === "title")?.[1];
  const imeta = event.tags.find((tag) => tag[0] === "imeta");
  if (!title || !imeta) return null;
  const read = (prefix: string) => imeta.slice(1).find((part) => part.startsWith(`${prefix} `))?.slice(prefix.length + 1);
  const url = read("url"); const mime = read("m"); const digest = read("x"); const dimensions = read("dim"); const alt = read("alt");
  if (!url || !mime || !digest || !isLowerHex(digest, 64)) return null;
  return { title, url, mime, sha256: digest, ...(dimensions ? { dimensions } : {}), ...(alt ? { alt } : {}) };
}

export function parseFileMetadata(event: { kind: number; tags: string[][]; content: string }): { url: string; mime: string; sha256: string; originalSha256?: string; bytes?: number; alt?: string } | null {
  if (event.kind !== 1063) return null;
  const read = (name: string) => event.tags.find((tag) => tag[0] === name)?.[1];
  const url = read("url"); const mime = read("m"); const digest = read("x"); const originalDigest = read("ox"); const size = read("size"); const alt = read("alt");
  if (!url || !mime || !digest || !isLowerHex(digest, 64) || (originalDigest && !isLowerHex(originalDigest, 64))) return null;
  const bytes = size ? Number(size) : undefined;
  if (bytes !== undefined && (!Number.isSafeInteger(bytes) || bytes < 1)) return null;
  return { url, mime, sha256: digest, ...(originalDigest ? { originalSha256: originalDigest } : {}), ...(bytes !== undefined ? { bytes } : {}), ...(alt ? { alt } : {}) };
}
