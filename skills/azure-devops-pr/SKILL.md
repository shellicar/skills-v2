---
name: azure-devops-pr
description: |
  WHAT: linking work items to an Azure DevOps PR — parent in the description, child via a separate call.
  WHY: the two work item types use different linking mechanisms.
  TRIGGER WHEN: creating or updating an Azure DevOps PR that touches work items.
---

# Azure DevOps: PRs

Composes onto `azure-devops` for org/project detection. If a PR's build validation
didn't trigger or ran against the wrong paths, see `azure-devops-pipelines-config`.

Two work item types link two different ways:

- **PBI or Bug (the parent):** reference it as `#1234` in the description. ADO auto-links
  any work item mentioned there, which is also why a Task must not go in the description:
  it would auto-link in the wrong place.
- **Task (the child):** pass its id in `workItems` on `AzureDevOps_PullRequest_Create`,
  not in the description.

## Description template

```md
## Summary

<one or two sentences, the effect>

## Related Work Items

#1234

#5678

## Changes

- <bullet>
- <bullet>
```

Each Related Work Items entry needs a blank line between it and the next. Without the
blank lines they do not render as separate work-item links.

## Linking a work item to an already-created PR

`AzureDevOps_PullRequest_Edit` has no `workItems` field, only `Create` does. To link one
after the fact, use the CLI via `AzCli`:

```
az repos pr work-item add --id <PR_ID> --work-items <TASK_ID> --org https://dev.azure.com/<org>
```
