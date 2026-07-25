---
name: pr-github
description: |
  WHAT: staying on a GitHub PR until CI settles.
  WHY: a PR left alone can sit red for hours unnoticed.
  TRIGGER WHEN: after opening or pushing to a GitHub PR.
---

# PR: GitHub

Opening the PR is not the end of the task. Watch it through to a result before moving on.

## Watch checks to completion

```
gh pr checks <number> --watch
```

`--watch` blocks until every check finishes. "Still running" is not done — wait for the
actual result, don't report back early. On failure, investigate; when the fix is outside
your current work or hinges on a decision, stop and report rather than guessing.

## Before marking ready

Bring the branch up to date with the target branch unconditionally, not only when GitHub
reports a conflict:

```
git fetch origin
git merge origin/<target-branch>
```

Don't gate this merge on `gh pr view --json mergeable`. A file marked `merge=union` in
`.gitattributes` (changelogs, testaments) never surfaces as `mergeable: CONFLICTING`,
because the union driver runs locally — GitHub can't see the conflict. Waiting for
CONFLICTING before merging means the branch never integrates the target.

After merging, diff every union-merge file you touched against the target branch:

```
git diff origin/<target-branch> -- <the union-merge files>
```

The union driver concatenates both sides, so a removed line on one side can leave the
boundary duplicated or a trailing newline stripped. Read the diff and confirm each
merged file still reads correctly before pushing.

Mark ready with `GitHub_PullRequest_Ready`, not `gh pr ready` — same tool-is-the-gate
reasoning as `pr`.

**Done when:** the PR is open, integrated with the latest target branch, any union-merge
files verified, and every check has completed and passed.
