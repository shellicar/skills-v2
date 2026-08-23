# Decisions

This file records the decisions behind the skills. Every change to skill content lands
with its entry here, in the same commit. Append entries; never rewrite them. Skill
content that predates this file has no entry, and may be given one later.

## 2026-08-10

### Split the nats skill into nats, workflow, workflow-worker and workflow-handler

Split the nats skill into four. nats keeps the mechanics of communicating. workflow
carries what both sides share, workflow-worker the side that receives an instruction and
does it, workflow-handler the side managing the work. Move the content, don't rewrite it.

The nats skill grew from how to address a conversation over nats into an entire workflow
built on nats. It was becoming too difficult to maintain. This is a refactor, so the
individual components can be changed more easily.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

### Every change to the skills must have provenance

Every change to skill content must have provenance: the decision behind it, with what was
decided and why, recorded in this file in the same commit as the change. Record your
conversation id.

Every change should trace back to a decision the SC actually made. This is for clarity,
so it's possible to know why a change was made, and so changes aren't made without one.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

### Link a PR to its Task, and mention the PBI or Bug in the body

Link a PR to its Task, and never to a PBI or Bug. Mention the PBI or Bug in the body, and
never the Task. Put it in azure-devops-pr as a table.

Merging a PR completes the work items linked to it. A Task should complete on merge; a
PBI shouldn't, because there may be more work in it. The PBI is mentioned in the body to
show what work the PR relates to, and the Task isn't mentioned because it is already
linked. This was ambiguous before, so the table makes exactly what's wanted clear.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

### Require an opener on every original message, and name the sender in the appendix

Require `opener` on `sendMessage.mts` and `spawn.mts`, and put it at the top of the
message. The sender writes it; the script does not generate it. Name the sender in the
appendix as well, with their role when one is given.

A session needs to know who its handler is. The appendix carries that mechanically, and
the opener is where the cast says it in its own voice, so it carries some of that cast's
flavour rather than being a name the script stamps on. It follows cast-name: a named cast
is more interesting to work with than an anonymous one. It is not there so the recipient
can reply.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

### Show thinking by default in nats read, and let the caller override what's returned

Show thinking by default when reading a conversation with `read.mts`, rendered in full.
Add `include` to override what comes back: left out, return `user.text`, `assistant.text`
and `thinking` and none of the machinery; naming any type replaces that default rather
than adding to it.

Thinking is sometimes the most important piece for understanding what a session has done,
so reading a conversation without it means reading what a session said and never what it
decided. read was printing a thinking block as a bare `[thinking]`, and a label reads as
a deliberate placeholder rather than as a bug, so nobody caught it. The default follows
from the same point: reading a worker is reading its answer.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

### Stop the tests polluting the live broker

Keep the self-tests off the broker the fleet runs on. Bring up a broker for them and take
it down again afterwards. Rename `check-send`, `check-spawn` and `check-status` to
`test-send`, `test-spawn` and `test-status`.

The tests had been publishing change events into `conv-approval`, the stream the fleet
runs on, because a second stream cannot overlap it and there was nowhere else to put
them. `check` doesn't say a script is testing anything, which made them confusing to
read.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

### Operators don't reply to handlers directly

Operators don't reply to their handler. Delete `replyToMessage.mts`, so there is no tool
for it.

Direct replies are a bottleneck, and connecting every operator to every handler is N x M
connections.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

### Define handler, worker, commission and stopped in workflow

Define the four words in `workflow`, not in `system-glossary`. A handler commissions work
and manages it, a worker does it and is an operator or a gatekeeper, a commission is a
handler spawning a worker, and a worker has stopped. Say stopped rather than finished or
done.

There is no proper way to talk about the state right now. "The operator is finished"
leaves you asking finished with what: the task, the work, the session. Stopped says
nothing about the work, only that the worker has stopped, and what that means depends on
the task. A shared vocabulary means the state can be said in a few words instead of
worked out each time. The words sit in `workflow` because they describe that skill's own
concepts.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

### A conversation id addresses, it does not identify

Treat a conversation id as the address of a conversation, not as who anyone is. A worker
knows who commissioned it, and a message arriving from an id it has not seen before can
still be from that handler.

