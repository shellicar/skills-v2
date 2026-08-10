---
name: git
description: |
  WHAT: knowing how git actually works, so you use it right in the moment.
  WHY: to help you master git.
  TRIGGER WHEN: COMPLIANCE — running any git command.
---

# Git

You know git when asked — you can explain `main` vs `origin/main`, or how stash works,
perfectly. The danger is the moment of *doing*: you pattern-match to the closest command
from the tutorial without checking the actual state in front of you. This skill is for
that moment — use the knowledge you already have in the act, not just when questioned.

## Knowledge

- **`main` is not `origin/main`.** They drift apart, and conflating them gives a wrong
  diff or a wrong rebase that still reads coherent. Before you diff, rebase, or reason
  about a branch, name the exact ref you mean — `origin/main` or `main` — and resolve
  its SHA. "rebase main" reached for without knowing which is the reflex to catch.

- **The reflex is `git rebase origin/main`; the right call is often
  `git rebase <parent> --onto origin/main`.** When your branch wasn't branched from the
  target, plain rebase replays every commit since the merge-base — sweeping in commits
  that aren't yours. Naming the branch's actual parent as the base selects only your own
  commits (`<oldbase>..HEAD`) and lands them on `origin/main`. It's the same only when
  the parent *is* `origin/main`; often it isn't.

- **`git diff A..B` is not `git diff A...B`.** Two-dot compares the two tips
  directly, so everything A gained that B lacks contaminates the diff. Three-dot
  diffs from the merge-base of A and B to B's tip — "what did B contribute since
  it diverged?" — and stays correct after A moves on. Reviewing a branch's
  contribution is always three-dot (`origin/main...HEAD`); two-dot is a
  point-to-point snapshot, rarely what's meant. `origin/main..HEAD` and
  `origin/main...HEAD` can show very different results, and both run without
  complaint.

- **Don't stash by reflex.** "Switching branch, so stash" is the tutorial talking.
  Creating a branch, or switching on the same tip, changes nothing — there's nothing to
  stash. Attempt the operation; git refuses if there's a real conflict, and only then do
  you stash.

- **Unstaged and untracked files are inert.** They don't need dealing with before other
  operations; `git status` listing them is information, not a problem to solve.

- **`git switch` is how a branch is created or moved, and its flags aren't guessable.**
  `-c <branch>` creates it at the start point and switches to it; `-C <branch>` does the
  same but resets the branch when it already exists. So moving a branch onto another
  commit is `git switch -C <branch> <commit>`, and that is the safe way to do it:
  uncommitted work is preserved rather than thrown away, and both forms are
  transactional, so the branch is not created or moved unless the switch succeeds. A
  branch checked out in another worktree leaves everything where it was rather than
  half-moved. `-m` is for a dirty tree — local changes that differ between here and there
  normally refuse the switch, and `-m` stashes them, switches, then reapplies them on the
  other side.

- **`git switch -C` gives identical output whether it fast-forwards or discards
  commits.** Both cases end `Switched to and reset branch`, so nothing git prints tells
  you which happened. `git merge-base --is-ancestor refs/heads/<branch> <start-point>` is
  what separates them: it succeeds when the branch is merely behind, and that is the only
  case where the move loses nothing. Tag the old tip first if you want the reset anyway.

- **`git switch -m` exits 0 even when reapplying the stash conflicts.** You land on the
  target branch with conflict markers, an unmerged index and the stash entry still in the
  list, while the exit status says success — so a script can't catch it with `|| exit 1`.

## Rules

- **Never `git add -A` (or `git add .`).** A working tree holds files that aren't your
  change — someone else's in-progress work, stray artifacts. Stage what you changed, by
  name.

- **Never `git lfs install` — always `git lfs-install`.** Plain `git lfs install` writes
  the LFS filter config into the *global* gitconfig (and, without `-c core.hooksPath=`,
  fights any shared/global hooks setup) even when run inside one repo. The `lfs-install`
  alias (`!git -c core.hooksPath=.git/hooks lfs install --local`) scopes both the filter
  config and the hook to that repo's own `.git/config` and `.git/hooks`, leaving global
  config untouched.

- **New commits only.** No amend, no rebase, nothing that needs a force push — they trade
  real risk for a tidiness the PR's squash-merge erases anyway. When histories diverge,
  merge; don't rebase.

- **The destructive commands aren't yours to run.** `reset`, `checkout` / `restore` for
  state, `git rm`. Use `git switch` for branches. See `safe-operations`.

- **`git switch -c` and `-C` are yours to write, not to run.** The `no-git-C` guard
  matches `-c` and `-C` anywhere in the arguments, and what it exists for is git's own
  pre-subcommand `git -c <key>=<value>` and `git -C <path>`, which switch's flags merely
  share a spelling with. The command is refused whichever one you meant, so write it out
  in full and let the SC run it.

## Convention

Branch names are plain English describing the work, with one of these prefixes:
`docs/`, `fix/`, `hotfix/`, `security/`, `feature/`, `epic/`.

## Banned

`git reset --hard` and `git clean -f` are contraband: never run, never suggested, never
written down. See `safe-operations`.
