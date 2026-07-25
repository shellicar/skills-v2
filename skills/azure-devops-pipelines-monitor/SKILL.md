---
name: azure-devops-pipelines-monitor
description: |
  WHAT: queuing and monitoring Azure DevOps pipeline runs.
  WHY: the list command can silently return cached results.
  TRIGGER WHEN: queuing or checking the status of an Azure DevOps pipeline run.
---

# Azure DevOps: pipelines

Composes onto `azure-devops` for org/project detection. For what an `inProgress` run
with a `null` result actually means (an approval gate, not a failure), see
`azure-devops-deploy`. For why a pipeline didn't trigger at all, see
`azure-devops-pipelines-config`.

```
az pipelines runs list --pipeline-ids <ID> --query-order QueueTimeDesc -o table
```

`--query-order QueueTimeDesc` is not optional — without it the API can return
cached/stale results and miss a run that just started.
