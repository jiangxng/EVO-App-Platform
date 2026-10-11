import test from "node:test";
import assert from "node:assert/strict";

import {
  templateStoreRecordItemIdV010,
  parseTemplateStoreRecordItemIdV010
} from "../../dist/apps/template-store/repository.js";

test("Template Store item IDs round-trip namespaced, Unicode and @-containing IDs without collisions", () => {
  const ids = [
    "evo.ledger-runtime.baseline.v0.1",
    "template:customer/tier@business",
    "中文/模板 @重点",
    "a%b?c#d"
  ];
  for (const id of ids) {
    for (const version of [1, 7, 12345]) {
      const encoded = templateStoreRecordItemIdV010(id, version);
      assert.deepEqual(parseTemplateStoreRecordItemIdV010(encoded), {
        templateId: id, version
      });
      assert.equal(encoded, encodeURIComponent(id) + "@" + version);
    }
  }
});

test("Template Store item IDs reject misleading or unsafe versions", () => {
  for (const version of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () => templateStoreRecordItemIdV010("template", version),
      /TEMPLATE_STORE_VERSION_INVALID/
    );
  }
  for (const id of [
    "template@0", "template@01", "template@1junk", "template@1.2",
    "template@1e2", "template@-1", "template@9007199254740992",
    "@1", "bad%ZZ@1", "a%40b@0", "space%20@2", "trimmed%20@2"
  ]) {
    if (id === "space%20@2" || id === "trimmed%20@2") {
      assert.throws(() => parseTemplateStoreRecordItemIdV010(id), /TEMPLATE_STORE_ITEM_ID_INVALID/);
    } else {
      assert.throws(() => parseTemplateStoreRecordItemIdV010(id), /TEMPLATE_STORE_ITEM_ID_INVALID/);
    }
  }
  assert.throws(() => templateStoreRecordItemIdV010("  ", 1), /TEMPLATE_STORE_TEMPLATE_ID_REQUIRED/);
  assert.throws(() => parseTemplateStoreRecordItemIdV010(""), /TEMPLATE_STORE_ITEM_ID_REQUIRED/);
});
