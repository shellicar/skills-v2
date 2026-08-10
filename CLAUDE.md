# skills-v2

This repo builds the v2 skill library. `PHILOSOPHY.md` is the gate everything passes
through — enough context to do the task, nothing past sufficiency. `PLAN.md` is the
build order; `STOCKTAKE.md` is the exhaustive per-skill fate for everything in v1
(`~/repos/shellicar/skills`).

## Every change to skill content lands with its decision

Skill content does not change without a `DECISIONS.md` entry in the same commit. The
provenance path is: blame a line, find the commit, read the entry that commit added.
Nothing else links a line to its reason, so an entry that lands in a later commit or a
batch catch-up has broken the path — v1's ledger did exactly that, and its entries sit
beside no change while the changes they describe carry none.

- **Append-only.** A decision that no longer holds is superseded by a new entry, never
  by editing or deleting the old one. Blame lands on the commit that last set the line,
  so it finds the decision currently governing it and supersession needs no bookkeeping.
- **The entry is what was decided, and why.**

## The format of a decision entry

Read the last entry in `DECISIONS.md` before writing a new one and match it.

The heading names the thing decided, not the principle behind it: "Split the nats skill
into nats, workflow, workflow-worker and workflow-handler", not "the mechanics of
communicating are separate from the workflow".

Then two paragraphs. The first is the what, in the active voice — "Split the nats skill
into four", not "the nats skill is split into four". The second is the why: the
reasoning that led to the decision, in plain sentences. Not a description of what now
exists, not the problem that prompted it, not an argument that the decision was right.

Both paragraphs stand on their own. The heading is not the first half of the first
sentence, and neither paragraph is labelled: not `Reason:`, not `What:`, not `Why:`.

The entry ends with `Conversation: <your conversation id>`.

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
