// Read the last N committed messages of a conversation from the JetStream
// change stream, newest last, as a readable transcript.
//
// Run by an LLM, not a person: takes one JSON object on stdin, writes the
// transcript to stdout, is quiet and exits 0 on success, non-zero on a usage error.
//
//   echo '{"conv":"<uuid>","n":20}' | node read.mts
//
// conv is the FULL conversation uuid (the v2 subject token); a truncated rail
// id will not match. n defaults to 20. NATS_URL and NATS_STREAM override the
// defaults below.

import { JSONCodec, connect, consumerOpts } from "nats";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";

type Input = { conv: string; n?: number };
type Block = { type?: string; text?: string; name?: string; input?: unknown };
type Message = { type?: string; id?: string; role?: string; ts?: string; content?: Block[] };

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const stream = process.env.NATS_STREAM ?? "conv-approval";

const input = readStdin<Input>('{"conv":"<uuid>","n":20}');
if (!input.conv) {
  process.stderr.write("input needs { conv }\n");
  process.exit(EXIT_BAD_INPUT);
}
const subject = `conv.v2.${input.conv}.changes.message`;
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
    messages.push(decoded);
    if (m.info.pending === 0) break; // caught up to the last stored message
  }

  for (const message of messages.slice(-n)) {
    process.stdout.write(render(message) + "\n");
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
