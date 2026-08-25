// Status of several conversations at once: what each is doing, whether anything is
// still serving it, and whether it is stopped waiting on you.
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
// THREE SEPARATE QUESTIONS, THREE SEPARATE READS. An earlier version derived one word
// from the conversation stream alone — the last committed message against the last
// query close — and that word could not tell a busy agent from a blocked one from a
// corpse, because all three commit nothing. It reported `working` for a conversation
// that had been stopped on an unanswered approval for hours.
//
//   the turn      conv.v2.{conv}.changes.{message,query}   is a turn open?
//   the instance  conv.v2.{conv}.attachment.{attached,detached} -> instanceId,
//                 then agent.v1.{world}.telemetry.pulse for that instance
//                                                          is anything serving it?
//   the block     approval.v1.*.lifecycle correlated to this conversation,
//                 plus approval.v1.{id}.telemetry           is it waiting on a human?
//
// Liveness is only ever positive proof. A pulse within its own promised interval says
// alive; silence says nothing except that nothing was heard, so `stranded` is a reading
// of silence and never a claim that a process is gone.
//
// Pulses and approval heartbeats live in the EPHEMERAL stream, not the durable one, and
// the same subject exists in both — so every read binds its stream explicitly rather
// than letting the subject choose.
//
// `wait` (seconds) blocks until the first edge fires on any of the conversations, so a
// handler that commissioned several workers is told when one is worth looking at instead
// of polling. Three edges, because the two ways a worker stops are not the same as the
// one way it finishes:
//
//   idle              a query closed, so a turn finished and there is something to read
//   quiet             still working, but has committed nothing for `quietAfter`
//   awaiting-approval an approval has sat unanswered for `approvalAfter`
//
// The last is debounced on purpose. A raise is not worth waking anyone for, because most
// are answered in seconds and firing on each would make the tool useless. One still
// pending after `approvalAfter` is a worker that has stopped and will not start again by
// itself, which is the state a handler most needs and the one an earlier version of this
// script reported as nothing at all: it fired no edge for an approval, so a wait sat out
// its full term and said a worker was fine while it had been stopped for hours.
//
// Exits 0 with the report, 2 if `wait` elapses with no edge (not a verdict: nothing has
// finished yet), 64 if the input is not valid JSON or has no convs.

import { AckPolicy, DeliverPolicy, JSONCodec, type NatsConnection, type Subscription, connect } from "nats";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";

type Message = { id?: string; role?: string; ts?: string; content?: { type?: string; text?: string }[] };
type QueryEvent = { queryId?: string; reason?: string; ts?: string };
type Attachment = { ts?: string; instanceId?: string; world?: string; cwd?: string; intervalS?: number };
type Pulse = { ts?: string; instanceId?: string; intervalS?: number };
type Heartbeat = { ts?: string };
type Lifecycle = {
  type?: string;
  ts?: string;
  approved?: boolean;
  ask?: { type?: string; name?: string };
  correlation?: { conversationId?: string; queryId?: string; turnId?: string; toolUseId?: string };
};

type Instance = {
  instanceId: string;
  world: string | null;
  cwd: string | null;
  attachedAt: string | null;
  detachedAt: string | null;
  promisedIntervalS: number;
  lastPulse: string | null;
  pulseAgeSeconds: number | null;
  /** null when the read could not be completed: unknown, which is not the same as dead. */
  alive: boolean | null;
};

type Blocked = {
  approvalId: string;
  raisedAt: string;
  ask: string;
  lastHeartbeat: string | null;
  heartbeatAgeSeconds: number | null;
};

type State = "empty" | "idle" | "working" | "awaiting-approval" | "stranded" | "released" | "unknown";

type Status = {
  conv: string;
  state: State;
  since: string | null;
  lastActivity: { kind: string; ts: string; ageSeconds: number } | null;
  instance: Instance | null;
  approval: Blocked | null;
  lastMessage: { role: string; ts: string; preview: string } | null;
  lastQuery: { queryId: string; reason: string; ts: string } | null;
  tip: string | null;
};

