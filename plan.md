# Truth-Talk feed, branching, endorsements, and discovery — approved plan

**Status (2026-10-26):** The owner’s latest instruction explicitly authorizes implementation of the feed, corrected directory, and compatible local messaging behavior in this standalone Truth-Talk project. Public relay test posts remain excluded until a separate final confirmation shows the exact payload and destination. The owner said peer verification will be done themselves, so this task does not contact remote peers. The current production URL remains blocked by a host billing-gate page; no payment or account changes are authorized.

## Product boundary and first release

Build the requested live feed inside the existing independent Truth-Talk React/Vite application. Keep it static and browser-first. Do not add an application server, managed database, central user-account system, product-controlled relay, media store, payment rail, or direct integration to VALKYRIE. Add no files, imports, routes, tables, keys, model registry, runtime state, or adapters to `/home/ubuntu/tesseract-sovereign`. Any future VALKYRIE exchange is permitted only through a versioned, operator-approved signed export/import contract; no live integration exists.

Use Nostr-compatible events for real, live feed reads and user-approved publication. Truth-Talk is an original evidence-first product with its own claim-branching, reasoned-endorsement, receipt, and reference workflows. Aim to outperform existing platforms on measurable provenance, key-signature verification, exact media integrity, user control, and honest status disclosure. Keep the visual identity original; do not copy competitor marks or imply affiliation. Do not publish an unqualified “better than Nostr, Reddit, or TikTok” claim without independent, reproducible comparative evidence. External relays remain responsible for their own availability, moderation, retention, and propagation.

No relay is contacted on page load. The user enters and sees each relay destination, then deliberately starts a read-only feed request. The NIP-07 signer is used only after review of the exact event, media/reference content, and destination; its private key remains in the user’s extension and is never copied into Truth-Talk. Before a public post, show the exact payload and destinations and require separate explicit consent. No test post will be sent until a final confirmation shows that exact payload and destination.

The first release supports live feed reads, signed claim/branch/endorsement events, NIP-71 kind-22 short-video references, NIP-94 kind-1063 file references, and a local content-address check where browser CORS permits retrieval. Media must already be hosted at a user-supplied public HTTPS URL. Selecting a local file for SHA-256 calculation does not upload it. In-feed NIP-94 cards show the signed URL, served-byte `x` digest, and separate publisher-supplied `ox` value (if present); a remote-byte check starts only after an exact-URL, byte-limit, no-credentials/no-referrer disclosure and user confirmation. Save a hash-only local request receipt before fetching and a result or failure receipt afterward; a blocked/oversized/HTTP fetch is unverifiable, not a mismatch. Video bytes load only after explicit confirmation, verified SHA-256 match, and successful local result receipt; playback uses a temporary browser Blob. Direct media upload stays disabled until a specific provider and its validation, CORS, limits, retention, deletion, abuse response, and protocol compatibility are reviewed and separately approved.

Use the descriptive interface label **Short video**. “4Reels” remains a working name pending broader trademark review. Do not use competitor marks or imitate their visual identities. Do not promise that hashing eliminates catfishing: a valid event signature means that a Nostr key signed an event, not that the key maps to a known human, and a matching digest is a byte-level comparison, not proof of truth or provenance.

## Nostr event-kind and canonicalization decision

The official Nostr NIPs repository was checked at commit `d47a2ec8aacb9d01ac00e6294ae77582f483ff68`. A repository-wide search of its Markdown files found no assignments or mentions for kinds `40001` or `40002`. NIP-01 allows a kind integer from 0 through 65535, but its listed regular, replaceable, ephemeral, and addressable kind conventions do not assign these two values. Unless a NIP assigns them before implementation is released, document `40001` and `40002` as **Truth-Talk vendor-specific regular events**. Relay storage/query/acceptance for unrecognized kinds is not guaranteed; show actual per-relay `OK` or rejection responses and never infer universal support.

For event `content`, serialize the defined JSON payload with RFC 8785 JSON Canonicalization Scheme (JCS). Keep IDs, pubkeys, digests, enum values, and `contractVersion` as strings. Reject duplicate/unknown payload properties, invalid Unicode, invalid field values, and over-length strings before signing. Preserve evidence-reference array order. NIP-01’s event ID must still be calculated using the NIP-01 serialization of `[0, pubkey, created_at, kind, tags, content]`; **do not** substitute JCS for the outer NIP-01 event-ID serialization. These are two distinct serialization steps.

