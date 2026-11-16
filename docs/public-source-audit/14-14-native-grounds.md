# Public-source audit: NATIVE GROUNDS

**Target:** [https://tribalcoff-y9afmafg.manus.space](https://tribalcoff-y9afmafg.manus.space)<br>
**Owner-supplied role:** “standalone wholesale-coffee application” (not independently verified).<br>
**Crawl status:** Stopped before inspecting the landing page. Ordinary GETs to the standard `robots.txt` and `sitemap.xml` URLs each returned HTTP 200 with `text/html` and application-fallback HTML, not readable robots directives or sitemap entries. Because the crawl policy was unavailable, no landing or other page routes were followed. The fallback body included generic Native Grounds title/description copy; this is only a response-content observation, not verification of the landing page or the described business. [1] [2]

## Coverage

- Public routes listed: **0**. No usable sitemap was obtained.
- Public routes inspected: **0**. Neither the canonical landing route nor any linked route was inspected.
- Standard discovery URLs requested: `https://tribalcoff-y9afmafg.manus.space/robots.txt` and `https://tribalcoff-y9afmafg.manus.space/sitemap.xml`.
- First-party HTML/CSS/JavaScript assets inspected: **0**. No linked assets were followed or analyzed.
- Public source repository: **Not determined**; site pages were not inspected, so no exposed repository link could be checked.
- Frontend source visibility: **Not determined**. No source repository or linked asset was inspected; no claim about minification is made.

## Findings

**Directly visible public behavior:** Only the two standard discovery URL responses described above were observed. No actual product workflow or landing-page behavior was verified.

**Behavior supported by shipped frontend code or linked repository:** None assessed. No frontend asset or repository was inspected.

**Page/self-claims:** The HTML fallback response contained a title describing “Premium Coffee for Hospitality” and a meta description calling Native Grounds Wholesale Coffee Supply LLC a B2B coffee portal for casinos, hotels, tribal enterprises, and hospitality buyers. These are page-provided claims surfaced at the discovery URLs, not independently verified facts. [1] [2]

**Owner-supplied role:** The target was described by the owner as a standalone wholesale-coffee application. This is supplied context, not a finding about the site’s operation.

**Provenance / records:** Unknown. No exposed code or repository was available to establish record fields, hash or signature operations, storage location, or a trust boundary. No inference is made about backend behavior, signed identity, domain ownership, mesh enrollment, or peer health.

**Integration contracts observed:** None.

**Important gaps:** Crawl policy and sitemap content were unavailable because the requested standard URLs returned HTML fallback responses. The audit therefore stopped before the canonical page, its public links, linked assets, or any source-repository link could be inspected. Product behavior, source visibility, provenance, and integration contracts remain unknown.

**Redactions:** No personal contact data or credential/token is reproduced. No secret-like value was identified in the reviewed response excerpts.

## References

[1]: https://tribalcoff-y9afmafg.manus.space/robots.txt "robots.txt URL response observed during audit"
[2]: https://tribalcoff-y9afmafg.manus.space/sitemap.xml "sitemap.xml URL response observed during audit"
