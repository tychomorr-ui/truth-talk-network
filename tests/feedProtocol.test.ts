import { describe, expect, it } from "vitest";
import { BRANCH_KIND, ENDORSEMENT_KIND, createBranchEvent, createEndorsementEvent, createNip09DeletionRequest, createNip56ReportEvent, parseBranchPayload, parseEndorsementPayload } from "../src/lib/feedProtocol";
import type { NostrEvent } from "../src/lib/nostr";

const target: NostrEvent = { id: "ab".repeat(32), pubkey: "cd".repeat(32), created_at: 1, kind: 1, tags: [], content: "fixture only", sig: "ef".repeat(64) };

describe("4Reels signed application events", () => {
  it("builds kind 40001 with strict canonical JCS content and ordered unresolved references", () => {
    const event = createBranchEvent({ kind: "BRANCH", parentEventId: target.id, parentAuthorPubkey: target.pubkey, branchType: "EXTENDS", claimStatement: "A child claim", evidenceRefs: [{ type: "URL", value: "https://source.example/item", resolution: "UNRESOLVED" }, { type: "RECEIPT_HASH", value: "12".repeat(32), resolution: "UNRESOLVED" }] }, 1_800_000_000);
    expect(event.kind).toBe(BRANCH_KIND);
    expect(event.tags).toEqual([["e", target.id], ["p", target.pubkey], ["t", "truth-talk-branch"]]);
    expect(event.content).toBe('{"branchType":"EXTENDS","claimStatement":"A child claim","evidenceRefs":[{"resolution":"UNRESOLVED","type":"URL","value":"https://source.example/item"},{"resolution":"UNRESOLVED","type":"RECEIPT_HASH","value":"' + "12".repeat(32) + '"}],"kind":"BRANCH","parentAuthorPubkey":"' + target.pubkey + '","parentEventId":"' + target.id + '"}');
    expect(parseBranchPayload(event.content).evidenceRefs.map((reference) => reference.type)).toEqual(["URL", "RECEIPT_HASH"]);
    expect(() => parseBranchPayload('{"kind":"BRANCH","parentEventId":"' + target.id + '","parentAuthorPubkey":"' + target.pubkey + '","branchType":"EXTENDS","claimStatement":"x","evidenceRefs":[],"unknown":true}')).toThrow();
  });

  it("requires a non-empty reason for kind 40002 and caps it by code point", () => {
    const endorsement = createEndorsementEvent({ endorsedEventId: target.id, endorsedAuthorPubkey: target.pubkey, reason: "Useful because it links an inspectable source.", relationship: "CITE" }, 1_800_000_000);
    expect(endorsement.kind).toBe(ENDORSEMENT_KIND);
    expect(endorsement.tags).toEqual([["e", target.id], ["p", target.pubkey], ["t", "truth-talk-reasoned-endorsement"]]);
    expect(parseEndorsementPayload(endorsement.content).relationship).toBe("CITE");
    expect(() => createEndorsementEvent({ endorsedEventId: target.id, endorsedAuthorPubkey: target.pubkey, reason: "  ", relationship: "READ_USEFUL" })).toThrow("reason");
    expect(() => createEndorsementEvent({ endorsedEventId: target.id, endorsedAuthorPubkey: target.pubkey, reason: "😀".repeat(281), relationship: "READ_USEFUL" })).toThrow("280");
  });

  it("creates voluntary report and author-only deletion events with distinct kinds", () => {
    const report = createNip56ReportEvent(target, "spam", "A voluntary report note", 1_800_000_000);
    expect(report.kind).toBe(1984);
    expect(report.tags).toEqual([["e", target.id, "spam"], ["p", target.pubkey]]);
    expect(report.content).toBe("A voluntary report note");
    expect(createNip09DeletionRequest(target, target.pubkey).kind).toBe(5);
    expect(() => createNip09DeletionRequest(target, "11".repeat(32))).toThrow("Only the key that authored");
  });
});