type Edge = {
  conv: string;
  edge: "idle" | "quiet" | "awaiting-approval";
  ts: string;
  silentForSeconds?: number;
  approvalId?: string;
  pendingForSeconds?: number;
};

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const stream = process.env.NATS_STREAM ?? "conv-approval";
const ephemeralStream = process.env.NATS_EPHEMERAL_STREAM ?? "conv-ephemeral";

// The longest legitimate silence seen on this fleet is a workspace build; the dead ones
// were silent for hours. It is a reading of that fleet rather than a derived number, so
// tune it when yours behaves differently.
const DEFAULT_QUIET_AFTER_SECONDS = 600;

// How long an approval must sit unanswered before it is worth waking anyone for. An
// approval that is answered in seconds is a blip and firing on it would turn every
// routine tool call into an interruption; one that is still pending after this is a
// worker that has stopped and will not start again on its own.
const DEFAULT_APPROVAL_AFTER_SECONDS = 60;

// An attachment or pulse that never carried intervalS made no promise, so it gets this
// rather than being presumed alive for ever.
const DEFAULT_PROMISE_SECONDS = 600;

// A pulse is a promise to be heard from again within intervalS. Two intervals of silence
// is late rather than merely unlucky; one interval would strand a healthy instance on a
// single delayed publish.
const MISSED_PULSES_BEFORE_STRANDED = 2;

// How many events a walk asks for at a time. Only a throughput knob: the walk keeps
// asking until a fetch comes back empty, so this never bounds what it reads.
const FETCH_BATCH = 512;

const input = readStdin<{ convs?: string[]; wait?: number; quietAfter?: number; approvalAfter?: number }>(
  '{"convs":["<uuid>","<uuid>"],"wait":900}',
);
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
if (input.approvalAfter !== undefined && !seconds(input.approvalAfter)) {
  process.stderr.write("approvalAfter is seconds an approval may sit before it fires, a positive number\n");
  process.exit(EXIT_BAD_INPUT);
}

const convs = input.convs;
const quietAfterMs = (input.quietAfter ?? DEFAULT_QUIET_AFTER_SECONDS) * 1000;
const approvalAfterMs = (input.approvalAfter ?? DEFAULT_APPROVAL_AFTER_SECONDS) * 1000;

const nc = await connect({ servers: url });
const jc = JSONCodec<unknown>();
const js = nc.jetstream();

