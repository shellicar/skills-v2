---
name: typescript
description: |
  WHAT: how the general testing principles look in TypeScript's own syntax.
  WHY: the principle in `testing` is language-agnostic; the syntax to express it isn't.
  TRIGGER WHEN: writing or modifying a TypeScript test.
---

# TypeScript

Composes onto `testing` — read that first. This is the TypeScript-specific syntax for
the same principles, not a separate set of rules.

## `satisfies`, not `as`, for test data

`satisfies` checks the object's shape against the type while keeping its literal type;
the compiler catches a missing or wrong field. `as` skips the check — the object is
trusted to match regardless of what it actually contains, so test data assembled with
`as` can be quietly wrong and the test still compiles.

```typescript
const input = {
  interactionId: 'de80e429-5d13-4536-b824-89e9c43c80fb',
  step: WelcomeStep.Overview,
} satisfies WelcomeNextInput;
```

## `describe`/`it` is the grouping mechanism

One assertion per test, in practice:

```typescript
describe('formatPhoneE164', () => {
  it('formats Australian mobile to E.164', () => { ... });
  it('throws on invalid phone number', () => { ... });
});
```

## The expected/actual pattern with `expect`

```typescript
it('formats Australian mobile to E.164', () => {
  const expected = '+61412345678';

  const actual = formatPhoneE164('0412 345 678', 'AU');

  expect(actual).toBe(expected);
});
```

Leave the pattern where the matcher already carries the expectation — `toThrow`,
`toBeNull`, `toBeUndefined`, snapshots — see `testing` for why. `toEqual` is still the
pattern, just for deep equality instead of `toBe`.

## Dependency injection: `@shellicar/core-di`

When a class needs DI, use `@shellicar/core-di`. Prefer `@dependsOn` property injection
over constructor injection.

```typescript
class MyService {
  @dependsOn(Clock)
  private readonly clock!: Clock;
}
```

## Time: `@js-joda/core`, not bare `Date`

Always prefer `@js-joda/core` over the bare `Date`. `Clock` is injectable, so a service
takes a `Clock` instead of calling `Date.now()` or `new Date()` directly, and
`@js-joda/core`'s `Instant`, `LocalDate`, `Duration`, and friends handle time zones and
date arithmetic correctly in a way `Date` doesn't. This is the stand-in until TC39's
Temporal proposal ships.

```typescript
class MyService {
  @dependsOn(Clock)
  private readonly clock!: Clock;

  scheduledFor(): Instant {
    return this.clock.instant().plus(Duration.ofMinutes(30));
  }
}
```
