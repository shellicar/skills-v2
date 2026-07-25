---
name: azure-devops-work-items-query
description: |
  WHAT: finding Azure DevOps work items by WIQL query.
  WHY: there's no list command, and WIQL's syntax differs from the write-side CLI.
  TRIGGER WHEN: querying or listing work items.
---

# Azure DevOps: querying work items

Composes onto `azure-devops` for org/project detection.

There's no `az boards work-item list` — it doesn't exist. Query with WIQL instead:

```
az boards query --wiql "SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.Parent] = <PARENT_ID>"
```

`az boards work-item show --id <ID>` for a single known item.

## WIQL gotchas

- `[System.Parent]` can't appear in `ORDER BY` — sort by `[System.Id]` or
  `[System.WorkItemType]` instead.
- Path values have no leading backslash (`<Project>\Area\Path`), unlike the `--path`
  argument on write commands, which requires one.
