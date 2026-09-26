#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { resolveEidosIconName } from "../dist/vendor/eidos/src/design-language/icons/icon-system.js";
import {
  createHelpIndexPageV010,
  loadHelpCorpusV010,
  materializeHelpDocumentV010
} from "../dist/manager/help-system.js";
import {
  ENTERPRISE_AGENT_PAGE_SOURCE,
  ENTERPRISE_AGENT_SETUP_PAGE_SOURCE,
  enterpriseAgentExperienceAssets,
  enterpriseAgentPackage
} from "../dist/agents/enterprise-agent/package.js";

const problems = [];
const root = process.cwd();
const shellPath = join(root, "manager", "app-host-shell.ts");
const clientPath = join(root, "manager", "app-host-client.ts");
const helpPath = join(root, "manager", "help-system.ts");
const shell = readFileSync(shellPath, "utf8");
const client = readFileSync(clientPath, "utf8");
const help = readFileSync(helpPath, "utf8");

if (!shell.includes('eidosProductiveWorkbenchCss')) {
  problems.push("App Host shell must consume eidosProductiveWorkbenchCss.");
}
if (!shell.includes('<style>${eidosProductiveWorkbenchCss}</style>')) {
  problems.push("App Host shell style surface must be the Eidos Productive Workbench stylesheet.");
}
const shellWithoutEidosStyle = shell.replace('<style>${eidosProductiveWorkbenchCss}</style>', "");
if (/<style\b/i.test(shellWithoutEidosStyle) || /\sstyle\s*=/.test(shellWithoutEidosStyle)) {
  problems.push("App Platform must not add parallel shell CSS or inline style attributes.");
}

for (const source of [client, help]) {
  if (/<svg\b|<button\b|<input\b|\sstyle\s*=/i.test(source)) {
    problems.push("App Platform Help/Workbench code must declare Eidos semantics instead of raw visual controls.");
    break;
  }
}

const iconNames = [...client.matchAll(/\bicon:\s*"([^"]+)"/g)].map(match => match[1]);
for (const icon of iconNames) {
  if (!resolveEidosIconName(icon)) {
    problems.push("Workbench Activity uses non-Eidos semantic icon: " + icon);
  }
}

function findCssFiles(path) {
  const result = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) result.push(...findCssFiles(child));
    else if (entry.isFile() && entry.name.endsWith(".css")) result.push(child);
  }
  return result;
}
const managerCss = findCssFiles(join(root, "manager"));
if (managerCss.length) {
  problems.push("App Platform manager owns CSS files instead of delegating visual realization to Eidos: " + managerCss.join(", "));
}

const corpus = loadHelpCorpusV010();
const index = createHelpIndexPageV010(corpus, "zh-CN");
if (index.kind !== "catalog-browser") {
  problems.push("Help index must use Eidos catalog-browser.");
}
const document = materializeHelpDocumentV010(corpus, "evo.workbench.overview", "zh-CN");
if (!document || document.kind !== "help-document") {
  problems.push("Help articles must materialize as Eidos help-document.");
}
if (!client.includes('id: "help"') || !client.includes('icon: "help"') || !client.includes('kind: "side-route"')) {
  problems.push("Workbench Help must remain an Eidos secondary side-route Activity with semantic help icon.");
}


const agentHome = enterpriseAgentExperienceAssets.get(ENTERPRISE_AGENT_PAGE_SOURCE);
if (
  !agentHome
  || agentHome.kind !== "chat"
  || agentHome.contractVersion !== "0.2.0"
) {
  problems.push("Personal Agent must use Eidos Chat v0.2.");
}
const agentSetup = enterpriseAgentExperienceAssets.get(ENTERPRISE_AGENT_SETUP_PAGE_SOURCE);
if (
  !agentSetup
  || agentSetup.kind !== "setup-flow"
  || agentSetup.contractVersion !== "0.1.0"
) {
  problems.push("Personal Agent setup must use Eidos setup-flow v0.1.");
}

const agentBundles = enterpriseAgentPackage.features
  .flatMap(feature => feature.contributions ?? [])
  .filter(contribution => contribution.kind === "eidos.localization-bundle")
  .map(contribution => contribution.bundle.locale)
  .sort();
const requiredAgentLocales = ["en", "ja", "zh-CN", "zh-TW"];
if (JSON.stringify(agentBundles) !== JSON.stringify(requiredAgentLocales)) {
  problems.push(
    "Personal Agent P0.4 must ship exactly the required four locale bundles: "
    + requiredAgentLocales.join(", ")
  );
}

const agentSource = readdirSync(join(root, "agents", "enterprise-agent"), { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith(".ts"))
  .map(entry => readFileSync(join(root, "agents", "enterprise-agent", entry.name), "utf8"))
  .join("\n");
if (/<svg\b|<button\b|<input\b|<style\b|\sstyle\s*=/i.test(agentSource)) {
  problems.push("Personal Agent must declare Eidos semantics instead of owning raw visual controls or CSS.");
}

const eidosManifest = JSON.parse(
  readFileSync(join(root, "vendor", "eidos", "source.manifest.json"), "utf8")
);
if (
  !Array.isArray(eidosManifest.files)
  || !eidosManifest.files.includes("src/setup-flow/contracts.ts")
  || !eidosManifest.files.includes("src/setup-flow/render.ts")
) {
  problems.push("Vendored Eidos baseline must include the Setup Flow capability.");
}

if (problems.length) {
  console.error("Eidos Design Language validation failed:");
  for (const problem of problems) console.error("- " + problem);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  authority: "Eidos Productive Design Language v0.1",
  shellCssOwner: "Eidos",
  workbenchIcons: iconNames,
  helpNavigator: index.kind,
  helpArticle: document.kind,
  rawHostControls: false,
  managerCssFiles: 0,
  personalAgentChat: agentHome?.contractVersion,
  personalAgentSetup: agentSetup?.kind,
  personalAgentLocales: agentBundles,
  eidosSourceCommit: eidosManifest.sourceCommit
}, null, 2));
