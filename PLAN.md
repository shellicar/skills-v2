# Plan

The order for adding skills back. Governed by `PHILOSOPHY.md`: nothing enters
unless it gives Claude enough context to do the task and the model wouldn't already
generalize it. Task skills are written the day a scenario needs one, not before.

## Three fates for an old skill

- **Keep as skill** — judgment and what-the-SC-wants: PR voice, platform quirks to
  navigate, the test form. Can't be tooled.
- **Cut** — the model generalizes it.
- **Convert to a tool** — an enforceable constraint or mechanism. A tool that exposes
  only the allowed action removes the need for a skill telling Claude to avoid the
  wrong one. Better than a lean skill: zero context, enforced.

## Done

**Docs** — `PHILOSOPHY.md`, `PLAN.md`, `MIGRATION.md`, `STOCKTAKE.md`.

**Baseline files** — `BASELINE.md` (the system prompt, rides `--system`),
`INSTRUCTIONS.md` (the operating-constraints / automation-integrity framing, rides
`--claudeMd`).

**Always-on core** — communication, voice, audience, working-relationship,
teapot-protocol, co-working, testament, system-glossary.

**Actors** — operator, gatekeeper (replaces the old "supervisor"), handler, planner.

**Task skills built** — safe-operations, git, commit, pr, pr-github, pr-ado,
scripting, handover, testing, typescript, rust, azure-devops-deploy (new, no v1
source), nats (new, no v1 source).

**Launchers** — `start-v2` + `load-skills` inject INSTRUCTIONS and the `<skills>` block
via `--claudeMd`, BASELINE via `--system`, and disable the ambient user sources via
`--config`. The v1 launchers were migrated to the same model.

## Retired — superseded by tooling

- `mcp-shellicar` — replaced by ExecV3.
- `tmux` — replaced by nats for cross-conversation, scripts otherwise; residue
  (`always resolve $TMUX_PANE`) becomes a tmux tool if needed, not a skill.

## Next — task-contextual, at their trigger

Value ≈ non-generalizable content × how often the scenario is hit. **Read the skill
before trusting the rank** — the value lives in the "what" (commands, formats, quirks)
a description doesn't show.

### Likely high — house rules and platform "what" the model can't guess or gets wrong

- `azure-devops` / `work-items` / `pr-review` — ADO fails the model badly;
  non-generalizable commands and silent-failure quirks. `azure-devops-deploy` (prod
  deployment risk analysis) is built; the broader org/project/boards/pr/work-items
  reference skill is still open.
- ~~`typescript-standards`~~ / ~~`tdd`~~ / ~~`tech-debt`~~ **DONE**, as `testing` +
  `typescript` + `rust` — see `STOCKTAKE.md` for the shape, which diverged from this
  plan (`tech-debt` merged into `typescript` rather than staying standalone).
- `conventions` — per-org reference; loaded for the active org only.

### Situational, high value at their trigger

- `secrets`, `dependencies`, `github` / `github-release`, `refactoring` (carries the
  gatekeeper's "improve in your area of effect" health bar), `worktrees`.

### Lower / reassess — may largely generalize or thin out

- `agent-ready-repo`, `project-memory`, `prompt-authoring`, `skill-authoring`,
  `mcp-context7`, `detect-convention`.

### Folded away, not built

- `preflight` / `pre-commit` — folded into `co-working` (its "before you start" and
  "before you commit" checkpoints); the mechanical checks are tools.
