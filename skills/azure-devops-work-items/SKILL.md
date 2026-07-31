---
name: azure-devops-work-items
description: |
  WHAT: creating and updating Azure DevOps work items — parenting, CLI gotchas, description formatting.
  WHY: CLI commands silently no-op, and ADO's HTML rendering has non-obvious rules.
  TRIGGER WHEN: COMPLIANCE — creating or updating a work item.
---

# Azure DevOps: work items

Composes onto `azure-devops` for org/project detection.

## Creation sequence

Query the parent first (for its area/iteration path), create the item with its
description, then parent it immediately — an unparented item is an orphaned one, hard to
find later. Ask if the parent isn't clear rather than guessing.

```
az boards work-item create --type Task --title "..." --description "..." --area "\Project\Area" --iteration "\Project\Iteration"
az boards work-item relation add --id <ID> --relation-type parent --target-id <PARENT_ID>
```

`--description` is required on create, not something to add in a follow-up `update`. It
takes the same HTML the field takes, so there is no reason to create the item empty and
fill it in afterwards.

Parenting is always a second call. `create` has no parent argument, and
`--fields "System.Parent=<ID>"` on `update` silently does nothing — parenting only works
through `relation add`/`relation remove`, never the field.

Creating several items is two batches, not an alternating stream: issue every `create`
together, then every `relation add` together. Each call is separately gated, and
interleaving them turns one approval per batch into one per item.

## CLI gotchas

- `update` takes no `--project` — work item IDs are unique per org, not per project.
- Clear a field with an empty value: `--fields "Microsoft.VSTS.Scheduling.StartDate="`.
- One `az boards work-item update` call per item — there's no batch update.

## Description field depends on type

Every type except Bug uses `System.Description`. **Bug uses
`Microsoft.VSTS.TCM.ReproSteps`** — `System.Description` exists on a Bug but the UI
never shows it, so writing to it silently produces an empty-looking bug. Structure a
Bug's repro steps under `<h2>Problem</h2>`, `<h2>Root Cause</h2>`, `<h2>Fix</h2>`.

This makes `--description` the wrong argument for a Bug, since it writes
`System.Description`. Create a Bug with
`--fields "Microsoft.VSTS.TCM.ReproSteps=<html>"` instead.

## Formatting

Check `multilineFieldsFormat` on the work item first — missing means HTML, present as
`"markdown"` means markdown. PR descriptions are always markdown regardless. HTML
patterns and rich-link syntax are in `formatting.md`. The one to know without opening
it: a plain `#1234` does not render as a link in a description — it needs the full
`data-vss-mention` anchor form.

## After a type change

Type changes (PBI → Feature etc.) alter which fields exist, and the CLI can't surface
a mismatch — link the item in your response so it can be checked in the UI.
