---
name: decisions
description: |
  WHAT: recording the decision behind a change to skill content, in the same commit.
  WHY: without it nobody can tell later where a change came from or whether it stands.
  TRIGGER WHEN: COMPLIANCE — changing skill content in the skills-v2 repo.
---

# Decisions

Read `CLAUDE.md` at the root of the skills-v2 repo
(`~/repos/shellicar/skills-v2/CLAUDE.md`) before the change lands. It carries the rule
and the shape of an entry.

The constraint belongs to the material, not to the directory you are working in — it
holds when you are editing these skills from another repo, another worktree, or a
session that never opened this one.

## Writing the entry

`CLAUDE.md` carries the format, and the entries already in `DECISIONS.md` are it.

The one thing neither can give you is the reason. **The why is the SC's, so ask him for
it.** Reconstructing it from what he said while directing the work produces something
plausible, in his voice, that he never decided. If you don't have the reason, stop and
ask for it.
