// Prints each skill's frontmatter `description` character count, longest first.
//
//   node scripts/description-lengths.mjs

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const skillsDir = join(import.meta.dirname, "..", "skills");

const rows = readdirSync(skillsDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => {
    const path = join(skillsDir, e.name, "SKILL.md");
    let text;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      return null;
    }
    const match = text.match(/^description:\s*\|\n([\s\S]*?)\n(?=\S|---)/m);
    const description = match ? match[1] : "";
    return { name: e.name, chars: description.length };
  })
  .filter(Boolean)
  .sort((a, b) => b.chars - a.chars);

const width = Math.max(...rows.map((r) => r.name.length));
for (const { name, chars } of rows) {
  console.log(`${name.padEnd(width)}  ${chars}`);
}
