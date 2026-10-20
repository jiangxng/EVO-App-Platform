import assert from 'node:assert/strict';
import {register} from 'node:module';
import {mkdtempSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const scenario = process.argv[2];
const raced = ['disable', 'access', 'role', 'target', 'write-token'].includes(scenario);
const directory = mkdtempSync(join(tmpdir(), 'eog-crop-lazy-'));
const eventFile = join(directory, 'events.jsonl'), stateFile = join(directory, 'state.json'), storeFile = join(directory, 'projection.json');
writeFileSync(eventFile, '');
writeFileSync(stateFile, '{}');
const events = () => readFileSync(eventFile, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
const flags = () => JSON.parse(readFileSync(stateFile, 'utf8'));
register('./eog-current-editor-loading-loader.mjs', import.meta.url, {
  data: {eventFile, stateFile, storeFile, scenario}
});
try {
  const {createCurrent2dEditorAgentToolRegistrationsV010} = await import('../../dist/apps/eog-2d-designer/current-2d-editor-agent-tools.js');
  const {createMemoryCurrent2dEditorSessionStoreV010} = await import('../../dist/contracts/current-2d-editor.js');
  const {createFileDefinitionProjectionStoreV010} = await import('../../dist/providers/enterprise-context/definition-projection-store.js');
  const {createEogViewStateProviderV010} = await import('../../dist/providers/eog-view-state/runtime.js');
  const {createMemoryEogViewStateStoreV010} = await import('../../dist/providers/eog-view-state/store.js');
  const principal = {contractVersion: '0.1.0', actorType: 'HUMAN', subjectId: 'owner', sessionId: 'session:test'};
  // The editor supplies enterprise scope while the conversation stays Personal.
  const context = {activeContext: {contractVersion: '0.1.0', kind: 'PERSONAL', contextId: 'personal:owner', ownerSubjectId: 'owner'}};
  const target = {contractVersion: '0.1.0', kind: 'DEFINITION_PROJECTION', enterpriseId: 'enterprise:test', definitionId: 'definition:test', definitionRevision: 0, projectionId: 'projection:test', resourceId: 'definition:test@0#projection:test', selectedAt: '2026-10-19T00:00:00.000Z'};
  const diagram = {contractVersion: '0.1.0', kind: 'DIAGRAM_2D', nodes: ['a', 'b', 'c'].map((id, index) => ({id, kind: 'application', label: id, shape: 'rectangle', x: 20 + index * 200, y: 30, width: 140, height: 60})), edges: [{id: 'ab', source: 'a', target: 'b', kind: 'posting'}, {id: 'bc', source: 'b', target: 'c', kind: 'posting'}]};
  const gallery = {contractVersion: '0.1.0', primaryProjectionId: target.projectionId, projections: [{projectionId: target.projectionId, title: '测试投影', thumbnail: {src: 'data:image/svg+xml;charset=UTF-8,%3Csvg/%3E', alt: '测试投影'}, view: {contractVersion: '0.1.0', kind: 'DIAGRAM_2D', placements: diagram.nodes.map(node => ({nodeId: node.id, x: node.x, y: node.y})), camera: {scale: 1, translateX: 0, translateY: 0}}}]};
  const revision = {enterpriseId: target.enterpriseId, definitionId: target.definitionId, revision: 0, kind: 'LEDGER_RUNTIME_TEMPLATE', state: 'DRAFT', title: 'Definition', payload: {}, projectionGallery: gallery};
  const graph = {contractVersion: '0.1.0', graphId: 'graph:test', enterpriseId: target.enterpriseId, revision: 0, state: 'DRAFT', createdAt: target.selectedAt, updatedAt: target.selectedAt, nodes: ['a', 'b'].map(id => ({nodeId: id, kind: 'APPLICATION', semanticRef: {kind: 'APPLICATION', authority: 'HOST', refId: id}})), guidanceRelations: [], enterpriseRelations: []};
  const beforeDefinition = structuredClone(revision), beforeGraph = structuredClone(graph);
  const sessions = createMemoryCurrent2dEditorSessionStoreV010();
  sessions.set(principal.sessionId, target);
  const projectionStore = createFileDefinitionProjectionStoreV010(storeFile);
  const views = createEogViewStateProviderV010({store: createMemoryEogViewStateStoreV010()});
  const state = {active: true, access: true, manage: true};
  writeFileSync(stateFile, JSON.stringify({competingEntry: {enterpriseId: target.enterpriseId, definitionId: target.definitionId, definitionRevision: 0, gallery, updatedAt: '2026-10-19T00:00:01.000Z', updatedBySubjectId: 'other-editor'}}));
  const calls = {reads: 0, writes: 0, updated: 0};
  const registrations = createCurrent2dEditorAgentToolRegistrationsV010({
    principal, context, currentEditors: {get(key) { const selected = sessions.get(key); return flags().targetChanged && selected ? {...selected, enterpriseId: 'other-enterprise', resourceId: 'other-resource'} : selected; }}, locale: 'zh-CN',
    isDesignerActive: () => state.active && flags().active !== false, canAccessEnterprise: () => state.access && flags().access !== false, canManageEnterprise: () => state.manage && flags().manage !== false,
    graphService: {get(request) { calls.reads++; assert.equal(request.enterpriseId, target.enterpriseId); return structuredClone(graph); }},
    graphViewService: views,
    definitionRepository: {getLatest(request) { calls.reads++; assert.equal(request.enterpriseId, target.enterpriseId); return structuredClone(revision); }},
    definitionProjectionSource: {get(request) { calls.reads++; assert.equal(request.includeHidden, true); return {diagram2d: structuredClone(diagram)}; }},
    definitionProjectionStore: {
      getVersioned(request) { calls.reads++; return projectionStore.getVersioned(request); },
      putIfVersion(request, expected) { const result = projectionStore.putIfVersion(request, expected); calls.writes++; return result; }
    },
    onEditorUpdated() { calls.updated++; }, now: () => new Date('2026-10-19T00:01:00.000Z')
  });
  const read = registrations.find(item => item.descriptor.effect === 'READ');
  const crop = registrations.find(item => item.descriptor.effect === 'WRITE');
  const args = {visibleNodeIds: ['a', 'b'], visibleEdgeIds: ['ab'], expectedWriteToken: '0', rationale: '保留相关节点'};
  const noBusiness = () => assert.deepEqual(calls, {reads: 0, writes: 0, updated: 0});
  const noEditor = async () => {
    assert.ok(!events().some(event => event.kind === 'editor-loading'));
    assert.ok(!events().some(event => event.url?.endsWith('/definition-projection-editor.js')));
  };

  assert.ok(registrations.every(item => item.available()));
  noBusiness();
  await noEditor();
  if (scenario === 'read-and-graph') {
    assert.equal(read.execute().currentEditor.kind, 'DEFINITION_PROJECTION');
    sessions.set(principal.sessionId, {contractVersion: '0.1.0', kind: 'OPERATING_GRAPH', enterpriseId: target.enterpriseId, graphId: graph.graphId, resourceId: graph.graphId, selectedAt: target.selectedAt});
    assert.equal(read.execute().currentEditor.kind, 'OPERATING_GRAPH');
    const result = await crop.execute({visibleNodeIds: ['a'], visibleEdgeIds: [], expectedWriteToken: '0'});
    assert.equal(result.changed, true);
    assert.equal(views.list({enterpriseId: target.enterpriseId, graphId: graph.graphId})[0].revision, 1);
    assert.equal(calls.writes, 0);
    await noEditor();
  } else if (scenario === 'preflight-denied') {
    for (const [field, code] of [['active', 'AGENT_TOOL_UNAVAILABLE'], ['access', 'CURRENT_2D_EDITOR_ENTERPRISE_ACCESS_REQUIRED'], ['manage', 'CURRENT_2D_EDITOR_MANAGE_ROLE_REQUIRED']]) {
      state[field] = false;
      await assert.rejects(crop.execute(args), new RegExp(code));
      state[field] = true;
    }
    await assert.rejects(crop.execute({...args, expectedWriteToken: ''}), /CURRENT_2D_EDITOR_WRITE_TOKEN_REQUIRED/);
    await assert.rejects(crop.execute({...args, visibleNodeIds: []}), /CURRENT_2D_EDITOR_VISIBLE_NODES_REQUIRED/);
    await assert.rejects(crop.execute({...args, visibleEdgeIds: [42]}), /CURRENT_2D_EDITOR_VISIBLE_EDGES_INVALID/);
    sessions.remove(principal.sessionId);
    await assert.rejects(crop.execute(args), /CURRENT_2D_EDITOR_REQUIRED/);
    noBusiness();
    await noEditor();
  } else if (raced) {
    const result = await crop.execute(args).then(value => ({value}), error => ({error}));
    const codes = {disable: 'AGENT_TOOL_UNAVAILABLE', access: 'CURRENT_2D_EDITOR_ENTERPRISE_ACCESS_REQUIRED', role: 'CURRENT_2D_EDITOR_MANAGE_ROLE_REQUIRED', target: 'CURRENT_2D_EDITOR_WRITE_CONFLICT', 'write-token': 'DEFINITION_PROJECTION_WRITE_CONFLICT'};
    assert.match(result.error?.message ?? '', new RegExp(codes[scenario]));
    assert.equal(calls.writes, 0);
    assert.equal(calls.updated, 0);
    if (scenario !== 'write-token') noBusiness();
    assert.equal(projectionStore.snapshot().entries.length, scenario === 'write-token' ? 1 : 0);
    // Re-enable/restore this same tool instance; a cached ESM is not authority.
    state.active = state.access = state.manage = true;
    writeFileSync(stateFile, '{}');
    sessions.set(principal.sessionId, target);
    assert.equal((await crop.execute({...args, expectedWriteToken: scenario === 'write-token' ? '1' : '0'})).changed, true);
    assert.equal(calls.writes, 1);
    assert.equal(calls.updated, 1);
  } else if (scenario === 'load-error') {
    await assert.rejects(crop.execute(args), /TEST_EDITOR_LOAD_FAILED/);
    noBusiness();
    assert.deepEqual(projectionStore.snapshot().entries, []);
  } else if (scenario === 'concurrent') {
    const results = await Promise.allSettled([crop.execute(args), crop.execute(args)]);
    assert.equal(results.filter(item => item.status === 'fulfilled').length, 1);
    assert.equal(results.filter(item => item.status === 'rejected').length, 1);
    assert.match(results.find(item => item.status === 'rejected').reason.message, /DEFINITION_PROJECTION_WRITE_CONFLICT/);
    assert.equal(events().filter(event => event.kind === 'editor-loading').length, 1);
    assert.equal(calls.writes, 1);
    assert.equal(calls.updated, 1);
    const {cropDefinitionProjectionToVisibleItemsV010} = await import('../../dist/apps/eog-2d-designer/definition-projection-editor.js');
    const expected = cropDefinitionProjectionToVisibleItemsV010({gallery, projectionId: target.projectionId, diagram, visibleNodeIds: args.visibleNodeIds, visibleEdgeIds: args.visibleEdgeIds, locale: 'zh-CN'});
    assert.deepEqual(projectionStore.get({enterpriseId: target.enterpriseId, definitionId: target.definitionId, definitionRevision: 0}), expected);
  } else throw Error('UNKNOWN_SCENARIO:' + scenario);
  assert.deepEqual(revision, beforeDefinition);
  assert.deepEqual(graph, beforeGraph);
} finally {
  rmSync(directory, {recursive: true, force: true});
}
