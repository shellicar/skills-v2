---
name: nats
description: |
  WHAT: reading a conversation off NATS, sending a message and waiting for the reply, and asking a world to serve a conversation (spawn/adopt).
  WHY: to catch up on, poke, or start a running conversation without a UI.
  TRIGGER WHEN: told to use nats on a conversation by id, or to spawn/adopt a conversation in a world.
---

# NATS

## APPROVAL GATE — no send without it

You MUST NOT send anything into a conversation (`query.mts`, or any other write)
without the SC's approval FIRST. The approval is of the **entire message text,
shown verbatim in a code block in your response** — never a summary, never "the
same as before plus X", never an amendment to something previously shown. He
reviews the whole message as it will be sent; only after he approves that exact
text does it go. Answering a question and dispatching are separate turns: if he
engaged with any point after you showed the text, the text is stale — show it
again. Violating this gate has been ruled termination-level.

Three tools over the conversation bus (docs/spec in the tower repo). All take one
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

## service — ask a world to serve a conversation (spawn or adopt)

`service.mts '{"world":"local","conv":"<uuid>","cwd":"/path"}'` sends the agent
concern's `service` request (`agent.v1.{world}.requests.service`) and prints the
reply as JSON. One verb for spawn, resume, and takeover: the servicer reads the
conversation's record and reacts — no history spawns fresh, history re-attaches,
attached elsewhere is taken over unconditionally. Omit `conv` and it mints a
fresh uuid (the caller names the conversation; nothing is "returned").

- `cwd`/`model` are strict when named: a value the world cannot establish
  rejects the request (`invalid_cwd`, …); omitted values fall to the world's
  defaults. Name the worktree path when spawning an operator.
- `already_attached` means this instance already serves it — nothing to do.
- `failed` carries a free-text `detail` naming the broken step.
- No reply means no bridge is serving that world.
- Accepted: the conversation exists on the wire — follow up with `query.mts`
  against the printed `conversationId` (it's a v2 conversation).

## Configuration

- `NATS_URL` — the broker (default `nats://127.0.0.1:4222`).
- `NATS_STREAM` — the JetStream stream (default `conv-approval`).
