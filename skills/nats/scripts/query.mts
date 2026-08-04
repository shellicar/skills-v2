// Send a message into a conversation and wait for the reply: publish a `say`
// request, then follow the change stream until that query closes, printing the
// committed messages of the query as they land.
//
// Run by an LLM, not a person: takes one JSON object on stdin, writes the reply
// transcript to stdout, progress to stderr. Exits 1 if the say is rejected or the
// query did not complete, 2 if the wait timed out before it closed.
//
//   echo '{"conv":"<uuid>","from":"<uuid>","text":"hello","wait":180}' | node query.mts
//   echo '{"conv":"<uuid>","from":"<uuid>","text":"hello","noWait":true}' | node query.mts
//   node query.mts < payload.json
//
// conv is the FULL conversation uuid being spoken INTO; from is the FULL
// conversation uuid of the sender, recorded on the wire as
// `from: { kind: "agent", conversationId }`. It is required so that a say is
// always attributable: an unattributed message is indistinguishable from the
// human's own, and a reply then has no sender to route back to. A conversation
// learns its own id from whoever minted it (service.mts's caller), so a parent
// can always tell a child the value to pass here. wait is seconds, default 180; noWait
// exits as soon as the say is accepted, without following the reply. An agent must
// be attached to the conversation, or the say gets no reply.
// NATS_URL and NATS_STREAM override the defaults below.

import { JSONCodec, connect } from "nats";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";

type Input = { conv: string; from: string; text: string; wait?: number; noWait?: boolean };
type Block = { type?: string; text?: string; name?: string; input?: unknown };
type Message = { type?: string; id?: string; role?: string; ts?: string; content?: Block[] };
type Ack = { accepted?: boolean; id?: string; rejected?: boolean; reason?: string };
type Change = Message & { queryId?: string; reason?: string };

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const stream = process.env.NATS_STREAM ?? "conv-approval";

const input = readStdin<Input>('{"conv":"<uuid>","from":"<uuid>","text":"hello","wait":180}');
if (!input.conv || !input.from || typeof input.text !== "string") {
  process.stderr.write("input needs { conv, from, text }\n");
  process.exit(EXIT_BAD_INPUT);
}
const waitMs = (input.wait ?? 180) * 1000;
const tipSubject = `conv.v2.${input.conv}.changes.message`;
const watchSubject = `conv.v2.${input.conv}.changes.>`;
const saySubject = `conv.v2.${input.conv}.requests.say`;

const nc = await connect({ servers: url });
const jc = JSONCodec<unknown>();
try {
  const jsm = await nc.jetstreamManager();

  // The premise: a `say` is anchored to a known tip, null for an empty
  // conversation. A stale tip is rejected, not applied.
  let tip: string | null = null;
  try {
    const last = await jsm.streams.getMessage(stream, { last_by_subj: tipSubject });
    tip = (jc.decode(last.data) as Message).id ?? null;
  } catch {
    // Nothing on the subject yet, so this is an empty conversation: it anchors to null.
    tip = null;
  }

  // Subscribe to the change stream BEFORE sending, so the reply cannot be missed.
  const sub = nc.subscribe(watchSubject);

  const say = {
    ts: new Date().toISOString(),
    from: { kind: "agent", conversationId: input.from },
    text: input.text,
    precondition: { tip },
  };
  process.stderr.write(`[debug] saySubject=${saySubject} watchSubject=${watchSubject} tip=${tip}\n`);
  let ack: Ack;
  try {
    const reply = await nc.request(
      saySubject,
      jc.encode(say),
      { timeout: 5000 },
    );
    ack = jc.decode(reply.data) as Ack;
  } catch (err) {
    process.stderr.write(`[debug] request error: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
    process.stderr.write(
      "no servicer replied to the say (is an agent attached to this conversation?)\n",
    );
    await nc.drain();
    process.exit(1);
  }
  if (!ack?.accepted) {
    process.stderr.write(`say rejected: ${ack?.reason ?? "unknown"}\n`);
    await nc.drain();
    process.exit(1);
  }

  const queryId = ack.id;
  // noWait: the say landed, which is all the caller wanted to know. The query
  // runs on server-side regardless — read.mts picks it up later.
  if (input.noWait) {
    process.stdout.write(`query ${queryId} accepted\n`);
    await nc.drain();
    process.exit(0);
  }
  process.stderr.write(
    `query ${queryId} accepted; waiting up to ${input.wait ?? 180}s for it to close...\n`,
  );

  // Unsubscribing ends the wait if the query never closes.
  const timer = setTimeout(() => sub.unsubscribe(), waitMs);
  let closed = false;
  for await (const m of sub) {
    const body = jc.decode(m.data) as Change;
    if (body?.queryId !== queryId) continue;
    const isClose = m.subject.endsWith(".changes.query");
    const isMessage = m.subject.endsWith(".changes.message");
    if (isClose) {
      process.stdout.write(`\u2500\u2500 query ${queryId} closed: ${body.reason}\n`);
      closed = true;
      // Only `completed` is a real answer; aborted/cancelled are failures the
      // caller should be able to branch on.
      if (body.reason !== "completed") process.exitCode = 1;
      break;
    }
    if (isMessage) {
      process.stdout.write(render(body) + "\n");
    }
  }
  clearTimeout(timer);
  if (!closed) {
    process.stderr.write("timed out before the query closed\n");
    process.exitCode = 2;
  }
} finally {
  await nc.drain();
}

function render(m: Message): string {
  const body = (m.content ?? []).map(renderBlock).filter(Boolean).join("\n");
  return `\u2500\u2500 ${m.role ?? "?"} \u00b7 ${m.ts ?? ""}\n${body}`;
}

function renderBlock(b: Block): string {
  switch (b?.type) {
    case "text":
      return b.text ?? "";
    case "tool_use":
      return `[tool_use: ${b.name ?? "tool"}] ${JSON.stringify(b.input ?? {})}`;
    case "tool_result":
      return "[tool_result]";
    default:
      return `[${b?.type ?? "block"}]`;
  }
}
