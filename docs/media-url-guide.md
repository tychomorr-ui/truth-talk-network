# Getting a media URL for 4Reels

## The short answer

The URL field expects a **direct, publicly reachable HTTPS link to the actual video or file**. It is not a URL that Truth-Talk generates. The current site is a static browser app with no upload endpoint or configured media host, so you first need to place the final file with a hosting service you choose and control, then paste that host's direct file link here.

A sign-in link, a private share page, a local `file://` path, or a temporary browser `blob:` URL is not a usable public media URL. A link that requires a password or token should not be placed in a public signed event.

## What to do

1. Choose a file/media host that you control. Review its privacy, retention, deletion, availability, and cost settings. Only upload material you have the necessary rights to share and permission from any identifiable people shown.
2. Upload the final version of the file using that host. Copy its direct public HTTPS file URL—not its sign-in page or share-page URL. Open the exact link while signed out; it should return the file without asking you to log in. Truth-Talk does not recommend or configure a specific host.
3. If the host resizes, transcodes, recompresses, or otherwise changes the file, download the final hosted version and use that copy for the digest. In the 4Reels composer, select the file and click **Hash selected file locally**. This computes SHA-256 in the current browser; the file is not uploaded by that action. Local hashing is limited to 250 MiB.
4. Paste the direct HTTPS URL, the file's MIME type (for example, the actual `video/*` type or `application/pdf`), and the SHA-256 of the exact bytes the URL serves. A locally hashed original will not match if the host transformed the bytes after upload.
5. If you want a remote comparison, click **Verify remote bytes now** and review the browser's confirmation showing the exact URL. The remote request is an explicit, unauthenticated GET: it omits cookies, credentials, and referrer, refuses redirects, and is capped at 250 MiB. The media host may see the visitor's IP address. Browser CORS rules must allow the request; many share-link services do not.
6. Only prepare and publish a media event if you understand that its URL and content may be public to the Nostr relays and clients you select. The existing signer, exact-payload review, and separate broadcast-consent gates still apply.

## How to interpret verification

A digest match means only that the fetched bytes equal the stated SHA-256. It does not prove who made the file, who is depicted, when it was captured, whether its claims are true, whether you own the rights, or whether the host will keep serving it. A network, CORS, or redirect failure is reported as **unverifiable**; it is not a digest mismatch. Video preview additionally requires a matching digest, a video MIME type, and a file no larger than 50 MiB.

Before publishing, make sure the URL contains no password, access token, private identifier, or information you do not intend to disclose. A signed event can be copied beyond the original relay set.

## If you want uploads inside Truth-Talk

That is not currently available. Adding it would require a later explicit choice of hosting provider and upload model, plus an isolated server-side upload path, authorization and ownership rules, file-size/type controls, abuse protection, retention/deletion behavior, and cost limits. The managed project currently has no application server, database, or media-storage provider enabled. This guide does not enable one, and browser code must not contain a storage secret.
