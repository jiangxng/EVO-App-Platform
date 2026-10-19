import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import timers from 'node:timers';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {syncBuiltinESMExports} from 'node:module';
import {createEnterpriseOperatingGraphV010, validateEnterpriseOperatingGraphV010} from '../../dist/apps/eog-2d-designer/enterprise-operating-graph-model.js';
import {createEnterpriseOperatingGraphDefinitionPersistenceV010} from '../../dist/apps/eog-2d-designer/definition-persistence.js';
import {createEnterpriseOperatingGraphHostServiceV010} from '../../dist/apps/eog-2d-designer/enterprise-operating-graph-service.js';
import {createEogExpectedSopServiceV010} from '../../dist/manager/enterprise-operating-graph-sop-service.js';
import {createEnterpriseOperatingGraphActionHandlersV010} from '../../dist/manager/enterprise-operating-graph-actions.js';
import {createEogExpectedSopActionHandlersV010} from '../../dist/manager/enterprise-operating-graph-sop-actions.js';
import {createEnterpriseOperatingGraphAgentToolRegistrationsV010} from '../../dist/manager/enterprise-operating-graph-agent-tools.js';
import {createEogExpectedSopAgentToolRegistrationsV010} from '../../dist/manager/enterprise-operating-graph-sop-agent-tools.js';
import {createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020} from '../../dist/manager/enterprise-operating-graph-observatory-agent-tools.js';
import {createCurrent2dEditorAgentToolRegistrationsV010} from '../../dist/apps/eog-2d-designer/current-2d-editor-agent-tools.js';
import {createEnterpriseAgentHostToolCatalogV010} from '../../dist/agents/enterprise-agent/host-tool-catalog.js';
import {createFileDefinitionProjectionStoreV010} from '../../dist/providers/enterprise-context/definition-projection-store.js';
import {createEnterpriseDefinitionProjectionArtifactSourceV010} from '../../dist/providers/enterprise-context/definition-projection.js';

const principal = {contractVersion: '0.1.0', actorType: 'HUMAN', subjectId: 'owner', sessionId: 'session:test'};
const context = {activeContext: {contractVersion: '0.1.0', kind: 'ENTERPRISE', contextId: 'context:test', enterpriseId: 'enterprise:test'}};

// Only synchronous construction/discovery runs inside this guard. ESM loader IO
// has already completed. This is component evidence, not a Host startup probe.
function withoutResources(run) {
  const attempts = [], restore = [];
  const block = (object, key, label = key) => {
    const original = object[key];
    object[key] = () => { attempts.push(label); throw Error('UNEXPECTED_RESOURCE:' + label); };
    restore.push(() => { object[key] = original; });
  };
  for (const key of ['accessSync', 'existsSync', 'statSync', 'lstatSync', 'readdirSync', 'readFileSync', 'openSync', 'writeSync', 'writeFileSync', 'appendFileSync', 'mkdirSync', 'renameSync', 'unlinkSync', 'watch', 'watchFile', 'createReadStream', 'createWriteStream', 'access', 'stat', 'readdir', 'readFile', 'open', 'writeFile', 'appendFile', 'mkdir']) block(fs, key, 'fs.' + key);
  for (const key of ['access', 'stat', 'readdir', 'readFile', 'open', 'writeFile', 'appendFile', 'mkdir']) block(fs.promises, key, 'fs.promises.' + key);
  block(net.Socket.prototype, 'connect', 'TCP.connect');
  for (const [object, label] of [[http, 'http'], [https, 'https']]) for (const key of ['request', 'get']) block(object, key, label + '.' + key);
  block(globalThis, 'fetch');
  for (const key of ['setTimeout', 'setInterval', 'setImmediate']) { block(globalThis, key); block(timers, key, 'timers.' + key); }
  syncBuiltinESMExports();
  try { return run(); } finally {
    restore.reverse().forEach(undo => undo());
    syncBuiltinESMExports();
    // Also detect attempts swallowed by availability callbacks.
    assert.deepEqual(attempts, []);
  }
}

