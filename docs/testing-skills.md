# Testing skills

The decision record for the rewrite of `testing` and the testing half of `typescript`.
Read this to check the skill content against what was actually agreed, and to write the
`DECISIONS.md` entry.

## Problem Statement

A session writing a test can satisfy every rule in the `testing` skill and still produce a
test the SC rejects. The skill is not wrong so much as unreadable as guidance: the
principle was lost and the rule was recorded.

A rule with no reasoning can only be pattern-matched. A session meeting a case the rule
never anticipated either exempts itself or invents an answer, and the rules end up as
obstacles to route around rather than as help.

The case that exposed it is `CreateDealInCarBuyingPortalCommandHandler.spec.ts` in the
CarKiosk repo: eleven `vi.fn` occurrences, `Object.assign` onto the handler's private
fields, `vi.clearAllMocks()`, `toHaveBeenCalledWith` with `expect.objectContaining`,
assertions read from mock call logs, and casts on test data. Nothing in either skill
reached it.

## Solution

Carry the reasoning with each rule, so a reader can judge a case the rule does not name.
Name the vitest mocking API explicitly, as indicators that raise a question rather than as
prohibitions. Put the decision that comes before all the others first: does this
collaborator need a double at all.

## User Stories

The actor is Claude, doing a task. These describe the problem, so they hold however the
skills end up written.

1. As Claude writing a test, I want to know whether this collaborator needs a double at
   all, so that I do not double every collaborator by reflex.
2. As Claude reading a rule, I want the reasoning that produced it, so that I can apply it
   to a case it does not name instead of routing around it.
3. As Claude testing a unit that returns nothing, I want a way to prove what it did, so
   that I do not fall back on inspecting which calls were made.
4. As Claude writing test data, I want to know what a cast costs, so that I do not reach
   for one before considering the alternatives.
5. As Claude reviewing a test, I want to know which findings matter, so that I do not
   report a naming slip at the same weight as a wrong assertion.

## Requirements

Each one records something the SC said or agreed in the conversation that produced this
work. Anything in the skills not covered here was not agreed; see "What is mine".

1. **The reasoning travels with the rule.** Rules without reasoning end up as obstacles to
   get around rather than helping to improve the quality of the codebase.
2. **`CreateDealInCarBuyingPortalCommandHandler.spec.ts` is flagged** by the skills as they
   now stand. This is the acceptance test for the whole rewrite.
3. **The vitest mocking API is named explicitly** — `vi.fn`, `vi.mock`, and the rest. The
   principles never reached the keystrokes, so a reader did not recognise the reflex.
4. **Naming them is not a ban.** The problem is that an LLM reaches for them first, without
   considering the alternatives or what they cost. An indicator raises a question.
5. **"Assert outputs, not interactions" is removed.** It is wrong and too simplistic.
6. **Doubling is presented as usually unnecessary, not as wrong.** It is not globally or
   absolutely wrong; with Fowler's perspective and arguments it is more often than not
   unnecessary.
7. **Reviewing weighs impact.** Flagging everything equally without considering the impact
   is the legalism this rewrite exists to prevent.
8. **The test-double taxonomy carries little weight.** Naming a spy a mock matters, but
   next to everything else it is almost irrelevant, and it should not occupy the space it
   did.
9. **Test code is held to a higher standard than production code,** because it is what
   proves the production code's worth. Littered with casts it becomes unreadable, so it is
   deleted the first time it breaks, or costs hours to work out what it should have been
   doing. That is the debt.
10. **A double is hand-written.** Fowler's `MailServiceStub` is the pattern, and it is what
    the SC does all the time.
11. **Time is an injected clock.** Never the framework's fake timers: `Clock` (js-joda) and
    `setTimeout` are injected.
12. **A cast on data the test reads is distinguished from a cast on an unused dummy.**
    `{} as T` to satisfy something never used is not `as unknown as T` on data that gets
    read.
13. **There is a heading on how to review tests.**
14. **Scope: all of `testing`, only the testing parts of `typescript`.** The rest of
    `typescript` is untouched.

## What is mine, not yours

Read this before trusting the skill content. Everything below was written by Claude and
never put to the SC as a decision. It is where to look first if the skills read wrong.

- The section order in both skills, and every heading name.
- The spine used forwards to write and backwards to review: is a double needed, is it
  hand-written against the interface, does it go in through the seam, does the test check
  state, does it name expected and actual.
- Every phrasing, every example, and the wording of every indicator question.
- "Getting it in" as a separate concern from building the double. The SC named
  `Object.assign` as part of the spread; he did not separately reason about seams.
- The claim that a cast on test data keeps compiling after the type it claims to be has
  changed. Raised as Claude's, never accepted or rejected. It is not in the skills.

Two further sources were used, both handed over by the SC rather than authored by Claude:
Martin Fowler's "Mocks Aren't Stubs", and v1's `tdd/SUCCESS.md` and
`typescript-standards/SUCCESS.md`.

## What Fowler supplied

The mapping cost the most to reach and is the part a cold session would otherwise
re-derive.

- **SUT and collaborator** is the vocabulary the whole argument rests on, and the skill had
  neither word.
- **State verification covers the unit and its collaborators.** The skill kept "outputs"
  and dropped the collaborators, which is what made the rule unanswerable for a unit that
  returns nothing. `order.fill(warehouse)` returns nothing; the test asserts the warehouse
  now holds fifty fewer.
- **The classical decision rule**: use the real object where the collaboration is easy, a
  double only where it is awkward. "Prefer fakes and stubs" already presupposes a double,
  so nothing told a reader not to double at all.
- **The cache exception**: a hit and a miss look identical from outside, so behaviour
  verification is right there even for a hard classicist.
- **The query goes on the double.** Fowler names the acknowledged cost of state
  verification, that it leads to query methods added only to support verification, and
  resolves it by putting the query on `MailServiceStub` rather than on `MailService`.
- **Object Mother** is what the factory rule is, with the name and the warning removed:
  the mothers are code to maintain and changes to them ripple through the tests.

From v1's `SUCCESS.md` files, which v2 had dropped: three outcomes rather than two, where
the middle is a deviation that still serves the purpose; and weighing where the failures
fall rather than counting them.

## For the `DECISIONS.md` entry

One entry covers the whole rewrite. Its heading names what was decided, not the edit, and
has to survive a different implementation of it.

The material for the why is requirements 1, 5 and 7 above: the reasoning was stripped out
of the rules, which left them pattern-matchable and therefore applied legalistically, and
one of the rules was wrong.

**This is not the entry.** The `decisions` skill requires the why to be discussed with the
SC explicitly before it is written, because a reconstructed reason reads exactly like one
he gave. Nothing above substitutes for that conversation.

## Out of Scope

The non-testing parts of `typescript`: `any`, the general cast rules, `satisfies`, async
IIFEs, refactoring, temporal naming, and the thirteen-reason seam list.

Restoring v1's `SUCCESS.md` files as a format. Their content was mined; the format was not
adopted.

Changing the CarKiosk spec file. It is the evidence, not the deliverable.

Documenting `setTimeout` injection. The SC injects it, no skill describes it, and whether
that lands here is undecided.

Adopting Matt Pocock's vocabulary of handoff artifact, spec and ticket. His material was
used as a reference for writing this file, nothing more.

## State

Both skills are committed on `feature/testing-mocks` as `ccfe6d9`. The SC has not yet
reviewed the content. The `DECISIONS.md` entry is outstanding.
