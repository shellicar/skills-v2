// List pending approvals for one pipeline, each resolved to its build id and number.
// Never approve/cancel off a bare, unfiltered dump of every pipeline's approvals —
// this narrows to one pipeline and confirms the build behind each approval.
// echo '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","pipeline":"Customer-Payments - API"}' | node list-pending-approvals.mts

import { execFileSync } from "node:child_process";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";

const RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";

const { org, project, pipeline } = readStdin<{ org?: string; project?: string; pipeline?: string }>('{"org":"...","project":"...","pipeline":"optional exact name"}');
if (!org || !project) {
  console.error("input needs { org, project }");
  process.exit(EXIT_BAD_INPUT);
}

const approvals = JSON.parse(
  execFileSync(
    "az",
    [
      "rest",
      "--method",
      "GET",
      "--url",
      `${org}/${project}/_apis/pipelines/approvals?api-version=7.1-preview`,
      "--resource",
      RESOURCE,
      "--query",
      "value[?status=='pending'].{approvalId:id,buildId:pipeline.owner.id,buildNumber:pipeline.owner.name,pipeline:pipeline.name}",
      "--output",
      "json",
    ],
    { encoding: "utf8" },
  ),
);

const filtered = pipeline ? approvals.filter((a: any) => a.pipeline === pipeline) : approvals;

console.log(JSON.stringify(filtered, null, 2));
