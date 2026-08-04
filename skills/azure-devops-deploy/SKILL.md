---
name: azure-devops-deploy
description: |
  WHAT: a prod deployment risk analysis — commit matrix, pipeline status, code review, config checklist.
  WHY: many traps in reading pipeline state and what's actually safe to ship.
  TRIGGER WHEN: asked to analyse or prepare a prod deployment.
---

# DevOps Deploy

A prod deployment risk analysis has four parts: the deployment matrix, the pipeline state, the code review, and the configuration checklist.

## 1. Gather inputs

You need two things upfront:

- **Prod versions** — the currently deployed version for each app (sha, version, branch). Get these from the running apps.
- **Pipeline IDs** — find them with `az pipelines list`. First check the git remote to get the org and project:

  ```
  git remote get-url origin
  # https://dev.azure.com/<org>/<project>/_git/<repo>
  ```

  The org and project in that URL are what to use for every pipeline and PR query. Don't guess.

## 2. Build the deployment matrix

Rows are commits on main since the oldest prod deployment. Columns are deployable apps (one per pipeline).

Query pipeline runs efficiently — one call per pipeline:

```
az pipelines runs list
  --org <org>
  --project <project>
  --pipeline-id <id>
  --branch main
  --top 15
  --query "[?reason=='individualCI'].{sha:sourceVersion,build:buildNumber,result:result,status:status}"
  --output json
```

Cross-reference each commit's SHA against the pipeline runs. A commit with no run means the pipeline's path filter excluded it — that app has no change for that commit, not a failure.

Matrix cells:
- `✅ x.y.z PROD` — current prod version
- `✅ x.y.z` — built and deployed to non-prod, waiting at prod approval gate
- `⚠️ x.y.z` — build ran but result unknown / failed
- `—` — pipeline did not trigger for this commit

### `inProgress` with `null` result does NOT mean failure

A run showing `status: inProgress` and `result: null` is waiting at a manual approval gate between stages (tst → prd). The prod version being older than the build confirms it hasn't been approved yet — it does not mean the build broke. Never call a build failed unless you can confirm it.

## 3. Review the code changes

For each commit not yet in prod, read the actual diff — not just the PR description.

```
git diff <prod-sha>..HEAD --stat
git diff <prod-sha>..HEAD -- <paths>
```

Focus on:
- Runtime behaviour changes (logic, routing, data mutations)
- Seed scripts — these apply data changes on deploy or manual run; clarify which
- Pipeline template changes — these affect the build, not prod runtime
- Dependency/lockfile changes — CVE clears are low risk; check for major version bumps

## 4. Configuration checklist

Ask: does any change require configuration before or after approving the deployment?

Common cases:
- New env vars introduced — are they set in prod?
- Seed scripts — do they run automatically on deploy or does someone run them manually?
- Per-environment data (e.g. email addresses in seed) — are the values correct?

Don't assume. If you can't tell from the code, ask.

## 5. Discovering and queueing pipelines

**Only queue a pipeline run when the SC has directly and explicitly asked for it.** Reading pipeline state, building the deployment matrix, and everything else in this skill is fine to do unprompted as part of an analysis — starting a real build is not. Queueing is a visible, running action against shared infrastructure; treat an ambiguous request ("can you check if we could deploy this") as read-only, and a clear one ("queue api/integration/worker for the 2.1.7 tag") as the trigger.

**Discover pipeline ids** with `list-pipelines.mts` — don't guess an id, don't read one off a UI screenshot or a captured browser request. Ids drift and the same-looking pipeline name can exist more than once (e.g. an old pre-restructure definition alongside the current one).

```
echo '{"org":"https://dev.azure.com/<org>","project":"<project>","name":"api"}' | node scripts/list-pipelines.mts
```

**Queue a run** against a branch or tag with `queue-run.mts`:

```
echo '{"org":"https://dev.azure.com/<org>","project":"<project>","pipelineId":236,"ref":"refs/tags/2.1.7"}' | node scripts/queue-run.mts
```

