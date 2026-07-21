---
name: rust
description: |
  WHAT: how the general testing principles look in Rust's own syntax.
  WHY: the principle in `testing` is language-agnostic; the syntax to express it isn't.
  TRIGGER WHEN: writing or modifying a Rust test.
---

# Rust

Composes onto `testing` — read that first. This is the Rust-specific syntax for the
same principles, not a separate set of rules.

## `#[test]` is the grouping mechanism

Where TypeScript nests `it` inside `describe`, Rust groups with modules and a `#[test]`
attribute per case:

```rust
mod format_phone_e164 {
    #[test]
    fn formats_australian_mobile_to_e164() { /* ... */ }

    #[test]
    fn errors_on_invalid_phone_number() { /* ... */ }
}
```

## The expected/actual pattern with `assert_eq!`

```rust
#[test]
fn formats_australian_mobile_to_e164() {
    let expected = "+61412345678";

    let actual = format_phone_e164("0412 345 678", "AU");

    assert_eq!(actual, expected);
}
```

`assert_eq!` reports both sides as "left" and "right" on failure regardless of whether
`expected` is named, so naming it is purely for the reader scanning the test, not for
the failure output — the same justification as the general principle. Idiomatic Rust
often skips naming `expected` for a bare literal; name it once it's assembled from
pieces already in scope.

## There is no `.toThrow()`

TypeScript wraps a call in a closure and asserts on invocation. Rust doesn't have that
shape — assert on a `Result` directly:

```rust
#[test]
fn errors_on_invalid_phone_number() {
    let actual = format_phone_e164("invalid", "AU");

    assert!(actual.is_err());
}
```

For an actual panic, `#[should_panic]` is an attribute on the test function, not an
assertion inside its body — a different mechanism, not just different syntax.
