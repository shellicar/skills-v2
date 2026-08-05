// Self-test for spawn.mts, run against loopback responders rather than a live world:
// this process answers the service request and the say itself, so no bridge is asked
// for anything, no agent is attached, and no brief reaches a worker. `requests.say`
// and `requests.service` are core NATS subjects captured by no stream, so the only
// thing this leaves behind is the reporting line it writes, always on the same fixed
// test conversation id so repeated runs overwrite rather than accumulate.
//
// Needs a broker (NATS_URL, default nats://127.0.0.1:4222) and nothing else.
//
//   node check-spawn.mts
//
// Exits 0 when every case passes, 1 when any fails.

import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSONCodec, connect } from "nats";

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const script = resolve(join(dirname(fileURLToPath(import.meta.url)), "spawn.mts"));

const WORLD = "spawn-selftest";
const CONV = "00000000-0000-4000-8000-000000000001";
const OWNER = "00000000-0000-4000-8000-0000000000ff";
const QUERY = "query-spawn-selftest";
const BUCKET = "reporting-lines";

type Say = { text?: string; from?: { conversationId?: string; name?: string } };

const jc = JSONCodec<unknown>();
const nc = await connect({ servers: url });

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

const brief = "spawn.mts self-test brief. No recipient: this say is answered by check-spawn.mts.";

// Bad input: cwd is required, because a worker spawned into the wrong tree edits the
// wrong repo.
const missing = await run({ world: WORLD, owner: OWNER, name: "Selftest", message: brief });
check("missing cwd exits 64", missing.status === 64, `status=${missing.status}`);

// A rejected service stops everything: no line, no brief.
serviceAnswer = { rejected: true, reason: "invalid_cwd" };
lastSay = null;
const rejected = await run({ world: WORLD, cwd: "/nowhere", owner: OWNER, name: "Selftest", message: brief, conv: CONV });
check("rejected service exits 1", rejected.status === 1, `status=${rejected.status}`);
check("rejected service prints the reason", rejected.stdout.includes("invalid_cwd"), rejected.stdout);
check("rejected service sends no brief", lastSay === null);

// No bridge at all is a different failure from a rejection, and must not be retried.
const nobody = await run({ world: "spawn-selftest-nobody", cwd: "/tmp", owner: OWNER, name: "Selftest", message: brief, wait: 1 });
check("unserved world exits 1", nobody.status === 1, `status=${nobody.status}`);
check("unserved world names the bridge", nobody.stderr.includes("no servicer replied"), nobody.stderr);

// The whole path.
serviceAnswer = { accepted: true };
lastSay = null;
const ok = await run({ world: WORLD, cwd: "/tmp", owner: OWNER, name: "Selftest", message: brief, conv: CONV, model: "claude-opus-5" });
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
check("the brief was sent", sent?.text?.startsWith(brief) === true, JSON.stringify(sent));
check("the brief carries reply instructions", (sent?.text ?? "").includes(OWNER), "the return address is missing");
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
