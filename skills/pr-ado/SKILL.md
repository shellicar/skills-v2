---
name: pr-ado
description: |
  WHAT: staying on an Azure DevOps PR until its validation build settles.
  WHY: a PR left alone can sit red or unreviewed for hours unnoticed.
  TRIGGER WHEN: after opening or pushing to an Azure DevOps PR.
---

# PR: Azure DevOps

Opening the PR is not the end of the task. Watch it through to a result before moving on.

## Watch the validation build to completion

Opening the PR auto-triggers a validation build. The work is not done until that build
has run and passed — "PR open" is not "the change works."

Azure DevOps has no single blocking watch equivalent — poll for it. ADO typically runs
PR validation against the merge ref, not your source branch, so the run may take a
moment to appear:

```
az pipelines runs list --branch refs/pull/<PR_ID>/merge --org <org> --project <project>
```

Poll each run until its `result` is `succeeded` — a starting point, not the only way to
find it. "queued" or "running" is not done, don't report back early.

A failing build is something to surface, not to fix yourself: investigate the cause and
report it, and you may propose a solution, but shipping is a separate job from fixing —
that decision belongs elsewhere. If the PR triggers no validation at all, that absence is
the answer: report it, and flag it if one should have run.

A draft PR does not trigger validation at all — the absence you'd otherwise report is
expected there; poll again once it's marked ready.

## Before marking ready

Bring the branch up to date with the target branch unconditionally, not only when a
conflict is reported:

```
git fetch origin
git merge origin/<target-branch>
```

Don't gate this merge on the PR's mergeable status. A file marked `merge=union` in
`.gitattributes` (changelogs, testaments) never surfaces as a conflict there, because the
union driver runs locally — Azure DevOps can't see it. Waiting for a reported conflict
before merging means the branch never integrates the target.

After merging, diff every union-merge file you touched against the target branch:

```
git diff origin/<target-branch> -- <the union-merge files>
```

The union driver concatenates both sides, so a removed line on one side can leave the
boundary duplicated or a trailing newline stripped. Read the diff and confirm each
merged file still reads correctly before pushing.

Mark ready with `AzureDevOps_PullRequest_Ready`, not `az repos pr update`/CLI — same
tool-is-the-gate reasoning as `pr`.

**Done when:** the PR is open, integrated with the latest target branch, any union-merge
files verified, and the validation build has completed and passed — or no validation was
triggered and that absence is reported.
