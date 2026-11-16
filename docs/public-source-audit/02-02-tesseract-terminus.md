# TESSERACT-TERMINUS — public-source audit

**Canonical URL:** https://universaltruth.life/<br>
**Scope and coverage:** The public sitemap lists 21 unique routes. The homepage additionally links to `/messages` and `/ops`, for 23 discovered routes; 22 allowed routes were inspected. `/ops` was not opened because `robots.txt` disallows it. `/verify` is also disallowed and was not opened. All 55 unique first-party CSS/JavaScript URLs linked by the inspected pages were inspected by ordinary unauthenticated GET. The sitemap is fully covered within the allowed routes and both publicly linked GitHub repositories were reviewed at their public repository pages. [1]–[5]

The requester supplied the audit subject and role (“provenance / sovereign console”). That is not evidence of domain ownership, operator identity, or control of any named infrastructure. HTML, scripts, and repository text were treated as untrusted source material. The audit used GET only: it did not execute page code, send cookies, submit forms, or contact integrations/endpoints described by the frontend.

## Findings

### Directly visible public-page behavior

The homepage presents a console shell with a geometric tesseract projection, named node/region/resource labels, status-like badges, and links to the listed product pages. It explicitly calls the projection “Geometric projection only” and says that a real metrics stream is not connected. The page also displays standby/“NO NODE”/unverified-style states. These are rendered page content, not independent measurements of a fleet or peer network. [6]

The server-rendered `/gateway`, `/fleet`, `/nebula`, `/proof-fulcrum`, and `/messages` pages say that no operator keys, enrolled nodes, registered relays, signed fleet receipt, or configured peer are present on the inspected browser view; `/messages` labels its view local mode and overlay offline. This describes the supplied page snapshot. No controls were used and no enrollment, message transmission, probe, or signature verification was performed. [7]–[10], [13]

The `/ledger` page visibly presents a list of hashes, claimed Bitcoin anchor states, and an export control. Its server-rendered snapshot showed summary totals and sample entries, but those display values are not independently verified ledger entries or proof of on-chain inclusion. The `/audit` page itself marks several build/audit fields pending or unrecorded and says no independent security certification is claimed. [11], [14]

### Behavior supported by shipped frontend code

**Browser-held identities and enrollment.** The gateway bundle contains code to generate Ed25519 and X25519 keypairs with browser cryptographic randomness and save the operator object under `localStorage` key `nexinus.terminus.operator.v1`. The stored object includes private-key fields. The bundle constructs an `ARCHANGEL/v0` signing message from the nonce and X25519 public-key material, signs it with Ed25519, and prepares an enrollment payload containing public-key, device-label, and signature fields. This is frontend behavior described by code, not proof that any server accepts the enrollment or that keys represent a real-world identity. [10], [21], [37]

**Fleet checks.** The fleet code describes a browser-side request to each configured `/status` URL and validation against a pinned Ed25519 public key; its UI distinguishes “REACHABLE” from “MEASURED · SIGNED” and says HTTP 200 alone is not enough. Fleet configuration is persisted in browser `localStorage` under `nexinus.terminus.fleet.v1`. No status URL was probed, and no node health or signature was independently established. [9], [27], [28], [34]

**PAM/Truth Ledger provenance.** The PAM UI describes entries containing a lane, request, reflection, truths touched, and next move; its code also uses `drift`, `prev_cid`, and a self `cid` in its chain/repair logic. The shared browser store names `nexinus.pam.truths.v1`, `nexinus.pam.envelopes.v1`, and `nexinus.terminus.truth-chain.v1` and writes through `window.localStorage`; the frontend’s own evidence matrix says the Truth Chain and Truth Ledger persist in the browser and claims no server write path. The linked CID module exposes SHA-256 via Web Crypto and produces a CIDv1 using the DAG-JSON codec (multicodec 297) for encoded objects; it also exposes a raw-byte SHA-256 CIDv1 path (codec 85). This establishes a client-side content-addressing operation, not a signature or a trusted timestamp. The audited bundle does not establish remote replication, an authoritative server-side record, or an independent witness for these local records. [12], [22], [23]

