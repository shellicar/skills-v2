---
name: azure-devops-pr-comments
description: |
  WHAT: anchoring, posting, editing and resolving comments on an Azure DevOps PR.
  WHY: a mis-anchored suggestion renders corrupted, and thread status gates the merge.
  TRIGGER WHEN: commenting on or resolving threads on an Azure DevOps PR.
---

# Azure DevOps: PR comments

Composes onto `azure-devops` for org/project detection. This is how a comment is made
and anchored, not what it should say.

A comment lives in a **thread**. A thread carries a `status`, an optional
`threadContext` anchoring it to a file and a range, and its comments. The first comment
in a thread is `id: 1` and replies count up from there.

## A suggestion replaces the anchored range

You send two things: a range, and replacement text inside a ` ```suggestion ` block.
Azure DevOps applies the block as a replacement of exactly that range, and what the PR
shows you is a **diff it computed** between the two. The widget is not your block echoed
back.

So when a render surprises you, **check the range, not the block**. A suggestion that
reorders three lines renders as one deletion and one addition rather than three
replacements, and that is correct. A suggestion whose text sits spliced beside the
original is a range that failed to cover the original.

## Anchoring

`rightFileStart` and `rightFileEnd` are line and offset in the file **at the PR's head
commit**, not positions in the diff, so the same line has a different number on each
side of the comparison. Offsets are 1-based, and one past the last character is how the
API expresses end-of-line.

| Replacing | start | end |
|---|---|---|
| line N | `{line: N, offset: 1}` | `{line: N, offset: len(N) + 1}` |
| lines N to M | `{line: N, offset: 1}` | `{line: M, offset: len(M) + 1}` |
| the whole file | `{line: 1, offset: 1}` | `{line: L, offset: len(L) + 1}` |

L is the last line with content; a trailing newline is not a line to anchor to.

Both ways of getting the end wrong render visibly broken on the PR. An end offset of 1
is a zero-width point at the start of the line, so the suggestion is inserted and the
original text survives after it. An end on line N+1 swallows that line too.

A whole-file range is how a suggestion that needs a new import is made applicable: put
the entire file in the block and ADO renders the untouched lines as context with only
the real change in green. Showing just the changed lines and leaving the import to the
reader is equally valid; that one is a choice, not a rule.

**The anchored range is visible on the PR** as the highlighted region in the right-hand
pane, so confirming it landed where you meant costs nothing.

## Finding the range

Read the content from the commit. A working tree can hold an uncommitted edit, and that
gives the wrong length.

```
az repos pr show --id <PR> --org <ORG> --query lastMergeSourceCommit.commitId
az rest --method get --resource 499b84ac-1321-427f-aa17-267ca6975798 --url "https://dev.azure.com/<ORG>/<PROJECT>/_apis/git/repositories/<REPO>/items?path=<PATH>&versionDescriptor.version=<SHA>&versionDescriptor.versionType=commit&includeContent=true&$format=json&api-version=7.1" --query content
```

Compute lengths with a script instead of counting them, and build the request body with
a script instead of escaping a long string by hand.

Quicker than any of that, when the PR already has a comment that renders correctly:
copy its `threadContext`.

```
az devops invoke --area git --resource pullRequestThreads --route-parameters project=<P> repositoryId=<R> pullRequestId=<PR> --org <ORG> --api-version 7.1 --query "value[?threadContext].{id:id,file:threadContext.filePath,start:threadContext.rightFileStart,end:threadContext.rightFileEnd}"
```

## The calls

`az devops invoke` reaches the top-level thread resource. Anything nested below it needs
`az rest` with the full URL and `--resource 499b84ac-1321-427f-aa17-267ca6975798`.

Base: `https://dev.azure.com/<ORG>/<PROJECT>/_apis/git/repositories/<REPO>/pullRequests/<PR>`

| Operation | Method and path | Body |
|---|---|---|
| read threads | GET `/threads` | |
| new thread | POST `/threads` | `{comments:[{parentCommentId:0, commentType:1, content}], status:1, threadContext:{...}}` |
| reply | POST `/threads/<T>/comments` | `{parentCommentId:1, commentType:1, content}` |
| edit a comment | PATCH `/threads/<T>/comments/<C>` | `{content}` |
| delete a comment | DELETE `/threads/<T>/comments/<C>` | |
| set thread status | PATCH `/threads/<T>` | `{status: <int>}` |

`commentType: 1` is text. `filePath` is repo-root-relative with a leading slash. Filter
reads with `value[?comments[?commentType=='text']]` to drop the system ref-update
threads, and check the response's `count` so you page to the end rather than stopping
part way.

Editing replaces the text and leaves the anchor alone, so fixing wording never needs a
delete. **Deleting a comment leaves its thread behind as an empty shell, visible on the
PR permanently**, because there is no delete for a thread. A wrong anchor therefore
costs a shell that cannot be cleaned up, which is why the range is worth checking before
posting rather than after.

## Thread status

| UI label | API string | int |
|---|---|---|
| Active | `active` | 1 |
| Pending | `pending` | 6 |
| Resolved | `fixed` | 2 |
| Won't fix | `wontFix` | 3 |
| Closed | `closed` | 4 |

Both forms are accepted, the integer and the API string. The integer is what the web UI
itself sends.

"Resolved" is the one label whose stored value is a different word, and that gap is the
mistake worth naming. `{"status": "resolved"}` is not a value the API knows, and it does
not fail: it stores `null`, the thread displays as "Unknown", and `null` satisfies the
merge policy. Writing the word off the button quietly opens the gate it looks like it is
closing.

`byDesign` (5) is a real value the API accepts and the dropdown does not offer, so it
also displays as "Unknown".

**Any unrecognised status is accepted silently**, so read the status back after writing
it and compare against what you sent. A successful write proves nothing.

**The status is a claim someone typed, not a fact about the code.** `fixed`, `wontFix`,
`byDesign` and `closed` assert four different things about the world and satisfy the
merge policy identically. "Is this comment resolved?" is answered by reading the reply
and the diff. Reading the field answers a different question: what someone asserted.

## Policies decide whether it can merge

A blocking branch policy holds the merge until it evaluates `approved`. **`Comment
requirements` is blocking on most repos here, and it is not satisfied while any thread
is `active` or `pending`.** One open thread stops a PR that has every approval and every
green build, so "it will merge once people approve" is wrong wherever that policy is on.
Resolving threads is part of the work, not tidying up after it.

`pending` is the trap in that: it reads like a harmless in-progress marker and blocks
exactly as `active` does. The shell left by a deleted comment does not block, even at
`active`.

What the branch requires:

```
az repos policy list --org <ORG> --project <P> --repository-id <REPO_GUID> --branch main --query "[].{type:type.displayName,blocking:isBlocking,enabled:isEnabled}"
```

Where one PR stands right now:

```
az rest --method get --resource 499b84ac-1321-427f-aa17-267ca6975798 --url "https://dev.azure.com/<ORG>/<PROJECT>/_apis/policy/evaluations?artifactId=vstfs:///CodeReview/CodeReviewId/<PROJECT_GUID>/<PR>&api-version=7.1-preview.1" --query "value[?configuration.isBlocking].{type:configuration.type.displayName,status:status}"
```

Evaluation statuses are `approved`, `rejected` and `queued`. The artifactId takes the
**project GUID**, not the project name — `az devops project show --project <P> --query id`.
A wrong id answers `Artifact id ... does not exist or you do not have permission to view
it`, which reads like a permissions problem and is not one.
