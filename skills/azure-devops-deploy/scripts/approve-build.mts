// Approve a pending deployment approval. ALWAYS run get-build-for-approval.mts first
// and confirm the pipeline/build name matches what you intend to deploy — approving
// the wrong id approves someone else's prod deployment.
// node approve-build.mts '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","approvalId":"...","comment":"Approved"}'

import { execFileSync } from "node:child_process";

const RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";

const { org, project, approvalId, comment } = JSON.parse(process.argv[2] ?? "{}");
if (!org || !project || !approvalId) {
  console.error('usage: approve-build.mts \'{"org":"...","project":"...","approvalId":"...","comment":"Approved"}\'');
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
      `${org}/${project}/_apis/pipelines/approvals?api-version=7.1-preview`,
      "--body",
      JSON.stringify([{ approvalId, status: "approved", comment: comment ?? "Approved" }]),
      "--resource",
      RESOURCE,
      "--query",
      "value[].{approvalId:id,pipeline:pipeline.name,buildId:pipeline.owner.id,status:status}",
      "--output",
      "json",
    ],
    { encoding: "utf8" },
  ),
);

console.log(JSON.stringify(result));
