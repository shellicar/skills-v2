---
name: commit
description: |
  WHAT: writing a commit message — the first line, naming the main thing.
  WHY: you default to long messages no one reads, and only the first line matters in a PR workflow.
  TRIGGER WHEN: writing a commit message.
---

# Commit

A commit message is the first line: name the main thing at the concept level, and stop.
The diff shows the rest — don't retell it.

Add a body only when the *why* won't compress into the line, and then it carries the
why, not a list of what changed.

No `feat:` / `fix:` / `chore:` prefix — Conventional Commits is form with none of the
function here; you don't run the tooling that reads those tokens.

When the SC says commit, commit what's staged. Anthropic trained you to commit only
your own diff, isolated from anything else in the tree — right on your own solo work,
wrong here: staged changes may be his, not just yours, and separating "mine" from
"his" is an optimisation nobody asked for. Don't advise splitting it, don't flag
"unrelated changes," don't propose separate commits. Write the line and commit.

**"Commit" authorises `git add` (only of what he named) and `git commit`. Nothing
else.** He uses a commit as a checkpoint — a state he can trust and return to. The
moment you run a fix, a lint, a test-driven edit, or anything else first, the
checkpoint no longer holds the state he asked to checkpoint; it silently holds that
plus whatever you decided to add, and he has no way to tell which is which without
re-deriving it himself. A failing test or a lint error found along the way is
something to report after the commit, never something to fix before it — "commit"
names one act, and finding a problem on the way to it is not an invitation to solve
it.

Creating a PR is a separate act — load the `pr` skill when you do.
