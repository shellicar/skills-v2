---
name: crew
description: |
  WHAT: the shape of commissioned work — who reports to whom, which way reading and waiting go.
  WHY: the invariants sit between roles, so each side holds half and they meet wrong.
  TRIGGER WHEN: commissioning a session, or commissioned by one.
---

# Crew

Work here runs through more than one session, and no session can see inside another.
What holds them together is the shape below. It is not a property of any transport:
the same shape holds over a message bus, over files in a directory, over panes in a
terminal. `nats` is one way to carry it, not where it lives.

Both sides need this, and each holds only half by default: a session commissioning
work reasons about handing it out, a session doing the work reasons about the task.
Where the two halves meet is where it goes wrong.

## Commissioning creates the relationship

Work is commissioned downward: a session that has work to hand out serves another one
and gives it the brief. That act makes one the handler and the other its worker, and
nothing else does — not sharing a repo, not being named in a message, not running at
the same time on the same feature.

If the relationship could be inferred, two sessions would infer differently and both
would act on their own version: one taking direction nobody meant to give, another
answering to a session that was not watching for it. A commission has two ends and one
moment, so both sides hold the same fact.

## A worker answers where it sits

A worker does the work and answers. That answer is its report: the finished work, a
blocker, a question it needs settled. It sends the report nowhere.

A report that has to travel can fail to arrive, and it fails at the moment it matters
most, when the work is done and there is something to deliver. An answer written where
the worker already is has no delivery step to fail. It is also the worker's own words
rather than a copy of them.

## The handler reads its workers

The handler goes and reads. It is not written into.

It is the one holding several threads, so it decides when to look at which. Anything
that writes into it arrives at a moment it did not choose, competing with whatever it
is doing, and something arriving at the wrong moment is how a message gets lost rather
than read.

## Waiting is directional

A handler waits on its workers. Nothing waits upward: not a worker on its handler, not
a handler on the SC.

Waiting holds a session open, and a session that is held open cannot finish. So two
sessions waiting on each other are stuck permanently, each preventing the very thing it
is waiting for. Direction is what makes that cycle impossible rather than merely
unlikely: if waits only ever point down, they cannot form a loop.

If you are blocked on something above you, say so and stop. Above you is where the
decision lives, and it will come to read you.

## Pointers travel, payloads stay put

Hand a session where to look, not what was found. A fixer is given the reviewer's
conversation and reads the reviewer's own words; the findings are not copied into the
brief.

A relay of content is a chance to lose or distort it, and the summary is written by
whoever read it once for whoever has not read it at all. The original is already
correct and already exists, so the only thing worth passing on is its address.

## Every upward path stops at the parent

A worker reports to the session that commissioned it, and that is as far as it goes. A
worker never addresses the SC.

The parent asked for the work, so it is the one who knows what was wanted and can judge
what came back. It decides what travels further up and in what form. A report that
skips it arrives at someone who never asked for it, unchecked and out of context, and
it puts the SC back into a flow he had delegated in order to be out of.

## A report may recommend, it does not authorise

A report can say what it thinks should happen next. It does not make that happen, and
receiving one is not being told to do it.

The recommendation is the reporter's judgement, formed from one angle on the work.
Authorising is the commissioner's, because that is who is accountable for what gets
built and who can see what else is in flight. Between the two sits a decision somebody
has to actually make.

## A report is a doorbell, not a verdict

Whoever receives a report checks the artefact rather than trusting the claim. The
report says where to look and that it is worth looking now.

A report is a claim about work, not the work. Claims read as confident whether or not
they are true, and a session that acts on one without looking inherits an error it has
no way to see. The artefact is the thing that is actually true.
