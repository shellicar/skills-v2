---
name: testing
description: |
  WHAT: how a test proves behaviour, and when a double earns its place.
  WHY: Claude doubles every collaborator and asserts on calls, coupling the test to the implementation.
  TRIGGER WHEN: writing, modifying or reviewing a test.
---

# Testing

## Test code is held to a higher standard than production code

A test is what proves the production code's worth, so it carries more weight than the code
it tests, not less.

A test littered with casts and doubles becomes unreadable, and an unreadable test cannot be
repaired. When it breaks, someone deletes it, or spends hours working out what it should
have been doing, because there is no way to tell. That is the debt, and it is why the same
rule bites harder here than it does in production code.

## What a test is judged against

Maintainability. A test is maintainable when its failure names the value that was wrong, a
reader can see what behaviour it pins, and it has the same shape as the suite around it.

Everything below is how that usually shows up: the typical shape of a maintainable test,
not a checklist to match letter for letter. A deviation is fine where it serves those three
better, and a smell where it doesn't. Judge against the purpose, never against the
convention.

## Which test you were asked for

A test's meaning depends on when it was written relative to the code it tests, and the diff
cannot carry that: a test and a fix landing together look the same whether the test failed
first or was written against already-fixed code. These names carry it.

- **Missing test** — not a test but a state: behaviour no test covers is undefined
  behaviour. A finding, not something you write.
- **Failing test** — proves a claimed bug exists. Written against the current code and
  fails; the fix is what makes it pass. If it passes when written, the claim was wrong.
  Once satisfied it stays in the suite.
- **Specification test** — defines new behaviour before the code exists. Fails for absence,
  not wrongness.
- **Regression test** — pins current behaviour so it cannot change silently.
- **Behaviour-defining test** — a test-only change that pins behaviour as decided; no
  production code moves.
- **Vacuous test** — cannot fail. Expectations set on a double and then verified against
  that same double run green while masking a real error. Coverage wearing a green tick, and
  worse than a missing test, because it looks covered.

Write the type you were asked for. "Write a failing test" means the test fails; making it
pass is a different type and a different order.

## Reach for the real thing first

The question before every other one is whether this collaborator needs a double at all.
Most do not.

Use the real object where the collaboration is easy: it constructs cheaply, it does nothing
you would mind actually happening, and you can read its state afterwards. An order filled
from a real warehouse needs no double, and the test is stronger for it, because it exercises
the two together and catches the mistakes that only appear where they meet.

This is the default and it is where the largest difference in quality sits. A test that
doubles every collaborator is not illegal. It is unnecessary, and the cost falls due on
every refactor.

## When a double earns its place

The collaboration is awkward. Using the real thing sends an email, charges a card, needs a
network or a database, is slow enough to change how often the suite is run, or cannot be
steered into the state the test needs.

The clock is the standard case. A test that calls the real clock is deterministic only by
luck, and there is no way to ask the real one for a Tuesday in 2019.

Decide per collaborator, not per test. One test can double the mail service and use the real
warehouse.

## Building a double

Write it by hand, as a class implementing the same interface the production code depends on.
It accumulates what it was given and exposes a query so the test can read that back.

That query lives on the double, never on the production interface. The pull towards adding a
getter "just so the test can check" is real, and the double is where it is answered: the
production contract stays as small as the production code needs it.

Three things follow from writing it rather than generating it.

- **The compiler holds it to the contract.** When the interface changes, the double fails to
  compile, instead of drifting away from what it is standing in for.
- **A reader sees what it does in one place**, rather than reconstructing its behaviour from
  expectations scattered through a setup block.
- **It is shared.** One hand-written double serves every test of that collaborator, so the
  behaviour is agreed once.

## Getting it in

Through the seam the production code already has. A class that declares its dependencies has
one, and the double goes in the same way the real implementation does.

Never around it. Constructing the object and then assigning over its private fields is not a
seam: the test comes to depend on names the production code never promised, so it breaks on
a rename that changed no behaviour, and it keeps passing when the real wiring is wrong.

Where there is no seam, that is a finding about the production code. It is not a licence to
reach in.

## Proving it worked

