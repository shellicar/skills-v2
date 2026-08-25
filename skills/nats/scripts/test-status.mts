// Self-test for status.mts, driving real conversations from this process: it publishes
// the change events a live conversation would publish, so no bridge is asked for
// anything, no agent is attached and no worker is involved.
//
// The conversation ids below are fixed rather than minted per run, and every case
// publishes whatever it depends on, so a previous run's leftovers cannot change a
// verdict.
//
// Brings up its own broker and can never reach the fleet's; see lib/test-broker.mts.
//
//   node test-status.mts
//
// Exits 0 when every case passes, 1 when any fails.

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSONCodec } from "nats";
import { connectTestBroker } from "./lib/test-broker.mts";

const script = resolve(join(dirname(fileURLToPath(import.meta.url)), "status.mts"));

const CONV = {
  reportIdle: "00000000-0000-4000-8000-00000000a001",
  reportWorking: "00000000-0000-4000-8000-00000000a002",
  seededIdle: "00000000-0000-4000-8000-00000000a003",
  goesIdle: "00000000-0000-4000-8000-00000000a004",
  staysWorking: "00000000-0000-4000-8000-00000000a005",
  goesQuiet: "00000000-0000-4000-8000-00000000a006",
  keepsTalking: "00000000-0000-4000-8000-00000000a007",
  approvalSits: "00000000-0000-4000-8000-00000000a008",
  approvalAnswered: "00000000-0000-4000-8000-00000000a009",
  approvalSeeded: "00000000-0000-4000-8000-00000000a00a",
  // Published to by nothing, ever: it is the conversation on which no edge can fire.
  untouched: "00000000-0000-4000-8000-00000000a0ff",
};

type Edge = { conv?: string; edge?: string; ts?: string; silentForSeconds?: number; approvalId?: string; pendingForSeconds?: number };
type Status = { conv?: string; state?: string };
type Waited = { edge?: Edge | null; status?: Status[] };

const jc = JSONCodec<unknown>();
const nc = await connectTestBroker();
const js = nc.jetstream();

const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  process.stdout.write(`${ok ? "ok  " : "FAIL"} ${name}${ok || !detail ? "" : ` — ${detail}`}\n`);
  if (!ok) failures.push(name);
};

const sleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

const commit = async (conv: string, text: string): Promise<void> => {
  const body = { id: randomUUID(), role: "assistant", ts: new Date().toISOString(), content: [{ type: "text", text }] };
  await js.publish(`conv.v2.${conv}.changes.message`, jc.encode(body));
};

const closeQuery = async (conv: string): Promise<void> => {
  const body = { queryId: randomUUID(), reason: "completed", ts: new Date().toISOString() };
  await js.publish(`conv.v2.${conv}.changes.query`, jc.encode(body));
};

// The approval id is its own, minted by the agent's model, and only the correlation ties
// it back to a conversation — which is exactly why the script cannot find one by
// constructing a subject from a tool-use id.
const raiseApproval = async (conv: string, approvalId: string): Promise<void> => {
  const body = {
    type: "raised",
    ts: new Date().toISOString(),
    ask: { type: "tool_use", name: "Delete", input: {} },
    correlation: { conversationId: conv, toolUseId: randomUUID() },
  };
  await js.publish(`approval.v1.${approvalId}.lifecycle`, jc.encode(body));
};

const settleApproval = async (approvalId: string): Promise<void> => {
  const body = { type: "settled", ts: new Date().toISOString(), approved: true, by: { kind: "human" } };
  await js.publish(`approval.v1.${approvalId}.lifecycle`, jc.encode(body));
};

type Result = { status: number | null; stdout: string; stderr: string; elapsedMs: number };
type Run = { result: Promise<Result>; watching: Promise<void> };

// Awaited rather than spawnSync, for test-spawn.mts's reason: this process publishes
// the events the child is waiting on, and a synchronous child blocks the event loop
// that would publish them, so every wait times out on edges sitting right here.
const run = (input: unknown): Run => {
  const startedAt = Date.now();
  const child = spawn(process.execPath, [script], { stdio: ["pipe", "pipe", "pipe"], timeout: 30000 });
  let stdout = "";
  let stderr = "";
  let onWatching!: () => void;
  const watching = new Promise<void>((done) => {
    onWatching = done;
  });
  child.stdout.on("data", (d) => (stdout += d));
  child.stderr.on("data", (d) => {
    stderr += d;
    // Printed once the child is subscribed and seeded, so anything published after it
    // is an edge that arrives live rather than one the seed already held.
    if (stderr.includes("watching ")) onWatching();
  });
  const result = new Promise<Result>((done) => {
    child.on("close", (status) => {
      onWatching();
      done({ status, stdout, stderr, elapsedMs: Date.now() - startedAt });
    });
  });
  child.stdin.end(JSON.stringify(input));
  return { result, watching };
};

