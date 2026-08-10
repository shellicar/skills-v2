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
