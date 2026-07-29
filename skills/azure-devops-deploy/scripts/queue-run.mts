// Queue a pipeline run against a ref (branch or tag). ONLY run this when the SC has
// directly and explicitly asked you to queue a pipeline — never as a side effect of
// investigating or documenting. Confirm the pipeline id with list-pipelines.mts first;
// queueing the wrong pipeline id starts someone else's build.
// node queue-run.mts '{"org":"https://dev.azure.com/eagersautomotive","project":"Deal-Hub","pipelineId":236,"ref":"refs/tags/2.1.7"}'

import { execFileSync } from "node:child_process";

const RESOURCE = "499b84ac-1321-427f-aa17-267ca6975798";

const { org, project, pipelineId, ref } = JSON.parse(process.argv[2] ?? "{}");
if (!org || !project || !pipelineId || !ref) {
  console.error('usage: queue-run.mts \'{"org":"...","project":"...","pipelineId":123,"ref":"refs/tags/..."}\'');
  process.exit(1);
}

const result = JSON.parse(
  execFileSync(
    "az",
    [
      "rest",
      "--method",
      "POST",
      "--url",
      `${org}/${project}/_apis/pipelines/${pipelineId}/runs?api-version=7.1-preview.1`,
      "--body",
      JSON.stringify({ stagesToSkip: [], resources: { repositories: { self: { refName: ref } } } }),
      "--resource",
      RESOURCE,
      "--query",
      "{runId:id,pipeline:pipeline.name,state:state,ref:resources.repositories.self.refName,url:_links.web.href}",
      "--output",
      "json",
    ],
    { encoding: "utf8" },
  ),
);

console.log(JSON.stringify(result));
