// Read the last N committed messages of a conversation from the JetStream
// change stream, newest last, as a readable transcript.
//
// Run by an LLM, not a person: takes one JSON object on stdin, writes the
// transcript to stdout, is quiet and exits 0 on success, non-zero on a usage error.
//
//   echo '{"conv":"<uuid>","n":20}' | node read.mts
//
// conv is the FULL conversation uuid (the v2 subject token); a truncated rail
// id will not match. n defaults to 20 and counts messages that survive the filter.
//
// include names the content to show, and defaults to what a conversation is: what each
// side said, and what the assistant thought. The machinery is off by default because
// reading a worker is reading its answer, not retracing how it got there.
//
//   user.text  assistant.text  thinking  tool_use  tool_result
//
// Naming any of them replaces the defaults, so `include: ["tool_use"]` is the tool calls
// alone. Any block type on the wire can be named, not just these five.
//
//   echo '{"conv":"<uuid>","n":1,"include":["assistant.text"]}' | node read.mts
//
// NATS_URL and NATS_STREAM override the broker defaults below.

import { JSONCodec, connect, consumerOpts } from "nats";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";

type Input = { conv: string; n?: number; include?: string[] };
type Block = { type?: string; text?: string; thinking?: string; name?: string; input?: unknown };
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
// Naming any types at all replaces the defaults rather than adding to them, so asking
// for one thing on its own — the tool calls, the thinking — is one word and not five.
const include = new Set(input.include ?? ["user.text", "assistant.text", "thinking"]);

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

  const rendered = messages.map(render).filter((line): line is string => line !== null);
  for (const line of rendered.slice(-n)) {
    process.stdout.write(line + "\n");
  }
} finally {
  await nc.drain();
}

// A message left with nothing to show is dropped rather than printed as a bare header,
// and `n` counts what survives, so `n: 1` under the default is the last thing said.
function render(m: Message): string | null {
  const body = (m.content ?? [])
    .filter((b) => include.has(kind(m, b)))
    .map(renderBlock)
    .filter(Boolean)
    .join("\n");
  if (!body) return null;
  return `\u2500\u2500 ${m.role ?? "?"} \u00b7 ${m.ts ?? ""}\n${body}`;
}

// Role only separates the two that share a type: a tool_result always arrives on a user
// message and a tool_use on an assistant one, so qualifying those would say nothing.
function kind(m: Message, b: Block): string {
  return b?.type === "text" ? `${m.role ?? "?"}.text` : (b?.type ?? "block");
}

function renderBlock(b: Block): string {
  switch (b?.type) {
    case "text":
      return b.text ?? "";
    case "thinking": {
      const thought = b.thinking?.trim();
      return thought ? `[thinking]\n${thought}` : "[thinking: no content on the wire]";
    }
    case "tool_use":
      return `[tool_use: ${b.name ?? "tool"}] ${JSON.stringify(b.input ?? {})}`;
    case "tool_result":
      return "[tool_result]";
    default:
      return `[${b?.type ?? "block"}]`;
  }
}