Check the state afterwards: the state of the unit, and the state of the collaborators it
acted on. A unit that returns nothing still has observable state, and it is in the
collaborator. `order.fill(warehouse)` returns nothing; what it did is that the warehouse now
holds fifty fewer.

The alternative is to check which calls were made. That couples the test to how the unit did
its work, so it breaks when the implementation changes and the behaviour does not, and it
passes when the calls are right and the result is wrong. Mock frameworks make it worse by
pinning method names and every argument, including the ones this test does not care about.

Where state genuinely cannot reveal the answer, checking the call is the right choice. A
cache is the standard case: a hit and a miss look identical from outside, so the only
observable difference is whether the underlying source was asked. That is narrow, and it is
a judgement about the collaborator rather than an escape hatch.

**Assert the value, not something folded out of it.** `expect(actual).toBe('pineapple')`
fails with `expected 'pineapple', got 'banana'`. `expect(actual === 'pineapple').toBe(true)`
fails with `expected true, got false` and names nothing, so the failure cannot be diagnosed.
A count is the same collapse in numeric form: asserting how many results came back discards
which ones, so a detector that found the wrong thing passes. Assert a count only where the
count is itself the behaviour.

## Indicators

Signs that something upstream went wrong. Each raises a question. None of them is a
violation to count, and flagging them all at the same weight is how a review turns into a
list of obstacles.

- **Every collaborator is doubled** — was any of it awkward, or was the double automatic?
- **The test names methods rather than values** — is there resulting state to read instead?
- **The test reads a double's call log** — should the double have recorded that as its own
  state?
- **Setup resets shared state between tests** — what is surviving between tests, and why?
- **A double is assigned onto the unit rather than passed in** — where is the seam?

Several of these together usually means one decision went wrong near the top and the rest
followed from it. Find that one.

## Making the test readable

**Name expected and actual before you compare them.** This is Arrange/Act/Assert without the
ceremony, so skip the `// arrange` and `// act` comments: `expected` and `actual` as two
clean values, declared once each, then a comparison that echoes both by name. The naming
carries the structure the comments would have spelled out.

Name both even when the value is a bare literal or a boolean. A reader going top to bottom
should know what the test proves as they read it, rather than holding an expression in their
head until the final line. Assembling the value inside the assertion is the same fault:
asserting on `x.field`, `x.length` or `x.indexOf(y)` builds it at the comparison instead of
naming it before.

The exception is a matcher that already carries the expectation: a throw, a null, an
undefined, a snapshot. There is no second value to name, and a `const expected` line would
only repeat the matcher. A throw breaks the shape structurally too, since the call has to be
wrapped in a closure for the assertion to catch it, so there is no `actual` to bind.

**One test, one assertion.** One behaviour per test, so a failure names which behaviour
broke without reading the body. A precondition check sits apart from this, and is there to
tell a setup failure from an assertion failure. Several behaviour assertions in one test is
the fault, because when it breaks you cannot tell which of them broke.

**A test name says what, not how.** Present tense, describing the behaviour under test, not
the mechanism and not "test case 1".

**One shape across the suite.** Ten tests written one way and two written differently for no
reason is a smell: a reader maintaining the suite should not have to relearn the shape per
test. A deviation that genuinely reads clearer is fine.

**A factory builds the object so the test doesn't have to.** Where a test needs a complex
object, build it once in a named function, and let each test vary only what it is actually
about. The cost is real, so keep the factory to the noise: it is code to maintain, and a
change to it reaches every test that uses it.

## A good failure

A test should fail because the behaviour is not there, not because of a missing import or a
file that does not exist. Fix the structural problem first, with a stub if need be, so the
test runs and fails for the right reason.

## Reviewing a test

Walk the same decisions in the same order they were made: did this collaborator need a
double, is the double hand-written against the interface, does it go in through the seam,
does the test check state, does it name expected and actual.

Three outcomes for each, not two. It serves the purpose. It deviates and still serves the
purpose, in which case say why. Or it does not. The middle one is most of what you will
find, and collapsing it into a failure is the legalism this whole skill is written against.

Weigh where the failures fall before writing a verdict. A wrong assertion on the behaviour
the change exists to deliver counts for far more than a naming deviation scattered across
the suite. There is no pass mark and no arithmetic: say what you weighed, and what it came
to.
