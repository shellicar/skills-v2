import { JSONCodec, connect, consumerOpts } from "nats";

const url = process.env.NATS_URL ?? "nats://127.0.0.1:4222";
const instanceId = process.argv[2];

const nc = await connect({ servers: url });
const jc = JSONCodec<any>();
const js = nc.jetstream();

for (const subject of ["agent.v1.default.telemetry.ready", "agent.v1.local.telemetry.ready", "agent.v1.default.telemetry.attached", "agent.v1.local.telemetry.attached"]) {
  const opts = consumerOpts();
  opts.orderedConsumer();
  opts.filterSubject(subject);
  const sub = await js.subscribe(subject, opts);
  for await (const m of sub) {
    const decoded = jc.decode(m.data);
    if (decoded.instanceId === instanceId) console.log(subject, JSON.stringify(decoded));
    if (m.info.pending === 0) break;
  }
  sub.unsubscribe();
}

await nc.drain();