/** The first line of the first text block, which is what identifies a message at a glance. */
const preview = (message: Message): string => {
  const text = (message.content ?? []).find((block) => block?.type === "text")?.text ?? "";
  const firstLine = text.split("\n").find((line) => line.trim().length > 0) ?? "";
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}...` : firstLine;
};

const ageSeconds = (ts: string | null | undefined): number | null => {
  if (!ts) return null;
  const at = Date.parse(ts);
  return Number.isNaN(at) ? null : Math.round((Date.now() - at) / 1000);
};

try {
  const jsm = await nc.jetstreamManager();

  /** The last event on one exact subject, from one named stream. */
  const lastOn = async <T>(fromStream: string, subject: string): Promise<T | null> => {
    try {
      const message = await jsm.streams.getMessage(fromStream, { last_by_subj: subject });
      return jc.decode(message.data) as T;
    } catch {
      // Nothing on the subject, which is not an error: a conversation that has never
      // been spoken into has no messages, and one still on its first turn has no
      // closed query. It is also not proof of absence — the subject may simply live in
      // a different stream, which is why every caller names the stream it means.
      return null;
    }
  };

  /**
   * Walk one subject forward from a point in time, offering each event to `take`.
   *
   * Bounded by `since`, because these subjects carry hundreds of thousands of events and
   * only the window that could change the answer is worth reading. The stream is named
   * explicitly — pulses exist under the same subject in two streams, and letting the
   * subject pick chooses wrongly.
   */
  const walkSince = async <T>(fromStream: string, subject: string, since: Date, take: (event: T, on: string) => void): Promise<boolean> => {
    let consumer: string | undefined;
    try {
      const created = await jsm.consumers.add(fromStream, {
        filter_subject: subject,
        deliver_policy: DeliverPolicy.StartTime,
        opt_start_time: since.toISOString(),
        ack_policy: AckPolicy.None,
        inactive_threshold: 60_000_000_000,
      });
      consumer = created.name;

      // no_wait is what makes this terminate: the fetch returns whatever is there and
      // ends, rather than holding the request open for messages that may never come. So
      // an empty window costs one round trip and answers definitively, and a full one is
      // read to exhaustion — the loop stops when a fetch comes back with nothing.
      for (;;) {
        let received = 0;
        const batch = await js.fetch(fromStream, consumer, { batch: FETCH_BATCH, no_wait: true });
        for await (const m of batch) {
          take(jc.decode(m.data) as T, m.subject);
          received += 1;
        }
        if (received === 0) return true;
      }
    } catch {
      // The read could not be completed. The caller must not read that as an empty
      // window: nothing was found, and nothing is known either.
      return false;
    } finally {
      if (consumer !== undefined) await jsm.consumers.delete(fromStream, consumer).catch(() => {});
    }
  };

  /**
   * Who is serving this conversation, and is it still alive?
   *
   * Attachment is singular: the newest `attached` supersedes whatever stood before it,
   * and a `detached` only counts when it comes from the instance whose claim stands.
   * Liveness is then that instance's own pulse, which is one fact per instance on a
   * world-wide subject — so the scan filters by instanceId rather than taking whatever
   * pulsed last.
   */
  const readInstance = async (conv: string): Promise<Instance | null> => {
    const attached = await lastOn<Attachment>(stream, `conv.v2.${conv}.attachment.attached`);
    if (attached?.instanceId == null) return null;

    const detached = await lastOn<Attachment>(stream, `conv.v2.${conv}.attachment.detached`);
    const releasedBy =
      detached?.instanceId === attached.instanceId && (detached.ts ?? "") >= (attached.ts ?? "") ? (detached.ts ?? null) : null;

    const promisedIntervalS = attached.intervalS ?? DEFAULT_PROMISE_SECONDS;
    const world = attached.world ?? null;

    let lastPulse: string | null = null;
    let known = true;
    if (world !== null && releasedBy === null) {
      const subject = `agent.v1.${world}.telemetry.pulse`;
      const windowMs = promisedIntervalS * MISSED_PULSES_BEFORE_STRANDED * 1000;
      const since = new Date(Date.now() - windowMs);

      // One pulse subject carries every instance in the world, so the walk filters by
      // instanceId rather than taking whatever pulsed last.
      known = await walkSince<Pulse>(ephemeralStream, subject, since, (pulse) => {
        if (pulse.instanceId === attached.instanceId && pulse.ts != null && (lastPulse === null || pulse.ts > lastPulse)) {
          lastPulse = pulse.ts;
        }
      });
    }

    const pulseAge = ageSeconds(lastPulse);
    return {
      instanceId: attached.instanceId,
      world,
      cwd: attached.cwd ?? null,
      attachedAt: attached.ts ?? null,
      detachedAt: releasedBy,
      promisedIntervalS,
      lastPulse,
      pulseAgeSeconds: pulseAge,
      alive: pulseAge !== null ? pulseAge <= promisedIntervalS * MISSED_PULSES_BEFORE_STRANDED : known ? false : null,
    };
  };

  /**
   * The approval this conversation is stopped on, if any.
   *
   * Approvals are keyed by an id the agent's own model mints, which only *may* coincide
   * with a tool-use id — so they are found by correlation, never by constructing a
   * subject from the tool call. Outstanding is raised with no settled, which is a fold
   * over the lifecycle leaf; the window starts at the message that raised it, because a
   * blocked turn commits nothing after that point.
   */
  const readApproval = async (conv: string, lastMessageTs: string | null): Promise<{ blocked: Blocked | null; known: boolean }> => {
    if (lastMessageTs === null) return { blocked: null, known: true };
    const from = Date.parse(lastMessageTs);
    if (Number.isNaN(from)) return { blocked: null, known: true };

    // The approval id lives in the subject, so the fold keys on it: raised puts one in,
    // settled takes it out, and whatever is left was never answered.
    const outstanding = new Map<string, Lifecycle>();
    const known = await walkSince<Lifecycle>(stream, "approval.v1.*.lifecycle", new Date(from - 60_000), (event, on) => {
      const approvalId = on.split(".")[2];
      if (approvalId === undefined) return;
      if (event.type === "raised" && event.correlation?.conversationId === conv) outstanding.set(approvalId, event);
      if (event.type === "settled") outstanding.delete(approvalId);
    });

    let found: { approvalId: string; event: Lifecycle } | null = null;
    for (const [approvalId, event] of outstanding) {
      if (found === null || (event.ts ?? "") > (found.event.ts ?? "")) found = { approvalId, event };
    }
    if (found === null) return { blocked: null, known };

    const heartbeat = await lastOn<Heartbeat>(ephemeralStream, `approval.v1.${found.approvalId}.telemetry`);
    const ask = found.event.ask;
    return {
      known,
      blocked: {
        approvalId: found.approvalId,
        raisedAt: found.event.ts ?? "",
        ask: ask?.name != null ? `${ask.type ?? "?"}: ${ask.name}` : (ask?.type ?? "?"),
        lastHeartbeat: heartbeat?.ts ?? null,
        heartbeatAgeSeconds: ageSeconds(heartbeat?.ts),
      },
    };
  };

  const survey = async (): Promise<Status[]> => {
    const report: Status[] = [];
    for (const conv of convs) {
      const message = await lastOn<Message>(stream, `conv.v2.${conv}.changes.message`);
      const query = await lastOn<QueryEvent>(stream, `conv.v2.${conv}.changes.query`);

      const messageAt = message?.ts ?? null;
      const queryAt = query?.ts ?? null;
      const turnOpen = messageAt != null && !(queryAt != null && queryAt >= messageAt);

      const instance = await readInstance(conv);
      const asked = turnOpen ? await readApproval(conv, messageAt) : { blocked: null, known: true };
      const approval = asked.blocked;

      // Ordered by what a reader must act on. A closed turn is settled whatever the
      // instance is doing; an open one is only worth reporting as `working` once
      // nothing better explains why it has gone quiet.
      let state: State;
      let since: string | null;
      if (messageAt == null) {
        state = "empty";
        since = null;
      } else if (!turnOpen) {
        state = "idle";
        since = queryAt;
      } else if (instance?.detachedAt != null) {
        state = "released";
        since = instance.detachedAt;
      } else if (instance !== null && instance.alive === false) {
        state = "stranded";
        since = instance.lastPulse ?? instance.attachedAt;
      } else if (approval !== null) {
        state = "awaiting-approval";
        since = approval.raisedAt;
      } else if (instance?.alive === null || !asked.known) {
        // A read that did not complete cannot say what it did not reach, and `working`
        // is a claim. Say so instead of picking the reassuring answer.
        state = "unknown";
        since = null;
      } else {
        state = "working";
        since = messageAt;
      }

      // The freshest thing that proves anything is still happening, which is a
      // different event depending on what it is doing.
      const activity =
        state === "awaiting-approval" && approval?.lastHeartbeat != null
          ? { kind: "approval heartbeat", ts: approval.lastHeartbeat }
          : instance?.lastPulse != null
            ? { kind: "instance pulse", ts: instance.lastPulse }
            : messageAt != null
              ? { kind: "message", ts: messageAt }
              : null;

      report.push({
        conv,
        state,
        since,
        lastActivity: activity === null ? null : { ...activity, ageSeconds: ageSeconds(activity.ts) ?? -1 },
        instance,
        approval,
        lastMessage: message == null ? null : { role: message.role ?? "?", ts: messageAt ?? "", preview: preview(message) },
        lastQuery: query == null ? null : { queryId: query.queryId ?? "", reason: query.reason ?? "", ts: queryAt ?? "" },
        tip: message?.id ?? null,
      });
    }
    return report;
  };

  /**
   * Blocks until the first edge fires on any conversation, or until `waitSeconds`
   * elapses, which returns null.
   *
   * It subscribes before it surveys, so an edge landing between the two is seen rather
   * than lost, and it seeds the quiet timers from the survey: a conversation that has
   * already been silent too long is due immediately rather than after another full
   * `quietAfter`. Only `working` arms a quiet timer — a conversation stopped on an
   * approval is not quiet, it is waiting, and the survey already says so.
   */
  async function waitForEdge(connection: NatsConnection, waitSeconds: number): Promise<Edge | null> {
    const subs = new Map<string, Subscription>();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    const approvalTimers = new Map<string, ReturnType<typeof setTimeout>>();
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
      for (const timer of approvalTimers.values()) clearTimeout(timer);
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

    // An approval is not an edge when it is raised, only when it is still there. So it
    // arms a timer the settlement cancels, and a tool call answered in seconds never
    // reaches anyone.
    const armApproval = (conv: string, approvalId: string, raisedAtMs: number): void => {
      const existing = approvalTimers.get(approvalId);
      if (existing !== undefined) clearTimeout(existing);
      const dueInMs = Math.max(0, raisedAtMs + approvalAfterMs - Date.now());
      const timer = setTimeout(() => {
        fire({
          conv,
          edge: "awaiting-approval",
          ts: new Date().toISOString(),
          approvalId,
          pendingForSeconds: Math.round((Date.now() - raisedAtMs) / 1000),
        });
      }, dueInMs);
      approvalTimers.set(approvalId, timer);
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

    // Approvals are keyed by their own id on their own tree, so they cannot be watched
    // per conversation the way changes can. One fleet-wide subscription, filtered by the
    // conversation the raise correlates to.
    const approvals = connection.subscribe("approval.v1.*.lifecycle");
    subs.set("approvals", approvals);
    void (async () => {
      try {
        for await (const m of approvals) {
          const approvalId = m.subject.split(".")[2];
          if (approvalId === undefined) continue;
          const body = jc.decode(m.data) as Lifecycle;
          if (body.type === "settled") {
            const timer = approvalTimers.get(approvalId);
            if (timer !== undefined) clearTimeout(timer);
            approvalTimers.delete(approvalId);
            continue;
          }
          const conv = body.correlation?.conversationId;
          if (body.type !== "raised" || conv === undefined || !convs.includes(conv)) continue;
          const raisedAt = body.ts === undefined ? Date.now() : Date.parse(body.ts);
          armApproval(conv, approvalId, Number.isNaN(raisedAt) ? Date.now() : raisedAt);
        }
      } catch {
        // Ends with the edge or the wait, same as the per-conversation loops.
      }
    })();

    await connection.flush();

    const seed = await survey();
    const alreadyIdle = seed.find((status) => status.state === "idle");
    if (alreadyIdle !== undefined) {
      // The transition has already happened; waiting for it again would wait for ever.
      fire({ conv: alreadyIdle.conv, edge: "idle", ts: alreadyIdle.lastQuery?.ts ?? new Date().toISOString() });
      return edge;
    }
    for (const status of seed) {
      // An approval already sitting when the wait begins is seeded from its raise, so one
      // that is past its patience fires straight away rather than after another full term.
      if (status.approval !== null) {
        const raisedAt = Date.parse(status.approval.raisedAt);
        armApproval(status.conv, status.approval.approvalId, Number.isNaN(raisedAt) ? Date.now() : raisedAt);
        continue;
      }
      if (status.state !== "working" || status.lastMessage === null) continue;
      const at = Date.parse(status.lastMessage.ts);
      armQuiet(status.conv, Number.isNaN(at) ? Date.now() : at);
    }
    deadline = setTimeout(() => fire(null), waitSeconds * 1000);
    process.stderr.write(
      `watching ${convs.length} conversation(s) for up to ${waitSeconds}s; quiet after ${quietAfterMs / 1000}s of silence, approvals after ${approvalAfterMs / 1000}s...\n`,
    );
    return edge;
  }

  if (input.wait === undefined) {
    process.stdout.write(`${JSON.stringify(await survey(), null, 2)}\n`);
  } else {
    const edge = await waitForEdge(nc, input.wait);
    process.stdout.write(`${JSON.stringify({ edge, status: await survey() }, null, 2)}\n`);
    if (edge === null) {
      process.stderr.write(`no conversation went idle or quiet within ${input.wait}s\n`);
      process.exitCode = 2;
    }
  }
} finally {
  await nc.drain();
}