const parse = <T>(stdout: string): T | null => {
  try {
    return JSON.parse(stdout) as T;
  } catch {
    return null;
  }
};

// Without `wait`, nothing changes: the report is the bare array it has always been.
await commit(CONV.reportIdle, "test-status: a turn that finished");
await closeQuery(CONV.reportIdle);
await commit(CONV.reportWorking, "test-status: a turn in progress");
const plain = await run({ convs: [CONV.reportIdle, CONV.reportWorking, CONV.untouched] }).result;
check("without wait it exits 0", plain.status === 0, `status=${plain.status} stderr=${plain.stderr}`);
const report = parse<Status[]>(plain.stdout);
check("without wait the report is a bare array", Array.isArray(report), plain.stdout.slice(0, 200));
check("a closed query reads idle", report?.[0]?.state === "idle", JSON.stringify(report?.[0]));
check("a message after the last close reads working", report?.[1]?.state === "working", JSON.stringify(report?.[1]));
check("a conversation never spoken into reads empty", report?.[2]?.state === "empty", JSON.stringify(report?.[2]));

// Already idle: the transition has happened, so waiting for it again would wait for ever.
await commit(CONV.seededIdle, "test-status: finished before the wait began");
await closeQuery(CONV.seededIdle);
const seeded = await run({ convs: [CONV.seededIdle], wait: 10 }).result;
const seededOut = parse<Waited>(seeded.stdout);
check("an already idle conversation exits 0", seeded.status === 0, `status=${seeded.status} stderr=${seeded.stderr}`);
check("an already idle conversation reports the idle edge", seededOut?.edge?.edge === "idle", JSON.stringify(seededOut?.edge));
check("an already idle conversation names itself", seededOut?.edge?.conv === CONV.seededIdle, JSON.stringify(seededOut?.edge));
check("an already idle conversation returns without waiting", seeded.elapsedMs < 3000, `${seeded.elapsedMs}ms of a 10s wait`);
check("the wait shape carries the status of every conversation", seededOut?.status?.length === 1, JSON.stringify(seededOut?.status));

// A query closing while the wait is running is the edge a handler is actually waiting for.
await commit(CONV.goesIdle, "test-status: about to finish");
await commit(CONV.staysWorking, "test-status: still going");
const live = run({ convs: [CONV.goesIdle, CONV.staysWorking], wait: 20 });
await live.watching;
await closeQuery(CONV.goesIdle);
const liveOut = await live.result;
const liveEdge = parse<Waited>(liveOut.stdout)?.edge;
check("a query closing during the wait exits 0", liveOut.status === 0, `status=${liveOut.status} stderr=${liveOut.stderr}`);
check("a query closing during the wait fires idle", liveEdge?.edge === "idle", JSON.stringify(liveEdge));
check("the edge names the conversation that finished", liveEdge?.conv === CONV.goesIdle, JSON.stringify(liveEdge));

// The case that matters: a worker that died mid-turn reads `working` for ever and never
// closes a query, so only the timer can end the wait.
await commit(CONV.goesQuiet, "test-status: the last thing it ever said");
const quiet = await run({ convs: [CONV.goesQuiet], wait: 20, quietAfter: 1 }).result;
const quietEdge = parse<Waited>(quiet.stdout)?.edge;
check("silence past quietAfter exits 0", quiet.status === 0, `status=${quiet.status} stderr=${quiet.stderr}`);
check("silence past quietAfter fires quiet", quietEdge?.edge === "quiet", JSON.stringify(quietEdge));
check("the quiet edge names the silent conversation", quietEdge?.conv === CONV.goesQuiet, JSON.stringify(quietEdge));
check("the quiet edge says how long it has been silent", typeof quietEdge?.silentForSeconds === "number", JSON.stringify(quietEdge));

// A conversation still committing is not quiet, however long the wait runs: each commit
// restarts the clock, so the edge lands quietAfter after the LAST one.
await commit(CONV.keepsTalking, "test-status: first of two");
const firstCommitAt = Date.now();
const talking = run({ convs: [CONV.keepsTalking], wait: 20, quietAfter: 3 });
await talking.watching;
await sleep(Math.max(0, firstCommitAt + 1000 - Date.now()));
await commit(CONV.keepsTalking, "test-status: second of two");
const talkingOut = await talking.result;
const talkingEdge = parse<Waited>(talkingOut.stdout)?.edge;
const firedAfterMs = Date.now() - firstCommitAt;
check("a conversation still committing eventually fires quiet", talkingEdge?.edge === "quiet", JSON.stringify(talkingEdge));
check("a commit restarts the quiet clock", firedAfterMs >= 3600, `fired ${firedAfterMs}ms after the first commit, quietAfter=3s`);

