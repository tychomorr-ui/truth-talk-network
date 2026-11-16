# Feed cryptography and serialization choices

**Checked:** 2026-10-26. This note records source-level API and standard facts used to extend the browser-local Truth-Talk client. It does not imply a user identity, trust anchor, node connection, or remote verification.

RFC 8785 defines the JSON Canonicalization Scheme (JCS) for cryptographic operations. It relies on ECMAScript-compatible JSON primitive serialization, constrains data to I-JSON, sorts object properties deterministically, and preserves array order. The RFC says input objects must not have duplicate property names, strings must be valid Unicode (lone surrogates are rejected), and number values must be representable as IEEE-754 binary64 values. Non-finite numbers are not valid JCS input. Source: [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785).

The published `json-canonicalize` package identifies version 3.0.1 and documents compatibility with RFC 8785 for JSON-representable values. Its ordinary helper has additional JavaScript-value behavior for `undefined` and circular references. The application should use `canonicalizeEx(value, { strictUndefined: true })`, reject circular values, and compare parsed incoming payloads with their canonical form so non-canonical input (including duplicate-key JSON) fails closed. Source: [json-canonicalize 3.0.1 on npm](https://www.npmjs.com/package/json-canonicalize/v/3.0.1).

The published `@noble/curves` package identifies version 2.4.0. Its documentation shows the `schnorr` export from `@noble/curves/secp256k1.js` and identifies secp256k1 Schnorr as BIP-340. This is the selected browser-compatible primitive for verifying Nostr event signatures; key possession does not identify a real-world person. Source: [@noble/curves 2.4.0 on npm](https://www.npmjs.com/package/@noble/curves/v/2.4.0) and [the project repository](https://github.com/paulmillr/noble-curves).

Important protocol boundary: JCS is for Truth-Talk's structured JSON payload stored as Nostr `event.content`. NIP-01 event IDs still hash the NIP-01 serialization of `[0, pubkey, created_at, kind, tags, content]`; do not substitute JCS for that array serialization. Source: [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md).

## References

- RFC Editor, RFC 8785: https://www.rfc-editor.org/rfc/rfc8785
- npm, `json-canonicalize` v3.0.1: https://www.npmjs.com/package/json-canonicalize/v/3.0.1
- npm, `@noble/curves` v2.4.0: https://www.npmjs.com/package/@noble/curves/v/2.4.0
- Noble source repository: https://github.com/paulmillr/noble-curves
- Bitcoin BIP-340: https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
- Nostr NIP-01: https://github.com/nostr-protocol/nips/blob/master/01.md

The option `{ prehash: false }` documented for Noble's generic ECDSA interface is not accepted by the separate BIP-340 `schnorr.verify` function. Noble 2.4.0 declares `schnorr.verify(signature, message, publicKey)` and its Schnorr implementation uses the supplied message bytes in BIP-340 tagged hashes; it does not first hash the message as the ECDSA wrapper does. Therefore pass the 32-byte NIP-01 event ID directly as `message`, with no extra SHA-256 and no fourth argument. A test signing helper may supply a fixed 32-byte auxiliary-randomness vector as the third argument to `schnorr.sign` for reproducibility. Sources: the pinned [Noble secp256k1 implementation](https://github.com/paulmillr/noble-curves/blob/main/src/secp256k1.ts), its [2.4.0 declaration](https://www.npmjs.com/package/@noble/curves/v/2.4.0), [BIP-340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki), and [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md).

For the local messenger CID, `@ipld/dag-json` exposes its `encode`, `name`, and `code` exports, and `multiformats` documents `CID.create(1, codec.code, await sha256.digest(bytes))`. Pin `@ipld/dag-json` 11.0.1 and `multiformats` 14.0.5 for the build. These CIDs identify the canonical DAG-JSON envelope bytes; they are separate from a Nostr event ID and do not create a remote anchor. Sources: [IPLD DAG-JSON](https://github.com/ipld/js-dag-json) and [multiformats](https://github.com/multiformats/js-multiformats).
