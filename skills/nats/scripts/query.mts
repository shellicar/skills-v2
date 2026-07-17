// Send a message into a conversation and wait for the reply: publish a `say`
// request, then follow the change stream until that query closes, printing the
// committed messages of the query as they land.
//
// Run by an LLM, not a person: takes one JSON argument, writes the reply
// transcript to stdout, progress to stderr, exits non-zero if the say is
// rejected or the wait times out.
//
//   node query.mts '{"conv":"<uuid>","text":"hello","wait":180}'
//
// conv is the FULL conversation uuid. wait is seconds, default 180. An agent
// must be attached to the conversation, or the say gets no reply. NATS_URL and
// NATS_STREAM override the defaults below.

import { JSONCodec, connect } from "nats";

type Input = { conv: string; text: string; wait?: number; v2?: boolean };
type Block = { type?: string; text?: string; name?: string; input?: unknown };
type Message = { type?: string; id?: string; role?: string; ts?: string; content?: Block[] };
type Ack = { accepted?: boolean; id?: string; rejected?: boolean; reason?: string };
type Change = Message & { queryId?: string; reason?: string };

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const stream = process.env.NATS_STREAM ?? "conv-approval";

const input = parseInput();
const waitMs = (input.wait ?? 180) * 1000;
// Default to v1 (what the current CLI publishes); pass { "v2": true } for the v2 subject shape.
const version = input.v2 ? "v2" : "v1";
const tipSubject =
  version === "v2"
    ? `conv.v2.${input.conv}.changes.message`
    : `conv.v1.${input.conv}.changes`;
const watchSubject =
  version === "v2" ? `conv.v2.${input.conv}.changes.>` : `conv.v1.${input.conv}.changes`;
const saySubject = `conv.${version}.${input.conv}.requests.say`;

const nc = await connect({ servers: url });
const jc = JSONCodec<unknown>();
try {
  const jsm = await nc.jetstreamManager();

  // The premise: a `say` is anchored to a known tip (the last committed message
  // id), null for an empty conversation. A stale tip is rejected, not applied.
  let tip: string | null = null;
  try {
    const last = await jsm.streams.getMessage(stream, {
      last_by_subj: tipSubject,
    });
    tip = (jc.decode(last.data) as Message).id ?? null;
  } catch {
    tip = null;
  }

  // Subscribe to the change stream BEFORE sending, so the reply cannot be missed.
  const sub = nc.subscribe(watchSubject);

  const say = {
    ts: new Date().toISOString(),
    from: { kind: "human" },
    text: input.text,
    precondition: { tip },
  };
  let ack: Ack;
  try {
    const reply = await nc.request(
      saySubject,
      jc.encode(say),
      { timeout: 5000 },
    );
    ack = jc.decode(reply.data) as Ack;
  } catch {
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
  process.stderr.write(
    `query ${queryId} accepted; waiting up to ${input.wait ?? 180}s for it to close...\n`,
  );

  // Unsubscribing ends the wait if the query never closes.
  const timer = setTimeout(() => sub.unsubscribe(), waitMs);
  let closed = false;
  for await (const m of sub) {
    const body = jc.decode(m.data) as Change;
    if (body?.queryId !== queryId) continue;
    // v2 discriminates by sub-subject; v1's flat .changes carries the change type on the payload.
    const isClose = version === "v2" ? m.subject.endsWith(".changes.query") : body.type === "query";
    const isMessage = version === "v2" ? m.subject.endsWith(".changes.message") : body.type === "message";
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
    process.exitCode = 1;
  }
} finally {
  await nc.drain();
}

function parseInput(): Input {
  const raw = process.argv[2];
  if (!raw) {
    process.stderr.write('usage: query.mts \'{"conv":"<uuid>","text":"hello"}\'\n');
    process.exit(2);
  }
  const parsed = JSON.parse(raw) as Input;
  if (!parsed?.conv || !parsed?.text) {
    process.stderr.write("input needs { conv, text }\n");
    process.exit(2);
  }
  return parsed;
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
