---
name: rust
description: |
  WHAT: how Rust is written here. Currently just testing syntax; general conventions land as they're decided.
  WHY: without it, generated code has no house style to belong to.
  TRIGGER WHEN: writing or modifying Rust.
---

# Rust

No general Rust conventions have been decided yet — only testing syntax, below. Add
sections here as they're settled, the same shape as `typescript`.

## Testing

Composes onto `testing` — read that first. This section is the Rust-specific syntax
for those principles, not a separate set of rules.

### `#[test]` is the grouping mechanism

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

### The expected/actual pattern with `assert_eq!`

```rust
#[test]
fn formats_australian_mobile_to_e164() {
    let expected = "+61412345678";

    let actual = format_phone_e164("0412 345 678", "AU");

    assert_eq!(actual, expected);
}
```

`assert_eq!` reports both sides as "left" and "right" on failure regardless of whether
`expected` is named, so naming it is purely for the shape of the test, not the failure
output — the same reasoning as `testing`. Name both every time, including a bare
literal like this one.

### There is no `.toThrow()`

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
