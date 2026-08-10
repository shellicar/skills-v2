// REPLY to a conversation that asked you to. The same publish as
// sendMessage.mts; separate because the authorisation differs.
//
// NO APPROVAL GATE. Approving the message that asked for a reply approved the
// reply: it commissions nothing, it returns a result to whoever asked, and the
// question was already framed by the message being answered. A worker
// conversation has no human in it, so gating the reply would not be caution, it
// would deadlock the delivery at the moment the work is finished.
//
// It never follows the query it opens. A reply does not expect an answer to
// itself, and a reply that can hang is how a finished report fails to arrive.
//
// Run by an LLM, not a person: one JSON object on stdin, the accepted query id to
// stdout, progress to stderr.
//
//   echo '{"conv":"<uuid>","from":"<uuid>","name":"Bosun","message":"the findings"}' | node replyToMessage.mts
//   node replyToMessage.mts < payload.json
//
// conv is the FULL conversation uuid you are replying INTO, which is the `from` of
// the message you are answering; from is your own and name is the one you gave
// yourself. lib/say.mts owns why both are required. Put a long reply in a file and pass it on stdin: a long message in
// argv is killed by endpoint scanning before node starts.
//
// Exits 0 as soon as the reply is accepted. 1 if it is rejected or no servicer
// replies. 64 on bad input.

import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";
import { publishSay } from "./lib/say.mts";

type Input = { conv: string; from: string; name: string; message: string };

const input = readStdin<Input>('{"conv":"<uuid>","from":"<uuid>","name":"<your cast name>","message":"the findings"}');
if (!input.conv || !input.from || !input.name || typeof input.message !== "string") {
  process.stderr.write("input needs { conv, from, name, message }\n");
  process.exit(EXIT_BAD_INPUT);
}

await publishSay({
  conv: input.conv,
  from: input.from,
  message: input.message,
  name: input.name,
  follow: false,
  waitSeconds: 0,
  // Whoever you are answering already knows who you are and which conversation it is
  // in; only an original message lands somewhere that has to be told.
  withAppendix: false,
});
