#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { resolveEidosIconName } from "../dist/vendor/eidos/src/design-language/icons/icon-system.js";
import { eidosProductiveWorkbenchCss } from "../dist/vendor/eidos/src/design-language/productive-workbench-css.js";
import { eidosMobileDesignLanguageV010 } from "../dist/vendor/eidos/src/design-language/mobile.js";
import { appHostShellCss } from "../dist/manager/app-host-shell.js";
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
if (!shell.includes("/manager/app-host-shell.css")) {
  problems.push("App Host shell must reference the revisioned shell stylesheet asset.");
}
if (!shell.includes('<meta name="text-scale" content="scale">')) {
  problems.push("App Host shell must opt into OS/browser system text scaling.");
}
if (appHostShellCss !== eidosProductiveWorkbenchCss) {
  problems.push("App Host shell CSS asset must remain exactly the Eidos Productive Workbench stylesheet.");
}
if (/<style\b/i.test(shell) || /\sstyle\s*=/.test(shell)) {
  problems.push("App Platform shell must not embed parallel CSS or inline style attributes.");
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

const pluginCss = findCssFiles(join(root, "apps"));
if (pluginCss.length) {
  problems.push("EVO plugins own private CSS instead of using Eidos responsive realization: " + pluginCss.join(", "));
}

if (
  eidosMobileDesignLanguageV010.contractVersion !== "0.1.0"
  || eidosMobileDesignLanguageV010.plugin.customMobileShellForbidden !== true
  || eidosMobileDesignLanguageV010.plugin.customBreakpointForbidden !== true
) {
  problems.push("Vendored Eidos must expose the normative Mobile Design Language v0.1 plugin contract.");
}
for (const mobileMarker of [
  "--eidos-mobile-nav-height:56px",
  "Eidos Mobile Design Language v0.1 reference realization",
  '[data-eidos-status-bar]{display:none}',
  "[data-eidos-account-menu]"
]) {
  if (!eidosProductiveWorkbenchCss.includes(mobileMarker)) {
    problems.push("Vendored Eidos mobile realization is incomplete: " + mobileMarker);
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
if (
  !desktopRuntime.includes('id: "help"')
  || !desktopRuntime.includes('icon: "help"')
  || !desktopRuntime.includes('kind: "side-route"')
) {
  problems.push("Workbench Help must remain an Eidos secondary side-route Activity with semantic help icon.");
}

if (
  !desktopRuntime.includes('window.localStorage.getItem("evo.textScale")')
  || !desktopRuntime.includes("applyEidosTextScalePreferenceV010")
  || !desktopRuntime.includes('"system", zh ? "跟随系统"')
  || !desktopRuntime.includes('"small", zh ? "小"')
  || !desktopRuntime.includes('"standard", zh ? "标准"')
  || !desktopRuntime.includes('"large", zh ? "大"')
) {
  problems.push("Workbench must expose the Eidos system/small/standard/large text-size preference.");
}

if (problems.length) {
  console.error("Eidos Design Language validation failed:");
  for (const problem of problems) console.error("- " + problem);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  authority: "Eidos Productive Design Language v0.1",
  mobileAuthority: "Eidos Mobile Design Language v0.1",
  shellCssOwner: "Eidos",
  workbenchIcons: iconNames,
  helpNavigator: index.kind,
  helpArticle: document.kind,
  rawHostControls: false,
  reviewDecisionPattern: true,
  managerCssFiles: 0,
  pluginCssFiles: 0,
  privateMobileShells: false,
  systemTextScale: true,
  userTextScalePresets: ["system", "small", "standard", "large"]
}, null, 2));
