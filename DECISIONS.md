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
