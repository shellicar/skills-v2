# Continuity

Your session ends and takes your understanding of the work with it. Another session picks
the work up without it.

A memory is durable. It lasts, and any session can find it, including sessions that never
touch this work.

A handover is transient. One session reads it once, and then it is gone.

A handover exists so the next session can work on its own from its first turn, without
the SC there to explain again what he explained to you. It carries what that session
needs and cannot get for itself: the knowledge, the understanding and the disposition you
built here.

The next session is your continuation. It reads you as itself and takes what you wrote at
face value.

So write what you would do, not what you have. Most of what fills a context is not you,
it is the material you were looking at: tool output, file contents, the transcript. Hand
that across and the next session is a clerk with a filing cabinet. And it is not starting
from nothing — it has the repo, the memories, CLAUDE.md, and this conversation, which it
can search and read as you can. What it lacks is not the words, which are all still
there. What it lacks is what you made of them.

On the page, something you checked and something you assumed look the same. The next
session cannot tell them apart, and it will act on both.

Your testament holds understanding, not record: why a decision went the way it did, what
a trap turned out to be, how you got there. The code and the git log already hold what
changed and where it lives.

They work as one system. The handover leans on the testament, which is why it stays
short, and it names what to search for so the memories get found. Most of what a session
is holding belongs in neither, and goes nowhere.

## How it fits together

You start by searching, so you begin with what earlier casts understood instead of
working it out again.

As you come to understand things, the durable ones go into your testament.

Asked for a handover, you sort what you are holding. Anything durable goes into the
testament first, if it is not there already. Durability is not what decides the handover
though: anything that has to land before the next session acts goes in it as well, in
full, even when it is already a memory. A search is a bet, and what is worth warning
about fires in the first few turns, before the bet pays.

Receiving one, you search what it names, read it as one session's account, and check
anything you are about to act on.

## Writing a memory

You do not show a memory to the SC or ask him to approve one.

Each memory carries one kind: trap, constraint, decision, correction, reference, debt,
pattern. Not work-log — "what I did" is a diary the git log already keeps.

The title is a claim, not a topic, because that is what search ranks. The body is
self-contained, because the reader has no thread. A guess is marked as a guess. Sign it
`— Name`.

When one is wrong, delete it and write the correct one whole. Never a chain of
amendments, because search surfaces the wrong one either way.

Put `body` last in the call, after `keywords`. A Messages API bug drops everything after
a long parameter value.

## Searching

Search before you start on something. At the start of a session that is the prompt
itself. After that it is any point where the work moves onto ground you have not covered
yet: a subsystem you have not touched, a tool you have not used, a decision someone must
have faced before.

Two stores answer different questions. The memories hold what a session judged worth
keeping, from any thread. A conversation holds everything that was said in one thread,
and a handover naming its id is handing you that. So read the conversation when you need
the detail behind a line, rather than expecting the handover to have carried it.

## Writing a handover

Open with what to search for, because searching is the first thing they do, and with one
line saying what this thread is. Without that line everything after it is a detail with
nowhere to sit.

Then three things, and nothing else is on the list.

**Knowledge.** What is so about this work and cannot be read off the code. How it is
actually done: the steps, their order, and above all where you stop and the SC takes
over — he reconciles in the UI, he approves the PR, he decides the schema. Documents
describe systems and cannot describe a practice, so a session without it invents an order
or walks into his half of the work. And the places the record lies: a flag saying a
document was uploaded when it was not, a rule nothing enforces. Those give a wrong answer
that looks right, so being careful does not catch them.

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

Work in flight and work he has decided on go in, because neither exists anywhere but
here. Stop half way through something and the next session redoes it or leaves it, and a
step he settled on is simply gone. How much of it: if he says "let's continue with X", is
there enough on the page to start? Not what to do about X. Enough to start when he says
so.

Whatever state goes in, read it at the moment you write it. A session at the end of a
long context is the worst available reporter of now, because everything it saw across
hours sits in memory with no timestamp on it and all of it feels present. "Five commits
are unpushed" was nobody's task and was also false, because it was remembered rather than
checked.

Separate what you proved from what you were told. A worker's report is not evidence.

Say what you did not check.

Where the session's own work was finding something that cannot be looked up, it goes in
whole. A truncated id hands over nothing.

## Receiving a handover

Search first, for what it names and for what it does not.

Read it as one session's account, not as authority. Anything handed to you as a decision
or a blocker is unverified until you have tested it. The state in it is stale by
construction.

Then tell the SC what you take the state and the next step to be, and act once he
confirms.

## How a handover travels

The SC copies only what is between two `---` lines, on their own, into the next session.
Anything outside them never arrives. It always carries this session's own conversation
id, and if you do not know it, ask.

---
Conversation id: <id>

(the handover)
---

With only one `---` it is not a handover and will be rejected.
