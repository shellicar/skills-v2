// Given an approval ID, confirm which build/pipeline it belongs to.
// Use this before approving or cancelling anything — never act on an approval id you haven't confirmed.
// node get-build-for-approval.mts '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","approvalId":"..."}'

import { execFileSync } from "node:child_process";

const RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";

const { org, project, approvalId } = JSON.parse(process.argv[2] ?? "{}");
if (!org || !project || !approvalId) {
  console.error('usage: get-build-for-approval.mts \'{"org":"...","project":"...","approvalId":"..."}\'');
  process.exit(1);
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
