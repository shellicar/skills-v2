---
name: nats
description: |
  WHAT: reading, messaging, and spawning/adopting conversations on the bus.
  WHY: to catch up on, poke, or start a conversation without a UI.
  TRIGGER WHEN: COMPLIANCE — told to use nats on a conversation, or to spawn/adopt one in a world.
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
JSON object on stdin and are meant for you to run, not a person: stdout is the
result, stderr is progress, a non-zero exit means it did not get what it asked for.

Run with Node 22+ (it runs `.mts` directly, no build):

```sh
echo '{"conv":"<uuid>","n":20}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/read.mts
echo '{"conv":"<uuid>","from":"<uuid>","text":"...","wait":180}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/query.mts
# send without waiting for the reply — the query runs on regardless:
echo '{"conv":"<uuid>","from":"<uuid>","text":"...","noWait":true}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/query.mts
# a long message text is easier to keep in a file:
node ~/repos/shellicar/skills-v2/skills/nats/scripts/query.mts < payload.json
```

**The payload goes on stdin, and there is no argv form.** Endpoint scanning
(SentinelOne on the work machine) SIGKILLs `node` before it starts when a long
message text sits in the process argv. The kill lands in ~20ms with no output, so it
reads as "writes are broken" rather than as a scanner.

**v2 is the only conversation tree.** Messages are `conv.v2.<uuid>.changes.message`
and a send is `conv.v2.<uuid>.requests.say`.

**`conv` is the full conversation uuid.** The v2 subject keys on the whole id;
a truncated rail id (the 8-char display form) will not match. Get a full id from
the tower UI, or list them:

```sh
nats stream subjects conv-approval "conv.v2.*.changes.message"
```

## read — catch up on a conversation

`echo '{"conv":"<uuid>","n":20}' | read.mts` prints the last `n` committed messages
(default 20), oldest first, as a transcript: each message a `role · ts` header
and its content. Tool calls show as `[tool_use: name] input`; tool results and
other blocks show as a labelled placeholder (the full content vocabulary is not
rendered yet). It reads only committed messages, never the in-flight stream.

**Exits** `0` on success, and also on a conversation with no messages, which it reports
on stderr. `64` if the input is not valid JSON or has no `conv`.

## query — say something and wait for the answer

`echo '{"conv":"<uuid>","from":"<uuid>","text":"...","wait":180}' | query.mts`
publishes a `say` anchored to the conversation's current tip, then follows the change
stream until that query closes, printing the committed messages as they land. `wait`
is seconds (default 180).

**`from` is your own conversation id, and it is required.** It lands on the wire
as `from: { kind: "agent", conversationId }`, so a say is always attributable and
a reply has somewhere to go. Nothing tells a session its own id automatically, so
if you do not know yours, ask — and when you spawn a conversation yourself you
mint its id, so pass that value to the child as the `from` it should use.

- `noWait: true` exits as soon as the say is accepted, printing the query id.
  The query still runs — read it later with `read.mts`. Use this when you are
  dispatching work rather than waiting on an answer.
- An **agent must be attached** to the conversation, or the say gets no reply
  and it exits non-zero saying so.
- A `say` against a stale tip is **rejected** (someone else spoke first); it
  prints the reason and exits non-zero. Re-`read` and try again.
- The query closes `completed`, `cancelled`, or `aborted`. Only `completed` is a
  real answer; the other two exit non-zero with the reason.

**Exits** `0` when the query closes `completed`, or as soon as the say is accepted under
`noWait`. `1` if the say is rejected, no servicer replies, or the query closes
`cancelled`/`aborted`. `2` if `wait` elapses before the query closes, which is not a
verdict: the query is still running, so read it later. `64` if the input is not valid
JSON or is missing `conv`, `from` or `text`.

## service — ask a world to serve a conversation (spawn or adopt)

`echo '{"world":"local","conv":"<uuid>","cwd":"/path"}' | service.mts` sends the agent
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
  against the printed `conversationId`.

**Exits** `0` when the request is accepted. `1` if it is rejected, or if no bridge
replies within `wait` seconds (default 30). `64` if the input is not valid JSON or has
no `world`.

## Configuration

- `NATS_URL` — the broker (default `nats://127.0.0.1:4222`).
- `NATS_STREAM` — the JetStream stream (default `conv-approval`).
