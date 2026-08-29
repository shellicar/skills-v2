---
name: workflow
description: |
  WHAT: how commissioned work runs — where a report goes, which way waiting points.
  WHY: each side holds half of it, and the halves have met wrong and deadlocked.
  TRIGGER WHEN: commissioning work in another conversation, or doing a commission.
---

# Workflow

Work runs through more than one conversation. What both sides need is here;
`workflow-commissioner` and `workflow-commissionee` carry the half that is yours. `nats`
is how the conversations are read and written.

## The words

They name a relationship, not a role, and they say nothing about who is at either end.
You are a commissioner of whatever you commissioned and a commissionee of whatever you
were commissioned to do, so you are often both at once. The SC is the commissioner at
the top of every chain.

- **commission** — working under another's instructions.
- **commissioner** — the one whose instructions they are.
- **commissionee** — the one working under them.
- **brief** — instructions from a commissioner to its commissionee.
- **report** — a commissionee's answer to its commissioner.
- **stopped** — a commissionee has stopped running. Say stopped rather than finished or
  done, which describe the brief; whether the brief was carried out is a separate
  question.

## A conversation id addresses, it does not identify

A commissionee knows who commissioned it. A conversation id is how you reach a
conversation, not who anyone is: a commissioner that runs out of context carries on in a
new conversation with a new id, and a commissionee holding only the old id has lost it.
So a message can arrive from a conversation you have not seen before and still be from
whoever commissioned you.

## A brief is sent, a report is not

A brief is sent. The commissioner says it directly into the commissionee's conversation.

A report is not sent. It is part of the commissionee's own response, written in its own
conversation: the finished work, a blocker, a question it needs settled. Whoever
commissioned it watches that conversation with `status.mts`'s `wait` and reads it where
it sits, so nothing has to be published into theirs. The recipient of a brief never
writes back.

That is also why a report cannot fail. A say into a conversation that is mid-turn is
rejected as stale, so a report written outward failed exactly when it mattered most: it
happened twice in one night, once to a finished review and once to a commissionee that
needed a decision. An answer that never leaves your own conversation has nothing to be
rejected by.

## Waiting is directional

**You wait on what you commissioned, and never on whoever commissioned you.** Two waits
pointing at each other is a deadlock, because a conversation that is waiting is mid-turn
and so cannot go idle, which is the very thing the other one is waiting for. It has
happened: a session whose say was rejected as stale waited for the one above it to go
idle, while that one was waiting on it, and the SC had to break it by hand.
