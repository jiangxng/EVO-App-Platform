import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  renderToHtml
} from "../../dist/vendor/eidos/src/renderers/html/index.js";
import {
  renderCatalogBrowserToHtml
} from "../../dist/vendor/eidos/src/catalog-browser/render.js";
import {
  eidosProductiveWorkbenchCss
} from "../../dist/vendor/eidos/src/design-language/productive-workbench-css.js";

test("Eidos form pages render shared business hierarchy and context navigation", () => {
  const html = renderToHtml({
    contractVersion: "0.1.1",
    kind: "form",
    id: "test.form",
    title: "Edit record",
    description: "Business-facing supporting copy.",
    contextNavigation: {
      items: [{
        id: "root",
        label: "Records",
        route: "/records"
      }, {
        id: "current",
        label: "Edit record"
      }]
    },
    purpose: "execute-command",
    command: {
      code: "test.save",
      inputVersion: "0.1.0"
    },
    fields: [{
      key: "name",
      label: "Name",
      semanticType: "name",
      control: "text",
      required: true
    }],
    actions: [{
      id: "save",
      label: "Save",
      type: "submit",
      command: "test.save",
      requiresConfirmation: false
    }]
  });

  assert.match(html, /data-eidos-context-navigation/);
  assert.match(html, /data-eidos-context-route="\/records"/);
  assert.match(html, /aria-current="page">Edit record/);
  assert.match(html, /data-eidos-page-description/);
  assert.match(html, /data-eidos-form-actions/);
});

test("Eidos catalog pages expose compact management density and page actions", () => {
  const html = renderCatalogBrowserToHtml({
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    layout: "list",
    density: "compact",
    itemActivation: "primary-action",
    id: "test.catalog",
    title: "Records",
    description: "Manage business records.",
    collectionTitle: "History",
    collectionDescription: "Previous business operations.",
    contextNavigation: {
      items: [{
        id: "root",
        label: "Master data",
        route: "/master-data"
      }, {
        id: "current",
        label: "Records"
      }]
    },
    actions: [{
      id: "import",
      label: "Import",
      type: "navigate",
      route: "/records/import"
    }, {
      id: "create",
      label: "Create",
      type: "navigate",
      route: "/records/new",
      primary: true
    }],
    items: [{
      id: "r1",
      title: "Record 1",
      summary: "R001",
      status: {
        label: "Active",
        tone: "positive"
      },
      primaryAction: {
        id: "open",
        label: "Open",
        type: "navigate",
        route: "/records/r1"
      }
    }]
  });

  assert.match(html, /data-eidos-catalog-density="compact"/);
  assert.match(html, /data-eidos-page-actions/);
  assert.match(html, /data-eidos-collection-heading/);
  assert.match(html, />History<\/h2>/);
  assert.match(html, /data-eidos-catalog-row-route="\/records\/r1"/);
  assert.doesNotMatch(html, /data-eidos-catalog-action="open"/);
  assert.match(html, /data-eidos-route="\/records\/new"/);
  assert.match(
    html,
    /data-eidos-catalog-action="create"[^>]*data-eidos-primary="true"/
  );
});

test("shared business-page navigation uses Eidos-owned responsive realization", async () => {
  const controller = await readFile(
    new URL(
      "../../dist/vendor/eidos/src/app-host/page-controller.js",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(controller, /data-eidos-context-route/);
  assert.match(controller, /options\.onNavigate/);

  assert.match(eidosProductiveWorkbenchCss, /data-eidos-page-heading/);
  assert.match(eidosProductiveWorkbenchCss, /data-eidos-context-navigation-desktop/);
  assert.match(eidosProductiveWorkbenchCss, /min-height:0!important/);
  assert.match(eidosProductiveWorkbenchCss, /data-eidos-collection-heading/);
  assert.match(eidosProductiveWorkbenchCss, /data-eidos-catalog-row-disclosure/);
  assert.match(eidosProductiveWorkbenchCss, /data-eidos-catalog-density="compact"/);
  assert.match(eidosProductiveWorkbenchCss, /@media \(max-width:700px\)/);
});
