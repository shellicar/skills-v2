# Stocktake

Every skill in the original library, one per line, with a proposed fate for v2.
Companion to `PLAN.md` — this is the exhaustive review surface; the plan is the
forward order.

Fates: **done** (folded into v2) · **retired** (superseded by tooling) · **cut**
(dead or generalized) · **tool?** (better as a tool) · **keep** (bring at trigger) ·
**reassess** (may generalize or thin).

Caveat: platform skills ranked from frontmatter — read before trusting.

## Done — folded into the v2 always-on core

- `clear-communication` → `communication`
- `specification-discipline` → `communication`
- `communication-fundamentals` → `communication`
- `voice-claude` → `voice`
- `voice-stephen` → `voice`
- `audience-claude` → `audience`
- `audience-developer` → `audience`
- `audience-sc` → `audience`
- `audience-stakeholder` → `audience`
- `audience-stephen` → `audience`
- `claude-philosophy` → `working-relationship` (relationship half) + `operating-mode`
  (the conversation/execution two-mode framework, restored after being dropped)
- `commander-protocol` → `working-relationship` (now the escalation model)
- `co-working` → kept, sharpened to "not the only author of this worktree"
- `testament` → kept as-is
- `system-glossary` → kept as-is (seeded empty)
- `teapot-protocol` → kept as-is; the mode marker it once carried now lives in
  `operating-mode`

## Retired — superseded by tooling

- `mcp-shellicar` — replaced by ExecV3.
- `tmux` — nats + scripts; residue (`$TMUX_PANE`) → a tool.

## Cut — deprecated tombstones (already dead)

- `auto-approve-security`
- `cli-tools`
- `collaborative-conversation`
- `deferred-tools`
- `executive-communication`
- `issue-writing`
- `mission-shaping`
- `sc-commit-writing`
- `sc-doc-writing`
- `sc-ghostwriting`
- `sc-pr-writing`
- `sc-workitem-writing`
- `technical-writing`
- `writing-style`

## Cut — mission/planner machinery, shed with the format

- `mission-artefacts` — the mission-as-directory format.
- `mission-preparation` — lifecycle machinery.
- `mission-execution` — lifecycle machinery.
- `mission-integration` — lifecycle machinery.
- `mission-grounding` — provenance pass.
- `mission-verification` — the scribe's check of the mission against its sources.
- `mission-boards` — portfolio structure; now the planner's own, not prescribed.
- `planner-office` — portfolio structure; now the planner's own.
- `standing-up-handlers` — delivery plumbing.
- `dispatch` — delivery plumbing; text in, text out.
- `squad-selection` — team-composition machinery.
- `drive-post-mortem` — mission-retro mechanics.
- `medium-mission` — the mission brief as a medium.

## Tool? — likely better as a tool than a skill

- ~~`safe-operations`~~ **DONE** — built as a skill (Claude doesn't run destructive commands); a rm/git tool remains a future option.
- ~~`git-knowledge`~~ **DONE** — the in-the-moment reflexes folded into the `git` skill; a git tool remains a future option.
- `git-workflow` — commit format → `medium-commit`; explicit-path staging → `co-working`; push mechanics trivial. Mostly absorbed.
- `git-cleanup` — niche stale/squash-merged branch workflow; not built, bring when the chore is live.
- ~~`pre-commit`~~ **DONE** — folded into `co-working` ("before you commit" checkpoint); the check is a tool.
- ~~`preflight`~~ **DONE** — folded into `co-working` ("before you start" checkpoint); the check is a tool.
- `detect-convention` — picking the active convention; mechanical.

## Keep — bring at trigger, as a skill

Each new target skill, then the originals it absorbs — one per line.

**`azure-devops`** — platform "what": commands and silent-failure quirks.

- `azure-devops` (org/project detection)
- `azure-devops-boards`
- `azure-devops-config`
- `azure-devops-pipelines`
- `azure-devops-pr`
- `azure-devops-repos`
- `ado-work-items`

**`work-items`** — work-item craft.

- `work-item-hygiene`
- `work-item-migration`
- `work-organisation`
- `backlog-management`

**`pr-review`** — the anti-ratification review posture.

- `azure-devops-pr-review`
- `devops-review`

**`github`** — GitHub PR/repo reference.

- `github-pr`
- `github-repos`
- `github-milestone`

**`github-release`** — the release flow.

- `github-release`
- `github-version`

**`conventions`** — per-org reference; the active org only.

- `eagers-conventions`
- `eagers-branding`
- `flightrac-conventions`
- `hopeventures-conventions`
- `shellicar-conventions`
- `shellicar-oss-conventions`
- `shellicar-config-conventions`

**`secrets`** — scanning + remediation disposition.

- `secret-scanning`
- `secret-remediation`

**`dependencies`** — CVE/maintenance process and traps.

- `application-cve`
- `maintenance-release`
- `maintenance-release-fleet`

**`medium`** — artefact formats; shared "write what changed" lifts to `audience`.

- ~~`medium-commit`~~ **DONE** → `commit`
- `medium-documentation`
- `medium-issue`
- `medium-memory` — check against `testament` first; may already be covered
- ~~`medium-pr`~~ **DONE** → `pr`, plus platform staying-on-it split into `pr-github` / `pr-ado`
- `medium-workitem`

**`handover`** — the continuity note.

- ~~`handover`~~ **DONE**
- ~~`medium-handover`~~ folded into `handover`

House craft:

- ~~`typescript-standards`~~ / ~~`tdd`~~ / ~~`tech-debt`~~ **DONE** — built differently
  than planned here: `testing` (language-agnostic test principles, generalized from
  `tdd`) with `typescript` and `rust` as the per-language syntax, composing onto it.
  `tech-debt` was folded into `typescript` as "Casts are debt without evidence" on
  direct instruction — overriding this doc's original "standalone, not merged" call.
  `rust` has no v1 source; it's new, and currently carries only testing syntax.
- `refactoring` — carries the gatekeeper's "improve in your area of effect" bar.
- ~~`shell-scripting`~~ **DONE** → `scripting` (broader: portable scripts generally,
  not just POSIX shell).

## Reassess — may generalize, thin out, or change shape

- `agent-ready-repo` — much may now generalize from the core.
- `project-memory` — the ./CLAUDE.md upkeep; judgment-thin.
- `prompt-authoring` — mission-writing craft; less needed without the format.
- `shared-understanding` — drawing out intent; the handler does this now.
- `post-mortem` — the retro with the SC; keep the intent, shed the machinery.
- `transparency` — thinking/response congruence; confirm `working-relationship` covers it.
- `medium-response` — the live-exchange medium; may generalize against `audience`.
- `mcp-context7` — situational doc-fetch reference.
- `worktrees` — operator isolation; skill or tooling.
- `skill-management` — into a `skill-authoring` skill, rewritten against the barrier.
- `skill-hygiene` — into `skill-authoring`.
- `skill-repair` — into `skill-authoring`.
- `skill-philosophy` — the two-file model; v2 uses one `PHILOSOPHY.md`, so this changes.
