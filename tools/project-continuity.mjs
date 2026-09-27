import {
  existsSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const statusPath = resolve(root, "project.status.json");
const handoffPath = resolve(root, "docs/roadmap/HANDOFF-LATEST.md");
const bootstrapPath = resolve(root, "AI-BOOTSTRAP.md");
const llmPath = resolve(root, "LLM.md");

function fail(message) {
  console.error(`PROJECT_CONTINUITY_INVALID: ${message}`);
  process.exitCode = 1;
}

function requireFile(path, label) {
  if (!existsSync(path)) {
    fail(`${label} missing at ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

const statusText = requireFile(statusPath, "project.status.json");
const bootstrap = requireFile(bootstrapPath, "AI-BOOTSTRAP.md");
const llm = requireFile(llmPath, "LLM.md");

let status;
try {
  status = JSON.parse(statusText);
} catch (error) {
  fail(`project.status.json is not valid JSON: ${error}`);
  process.exit();
}

const continuity = status.projectContinuity;
if (!continuity || continuity.schemaVersion !== "0.1.0") {
  fail("project.status.json.projectContinuity@0.1.0 is required");
  process.exit();
}

const expectedStartup = [
  "AI-BOOTSTRAP.md",
  "project.status.json",
  "docs/roadmap/HANDOFF-LATEST.md",
  "LLM.md",
  "llm.foundation-map.json"
];

if (status.handoff !== "docs/roadmap/HANDOFF-LATEST.md") {
  fail("project.status.json.handoff must point to docs/roadmap/HANDOFF-LATEST.md");
}

if (continuity.currentHandoff !== status.handoff) {
  fail("projectContinuity.currentHandoff must equal project.status.json.handoff");
}

if (
  JSON.stringify(continuity.freshSessionStartup) !== JSON.stringify(expectedStartup)
) {
  fail("projectContinuity.freshSessionStartup must use the canonical bootstrap order");
}

if (continuity.current?.milestone !== status.currentMilestone) {
  fail("projectContinuity.current.milestone must equal currentMilestone");
}

if (!Number.isFinite(Date.parse(continuity.snapshotAt))) {
  fail("projectContinuity.snapshotAt must be an ISO date");
}

if (
  continuity.current?.productionPreview?.commit
  !== status.experienceCheckpointP1_4X?.liveDeployment?.commit
) {
  fail("production preview commit must match experienceCheckpointP1_4X.liveDeployment.commit");
}

if (
  continuity.current?.productionPreview?.deploymentId
  !== status.experienceCheckpointP1_4X?.liveDeployment?.deploymentId
) {
  fail("production preview deploymentId must match experienceCheckpointP1_4X.liveDeployment.deploymentId");
}

if (
  continuity.current?.lastClosedLiveSlice?.id === "context-memory-canonicalization"
  && status.experienceCheckpointP1_4X?.canonicalization?.status !== "LIVE_PASS"
) {
  fail("canonicalization continuity slice requires experienceCheckpointP1_4X.canonicalization.status=LIVE_PASS");
}

if (!Array.isArray(continuity.doNotRepeat) || continuity.doNotRepeat.length < 1) {
  fail("projectContinuity.doNotRepeat must contain at least one explicit stale-action guard");
}

for (const required of expectedStartup) {
  if (!bootstrap.includes(required)) {
    fail(`AI-BOOTSTRAP.md must reference ${required}`);
  }
}

if (!llm.includes("AI-BOOTSTRAP.md")) {
  fail("LLM.md must require AI-BOOTSTRAP.md for fresh sessions");
}
if (!llm.includes("docs/roadmap/HANDOFF-LATEST.md")) {
  fail("LLM.md must reference the stable HANDOFF-LATEST.md");
}

function bullets(values) {
  return values.map(value => `- ${value}`).join("\n");
}

function renderHandoff() {
  const current = continuity.current;
  const closed = current.lastClosedLiveSlice;
  const open = current.openGate;
  const deployment = current.productionPreview;
  const recent = continuity.recentMainline ?? [];
  const doNotRepeat = continuity.doNotRepeat ?? [];
  const acceptance = continuity.freshSessionAcceptance ?? [];

  return `# Handoff — Current Mainline

> **GENERATED CURRENT STATE.** Source of truth: \`project.status.json\`.  
> Do not hand-edit this file. Run \`npm run continuity:render\` after changing the structured continuity snapshot.

**Snapshot:** \`${continuity.snapshotId}\`  
**Snapshot time:** \`${continuity.snapshotAt}\`  
**Status:** \`${continuity.status}\`

## Current milestone

\`\`\`text
${current.milestone}
${current.milestoneStatus}
\`\`\`

## Latest closed live slice

**${closed.id}: ${closed.status}**

${closed.summary}

Authority: \`${closed.authority}\`

Evidence:

\`\`\`json
${JSON.stringify(closed.evidence ?? {}, null, 2)}
\`\`\`

## Current open live gate

**${open.id}: ${open.status}**

${open.summary}

Acceptance:

${bullets(open.acceptance ?? [])}

## Current production preview

- Platform: ${deployment.platform}
- Project: ${deployment.project}
- Service: ${deployment.service}
- Environment: ${deployment.environment}
- Source: \`${deployment.source}\`
- Commit: \`${deployment.commit}\`
- Deployment: \`${deployment.deploymentId}\`
- Status: \`${deployment.status}\`
- Persistent state: \`${deployment.persistentStateMount}\`

## Recent mainline changes

${recent.map(item => `- PR #${item.pr} — ${item.status}: ${item.summary}`).join("\n")}

## DO NOT repeat stale actions

${bullets(doNotRepeat)}

## Fresh ChatGPT / LLM startup

A fresh session must read, in order:

${expectedStartup.map((item, index) => `${index + 1}. \`${item}\``).join("\n")}

The repository state wins over ChatGPT Memory, model memory, prior assistant summaries and dated handoff guesses.

A dated handoff is historical evidence unless \`project.status.json.handoff\` points to it.

## Fresh-session continuity acceptance

A new ChatGPT / LLM session is project-continuous only if it can do all of the following after the startup read:

${bullets(acceptance)}

No previous ChatGPT transcript is required.

## State-layer distinction

\`\`\`text
Conversation History
= current-chat discourse continuity

ChatGPT / model Memory
= selective cross-chat assistance, not authoritative project state

Context Memory
= governed product-level durable knowledge

Project Status + HANDOFF-LATEST
= authoritative engineering-project continuity

Host READ
= current runtime/platform truth
\`\`\`
`;
}

const rendered = renderHandoff();
const mode = process.argv[2] ?? "--check";

if (mode === "--write") {
  writeFileSync(handoffPath, rendered, "utf8");
  console.log(`PROJECT_CONTINUITY_RENDERED: ${continuity.snapshotId}`);
} else if (mode === "--check") {
  const currentHandoff = requireFile(handoffPath, "HANDOFF-LATEST.md");
  if (currentHandoff !== rendered) {
    fail("HANDOFF-LATEST.md is stale; run npm run continuity:render and commit the result");
  }
} else {
  fail(`unknown mode '${mode}', use --check or --write`);
}

if (!process.exitCode) {
  console.log([
    "PROJECT_CONTINUITY_PASS",
    `snapshot=${continuity.snapshotId}`,
    `milestone=${current.milestone}`,
    `closed=${current.lastClosedLiveSlice.id}:${current.lastClosedLiveSlice.status}`,
    `open=${current.openGate.id}:${current.openGate.status}`,
    `deploy=${current.productionPreview.commit}`
  ].join(" "));
}
