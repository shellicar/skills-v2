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

Composes onto `testing` — read that first. This is the TypeScript for it.

### The real thing comes from the container

Resolve the unit under test from the container with the real implementations registered. A
test module replaces only what is awkward, and everything else stays real:

```typescript
export class easyquoteTestModule implements IServiceModule {
  public registerServices(services: IServiceCollection): void {
    services.register(IOfferConfigService).to(IOfferConfigService, () => ({ get: async () => config })).singleton();
  }
}
```

### A double is a class

It implements the interface the production code depends on, so the compiler holds it to the
contract:

```typescript
export class MockClock extends Clock {
  public constructor(private currentTime: Instant) { super(); }
  public setTime(time: Instant): void { this.currentTime = time; }
  public advanceBy(duration: Duration): void { this.currentTime = this.currentTime.plus(duration); }
  public instant(): Instant { return this.currentTime; }
  public millis(): number { return this.currentTime.toEpochMilli(); }
}
```

The remaining `Clock` members are implemented too, because the compiler requires it, which
is the point.

Never `vi.useFakeTimers()`. `Clock` is injected and `setTimeout` is injected, so there is no
ambient time left to fake.

### Registering it

The double goes in the same way the real implementation does, through the container. Never
`Object.assign` onto a constructed instance: that binds the test to private field names the
production code never promised, so it breaks on a rename and passes when the real wiring is
wrong.

Where the dependency is injectable, the double goes through DI rather than module
interception. `vi.mock` of an injectable is replacing the import graph to avoid using a seam
that already exists.

### Indicators

Each raises a question rather than settling one. Weigh what the occurrence costs before
reporting it.

| Seen | Question |
|---|---|
| `vi.fn` | Did this collaborator need a double at all? |
| `vi.mock` | The dependency was injectable, so why is the module being intercepted? |
| `vi.spyOn` | What resulting state could have been asserted instead? |
| `toHaveBeenCalledWith`, `toHaveBeenCalled` | Is there state the call left behind? |
| `.mock.calls` | Should the double have recorded this as its own state? |
| `vi.clearAllMocks` | What is surviving between tests, and why? |
| `expect.objectContaining` | Which fields are being left unchecked, and was that deliberate? |

A file carrying several of these usually made one decision wrongly near the top, and the
rest followed. Report that decision, not the occurrences.

### Test data

`satisfies`, not `as`. A cast on data the test reads is the expensive one: it removes the
only statement of what that object is supposed to be, so when the test breaks there is
nothing left saying what it should have been doing.

`{} as ICarBuyingPortalService` for a dependency that is never called is a different thing.
Nothing reads it, so the cast hides no disagreement.

### Syntax

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
