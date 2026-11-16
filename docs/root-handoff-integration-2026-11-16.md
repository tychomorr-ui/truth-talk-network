# ROOT ↔ TruthTalk handoff integration record

**Date:** 2026-11-16  
**Contract:** `ROOT_TRUTHTALK_HANDOFF/v1`  
**Repository:** `truth-talk-network`  
**Boundary:** ROOT issues a short-lived signed identity assertion; TruthTalk verifies it locally.

## Verified source implementation

TruthTalk’s receiver is implemented in `src/lib/rootHandoff.ts`. It uses the browser Web Crypto API with Ed25519 verification. The receiver rejects envelopes with an untrusted public key, unsupported version, wrong issuer or audience, malformed subject/scope/JTI, invalid timestamps, expired timestamps, or an invalid signature.

The browser listener in `src/App.tsx` additionally requires the message origin to be `https://rootgate.manus.space`. The accepted session identity is held in React state and the JTI is tracked in an in-memory set to prevent duplicate acceptance in the current session.

The accepted scope is:

```text
member_code, display_name
```

The receiver does not accept a ROOT cookie, private key, database connection, or unrestricted command capability.

## Key alignment

The local ROOT handoff signer at `/home/ubuntu/root-handoff-key/private.pem` was inspected without printing its contents. Its derived Ed25519 public key matched TruthTalk’s pinned public key. This verifies local key compatibility only; it is not a production deployment proof.

The private key is not part of this repository and must never be committed.

## Origin alignment

| Function | Origin |
| --- | --- |
| ROOT issuer / opener | `https://rootgate.manus.space` |
| Standalone TruthTalk target | `https://rootgate.nexinus.net/truthtalk/` |
| TruthTalk message acceptance origin | `https://rootgate.manus.space` |

ROOT’s target origin is the origin of the standalone TruthTalk host, while the `postMessage` sender and receiver allow-list the ROOT issuer origin. These values must remain explicit and must not be inferred from arbitrary request data.

## Verification results

```text
pnpm check   PASS
pnpm test    PASS — 16 test files / 65 tests
pnpm build   PASS
```

The typecheck fix included the `ROOT_HANDOFF_ACCEPTED` receipt kind and concrete `ArrayBuffer` inputs for Web Crypto `importKey` and `verify`.

## Production gate

Production handoff issuance remains blocked until the ROOT deployment has the protected secret:

```text
ROOT_TRUTHTALK_HANDOFF_PRIVATE_KEY_PEM
```

The secret must be configured through the protected project secret mechanism. It must not be placed in this repository, a browser bundle, a URL, a README, or a client-side environment variable.

After configuration, the release gate is:

1. Issue a handoff from an authenticated ROOT member workspace.
2. Open the standalone TruthTalk target.
3. Verify the receiver accepts the envelope and displays the verified ROOT state.
4. Verify a duplicate JTI is ignored.
5. Verify a tampered signature, wrong origin, expired payload, and wrong public key are rejected.
6. Confirm no secret or full identity envelope appears in browser history, URL parameters, logs, or committed files.

Until those steps complete against the deployed origins, the integration status is **implemented and locally key-compatible; production activation pending**.
