# Public-source audit: PROJECT RECLAIM — Field Activation Portal

**Canonical URL supplied:** https://reclaimporta-gsio8jvp.manus.space<br>
**Audit scope:** Public-source inspection only; crawl stopped at the robots-policy check.

## Crawl decision and coverage

A single ordinary public GET was made to the standard robots URL, `https://reclaimporta-gsio8jvp.manus.space/robots.txt`. It resolved to that same URL and returned HTTP `200` with `Content-Type: text/html; charset=UTF-8`, whose body began with a site HTML document rather than a robots policy. Because the crawl policy was therefore unavailable, inspection stopped at this point as instructed. No homepage, sitemap, other route, asset, source repository, or other URL was requested. No inference is made about the site's actual crawl permissions.

The response's HTML fallback exposed a page title, “Project Reclaim | Stewardship in Action,” and a meta description characterizing the portal as public and concerning fire mitigation, wood reclamation, workforce development, and land restoration. Those are page self-claims observable in the fallback HTML, not independently verified facts or evidence of product behavior. The landing page itself was not separately inspected.

## Findings

- **Directly observed response:** The standard robots URL returned HTML (not a readable robots-policy document) with the title and meta description noted above. This is an observation of the GET response, not a claim about site behavior or status on other routes.
- **Shipped frontend/repository evidence:** None assessed. No first-party assets or public source repository were fetched or inspected.
- **Provenance:** Unknown. No application record fields, hash/signature operation, storage location, or trust boundary were inspected or exposed in the material reviewed.
- **Integration contracts:** None observed.
- **Owner-supplied role:** The designation “owner-supplied” and the canonical URL are treated only as task-provided context; ownership or domain control was not independently verified.

## Coverage counts

- Public routes listed: 0. Sitemap was not requested because crawl policy was unavailable.
- Public HTML routes inspected: 0. The robots URL response was an HTML fallback, not counted as an inspected landing-page route.
- First-party assets inspected: 0.
- Public source repository: None observed; repository links were not inspected because no page was fetched.
- Frontend source visibility: Not assessed. Code is not characterized as minified because no frontend bundle was inspected.

## References

[1]: https://reclaimporta-gsio8jvp.manus.space/robots.txt "Standard robots URL response observed during the crawl-policy check"
[2]: https://reclaimporta-gsio8jvp.manus.space "Owner-supplied canonical URL; not fetched after crawl policy proved unavailable"
