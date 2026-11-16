import { canonicalizeJcs, codePointLength } from "./jcs";
import { isAsciiHttpsUrl, SUPPLEMENTAL_REFERENCES } from "./ecosystem";

export const CLAIM_PACKET_VERSION = "v0.0-draft" as const;
export type ClaimReference = { referenceSource: string; contractVersion: typeof CLAIM_PACKET_VERSION; resolutionStatus: "UNRESOLVED"; evidenceType: string };

export function makeClaimReference(referenceSource: string, evidenceType: string): ClaimReference {
  const source = referenceSource.trim();
  if (source.length > 2_048) throw new Error("Evidence reference may not exceed 2,048 characters.");
  if (source.startsWith("https://") && !isAsciiHttpsUrl(source)) throw new Error("Linked references must be HTTPS with an ASCII hostname and no credentials or fragment.");
  if (!source) throw new Error("Enter a reference or content digest.");
  if (codePointLength(evidenceType) > 80) throw new Error("Evidence type may not exceed 80 Unicode code points.");
  return { referenceSource: source, contractVersion: CLAIM_PACKET_VERSION, resolutionStatus: "UNRESOLVED", evidenceType: evidenceType.trim() || "AUTHOR-DECLARED" };
}

export function makeClaimPacket(input: { claimStatement: string; authorPubkey?: string; references: ClaimReference[]; createdAt: string }): Record<string, unknown> {
  const claimStatement = input.claimStatement.trim();
  if (!claimStatement) throw new Error("Write a self-declared claim before creating a packet.");
  if (codePointLength(claimStatement) > 5_000) throw new Error("Claim statement may not exceed 5,000 Unicode code points.");
  if (input.references.length > 50) throw new Error("A claim packet may contain no more than 50 references.");
  if (input.authorPubkey && !/^[0-9a-f]{64}$/.test(input.authorPubkey)) throw new Error("Author public key must be 64 lowercase hexadecimal characters.");
  const references = input.references.map((reference) => {
    if (reference.contractVersion !== CLAIM_PACKET_VERSION || reference.resolutionStatus !== "UNRESOLVED") throw new Error("Phase-1 claim references must use the draft contract and remain unresolved.");
    return makeClaimReference(reference.referenceSource, reference.evidenceType);
  });
  return {
    schema: "truth-talk-claim-packet/v0",
    contractVersion: CLAIM_PACKET_VERSION,
    resolutionStatus: "UNRESOLVED",
    claimStatement,
    ...(input.authorPubkey ? { authorPubkey: input.authorPubkey } : {}),
    createdAt: input.createdAt,
    references,
    boundary: "SELF-DECLARED CLAIM; THIS IS NOT A LEGAL ATTESTATION OR A FINDING OF OWNERSHIP, ORIGINALITY, INFRINGEMENT, LIABILITY, VALUATION, OR PAYMENT OWED.",
  };
}

export function canonicalClaimPacket(packet: Record<string, unknown>): string {
  return canonicalizeJcs(packet);
}

export function supplementalClaimReferenceIds(): string[] {
  return SUPPLEMENTAL_REFERENCES.map((reference) => reference.id);
}