Use NIP-01 `e` and `p` tags for relay indexing of referenced events/authors, while keeping the complete user-defined relationships in canonical `content`. A relay’s acknowledgement is per relay only. A branch can be validly signed while its parent is unresolved or has an invalid signature; display child signature, parent resolution, and parent signature as separate statuses.

## Branching primitive — kind 40001

Publish ordinary, independently signed Nostr events of kind `40001`. The JCS-canonicalized JSON string in `event.content` follows this shape:

```json
{
  "kind": "BRANCH",
  "parentEventId": "<64 lowercase hex>",
  "parentAuthorPubkey": "<64 lowercase hex>",
  "branchType": "DERIVES_FROM | DISPUTES | EXTENDS | LICENSES",
  "claimStatement": "<string, at most 5000 Unicode code points>",
  "evidenceRefs": [
    {
      "type": "URL | MANIFEST_CID | RECEIPT_HASH | SUBSTRATE_CID | CLAIM_PACKET_ID",
      "value": "<string>",
      "resolution": "UNRESOLVED"
    }
  ]
}
```

The branch is signed by its author’s NIP-07 key. No private key is placed on a server or persisted by the app. The required `parentEventId` must be a 64-character lowercase hexadecimal ID and `parentAuthorPubkey` must be a 64-character lowercase hexadecimal pubkey. `claimStatement` is limited to 5000 Unicode code points. `branchType` is restricted to the listed values. Evidence references are schema-validated; their Phase-1 `resolution` is always `UNRESOLVED`.

When a user opens a branch, look for its parent in the in-memory event cache. If not present, offer an explicit “Try fetching parent” action against the currently selected relays, using the exact event ID and expected author. If it cannot be fetched, keep the branch visible with parent status “UNRESOLVED” and a retry link, not a broken link. Verify the parent independently if found. Show both “signed by key X” and “parent resolved/unresolved”; do not merge those statuses. Render the branch as a normal event in the live feed; show one level of fetched/signed parent context within its card and include the expected and returned author keys. Withhold parent content when its signature or schema fails, and clearly label a validly signed wrong-author result. A separately fetched parent remains context, not a new top-level feed event or discovery-count input. A branch whose parent is unavailable is not itself invalid.

Acceptance evidence for this extension is deterministic local testing of a signed branch, valid and missing-parent states, wrong-parent-author handling, preserved event JSON, and display of independent signature/parent states. Do not publish a public test branch without the user’s separate final confirmation of the exact event and relay destination.

## Signal endorsements — kind 40002

Publish kind `40002` signed public statements. Its JCS-canonicalized JSON content has this form:

```json
{
  "endorsedEventId": "<64 lowercase hex>",
  "endorsedAuthorPubkey": "<64 lowercase hex>",
  "reason": "<required plain-text string, at most 280 Unicode code points>",
  "relationship": "READ_USEFUL | DISSENT | AMPLIFY | CITE"
}
```

Reject an empty reason. The event is a signed reference; it is not a vote, like, quality score, truth score, or proof that the cited claim is correct. Verify the endorsing author’s event signature. Display counts only as “N signed endorsements, M of which include a reason.” Only valid, verified events targeting the exact claim count; mark self-endorsements distinctly and do not treat them as an endorsement by “another author” for discovery. Never aggregate counts into a score or popularity rank.

The live-feed filter “claims with at least one signed endorsement including a reason” is a disclosed filter, not an engagement ranking. It operates on valid endorsement events observed on the user-selected relays and reports that scope. Acceptance evidence is deterministic local testing of exact-target binding, required non-empty reason, relationship limits, valid event signature, self-endorsement handling, and count-only display. Do not publish a public test endorsement without the user’s separate final confirmation of exact payload and relay destination.

## Low-follower discovery

Add a discovery view that is a filter over the same live relay feed, not a separate index. Its default threshold is `N = 5` prior verified events; the user may configure N. Include only claims that are signature-valid and have at least one valid signed endorsement from a different author with a non-empty reason. Sort by recency only, using the author-supplied Nostr `created_at` value and labelling it as such. Never rank by endorsements or imply quality or truth.

