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
//   echo '{"conv":"<uuid>","from":"<uuid>","name":"Bosun","opener":"Bosun here.","message":"hello"}' | node sendMessage.mts
//   echo '{"conv":"<uuid>","from":"<uuid>","name":"Bosun","opener":"Bosun here.","message":"hi","noWait":true}' | node sendMessage.mts
//   node sendMessage.mts < payload.json
//
// opener is required and goes at the top of the message: with layers of sessions, who
// is speaking decides how the rest is read, so it has to arrive before the reader acts.
// Its contents are not checked against name — a checked opener is a form rather than a
// voice, and attribution is already guaranteed on the wire and in the appendix.
//
// The appendix is appended for you, always: who sent this, and the recipient's own
// conversation id, which nothing else tells it. role is optional and rides beside the
// name. Never write any of it by hand — every hand-written copy has gone stale.
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

type Input = { conv: string; from: string; name: string; opener: string; message: string; role?: string; wait?: number; noWait?: boolean };

const input = readStdin<Input>('{"conv":"<uuid>","from":"<uuid>","name":"<your cast name>","opener":"<who is speaking>","message":"hello"}');
if (!input.conv || !input.from || !input.name || !input.opener || typeof input.message !== "string") {
  process.stderr.write("input needs { conv, from, name, opener, message }\n");
  process.exit(EXIT_BAD_INPUT);
}

await publishSay({
  conv: input.conv,
  from: input.from,
  message: input.message,
  name: input.name,
  opener: input.opener,
  ...(input.role === undefined ? {} : { role: input.role }),
  follow: !input.noWait,
  waitSeconds: input.wait ?? 180,
  withAppendix: true,
});