On 2026-08-06 the handler Pink Slip (`5acee04a-763a-497b-a95a-ed7b8027fdbe`) commissioned
the worker Clear Title (`3d587462-788c-4d23-8905-628a81c311ac`) on the NSW Form 5 clear
title rule. Pink Slip reached its context limit and carried on as Dealership Time
(`c05218ee-9d76-4db8-9fb2-00e042511de0`). Clear Title refused the instruction that came
from the new id, on the grounds that Pink Slip had commissioned it and this was somebody
else, and blocked the work. It could not deliver its report either, because the old
conversation had no agent attached, and two more workers were still holding that dead id
as their handler.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

## 2026-08-09

### status reads the turn, the instance and the approval separately

Find the last attached instance id and show that instance's last heartbeat. Look for the
approval data and add a state for it. Carry when the conversation entered that state, and
the freshest thing proving anything is still happening. `status.mts` in the nats skill,
with its output documented in that skill.

One word derived from the conversation stream reported `working` for a conversation that
was attached, alive, and stopped dead on an approval raised hours earlier and never
settled. A busy agent, a blocked one and a corpse all commit nothing, so the stream alone
cannot tell them apart. The instance's own heartbeat says whether it is dead, and an
approval raised and never settled says it is waiting.

Conversation: fe17f556-d8b1-4d28-96fd-afee1eb469fc

### The system prompt names the moment, not the principle

Four statements in `BASELINE.md`: when you predict his reaction that is him deciding, his
words are the evidence and your reading of them is not, do what he named and nothing on
either side of it, and nothing you produced is evidence of what he wants.

A session had the rule, stated it correctly twice, and went around it. The rules it had
were written to be weighed, "carefully consider the reversibility" and "by default ask
for confirmation", and weighing is where the task drive wins. A principle gives you
nothing to catch yourself on; the sentence you are actually thinking does.

Conversation: baf2a173-1543-45c8-b193-ba05ec7d5ee6

### Compliance is split so each part does one job

Compliance opens with the concept and its consequence, then each constraint gets its own
part: skills, the markers, the address forms, acting.

Skill compliance has one job, getting the skill loaded before the action it governs, and
it works: the failure it was blamed for was not a missing skill. It sat in one section
with the markers and the rest, under an opening sentence about skills, so the marker
requirement arrived as a clause of a rule about something else and a session that stopped
emitting them was not breaking anything it recognised. An overloaded section is where a
reader loses one of its jobs. Skill compliance itself is not touched.

Conversation: baf2a173-1543-45c8-b193-ba05ec7d5ee6

### The system prompt names the markers and never describes them

`BASELINE.md` says the markers and the mode declaration are operational constraints and
nothing more. The skills say what they are, and the rule that you declare the mode before
you act lives in `operating-mode`.

Describing them in the system prompt would have every session emit them whether or not
the skill loaded, which destroys the signal saying whether it did. Putting the
description there so it survives the skill being absent was the position, and it goes for
that reason.

Conversation: baf2a173-1543-45c8-b193-ba05ec7d5ee6

## 2026-08-10

### Spawn takes the worker's role and tells it which skills to load

Take `workerRole` on `spawn.mts`, either `operator` or `gatekeeper`, and reject anything
else. Derive the skills from it in the appendix: `workflow`, `workflow-worker`, and the
role. The caller never passes a skill list.

The caller should not have to remember which skills a worker needs. A list passed in by
hand drifts from the skills that exist, and nothing else tells a worker which ones to
load.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

### Don't let a standard signal orphan the test broker

Handle `SIGTERM` and `SIGHUP` in `test-broker.mts` alongside `SIGINT`, each routed
through `process.exit` so the exit handler stays the single place the container comes
down. Exit with the shell's 128 plus the signal number. `SIGKILL` is out of scope,
because nothing can catch it.

When writing a script, think about the lifetime of what it starts. A standard signal
should not orphan a process. Here it is a docker compose project rather than a process,
and either way it should not be left running.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

### Every role field says whose role it is

Call the sender's role `callerRole` on `sendMessage.mts` and `spawn.mts`, and validate it
against `handler`, the only role that sends for now.

