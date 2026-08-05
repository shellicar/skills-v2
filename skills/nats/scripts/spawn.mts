// Commission a worker: serve a conversation, record who it reports to, and hand it
// the brief. Three things a handler needs to happen together, so they are one tool:
// a registration step a handler has to remember separately is one that gets skipped
// or mistyped, and the worker it produces is one nobody is watching.
//
// Run by an LLM, not a person: one JSON object on stdin, progress to stderr, and the
// result JSON as the LAST line of stdout (the say prints its accepted query id on the
// line before, the same as sendMessage.mts does).
//
//   echo '{"world":"local","cwd":"/path/to/worktree","owner":"<your uuid>","name":"<your cast name>","message":"the brief"}' | node spawn.mts
//   node spawn.mts < payload.json
//
// owner is the caller's OWN conversation uuid and name is the cast name it gave
// itself: the worker reports back to that conversation, and the reporting line
// records that it does. conv is the worker's conversation uuid, minted here when it
// is not given. cwd is the worktree the worker runs in, and is required: a worker
// spawned into the wrong tree edits the wrong repo.
//
// APPROVAL GATE: the brief is an original message, so it needs the SC's approval
// before this runs. SKILL.md owns the rule.
//
// The four steps happen in order, and the order matters: each one is only worth
// doing if the one before it landed.
//   1. mint the conversation id
//   2. service the world, so something is attached to answer
//   3. write the reporting line, and verify it reads back
//   4. send the brief, never waiting for the answer
//
// Exits 0 when all four land. 1 when any of them is rejected, which includes a
// service the world refused, a bridge that never replied, a reporting line that
// would not read back, and a say no servicer took. 64 on bad input.
//
// NATS_URL is the broker and NATS_REPORTING_BUCKET is the reporting-line bucket.

import { randomUUID } from "node:crypto";
import { JSONCodec, connect } from "nats";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";
import { publishSay } from "./lib/say.mts";

type Input = {
  world: string;
  cwd: string;
  owner: string;
  name: string;
  message: string;
  conv?: string;
  model?: string;
  wait?: number;
};
type Reply = { accepted?: boolean; rejected?: boolean; reason?: string; detail?: string };
type Line = { owner: string; ts: string };

/** A line records direction of reporting and nothing else: the worktree and the brief
 * belong to the spawn, not to the line. KV rather than a stream because a line is
 * deleted at teardown, which makes it a table rather than a history. The override is
 * for check-spawn.mts, so a test never writes into the bucket the fleet runs on. */
const BUCKET = process.env.NATS_REPORTING_BUCKET ?? "reporting-lines";

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";

const input = readStdin<Input>(
  '{"world":"local","cwd":"/path/to/worktree","owner":"<your uuid>","name":"<your cast name>","message":"the brief"}',
);
if (!input.world || !input.cwd || !input.owner || !input.name || typeof input.message !== "string") {
  process.stderr.write("input needs { world, cwd, owner, name, message }\n");
  process.exit(EXIT_BAD_INPUT);
}

const conv = input.conv ?? randomUUID();
const serviceSubject = `agent.v1.${input.world}.requests.service`;

const nc = await connect({ servers: url });
const jc = JSONCodec<unknown>();
try {
  const body = {
    ts: new Date().toISOString(),
    from: { kind: "orchestrator" },
    conversationId: conv,
    cwd: input.cwd,
    ...(input.model !== undefined ? { model: input.model } : {}),
  };
  process.stderr.write(`[debug] subject=${serviceSubject} conversationId=${conv} cwd=${input.cwd}\n`);
  let reply: Reply;
  try {
    const r = await nc.request(serviceSubject, jc.encode(body), { timeout: (input.wait ?? 30) * 1000 });
    reply = jc.decode(r.data) as Reply;
  } catch {
    process.stderr.write(
      `no servicer replied on ${serviceSubject} (is a bridge serving world "${input.world}"?)\n`,
    );
    process.exit(1);
  }
  if (!reply?.accepted) {
    // Nothing else has happened yet, so there is nothing to unwind and nothing to
    // warn about: the conversation was never served.
    process.stdout.write(
      `${JSON.stringify({ rejected: true, reason: reply?.reason ?? "unknown", ...(reply?.detail ? { detail: reply.detail } : {}), conversationId: conv })}\n`,
    );
    process.exit(1);
  }

  const line: Line = { owner: input.owner, ts: new Date().toISOString() };
  try {
    const kv = await nc.jetstream().views.kv(BUCKET);
    await kv.put(conv, jc.encode(line));
    const entry = await kv.get(conv);
    const readBack = entry === null ? null : (entry.json<Partial<Line>>() ?? null);
    if (readBack?.owner !== input.owner) {
      throw new Error(`read back ${JSON.stringify(readBack)}, expected owner ${input.owner}`);
    }
  } catch (err) {
    // Say this plainly rather than as a step that failed: the conversation IS served,
    // so an agent is sitting in that worktree, and no line means nobody is recorded as
    // watching it. It must not read as success.
    process.stderr.write(
      `conversation ${conv} is attached but has NO reporting line: ${err instanceof Error ? err.message : String(err)}\n` +
        `nobody is recorded as watching it, and the brief was NOT sent. Fix the ${BUCKET} bucket and spawn again with {"conv":"${conv}"}.\n`,
    );
    process.exit(1);
  }
  process.stderr.write(`[debug] reporting line ${conv} -> ${input.owner}\n`);
} finally {
  await nc.drain();
}

// A spawn hands out work; it does not wait for an answer, so the say never follows the
// query it opens. Reply instructions ride along, which is how the worker learns its own
// conversation id and where to report.
const queryId = await publishSay({
  conv,
  from: input.owner,
  name: input.name,
  message: input.message,
  follow: false,
  waitSeconds: 0,
  withReplyInstructions: true,
});

process.stdout.write(`${JSON.stringify({ conversationId: conv, queryId, owner: input.owner })}\n`);
