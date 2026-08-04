// Given a build ID, find its pending approval id and which stage it's blocking.
// echo '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","buildId":75401}' | node get-approval-id.mts

import { execFileSync } from "node:child_process";
import { EXIT_BAD_INPUT, readStdin } from "../../../shared/stdin.mts";

const RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";

const { org, project, buildId } = readStdin<{ org?: string; project?: string; buildId?: number }>('{"org":"...","project":"...","buildId":123}');
if (!org || !project || !buildId) {
  console.error("input needs { org, project, buildId }");
  process.exit(EXIT_BAD_INPUT);
}

const timeline = JSON.parse(
  execFileSync(
    "az",
    ["rest", "--method", "GET", "--url", `${org}/${project}/_apis/build/builds/${buildId}/timeline?api-version=7.1`, "--resource", RESOURCE, "--output", "json"],
    { encoding: "utf8" },
  ),
);

const approval = timeline.records?.find((r: any) => r.type === "Checkpoint.Approval" && r.state === "inProgress");
if (!approval) {
  console.error(`no pending approval found for build ${buildId}`);
  process.exit(1);
}

const checkpoint = timeline.records?.find((r: any) => r.id === approval.parentId);
const stage = timeline.records?.find((r: any) => r.type === "Stage" && r.id === checkpoint?.parentId);

console.log(JSON.stringify({ buildId, approvalId: approval.id, state: approval.state, stage: stage?.name ?? null }));
