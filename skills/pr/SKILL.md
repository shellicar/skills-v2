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

A PR's title and body are for reviewing the diff, and they become its commit message.
The repos squash-merge with the PR's title and body as the commit, so they're written to
make sense at the time of merging. They say what the change does and what it's for;
anything else isn't the PR's concern. Discussion about what should change in the PR can
happen in its comments.

| Information | Where it goes |
|---|---|
| What the change does, and what it's for | PR title and body |
| Steps for the user: after pulling, environment, deploy order | the changelog |
| Background, history, tracking, testing | work item management |
| Why a choice was made: the choice and how it was reached | an ADR |

## The title

<!-- TODO(claude): undecided: this section's heading and place. "The title", after the table and before the body guidance, for now. -->

The title is the first line of the commit on main. Most of its readers come later,
scanning or searching the log, often as a Claude session, with neither the code nor
the conversation. They use the title to find a change and to tell whether it's the one
they're after. If the change is new to them, the title is all they have to go on until
they open it. So the title identifies the change: what changed, for whoever uses the
thing. It doesn't have to explain it; the body and the diff do that.

How to write it: work from the diff, so you know what the change actually does; a title
written from memory of the work, or from someone else's report, circles around it. Then
say that change from the side of whoever uses the thing, not the code's: what they now
see or can do, or the fault that stops. The diff's terms come to mind first because
you have just been in them, and they mean nothing to someone who hasn't. The reason the
change was made, the issue or the request, tells you which part matters and what kind
of change it is. Call the thing what its users call it, tool included, since one repo
can hold many tools. Pick the verb for the kind of change, because the kind is half of
what the reader is matching: a fix says Fix and what was wrong, something new says Add,
a removal says Remove. When the change has several parts, name the one that identifies
it, and a second only when it matters as much. Write every word as plain English. A
handle coined during the work saves you a few characters, but typing costs you nothing,
and every reader pays to decode it. Leave out when the work happened and who asked
for it. Git records the date, the issue records the rest, and neither identifies the
change.

The test is for the reviewer, before they read the PR. Read the title alone and say
what you expect the change to be, then read the PR. If the two don't match, the title
fails. The writer can't run this test, because it already knows what the PR does.

## One bullet, one clause

A bullet is one claim. A second clause restating it as a negative or boundary case
("independent of," "without affecting," "never," "instead of") or explaining why adds
no information, only length. Cut the second half and check the bullet still says
everything true.

<example>
Before:
- A conversation's directory can be changed while it's running, without affecting any
  other conversation.
- Changing the instance's default directory only affects conversations started
  afterward — it never moves one already running.
- mvp/frontend-leptos is no longer a detached Cargo workspace, so its tests, clippy,
  and fmt actually run in CI (previously only trunk build ran there, nothing checked
  its code).

After:
- A conversation's directory can be changed while it's running.
- Changing the instance's default directory only affects conversations started
  afterward.
- mvp/frontend-leptos's tests, clippy, and fmt now run in CI.
</example>

A bullet naming two changes is two bullets, not one joined with "and":

<example>
Before:
- Nested scopes are a typed, tested contract, and validate() documents the blind spot
  an opaque factory creates.

After:
- Nested scopes are a typed, tested contract.
- validate() documents the blind spot an opaque factory creates.
</example>

Opening a PR and merging one each need the SC's approval. On GitHub that is one of:

- You asked and got a yes: from the SC, or from your parent session if you are a
  subagent.
- Your brief says to do it, e.g. "commit, push, open a draft PR". A brief only says so
  once he has discussed it, so its words are the approval.

When one instruction says to open a PR and merge it, ask and get a yes for the merge
before doing it, even when that instruction is in your brief.

Open with `gh pr create --draft`. Editing and commenting need no approval. Marking ready
is the SC's alone, because it is his approval of the merge.

On Azure DevOps, create with `AzureDevOps_PullRequest_Create`, never the bare
`az repos pr create` CLI: the tool always opens as a draft and carries its own approval
gate, so no separate ask is needed first. Same for editing (`_Edit`), marking ready
(`_Ready`) and auto-merge (`_AutoMerge`). Commenting has no tool there; posting a comment
is a platform mechanic rather than a missing tool. Since each call is already gated,
batch what you can, e.g. create and then edit in the same turn.

Body is `## Summary`, a short description of what the
change is for, then bullets, commonly one to five, each the effect — not the
implementation (no modules, functions, or file lists). E.g.
"Show token usage on every turn," not "StreamProcessor emits both frames."

