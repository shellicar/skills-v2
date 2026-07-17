---
name: scripting
description: |
  WHAT: writing portable scripts — POSIX shell, not bash — and picking the right tool for the job.
  WHY: you reach for what's common (bash, python) because that's how you're trained; this is the way the SC does things.
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

## Assume you'll run it

The default is that a script is for you — an LLM — to run, not a person. Claude still writes for the pre-LLM world, where someone typed the script at a prompt with `--flags` and read its friendly output. The SC doesn't run scripts anymore; he asks you to. So write for the caller you actually have:

- **Structured input.** Prefer JSON in over positional args — it composes without the quoting and string-splitting that break agent-driven calls, the same reason the good tools take structured input.
- **Output that fits the tool** — not JSON by default. Structured (JSON) when it returns data or a status a caller parses: `preflight` reporting identity, branch, and tree is this. Plain lines when the output is a stream to scan or pipe: a file search or a grep is naturally linewise, and wrapping it in JSON helps no one. Match the shape to what the output *is*.
- **Exit non-zero on failure**, so a caller can branch on it.
- **Quiet on success.** No noise unless there's something to return.
- **No interactive prompts** — you can't answer them; take every input up front.

A human-run script is the exception, and it looks different: named `--flags` a person types, maybe a `--doctor` dry-run. Write one that way only when the SC asks for a script he'll run himself. `launch-handler` reads a JSON config because a cast composes and runs it; `start-planner` takes `--flags` because the SC does.
