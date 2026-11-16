# Nostr media upload and authorization

As of 25 October 2026, NIP-96 is marked “unrecommended” and “replaced by Blossom” in the NIPs index. NIP-B7 (“Blossom media”) is the Nostr-client integration note for Blossom, but it and the BUD documents remain drafts; most BUDs are optional. NIP-98 remains a draft HTTP-auth mechanism and is still used by NIP-96, but it is not Blossom’s current authorization-token format. These status labels describe specifications, not universal deployed compatibility. [1] [2] [3] [4]

## Protocol and browser flow

A static browser client does not itself provide file storage. It needs an HTTPS storage server operated by a user or third party, and it publishes a signed Nostr event separately to relays. A server-side product component is not required by these upload protocols, but the storage provider is. Under the no-product-server/database constraint, Truth-Talk can be a client of user-selected or external storage; it cannot claim to control availability, retention, deletion, or server-side moderation without operating or contracting for that infrastructure.

**Legacy NIP-96 path:** client discovers `/.well-known/nostr/nip96.json`, reads `api_url` and capabilities, uploads as `POST` `multipart/form-data` with a `file` field, and sends NIP-98 authorization when required. NIP-98 uses a signed kind `27235` event with exact absolute request URL (`u`) and HTTP method tags. For requests with a body, clients SHOULD add `payload` as a hex SHA-256 of the request body; server verification is optional. NIP-96’s own text instead describes an optional payload tag containing a *base64*-encoded SHA-256 of the file, not the multipart body. This is a genuine specification mismatch; providers may expect different encodings/content. NIP-96 payment-required upload behavior is explicitly undefined. [2] [5]

**Blossom path:** discover the user’s signed kind `10063` server list (BUD-03); upload the raw file bytes using `PUT /upload`, with `Content-Type`, `Content-Length`, and preferably `X-SHA-256`. BUD-02 says the server computes the SHA-256 over the exact bytes and MUST NOT alter the blob. If authorization is required, BUD-11 uses a signed kind `24242` event in `Authorization: Nostr <base64url-no-padding>`; it requires an expiry and an action tag (`t=upload`, for example), and supports scoping to server domains and file hashes. For upload, the `x` tag is required and must match `X-SHA-256`. The client therefore needs to hash the file before signing the scoped token. BUD-11 says the event content MUST explain the action to the user, though its example shows empty content; providers may differ on this draft detail. Keep tokens brief-lived and server/hash scoped, especially for delete rights. [6] [7] [8]

`window.nostr` under NIP-07 is an optional browser/extension signer interface: it exposes public-key retrieval and `signEvent`, not a storage service. A client must handle its absence and ask the signer to approve signatures; it should not assume it can access a user’s secret key. NIP-98 and Blossom authorization are distinct event kinds and formats; a signer that can sign events may be usable for either, but the storage server must implement the relevant protocol. [9] [5] [8]

Cross-origin uploads depend on the storage host’s CORS behavior. NIP-96 does not specify a browser-CORS contract. Browser requests carrying `Authorization` or using `PUT` trigger preflight under the Fetch standard; the host must approve the origin, method, and headers and allow the actual response to be shared with the web app. Blossom BUD-01 explicitly requires `Access-Control-Allow-Origin: *` on responses and preflight support including `Authorization` and `GET, HEAD, PUT, DELETE`; NIP-96 implementations must be tested individually. BUD-01’s stated method list does not include legacy NIP-96’s `POST`, another reason not to infer cross-protocol compatibility. A static client cannot bypass a provider’s CORS restrictions without a proxy/server, which is outside the approved architecture. [10] [2]

For retrieval, BUD-01 requires hash-addressed `GET /<sha256>` and recommends byte-range support for video; BUD-02 returns a descriptor with URL, hash, size, MIME type, and server upload timestamp. BUD-03 directs clients to try at least the first server in a user’s list and permits replication/mirroring; it does not guarantee that any server will accept an upload or continue serving it. Validate MIME type and actual bytes rather than trusting a filename or declared content type. [6] [7] [8]

