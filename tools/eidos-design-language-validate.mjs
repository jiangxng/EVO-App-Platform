#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { resolveEidosIconName } from "../dist/vendor/eidos/src/design-language/icons/icon-system.js";
import { eidosProductiveWorkbenchCss } from "../dist/vendor/eidos/src/design-language/productive-workbench-css.js";
import {
  createHelpIndexPageV010,
  loadHelpCorpusV010,
  materializeHelpDocumentV010
} from "../dist/manager/help-system.js";

const problems = [];
const root = process.cwd();
const shellPath = join(root, "manager", "app-host-shell.ts");
const clientPath = join(root, "manager", "app-host-client.ts");
const desktopRuntimePath = join(root, "manager", "desktop-workbench-runtime.ts");
const helpPath = join(root, "manager", "help-system.ts");
const shell = readFileSync(shellPath, "utf8");
const client = readFileSync(clientPath, "utf8");
const desktopRuntime = readFileSync(desktopRuntimePath, "utf8");
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

for (const source of [client, desktopRuntime, help]) {
  if (/<svg\b|<button\b|<input\b|\sstyle\s*=/i.test(source)) {
    problems.push("App Platform Help/Workbench code must declare Eidos semantics instead of raw visual controls.");
    break;
  }
}

const iconNames = [
  ...client.matchAll(/\bicon:\s*"([^"]+)"/g),
  ...desktopRuntime.matchAll(/\bicon:\s*"([^"]+)"/g)
].map(match => match[1]);
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
for (const selector of [
  "data-eidos-review-queue",
  "data-eidos-review-technical",
  "data-eidos-review-actions"
]) {
  if (!eidosProductiveWorkbenchCss.includes(selector)) {
    problems.push("Vendored Eidos must provide first-class Review / Decision styling: " + selector);
  }
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
if (
  !desktopRuntime.includes('id: "help"')
  || !desktopRuntime.includes('icon: "help"')
  || !desktopRuntime.includes('kind: "side-route"')
) {
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
  reviewDecisionPattern: true,
  managerCssFiles: 0
}, null, 2));
