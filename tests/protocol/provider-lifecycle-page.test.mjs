import test from 'node:test';
import assert from 'node:assert/strict';
import { createProviderLifecyclePage, createProviderLifecycleResults } from '../../dist/manager/provider-lifecycle-page.js';
import { renderSettingsEditorToHtml } from '../../dist/vendor/eidos/src/settings/render.js';
import { renderCatalogBrowserToHtml } from '../../dist/vendor/eidos/src/catalog-browser/render.js';

test('lifecycle page starts with empty credential and exposes no runtime state before authorization', () => {
  const page = createProviderLifecyclePage('zh-CN');
  assert.equal(page.title, '运行与清理');
  assert.equal(page.groups[0].settings[0].value, '');
  const html = renderSettingsEditorToHtml(page);
  assert.match(html, /type="password"/);
  assert.match(html, /data-namespace="provider-lifecycle"/);
  assert.doesNotMatch(html, /STOP_FAILED|STOP_TIMEOUT/);
  assert.equal(createProviderLifecyclePage('en').title, 'Runtime and cleanup');
});

test('lifecycle list enables retries only for blocked stopping states and escapes package labels', () => {
  const phases = ['IDLE', 'LOADING', 'READY', 'STOPPING', 'STOP_TIMEOUT', 'STOP_FAILED', 'STOPPED'];
  const document = createProviderLifecycleResults(phases.map(phase => ({ packageId: '<script>' + phase,
    phase, activeCalls: 1, blocked: phase.startsWith('STOP_') || phase === 'STOPPING', cleanupPending: phase !== 'STOP_FAILED' })), 'zh-CN');
  assert.equal(document.layout, 'list');
  assert.deepEqual(document.items.filter(item => item.primaryAction.enabled).map(item => item.status.label),
    ['清理中', '等待超时，清理未完成', '清理失败']);
  assert.equal(document.items[5].primaryAction.label, '重试清理');
  const html = renderCatalogBrowserToHtml(document);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.equal(createProviderLifecycleResults([{ packageId: 'test', phase: 'STOP_FAILED', blocked: false, activeCalls: 0, cleanupPending: false }]).items[0].primaryAction.enabled, false);
});
