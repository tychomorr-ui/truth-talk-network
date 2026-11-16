# Truth-Talk public feed and short-form media: evidence synthesis and implementation plan

## Executive recommendation

Build the first release as a **static, browser-first client** that reads and verifies Nostr events from configured external relays, renders posts safely, and supports deliberate user-key signing through an available NIP-07 signer. Treat relays and all event/profile/media data as external and untrusted. This preserves the current architecture: the supplied evidence does not show that a product server or database is necessary for a read-and-publish event client. Nostr itself does not host video files, however, so the first release should support externally hosted media references and **keep product upload disabled** until an external media provider is selected, approved, and shown to provide the required server-side file controls. A static browser alone cannot enforce those controls. [1][2][3][4]

The interface may describe cryptographic checks narrowly—such as “event signature valid for this Nostr key” or “downloaded bytes match this SHA-256 digest.” It must not turn hashes, signatures, NIP-05 identifiers, C2PA credentials, or the presence of a video into claims that a person is verified, footage is authentic, or a post is true. **Hashes alone do not eliminate catfishing and do not establish the identity or truth of a post.** Real-world identity proofing, content provenance, factual assessment, and moderation are separate concerns. [5][6][7][8]

“4Reels” is only a **working name pending trademark review**. USPTO case-level results for the exact names were not obtained; the supplied research records the USPTO similarity/related-goods test and Meta’s first-party use of “Reels,” but does not establish a registration or reach a legal conclusion. Use a descriptive “Short video” label in the interim and complete a broader clearance review before adopting a brand. [9]

## What the specifications establish—and what they do not

### Nostr event and signer checks

For NIP-01 events, the verifier should validate the event structure, reproduce the precise UTF-8 JSON serialization of `[0, pubkey, created_at, kind, tags, content]`, compute its SHA-256 event ID, compare that computed ID with the supplied ID, and then verify the Schnorr signature against the public key and recomputed ID. This is the protocol-level sequence for accepting an event as signed by the corresponding key. It establishes key-level integrity/authorship, **not a real-world person or the truth of the signed statements**. [1][10]

NIP-07 exposes optional browser methods such as `getPublicKey` and `signEvent`; it does not specify identity proofing or guarantee a human-consent or signing-confirmation experience. A key may be delegated, shared, automated, or compromised. As a product safeguard (not a NIP-07 requirement), show the exact post and media references/hash fields to be signed, request a deliberate confirmation, and never silently sign arbitrary page-originated payloads. [11]

NIP-05 is a DNS-based identifier mapping and explicitly is identification, not user verification. If the product ever wants to say “identity verified,” it would need a separately authorized and documented identity-proofing and key/account-binding process; the current evidence specifies no provider, issuer, trust anchor, or approved architecture for such a process. NIST SP 800-63-4 separates identity proofing, authentication, and federation assurance; using those concepts as a benchmark would not itself make this client conformant or certified. [12][13]

### Short-video events and file integrity

NIP-71 defines kind 22 for regular short-video events and kind 34236 for addressable short-video events. “Short” is a stylistic category, not a protocol-enforced duration cap or portrait-orientation rule. NIP-71 marks `title` as required and requires `d` for addressable events; it describes `imeta` as the primary video information source without making it universally mandatory. Treat portrait orientation and any duration/size limits as application rules, inspect actual media dimensions, and choose numeric bounds through product testing. NIP-71 is draft/optional in the supplied research, so client and relay support may vary. [14]

NIP-94 defines file metadata including `url`, lowercase MIME type `m`, `x` (SHA-256 digest of the served file), and `ox` (digest of the original before upload-server transformations). These fields are defined, but the reviewed text does not mark `url`, `m`, or `x` as universally MUST-required. NIP-92 says an `imeta` tag must contain a `url` plus at least one other field. Independently hash retrieved bytes before showing a match, identify exactly which rendition/bytes were checked, and keep original and derivative receipts separate. A match means byte-integrity matching against the declared digest; it does not prove authorship, identity, truth, capture time, provenance, or availability. [15][16][17]

### Provenance, moderation, and deletion

C2PA can validate cryptographically bound provenance assertions and signer/trust status, but does not decide whether assertions are true or media factual. Core C2PA does not directly establish human identity, and credentials can be removed. If implemented later, present distinct states (for example, absent/unavailable, malformed, invalid, valid-but-untrusted, trusted under the configured validator, or incomplete history) rather than a generic “authentic” badge. A missing credential is not evidence of fakery. The supplied research does not establish that the current client has the libraries, trust material, key custody, or certificate-status handling needed to generate or validate credentials. [18][19]

