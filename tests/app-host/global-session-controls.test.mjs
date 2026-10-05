import test from "node:test";
import assert from "node:assert/strict";

import {
  currentUserDisplayNameV010
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
  assert.match(appHostShellCss, /data-evo-context-select/);
  assert.match(appHostShellCss, /data-evo-current-user/);
  assert.match(appHostShellCss, /data-eidos-global-controls/);
});
