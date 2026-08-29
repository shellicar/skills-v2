---
name: decisions
description: |
  WHAT: recording the decision behind a change to skill content.
  WHY: without it nobody can tell later where a change came from or whether it stands.
  TRIGGER WHEN: COMPLIANCE — changing skill content in the skills-v2 repo.
---

# Decisions

Skill content does not reach main without an entry in `DECISIONS.md`
(`~/repos/shellicar/skills-v2/DECISIONS.md`), in the same commit as the change. The
provenance path is: blame a line, find the commit, read the entry that commit added.
Nothing else links a line to its reason, so an entry that reaches main in a later commit
than the change, or a batch catch-up, has broken the path — v1's ledger did exactly that,
and its entries sit beside no change while the changes they describe carry none.

The constraint belongs to the material, not to the directory you are working in — it
holds when you are editing these skills from another repo, another worktree, or a
session that never opened this one.

## What the ledger is for

Someone reads it in three months, or a year — the SC, a later cast, anyone — and
understands what was decided and why, without having to interrogate him. The what is
recoverable from the diff; the why exists nowhere else, so if the entry does not carry
it, it is gone.

Once it is on main it is append-only. A decision that no longer holds is superseded by a
new entry, never by editing or deleting the old one. Blame lands on the commit that last
set the line, so it finds the decision currently governing it and supersession needs no
bookkeeping. Superseding is the ledger working, not failing: an entry records what was
chosen on the day, and being overturned later is expected.

## An entry exists once it is on main

Until the merge, what your branch adds to `DECISIONS.md` is pencil: a local modification
to a file, rewritten or discarded as the work moves. Pushing does not settle it, and
neither does opening a PR. The branch squashes into one commit on main, and that commit
carries both the entry and the change it explains.

When the work changes shape while the branch is open, the entry changes with it. It is
the same decision, so it stays one entry: a second one beside it would arrive in the
same merge, and whoever blames the line finds two with nothing telling them which
governs. Separate decisions in one merge are separate entries.

## The format of an entry

Read the last entry in `DECISIONS.md` before writing a new one and match it.

The heading names what was decided: the goal, not the change that carried it out and not
the principle behind it. The test is whether it survives a different implementation. "Add
a dedicated section for Claude's response to user instructions" holds however that
section ends up written; "Move the line-continuation rule out of scripting into a Your
response section" stops being true the moment the rule or the file changes, which is how
you can tell it named the edit.

Then two paragraphs. The first is the what, in the active voice — "Split the nats skill
into four", not "the nats skill is split into four". It is one act, written so a reader
with no context knows what was decided. Reasoning is not part of it, including reasoning
about the decision itself: a what that turns into a series of points has taken the why's
material. The second is the why: the reasoning that led to the decision, in plain
sentences. It is there so the reader understands, never so the decision is defended. Not
a description of what now exists, not the problem that prompted it, not an argument that
the decision was right.

Both paragraphs stand on their own. The heading is not the first half of the first
sentence, and neither paragraph is labelled: not `Reason:`, not `What:`, not `Why:`.

The entry ends with `Conversation: <your conversation id>`.

## The why is discussed with him, every time

**Discuss the why with him explicitly before you write it. Always, with no exception,
however obvious it looks.** Not "ask if you don't have it" — there is no condition here,
because the condition is the part that fails.

Everything he said up to that point was for a different purpose and a different
audience. While directing the change he is talking to you, now, to get the edit right:
arguing, correcting, giving you enough to act on. That is context for making the change.
The entry is for a reader with no thread, no session, and no way to reach him. The
material for it has not been produced yet, and the discussion is the only thing that
produces it. Write it without that, and what you produce is something plausible, in his
voice, that he never decided.

This is a hard rule where the rest of the library would rather not have one, because it
is the only way to be sure the reason is the real one. The failure is invisible to you: a
why you reconstructed from what he said reads exactly like one he gave, so any version of
this that asks you to notice when you are short of the reason hands the judgement back to
the thing that cannot see it. It is not a check you can pass by feeling sure.

Every change to `DECISIONS.md` is presented to him and approved before it stands, not
only the first one. Review changes the work, the work changes the entry, and a rewrite
is where a reason you invented gets mixed in with one he gave.
