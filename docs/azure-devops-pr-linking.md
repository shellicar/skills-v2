# Azure DevOps PR linking

The decision record for removing unauthorised content from `azure-devops-pr` and
`azure-devops-work-items`. Read this to check the skill content against what was actually
agreed, and to write the `DECISIONS.md` entry.

## Problem Statement

A skill said something the Supreme Commander never decided, for twenty-six days, and
nothing on the page distinguished it from what he had.

`azure-devops-pr` carried a paragraph telling the reader not to "fix" a PBI mention that
renders as plain text, on the grounds that a cross-project `#1234` does not become a
hyperlink, and closing with "If you want the reader to reach it, spell out the id or paste
its URL." None of it came from him. It was written into the same edit that carried his
actual correction, so it inherited that correction's authority.

The cost was not theoretical. On 31 August a session quoted the last sentence back at him
as authorisation for a PR description form he then had to correct. Separating his words
from Claude's took a git blame and four searches of the conversation history.

## Solution

Remove the paragraph. Take the one sentence out of the `azure-devops-work-items` section
that the same commit added and that he agreed does not belong. Leave everything he did
decide exactly as it stands.

## User Stories

1. As Claude loading a skill, I want every claim in it to be one the Supreme Commander
   decided, so that I do not act confidently on something a previous session invented.
2. As the Supreme Commander reading a skill, I want to tell my own words from Claude's
   without a blame and a transcript search, so that a false line does not survive for
   weeks and get quoted back at me.
3. As Claude writing an Azure DevOps PR description, I want no instruction telling me to
   paste a work item URL, so that I do not produce a form he has to correct.

## Requirements

Each records something the Supreme Commander said or agreed. Anything in the change not
covered here was not agreed; see "What is mine".

1. **The "Do not 'fix' a PBI mention that renders as plain text" paragraph is removed
   entirely.** His words: "remove the 'Do not "fix"' section entirely, it's 100% wrong".
2. **Related Work Items is a section of the description, not linked work items.** They are
   two different mechanisms that share a similar name. A PBI is mentioned as text; a Task
   is linked as an Azure DevOps relation. His words: "'Related Work Items' IS NOT LINKED
   WORK ITEMS. PBIs get MENTIONED, TASKS get LINKED."
3. **The `azure-devops-work-items` "Which level is yours" section stays as it was.** It
   keeps the rule simple and leaves no confusion about who edits what and why. His words:
   "i think what was there was fine honestly... the reason is it keeps it simple, KISS, no
   confusion about who edits what and why".
4. **One sentence in it is cut:** "Each is the only one holding what its level records: the
   handler has the intent and the decisions behind it, and the operator has what the code
   turned out to need." His words: "right, we can cut this".
5. **The skill states ownership and nothing more.** Tasks are the operator's; PBIs and Bugs
   are given to the operator. His words: "this is ownership, tasks are owned by the
   operators, they are given the pbis/bugs".
6. **A requirements bug must be raised to him.** This holds whoever ends up editing the
   PBI. His words: "either way, mentioning it is required" and "if it doesnt get raised to
   me, then it's already an issue".

## What the paragraph got wrong

Worth stating precisely, so nobody reinstates it in either direction.

The paragraph treated a text mention as a link mechanism that could be broken, and then
offered a repair for the breakage. Requirement 2 is why that fails: the description section
is prose whichever way a `#1234` renders, so there is nothing there to be broken and
nothing to repair.

**The plain-text rendering is real. The cause the paragraph gave for it is wrong.** Whether
a `#1234` in a markdown PR body becomes a rich link depends on whether Azure Boards is
enabled in that project. Where it is not, the body shows a literal `#1234`. That is the
Supreme Commander's, given on 10 September 2026.

It also explains the two sessions that reached opposite conclusions and neither verified: on
4 August one reported PR 7078 auto-linking an Uplift item from a CarKiosk PR, and on 5
August another took an operator's plain-text render as proof that cross-project linking
never works. Cross-project was never the axis, so both were generalising from one project's
Boards setting.

The removal stands on requirement 2 either way. However the mention renders, the section is
prose and there is nothing in it to repair.

## Provenance

The origin of both sections, which a cold session would otherwise re-derive.

- Both were added by commit `32af6763fa42a4778da8a3d4e84db720bda90d5c` on 5 August 2026,
  in conversation `5acee04a-763a-497b-a95a-ed7b8027fdbe`.
- His instruction in that conversation was about auto-close alone: a linked work item closes
  itself when the PR merges, which is right for a Task and wrong for a PBI that is neither
  fully built nor tested. That part of the skill is his and stays.
- The cross-project claim was Claude's own, formed three minutes earlier in the same
  conversation from an operator's report, and never verified. When his correction arrived it
  was kept and repurposed as supporting rationale.
- The "spell out the id or paste its URL" sentence has no source at all.
- In the `azure-devops-work-items` section, only the "Operator: Tasks" bullet traces to his
  words there. The handler and planner bullet, both halves of the prohibition, and the
  sentence cut by requirement 4 were constructed. He reviewed all of it in this session and
  kept everything except that sentence.
