---
name: scripting
description: |
  WHAT: writing portable scripts — POSIX shell, not bash.
  WHY: you default to bash/python because that's your training; this is how the SC does it.
  TRIGGER WHEN: writing or modifying a script.
---

# Scripting

Default to portable scripts, POSIX / Bourne.

My main toolstack is NodeJS (TypeScript) and Rust.

Ask before installing any other SDKs or software.

- **Shell (POSIX / Bourne)** — prefer starting with shell scripting for simple tasks. Keep it POSIX, not bash-isms. The environments are macOS (BSD coreutils) and WSL2/Ubuntu (GNU), and their `sed`, `date`, and friends differ — a GNU flag silently fails on the Mac. Think about moving to NodeJS when more advanced operations are needed.

- **JavaScript (`.mjs`)/TypeScript (`.mts`)** — My main techstack and what I'm familiar with. Node 22+ runs TypeScript directly, no build step, and types catch the mistakes shell hides. Node only *strips* types, it doesn't compile them, so keep to erasable syntax: no `enum`, no constructor parameter properties (`constructor(private x: number)`), no `namespace` with runtime members, no `import =`. Use a union or `as const` and assign fields explicitly — anything that needs code generation rather than type removal errors.

- **Rust** — when it should be a *program*: a real tool, something distributable, or where performance is the point. The main benefit of Rust is the discipline it enforces.

- **Python** — only when its ecosystem is the reason (data analysis, ML) and it's genuinely the best fit. When you do, use `uv` and a `venv` — never a bare global install.

## Dry run by default

A script that deletes, overwrites, or otherwise can't be undone defaults to a dry run.
The shape is one computation, shown before it runs:

- **No flags: print the plan, then exit.** Nothing is touched. Running the script with
  no flags is always safe.
- **`--apply`: print the same plan, wait 5 seconds, then carry it out.** The wait is the
  abort window, not a prompt — it asks nothing and needs no answer, it just holds the
  irreversible step open long enough for the SC to read it and Ctrl-C.
- **Act on the plan you printed, not a fresh one.** Compute once, hold it, print from
  it, execute from it. Recomputing after the wait reopens the gap this closes.
- **One flag acts, `--apply`.** Every other flag only narrows *what's in the plan* —
  which items are considered. None of them cause anything to happen by itself.
- **Never let a flag both select and execute.** The moment one does, running the
  script with no `--apply` stops being safe, and the whole point of a dry run is gone.

For example, a branch-cleanup script: `--apply` is the only flag that deletes anything.
Flags like `--rescue` or `--gone` just decide which branches show up in the plan — on
their own they print, they don't touch a branch.

Why `--apply` prints the plan itself, instead of trusting the dry run the SC already
ran: two invocations are two readings of the world. The plan he approved was computed
from the tree, the remote, the settings file as they stood; the second run computes
again from whatever they are now. He approves one thing and executes another, and
neither run is in a position to tell him they differed. One run removes the gap — what
he saw is what happens, because it is the same plan.

This is not a judgement call, and there is no question in it to ask. `safe-operations`
holds why, along with the other half of it: the script is his to run, never yours, not
even to test.

## Who is it for: you, or the SC

This decides the interface, not who is permitted to execute it — a script written for
you to call can still be one only he may run.

The default is that a script is for you — an LLM — to run, not a person. Claude still writes for the pre-LLM world, where someone typed the script at a prompt with `--flags` and read its friendly output. The SC doesn't run scripts anymore; he asks you to. So write for the caller you actually have:

- **Input is JSON on stdin, never argv.** One shape for every script, so a caller never has to work out whether a value is an argument or a field, and it composes without the quoting and string-splitting that break agent-driven calls. The harder reason: a long value sitting in the process argv trips endpoint security scanning (SentinelOne on the work machine), which SIGKILLs the process before it starts, in about 20ms, with no output — so it reads as the script being broken rather than as a scanner. Read fd 0: `readFileSync(0, "utf8")` in node (`readStdin` in `shared/stdin.mts` does it here), `INPUT=$(cat)` then `jq` in shell. Guard the no-pipe case or an interactive run blocks on the terminal forever.
- **Output that fits the tool** — not JSON by default. Structured (JSON) when it returns data or a status a caller parses: `preflight` reporting identity, branch, and tree is this. Plain lines when the output is a stream to scan or pipe: a file search or a grep is naturally linewise, and wrapping it in JSON helps no one. Match the shape to what the output *is*.
- **Exit codes say what the caller does next**, not how bad it was. `0` succeeded. `1` it ran and the answer is no: failed, rejected, refused. `2` no answer yet: timed out or still running, so retrying is meaningful. `64` the call itself is wrong, so only fixing the call helps — that's `EX_USAGE` from sysexits.h, and it sits far above the low codes so a script can add its own verdicts later without ever colliding with it. Negative codes don't exist: the status is 8 unsigned bits, so `-1` arrives as 255 and `-2` as 254, silently.
- **Quiet on success.** No noise unless there's something to return.
- **No interactive prompts** — you can't answer them; take every input up front.

**No manual line breaks for readability.** A command is for you to run, not a person to read on a page — `\` continuations splitting a command across lines just to look tidy serve no reader that exists. Write it as one line and let the terminal wrap it.

A human-run script is the exception, and it looks different: named `--flags` a person types, maybe a `--doctor` dry-run. Write one that way only when the SC asks for a script he'll run himself. `launch-handler` reads a JSON config because a cast composes and runs it; `start-planner` takes `--flags` because the SC does.

## A reusable tool for the SC lives in his dotfiles

Not every script. The ones written for him to keep and reuse — a git subcommand, an
alias, anything that ends up on his global path — belong in `~/dotfiles`, which its
own installer symlinks into `$HOME`. Written straight into `~/bin` instead, a tool
exists on one machine and no repo knows it is there. Check the dotfiles first;
`~/dotfiles/CLAUDE.md` has the rules for changing anything in it.