// Ask a world to serve a conversation: publish a `service` request on
// `agent.v1.{world}.requests.service` and print the reply.
//
// One verb for spawn, resume, and takeover (agent-spec): the servicer reads
// the conversation's record and reacts. The caller mints the conversation id
// for a fresh spawn — existence follows from the record, no id is returned.
//
// Run by an LLM, not a person: takes one JSON object on stdin, writes the reply to
// stdout, progress to stderr, exits non-zero on rejection or no reply.
//
//   echo '{"world":"local","conv":"<uuid>"}' | node service.mts
//   echo '{"world":"local","conv":"<uuid>","cwd":"/path/to/worktree"}' | node service.mts
//
// conv is the FULL conversation uuid (mint one with uuidgen for a spawn).
// cwd/model are strict when named: a value the world cannot establish rejects
// the request (absence delegates, presence binds — nats-spec). NATS_URL
// overrides the broker.

import { randomUUID } from "node:crypto";
import { JSONCodec, connect } from "nats";
import { readStdin } from "../../../shared/stdin.mts";

type Input = { world: string; conv?: string; cwd?: string; model?: string; wait?: number };
type Reply = { accepted?: boolean; rejected?: boolean; reason?: string; detail?: string };

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";

const input = readStdin<Input>('{"world":"local","conv":"<uuid>","cwd":"..."}');
if (!input.world) {
  process.stderr.write("input needs { world }\n");
  process.exit(2);
}
// Minting here (not in the servicer) matches the wire's creation model: the
// caller names the conversation and asks for it to be served.
const conv = input.conv ?? randomUUID();
const subject = `agent.v1.${input.world}.requests.service`;

const nc = await connect({ servers: url });
const jc = JSONCodec<unknown>();
try {
  const body = {
    ts: new Date().toISOString(),
    from: { kind: "orchestrator" },
    conversationId: conv,
    ...(input.cwd !== undefined ? { cwd: input.cwd } : {}),
    ...(input.model !== undefined ? { model: input.model } : {}),
  };
  process.stderr.write(`[debug] subject=${subject} conversationId=${conv}\n`);
  let reply: Reply;
  try {
    const r = await nc.request(subject, jc.encode(body), {
      timeout: (input.wait ?? 30) * 1000,
    });
    reply = jc.decode(r.data) as Reply;
  } catch {
    process.stderr.write(
      `no servicer replied on ${subject} (is a bridge serving world "${input.world}"?)\n`,
    );
    process.exit(1);
  }
  if (reply?.accepted) {
    process.stdout.write(JSON.stringify({ accepted: true, conversationId: conv }) + "\n");
  } else {
    process.stdout.write(JSON.stringify({ rejected: true, reason: reply?.reason ?? "unknown", ...(reply?.detail ? { detail: reply.detail } : {}), conversationId: conv }) + "\n");
    process.exit(1);
  }
} finally {
  await nc.drain();
}
