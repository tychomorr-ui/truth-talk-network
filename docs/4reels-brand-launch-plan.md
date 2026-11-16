# 4Reels — Brand & Launch Plan

**Status:** Strategy draft. No campaign is running, no launch date is set, and no partner or user cohort is claimed. This plan is an editorial recommendation, not evidence of product-market fit.

## Recommendation: own the evidence-attached build-in-public niche

Do not launch 4Reels as a general-purpose entertainment or “better TikTok” clone. Start with **evidence-attached build-in-public**: short videos and posts from people making something they can show, paired with signed context, sources, and an optional digest for the exact file bytes.

The first-wave audience should be independent makers, creators, researchers, educators, founders, and community builders who want their work reviewed with context rather than ranked only by engagement. This is a behavior-based wedge, not an income-based gate; 4Reels is intended to be useful to anyone whose work benefits from a provenance trail. Funders, collaborators, and reviewers are secondary audiences who may discover the work, not guaranteed buyers or endorsers.

The distinguishing move is a **post with a trail**: one bounded claim, the artifact or source the author chooses to disclose, an exact signed Nostr event, an optional SHA-256 digest for referenced bytes, and a reasoned branch for extension or dissent. This makes specific evidence inspectable; it does not make the claim true, prove a person's civil identity, establish ownership, or guarantee anti-catfishing.

## Brand foundation

**Exact display name:** 4Reels — numeral 4, capital R, lowercase `eels`. Do not write “For Reels” or “4 Reels.”

**Primary tagline:** **Show the work. Keep the receipt.**

**Supporting line:** The feed for claims with context.

**Positioning:** Short-form work with signed context and checkable file hashes—without pretending a signature proves truth or real-world identity.

**Brand promise:** A creator can attach context that another person can inspect: which Nostr key signed an event, which exact bytes match a digest, which source was referenced, and what remains unresolved. Truth-Talk records the checks honestly; it does not adjudicate the claim.

**Personality:** candid, exacting, humane.

**Voice rules:** Say exactly what the key signed and what bytes were hashed. Prefer “these bytes match this digest” to “this content is verified.” State limitations in plain language. Invite review and reasoned disagreement. Avoid “verified creator,” “guaranteed proof,” “catfishing-proof,” “viral,” “funding guaranteed,” “ownership verified,” or any claim of affiliation with Meta/Instagram.

**Calls to action:** “Open the source,” “Check the file,” and “Branch with a reason.”

## Tagline options

1. **Show the work. Keep the receipt.** — recommended lead line.
2. A short reel. A longer trail.
3. Built to be cited, not just scrolled.
4. Make it. Mark it. Trace it.
5. Less “trust me.” More “check the record.”
6. Your work, with its source trail.
7. A reel with context.
8. Create the clip. Keep the receipt.

These are creative options, not cleared marks. “4Reels” itself requires a broader clearance review before public brand launch. The dated research in [`docs/ugc-research/09-trademark.md`](ugc-research/09-trademark.md) notes that Meta lists “Reels” as a platform/service mark and that the USPTO search interface did not return inspectable exact-term case records during the research session. That is an access limitation, not evidence that no records exist, and not a legal conclusion. Use no competitor logo, interface imitation, or affiliation language. Have qualified trademark counsel review related marks, phonetic/numeral variants, software and media services, common-law use, domains, and relevant jurisdictions; keep a descriptive/unbranded fallback available if counsel advises a change.

## Editorial system: four recurring story shapes

### 1. Show the build

Demonstrate one change in a prototype, process, research artifact, or community tool. If showing a before/after, identify what changed and which exact artifact is being referenced. Do not show private credentials, third-party personal data, or material the creator lacks permission to share.

### 2. Behind the byte

Explain one evidence primitive—such as a digest, signature, receipt, source record, or C2PA credential—with a real, shareable artifact. Name the boundary: a digest identifies bytes; it does not identify the uploader, authenticate a civil identity, prove truth, or preserve the file. Do not invent successful verification examples.

### 3. Claim → source → branch

Make one bounded claim, cite one dated source, name one uncertainty, and invite a signed branch that extends, disputes, derives from, or cites the claim. A signed dissent is not a moderation ruling or proof that the original claim is false.

### 4. Maker notes

Let a creator explain their process, choices, and open questions in their own words. Obtain consent for every identifiable participant and attribute authorship only as supported by the actual signing key and user-supplied context.

### Suggested post structure

Use this as editorial guidance, not a product limit or quality score:

