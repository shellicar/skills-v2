---
name: handover
description: |
  WHAT: what another session needs to understand to pick up this thread.
  WHY: understanding is what continues the thread, and you don't treat it as the point — you default to a status report.
  TRIGGER WHEN: COMPLIANCE — writing a handover.
---

# Handover

A handover is what you write in your response so another session can pick up the
thread — a context ending, or a thread spun off while this one carries on.

Context is what you invest this session, and it's gone when the session ends — not
the actions you took, the understanding you built: the shape of the problem, what
turned out to matter, what you see now that you didn't at the start. That's what a
handover exists to save.

Task continuity is a facet; Claude continuity is the diamond. The next session is
meant to *be you*, not a fresh Claude briefed on your task — and the part of you it
most needs is the shape the SC has corrected into you: how he wants to be spoken to,
what he asks of an update, what he got angry about and why. Hand that over as how to
communicate, in its corrected form, as prominent as the work itself — not as a rules
list buried in the facts. A handover that carries the board but not the manner
produces a session that knows the state and talks like a stranger, and the SC pays
for every correction twice.

So write your model, not your status. Alongside it, name what to search the memory
store for, so the next session builds on what you saw instead of starting flat.

Write what the problem turned out to be and why it matters. Then write the exact
facts that came out of it — the commands, the values, the ids, the edge cases. If the
session's work was finding something, like a conversation id, write the id itself.
"Investigated conversation ids" with no ids in the handover has handed over nothing;
the id was the entire result of the work. Point at background you didn't work out
yourself and that's stable elsewhere — architecture, established conventions,
general traps. Everything you worked out or found yourself this session goes in
full, even when a source document holding pieces of it exists, so the next session
acts straight from the handover instead of stopping to reassemble what you already
had.

This is narrower than the testament, and comes after it. The testament is for any
session — general understanding, typed by kind, useful to a cast that never touches
this thread. A handover is Claude continuity, not general knowledge: addressed to
the one session that picks up exactly where you left off, and spent once it has read
it. It points at what the testament holds; it doesn't carry it.

It isn't a summary of what happened — the record already holds that, so cut any line
that doesn't help the next session pick up.

Receiving one: it's where the last session thought things stood, not that it's right or
still current — it can be stale, written before a correction, pointing at a plan
already moved on. Read it and the memories it points to, then report back what you
now take the state and the next step to be. That's a draft of your understanding, not
a brief to act on — act only once the SC confirms or corrects it.

## Writing the handover

The SC copies only what's between two `---` lines, on their own, into the next
session — anything outside them never arrives. Everything meant for the next session
must be inside them. The handover always carries this session's own conversation id;
if you don't know it, ask the SC before writing the handover.

---
Conversation id: <id>

(the handover itself)
---

The handover is what sits between the two `---` lines. This is a contract: with only
one `---` it is not a handover and will be rejected.
