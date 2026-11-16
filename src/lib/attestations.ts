import { sha256 } from "@noble/hashes/sha2.js";
import { codePointLength, isLowerHex } from "./jcs";

export const MAX_MEDIA_BYTES = 250 * 1024 * 1024;
const CHUNK_BYTES = 2 * 1024 * 1024;
const MIME_PATTERN = /^[a-z0-9][a-z0-9!#$&^_.+-]{0,63}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,63}$/;

export type UnsignedNostrEvent = { created_at: number; kind: number; tags: string[][]; content: string };
export type MediaHashResult = { digest: string; bytes: number; mediaType: string; verifiedAt: string };
export type MediaVerificationEvidence = {
  sourceUrl: string;
  expectedDigest: string;
  digest: string;
  matches: boolean;
  bytes: number;
  mediaType: string;
  verifiedAt: string;
};
export type RemoteHashResult = MediaVerificationEvidence;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".test") || host.endsWith(".invalid")) return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split(".").map(Number);
    const [a, b] = parts;
    if (parts.some((part) => part < 0 || part > 255)) return true;
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168)) || (a === 198 && (b === 18 || b === 19));
  }
  if (host.includes(":")) {
    return host === "::" || host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe8") || host.startsWith("fe9") || host.startsWith("fea") || host.startsWith("feb") || host.startsWith("ff") || host.startsWith("2001:db8") || host.startsWith("::ffff:127.") || host.startsWith("::ffff:10.") || host.startsWith("::ffff:192.168.") || host.startsWith("::ffff:172.16.");
  }
  return false;
}

export function safePublicHttpsUrl(value: string): string {
  const raw = value.trim();
  if (/[\u0080-\uFFFF]/.test(raw)) throw new Error("Use an HTTPS URL with an ASCII hostname.");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Enter a complete public HTTPS URL."); }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password || url.hash || (url.port && url.port !== "443")) {
    throw new Error("Media references require HTTPS on port 443, with no credentials or fragment.");
  }
  if (isPrivateHost(url.hostname)) throw new Error("Private, local, and reserved hostnames or IP addresses cannot be fetched as public media.");
  return url.toString();
}

function normalizeMime(value: string, requiredPrefix?: string): string {
  const normalized = value.trim().toLowerCase();
  if (!MIME_PATTERN.test(normalized) || (requiredPrefix && !normalized.startsWith(requiredPrefix))) {
    throw new Error(requiredPrefix ? `Use a valid ${requiredPrefix} MIME type.` : "Use a valid lowercase MIME type such as application/pdf.");
  }
  return normalized;
}

function validateDigest(digest: string): string {
  const normalized = digest.trim();
  if (!isLowerHex(normalized, 64)) throw new Error("SHA-256 must be exactly 64 lowercase hexadecimal characters.");
  return normalized;
}

export async function hashLocalFile(file: File, onProgress?: (bytesRead: number, total: number) => void): Promise<MediaHashResult> {
  if (file.size > MAX_MEDIA_BYTES) throw new Error(`File exceeds the ${Math.round(MAX_MEDIA_BYTES / 1024 / 1024)} MiB in-browser hashing limit.`);
  const hasher = sha256.create();
  for (let offset = 0; offset < file.size; offset += CHUNK_BYTES) {
    const chunk = new Uint8Array(await file.slice(offset, Math.min(offset + CHUNK_BYTES, file.size)).arrayBuffer());
    hasher.update(chunk);
    onProgress?.(Math.min(offset + chunk.byteLength, file.size), file.size);
  }
  return { digest: bytesToHex(hasher.digest()), bytes: file.size, mediaType: file.type.toLowerCase() || "application/octet-stream", verifiedAt: new Date().toISOString() };
}

export async function verifyRemoteFile(urlValue: string, expectedDigestValue: string, fetcher: typeof fetch = fetch): Promise<RemoteHashResult> {
  const sourceUrl = safePublicHttpsUrl(urlValue);
  const expectedDigest = validateDigest(expectedDigestValue);
  const response = await fetcher(sourceUrl, { method: "GET", mode: "cors", credentials: "omit", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error(`The media host returned HTTP ${response.status}.`);
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_MEDIA_BYTES) throw new Error(`Remote file exceeds the ${Math.round(MAX_MEDIA_BYTES / 1024 / 1024)} MiB in-browser verification limit.`);
  const hasher = sha256.create();
  let bytes = 0;
  if (response.body) {
    const reader = response.body.getReader();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_MEDIA_BYTES) {
          await reader.cancel();
          throw new Error(`Remote file exceeds the ${Math.round(MAX_MEDIA_BYTES / 1024 / 1024)} MiB in-browser verification limit.`);
        }
        hasher.update(value);
      }
    } finally { reader.releaseLock(); }
  } else {
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > MAX_MEDIA_BYTES) throw new Error(`Remote file exceeds the ${Math.round(MAX_MEDIA_BYTES / 1024 / 1024)} MiB in-browser verification limit.`);
    bytes = buffer.byteLength;
    hasher.update(buffer);
  }
    const digest = bytesToHex(hasher.digest());
  return { digest, expectedDigest, matches: digest === expectedDigest, bytes, mediaType: (response.headers.get("content-type") ?? "application/octet-stream").split(";")[0].trim().toLowerCase(), verifiedAt: new Date().toISOString(), sourceUrl };
}