NIP-56 reports are optional, subjective signals; recipients decide whether to act, and the NIP warns against automatic relay moderation based solely on reports. NIP-09 kind-5 events are deletion requests: relay/client behavior is recommended with SHOULD language, and the NIP explicitly says deletion from all relays and clients cannot be guaranteed. A request for a Nostr event does not itself remove separately hosted media. NIP-51 mute lists are client/display preferences, not globally enforced blocks; kind 10006 blocks relay URLs, not users. Keep reporting, local hiding/muting, relay-specific moderation, host takedown, and deletion requests clearly distinct. [20][21][22]

## Feasible implementation plan

### 1. Static browser client and read-only feed

- Keep the existing static app architecture. Do not add a product backend, database, application-controlled relay, media store, identity vendor, or moderation service: none is approved in the supplied constraints.
- Read events from explicitly configured external relays. Treat relay responses, profiles, URLs, media, and embedded metadata as untrusted input; validate event structure, ID, and signature before displaying signed-author attribution. Relay acknowledgements do not prove broad propagation or availability, and relay policies/capabilities vary. [1][23]
- Render text and links safely; do not interpret untrusted content as markup or execute it. This is a product security recommendation consistent with the supplied requirement to treat content as untrusted; exact rendering implementation and security tests remain to be selected.
- Label attribution as a Nostr key/account. If NIP-05 is displayed, explain it as an identifier mapping, not proof of a human identity. [12]

### 2. Deliberate posting and short-video metadata

- Use NIP-07 only when available and after an explicit user action. Display the complete event payload, destinations/relay choices where known, and media references/hash fields for review before requesting a signature. This confirmation flow is a safeguard recommendation, not a protocol guarantee. [11]
- Apply NIP-71 format semantics accurately. For addressable events, supply the required `d` tag; include the required `title`. Do not state that a kind alone proves duration or vertical format. [14]
- For linked media, record and show per-rendition URL, MIME type, digest, and dimensions when available. Verify downloaded bytes against the stated digest before presenting a “digest matches” status. Distinguish the NIP-94 served-file `x` digest from original `ox`; a transformed derivative is a different byte object. [15][16]
- Set app-level limits for duration, resolution, frame rate, byte size, and processing needs only after testing and threat modeling; the supplied sources do not establish suitable numeric thresholds. [14][24]

### 3. Media upload: defer until an external service is approved

Nostr event formats reference media; they do not provide hosting. NIP-96 is marked unrecommended/deprecated in favor of NIP-B7/Blossom in the supplied research, while Blossom BUDs and NIP-B7 are drafts and compatibility is not assured. Blossom describes exact-byte uploads and hash-addressed retrieval, but still depends on a third-party file server. Browser upload also depends on provider CORS and provider-specific behavior. [2][3][4]

Accordingly, keep uploads disabled in the initial static release unless and until an external provider is expressly selected and approved. The approval gate should establish its retention/deletion terms, CORS and authorization behavior, limits, content processing and scanning, serving behavior, abuse/takedown operations, and compatibility in real browsers. OWASP’s supplied guidance calls for server-side validation and defense in depth; browser preflight is not a security boundary. A static client cannot itself enforce those server-side controls. Do not imply Truth-Talk controls storage, availability, retention, removal, or moderation. [3][24]

The research notes prefer Blossom BUD-02 exact-byte upload and scoped BUD-11 authorization if a compatible provider is later selected, but also identify draft status, provider divergence, NIP-96/NIP-98 ambiguities, and an inconsistency in the BUD-11 human-readable-token requirement/example. Treat that as a candidate for provider-specific evaluation, not a final protocol decision. If no compatible approved provider exists, remain link/event-only. [3]

### 4. Safety, reporting, removal, and user-facing language

Provide separate actions and descriptions for local hide/mute, report submission, NIP-09 event deletion request, and any provider-specific media-removal request. Tell users these actions may not affect independent relays, hosts, cached copies, downloads, screenshots, reposts, or recipients’ devices. Do not call reports adjudications, promise response times not established by the sources, or describe client filtering as network-wide enforcement. [20][21][22]

Do not publish identifiable people in screenshots, recordings, or videos without the required express consent/authority. If Truth-Talk is operated as a Manus-hosted Space, the supplied Manus policy findings say its Terms place responsibility for Space content and complaints on the Space owner; the Usage Policy applies to hosted projects and restricts identifiable persons without express consent, impersonation, and deception; the Safety & Content Policy describes reporting/review/appeals but no universal review or response-time promise. The supplied findings also state an 18+ service requirement. Publish project-specific user-facing terms/privacy and complaint pathways before launch, while keeping the stated limit on control over external relays and copies. [25][26][27][28]

