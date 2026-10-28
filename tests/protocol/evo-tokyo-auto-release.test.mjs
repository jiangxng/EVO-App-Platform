import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/evo-tokyo-dev-deploy.yml", "utf8");

test("Tokyo preview only deploys trusted protected main after successful CI or manual recovery", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /workflows: \["Project Continuity CI"\]/);
  assert.match(workflow, /branches: \[main\]/);
  assert.doesNotMatch(workflow, /^  push:/m, "do not reintroduce duplicate push deployment");
  assert.match(workflow, /github\.event\.workflow_run\.head_repository\.full_name == github\.repository/);
  assert.match(workflow, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /github\.event\.workflow_run\.head_branch == 'main'/);
  assert.match(workflow, /github\.event\.workflow_run\.head_sha \|\| github\.sha/);
  assert.match(workflow, /gh api "repos\/\$GITHUB_REPOSITORY\/branches\/main" --jq \.commit\.sha/);
  assert.match(workflow, /EVO_TOKYO_MAIN_CI_VERIFIED/);
  assert.match(workflow, /select\(\.name == "lightweight-host" and \.conclusion == "success"\)/);
  assert.match(workflow, /select\(\.name == "continuity" and \.conclusion == "success"\)/);
  assert.match(workflow, /select\(\.name == "protocol-and-core"\)/);
  assert.match(workflow, /EVO_TOKYO_SKIP_NON_RUNTIME_CHANGE/);
  assert.match(workflow, /should_deploy=false/);
  assert.match(workflow, /if: needs\.preflight\.outputs\.should_deploy == 'true'/);
  assert.match(workflow, /concurrency:[\s\S]*?group: evo-tokyo-dev-deploy/);
});

test("Tokyo immutable release uses preflight SHA throughout and retains existing rollback/security boundaries", () => {
  assert.match(workflow, /ref: \$\{\{ needs\.preflight\.outputs\.target_sha \}\}/);
  assert.match(workflow, /tags: ghcr\.io\/jiangxng\/evo-app-platform:\$\{\{ env\.TARGET_SHA \}\}/);
  assert.match(workflow, /evo-deploy@43\.167\.252\.197 bash -s -- "\$TARGET_SHA"/);
  assert.doesNotMatch(workflow, /bash -s -- "\$GITHUB_SHA"/);
  assert.match(workflow, /npm run test:platform/);
  assert.match(workflow, /\.last-health-pass-sha/);
  assert.match(workflow, /RESTORING_PREVIOUS_LOCAL_HEALTH_PASS/);
  assert.match(workflow, /EVO_TOKYO_DEV_LOCAL_HEALTH_PASS/);
  assert.match(workflow, /EVO_TOKYO_PUBLIC_HTTPS_HEALTH_PASS/);
  assert.match(workflow, /EVO_TOKYO_BASIC_AUTH_BOUNDARY_PASS/);
  assert.match(workflow, /Remove temporary SSH credentials from runner/);
});