function fixture() {
  const businessCalls = [], metadataCalls = [];
  const forbidden = label => (...args) => {
    businessCalls.push({label, args});
    throw Error('UNEXPECTED_BUSINESS_CALL:' + label);
  };
  const dependency = label => new Proxy({}, {get: (_target, key) => forbidden(label + '.' + String(key))});
  const state = {designer: true, viewer: true, observatory: true, target: undefined};
  const graph = dependency('graph'), views = dependency('views'), sop = dependency('sop'), repository = dependency('repository');
  const providers = {
    hasRuntimeCandidate() { metadataCalls.push('runtime-candidate'); return true; },
    hasAnalysisCandidate() { metadataCalls.push('analysis-candidate'); return true; },
    createService: forbidden('providers.createService')
  };
  const currentEditors = {get(key) { metadataCalls.push('editor-session:' + key); return state.target; }};
  const registrations = () => [
    ...createEnterpriseOperatingGraphAgentToolRegistrationsV010({service: graph, viewService: views, principal, context, isDesignerActive: () => state.designer, is3dViewerActive: () => state.viewer}),
    ...createEogExpectedSopAgentToolRegistrationsV010({service: sop, principal, context}),
    ...createEnterpriseOperatingGraphObservatoryAgentToolRegistrationsV020({graphService: graph, providers, principal, context, isObservatoryActive: () => state.observatory}),
    ...createCurrent2dEditorAgentToolRegistrationsV010({currentEditors, graphService: graph, graphViewService: views, definitionRepository: repository, definitionProjectionStore: dependency('projectionStore'), definitionProjectionSource: dependency('projectionSource'), principal, context, isDesignerActive: () => state.designer, canAccessEnterprise: () => true, canManageEnterprise: forbidden('canManageEnterprise'), onEditorUpdated: forbidden('onEditorUpdated')})
  ];
  const catalog = extra => createEnterpriseAgentHostToolCatalogV010({manager: dependency('manager'), principal, context, listAvailableContexts: forbidden('listAvailableContexts'), listProviderBindings: forbidden('listProviderBindings'), getProviderHealth: forbidden('getProviderHealth'), searchHelp: forbidden('searchHelp')}, extra);
  return {state, graph, views, sop, repository, businessCalls, metadataCalls, forbidden, registrations, catalog};
}

function constructionProbe() {
  const f = fixture();
  withoutResources(() => {
    const graph = createEnterpriseOperatingGraphV010({graphId: 'graph:test', enterpriseId: 'enterprise:test', createdAt: '2026-10-19T00:00:00.000Z'});
    assert.equal(validateEnterpriseOperatingGraphV010(graph).publishable, true);
    const projectionStore = createFileDefinitionProjectionStoreV010('/unopened-business-projection/state.json');
    createEnterpriseDefinitionProjectionArtifactSourceV010(f.repository, projectionStore);
    const persistence = createEnterpriseOperatingGraphDefinitionPersistenceV010(f.repository);
    createEnterpriseOperatingGraphHostServiceV010({persistence, id: f.forbidden('id'), now: f.forbidden('graph.now')});
    createEogExpectedSopServiceV010({repository: f.repository, graphService: f.graph, now: f.forbidden('sop.now')});
    assert.equal(createEnterpriseOperatingGraphActionHandlersV010({service: f.graph, resolveAuthorizationProvider: f.forbidden('authorization')}).length, 5);
    assert.equal(createEogExpectedSopActionHandlersV010({service: f.sop, resolveAuthorizationProvider: f.forbidden('authorization')}).length, 4);
    assert.ok(f.registrations().length > 0);
  });
  assert.deepEqual(f.businessCalls, []);
  assert.deepEqual(f.metadataCalls, []);
}

