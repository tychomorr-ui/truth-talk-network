# TruthTalk Network

**Repository:** `truth-talk-network`  
**Release:** `0.4.1`  
**Audit baseline:** 2026-11-16  
**Role:** standalone browser application with a scoped, signed ROOT identity handoff receiver

TruthTalk is an evidence-first, browser-local workspace for making claims, sources, media hashes, readiness reviews, signed-feed actions, and receipt history legible. It is intentionally separate from ROOT, VALKYRIE, ARCHANGEL, and other ecosystem applications. It does not use a shared database, shared private key, third-party behavioral analytics, or background telemetry.

## Release status

| Area | Status | Evidence or limitation |
| --- | --- | --- |
| TypeScript | PASS | `pnpm check` passes. |
| Production build | PASS | `pnpm build` passes and produces static `dist/` output. |
| Automated tests | PASS | 16 test files, 65 tests passed on 2026-11-16. |
| Local receipt ledger | Implemented | Browser-local hash-linked receipts; not a remote immutable ledger. |
| ROOT handoff receiver | Implemented | Ed25519 verification, pinned public key, origin, scope, expiry, and session replay checks. |
| ROOT signer key match | Verified locally | The local ROOT signer derives the same public key pinned in `src/lib/rootHandoff.ts`. |
| Production handoff issuance | BLOCKED | ROOT must receive `ROOT_TRUTHTALK_HANDOFF_PRIVATE_KEY_PEM` through protected secret configuration. |
| Remote account/database | Not configured | This release remains a static browser application. |

The receiver is build-clean and locally key-compatible, but the end-to-end production handoff is not called active until the ROOT signing secret is configured and a live issue/consume test is completed.

## Repository layout

```text
src/lib/rootHandoff.ts  ROOT_TRUTHTALK_HANDOFF/v1 verifier
src/lib/receipts.ts     Browser-local hash-linked receipt ledger
src/                    Application shell and feature modules
public/                 Static route and favicon assets
tests/                  Vitest unit and component tests
docs/                   Architecture, audit, runbook, and source notes
```

Detailed contract and release evidence are documented in [the ROOT handoff integration record](docs/root-handoff-integration-2026-11-16.md).

## Security boundary

TruthTalk accepts only a `ROOT_TRUTHTALK_HANDOFF` message from `https://rootgate.manus.space`. It validates the pinned Ed25519 public key, version, issuer, audience, fixed `member_code`/`display_name` scope, subject and JTI format, timestamp window, and canonical-payload signature. The JTI is also guarded against duplicate acceptance during the current browser session.

No ROOT private key, cookie, database credential, or unrestricted application authority crosses the boundary. Do not place identity envelopes or member codes in URLs. Never commit private keys, seed phrases, session cookies, `.env` files, or production credentials.

The standalone deployment target is `https://rootgate.nexinus.net/truthtalk/`. ROOT and TruthTalk remain separate applications and repositories.

## Development checks

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

The 2026-11-16 verification run completed with `pnpm check` PASS, `pnpm test` PASS (16 files / 65 tests), and `pnpm build` PASS.

## 4Reels brand and launch

TruthTalk includes a first-class, draft-only **4Reels brand & launch** module. It presents the recommended evidence-attached creator/build-in-public niche, audience, editorial pillars, short-form episode outline, taglines, staged rollout, candidate signals, and name-clearance caveat. Copy buttons use the browser clipboard only. The module does not schedule a campaign, publish posts, query relay/analytics services, or claim an active audience or measured performance. The full [4Reels brand and launch plan](docs/4reels-brand-launch-plan.md) is available as a separate document.

The related prompts are documents for the owner to paste elsewhere—not connected integrations or executed tasks: [the separate Manus-profile Cosmic Net/Universal Truth upgrade prompt](docs/prompts/manus-cosmic-net-upgrade.md) and [the one-turn, credit-conscious Lovable prompt-builder prompt](docs/prompts/lovable-prompt-builder.md). The 1,300-credit balance and free Lovable-chat availability are owner-reported; neither account was accessed, and no credits were used here.


## Product status and live behavior

- **Browser-local:** project profile, readiness calculation, feed hide/mute filters, and the local receipt ledger stay in this browser. The messenger, if the user explicitly creates an identity, is same-origin/same-browser-tab only; it is not cross-device.
- **Read-only live sources:** Grants.gov is queried only after the user enters a phrase and clicks Search; the profile is not sent. Bitcoin status requests use a user-entered transaction ID and require a deliberate lookup. No source refresh occurs in the background.
- **Optional public Nostr:** selected relays can be read or receive signed events only after the user chooses the relay, reviews the exact operation, authorizes their NIP-07 signer, and separately approves a public broadcast. Relay acknowledgement does not prove propagation or permanence. Other social destinations are copy-only handoffs.
- **No sample content:** production contains no bundled sample feed posts or mock opportunity records. Empty results and provider failures are shown directly.

The application is currently static-only with no configured account service, application database, remote messenger, media host, or upload endpoint. Directory filtering does not probe or authenticate nodes. TruthTalk remains strictly separate from VALKYRIE; any future exchange requires a versioned, operator-approved signed export/import contract.

The current static release is **TruthTalk 0.4.1**, reachable at [TruthTalk on Rootgate](https://rootgate.nexinus.net/truthtalk/). It does not add an application database, Rootgate login, shared feed, or remote media service. The separate Rootgate web application's TruthTalk tab has not yet been pointed to this URL. See the [Rootgate deployment assessment and status](docs/rootgate-droplet-deployment-assessment-2026-10-28.md).

## Media URL help

The media composer does not create an HTTPS URL or upload a file. First choose and control a host, upload the final file there, and copy its direct public HTTPS **file** link—not a share page or sign-in link. Hash the final bytes locally, then optionally use the consent-gated remote check; the host must allow CORS and may see the user's IP. See the full [4Reels media URL guide](docs/media-url-guide.md).

## Cloud-optional direction and click audit

Browser-local operation, federated relays, and direct peer sessions are different modes. Direct WebRTC still needs signaling/ICE and online peers; user-operated VPS infrastructure is self-managed but remains cloud-hosted. No new machine or database was created; the existing Rootgate Droplet now serves the static frontend at `/truthtalk/`. See the [cloud-optional / peer-to-peer architecture note](docs/cloud-optional-peer-to-peer-architecture.md), [module/control click audit](docs/click-audit-2026-10-27.md), and [Rootgate deployment assessment](docs/rootgate-droplet-deployment-assessment-2026-10-28.md).

## Sovereign Mesh and Azure handoff

The [Sovereign Mesh role map](docs/sovereign-mesh-role-map.md) records the owner-directed boundaries: Rootgate (identity/front door), Archangel (mesh control plane and node-signing authority, with Tesseract-A Core as its verification capability), Tesseract Mirror (separate from Tesseract Terminus), TruthTalk (separate application/data), and Valkyrie (adjudication). The role map distinguishes these target roles from integrations that are not live. The [Azure production provisioning runbook](docs/azure-production-provisioning-runbook-2026-10-27.md) treats the full-stack API/database/media data plane as the target; a static-only stage is not completion. No Azure resources have been provisioned. The Rootgate Droplet serves the interim static app; the Rootgate web application's tab has not yet been redirected.

## Development checks

Run from the project root:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

The site is a single-page app at `/`; `public/manus-routes.json` declares that route with the title “TruthTalk — Evidence before action.” The production build is static `dist/` output. Automatic publication to Manus is off; the public Rootgate Droplet route is managed separately and documented above.
