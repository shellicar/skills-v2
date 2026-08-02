#!/usr/bin/env node
/**
 * Start a bridge with the v2 baseline injected — the bridge counterpart of
 * start-v2.mjs.
 *
 * BASELINE.md rides the `system` control line, the foundational skills block
 * rides `context`, and the repo's own config.jsonl follows so its skills dir,
 * model and permissions still apply.
 *
 *   start-bridge.mjs                       # ./config.jsonl, ./target/debug/bridge
 *   start-bridge.mjs --config path.jsonl
 *   start-bridge.mjs --bridge ./target/release/bridge
 *   start-bridge.mjs --doctor              # print what would be sent, then exit
 *
 * Everything else is forwarded to bridge verbatim. Runs in the current pane and
 * exits with bridge's status; exit 2 if the skills or config cannot be read.
 * BRIDGE_BIN overrides the binary, same as --bridge.
 */

import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { buildSkillsBlock } from "./load-skills.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillsDir = resolve(join(scriptDir, "..", "skills"));

const passthrough = process.argv.slice(2);
if (passthrough[0] === "--") passthrough.shift();

const take = (flag) => {
  const i = passthrough.indexOf(flag);
  if (i < 0) return undefined;
  const value = passthrough[i + 1];
  passthrough.splice(i, 2);
  if (!value) {
    console.error(`start-bridge: ${flag} requires a value.`);
    process.exit(2);
  }
  return value;
};

const configPath = resolve(take("--config") ?? "config.jsonl");
const bridgeBin = resolve(take("--bridge") ?? process.env.BRIDGE_BIN ?? "target/debug/bridge");

let context;
try {
  context = buildSkillsBlock(skillsDir, { catalogue: false });
} catch (err) {
  console.error(`start-bridge: ${err.message}`);
  process.exit(2);
}

let system;
try {
  system = readFileSync(join(scriptDir, "..", "BASELINE.md"), "utf8").trim();
} catch {
  // No BASELINE.md — launch without a system prompt, same as start-v2.
}

let repoConfig;
try {
  repoConfig = readFileSync(configPath, "utf8").trim();
} catch (err) {
  console.error(`start-bridge: cannot read ${configPath}: ${err.message}`);
  process.exit(2);
}

// Order matters: the repo's own lines land last, so a config.jsonl that sets
// system or context deliberately overrides the baseline rather than losing to it.
const lines = [];
if (system) lines.push(JSON.stringify({ system }));
lines.push(JSON.stringify({ context }));
if (repoConfig) lines.push(repoConfig);
const control = lines.join("\n");

if (passthrough.includes("--doctor")) {
  console.log(`bridge:          ${bridgeBin}`);
  console.log(`config:          ${configPath}`);
  console.log(`skillsDir:       ${skillsDir}`);
  console.log(`system chars:    ${system ? system.length : 0}`);
  console.log(`context chars:   ${context.length}`);
  console.log(`repo config:     ${repoConfig.split("\n").length} lines`);
  process.exit(0);
}

const result = spawnSync(bridgeBin, ["-c", control, ...passthrough], { stdio: "inherit" });
process.exit(result.status ?? 1);
