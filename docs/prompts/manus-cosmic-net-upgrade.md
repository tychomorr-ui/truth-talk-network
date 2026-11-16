# Copy-ready prompt: Manus profile repository audit and upgrade plan

Paste the prompt below into the separate Manus profile. Replace the repository placeholder only after you have confirmed the exact GitHub URL.

---

You are helping me inspect and modernize the GitHub project I refer to as **Cosmic Net**. The target product is the provenance/Tesseract Terminus site intended for `https://universaltruth.life`.

## Budget and authorization

I have reported approximately **1,300 Manus credits** on this profile. That is not permission to spend them all. Use a soft cap of **130 credits before returning for my review**, and do not exceed it without my explicit approval. If you cannot see actual credit costs, do not guess or claim an estimate; stop before any operation likely to consume substantial credits and tell me what you need approved. Avoid repeated agent fan-out, paid image/video generation, large unnecessary research runs, or duplicated work.

Start with **Phase 1: read-only inventory only**. Do not edit files, create branches, commit, push, delete, deploy, contact the domain registrar, modify DNS/billing, or change production while doing Phase 1. At the end, return the findings and the proposed Phase 2 scope; wait for my approval of the exact plan before any write or external change.

## Repository and product facts

- Exact GitHub repository URL: **[PASTE THE EXACT REPOSITORY URL HERE]**. Do not infer a repository from the name “Cosmic Net”; confirm owner, repository, and branch with me if missing or ambiguous.
- Start branch: **[BRANCH, if known; otherwise report the default branch without changing it]**.
- `universaltruth.life` is the intended domain for **TESSERACT-TERMINUS / provenance**.
- `https://tesseract.manus.space` is a separate TESSERACT recovery/mirror role; do not conflate the two.
- KEIRA (`keira.nexinus.net`) and VALKYRIE (`valkyrie.nexinus.net`) are separate ecosystem roles, not code or identity sources to copy.
- Truth-Talk is a separate standalone product. **Do not modify or import files, routes, tables, keys, runtime state, adapters, or code from `/home/ubuntu/tesseract-sovereign` (VALKYRIE).** No live integration exists. Any future data exchange must be a versioned, operator-approved signed export/import contract.

## Phase 1: read-only audit

1. Confirm the repository URL, default branch, current commit, working-tree state, license, package/toolchain, scripts, tests, build output, deployment files, routes, environment-variable names, migrations, storage, and external integrations. Never print secret values; report only variable names and whether they are present.
2. Build a concise architecture map: frontend, backend, provenance/event formats, signing and hash algorithms, persistence, migrations, moderation/deletion, and domain/deployment assumptions.
3. Separate verified implementation facts from README claims, prior assistant narratives, and unknowns. Trace which provenance records are actually written, read, signed, and independently verifiable. Flag self-signed/unpinned keys, client-only state, non-cryptographic digests, hard-coded demo data, unused routes, dead links, and untested production claims.
4. Inventory “old stuff” without deleting it. For every possible removal, state exact path/resource, evidence that it is obsolete, replacement, migration/data-loss risk, rollback plan, and whether it is safe to archive, deprecate, or remove. **No destructive cleanup without my approval of each exact item.** Preserve records, assets, IDs, schema history, and behavior by default.
5. Compare hosting options only after understanding the source: (a) Manus-hosted website, (b) my own DigitalOcean/other droplet, and (c) user-operated hardware. Give source-grounded costs, operational duties, security, backup, TLS, availability, and domain requirements where you can verify them. Do not provision a server or change DNS/billing.
6. Recommend a staged modernization plan that aligns the Terminus provenance role with signed records, exact-byte hashes, explicit trust/key-pinning limits, accessible UI, and Truth-Talk’s 4Reels references **without creating live cross-project coupling**. Do not promise that hashes prove truth, legal ownership, real-world identity, or permanence.

## Phase 1 deliverable and stop condition

Return one compact report with: repository/commit identity; architecture map; working build/test status; verified versus unverified provenance behavior; prioritized issues; a proposed keep/archive/deprecate/remove matrix; hosting/domain options; a phased upgrade plan; expected credit risk (only if measurable); and exact approvals needed. **Stop after this report and wait for my approval.**

## Later phases, only after I approve them

After approval of a written scope, work on a new branch or isolated clone, preserve the original, make small auditable commits, run the repository’s real checks, and document any migration/rollback. Never force-push. Before each external or paid step, show me the exact effect and cost and obtain approval. Deploy only to the host I choose after showing the exact build, DNS records, access/backup requirements, and rollback; do not change production, DNS, or billing on your own.

---

**Credit reminder:** If a phase may exceed the 130-credit soft cap or the cost is not visible, pause and ask before continuing. My remaining credits are a reserve, not a target.
