# Truth-Talk click and connection audit

- **Audit date:** 2026-10-27 (UTC)
- **Release:** v0.4.0 plus the follow-up UI/pagination fixes in this project tree
- **Scope:** the one-page `/` app, its ten top-level modules, and the meaningful action families inside them.

## How to read this audit

- **Local** means state or computation stays in the browser. It is not shared with another device unless a separate export/relay action is chosen.
- **Live read-only** means a deliberate button sends a bounded request to a real source and the app records an intent/result locally. It does not submit an application or create a post.
- **External reference / copy** means a normal user click opens a destination or copies text; rendering the page does not contact the destination.
- **Consent-gated public action** means an explicit signer/destination/review step occurs before data can be broadcast.
- **Not exercised** means source/test review only or intentionally not clicked because doing so would reveal restored personal browser data, create a key/identity, delete data, or send a public event.

The production code contains no seeded sample feed, fake opportunities, or demo relay responses. Test fixtures are confined to the test suite. Live requests are not automatically retried or substituted with cached/example records.

## Top-level navigation

The logo/home control and all ten numbered module buttons switch the active React panel inside a single `/` route. They do not navigate to a server route or contact a peer. The app shell loads the browser-local profile and receipt-count/integrity status; this audit did not inspect profile field contents, messenger messages, or local keys.

| Module | What its visible controls do | Connection status and safe-audit result |
| --- | --- | --- |
| **01 — Signal packet** | Profile fields and goal toggles update browser-local React state and auto-save to local storage. **Run 11-axis review** runs local deterministic logic and records a hash receipt. **Clear profile** asks for browser confirmation and clears only the local profile—not the receipt ledger. Evidence URLs are references; the app does not fetch them while editing or reviewing. | Source reviewed. Not operated because this browser had a restored user profile. No profile values were included in a request. |
| **02 — Readiness / mirror** | **Run again** repeats the local report; Constructive/Dark Mirror controls switch the displayed lens; expanders reveal local evidence; a user-clicked evidence link opens its external destination. The report is not an eligibility, funding, identity, or legal determination. | Source reviewed. Not opened against restored user data. Navigation label was corrected to “11 axes · two lenses.” |
| **03 — Opportunity signals** | Enter or click **Search Grants.gov** sends the trimmed 2–120 character phrase, selected status filter, and page to the official Grants.gov API only after a local lookup-intent receipt is saved. The project profile is not sent. **Load provider details** is a separate provider request. **Use/Remove as private draft context** only changes local draft context. The official-notice/API-terms links are user-clicked references. Previous/Next is bound to the completed result's query and filter; changing the form pauses paging and asks the user to run Search again. | A generic read-only browser search for “open source software” was exercised earlier in the Preview; no project-profile fields were sent. A provider-detail click was attempted, but a successful visible detail response was not captured, so details remain source/test reviewed rather than live-success verified. The UI now names this “Load provider details” and disclaims an eligibility decision. |
| **04 — Broadcast studio** | Channel selectors, **Build**, and text editing create or change a local draft. Exact-text approval is required before copy. GitHub, Reddit, Discord, LinkedIn, and Hacker News are manual copy handoffs—not connected APIs. Relay validation/saving is local. NIP-07 signer authorization is user initiated. Public Nostr publication requires the exact event/relay review, explicit consent, and signer action. | Opened for a read-only UI check; no draft was built, signer authorized, or content signed/published. Nostr relays are the only live public connector in this app, and are optional/user-selected. A relay acknowledgement is not proof of propagation/permanence. |
| **05 — Chain Witness** | Offline mode hashes operator-entered text in the browser and records local receipts. Bitcoin lookup requires a valid txid and an explicit read-only request to Blockstream Esplora; the selected explorer link opens only on click. Other declarations are offline receipts unless a live source is explicitly wired and labeled. **Copy receipt JSON** uses the clipboard. | The Bitcoin mode and one public Genesis-transaction status lookup were exercised earlier; the available audit record does not preserve a sufficiently clear result to mark the lookup a successful live check. No user wallet or transaction identifier was used. |
| **06 — Receipt ledger** | **Verify now** checks the browser-local hash chain. **Export JSON ledger** creates a local download and then records an export receipt. **Inspect/Hide** expands or collapses local receipt detail. This ledger is not remotely anchored, immutable, or a signed VALKYRIE contract. | Source reviewed. No receipt bodies were inspected or exported during the follow-up audit. |
| **07 — 4Reels feed** | The 18+ self-attestation gates the feed workspace and is stored in session storage. Feed, Discovery, IP claim, Media, Branch, and Endorse controls switch local panels. The relay field is user entered; **Read selected relays** displays the exact destinations in a confirmation and makes a read-only selected-kind request only after a local intent receipt. Hide/mute filters are local. Feed cards can display valid/invalid signature status; this does not establish identity or truth. | Feed tab was opened without accepting the age gate or connecting a relay/signer. No feed posts or sample cards were injected. No report, deletion, branch, endorsement, parent fetch, or public action was prepared or sent. |
| **08 — 4Reels brand** | Tagline/template buttons copy static approved text to the local clipboard with visible success/fallback status. Strategy content is static copy, not an active campaign, published post, measurement, or connected analytics stream. The trademark guidance link opens a user-selected official reference only on click. | Brand panel and one representative copy action were exercised. No campaign, post, analytics, or provider request was created. |
| **09 — Sovereign Mesh map** | The search/filter only narrows the bundled owner-supplied directory. Each node/application URL is a normal external link opened only by a user click. Rendering/filtering never performs a health check, authentication, peer discovery, or request to any listed host. | Directory tab and a local “Keira” filter were exercised. No directory URL was opened. Entries remain unverified owner references; peer verification is owner-reserved. |
| **10 — Local messenger** | Creating an identity requires confirmation and creates a separate Ed25519 key in this origin's IndexedDB. Open/Close channel controls same-origin `BroadcastChannel`; send/manual retry reaches only explicitly open tabs sharing that origin. Delete requires confirmation. | Source reviewed only. No identity/key/channel/message was created, opened, sent, retried, or deleted. It is same-browser-tab messaging—not remote peer or machine-to-machine messaging. |

