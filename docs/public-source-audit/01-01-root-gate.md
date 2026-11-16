# ROOT-GATE — Identity Anchor / Front Door: public-source audit

**Canonical URL:** https://rootgate.manus.space<br>
**Owner-supplied role:** “ROOT-GATE — Identity Anchor / Front Door” (not independently verified).<br>
**Crawl status:** Partial; deeper inspection stopped because `robots.txt` did not provide a usable crawl policy.

## Scope and observed responses

The only route requested was the canonical root, `https://rootgate.manus.space/`, and the standard policy URL, `https://rootgate.manus.space/robots.txt`. The `robots.txt` response was HTML with the page title “ROOT — Sovereign Gateway,” not machine-readable robots directives. Because the site's crawl policy was unavailable, no further route, sitemap, linked page, asset, or repository was requested. The root HTML response was only partly examined as a shell; no page code was executed and no rendered interface was inspected. [1] [2]

The root shell exposed links to a JavaScript bundle and stylesheet. These URLs were observed in HTML but **were not fetched or inspected**: `https://rootgate.manus.space/assets/index-C7Un7sdl.js` and `https://rootgate.manus.space/assets/index-CKl5pg0b.css`. Thus, first-party assets inspected: **0**. No publicly linked source repository was identified in the limited shell inspection. The page source uses a compiled/minified runtime excerpt, but the application bundle itself was not inspected, so no conclusion about its minification or behavior is made.

## Findings by evidence type

- **Directly visible public response:** The requested root response exposed an HTML shell whose document title is “ROOT — Sovereign Gateway” and referenced the two assets listed above. This is an observation of returned HTML only, not evidence of a rendered or interactive page. [2]
- **Behavior supported by frontend bundle or linked repository:** None established; neither was inspected.
- **Page/self-claims:** The document title says “ROOT — Sovereign Gateway.” This is a page label, not independent evidence of gateway capabilities. [2]
- **Owner-supplied role:** “ROOT-GATE — Identity Anchor / Front Door,” provided in the audit request; not independently verified.

## Provenance and integration limits

No observable provenance-record fields, record construction, hash or signature operation, storage location, or trust boundary could be established from the limited HTML shell. Those details are **unknown**. No integration contract was observed. Nothing in this inspection verifies signed identity, domain ownership, mesh enrollment, peer health, backend behavior, or live service status.

## Coverage

One public page route was listed and its response shell was partially inspected: `https://rootgate.manus.space/`. No sitemap was fetched, so the number of additional public routes, if any, is unknown; there is no enumerated unreviewed sitemap remainder. The robots endpoint was requested at `https://rootgate.manus.space/robots.txt` but did not expose crawl directives. Inspection stopped at that policy limitation. No credential or personal contact value was identified in the limited material reviewed.

## References

[1]: https://rootgate.manus.space/robots.txt "Requested robots policy URL; response was HTML rather than crawl directives"
[2]: https://rootgate.manus.space/ "Canonical root page; partially inspected HTML shell"
