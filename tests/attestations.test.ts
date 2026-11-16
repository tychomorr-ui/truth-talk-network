import { describe, expect, it, vi } from "vitest";
import { createFileMetadataEvent, createShortVideoEvent, fetchRemoteVideoPreview, hashLocalFile, MAX_VIDEO_PREVIEW_BYTES, safePublicHttpsUrl, verifyRemoteFile } from "../src/lib/attestations";
import { sha256HexBytes } from "../src/lib/hash";

const bytes = new TextEncoder().encode("test-only media bytes");
const digest = sha256HexBytes(bytes);

describe("user-directed media attestations", () => {
  it("hashes a locally selected Blob without uploading it", async () => {
    const blob = new Blob([bytes], { type: "VIDEO/MP4" }) as File;
    const result = await hashLocalFile(blob);
    expect(result.digest).toBe(digest);
    expect(result.bytes).toBe(bytes.length);
    expect(result.mediaType).toBe("video/mp4");
  });

  it("builds NIP-71 kind 22 only for a valid title, video MIME, HTTPS URL, and SHA-256", () => {
    const event = createShortVideoEvent({ title: "An author-named recording", description: "No capture-time claim.", url: "https://media.example/recording.mp4", mediaType: "video/mp4", sha256: digest, dimensions: "1920x1080", alt: "Screen recording", createdAt: 1_800_000_000 });
    expect(event.kind).toBe(22);
    expect(event.tags[0]).toEqual(["title", "An author-named recording"]);
    expect(event.tags[1]).toEqual(["imeta", `url https://media.example/recording.mp4`, "m video/mp4", `x ${digest}`, "dim 1920x1080", "alt Screen recording"]);
    expect(() => createShortVideoEvent({ title: "", description: "", url: "https://media.example/a.mp4", mediaType: "video/mp4", sha256: digest })).toThrow("title");
    expect(() => createShortVideoEvent({ title: "x", description: "", url: "http://media.example/a.mp4", mediaType: "video/mp4", sha256: digest })).toThrow("HTTPS");
  });

  it("builds NIP-94 kind 1063 and sets ox only when the original digest differs", () => {
    const event = createFileMetadataEvent({ description: "A user-referenced file.", url: "https://media.example/document.pdf", mediaType: "application/pdf", sha256: digest, bytes: bytes.length, originalSha256: "ab".repeat(32), createdAt: 1_800_000_000 });
    expect(event.kind).toBe(1063);
    expect(event.tags).toEqual([["url", "https://media.example/document.pdf"], ["m", "application/pdf"], ["x", digest], ["size", String(bytes.length)], ["ox", "ab".repeat(32)]]);
    expect(() => createFileMetadataEvent({ description: "", url: "https://media.example/document.pdf", mediaType: "application/pdf", sha256: digest, originalSha256: digest })).toThrow("distinct");
  });

  it("rejects non-HTTPS, credentialed, private, or fragment-bearing media references", () => {
    expect(safePublicHttpsUrl("https://media.example/file.pdf")).toBe("https://media.example/file.pdf");
    expect(() => safePublicHttpsUrl("http://media.example/file.pdf")).toThrow("HTTPS");
    expect(() => safePublicHttpsUrl("https://user:pass@media.example/file.pdf")).toThrow("HTTPS");
    expect(() => safePublicHttpsUrl("https://127.0.0.1/file.pdf")).toThrow("Private");
    expect(() => safePublicHttpsUrl("https://media.example/file.pdf#secret")).toThrow("fragment");
  });

  it("uses an explicit credential-free, no-referrer GET and reports a digest comparison", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("GET");
      expect(init?.credentials).toBe("omit");
      expect(init?.redirect).toBe("error");
      expect(init?.referrerPolicy).toBe("no-referrer");
      return new Response(bytes, { status: 200, headers: { "content-type": "video/mp4", "content-length": String(bytes.length) } });
    }) as unknown as typeof fetch;
    const result = await verifyRemoteFile("https://media.example/file.mp4", digest, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ digest, expectedDigest: digest, matches: true, bytes: bytes.length, mediaType: "video/mp4" });
  });

  it("uses bounded credentialless CORS for a video preview and creates a Blob only after a matching digest", async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init).toMatchObject({ method: "GET", mode: "cors", credentials: "omit", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer" });
      return new Response(bytes, { status: 200, headers: { "content-type": "video/mp4", "content-length": String(bytes.length) } });
    }) as unknown as typeof fetch;
    const result = await fetchRemoteVideoPreview("https://media.example/clip.mp4", digest, "video/mp4", fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ expectedDigest: digest, digest, digestMatches: true, bytes: bytes.length, responseMime: "video/mp4" });
    expect(result.blob?.type).toBe("video/mp4");
    expect(result.blob?.size).toBe(bytes.length);
  });

  it("withholds Blob playback on a digest mismatch and rejects a response over 50 MiB before streaming", async () => {
    const mismatchFetcher = vi.fn(async () => new Response(bytes, { status: 200, headers: { "content-type": "video/mp4", "content-length": String(bytes.length) } })) as unknown as typeof fetch;
    const mismatch = await fetchRemoteVideoPreview("https://media.example/clip.mp4", "ab".repeat(32), "video/mp4", mismatchFetcher);
    expect(mismatch.digestMatches).toBe(false);
    expect(mismatch.blob).toBeUndefined();

    const largeFetcher = vi.fn(async () => new Response(bytes, { status: 200, headers: { "content-type": "video/mp4", "content-length": String(MAX_VIDEO_PREVIEW_BYTES + 1) } })) as unknown as typeof fetch;
    await expect(fetchRemoteVideoPreview("https://media.example/large.mp4", digest, "video/mp4", largeFetcher)).rejects.toThrow("50 MiB");
  });
});
