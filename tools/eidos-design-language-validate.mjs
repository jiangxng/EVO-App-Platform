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
  enterpriseAgentExperienceAssets,
  enterpriseAgentPackage
} from "../dist/agents/enterprise-agent/package.js";
import {
  createPersonalAgentChatPageV020,
  createPersonalAgentSetupPageV010
} from "../dist/manager/personal-agent-experience.js";

const problems = [];
const root = process.cwd();
const shellPath = join(root, "manager", "app-host-shell.ts");
const clientPath = join(root, "manager", "app-host-client.ts");
const helpPath = join(root, "manager", "help-system.ts");
const personalAgentExperiencePath = join(root, "manager", "personal-agent-experience.ts");
const shell = readFileSync(shellPath, "utf8");
const client = readFileSync(clientPath, "utf8");
const help = readFileSync(helpPath, "utf8");
const personalAgentExperience = readFileSync(personalAgentExperiencePath, "utf8");

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

for (const source of [client, help, personalAgentExperience]) {
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

const personalAgentHome = enterpriseAgentExperienceAssets.get("app://enterprise-agent/pages/home");
if (!personalAgentHome || personalAgentHome.kind !== "chat" || personalAgentHome.contractVersion !== "0.2.0") {
  problems.push("Personal Agent home must use Eidos chat@0.2.0.");
}

const personalAgentBundles = enterpriseAgentPackage.features[0].contributions
  .filter(contribution => contribution.kind === "eidos.localization-bundle")
  .map(contribution => contribution.bundle.locale)
  .sort();
for (const locale of ["en", "zh-CN", "ja", "zh-TW"]) {
  if (!personalAgentBundles.includes(locale)) {
    problems.push("Personal Agent is missing required localization bundle: " + locale);
  }
}

const sampleContext = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:design-gate"
  },
  activeContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:design-gate"
  }
};
const sampleReadiness = {
  contractVersion: "0.1.0",
  state: "setup-required",
  code: "LLM_PROVIDER_MISSING",
  providerIds: [],
  setupRoute: "/enterprise-agent/setup"
};
const dynamicChat = createPersonalAgentChatPageV020(sampleReadiness, sampleContext, "en");
if (dynamicChat.kind !== "chat" || dynamicChat.contractVersion !== "0.2.0") {
  problems.push("Dynamic Personal Agent surface must materialize as Eidos chat@0.2.0.");
}
const setup = createPersonalAgentSetupPageV010(sampleReadiness, "en");
if (setup.kind !== "setup-flow" || setup.contractVersion !== "0.1.0") {
  problems.push("Personal Agent setup must materialize as Eidos setup-flow@0.1.0.");
}
if (!setup.steps.length || setup.steps[0].primaryAction?.type !== "navigate") {
  problems.push("Personal Agent setup must use declarative Eidos navigation/actions.");
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
  personalAgent: {
    home: "chat@0.2.0",
    setup: "setup-flow@0.1.0",
    locales: personalAgentBundles
  }
}, null, 2));