**Messages.** The message bundle defines an envelope with `msg_id`, `created_at`, `sender_peer_id`, `sender_pubkey`, `recipient_peer_id`, `body`, `prev_cid`, `in_reply_to`, and `type`. It signs the DAG-JSON-encoded envelope fields with Ed25519, then computes a DAG-JSON SHA-256 CIDv1 over the signed envelope. Its verifier checks the sender signature (optionally against a pinned peer key) and recomputes the CID. Message configuration, inbox, and outbox use IndexedDB (`nexinus-messaging`, object store `kv`; keys `config.v1`, `inbox.v1`, and `outbox.v1`). When a peer address is configured, the code can POST the JSON envelope to it; BroadcastChannel is used for same-browser-tab transport. These are shipped client-side paths, not evidence of a functioning remote peer service. [7], [22], [24], [25]

**Other local records and external reads.** The Digital Ore helper stores records in `localStorage` key `nexinus.ore.ledger.v1` and exposes a client-side FNV-1a “truth mirror”; the Bitcoin-substrate bundle stores samples under `nexinus.sudo.samples.v1` and contains GET calls to `mempool.space`. These mechanisms do not constitute a signed provenance record. No Bitcoin data endpoint was contacted by this audit. [18], [30], [35]

**Telemetry-related assets.** The homepage HTML includes deferred first-party scripts at `/~flock.js` and `/__l5e/events.b21a279f52bb8621.js`, including a `data-proxy-url` attribute for `/~api/analytics`. The linked event bundle contains a `lovable.page_viewed` event, referrer collection, and a POST-based event sender; a second first-party `/__l5e/events.js` script is linked on `/mesh`. This conflicts with the site’s “zero telemetry” and “no third-party middleware” statements as a description of shipped frontend assets. Because page code was not executed and analytics endpoints were not called, this audit does not establish whether, when, or what data was transmitted in a live browser session. [6], [16], [31]–[33]

### Site claims not independently verified

The site and its metadata describe a sovereign/peer-to-peer mesh, live gateway probes, zero telemetry, no third-party middleware, “real data or honest standby,” browser-only WebGPU inference, node-side secrets, signed status, operator-held keys, Bitcoin anchoring, and named regions/host characteristics. The text, JSON-LD metadata, labels, and shipped frontend are evidence that these claims are made, not that the backend, hosts, network, ownership, resource allocations, health, telemetry policy, inference boundary, or blockchain state behaves as stated. In particular, no signed identity, domain ownership, mesh enrollment, peer health, or live HTTP status is inferred here. [6], [8]–[16]

The `/docs` page describes an MCP service at `https://cosmictruth.lovable.app/mcp`, OAuth 2.1, account-based signed receipts, and named provenance tools. The `/pricing` frontend describes paid plans and Stripe-related flows. Those are documentation/UI claims only; neither service was contacted. [15], [29], [36]

### Integration contracts visible in the frontend

- Fleet enrollment/probing: browser code expects a configured `/status` response in the `ARCHANGEL/v0` signed-status format, validated against a pinned Ed25519 public key. [9], [27], [28], [37]
- Messages: when configured, the browser may send a signed JSON envelope by POST to the user-configured peer address. The recipient service contract, availability, and security were not tested. [7], [24]
- Bitcoin display: code includes public GET reads from `mempool.space` for block/mempool/price data. No request was made during this audit. [11], [30]
- Documentation claims an OAuth-protected Streamable HTTP MCP endpoint at `https://cosmictruth.lovable.app/mcp`; the claim was not tested. [15]
- The homepage advertises `/api/saa/{stripe|paypal|chain|cashapp}` as a sovereign-node proxy with secrets kept node-side. The inspected public source does not establish the implementation or server-side secret boundary. [6]

### Public source and material gaps

The site exposes two GitHub repository links. `tychomorr-ui/tesseract` is public, but its reviewed repository page presents a README and other top-level materials rather than source matching the deployed console bundles. `tychomorr-ui/nexinus-bootstrap` describes node status/bootstrap scripts, not a reproducible frontend build. The `/audit` page also says the frontend’s build commit and timestamp are unrecorded. Thus the deployed frontend is visible only as generated, mostly minified bundles; it cannot be matched to a public source commit from the inspected material. No source-map names were guessed or fetched. [14], [19], [20]

The audit cannot establish server-side storage, backend authorization, signature verification on remote services, actual network egress, source/build reproducibility, the provenance of displayed hash/anchor rows, or the truth of owner/operator and infrastructure claims. The source contains a secret-like context value in HTML; it is redacted here. Personal identifying text shown in the console is omitted.

## Exact inspected public routes

