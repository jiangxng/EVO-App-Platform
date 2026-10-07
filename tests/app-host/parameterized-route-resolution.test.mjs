import test from "node:test";
import assert from "node:assert/strict";

import {
  createAppHost
} from "../../dist/vendor/eidos/src/app-host/host.js";

test("App Host resolves parameterized routes after exact routes", async () => {
  const loaded = [];
  const source = {
    async listEffectiveExperienceManifests() {
      return [{
        contractVersion: "0.1.0",
        experienceId: "dynamic-route-test",
        packageId: "dynamic-route-test",
        featureId: "dynamic-route-test.default",
        defaultRoute: "/data-import",
        pages: [{
          id: "directory",
          source: "test://directory"
        }, {
          id: "upload",
          source: "test://upload"
        }],
        routes: [{
          id: "directory",
          path: "/data-import",
          pageId: "directory"
        }, {
          id: "upload",
          path: "/data-import/new/:targetId",
          pageId: "upload"
        }]
      }];
    },
    async loadPage(page, options) {
      loaded.push({
        pageId: page.id,
        routePath: options?.routePath
      });
      return {
        contractVersion: "0.1.0",
        kind: "catalog-browser",
        layout: "list",
        id: page.id,
        title: page.id,
        items: []
      };
    }
  };

  const host = createAppHost(source);
  await host.refresh();

  assert.equal(
    host.resolveRoute("/data-import/new/counterparty.subject")?.page.id,
    "upload"
  );
  assert.equal(
    host.resolveRoute("/data-import")?.page.id,
    "directory"
  );

  const page = await host.loadRoute(
    "/data-import/new/counterparty.subject"
  );
  assert.equal(page?.page.id, "upload");
  assert.equal(page?.route.path, "/data-import/new/:targetId");
  assert.equal(
    page?.requestPath,
    "/data-import/new/counterparty.subject"
  );
  assert.deepEqual(loaded, [{
    pageId: "upload",
    routePath: "/data-import/new/counterparty.subject"
  }]);
});
