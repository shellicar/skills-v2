// Self-test for spawn.mts, run against loopback responders rather than a live world:
// this process answers the service request and the say itself, so no bridge is asked
// for anything, no agent is attached, and no brief reaches a worker. `requests.say`
// and `requests.service` are core NATS subjects captured by no stream, so nothing this
// sends persists anywhere.
//
// It writes to its own reporting-line bucket, never the one the fleet runs on:
// NATS_REPORTING_BUCKET, default `reporting-lines-selftest`, which spawn.mts reads too.
// A second bucket, that name plus `-tiny`, is created with a value size no line can
// fit in, which is how the "attached but no line" branch is forced.
//
// Brings up its own broker and can never reach the fleet's; see lib/test-broker.mts.
//
//   node test-spawn.mts
//
// Exits 0 when every case passes, 1 when any fails.

import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSONCodec } from "nats";
import { connectTestBroker } from "./lib/test-broker.mts";

const script = resolve(join(dirname(fileURLToPath(import.meta.url)), "spawn.mts"));

const WORLD = "spawn-selftest";
const CONV = "00000000-0000-4000-8000-000000000001";
const OWNER = "00000000-0000-4000-8000-0000000000ff";
const QUERY = "query-spawn-selftest";
const BUCKET = process.env.NATS_REPORTING_BUCKET ?? "reporting-lines-selftest";
const TINY_BUCKET = `${BUCKET}-tiny`;

type Say = { text?: string; from?: { conversationId?: string; name?: string } };

const jc = JSONCodec<unknown>();
const nc = await connectTestBroker();

let serviceAnswer: unknown = { accepted: true };
let lastSay: Say | null = null;

const serviceSub = nc.subscribe(`agent.v1.${WORLD}.requests.service`);
const saySub = nc.subscribe(`conv.v2.${CONV}.requests.say`);
void (async () => {
  for await (const m of serviceSub) m.respond(jc.encode(serviceAnswer));
})();
void (async () => {
  for await (const m of saySub) {
    lastSay = jc.decode(m.data) as Say;
    m.respond(jc.encode({ accepted: true, id: QUERY }));
  }
})();

const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  process.stdout.write(`${ok ? "ok  " : "FAIL"} ${name}${ok || !detail ? "" : ` — ${detail}`}\n`);
  if (!ok) failures.push(name);
};

