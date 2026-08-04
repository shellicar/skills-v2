// Cancel a pipeline run.
// echo '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","buildId":75374}' | node cancel-build.mts

import { execFileSync } from "node:child_process";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";

const RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";

const { org, project, buildId } = readStdin<{ org?: string; project?: string; buildId?: number }>('{"org":"...","project":"...","buildId":123}');
if (!org || !project || !buildId) {
  console.error("input needs { org, project, buildId }");
  process.exit(EXIT_BAD_INPUT);
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
