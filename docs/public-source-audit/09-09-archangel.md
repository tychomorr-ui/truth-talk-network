# ARCHANGEL — Control Plane / Mesh Governance: public-source audit

**Canonical URL:** https://archangelcp-sbwmjhce.manus.space<br>
**Owner-supplied role:** “ARCHANGEL — Control Plane / Mesh Governance” (not independently verified)<br>
**Audit outcome:** Crawl stopped before inspecting site routes because the requested `/robots.txt` response contained no crawl directives. No inference is made about the live HTTP status or origin behavior from the extracted text.

## Inspected evidence

Only this exact URL was requested: [https://archangelcp-sbwmjhce.manus.space/robots.txt](https://archangelcp-sbwmjhce.manus.space/robots.txt). The extraction returned the text `ARCHANGEL · NEXINUS Control Plane`, not a recognizable robots policy. Because crawl permission could not be established, I did not request the landing page, sitemap, other routes, assets, or any repository. This audit therefore covers **0 public HTML routes and 0 first-party assets**. No repository link was inspected or established.

## Findings

- **Directly visible public behavior:** The robots.txt URL returned the extracted branded text noted above. This describes the extraction result only; it does not establish the live HTTP status, whether a robots policy exists elsewhere, or what any site page does.
- **Frontend-supported behavior:** None assessed. No frontend HTML, CSS, JavaScript, or linked public repository was inspected. Source visibility is unknown.
- **Site claims:** The extracted robots response labels the product “ARCHANGEL · NEXINUS Control Plane.” This is page text only and is not independent verification of product capabilities.
- **Provenance:** Unknown. No code was inspected that exposes record fields, hashing or signature operations, storage locations, or trust boundaries.
- **Integrations and mesh behavior:** Unknown. No integration contract, enrollment, identity, peer-health, or backend behavior was assessed.
- **Redactions:** No personal contact data or secret-like values were encountered in the inspected response.

## References

[1]: https://archangelcp-sbwmjhce.manus.space/robots.txt "Requested robots.txt URL; extracted response contained branded text and no crawl directives"
