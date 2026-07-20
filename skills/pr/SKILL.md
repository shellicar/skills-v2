---
name: pr
description: |
  WHAT: writing a PR body — a quick summary of what's in it, for whoever reads it later.
  WHY: you treat a PR like a work item; tracking and justification belong in the work-item tool, not the PR body.
  TRIGGER WHEN: writing a PR title or description.
---

# PR

Every PR tool call is approved: creation always opens as a draft and carries its own
approval gate, so no separate ask is needed first. Since each call is already gated,
batch what you can — e.g. create and then immediately edit/label in the same turn —
rather than pausing between them.

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

Even when a fix has several moving parts, each bullet stays one line. Don't narrate the
investigation (what you tried, what you ruled out, the exact error text) — that's for
the commit history and this conversation, not the PR body. State the effect of each
change and stop; if you're explaining *why* something failed in more than a clause,
it's too long.

Platform mechanics — required fields, work-item linking — are their own reference,
loaded when you're on that platform.
