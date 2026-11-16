# TruthTalk environment configuration guide

**Application:** TruthTalk Network  
**Date:** 2026-11-16  
**Default deployment:** static Vite output under `/truthtalk/`

## Important boundary

The current TruthTalk release is a static browser application. It does not require a server-side application database, account service, or TruthTalk private signing key. Most application behavior is configured at build time or by the static host.

The ROOT handoff signing key belongs to ROOT only. It must not be copied into this repository or exposed to the browser.

## TruthTalk build-time variables

There are currently no required TruthTalk `VITE_*` secrets for the baseline static release. Do not invent environment variables for integrations that are not implemented.

If a future public, non-secret build setting is introduced, use the `VITE_` prefix only for values safe to expose in the browser, such as a public feature mode or approved public origin. Document each variable here and in the deployment system.

Never put any of the following in a `VITE_*` variable:

- private signing keys
- API tokens
- database passwords
- session secrets
- Nostr seed phrases
- cloud credentials
- member authentication secrets

## Hosting configuration

Configure these values in the hosting platform rather than committing a `.env` file:

| Setting | Required | Example | Notes |
| --- | --- | --- | --- |
| `NODE_VERSION` | Recommended | `22` | Use the tested runtime for build jobs. |
| `PNPM_VERSION` | Recommended | `11.25.0` | Use the lockfile’s package manager version. |
| `BUILD_COMMAND` | Required | `pnpm install --frozen-lockfile && pnpm build` | Build from a clean checkout. |
| `OUTPUT_DIRECTORY` | Required | `dist` | Publish only the generated static directory. |
| `PUBLIC_BASE_PATH` | Required | `/truthtalk/` | Keep the deployed path aligned with the host routing. |
| `PUBLIC_ORIGIN` | Required | `https://rootgate.nexinus.net` | Public target origin; not a secret. |

If the host does not use these exact variable names, configure the equivalent platform settings and record the mapping in the release notes.

## ROOT-only protected secret

Configure this variable only in ROOT’s protected server-side secret store:

```text
ROOT_TRUTHTALK_HANDOFF_PRIVATE_KEY_PEM=<Ed25519 private key PEM>
```

Rules:

1. The value must be entered only into the protected ROOT secret field.
2. It must never be committed to either repository.
3. It must never be prefixed with `VITE_`.
4. It must never be sent to TruthTalk or embedded in a browser bundle.
5. It must not be printed in CI logs or deployment output.
6. The corresponding public key must remain pinned in TruthTalk’s reviewed source contract.
7. Rotate the key through a coordinated ROOT and TruthTalk release if exposure is suspected.

ROOT should fail closed when this secret is absent. TruthTalk should remain capable of running standalone without it.

## Local development

For the current static release, no `.env` file is necessary:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev
```

If a local integration test requires a ROOT secret, provide it ephemerally in the ROOT process environment or use the protected project secret mechanism. Do not create or commit a local `.env` file containing private material.

## CI/CD secret handling

- Use the CI provider’s protected secret store.
- Restrict secret access to the ROOT server/deployment job that signs handoffs.
- Do not expose protected variables to pull-request builds from untrusted forks.
- Disable shell tracing (`set +x`) around any secret-consuming command.
- Mask secret values in logs.
- Prefer short-lived deployment credentials and scoped repository tokens.
- Run `git diff --cached --name-only` and a secret scan before publishing.
- Publish an immutable commit or artifact reference with every release.

## Handoff configuration values

These are contract values, not secrets:

```text
Contract: ROOT_TRUTHTALK_HANDOFF/v1
Issuer origin: https://rootgate.manus.space
TruthTalk target: https://rootgate.nexinus.net/truthtalk/
Audience: truth-talk
Scope: member_code, display_name
TTL: 120 seconds
Signature: Ed25519 over canonical JSON payload
```

The TruthTalk verifier pins the public key in `src/lib/rootHandoff.ts`. Changing it is a security-sensitive contract change and requires a reviewed release, not an environment override.

## Configuration validation

Before release, verify without printing secret values:

```sh
pnpm check
pnpm test
pnpm build

# Confirm no sensitive files are tracked
git ls-files | grep -E '(^|/)(\.env|.*\.pem|.*\.key)$' && exit 1 || true
```

After ROOT secret configuration, perform the live issue/consume checklist in [the production deployment checklist](production-deployment-checklist-2026-11-16.md). A configured secret is not proof of a successful deployment until the signed handoff is accepted and tamper cases are rejected.
