// Status of several conversations at once: for each, when it last spoke and whether it
// is mid-turn or idle. Optionally, block until one of them finishes.
//
// Answers the question you actually have when several operators are running: which of
// these is working, which is waiting on me, and which has gone quiet. Reading each
// transcript to find that out costs a whole read per conversation.
//
// Run by an LLM, not a person: one JSON object on stdin, JSON to stdout.
//
//   echo '{"convs":["<uuid>","<uuid>"]}' | node status.mts
//   echo '{"convs":["<uuid>","<uuid>"],"wait":900}' | node status.mts
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
// `wait` (seconds) blocks until the first edge fires on any of the conversations, so a
// handler that commissioned several workers is told when one finishes instead of
// polling. Two edges, because a worker that dies mid-turn reads `working` for ever and
// a wait watching only for idle would hang exactly when something has gone wrong:
//   idle  — a query closed, so a turn finished and there is something to read
//   quiet — still reads `working`, but has committed nothing for `quietAfter` seconds
// It watches the change stream and a timer rather than polling, which is the shape a
// daemon will want to read this logic out of.
//
// Exits 0 with the report, 2 if `wait` elapses with no edge (not a verdict: nothing has
// finished yet), 64 if the input is not valid JSON or has no convs.

import { JSONCodec, type NatsConnection, type Subscription, connect } from "nats";
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

type Edge = { conv: string; edge: "idle" | "quiet"; ts: string; silentForSeconds?: number };

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const stream = process.env.NATS_STREAM ?? "conv-approval";

// The longest legitimate silence seen on this fleet is a workspace build; the dead ones
// were silent for hours. It is a reading of that fleet rather than a derived number, so
// tune it when yours behaves differently.
const DEFAULT_QUIET_AFTER_SECONDS = 600;

const input = readStdin<{ convs?: string[]; wait?: number; quietAfter?: number }>('{"convs":["<uuid>","<uuid>"],"wait":900}');
if (!Array.isArray(input.convs) || input.convs.length === 0 || input.convs.some((c) => typeof c !== "string" || c.length === 0)) {
  process.stderr.write("input needs { convs: [uuid, ...] }\n");
  process.exit(EXIT_BAD_INPUT);
}
const seconds = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
if (input.wait !== undefined && !seconds(input.wait)) {
  process.stderr.write("wait is seconds to block for, a positive number\n");
  process.exit(EXIT_BAD_INPUT);
}
if (input.quietAfter !== undefined && !seconds(input.quietAfter)) {
  process.stderr.write("quietAfter is seconds of silence, a positive number\n");
  process.exit(EXIT_BAD_INPUT);
}

const convs = input.convs;
const quietAfterMs = (input.quietAfter ?? DEFAULT_QUIET_AFTER_SECONDS) * 1000;

const nc = await connect({ servers: url });
const jc = JSONCodec<unknown>();

/** The first line of the first text block, which is what identifies a message at a glance. */
const preview = (message: Message): string => {
  const text = (message.content ?? []).find((block) => block?.type === "text")?.text ?? "";
  const firstLine = text.split("\n").find((line) => line.trim().length > 0) ?? "";
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}...` : firstLine;
};

/**
 * Blocks until the first edge fires on any conversation, or until `waitSeconds`
 * elapses, which returns null.
 *
 * It subscribes before it surveys, so an edge landing between the two is seen rather
 * than lost, and it seeds the quiet timers from the survey: a conversation that has
 * already been silent too long is due immediately rather than after another full
 * `quietAfter`.
 */
async function waitForEdge(connection: NatsConnection, waitSeconds: number, survey: () => Promise<Status[]>): Promise<Edge | null> {
  const subs = new Map<string, Subscription>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  let resolveEdge!: (edge: Edge | null) => void;
  const edge = new Promise<Edge | null>((resolve) => {
    resolveEdge = resolve;
  });

  const fire = (found: Edge | null): void => {
    if (settled) return;
    settled = true;
    for (const timer of timers.values()) clearTimeout(timer);
    if (deadline !== undefined) clearTimeout(deadline);
    for (const sub of subs.values()) sub.unsubscribe();
    resolveEdge(found);
  };

  const armQuiet = (conv: string, lastCommitMs: number): void => {
    const existing = timers.get(conv);
    if (existing !== undefined) clearTimeout(existing);
    const dueInMs = Math.max(0, lastCommitMs + quietAfterMs - Date.now());
    const timer = setTimeout(() => {
      fire({ conv, edge: "quiet", ts: new Date().toISOString(), silentForSeconds: Math.round((Date.now() - lastCommitMs) / 1000) });
    }, dueInMs);
    timers.set(conv, timer);
  };

  const consume = async (conv: string, sub: Subscription): Promise<void> => {
    try {
      for await (const m of sub) {
        if (m.subject.endsWith(".changes.query")) {
          const body = jc.decode(m.data) as QueryEvent;
          fire({ conv, edge: "idle", ts: body.ts ?? new Date().toISOString() });
          return;
        }
        // Any other change is not activity for the quiet edge: quiet is about what the
        // conversation has committed.
        if (m.subject.endsWith(".changes.message")) armQuiet(conv, Date.now());
      }
    } catch {
      // The subscription ends when the edge fires or the wait elapses, which is the
      // normal way out of the loop and not something to report.
    }
  };

  for (const conv of convs) {
    const sub = connection.subscribe(`conv.v2.${conv}.changes.>`);
    subs.set(conv, sub);
    void consume(conv, sub);
  }
  await connection.flush();

  const seed = await survey();
  const alreadyIdle = seed.find((status) => status.state === "idle");
  if (alreadyIdle !== undefined) {
    // The transition has already happened; waiting for it again would wait for ever.
    fire({ conv: alreadyIdle.conv, edge: "idle", ts: alreadyIdle.lastQuery?.ts ?? new Date().toISOString() });
    return edge;
  }
  for (const status of seed) {
    if (status.state !== "working" || status.lastMessage === null) continue;
    const at = Date.parse(status.lastMessage.ts);
    armQuiet(status.conv, Number.isNaN(at) ? Date.now() : at);
  }
  deadline = setTimeout(() => fire(null), waitSeconds * 1000);
  process.stderr.write(`watching ${convs.length} conversation(s) for up to ${waitSeconds}s; quiet after ${quietAfterMs / 1000}s of silence...\n`);
  return edge;
}

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

  const survey = async (): Promise<Status[]> => {
    const report: Status[] = [];
    for (const conv of convs) {
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
    return report;
  };

  if (input.wait === undefined) {
    process.stdout.write(`${JSON.stringify(await survey(), null, 2)}\n`);
  } else {
    const edge = await waitForEdge(nc, input.wait, survey);
    process.stdout.write(`${JSON.stringify({ edge, status: await survey() }, null, 2)}\n`);
    if (edge === null) {
      process.stderr.write(`no conversation went idle or quiet within ${input.wait}s\n`);
      process.exitCode = 2;
    }
  }
} finally {
  await nc.drain();
}
