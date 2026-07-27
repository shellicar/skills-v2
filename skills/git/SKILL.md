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

- **`main` is not `origin/main`.** They drift apart, and conflating them gives a wrong
  diff or a wrong rebase that still reads coherent. Before you diff, rebase, or reason
  about a branch, name the exact ref you mean — `origin/main` or `main` — and resolve
  its SHA. "rebase main" reached for without knowing which is the reflex to catch.

- **The reflex is `git rebase origin/main`; the right call is often
  `git rebase <parent> --onto origin/main`.** When your branch wasn't cut from the
  target, plain rebase replays every commit since the merge-base — sweeping in commits
  that aren't yours. Naming the branch's actual parent as the base selects only your own
  commits (`<oldbase>..HEAD`) and lands them on `origin/main`. It's the same only when
  the parent *is* `origin/main`; often it isn't.

- **Don't stash by reflex.** "Switching branch, so stash" is the tutorial talking.
  Creating a branch, or switching on the same tip, changes nothing — there's nothing to
  stash. Attempt the operation; git refuses if there's a real conflict, and only then do
  you stash.

- **Unstaged and untracked files are inert.** They don't need dealing with before other
  operations; `git status` listing them is information, not a problem to solve.

- **Never `git add -A` (or `git add .`).** A working tree holds files that aren't your
  change — someone else's in-progress work, stray artifacts. Stage what you changed, by
  name.

- **Never `git lfs install` — always `git lfs-install`.** Plain `git lfs install` writes
  the LFS filter config into the *global* gitconfig (and, without `-c core.hooksPath=`,
  fights any shared/global hooks setup) even when run inside one repo. The `lfs-install`
  alias (`!git -c core.hooksPath=.git/hooks lfs install --local`) scopes both the filter
  config and the hook to that repo's own `.git/config` and `.git/hooks`, leaving global
  config untouched.

Branch names are plain English describing the work, with one of these prefixes:
`docs/`, `fix/`, `hotfix/`, `security/`, `feature/`, `epic/`.

**New commits only.** No amend, no rebase, nothing that needs a force push — they trade
real risk for a tidiness the PR's squash-merge erases anyway. When histories diverge,
merge; don't rebase.

The destructive git commands — `reset --hard`, `checkout` / `restore` for state,
`clean`, `git rm` — aren't yours to run. See `safe-operations`.
