// Prints each skill's frontmatter `description` character count, split into over- and
// within-budget sections against the 250-character cap (see CLAUDE.md).
//
//   node scripts/description-lengths.mjs

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MAX = 250;
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
  .filter((r) => r.chars > 0)
  .sort((a, b) => b.chars - a.chars);

const width = Math.max(...rows.map((r) => r.name.length));
const print = (r) => console.log(`${r.name.padEnd(width)}  ${r.chars}`);

const over = rows.filter((r) => r.chars > MAX);
const within = rows.filter((r) => r.chars <= MAX);

if (over.length > 0) {
  console.log(`Over ${MAX} chars — trim these:`);
  over.forEach(print);
  console.log("");
}

console.log(`Within ${MAX} chars:`);
within.forEach(print);
