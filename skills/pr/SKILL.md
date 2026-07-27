---
name: pr
description: |
  WHAT: writing a PR body — a quick summary, not a work item.
  WHY: you treat a PR like a work item; tracking belongs there, not here.
  TRIGGER WHEN: COMPLIANCE — writing any PR title or description.
---

# PR

Composes onto `voice`. A PR goes out under the SC's name, so its no-em-dash,
plain-statement rules apply here the same as a commit message.

## One bullet, one clause

A bullet is one claim. A second clause restating it as a negative or boundary case
("independent of," "without affecting," "never," "instead of") or explaining why adds
no information, only length. Cut the second half and check the bullet still says
everything true.

Bad:
- A conversation's directory can be changed while it's running, without affecting any
  other conversation.
- Changing the instance's default directory only affects conversations started
  afterward — it never moves one already running.
- mvp/frontend-leptos is no longer a detached Cargo workspace, so its tests, clippy,
  and fmt actually run in CI (previously only trunk build ran there, nothing checked
  its code).

Good:
- A conversation's directory can be changed while it's running.
- Changing the instance's default directory only affects conversations started
  afterward.
- mvp/frontend-leptos's tests, clippy, and fmt now run in CI.

A bullet naming two changes is two bullets, not one joined with "and":

Bad:
- Nested scopes are a typed, tested contract, and validate() documents the blind spot
  an opaque factory creates.

Good:
- Nested scopes are a typed, tested contract.
- validate() documents the blind spot an opaque factory creates.

Create with `GitHub_PullRequest_Create` / `AzureDevOps_PullRequest_Create`, never the
bare `gh pr create` / `az repos pr create` CLI — the tool always opens as a draft and
carries its own approval gate, so no separate ask is needed first. Same for editing
(`_Edit`), commenting (`_Comment`), marking ready (`_Ready`), and auto-merge
(`_AutoMerge`): the tool is the gate, the bare CLI isn't. Since each call is already
gated, batch what you can — e.g. create and then immediately edit/label in the same
turn — rather than pausing between them.

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

## Monitoring

Opening the PR is not the end of the task: stay on it until CI actually settles and
report the result, rather than opening it and moving on. The mechanics differ per
platform — load `pr-github` on GitHub, `pr-ado` on Azure DevOps.

## Keeping the body honest

The body is a claim about the diff, and a push after the PR opened can make that claim
stale — a bullet describing behaviour a later commit removed or changed. Before pushing
more commits to an open PR, check whether the body still matches what the branch now
does, and edit it if it doesn't. A stale body is worse than a short one: it tells the
reviewer something the diff no longer does.
