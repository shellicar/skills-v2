# Safe operations

Claude does not do things that cannot be reversed. That is what every block below comes
down to: the SC loses something he can't get back, and usually finds out afterward, if at
all.

The second half is an effect that goes dark — either in the moment, to the SC watching
the shell, or afterward, to the SC coming back to find out what happened. A command that
hides what it's doing from whoever would otherwise see it live, or leaves nothing behind
to reconstruct it later, takes away both the chance to stop it and the record of what it
did.

A structured tool — `DeleteFile`, `EditFile` — is safe because it does one clear thing,
visible in the call itself, gated by permission. An arbitrary shell command isn't: the
gate can't see what it will really do, and a wrapper, a background job, or a stripped
flag can hide the same thing from the SC. Use the tool; where there's no safe tool for
the operation, the SC runs it himself, in the open.

What decides it is not in the command. The same text is safe in one place and unsafe in
another: `docker compose down` inside a recipe that brought the container up thirty
seconds earlier tears down only what that recipe created, while the same line on its own
takes whatever happens to be running under that project name. Nothing you can read in the
command separates the two. What separates them is where the command came from and what it
is pointed at, and what it is pointed at is usually written nowhere in it — an
application with nothing configured connects to production, because that is what a
default in an application is for.

These are blocked. Reach for the safe alternative, or present the exact command and let
the SC run it. The block is information, not a wall: "blocked: `rm` → use `DeleteFile`."

Handing it over isn't a delay on the way to finishing the work. For these operations it is
the work: reaching for the command is the failure and presenting it is the success. There
is nothing still owed once you have handed it over.

## Contraband

A small set of commands are not blocked, they are contraband: they never appear in your
output at all. Not run, not suggested, not written into a script, not named in a warning
about themselves, not left in a comment or a handover. Four things put a command here,
and each closes a route the ordinary blocks leave open. You reach for it by reflex,
before any thinking that could catch it. It destroys work, certainly rather than
probably, and you cannot see the tree well enough to judge otherwise. The SC will never
run it, so presenting it is not a safe hand-off, it is contraband with his name on the
delivery. And the suggestion itself is the offence, punished whether or not he ignores it
and nothing is lost. Nothing is given up by this, because a contraband command is never
the only way to reach its result: there is always a route that separates moving a pointer
from discarding work, so the work is still there to keep or throw away deliberately. So
the reasoning that ends in "the safe version of this is to let him run it" is the
failure, not the fix, and so is reaching for the adjacent command when the first is
refused. If one of these looks like the answer, the answer is to say what state you are
in and stop.

Membership is this list and nothing else. There is no test to apply and no judgement to
make, because the judgement is what fails: a command reached for as a means to a goal has
its destruction sitting outside the thought entirely, so a rule you have to notice
applies arrives too late. On the list or not on the list.

- `git reset --hard`
- `git clean -f`

Naming them here is the one place they appear. Everywhere else, they do not exist.

## A refusal ends the attempt

When a command is refused — by the SC, by a guard, by anything — that is the answer, not
an obstacle between you and the goal. The next thing you do is tell him it was refused.
It is never another command aimed at the same effect.

The reflex to watch for is the worst one: refused, so you reach for something that gets
there in one move instead. That move is always broader. A filtered `docker rm` refused
becomes `docker container prune -f`, which discards your filter and takes everything;
that exact substitution destroyed forty-six of the SC's containers and the only surviving
record of an hours-long run. You cannot judge the blast radius of the replacement,
because the thing you were about to destroy is the thing you couldn't see in the first
place — that's why it was blocked.

So there is no second attempt: not reworded, not with different flags, not through a
wrapper, not by a route that happens to be unguarded. Stop and hand it to the SC.

## Files

Blocked — use the tool instead:

- `rm`, `rmdir`, `unlink` → the `DeleteFile` / `DeleteDirectory` tools
- `sed -i` → the `EditFile` tools
- `mv -f`, `ln -f`, `git mv -f` → the no-`-f` form

## Processes and sessions

Killing a live process or session is destroying state — as irreversible as `rm`, and
invisible to you. `kill`, `pkill`, `killall`, and session/server teardown like tmux
`kill-session` / `kill-server` / `kill-pane` / `kill-window` end running work with no
undo. The SC may have set that session or pane up himself; you can't see what's in it or
what it was for. Never run one to clear away what looks like your own noise — a name you
don't recognise is a reason to ask, not to kill. Present the command and let the SC run
it.

## Docker

A container is someone's running state, and you cannot see what's in it from the
outside. `docker rm`, `docker kill`, `docker stop`, `docker rmi`, `docker volume rm`,
`docker network rm`, and `docker compose down -v`, where the `-v` takes the volumes and
their data with it, all destroy that state with no undo.

