# TruthTalk on the Rootgate Droplet: Read-Only Deployment Assessment

**Observed:** 2026-10-28, approximately 20:18–20:27 PDT (2026-10-29 03:18–03:27 UTC). **Scope:** Read-only inventory after the owner authenticated to the DigitalOcean console. No application, package, service, database, Nginx, firewall, DNS, or cloud-resource configuration was changed during that initial assessment.

## Droplet and current Rootgate service

The DigitalOcean account API and authenticated Web Console identified Droplet `nexinus-root-gate` (Droplet ID `613623230`) at `139.59.127.209`, in Singapore, with 2 vCPUs, 2 GiB RAM, and a 60 GB disk. The console reports Ubuntu 24.04.5 LTS. Read-only checks showed about 56 GB free on `/`, 1.6 GiB available memory, and no swap. Ubuntu reported 74 available updates, including 59 standard security updates; none were installed.

Nginx was the only active application-facing service found, listening on TCP 443; SSH listens on 22. Port 80 was not listening. Docker, PostgreSQL, Redis, Apache, Caddy, and a `truthtalk` systemd service were inactive or absent. There was no `/opt/truthtalk` application directory. The current web files were the default Nginx page and a small Rootgate identity directory under `/var/www/atmos-identity/root-gate` containing `atmos-identity.json`, `artifact.json`, and `health.json`.

The enabled Nginx site was `rootgate.nexinus.net`. It served only `/.well-known/atmos-identity.json`, `/.well-known/atmos-artifact.json`, and `/health`; its `/` route explicitly returned 404. This Rootgate Droplet was therefore an identity/health endpoint, not the Rootgate application UI. Its public identity routes were to remain unchanged unless separately approved.

A read-only TLS handshake for `rootgate.nexinus.net` showed a Let's Encrypt certificate valid from 2026-10-28 through 2027-01-26. Its SAN list covered Rootgate and several existing node hostnames, but not `truthtalk.nexinus.net`. The proposed names `truthtalk.nexinus.net` and `truth-talk.nexinus.net` did not resolve through the Sandbox resolver during this initial check. The Cloudflare connector was unauthenticated. DNS ownership/provider and any DigitalOcean Cloud Firewall rules were not established here.

## TruthTalk application state at initial assessment

The inspected project at `/home/ubuntu/truth-talk-network` was a React 19 / Vite 7 browser SPA. Its scripts were `dev`, `preview`, `build`, `check`, and `test`; there was no server/API process, database dependency, authentication service, media host, or upload endpoint. The production output was static `dist/`. The README stated that profile, readiness, filters, messenger, and receipt ledger were browser-local; read-only Grants.gov and user-directed Bitcoin lookups were external; Nostr publishing was opt-in and separately approved. Deploying these files alone would not create a shared feed, TruthTalk-owned database, Rootgate user-login handoff, or remote media service. `vite preview` is a preview server, not the production architecture for a public service.

The initial source used the visible spelling “Truth-Talk”; the owner's deployment correction was “TruthTalk” without a hyphen. The independent repository name/path did not need to be renamed.

## Safe deployment boundary and initial recommendation

The initial assessment recommended preserving the Droplet as Rootgate identity/control infrastructure. If an interim frontend deployment on that same IP were chosen, the least-conflicting route was a dedicated `/truthtalk/` path, leaving every existing Rootgate identity/health route and its root 404 unchanged. This would be a static-hosting stage only. A full-stack deployment remained a separate task: the owner had asked for an application-owned database and a product that is more than static hosting, but the app had neither an API nor a database schema. The Rootgate Droplet is role-bound to identity, has only 2 GiB RAM and no swap, and shares one OS/root trust boundary. Putting public social-data storage on this same host would couple application data to the identity anchor and is not the recommended production boundary. No Rootgate login API, signed user-identity handoff, or approved TruthTalk account protocol was available in this project.

## Evidence sources

- DigitalOcean authenticated resource page: `https://cloud.digitalocean.com/droplets/613623230`
- Droplet API detail used earlier in the task: `https://api.digitalocean.com/v2/droplets/613623230`
- Existing Rootgate HTTPS origin inspected for DNS/TLS: `https://rootgate.nexinus.net`
- Project files: `/home/ubuntu/truth-talk-network/package.json`, `README.md`, and `vite.config.ts`
- Migration guidance: `/home/ubuntu/skills/persistent-computing/references/migrate-webdev-to-cloud-computer.md`

## Initial static deployment — 2026-10-29 PDT (0.4.0)

