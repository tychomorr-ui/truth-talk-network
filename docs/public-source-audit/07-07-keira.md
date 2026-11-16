# KEIRA — Intelligence / Truth Analysis

**Canonical URL:** https://keira.nexinus.net<br>
**Owner-supplied role:** “Intelligence / Truth Analysis” (provided with the audit request; not independently verified).<br>
**Audit coverage:** Partial. `robots.txt` returned only the text `KEIRA` and no crawl directives. The standard `sitemap.xml` URL returned generic not-found content, so no complete sitemap route inventory was available. The shipped route table exposes three named product paths; all three were fetched as HTML. No cap was approached: 3 HTML routes and 2 first-party assets were inspected. No route beyond these named paths was enumerated or guessed. [1] [2] [3] [4] [5] [6] [7]

## Observed pages and assets

The public text extractor presented the landing page as “KEIRA Intelligence,” with copy inviting a focused conversation for “structured reasoning, evidence review, and practical next steps,” the phrase “Sovereign account access,” and “Create account” / “Sign in instead” labels. These are page text and self-description, not verified service properties. A plain GET of the landing page’s HTML showed only a `KEIRA` title, an empty `#root` mount point, and links to the JavaScript and CSS below; page code was not executed and no controls were used. [1] [6] [7]

The bundle declares `/` and `/portal-chat` as the same chat component and `/keira/verify` as the trajectory-verifier component. The two additional route documents were fetched as HTML shells, not rendered or interacted with. The app also defines `/404` and a fallback component; neither was opened. The standard sitemap did not provide any further route list. [4] [5] [6]

Inspected first-party assets, both served from the canonical host:

- JavaScript: https://keira.nexinus.net/assets/index-IDhfUcvp.js — production bundle; minified.
- CSS: https://keira.nexinus.net/assets/index-DtT82idc.css — minified stylesheet.

No source repository link was exposed in the inspected landing page or assets. GitHub references found in the bundle were library/dependency references, not an explicitly linked KEIRA source repository. [1] [6] [7]

## Frontend behavior and claims

**Directly visible/extracted page content:** the landing copy and account labels above were surfaced by the public page extractor. Raw HTML remained an app shell, so interactive behavior was not tested. [1]

**Supported by shipped frontend code:** the bundle contains a registration/login interface, chat UI, conversation/context and trajectory-related client operations, and a separate JSON report verifier. The route table and component source support those interface capabilities, but this audit did not submit forms, send messages, upload files, or call any application API. [4] [5] [6]

**Page/self-claims not independently verified:** “Sovereign account access”; KEIRA’s stated ability to provide structured reasoning, evidence review, and practical next steps; and the verifier’s copy describing its Ed25519 attestation as “server-issued.” The source establishes client-side checks, not service performance, data sovereignty, issuer identity, signed identity, domain ownership, mesh enrollment, or peer health. [1] [5] [6]

## Provenance and verifier boundary

The verifier accepts a JSON report with `reportType` equal to `KEIRA_MIST_MERKLE_VERIFICATION`, `schemaVersion` `1.0.0`, `saved_merkle_root`, `trajectory_root_cid`, `audit_leaves`, and `attestation`. It checks that the trajectory root equals the saved Merkle root. Each leaf is expected to expose `leaf_index`, `artifact_cid`, numeric `rank`, numeric `rrf_score`, and `leaf_hash`; indices must be contiguous starting at zero. [5] [6]

The shipped code canonicalizes objects recursively by sorting keys and omitting undefined properties, preserves array order, then JSON-stringifies. A leaf hash is SHA-256 over that canonical JSON for exactly `{artifact_cid, rank, rrf_score}`. The Merkle routine hashes concatenated hexadecimal child-hash strings with SHA-256, duplicates the final hash at an odd-width level, and returns the sole root; its empty-tree branch hashes canonical JSON for `{schemaVersion: "1.0.0", empty: true}`. The report’s leaf list is sorted by `leaf_index` for recomputation. [6]

The verifier imports `attestation.pubkey_hex` as a raw Ed25519 public key and checks `attestation.signature_hex` over the UTF-8 bytes of `trajectory_root_cid`. It requires `algorithm: "Ed25519"` and `encoding: "hex"`. The public key is supplied by the report itself; no independent pinned/trusted key or identity binding is visible in this bundle. Thus the observable check can establish internal consistency against the supplied key, but not who controls that key or whether it is a KEIRA/server key. `generatedAt` and `trajectory.queryHash` are surfaced by the success UI but are not part of the displayed leaf hash or signature message. [5] [6]

The verifier UI accepts a JSON file or pasted JSON and the verifier code reads/parses it and uses browser Web Crypto. It displays the claim “No report data is uploaded to KEIRA by this verifier”; code inspection supports local parsing and cryptographic validation in that component, but the claim was not runtime-tested. No storage location, retention rule, or persistence boundary for reports, trajectories, conversation data, or keys is established by the inspected public material; these remain unknown. [5] [6]

## Integration contract and gaps

The frontend configures a same-origin tRPC client at `/api/trpc` with `credentials: "include"`. The bundle references account operations (`auth.me`, `auth.register`, `auth.login`, `auth.logout`) and portal/chat operations for conversations, context ledger, recall, capabilities, runtime status, MIST/boomerang trajectories, attestation attachment, and document ingestion. This describes frontend wiring only. No API/RPC request was made, so server-side procedures, authorization, data handling, signing-key custody, actual report storage, and live service behavior are unknown. [6]

No personal contact information or credential/token value is reproduced. No secret-like value was encountered in the inspected materials.

## References

[1]: https://keira.nexinus.net/ "KEIRA landing page"
[2]: https://keira.nexinus.net/robots.txt "KEIRA robots.txt"
[3]: https://keira.nexinus.net/sitemap.xml "KEIRA standard sitemap URL"
[4]: https://keira.nexinus.net/portal-chat "KEIRA chat route"
[5]: https://keira.nexinus.net/keira/verify "KEIRA trajectory verifier route"
[6]: https://keira.nexinus.net/assets/index-IDhfUcvp.js "KEIRA first-party JavaScript bundle"
[7]: https://keira.nexinus.net/assets/index-DtT82idc.css "KEIRA first-party stylesheet"
