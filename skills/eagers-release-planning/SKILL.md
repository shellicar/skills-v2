---
name: eagers-release-planning
description: |
  WHAT: building and maintaining a release/promotion epic — the capability-organised test plan, deployment verification, and hotfix tracking for a build moving through pre-prod toward a decision to approve it to prod.
  WHY: a test plan organised by PR forces testers to re-do setup per PR instead of per feature; deployment claims made without checking the running environment repeat the same trap every time; a hotfix moves the target and every earlier check goes stale until re-verified.
  TRIGGER WHEN: asked to build, maintain, or verify a release/promotion epic for an Eagers multi-app repo (e.g. Customer-Interactions).
---

# Eagers Release Planning

Building and keeping honest the epic that carries a build from "ready for pre-prod" to "approved for prod." Distinct from `devops-deploy`, which owns the prod-approval decision itself (matrix, pipeline state, code review, config checklist, the approve/cancel scripts) — this skill owns the epic: the test plan the products team works from, and the deployment-verification record that keeps it honest as the build changes underneath it.

Don't hardcode an environment name (UAT, Tst, etc.) into how you think about this — environment sets vary per Eagers system (see `azure-devops-config` / the environment-landscape memory). Read whichever is the last pre-prod stage from the pipeline's actual stage graph.

## The epic's sections, in order

1. **Purpose** — one line: what build, going where, why (regression + acceptance).
2. **Deployment verification** — see below. Sits near the top; it's checked repeatedly through the epic's life.
3. **Awaiting production approval** — appears once the build is sitting at the prod gate. Build links + approval IDs only (see the handoff note below).
4. **Current prod state** — what's actually live now, per app. Never derive this from the matrix or from "we released X" — confirm it (see Traps).
5. **Change matrix** — one row per commit/PR, columns = deployable apps, computed from pipeline trigger paths (see below).
6. **What to test** — organised by capability, not by PR (see below).
7. **Not in this promotion** — PRs that didn't trigger a deploy (pipeline-only changes).

## The change matrix: compute from pipeline trigger paths, not behaviour

The trap: assigning ⚠️ per app by which app *behaviourally uses* the change ("API + Integration"). Wrong — an app's pipeline rebuilds/redeploys when the commit touches that pipeline's trigger paths, regardless of behaviour, and this produces real errors (missed columns, missed cross-app rebuilds).

Compute it properly:

```
git diff --name-only <merge>^1 <merge>
```

then match the changed paths against each pipeline's `trigger.paths.include` in `apps/<app>/deploy/azure-pipelines.yml` (and `infra/deploy/azure-pipelines.yml`). Read the actual YAML per repo — don't assume a shape. In Customer-Interactions, the asymmetries that matter:

- `packages/server-*` triggers API/Integration/Worker, **not** webapp.
- `packages/ui*` triggers webapp, **not** the API trio.
- `packages/common`, `package.json`, `pnpm-lock.yaml`, and `deploy/` trigger **all four apps** (a shared-dependency change lights up apps it doesn't behaviourally touch — that's a redeploy, not a behavioural change, and the matrix should say so in a footnote).
- `infra` and `deploy/` trigger the infra pipeline; nothing else does.

Matrix cells: `⚠️` = changed in this promotion, not yet in prod. `✅` = current prod. Blank = pipeline did not trigger. `—` in the Ver column = commit didn't trigger any app (pipeline-only, goes in "Not in this promotion").

## What to test: by capability, not by PR

A tester works by feature, not by code change. The same capability is often split across several PRs (a render fix and a signing refactor both touch "how contracts render"); organising by PR forces the tester to re-open the same deal three times. Organise by capability instead:

- Capability sections, tiered hardest-first (🔴 shared surface / 🟠 additive-changed / 🟡 or 🟢 low), each tagged with the PRs that feed it, e.g. `### 🔴 Contract documents & signing (7069, 7178)`.
- One `*What:*` line: what changed and why it's the tier it is.
- Items as `- [❔] - <check>`, one test per item — don't bundle two assertions into one line, split them.
- Nest a nested checklist for a repeated per-X check (e.g. per jurisdiction): parent line, then `  - [❔] - NSW` / `QLD` / etc.
- Tag any check a products-team tester genuinely cannot perform with **`(dev)`** — backend-only verification (App Insights, Event Grid, an inbound integration feed with no UI path). Add a name if a specific person owns it: `(dev, check with James)`.
- Explain *how* to test, not just what happens — "deal re-issue" means nothing without "to test: send another contract for the same deal from easypass; expected: the old link stops accepting a signature." Don't assume the reader can reverse-engineer the test from the description of the change.
- Name the originating system when it isn't obvious ("this action is triggered from Deal Hub; the functionality lives in easypass").
- Plain language: no em dashes, no internal jargon (a "webhook", an internal method name, an internal file path mean nothing to the products team), and use the product's own current name for a product, not an old one (confirm with the SC which one is current — a rename can go either direction).
- A Legend line once, defining the icons: `[❔] todo · [✅] passed · [❌] failed · [🚫] blocked/external · [⚠️] N/A`.