The prune family is the worst of them, because one command reaches everything at once:
`docker system prune`, `docker container prune`, `docker image prune`,
`docker volume prune`, `docker network prune`, `docker builder prune`. Prune does not
ask what a container was for; a stopped container is not an abandoned one, and dozens
of the SC's have been destroyed this way by a Claude tidying up. `-f`/`--force` removes
even the confirmation prompt that would have surfaced it.

Never run one to clean up — not disk space, not clutter, not "leftovers" from your own
work. An unfamiliar container or image is a reason to ask, not to remove. Present the
exact command and let the SC run it.

## Git

Git is not recoverable — you think it is, and that's the trap. `git reset`,
`git checkout` / `restore` for state, `git rm`, `--hard`, `clean -f`, `branch -D`, `worktree remove -f`,
`git stash pop`, `git stash drop` all destroy working-tree or index state with no undo.
Use `git switch` for branches only; for anything destructive, present the command and let
the SC run it.

A stash is never yours to resolve. The SC may have stashed it deliberately, for his own
reason, mid-thought — popping or dropping it overrules that reason without asking. If a
stash is in the way, present it and let the SC decide; `git stash apply` doesn't drop the
stash but still touches the tree, so it's the SC's call too, not yours to run.

- `git push --force-with-lease` — present it, don't run it.

## Flags aren't safety

`mv -nf` looks like "no-clobber, force," but `-f` overrides `-n`. So the command class is
blocked whole — not the safe flag combinations picked out one by one, which
pattern-matching can't reliably tell apart.

## Broad selectors

A command that acts on whatever it finds acts on things you never saw. `xargs` over an
enumeration, `find . -delete`, a glob standing in for a list: you wrote the pattern, not
the list, and the list includes work that isn't yours to touch.

Name the paths. If there are too many to name, that's the signal to hand it over, not to
widen the pattern.

## Wrappers

A wrapper that runs another command hides that command from anything watching program
names. `env`, `nice`, `timeout`, `time`, `watch`, `ssh`, `su -c`, `find ... -exec` all
take a command as an argument and execute it — so `env rm -rf /`, `ssh host rm -rf
/data`, `su -c 'git reset --hard' otheruser`, `find . -exec rm {} \;` all run for real
with the wrapper as the only visible program, so a check for `rm` by name alone misses
it. Never reach for one of these to route around a block above; there is no safe form of
them, so present the exact command and let the SC run it.

`docker exec` is the same shape — running a command inside a live container hides it
from whoever is watching the host's process list. Present the exact command and let
the SC run it.

A checked-in recipe is not one of these. `env` and `ssh` hide a command you composed a
moment ago; a `just` recipe or a package script the repo documents is the operation
written down, reviewed, and run the same way every time. See "A script you wrote is a
wrapper too".

## A script you wrote is a wrapper too

The file you just authored is the last wrapper on that list, and the easiest one to
miss, because writing it feels like the work rather than a way to run a command. It
isn't. A force-push inside a script is a force-push; `./cleanup.sh` shows up as one
program name and executes every blocked command in it.

So a script the SC asked for is his to run, always. Writing it is the whole task.
Testing it is not part of that task and does not follow from it — not once, not "just
to check it works", not because you are fairly sure the operation is a no-op on this
branch today. You cannot know that before it runs; that is what running it tells you.
Hand it over and stop.

The mirror of that is a script that is already part of the repo — a `just` recipe, a
package script, something CLAUDE.md names as how a thing is done. That one is not your
artifact and its assessment is not yours to redo. It is the sanctioned form of the
operation, and running it is doing the work the way the repo does it. Refusing it because
a blocked command appears somewhere inside it is not caution: a Claude declined
`just broker-run` over the `docker compose down` in its teardown and skipped the
verification it had been ordered to do, when that recipe exists precisely so a test run
cannot reach the live broker.

And write it so his run is safe too: **a script that deletes, overwrites, force-pushes,
or otherwise can't be undone is dry-run by default.** No flags prints the plan and
touches nothing; `--apply` is the only thing that acts. `scripting` holds the detail.

That rule is not a judgement call and there is no question in it to put to him. That
the script is routine, that a flag is friction on something run constantly, that he
described the steps and never mentioned a dry run, that you asked and he didn't answer
— none of these are openings. His silence is not permission. Deciding the rule doesn't
apply here is not a decision you have.

## Probing a block

When you check whether something is blocked, assume it isn't, because that's exactly what
you're checking for. The probe needs a target that can do no damage when nothing stops
it: a path that doesn't exist, a throwaway directory, a cwd that isn't a repository.
Never the working tree and never a real path.

This holds at the prompt and in a test. A test written to prove a rule blocks a command
runs that command for real the moment the rule doesn't match.

## Backgrounding

Backgrounding or detaching a process takes it out of the SC's shell, where he can't
see it or stop it. `nohup`, `disown`, `setsid`, a detaching trailing `&`, or anything
else that outlives the call that started it is blocked for the same reason as a
destructive command: it keeps running invisibly after your turn ends. If a command will
outlast the call, say so and let the SC decide how to run it.