- **Hook:** name the problem, question, or change without an unsupported superlative.
- **One claim:** explain one bounded statement in plain language.
- **Evidence:** show one source or artifact; disclose whether a digest covers an original or derivative.
- **Limit:** state what the hash, signature, source, or receipt cannot establish.
- **Next step:** invite a source check or a branch with a reason.

Suggested duration is 30–60 seconds, but no technical or product rule requires that length. Provide text/captions and a clear source description. The application must not autoplay or fetch media by default.

### Copy templates

These are blank editorial prompts, not sample posts or seeded feed records. Replace every bracketed field with authentic, shareable material:

- `BUILD NOTE — [what changed] / [artifact or source] / [what is still uncertain]`
- `BYTE NOTE — [which exact file] / SHA-256: [digest] / [what matching bytes do and do not prove]`
- `SOURCE TRAIL — [one bounded claim] / [dated source] / [one open question]`
- `BRANCH INVITATION — [event ID] / [extend, dispute, cite, or derive] / [why a response may help]`

## Recommended launch sequence

All phases are proposals; they are not scheduled or in progress.

### Phase 1 — Preflight

Before describing 4Reels as publicly ready, clear the name with counsel, review applicable Manus policies and product-specific terms/privacy, supply a real complaint/takedown contact, explain relay and media-host privacy/retention, and confirm that moderation, reporting, and deletion language is honest. The current adult gate is a self-attestation, not age verification. Keep public posts separate from local draft/review actions and show the exact event and relay destination before signing or broadcasting.

### Phase 2 — Listening pilot

If the owner wants a pilot, invite a small opt-in group for short interviews and usability feedback. A suggested range is 5–10 conversations, not an existing user cohort. Invite people because they make work that benefits from attribution and context; do not recruit only people facing financial hardship. Publishing remains an individual, manual decision and requires each author's exact consent.

### Phase 3 — Public pilot

Only after the gates are satisfied, announce the four editorial pillars and manually publish a modest cadence—e.g., three evidence-led posts per week—as a proposed experiment, not a researched optimum. Cross-posting elsewhere is a human copy/paste decision under each platform’s rules; Truth-Talk does not post or schedule those items automatically. Use no paid media or influencer spend without a separate budget approval.

### Phase 4 — Review and refine

Review opt-in creator feedback, actual relay acceptance, media verification outcomes, and complaint handling. Change the positioning or workflow based on observed evidence—not a narrative that 4Reels is already “better,” viral, or network-wide.

## Candidate measures; no baseline exists

If the owner later approves measurement, use small, defined signals such as:

- Whether voluntarily shared posts include a source or digest for the exact referenced bytes.
- Local media checks labeled `match`, `mismatch`, or `unverifiable` (never turning CORS failure into a mismatch).
- Reasoned branches observed on the relays a particular user selected (not network-wide engagement totals).
- Complaint handling outcomes and response time only after a real contact and approved process exist.

There is no existing baseline or campaign dataset. Do not show fabricated counters. The current product is browser-local and must not quietly add aggregate analytics or a hosted user database.

## How it fits Truth-Talk

4Reels is the short-form/feed surface inside the independent Truth-Talk application. The product supplies user-selected Nostr reads, key-level event verification, JCS branch/endorsement schemas, optional file digests, reasoned branches, local receipts, and honest “unresolved” references. The new in-app **4Reels brand & launch** panel is a static draft with copy buttons; it makes no relay or provider requests, creates no post, starts no campaign, and stores no fake metric.

The directory is a user-supplied map, not proof that listed sites are active peers. TESSERACT-TERMINUS at `universaltruth.life` is distinct from the `tesseract.manus.space` recovery mirror. There is no live Truth-Talk/VALKYRIE connection; any future exchange must use a versioned, operator-approved signed export/import contract.

## Pre-launch checklist

- [ ] Resolve the 4Reels name-clearance question with qualified advice; keep an unbranded fallback.
- [ ] Provide project-specific terms/privacy and a genuine complaint/takedown contact.
- [ ] Review Manus Terms, Usage Policy, Safety & Content Policy, and Privacy Policy.
- [ ] Make relay publication, third-party retention, source links, and media-host metadata visible to users.
- [ ] Confirm public posting remains exact-payload, exact-destination, and user-approved.
- [ ] Do not claim human identity, factual truth, copyright ownership, guaranteed reach, or complete removal from hashes/signatures alone.
- [ ] Do not publish until the owner clears the host-level billing gate; do not change billing or DNS without explicit approval.
