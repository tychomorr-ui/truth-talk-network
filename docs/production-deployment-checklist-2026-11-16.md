# TruthTalk production deployment checklist

**Application:** TruthTalk Network  
**Release baseline:** 0.4.1  
**Checklist date:** 2026-11-16  
**Deployment shape:** static Vite application served at `/truthtalk/`

This checklist distinguishes local release readiness from a completed production deployment. Mark an item complete only when its evidence is recorded.

## 1. Source and release identity

- [ ] Confirm the release commit and branch are identified.
- [ ] Confirm `package.json` name is `truth-talk-network` and the version is intentional.
- [ ] Confirm the release date and handoff contract version are recorded.
- [ ] Confirm no private keys, `.env` files, session cookies, cloud credentials, or generated `dist/` files are staged.
- [ ] Confirm the repository has a clean working tree.
- [ ] Confirm the intended deployment repository and target host are documented.

## 2. Reproducible build

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

Required evidence for this baseline:

```text
pnpm check   PASS
pnpm test    PASS — 16 files / 65 tests
pnpm build   PASS
```

- [ ] Archive the build commit, package-manager version, Node.js version, and build output digest.
- [ ] Confirm the server publishes the contents of `dist/` and does not expose the source tree or dependency directory.
- [ ] Confirm SPA fallback is configured for `/truthtalk/` and any approved deep links.
- [ ] Confirm HTTPS is enforced and the certificate covers the production hostname.

## 3. Static hosting and headers

- [ ] Serve the application only over HTTPS.
- [ ] Configure `Content-Security-Policy` appropriate to the final deployment. Do not add broad `unsafe-eval` or wildcard data sources without review.
- [ ] Configure `X-Content-Type-Options: nosniff`.
- [ ] Configure an appropriate `Referrer-Policy`, such as `no-referrer` or `strict-origin-when-cross-origin`.
- [ ] Configure clickjacking protection with `frame-ancestors` in CSP or an equivalent policy.
- [ ] Preserve the application’s browser-local data boundary; do not add analytics or tracking scripts.
- [ ] Confirm cache headers do not cache an incorrect release indefinitely. Record the cache invalidation method.
- [ ] Confirm the `/truthtalk/` base path, static assets, favicon, and route manifest resolve correctly.

## 4. ROOT handoff gate

- [ ] Configure `ROOT_TRUTHTALK_HANDOFF_PRIVATE_KEY_PEM` in ROOT’s protected server-side secret store.
- [ ] Never put that value in TruthTalk, a browser-exposed `VITE_` variable, source control, a URL, or a log.
- [ ] Confirm the ROOT signer’s public key matches TruthTalk’s pinned key in `src/lib/rootHandoff.ts`.
- [ ] Confirm the issuer origin is exactly `https://rootgate.manus.space`.
- [ ] Confirm the standalone target origin is exactly `https://rootgate.nexinus.net` and the path is `/truthtalk/`.
- [ ] Issue a test handoff from an authenticated ROOT account.
- [ ] Confirm TruthTalk accepts a valid envelope and displays the verified ROOT state.
- [ ] Confirm a duplicate JTI is ignored.
- [ ] Confirm a wrong-origin message is ignored.
- [ ] Confirm a wrong public key is rejected.
- [ ] Confirm a modified payload or signature is rejected.
- [ ] Confirm an expired or not-yet-valid envelope is rejected.
- [ ] Confirm no envelope or member code appears in the URL, browser history, server access log, or analytics event.

## 5. Browser-local privacy checks

- [ ] Confirm profile and receipt data remain in browser storage as documented.
- [ ] Confirm no background polling or telemetry is introduced.
- [ ] Confirm live lookups happen only after an explicit user action.
- [ ] Confirm Nostr signing requires the user’s own NIP-07 authorization and a separate publication approval.
- [ ] Confirm failed network requests do not silently retry or transmit the full profile.
- [ ] Confirm local ledger export warns that it is not a remote signature or immutable anchor.
- [ ] Confirm the clear-profile action and receipt behavior are understandable to the user.

## 6. Smoke test after deployment

Run read-only checks against the final HTTPS URL:

```sh
curl -fsSI https://rootgate.nexinus.net/truthtalk/
curl -fsSI https://rootgate.nexinus.net/truthtalk/manus-routes.json
```

Then in a clean browser profile:

- [ ] Load the application shell.
- [ ] Confirm JavaScript and CSS assets load with HTTP 200.
- [ ] Open each major module and confirm there are no console errors.
- [ ] Refresh a deep link and confirm the SPA fallback works.
- [ ] Confirm standalone mode appears before any ROOT handoff.
- [ ] Complete the handoff issue/consume test only after the protected ROOT secret is configured.
- [ ] Confirm no unexpected third-party requests are present.

## 7. Rollback and incident response

- [ ] Record the prior known-good release commit and deployment artifact.
- [ ] Record the hosting rollback command or dashboard path.
- [ ] If the handoff verifier is suspect, disable or remove the ROOT launch path rather than weakening verification.
- [ ] Revoke or rotate the ROOT signing key if private-key exposure is suspected; update TruthTalk’s pinned public key only through a reviewed contract release.
- [ ] Preserve logs needed for diagnosis without recording handoff envelopes, private keys, cookies, or member codes.
- [ ] Record incident date, affected release, observed behavior, containment, and verification of recovery.

## Current baseline disposition

As of 2026-11-16, the source build and test gates pass and local key compatibility has been verified. Production handoff activation remains pending protected ROOT secret configuration and a live end-to-end issue/consume smoke test.
