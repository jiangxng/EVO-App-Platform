import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolvePackageDisplayNameV010 as title } from '../../dist/manager/package-display-name.js';
import { validatePluginManifestV010 } from '../../dist/contracts/plugin-protocol.js';
import { createPluginStorePage } from '../../dist/manager/plugin-store-page.js';
import { createSettingsGroupPage, createSettingsExperienceManifest, createSettingsPage } from '../../dist/manager/settings-page.js';
import { createPackageCatalog } from '../../dist/catalog/catalog.js';
import { createAppManagerService } from '../../dist/manager/service.js';
import { createMemoryLifecycleStore } from '../../dist/manager/store.js';
import { createMemorySettingsStore } from '../../dist/manager/settings-store.js';
import { createLocalizationRuntime } from '../../dist/vendor/eidos/src/localization/index.js';

const locales = ['en', 'zh-CN', 'ja', 'zh-TW'];
const packages = new Map();
const sources = ['catalog/seed.js', 'agents/enterprise-agent/package.js', 'manager/external-agent-governance-package.js'];
for (const folder of ['apps', 'providers']) {
  for (const entry of await readdir(new URL(`../../dist/${folder}/`, import.meta.url), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = `${folder}/${entry.name}/package.js`;
    try { await readFile(new URL(`../../dist/${path}`, import.meta.url)); sources.push(path); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
for (const path of sources) {
  for (const value of Object.values(await import(`../../dist/${path}`))) {
    if (value?.contractVersion === '0.1.0' && value?.packageId && Array.isArray(value.features)) packages.set(value.packageId, value);
  }
}

test('every shipped manifest owns explicit four-locale catalog titles, including optional previews', () => {
  assert.ok(packages.size >= 48, `unexpected inventory: ${packages.size}`);
  for (const pkg of packages.values()) {
    for (const locale of locales) {
      assert.ok(pkg.displayNameTranslations?.[locale]?.trim(), `${pkg.packageId}/${locale}`);
      assert.equal(title(pkg, locale), pkg.displayNameTranslations[locale]);
    }
    assert.equal(title(pkg, 'en'), pkg.displayName, `${pkg.packageId}: English compatibility`);
  }
});

test('fallback and locale variants preserve old manifests and do not cross language scripts', () => {
  const pkg = packages.get('openai-llm-provider');
  assert.equal(title(pkg, 'ja-JP'), 'OpenAI モデルサービス');
  assert.equal(title(pkg, 'zh-hk'), 'OpenAI 模型服務');
  assert.equal(title(pkg, 'zh-Hant'), 'OpenAI 模型服務');
  assert.equal(title(pkg, 'zh-SG'), 'OpenAI 模型服务');
  assert.equal(title(pkg, 'fr-FR'), pkg.displayName);
  assert.equal(title(pkg, 'invalid_locale'), pkg.displayName);
  assert.equal(title({ ...pkg, displayNameTranslations: undefined }, 'ja'), pkg.displayName);
});

test('all catalog lifecycle states keep translated titles without activating feature resources', () => {
  for (const pkg of packages.values()) {
    if (pkg.type === 'FOUNDATION_RUNTIME') continue;
    const before = structuredClone(pkg);
    for (const state of ['uninstalled', 'disabled', 'enabled']) {
      const snapshot = {
        contractVersion: '0.1.0',
        installedPackages: state === 'uninstalled' ? [] : [{ packageId: pkg.packageId, version: pkg.version }],
        activeFeatures: state === 'enabled' ? pkg.features.map(f => ({packageId: pkg.packageId, featureId: f.featureId, version: f.version})) : []
      };
      for (const locale of locales) {
        const page = createPluginStorePage([pkg], snapshot, { locale });
        assert.equal(page.items[0].title, pkg.displayNameTranslations[locale]);
        assert.equal(page.items[0].id, pkg.packageId);
      }
    }
    assert.deepEqual(pkg, before);
  }
});

const fixture = {
  contractVersion: '0.1.0', packageId: 'localized-fixture', displayName: 'Fixture', version: '0.1.0', type: 'APPLICATION',
  displayNameTranslations: {en: 'Fixture', 'zh-CN': '测试插件', ja: 'テストプラグイン', 'zh-TW': '測試外掛'},
  features: [{contractVersion: '0.1.0', featureId: 'localized-fixture.default', packageId: 'localized-fixture', version: '0.1.0', activationScope: 'INSTALLATION', defaultActivation: true,
    contributions: [{kind: 'eidos.settings', settings: {contractVersion: '0.1.0', namespace: 'localized-fixture', title: 'Fixture', properties: []}}]}]
};
test('settings directory, route metadata and disabled plugin heading use the same title', async () => {
  const manager = createAppManagerService(createPackageCatalog([fixture]), createMemoryLifecycleStore());
  assert.deepEqual(manager.listEffectiveLocalizationBundles(), []);
  manager.install(fixture.packageId);
  manager.disable(fixture.packageId);
  for (const locale of locales) {
    assert.equal(createSettingsGroupPage(manager, 'system', locale).items.find(x => x.id === fixture.packageId).title, title(fixture, locale));
    assert.equal(createSettingsExperienceManifest(manager, locale).pages.find(x => x.id === 'evo-settings.' + fixture.packageId).title, title(fixture, locale));
    const page = await createSettingsPage(manager, createMemorySettingsStore(), fixture.packageId, undefined, undefined, locale);
    assert.equal(page.title, title(fixture, locale));
  }
  assert.deepEqual(manager.listEffectiveLocalizationBundles(), []);
});

test('active Eidos settings localization does not replace provider headings with untranslated English', () => {
  for (const id of ['openai-llm-provider', 'deepseek-llm-provider']) {
    const pkg = packages.get(id);
    const bundles = pkg.features.flatMap(f => f.contributions ?? []).filter(c => c.kind === 'eidos.localization-bundle').map(c => c.bundle);
    for (const locale of locales) {
      const runtime = createLocalizationRuntime(bundles, { locale });
      assert.equal(runtime.resolve(pkg.packageId, 'settings.title', pkg.displayName), title(pkg, locale));
    }
  }
});

test('protocol validates optional title metadata while retaining old-manifest compatibility', () => {
  assert.equal(validatePluginManifestV010(fixture).ok, true);
  for (const invalid of [null, [], 'bad', {en: ' '}, {en: 4}, {'../bad': 'x'}]) {
    const result = validatePluginManifestV010({...fixture, displayNameTranslations: invalid});
    assert.ok(result.issues.some(x => x.code === 'PLUGIN_DISPLAY_NAME_TRANSLATIONS_INVALID'));
  }
  assert.equal(validatePluginManifestV010({...fixture, displayNameTranslations: undefined}).ok, true);
});
