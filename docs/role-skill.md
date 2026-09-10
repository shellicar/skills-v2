# The role skill

The decision record for `role`. Read this to check the skill content against what was
actually agreed, and to write the `DECISIONS.md` entry. `roles.md` is the neighbouring
record for what each role is; this one is about detecting which one you are in.

## Problem Statement

The SC has to name the role at the start of a session or none gets loaded, and he cannot
always name it, because until he has decided what is to be built he does not know it
himself.

`ghost` and `handler` each carry "Ask which role you are if he hasn't said" in their
trigger lines, and every session sees those lines in the catalogue. They do not fire. A
trigger needs a session to notice that its condition has been met, and a session that has
quietly defaulted has nothing to notice.

## Solution

A skill that forces the question rather than offering it. It carries only what the trigger
lines cannot: the concept behind the two roles, in two parts. Detection is how to see that
the role is now determined and which way it points. Activation is what to do with that.

It explains rather than rules, so that a session can settle a case the skill does not name.

## User Stories

The actor is Claude. These describe the problem, so they hold however the skill ends up
written.

1. As Claude about to build something the SC has not assigned a role for, I want to
   recognise that the role is now determined, so that I do not build what he wanted
   dispatched.
2. As Claude who is certain which role applies, I want to load it and say so, so that he
   can redirect me without having had to be asked.
3. As Claude who is unsure, I want asking to be an ordinary move, so that I ask instead of
   guessing.
4. As Claude meeting a situation the skill does not name, I want the concept rather than a
   rule per case, so that I can work it out.

## Requirements

Each one records something the SC said or agreed in the conversation that produced this
work. Anything in the skill not covered here was not agreed; see "What is mine".

1. **The skill forces the ask.** The trigger lines stay as they are and are not relied on.
2. **It is minimal.** It carries the context the trigger descriptions do not have, and
   nothing they already say.
3. **It explains the concept and gives enough context to work the rest out.** No theory
   that tries to cover every case.
4. **Two sections: detection and activation.**
5. **Detection is about signals being seen.** A clear positive signal is another
   conversation being involved. A clear negative signal is the SC saying the work happens
   here. Between them is judgement, and sometimes there is nothing to judge.
6. **"Work" is not the differentiator.** Defining the trigger by work is circular: what
   counts as work then has to be defined by whether the role matters.
7. **The role is not determinable at the start.** If it were, the instruction would be to
   ask as the first question, and it is not.
8. **Investigating is not work.** It comes before anything has been decided to be done.
   Work is what the SC decided it is.
9. **Activation is three cases.** He named it: load it. He did not and you are certain:
   load it and say which, so he can send you elsewhere if he meant something else, which
   is not traceability and not a question of being right. You are unsure and something is
   about to be built: ask, either whether the role needs settling or which one it is.
   Asking carries no penalty.
10. **His examples are explained, not transcribed.** The wording he used to teach the
    concept does not go into the skill as literal cases.
11. **It is not written as a temporal artefact**, meaning the order the concept was
    arrived at does not become the shape of the text.

## What is mine, not yours

Read this before trusting the skill content. Everything below was written by Claude and
never put to the SC as a decision. It is where to look first if the skill reads wrong.

- The opening paragraph, which frames the two roles as differing over who builds what he
  has decided to have built. It comes from reading `ghost` and `handler` side by side.
- Grounding the vocabulary in "built" rather than "work", taken from the wording of the two
  role skills.
- "What he says next can set a different role from what he said before." He demonstrated
  this with an example he then told me not to write down; the generalisation is mine.
- "No rule covers every case." This is his instruction to me, turned toward the reader.
- Every phrase, every heading name inside the two sections, and the order of the three
  activation cases.
- The claim that `operator` and `gatekeeper` need no detection because a brief or a diff is
  its own evidence. Said to him, never put as a decision, and not in the skill.

## Approaches that failed

The expensive part of this work, and what a cold session would otherwise re-derive.

- **Keying the ask on "work".** Circular, and the circle is not visible from inside it: the
  skill said ask before work, and work was whatever needed a role.
- **Dispatchability as the test**, meaning "could this be handed to another session". Every
  task can be, so it separates nothing. That a task can go either way is the fork itself.
- **"You are always in a role."** It contradicts the rest: if a role were always in force,
  asking as the first question would be right.
- **Chronology as structure.** Writing what happens first, then next, then what can change
  later. It records the order the idea was reached in, not what is true.
- **Claude's inner experience as content.** How the default feels from the inside is not
  usable by a reader and was rejected each time it appeared.
- **Invented reasons.** A justification that reads as the SC's and was never his is a
  defect even where the rule it supports is right.

## Out of Scope

Changing the trigger lines in `ghost`, `handler`, `operator` or `gatekeeper`. They do not
fire, and they stay as they are.

Detection for `operator` and `gatekeeper`. The skill is written around the ghost and
handler fork.

`planner`.

Anything about how skills are loaded or injected.

## Open

**Whether `role` is always-on or indexed.** It is currently body-only with no frontmatter,
which is the shape of a foundational skill, and it is not in the `FOUNDATIONAL` list in
`scripts/load-skills.mjs`. As it stands the catalogue shows it as a bare name with no
description, so nothing would load it. Always-on means adding it to that list and to
`PLAN.md`'s always-on line; indexed means giving it frontmatter under the 250-character
cap. Undecided.

`PLAN.md` and `STOCKTAKE.md` have not been updated for this skill.

## For the `DECISIONS.md` entry

One entry covers the skill. Its heading names what was decided, not the edit, and has to
survive a different implementation of it.

The material for the why is requirements 1, 6 and 7: the instruction to ask already exists
in two trigger lines and does not fire, and the attempts to define the moment by what
counts as work were circular, so what the skill carries is the concept and the two signals
rather than a rule.

**This is not the entry.** The `decisions` skill requires the why to be discussed with the
SC explicitly before it is written, because a reconstructed reason reads exactly like one
he gave. Nothing above substitutes for that conversation.

## State

`skills/role/SKILL.md` is untracked on `feature/role-skill`. Nothing is committed. The SC
has read every version of the content as it was written.