Because a client cannot know every event stored by every relay, calculate “prior verified events” only from the events actually observed by this client on the currently selected relays. Display that scope and never call it a follower count or a network-wide lifetime total. The visible explanation must state: “First claims from authors with fewer than N signed posts, each endorsed with a reason by at least one other author. Not a ranking of quality. Not a truth claim.” Add the material scope limitation that “fewer than N” means fewer than N prior valid signed events observed by this client in the selected relay results, not a universal account-history count.

Acceptance evidence: preserve the filter implementation in `src/lib/discovery.ts` and deterministically test inclusion of a signature-valid claim with at least one reasoned signed endorsement from a different author, exclusion of a fresh-author claim with none, exclusion when N or more prior verified posts are observed, recency sorting, and the exact explanation text. The app does not fetch or use follower counts. Do not create public test events without separate final confirmation of the payload and destination.

## Ecosystem reference panel and Phase-1 claim packet

Add a read-only reference selector to the Claim Packet composer. Every selected reference is visibly labelled **SELF-SUPPLIED REFERENCE, UNVERIFIED**. Do not fetch, import, resolve, or verify any ecosystem reference in Phase 1. The reference panel and composer perform no network request when rendered. A reference link is clickable only after a user action and only if it is HTTPS with an ASCII hostname. Any other URL is retained as text and is not linked.

Show these four reference categories:

- Digital Ore Refinery: `https://universaltruth.life/digital-ore` (the `/digitalore` path returned 404; use the corrected hyphenated path).
- Truth Substrate: `https://universaltruth.life/sudo-coin`, with the user-supplied status note “CURRENTLY UNAVAILABLE — ‘Failed to fetch’ observed on 2026-10-24.” Identify the note’s stated observation date as user-supplied. The site was independently read on 2026-10-26 and also displayed “Failed to fetch”; neither observation is a live availability guarantee.
- ARCHANGEL control plane: `https://archangelcp-sbwmjhce.manus.space`, displayed as “NOOP_ONLY — external mutation disabled” and “SELF-SUPPLIED REFERENCE, UNVERIFIED.” Truth-Talk makes no request to this host.
- Any URL the author provides, following the same HTTPS/ASCII-hostname and no-fetch rules.

Each reference included in claim-packet JSON must carry `contractVersion: "v0.0-draft"`, `resolutionStatus: "UNRESOLVED"`, and the exact author-supplied `referenceSource` URL. The user’s static reference categories may be suggested in the UI but are included in an event only when the author deliberately selects them. Never convert them to “verified” or “resolved” from a page title, a hash, a fetch, or a relay receipt.

Acceptance evidence: a screenshot of the panel showing all four categories, the corrected Digital Ore URL, the exact user-supplied Truth Substrate status note, and the ARCHANGEL status; a browser/network check demonstrating panel rendering made no request to any listed host; and a preview of the claim-packet JSON with each reference `UNRESOLVED` and its exact `referenceSource`.

## Ecosystem directory — read-only references, not integrations

The owner’s latest instruction approves the read-only directory using the corrected catalog in [`docs/ugc-research/00-user-supplied-11-node-list.md`](docs/ugc-research/00-user-supplied-11-node-list.md). The owner clarified that the two Tesseract sites have distinct roles, KEIRA and VALKYRIE should use their custom domains, and Property Maintained, Native Grounds, and Xinus Portfolio are separate applications. The current information yields twelve named system/site roles plus three additional apps; this is a product directory count, **not a verified mesh-node count**.

Use `https://universaltruth.life` for the owner-designated TESSERACT-TERMINUS/provenance console and `https://tesseract.manus.space` for the distinct Tesseract recovery mirror. Use `https://keira.nexinus.net` and `https://valkyrie.nexinus.net` as the owner-designated public sites; omit the superseded `sovereignapp-hkcgwye7.manus.space` and `xinusdash-doy5g86k.manus.space` URLs from the canonical catalog. Keep `https://tribalcoff-y9afmafg.manus.space` as the separate Native Grounds app, not a Resonate Earth mirror. Include the other supplied role sites and Property Maintained/Xinus Portfolio as catalogued in the roster note. Label owner-provided role/domain associations **OWNER-SUPPLIED; NOT CRYPTOGRAPHICALLY VERIFIED**. The owner says Manus-hosted pages may be public front ends rather than live service/backend URLs; show that as owner-reported, not as a verified runtime fact.

