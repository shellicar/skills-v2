// Given an approval ID, confirm which build/pipeline it belongs to.
// Use this before approving or cancelling anything — never act on an approval id you haven't confirmed.
// echo '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","approvalId":"..."}' | node get-build-for-approval.mts

import { execFileSync } from "node:child_process";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";

const RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";

const { org, project, approvalId } = readStdin<{ org?: string; project?: string; approvalId?: string }>('{"org":"...","project":"...","approvalId":"..."}');
if (!org || !project || !approvalId) {
  console.error("input needs { org, project, approvalId }");
  process.exit(EXIT_BAD_INPUT);
}

const result = JSON.parse(
  execFileSync(
    "az",
    [
      "rest",
      "--method",
      "GET",
      "--url",
      `${org}/${project}/_apis/pipelines/approvals/${approvalId}?api-version=7.1-preview`,
      "--resource",
      RESOURCE,
      "--query",
      "{approvalId:id,buildId:pipeline.owner.id,pipeline:pipeline.name,status:status}",
      "--output",
      "json",
    ],
    { encoding: "utf8" },
  ),
);

console.log(JSON.stringify(result));
