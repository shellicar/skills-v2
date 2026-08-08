// Self-test for read.mts, driving its own broker: this process publishes the messages a
// conversation would have committed, then reads them back through the script.
//
// What it is really pinning: that content is never silently reduced to a label. Thinking
// rendered as a bare `[thinking]` for an unknown length of time, and nobody caught it
// because a label reads as deliberate rather than as a bug.
//
// The conversation ids are fixed test uuids and each case owns one, so a case never reads
// another's leftovers.
//
// Brings up its own broker and can never reach the fleet's; see lib/test-broker.mts.
//
//   node test-read.mts
//
// Exits 0 when every case passes, 1 when any fails.

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSONCodec } from "nats";
import { connectTestBroker } from "./lib/test-broker.mts";

const script = resolve(join(dirname(fileURLToPath(import.meta.url)), "read.mts"));

const CONV = {
  vocabulary: "00000000-0000-4000-8000-00000000d001",
  dropped: "00000000-0000-4000-8000-00000000d002",
  unsigned: "00000000-0000-4000-8000-00000000d003",
  counted: "00000000-0000-4000-8000-00000000d004",
};

type Block = Record<string, unknown> & { type: string };

const jc = JSONCodec<unknown>();
const nc = await connectTestBroker();
const js = nc.jetstream();

const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  process.stdout.write(`${ok ? "ok  " : "FAIL"} ${name}${ok || !detail ? "" : ` — ${detail}`}\n`);
  if (!ok) failures.push(name);
};

const commit = async (conv: string, role: string, content: Block[]): Promise<void> => {
  const body = { id: randomUUID(), role, ts: new Date().toISOString(), content };
  await js.publish(`conv.v2.${conv}.changes.message`, jc.encode(body));
};

const run = (input: unknown): Promise<{ status: number | null; stdout: string; stderr: string }> =>
  new Promise((done) => {
    const child = spawn(process.execPath, [script], { stdio: ["pipe", "pipe", "pipe"], timeout: 20000 });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d;
    });
    child.stderr.on("data", (d) => {
      stderr += d;
    });
    child.on("close", (status) => done({ status, stdout, stderr }));
    child.stdin.end(JSON.stringify(input));
  });

const headers = (out: string): number => out.split("\u2500\u2500 ").length - 1;

// Bad input: no conversation to read is a usage error, and no retry helps.
const noConv = await run({});
check("a read with no conv exits 64", noConv.status === 64, `status=${noConv.status}`);

// An empty conversation is reported, not failed: nothing was committed, which is an
// answer rather than a fault.
const empty = await run({ conv: randomUUID() });
check("an empty conversation exits 0", empty.status === 0, `status=${empty.status}`);
check("an empty conversation says so on stderr", empty.stderr.includes("no messages"), empty.stderr);

// One conversation carrying every block type there is.
await commit(CONV.vocabulary, "user", [{ type: "text", text: "WHAT-HE-ASKED" }]);
await commit(CONV.vocabulary, "assistant", [
  { type: "thinking", thinking: "WHY-IT-CHOSE", signature: "sig" },
  { type: "text", text: "WHAT-IT-ANSWERED" },
  { type: "tool_use", name: "Grep", input: { pattern: "NEEDLE" } },
]);
await commit(CONV.vocabulary, "user", [{ type: "tool_result" }]);

const byDefault = await run({ conv: CONV.vocabulary });
check("the default read exits 0", byDefault.status === 0, byDefault.stderr);
check("thinking renders its content, not a label", byDefault.stdout.includes("WHY-IT-CHOSE"), byDefault.stdout);
check("what he asked is in the default read", byDefault.stdout.includes("WHAT-HE-ASKED"), byDefault.stdout);
check("what it answered is in the default read", byDefault.stdout.includes("WHAT-IT-ANSWERED"), byDefault.stdout);
check("tool calls are out of the default read", !byDefault.stdout.includes("NEEDLE"), byDefault.stdout);
check("tool results are out of the default read", !byDefault.stdout.includes("[tool_result]"), byDefault.stdout);

// Naming types replaces the defaults rather than adding to them, which is what makes
// asking for one thing on its own possible at all.
const toolsOnly = await run({ conv: CONV.vocabulary, include: ["tool_use"] });
check("naming tool_use renders the call", toolsOnly.stdout.includes("NEEDLE"), toolsOnly.stdout);
check("naming tool_use names the tool", toolsOnly.stdout.includes("[tool_use: Grep]"), toolsOnly.stdout);
check("naming tool_use drops what each side said", !toolsOnly.stdout.includes("WHAT-IT-ANSWERED"), toolsOnly.stdout);
check("naming tool_use drops the thinking", !toolsOnly.stdout.includes("WHY-IT-CHOSE"), toolsOnly.stdout);

// The two that share a type: a user's own words and an assistant's are different things
// to want, and asking for one must not bring the other.
const hisWords = await run({ conv: CONV.vocabulary, include: ["user.text"] });
check("user.text keeps what he said", hisWords.stdout.includes("WHAT-HE-ASKED"), hisWords.stdout);
check("user.text drops what it answered", !hisWords.stdout.includes("WHAT-IT-ANSWERED"), hisWords.stdout);
const itsWords = await run({ conv: CONV.vocabulary, include: ["assistant.text"] });
check("assistant.text keeps what it answered", itsWords.stdout.includes("WHAT-IT-ANSWERED"), itsWords.stdout);
check("assistant.text drops what he said", !itsWords.stdout.includes("WHAT-HE-ASKED"), itsWords.stdout);
check("assistant.text drops the thinking beside it", !itsWords.stdout.includes("WHY-IT-CHOSE"), itsWords.stdout);

// A tool result arrives on a user message, so filtering it out empties that message
// entirely. An empty header is noise, so the message goes with it.
await commit(CONV.dropped, "user", [{ type: "tool_result" }]);
await commit(CONV.dropped, "assistant", [{ type: "text", text: "THE-ONLY-SURVIVOR" }]);
const dropped = await run({ conv: CONV.dropped });
check("a message emptied by the filter is dropped", headers(dropped.stdout) === 1, dropped.stdout);
check("the message that survived is rendered", dropped.stdout.includes("THE-ONLY-SURVIVOR"), dropped.stdout);

// Thinking that arrives encrypted carries a signature and no text. Saying so is the
// point: an empty line would look exactly like the bug this test exists for.
await commit(CONV.unsigned, "assistant", [{ type: "thinking", thinking: "", signature: "sig" }]);
const unsigned = await run({ conv: CONV.unsigned });
check("thinking with no content says so", unsigned.stdout.includes("[thinking: no content on the wire]"), unsigned.stdout);

// `n` counts what survives the filter, so the last thing said is `n: 1` rather than a
// number you have to guess from how much machinery ran.
await commit(CONV.counted, "assistant", [{ type: "text", text: "FIRST" }]);
await commit(CONV.counted, "assistant", [{ type: "tool_use", name: "Grep", input: {} }]);
await commit(CONV.counted, "assistant", [{ type: "text", text: "LAST" }]);
const counted = await run({ conv: CONV.counted, n: 1 });
check("n counts messages that survive the filter", headers(counted.stdout) === 1, counted.stdout);
check("n of 1 is the last thing said", counted.stdout.includes("LAST"), counted.stdout);
check("n of 1 is not the message before it", !counted.stdout.includes("FIRST"), counted.stdout);

await nc.drain();
process.stdout.write(failures.length === 0 ? "\nall passed\n" : `\n${failures.length} failed\n`);
process.exit(failures.length === 0 ? 0 : 1);
