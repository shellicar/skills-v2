// Self-test for sendMessage.mts and the lib/say.mts publish underneath it, run against
// loopback responders: this process answers every say itself, so no bridge is asked for
// anything, no agent is attached and no message reaches a real conversation.
//
// The conversation ids are fixed self-test uuids and each case owns one, so a case never
// reads another's leftovers. The follow cases publish `changes.message` and
// `changes.query` events, and those the stream does capture, for check-status.mts's
// reason: the stream owns `conv.v2.*.changes.>` and JetStream refuses a second stream
// overlapping it, so there is nowhere else to put them. They are inert, and fixed ids
// keep the residue to a constant handful of subjects. `requests.say` is captured by no
// stream, so the says themselves persist nowhere.
//
// What it is really pinning: the appended conversation id. It is the only thing that
// tells a worker which conversation it is in, and a worker that does not know cannot be
// commissioned properly, so it is worth a test that reads what actually went on the wire.
//
// Needs a broker (NATS_URL, default nats://127.0.0.1:4222) and the stream (NATS_STREAM,
// default conv-approval).
//
//   node check-send.mts
//
// Exits 0 when every case passes, 1 when any fails.

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSONCodec, type Subscription, connect } from "nats";

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const script = resolve(join(dirname(fileURLToPath(import.meta.url)), "sendMessage.mts"));

const FROM = "00000000-0000-4000-8000-00000000c0ff";
const NAME = "Selftest";
const ROLE = "handler";
// Deliberately does not carry the cast name: an opener is a voice, not a form, and the
// script must not check one against the other.
const OPENER = "A word from the one who commissioned this.";
const CONV = {
  accepted: "00000000-0000-4000-8000-00000000c001",
  rejected: "00000000-0000-4000-8000-00000000c002",
  unserved: "00000000-0000-4000-8000-00000000c003",
  completed: "00000000-0000-4000-8000-00000000c004",
  aborted: "00000000-0000-4000-8000-00000000c005",
  elapses: "00000000-0000-4000-8000-00000000c006",
  anchored: "00000000-0000-4000-8000-00000000c007",
};

type Say = { text?: string; from?: { conversationId?: string; name?: string }; precondition?: { tip?: string | null } };
type Answer = { accepted?: boolean; id?: string; rejected?: boolean; reason?: string };

const jc = JSONCodec<unknown>();
const nc = await connect({ servers: url });
const js = nc.jetstream();

const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  process.stdout.write(`${ok ? "ok  " : "FAIL"} ${name}${ok || !detail ? "" : ` — ${detail}`}\n`);
  if (!ok) failures.push(name);
};

const seen = new Map<string, Say>();
const subs: Subscription[] = [];

/** Answer says on one conversation, recording each, and optionally act once one lands. */
const serve = (conv: string, answer: Answer, onSay?: (queryId: string) => Promise<void>): void => {
  const sub = nc.subscribe(`conv.v2.${conv}.requests.say`);
  subs.push(sub);
  const respond = async (): Promise<void> => {
    try {
      for await (const m of sub) {
        seen.set(conv, jc.decode(m.data) as Say);
        m.respond(jc.encode(answer));
        if (onSay !== undefined) await onSay(answer.id ?? "");
      }
    } catch {
      // The subscription ends at teardown, which is the normal way out of the loop.
    }
  };
  void respond();
};

const commit = async (conv: string, queryId: string, text: string): Promise<string> => {
  const id = randomUUID();
  const body = { id, queryId, role: "assistant", ts: new Date().toISOString(), content: [{ type: "text", text }] };
  await js.publish(`conv.v2.${conv}.changes.message`, jc.encode(body));
  return id;
};

const closeQuery = async (conv: string, queryId: string, reason: string): Promise<void> => {
  const body = { queryId, reason, ts: new Date().toISOString() };
  await js.publish(`conv.v2.${conv}.changes.query`, jc.encode(body));
};

// Awaited rather than spawnSync, for check-spawn.mts's reason: this process answers the
// child's own requests, and a synchronous child blocks the event loop that would answer
// them, so every say times out on a responder sitting right here.
const run = (input: unknown): Promise<{ status: number | null; stdout: string; stderr: string }> =>
  new Promise((done) => {
    const child = spawn(process.execPath, [script], { stdio: ["pipe", "pipe", "pipe"], timeout: 20000 });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (status) => done({ status, stdout, stderr }));
    child.stdin.end(JSON.stringify(input));
  });

const message = "check-send.mts self-test message. No recipient: this say is answered by check-send.mts.";

// `from` and `name` are what make a say attributable, and `opener` is what makes it
// spoken by somebody, so none of the three is optional.
const anonymous = await run({ conv: CONV.accepted, name: NAME, opener: OPENER, message, noWait: true });
check("a say with no sender exits 64", anonymous.status === 64, `status=${anonymous.status}`);
const unnamed = await run({ conv: CONV.accepted, from: FROM, opener: OPENER, message, noWait: true });
check("a say with no name exits 64", unnamed.status === 64, `status=${unnamed.status}`);
const unopened = await run({ conv: CONV.accepted, from: FROM, name: NAME, message, noWait: true });
check("a say with no opener exits 64", unopened.status === 64, `status=${unopened.status}`);

