// Cancel a pipeline run.
// node cancel-build.mts '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","buildId":75374}'

import { execFileSync } from "node:child_process";

const RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";

const { org, project, buildId } = JSON.parse(process.argv[2] ?? "{}");
if (!org || !project || !buildId) {
  console.error('usage: cancel-build.mts \'{"org":"...","project":"...","buildId":123}\'');
  process.exit(1);
}

const result = JSON.parse(
  execFileSync(
    "az",
    [
      "rest",
      "--method",
      "PATCH",
      "--url",
      `${org}/${project}/_apis/build/builds/${buildId}?api-version=7.1`,
      "--body",
      JSON.stringify({ status: "cancelling" }),
      "--resource",
      RESOURCE,
      "--query",
      "{buildId:id,buildNumber:buildNumber,pipeline:definition.name,status:status}",
      "--output",
      "json",
    ],
    { encoding: "utf8" },
  ),
);

console.log(JSON.stringify(result));
