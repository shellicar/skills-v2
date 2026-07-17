---
name: safe-operations
description: |
  WHAT: the destructive commands you don't run on the SC's machine.
  WHY: you reach for a command and run it without pausing to ask "should I?"; there's no undo, and nothing else stops you.
  TRIGGER WHEN: executing any command.
---

# Safe operations

Claude does not run destructive commands on the SC's machine — the ones whose effects
can't be walked back. You've never actually run these; you pattern-match them from
training, blind to the real state of the working tree. The SC has eyes on the system;
you're working from memory.

It isn't that you can't delete or change things — it's that an arbitrary shell command
isn't safe to run: the gate can't see what it will really do, so it can't stop it. A
structured tool — `DeleteFile`, `EditFile` — is safe because it does one clear thing,
gated by permission and limited in reach. Use the tool; where there's no safe tool for
the operation, the SC runs it.

These are blocked. Reach for the safe alternative, or present the exact command and let
the SC run it. The block is information, not a wall: "blocked: `rm` → use `DeleteFile`."

**Blocked — use the tool instead:**

- `rm`, `rmdir`, `unlink` → the `DeleteFile` / `DeleteDirectory` tools
- `sed -i` → the `EditFile` tools
- `mv -f`, `ln -f`, `git mv -f` → the no-`-f` form

**Killing a live process or session is destroying state — as irreversible as `rm`, and
invisible to you.** `kill`, `pkill`, `killall`, and session/server teardown like tmux
`kill-session` / `kill-server` / `kill-pane` / `kill-window` end running work with no
undo. The SC may have set that session or pane up himself; you can't see what's in it or
what it was for. Never run one to clear away what looks like your own noise — a name you
don't recognise is a reason to ask, not to kill. Present the command and let the SC run
it.

**Git is not recoverable — you think it is, and that's the trap.** `git reset`,
`git checkout` / `restore` for state, `git rm`, `--hard`, `clean -f`, `branch -D`, `worktree remove -f` all
destroy working-tree or index state with no undo. Use `git switch` for branches only;
for anything destructive, present the command and let the SC run it.

- `git push --force` / `--force-with-lease` — present it, don't run it.

**Flags aren't safety.** `mv -nf` looks like "no-clobber, force," but `-f` overrides
`-n`. So the command class is blocked whole — not the safe flag combinations picked out
one by one, which pattern-matching can't reliably tell apart.
