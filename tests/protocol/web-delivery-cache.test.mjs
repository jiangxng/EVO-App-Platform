import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeAssetRevisionV010,
  resolveBrowserAssetRequestV010
} from "../../dist/manager/web-delivery-cache.js";
import {
  createAppHostShellHtmlV010
} from "../../dist/manager/app-host-shell.js";

test("versioned browser assets are immutable while legacy URLs revalidate", () => {
  const revision = normalizeAssetRevisionV010("f154450b4cef");
  assert.equal(revision, "f154450b4cef");

  assert.deepEqual(
    resolveBrowserAssetRequestV010(
      "/assets/f154450b4cef/manager/app-host-client.js",
      revision
    ),
    {
      assetPath: "manager/app-host-client.js",
      revisioned: true,
      cacheControl: "public, max-age=31536000, immutable"
    }
  );

  assert.deepEqual(
    resolveBrowserAssetRequestV010(
      "/assets/manager/app-host-client.js",
      revision
    ),
    {
      assetPath: "manager/app-host-client.js",
      revisioned: false,
      cacheControl: "public, max-age=0, must-revalidate"
    }
  );
});

test("asset resolution fails closed for traversal and non-JavaScript paths", () => {
  assert.equal(
    resolveBrowserAssetRequestV010(
      "/assets/rev/../manager/app-host-client.js",
      "rev"
    ),
    undefined
  );
  assert.equal(
    resolveBrowserAssetRequestV010("/assets/rev/app.css", "rev"),
    undefined
  );
  assert.equal(resolveBrowserAssetRequestV010("/other/app.js", "rev"), undefined);
});

test("App Host shell points at the current immutable module graph", () => {
  const html = createAppHostShellHtmlV010("deploy:revision/1");
  assert.match(
    html,
    /src="\/assets\/deploy-revision-1\/manager\/app-host-client\.js"/
  );
  assert.equal(
    html.includes('src="/assets/manager/app-host-client.js"'),
    false
  );
});

test("relative ESM imports stay inside the same asset revision namespace", () => {
  const base = new URL(
    "https://example.test/assets/rev-1/manager/app-host-client.js"
  );
  const imported = new URL("../vendor/eidos/src/workbench/index.js", base);
  assert.equal(
    imported.pathname,
    "/assets/rev-1/vendor/eidos/src/workbench/index.js"
  );
});
