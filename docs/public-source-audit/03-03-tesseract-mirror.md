# Public-source audit: Tesseract recovery mirror

**Owner-supplied role:** “Tesseract recovery mirror” (supplied in the audit request; not independently established). **Canonical URL:** https://tesseract.manus.space

## Crawl coverage and source visibility

The public `robots.txt` allows `/` generally but disallows `/api/`, `/access`, `/owner/`, `/omni`, `/memory`, `/attachments`, `/sharing`, `/timeline`, `/history`, `/recovery`, `/sitrep`, `/codex`, and `/mesh`. The landing page exposes 19 unique routes. I inspected four public routes: `/`, `/start`, `/privacy`, and `/invite`. I did not inspect the other 15 linked routes: `/recovery`, `/omni`, `/codex`, `/sitrep`, `/files`, `/timeline`, `/share`, `/records`, `/research`, `/memory`, `/history`, `/mesh`, `/mesh/activate`, `/mesh/status`, and `/omnisam`. Robots disallows several of these; the remainder are presented as private workspace or mesh/system areas, and I did not inspect their content. Coverage is therefore **partial**. The robots file points to `https://nexinus.net/sitemap.xml`; I did not fetch that cross-domain sitemap because this audit is limited to the supplied canonical site. [1] [2]

The four inspected routes were read-only GETs; no form was submitted and no control was activated. I inspected 10 first-party assets linked directly by the page shell or explicitly referenced as code-split modules by the linked app bundle. I did not request the robots-disallowed `/api/trpc` endpoint. The JavaScript is production-bundled and compact/minified rather than original source. No public repository for this site is explicitly linked. GitHub references present in a vendor library point to upstream library issue discussions, not to the site’s source repository. [6] [7] [8] [9] [10] [11] [12] [13] [14] [15]

## Directly visible public-page behavior and claims

The landing page visibly presents a “Standalone Mirror” panel, a “Run local turn” control, role/mode/radius labels, and a local attachment control described as “Private image or document · 10 MB max · not automatically analyzed.” It also says “No external AI, model inference, or ecosystem state is used in this panel” and displays “Ready. No external AI or remote state is active.” These are page statements; the no-network distinction for the local turn is additionally supported by the inspected Mirror component below. No file was selected and no turn was run. [2]

The `/start` page presents a four-week prompt library and optional beta-feedback form. It says nothing is shared automatically and says a beta profile is not created from browsing, reflections, or conversations. `/invite` presents an optional invitation form and says submission does not guarantee an invitation. Those are self-claims; neither form was submitted. [3] [5]

The `/privacy` page states that records deliberately created by users are stored, that passwords are stored as one-way hashes, that private file bytes are in an owner-controlled Amazon S3 bucket, and that Omni conversation messages use a configured Amazon Bedrock model route. It also describes controls for memory, sharing, retention, and exports. These are public-page claims, not independently verified storage, authentication, cloud, or model behavior; the Omni route is disallowed by robots and was not inspected. [4]

## Frontend-supported Mirror and provenance behavior

The inspected Mirror component bundle defines a standalone calculation that takes the current text and selected state, constructs a response and a `receipt`, and returns `provenance: "LOCAL"`. The page’s “Run local turn” handler invokes this local calculation after a short timer and stores its result in component state. The calculation itself does not call `fetch`, browser storage, or a cryptographic API. This supports a local-only frontend behavior for that panel action; it does not establish what other controls or the server do. [7]

The receipt fields constructed by that component are: `turnId`, `phase`, `role`, `mode`, `radius`, `inputHash`, `stateHash`, `ruleSetVersion`, `sourceSurfaces`, `authorityState`, `modelInference`, `externalAi`, `claims`, `unknowns`, `resultState`, and `nextStep`. The visible code sets `radius` to `LOCAL`, `sourceSurfaces` to an empty array, and `authorityState` to `standalone`; `modelInference` and `externalAi` are false. `phase` defaults to `DAY`, and `resultState` is `available` or `standby`. The role/mode transition receipts separately contain `transition`, `previousRole`, `role`, `previousMode`, `mode`, and `ruleSetVersion`. [7]

