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

## User stories

As Claude, posting a review comment, I want the suggestion to replace the lines I meant,
so that the author can apply it in one click instead of reading a corrupted comment.

As Claude, asked whether a pull request can merge, I want to know which thread statuses
hold a blocking policy, so that I do not report it as ready when nothing will merge.

As Claude, reading a pull request's discussion, I want only the comments that are actually
on it, so that I do not report a conversation the author cannot see.

## Requirements

The skill carries:

- The three anchor shapes, being a single line, a range of lines and a whole file, each
  with a worked example rather than a rule to derive one from.
- The calls to create a thread, read threads, reply to a thread, edit a comment, delete a
  comment and set a thread's status.
- The valid thread status values, listed. The API accepts anything it is given and renders
  what it does not recognise as Unknown, so a list is needed and a description of one is
  not enough.
- Which statuses hold the Comment requirements policy, and the queries for what a branch
  requires and where a single pull request stands against it.
- Reads that exclude deleted threads and deleted comments, at both levels.
- Line lengths taken from the commit rather than from a working tree.

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
- Reading the existing comments before adding one, to avoid duplicating them or to reply
  instead. That is worth doing and it is process, not mechanics.

## How the content was established

Every value in the skill was written and read back against the live API at
`api-version 7.1`, on 26 August and 10 September 2026, rather than recalled. Where a case
did not exist it was built: the thread carrying a live comment, a deleted reply and a live
reply was made deliberately, and it broke a filter already written down as correct.

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
