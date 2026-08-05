// Status of several conversations at once: for each, when it last spoke and whether it
// is mid-turn or idle.
//
// Answers the question you actually have when several operators are running: which of
// these is working, which is waiting on me, and which has gone quiet. Reading each
// transcript to find that out costs a whole read per conversation.
//
// Run by an LLM, not a person: one JSON object on stdin, JSON to stdout.
//
//   echo '{"convs":["<uuid>","<uuid>"]}' | node status.mts
//   node status.mts < convs.json
//
// Derived from the conversation stream itself, not from agent telemetry: the
// telemetry.attached and telemetry.ready subjects carry nothing for conversations a
// bridge serves, so attachment is not readable that way. What is readable is the last
// committed message and the last query close, both by last_by_subj, which is two cheap
// calls per conversation and no subscription.
//
// state is a reading of those two, and it is a heuristic, not a fact the bus states:
//   working — a message landed after the last query closed, so a turn is in progress
//   idle    — the newest event is a query close, so nothing is running
//   empty   — nothing has ever been committed
// A `say` into a conversation whose state is `working` will be rejected as stale: the
// tip moves under you while it works. Wait for idle.
//
// Exits 0 with the report, 64 if the input is not valid JSON or has no convs.

import { JSONCodec, connect } from "nats";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";

type Message = { id?: string; role?: string; ts?: string; content?: { type?: string; text?: string }[] };
type QueryEvent = { queryId?: string; reason?: string; ts?: string };

type Status = {
  conv: string;
  state: "working" | "idle" | "empty";
  lastMessage: { role: string; ts: string; preview: string } | null;
  lastQuery: { queryId: string; reason: string; ts: string } | null;
  tip: string | null;
};

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const stream = process.env.NATS_STREAM ?? "conv-approval";

const input = readStdin<{ convs?: string[] }>('{"convs":["<uuid>","<uuid>"]}');
if (!Array.isArray(input.convs) || input.convs.length === 0 || input.convs.some((c) => typeof c !== "string" || c.length === 0)) {
  process.stderr.write("input needs { convs: [uuid, ...] }\n");
  process.exit(EXIT_BAD_INPUT);
}

const nc = await connect({ servers: url });
const jc = JSONCodec<unknown>();

/** The first line of the first text block, which is what identifies a message at a glance. */
const preview = (message: Message): string => {
  const text = (message.content ?? []).find((block) => block?.type === "text")?.text ?? "";
  const firstLine = text.split("\n").find((line) => line.trim().length > 0) ?? "";
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}...` : firstLine;
};

try {
  const jsm = await nc.jetstreamManager();

  const lastOn = async <T>(subject: string): Promise<T | null> => {
    try {
      const message = await jsm.streams.getMessage(stream, { last_by_subj: subject });
      return jc.decode(message.data) as T;
    } catch {
      // Nothing on the subject, which is not an error: a conversation that has never
      // been spoken into has no messages, and one still on its first turn has no
      // closed query.
      return null;
    }
  };

  const report: Status[] = [];
  for (const conv of input.convs) {
    const message = await lastOn<Message>(`conv.v2.${conv}.changes.message`);
    const query = await lastOn<QueryEvent>(`conv.v2.${conv}.changes.query`);

    const messageAt = message?.ts ?? null;
    const queryAt = query?.ts ?? null;
    const state = messageAt == null ? "empty" : queryAt != null && queryAt >= messageAt ? "idle" : "working";

    report.push({
      conv,
      state,
      lastMessage: message == null ? null : { role: message.role ?? "?", ts: messageAt ?? "", preview: preview(message) },
      lastQuery: query == null ? null : { queryId: query.queryId ?? "", reason: query.reason ?? "", ts: queryAt ?? "" },
      tip: message?.id ?? null,
    });
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await nc.drain();
}
