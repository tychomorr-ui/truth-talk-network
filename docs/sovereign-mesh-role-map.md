# Sovereign Mesh role map and Truth-Talk boundaries

**Status:** Owner-directed target architecture, updated 2026-10-27. This document consolidates the owner's role corrections and the supplied Nexinus Atmos / Pharo-Lapse guidance. It is not evidence that the systems are currently connected, deployed, or cryptographically verified. The owner-supplied directory and public-page observations remain separately documented in [`00-user-supplied-11-node-list.md`](ugc-research/00-user-supplied-11-node-list.md) and [`11-node-public-review.md`](ugc-research/11-node-public-review.md).

## Product and network model

Truth-Talk is a distinct social and intellectual-property application with its **own application data store**. It is presented from Rootgate through a dedicated Truth-Talk tab that opens the Truth-Talk application. Rootgate is the human identity anchor and front door; it is not thereby the owner of Truth-Talk's posts, media records, or application database.

The platform is local-first and peer-to-peer-capable. **Pharo-Lapse is the offline store-and-forward messaging protocol**, not merely a terminal helper. Its repository defines signed end-to-end envelopes, durable queues on both endpoints, deduplication/exactly-once delivery semantics, and optional multi-hop forwarding over an IP-capable carrier. It is designed for intermittent or unavailable public-internet infrastructure without a public-internet dependency, cloud broker, certificate authority, or third-party service; devices still need a path to exchange packets, such as a local network or mesh carrier. See the [Pharo-Lapse repository README](https://github.com/tychomorr-ui/pharo-lapse) and [v1.1.0 specification](https://github.com/tychomorr-ui/pharo-lapse/blob/main/spec/PHARO-LAPSE-v1.1.0.md). The v1.1.0 specification labels itself **Informational / Experimental** and says its live gate needs an executable test harness and two-device overlay; prior v1.0 test receipts in the repository are historical evidence, not a fresh test performed for Truth-Talk.

Nexinus Atmos is the surrounding peer environment for discovery, presence, topology, rendezvous, transport coordination, and capability exchange. NEXAL is the meta-interoperability message format and routing convention; it is neither the network nor a synonym for Pharo-Lapse. Their exact integration/adapter contract must be explicit rather than inferred. Local execution must not require centralized computation. Previously established peer relationships should continue during Rootgate or coordination-service loss where the network permits.

A hosted web page is only one delivery surface. It is not the identity authority, node-verification authority, adjudication layer, or mandatory execution environment. A Truth-Talk-owned database must remain isolated from Valkyrie, Keira, and other application databases. Cross-application connection should use scoped, versioned, auditable message/API contracts—not direct database sharing.

## Owner-directed system roles

| System | Role to preserve | Authority boundary |
|---|---|---|
| **ROOT-GATE** | Human identity anchor and front door; contains the dedicated Truth-Talk tab. Also provides optional bootstrap/rendezvous for discovery and introductions. | May establish a person's identity and help peers discover or introduce one another. It must not become mandatory compute, a universal data store, or the sole authority for every operation. Local work and established peers should survive its unavailability where technically possible. |
| **ARCHANGEL** | Control plane and conductor for the mesh. Per the owner's latest correction, Archangel signs and verifies node identities/evidence. | Owns node enrollment/registry and the node-signing and verification authority. It does not own every application's data or replace local node execution. |
| **TESSERACT-A** (display name: **Tesseract Mirror**) | Owner-designated mirror/recovery node; the Oct 28 operator transcript lists its ATMOS identity endpoint as `https://tesseract.nexinus.net`. | This node identity is distinct from Tesseract-A Core, the verifier software capability. A signed identity endpoint does not itself prove a full mirror application is deployed. |
| **VALKYRIE** | Mesh-wide adjudication layer, including the owner's Dark Mirror / VERDEX functions. It is connected, by explicit contracts, with Truth-Talk and the other applications. | Consumes evidence and application submissions, applies adjudication, and returns an attributable decision. It is not Rootgate's identity provider or Archangel's node-signing authority. Its data is not a shared database for all apps. |
| **KEIRA** | Intelligence and truth-analysis role. | Provides analysis; it does not silently become the control plane or evidence-signing authority. |
| **TESSERACT-TERMINUS** | Provenance / terminal / sovereign-console application at `universaltruth.life`; the Oct 28 transcript lists `https://terminus.nexinus.net` as its ATMOS identity endpoint. | Distinct from TESSERACT-A / Tesseract Mirror. Keep application URLs separate from identity-manifest endpoints. |
| **XINUS-CLARITY** | XinUS Clarity workspace / suite. | Preserve this owner-supplied role; do not invent a more specific service contract from the name alone. |
| **MONARCH-OS** | Sovereign OS layer / Kether-Gate. | A distinct system role, not a substitute for Archangel's control-plane authority. |
| **PROJECT RECLAIM** | Field-activation portal. | Field-service application role; no operational field state is inferred from its listing. |
| **IWA SAGE** | Community wellness / service layer. | Its application data and sensitive service relationships remain separately governed. |
| **RESONATE EARTH** | Public application at `resonate-earth.live`; the Oct 28 transcript lists `https://resonate.nexinus.net` as its ATMOS identity endpoint. | A distinct public-facing role; the identity endpoint does not mean the application was moved. Do not conflate it with Native Grounds. |

### Additional standalone applications

- **PROPERTY MAINTAINED:** maintenance-documentation application.
- **NATIVE GROUNDS:** wholesale coffee application; separate from Resonate Earth.
- **XINUS PORTFOLIO:** venture/dashboard application.
- **TRUTH-TALK:** the dedicated Rootgate social/IP application and tab, with its own app and data store; interoperates with Rootgate identity, Archangel's verified receipts, and Valkyrie's adjudication through explicit contracts.

These are owner-directed product roles, not a claim that all services are active peers today.

## Evidence and message flow

```text
Person
  │ authenticates / identifies through Rootgate
  ▼
Rootgate ── dedicated tab / scoped handoff ──► Truth-Talk app + Truth-Talk-owned data
  │                                                │
  │ optional bootstrap/rendezvous                 │ consented, versioned evidence request
  └────────────── Nexinus Atmos ◄──────────────────┘

Nexinus Atmos (optional peer environment)
  └── discovery / presence / topology / rendezvous / capability exchange

NEXAL
  └── meta-message format and routing convention

Sovereign devices
  └── Pharo-Lapse offline store-and-forward messaging over an available carrier

Node-signed health evidence ──► Archangel (Tesseract-A Core Ed25519 capability)
                                      │ verified receipt
                                      ├────────► Truth-Talk imports/displays locally
                                      └────────► Valkyrie adjudicates with provenance

Truth-Talk / other apps ── scoped, signed contracts ──► Valkyrie decisions
```

A node is not “verified” merely because its hostname resolves, it responds with HTTP 200, or its UI says it is online. The verification receipt must be grounded in the configured node identity, Ed25519 signature, expected signed manifest, artifact/code hash, timestamp/freshness, and an explicit evidence boundary. The current attached receipt note says its contract carries `SIGNED_HEALTH_OBSERVATION_NOT_SERVICE_AUTHORITY`; preserve that distinction. Truth-Talk may call a receipt **verified by Archangel/Tesseract-A** only to the extent the imported receipt actually supports that claim. It must not imply that Truth-Talk independently verified the signature unless the imported payload includes the complete signed bytes, signature, public key, and algorithm needed for local verification.

## Truth-Talk identity and data boundary

1. Rootgate is the identity source/front door. Truth-Talk receives only a scoped identity assertion or stable subject reference under a documented handoff contract; it does not take custody of Rootgate private keys.
2. Truth-Talk owns its social/IP application records in its own database. That database is not Valkyrie's adjudication database, Keira's intelligence store, or Archangel's node registry. No cross-application direct SQL access is implied.
3. Signing keys remain with their authorized owner/wallet/node. Private node keys do not enter Truth-Talk, a browser bundle, a shared repository, or a peer-discovery service.
4. Truth-Talk imports and displays verified receipts; it does not probe the node rack. Receipt import does not itself create an adjudication, public post, or investor claim.
5. Local work must continue without central computation. Cross-device, asynchronous social delivery may use opt-in peers/relays; this transport choice does not redefine Rootgate, Archangel, Valkyrie, or Truth-Talk's data ownership.

## Current implementation state — do not confuse with target state

The available Truth-Talk `0.4.0` source trees are still a standalone browser application. A source search found no Rootgate identity handoff, dedicated Rootgate tab wiring, Truth-Talk server/database, Archangel integration, or Tesseract-A signed-health receipt-import panel. The current directory is a static owner-supplied reference list, not a peer connection or health monitor. This discrepancy is a concrete implementation gap; this document does not relabel it as completed.

The owner reports that the Tesseract-A migration script was made rerunnable with `information_schema` guards, stable-ID `INSERT IGNORE` archival, and guarded cleanup, and that static checks, `pnpm check`, 12 tests, and `git diff --check` passed. The owner explicitly did **not** run the migration because no MySQL/MariaDB server or configured database connection was available. Therefore no database change, node-status update, production receipt, or live Archangel/Tesseract-A connection is claimed here. MySQL DDL is nontransactional; use the owner's stated stop/recovery procedure and an operator-approved database window before any execution.

## Unresolved contracts — do not guess

- Rootgate-to-Truth-Talk identity handoff: subject identifier, signed assertion format, scopes, expiry/revocation, and offline behavior.
- Truth-Talk database deployment and replication: a Truth-Talk-owned store is required by the target; select its local/peer/offline behavior and hosting topology without making centralized hosting mandatory for local execution.
- Archangel/Tesseract-A receipt schema and endpoint: Ed25519 public-key/key-reference model, signed bytes, manifests/artifact hashes, freshness, failure states, revocation, and operator authorization.
- Valkyrie adjudication contract: which evidence is submitted, how consent and provenance are preserved, and how signed decisions are returned to each app.
- Pharo-Lapse/Atmos/NEXAL integration contract: the Pharo-Lapse v1.1 message and queue specification exists in its repository; define only the adapter boundary to Atmos discovery/rendezvous and NEXAL metadata/routing. Preserve Pharo-Lapse as offline store-and-forward delivery; specify peer identity binding, version negotiation, route/replay protections, and behavior when optional coordination disappears. Do not collapse the three names into one protocol or service.
- Canonical **Quantus** definition: unknown until authoritative artifacts establish it. Do not add Quantus to this role map or implement it by inference.

**No runtime infrastructure was changed while correcting this role map.** Pharo-Lapse details above come from the earlier read-only inspection of its GitHub README/specification; no repository code was run. No host, database, key, migration, relay, DNS record, account, or Rootgate/Valkyrie connector was configured.


## Rootgate navigation observation (2026-10-27)

The public Rootgate header contains a “Truth Talk” link whose current href is `/truth` on the Rootgate origin; the hero’s “Explore Truth Talk” link points to the same-origin `#truth-talk` section, and the related “Explore the public ledger” link also points to `/truth`. This confirms that Rootgate already exposes the entry point, but it does not yet prove that the header opens the separate Truth-Talk application. Do not replace the current route with a broken or placeholder origin: first restore a healthy standalone production URL, then change the existing header target to that final approved URL while preserving any embedded Rootgate feed section the owner still wants.


### Direct /truth route check

A read-only visit to `https://rootgate.manus.space/truth` renders a Rootgate-hosted feed page titled “ROOT — Sovereign Gateway.” It offers declaration filters and “Sign in to publish,” then remains at “Loading the public ledger…” in this unauthenticated check. This route is not the standalone React/Vite Truth-Talk app. No sign-in, post, or other write action was performed.


## Tesseract-A Core source review — pinned evidence (2026-10-27)

Read-only inspection of [`tychomorr-ui/tesseract-a-core`](https://github.com/tychomorr-ui/tesseract-a-core) at commit `a782a97cf8a363af5b5e6b28eacad127f71cadd9` confirms that the repository implements a local one-shot HTTPS probe and Ed25519 verification capability. The relevant source is [`src/contract.ts`](https://github.com/tychomorr-ui/tesseract-a-core/blob/a782a97cf8a363af5b5e6b28eacad127f71cadd9/src/contract.ts), [`src/health-probe.ts`](https://github.com/tychomorr-ui/tesseract-a-core/blob/a782a97cf8a363af5b5e6b28eacad127f71cadd9/src/health-probe.ts), and the [`README`](https://github.com/tychomorr-ui/tesseract-a-core/blob/a782a97cf8a363af5b5e6b28eacad127f71cadd9/README.md). The payload schema is `NEXINUS_ATMOS_SIGNED_HEALTH/v1`; the output observation is `TESSERACT_A_HEALTH_RECEIPT/v1`. The probe checks HTTPS, rejects redirects, checks the configured node ID and Ed25519 service signature, and can match configured manifest and artifact hashes. It is single-shot and does not retry automatically.

Important limitation: the current `HealthReceipt` type contains `serviceSignatureVerified: true` and the boundary `SIGNED_HEALTH_OBSERVATION_NOT_SERVICE_AUTHORITY`, but no signature over the receipt itself, no Archangel key reference, and no expiry/freshness limit in the receipt schema. The `ProbeResult` includes the original signed health payload, which is the evidence Archangel can re-verify. `src/health-probe.ts` uses a recursively sorted JSON serializer; do not assume that is identical to the RFC 8785/JCS serializer used in Truth-Talk. A versioned contract must fix the exact signing bytes/canonicalization and stale-evidence rules.

The repository README explicitly says its default node configuration is empty and a source checkout does not prove any remote node is online. Its health-probe test checks canonical JSON and an unreachable target; it does not provide a successful live signature-verification test. The legacy Mist engine and database schema contain simulated/legacy surfaces and must not be treated as verified node data or imported into Truth-Talk. The README also gives an example using a VALKYRIE private key to derive a public key; do **not** follow that example for this mesh. It conflicts with the owner's authority separation. Archangel must own a separate signer key and its private key must remain in Archangel-controlled storage.

### Required integration boundary

1. Tesseract-A's probe/verifier is a capability under Archangel's control plane, not a second network authority. It supplies the observed signed health payload and a content hash of its local verification result.
2. Archangel independently verifies the node identity, signature, manifest/artifact hashes, observation time, and configured trust root, then signs a versioned Archangel receipt. The signing key is Archangel-only; no VALKYRIE key or database is reused.
3. Truth-Talk imports only the Archangel-signed receipt, verifies it locally against an operator-pinned Archangel public key, and stores the user-selected receipt and hash in Truth-Talk's own store. It labels the observation as time-bounded health evidence, never service authority or a guarantee of truth/IP rights.
4. Until Archangel source, its public-key trust contract, and a successful end-to-end signed-receipt test are available, no Archangel integration is claimed live and no receipt-import UI is labeled verified.

No repository code was executed, no nodes were probed, and no key, database, schema, address, or infrastructure was modified during this review.

### Tesseract-A Core is not the Tesseract Mirror node

The owner's latest correction names the **TESSERACT-A node** “Tesseract Mirror.” Keep that display identity separate from the **Tesseract-A Core verifier capability**, which belongs under Archangel's control plane. The Oct 27 audit used `tesseract.manus.space`; the Oct 28 owner-supplied endpoint table supersedes that ATMOS identity URL with `https://tesseract.nexinus.net` and lists `https://terminus.nexinus.net` for Tesseract-Terminus. The same transcript says the product sites `universaltruth.life` and `resonate-earth.live` were not moved. Do not conflate the node's display name, the verifier component, and the product or identity endpoint URLs.


## ATMOS operator audit: identity reconciliation hold (owner-supplied, 2026-10-27)

The owner-supplied audit transcript reports contradictory state in `atmos-operator-v2`: its configuration remains `PENDING_OPERATOR_APPROVAL` and all 11 control inputs remain `AWAITING_SIGNED_PUBLIC_MANIFEST_AND_AUTHORIZATION`, while an older sync report says `SYNCHRONIZED`. In that tool, “synchronized” means a local manifest signature passed and the declared host returned a 2xx HEAD response. It does **not** establish that the host served the expected signed identity, that a well-known identity document matched the key, or that redirects and freshness were checked. Treat that status as a stale transport observation, not node authentication or mesh membership.

The transcript identifies two incompatible identity generations and warns against collapsing different digests:

- The Oct 9 SRI set uses local keys and signed identity documents. Its public-key SPKI fingerprint is distinct from the SHA-256 digest of the identity document. The file named `expected-identity-hashes.txt` reportedly contains the document digest, while the shell signer compares an SPKI fingerprint.
- The Oct 23 ATMOS-1.1.1 set contains a second set of SPKI fingerprints and imported signed manifests. Its private keys are not in the v2 `keys` directory; the audit reports that the v2 local keys match the Oct 9 SRI set, not the Oct 23 imports.
- The transcript reports different canonical loci in the two sets. These are competing declarations, not authority to rewrite the owner-directed role map:

| Node | Oct 9 SRI/receipt map | Oct 23 ATMOS declaration |
|---|---|---|
| TESSERACT-A | `clarityapp-hw9fbadc.manus.space` | `tesseract.manus.space` |
| TESSERACT-TERMINUS | `tesseract.manus.space` | `universaltruth.life` |
| VALKYRIE | `xinusdash-doy5g86k.manus.space` | `valkyrie.nexinus.net` |

That paragraph records the Oct 27 owner-corrected application/host map. The Oct 28 transcript supersedes its ATMOS identity endpoints: TESSERACT-A / Tesseract Mirror is listed at `tesseract.nexinus.net`, TESSERACT-TERMINUS at `terminus.nexinus.net`, and VALKYRIE at `valkyrie.nexinus.net`; `universaltruth.life` remains a separate product site. Treat the transcript's endpoints as owner-directed declarations, not by themselves as signed verification or proof that each application moved.

The transcript further reports that Pharo-Lapse peers are still `PENDING_APPLY` / `PENDING_OPERATOR_HARDWARE` with pending public keys, and that the Tesseract catalog says `NOT_AUTHORIZED`, identity hashes `BLOCKED`, zero signed manifests published, and zero HEAD probes run. It also distinguishes the operator's 11-node list from a different 11-entry identity registry, a six-node WireGuard/Manus manifest, and a separate seven-node MIST catalog. These are not interchangeable registries; no peer should be called active based on their shared names.

The audit also flags differing shell/JavaScript canonicalization, a v1/v2 signing-algorithm mismatch, duplicate empty output directories, and private signing-key files reported in several operator-workspace locations. The transcript does not print key values and is not proof of compromise, but custody needs operator review. Do not run the sign/sync scripts, copy keys, or rotate/re-sign against either generation until the owner selects the authoritative set and approves a key-custody/rotation plan. If any private key is confirmed to have been exposed outside authorized storage, treat that as a separate incident and revoke/rotate only under the approved recovery plan.

**Truth-Talk boundary:** this is an owner-supplied audit summary, not a fresh inspection of the operator machine. Until one generation, one canonical locus per node, the digest semantics, and the signer/verifier canonicalization are approved and independently checked, Truth-Talk must keep cross-node references unresolved and must not consume “SYNCHRONIZED,” HTTP 2xx, or these manifests as proof of node identity, authorization, or live peer status. No operator script, host, key, node, repository, or database was changed for this update.

## ATMOS local canonicalization update (owner-supplied transcript, 2026-10-27)

The latest attached transcript reports that the operator workspace was locally changed after the earlier conflict report. It says the October 23 private signing keys were not recovered; the operator selected the private keys already present under `atmos-operator-v2/keys` for local control, archived the October 9 SRI and October 23 uncontrolled material, signed 11 ATMOS-1.1.1 manifests using a single canonical-JSON path, and split `publicKeyFingerprintSha256`, `identityDocumentSha256`, `manifestPayloadSha256`, and `artifactSha256`. It reports local signature checks passing 11/11 and changes the TESSERACT-A display name to “Tesseract Mirror.” These are reported workspace actions, not independently inspected artifacts or a mesh-wide authorization decision.

The transcript reports that a network probe was run with an operator authorization label. Its stated result remains **0/11 remotely verified**: ROOT-GATE, XINUS-CLARITY, and PROJECT RECLAIM reportedly serve an older document for the controlled public key; MONARCH-OS, TESSERACT MIRROR, KEIRA, ARCHANGEL, IWA-SAGE, and RESONATE EARTH reportedly have no recognizable identity document at `/.well-known/atmos-identity.json`; TESSERACT-TERMINUS and VALKYRIE reportedly failed their probes. The attached summary reports no host deployment, signed health not yet bound to the artifact hash, and no node marked synchronized. The archive is now available and its internal structure/counts were checked, but the summaries do not independently prove the remote responses.

The transcript also reports that the Pharo-Lapse peer roster remains `PENDING_KEY`, KEIRA's application identity was not replaced, an unclassified KEIRA key was moved within the operator workspace, and an unreadable `valkyrie-private.pem` was left in place. Do not copy, publish, repurpose, or ask the owner to paste any private key. The transcript does not prove key compromise; keep the unclassified key outside the mesh signing flow until its custodian classifies it.

**Current interpretation:** local state may be internally canonicalized according to the operator's transcript, but remote identity, host publication, authority, and peer activation remain unverified. “Local signatures valid 11/11” is not “mesh synchronized.” The attached redacted summary reports remain insufficient to independently verify local signatures or remote responses. The remaining evidence is the signed manifests/public identity bytes and the actual per-node served identity + manifest + artifact-bound signed-health evidence, reviewed from an authorized workspace. No operator workspace is connected to this Truth-Talk session; no operator files, keys, scripts, hosts, or sibling repos were changed here.

## Attached redacted evidence archive review (2026-10-27)

The uploaded `atmos-review-evidence-20261027.tar.gz` has SHA-256 `477a47c0dee165f233615ade73b3799b2db6c3f605a969b4084e64790ff70e48`. Its tar listing contains only `README.txt`, `atmos-sync-report.json`, and `canonicalization-resolution.json` beneath the expected directory; member paths are relative, with no traversal, links, or key-file names. The archive has no PEM/private-key marker. Its README describes the contents as public-key fingerprints and statuses only. The archive's content was parsed in memory; no scripts were run and it was not extracted into the project.

The two JSON reports share the same timestamp (`2026-10-27T19:39:19.281Z`), contain 11 per-node rows, and have identical result arrays. Their internally consistent status counts are **0 verified, 3 `REMOTE_KEY_MATCH_MANIFEST_NOT_SERVED`, 6 `REMOTE_IDENTITY_NOT_PUBLISHED`, and 2 `PROBE_FAILED`**. The report policy says synchronization requires a served fingerprint, signed health, and artifact hash; a HEAD response alone is insufficient. The resolution names the local `atmos-operator-v2/keys` generation as canonical for local signing and labels the mesh `NOT_CRYPTOGRAPHICALLY_SYNCHRONIZED`.

The archive is a redacted summary, not the underlying cryptographic/network evidence: each sync row contains only node ID, display name, endpoint, public-key fingerprint, and status. It contains no signed manifest bytes, signature values, identity-response body, signed-health payload, artifact bytes/hash evidence, or operator-home backup. Thus its consistency and absence of included secrets were checked, but the reported local signatures and remote probe results were not independently reproduced. The report describes the backup as not included and says the unmatched home key is quarantined outside the signing set while an unreadable home key remains in place; no key material was provided or handled here.


## Oct 28 ATMOS endpoint update and post-DNS read-only check

The Oct 28 transcript reports that the operator changed DNS for the six new identity-edge hosts after their pre-DNS checks. Its latest 11-node endpoint table lists these ATMOS identity URLs: ROOT-GATE `https://rootgate.nexinus.net`, TESSERACT-TERMINUS `https://terminus.nexinus.net`, XINUS-CLARITY `https://clarity.nexinus.net`, MONARCH-OS `https://monarch.nexinus.net`, TESSERACT-A / **Tesseract Mirror** `https://tesseract.nexinus.net`, KEIRA `https://keira.nexinus.net`, VALKYRIE `https://valkyrie.nexinus.net`, ARCHANGEL `https://archangel.nexinus.net`, PROJECT RECLAIM `https://reclaim-node.nexinus.net`, IWA-SAGE `https://iwa.nexinus.net`, and RESONATE EARTH `https://resonate.nexinus.net`. In that same transcript, `universaltruth.life` and `resonate-earth.live` remain separate product sites; the `.nexinus.net` URLs for Tesseract-Terminus and Resonate Earth are the identity endpoints, not proof that those applications were migrated.

At approximately 14:03 PDT on Oct 28, a read-only HTTPS check from this Sandbox queried `/.well-known/atmos-identity.json`, `/health`, and each health response's declared same-origin artifact path on the 11 endpoints above. All 11 identity and health routes returned JSON with HTTP 200 and no redirects. Each identity's node ID matched its listed node, and its public-key SPKI fingerprint matched the corresponding pin in the earlier owner-supplied Oct 27 report. All 11 health responses reported `status: ok`, contained a service-signature field, linked `manifestCid` to the identity `payloadHash`, and linked the identity's artifact hash field to the health `codeHash`. These are observed response and field-consistency checks; I did **not** independently verify the Ed25519 identity or health signatures, and the earlier public-key pin list remains owner-supplied rather than an independently authenticated trust root.

Artifact-byte results were mixed. Eight nodes exposed `/.well-known/atmos-artifact.json`; the downloaded JSON bytes matched the advertised identity/health hash. This confirms the bytes of those identity-edge metadata files, not an application bundle. For KEIRA and VALKYRIE, the health payload named local filesystem artifact paths; requesting the corresponding URL paths returned HTTP 200 but the bytes did not match the advertised code hash. For ARCHANGEL, its health payload's local-path artifact URL returned 404. Therefore this Sandbox did not independently verify the running application artifact for KEIRA, VALKYRIE, or ARCHANGEL. The direct checks improve the prior Oct 27 `0/11` endpoint-availability picture, but they do **not** establish `11/11` cryptographically verified peers or deployed application bundles.

The transcript's cross-application inventory says the eight other nodes expose identity artifacts rather than application bundles; it names KEIRA, VALKYRIE, and ARCHANGEL as the three nodes with running application services. This does not imply that separate product sites were moved to the identity-edge hosts. Truth-Talk still has no Rootgate identity handoff, Archangel receipt import, Valkyrie adjudication API, or Pharo-Lapse peer route implemented in its standalone app.

**Security and remaining evidence:** the public health payloads for KEIRA, VALKYRIE, and ARCHANGEL disclose local absolute artifact paths, while those paths do not resolve to the matching artifact bytes over HTTPS. Replace public filesystem paths with an opaque artifact identifier or a safe stable HTTPS artifact URL. If artifact-level verification is intended, publish the exact bytes or a signed immutable artifact address. To claim cryptographic verification, independently validate each Ed25519 signature against an operator-approved trust root using the exact canonicalization code, then apply freshness/revocation rules and confirm the signed artifact binding. No DNS, host, code, key, or remote state was modified by this Sandbox check.


## Oct 28 final verification archive review (14:18 PDT)

This later review supersedes the 14:03 note above that signature fields had not yet been independently checked. Using the exact canonicalization and Ed25519 verification rule in the inspected public ATMOS verifier, all **11/11** archived signed manifests validated. All **11/11** live identity signatures validated and the canonical live identity objects matched the archive manifests. All **11/11** health signatures validated; each health `manifestCid` and `codeHash` matched its signed manifest. The raw identity/health body digests served at check time matched all 11 archived observation records. These results establish cryptographic consistency against the key material and public pin list; they do not independently authenticate who controls the pin list.

The current public pin set is not fully aligned: all 11 public-key fingerprints match, but only **10/11** `manifestPayloadSha256` and `artifactSha256` values match. ARCHANGEL's signatures, payload, live identity, health signature, and internal health-to-manifest artifact binding are valid and mutually consistent, but both its signed manifest payload hash and artifact hash disagree with the current public `expected-identity-hashes.json`. The archive omits the exact pin-file snapshot used for its `11/11 VERIFIED` report, so that count cannot be reproduced against the currently published pin file. Do not silently select either hash set. The inspected verifier commit is unsigned, and its verification code does not enforce every expected hash field.

Signature validity is not freshness: ten signed-health timestamps were approximately 24.6–25.1 hours old; ARCHANGEL's was about 66 minutes old. The verifier enforces no freshness/expiry or anti-replay policy. Eight nodes publish identity metadata rather than application bundles; the other three application hashes are signed but the executable bytes are not independently available at safe stable URLs. Public health responses expose local filesystem paths for those application nodes. WITNESS is described in the archive README as outside the canonical 11, but no WITNESS manifest/observation is present in the 11-node report and its separate claim remains unverified here.

See the detailed [ATMOS final-verification archive review](atmos-final-verification-review-2026-10-28.md). Truth-Talk still has no live Rootgate handoff, Archangel receipt-import contract, Valkyrie API, or Pharo-Lapse peer route; no remote changes were made during this verification.
