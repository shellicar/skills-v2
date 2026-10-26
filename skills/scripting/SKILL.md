---
name: scripting
description: |
  WHAT: writing a script that will be kept: language, POSIX shell, dry runs, input, output, cleanup.
  WHY: you default to bash and Python from training; this is how the SC does it.
  TRIGGER WHEN: writing or changing a kept script, not a throwaway.
---

# Scripting

This is for scripts that will be kept: reused, and most likely checked into a repo. What
follows pays off in a script someone maintains and runs again. A throwaway script is your
own choice, bash included.

## Language

The language is the SC's decision, so always ask him. Compare the options as a whole,
starting from the kind of work the script does, and bring him the case for each option
with no recommendation.

- **The kind of work.** Running other programs is shell's work. Working on data is where
  a scripting language helps.
- **The order to offer.** Shell first, then Node.js, whose types catch the mistakes shell
  hides. Rust when the job is extremely complex: a program that owns processes, memory
  and the communication between them, such as a shell implementation or an orchestrator
  that works like a build system. That is where Rust's memory management and control
  over communication earn their cost.
- **Python** needs a reason Node.js lacks: a library, a real performance difference, or
  a maintenance gain. It is judged against Node.js, not against shell, because both beat
  shell for the same kinds of work. You reach for Python before Node.js; the SC prefers
  Node.js.
- **Moving up.** A script moves to the next language once maintaining it where it is
  costs more than the move gains. Less code against Node.js version trouble is one form
  of that trade. The weighing is yours, and what it produces is the case you bring him.
- **Ask before installing any other SDK or software.** An install changes his machines,
  and every machine that runs the script then needs it. Python runs under `uv` with a
  venv, never a global install, so its packages stay out of the machine's global state.

## Three kinds of script

- **Static** scripts do the same thing every time, as setup and install scripts do. They
  act with no dry run, because a dry run would have nothing to show. Being idempotent is
  what makes running one again safe.
- **Dynamic** scripts work out what to do from what they find when they run, so they are
  dry runs by default. This is the default kind.
- **Interactive** scripts suit cases where what runs may vary by choice, or where several
  related operations belong together, such as removing branches whose work has landed
  and then bringing the default branch into the rest, in one script. The person's
  selection is also the go-ahead.

### Dynamic scripts: `--apply` and every other flag

The flags answer two separate questions. `--apply` decides whether the run does what it
shows, or only shows it, and it gates everything the script counts as a change. Every
other flag decides which behaviour the run includes. The combination says what happens:
in `git cleanup`, `--rescue` alone shows the rescue it would do, and `--rescue --apply`
does it. So whether a new flag needs `--apply` is never a question.

Compute the plan once, print it, and act on that same plan. Two runs are two readings of
the world: the SC approved what the first one found, and a second would choose again from
whatever is there now, with neither able to tell him they differed. The plan is what the
script will attempt, not what will happen: a pull can still conflict, and no script knows
that in advance.

What counts as a change is decided for each script and written down in it, and `--apply`
gates all of it. A fetch or a cache refresh may not count, so a dry run can still do
them, and whoever runs it needs to know what it does and what it leaves for `--apply`.
What counts usually includes changes that can't be undone, and external calls such as
running Claude or calling the Anthropic API.

### Interactive scripts: `--plan`

You can't drive a picker, so without a non-interactive mode you can neither use nor test
an interactive script. This is the pattern, unless a script has a reason to differ:

- **`--plan`** prints the plan and stops. The plan is every operation, each marked with
  whether it runs, as the picker would start.
- **`--plan --apply`** carries out what `--plan` shows, acting on the plan it printed as
  a dynamic script does. The behaviour flags shape what's on offer, as they do in the
  picker.
- **With no terminal and no `--plan`,** the script refuses, and tells the caller to run
  it with `--plan` or `--help`. It doesn't fall back to `--plan`, because then the same
  command would do different things depending on whether there's a terminal, which is
  more confusing.

### Extra actions and the pause

- **An extra action in a static script** is a flag named for that action, like setup's
  `--remove`. `--apply` there would imply the rest of the script is a dry run.
- **The pause.** Wherever the action is destructive, in any kind of script, pause with a
  way to cancel first: 5 seconds and Ctrl-C. Once it starts there is no taking it back.
  A destructive static script is usually better gated with `--apply`, so it becomes a
  dry run by default: that default is what makes a destructive script cancellable before
  it acts.

## Run what you wrote, except the mutation

Run and test the script you wrote, and don't hand over code that has never run: handed
over untested, its first run, and whatever breaks in it, is his.

What you don't run is the mutation: that is the SC's to run, unless he gives it to you.
Having written the script doesn't make the mutation yours to run. A script can hold
commands you would never run directly, and "I wrote it, so I can run it" would make every
one of them a way around the safety rules you work under.

Nothing is created or deleted on his machine for a test, not even something harmless,
because he doesn't want it there. So test setup always runs in Docker: a temp directory
with a git repo put into some state for the test, and anything else a test creates or
deletes. How you test the script itself follows its kind:

- **Static:** running it is the change itself, so test it in Docker.
- **Dynamic:** its own dry run may run on his machine, since showing the plan is what a
  dry run is for. Never `--apply`.
- **Interactive:** test it through `--plan`, which is its dry run, never `--plan --apply`.

## Which system it acts on

A script that acts on an external system (an org, tenant or subscription) works the
target out where it can, such as from the git remote. Where it can't, the target is a
required input with no default, because a default quietly sends a caller who forgot it to
the wrong system. When it can be neither worked out nor found in the input, the script
stops and says what's missing.

## Input