The public-page review at [`docs/ugc-research/11-node-public-review.md`](docs/ugc-research/11-node-public-review.md) contains historical observations from the earlier URLs and a dated correction. Direct page extraction from corrected KEIRA and VALKYRIE domains returned relevant public text, but numeric HTTP statuses, identity manifests, signatures, ownership, backend operation, and mesh enrollment were not verified. ARCHANGEL remains authentication-gated. No public page, role text, page-extractor result, or “Connection active” label establishes node identity or active peer state. The owner’s reported HTTP 200 and signed-manifest claims remain unverified.

All ecosystem references are static links that require an explicit click. Rendering the directory, composing a claim packet, or selecting a reference must not contact any listed host. The catalog is not a health monitor, enrollment workflow, resolver, ownership proof, or connector. The four supplementary references (Digital Ore, Truth Substrate, ARCHANGEL, and an author-supplied URL) retain the earlier Phase-1 UNVERIFIED rules. Any future VALKYRIE data exchange still requires a versioned, operator-approved signed export/import contract; no live integration is planned here.

Acceptance evidence for the approved directory: show all twelve owner-designated role/site entries and the three named standalone applications, clearly separating product/site entries from verified node claims; show Tesseract mirror and terminus as distinct, KEIRA and VALKYRIE at the corrected custom domains, and Native Grounds as separate from RESONATE EARTH; label supplied roles/mappings unverified and identify the Manus-hosted pages as owner-described front ends; and verify that rendering the directory makes zero requests to those sites.

## Future ecosystem contract stub — document only, do not implement

Create `docs/ecosystem-reference-contract-v0.md`. It documents only a proposed future reference envelope for a Digital Ore record, Truth Substrate CID, or ARCHANGEL receipt. Its required fields are `contractVersion` set to `"v0.0-draft"`, `resolutionStatus` set to `"UNRESOLVED"`, and `referenceSource` set to the URL the author pasted. Include this exact statement:

> Any version of this contract that claims a reference is RESOLVED requires a signed export from the referenced system and independent verification against a pinned key. That system does not currently produce such exports. Therefore no reference is RESOLVED in any Phase 1 deployment.

This is a documentation-only stub. No Phase-1 code path resolves an ecosystem reference or connects to Digital Ore, Truth Substrate, ARCHANGEL, or VALKYRIE. Acceptance evidence is the exact contract document plus source inspection confirming there is no Phase-1 resolution path.

## Intellectual-property claim language and safety

Add a self-declared Claim Packet flow for an author to describe an idea, requested attribution or licensing response, dated evidence references, and optional file digests. The packet is an authored claim, not a finding of ownership, originality, infringement, liability, fair use, valuation, award, or payment owed. Do not calculate royalties or imply that a manifesto, a content hash, or a Nostr signature creates an enforceable dividend, intellectual-property right, or DOU transfer. Preserve the clear statement: **this is not a legal attestation**.

Present an 18+ self-attestation before public-feed surfaces without collecting date of birth or implying age verification. Before signing, show a public-disclosure notice and require the author to confirm they have rights to share the material and consent from identifiable people shown. Warn about credentials, private keys, tokens, personal data, confidential/proprietary files, and public network addresses. A client-side warning is not a guarantee against disclosure.

Offer best-effort local hide/mute and NIP-56 report actions. Distinguish those from relay moderation, provider takedown, and NIP-09 deletion requests. State that independent relays, hosts, caches, downloads, screenshots, and copies are outside Truth-Talk’s control. Do not promise global moderation, complete removal, real-world identity verification, universal copyright compliance, or unapproved service-level response times. Before public launch as a hosted user-content service, the owner must review applicable Manus Terms, Usage Policy, Safety & Content Policy, and Privacy Policy; supply project-specific terms/privacy and a genuine complaint/takedown contact. No contact address was provided and none will be invented.

## Technical structure

Keep the current one-page route `/` and the matching `public/manus-routes.json`. Preserve the existing app and keep responsibilities in the actual, focused modules:

