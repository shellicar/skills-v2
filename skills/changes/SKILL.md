---
name: changes
description: |
  WHAT: writing a changes.jsonl entry — which package, what it says, append-only.
  WHY: schema and categories are per-repo config; the entry's craft isn't.
  TRIGGER WHEN: COMPLIANCE — a repo has changes.jsonl and you've made a user-facing change.
---

# Changes

Read `changes.config.json` and `schema/shellicar-changes.schema.json` at the repo root
before writing an entry — the category list is config, not fixed, and it already
differs between repos. Don't assume a category exists because another repo has it.

## Which package gets the entry

A monorepo has one `changes.jsonl` per package. The entry goes in every package whose
own behaviour actually changed — not the package you were thinking about, not every
package in the workspace. A fix inside a shared internal helper gets its entry in the
package that owns the helper; a package that only re-exports it doesn't get one unless
its own published surface moved.

## Writing the entry

Same discipline as a commit message: the effect, not the implementation. A consumer
reading the changelog wants to know what changed for them, not which file or function
carried it.

Bad: "Fixed the boundaryEngine fallback logic in captivePolicyFor." Good: "Runtime
captive resolution now defaults to Throw when a composition omits the policy."

Pick the category the change actually is, not the one that sounds better — a behaviour
change that happens to fix a bug is `fixed`, not `changed`; a bug fix is not automatically
`patch` if it changes public behaviour a consumer might depend on. If the schema
supports a `semver` override and the automatic bump would be wrong for this entry, set
it explicitly and say why in the same conversation, not silently.

## Mechanics

- **Append-only day to day.** Writing your own entry, add a new line and leave every
  other line alone — don't touch an entry someone else wrote. The file gets reshuffled
  by merges and rebases, so anything reading it must treat line order as meaningless
  — that's why the generator sorts before rendering, not a detail to preserve by hand.
- **Curating a release is different.** Entries accumulate from different people over
  time, and a changelog's consistency of voice matters more than preserving each
  author's original wording. Planning or reviewing a release is when rewriting earlier
  entries — tightening the voice, fixing a wrong category, filling in a breaking
  change nobody flagged at the time — is the right call, not a violation of
  append-only. The distinction is the mode you're in, not the file.
- **Never hand-edit `CHANGELOG.md`** when `changes.jsonl` exists for that package —
  it's generated output. Run the repo's generator script, then its validator; both
  must be clean before the change is done.
- **A release marker is a separate act**, appended when a release goes out, not when
  writing a change entry — that's `github-release`'s job, not this one.
