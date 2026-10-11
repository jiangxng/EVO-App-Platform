import test from "node:test";
import assert from "node:assert/strict";

import {
  eidosMobileDesignLanguageV010
} from "../../dist/vendor/eidos/src/design-language/mobile.js";
import {
  eidosTextScalePreferencesV010,
  normalizeEidosTextScalePreferenceV010
} from "../../dist/vendor/eidos/src/design-language/typography.js";
import {
  eidosDesignPolicyV010
} from "../../dist/vendor/eidos/src/design-language/policy.js";
import {
  appHostShellCss,
  appHostShellHtml
} from "../../dist/manager/app-host-shell.js";

test("EVO consumes the normative Eidos mobile design language", () => {
  assert.equal(eidosMobileDesignLanguageV010.contractVersion, "0.1.0");
  assert.equal(eidosMobileDesignLanguageV010.navigation.primaryPlacement, "bottom");
  assert.equal(eidosMobileDesignLanguageV010.content.primaryFlow, "single-column");
  assert.equal(eidosMobileDesignLanguageV010.plugin.customMobileShellForbidden, true);
  assert.equal(eidosMobileDesignLanguageV010.plugin.customBreakpointForbidden, true);
  assert.equal(eidosDesignPolicyV010.plugin.inheritResponsiveRealization, true);
  assert.equal(eidosMobileDesignLanguageV010.typography.defaultPreference, "system");
  assert.deepEqual(eidosMobileDesignLanguageV010.typography.userScalePresets, ["system", "small", "standard", "large"]);
});

test("EVO shell receives phone realization from Eidos rather than Host CSS", () => {
  assert.match(appHostShellCss, /Eidos Mobile Design Language v0\.1 reference realization/);
  assert.match(appHostShellCss, /--eidos-mobile-nav-height:64px/);
  assert.match(appHostShellCss, /data-eidos-status-bar\]\{display:none\}/);
  assert.match(appHostShellCss, /data-eidos-account-menu/);
});


test("EVO phone typography follows system size with user presets layered above it", () => {
  assert.match(appHostShellHtml, /<meta name="text-scale" content="scale">/);
  assert.deepEqual(
    eidosTextScalePreferencesV010.map(item => [item.id, item.additionalScale]),
    [["system", 1], ["small", 0.9], ["standard", 1], ["large", 1.15]]
  );
  assert.equal(normalizeEidosTextScalePreferenceV010(undefined), "system");
  assert.match(appHostShellCss, /data-eidos-text-scale="small"\]\{font-size:90%\}/);
  assert.match(appHostShellCss, /data-eidos-text-scale="standard"\]\{font-size:100%\}/);
  assert.match(appHostShellCss, /data-eidos-text-scale="large"\]\{font-size:115%\}/);
  assert.match(appHostShellCss, /data-eidos-text-scale-control/);
});


test("EVO inherits the Eidos business-office visual language on desktop and mobile", () => {
  assert.equal(eidosDesignPolicyV010.visualRevision, "0.2.0");
  assert.equal(eidosDesignPolicyV010.visualLanguage.name, "Eidos Business Office");
  assert.equal(eidosDesignPolicyV010.visualLanguage.developerConsoleAsDefault, false);
  assert.equal(eidosDesignPolicyV010.workbench.statusBar.defaultVisibility, "hidden");
  assert.equal(eidosDesignPolicyV010.workbench.workspace.internalRouteAddress, "not-rendered-in-standard-business-workbench");
  assert.equal(eidosDesignPolicyV010.toolbar.technicalAddress, "separate-explicit-capability-only");
  assert.equal(eidosDesignPolicyV010.mobile.primaryNavigationLabels, "visible");
  assert.match(appHostShellCss, /Eidos Business Office Visual Language v0\.2/);
  assert.match(appHostShellCss, /--eidos-primary:#2B6CB0/);
  assert.match(appHostShellCss, /--eidos-bg-selected:#EAF2FB/);
  assert.match(appHostShellCss, /data-eidos-workspace-mode="app"/);
  assert.match(appHostShellCss, /data-eidos-activity-label/);
});


test("standard business Workbench omits browser address controls", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(new URL("../../vendor/eidos/src/workbench/shell.ts", import.meta.url), "utf8")
  );
  assert.doesNotMatch(source, /data-eidos-browser-address/);
  assert.doesNotMatch(source, /data-eidos-browser-go/);
  assert.doesNotMatch(source, /data-eidos-browser-external/);
  assert.doesNotMatch(source, /\bbrowserAddress\b|\bbrowserGo\b|\bbrowserExternal\b/);
  assert.match(source, /browserToolbar\.append\(globalControls\)/);
});
