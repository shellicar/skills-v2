#!/usr/bin/env node
/**
 * Start a v2 Claude session — claude-sdk-cli with the v2 skills injected.
 *
 * load-skills.mjs builds the foundational skills whole; they ride --claudeMd. The
 * contextual skills are resolved by the CLI's Skill tool via the skillDirs config,
 * which injects their frontmatter and loads bodies on demand.
 *
 *   start-v2.mjs                          # CLI default resume
 *   start-v2.mjs --no-resume              # force a brand-new conversation
 *   start-v2.mjs --no-resume --message "..."   # send a first message
 *   start-v2.mjs --actor gatekeeper       # also load one actor's body whole
 *   start-v2.mjs --model claude-...        # override the default model
 *   start-v2.mjs --doctor                 # print what would be sent, then exit
 *
 * A leading `--` is stripped and
 * everything else is forwarded verbatim. The session runs in the current pane and
 * exits with claude-sdk-cli's status. Exit 2 if a required skill is missing.
 *
 * This is an SC launcher: it refuses to run under claude-sdk-cli (exit 3), so a
 * session cannot launch another. Run it yourself.
 */

import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { buildSkillsBlock } from "./load-skills.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillsDir = resolve(join(scriptDir, "..", "skills"));

// Forward everything to claude-sdk-cli. A leading `--` separator is dropped.
const passthrough = process.argv.slice(2);
if (passthrough[0] === "--") passthrough.shift();

// --actor <name>: load that actor's SKILL.md body whole, alongside foundational.
let actor;
const ai = passthrough.indexOf("--actor");
if (ai >= 0) {
  actor = passthrough[ai + 1];
  passthrough.splice(ai, 2);
  if (!actor) {
    console.error("start-v2: --actor requires a name (e.g. --actor gatekeeper).");
    process.exit(2);
  }
  if (!existsSync(join(skillsDir, actor, "SKILL.md"))) {
    console.error(`start-v2: actor skill not found: ${actor}`);
    process.exit(2);
  }
}

// --message <value>: sent as the first message on a fresh conversation.
let message;
const mi = passthrough.indexOf("--message");
if (mi >= 0) {
  message = passthrough[mi + 1];
  passthrough.splice(mi, 2);
}

let claudeMd;
try {
  claudeMd = buildSkillsBlock(skillsDir, { actor, catalogue: false });
} catch (err) {
  console.error(`start-v2: ${err.message}`);
  process.exit(2);
}

// The system prompt is BASELINE.md (the SYSTEM.md role), passed as --system — read here
// rather than relying on an ambient SYSTEM.md, same as INSTRUCTIONS rides --claudeMd.
let system;
try {
  system = readFileSync(join(scriptDir, "..", "BASELINE.md"), "utf8").trim();
} catch {
  // No BASELINE.md — launch without a system prompt.
}

if (passthrough.includes("--doctor")) {
  console.log(`actor:            ${actor ?? "(none)"}`);
  console.log(`skillsDir:        ${skillsDir}`);
  console.log(`--claudeMd chars: ${claudeMd.length}`);
  console.log(`--system chars:   ${system ? system.length : 0}`);
  console.log(`skillDirs:        [${skillsDir}]`);
  process.exit(0);
}

// SC-only: refuse to run under claude-sdk-cli. Best-effort ancestry walk; if ps
// is unavailable it fails open — the guard is a safety net, not a gate.
assertNotUnderClaude();

// skillDirs points the CLI's Skill tool at the contextual skills — it injects their
// frontmatter and loads bodies on demand. Foundational skills ride --claudeMd whole,
// so they are not tool-resolved. The user CLAUDE.md / SYSTEM.md sources are disabled:
// v2 injects its own baseline, so the v1 user files must not also load. Project and
// local stay on. Full sources objects so the override is robust to merge or replace.
const configOverride = JSON.stringify({
  skillDirs: [skillsDir],
  claudeMd: { enabled: true, sources: { user: false, project: true, projectClaude: true, local: true } },
  systemPrompt: { enabled: true, sources: { user: false, project: true, projectClaude: true, local: true } },
});

const args = ["--claudeMd", claudeMd, "--config", configOverride];
if (system) args.push("--system", system);

// On a fresh conversation with an explicit message, send it as the first message.
if (message && passthrough.includes("--no-resume")) {
  args.push("--prompt", `The Supreme Commander:\n\n${message}`);
}

args.push(...passthrough);

// CLAUDE_SDK_CLI_BIN overrides which entry point runs, e.g. a local working-tree build
// instead of the globally installed claude-sdk-cli. A .js path runs through node (dist/main.js
// has no shebang); anything else (the launcher.mjs, which is executable, or a plain binary)
// spawns directly.
const overrideBin = process.env.CLAUDE_SDK_CLI_BIN;
let program = "claude-sdk-cli";
let spawnArgs = args;
if (overrideBin) {
  if (overrideBin.endsWith(".js")) {
    program = process.execPath;
    spawnArgs = [overrideBin, ...args];
  } else {
    program = overrideBin;
  }
}

const result = spawnSync(program, spawnArgs, { stdio: "inherit" });
process.exit(result.status ?? 1);

function assertNotUnderClaude() {
  try {
    let pid = process.ppid;
    for (let i = 0; i < 40 && pid > 1; i++) {
      const r = spawnSync("ps", ["-o", "ppid=,args=", "-p", String(pid)], { encoding: "utf8" });
      if (r.status !== 0 || !r.stdout.trim()) break;
      const line = r.stdout.trim();
      const sp = line.indexOf(" ");
      if (sp < 0) break;
      const ppid = Number(line.slice(0, sp));
      const cmd = line.slice(sp + 1);
      if (/claude-sdk-cli/.test(cmd)) {
        console.error("start-v2 is an SC launcher; it refuses to run under claude-sdk-cli. Run it yourself.");
        process.exit(3);
      }
      pid = ppid;
    }
  } catch {
    // ps unavailable — fail open.
  }
}
