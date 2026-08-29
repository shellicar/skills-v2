---
name: changes
description: |
  WHAT: writing a changes.jsonl entry — fields, package, and which lines you can change.
  WHY: the schema is per-repo config; a line on main is shared.
  TRIGGER WHEN: COMPLIANCE — a repo has changes.jsonl and you've made a user-facing change.
---

# Changes

Read `changes.config.json` and `schema/shellicar-changes.schema.json` at the repo root
before writing an entry — the category list is config, not fixed, and it already
differs between repos. Don't assume a category exists because another repo has it.

## The category and the bump

Pick the category the change actually is, not the one that sounds better — a behaviour
change that happens to fix a bug is `fixed`, not `changed`; a bug fix is not automatically
`patch` if it changes public behaviour a consumer might depend on. If the schema
supports a `semver` override and the automatic bump would be wrong for this entry, set
it explicitly and say why in the same conversation, not silently.

## The release marker

`changes.jsonl` holds two kinds of line. A change entry carries `description` and
`category` and no `type`; a release marker carries `"type":"release"`. The marker is a
divider — every entry after the last one is unreleased, which is what the generator
renders as `[Unreleased]`.

```jsonl
{"type":"release","version":"5.0.1","date":"2024-09-30","tag":"5.0.1"}
{"type":"release","version":"1.0.1","date":"2026-04-15","tag":"core-di-lite@1.0.1"}
```

`type`, `version` and `date` are required; `tag` and `description` are optional. The tag
is the release's git tag — bare `<version>` in a single-package repo,
`<shortname>@<version>` in a monorepo, where the shortname is the package's `name`
without its scope and matches its directory. Never a `v` prefix.

A pre-release gets no marker. Its version carries a hyphen, and its entries stay
unreleased, so a package below `1.0.0` has no markers at all until `1.0.0` ships.

Writing a change entry never appends a marker; that happens when a release goes out.

## Which package gets the entry

A monorepo has one `changes.jsonl` per package. The entry goes in every package whose
own behaviour actually changed — not the package you were thinking about, not every
package in the workspace. A fix inside a shared internal helper gets its entry in the
package that owns the helper; a package that only re-exports it doesn't get one unless
its own published surface moved.

## Which lines you can change

A line already on `origin/main` is the shared record — other people are working against
it, so changing one is a deliberate act, not part of writing an entry. Everything your
branch adds is not on main yet, so add, edit or remove those lines however you need to.

Rewriting merged entries is release curation, and planning or reviewing a release is
when it is the right call: a changelog's consistency of voice matters more than
preserving each author's original wording, so tightening the voice, fixing a wrong
category, or filling in a breaking change nobody flagged at the time all belong there.

Line order carries no meaning. Merges and rebases reshuffle the file and the generator
sorts before rendering, so don't hand-place a line or restore a disturbed order.

## The generated file

Never hand-edit `CHANGELOG.md` when `changes.jsonl` exists for that package — it's
generated output. Run the repo's generator script, then its validator; both must be
clean before the change is done.
