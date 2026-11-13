import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CV03_N105A_SOURCE_FILES} from
  "../../tools/cv03-n105a-authority-boundary-preflight.mjs";
import {CV03_N105C09_OWNER_GATE_SOURCE_FILES} from
  "../../tools/cv03-n105c09-owner-evidence-release-gate.mjs";
import {CV04_NEXT05_RELEASE_SOURCE_FILES} from
  "../../tools/cv04-next05-production-authority-release-gate.mjs";

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

/**
 * The negative Owner gates call each other: CV04 -> CV03/N105c09 ->
 * CV03/N105a. Trigger parity alone is not enough if BOTH events omit an
 * imported source or one of the files inspected by the delegated gate.
 * Read the original exported file lists rather than maintaining a copy.
 */
const transitiveCv03SourcePaths = [...new Set([
  ...CV03_N105A_SOURCE_FILES,
  ...CV03_N105C09_OWNER_GATE_SOURCE_FILES,
  "tools/cv03-n105a-authority-boundary-preflight.mjs",
  "tools/cv03-n105c09-owner-evidence-release-gate.mjs"
])];
const transitiveCv04SourcePaths = [...new Set([
  ...transitiveCv03SourcePaths,
  ...CV04_NEXT05_RELEASE_SOURCE_FILES,
  "tools/cv04-next05-production-authority-release-gate.mjs"
])];

function assertTransitiveOwnerWorkflowCoverage(workflow, requiredPaths) {
  const pr = triggerPaths(workflow, "pull_request", "push");
  const push = triggerPaths(workflow, "push", "issues");
  assert.deepEqual(push, pr, "Owner release PR/main trigger parity");
  for (const path of requiredPaths) {
    assert.ok(pr.includes(path), `Owner gate transitive dependency missing in PR: ${path}`);
    assert.ok(push.includes(path), `Owner gate transitive dependency missing in main push: ${path}`);
  }
}

test("CV03 Owner gate watches all directly and transitively inspected sources", () => {
  assertTransitiveOwnerWorkflowCoverage(
    readFileSync(cv03OwnerReleaseWorkflowPath, "utf8"),
    transitiveCv03SourcePaths
  );
  console.log("CV03_OWNER_GATE_TRANSITIVE_SOURCE_COVERAGE_PASS");
});

test("CV04 Owner gate watches all CV03 authority and CV04 Export dependencies", () => {
  assertTransitiveOwnerWorkflowCoverage(
    readFileSync(workflowPath, "utf8"),
    transitiveCv04SourcePaths
  );
  console.log("CV04_OWNER_GATE_TRANSITIVE_SOURCE_COVERAGE_PASS");
});

test("PR/main-symmetric omissions of imported PG and Provider code fail closed", () => {
  for (const [file,required,dependency] of [
    [cv03OwnerReleaseWorkflowPath,transitiveCv03SourcePaths,
      "tools/cv03-n105a-authority-boundary-preflight.mjs"],
    [cv03OwnerReleaseWorkflowPath,transitiveCv03SourcePaths,
      "tools/cv03-n1-postgres-role-audit.mjs"],
    [workflowPath,transitiveCv04SourcePaths,
      "manager/cv03-personal-saved-view-host-admission.ts"],
    [workflowPath,transitiveCv04SourcePaths,
      "providers/authorization/runtime.ts"]
  ]) {
    const original = readFileSync(file, "utf8");
    const entry = `      - "${dependency}"\n`;
    assert.equal(original.split(entry).length - 1, 2, `both triggers must watch ${dependency}`);
    // Mimic a regression that deletes the dependency from BOTH trigger lists:
    // ordinary equality-only checks would incorrectly stay green.
    const broken = original.split(entry).join("");
    assert.throws(
      () => assertTransitiveOwnerWorkflowCoverage(broken,required),
      /Owner gate transitive dependency missing/,
      `symmetric dependency omission must fail: ${dependency}`
    );
  }
  console.log("CV03_CV04_OWNER_GATE_SYMMETRIC_DEPENDENCY_OMISSION_RED_PASS");
});