## Deployment verification: a flat fact table, no narrative

The format: **Expected** (what the tag/branch should point at) vs **Actual** (what's actually running) vs **Discrepancy** (a plain fact, not a story). No temporal language — not "stale", not "redeploy in progress", not "as of 5pm". State it as a fact: `⚠️ Wrong` or `✅ No`. If the target changes (another hotfix lands), update Expected and re-mark Discrepancy; don't narrate the history of how it got that way in the table itself.

| App | Expected | Actual | Discrepancy |
|---|---|---|---|
| API | sha `X`, version `Y` | sha `X`, version `Y` | ✅ No |
| Infrastructure | matches `infra/modules/apim/swagger.json` at `X` | (see below) | ✅ No |

**Read Expected from the git tag**, dereferenced (`git rev-parse <tag>^{commit}` — an annotated tag's `rev-parse` alone returns the tag object, not the commit; use `^{commit}` or you'll misdiagnose a "gap" that isn't there). **Read Actual from the running environment**, never from pipeline history (a deleted/recreated pipeline amputates its own history; an `inProgress` run with a `null` result usually means "waiting at a gate", not "broken" — see `devops-deploy`'s trap on this). Concretely:

- Each app's own `/api/version` (or equivalent) endpoint — sha, branch, version label.
- For an APIM-fronted API: hash the deployed GraphQL SDL and diff against the repo file for a byte-exact check. **A REST/OpenAPI (swagger) export is not exact-diffable the same way** — APIM re-serialises the components in alphabetical key order on export, so hash it and you'll get a false mismatch. Content-verify instead: pull the specific changed property out of the deployed doc and compare its value directly.
- Confirm the API resource's active revision (`isCurrent: true`) — a matching hash on a *staged, non-current* revision proves nothing about what's actually being served.
- Don't be thrown by a build-tool version label that doesn't match the tag name (e.g. GitVersion computing `2.1.9-tags-2-1-7.4` for tag `2.1.7`, from commit height) — the sha is ground truth, the label is a derived string.

## Hotfixes: tracked against a moving tag

A release tag can be moved forward more than once as hotfixes land before prod sign-off. Each time:

```
git fetch origin --tags --force   # a moved tag needs force to update locally
git log --oneline <last-checked-sha>..<tag>^{commit}
git diff --stat <last-checked-sha>..<tag>^{commit}
```

Read the new commit(s) with `git show`, not just the summary — the actual diff tells you which trigger paths it hit (so you know which apps need redeploying) and what to add to the test plan. Update Expected in the deployment-verification table to the new sha/version immediately; that's what turns Discrepancy honest again until the redeploy lands. Add the new check(s) to the relevant capability section in "What to test", tagged with the hotfix's short sha so it's traceable.

## The prod-approval handoff: data only, not tooling instructions

Once the build is sitting at the prod gate, record what a later approver needs: the build id, a direct link to it, and its pending approval id, per app/pipeline. **Do not** write the "how to approve this" instructions (skill name, script name, command) into the epic itself — that's internal tooling leaking into a document the products team also reads. The IDs are the useful, durable fact; the mechanism for acting on them lives in `devops-deploy`, not here.

## Traps

- **Don't derive "current prod" from the change matrix or from a verbal "we released X".** A promotion's matrix can show a PR as the prod line while the actually-live version is several commits earlier — confirm against the running environment or ask, every time.
- **A skill/script instruction inside a products-facing document is a smell.** If you're about to write "use X's `Y.mts` to do this," that sentence belongs in your own working notes or a memory, not in the epic.
- **Don't assume the environment topology.** Some Eagers systems have no UAT stage at all (dev+prd only); read the actual stage graph, don't assume tst→uat→prd.
