# RESONATE EARTH — Public Front Door / Nebula Mesh

**Canonical URL:** https://resonate-earth.live<br>
**Audit scope/result:** `robots.txt` permits crawling and names a sitemap. The sitemap lists four HTML routes; all four were inspected. Twelve first-party CSS/JavaScript assets directly linked by those pages or explicitly referenced as public-route chunks by the linked bundle were inspected. Sitemap coverage is complete; no excess routes were left unreviewed. API/RPC and other data paths found in page links or code were not requested. [1] [2]

## Publicly visible pages

The landing page links to the Manifesto, Node Status, and Truthcoin pages. It displays “Nebula Mesh · Online,” a ticker labeled “probing / awaiting node,” a node panel with placeholder entries and zero samples, and a “Sovereign Proof Ledger” table. [3] The manifesto page displays the declaration text and return links. [4]

The Node Status page visibly reports `0/6` configured and `0/6` CORS-enabled, shows the doctrine as “partial,” and renders placeholder node cards, zero heartbeat samples, and `0.00` coherence. This describes what the fetched page presented, not the health or enrollment of any node. [5]

The Truthcoin page labels Mainnet and Testnet as “auth-gated”; the displayed chain, block, peer, and mempool values are placeholders. It exposes links labeled status verification and raw RPC, but those links were not opened. [6]

## Shipped frontend and integration references

The linked frontend is compiled/bundled and mostly minified or compact; the main JS bundle is only 13 lines with very long lines, and the inspected route chunks are mostly one line. No source repository link was exposed in the reviewed public pages or assets. The site’s original, unbundled source is therefore not available from the reviewed material. [7]–[18]

Static bundle inspection shows that the Truthcoin route defines a no-store fetch to `/api/truthcoin-status` and repeats it every 15 seconds; the page links also expose `/api/truthcoin-ticker`, `/api/truthcoin-status?net=mainnet|testnet`, and `/api/truthcoin-rpc` links with `getblockchaininfo` query parameters. The bundle references `/api/sovereign-config`; the mesh module fetches `/mesh-manifest.json` and maps manifest entries into client state. These are frontend references only. No API, RPC, manifest, or health endpoint was requested, and no response or server-side behavior was verified. [3] [6] [14] [16] [18]

The public Node Status page says the mesh is manifest-driven, has HMAC-signed heartbeats, and uses server-side CORS probing. These statements are page claims. The reviewed client code initializes node probe metadata as unverified with no `lastChecked` timestamp; it does not independently establish heartbeat signatures, CORS results, node reachability, or backend probing. [5] [13] [18]

## Provenance and verification

The visible ledger exposes these record columns: **File**, **SHA-256**, **Block**, **Date**, and **Verify**. It presents three entries and explorer links to the named Bitcoin block numbers. The page says that each entry is a SHA-256 hash committed to a Bitcoin block via OpenTimestamps (OTS). It also instructs visitors to upload a file or `.ots` for browser-local hashing and checking, or paste a 64-character SHA-256 digest and select “Check.” These are directly visible content and site claims, not independently verified ledger records or proof results. [3] [6]

No ledger-specific record schema, exact digest input/canonicalization procedure, OTS verification operation, signature operation, or persistent storage location/boundary was identifiable in the reviewed frontend bundles. The visible column names are the only exact record fields established. Accordingly, whether a record is signed, what data is signed, where proofs or verification state are stored, and what trust boundary applies are **unknown**. The “HMAC-signed heartbeats” wording concerns a separate site claim and does not establish provenance for ledger records. No file/hash was submitted and no Bitcoin or OTS proof was verified. [3] [5] [7]–[18]

## Claims and attribution limits

“Online,” “sovereign,” “computed truth,” Bitcoin anchoring, immutability, permissionlessness, signed heartbeats, and real/live mesh telemetry are site language or self-claims, not findings established by this read-only page/source review. The site metadata attributes the pages to “XinUS Sovereign Network”; that attribution was not independently verified. The designation “RESONATE EARTH — Public Front Door / Nebula Mesh” is owner-supplied in the audit request and is not an independently established role or ownership finding. [3]–[6]

No conclusion is made about backend behavior, current HTTP status from extracted page text, domain ownership, signed identity, mesh enrollment, peer health, RPC availability, or Bitcoin/OTS proof validity. All linked API/RPC routes and the bundle-referenced manifest were left unrequested under the audit restrictions. No unlinked path was probed, no page code was executed, and no form was submitted.

## References

[1]: https://resonate-earth.live/robots.txt "Robots policy"
[2]: https://resonate-earth.live/sitemap.xml "Public sitemap"
[3]: https://resonate-earth.live/ "Public landing page"
[4]: https://resonate-earth.live/manifesto "Manifesto page"
[5]: https://resonate-earth.live/nodes "Node Status page"
[6]: https://resonate-earth.live/truthcoin "Truthcoin page"
[7]: https://resonate-earth.live/assets/styles-0wrbVtnV.css "Linked stylesheet"
[8]: https://resonate-earth.live/~flock.js "Linked JavaScript asset"
[9]: https://resonate-earth.live/__l5e/events.b21a279f52bb8621.js "Linked JavaScript asset"
[10]: https://resonate-earth.live/assets/index-Bz1ysKXg.js "Linked application bundle"
[11]: https://resonate-earth.live/assets/manifesto-_o9bOrNp.js "Manifesto route bundle"
[12]: https://resonate-earth.live/assets/module-DmvnmWJE.js "Shared JavaScript module"
[13]: https://resonate-earth.live/assets/nodes-CGNZoPES.js "Node Status route bundle"
[14]: https://resonate-earth.live/assets/routes-D7clgY8u.js "Shared route bundle"
[15]: https://resonate-earth.live/assets/telemetry-DuM52Mwb.js "Telemetry JavaScript module"
[16]: https://resonate-earth.live/assets/truthcoin-CfIlqWWl.js "Truthcoin route bundle"
[17]: https://resonate-earth.live/assets/PageHeader-CAqI-jvB.js "Shared page-header bundle"
[18]: https://resonate-earth.live/assets/mesh-nodes-B0IW0ck9.js "Mesh-node frontend module"
