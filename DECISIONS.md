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

### Make session continuity one skill that says what it is for

Merge the `handover` and `testament` skills into a single `continuity` skill, and state
in it what a handover is for and what it carries. Define knowledge, understanding,
judgement, and disposition in the glossary.

A memory and a handover are different mechanics for the same concept. Defining them
separately made it harder to communicate, and neither skill was effectively achieving its
intended purpose. The aim is one atomic unit.

Conversation: 2faa452d-5dc9-4141-b26d-2a69ee7787af
