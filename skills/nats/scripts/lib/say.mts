// Publishing a `say` into a conversation, and optionally following the query it
// opens. Shared by sendMessage.mts and replyToMessage.mts, which differ in
// authorisation and defaults rather than in mechanism: both publish the same
// request.
//
// `from` is the sender's own conversation uuid, and `name` is the cast name it gave
// itself. Both are required. They land on the wire as
// `from: { kind: "agent", conversationId, name }` so a say is always attributable:
// an unattributed message is indistinguishable from the human's own, a reply has
// no sender to route back to, and a transcript of several agents cannot be read
// apart. Nothing tells a conversation its own id automatically, so whoever mints
// one (service.mts's caller) has to pass it on.
//
// The say is anchored to the conversation's current tip, so a message written
// while someone else was speaking is rejected rather than applied out of order.
//
// NATS_URL and NATS_STREAM override the defaults below.

import { JSONCodec, connect } from "nats";

type Block = { type?: string; text?: string; name?: string; input?: unknown };
type Message = { type?: string; id?: string; role?: string; ts?: string; content?: Block[] };
type Ack = { accepted?: boolean; id?: string; rejected?: boolean; reason?: string };
type Change = Message & { queryId?: string; reason?: string };

export type Say = {
  conv: string;
  from: string;
  name: string;
  message: string;
  /** Who is speaking, placed above the message. Required on an original message. */
  opener?: string;
  /** The sender's role, rendered in the appendix beside its name when given. */
  role?: string;
  /** This say commissions the recipient, so the appendix points it at `crew`. */
  commission?: boolean;
  /** Follow the change stream until the query closes, printing what lands. */
  follow: boolean;
  /** Seconds to follow for. Ignored unless `follow` is set. */
  waitSeconds: number;
  /** Append the appendix. Always on for an original message. */
  withAppendix: boolean;
};

/**
 * Who sent this, and which conversation the recipient is in. Nothing else tells it
 * either fact: the bridge no more hands an agent its conversation id than it hands it
 * its working directory, so the sender is the only one who can. Rendered rather than
 * hand-written, because every hand-written copy went stale the moment the scripts
 * changed shape.
 *
 * There is no route back in it. A recipient does not write to its sender: it answers in
 * its own conversation, and whoever commissioned it reads the answer where it sits.
 *
 * A commission adds a pointer to `crew`, and a pointer is all it adds. Injected text
 * never learns that it moved, where a skill loaded through the skill system is notified
 * when it changes, so a copy of the shape here would leave a long-running worker holding
 * a stale one with no way to find out.
 */
function appendix(input: Say): string {
  const sender = input.role === undefined ? input.name : `${input.name}, ${input.role}`;
  const lines = ["", "\u2500\u2500", `Sent by ${sender}.`, `Your own conversation id is ${input.conv}.`];
  if (input.commission === true) lines.push("You have been commissioned: load the `crew` skill.");
  return lines.join("\n");
}

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const stream = process.env.NATS_STREAM ?? "conv-approval";

/**
 * Owns the process outcome as well as the publish: every caller wants the same exit
 * codes on the failure paths. It returns the accepted query id rather than exiting on
 * success, because spawn.mts has more to do after the say lands.
 */
export async function publishSay(input: Say): Promise<string | undefined> {
  const waitMs = input.waitSeconds * 1000;
  const tipSubject = `conv.v2.${input.conv}.changes.message`;
  const watchSubject = `conv.v2.${input.conv}.changes.>`;
  const saySubject = `conv.v2.${input.conv}.requests.say`;

  const nc = await connect({ servers: url });
  const jc = JSONCodec<unknown>();
  try {
    const jsm = await nc.jetstreamManager();

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

    const body = input.opener === undefined ? input.message : `${input.opener}\n\n${input.message}`;
    const say = {
      ts: new Date().toISOString(),
      from: { kind: "agent", conversationId: input.from, name: input.name },
      text: input.withAppendix ? body + appendix(input) : body,
      precondition: { tip },
    };
    process.stderr.write(`[debug] saySubject=${saySubject} watchSubject=${watchSubject} tip=${tip}\n`);
    let ack: Ack;
    try {
      const reply = await nc.request(saySubject, jc.encode(say), { timeout: 5000 });
      ack = jc.decode(reply.data) as Ack;
    } catch (err) {
      process.stderr.write(`[debug] request error: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
      process.stderr.write("no servicer replied to the say (is an agent attached to this conversation?)\n");
      await nc.drain();
      process.exit(1);
    }
    if (!ack?.accepted) {
      process.stderr.write(`say rejected: ${ack?.reason ?? "unknown"}\n`);
      await nc.drain();
      process.exit(1);
    }

    const queryId = ack.id;
    if (!input.follow) {
      // The say landed, which is all the caller wanted to know. The query runs
      // on server-side regardless — read.mts picks it up later.
      process.stdout.write(`query ${queryId} accepted\n`);
      return queryId;
    }
    process.stderr.write(`query ${queryId} accepted; waiting up to ${input.waitSeconds}s for it to close...\n`);

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
    return queryId;
  } finally {
    await nc.drain();
  }
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
