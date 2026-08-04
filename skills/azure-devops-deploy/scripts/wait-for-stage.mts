// Poll a build (or one named stage within it) until it reaches a terminal state, or a
// timeout elapses. Azure DevOps has no blocking "watch" API — this is the polling loop
// so callers don't hand-roll sleep/recheck each time.
//
// Exits 0 when the target reaches result "succeeded". Exits 1 for any other terminal
// result (failed, cancelled, skipped). Exits 2 on timeout — the target never reached a
// terminal state in time; this is not a failure verdict, just "still not there yet".
//
// echo '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","buildId":76705}' | node wait-for-stage.mts
// echo '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","buildId":76705,"stage":"Release to Prd","timeoutMs":300000,"pollIntervalMs":10000}' | node wait-for-stage.mts

import { execFileSync } from "node:child_process";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";

const RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";
const DEFAULT_TIMEOUT_MS = 300_000;
const DEFAULT_POLL_INTERVAL_MS = 10_000;

const { org, project, buildId, stage, timeoutMs, pollIntervalMs } = readStdin<{ org?: string; project?: string; buildId?: number; stage?: string; timeoutMs?: number; pollIntervalMs?: number }>('{"org":"...","project":"...","buildId":123,"stage":"optional stage name","timeoutMs":300000,"pollIntervalMs":10000}');
if (!org || !project || !buildId) {
  console.error("input needs { org, project, buildId }");
  process.exit(EXIT_BAD_INPUT);
}

const timeout = typeof timeoutMs === "number" ? timeoutMs : DEFAULT_TIMEOUT_MS;
const interval = typeof pollIntervalMs === "number" ? pollIntervalMs : DEFAULT_POLL_INTERVAL_MS;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function restGet(url: string) {
  return JSON.parse(execFileSync("az", ["rest", "--method", "GET", "--url", url, "--resource", RESOURCE, "--output", "json"], { encoding: "utf8" }));
}

function currentState(): { state: string; result: string | null; label: string } {
  if (stage) {
    const timeline = restGet(`${org}/${project}/_apis/build/builds/${buildId}/timeline?api-version=7.1`);
    const record = (timeline.records ?? []).find((r: any) => r.type === "Stage" && r.name === stage);
    if (!record) return { state: "notStarted", result: null, label: `stage "${stage}"` };
    return { state: record.state, result: record.result, label: `stage "${stage}"` };
  }
  const build = restGet(`${org}/${project}/_apis/build/builds/${buildId}?api-version=7.1`);
  return { state: build.status, result: build.result, label: "build" };
}

const start = Date.now();
for (;;) {
  const { state, result, label } = currentState();
  const elapsedS = Math.round((Date.now() - start) / 1000);

  if (state === "completed") {
    console.log(JSON.stringify({ buildId, label, state, result, elapsedS }));
    process.exit(result === "succeeded" ? 0 : 1);
  }

  if (Date.now() - start >= timeout) {
    console.log(JSON.stringify({ buildId, label, state, result, elapsedS, timedOut: true }));
    process.exit(2);
  }

  await sleep(interval);
}