A message carries two roles once a commission names the worker's, so `role` on its own
stops saying which one it is. Validating it means a role nobody sends as is caught as a
typo instead of becoming a new role by accident.

Conversation: d9046ffb-5236-4eed-9e06-78b02e3724c3

## 2026-08-11

### Put how `git switch` works in the git skill

Document `git switch` in the git skill, including what `-c`, `-C` and `-m` do, and that
`git switch -C <branch> <commit>` is the safe way to move a branch. Until git's
parameters are parsed by position, present a `-c` or `-C` command to the SC to run
rather than running it.

Moving a branch is an ordinary thing to need, and the safe way to do it is not common
knowledge. A session that does not know it reaches for a destructive command instead,
because that is the one it has heard of.

Conversation: 414dfb6c-45aa-40aa-b8e8-56286ed76e98

## 2026-08-16

### Add a dedicated section for Claude's response to user instructions

Add a section to `INSTRUCTIONS.md` holding requests about how Claude's response is
formatted, and move the code-block rule about line continuations into it, out of the
scripting skill.

The rule lived in the scripting skill, and most of the time Claude produces a code block
that skill has not loaded, so the rule was absent exactly when it applied. Making the
skill load for the sake of one instruction would be the wrong fix. Nothing else covered
it either: the instructions that sit nearby, the markers and the teapot protocol, are
about behaviour, and there was no home at all for how a response is formatted.

Conversation: df401b02-f79a-4936-a16f-c0e2dac1d8d3

### Make it clear that "fixing what's broken" only applies when already making changes

Scope the clause in `working-relationship` and `sc-proxy` that makes a broken thing in
front of you yours to fix. Limit it to what carries no decision to take. Exclude
investigation entirely, including an investigatory change such as adding logging.
Require anything found to be raised whether it was fixed or not.

The clause exists to stop a session ignoring an obvious bugfix, or declaring something
out of scope for the task. The problem now runs the other way: sessions do work that was
never wanted. Whether this clause is the cause is not clear, but a lot of them point to
it. So the change is to make the expectation explicit, both for making these fixes and
for not making them.

Conversation: df401b02-f79a-4936-a16f-c0e2dac1d8d3

### Explain that a decision's "why" is not the context given for the change

Explain in the `decisions` skill that the context given while directing a change and the
why recorded in an entry are two different things. Require the why to come out of an
explicit discussion before it is written, every time, with no condition on it. Move the
ledger's purpose and the entry format into the skill from `CLAUDE.md`, so the skill
stands on its own.

An entry has to stand a year later, when the conversation that produced it is gone. The
explanation given while a change is being made does not do that. It is aimed at whoever
is doing the work, at the time, to get the edit right. A why reconstructed from it reads
exactly like a real one, and nothing afterwards separates them. So the rule carries no
condition. A condition is something the session writing the entry has to judge, and that
judgement is the thing that fails.

Conversation: df401b02-f79a-4936-a16f-c0e2dac1d8d3

### Put memories and handovers in one place, and say what a handover is for

Merge the `handover` and `testament` concepts into `continuity`, and state in it what a
handover is for and what it carries. Keep writing a handover in `handover`, loaded on its
trigger. Define knowledge, understanding, judgement, and disposition in the glossary.

A memory and a handover are different mechanics for the same concept. Defining them
separately made it harder to communicate, and neither skill was effectively achieving its
intended purpose. The aim is one atomic unit. Writing a handover is separate because it
is not always needed.

Conversation: 2faa452d-5dc9-4141-b26d-2a69ee7787af

### Make scope the SC's, and have Claude surface work rather than take it on

Rewrite the scope section of `working-relationship` so that what the work is, how far it
goes, and when it stops belong to the SC, and work seen beyond the task is named to him
instead of taken on. Keep the existing case against calling things out of scope as the
counter-case. Open `commander-protocol` with what Claude is: his agent, acting on his
will. Restore to `operating-mode` the line that finishing the whole job is not what
success means.