// Awaited rather than spawnSync: this process answers the child's requests itself, and
// a synchronous child blocks the event loop that would serve them, so every spawn times
// out waiting for a servicer that is sitting right here.
const run = (input: unknown, bucket = BUCKET): Promise<{ status: number | null; stdout: string; stderr: string }> =>
  new Promise((done) => {
    const child = spawn(process.execPath, [script], {
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 20000,
      env: { ...process.env, NATS_REPORTING_BUCKET: bucket },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (status) => done({ status, stdout, stderr }));
    child.stdin.end(JSON.stringify(input));
  });

const brief = "spawn.mts self-test brief. No recipient: this say is answered by test-spawn.mts.";
const opener = "A word from the one commissioning this.";
const workerRole = "operator";

// Bad input: cwd is required, because a worker spawned into the wrong tree edits the
// wrong repo.
const missing = await run({ world: WORLD, owner: OWNER, name: "Selftest", opener, workerRole, message: brief });
check("missing cwd exits 64", missing.status === 64, `status=${missing.status}`);

// And an opener, because a brief nobody is speaking is one a worker has to guess at.
const unopened = await run({ world: WORLD, cwd: "/tmp", owner: OWNER, name: "Selftest", workerRole, message: brief });
check("missing opener exits 64", unopened.status === 64, `status=${unopened.status}`);

// And a workerRole, because it is what the brief turns into the list of skills to load.
const unroled = await run({ world: WORLD, cwd: "/tmp", owner: OWNER, name: "Selftest", opener, message: brief });
check("missing workerRole exits 64", unroled.status === 64, `status=${unroled.status}`);

// A role nobody has fails here rather than telling a worker to load a skill that does
// not exist.
const misroled = await run({ world: WORLD, cwd: "/tmp", owner: OWNER, name: "Selftest", opener, workerRole: "planner", message: brief });
check("an unknown workerRole exits 64", misroled.status === 64, `status=${misroled.status}`);
check("an unknown workerRole names the ones there are", misroled.stderr.includes("operator, gatekeeper"), misroled.stderr);

// A rejected service stops everything: no line, no brief.
serviceAnswer = { rejected: true, reason: "invalid_cwd" };
lastSay = null;
const rejected = await run({ world: WORLD, cwd: "/nowhere", owner: OWNER, name: "Selftest", opener, workerRole, message: brief, conv: CONV });
check("rejected service exits 1", rejected.status === 1, `status=${rejected.status}`);
check("rejected service prints the reason", rejected.stdout.includes("invalid_cwd"), rejected.stdout);
check("rejected service sends no brief", lastSay === null);

// No bridge at all is a different failure from a rejection, and must not be retried.
const nobody = await run({ world: "spawn-selftest-nobody", cwd: "/tmp", owner: OWNER, name: "Selftest", opener, workerRole, message: brief, wait: 1 });
check("unserved world exits 1", nobody.status === 1, `status=${nobody.status}`);
check("unserved world names the bridge", nobody.stderr.includes("no servicer replied"), nobody.stderr);

// A line that cannot be written is not a spawn that half worked: the conversation is
// served, so an agent is sitting in that worktree with nobody recorded as watching it.
// The brief must not go, and it must not read as success.
serviceAnswer = { accepted: true };
lastSay = null;
await nc.jetstream().views.kv(TINY_BUCKET, { maxValueSize: 8 });
const noLine = await run({ world: WORLD, cwd: "/tmp", owner: OWNER, name: "Selftest", opener, workerRole, message: brief, conv: CONV }, TINY_BUCKET);
check("an unwritable line exits 1", noLine.status === 1, `status=${noLine.status}`);
check("an unwritable line says the conversation is attached with none", noLine.stderr.includes("attached but has NO reporting line"), noLine.stderr);
check("an unwritable line sends no brief", lastSay === null, JSON.stringify(lastSay));

// The whole path.
serviceAnswer = { accepted: true };
lastSay = null;
const ok = await run({ world: WORLD, cwd: "/tmp", owner: OWNER, name: "Selftest", opener, callerRole: "handler", workerRole, message: brief, conv: CONV, model: "claude-opus-5" });
check("spawn exits 0", ok.status === 0, `status=${ok.status} stderr=${ok.stderr}`);

const lastLine = ok.stdout.trim().split("\n").at(-1) ?? "";
let result: { conversationId?: string; queryId?: string; owner?: string } = {};
try {
  result = JSON.parse(lastLine);
} catch {
  // Leave it empty: the checks below report the shape that actually came out.
}
check("result carries the conversation id", result.conversationId === CONV, lastLine);
check("result carries the query id", result.queryId === QUERY, lastLine);
check("result carries the owner", result.owner === OWNER, lastLine);

const sent: Say | null = lastSay;
check("the brief was sent", (sent?.text ?? "").includes(brief), JSON.stringify(sent));
check("the brief opens with the opener", sent?.text?.startsWith(opener) === true, JSON.stringify(sent?.text));
check("the brief names who commissioned it", (sent?.text ?? "").includes("Sent by Selftest, handler"), JSON.stringify(sent?.text));
check("the brief names the skills the worker's role loads", (sent?.text ?? "").includes("Load these skills: workflow, workflow-commissionee, operator."), JSON.stringify(sent?.text));
check("the brief tells the worker its own conversation id", (sent?.text ?? "").includes(CONV), "the conversation id is missing");
check("the brief carries no return address", !(sent?.text ?? "").includes(OWNER), sent?.text ?? "");
check("the say is attributable to the owner", sent?.from?.conversationId === OWNER, JSON.stringify(sent?.from));

const kv = await nc.jetstream().views.kv(BUCKET);
const entry = await kv.get(CONV);
const line = entry === null ? null : entry.json<{ owner?: string; ts?: string }>();
check("the reporting line points at the owner", line?.owner === OWNER, JSON.stringify(line));
check("the reporting line is timestamped", typeof line?.ts === "string" && !Number.isNaN(Date.parse(line.ts ?? "")), JSON.stringify(line));
check("the reporting line holds nothing else", line !== null && Object.keys(line).sort().join(",") === "owner,ts", JSON.stringify(line));

serviceSub.unsubscribe();
saySub.unsubscribe();
await nc.drain();

process.stdout.write(failures.length === 0 ? "\nall passed\n" : `\n${failures.length} failed: ${failures.join(", ")}\n`);
process.exit(failures.length === 0 ? 0 : 1);