## Media URL and attestation controls

The public media URL field is a reference to a user-hosted direct HTTPS file; Truth-Talk does not upload or host it. **Hash selected file locally** computes the selected bytes in the browser (maximum 250 MiB) and records hash metadata only. It does not upload or transmit the file. **Verify remote bytes now** is a separate, explicit confirmation followed by an unauthenticated, credential/referrer-free GET that refuses redirects and is limited to 250 MiB. The media host may see the user's IP; the host must permit CORS. A CORS/network failure is “unverifiable,” not a digest mismatch. The optional video preview has a 50 MiB limit and requires a matching digest and video MIME type. **Review event** enters the separate signer/publication gate; it does not publish by itself.

The 4Reels composer now has an inline **How do I get this URL?** guide. The step-by-step version is in [Getting a media URL for 4Reels](media-url-guide.md). No provider was selected or checked by this audit.

## Feed actions and public gates

- Branch and endorsement composers build vendor-specific kind 40001 / 40002 events locally. Their **Review** controls do not publish; signing and broadcast are separate. A branch can reference an unresolved parent; it does not make the parent true.
- Report and author-only NIP-09 deletion-request controls create signed requests, not enforcement or removal. They follow the same rights/people/privacy review, signer, and separate broadcast-consent process.
- Parent-event lookup asks the user for an exact event ID and selected relays and performs a read-only query; it does not query the directory or auto-fetch media.
- Media URLs remain unresolved references until the user explicitly verifies them; signatures and SHA-256 digests do not prove identity, truth, rights, capture time, or availability.

No NIP-07 key authorization, event signing, report, deletion request, feed broadcast, media fetch, or public relay test was performed.

## Audit limitations and next choices

1. The source and deterministic test suite cover the buttons/handler boundaries; only the safe controls listed above were exercised in the browser. Private profile/readiness/ledger/messenger actions and destructive or public actions were deliberately not clicked.
2. The directory is not a live mesh. No peer was authenticated, and no owner-listed URL or supplied server address was contacted. Any future VALKYRIE data exchange still requires a versioned, operator-approved signed export/import contract; there is no live integration.
3. The project configuration remains static-only (`server:false`, `database:false`) with no configured media host, user-account service, remote messenger, or non-Nostr social connector. Adding uploads or a backend requires an explicit provider/host and security, retention, deletion, abuse, and cost decision.
4. This report does not claim the public production domain is reachable. Preview, a successful build, and a saved checkpoint are not equivalent to a successful public deployment; the actual public URL must be checked independently.
