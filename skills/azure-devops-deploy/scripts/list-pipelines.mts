// Discover pipeline ids/names/paths for a project. Use this to find a pipeline id instead
// of guessing or reading it out of a UI screenshot — path filters and ids drift.
// echo '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","name":"api"}' | node list-pipelines.mts

import { execFileSync } from "node:child_process";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";

const RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";

const { org, project, name } = readStdin<{ org?: string; project?: string; name?: string }>('{"org":"...","project":"...","name":"optional case-insensitive substring"}');
if (!org || !project) {
  console.error("input needs { org, project }");
  process.exit(EXIT_BAD_INPUT);
}

const pipelines = JSON.parse(
  execFileSync(
    "az",
    ["rest", "--method", "GET", "--url", `${org}/${project}/_apis/pipelines?api-version=7.1-preview.1`, "--resource", RESOURCE, "--query", "value[].{id:id,name:name,path:configuration.path}", "--output", "json"],
    { encoding: "utf8" },
  ),
);

const filtered = name ? pipelines.filter((p: any) => typeof p.name === "string" && p.name.toLowerCase().includes(String(name).toLowerCase())) : pipelines;

console.log(JSON.stringify(filtered, null, 2));