// An approval that sits is the state this tool was blind to: the turn never closes, so
// idle cannot fire, and the conversation is not silent by its own reckoning either.
await commit(CONV.approvalSits, "test-status: about to ask permission");
const sittingId = randomUUID();
const sitting = run({ convs: [CONV.approvalSits], wait: 20, quietAfter: 30, approvalAfter: 1 });
await sitting.watching;
await raiseApproval(CONV.approvalSits, sittingId);
const sittingOut = await sitting.result;
const sittingEdge = parse<Waited>(sittingOut.stdout)?.edge;
check("an approval past approvalAfter exits 0", sittingOut.status === 0, `status=${sittingOut.status} stderr=${sittingOut.stderr}`);
check("an approval past approvalAfter fires awaiting-approval", sittingEdge?.edge === "awaiting-approval", JSON.stringify(sittingEdge));
check("the approval edge names the conversation", sittingEdge?.conv === CONV.approvalSits, JSON.stringify(sittingEdge));
check("the approval edge names the approval", sittingEdge?.approvalId === sittingId, JSON.stringify(sittingEdge));
check("the approval edge says how long it has been pending", typeof sittingEdge?.pendingForSeconds === "number", JSON.stringify(sittingEdge));

// A raise is not an edge. One answered inside approvalAfter must reach nobody, or every
// routine tool call wakes the handler and the tool stops being worth calling.
await commit(CONV.approvalAnswered, "test-status: asks and is answered");
const answeredId = randomUUID();
const answered = run({ convs: [CONV.approvalAnswered], wait: 4, quietAfter: 30, approvalAfter: 3 });
await answered.watching;
await raiseApproval(CONV.approvalAnswered, answeredId);
await sleep(500);
await settleApproval(answeredId);
const answeredOut = await answered.result;
const answeredEdge = parse<Waited>(answeredOut.stdout)?.edge;
check("an approval answered inside approvalAfter fires nothing", answeredEdge === null, JSON.stringify(answeredEdge));
check("an approval answered inside approvalAfter elapses the wait", answeredOut.status === 2, `status=${answeredOut.status}`);

// One already sitting when the wait begins is seeded from its raise, so it does not get
// another full term of patience it has already served.
await commit(CONV.approvalSeeded, "test-status: already stopped before anyone looked");
const seededId = randomUUID();
await raiseApproval(CONV.approvalSeeded, seededId);
await sleep(1200);
const preSeeded = await run({ convs: [CONV.approvalSeeded], wait: 20, quietAfter: 30, approvalAfter: 1 }).result;
const preSeededEdge = parse<Waited>(preSeeded.stdout)?.edge;
check("an approval already sitting fires awaiting-approval", preSeededEdge?.edge === "awaiting-approval", JSON.stringify(preSeededEdge));
check("an approval already sitting fires without waiting again", preSeeded.elapsedMs < 3000, `${preSeeded.elapsedMs}ms of a 20s wait`);

// The wait elapsing is not a verdict: nothing has finished, and 2 says so.
const elapsed = await run({ convs: [CONV.untouched], wait: 1 }).result;
const elapsedOut = parse<Waited>(elapsed.stdout);
check("an elapsed wait exits 2", elapsed.status === 2, `status=${elapsed.status} stderr=${elapsed.stderr}`);
check("an elapsed wait reports no edge", elapsedOut?.edge === null, JSON.stringify(elapsedOut?.edge));
check("an elapsed wait still reports the status", elapsedOut?.status?.length === 1, JSON.stringify(elapsedOut?.status));

const badWait = await run({ convs: [CONV.untouched], wait: "soon" }).result;
check("a non-numeric wait exits 64", badWait.status === 64, `status=${badWait.status}`);
const badQuiet = await run({ convs: [CONV.untouched], wait: 1, quietAfter: 0 }).result;
check("a quietAfter of zero exits 64", badQuiet.status === 64, `status=${badQuiet.status}`);
const badApproval = await run({ convs: [CONV.untouched], wait: 1, approvalAfter: -1 }).result;
check("a negative approvalAfter exits 64", badApproval.status === 64, `status=${badApproval.status}`);

await nc.drain();

process.stdout.write(failures.length === 0 ? "\nall passed\n" : `\n${failures.length} failed: ${failures.join(", ")}\n`);
process.exit(failures.length === 0 ? 0 : 1);