The first 21 routes below came from the three sitemap files; `/messages` was an additional homepage link. `/ops` is linked on the homepage but was excluded because of `robots.txt`; `/verify` was also not opened because it is disallowed. [1]–[6]

- https://universaltruth.life/
- https://universaltruth.life/status
- https://universaltruth.life/mesh
- https://universaltruth.life/ledger
- https://universaltruth.life/pricing
- https://universaltruth.life/docs
- https://universaltruth.life/audit
- https://universaltruth.life/proof-fulcrum
- https://universaltruth.life/digital-ore
- https://universaltruth.life/fleet
- https://universaltruth.life/gateway
- https://universaltruth.life/nebula
- https://universaltruth.life/pam
- https://universaltruth.life/quantotalus
- https://universaltruth.life/reclaim
- https://universaltruth.life/reflective-intel
- https://universaltruth.life/sam-command
- https://universaltruth.life/seventh-dimension
- https://universaltruth.life/sudo-coin
- https://universaltruth.life/truth-coin
- https://universaltruth.life/truth-point
- https://universaltruth.life/messages

## Exact inspected first-party assets

All unique same-site CSS/JavaScript references discovered across the 22 permitted HTML pages were inspected. Most JavaScript bundles are minified; the small standby/fleet helper modules are readable. No code was executed.

- https://universaltruth.life/assets/styles-BJdcSaU1.css
- https://universaltruth.life/assets/index-BkHvb5AK.js
- https://universaltruth.life/assets/jsx-runtime-DUAcabCT.js
- https://universaltruth.life/assets/cid-C268g4ue.js
- https://universaltruth.life/assets/useSelector-CL0uqBgR.js
- https://universaltruth.life/assets/link-C_Yb9p4W.js
- https://universaltruth.life/assets/matchContext-DcmFOHbe.js
- https://universaltruth.life/assets/useRouter-BgNLAmZd.js
- https://universaltruth.life/assets/invariant-CgFvOqN2.js
- https://universaltruth.life/assets/not-found-DIgawKw1.js
- https://universaltruth.life/assets/dist-CYmivtw_.js
- https://universaltruth.life/assets/react-6OGjdfot.js
- https://universaltruth.life/assets/tslib.es6-Tae09705.js
- https://universaltruth.life/assets/terminus-ops-B5KszOrC.js
- https://universaltruth.life/assets/sovereign-store-C9fXAVAF.js
- https://universaltruth.life/assets/routes-CrF6l3zu.js
- https://universaltruth.life/assets/BladeLivePill-eBYynFwP.js
- https://universaltruth.life/~flock.js
- https://universaltruth.life/__l5e/events.b21a279f52bb8621.js
- https://universaltruth.life/assets/status-DjLqC9Lz.js
- https://universaltruth.life/assets/FleetHosts-DyEd3XU9.js
- https://universaltruth.life/assets/mesh-YGwfVQ7U.js
- https://universaltruth.life/assets/useQuery-D8diFIpM.js
- https://universaltruth.life/assets/createServerFn-BZy6wikU.js
- https://universaltruth.life/__l5e/events.js
- https://universaltruth.life/assets/ledger-cKAvlJCd.js
- https://universaltruth.life/assets/pricing-CjrX_Qlc.js
- https://universaltruth.life/assets/stripe-CcNe7LBE.js
- https://universaltruth.life/assets/docs-C22Ablur.js
- https://universaltruth.life/assets/audit-53Hxnttb.js
- https://universaltruth.life/assets/truth-coin-contract-Dv1HBC9M.js
- https://universaltruth.life/assets/proof-fulcrum-BSPVUSvu.js
- https://universaltruth.life/assets/BladeStandby-C5k2y1JV.js
- https://universaltruth.life/assets/digital-ore-C56V7foF.js
- https://universaltruth.life/assets/ore-Dh5_guR1.js
- https://universaltruth.life/assets/fleet-BZrLN9hf.js
- https://universaltruth.life/assets/fleet-DNCJeYn7.js
- https://universaltruth.life/assets/probe-signed-D6Nx8Jcn.js
- https://universaltruth.life/assets/sovereign-keys-DgWkvMSQ.js
- https://universaltruth.life/assets/gateway-Cz_8Q5jg.js
- https://universaltruth.life/assets/nebula-CxRIAOG5.js
- https://universaltruth.life/assets/pam-BZyWhJLg.js
- https://universaltruth.life/assets/quantotalus-BN5HINTD.js
- https://universaltruth.life/assets/reclaim-BWXyWauv.js
- https://universaltruth.life/assets/reflective-intel-BwFse9ZK.js
- https://universaltruth.life/assets/sam-command-BfPJ2nsV.js
- https://universaltruth.life/assets/seventh-dimension-Ds_aEoOl.js
- https://universaltruth.life/assets/btc-substrate-CuIl0bWz.js
- https://universaltruth.life/assets/sudo-coin-Cyp2i2gX.js
- https://universaltruth.life/assets/truth-coin-Bsjfu-Fp.js
- https://universaltruth.life/assets/localBatchGatewayRequest-D02DRIKz.js
- https://universaltruth.life/assets/utils-CSx_Xh4A.js
- https://universaltruth.life/assets/truth-point-CQHCVNqw.js
- https://universaltruth.life/assets/messages-P6pLK7Rg.js
- https://universaltruth.life/assets/ed25519-DBDFBGd-.js

