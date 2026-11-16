# Media preview privacy and integrity behavior

Reviewed on 2026-10-26 against the public MDN HTML Media API references:

- `HTMLMediaElement.crossOrigin` documents that the `anonymous` value uses CORS with the `same-origin` credentials mode. Cross-origin media requests therefore do not include cross-origin credentials; same-origin requests can still use same-origin credentials when this attribute is used.
- MDN’s `<video>` reference documents `crossorigin="anonymous"` and its credential behavior. It does not document `referrerpolicy` as a `<video>` attribute. Truth-Talk therefore does not rely on an unsupported media-element attribute to claim referrer protection.
- The implemented playback path makes no request until the user clicks and confirms the exact public HTTPS URL. It uses the Fetch API with `mode: "cors"`, `credentials: "omit"`, `cache: "no-store"`, `redirect: "error"`, and `referrerPolicy: "no-referrer"`; it enforces a 50 MiB streaming cap; and it hashes the returned bytes before constructing a local in-memory Blob. The video player reads that temporary Blob URL rather than the remote URL. A Blob is exposed only when the digest equals the signed NIP-71 `x` value; mismatches are recorded and playback is withheld. The temporary object URL is revoked on discard or unmount.
- A CORS rejection, redirect, non-video content type, timeout/stream failure, oversized body, or digest mismatch is not presented as verified media. The external host may observe the browser’s IP address. The static file-open action remains a separate, user-clicked external navigation and is not described as a credentialless fetch.

Sources:

1. MDN, `HTMLMediaElement: crossOrigin property`: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/crossOrigin
2. MDN, `<video> HTML video embed element`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video
3. MDN, Fetch API Request options (for `credentials`, `redirect`, and `referrerPolicy`): https://developer.mozilla.org/en-US/docs/Web/API/Request

This review involved only reading standards documentation. No media URL was contacted.