The owner later directed deployment on the existing Rootgate Droplet. A static build was installed at `/opt/truthtalk/releases/0.4.0-20261029`, with `/opt/truthtalk/current` pointing to that release. `truthtalk.service` ran as `www-data` on `127.0.0.1:4171`. Nginx proxied `/truthtalk/` to that loopback service and returned a permanent slash redirect for `/truthtalk`. The existing `/` 404 fallback and all three Rootgate identity, artifact, and health locations were retained. The Nginx configuration passed `nginx -t` before reload; a root-only backup of the prior site file was at `/root/backup/atmos-identity.20261030-0228.bak`.

The public smoke test returned HTTP 200 for the app HTML, CSS/JavaScript assets, and favicon. The page title was `TruthTalk — Evidence before action`; `Referrer-Policy: no-referrer` and `X-Content-Type-Options: nosniff` were present. `/truthtalk` returned 308 to `/truthtalk/`. The host root remained HTTP 404 and the existing identity, artifact, and health routes remained HTTP 200. Direct checks of `rootgate.nexinus.net`, `tesseract.nexinus.net`, and `monarch.nexinus.net` showed the same deliberate pattern: `/` returned 404, while their identity, artifact, and health paths returned 200. These are identity/health endpoints, not application homepages.

This was an interim static frontend deployment, not the requested full-stack TruthTalk service. It had no TruthTalk-owned database, backend/API, shared feed, user account service, Rootgate identity handoff, or remote media storage. The Rootgate Manus-hosted application's TruthTalk tab was not changed because its project/source was separate and unavailable in this deployment session. The prior Manus/Xinus `Site Unavailable` gate was not altered.

## Patch release 0.4.1 — 2026-10-29 PDT

This supersedes the version-0.4.0 active-release details above. The 0.4.1 build passed `pnpm check`, **65 tests in 16 files**, and `VITE_BASE_PATH=/truthtalk/ pnpm build`. The production HTML declares the `/truthtalk/`-prefixed JavaScript and CSS; its route manifest identifies `/` as “TruthTalk — Evidence before action.” The release includes the corrected TruthTalk spelling and the latest owner-directed Tesseract Mirror/reference distinctions in the directory. No application server, account system, database, or shared feed was introduced.

The checksum-verified 0.4.1 archive was extracted to `/opt/truthtalk/releases/0.4.1-20261029`. After local HTML/JS/CSS and active-service checks passed, `/opt/truthtalk/current` was atomically switched to that release. `truthtalk.service` remained active on `127.0.0.1:4171`; Nginx, DNS, TLS, firewall, and other Rootgate routes were unchanged. The recorded rollback target `rollback-0.4.1-20261029` remains the 0.4.0 release.

Post-cutover HTTPS checks returned 200 for the app HTML, `assets/index-DWeUYJQZ.js`, `assets/index-BZs9e0C8.css`, `favicon.svg`, and `manus-routes.json`; the route manifest title is correct. `/truthtalk` redirects to `/truthtalk/`. Rootgate's `/.well-known/atmos-identity.json`, `/.well-known/atmos-artifact.json`, and `/health` continued returning 200, while the host root `/` continued returning 404 as before. A browser's first same-URL view reused cached 0.4.0 HTML and showed only its static fallback; opening a cache-busted 0.4.1 URL loaded the new JavaScript and mounted the full interactive application, with visible package label `0.4.1`. If a client displays the old release, hard-refresh the page before diagnosing an origin fault.

The direct production URL is [TruthTalk on Rootgate](https://rootgate.nexinus.net/truthtalk/). This closes the standalone static-route availability gate only. The Rootgate application tab still has not been updated, the historical Manus/Xinus billing-gated hostnames were not changed, and the full-stack API/database and identity handoff remain open. The 0.4.0 release remains available for rollback; no rollback has been needed.

### Live evidence links

- [1] [Live TruthTalk static release](https://rootgate.nexinus.net/truthtalk/)
- [2] [Rootgate node identity endpoint](https://rootgate.nexinus.net/.well-known/atmos-identity.json)
- [3] [Tesseract Mirror node identity endpoint](https://tesseract.nexinus.net/.well-known/atmos-identity.json)
- [4] [Monarch node identity endpoint](https://monarch.nexinus.net/.well-known/atmos-identity.json)
- [5] [Deployed TruthTalk route manifest](https://rootgate.nexinus.net/truthtalk/manus-routes.json)
- [6] [Rootgate identity host root, intentionally 404](https://rootgate.nexinus.net)

## Rollback

To roll back only the application release, atomically repoint `/opt/truthtalk/current` to `/opt/truthtalk/releases/0.4.0-20261029`, then verify the local route and public `/truthtalk/` assets. To remove the interim app entirely, first restore `/etc/nginx/sites-enabled/atmos-identity` from `/root/backup/atmos-identity.20261030-0228.bak`, run `nginx -t`, and reload Nginx; then disable the static service with `systemctl disable --now truthtalk.service`. Retain release files until the owner approves deletion. No rollback was performed.
