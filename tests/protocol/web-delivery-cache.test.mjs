import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeAssetRevisionV010,
  resolveBrowserAssetRequestV010
} from "../../dist/manager/web-delivery-cache.js";
import {
  createAppHostShellHtmlV010
} from "../../dist/manager/app-host-shell.js";
import {
  createRevisionAwareBrowserTransportV010
} from "../../dist/manager/browser-transport.js";

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
      cacheControl: "public, max-age=31536000, immutable",
      contentType: "text/javascript; charset=utf-8"
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
      cacheControl: "public, max-age=0, must-revalidate",
      contentType: "text/javascript; charset=utf-8"
    }
  );
});

test("versioned CSS shares the immutable asset namespace", () => {
  assert.deepEqual(
    resolveBrowserAssetRequestV010(
      "/assets/rev/manager/app-host-shell.css",
      "rev"
    ),
    {
      assetPath: "manager/app-host-shell.css",
      revisioned: true,
      cacheControl: "public, max-age=31536000, immutable",
      contentType: "text/css; charset=utf-8"
    }
  );
});

test("asset resolution fails closed for traversal and unsupported paths", () => {
  assert.equal(
    resolveBrowserAssetRequestV010(
      "/assets/rev/../manager/app-host-client.js",
      "rev"
    ),
    undefined
  );
  assert.deepEqual(
    resolveBrowserAssetRequestV010("/assets/rev/app.css", "rev"),
    {
      assetPath: "app.css",
      revisioned: true,
      cacheControl: "public, max-age=31536000, immutable",
      contentType: "text/css; charset=utf-8"
    }
  );
  assert.equal(
    resolveBrowserAssetRequestV010("/assets/rev/app.png", "rev"),
    undefined
  );
  assert.equal(resolveBrowserAssetRequestV010("/other/app.js", "rev"), undefined);
});

test("App Host shell points at the current immutable module graph", () => {
  const html = createAppHostShellHtmlV010("deploy:revision/1");
  assert.match(
    html,
    /href="\/assets\/deploy-revision-1\/manager\/app-host-shell\.css"/
  );
  assert.match(
    html,
    /src="\/assets\/deploy-revision-1\/manager\/app-host-client\.js"/
  );
  assert.equal(html.includes("<style>"), false);
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


test("same-origin protected 401 responses enter authentication recovery and preserve cookies", async () => {
  const previousWindow = globalThis.window;
  globalThis.window = {
    location: {
      origin: "https://evo.example",
      pathname: "/",
      search: "",
      hash: "#/definition-preview/2d/edit?definitionId=ledger%3Amain"
    }
  };

  try {
    let authenticationRequired = 0;
    let capturedInit;
    const transport = createRevisionAwareBrowserTransportV010({
      importUrl:
        "https://evo.example/assets/rev-1/manager/app-host-client.js",
      fetchImpl: async (_input, init) => {
        capturedInit = init;
        return new Response(JSON.stringify({
          ok: false,
          error: { code: "AUTHENTICATION_REQUIRED" }
        }), {
          status: 401,
          headers: {
            "content-type": "application/json",
            "x-evo-host-revision": "rev-1"
          }
        });
      },
      onAuthenticationRequired() {
        authenticationRequired += 1;
      }
    });

    await transport.fetch("/v1/actions", { method: "POST" });
    assert.equal(authenticationRequired, 1);
    assert.equal(capturedInit.credentials, "same-origin");
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
  }
});

test("App Host client returns to the exact hash route after re-login", async () => {
  const source = await import("node:fs/promises").then(fs =>
    fs.readFile(
      new URL("../../manager/app-host-client.ts", import.meta.url),
      "utf8"
    )
  );
  assert.match(source, /onAuthenticationRequired\(\)/);
  assert.match(
    source,
    /window\.location\.pathname[\s\S]*window\.location\.search[\s\S]*window\.location\.hash/
  );
  assert.match(source, /\/auth\/login\?returnTo=/);
});