function discoveryProbe() {
  const f = fixture();
  withoutResources(() => {
    const catalog = f.catalog(f.registrations());
    const ids = () => catalog.list().map(item => item.id);
    assert.ok(ids().includes('enterprise.operating_graph.list'));
    assert.ok(ids().includes('enterprise.operating_graph.sop.list'));
    assert.ok(ids().includes('enterprise.operating_graph.spatial_view.get'));
    assert.ok(ids().includes('enterprise.operating_graph.analyze'));
    assert.ok(!ids().includes('enterprise.current_2d_editor.get'));
    f.state.target = {contractVersion: '0.1.0', kind: 'OPERATING_GRAPH', enterpriseId: 'enterprise:test', graphId: 'graph:test', resourceId: 'graph:test', selectedAt: '2026-10-19T00:00:00.000Z'};
    assert.ok(ids().includes('enterprise.current_2d_editor.get'));
    f.state.designer = f.state.viewer = f.state.observatory = false;
    const inactive = ids();
    for (const id of ['enterprise.operating_graph.list', 'enterprise.operating_graph.spatial_view.get', 'enterprise.operating_graph.observe', 'enterprise.current_2d_editor.get']) assert.ok(!inactive.includes(id));
    // SOP retains its existing enterprise-context availability; do not invent
    // ownership by the 2D UI feature in a resource-loading regression.
    assert.ok(inactive.includes('enterprise.operating_graph.sop.list'));
    f.state.designer = f.state.viewer = f.state.observatory = true;
    assert.ok(ids().includes('enterprise.current_2d_editor.get'));
  });
  assert.ok(f.metadataCalls.includes('runtime-candidate'));
  assert.ok(f.metadataCalls.some(item => item.startsWith('editor-session:')));
  assert.deepEqual(f.businessCalls, []);
}

const probe = process.argv.find(arg => arg.startsWith('--resource-probe='));
if (probe) {
  if (probe === '--resource-probe=construction') constructionProbe();
  else if (probe === '--resource-probe=discovery') discoveryProbe();
  else throw Error('UNKNOWN_RESOURCE_PROBE');
  process.stdout.write('RESOURCE_PROBE_PASS');
} else {
  for (const [name, mode] of [
    ['model, services and EOG registration construct without resource or business work', 'construction'],
    ['catalog discovery uses only lifecycle, editor session and candidate metadata', 'discovery']
  ]) test(name, () => {
    const env = {...process.env};
    delete env.NODE_TEST_CONTEXT;
    execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--resource-probe=' + mode], {env, stdio: ['ignore', 'ignore', 'inherit'], timeout: 10000});
  });

test('catalog refusal does not execute graph tools; first READ, disable and recovery preserve scope', async () => {
  const f = fixture(), calls = [];
  // Use one explicit service stub for execution, keeping all other dependencies
  // forbidden. No live Agent/model, external Provider or persisted WRITE runs.
  const service = {list(request) { calls.push(request); return [{graphId: 'graph:test'}]; }};
  const extra = createEnterpriseOperatingGraphAgentToolRegistrationsV010({service, viewService: f.views, principal, context, isDesignerActive: () => f.state.designer, is3dViewerActive: () => f.state.viewer});
  const catalog = f.catalog(extra), call = {tool: 'enterprise.operating_graph.list', arguments: {}};
  f.state.designer = false;
  assert.equal((await catalog.invoke(call, [])).error.code, 'AGENT_TOOL_UNAVAILABLE');
  assert.deepEqual(calls, []);
  f.state.designer = true;
  const result = await catalog.invoke(call, []);
  assert.equal(result.ok, true);
  assert.deepEqual(result.result.graphs, [{graphId: 'graph:test'}]);
  f.state.designer = false;
  assert.equal((await catalog.invoke(call, [])).error.code, 'AGENT_TOOL_UNAVAILABLE');
  f.state.designer = true;
  assert.equal((await catalog.invoke(call, [])).ok, true);
  assert.deepEqual(calls, [{enterpriseId: 'enterprise:test'}, {enterpriseId: 'enterprise:test'}]);
  assert.deepEqual(f.businessCalls, []);
});

}
