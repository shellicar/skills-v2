// The broker the tests run against, and never the fleet's. The url is fixed rather than
// configurable, so there is no environment a test could inherit that aims it at 4222,
// and this brings the container up itself so running a test stays one command.

import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type NatsConnection, connect } from "nats";

const URL = "nats://127.0.0.1:31415";
const STREAM = "conv-approval";
const COMPOSE = resolve(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "compose.yml"));

// The fleet stream's own subjects, read off `nats stream info conv-approval`, so a test
// exercises the same routing the real one has.
const SUBJECTS = [
  "conv.v1.*.changes",
  "conv.v2.*.changes.>",
  "conv.v2.*.attachment.>",
  "approval.v1.*.lifecycle",
  "conv.v2.*.telemetry.usage",
];

export async function connectTestBroker(): Promise<NatsConnection> {
  start();
  // The tools under test read these, and so do the children a test spawns.
  process.env.NATS_URL = URL;
  process.env.NATS_STREAM = STREAM;

  const nc = await connectWhenReady();
  const jsm = await nc.jetstreamManager();
  try {
    await jsm.streams.info(STREAM);
  } catch {
    await jsm.streams.add({ name: STREAM, subjects: SUBJECTS });
  }
  return nc;
}

// `up -d` on a container already running is a no-op, so every test can call this.
function start(): void {
  const done = spawnSync("docker", ["compose", "-f", COMPOSE, "up", "-d"], { encoding: "utf8" });
  if (done.status !== 0) {
    process.stderr.write(`the test broker would not start\n${done.stderr ?? ""}${done.stdout ?? ""}`);
    process.exit(1);
  }
  // What this brought up, it takes away, on every path out including a test that throws.
  // Sync because an exit handler cannot await, and SIGINT is routed through exit so an
  // interrupted run cleans up too.
  process.on("exit", stop);
  process.on("SIGINT", () => process.exit(130));
}

// Scoped to this compose project by name, so it reaches the broker this file defines and
// can reach nothing else on the machine.
function stop(): void {
  const done = spawnSync("docker", ["compose", "-f", COMPOSE, "down"], { encoding: "utf8" });
  if (done.status !== 0) process.stderr.write(`the test broker would not stop\n${done.stderr ?? ""}`);
}

// The container answers a moment after compose returns, so the first connect can lose a
// race that has nothing wrong with it.
async function connectWhenReady(): Promise<NatsConnection> {
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      return await connect({ servers: URL });
    } catch (err) {
      if (Date.now() > deadline) throw err;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}