This queues the pipeline's full default stage graph (build, then whatever release stages the pipeline template defines) starting from that ref — it does not scope the run to one environment or skip stages unless you pass `stagesToSkip`. A tst stage that auto-deploys will run; uat/prd stages that gate on an environment approval will sit waiting for `approve-build.mts` per pipeline. Repeat `queue-run.mts` once per pipeline you were asked to queue (e.g. api, integration, worker) — there is no single call that queues several pipelines at once.

## 6. Acting on the plan — cancel and approve

Once the SC decides what to cancel and what to deploy, produce a table before touching anything:

```
Cancel:
API     | 0.1.35 | build 75374
Webapp  | 0.1.35 | build 75375

Deploy:
API     | 0.1.36 | build 75401
Webapp  | 0.1.36 | build 75402
Infra   | 0.1.34 | build 73024
```

Scripts for this live in `scripts/` next to this file (Node 22+, run `.mts` directly). Each reads one JSON object on stdin and exits `64` if that input is missing or malformed:

- **`list-pending-approvals.mts`** — lists pending approvals, resolved to build id/number, optionally filtered to one pipeline by exact name. Use this instead of a bare unfiltered API call — the raw list spans every pipeline in the project and invites picking an id by eyeballing a name in a huge dump.
- **`get-approval-id.mts`** — given a `buildId`, finds the pending approval id and which stage (`Release to Prd` etc.) it's blocking.
- **`get-build-for-approval.mts`** — given an `approvalId`, returns the build id and pipeline name it belongs to. **Always run this before approving or cancelling** — never act on an approval id you haven't confirmed back to a build. Two different pipelines can have approvals pending at the same time; approving the wrong one approves someone else's deployment, and there is no undo.
- **`cancel-build.mts`** — cancels a build by id.
- **`approve-build.mts`** — approves a pending deployment approval by id.
- **`wait-for-stage.mts`** — polls a build (or one named stage within it) until it reaches a terminal state, or a timeout elapses. Azure DevOps has no blocking watch API, so this is the sanctioned polling loop — use it instead of hand-rolling sleep/recheck. Exits `0` on `succeeded`, `1` on any other terminal result (failed/cancelled/skipped), `2` on timeout (not a verdict — it just didn't finish in time). Defaults: 300s timeout, 10s poll interval, both overridable.

```
echo '{"org":"https://dev.azure.com/<org>","project":"<project>","pipeline":"Customer-Payments - API"}' | node scripts/list-pending-approvals.mts
echo '{"org":"https://dev.azure.com/<org>","project":"<project>","buildId":75401}' | node scripts/get-approval-id.mts
echo '{"org":"https://dev.azure.com/<org>","project":"<project>","approvalId":"..."}' | node scripts/get-build-for-approval.mts
echo '{"org":"https://dev.azure.com/<org>","project":"<project>","buildId":75374}' | node scripts/cancel-build.mts
echo '{"org":"https://dev.azure.com/<org>","project":"<project>","approvalId":"..."}' | node scripts/approve-build.mts
echo '{"org":"https://dev.azure.com/<org>","project":"<project>","buildId":75401,"stage":"Release to Prd"}' | node scripts/wait-for-stage.mts
```

**These scripts exist for safety, not convenience — follow them, don't call `az devops invoke` or `az rest` against the approvals/build API by hand.** An approval id approves a specific pipeline's prod deployment with no undo; the safe path is always id → confirmed build → act, and that path only holds if every step goes through `get-build-for-approval.mts` first. Reaching for `az rest` directly skips that check and reopens the exact failure mode from this session: an id picked by eye out of an unfiltered dump, approved on trust. If a new operation isn't covered by an existing script, write a new script for it — don't run the API call ad hoc.

### Traps

- **Approving can fail with `ApprovalUnauthorizedException` under the normal identity.** If that happens, retry with `EscalatedAzCli` — the approval group (e.g. "Prod deployment approvers") may require the escalated identity.

## Notes

- `az repos pr show` takes `--org` and `--id` only — no `--project`
- Pipeline stages vary by repo — don't assume a fixed shape (e.g. Build → Tst → Prd); read the pipeline template to find the actual stages and where the approval gate sits
- Whether a seed script runs automatically on deploy or is run manually afterwards is a per-repo convention — check the deploy pipeline, don't assume
