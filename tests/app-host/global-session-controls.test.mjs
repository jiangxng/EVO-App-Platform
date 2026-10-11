import test from "node:test";
import assert from "node:assert/strict";

import {
  currentUserDisplayNameV010,
  currentUserLogoutActionV010
} from "../../dist/manager/desktop-workbench-runtime.js";
import {
  appHostShellCss
} from "../../dist/manager/app-host-shell.js";

test("current user display prefers identity displayName and falls back to subject", () => {
  assert.equal(
    currentUserDisplayNameV010({
      subjectId: "user:123",
      actorType: "HUMAN",
      identityProviderId: "oidc",
      displayName: "Alice"
    }),
    "Alice"
  );
  assert.equal(
    currentUserDisplayNameV010({
      subjectId: "user:123",
      actorType: "HUMAN",
      identityProviderId: "oidc"
    }),
    "user:123"
  );
});

test("EVO global chrome styles current enterprise and current user controls", () => {
  assert.match(appHostShellCss, /data-eidos-global-controls/);
  assert.match(appHostShellCss, /data-eidos-global-control-select/);
  assert.match(appHostShellCss, /data-eidos-account-control/);
});


test("sign out posts to the Host logout endpoint and returns to the localized login page", () => {
  assert.equal(
    currentUserLogoutActionV010("zh-CN"),
    "/auth/logout?returnTo=%2Flogin%3Flocale%3Dzh-CN"
  );
  assert.equal(
    currentUserLogoutActionV010("en-US"),
    "/auth/logout?returnTo=%2Flogin%3Flocale%3Den"
  );
});
