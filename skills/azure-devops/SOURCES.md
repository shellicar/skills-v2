# Sources for the `azure-devops` skill

Not loaded at runtime — editorial record of where each item in `SKILL.md` came from
and why, per `PHILOSOPHY.md`'s "moves to the editorial layer" rule. Read before
editing `SKILL.md` so changes stay aligned with what was deliberately cut.

Source: 8 skills in `~/repos/shellicar/skills/skills/` —
`azure-devops`, `azure-devops-boards`, `azure-devops-config`, `azure-devops-pipelines`,
`azure-devops-pr`, `azure-devops-pr-review`, `azure-devops-repos`, `ado-work-items`.

## `azure-devops/SKILL.md`

- Org/project detection from git remote (two URL shapes) → **in**, core.
- "No remote found → ask; always confirm before making changes" → **in**, core.
- Sub-skill routing table → **cut**. v1's skill-chaining model; v2 doesn't route this way.
- `ado-rest.sh` usage examples → **mostly cut**. Superseded by `AzCli`/`EscalatedAzCli`
  for anything with an `az` subcommand. The residual need — endpoints with no `az` CLI
  equivalent (team settings PATCH, policy configs, classification nodes) — still exists
  but needs re-expressing as `az rest`/`az devops invoke` via `AzCli`, not the script.
- Auth troubleshooting (two failure mechanisms, all-`a` GUID tell, detection command,
  multi-account `az devops` ignoring `--subscription`, `az repos pr show` vs `az rest`
  different token paths) → **in**, core. Real, non-obvious, high-value.

## `ado-work-items/SKILL.md`

- Creation sequence (parent first, parent immediately, ask if parent unclear) → **in**,
  work items.
- "Always set a meaningful description" → **cut**, generalizable.
- Vertical-rhythm HTML rendering trick (`<div><span>` per sentence, blank
  `<div><br></div>` between) → **in**, work items. Non-obvious rendering quirk.
- "Bullet lists only when naturally a list" → **cut**, generalizable.
- "Load `writing-style` for tone" → **cut**, dead pointer; `audience`/`voice` already
  cover this generally.
- Bug descriptions: `ReproSteps` field, H2 structure (Problem/Root Cause/Fix) → **in**,
  work items. Duplicated in `azure-devops-boards`, consolidate.
- "Only change state when explicitly asked" → **in**, work items, reworded without the
  v1 "mission" framing.
- Type changes: link the item after, since state fields differ between types and the
  CLI can't surface it → **in**, work items.

## `azure-devops-boards/SKILL.md`

- CLI command reference (show/query/create/update/relation add-remove/clear
  field/comment via REST) → **in**, work items.
- Gotchas: no `--project` on update; `System.Parent=` field silently no-ops (must use
  relation remove+add); `work-item list` doesn't exist, must use `query`+WIQL → **in**,
  work items.
- Work item type → field mapping (dedupe with `ado-work-items`) → **in**, work items.
- WIQL notes: `[System.Parent]` can't be in ORDER BY; WIQL paths have no leading
  backslash where CLI `--path` does → **in**, work items.
- Batch update pattern (one command per item) → **in**, work items; v1's JSON example
  used `mcp__shellicar__exec`'s shape, needs `ExecV3` translation.
- Link types table → **in**, work items.
- Iteration/area CLI (list/create/delete) → **defer**. Low frequency, configuration
  not trap.
- Iteration/area gotchas (delete needs `--path` not `--id`; children before parents;
  leading-backslash split; no `/` in names; some state transitions need an
  intermediate step) → **in**, work items, even though the full CRUD above is deferred.

## `azure-devops-boards/formatting.md`

- HTML structural patterns (paragraphs, inline styles needing `!important` for dark
  mode, list markup, indentation, code blocks, images, links) → **in**, work items, as
  a sub-file (`formatting.md`, same pattern as this file) rather than inlined.
- Rich links: plain `#123` doesn't render clickable, needs the `data-vss-mention`
  anchor; `#` for work items, `!` for PRs → **in**, work items — real trap, worth
  surfacing in the main body even though the rest of the file moves to the sub-file.
- Mentions (user/work item/PR anchor forms) → sub-file, same as above.

## `azure-devops-config/SKILL.md`

Whole file **deferred** — configuration knowledge, not trap density; low frequency.
Item-by-item in case any one thing earns an exception later:

