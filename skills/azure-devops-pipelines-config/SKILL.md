---
name: azure-devops-pipelines-config
description: |
  WHAT: keeping a pipeline's CI trigger and its build validation policy in sync.
  WHY: the two use different path syntax and drift apart silently.
  TRIGGER WHEN: a pipeline didn't trigger when expected.
---

# Azure DevOps: pipeline trigger config

Composes onto `azure-devops` for org/project detection. See `azure-devops-pipelines-monitor`
for queuing/checking a run once it exists, and `azure-devops-pr` for work item linking
on the PR itself.

A pipeline's own YAML trigger and its branch's build validation policy are two
separate things that can drift apart silently — a path excluded from one but not the
other means the pipeline runs when it shouldn't, or doesn't when it should. They also
use different path syntax for the same intent:

- YAML trigger: `apps/api`, `packages/*` — no leading slash.
- Build policy `filenamePatterns`: `/apps/api/*`, `/packages/*` — leading slash,
  trailing `/*` for directories.

`scripts/pipeline-policy-sync.sh` compares or syncs the two (`mode: compare` default,
`mode: sync` to update the policy to match the YAML):

```
echo '{"org":"...","project":"...","yaml":"azure-pipelines.yml","pipeline_id":"42"}' | scripts/pipeline-policy-sync.sh
```

## Shared templates

A change to a shared job template (e.g. `templates/build/nodejs.yml`) only triggers
the pipelines whose own trigger paths include it — not every pipeline that uses the
template.