- `src/lib/nostr.ts` owns NIP-01 event IDs, NIP-07 signing, strict event/Schnorr verification, explicit relay reads, exact-parent lookup, and per-relay publish/read outcomes.
- `src/lib/jcs.ts` owns strict RFC 8785 handling for vendor-event content and local claim packets; it never replaces the NIP-01 outer event-ID serialization.
- `src/lib/feedProtocol.ts` validates branch/endorsement schemas, their reference tags, NIP-56 reports, author-only NIP-09 deletion requests, and NIP-71/NIP-94 media tags.
- `src/lib/discovery.ts` owns the disclosed same-feed filter, observed-event author counts, and recency-only ordering; `src/lib/feedStorage.ts` persists browser-local hide/mute filters.
- `src/lib/ecosystem.ts` owns the corrected twelve role/site entries, three separate apps, four supplementary reference categories, and non-operative, always-unresolved cross-node contracts; it makes no network requests.
- `src/lib/attestations.ts` owns chunked local SHA-256, HTTPS/private-host validation, size-bounded credentialless remote byte verification, and video Blob preview only after digest match.
- `src/lib/claimPacket.ts` and `src/lib/claimEvents.ts` own self-declared IP packet serialization, evidence references, digest binding, and review-only event preparation.
- `src/lib/messaging.ts` and `src/lib/localMessengerStore.ts` own local Ed25519 envelopes/acknowledgements, DAG-JSON CIDv1, BroadcastChannel exchange, IndexedDB, and bounded local retry state; no HTTP peer transport is implemented.
- `src/lib/receipts.ts` and `src/lib/hash.ts` own the local hash-linked ledger and raw SHA-256 primitives; content bodies and private keys stay outside the general receipt ledger.
- `src/components/FeedStudio.tsx` coordinates user-initiated relay reads, consent-gated publication, parent resolution, composer navigation, and privacy-minimal receipts. `FeedEntryCard.tsx` renders verified posts, one-level parent context, local actions, and explicit NIP-94/video hash controls.
- `src/components/FeedComposers.tsx`, `MediaComposer.tsx`, and `ClaimComposer.tsx` prepare branches, endorsements, media events, and self-declared IP packets for exact review before signing. `DiscoveryPanel.tsx` explains inclusion and relay-count limits; `EcosystemReferencePanel.tsx` is click-only; `LocalMessengerPanel.tsx` requires explicit local identity creation and stays same-origin.
- `src/App.tsx` keeps one-page module navigation and lazy-loads the feed/messenger; existing readiness, `BroadcastStudio`, Chain Witness, profile, and receipt panels remain independent. `src/styles.css` retains the current dark evidence-studio design with responsive feed, media, and parent-context treatments.
- `docs/live-sources.md`, `docs/public-ecosystem-source-audit.md`, `docs/ugc-research/`, and `docs/user-supplied-messaging-review.md` preserve sourced facts and owner-reported limits. The requested script is `docs/truth-economy-vs-trust-economy-presentation-script.md`; `docs/ecosystem-reference-contract-v0.md` remains non-operative.
- Deterministic local tests cover RFC 8785 vectors, NIP-01 IDs/BIP-340 signatures, malformed and Unicode payloads, schema limits, parent success/missing/wrong-author, discovery inclusion/exclusion, corrected directory labels and zero-fetch rendering, exact consent, relay failures, local file/video digest handling and request suppression, Ed25519/CID tamper detection, same-origin acknowledgements, retry/backoff, and receipt-chain integrity. No fake relay acknowledgement is shown as live success; production includes no seeded feed events.

## Visual direction

Reuse the current dark evidence-studio style rather than copying Instagram, TikTok, or Reddit. Keep the left module rail and build an asymmetric editorial claim stream with a narrow provenance margin rather than a generic card grid.

