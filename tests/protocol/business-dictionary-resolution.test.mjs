import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveBusinessDictionarySnapshotV010
} from "../../dist/foundation/reference-resolution/dictionary.js";

const snapshot = () => ({
  contractVersion: "0.1.0",
  contextId: "enterprise:demo-one",
  dictionaryId: "counterparty.customer-level",
  version: 3,
  state: "PUBLISHED",
  options: [
    {
      code: "A",
      label: { default: "Key customer", translations: { "zh-CN": "重点客户" } },
      aliases: ["重点", "战略客户"],
      status: "ACTIVE"
    },
    {
      code: "B",
      label: { default: "Normal customer" },
      aliases: ["普通"],
      status: "ACTIVE"
    },
    {
      code: "C",
      label: { default: "Retired tier" },
      aliases: ["旧客户"],
      status: "INACTIVE"
    }
  ]
});

const request = (sourceValues, overrides = {}) => ({
  contextId: "enterprise:demo-one",
  dictionaryId: "counterparty.customer-level",
  expectedVersion: 3,
  sourceValues,
  ...overrides
});

test("RD-01: explicit stable code and aliases resolve without display-label inference", () => {
  const actual = resolveBusinessDictionarySnapshotV010(
    snapshot(),
    request(["A", "重点", "战略客户", "  普通 ", "重点客户", "无效值"])
  );
  assert.deepEqual(actual.map(x => x.status), [
    "RESOLVED", "RESOLVED", "RESOLVED", "RESOLVED", "UNKNOWN", "UNKNOWN"
  ]);
  assert.deepEqual(actual.slice(0, 4).map(x => x.optionCode), ["A", "A", "A", "B"]);
});

test("RD-01: renaming display labels never changes the stable business option code", () => {
  const changed = snapshot();
  changed.options[0].label = { default: "Strategic Account" };
  assert.equal(
    resolveBusinessDictionarySnapshotV010(changed, request(["重点"]))[0].optionCode,
    "A"
  );
  assert.equal(
    resolveBusinessDictionarySnapshotV010(changed, request(["Strategic Account"]))[0].status,
    "UNKNOWN"
  );
});

test("RD-01: inactive values cannot be imported and collisions require Human mapping", () => {
  const changed = snapshot();
  changed.options[1].aliases.push("重点");
  const result = resolveBusinessDictionarySnapshotV010(
    changed,
    request(["旧客户", "重点", "C"])
  );
  assert.equal(result[0].status, "INACTIVE");
  assert.deepEqual(result[1], {
    status: "AMBIGUOUS",
    dictionaryVersion: 3,
    candidateCodes: ["A", "B"]
  });
  assert.equal(result[2].status, "INACTIVE");
});

test("RD-01: cross-enterprise, wrong dictionary and stale published versions fail closed", () => {
  for (const [override, reason] of [
    [{ contextId: "enterprise:demo-other" }, "CONTEXT_MISMATCH"],
    [{ dictionaryId: "item.classification" }, "DICTIONARY_MISMATCH"],
    [{ expectedVersion: 2 }, "VERSION_MISMATCH"]
  ]) {
    assert.deepEqual(
      resolveBusinessDictionarySnapshotV010(snapshot(), request(["A", "B"], override))
        .map(result => result.status),
      [reason, reason]
    );
  }
});

test("RD-01: draft dictionaries are not available for executable references", () => {
  const changed = snapshot();
  changed.state = "DRAFT";
  assert.equal(
    resolveBusinessDictionarySnapshotV010(changed, request(["A"]))[0].status,
    "NOT_PUBLISHED"
  );
});

test("RD-01: malformed version and empty option codes are rejected", () => {
  const badVersion = snapshot();
  badVersion.version = Number.NaN;
  assert.throws(
    () => resolveBusinessDictionarySnapshotV010(badVersion, request(["A"])),
    /BUSINESS_DICTIONARY_SNAPSHOT_VERSION_INVALID/
  );
  const missingCode = snapshot();
  missingCode.options[0].code = " ";
  assert.throws(
    () => resolveBusinessDictionarySnapshotV010(missingCode, request(["A"])),
    /BUSINESS_DICTIONARY_OPTION_CODE_REQUIRED/
  );
});
