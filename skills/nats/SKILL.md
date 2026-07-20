---
name: nats
description: |
  WHAT: reading a conversation off the NATS bus, and sending a message into one and waiting for the reply.
  WHY: to catch up on or poke a running conversation without a UI, straight from the wire.
  TRIGGER WHEN: told to use nats to read or message a conversation by id.
---

# NATS

Two tools over the conversation bus (docs/spec in the tower repo). Both take one
JSON argument and are meant for you to run, not a person: stdout is the result,
stderr is progress, a non-zero exit means it did not get what it asked for.

Run with Node 22+ (it runs `.mts` directly, no build):

```sh
node ~/repos/shellicar/skills-v2/skills/nats/scripts/read.mts  '{"conv":"<uuid>","n":20,"v2":true}'
node ~/repos/shellicar/skills-v2/skills/nats/scripts/query.mts '{"conv":"<uuid>","text":"...","wait":180,"v2":true}'
# v1 conversation (what an unbridged claude-sdk-cli publishes):
node ~/repos/shellicar/skills-v2/skills/nats/scripts/read.mts  '{"conv":"<uuid>","n":20,"v1":true}'
```

**The version is required — pass `"v1": true` or `"v2": true`, no default.** v1
is the `conv.v1.<uuid>.changes` shape an unbridged claude-sdk-cli publishes; v2
is the bridge shape (`conv.v2.<uuid>.changes.message`), which new conversations
use. The version is required because a mismatch fails silently — `read` reports
"no messages", `query` gets no reply — with nothing pointing at the cause;
making the caller state it turns a silent empty read into an up-front choice.

**`conv` is the full conversation uuid.** The v2 subject keys on the whole id;
a truncated rail id (the 8-char display form) will not match. Get a full id from
the tower UI, or list them:

```sh
nats stream subjects conv-approval "conv.v2.*.changes.message"
```

## read — catch up on a conversation

`read.mts '{"conv":"<uuid>","n":20}'` prints the last `n` committed messages
(default 20), oldest first, as a transcript: each message a `role · ts` header
and its content. Tool calls show as `[tool_use: name] input`; tool results and
other blocks show as a labelled placeholder (the full content vocabulary is not
rendered yet). It reads only committed messages, never the in-flight stream.

## query — say something and wait for the answer

`query.mts '{"conv":"<uuid>","text":"...","wait":180}'` publishes a `say`
anchored to the conversation's current tip, then follows the change stream until
that query closes, printing the committed messages as they land. `wait` is
seconds (default 180).

- An **agent must be attached** to the conversation, or the say gets no reply
  and it exits non-zero saying so.
- A `say` against a stale tip is **rejected** (someone else spoke first); it
  prints the reason and exits non-zero. Re-`read` and try again.
- The query closes `completed`, `cancelled`, or `aborted`. Only `completed` is a
  real answer; the other two exit non-zero with the reason.

## Configuration

- `NATS_URL` — the broker (default `nats://127.0.0.1:4222`).
- `NATS_STREAM` — the JetStream stream (default `conv-approval`).
