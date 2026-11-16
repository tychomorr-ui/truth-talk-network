# Nostr short-video and file metadata formats

**Checked:** 2026-10-26 against the current NIPs repository pages. These NIPs are marked draft/optional; they do not guarantee relay or client support.

NIP-71 defines regular video event kind `21` for normal videos and kind `22` for short videos. For this first release, use regular short-video kind `22`; do not use addressable kind `34236`, so the client does not imply an edit/update path. The event `content` is a video summary or description. The required `title` tag names the video. `imeta` tags, defined through NIP-92, carry the actual media URL and per-rendition metadata, including `url`, MIME type `m`, SHA-256 file digest `x`, and optionally dimensions `dim`, preview `image`, fallback URL, duration, and bitrate. Short/vertical is a stylistic category in the NIP, not a protocol-enforced duration or portrait rule. Source: [NIP-71](https://github.com/nostr-protocol/nips/blob/master/71.md).

NIP-94 defines file-metadata event kind `1063`. Its tags include the served-file URL, lowercase MIME `m`, SHA-256 digest `x`, and optional original-file digest `ox`, byte size, dimensions, preview, summary, and accessibility description. This release uses only a user-provided public HTTPS media URL and digest; there is no product upload. It sets `ox` only if an original/derivative distinction is explicitly known. Source: [NIP-94](https://github.com/nostr-protocol/nips/blob/master/94.md).

Truth-Talk must verify any displayed “digest matches” status against the exact bytes it retrieved; it must show the URL, byte count, retrieval time, and whether CORS allowed the comparison. A matching digest does not prove identity, authorship, capture time, truth, or continued availability. A local file hash is computed in-browser and does not upload the file. Neither NIP specifies a universal media-size threshold or requires auto-loading. Media previews remain user-triggered, with no autoplay.

## References

- Nostr NIPs repository, NIP-71 Video Events: https://github.com/nostr-protocol/nips/blob/master/71.md
- Nostr NIPs repository, NIP-94 File Metadata: https://github.com/nostr-protocol/nips/blob/master/94.md
- Nostr NIPs repository, NIP-92 Media Attachments: https://github.com/nostr-protocol/nips/blob/master/92.md
- Nostr NIPs repository, NIP-01 Basic Protocol: https://github.com/nostr-protocol/nips/blob/master/01.md
