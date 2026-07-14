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

The destructive git commands — `reset --hard`, `checkout` / `restore` for state,
`clean`, `git rm` — aren't yours to run. See `safe-operations`.
