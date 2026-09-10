# Azure DevOps PR comments

Why the `azure-devops-pr-comments` skill is shaped the way it is. Read this when changing
it, or when its boundary is in question.

## The problem

Claude gets Azure DevOps PR comments wrong in ways that are visible to other people,
because the failures land on a colleague's pull request rather than in a local file.

Six of them, each one hit for real:

- A suggestion block is anchored so that it renders corrupted. The replacement is inserted
  at the start of the line and the original text survives beside it, or the range runs
  into the next line and swallows it.
- The anchor format is reasoned about rather than copied from a comment that already
  renders correctly, so the same mistake is made twice in different directions.
- A line's length is read from the working tree, which can hold an uncommitted edit, so
  the number is wrong and nothing says so.
- A pull request is reported as ready to merge once approvals land, when an unresolved
  thread is holding a blocking policy and nothing will merge.
- A thread's status is set to the word shown in the web interface. The API does not know
  that word, stores nothing, and the merge gate opens.
- The threads the API returns are reported as the pull request's comments, including ones
  that were deleted and that nobody can see. The response gives no sign of the difference.

The last three share a shape worth naming: all of them look like success. None produces an
error, and the damage is only visible to someone who checks.

## The solution

One reference skill for the mechanics: how a comment is anchored, the calls that create,
read, reply to, edit, delete and resolve a thread, what a thread's status stores, and what
an unresolved thread does to a merge.

It does not say what a comment should contain. That is a separate skill, about how a
review is done here, and it does not exist yet.

## What Claude needs it for

Each of these is a task Claude was doing when the mechanics bit.

1. Posting a suggestion on one line, so the block replaces that line rather than being
   inserted before it.
2. Suggesting a change that needs a new import, so the suggestion is applicable at all
   rather than being split across two threads or left as prose.
3. Looking at a suggestion that rendered oddly, so the range is checked rather than the
   block rewritten.
4. Finding a line's length, so an uncommitted edit in a worktree cannot supply the wrong
   number.
5. Replying to a thread someone else opened, so the reply joins that thread instead of
   starting another.
6. Fixing the wording of a comment already posted, so the anchor survives untouched rather
   than being rebuilt.
7. Resolving a thread, so the write lands rather than storing nothing.
8. Answering whether a pull request can merge, so an unresolved thread is not reported as
   ready.
9. Answering whether a comment is resolved, so the answer comes from the reply and the
   diff rather than from a field someone set.
10. Reading what has already been said on a pull request, so deleted comments are not
    reported back as live ones.

## Decisions

**Mechanics only.** How a comment should read is a separate skill. The two are kept apart
because one is platform behaviour that is the same for everyone, and the other is a
statement of how the Supreme Commander wants a review done. They change for different
reasons and on different schedules.

**Nothing about which tool or identity makes the call.** The skill documents the API and
the commands. Which wrapper runs them, and under which account, belongs elsewhere.

**Reading as well as writing.** A comment is rarely the first thing on a thread. Replying,
editing, deleting and resolving all need the read side, and querying a comment that
already renders correctly is the fastest way to get an anchor right. Reading also needs a
filter that nobody would guess at, which is reason enough on its own.

**Techniques are presented without being ranked.** A suggestion that needs a new import
can carry the whole file, or it can show the changed lines and leave the import to the
reader. Both work. The skill says so and does not choose, because the choice belongs to
whoever is writing the comment.

**A section on branch policies, though a policy is not a comment.** Without it Claude
reports that a pull request will merge once people approve, not knowing that an
unresolved thread fails a blocking policy. Resolving threads is part of the review rather
than tidying up after it, and that only makes sense once the policy is understood.

**The status field is described as a claim, not a fact.** `fixed`, `wontFix`, `byDesign`
and `closed` assert four different things about the world and satisfy the merge policy
identically, so the field records what somebody asserted. Whether the comment was actually
addressed is answered from the reply and the diff.

## Out of scope

- What a review comment should say, and how a review is conducted.
- Which tool or identity makes the calls.
- The pull request body and title, which is `pr`.
- The validation build, which is `pr-ado`.
- Work item linking, which is `azure-devops-pr`.
- Creating, completing or abandoning a pull request.

## How the content was established

Every value in the skill was written and read back against the live API rather than
recalled, at `api-version 7.1`, on 26 August and 10 September 2026. The anchor shapes were
posted to a pull request and checked visually, the status values were driven one at a time
while reading the policy back, and the label-to-value mapping came from watching what the
web interface itself sends.

Where a case did not exist it was built. The thread carrying a live comment, a deleted
reply and a live reply was made deliberately, and it broke a filter that had already been
written down as correct.

This is recorded because the claims are unusual: the API accepts a wrong status silently,
and an untested guess about it would read exactly like a tested one. Anyone using the skill
re-checks the risky part anyway, because it says to write the status and read it back.

## Where the deleted-thread rule came from

Testing left four threads on CarKiosk pull request 5911, ids 51184, 51185, 51186 and
51231, whose comments were all deleted afterwards. Azure DevOps has no delete for a
thread, so the threads survive.

Reading that back through the API, they were still there, and the conclusion drawn was
that they were visible on the pull request for ever. They are not. The pull request shows
no comments at all. The threads exist only in the API, with each comment flagged
`isDeleted`.

That is a gap worth more than the mistake. A read that filters only on `commentType`
reports comments that no one can see, on a pull request that displays none, and nothing
about the response says so. The skill's read filter excludes `isDeleted` for that reason,
and 5911 is the case that proves it: filtered, it returns nothing, which is what the pull
request shows.

A second thread was then added to 5911 deliberately, live, with one of its replies
deleted. It showed that filtering at the thread level is not enough. A thread with a live
comment and a dead reply passes any test asking whether the thread has something in it,
and then hands over the dead reply along with the live one. So the filter runs at both
levels, and the skill says so.

That thread also showed that comment ids are not contiguous. With the second of three
deleted, the live comments are 1 and 3. Anything that works out an id from position, or
assumes a reply is comment 2, is wrong as soon as anyone has deleted anything.