## Receipts, media and evidence limits

A SHA-256 digest is a compact identifier that lets a verifier compare bytes against a known digest. If a downloaded file hashes to a receipt’s digest, this supports that those bytes match the digest. It does not by itself establish who created or uploaded the file, when it was created, whether it depicts a real person/event, whether it is safe, or whether a provider will retain it. Hashes also do not prove provenance: a person can hash fabricated or manipulated content. Blossom’s no-transform rule makes its blob hash correspond to stored bytes. NIP-96 permits transformation; it distinguishes original hash `ox` from saved-file hash `x`, so receipts must record which bytes each hash identifies. [7] [2] [11]

A Nostr event signature verifies that the event’s canonical content was signed by the private key corresponding to its `pubkey`; the event ID is a SHA-256 of serialized event data. A post containing a URL/hash, or a signed kind `1063` NIP-94 file-metadata event, can therefore bind that key’s signature to the referenced metadata/hash. It does not prove that the key belongs to a named human, that the timestamp is an independent trusted timestamp, or that the media’s claims are true. A server-returned Blossom descriptor or NIP-96 JSON response is not itself a cryptographically signed server receipt. If a product creates a “receipt,” it should label the signatory and evidence precisely—for example, user-key-signed hash/URL/MIME/size plus provider and response data—and must not present that as server-certified capture provenance. [11] [12] [13]

C2PA Content Credentials can cryptographically bind signed provenance assertions to an asset and help identify changes to the credential-bound asset. C2PA explicitly does not judge whether assertions are true or whether depicted content is factual; its core specification does not directly establish human identity. Credentials can be removed, and provenance may be incomplete. A valid credential is useful provenance evidence, not proof against catfishing or a guarantee of truth. [14]

For short-video surface “4Reels,” NIP-71 defines kind `22` for short-form video (kind `21` for normal video), both draft/optional. It supports `imeta` tags for media URLs, hashes, MIME types, variants and fallback URLs. NIP-94 kind `1063` is optional, and the NIP says general social clients are not expected to support it; NIP-71/92 media tags are the closer video-post representation. Store original byte hashes for each uploaded rendition and generate a new digest for any re-encoded rendition—do not reuse a source hash as if it validates a transcoded file. [12] [13] [15]

## Retention, deletion and enforcement

NIP-96 lets an upload request include an expiration timestamp, but says the server is not required to honor it. Its advertised plans may specify expiration ranges and early expiration. Blossom BUD-01 optionally allows a `Sunset` response header, explicitly advisory rather than a promise. Neither protocol assures permanent availability. BUD-12 defines deletion of a blob for an authorized uploader; where identical bytes have multiple owners, a server should remove that user’s ownership rather than remove the shared stored copy. This is a request to a particular provider, not deletion of copies, caches, mirrors, downloaded files, or Nostr posts. [2] [6] [16]

NIP-09 kind `5` is a signed request for relays to delete/stop publishing the author’s referenced event; relays SHOULD comply, but the NIP explicitly says deletion cannot be guaranteed across all relays and clients. It does not delete the separately stored media. NIP-56 kind `1984` reports signal objectionable content and let clients/relays choose how to act; they are not a universal takedown mechanism. Blossom BUD-09’s optional `/report` endpoint forwards a signed report to a server, which MAY retain reports and MAY take action. With no Truth-Talk-operated server, database, or approved moderation service, the client can present reports or provider deletion requests but cannot guarantee review, removal, identity enforcement, or global prevention of re-uploads. [17] [18] [19]

NIP-05 is explicitly “identification, not verification”: a domain’s well-known document maps an identifier to a Nostr public key. Nostr signatures and Blossom auth prove control/use of a key for a signed event or authorized action, not real-world identity. Neither NIP-05, NIP-98, nor Blossom auth is identity proofing. Strong anti-catfishing therefore cannot be claimed from these protocols alone; any identity-proofing or trusted-person verification would be a separate product process with separate evidence and privacy risks. [5] [8] [20]

