---
name: workflow
description: |
  WHAT: how commissioned work runs — where a report goes, which way waiting points.
  WHY: each side holds half of it, and the halves have met wrong and deadlocked.
  TRIGGER WHEN: commissioning work in another conversation, or doing a commission.
---

# Workflow

Work runs through more than one conversation. What both sides need is here;
`workflow-worker` and `workflow-handler` carry the half that is yours. `nats` is how the
conversations are read and written.

## A report is written where it sits, not sent

Your report is the answer you write in your own conversation: the finished work, a
blocker, a question you need settled. Whoever commissioned you watches that conversation
with `status.mts`'s `wait` and reads it where it sits, so nothing has to be published
into theirs.

That is also why it cannot fail. A say into a conversation that is mid-turn is rejected
as stale, so a report written outward failed exactly when it mattered most: it happened
twice in one night, once to a finished review and once to a worker that needed a
decision. An answer that never leaves your own conversation has nothing to be rejected
by.

The recipient of a message does not write back: it answers in its own conversation, and
you watch that conversation with `status.mts`'s `wait`.

## Waiting is directional

**A handler waits on its workers, and a worker waits on nobody.** Never on your handler,
never on anything above you. Two waits pointing at each other is a deadlock, because a
conversation that is waiting is mid-turn and so cannot go idle, which is the very thing
the other one is waiting for. It has happened: a worker whose say was rejected as stale
waited for its handler to go idle, while the handler was waiting on that worker, and the
SC had to break it by hand.
