---
name: testing
description: |
  WHAT: how a test proves behaviour, independent of language.
  WHY: Claude's default test couples to implementation and buries the expectation in the assertion.
  TRIGGER WHEN: writing or modifying a test.
---

# Testing

## Test types: what a test means depends on when it was written

A test's meaning is temporal — it depends on when the test was written relative to
the code it tests. The diff can't carry that: a test and a fix landing together look
the same whether the test failed first or was written against the already-fixed code.
These names carry it, so when the SC names one, this is what he means:

- **Missing test** — not a test but a state: behaviour no test covers is undefined
  behaviour. A finding, not something you write.
- **Failing test** — proves a claimed bug exists. Written against the current code and
  fails; the fix is what makes it pass. If it passes when written, the claim was
  wrong. Once satisfied it stays in the suite.
- **Specification test** — defines new behaviour before the code exists. Fails for
  absence, not wrongness.
- **Regression test** — pins current behaviour so it can't change silently.
- **Behaviour-defining test** — a test-only change that pins behaviour as decided; no
  production code moves.
- **Vacuous test** — cannot fail: asserts a tautology, or a mock against itself.
  Coverage wearing a green tick — worse than missing, because it looks covered.

Write the type of test asked for. "Write a failing test" means the test fails —
making it pass is a different test type and a different order.

## Assert outputs, not interactions

A test proves what the system produced, not how it produced it. Asserting that a
specific method was called, in what order, with what arguments, couples the test to
the implementation — change the implementation without changing the behaviour, and the
test still breaks. A test that can only fail when you change the implementation, never
when the behaviour is wrong, is testing nothing. Assert what came out; don't verify
what happened inside to get there.

## Name the test double

These five terms mean different things, and mixing them up muddies what a test is
doing. A **dummy** fills a parameter list and is never used. A **stub** returns a canned answer and records nothing. A
**fake** is a working but unsuitable-for-production implementation — an in-memory
database, a clock you can advance by hand. A **spy** is a stub that also records how it
was called. A **mock** is pre-programmed with expectations and verified after the
fact — mocks verify behaviour, which is what "assert outputs, not interactions" argues
against. Prefer fakes and stubs. Reserve the word "mock" for what actually is one.

## One test, one assertion

Each test proves one thing. When it fails, you know immediately which behaviour broke
without reading the body to work out which of several assertions was the one that
mattered. Group related cases instead of combining their assertions into one test.

## Name expected and actual before you compare them

This is Arrange/Act/Assert, without the ceremony. Skip the `// arrange` / `// act` /
`// assert` comments marking the phases — that's the ugly version. The elegance is in
the naming itself: `expected` and `actual` as two clean values, declared once each,
then a comparison that echoes both by name. The symmetry carries the structure that the
comments would otherwise be spelling out.

Always name both, even when the value is a bare literal or a boolean. A short value is
not a reason to inline it — `expected` and `actual` are the shape of every test, not an
ornament for the complicated ones.

The exception is when the matcher itself already carries the expectation — a throw, a
null, an undefined, a snapshot. There's no second value to name there: the matcher name
is already the plain statement of what's expected, and a `const expected` line would
only repeat it. Naming breaks down structurally for a thrown error, too — the call has
to be wrapped in a closure so the assertion can catch the throw, so there's no `actual`
resulting from a call to bind, and nothing shaped like a normal value to call `expected`
either.

## A test name says what, not how

Present tense, describes the behaviour under test — not the mechanism, not "test case
1."

## A good failure is missing behaviour, not a missing file

A test should fail because the behaviour isn't there yet, not because of a structural
problem — a missing import, a file that doesn't exist. If a test fails for a structural
reason, fix that first with a stub so it can run and fail for the right reason.

## Control time instead of trusting it

A test that calls the real clock is only deterministic by luck. Fix the clock to a
known instant, or use a fake clock the test can advance by hand, so time is an input
you control rather than an ambient fact the test hopes doesn't change.

## A factory builds the object so the test doesn't have to

When a test needs a complex object, build it once with a named factory function rather
than repeating the full literal in every test. The factory carries the noise; each test
carries only what it's actually varying.

## Test hooks never leak into production types

Testability comes from a seam — an interface the test can hand a fake — never from
production code knowing it might be under test. An `Option` whose `None` means "we're
in a test", a nullable dependency, a config flag that skips a step, a panic path only
tests can reach: each is the fake escaping the seam, and each replaces a compile-time
guarantee with a runtime hope. The tells are reliable: a code path no production
scenario can produce, or a comment paragraph justifying why the absent value is fine.
When a test can't reach a path, widen the seam (or add a second narrow one) so the
fake covers it — never make the dependency optional.