## Product constraints

- For an approved static-only design, require users to select/configure an external HTTPS Blossom server (preferred current path) or an explicitly supported legacy NIP-96 provider. If no usable provider/server list is available, disable upload or ask the user to configure one; do not imply Truth-Talk stores the file.
- Prefer BUD-02 exact-byte uploads and BUD-11 short-lived, action/hash/domain-scoped tokens. Hash before upload, verify provider-returned hash and, for public retrieval, recompute SHA-256 against the hash in the post/receipt. Treat user-supplied MIME type, extension, provider descriptor and server timestamp as claims until checked.
- Exercise browser CORS against real target providers, including preflight and response handling. Do not add a proxy or product storage backend without explicit architecture approval. Plan for provider size/type limits, unsupported content, `401/402/403/413/415/429`, interrupted uploads and unavailable files.
- Treat attachments and video URLs as public and third-party hosted. State provider identity and retention limits. Distinguish original `ox` from stored/derivative `x`; version and hash each rendition. Support byte-range video playback and safe handling for arbitrary documents/files.
- Keep receipt wording narrowly factual: byte digest, referenced URL, event signer key, and observed provider response are distinct attestations. Do not label a user signature, digest, C2PA credential, NIP-05 mapping, report or deletion request as proof of truth, verified identity, permanent storage, or completed global removal.
- Specify a moderation/identity policy separately from protocol integration. Nostr reports and Blossom report endpoints only signal content to actors that may choose to act; no decentralized protocol here supplies universal moderation or identity proofing.

## References

[1]: https://github.com/nostr-protocol/nips/blob/master/README.md "NIPs repository index"
[2]: https://raw.githubusercontent.com/nostr-protocol/nips/master/96.md "NIP-96 HTTP File Storage Integration"
[3]: https://raw.githubusercontent.com/nostr-protocol/nips/master/B7.md "NIP-B7 Blossom media"
[4]: https://github.com/hzrd149/blossom "Blossom specification repository"
[5]: https://raw.githubusercontent.com/nostr-protocol/nips/master/98.md "NIP-98 HTTP Auth"
[6]: https://raw.githubusercontent.com/hzrd149/blossom/master/buds/01.md "Blossom BUD-01 server requirements and retrieval"
[7]: https://raw.githubusercontent.com/hzrd149/blossom/master/buds/02.md "Blossom BUD-02 blob upload"
[8]: https://raw.githubusercontent.com/hzrd149/blossom/master/buds/11.md "Blossom BUD-11 Nostr authorization"
[9]: https://raw.githubusercontent.com/nostr-protocol/nips/master/07.md "NIP-07 browser signer interface"
[10]: https://fetch.spec.whatwg.org/ "WHATWG Fetch Standard"
[11]: https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md "NIP-01 basic protocol and event signatures"
[12]: https://raw.githubusercontent.com/nostr-protocol/nips/master/94.md "NIP-94 file metadata"
[13]: https://raw.githubusercontent.com/hzrd149/blossom/master/buds/03.md "Blossom BUD-03 user server list"
[14]: https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html "C2PA Explainer"
[15]: https://raw.githubusercontent.com/nostr-protocol/nips/master/71.md "NIP-71 video events"
[16]: https://raw.githubusercontent.com/hzrd149/blossom/master/buds/12.md "Blossom BUD-12 blob management endpoints"
[17]: https://raw.githubusercontent.com/nostr-protocol/nips/master/09.md "NIP-09 event deletion request"
[18]: https://raw.githubusercontent.com/nostr-protocol/nips/master/56.md "NIP-56 reporting"
[19]: https://raw.githubusercontent.com/hzrd149/blossom/master/buds/09.md "Blossom BUD-09 blob reports"
[20]: https://raw.githubusercontent.com/nostr-protocol/nips/master/05.md "NIP-05 DNS identifier mapping"
