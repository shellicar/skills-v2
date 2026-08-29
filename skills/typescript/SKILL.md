---
name: typescript
description: |
  WHAT: how TypeScript is written here — types, refactoring, DI, time, testing syntax.
  WHY: generated code ignores house conventions and has to be rewritten.
  TRIGGER WHEN: writing or modifying TypeScript.
---

# TypeScript

## Use the type system

Work with the type system, not around it. When a type problem stalls you, write the
code as if the types work, then use `TsDiagnostics` to see if they don't — fix the
reported error, not a guessed one. Don't pre-emptively cast because a type *might* be a
union or missing a property; that's often wrong and hides the real type.

## `any`: value vs constraint

`const data: any = fetchSomething()` throws away type safety and is never the fix.
`any` inside a generic constraint (`type Constructor<T> = new (...args: any[]) => T`)
is different — it still carries full type info for `T`, it just doesn't care about the
constructor's arguments. If a value seems to need `as any` or `: any`, ask; it almost
certainly doesn't, and the tradeoff is the SC's call either way.

## Casts are debt without evidence

The type system is a defence; a cast opts out of it. A cast added before an error
occurred is speculation with no reason behind it — syntactically identical to a real
fix, distinguishable only by whether an error actually happened. If it compiles
without the cast, remove it; if it doesn't, the cast is hiding a real problem, so fix
that instead.

- **`as unknown as T`** — routes around a type disagreement instead of resolving it.
- **`as T` when inference already works** — noise; hides whether the type is what you
  think.