- No ledger entry exists for any of it: `DECISIONS.md` was created on 10 August
  (`df2b926`), five days later, so the provenance path has never worked for these lines.
- The table now at the top of `azure-devops-pr` (`513bbf2`, 10 August) already states which
  work item is mentioned and which is linked, so the removed paragraph carried nothing the
  skill needs.

## What is mine, not yours

Read this before trusting anything in the change or in this file. All of it was Claude's and
was never put to him as a decision, or was put and rejected.

- **The claim that Related Work Items might be a real linking mechanism**, and therefore
  that the skill contained a contradiction at its centre. Wrong, and corrected by
  requirement 2.
- **The argument that "handler writes the PBI" is the dangerous option** because the change
  gets lost in the handoff. Advanced as a fundamental finding; it was a reversal of the
  position held one message earlier, driven by his last message rather than by evidence.
- **The two-sentence reduction of the level section** to "Tasks belong to the operator, to
  create and edit. A PBI or Bug is provided before the work is done." Rejected: "thats
  boiled down too much, you took the instruction to write and turned it into what is
  written". It also dropped who writes PBIs, which is the confusion requirement 3 exists to
  remove.
- **The reasoning for cutting the sentence in requirement 4**: that it states who knows what
  rather than who owns what, and hands a reader a premise for deciding the rule does not
  apply to them. He accepted the cut. The reasoning was not his.
- **The heading rename to "Ownership"**, reverted with the rest of the reduction.
- **The proposal that the paragraph removal and the sentence cut are one decision** and
  therefore one ledger entry.
- **Two observations raised and not ruled on.** The same commit rewrote the stated reason
  for the blank-line rule in `azure-devops-pr` from "they do not render as separate
  work-item links" to "they run together as one line", which he did not ask for. And the
  Formatting section of `azure-devops-work-items` says a plain `#1234` does not render as a
  link in a work item description and needs the full `data-vss-mention` anchor form, which
  is adjacent to the removed claim and about a different artifact.

## What was discussed and deliberately left out

The largest part of the conversation was who updates a PBI when the requirements turn out to
be wrong, and **none of it goes into the skill.** His words: "dont try to cover the other
scenarios where saying 1 thing can be wrong because of a new decision, like who updates it,
that's process". Recorded here so it is not mistaken for unfinished work:

- **There is no one right answer**, and the choice between the operator editing the PBI and
  someone else doing it is process rather than correctness.
- **There is a wrong answer:** "no one does anything and no one mentions anything, and the
  change gets lost."
- **The argument against an operator holding the pen**, which is his and is the sharpest
  thing said in the session: an operator that can edit the PBI can make what was delivered
  match what was asked by editing what was asked. Nobody is then left to check that the
  change was valid, or that the requirements were not simply reduced to what could be built.
  The discrepancy that would have exposed it is destroyed by the same act.

## For the `DECISIONS.md` entry

One entry, covering the removal. Its heading names what was decided rather than the edit,
and has to survive a different implementation of it.

The material for the why is the Problem Statement above: the content was never authorised,
it read on the page exactly like content that was, and it was acted on as authority
twenty-six days later.

**This is not the entry, and the why above is not his.** The `decisions` skill requires the
why to be discussed with him explicitly before it is written, because a reconstructed reason
reads exactly like one he gave. He has not given it. Two attempts to ask framed the question
wrongly, first around the ownership rule and then around the single sentence; the subject is
the branch's change, which is the removal.

Whether the stashed sentence cut belongs in the same commit as the paragraph removal, and so
under the same entry, is undecided.

## Out of Scope

- Everything the paragraph's neighbours say about link versus mention, which is his and
  unchanged: the table, the two bullets, the auto-close reason, and the shape-of-a-PR line.
- Who updates a PBI carrying a requirements bug, and when. Process, per the section above.
- Whether the Azure Boards rendering rule belongs in a skill, and which one.
- The rest of `azure-devops-work-items`: the creation sequence, the CLI gotchas, the
  description field rules, formatting, and type changes.
- The two observations raised and not ruled on, listed under "What is mine".

## State

Branch `fix/wrong-pr-linking`, sitting on `origin/main` at
`2f00fd448b3e86997cbe59437ac67b604fc3cf90` with no commits of its own, unpushed, no PR.

- The paragraph removal is uncommitted in the working tree, in
  `skills/azure-devops-pr/SKILL.md`.
- The sentence cut from `skills/azure-devops-work-items/SKILL.md` is in `stash@{0}`, put
  there by the Supreme Commander. It is not in the working tree.
- The `DECISIONS.md` entry is outstanding and blocked on the why.

One thing a cold session should know about this branch: the task that opened it was
investigation, not repair. He asked for the blame on one line and the conversation that
wrote it. The removal came later, in his words "i think we got off track".
