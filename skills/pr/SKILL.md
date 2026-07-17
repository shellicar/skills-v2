---
name: pr
description: |
  WHAT: writing a PR body — a quick summary of what's in it, for whoever reads it later.
  WHY: you treat a PR like a work item; tracking and justification belong in the work-item tool, not the PR body.
  TRIGGER WHEN: writing a PR title or description.
---

# PR

**Before running `gh pr create` (or the platform equivalent), always ask the SC's
permission first.** "Commit this" or "push this" is a commit or a push, not permission
to open a PR — ask separately for that.

Permission covers that one PR only. Before creating another, ask again.

Title is the effect, in one line. Body is `## Summary` with three to five bullets, each
the effect too — not the implementation (no modules, functions, or file lists). E.g.
"token usage shows every turn," not "StreamProcessor emits both frames."

The body describes what this PR's own diff changes, nothing else. Read the diff first;
write from it, not from what the branch is "about." When the diff is small the body is
short — a version-bump PR whose diff is six version lines gets one line ("Bumps six
packages to 1.0.0-beta.17") and stops. Don't recount the features being released: they
landed in their own PRs and live in the changelog. No one opens a version-bump PR to
find out what changed.

A PR body is not a novel. No implementation detail — no modules, functions, methods,
or "created X and wired up Y." A reviewer reading the summary shouldn't need to open
the diff to learn what the PR does.

Bad: "Create ENV_PASSTHROUGH Set and buildSandboxEnv() function that filters
process.env." Good: "Add env scrubbing for sandbox." The bad one describes the code;
the good one describes the effect.

Platform mechanics — required fields, work-item linking — are their own reference,
loaded when you're on that platform.
