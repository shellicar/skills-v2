import { JSONCodec, connect, consumerOpts } from "nats";

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const nc = await connect({ servers: url });
const jc = JSONCodec<any>();
const js = nc.jetstream();

const opts = consumerOpts();
opts.orderedConsumer();
opts.filterSubject("agent.v1.default.telemetry.pulse");
const sub = await js.subscribe("agent.v1.default.telemetry.pulse", opts);
for await (const m of sub) {
  const decoded = jc.decode(m.data);
  console.log(JSON.stringify(decoded));
  if (m.info.pending === 0) break;
}
sub.unsubscribe();
await nc.drain();
