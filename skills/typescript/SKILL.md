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
