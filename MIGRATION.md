# v2 Migration

Getting v2 (and v1) to run the way we want. The through-line: a session's context has
**one visible author** — a launcher composed it (inspectable via `--doctor`) or it's
empty. Nothing ambient and invisible.

## Done

- **Naming, both v1 and v2.** `BASELINE.md` = the system prompt (rides `--system`, the
  former `SYSTEM.md` role). `INSTRUCTIONS.md` = the assembled CLAUDE.md framing (rides
  `--claudeMd`, the former `CLAUDE.md` role). Non-standard names so the CLI never
  picks them up as ambient sources when a session runs in the directory.
- **The framing files.** `INSTRUCTIONS.md` carries "skills are operating constraints"
  and automation integrity. `BASELINE.md` carries identity + operating environment
  (a denied tool call is a no, identifiers verbatim, how system reminders work).
- **`start-v2` + `load-skills`.** Inject INSTRUCTIONS and the `<skills>` block via
  `--claudeMd`, BASELINE via `--system`, and disable the ambient user sources via
  `--config` — a stopgap until the CLI defaults them off.
- **v1 launchers migrated.** Files renamed; the shared composer injects INSTRUCTIONS
  (`buildSkillsBlock`) and BASELINE (`buildSystem`/`buildSystemInline`); `--config`
  user-off across `start-claude`, `start-planner`, `launchCli`. Confirmed working.
- **Pre-flip verify — closed.** No composer leaned on the ambient user source; the
  injection is the sole channel.
- **Dropped:** `writing-to-files` (not needed).

## Settled decisions

- **Foundational is not in `skillDirs`.** The directory is the tier: foundational
  skills are injected always (launcher / system prompt); `skillDirs` holds only the
  contextual skills the Skill tool scans. No `alwaysLoaded` flag, no `tier` frontmatter.
- **Frontmatter is `name` + `description` only** — the bridge's contract. The
  description is prose carrying what/why/when; the labels are meaningless to the
  machine. `git`/`commit`/`pr` done; the rest as they're built.
- **The Skill tool is engine mechanism, not launch.** `skillDirs` (config) + a `Skill`
  load tool + an auto-injected frontmatter catalogue. The bridge (Rust) already
  implements this and is the reference.

## CLI track — claude-sdk-cli (remaining)

- [ ] **Sources off by default.** Default `claudeMd.sources.user` and
      `systemPrompt.sources.user` to off; the launchers' `--config` stopgap then retires.
      Project / projectClaude / local stay on.
- [ ] **`skillDirs` + Skill tool**, matching the bridge: ordered config array
      (replacement semantics), a `Skill` load-by-name tool, and an injected catalogue.
      The catalogue carries the **description** (not name-only), so the "why" reaches
      the load decision.
- [ ] **Effort-nested-in-thinking fix** — its own small PR.

## skills-v2 track (remaining)

- [ ] **Ignition.** A foundational disposition to reach for the Skill tool — list
      before real work, heed the description, don't skip on confidence. Without it,
      agent-driven discovery never fires.
- [ ] **Frontmatter rollout** as skills are built (`name` + `description`).
- [ ] **When the Skill tool ships:** prune the frontmatter catalogue from the injected
      block; discovery moves to the tool, injection shrinks to foundational bodies only.

## Not building

`~/.claude` symlink-farm swapping or any parallel-root machinery. The bridge
(Rust/NATS headless agent) carries zero ambient settings — everything from
config/startup — so that machinery is throwaway. The `.mjs` launchers are the proving
ground for the discipline the bridge needs, not a divergent model.
