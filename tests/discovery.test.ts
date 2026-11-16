import { describe, expect, it } from "vitest";
import { DISCOVERY_EXPLANATION, filterLowFollowerDiscovery, type FeedRecord } from "../src/lib/discovery";

const author = "11".repeat(32);
const otherAuthor = "22".repeat(32);

function record(id: string, pubkey: string, createdAt: number, kind = 1, tags: string[][] = []): FeedRecord {
  return {
    event: { id, pubkey, created_at: createdAt, kind, tags, content: "", sig: "" },
    signatureValid: true,
    relayHosts: ["selected-relay.invalid"],
  };
}

function reasonedEndorsement(target: FeedRecord, id: string, endorser = otherAuthor, reason = "The signed references make this worth reading."): FeedRecord {
  const result = record(id, endorser, target.event.created_at + 1, 40002);
  result.endorsement = {
    endorsedEventId: target.event.id,
    endorsedAuthorPubkey: target.event.pubkey,
    relationship: "READ_USEFUL",
    reason,
  };
  return result;
}

describe("low-observed-volume discovery", () => {
  it("includes a signed claim only when a different key supplies a reasoned endorsement", () => {
    const claim = record("aa".repeat(32), author, 100, 1, [["t", "truth-talk-claim"]]);
    const prior = [91, 92, 93, 94].map((time, index) => record((index + 1).toString(16).padStart(2, "0").repeat(32), author, time));
    const endorsement = reasonedEndorsement(claim, "bb".repeat(32));
    const result = filterLowFollowerDiscovery([...prior, claim, endorsement]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ record: claim, reason: { priorObservedEvents: 4, threshold: 5, reasonedExternalEndorsements: 1 } });
  });

  it("excludes over-threshold authors, self-endorsements, blank reasons, invalid signatures, and malformed payloads", () => {
    const claim = record("cc".repeat(32), author, 100, 1, [["t", "truth-talk-claim"]]);
    const prior = [1, 2, 3, 4, 5].map((time, index) => record((index + 3).toString(16).padStart(2, "0").repeat(32), author, time));
    const self = reasonedEndorsement(claim, "dd".repeat(32), author);
    const blank = reasonedEndorsement(claim, "ee".repeat(32), otherAuthor, "   ");
    const invalid = { ...record("ff".repeat(32), otherAuthor, 110, 1, [["t", "truth-talk-claim"]]), signatureValid: false };
    const malformed = { ...record("12".repeat(32), otherAuthor, 111, 1, [["t", "truth-talk-claim"]]), payloadValid: false };
    expect(filterLowFollowerDiscovery([claim, ...prior, self, blank, invalid, malformed])).toEqual([]);
  });

  it("sorts by recency, uses only earlier observed valid events, and does not describe a score", () => {
    const older = record("13".repeat(32), author, 100, 1, [["t", "truth-talk-claim"]]);
    const newer = record("14".repeat(32), otherAuthor, 120, 22, [["t", "truth-talk-claim"]]);
    const laterEventFromAuthor = record("15".repeat(32), author, 200);
    const endorsementOlder = reasonedEndorsement(older, "16".repeat(32), otherAuthor);
    const endorsementNewer = reasonedEndorsement(newer, "17".repeat(32), author);
    expect(filterLowFollowerDiscovery([older, newer, laterEventFromAuthor, endorsementOlder, endorsementNewer]).map((item) => item.record)).toEqual([newer, older]);
    expect(DISCOVERY_EXPLANATION(5)).toBe("First claims from authors with fewer than 5 signed posts, each endorsed with a reason by at least one other author. Not a ranking of quality. Not a truth claim.");
    expect(() => filterLowFollowerDiscovery([], 0)).toThrow("1 to 100");
  });
});
