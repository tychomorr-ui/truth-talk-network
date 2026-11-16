# Nostr event identity and signer semantics

Nostr event identity is **key-level authorship**, not verified human identity. A valid event ID and signature establish that the signed event fields match a particular public key and that the signature verifies under that key. They do not establish who controls the key in the real world, whether a human personally approved the post, whether media is authentic or truthful, or whether a relay will retain or remove it. NIP-01 defines the event mechanics; NIP-07 defines a browser-facing signing interface, not an identity-proofing or consent standard. [1] [2] [3]

## Event ID and signature checks

NIP-01 defines the signed event payload as the UTF-8 JSON serialization of the array `[0, pubkey, created_at, kind, tags, content]`. The `id` is the lowercase-hex SHA-256 digest of that serialization. The serialization uses compact JSON without unnecessary whitespace; field ordering and string escaping must follow the specification. The `id` and `sig` themselves are not elements of that hashed array. The event `sig` is a 64-byte Schnorr signature over the event ID digest, using secp256k1 and the event's `pubkey`. [1]

A verifier should independently validate the schema and serialization, recompute the ID from the event fields, require exact equality with the supplied `id`, and then verify the signature against the supplied `pubkey` and recomputed ID. A signature check without ID recomputation is insufficient: it could authenticate a digest unrelated to the event fields presented to the user. Conversely, an ID match alone is only a content digest and is not an authorship proof. The protocol uses BIP-340 Schnorr signatures; a successful verification means the signature is valid for the specified public key and message under that scheme, not that the public key belongs to a named or known person. [1] [3]

`created_at` is an event field in the signed serialization, so a valid signature commits the key to that timestamp value. It is not an independent trusted timestamp: the event's author controls the field. A relay's acceptance response means that relay accepted the submitted event; it is not proof of global publication, universal availability, or permanence. NIP-01 permits relays to reject events and gives examples of restrictions, rate limits, and database errors. [1]

## NIP-07 signer boundary and identity

NIP-07 optionally exposes `window.nostr.getPublicKey()` and `window.nostr.signEvent(event)`. The signing method accepts an event-shaped object (`created_at`, `kind`, `tags`, `content`) and returns an event with `id`, `pubkey`, and `sig` added. NIP-07 does not specify identity verification, a human identity binding, a required confirmation dialog, the detail a signer must show before signing, or consent/audit guarantees. Those should not be inferred from the interface. A site calling a signing API is not thereby entitled to claim that the named human reviewed or authored the content. [2]

A key can be used by its owner, a delegated signer, a shared device, automation, or anyone who has obtained the secret key. The cryptographic result is the same. Thus, describe the author as “signed by Nostr public key …” or “key-authenticated account,” not “verified person,” “real creator,” or “identity verified,” unless a separate identity-proofing process supports that stronger claim. NIST SP 800-63A-4 treats identity proofing as a separate enrollment process in which an applicant supplies evidence to a credential service provider, which may assert an identity at a defined assurance level. [3] [6]

NIP-05 is also not human verification. It maps a Nostr key to a DNS-based internet identifier using a domain's `/.well-known/nostr.json` response. The NIP explicitly says this is for identification, not verification; at most, it can attest an association with a domain or organization where that relationship is meaningful. It does not prove the key holder's legal identity, uniqueness, or that the person depicted in a profile/media item is the key holder. [5]

## Media hashes, signatures, and C2PA

A SHA-256 digest of a file is a compact fingerprint of the exact bytes hashed. Comparing a later file's digest with a trusted expected digest can detect a byte mismatch, subject to the hash algorithm's security assumptions. The digest alone does not identify a creator, prove when or where a file was made, establish that it depicts reality, or promise the file will remain available. NIP-94's optional file-metadata event uses an `x` tag for a file's SHA-256 digest and an `ox` tag for the original file before upload-server transformations. This illustrates why a receipt must define which exact bytes are hashed (original, uploaded, transcoded, thumbnail, or other rendition). [4] [9]

If a Nostr event containing a file hash is itself correctly ID- and signature-verified, the signature binds that key to the assertion that the event contains that digest. It still does not prove that the key holder created or captured the file, that the media is unaltered before the hash was computed, that its claims are true, or that the remote file URL will persist. Store/display the algorithm, byte scope, and digest; distinguish “hash matches this file” from “authentic/original media.” NIP-94 is marked draft/optional and says support is not expected of social clients focused on kind-1 notes, so it should not be assumed universally implemented. [1] [4]