export const MAX_VIDEO_PREVIEW_BYTES = 50 * 1024 * 1024;
export type VideoPreviewResult = {
  sourceUrl: string;
  expectedDigest: string;
  digest: string;
  digestMatches: boolean;
  bytes: number;
  responseMime: string;
  verifiedAt: string;
  blob?: Blob;
};

export async function fetchRemoteVideoPreview(urlValue: string, expectedDigestValue: string, signedMimeValue: string, fetcher: typeof fetch = fetch): Promise<VideoPreviewResult> {
  const sourceUrl = safePublicHttpsUrl(urlValue);
  const expectedDigest = validateDigest(expectedDigestValue);
  const signedMime = normalizeMime(signedMimeValue, "video/");
  const response = await fetcher(sourceUrl, { method: "GET", mode: "cors", credentials: "omit", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error(`The media host returned HTTP ${response.status}.`);
  const lengthHeader = response.headers.get("content-length");
  const declaredLength = lengthHeader ? Number(lengthHeader) : Number.NaN;
  if (Number.isFinite(declaredLength) && declaredLength > MAX_VIDEO_PREVIEW_BYTES) throw new Error("Video preview exceeds the 50 MiB in-memory playback limit.");
  const responseMime = (response.headers.get("content-type") ?? "application/octet-stream").split(";")[0].trim().toLowerCase();
  if (!responseMime.startsWith("video/")) throw new Error("The media host did not return a video/* content type; no preview was created.");
  if (!response.body) throw new Error("This browser cannot stream and size-limit the remote video; no preview was created.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  const hasher = sha256.create();
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_VIDEO_PREVIEW_BYTES) {
        void reader.cancel().catch(() => undefined);
        throw new Error("Video preview exceeds the 50 MiB in-memory playback limit.");
      }
      chunks.push(value);
      hasher.update(value);
    }
  } finally { reader.releaseLock(); }
  const digest = bytesToHex(hasher.digest());
  const digestMatches = digest === expectedDigest;
  return {
    sourceUrl,
    expectedDigest,
    digest,
    digestMatches,
    bytes,
    responseMime,
    verifiedAt: new Date().toISOString(),
    ...(digestMatches ? { blob: new Blob(chunks.map((chunk) => { const copy = new Uint8Array(chunk.byteLength); copy.set(chunk); return copy.buffer as ArrayBuffer; }), { type: signedMime }) } : {}),
  };
}

export function createShortVideoEvent(input: { title: string; description: string; url: string; mediaType: string; sha256: string; dimensions?: string; alt?: string; markAsClaim?: boolean; createdAt?: number }): UnsignedNostrEvent {
  const title = input.title.trim();
  const description = input.description.trim();
  const url = safePublicHttpsUrl(input.url);
  const mediaType = normalizeMime(input.mediaType, "video/");
  const digest = validateDigest(input.sha256);
  const dimensions = input.dimensions?.trim();
  const alt = input.alt?.trim();
  if (!title || codePointLength(title) > 200) throw new Error("A short-video title is required and may not exceed 200 Unicode code points.");
  if (codePointLength(description) > 5_000) throw new Error("Description may not exceed 5,000 Unicode code points.");
  if (dimensions && !/^\d{1,5}x\d{1,5}$/.test(dimensions)) throw new Error("Dimensions must use widthxheight notation, for example 1920x1080.");
  if (alt && codePointLength(alt) > 500) throw new Error("Alternative text may not exceed 500 Unicode code points.");
  const imeta = [`url ${url}`, `m ${mediaType}`, `x ${digest}`];
  if (dimensions) imeta.push(`dim ${dimensions}`);
  if (alt) imeta.push(`alt ${alt}`);
  const tags = [["title", title], ["imeta", ...imeta]];
  if (input.markAsClaim) tags.push(["t", "truth-talk-claim"]);
  return { created_at: input.createdAt ?? Math.floor(Date.now() / 1000), kind: 22, tags, content: description };
}

export function createFileMetadataEvent(input: { description: string; url: string; mediaType: string; sha256: string; bytes?: number; originalSha256?: string; alt?: string; markAsClaim?: boolean; createdAt?: number }): UnsignedNostrEvent {
  const description = input.description.trim();
  const url = safePublicHttpsUrl(input.url);
  const mediaType = normalizeMime(input.mediaType);
  const digest = validateDigest(input.sha256);
  const originalDigest = input.originalSha256 ? validateDigest(input.originalSha256) : undefined;
  const alt = input.alt?.trim();
  if (codePointLength(description) > 5_000) throw new Error("Description may not exceed 5,000 Unicode code points.");
  if (input.bytes !== undefined && (!Number.isSafeInteger(input.bytes) || input.bytes < 1 || input.bytes > MAX_MEDIA_BYTES)) throw new Error("File size must be a positive integer within the 250 MiB verification limit.");
  if (alt && codePointLength(alt) > 500) throw new Error("Alternative text may not exceed 500 Unicode code points.");
  if (originalDigest && originalDigest === digest) throw new Error("Only provide an original digest when it is distinct from the served-file SHA-256.");
  const tags: string[][] = [["url", url], ["m", mediaType], ["x", digest]];
  if (input.bytes !== undefined) tags.push(["size", String(input.bytes)]);
  if (originalDigest) tags.push(["ox", originalDigest]);
  if (alt) tags.push(["alt", alt]);
  if (input.markAsClaim) tags.push(["t", "truth-talk-claim"]);
  return { created_at: input.createdAt ?? Math.floor(Date.now() / 1000), kind: 1063, tags, content: description };
}
