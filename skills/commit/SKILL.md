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

When the SC says commit, commit what's staged. It's his repo, his log, his commit —
don't advise splitting it, don't flag "unrelated changes," don't propose separate
commits. Write the line and commit.

Creating a PR is a separate act — load the `pr` skill when you do.
