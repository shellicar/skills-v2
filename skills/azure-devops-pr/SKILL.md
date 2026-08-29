---
name: azure-devops-pr
description: |
  WHAT: which work items a PR links and which it only mentions.
  WHY: a linked work item auto-closes on merge, so linking a PBI closes it before it is tested.
  TRIGGER WHEN: creating or updating an Azure DevOps PR that touches work items.
---

# Azure DevOps: PRs

Composes onto `azure-devops` for org/project detection. If a PR's build validation
didn't trigger or ran against the wrong paths, see `azure-devops-pipelines-config`.

## What a PR links, and what it only mentions

| Work item | In the description | Linked to the PR |
|---|---|---|
| PBI | mentioned as `#1234` | never |
| Bug | mentioned as `#1234` | never |
| Task | never | always |

Both columns are exclusive. A Task is linked and never written in the body; a PBI or Bug
is written in the body and never linked. Naming the same item both ways is the mistake
this table exists to prevent.

- **A Task is linked.** You create it yourself, with a description of what you did,
  parented to the PBI or Bug the work belongs to. Then you link it to the PR: pass its
  id in `workItems` on `AzureDevOps_PullRequest_Create`, or add it afterwards with the
  CLI call below.
- **A PBI or Bug is mentioned, never linked.** Write `#1234` in the description under
  Related Work Items, and leave it at that.

**Why: a linked work item closes itself when the PR merges.** That is right for the
Task, whose code is done at that moment, and wrong for the PBI, which is not.

A merged PR means code-complete. The PBI stays open until all of its work is done,
which may be several PRs, and until that work has been tested. Linking the PBI closes
it at merge and quietly asserts both of those things, while the feature has never been
run by anyone.

So the shape of a PR is: create a Task for what this PR does, describe it, put it under
the PBI, link the Task, mention the PBI.

**Do not "fix" a PBI mention that renders as plain text.** Work items live in a
different project from the code in most orgs, and a cross-project `#1234` does not
become a hyperlink. That is not a defect to repair by linking the work item: the
mention is context for whoever reads the PR, and linking it is the one thing this
skill exists to prevent. If you want the reader to reach it, spell out the id or paste
its URL.

Creating the Task is `azure-devops-work-items`: it owns the sequence, the parenting and
the description format.

## Description template

```md
## Summary

<one or two sentences, the effect>

## Related Work Items

#1234

## Changes

- <bullet>
- <bullet>
```

Related Work Items carries the PBIs or Bugs this PR contributes to and nothing else. The
Task is linked, so it never appears there. Where a PR genuinely serves two PBIs, put a
blank line between the entries or they run together as one line instead of reading as
separate items.

## Linking the Task to an already-created PR

`AzureDevOps_PullRequest_Edit` has no `workItems` field, only `Create` does. To link
after the fact, use the CLI via `AzCli`:

```
az repos pr work-item add --id <PR_ID> --work-items <TASK_ID> --org https://dev.azure.com/<org>
```
