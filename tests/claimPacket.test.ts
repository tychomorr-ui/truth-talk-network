import { describe, expect, it } from "vitest";
import { canonicalClaimPacket, makeClaimPacket, makeClaimReference, supplementalClaimReferenceIds } from "../src/lib/claimPacket";

const author = "ab".repeat(32);
const reference = makeClaimReference("https://keira.nexinus.net/evidence/packet-7", "SIGNED-EXPORT-REQUESTED");

function packet(claimStatement = "An author-declared idea, not a title determination.") {
  return makeClaimPacket({ claimStatement, authorPubkey: author, references: [reference], createdAt: "2026-10-26T00:00:00.000Z" });
}

describe("self-declared IP claim packets", () => {
  it("creates a JCS-compatible, explicitly unresolved packet with a legal boundary", () => {
    const value = packet();
    const encoded = canonicalClaimPacket(value);
    const decoded = JSON.parse(encoded) as Record<string, unknown>;
    expect(decoded.contractVersion).toBe("v0.0-draft");
    expect(decoded.resolutionStatus).toBe("UNRESOLVED");
    expect(decoded.authorPubkey).toBe(author);
    expect(decoded.boundary).toContain("NOT A LEGAL ATTESTATION");
    expect(decoded.references).toEqual([{ referenceSource: "https://keira.nexinus.net/evidence/packet-7", contractVersion: "v0.0-draft", resolutionStatus: "UNRESOLVED", evidenceType: "SIGNED-EXPORT-REQUESTED" }]);
    expect(encoded).not.toContain(": ");
  });

  it("rejects blank or overlong claims, invalid author keys, and more than fifty references", () => {
    expect(() => makeClaimPacket({ claimStatement: " ", references: [], createdAt: "now" })).toThrow("Write a self-declared claim");
    expect(() => packet("x".repeat(5_001))).toThrow("5,000");
    expect(() => makeClaimPacket({ claimStatement: "Claim", authorPubkey: "AB".repeat(32), references: [], createdAt: "now" })).toThrow("lowercase hexadecimal");
    expect(() => makeClaimPacket({ claimStatement: "Claim", references: Array.from({ length: 51 }, () => reference), createdAt: "now" })).toThrow("50 references");
  });

  it("rejects a changed or resolved phase-one reference and unsafe external URL strings", () => {
    expect(() => makeClaimReference(" ", "DOCUMENT")).toThrow("Enter a reference");
    expect(() => makeClaimReference("https://keira.nexinus.net/claim#private", "DOCUMENT")).toThrow("fragment");
    expect(() => makeClaimReference("https://média.example/file", "DOCUMENT")).toThrow("ASCII hostname");
    const resolvedReference = { ...reference, resolutionStatus: "RESOLVED" } as unknown as typeof reference;
    expect(() => makeClaimPacket({ claimStatement: "Claim", references: [resolvedReference], createdAt: "now" })).toThrow("remain unresolved");
  });

  it("returns only the reviewed static supplementary reference categories", () => {
    expect(supplementalClaimReferenceIds()).toEqual(["digital-ore", "truth-substrate", "archangel-noop"]);
  });
});
