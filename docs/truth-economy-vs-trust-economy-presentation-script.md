# Presentation Script: From the Trust Economy Toward a Truth Economy

**Format:** spoken keynote / product briefing, approximately 7–8 minutes.<br>
**Audience:** community members, builders, creators, researchers, funders, and prospective ecosystem collaborators.<br>
**Core message:** Truth-Talk makes evidence easier to record, inspect, and carry between people and systems. It does not ask anyone to treat a badge, a hash, a platform, or a founder as an authority on truth.

## Opening — “What would make this easier to check?”

People often ask, “Who should I trust?” That is a human question, and trust still matters. But too often, the answer depends on who has the money, the audience, the credentials, the platform, or the power to make a claim visible.

Truth-Talk starts with a different question: **What evidence is available, who supplied it, what exactly was checked, and what remains unknown?**

That is what I mean by moving from a trust economy toward a truth economy. It is a direction—not a declaration that we have solved truth, proved every claim, or replaced human judgment. Our goal is to make a useful evidence path available to anyone: a person with an early idea, a working creator, a small organization, a researcher, a funder, or a large institution. This is not just a product for the people with the fewest resources, and it should never quietly shut them out either.

## What Truth-Talk does today

Truth-Talk is a standalone, browser-first evidence workspace. An operator can enter their own project information and receive a constructive funding-readiness review across eleven axes, followed by a Dark Mirror review that asks what a skeptical reviewer might challenge. The app starts with a blank profile. That information stays in the browser; it is not sent with a funding search.

When the operator chooses to search, Truth-Talk queries real Grants.gov federal opportunity records and shows the provider’s source, dates, and supplied facts. A local topic-overlap note is not an eligibility decision. The app can also prepare private communications, hash artifacts for a Chain Witness receipt, and record local audit receipts. A hash-linked local receipt helps reveal a change in the browser record. It is not a remote anchor, a signature, an ownership certificate, or a legal attestation.

The governing rule is simple: an empty source stays empty; a missing fact stays missing; an untested integration is not described as connected.

## The corrected Sovereign Mesh map — references, not peers

The owner’s corrected directory contains **twelve named role/site references** and **three additional standalone application entries**. Those numbers describe the directory—not twelve authenticated nodes and not fifteen verified peers.

The twelve role/site references are: ROOT-GATE; TESSERACT-TERMINUS at `universaltruth.life`; the separate TESSERACT recovery mirror at `tesseract.manus.space`; XINUS-CLARITY; MONARCH-OS; TESSERACT-A; KEIRA at `keira.nexinus.net`; VALKYRIE at `valkyrie.nexinus.net`; ARCHANGEL; PROJECT RECLAIM; IWA SAGE; and RESONATE EARTH at `resonate-earth.live`.

The three separate application entries are PROPERTY MAINTAINED, NATIVE GROUNDS, and XINUS PORTFOLIO. The owner’s later correction identifies Native Grounds at `tribalcoff-y9afmafg.manus.space` as its own application—not as the Resonate Earth mirror. The directory follows that correction. The Manus-hosted pages are described by the owner as public front ends rather than necessarily the live service backends; that description is owner-reported, not an independently established runtime fact.

Every role and site association is labelled owner-supplied and not cryptographically verified. Showing a link is not checking a node. Browsing the directory, filtering it, or preparing a claim packet does not contact the listed hosts. An external link is opened only when the user deliberately clicks it.

## What the public-source audit did—and did not—show

We organized fifteen supplied site audits. They were not fifteen complete source-code reviews. Thirteen were partial or blocked; six inspected at least some application-route material; and two completed only the sitemap scope they stated. This is useful evidence about the limits of the review, not proof of service health.

One scope detail matters: the Property Maintained request used `propmaint-2wv2njwj.manus.space`, missing “ain,” and requested only `robots.txt`. The owner-designated URL is `propmaintain-2wv2njwj.manus.space`; that canonical URL was not visited, so this audit makes no finding about that app.

For the four designated endpoints, the observations differ. At TESSERACT-TERMINUS, the audited frontend exposes local provenance fields and client-side DAG-JSON CIDv1 and Ed25519 messaging logic, along with browser storage and possible configured peer posting. That does not establish an authoritative remote record, a trusted operator key, or peer availability.

The TESSERACT recovery Mirror is a separate site. Its inspected local-turn receipts use short FNV-1a checksums held in component state. FNV-1a is a non-cryptographic checksum—not a signature or HMAC. Those semantics must not be blended with the Terminus implementation.

KEIRA’s inspected verifier checks Merkle/SHA-256 data and an Ed25519 attestation using a key supplied inside the report. That can show internal consistency with that supplied key; without an independent trusted-key pin, it does not prove the key belongs to KEIRA or a known issuer.

For VALKYRIE at `valkyrie.nexinus.net`, the supplied audit did not inspect application routes or first-party source. It therefore observed no provenance mechanism at all. Its adjudication, Dark Mirror, and VERDEX roles remain owner-supplied labels for this audit. The owner’s report that the sites return HTTP 200 and carry signed manifests also remains unverified in the supplied evidence.

So the practical lesson is not that one system is “the truth node.” It is that different systems expose different records, different algorithms, different key models, and different gaps. Our report keeps those distinctions intact. It does not establish live mesh enrollment, verified identities, authoritative records, or a functioning peer network.

## 4Reels — evidence attached to expression