Copyright and notice handling are an operational/legal gap, not something a hash can solve. The research does not classify the proposed client, relays, or a future file host under 17 U.S.C. § 512. Do not claim safe-harbor compliance unless the responsible provider and actual service functions can support applicable designated-agent, notice, removal, uploader-notice, counter-notice, restoration, and repeat-infringer processes. Obtain qualified legal review of the specific operating arrangement. [29][30]

## Claim language: safe and unsafe examples

| Safe, scoped wording | Do not claim on this evidence |
|---|---|
| “Event signature valid for this Nostr public key.” | “This person is verified” or “catfishing eliminated.” |
| “The downloaded file’s SHA-256 digest matches the digest in the signed event.” | “The hash proves who made it, when it was captured, that it is true, or that it will remain available.” |
| “C2PA manifest validated; signer/trust status is shown under this validator.” | “C2PA proves this footage is real or the depicted event happened.” |
| “Deletion request sent; relay/client/host behavior may vary.” | “Deleted everywhere” or “all copies removed.” |
| “User report received” or “hidden in this client.” | “Report confirmed wrongdoing” or “blocked across Nostr.” |
| “NIP-05 identifier maps to this key.” | “NIP-05 verifies the user’s real-world identity.” |

These limitations follow from the supplied protocol, NIST, C2PA, and moderation findings. In particular, cryptographic integrity signals and identity assurance must remain separate, and **no hash—alone or included in a signed event—eliminates catfishing or establishes the truth or identity of a post**. [5][6][7][8][12][13]

## Standards requirements versus recommendations

- **Specification-defined behavior/fields:** NIP-01 event ID serialization/hash and signature verification; NIP-71’s required `title` and addressable-event `d` tag; NIP-92’s `imeta` URL-plus-another-field requirement; NIP-94’s defined `x`/`ox` semantics. NIP-71, NIP-94, NIP-92, NIP-07, and several other referenced NIPs are draft/optional in the supplied research; do not imply universal implementation support. [1][11][14][15][16]
- **Standards limitations:** NIP-05 is identification, not user verification; C2PA validates binding/provenance claims but does not adjudicate truth; NIP-09 cannot guarantee network-wide erasure; NIP-56 is a report signal and not enforcement. [12][18][20][21]
- **Product/security recommendations, not protocol MUSTs:** deliberate signer confirmation, per-byte media verification before a hash status, portrait/duration rules, safe rendering, upload gates, provider assessment, user-facing deletion warnings, and cautious status wording. OWASP supplies security guidance for server-side upload validation and safe handling; it does not select this product’s provider or numeric media bounds. [11][14][15][24]

## Unresolved questions and research gaps

1. **Relay configuration and compatibility:** Which relays, if any, will the client recommend or configure by default? NIPs and relay disclosures do not establish universal availability, retention, moderation, or propagation behavior. Test selected relays and pin reviewed NIP revisions because the specifications are mutable. [1][23]
2. **External media provider:** No host is approved. Provider-specific retention, deletion, abuse/takedown, CORS, upload limits, content scanning/re-encoding, and supported protocol revisions remain unknown. No upload should be enabled until those are reviewed and tested. [3][4][24]
3. **Identity proofing:** No identity-proofing provider, issuer, assurance level, account/key binding, lifecycle, fraud response, privacy/retention, or appeal process is specified. Therefore do not offer a “verified person” status. [8][13]
4. **C2PA capability:** The evidence does not establish available browser libraries, trust-list configuration, signing keys/certificates, status checking, or conformance. Screen-recording treatment is expressly an inference in the supplied research, not a separate normative C2PA rule. [18][19]
5. **Moderation and operations:** No project-specific moderation policy, operator, intake workflow, reviewer capacity, appeals path, service levels, or external-relay enforcement mechanism is approved. Define realistic local/client functions and provider contact paths without promising global control. [20][21][25][27]
6. **Copyright and trademark:** Legal classification and any Section 512 compliance depend on the concrete operating arrangement and require counsel. Exact USPTO case-level results for “4Reels”/“Reels” remain unverified; comprehensive federal, state, common-law, and related-goods/services clearance is still required. [9][29][30]
7. **Policies and age gate:** Confirm current applicable Manus terms and implement the stated 18+ requirement, consent restrictions, project terms/privacy notices, and complaints process before publication as a hosted Space. The sources do not provide a Truth-Talk-specific hosting or decentralized UGC service agreement. [25][26][27][28]

## References

