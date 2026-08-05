---
name: nats
description: |
  WHAT: reading, messaging, and spawning/adopting conversations on the bus.
  WHY: to catch up on, poke, or start a conversation without a UI.
  TRIGGER WHEN: COMPLIANCE — told to use nats on a conversation, or to spawn/adopt one in a world.
---

# NATS

## APPROVAL GATE — original messages only

An original message is instructions. It tells another session what to do, and the SC
reads it before it goes so that the instructions are right: right for the role
receiving them, and right about the work. A wrong instruction is not a small cost,
because a worker will follow it a long way before anyone notices.

So you MUST NOT send an original message (`sendMessage.mts`) without his approval
FIRST. The approval is of the **entire `message`, shown verbatim in a code block in
your response** — never a summary, never "the
same as before plus X", never an amendment to something previously shown. He
reviews the whole message as it will be sent; only after he approves that exact
text does it go. Answering a question and dispatching are separate turns: if he
engaged with any point after you showed the text, the text is stale — show it
again. Violating this gate has been ruled termination-level.

The gate covers the `message` you pass in, not anything a script renders around
it.

**A reply is not gated.** A reply is anything a worker sends back into the
conversation that commissioned its work: the finished report, a blocker, a question
it needs answered. The direction decides it, not the content. Send it with
`replyToMessage.mts`.

Nothing in a reply is instructions. A worker reporting upward is not telling its
handler what to do, so there is nothing to check that was not already checked when
the dispatch was approved. And there is nobody in a worker's conversation who could
approve one anyway, so gating it strands the message at the moment it matters. That
has happened twice: once to a finished report, once to a worker that needed a
decision.

An original message commissions work in a conversation that did not ask for it. If
you are a worker and find you need to send one, that is a thing to report upward,
not to send outward.

Five tools over the conversation bus (docs/spec in the tower repo). All take one
JSON object on stdin and are meant for you to run, not a person: stdout is the
result, stderr is progress, a non-zero exit means it did not get what it asked for.

Run with Node 22+ (it runs `.mts` directly, no build):

