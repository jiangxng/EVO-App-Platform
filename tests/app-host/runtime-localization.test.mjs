import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createLocalizationRuntime,
  eidosAppHostLocalizationBundles
} from "../../dist/vendor/eidos/src/localization/index.js";

const FIRST_CLASS_LOCALES = ["en", "zh-CN", "ja", "zh-TW"];

test("Eidos App Host runtime bundles have exact first-class locale key parity", () => {
  const byLocale = Object.fromEntries(
    eidosAppHostLocalizationBundles.map(bundle => [bundle.locale, bundle.messages])
  );
  assert.deepEqual(Object.keys(byLocale).sort(), [...FIRST_CLASS_LOCALES].sort());

  const baseline = Object.keys(byLocale.en).sort();
  for (const locale of FIRST_CLASS_LOCALES) {
    assert.deepEqual(
      Object.keys(byLocale[locale]).sort(),
      baseline,
      locale + " App Host runtime localization keys diverged from en"
    );
  }
});

test("every literal dynamic hostText key used by chat/workbench exists in every first-class locale", async () => {
  const sources = await Promise.all([
    readFile(new URL("../../vendor/eidos/src/app-host/page-controller.ts", import.meta.url), "utf8"),
    readFile(new URL("../../vendor/eidos/src/workbench/shell.ts", import.meta.url), "utf8")
  ]);
  const keys = new Set();
  for (const source of sources) {
    for (const match of source.matchAll(/hostText\(\s*"([^"]+)"/g)) {
      keys.add(match[1]);
    }
  }

  const byLocale = Object.fromEntries(
    eidosAppHostLocalizationBundles.map(bundle => [bundle.locale, bundle.messages])
  );
  for (const locale of FIRST_CLASS_LOCALES) {
    for (const key of keys) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(byLocale[locale], key),
        locale + " missing dynamic App Host key " + key
      );
    }
  }
});

test("runtime chat chrome resolves Chinese without English fallback", () => {
  const runtime = createLocalizationRuntime(eidosAppHostLocalizationBundles, {
    locale: "zh-CN",
    fallbackLocales: ["en"]
  });
  assert.equal(runtime.resolve("eidos.app-host", "shell.chatHistory", "Conversation history"), "对话历史");
  assert.equal(runtime.resolve("eidos.app-host", "shell.chatNew", "New chat"), "新对话");
  assert.equal(runtime.resolve("eidos.app-host", "shell.chatArchive", "Archive"), "归档");
  assert.equal(runtime.resolve("eidos.app-host", "shell.chatUntitled", "New chat"), "新对话");
  assert.equal(
    runtime.resolve("eidos.app-host", "shell.chatArchivedLabel", "[Archived] {title}", { title: "示例" }),
    "【已归档】示例"
  );
  assert.equal(runtime.resolve("eidos.app-host", "shell.locale.zh-CN", "zh-CN"), "简体中文");
});
