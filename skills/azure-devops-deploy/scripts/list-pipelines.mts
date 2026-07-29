// Discover pipeline ids/names/paths for a project. Use this to find a pipeline id instead
// of guessing or reading it out of a UI screenshot — path filters and ids drift.
// node list-pipelines.mts '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","name":"api"}'

import { execFileSync } from "node:child_process";

const RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";

const { org, project, name } = JSON.parse(process.argv[2] ?? "{}");
if (!org || !project) {
  console.error('usage: list-pipelines.mts \'{"org":"...","project":"...","name":"optional case-insensitive substring"}\'');
  process.exit(1);
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
