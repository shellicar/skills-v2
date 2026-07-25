# skills-v2

This repo builds the v2 skill library. `PHILOSOPHY.md` is the gate everything passes
through — enough context to do the task, nothing past sufficiency. `PLAN.md` is the
build order; `STOCKTAKE.md` is the exhaustive per-skill fate for everything in v1
(`~/repos/shellicar/skills`).

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

## Trap: parallel git commands race on `.git/index.lock`

Running two `ExecV3` calls against this repo's git in the same response (no
dependency between them, so issued in parallel) can collide on `.git/index.lock` if
both touch git at the same moment. Run git commands in this repo sequentially, not in
parallel tool calls.
