import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const workflowPath = ".github/workflows/cv04-next05-owner-source-release-gate.yml";
const upstreamGatePath = "tools/cv03-n105c09-owner-evidence-release-gate.mjs";

function triggerPaths(workflow, trigger, nextTrigger) {
  const startMarker = `  ${trigger}:\n`;
  const endMarker = `  ${nextTrigger}:\n`;
  const start = workflow.indexOf(startMarker);
  assert.notEqual(start, -1, `missing ${trigger} trigger`);
  const end = workflow.indexOf(endMarker, start + startMarker.length);
  assert.ok(end > start, `missing ${nextTrigger} boundary after ${trigger}`);
  const section = workflow.slice(start + startMarker.length, end);
  assert.match(section, /^    paths:\s*$/m, `${trigger} must have paths`);
  if (trigger === "push") {
    assert.match(section, /^    branches: \[main\]\s*$/m, "push must target main");
  }
  const paths = [...section.matchAll(/^      - "([^"]+)"\s*$/gm)].map(match => match[1]);
  assert.ok(paths.length > 0, `${trigger} paths must not be empty`);
  assert.equal(new Set(paths).size, paths.length, `${trigger} paths must be unique`);
  return paths.sort();
}

function verifyCoverage(workflow) {
  const pr = triggerPaths(workflow, "pull_request", "push");
  const push = triggerPaths(workflow, "push", "issues");
  assert.ok(pr.includes(upstreamGatePath), "upstream CV03 authorization gate must be watched");
  assert.deepEqual(push, pr, "CV04 owner gate PR/main push path filters must match");
}

test("CV04 Owner release gate PR and main-push source paths stay symmetric", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  verifyCoverage(workflow);
  console.log("CV04_OWNER_RELEASE_GITHUB_PUSH_PATH_PARITY_PASS");
});

test("missing upstream authority gate path on main push fails closed", () => {
  const workflow = readFileSync(workflowPath, "utf8");
  const pushStart = workflow.indexOf("  push:\n");
  const issueStart = workflow.indexOf("  issues:\n", pushStart);
  assert.ok(pushStart >= 0 && issueStart > pushStart);
  const section = workflow.slice(pushStart, issueStart);
  const entry = `      - "${upstreamGatePath}"\n`;
  assert.ok(section.includes(entry), "baseline push must watch upstream gate");
  const broken = workflow.slice(0, pushStart) + section.replace(entry, "") + workflow.slice(issueStart);
  assert.throws(() => verifyCoverage(broken), /CV04 owner gate PR\/main push path filters must match/);
  console.log("CV04_OWNER_RELEASE_MISSING_PUSH_PATH_FAILCLOSED_PASS");
});

const cv03OwnerReleaseWorkflowPath =
  ".github/workflows/cv03-n105c09-owner-release-evidence.yml";

function verifyCv03OwnerReleaseCoverage(workflow) {
  const pr = triggerPaths(workflow, "pull_request", "push");
  const push = triggerPaths(workflow, "push", "issues");
  for (const path of [
    "manager/service.ts",
    "manager/store.ts",
    "contracts/platform-services.ts",
    "providers/authorization/runtime.ts",
    "providers/enterprise-context/resources-postgres.ts",
    "providers/enterprise-context/package.ts"
  ]) {
    assert.ok(pr.includes(path), `CV03 must monitor ${path}`);
  }
  assert.deepEqual(push, pr, "CV03 Owner gate PR/main push path filters must match");
}

test("CV03 Owner release gate PR and main-push authorization paths stay symmetric", () => {
  const workflow = readFileSync(cv03OwnerReleaseWorkflowPath, "utf8");
  verifyCv03OwnerReleaseCoverage(workflow);
  console.log("CV03_OWNER_RELEASE_GITHUB_PUSH_PATH_PARITY_PASS");
});

test("removing PA05 lifecycle or AuthorizationProvider from main push is RED", () => {
  const workflow = readFileSync(cv03OwnerReleaseWorkflowPath, "utf8");
  const pushStart = workflow.indexOf("  push:\n");
  const issueStart = workflow.indexOf("  issues:\n", pushStart);
  assert.ok(pushStart >= 0 && issueStart > pushStart);
  const original = workflow.slice(pushStart, issueStart);
  for (const path of ["manager/service.ts", "providers/authorization/runtime.ts"]) {
    const entry = `      - "${path}"\n`;
    assert.ok(original.includes(entry), `missing baseline ${path}`);
    const broken = workflow.slice(0, pushStart) + original.replace(entry, "") +
      workflow.slice(issueStart);
    assert.throws(
      () => verifyCv03OwnerReleaseCoverage(broken),
      /CV03 Owner gate PR\/main push path filters must match/,
      `mutation should fail: ${path}`
    );
  }
  console.log("CV03_OWNER_RELEASE_LIFECYCLE_PROVIDER_PUSH_OMISSION_RED_PASS");
});