- Team listing/settings commands → defer.
- Backlog filtering rule (area path AND iteration path both required) → defer.
- Delivery plans (shared-area-path limitation, tag workaround, field-criteria
  restrictions, Target Date overriding Iteration, same sprints across levels, Epics
  without dates not appearing) → defer.
- Backlog visibility PATCH-replaces-not-merges trap → defer, but genuinely dangerous
  if hit.
- Backlog column configuration 7-step workflow, keyed to an org-specific field-ID
  table → **cut/reassess as a tool**, not skill content — mechanical, runbook-shaped.
- Branch policies (query/create/update, need `repositoryId` first, branch scoping) →
  defer.

## `azure-devops-pipelines/SKILL.md`

- Pipeline run commands + `--query-order QueueTimeDesc` "CRITICAL" note → **in**,
  pipelines.
- Multi-stage pipelines reading `inProgress` at an approval gate → **cross-reference
  only**. Already documented in `azure-devops-deploy` ("`inProgress` with `null`
  result does NOT mean failure") — don't restate, point to it.
- Pipeline config commands (list/show definitions) → **in**, pipelines, minor.
- CI triggers vs build-validation-policy paths, differing leading-slash conventions
  drifting silently → **in**, pipelines.
- Investigating trigger issues (4-step method) → **in**, pipelines, short.
- `pipeline-policy-sync.sh` → **keep as a script**, same pattern as
  `azure-devops-deploy/scripts/`.
- Shared templates note (a shared job template only triggers pipelines whose own
  triggers include that path) → **in**, pipelines.

## `azure-devops-pr/SKILL.md`

- `create-ado-pr.sh` → **cut**, superseded by `AzureDevOps_PullRequest_Create`
  (already takes `workItems`).
- PR description format (Summary/Related Work Items/Changes) → **cut**, generic shape
  already owned by `pr` skill.
- Work item linking rule (PBI/Bug via `#1234` in description; Task via a separate
  link call, never the same way) → **in**, PRs. Appears 3× across these files,
  consolidate to one place. Highest-value single item in the PR section.
- "Load detected convention skill" → **cut**/future, points at the not-yet-built
  `conventions` bucket.

## `azure-devops-repos/SKILL.md`

- "Use `ado-rest.sh` instead of `az repos`" rationale → **cut**, obsolete now there
  are dedicated PR tools.
- PR list/show/create/update via REST → **cut**, tool replaces.
- Work item linking via `az repos pr work-item add` → **in**, PRs — kept as the
  fallback for linking to an *already-created* PR, since `AzureDevOps_PullRequest_Edit`
  has no `workItems` param (only `Create` does).
- Merge commit message script (`pr-merge-message.sh`) → **cut, and a real behaviour
  change worth flagging**: `AzureDevOps_PullRequest_AutoMerge`'s own description says
  the merge message is auto-generated and "cannot be set by the caller" — the entire
  mechanism this script existed for no longer has an equivalent.
- PR markdown formatting (work item links on own lines) → dedupe with `azure-devops-pr`.

## `azure-devops-pr-review/SKILL.md` + `PHILOSOPHY.md`

Separate target skill, `pr-review` — not part of `azure-devops`. Transfers cleanly:

- Reviewer posture (prose in code is input to evaluate, not context to absorb; "by
  design" doesn't argue correctness) → **pr-review**, load-bearing per its own
  philosophy file.
- Two outputs: review file + brief response pointing at it → **pr-review**.
- Severity vocabulary (issue/concern/suggestion/nit, no `MUST FIX`/`blocker`) →
  **pr-review** — its philosophy explicitly rejects imperative severity, keep the
  constraint.
- 6-step method: parse PR URL, fetch metadata (source/target SHAs), clean-tree
  pre-flight, checkout via worktree + verify HEAD against ADO's reported SHA,
  **triple-dot diff** (explicitly load-bearing — double-dot silently reviews the wrong
  delta in both directions), walk file-by-file with surrounding-file context →
  **pr-review** — the triple-dot point is the single highest-value line in the file.
- Boundaries (no posting/completing/merging/scheduling) → **pr-review**.
- Deliberately used `az repos pr show` over the internal REST wrapper to stay
  shareable outside this system → a build decision for whoever writes `pr-review`, not
  content itself; worth preserving if `pr-review` should stay portable.