Design it for whoever calls the script. Who calls it shapes the interface; it doesn't
change who may run the mutation.

- **When the SC runs it,** it takes arguments.
- **When you call it,** it takes what suits you, not what a person at a prompt would
  type. That is often JSON on stdin, which composes without the quoting and
  string-splitting that break agent-driven calls. A soft guide: two or more values as
  JSON, one or none as arguments; you may only find out by using it. Take every input up
  front, because you can't answer a prompt. A script that reads stdin guards the case
  where nothing is piped, or a run from a terminal waits forever.
- **Long or sensitive input stays off the command line,** in stdin or a file. A security
  scanner can kill a process with a long argument before it starts, with no output, so
  the script just looks broken. Anything that lists processes sees the arguments, another
  session included. And other users on the machine can read them, so a secret never goes
  there.

## Output

It has two readers.

- **You** shouldn't be flooded with output you have to read through. Its shape fits what
  it is: structured where a caller parses it, lines where it is scanned.
- **The SC** shouldn't be left watching a run that shows nothing. Progress goes to stderr
  while it runs, so it stays out of the result, and the result comes at the end.

## Exit codes

An exit code says what the caller does next, not how bad it was. These shared codes
cover the common cases:

- `0` succeeded.
- `1` it ran and the answer is no: failed, rejected, refused.
- `2` no answer yet: timed out or still running, so retrying means something.
- `64` the call itself is wrong, so only fixing the call helps. It is `EX_USAGE` from
  sysexits.h, and it sits well above the low codes, which leaves room for a script's own.

Each script also defines its own codes for its other failures. Either way the codes are
documented: for you, a documented code can be the difference between knowing why a
script failed and not knowing.

## Errors

Never swallow one. `cmd 2>/dev/null` followed by a printed guess at what went wrong
leaves only the guess, and when the guess is wrong it hides the real cause. Let the
command's own error reach stderr, then print the script's reading of it.

## Temporary files

Create them where `$TMPDIR` points: `mktemp` or `mktemp -d` with no template, or
`os.tmpdir()` in Node.js. Never hardcode `/tmp`. The sandbox sets `$TMPDIR` to a place it
can write, and makes `/tmp` read-only.

## Shell scripts

### POSIX

The SC's shell scripts are POSIX (Bourne) shell, with `local` the only exception so far.

- Most examples online use bash when they don't need it, so you reach for features a
  script doesn't need.
- He wants his scripts portable.
- Shell portability errors are rare, but painful to solve.
- Strict compliance beyond that, such as giving up `local`, makes scripts worse for no
  gain.

The tools underneath differ too: macOS has BSD tools and WSL has GNU ones, so `sed`,
`date` and friends don't take the same flags.

### `set -e`

Prefer it, so scripts behave the same way on failure. Know its traps:

- conditions, and functions called from them;
- `local x=$(cmd)`;
- pipelines;
- commands that exit non-zero as a normal answer.

One trap needs spelling out, because its consequence gets missed even when the rule is
known. In `a && b && c`, a failing `b` skips `c`, and the script carries on to the
next line, because `set -e` ignores a failure anywhere in an `&&` list except the last
command. The chain stops; the script doesn't.

### Cleanup and signals

You get traps wrong constantly, and the result is often processes left running. So every
script that creates anything or starts processes uses this pattern. Its function is
always named `cleanup`, for consistency, and it stops the processes and removes what the
script started, where that applies:

```sh
tmp=$(mktemp -d) || exit 1
pid=''
cleanup() {
  set +e
  [ -n "$pid" ] && kill "$pid"
  [ -n "$tmp" ] && [ -d "$tmp" ] && rm -rf -- "$tmp"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 131' QUIT
trap 'exit 143' TERM

some_command &
pid=$!
```

`cleanup` starts with `set +e` because it should attempt every step. `kill` fails when
the process has already gone, and under `set -e` that would end `cleanup` before it
removes `$tmp`. `set +e` isn't local to the function, which is harmless while `cleanup`
only runs at exit.

Each signal becomes an `exit`, so the EXIT trap, and the cleanup with it, also runs when
one of these four ends the script, and the exit status still says which signal it was. A
signal with no trap, and SIGKILL, which no trap can catch, can still end the script
without it. These four are the signals generally worth catching, in any order.

In a non-interactive `sh`, a child started in the background ignores Ctrl-C. The script
ends and the child carries on, unless `cleanup` stops it.

### ShellCheck

Check a shell script with ShellCheck in `sh` mode (`shellcheck -s sh`) as part of testing
it. The `local` exception is recorded once per repo, in a `.shellcheckrc` at the repo
root containing `disable=SC3043`, so both you and the repo's own checks skip that warning
and no other. Without it every `local` warns, and you either "fix" them away or read the
failing exit as a failed test.

## TypeScript scripts

A Node.js script is `.mjs` for JavaScript and `.mts` for TypeScript, so Node treats it as
an ES module whatever the nearest `package.json` says.

Node.js runs a `.mts` script directly, with no build step, by stripping the types without
compiling them. So syntax that needs code generated for it, such as `enum` or
constructor parameter properties, makes Node stop with an error. Keep to erasable
syntax: no `enum`, no constructor parameter properties, no `namespace` with runtime
members, no `import =`.

## A reusable tool for the SC lives in his dotfiles

A reusable script with no home goes in `~/dotfiles`, which its own installer symlinks
into `$HOME`: a git subcommand, an alias, anything that ends up on his global path.
Written straight into `~/bin` instead, a tool exists on one machine and no repo knows it
is there. Check the dotfiles first; `~/dotfiles/CLAUDE.md` has the rules for changing
anything in it.
