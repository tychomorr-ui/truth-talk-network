# Live source contracts and implementation notes

Provider and protocol sources were reviewed on 2026-10-26 UTC (2026-10-25 local task date). These sources define direct, user-triggered reads or consent-gated publication; they do not authorize access to private accounts. Standards are mutable; current interoperability and relay support are not guaranteed.

## Grants.gov — live U.S. federal opportunities

- [Official API guide](https://grants.gov/api/api-guide)
- [Official Search2 endpoint documentation](https://grants.gov/api/common/search2)
- [Official `fetchOpportunity` detail documentation](https://www.grants.gov/api/common/fetchopportunity)
- [Official API terms and conditions](https://www.grants.gov/api/terms-conditions)
- Search endpoint: `POST https://api.grants.gov/v1/api/search2`. The browser sends only the operator’s keyword, selected `posted`/`forecasted` status filter, page size, and page offset. No Truth-Talk profile data is included.
- Detail endpoint: `POST https://api.grants.gov/v1/api/fetchOpportunity` with `{ "opportunityId": <provider result id> }`. The official documentation says authentication is not required. Provider-supplied fields stay distinguishable from local topic overlap; missing facts remain missing and the app does not infer eligibility.
- Public CORS headers were directly observed on live search and detail responses (`Access-Control-Allow-Origin: *`). The API Gateway returns 403 for browser `OPTIONS` preflights made by an `application/json` request. Truth-Talk therefore sends the unchanged JSON body with the CORS-simple `text/plain;charset=UTF-8` media type; live search and detail requests were verified from the Preview origin with HTTP 200. Opportunity details require a separate user action; the response token is not retained.
- Direct result links use the official route `https://www.grants.gov/search-results-detail/<provider-id>`. The app displays the required notice: “This product uses the Grants.gov API but is not endorsed or certified by the U.S. Department of Health and Human Services.”

## Blockstream Esplora — optional read-only Bitcoin lookup

- [Official Esplora API reference](https://github.com/Blockstream/esplora/blob/master/API.md)
- Mainnet endpoint: `GET https://blockstream.info/api/tx/<txid>/status`; testnet and signet use documented network prefixes.
- Only a 64-character hexadecimal transaction identifier is sent after explicit user action. A not-found result is “not found/not indexed,” not proof that a transaction never existed. The interface shows provider URL, retrieval time, and observed confirmation/block fields; it never describes a receipt as ownership, intent, finality, or legal proof.

## Nostr — user-selected live reads and consent-gated publication

- [NIP-01 event and relay protocol](https://github.com/nostr-protocol/nips/blob/master/01.md)
- [NIP-07 browser extension signer](https://github.com/nostr-protocol/nips/blob/master/07.md)
- [BIP-340 Schnorr signatures](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)
- No relay is contacted on page load and no relay is preselected. Before reading, the user enters and sees each validated `wss://` destination and expressly starts the query. Current feed kinds are `1`, `22`, `1063`, `40001`, and `40002`. Relay responses are untrusted and are validated for NIP-01 event structure, exact event-ID serialization, SHA-256 event ID, and BIP-340 signature before key attribution.
- The NIP-01 event ID uses its specified serialization of `[0, pubkey, created_at, kind, tags, content]`; the implementation does not replace this with JCS. `@noble/curves` 2.4.0’s Schnorr verifier is used on the already-32-byte event ID.
- The app uses a user-installed `window.nostr` signer. It requests a public key only after an explicit connect action. Before a signed event is broadcast, the user reviews the exact content, tags, event ID, content digest, signing key, and selected relay URLs, then separately consents to broadcast and accepts the signer extension’s prompt. No Nostr private key or default relay is stored by Truth-Talk.
- A relay is shown as accepting an event only when its `OK` reply is true for the exact event ID. A positive reply is one relay’s acknowledgement; it does not prove propagation, permanence, display, unique authorship, identity, or factual truth. Uncertain results are not retried automatically.

## RFC 8785 and Truth-Talk structured events

- [RFC 8785 — JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [Noble curves repository](https://github.com/paulmillr/noble-curves) · pinned package `@noble/curves` 2.4.0
- [json-canonicalize package documentation](https://www.npmjs.com/package/json-canonicalize/v/3.0.1) · pinned package `json-canonicalize` 3.0.1
- RFC 8785 JCS is used only for the structured `event.content` payloads for Truth-Talk branch kind `40001` and reasoned-endorsement kind `40002`, and for the local claim packet. Canonicalizer calls use strict undefined handling. Product validators reject unknown/missing keys, non-JSON values, invalid surrogates, invalid enum values, and over-limit strings. Array order is preserved.
- The NIP search recorded in `docs/ugc-feed-research.md` found no assignments for `40001` or `40002` in the reviewed NIPs repository revision. They are therefore labelled vendor-specific regular events, not universally supported Nostr types. Real relay acceptance remains per-user/per-relay; no public test event was posted.

## Short video, files, and voluntary moderation

- [NIP-71 short-form video](https://github.com/nostr-protocol/nips/blob/master/71.md)
- [NIP-94 file metadata](https://github.com/nostr-protocol/nips/blob/master/94.md)
- [NIP-56 reporting](https://github.com/nostr-protocol/nips/blob/master/56.md)
- [NIP-09 event deletion requests](https://github.com/nostr-protocol/nips/blob/master/09.md)
- The app’s short-video profile uses NIP-71 regular kind `22` and its required `title`, plus `imeta` URL, MIME, SHA-256 digest, and optional dimensions. The file profile uses NIP-94 kind `1063` and an `x` SHA-256 for the exact served rendition; `ox` is separate and only included if a distinct original digest is known.
- A user can hash a chosen local file in chunks in browser memory; it is not uploaded. A remote-byte verification requires a separate click and an exact HTTPS URL review, omits credentials/referrer, rejects redirects, and enforces an app byte limit. CORS, HTTP, stream, or size failures are reported as unverifiable, not as a digest mismatch. Media URLs are not loaded automatically; no thumbnail is fetched and video does not autoplay.
- `kind 1984` NIP-56 reports are voluntary signals, not adjudications, enforcement, or proof of wrongdoing. `kind 5` NIP-09 events are deletion requests, not guaranteed global removal. Local hide/mute affects only this browser. No takedown, moderation, or relay delete capability is claimed.

For a signed NIP-94 file observed in the feed, the card shows the exact signed URL and served-file `x` digest before a distinct user confirmation. A hash-only local receipt is recorded before the credentialless, no-referrer, redirect-rejecting HTTPS request; results and failures are recorded separately. The signed `ox` original digest is displayed as publisher-supplied and is not treated as checked. Verification compares exact received bytes to `x`, not the file’s origin or authorship.

Branch parents are fetched only through a separate exact-event-ID query to the user-selected relays. The returned event is verified independently and compared with the expected author key. One level of parent context is rendered with separate event-signature and author-match statuses; parent text is withheld if its signature or Truth-Talk payload schema is invalid. A fetched context event is not added to the observed top-level feed counts or discovery totals.

## Owner-declared directory and cross-node references

- The app bundles twelve corrected role/site entries and three separately categorized applications as static owner-supplied references. The panel does not fetch, probe, verify, or resolve them. Search is local; each external navigation requires a user click and carries `no-referrer`.
- The exact owner correction and dated evidence limits are recorded in `docs/ugc-research/00-user-supplied-11-node-list.md` and `docs/public-ecosystem-source-audit.md`. Listing an endpoint does not establish identity, a signed manifest, backend health, ownership, active peer status, or a mesh connection. In particular, there is no live VALKYRIE integration.
- The four supplementary references remain unresolved. Any future VALKYRIE exchange requires a versioned, operator-approved signed export/import contract and an independently pinned verification key; no such export is assumed.

## Same-browser messenger — no remote peer transport

- The messenger borrows only the owner-supplied local-tab design: Ed25519 envelopes and acknowledgements are exchanged via `BroadcastChannel` after the user opens the channel in an explicitly open tab of the same browser origin. It does not make HTTP peer requests, contact a node, run background discovery, or verify a remote peer. The owner explicitly reserved peer verification for themselves; it was not conducted here.
- A distinct Ed25519 identity is generated only by explicit user action and stored in this origin’s IndexedDB. The app explains that same-origin scripts can access the unencrypted local key and lets the user delete messenger data. It is never reused for Nostr or a node.
- The signed envelope uses canonical payloads and DAG-JSON CIDv1 via pinned `@ipld/dag-json` 11.0.1 and `multiformats` 14.0.5. Messages are capped at 4,096 Unicode code points. Backoff grows from 30 seconds to a 10-minute maximum and stops after 20 attempts; retries and cancellation are manual. Messenger bodies are stored only in the isolated messenger store, not the general receipt ledger, whose message entries contain IDs/hashes and state transitions.
- A signed acknowledgement proves only that a same-origin tab using this browser-local messenger key acknowledged the matching envelope. It does not verify a separate person, device, node, remote peer, or VALKYRIE identity.

## Privacy and hosting boundary

All external reads originate in the browser after visible user actions; there is no application proxy, API key, server, managed database, product-controlled relay, default peer, background poll, or remote storage. Relay, API, and media hosts may see request metadata such as the user’s IP address. Truth-Talk’s browser-local state may be cleared or unavailable. Platform/CDN operational processing may remain outside application control; application analytics injection is disabled.