- **Defensive union types** (`T | null | undefined` when it's never null) — forces
  null checks at every call site for a case that can't occur.

## Check the hazard before you guard against it

The cast rule above is one instance of a wider habit: guarding against a hazard nobody
verified. At the value level it arrives as an expression rather than a statement.

```ts
...(value.cause === undefined ? {} : { cause: serialise(value.cause) })
```

That defends against `cause: undefined` reaching the output. `JSON.stringify` drops
undefined, and the function was already total, so it defended against nothing. The plain
form is `cause: serialise(value.cause)`.

Two tells. The first is a spread carrying a single known key. Spread is for arity you
cannot know at authoring time, so `{ ...error }` earns it — which of `code`, `errno` or
`status` an error carries isn't knowable there. `...(cond ? { cause: x } : {})` doesn't:
the key is known, there is exactly one, and the spread is doing an `if`'s job while the
empty object does "don't". The second tell is that the construct produces nothing. Ask
what the line makes happen, and if the answer is "it prevents a case", that case is the
thing to go and check.

The costs are asymmetric in time, which is why this outlives the moment it was written.
Checking is paid once, by you. The guard is paid by every later reader, and once it is
there it looks intentional, so nobody can reason about it any more — removing it means
redoing the check you skipped, so it never goes.

A comment does not fix this. A stated reason carries more authority than bare code, so a
vacuous one is more durable and spreads further: it closes the question and reads as a
precedent to imitate. If a guard survives a real check, record what you observed, not
what you feared. "Guards against undefined" is untestable and will outlive everyone.
"`JSON.stringify` emits `cause: undefined` and the audit parser rejects it" can be re-run
by anyone, and deleted the day it stops being true.

## `satisfies`, not `as`

`satisfies` checks a value's shape while keeping its literal type; `as` skips the check,
so something wrong can still compile. Use it on return values, constants, and test
data: `{ host: 'localhost', port: 3000 } satisfies ServerConfig`. Use an explicit
annotation instead only when the type genuinely needs to widen (an empty object to
fill in later).

## No async IIFEs

Don't run async work from a synchronous context as an anonymous IIFE —
`void (async () => { ... })()` is async-void, an unhandled rejection with nowhere to
land. Extract a named function that owns its own try/catch, then call that:
`void reloadOnChange()`. The function is safe by construction; a `.catch` at the call
site relies on every caller remembering it.

## Refactoring: update imports, don't re-export

When moving something, update every import to the new location. Don't leave a
re-export behind for backwards compatibility — it hides where things actually live.
Exception: an `index.ts` barrel in a published npm package, which exists to be a
stable public API.

## Temporal naming

A temporal value stored as a plain string or number needs a suffix, or `string` is
ambiguous. Skip it where the field already has a typed schema.

| js-joda type | suffix | example |
|---|---|---|
| `Instant` / `Date` | `*Utc` | `createdUtc` |
| `LocalDate` | `*Date` | `birthDate` |
| `LocalTime` | `*Time` | `startTime` |
| `LocalDateTime` | `*DateTime` | `scheduledDateTime` |
| `ZonedDateTime` | `*ZonedDateTime` | `appointmentZonedDateTime` |
| `Duration` | `*Duration` | `validDuration` |
| `Period` | `*Period` | `billingPeriod` |
| `ZoneId` | `*ZoneId` | `userZoneId` |

## DI and time: `@shellicar/core-di`, `@js-joda/core`

Use `@shellicar/core-di` for DI, with `@dependsOn` property injection over constructor
injection. Use `@js-joda/core` over bare `Date` always — `Clock` is injectable, and
`Instant`/`LocalDate`/`Duration` handle time zones and arithmetic correctly where
`Date` doesn't. It's the stand-in until TC39 Temporal ships.

```typescript
class MyService {
  @dependsOn(Clock)
  private readonly clock!: Clock;

  scheduledFor(): Instant {
    return this.clock.instant().plus(Duration.ofMinutes(30));
  }
}
```

### One benefit is not the test for a seam

The trained move is to pick a single reason an abstraction exists, measure the seam
against that one, and call it unearned when it doesn't score. The reason you picked is
rarely the one the seam is carrying, so the verdict comes out wrong even when the
reasoning reads well. "No test substitutes it" is the version that keeps recurring, and
it isn't on the list at all.

Removing a seam, or arguing one shouldn't exist, is a claim that *none* of these apply.
That is a far larger claim than noticing you aren't using one of them yet. It binds when
reviewing as much as when writing: a finding that a seam is unused is not a finding that
it is unjustified.

1. **Substitution.** A fake in place of the real thing.
2. **Decoupling.** The consumer never names the concrete, so the concrete can change without touching it.
3. **Construction leaves the class.** It depends on its collaborators instead of manufacturing them.
4. **Lifetime belongs to the container.** Singleton, transient, eager, disposal order — decided at composition, not by whoever called `new` first.
5. **The graph is declared, so it can be validated.** A missing edge fails at startup rather than when the path finally runs.
6. **The dependency is visible.** A class's needs read off its declarations; an unwanted one is a line a reviewer can object to, not an import halfway down a file.
7. **It constrains what the class can do.** Holding the interface means you cannot call what it lacks — by absence, not by discipline.
8. **Layering and inversion.** The abstract sits in the lower layer and the implementation above it, so the lower package defines a contract without depending on the higher one.
9. **Decoration.** Logging, retry, caching, a lifecycle wrapper — put around an implementation with no consumer knowing.
10. **A preserved option.** CLAUDE.md keeps `IMemoryStore`/`IObjectStore` so a store can become a daemon client with nothing above the interface changing.
11. **The contract is the published surface.** For a package others consume, the abstract is the API and the concrete is an implementation detail that can move.
12. **A breaking change is visible as one.** The contract lives apart from the implementation, so altering it shows up as an edit to the contract rather than as a line buried in implementation churn — the diff itself tells a reviewer, and tooling, that callers are affected.
13. **Uniformity.** Every injectable has the same registration shape, so the wiring stays mechanical to read and to change.

## Testing

Composes onto `testing` — read that first; this is just the TypeScript syntax for it.
Group with `describe`/`it`. Name expected/actual before comparing:

```typescript
it('formats Australian mobile to E.164', () => {
  const expected = '+61412345678';
  const actual = formatPhoneE164('0412 345 678', 'AU');
  expect(actual).toBe(expected);
});
```

Skip naming where the matcher already carries the expectation — `toThrow`, `toBeNull`,
`toBeUndefined`, snapshots. `toEqual` is the same pattern, for deep equality.