- **Design movement:** civic signal atelier—an evidence-forward, restrained editorial interface built around inspectable public records.
- **Core principles:** provenance before popularity; deliberate consent at every public boundary; identity humility; privacy-first media loading.
- **Color philosophy:** retain charcoal/forest surfaces and Truth-Talk acid lime. Lime signals protocol checks only, never factual truth or human identity. Use mint for neutral transport, amber for uncertainty, and red for errors.
- **Layout paradigm:** one primary stream with a slim provenance spine; preserve the existing mobile two-column module navigation and render posts in one readable column.
- **Signature elements:** a key-and-event verification strip; a parent/branch resolution line; and a receipt spine connecting a signed event to each relay acknowledgement.
- **Interaction philosophy:** no autoplay, no default relay connection, no media load before user action, and no publication before exact-payload review.
- **Animation:** restrained status transitions; honor reduced-motion preferences; never animate or autoplay user media.
- **Typography system:** retain the current system sans-serif for reading and monospace for IDs, digests, timestamps, and relay metadata. Do not load remote fonts.
- **Brand essence:** “A public notebook for claims that shows exactly what a key signed, what its references say, and what a digest matched.” Personality: candid, exacting, humane.
- **Brand voice:** precise, non-promissory microcopy. Examples: “The key signed this branch. Its parent is unresolved.” “A signed endorsement is a reference, not a score.”
- **Wordmark & logo:** preserve the existing Truth-Talk mark; add a branched event-to-receipt line motif. Do not use the Instagram/Reels mark or imitate a competitor.
- **Signature brand color:** Truth-Talk acid lime `#D9FF62`, used for verified protocol checks only.

## Existing project and release responsibilities

The source remains `/home/ubuntu/truth-talk-network`; the managed static copy remains `/home/ubuntu/truthnet`. Preserve existing readiness/Dark Mirror, live Grants.gov, approval-gated broadcast, Chain Witness, and browser-local ledger workflows. Keep preview/public deployment static-only. The current managed production publish job is recorded, but the public URL renders a host billing-gate page; do not repeat publication or make account/payment changes while that blocker remains.

## Scope amendment status

The base feed/branch/endorsement scope and corrected ecosystem directory are approved for implementation by the owner’s latest instruction. This supersedes the earlier scope hold. Public relay posting remains separately consent-gated, and the owner reserved remote peer verification for themselves. Treat the comparative ambition as a measurable product goal, not an unsupported blanket marketing claim.

## Research notes

