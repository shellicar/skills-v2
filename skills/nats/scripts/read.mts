// Read the last N committed messages of a conversation from the JetStream
// change stream, newest last, as a readable transcript.
//
// Run by an LLM, not a person: takes one JSON argument, writes the transcript
// to stdout, is quiet and exits 0 on success, non-zero on a usage error.
//
//   node read.mts '{"conv":"<uuid>","n":20}'
//
// conv is the FULL conversation uuid (the v2 subject token); a truncated rail
// id will not match. n defaults to 20. NATS_URL and NATS_STREAM override the
// defaults below.

import { JSONCodec, connect, consumerOpts } from "nats";

type Input = { conv: string; n?: number; v2?: boolean };
type Block = { type?: string; text?: string; name?: string; input?: unknown };
type Message = { type?: string; id?: string; role?: string; ts?: string; content?: Block[] };

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const stream = process.env.NATS_STREAM ?? "conv-approval";

const input = parseInput();
// Version must be explicit — pass { "v1": true } or { "v2": true }. No default:
// a version mismatch reads silently empty (no messages, no cause), so the
// caller must state which subject shape the conversation uses.
if (!input.v1 && !input.v2) {
  console.error('version required: pass { "v1": true } or { "v2": true }');
  process.exit(2);
}
const version = input.v2 ? "v2" : "v1";
const subject =
  version === "v2"
    ? `conv.v2.${input.conv}.changes.message`
    : `conv.v1.${input.conv}.changes`;
const n = input.n ?? 20;

const nc = await connect({ servers: url });
const jc = JSONCodec<Message>();
try {
  const jsm = await nc.jetstreamManager();
  // Empty-guard: an ordered consumer over a subject with no messages would
  // block forever, so confirm at least one exists before subscribing.
  try {
    await jsm.streams.getMessage(stream, { last_by_subj: subject });
  } catch {
    process.stderr.write(`no messages for conversation ${input.conv}\n`);
    await nc.drain();
    process.exit(0);
  }

  const js = nc.jetstream();
  const opts = consumerOpts();
  opts.orderedConsumer();
  opts.filterSubject(subject);
  const sub = await js.subscribe(subject, opts);

  const messages: Message[] = [];
  for await (const m of sub) {
    const decoded = jc.decode(m.data);
    // v2's subject is already message-only; v1's flat .changes carries every change type, so keep only messages.
    if (version === "v2" || decoded.type === "message") messages.push(decoded);
    if (m.info.pending === 0) break; // caught up to the last stored message
  }

  for (const message of messages.slice(-n)) {
    process.stdout.write(render(message) + "\n");
  }
} finally {
  await nc.drain();
}

function parseInput(): Input {
  const raw = process.argv[2];
  if (!raw) {
    process.stderr.write('usage: read.mts \'{"conv":"<uuid>","n":20}\'\n');
    process.exit(2);
  }
  const parsed = JSON.parse(raw) as Input;
  if (!parsed?.conv) {
    process.stderr.write("input needs { conv }\n");
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
