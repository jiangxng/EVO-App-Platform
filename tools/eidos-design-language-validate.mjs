#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { resolveEidosIconName } from "../dist/vendor/eidos/src/design-language/icons/icon-system.js";
import {
  createHelpIndexPageV010,
  loadHelpCorpusV010,
  materializeHelpDocumentV010
} from "../dist/manager/help-system.js";

const problems = [];
const root = process.cwd();
const shellPath = join(root, "manager", "app-host-shell.ts");
const clientPath = join(root, "manager", "app-host-client.ts");
const helpPath = join(root, "manager", "help-system.ts");
const agentPackagePath = join(root, "agents", "enterprise-agent", "package.ts");
const agentProductPagesPath = join(root, "agents", "enterprise-agent", "product-pages.ts");
const pluginStorePath = join(root, "manager", "plugin-store-page.ts");
const eidosManifestPath = join(root, "vendor", "eidos", "source.manifest.json");
const shell = readFileSync(shellPath, "utf8");
const client = readFileSync(clientPath, "utf8");
const help = readFileSync(helpPath, "utf8");
const agentPackage = readFileSync(agentPackagePath, "utf8");
const agentProductPages = readFileSync(agentProductPagesPath, "utf8");
const pluginStore = readFileSync(pluginStorePath, "utf8");
const eidosManifest = JSON.parse(readFileSync(eidosManifestPath, "utf8"));

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


const expectedEidosCommit = "12f61d5a02011a5f974beac8e0fda8c34f81e142";
if (eidosManifest.sourceCommit !== expectedEidosCommit) {
  problems.push(
    "Personal Agent P0.4 requires the CI-verified Eidos Assistant/Setup baseline "
      + expectedEidosCommit
      + "; found "
      + String(eidosManifest.sourceCommit)
  );
}

if (!agentPackage.includes('contractVersion: "0.2.0"') || !agentPackage.includes('kind: "chat"')) {
  problems.push("Personal Agent home Experience must use Eidos Chat v0.2.");
}
if (!agentPackage.includes('kind: "setup-flow"') || !agentPackage.includes('PERSONAL_AGENT_SETUP_PAGE_SOURCE')) {
  problems.push("Personal Agent setup must use Eidos setup-flow instead of a bespoke setup UI.");
}
for (const locale of ["en", "zh-CN", "ja", "zh-TW"]) {
  if (!agentPackage.includes(`localizationBundle("${locale}"`)) {
    problems.push("Personal Agent must ship first-class locale bundle: " + locale);
  }
}
if (!agentProductPages.includes("createPersonalAgentChatPageV020")
  || !agentProductPages.includes("createPersonalAgentSetupPageV010")) {
  problems.push("Personal Agent readiness must materialize through Eidos Chat v0.2 and Setup Flow.");
}
if (!pluginStore.includes("evaluateProductReadiness")
  || !pluginStore.includes("technicalDetailsLabel")) {
  problems.push("Plugin Store must expose readiness separately and keep technical details behind Eidos progressive disclosure.");
}
for (const source of [agentPackage, agentProductPages]) {
  if (/<style\b|<svg\b|<button\b|<input\b|\sstyle\s*=/i.test(source)) {
    problems.push("Personal Agent must not own CSS/raw controls; reusable visual realization belongs to Eidos.");
    break;
  }
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
  personalAgentChat: "chat@0.2.0",
  personalAgentSetup: "setup-flow@0.1.0",
  personalAgentLocales: ["en", "zh-CN", "ja", "zh-TW"],
  eidosSourceCommit: eidosManifest.sourceCommit
}, null, 2));