The protocol and UGC evidence synthesis is in [`docs/ugc-feed-research.md`](docs/ugc-feed-research.md). The owner-corrected ecosystem catalog is in [`docs/ugc-research/00-user-supplied-11-node-list.md`](docs/ugc-research/00-user-supplied-11-node-list.md); the public-page audit and correction history are in [`docs/public-ecosystem-source-audit.md`](docs/public-ecosystem-source-audit.md) and [`docs/ugc-research/11-node-public-review.md`](docs/ugc-research/11-node-public-review.md). The direct Digital Ore/Truth Substrate review is in [`docs/ugc-research/11-universaltruth.md`](docs/ugc-research/11-universaltruth.md), the vendor-kind/JCS check is in [`docs/ugc-research/12-nostr-vendor-kind-jcs.md`](docs/ugc-research/12-nostr-vendor-kind-jcs.md), package choices are in [`docs/ugc-research/13-crypto-library-selection.md`](docs/ugc-research/13-crypto-library-selection.md), media event formats are in [`docs/ugc-research/14-nostr-media-kinds.md`](docs/ugc-research/14-nostr-media-kinds.md), and the owner-supplied messaging review is in [`docs/user-supplied-messaging-review.md`](docs/user-supplied-messaging-review.md). Key sources include [NIP-01](https://nips.nostr.com/1), [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md), [NIP-71](https://github.com/nostr-protocol/nips/blob/master/71.md), [NIP-94](https://github.com/nostr-protocol/nips/blob/master/94.md), [NIP-56](https://github.com/nostr-protocol/nips/blob/master/56.md), [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785), [Manus Terms](https://manus.im/terms), [Manus Usage Policy](https://manus.im/usage), [Manus Safety & Content Policy](https://manus.im/content-policy), and [USPTO trademark-search guidance](https://www.uspto.gov/trademarks/basics/why-search-similar-trademarks).


## Same-browser messaging contract

Truth-Talk may implement the owner-supplied messaging behavior only as a same-origin browser-local feature. Use `BroadcastChannel` between explicitly open Truth-Talk tabs, Ed25519-signed envelopes and acknowledgements, a canonical unsigned payload, a DAG-JSON CIDv1 fingerprint, tamper checks, and a 4,096-character body cap. Store the separate messenger identity and message records in browser-local IndexedDB only after the user explicitly creates that identity; disclose that same-origin scripts can access the key, provide a delete control, and never reuse or export it as a Nostr, VALKYRIE, or node key. Store no message body in the general receipt ledger; record only identifiers, hashes, timestamps, and state transitions.

Preserve the supplied backoff arithmetic (30 seconds initially, doubling to a 10-minute cap, at most 20 attempts) as a local delivery state machine with manual retry and cancel. No HTTP peer endpoint or remote listener is configured, contacted, or tested in this release. A same-origin acknowledgement proves only that a browser tab on this site received and signed the matching envelope; it does not prove another person, device, organization, node, or VALKYRIE identity. The owner will perform peer verification separately. This constraint supersedes the HTTP peer-retry behavior described in the attachment, whose remote listener was never supplied or verified.


## 4Reels brand and launch scope amendment (2026-10-26)

The owner specifies the exact feature name **4Reels**: the numeral `4`, capital `R`, then lowercase `eels`; do not write “For Reels” or “4 Reels.” Treat it as an owner-preferred working name, not a cleared mark. Prior dated research notes that Meta lists “Reels” as a platform/service mark and that the USPTO search UI did not return inspectable exact-term records in the research session. This is not a legal conclusion; the owner must obtain a broader clearance review before public brand launch, avoid competitor visual marks/affiliation language, and keep an unbranded fallback ready if counsel recommends a change.

### Recommended niche and brand promise

Focus the launch on **evidence-attached build-in-public for independent makers, creators, researchers, and community builders**—people with a concrete artifact or claim who need context and traceability more than another popularity-ranked video feed. Start with process reels: demonstrate what changed, attach a signed post and the exact media digest where available, cite one source, acknowledge one limitation, and invite a reasoned branch. Treat funders, collaborators, and reviewers as secondary audiences for discoverable work, not as guaranteed buyers or endorsers. Avoid generic entertainment, creator-influencer growth promises, or broad claims that signatures make content true.

Primary positioning: “Short-form work with signed context and checkable file hashes—without pretending a signature proves truth or real-world identity.” Primary tagline: **“Show the work. Keep the receipt.”** Supporting line: “The feed for claims with context.” Use a candid, exact, humane voice. Preferred calls to action are “Open the source,” “Check the file,” and “Branch with a reason”; avoid “verified creator,” “guaranteed proof,” “catfishing-proof,” and unqualified “truth verified.”

### Editorial system and launch sequence

The four repeatable pillars are: **Show the build** (a process/change with a before/after artifact); **Behind the byte** (what a digest does and does not establish); **Claim → source → branch** (one bounded claim, one source, one uncertainty); and **Maker notes** (a creator’s process/lesson with consent and attribution). Use a suggested 30–60 second outline—hook, one clear claim, evidence walkthrough, explicit limitation, next step—as editorial guidance, not a product-enforced format or evidence-quality score. Provide text/captions and a source description in each post; never autoplay or load a remote media asset by default.

Recommended rollout: (1) preflight—trademark/copy review, applicable site and user-content terms/privacy, complaint contact, moderation/reporting scope, relay and media disclosure; (2) small opt-in pilot—interview 5–10 invited makers, publish only with each author’s exact consent, and record issues without implying they are existing partners; (3) public pilot—announce the four editorial pillars, publish a modest proposed cadence (e.g. three evidence-led posts per week) and link to receipts/branches; (4) review—adjust from consented feedback and relay/media outcomes, not virality or unsupported network-wide analytics. All interview counts and cadence are proposals, not achieved activity or targets backed by research. Do not schedule or send posts from this panel.

Track only defined, privacy-conscious indicators if the owner later opts into measuring them: fraction of voluntarily submitted posts carrying source/digest references, byte-check match versus unverifiable outcomes, reasoned-branch activity, and complaint handling time. No baseline or performance data exists now; display no fabricated counters. Any aggregate analytics require a separate privacy review and explicit approval.

### Integration into Truth-Talk

Add a first-class, lazily loaded **4Reels brand & launch** module to the existing one-page module navigation. Use a static content model and render the niche, positioning, primary/supporting taglines, copyable tagline options, editorial pillars, episode outline, phased launch sequence, proposed measures, and trademark/policy caveats. Label it **“STRATEGY DRAFT — no campaign is running.”** Copy actions are local browser clipboard actions only; they make no network request, create no fake feed post, and imply no launch has occurred. Keep the feed and signer consent flows unchanged.

Extend the source structure with `src/lib/fourReelsBrand.ts` (static authored strategy content), `src/components/FourReelsBrandPanel.tsx` (accessible strategy view and explicit copy buttons), and `tests/fourReelsBrand.test.ts` (content/wording boundary checks). Preserve the single `/` route. Store the requested presenter-facing strategy at `docs/4reels-brand-launch-plan.md`, the copy-ready separate-profile Manus request at `docs/prompts/manus-cosmic-net-upgrade.md`, and the low-cost Lovable prompt-builder instruction at `docs/prompts/lovable-prompt-builder.md`.

### Separate-profile prompts and cost/data boundaries

The two requested documents are prompts only. Do not open Lovable, use its credits, clone or modify the Cosmic Net repository, contact GitHub, publish, deploy, change DNS/billing, or delete old assets/data in the current Truth-Talk session. Instruct the future Manus profile to first verify the exact repository URL and do a read-only inventory; require review/approval before destructive cleanup, writes, push, deploy, domain changes, or paid work. Instruct the Lovable chat to draft a concise prompt only, not edit/build the site or consume project-generation credits. Recommend a soft initial budget cap of 130 credits out of the reported 1,300; if actual cost cannot be measured, pause before a potentially credit-consuming phase rather than guessing.


## Click-audit and media-URL follow-up (2026-10-27)

The owner asks for a practical explanation of the 4Reels media URL field, a click-through/source audit of every module, live verifiability, and deployment of the current site. Keep the existing static, browser-local design. Map each visible tab/control to its actual local or external effect, repair any confirmed dead or misleading action, and document which actions remain user-gated or require a user-owned provider. Bind Grants.gov pagination to the exact completed search term and status filter; display that search provenance, use it for Previous/Next, and prevent changed input fields from silently paging an older result set. Add plain-language help that explains the media URL is a direct public HTTPS file URL created by a hosting service the author chooses and controls; Truth-Talk does not upload or mint it. Explain direct-file versus share-page links, CORS/redirect requirements, final served bytes, and how the local hash plus remote verification actions relate. Add the click audit and media URL guide to project documentation, keeping private browser-profile contents out of reports.

Do not add a central media host, upload endpoint, login, server, database, arbitrary public uploader, relay auto-fetch, or new provider connector in this amendment. The current project declares `server:false` and `database:false`, and no project storage provider or external file host has been configured. User-owned media-host choice, upload authorization, retention/deletion rules, abuse controls, cost controls, protocol compatibility, and any one-way managed-server enablement require a later explicit architecture decision. Keep relay signing/public posting behind the existing age self-attestation, user signer, exact-payload review, and destination consent. Keep all node URLs owner-supplied references, do not probe/authenticate peers, and do not add any VALKYRIE connection; the owner reserved peer verification and future VALKYRIE exchange remains limited to a versioned, operator-approved signed export/import contract.

For this follow-up, preserve the current civic evidence-studio visual language, one `/` route, app modules, no-sample-data rule, source-click privacy disclosures, local receipt behavior, and static build. The existing `OpportunityPanel` owns search-result query provenance and page transitions; `MediaComposer` owns the external-media guidance; `docs/click-audit-2026-10-27.md` and `docs/media-url-guide.md` explain outcomes, limitations, and required user actions. Publishing the verified static checkpoint is explicitly requested, but do not pay, change the user's billing/account, enable automatic publication, or call a blocked Preview/checkpoint a successful public deployment.

### Cloud-optional architecture exploration

The owner also wants Truth-Talk to run locally and communicate device-to-device where feasible, with cloud services optional rather than compulsory. Deliver a decision note only in this follow-up: distinguish browser-local/offline operation, self-hosted/federated relay distribution, and direct peer sessions. Explain that a static browser application cannot accept arbitrary inbound connections; direct WebRTC still needs signaling/ICE and peers to be online, while asynchronous store-and-forward needs a relay or another reachable peer. A self-hosted VPS can remove dependence on a hosted SaaS platform but remains cloud infrastructure. Do not connect to, alter, or store the supplied node addresses in app source, and do not reuse KEIRA or VALKYRIE databases, credentials, schemas, keys, or runtime state. Future storage/relay choices require an explicit owner-selected host, isolated Truth-Talk data boundary, signed/versioned contracts where another node is involved, and security/retention/deletion/cost review. No droplet, schema, DNS, service, credential, peer, or account changes are part of this documentation task.
