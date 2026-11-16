import type { NostrEvent } from "./nostr";
import type { BranchPayload, EndorsementPayload } from "./feedProtocol";

export type FeedRecord = {
  event: NostrEvent;
  signatureValid: boolean;
  reason?: string;
  relayHosts: string[];
  branch?: BranchPayload;
  endorsement?: EndorsementPayload;
  payloadValid?: boolean;
};

export type DiscoveryReason = {
  priorObservedEvents: number;
  threshold: number;
  reasonedExternalEndorsements: number;
};

export const DISCOVERY_EXPLANATION = (threshold: number) => `First claims from authors with fewer than ${threshold} signed posts, each endorsed with a reason by at least one other author. Not a ranking of quality. Not a truth claim.`;

export function isClaimCandidate(record: FeedRecord): boolean {
  if (!record.signatureValid || record.payloadValid === false) return false;
  if (record.event.kind === 40001) return Boolean(record.branch);
  if (record.event.kind !== 1 && record.event.kind !== 22 && record.event.kind !== 1063) return false;
  return record.event.tags.some((tag) => tag[0] === "t" && (tag[1] === "truth-talk-claim" || tag[1] === "truth-talk-ip-claim"));
}

export function filterLowFollowerDiscovery(records: FeedRecord[], threshold = 5): Array<{ record: FeedRecord; reason: DiscoveryReason }> {
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) throw new Error("Discovery threshold must be an integer from 1 to 100.");
  const validRecords = records.filter((record) => record.signatureValid && record.payloadValid !== false);
  const endorsements = validRecords.filter((record) => record.event.kind === 40002 && record.endorsement);
  const candidates = validRecords.filter(isClaimCandidate);
  const results: Array<{ record: FeedRecord; reason: DiscoveryReason }> = [];
  for (const record of candidates) {
    const priorObservedEvents = validRecords.filter((other) => other.event.pubkey === record.event.pubkey && other.event.id !== record.event.id && other.event.created_at < record.event.created_at).length;
    if (priorObservedEvents >= threshold) continue;
    const reasonedExternalEndorsements = endorsements.filter((item) => item.endorsement?.endorsedEventId === record.event.id && item.endorsement.endorsedAuthorPubkey === record.event.pubkey && item.event.pubkey !== record.event.pubkey && item.endorsement.reason.trim().length > 0).length;
    if (reasonedExternalEndorsements < 1) continue;
    results.push({ record, reason: { priorObservedEvents, threshold, reasonedExternalEndorsements } });
  }
  return results.sort((left, right) => right.record.event.created_at - left.record.event.created_at || left.record.event.id.localeCompare(right.record.event.id));
}
