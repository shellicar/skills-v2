#!/usr/bin/env node
/**
 * Build the v2 skills context block — a `<skills>` block, so each skill reads as
 * its own operating constraint, not as prose in one document.
 *
 * Shape:
 *   <skills path="/abs/skills">
 *     <instructions> … the repo INSTRUCTIONS.md … </instructions>
 *     <skill name="…" tier="foundational"> … whole body … </skill>   (repeated)
 *     <index>
 *       <skill name="…"> … frontmatter only … </skill>               (repeated)
 *     </index>
 *   </skills>
 *
 * Foundational skills load WHOLE (frontmatter stripped, body inlined) because they
 * bind every session. Every other skill contributes ONLY its frontmatter — its
 * name plus the description/trigger/why that let a session decide whether to load
 * the body. Most skills have no frontmatter yet, so they appear as a bare name.
 *
 * Used two ways:
 *   - imported: `buildSkillsBlock(skillsDir, { actor })` returns the block string.
 *   - run directly: prints the block to stdout.
 *
 * Single line to load skills from a directory:
 *   node load-skills.mjs /path/to/skills-v2/skills
 * With no argument it resolves the skills/ dir of its own checkout.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Which skills are foundational — loaded whole, every session. This is the
// "which is always-on" decision. It lives here for now; when we settle
// manifest-vs-frontmatter it moves out of code. The array order is load order.
export const FOUNDATIONAL = [
  "working-relationship",
  "sc-proxy",
  "commander-protocol",
  "communication",
  "voice",
  "audience",
  "teapot-protocol",
  "co-working",
  "testament",
  "system-glossary",
  "safe-operations",
];

// Split a SKILL.md into { frontmatter, body }. Frontmatter is the block between
// the first pair of `---` fences at the top; absent if the file has none.
function split(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { frontmatter: "", body: content.trim() };
  return { frontmatter: m[1].trim(), body: content.slice(m[0].length).trim() };
}

/**
 * Build the `<skills>` block for a skills directory. Foundational skills (plus an
 * optional actor) load whole. When `catalogue` is true (default) every other skill
 * contributes frontmatter only, as an `<index>`; pass `catalogue: false` when the
 * Skill tool (via skillDirs) handles that discovery instead. Throws if a skill that
 * must load whole is missing.
 */
export function buildSkillsBlock(skillsDir, { actor, catalogue = true } = {}) {
  const read = (name) => {
    try {
      return readFileSync(join(skillsDir, name, "SKILL.md"), "utf8");
    } catch {
      return null;
    }
  };

  const whole = actor ? [...FOUNDATIONAL, actor] : FOUNDATIONAL;
  // The root path tells the session where the skills live, so a `<skill name="x">`
  // resolves to `<path>/x/SKILL.md` — provenance without repeating the path per skill.
  const parts = [`<skills path="${skillsDir}">`];

  // INSTRUCTIONS.md is the automation-integrity baseline — it frames the block. It is
  // NOT named CLAUDE.md on purpose: the launcher injects it here, so it must not also
  // be picked up as an ambient project CLAUDE.md source (the CLI does not de-dupe).
  try {
    const baseline = readFileSync(join(skillsDir, "..", "INSTRUCTIONS.md"), "utf8").trim();
    if (baseline) parts.push("<instructions>", baseline, "</instructions>");
  } catch {
    // No INSTRUCTIONS.md — proceed without the baseline framing.
  }

  // Foundational skills — whole body, marked, in declared order.
  for (const name of whole) {
    const content = read(name);
    if (content === null) throw new Error(`skill missing (must load whole): ${name}`);
    parts.push(`<skill name="${name}" tier="foundational">`, split(content).body, "</skill>");
  }

  // The catalogue of the other skills — frontmatter only — is built here only when the
  // Skill tool isn't handling discovery. With skillDirs set, the tool injects the
  // frontmatter itself, so start-v2 passes catalogue: false and this block is skipped.
  if (catalogue) {
    const others = readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((name) => !whole.includes(name))
      .sort();

    parts.push("<index>");
    parts.push("The further skills this session carries. Load a skill's body when its trigger fires.");
    for (const name of others) {
      const content = read(name);
      if (content === null) continue;
      const { frontmatter } = split(content);
      if (frontmatter) {
        parts.push(`<skill name="${name}">`, frontmatter, "</skill>");
      } else {
        parts.push(`<skill name="${name}" />`);
      }
    }
    parts.push("</index>");
  }

  parts.push("</skills>");

  return parts.join("\n") + "\n";
}

// Run directly: print the block for the given (or own-checkout) skills dir.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const skillsDir = resolve(process.argv[2] ?? join(scriptDir, "..", "skills"));
  try {
    process.stdout.write(buildSkillsBlock(skillsDir));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