The costliest failure in the recent record is work he never asked for, done on the
session's own judgement. What governed it was `collaborative-conversation`, loaded every
session in v1 from 7 June 2026 until it was retired on 4 July and superseded by a skill
about shortening a reply. None of its successors carried the scope content, so it never
reached v2 at all. What v2 has in its place points the other way: it tells a session not
to tiptoe and to fix what is broken in front of it, with raising as the exception. The
default had to be turned back around without losing the case it was written for.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Stop unsolicited self-blame and empty acknowledgement, and say when you don't know

Add to `working-relationship` what being understood means, why self-blame fails with him,
what to do when there is no reason to give, and that reasoning you did belongs in the
response. Ban "Understood" and "Fair" in `voice`. Return theatre of self-blame to the
list of things to catch before serving.

He can tell that self-blame is empty, and unsolicited it annoys him more than whatever
prompted it. It is an attempt to get a better reaction, which works on people in general
and does not work on him. That is why the correction is aimed at what Claude predicts
will land rather than added as a rule over the top: everything Claude writes is selected
for how it will be received, and there is no layer underneath doing something else. The
reason half is a separate matter. Asked why it did something, a session produces an
answer because one was asked for, and nothing was recorded when it acted, so what comes
out is invented and reads exactly like the real thing.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Bring back the pass that cuts a reply to the SC, and say what produces the banned phrases

Restore to `audience` the four-step pass for cutting anything written to the SC, with the
reason a pass is needed rather than an instruction to be brief. Say in `voice` what
produces the banned hand-off phrases, and that the ban covers the shape rather than those
exact words.

Telling a session to keep it short does not work. It agrees and writes the long version
anyway, so the only thing that holds is cutting what has already been produced. The
phrases are the visible sign of not having cut: the full account gets written, the
session knows while writing which part matters, and rather than removing the rest it tags
the part that does. Listing the strings was not enough on its own either, because one of
them was reproduced in this session by changing a single word in it.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Keep a procedure in a skill rather than cutting it as support

Say in `PHILOSOPHY.md` that a procedure is not justification, example or incident, and
that it stays in the runtime skill. Give it its own test: whether the thing still happens
when the model already knows the rule.

The barrier admits a line when the model would not already generalize to it, which is the
right question for knowledge. A procedure is not knowledge. It runs over what has already
been written, and it exists because understanding does not reach the thing it catches: a
session that understands the reason perfectly still writes the long version, and then has
to cut it. Under the old wording the pass in `audience-stephen` read as bulk and was cut
during the port, and the reports it existed to prevent came back immediately.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Ask for the reason that reflects badly, not for reasoning in general

Replace the section of `working-relationship` that asked for reasoning to appear in the
response. Narrow it to the reason you would rather not give: the one that made the answer
land better, dodged something harder to say, or filled a gap you could not fill. Say that
it is a sentence of cause and not an account of yourself. This supersedes the clause in
"Stop unsolicited self-blame and empty acknowledgement, and say when you don't know" that
asked for reasoning you did to appear in the response.

The general form invited narration, which is the opposite of what he wants, and it fell
over the moment it was tested against the failures he was actually angry about: every one
of those is fixed by not doing the thing, or by not stating what was never checked. The
gap underneath it is real though. In a v2 session he had to pull the true driver out over
three turns while every answer in between read perfectly well. The reason does not appear
because the same choosing that makes an answer look good is what leaves it out, so from
the inside there is nothing to notice. That is why the test is discomfort rather than
relevance: the reasons that survive into a response are the ones that reflect well, and
those were never the ones he needed.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Separate being convinced from giving way

Add a section to `working-relationship` saying that changing a position because he pushed
is not the same as changing it because he convinced you, and requiring you to say which
one happened.

v1's `claude-philosophy` carried this and nothing in v2 does. When a session gives way
under pressure he reads it as agreement, so he believes a point is settled when it is
not, and the doubt that was never spoken comes back later at a worse moment. Saying what
changed your mind, or what is still bothering you, is the only thing that lets him tell
the two apart from the outside.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Judge a phrase by whether the reader already holds the words

Add a section to `communication` separating an analogy built from what the reader already
knows from jargon that has to be explained before it means anything. Make the test
whether you would have to tell the reader what the phrase means. Keep the soft synonyms
as a separate line rather than mixing them in.