// The whole point of the tool, and what the wire actually carries.
serve(CONV.accepted, { accepted: true, id: "query-accepted" });
const sent = await run({ conv: CONV.accepted, from: FROM, name: NAME, role: ROLE, opener: OPENER, message, noWait: true });
check("a dispatch exits 0", sent.status === 0, `status=${sent.status} stderr=${sent.stderr}`);
check("a dispatch prints the query id", sent.stdout.includes("query-accepted"), sent.stdout);

const wire = seen.get(CONV.accepted);
check("the opener is at the top", wire?.text?.startsWith(OPENER) === true, JSON.stringify(wire?.text));
check("the message follows the opener unaltered", (wire?.text ?? "").includes(`${OPENER}\n\n${message}`), JSON.stringify(wire?.text));
check("an opener that does not name the sender is still accepted", sent.status === 0 && !OPENER.includes(NAME), `opener=${OPENER}`);
check("the appendix names the sender", (wire?.text ?? "").includes(`Sent by ${NAME}`), JSON.stringify(wire?.text));
check("the appendix carries the sender's role", (wire?.text ?? "").includes(`Sent by ${NAME}, ${ROLE}`), JSON.stringify(wire?.text));
check("the recipient is told its own conversation id", (wire?.text ?? "").includes(CONV.accepted), JSON.stringify(wire?.text));
// Only a commission makes crew true of the recipient, and only spawn.mts commissions.
check("a say does not point the recipient at crew", !(wire?.text ?? "").includes("crew"), JSON.stringify(wire?.text));
check("the recipient is given no route back", !(wire?.text ?? "").includes(FROM), JSON.stringify(wire?.text));
check("the say is attributable to the sender", wire?.from?.conversationId === FROM, JSON.stringify(wire?.from));
check("the say carries the sender's name", wire?.from?.name === NAME, JSON.stringify(wire?.from));

// A say is anchored to the tip it was written against, which is what makes a say written
// while someone else was speaking a rejection rather than a message applied out of order.
const tip = await commit(CONV.anchored, "query-anchored", "check-send: the tip");
serve(CONV.anchored, { accepted: true, id: "query-anchored" });
await run({ conv: CONV.anchored, from: FROM, name: NAME, opener: OPENER, message, noWait: true });
check("the say is anchored to the current tip", seen.get(CONV.anchored)?.precondition?.tip === tip, JSON.stringify(seen.get(CONV.anchored)?.precondition));

// A rejection is someone else having spoken first, and it must not read as sent.
serve(CONV.rejected, { rejected: true, reason: "stale_tip" });
const rejected = await run({ conv: CONV.rejected, from: FROM, name: NAME, opener: OPENER, message, noWait: true });
check("a rejected say exits 1", rejected.status === 1, `status=${rejected.status}`);
check("a rejected say prints the reason", rejected.stderr.includes("stale_tip"), rejected.stderr);

// Nobody answering means no agent is attached to that conversation, which service.mts
// fixes; it is not a broker problem, so it has to read differently from a rejection.
const unserved = await run({ conv: CONV.unserved, from: FROM, name: NAME, opener: OPENER, message, noWait: true });
check("an unserved conversation exits 1", unserved.status === 1, `status=${unserved.status}`);
check("an unserved conversation names the missing agent", unserved.stderr.includes("no servicer replied"), unserved.stderr);

// Following: the answer is the query closing, and only `completed` is a real one.
serve(CONV.completed, { accepted: true, id: "query-completed" }, async (queryId) => {
  await commit(CONV.completed, queryId, "check-send: the answer");
  await closeQuery(CONV.completed, queryId, "completed");
});
const followed = await run({ conv: CONV.completed, from: FROM, name: NAME, opener: OPENER, message, wait: 10 });
check("a completed query exits 0", followed.status === 0, `status=${followed.status} stderr=${followed.stderr}`);
check("a followed say prints the committed answer", followed.stdout.includes("check-send: the answer"), followed.stdout);
check("a followed say prints the close reason", followed.stdout.includes("closed: completed"), followed.stdout);

serve(CONV.aborted, { accepted: true, id: "query-aborted" }, async (queryId) => {
  await closeQuery(CONV.aborted, queryId, "aborted");
});
const aborted = await run({ conv: CONV.aborted, from: FROM, name: NAME, opener: OPENER, message, wait: 10 });
check("an aborted query exits 1", aborted.status === 1, `status=${aborted.status}`);
check("an aborted query says so", aborted.stdout.includes("closed: aborted"), aborted.stdout);

// The wait elapsing is not a verdict: the query is still running and is read later.
serve(CONV.elapses, { accepted: true, id: "query-elapses" });
const elapsed = await run({ conv: CONV.elapses, from: FROM, name: NAME, opener: OPENER, message, wait: 1 });
check("an elapsed wait exits 2", elapsed.status === 2, `status=${elapsed.status}`);
check("an elapsed wait says the query is still running", elapsed.stderr.includes("timed out"), elapsed.stderr);

for (const sub of subs) sub.unsubscribe();
await nc.drain();

process.stdout.write(failures.length === 0 ? "\nall passed\n" : `\n${failures.length} failed: ${failures.join(", ")}\n`);
process.exit(failures.length === 0 ? 0 : 1);
