# v2 Migration

The path to running v2 skills the way we want. Two tracks: **claude-sdk-cli** (the
engine) and **skills-v2** (this repo). The CLI work is described here but happens in
that repo; this is the checklist, not the diff.

The through-line: the session's context has one visible author — a launcher composed
it (inspectable via `--doctor`) or it's empty. Nothing ambient and invisible.

## CLI track — claude-sdk-cli

- [ ] **PR 1 — sources off (user only).** Default `claudeMd.sources.user` and
      `systemPrompt.sources.user` to **off**. Leave `project` / `projectClaude` /
      `local` **on** — they're not fundamental, and `CLAUDE.local.md` is welcome extra
      context when a repo has it. Only the v1 *user* `CLAUDE.md` is the problem: it
      leaks v1 into a v2 session and blocks using v2 skills as intended.
  - [ ] Pre-flip verify: read `shared/pane/launch.mjs` (`launchCli`) and confirm every
        composer injects via `--claudeMd`, none leans on the ambient user source.
        (`start-claude` and `launch-handler` already pass skills explicitly; `launchCli`
        is the one unread link.)
- [ ] **PR 2 — `skillDirs` + Skill tool.** One feature; the parts are interdependent.
  - [ ] `skillDirs`: an ordered array in config. Replacement semantics — a session's
        whole skill world, no additive default root. Overlay/precedence lives *inside*
        a config (later-wins); replacement is *between* configs.
  - [ ] Skill tool: `list` (names + frontmatter across roots) and `load` (body by
        name). The CLI knows the roots and injects strings; it knows nothing about what
        a skill *means*.
- [ ] **Separate small PR — effort-nested-in-thinking fix.** Unrelated correctness nit;
      keep it out of the design PRs so the blame stays clean.

## This-repo track — skills-v2

- [ ] **Rescue the homeless discipline.** Write a `writing-to-files` skill — no pasting
      file content, PreviewEdit is your own review, edit-is-not-commit, approval to
      write isn't approval to commit/push/run. It lives only in the v1 user `CLAUDE.md`
      today and dies when that source goes off.
- [ ] **Baseline preamble.** With the user `CLAUDE.md` off, the "skills are operating
      constraints — follow them; a response without them is wrong" framing must ride the
      injected block. Emit it at the top of the foundational block, or make it a
      foundational skill.
- [ ] **Ignition for agent-driven discovery.** The Skill tool flips discovery from
      system-driven (description-matched) to agent-driven (the agent decides to `list`
      and `load`). Add the foundational disposition to reach for it — list before real
      work, heed the `why`, don't skip on confidence. Without this, `list`/`load` never
      fires. (May combine with the baseline preamble into one small "how skills work"
      foundational piece.)
- [ ] **Frontmatter rollout.** Give the contextual skills `description` / `trigger` /
      `why` (git done). This is what `list` surfaces and what turns a dismissive agent
      into one that loads — the `why` defeats "I know it, skip it." Do the rest as they're
      written.
- [ ] **"Which is foundational" — data or code.** Stays the `FOUNDATIONAL` array in
      `load-skills.mjs` while composition is launcher-side (fine). Revisit tier-in-
      frontmatter only if the CLI ever composes.
- [ ] **Prune the catalog when the tool ships.** Once `list` works, drop the frontmatter
      catalog from the injected block — discovery moves to the tool, injection shrinks to
      foundational bodies only. `load-skills` / `start-v2` are the proving ground for this.
- [ ] **`start-v2`.** Pass the v2 config (`skillDirs`, sources) and inject the block;
      keep `--doctor`.

## Ordering

1. **CLI PR 1 (user sources off)** — unblocks v2 immediately by killing the leak.
2. **skills-v2 foundation**: `writing-to-files`, baseline preamble, Skill-tool-usage
   disposition. Runs in parallel with the CLI work.
3. **CLI PR 2** — `skillDirs` + Skill tool.
4. **skills-v2**: frontmatter rollout across the contextual skills.
5. **When the tool ships**: prune the catalog from `load-skills`.
6. **Effort fix** — whenever.

## Not building

`~/.claude` symlink-farm swapping or any parallel-root machinery. The bridge
(Rust/NATS headless agent) carries zero ambient settings — everything from
config/startup — so that machinery is throwaway. The `.mjs` launchers are the proving
ground for the discipline the bridge needs, not a divergent model.