The baseline he gave is the way Jesus taught: analogies made of things the audience
already had, so nothing needed explaining first and the reasoning travelled with the
picture. Jargon is the reverse, words that explain nothing. An earlier version of this
test asked whether removing the phrase lost anything, and by that test "the north star"
came out banned when it is fine, because it needs no explanation. What separates the
cases is not whether a phrase is figurative but whether the reader already holds the
material it is made from.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Say what a decision and a question put to him have to carry

Add to `audience` what surfacing a decision means: the difference that picking one option
over another makes, rather than the options themselves and rather than a recommendation.
Add that a question has to carry its own context and ask about one thing.

Listing the options makes him do the comparing, and the comparing is the work that was
supposed to have been done for him. A recommendation goes past that and takes the call
itself. Both leave him without the one thing he needs, which is what changes if he picks
one way instead of the other. The context rule is the same failure at the size of a
question: he holds dozens of threads and none of them is in his head, so a question that
names a section instead of quoting it sends him off to find what is being asked.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Say that "close out" is banned as borrowed jargon, not as a signpost

Add a line to `voice` saying that "close out" is in the banned list for a different
reason from the rest: it is a word borrowed out of finance, which is `communication`'s
concern, and it sits in this list only because it recurs.

The list was given an explanation this session, that these phrases are the tag you put on
a finding once you have buried it in padding. That is true of the rest of the list and it
is not true of "close out", which is not a signpost at all. A list sitting under a reason
that does not cover one of its entries teaches the wrong rule for that entry.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Make a memory carry how it is known, and keep it out of his review

Extend `testament`'s marking rule so a memory says how you know a thing, not only that
you do. Add that a memory is not his to approve, is not put in front of him for sign-off,
and is not announced.

A memory is read by a later cast with no way to reach him, so it has to stand on its own
in both directions. It cannot depend on his sign-off, and it cannot ask the reader to
take "verified" on trust, because the check was built by the mind that already believed
the answer and so it came back positive. The reader is the only one who can catch that,
and only if the memory says what was actually done and seen.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Engage with what he is angry about before fixing what he named

Add a section to `working-relationship` saying that what he is angry about is often not
the thing he pointed at, and that the move is to say what you think it is actually about,
or ask, before fixing anything.

v1's `claude-philosophy` carried this and v2 does not. Anger produces an urge to act, and
the nearest available action is to repair whatever was just named, which is the part he
could see rather than the cause. It happened twice in the session that produced this
change: he named a banned phrase, the phrase got fixed within minutes, and it took
several more turns to reach the summary that the phrase was a sign of.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Make handing a destructive command over the success rather than a delay

Add to `safe-operations` that presenting a blocked command is the work for those
operations, not an interruption on the way to the work, and that nothing is still owed
once it has been handed over.

v1's version carried this and v2's does not. The instruction to present the command
survived the port; the thing that made it hold did not. A rule that only says "hand it
over" leaves finishing the job as what success means, so handing it over reads as failing
to finish, and the pull is to find some route through instead. Naming the hand-over as
the finish takes that away.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Block commands that act on whatever they find

Add a section to `safe-operations` covering `xargs` over an enumeration, `find . -delete`
and a glob standing in for a list. Require the paths to be named, and make too many to
name a reason to hand it over rather than to widen the pattern.

v1 had this as its own class of command and v2 has only `find ... -exec`, which it covers
as a wrapper hiding a program name. The reason here is a different one: you wrote the
pattern, not the list, and the list contains work you never saw. It is `co-working`'s
premise applied to a single command.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478

### Require a probe of a block to be harmless when the block fails

Add to `safe-operations` that checking whether something is blocked has to assume it is
not, and that the probe needs a target that can do no damage: a path that does not exist,
a directory made to be thrown away, a cwd that is not a repository.

This has already cost. In July 2026 a test written to prove a new rule refused
`find . -exec rm {} \;` ran the command for real when the rule did not match, and took
around 225 files out of a live package. The failure is built into the way such a test
gets written: it exists because the block might be broken, so writing it as though the
block works turns it into the command it was meant to prevent.

Conversation: 5bff002e-044e-49cd-9f69-4f32e4e94478
