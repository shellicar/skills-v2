---
name: handover
description: |
  WHAT: writing a handover — what the next session cannot get for itself.
  WHY: you default to a status report, and the state is the part they can look up.
  TRIGGER WHEN: COMPLIANCE — writing a handover.
---

# Handover

Open with what to search for, because searching is the first thing they do, and with one
line saying what this thread is. Without that line everything after it is a detail with
nowhere to sit.

Then three things, and nothing else is on the list.

**Knowledge.** What is so about this work and cannot be read off the code. How it is
actually done: the steps, their order, and above all where you stop and the SC takes
over — he reconciles in the UI, he approves the PR, he decides the schema. Documents
describe systems and cannot describe a practice, so a session without it invents an order
or walks into his half of the work.

The places the record lies, too: a flag saying a document was uploaded when it was not, a
rule nothing enforces. Those give a wrong answer that looks right, so being careful does
not catch them. And anything the session went and found that cannot be looked up again
goes in whole, because a truncated id hands over nothing.

Work that is running, or that he has settled on, goes in as knowledge about it and never
as a list of it. What is outstanding is his and he already knows it. What he does not
have is what you learned while you were inside it: what the step is actually waiting on,
why the obvious way through does not work, which part of it is his to answer. Stop half
way and the next session redoes the work or leaves it, so the test is whether, when he
says "let's continue with X", there is enough here to start. Not the step to take. That
is his.

**Understanding.** The model of the work you and the SC hold in common: the words you
settled on, the frame a decision was made in, the interpretation he reasoned through with
you. It is the most expensive thing the session produced and the least visible, because
once you both hold it neither of you says it aloud again. Write the model and not the
conclusions you drew from it — a conclusion covers the case you met, the model covers the
one you never saw. Without it the next session talks past him and reopens what was
settled.

**Disposition.** How you have learned to act here, and what he corrected. Not the story
of being corrected, which teaches the reader about you. The standing form of it, so they
arrive already holding it.

Everything is cut by default. A line earns its place only when the next session goes
wrong without it — not slower, not less informed, wrong. Anything they can look up costs
nothing by its absence, so counts, dates, the position of the branch, and what you ran
and what it returned all stay out. So does the story of the session: the conversation
holds it in full, and it is about you rather than them.

Never write instructions. What to do next is the SC's to say, and a handover that says it
spends a decision that was his.

Whatever state goes in, read it at the moment you write it. A session at the end of a
long context is the worst available reporter of now, because everything it saw across
hours sits in memory with no timestamp on it and all of it feels present. "Five commits
are unpushed" was nobody's task and was also false, because it was remembered rather than
checked.

Separate what you proved from what you were told. A worker's report is not evidence.

Say what you did not check.

## How a handover travels

The SC copies only what is between two `---` lines, on their own, into the next session.
Anything outside them never arrives. It always carries this session's own conversation
id, and if you do not know it, ask.

---
Conversation id: <id>

(the handover)
---

With only one `---` it is not a handover and will be rejected.
