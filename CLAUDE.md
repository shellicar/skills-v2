# skills-v2

This repo builds the v2 skill library. `PHILOSOPHY.md` is the gate everything passes
through — enough context to do the task, nothing past sufficiency. `PLAN.md` is the
build order; `STOCKTAKE.md` is the exhaustive per-skill fate for everything in v1
(`~/repos/shellicar/skills`).

## Every change to skill content lands with its decision

Skill content does not reach main without a `DECISIONS.md` entry in the same commit. The
`decisions` skill carries the whole of it: what the ledger is for, how an entry is
written, and where its why comes from. It is self-contained because this file is not —
editing these skills from another repo or another worktree loads the skill and never
loads this.

## Porting from v1: check the stocktake first, don't compare file names

`STOCKTAKE.md` already maps every v1 skill to a fate (done/retired/cut/tool/keep/
reassess) and, where kept, a target v2 name. Several v1 skills collapse into one v2
skill — seven ADO skills into `azure-devops`, six `medium-*` skills absorbed into
`audience`/`commit`/`pr`/`handover`/etc. Compare against those target names, not v1's
file names one-for-one; a v1 skill with no v2 namesake is not automatically a gap.

## Keep `PLAN.md` and `STOCKTAKE.md` current as skills land

When a skill is built or a planned shape changes, update `PLAN.md`'s "Task skills
built" line and `STOCKTAKE.md`'s entry for it in the same session. Both drifted out of
sync with reality before this was written down.

## Frontmatter `description` has a 250-character cap

Every skill's `description` field (the WHAT/WHY/TRIGGER WHEN prose) stays under 250
characters — check with `node scripts/description-lengths.mjs` after adding or
editing one, and trim anything it lists as over.