The bundle’s `C` function canonicalizes objects by recursively sorting property keys (while retaining array order), serializes values, then applies 32-bit FNV-1a: initial value `2166136261`, XOR each character code, multiply by `16777619` with unsigned 32-bit truncation, and return eight padded hexadecimal characters. `inputHash` is this value for the serialized input; `stateHash` is the value for the canonical state. `turnId` is based on the same hash of state, text, role, and mode, then sliced to 24 characters; because the hash is eight hex characters, the resulting ID is at most eight characters. This is a non-cryptographic checksum, not a cryptographic signature or HMAC. The standalone receipt object exposes no signature, signing key, or cryptographic verification operation. [7]

The receipt is held in the Mirror component’s in-memory UI state in the inspected code. The component does not expose a durable storage destination for this receipt, so persistence location and retention boundary are **unknown**. The app’s shared entry bundle configures a tRPC client at `/api/trpc` and sets `credentials: "include"`; robots disallows that endpoint, and no request was made. The Mirror component also wires separate activation/save controls to mutations. That is frontend wiring only: request results, server-side processing, storage, and any resulting provenance are unknown. [6] [7]

## Integration contracts, gaps, and unverified claims

The only concrete app-wide transport contract established in inspected code is the configured tRPC URL `/api/trpc` with credentials included. No API call was made. The code does not expose the backend contract for the invitation or feedback submissions in the reviewed evidence, nor did I test them. Public-page statements about S3, Bedrock, password hashing, deletion/export, or sharing are not corroborated by the inspected frontend. [3] [4] [5] [6]

The inspected material does not establish any backend record schema beyond the local Mirror receipt fields above; does not show that those fields are stored or signed; and does not expose a provenance storage location, signing boundary, key custody, or verification procedure. The local FNV-1a values are not proof of authenticity or tamper resistance. The audit does not establish signed identity, domain ownership, mesh enrollment, peer health, or behavior behind robots-disallowed routes. The listed cross-domain sitemap and all uninspected routes remain outside reviewed coverage. [1] [7]

## References

[1]: https://tesseract.manus.space/robots.txt "Tesseract robots.txt"
[2]: https://tesseract.manus.space/ "Tesseract public landing page"
[3]: https://tesseract.manus.space/start "Tesseract beta library and start page"
[4]: https://tesseract.manus.space/privacy "Tesseract privacy and boundaries page"
[5]: https://tesseract.manus.space/invite "Tesseract beta invitation page"
[6]: https://tesseract.manus.space/assets/index-CahJQHZH.js "Tesseract app entry bundle"
[7]: https://tesseract.manus.space/assets/Mirror-Dsq_ivyy.js "Tesseract Mirror route bundle"
[8]: https://tesseract.manus.space/assets/data-vendor-DHuLuFGC.js "Tesseract data vendor bundle"
[9]: https://tesseract.manus.space/assets/icon-vendor-CEIBAuGH.js "Tesseract icon vendor bundle"
[10]: https://tesseract.manus.space/assets/index-DyZM5MG6.css "Tesseract stylesheet"
[11]: https://tesseract.manus.space/assets/radix-vendor-BnUxSWjS.js "Tesseract Radix vendor bundle"
[12]: https://tesseract.manus.space/assets/react-vendor-DnejmH2b.js "Tesseract React vendor bundle"
[13]: https://tesseract.manus.space/assets/LaunchPad-SHDsOj6U.js "Tesseract public start route bundle"
[14]: https://tesseract.manus.space/assets/PublicPrivacy-CAXasa3W.js "Tesseract public privacy route bundle"
[15]: https://tesseract.manus.space/assets/BetaInvite-CDSsVddD.js "Tesseract public invite route bundle"