The 4Reels workspace is designed for posts, short videos, screenshots, documents, branches, and self-declared intellectual-property claims. The feed reads only relays a user enters and selects. It does not load sample posts or contact a relay on page load.

A valid Nostr signature means the event bytes verify under a particular public key. It does not establish which person holds that key or whether the statement is accurate. For short-video and file references, the author can sign a URL and a SHA-256 digest; the user can hash a chosen local file without uploading it. If a user separately requests a remote-byte check, the app compares the returned bytes with the signed digest. A match means byte equality with that digest—nothing more. It does not prove who filmed the video, when it was filmed, whether it shows what the author says, who owns the work, or whether a remote host will keep it available.

Truth-Talk uses RFC 8785 JSON Canonicalization Scheme for the structured payloads of its vendor-specific branch and endorsement events. The outer Nostr event identifier still uses NIP-01’s specified serialization; these are two separate operations. A branch can point to a source, dispute it, extend it, or license from it, while its referenced source remains explicitly **UNRESOLVED** until there is an approved verification contract. An endorsement must include a reason. It is a signed statement—not a like, popularity score, vote, or truth score.

Reporting, local hiding, relay moderation, and a NIP-09 deletion request are separate actions. A report is not enforcement; a deletion request does not guarantee removal from relays, caches, downloads, or independently hosted media. The public feed starts behind an 18+ self-attestation, which does not collect a birth date and does not verify age. Every public event shows the exact payload and relay destinations for a separate human approval before signing.

## Messaging and the VALKYRIE boundary

The user-supplied messaging behavior has been carried into Truth-Talk only as same-browser communication: explicitly opened tabs on the same site can exchange Ed25519-signed envelopes and acknowledgements over `BroadcastChannel`. The separate messenger identity is created by deliberate action and stored in this browser’s IndexedDB. DAG-JSON CIDv1 fingerprints bind the messages; retry timing is bounded and user-controlled. There is no HTTP peer transport, remote listener, relay, or background node probe in this implementation. The owner said they will conduct peer verification themselves, and no peer test was run here.

Truth-Talk also remains separate from VALKYRIE. No files, routes, keys, runtime state, adapters, or live connection are shared. Any future exchange requires a versioned, operator-approved signed export/import contract and independent verification against a pinned key. Until that exists, a cross-node reference is a pointer the author supplied—not a verified fact and not a live integration.

## Closing — “Make claims easier to check”

A truth economy is not a world without trust, disagreement, mistakes, or power. It is a world where more people can carry evidence, expose its source, correct its record, and state honestly what nobody has verified yet.

That is the beacon Truth-Talk is trying to be: not an oracle, not a court, not a promise that every idea will be funded, and not a machine that eliminates catfishing. It is a way to make a claim more inspectable, a receipt more portable, and a next step more deliberate—open to people at every level of the ecosystem.

The invitation is not “believe us.” It is: **bring what you have, show what supports it, mark what is unknown, and let the next person check.**

## Presenter’s roster and source notes

### Twelve owner-designated role/site references

1. ROOT-GATE — `https://rootgate.manus.space`
2. TESSERACT-TERMINUS — `https://universaltruth.life`
3. TESSERACT recovery mirror — `https://tesseract.manus.space`
4. XINUS-CLARITY — `https://exonissuite-ceruhtwo.manus.space`
5. MONARCH-OS — `https://schedtool-7vbikw4h.manus.space`
6. TESSERACT-A — `https://clarityapp-hw9fbadc.manus.space`
7. KEIRA — `https://keira.nexinus.net`
8. VALKYRIE — `https://valkyrie.nexinus.net`
9. ARCHANGEL — `https://archangelcp-sbwmjhce.manus.space`
10. PROJECT RECLAIM — `https://reclaimporta-gsio8jvp.manus.space`
11. IWA SAGE — `https://iwawellness-khqgjzqe.manus.space`
12. RESONATE EARTH — `https://resonate-earth.live`

### Three separate applications

- PROPERTY MAINTAINED — `https://propmaintain-2wv2njwj.manus.space`
- NATIVE GROUNDS — `https://tribalcoff-y9afmafg.manus.space` (separate app per the owner’s correction)
- XINUS PORTFOLIO — `https://nexsens-3uimbss6.manus.space`

### Evidence references

- [Owner-corrected roster and verification caveats](ugc-research/00-user-supplied-11-node-list.md)
- [Public ecosystem source audit and provenance comparison](public-ecosystem-source-audit.md)
- [Feed, standards, and content-safety research](ugc-feed-research.md)
- [NIP-01 event protocol](https://github.com/nostr-protocol/nips/blob/master/01.md), [NIP-07 signer](https://github.com/nostr-protocol/nips/blob/master/07.md), [NIP-71 short video](https://github.com/nostr-protocol/nips/blob/master/71.md), [NIP-94 file metadata](https://github.com/nostr-protocol/nips/blob/master/94.md), [NIP-56 voluntary reporting](https://github.com/nostr-protocol/nips/blob/master/56.md), and [NIP-09 deletion requests](https://github.com/nostr-protocol/nips/blob/master/09.md)
- [RFC 8785 JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785) and [BIP-340 Schnorr signatures](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)

**Presentation limit:** This script describes the shipped client behavior and source-audit evidence. It is not a claim that a public Nostr post, remote peer, signed node manifest, identity binding, production launch, or live VALKYRIE integration has been tested or achieved.
