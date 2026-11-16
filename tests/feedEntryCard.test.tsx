import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FeedEntryCard } from "../src/components/FeedEntryCard";
import type { FeedRecord } from "../src/lib/discovery";
import type { NostrEvent, NostrUnsignedEvent } from "../src/lib/nostr";
import type { MediaVerificationEvidence } from "../src/lib/attestations";

const author = "01".repeat(32);
const otherAuthor = "02".repeat(32);
const signature = "03".repeat(64);
const digest = "ab".repeat(32);

function event(kind: number, content: string, tags: string[][] = [], pubkey = author, id = "11".repeat(32)): NostrEvent {
  return { id, pubkey, created_at: 1_782_406_800, kind, tags, content, sig: signature };
}

function baseRecord(signedEvent: NostrEvent): FeedRecord {
  return { event: signedEvent, signatureValid: true, relayHosts: ["relay.example"] };
}

function renderCard(record: FeedRecord, options: { records?: FeedRecord[]; resolvedParent?: FeedRecord } = {}) {
  const noop = () => undefined;
  const asyncNoop = async (_nostrEvent: NostrEvent, _evidence: MediaVerificationEvidence) => true;
  const asyncAttemptNoop = async (_nostrEvent: NostrEvent, _url: string, _expected: string, _stage: "requested" | "failed", _reason?: string) => true;
  return renderToStaticMarkup(
    <FeedEntryCard
      record={record}
      records={options.records ?? [record]}
      signerPubkey={author}
      localHidden={false}
      localMuted={false}
      resolvedParent={options.resolvedParent}
      onHide={noop}
      onMute={noop}
      onBranch={noop}
      onEndorse={noop}
      onPrepare={(_draft: NostrUnsignedEvent, _label: string) => undefined}
      onFetchParent={noop}
      onMediaAttempt={asyncAttemptNoop}
      onMediaVerification={asyncNoop}
    />,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("FeedEntryCard", () => {
  it("renders a fetched parent as one-level context with separate signature and author status", () => {
    const branchEvent = event(40001, "signed branch payload");
    const branch: FeedRecord = {
      ...baseRecord(branchEvent),
      branch: {
        kind: "BRANCH",
        parentEventId: "22".repeat(32),
        parentAuthorPubkey: author,
        branchType: "EXTENDS",
        claimStatement: "A later, independently authored claim.",
        evidenceRefs: [],
      },
      payloadValid: true,
    };
    const parent = baseRecord(event(1, "Original signed parent context.", [], author, "22".repeat(32)));

    const markup = renderCard(branch, { records: [branch], resolvedParent: parent });

    expect(markup).toContain("Parent context · kind 1");
    expect(markup).toContain("SIGNATURE VALID · AUTHOR MATCH");
    expect(markup).toContain("Original signed parent context.");
    expect(markup).toContain("one-level, explicitly resolved context preview");
  });

  it("withholds parent text when that parent's signature did not verify", () => {
    const branchEvent = event(40001, "signed branch payload");
    const branch: FeedRecord = {
      ...baseRecord(branchEvent),
      branch: {
        kind: "BRANCH",
        parentEventId: "22".repeat(32),
        parentAuthorPubkey: author,
        branchType: "DISPUTES",
        claimStatement: "A separate dispute.",
        evidenceRefs: [],
      },
      payloadValid: true,
    };
    const parent: FeedRecord = {
      ...baseRecord(event(1, "Do not display this invalid parent text.", [], author, "22".repeat(32))),
      signatureValid: false,
      reason: "The event signature is invalid.",
    };

    const markup = renderCard(branch, { records: [branch], resolvedParent: parent });

    expect(markup).toContain("SIGNATURE INVALID");
    expect(markup).toContain("Parent content is withheld.");
    expect(markup).not.toContain("Do not display this invalid parent text.");
  });

  it("does not fetch or embed the remote bytes of a NIP-94 file during render", () => {
    const fetchSpy = vi.fn(async () => new Response("unexpected", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const file = event(1063, "Document reference.", [
      ["url", "https://media.example/claim.pdf"],
      ["m", "application/pdf"],
      ["x", digest],
      ["ox", "cd".repeat(32)],
      ["size", "128"],
    ]);

    const markup = renderCard(baseRecord(file));

    expect(markup).toContain("Verify bytes against the signed SHA-256");
    expect(markup).toContain("Open this exact URL after review");
    expect(markup).toContain("Signed file URL · https://media.example/claim.pdf");
    expect(markup).toContain("publisher-supplied original digest (ox), not checked");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not embed or fetch remote NIP-71 video bytes until an explicit user action", () => {
    const fetchSpy = vi.fn(async () => new Response("unexpected", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const video = event(22, "Short clip description.", [
      ["title", "Owner-attested short clip"],
      ["imeta", "url https://media.example/clip.mp4", "m video/mp4", `x ${digest}`, "dim 640x360"],
    ]);

    const markup = renderCard(baseRecord(video));

    expect(markup).toContain("Verify bytes and load preview");
    expect(markup).not.toContain("<video");
    expect(markup).not.toContain("src=\"https://media.example/clip.mp4\"");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
