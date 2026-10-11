import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  renderToHtml
} from "../../dist/vendor/eidos/src/renderers/html/index.js";
import {
  validateValues
} from "../../dist/vendor/eidos/src/runtime/values.js";

const form = {
  contractVersion: "0.1.1",
  kind: "form",
  id: "readonly-submit-test",
  title: "Read-only submit test",
  purpose: "execute-command",
  command: {
    code: "test.save",
    inputVersion: "0.1.0"
  },
  fields: [{
    key: "editable",
    label: "Editable",
    semanticType: "editable",
    control: "text",
    required: true,
    initialValue: "human"
  }, {
    key: "derived",
    label: "Derived",
    semanticType: "derived",
    control: "text",
    required: false,
    readOnly: true,
    initialValue: "system-owned"
  }],
  actions: [{
    id: "save",
    label: "Save",
    type: "submit",
    command: "test.save",
    requiresConfirmation: false
  }]
};

test("read-only fields render disabled and remain server-protected", () => {
  const html = renderToHtml(form);
  assert.match(html, /name="derived"[^>]*disabled/);

  const malicious = validateValues(form, {
    editable: "human",
    derived: "forged"
  });
  assert.equal(malicious.ok, false);
  assert.ok(malicious.diagnostics.some(
    item => item.code === "EIDOS_VALUE_READONLY"
  ));
});

test("App Host form collection excludes read-only fields before submission", async () => {
  const controller = await readFile(
    new URL(
      "../../dist/vendor/eidos/src/app-host/page-controller.js",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(
    controller,
    /for \(const field of document\.fields\) \{\s*if \(field\.readOnly\) continue;/
  );
});
