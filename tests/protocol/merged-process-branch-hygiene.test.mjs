import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(
  new URL("../../.github/workflows/branch-hygiene.yml", import.meta.url),
  "utf8"
);

test("Merged process PRs retire through one guarded workflow, regardless of workstream", () => {
  const job = workflow.split("  retire-merged-pr-safe:\n")[1];
  assert.ok(job, "merged-PR cleanup job must exist");
  assert.match(job, /github\.event\.pull_request\.merged == true/);
  assert.match(job, /p\.base\?\.ref!=='main'/);
  assert.match(job, /p\.head\?\.repo\?\.full_name!==fullName/);
  assert.match(job, /const expected=p\.head\.sha/);
  assert.match(job, /getRef\(\{owner,repo,ref:'heads\/'\+name\}\)/);
  assert.match(job, /if\(b\.protected\)/);
  assert.match(job, /open\.some\(pr=>pr\.base\.ref===name/);
  assert.match(job, /cmp\.behind_by!==0\|\|cmp\.merge_base_commit\?\.sha!==expected/);
  assert.match(job, /if\(await current\(\)!==expected\)/);
  assert.match(job, /github\.rest\.git\.deleteRef/);
  assert.doesNotMatch(job, /agentName/);
});
