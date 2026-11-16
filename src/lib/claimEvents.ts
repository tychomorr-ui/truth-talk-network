import { codePointLength } from "./jcs";
import type { UnsignedNostrEvent } from "./attestations";
import { createFileMetadataEvent, createShortVideoEvent } from "./attestations";
import type { ClaimReference } from "./claimPacket";
import { makeClaimPacket } from "./claimPacket";

export function createIpClaimEvent(input: { statement: string; references: ClaimReference[]; packetSha256: string; createdAt?: number }): UnsignedNostrEvent {
  const statement = input.statement.trim();
  if (!statement || codePointLength(statement) > 5_000) throw new Error("A self-declared claim of 1–5,000 Unicode code points is required.");
  if (!/^[0-9a-f]{64}$/.test(input.packetSha256)) throw new Error("Claim packet SHA-256 must be 64 lowercase hexadecimal characters.");
  const references = input.references;
  const tags: string[][] = [["t", "truth-talk-claim"], ["t", "truth-talk-ip-claim"], ["x", input.packetSha256]];
  for (const reference of references) {
    if (reference.referenceSource.startsWith("https://")) tags.push(["r", reference.referenceSource]);
    else if (/^[0-9a-f]{64}$/.test(reference.referenceSource)) tags.push(["x", reference.referenceSource]);
  }
  return { created_at: input.createdAt ?? Math.floor(Date.now() / 1000), kind: 1, tags, content: statement };
}

export { createShortVideoEvent, createFileMetadataEvent, makeClaimPacket };