C2PA Content Credentials are a separate, opt-in provenance mechanism: a cryptographically bound manifest associates assertions about an asset's origin, edits, and other history with that asset. C2PA validation can establish that covered provenance information is well-formed, untampered, associated with an asset, and signed by a credential whose trust status can be evaluated. C2PA explicitly does not judge whether the assertions are true or whether the media is accurate or factual. Its core specification does not directly address human or organizational identity; extensions can add identity-related assertions. Credentials can be removed from media, and durable credentials may use soft bindings to help rediscover them. A valid C2PA credential is therefore provenance evidence, not a truth guarantee or a substitute for human identity proofing. [7]

## Deletion, moderation, and product constraints

NIP-09 defines kind-5 deletion-request events. Relays **SHOULD** delete or stop publishing referenced events when the request has the same `pubkey`; clients **SHOULD** hide or indicate the deletion status. The NIP expressly warns that deletion cannot be guaranteed across all relays and clients. A deletion request is not a global erasure command and cannot retract copies, screenshots, downloads, or re-posts. [8]

Nostr's relay model is not a built-in universal moderation or compliance authority. Relays may accept, reject, limit, or stop serving events under their own policies; clients decide what to show. NIP-01 does not provide a global deletion, takedown, identity, or policy-enforcement service. Since a static browser client still communicates with external relays and file hosts, “decentralized/static” should not be represented as “no servers,” and publication or media hosting must not be described as product-controlled or permanent. [1] [4] [8]

For Truth-Talk and 4Reels, implementation constraints are:

- Implement one shared, reviewed NIP-01 verifier for every event used in feeds, receipts, and moderation UI. Recompute the canonical event ID and verify the signature before treating event fields as key-authored. Reject or visibly flag malformed, mismatched, or unverifiable events.
- Show key-level attribution as such. Do not use Nostr signatures, profile fields, NIP-05, a hash receipt, or C2PA presence alone to badge someone as a verified human or to claim anti-catfishing has been solved. Any identity badge must identify its separate evidence and assurance basis.
- Before signing public posts, media references, or deletion requests, show the exact user-visible content and relevant media/hash fields and provide a deliberate user confirmation. This is a product safeguard, not a NIP-07 guarantee. Do not silently sign arbitrary page-originated payloads.
- For each media receipt, define exactly which bytes are hashed and label SHA-256 as integrity matching only. Verify the downloaded bytes against the published digest; never equate a matching digest with authorship, truth, or provenance.
- Treat media URLs, relay results, profile metadata, C2PA assertions, and event content as untrusted input. Apply safe rendering, link handling, content moderation, abuse reporting, and source labeling independently of cryptographic verification.
- Provide truthful deletion/moderation language: a request may cause cooperating relays/clients to hide or stop serving an event, but copies and other relays may persist. A static client alone cannot ensure platform-wide removal or policy compliance.
- No application server or database is implied or approved by this research. Do not add one. The Nostr design nevertheless relies on relays for event distribution and on file hosts or other delivery systems for media; identify the chosen external dependencies before promising availability, moderation coverage, or retention.

## References

[1]: https://raw.githubusercontent.com/nostr-protocol/nips/master/01.md "NIP-01 Basic protocol flow description"
[2]: https://raw.githubusercontent.com/nostr-protocol/nips/master/07.md "NIP-07 window.nostr capability for web browsers"
[3]: https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki "BIP-340 Schnorr signatures for secp256k1"
[4]: https://raw.githubusercontent.com/nostr-protocol/nips/master/94.md "NIP-94 File Metadata"
[5]: https://raw.githubusercontent.com/nostr-protocol/nips/master/05.md "NIP-05 Mapping Nostr keys to DNS-based internet identifiers"
[6]: https://csrc.nist.gov/pubs/sp/800/63/a/4/final "NIST SP 800-63A-4 Digital Identity Guidelines: Identity Proofing and Enrollment"
[7]: https://spec.c2pa.org/specifications/specifications/2.4/explainer/Explainer.html "C2PA and Content Credentials Explainer version 2.4"
[8]: https://raw.githubusercontent.com/nostr-protocol/nips/master/09.md "NIP-09 Event Deletion Request"
[9]: https://csrc.nist.gov/pubs/fips/180-4/upd1/final "NIST FIPS 180-4 Secure Hash Standard"