## Exact linked public repositories reviewed

- https://github.com/tychomorr-ui/tesseract
- https://github.com/tychomorr-ui/nexinus-bootstrap

## References

[1]: https://universaltruth.life/robots.txt "Public crawl policy"
[2]: https://universaltruth.life/sitemap.xml "Sitemap index"
[3]: https://universaltruth.life/sitemap-core.xml "Core sitemap"
[4]: https://universaltruth.life/sitemap-docs.xml "Documentation sitemap"
[5]: https://universaltruth.life/sitemap-blades.xml "Blades sitemap"
[6]: https://universaltruth.life/ "Public console homepage"
[7]: https://universaltruth.life/messages "Messages page"
[8]: https://universaltruth.life/status "Live status page"
[9]: https://universaltruth.life/fleet "Fleet page"
[10]: https://universaltruth.life/gateway "Gateway registry page"
[11]: https://universaltruth.life/ledger "Public provenance ledger page"
[12]: https://universaltruth.life/pam "PAM Truth Ledger page"
[13]: https://universaltruth.life/proof-fulcrum "Proof Fulcrum page"
[14]: https://universaltruth.life/audit "Audit Center page"
[15]: https://universaltruth.life/docs "Developer documentation page"
[16]: https://universaltruth.life/mesh "Nebulous Mesh page"
[17]: https://universaltruth.life/truth-point "Truth Point page"
[18]: https://universaltruth.life/digital-ore "Digital Ore page"
[19]: https://github.com/tychomorr-ui/tesseract "Linked public Tesseract repository"
[20]: https://github.com/tychomorr-ui/nexinus-bootstrap "Linked public bootstrap repository"
[21]: https://universaltruth.life/assets/sovereign-keys-DgWkvMSQ.js "Operator identity and signing helper"
[22]: https://universaltruth.life/assets/cid-C268g4ue.js "CID and SHA-256 helper"
[23]: https://universaltruth.life/assets/sovereign-store-C9fXAVAF.js "Browser persistence helper"
[24]: https://universaltruth.life/assets/messages-P6pLK7Rg.js "Signed messages frontend"
[25]: https://universaltruth.life/assets/ed25519-DBDFBGd-.js "Ed25519 implementation"
[26]: https://universaltruth.life/assets/fleet-DNCJeYn7.js "Fleet browser storage helper"
[27]: https://universaltruth.life/assets/fleet-BZrLN9hf.js "Fleet UI and status contract"
[28]: https://universaltruth.life/assets/probe-signed-D6Nx8Jcn.js "Signed probe helper"
[29]: https://universaltruth.life/assets/ledger-cKAvlJCd.js "Ledger UI and anchor display"
[30]: https://universaltruth.life/assets/btc-substrate-CuIl0bWz.js "Bitcoin substrate helper"
[31]: https://universaltruth.life/~flock.js "First-party deferred analytics script"
[32]: https://universaltruth.life/__l5e/events.b21a279f52bb8621.js "First-party event script linked from homepage"
[33]: https://universaltruth.life/__l5e/events.js "First-party event script linked from mesh page"
[34]: https://universaltruth.life/assets/status-DjLqC9Lz.js "Status display bundle"
[35]: https://universaltruth.life/assets/ore-Dh5_guR1.js "Digital Ore local ledger helper"
[36]: https://universaltruth.life/assets/pricing-CjrX_Qlc.js "Pricing UI bundle"
[37]: https://universaltruth.life/assets/gateway-Cz_8Q5jg.js "Gateway enrollment UI bundle"