[1] NIP-01, Basic protocol flow description: https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md<br>
[2] NIPs repository index (NIP-96 status / Blossom context): https://github.com/nostr-protocol/nips/blob/master/README.md<br>
[3] Blossom integration, NIP-B7: https://raw.githubusercontent.com/nostr-protocol/nips/master/B7.md<br>
[4] Blossom BUD-02 upload: https://raw.githubusercontent.com/hzrd149/blossom/master/buds/02.md ; BUD-11 authorization: https://raw.githubusercontent.com/hzrd149/blossom/master/buds/11.md ; BUD-01 server/CORS/retrieval: https://raw.githubusercontent.com/hzrd149/blossom/master/buds/01.md<br>
[5] NIST FIPS 180-4, Secure Hash Standard: https://csrc.nist.gov/pubs/fips/180-4/upd1/final<br>
[6] NIP-07 browser signer: https://raw.githubusercontent.com/nostr-protocol/nips/master/07.md ; BIP-340 Schnorr signatures: https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki<br>
[7] C2PA Explainer 2.4: https://spec.c2pa.org/specifications/specifications/2.4/explainer/Explainer.html<br>
[8] NIST SP 800-63-4, Digital Identity Guidelines: https://pages.nist.gov/800-63-4/sp800-63.html ; SP 800-63A-4: https://pages.nist.gov/800-63-4/sp800-63a.html<br>
[9] USPTO search similarity guidance: https://www.uspto.gov/trademarks/basics/why-search-similar-trademarks ; comprehensive clearance search: https://www.uspto.gov/trademarks/search/comprehensive-clearance-search-similar-trademarks ; possible refusal grounds: https://www.uspto.gov/trademarks/additional-guidance-and-resources/possible-grounds-refusal-mark ; Meta trademarks page: https://www.meta.com/brand/resources/meta/our-trademarks/ ; USPTO search portal: https://tmsearch.uspto.gov/<br>
[10] NIP-01 signature/event semantics: https://github.com/nostr-protocol/nips/blob/master/01.md<br>
[11] NIP-07: https://raw.githubusercontent.com/nostr-protocol/nips/master/07.md<br>
[12] NIP-05, DNS identifier mapping: https://raw.githubusercontent.com/nostr-protocol/nips/master/05.md<br>
[13] NIST SP 800-63A-4 identity proofing and enrollment: https://pages.nist.gov/800-63-4/sp800-63a.html<br>
[14] NIP-71, Video Events: https://github.com/nostr-protocol/nips/blob/master/71.md<br>
[15] NIP-94, File Metadata: https://github.com/nostr-protocol/nips/blob/master/94.md<br>
[16] NIP-92, Media Attachments Metadata: https://github.com/nostr-protocol/nips/blob/master/92.md<br>
[17] NIST FIPS 180-4: https://csrc.nist.gov/pubs/fips/180-4/upd1/final<br>
[18] C2PA Technical Specification 2.4: https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html ; C2PA Guiding Principles: https://c2pa.org/principles/<br>
[19] C2PA UX Guidance 2.2: https://spec.c2pa.org/specifications/specifications/2.2/ux/UX_Recommendations.html ; Implementation Guidance 2.4: https://spec.c2pa.org/specifications/specifications/2.4/guidance/Guidance.html ; CAI FAQ: https://opensource.contentauthenticity.org/docs/getting-started/faqs/<br>
[20] NIP-56, Reporting: https://raw.githubusercontent.com/nostr-protocol/nips/master/56.md<br>
[21] NIP-09, Event Deletion Request: https://raw.githubusercontent.com/nostr-protocol/nips/master/09.md<br>
[22] NIP-51, Lists: https://raw.githubusercontent.com/nostr-protocol/nips/master/51.md<br>
[23] NIP-11, Relay Information Document: https://raw.githubusercontent.com/nostr-protocol/nips/master/11.md<br>
[24] OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html ; Input Validation Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html ; HTTP Headers Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html<br>
[25] Manus Terms of Use: https://manus.im/terms<br>
[26] Manus Usage Policy: https://manus.im/usage<br>
[27] Manus User Safety and Content Policy: https://manus.im/content-policy<br>
[28] Manus Privacy Policy: https://manus.im/privacy ; Website Builder cloud infrastructure: https://manus.im/docs/website-builder/cloud-infrastructure.md ; publishing: https://manus.im/docs/website-builder/publishing.md<br>
[29] 17 U.S.C. § 512: https://www.copyright.gov/title17/92chap5.html ; Copyright Office Section 512 resources: https://www.copyright.gov/512/<br>
[30] 37 CFR 201.38, designated agent: https://www.ecfr.gov/current/title-37/chapter-II/subchapter-A/part-201/section-201.38
