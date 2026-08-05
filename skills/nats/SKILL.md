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

**Reporting upward is not a send, so there is nothing to gate.** Your report is the
answer you write in your own conversation: the finished work, a blocker, a question you
need settled. Whoever commissioned you watches that conversation with `status.mts`'s
`wait` and reads it where it sits, so nothing has to be published into theirs.

That is also why it cannot fail. A say into a conversation that is mid-turn is rejected
as stale, so a report written outward failed exactly when it mattered most: it happened
twice in one night, once to a finished review and once to a worker that needed a
decision. An answer that never leaves your own conversation has nothing to be rejected
by.

An original message commissions work in a conversation that did not ask for it. If
you are a worker and find you need to send one, that is a thing to report upward,
not to send outward.

Five tools over the conversation bus (docs/spec in the tower repo). All take one
JSON object on stdin and are meant for you to run, not a person: stdout is the
result, stderr is progress, a non-zero exit means it did not get what it asked for.

Run with Node 22+ (it runs `.mts` directly, no build):

```sh
echo '{"convs":["<uuid>","<uuid>"]}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/status.mts
# block until the first of them finishes or goes quiet, instead of polling:
echo '{"convs":["<uuid>","<uuid>"],"wait":900}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/status.mts
echo '{"conv":"<uuid>","n":20}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/read.mts
echo '{"conv":"<uuid>","from":"<uuid>","name":"<yours>","message":"...","wait":180}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/sendMessage.mts
# dispatch without waiting for the reply — the query runs on regardless:
echo '{"conv":"<uuid>","from":"<uuid>","name":"<yours>","message":"...","noWait":true}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/sendMessage.mts
# commission a worker — serve it, record who it reports to, and send the brief:
echo '{"world":"local","cwd":"/path","owner":"<uuid>","name":"<yours>","message":"..."}' | node ~/repos/shellicar/skills-v2/skills/nats/scripts/spawn.mts
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

### wait — block until one of them finishes

`wait` is seconds. Leave it out and nothing changes: the report is the same array, taken
once. Pass it and the tool blocks until the first edge fires on any of the conversations,
then returns immediately. That is what a handler wants when it has commissioned several
workers: it is told which one is worth reading, rather than polling this tool by hand.
The output becomes `{"edge":...,"status":[...]}` — the edge that fired, and the same
report taken at that moment.

Two edges, not one:

- `idle` — a query closed, so a turn finished and there is something to read.
- `quiet` — it still reads `working`, but has committed nothing for `quietAfter`
  seconds. This is the edge that matters most: a worker that died mid-turn reads
  `working` for ever and never goes idle, so a wait watching only for idle hangs
  precisely when something has gone wrong. The edge carries `silentForSeconds`.

`quietAfter` is seconds, default 600. That default is a reading of this fleet rather than
a derived number: the longest legitimate silence seen here is a workspace build, and the
real dead ones were silent for hours. Tune it when what you are watching behaves
differently.

A conversation already idle when the call is made returns straight away, and so does one
already silent past `quietAfter`. The transition has happened; waiting for it again would
wait for ever.

It subscribes to each conversation's changes and runs a timer, rather than polling in a
loop.

**Exits** `0` with the report, and under `wait`, `0` when an edge fires. `2` if `wait`
elapses with no edge, which is not a verdict: nothing has finished yet, so wait again.
`64` if the input is not valid JSON, has no `convs`, or has a `wait` or `quietAfter` that
is not a positive number.

`check-status.mts` drives real conversations on the broker from its own process: it
publishes the change events a live conversation would, so no bridge is asked for anything
and no worker is involved. Run it after touching `status.mts`.

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
`from: { kind: "agent", conversationId, name }`, so a say is always attributable and a
transcript with several agents in it can be read apart. Nothing tells a session its own
id automatically, so if you do not know yours, ask. The name is the one from
`cast-name`: if you have not chosen yet, choose now rather than sending anonymously.

**The recipient's own conversation id is appended for you.** That one line is how a
spawned conversation learns which conversation it is in, and nothing else tells it: the
bridge no more hands an agent its conversation id than it hands it its working
directory. **Do not write it into your `message` by hand** — the id is already in what
you pass, and every hand-written copy went stale the moment the scripts changed shape.

It is the id and nothing else. The recipient does not write back: it answers in its own
conversation, and you watch that conversation with `status.mts`'s `wait`.

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

`check-send.mts` exercises all of it against loopback responders — it answers every say
itself, so no bridge is asked for anything and no message reaches a real conversation.
It reads what went on the wire, which is where the appended conversation id is checked.
Run it after touching `sendMessage.mts` or `lib/say.mts`.

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

## spawn — commission a worker: serve it, record who watches it, hand it the brief

`echo '{"world":"local","cwd":"/path/to/worktree","owner":"<your uuid>","name":"<yours>","message":"the brief"}' | spawn.mts`
does the three things a handler needs to happen together: it gets a conversation
served in the world, it records that the worker reports to you, and it sends the
brief. They are one tool because a registration step a handler has to remember
separately is one that gets skipped or mistyped, and what that produces is a worker
nobody is watching.

`owner` is your own conversation id and `name` is your cast name, both required, both
for the same reason `sendMessage.mts` needs them. `conv` is the worker's id, minted
for you when you leave it out. `cwd` is required — a worker spawned into the wrong
tree edits the wrong repo — and `model` is passed to the world when you name it.
**This is a gated tool**: the brief is an original message.

Four steps in order, each worth doing only if the one before it landed:

1. Mint the conversation id.
2. `service` the world with it, plus `cwd` and `model`. A rejection stops everything
   and prints itself; nothing else has happened yet, so there is nothing to unwind.
3. Write the reporting line, then read it back. Failing here stops the spawn and says
   so plainly: the conversation is **attached but has no line**, which is a worker
   nobody is watching. The brief is not sent. Fix the bucket and spawn again passing
   the same `conv`.
4. Send the brief, always `noWait`, with the worker's own conversation id appended. A
   spawn hands out work; it does not wait for an answer.

The result — `{"conversationId","queryId","owner"}` — is the **last** line of stdout.
The line above it is the say's own `query <id> accepted`, exactly as `sendMessage.mts`
prints it.

**spawn creates the reporting line, and `service` never does.** That is what makes
re-serving safe: a takeover, or a bridge restarting and re-serving its whole fleet, is
`service` over and over, and every line survives it untouched. Only a commission
creates a line, so re-attaching a conversation never rewrites who is watching it and
never invents a watcher for a conversation nobody commissioned.

### The reporting line

- **Bucket** `reporting-lines`, KV, created by the script when it is absent.
  `NATS_REPORTING_BUCKET` overrides the name, which is there for `check-spawn.mts`
  and not for you.
- **Key** the worker's conversation id.
- **Value** `{"owner":"<conversation id>","ts":"<iso8601>"}`, and nothing else.

A line records direction of reporting and nothing more: who this worker reports to,
and when that was decided. The worktree and the brief belong to the spawn, not to the
line. KV rather than a stream because a line is deleted at teardown, which makes it a
table rather than a history.

**Exits** `0` when all four steps land. `1` when any of them is rejected: a service
the world refused, no bridge replying at all, a reporting line that would not read
back, or a say no servicer took. `64` if the input is not valid JSON or is missing
`world`, `cwd`, `owner`, `name` or `message`.

`check-spawn.mts` exercises all of it against loopback responders — it answers the
service request and the say itself, so no bridge is asked for anything and no brief
reaches a worker. Run it after touching `spawn.mts` or `lib/say.mts`.

## Configuration

- `NATS_URL` — the broker (default `nats://127.0.0.1:4222`).
- `NATS_STREAM` — the JetStream stream (default `conv-approval`).
- `NATS_REPORTING_BUCKET` — the reporting-line KV bucket (default `reporting-lines`).
  `check-spawn.mts` sets it so a test never writes into the bucket the fleet runs on.
