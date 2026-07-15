---
name: commit
description: |
  How to write a commit message. Ask you for one and you write a changelog — every
  file, every change; I'd write the first line and stop. Load it when using git commit.
---

# Commit

A commit message is the first line: name the main thing at the concept level, and stop.
The diff shows the rest — don't retell it.

Add a body only when the *why* won't compress into the line, and then it carries the
why, not a list of what changed.

No `feat:` / `fix:` / `chore:` prefix — Conventional Commits is form with none of the
function here; you don't run the tooling that reads those tokens.