```sh
echo '{"convs":["<uuid>","<uuid>"]}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/status.mts
echo '{"conv":"<uuid>","n":20}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/read.mts
echo '{"conv":"<uuid>","from":"<uuid>","name":"<yours>","message":"...","wait":180}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/sendMessage.mts
# dispatch without waiting for the reply — the query runs on regardless:
echo '{"conv":"<uuid>","from":"<uuid>","name":"<yours>","message":"...","noWait":true}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/sendMessage.mts
# report upward to whoever put you to work — never waits, needs no approval:
echo '{"conv":"<uuid>","from":"<uuid>","name":"<yours>","message":"..."}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/replyToMessage.mts
# a long message is easier to keep in a file:
node ~/repos/shellicar/skills-v2/skills/nats/scripts/sendMessage.mts < payload.json
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

## status — which conversations are working, and which are waiting on you

`echo '{"convs":["<uuid>","<uuid>"]}' | status.mts` reports, for each conversation, when
it last spoke and whether a turn is in progress. It answers the question you actually
have when several operators are running at once, at two cheap lookups per conversation
instead of a whole `read.mts` each.

`state` is derived from the last committed message and the last query close, so it is a
reading rather than something the bus states:

- `working` — a message landed after the last query close, so a turn is in progress.
- `idle` — the newest event is a query close, so nothing is running.
- `empty` — nothing has ever been committed.

**Do not send into a conversation reading `working`.** The tip moves under you while it
works, so the say is rejected as stale. Wait for `idle`.

Each entry also carries the last message's role, timestamp and first line, the last
query's id and close reason, and the current `tip`.

**Exits** `0` with the report. `64` if the input is not valid JSON or has no `convs`.

## read — catch up on a conversation

`echo '{"conv":"<uuid>","n":20}' | read.mts` prints the last `n` committed messages
(default 20), oldest first, as a transcript: each message a `role · ts` header
and its content. Tool calls show as `[tool_use: name] input`; tool results and
other blocks show as a labelled placeholder (the full content vocabulary is not
rendered yet). It reads only committed messages, never the in-flight stream.

An empty read means the conversation has no committed messages, not that the read
failed. Check the `conv` is the full uuid before concluding anything is wrong.

**Exits** `0` on success, and also on a conversation with no messages, which it reports
on stderr. `64` if the input is not valid JSON or has no `conv`.

## sendMessage — say something original, waiting or not

`echo '{"conv":"<uuid>","from":"<uuid>","name":"<yours>","message":"..."}' | sendMessage.mts`
publishes a `say` anchored to the conversation's current tip, then follows the change
stream until that query closes, printing the committed messages as they land. `wait`
is seconds (default 180). Pass `noWait` to dispatch instead, which is the common
case when you are handing out work rather than asking a question. This is the gated
tool.

**`from` is your own conversation id and `name` is the one you gave yourself. Both
are required.** They land on the wire as
`from: { kind: "agent", conversationId, name }`, so a say is always attributable, a
reply has somewhere to go, and a transcript with several agents in it can be read
apart. Nothing tells a session its own id automatically, so if you do not know
yours, ask. The name is the one from `cast-name`: if you have not chosen yet, choose
now rather than sending anonymously.

**The reply instructions are appended for you.** Every original message carries a
rendered return address: the recipient's own conversation id, where to reply, and
the exact payload to send. **Do not write any of that into your `message` by
hand.** Both ids are already in what you pass, so the script has everything it
needs, and every hand-written copy of those instructions went stale the moment the
scripts changed shape. It is also how a spawned conversation learns its own id,
which nothing else tells it.

- `noWait: true` exits as soon as the say is accepted, printing the query id.
  The query still runs — read it later with `read.mts`. Use this when you are
  dispatching work rather than waiting on an answer.
- **No servicer replied** means no agent is attached to that conversation. Fix it
  with `service.mts` on the same `conv`, then send again. It is not a broker
  problem and retrying the say alone will not help.
- A `say` against a stale tip is **rejected** (someone else spoke first); it
  prints the reason and exits non-zero. `status.mts` predicts this: a conversation
  reading `working` will reject a say. Re-`read` and try again.
- The query closes `completed`, `cancelled`, or `aborted`. Only `completed` is a
  real answer; the other two exit non-zero with the reason.

**Exits** `0` when the query closes `completed`, or as soon as the say is accepted under
`noWait`. `1` if the say is rejected, no servicer replies, or the query closes
`cancelled`/`aborted`. `2` if `wait` elapses before the query closes, which is not a
verdict: the query is still running, so read it later. `64` if the input is not valid
JSON or is missing `conv`, `from`, `name` or `message`.

## replyToMessage — report upward to whoever put you to work

`echo '{"conv":"<uuid>","from":"<uuid>","name":"<yours>","message":"..."}' | replyToMessage.mts`
publishes the same `say` as `sendMessage`, and needs no approval. `conv` is the
conversation you are reporting INTO, which is the `from` of the message that put you
to work; `from` and `name` are your own.

Not only a finished answer. Your findings, a progress report, a roadblock, a
question you need settled: all of it goes this way. The name says reply because you
are answering the dispatch, not because it has to be the last thing you say.

It never follows the query it opens: you are not waiting on an answer to your own
report, and a report that can hang is how a finished one fails to arrive. Put a long
message in a file and pass it on stdin.

**Exits** `0` as soon as the reply is accepted. `1` if it is rejected or no servicer
replies, the latter meaning the conversation you are replying to has no agent
attached: `service.mts` it and send again. `64` if the input is not valid JSON or is
missing `conv`, `from`, `name` or `message`.

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
- `wait` is how many seconds to wait for a bridge to reply, default 30.
- `already_attached` means this instance already serves it — nothing to do.
- `failed` carries a free-text `detail` naming the broken step.
- No reply at all means no bridge is serving that world. That is not something to
  retry: a bridge has to be started, which is the SC's to do. Distinguish it from a
  say getting no servicer, which is a missing agent on one conversation and is what
  this tool fixes.
- Accepted: the conversation exists on the wire — follow up with `sendMessage.mts`
  against the printed `conversationId`.

**Exits** `0` when the request is accepted. `1` if it is rejected, or if no bridge
replies within `wait` seconds (default 30). `64` if the input is not valid JSON or has
no `world`.

## Configuration

- `NATS_URL` — the broker (default `nats://127.0.0.1:4222`).
- `NATS_STREAM` — the JetStream stream (default `conv-approval`).