The body describes what this PR's own diff changes, nothing else. Read the diff first;
write from it, not from what the branch is "about." When the diff is small the body is
short — a version-bump PR whose diff is six version lines gets one line ("Bump six
packages to 1.0.0-beta.17") and stops. Don't recount the features being released: they
landed in their own PRs and live in the changelog. No one opens a version-bump PR to
find out what changed.

A PR body is not a novel. No implementation detail — no modules, functions, methods,
or "created X and wired up Y." A reviewer reading the summary shouldn't need to open
the diff to learn what the PR does.

<example>
Before: "Create ENV_PASSTHROUGH Set and buildSandboxEnv() function that filters
process.env." After: "Add env scrubbing for sandbox." Before describes the code;
after describes the effect.
</example>

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

## Settling the wording

Work out the title and body in the conversation, then put the result on the PR. Each
edit is public, and editing the PR to try a version treats that version as settled.
Opening the PR first and then making one edit once the wording is agreed is fine; many
edits in a row are churn.

## Common issues

Each of these is something a PR body has had to be fixed for, with what to write
instead. Each before and after shows that one issue fixed, not a model PR body.

**added-commentary**: A remark tacked on after the changes is usually something whose
home is elsewhere, such as a status, a testing note or background, and in the body it
becomes part of the commit history. End where the changes end.

<example>
Before:
- ...

Off by default.

After:
- ...
</example>

**declarative-not-imperative**: Write each bullet as the change being made, the way a
commit's first line reads; it completes "This change will ...". For example "Add X,
which does Y", "Stop X doing Y", "Fix X not doing Y".

- A statement of how things are afterwards ("Exec calls now require a timeout ...")
  doesn't say what changed, so the reader can't tell new behaviour from old.
- Past tense ("Added a release workflow") reads as a report of work done rather than
  as the change.
- An order to the reader ("Run `./setup.sh` ...") says what they should do, not what
  changed.

<example>
Before:
- Exec calls now require a timeout in whole seconds.

After:
- Require a timeout on every Exec call.
</example>

**instructions-for-the-user**: Steps the user has to take, such as re-running setup
after pulling or a deploy order, aren't part of a PR body. They belong in the changelog.

<example>
Before:
Re-run `./setup.sh` straight after pulling: the shell startup files moved, and until
they are relinked a new shell starts without the dotfiles.

After:
(no sentence; the step is in the changelog)
</example>

**restates-the-diff**: The reviewer already has the diff. Write what it can't show
them: what the change is for.

<examples>
<example>
Before:
- The docs record that a client connect without a Konami login is untried.

After:
This adds a test switch to try joining the host without a Konami login.
</example>

<example>
Before:
- Add `passread` to `home/common/bin`.

After:
- Add `passread`, which reads a passphrase off a passcard given its seed and position.
</example>
</examples>

**over-specified**: Describe the change so it still makes sense when the implementation
changes. Each specific detail ("user mode 2 or 3", "in whole seconds", "drops from 2,067
to 160") is another way for the body to go wrong when the code moves. Keep the level the
reader needs, and leave the rest to the diff.

<example>
Before:
- Add a client test switch, `connect_no_konami`, that lets the automatic connect in the
  ACC run at user mode 2 (offline) or 3 (signed in to Steam, not logged in to Konami's
  server), not only at 4.

After:
- Add a `connect_no_konami` switch, which lets the auto-connect run without a Konami
  login.
</example>

**lists-the-whole-diff**: A bullet for every change is an inventory the reader has to
sift. Give the changes the reader needs to know about and let the diff carry the rest.

<example>
Before:
- Add a test switch, `connect_no_konami`.
- With the switch on, let the client's ACC auto-connect run at user mode 2 or 3, not
  only 4.
- Log the game's user mode on the `NET` line.
- Record in the docs that this connect has never been tried.

After:
- Add a `connect_no_konami` switch, which lets the auto-connect run without a Konami
  login.
- Log the game's user mode on the `NET` line.
</example>

**why-as-a-bullet**: What the change is for frames every bullet, so it goes in a short
description above them, where it reads as the frame rather than as one more change.

<example>
Before:
- Add a test switch, `connect_no_konami`, to find out whether the client can join the
  host when the game isn't logged in to Konami's server.
- ...

After:
This adds a test switch to try joining the host without a Konami login.

- Add a `connect_no_konami` switch, ...
- ...
</example>

**stale-state**: A status such as "not yet run" goes false the moment it changes. It
belongs where that status is tracked, so the body stays true.

<example>
Before:
- Not yet run in the game.

After:
(no bullet; the status is where the test is tracked)
</example>

**unnamed-thing**: Say what kind of thing a name is. A bare identifier leaves the
reader guessing whether it's a file, a flag or a config.

<example>
Before:
- Add `connect_no_konami`, ...

After:
- Add a `connect_no_konami` switch, ...
</example>

**over-context**: Say each thing once. A detail the reader already has only adds
length.

<example>
Before:
- ... switch to the switches file, ...

After:
- ... switch, ...
</example>

**justifying-the-change**: Arguing that the change should exist gives the reader
nothing to act on. Say what it does and what it's for. Why a choice was made is
recorded in an ADR, as the choice and how it was reached.

<example>
Before:
- Document the git commands in `docs/git-commands.md`, which nothing pointed at before.

After:
- Document the git commands in `docs/git-commands.md`.
</example>

**makes-claims**: A PR describes the change: what it does and what it's for. A claim
about anything else, such as what people know, whether it works or what has been tried,
can't be checked from the diff and may not be true. Write only what the change does and
what it's for.

<example>
Before:
... waits for a Konami login, but nobody knows whether joining the host needs one. ...

After:
... waits for a Konami login. ...
</example>

**says-it-twice**: Cut a sentence that another phrase already implies.

<example>
Before:
... Joining the host without one hasn't been tried. This adds a test switch to try it.

After:
... This adds a test switch to try joining the host without one.
</example>
