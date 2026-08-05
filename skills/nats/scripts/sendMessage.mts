// Send an ORIGINAL message into a conversation: publish a `say` and, by default,
// follow the query it opens until it closes, printing the committed messages as
// they land.
//
// APPROVAL GATE: an original message commissions work in the SC's name, so the
// `message` needs his approval before this runs. SKILL.md owns the rule.
// replyToMessage.mts is the ungated counterpart, for answering a conversation
// that asked you to.
//
// Run by an LLM, not a person: one JSON object on stdin, transcript to stdout,
// progress to stderr.
//
//   echo '{"conv":"<uuid>","from":"<uuid>","name":"Bosun","message":"hello"}' | node sendMessage.mts
//   echo '{"conv":"<uuid>","from":"<uuid>","name":"Bosun","message":"hi","noWait":true}' | node sendMessage.mts
//   node sendMessage.mts < payload.json
//
// The reply instructions are appended for you, always: the recipient is told its
// own conversation id, where to reply, and the exact payload to send. Never write
// that by hand into the message — every hand-written copy has gone stale.
//
// conv is the FULL conversation uuid being spoken INTO; from is your own and name is
// the one you gave yourself, and lib/say.mts owns why both are required. wait is seconds, default 180. noWait exits
// as soon as the say is accepted, without following the reply: use it when you are
// dispatching work rather than waiting on an answer.
//
// Exits 0 when the query closes `completed`, or as soon as the say is accepted
// under noWait. 1 if the say is rejected, no servicer replies, or the query closes
// `cancelled`/`aborted`. 2 if the wait elapses first, which is not a verdict: the
// query is still running, so read it later. 64 on bad input.

import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";
import { publishSay } from "./lib/say.mts";

type Input = { conv: string; from: string; name: string; message: string; wait?: number; noWait?: boolean };

const input = readStdin<Input>('{"conv":"<uuid>","from":"<uuid>","name":"<your cast name>","message":"hello"}');
if (!input.conv || !input.from || !input.name || typeof input.message !== "string") {
  process.stderr.write("input needs { conv, from, name, message }\n");
  process.exit(EXIT_BAD_INPUT);
}

await publishSay({
  conv: input.conv,
  from: input.from,
  message: input.message,
  name: input.name,
  follow: !input.noWait,
  waitSeconds: input.wait ?? 180,
  withReplyInstructions: true,
});
