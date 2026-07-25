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

Two work item types, two mechanisms — mixing them up puts the wrong item in the wrong
place:

- **PBI or Bug (the parent)** — mention it in the description as `#1234`. ADO
  auto-links any work item referenced this way, so this is also why a Task must
  *not* go in the description: it would auto-link there too, in the wrong section.
- **Task (the child)** — pass its id in `workItems` on `AzureDevOps_PullRequest_Create`,
  not in the description text.

## Linking a work item to an already-created PR

`AzureDevOps_PullRequest_Edit` has no `workItems` field — only `Create` does. To link
one after the fact, fall back to the CLI via `AzCli`:

```
az repos pr work-item add --id <PR_ID> --work-items <TASK_ID> --org https://dev.azure.com/<org>
```
