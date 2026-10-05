import test from "node:test";
import assert from "node:assert/strict";

import {
  eidosMobileDesignLanguageV010
} from "../../dist/vendor/eidos/src/design-language/mobile.js";
import {
  eidosDesignPolicyV010
} from "../../dist/vendor/eidos/src/design-language/policy.js";
import {
  appHostShellCss
} from "../../dist/manager/app-host-shell.js";

test("EVO consumes the normative Eidos mobile design language", () => {
  assert.equal(eidosMobileDesignLanguageV010.contractVersion, "0.1.0");
  assert.equal(eidosMobileDesignLanguageV010.navigation.primaryPlacement, "bottom");
  assert.equal(eidosMobileDesignLanguageV010.content.primaryFlow, "single-column");
  assert.equal(eidosMobileDesignLanguageV010.plugin.customMobileShellForbidden, true);
  assert.equal(eidosMobileDesignLanguageV010.plugin.customBreakpointForbidden, true);
  assert.equal(eidosDesignPolicyV010.plugin.inheritResponsiveRealization, true);
});

test("EVO shell receives phone realization from Eidos rather than Host CSS", () => {
  assert.match(appHostShellCss, /Eidos Mobile Design Language v0\.1 reference realization/);
  assert.match(appHostShellCss, /--eidos-mobile-nav-height:56px/);
  assert.match(appHostShellCss, /data-eidos-status-bar\]\{display:none\}/);
  assert.match(appHostShellCss, /data-eidos-account-menu/);
});
