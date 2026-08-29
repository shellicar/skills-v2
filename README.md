# skills-v2

The v2 skill library. Skills are injected into a session as operating constraints, not
read from a home directory, so a session's context has one visible author.

## The documents

- [`PHILOSOPHY.md`](PHILOSOPHY.md) is the gate everything passes through: enough context
  to do the task, nothing past sufficiency.
- [`PLAN.md`](PLAN.md) is the build order and what has landed so far.
- [`STOCKTAKE.md`](STOCKTAKE.md) is the exhaustive per-skill fate for everything in v1.
- [`DECISIONS.md`](DECISIONS.md) is the ledger. Skill content does not change without an
  entry, so blaming a line finds the commit, and the commit carries the reason.
- [`MIGRATION.md`](MIGRATION.md) tracks getting v1 and v2 running the same way.
- [`docs/roles.md`](docs/roles.md) is why the roles are shaped the way they are.

## What gets injected

`BASELINE.md` is the system prompt and rides `--system`. `INSTRUCTIONS.md` frames the
skills block and rides `--claudeMd`. Both are named so the CLI never picks them up as
ambient sources when a session runs in this directory.

`scripts/load-skills.mjs` builds the `<skills>` block: foundational skills whole, the
rest as a catalogue of names and descriptions that a session loads on demand.
`scripts/start-v2.mjs` launches a session with all of it composed in, and `--doctor`
prints what would be sent without launching.

## Checks

`node scripts/description-lengths.mjs` prints every skill's frontmatter description
length and lists anything over the 250 character cap.
