// Read a script's JSON input from stdin. Every node script here takes its input this
// way, so a caller never has to work out whether a value is an argument or a field.
// The harder reason: a long argv value trips endpoint security scanning, which kills
// the process mid-run.

import { readFileSync } from "node:fs";
import { basename } from "node:path";

// Bad input means the call itself is wrong, so no retry helps. It sits far above the
// low codes a script uses for its own verdicts, so the two can never collide and a
// script can add a verdict later without moving this. 64 is EX_USAGE in sysexits.h.
export const EXIT_BAD_INPUT = 64;

export function readStdin<T>(shape: string): T {
  const raw = readAll().trim();
  if (!raw) fail(`no input on stdin\nusage: echo '${shape}' | ${basename(process.argv[1] ?? "script")}`);
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    fail(`input is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// isTTY means nothing was piped in, and reading fd 0 would block on the terminal
// forever. The catch covers fd 0 refusing the read, which is also "no input" as far
// as the caller is concerned.
function readAll(): string {
  if (process.stdin.isTTY) return "";
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(EXIT_BAD_INPUT);
}
