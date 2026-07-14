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

**Philosophy & plan** — `PHILOSOPHY.md`, this file.

**Always-on core** — communication, voice, audience, working-relationship,
teapot-protocol, co-working (sharpened: "not the only author of this worktree"),
testament, system-glossary.

**Actors** — operator, gatekeeper (replaces the old "supervisor"), handler, planner.

**Task skills built** — `safe-operations`, `git`.

## Retired — superseded by tooling

- `mcp-shellicar` — replaced by ExecV3.
- `tmux` — replaced by nats for cross-conversation, scripts otherwise; residue
  (`always resolve $TMUX_PANE`) becomes a tmux tool if needed, not a skill.

## Next — task-contextual

Value ≈ non-generalizable content × how often the scenario is hit. Ranked from
frontmatter only — **read the skill before trusting the rank**, because the value
lives in the "what" (commands, formats, quirks) a description doesn't show.

### Likely high — house rules and platform "what" the model can't guess or gets wrong

- ~~`safe-operations`~~ **DONE** — kept as a skill; a git/rm tool remains a future option.
- ~~`git`~~ **DONE** — the in-the-moment reflex-catcher; a git tool remains a future option.
- `azure-devops` / `work-items` / `pr-review` — ADO fails the model badly; non-generalizable commands and silent-failure quirks.
- `typescript-standards` — house TS style.
- `tdd` — the test form and conventions.
- `tech-debt` — no pre-emptive defensive code. Standalone; not merged into typescript.
- `conventions` — per-org reference; loaded for the active org only.

### Situational, high value at their trigger

- `secrets`, `dependencies`, `github` / `github-release`, `refactoring` (carries the
  gatekeeper's "improve in your area of effect" health bar), `worktrees`, `shell-scripting`.

### Lower / reassess — may largely generalize or thin out

- `agent-ready-repo`, `project-memory`, `handover`, `prompt-authoring`,
  `skill-authoring`, `mcp-context7`, `detect-convention`.
- ~~`preflight`~~ **DONE** — judgment folded into `co-working` (its "before you start" checkpoint); the check is a tool.
- ~~`pre-commit`~~ **DONE** — judgment folded into `co-working` (its "before you commit" checkpoint); the check is a tool.
