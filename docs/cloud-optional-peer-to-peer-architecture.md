# Cloud-optional and peer-to-peer architecture for Truth-Talk

## Recommendation

Keep Truth-Talk **local-first and cloud-optional**, rather than promising a server-free network that browsers cannot reliably provide. The product can make useful records, hashes, reviews, and receipts on one device without a central application database. When people want cross-device or asynchronous sharing, they can opt into a user-operated or independently chosen relay. Direct peer sessions can be added later for two devices that are both online.

These are distinct operating modes; a self-hosted server is still a server, and federated relays are not the same thing as direct peer-to-peer transport.

## Three operating modes

| Mode | What it provides | What it does not provide |
| --- | --- | --- |
| **Browser-local / offline-capable** | A static application can run on a user's own device. Profile fields and receipts remain in that browser's storage; hashing and deterministic review can run locally. After the initial site load, a future service-worker/PWA layer could cache the app shell for offline opening. | Browser storage does not automatically sync to a second device. Clearing site data, changing browsers, or losing the device can lose local-only material unless the owner exports a backup. Browser-local mode is not a network or shared inbox. |
| **Federated, user-selected relays** | Signed Nostr events can be sent to one or more relays the user chooses. Relays can store-and-forward events for peers that are offline, and different operators can host different relays. Truth-Talk already exposes consent-gated relay reads and NIP-07 signing/publication paths. | A relay is infrastructure, not a direct peer. It can reject, filter, withhold, or delete events; a positive acknowledgement is not proof of broad propagation, permanence, identity, or truth. Relay use can reveal a user's IP address and event metadata to relay operators. |
| **Direct peer sessions** | WebRTC data channels can carry a live conversation or file transfer directly between currently online devices after an explicit pairing/connection flow. | Browsers do not accept arbitrary inbound TCP/UDP connections like a server. A peer still needs a way to discover the other peer and exchange connection details (signaling); ICE commonly uses STUN and may need TURN to work through NAT/firewalls. A TURN server relays traffic. If both devices go offline, there is no store-and-forward unless another reachable peer or relay stores the event. |

## A practical cloud-optional design

1. **Keep the current browser-local core.** Profile, readiness calculations, local hashes, and the receipt ledger do not need a central database. Keep them clearly labeled as local and give users an export/backup path with a warning that an export may contain sensitive information.
2. **Treat relays as optional transport, not the identity authority.** Users keep signing keys in their own NIP-07 wallet/extension. Events are portable signed data; the UI continues to show the exact relay destinations and require a separate action for reads, signing, or broadcasting.
3. **Offer direct WebRTC only as a live-session mode.** Pair peers by an explicit QR/code or authenticated invite; never scan the Sovereign Mesh directory or probe owner-listed hosts automatically. Explain signaling and IP exposure before connecting. If no externally reachable signaling exists, users must exchange pairing data out of band and both peers must stay online.
4. **Keep large media separate from event metadata.** An event can reference a public file and its digest. A file can be hosted by the creator, pinned by participating peers, or served by a user-operated media node. Content addressing identifies bytes, not their availability; a file disappears if nobody continues to serve or pin it. Do not make a centralized Truth-Talk upload bucket mandatory.
5. **Avoid a central database until a real requirement exists.** Searchable profiles, account recovery, or an operator-wide index would create a new custody and deletion problem. If a future service is chosen, store only what that service needs, use isolated Truth-Talk identities/data/credentials, document retention and deletion, and make sync opt-in.

## Infrastructure choices discussed by the owner

The locations the owner mentioned are candidate operator infrastructure, not approved integrations. No IP address is recorded in this note or in the application; no host was contacted, scanned, authenticated to, or changed.

- **A dedicated Truth-Talk node** offers the cleanest project boundary for a later relay, signaling service, or media host, but a VPS remains cloud infrastructure and has ongoing security, backup, maintenance, and cost obligations.
- **An existing general hub** could be evaluated later only if Truth-Talk receives a separate service/process, OS identity, credentials, firewall policy, storage, database role/schema (if genuinely needed), backups, and monitoring. Sharing a machine is not the same as sharing application data safely; none of this has been provisioned.
- **The KEIRA and VALKYRIE nodes/databases are not wired into Truth-Talk.** Do not add tables, credentials, APIs, adapters, routes, runtime state, or direct queries there. Any future exchange with another project requires a versioned, operator-approved signed export/import contract. VALKYRIE remains strictly separate.

## Decision gates before implementation

The owner would need to choose the target mode (local only, relays, direct live peers, or a hybrid), identify who operates the relay/signaling/media service, approve the exact data contract and key model, define abuse/moderation and retention/deletion rules, decide what remains available if the service is down, and set security and cost limits. Only then should a separate implementation plan identify ports, hostnames, firewall changes, database requirements, deployment credentials, and test peers.

**Current status:** documentation only. No droplet, database, relay, signaling server, DNS record, account, key, secret, peer, or backend capability was created or changed.
