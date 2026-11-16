# Public-source audit: XINUS PORTFOLIO / VENTURE DASHBOARD

**Site:** [https://nexsens-3uimbss6.manus.space](https://nexsens-3uimbss6.manus.space)<br>
**Scope result:** The standard robots policy allows crawling generally and disallows `/api/*`; its sitemap lists only the root URL. One same-origin HTML route was inspected, along with two first-party linked assets. The page exposes no source-repository link. No linked destination outside this canonical site was opened. [1] [2] [3]

## Public page and frontend evidence

The directly visible root page is a one-page portfolio with sections for field work, funding conversations, surfaces, cataloged applications, provenance, systems/research, and contact. Its navigation points to in-document fragment anchors, not separate same-origin HTML pages. It contains a portfolio search field and three category-filter buttons. The contact link is a `mailto:` CTA; its recipient is redacted here. [3]

The linked JavaScript at `/app.js` is readable and not minified. It filters the pre-rendered portfolio cards by category and case-insensitive text, toggles each card's hidden state, updates the visible-item count, and exposes an empty-results message. The code attaches browser event listeners and contains no fetch/XHR/API submission logic. The linked stylesheet is readable and not minified; it declares smooth scrolling. These are source-supported frontend behaviors, not an independently exercised interaction test. [4] [5]

The landing-page source also references external analytics/editor scripts and includes an inline custom-pageview queue call carrying the current host as a property. Since scripts were not executed and third-party code was not fetched, actual transmission, tracking, and retention behavior are unknown. A secret-like value in inline configuration was redacted and is not reproduced. [3]

## Claims and role descriptions

The page identifies itself as a founder-led company portfolio and describes a founder and California city. It claims three active engagements, including a field pilot, a community wellness engagement, and an operating partnership. It explicitly says these are company-reported and that contracts, paid/invoiced amounts, reporting periods, customer outcomes, and audited revenue are not supplied. These are page claims, not independently verified engagement or revenue facts. [3]

The page lists 11 primary and three supporting surfaces and says their URLs returned HTTP 200 on 4 October 2026. That is a dated owner/page claim, not a live status check in this audit. The listed roles—including gateway/identity anchor, provenance/anchoring, control plane/mesh governance, and unification—are company-designated descriptions, not verified identity, deployment, mesh enrollment, or peer-health findings. The product names, audiences, payer types, and functions are likewise labeled by the page as owner-supplied/cataloged rather than independently verified live applications. [3]

The page displays nine purported Bitcoin block references, labelled with block heights 954,161; 954,165; 954,178; 954,181; 955,889; 955,897; 955,967; 955,974; and 956,029. It says these are chronology/authorship anchors and explicitly cautions that a block height alone does not prove that a named file was included in that block. The accompanying descriptions and file labels are owner-supplied claims. The external resolution links were not requested. [3]

## Provenance and integration observations

The only observable provenance fields in the page are a human-readable artifact/title label, a block height, and a hyperlink to `https://blockstream.info/api/block-height/{height}`. The inspected frontend exposes no transaction identifier, inclusion proof, timestamp receipt, record schema beyond those displayed fields, hash calculation, signature operation, or signing key. The visible labels and heights are static page content. The storage location and trust boundary for any underlying evidence record are unknown; no backend or record store can be inferred from this source. [3] [4]

The exact Blockstream links are outbound references encoded by the page; no call to those endpoints was made, so neither their current response nor any integration contract beyond the URL pattern was verified. The source also does not establish backend integrations, configured connectors, product functionality, or commercial outcomes. [3]

## Coverage and limitations

The sitemap-listed same-origin route count was one and one was inspected. The same-origin linked assets inspected were `/styles.css` and `/app.js` (2 of the 200-asset cap). The page links to other public surface sites and to external block-resolution URLs, but those are outside this one-site review and were not followed. No source repository was linked. No login, form submission, page-code execution, API request, or private resource access occurred. [1] [2] [3] [4] [5]

## Exact inspected URLs

- `https://nexsens-3uimbss6.manus.space/robots.txt`
- `https://nexsens-3uimbss6.manus.space/sitemap.xml`
- `https://nexsens-3uimbss6.manus.space/`
- `https://nexsens-3uimbss6.manus.space/styles.css`
- `https://nexsens-3uimbss6.manus.space/app.js`

**Redactions:** The owner-provided contact recipient and a secret-like value in inline source configuration were omitted; neither value is reproduced.

## References

[1]: https://nexsens-3uimbss6.manus.space/robots.txt "Robots policy"
[2]: https://nexsens-3uimbss6.manus.space/sitemap.xml "Sitemap"
[3]: https://nexsens-3uimbss6.manus.space/ "XINUS PORTFOLIO / VENTURE DASHBOARD landing page"
[4]: https://nexsens-3uimbss6.manus.space/app.js "First-party portfolio JavaScript"
[5]: https://nexsens-3uimbss6.manus.space/styles.css "First-party portfolio stylesheet"
