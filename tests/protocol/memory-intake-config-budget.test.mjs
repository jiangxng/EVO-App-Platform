import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHostMemoryIntakeConfigV010 as parse, createHostMemoryIntakeSourceAdapterV010 as adapter,
  createHostMemoryEvidenceSourceProviderV010 as evidence, createHostMemoryIntakeHealthProbeV010 as health} from '../../dist/providers/memory-intake/runtime.js';
import {createProviderRuntimeRegistry} from '../../dist/providers/runtime-registry.js';

const personal = {kind: 'PERSONAL', contextId: 'personal:p'};
const enterprise = id => ({kind: 'ENTERPRISE', contextId: 'enterprise:e', enterpriseId: id});
const record = (id, context = personal) => ({sourceRecordId: String(id), context, kind: 'FACT', summary: 's'});
const config = (records = []) => ({contractVersion: '0.1.0', source: {sourceId: 's', sourceType: 'DOCUMENT', trustLevel: 'DECLARED'}, records});
const pull = (runtime, context = personal, extra = {}) => runtime.pull({contractVersion: '0.1.0', context, ...extra});

function paddedBytes(bytes, unicode = false) {
  const value = {...config(), ignoredPadding: ''};
  const baseBytes = Buffer.byteLength(JSON.stringify(value));
  const room = bytes - baseBytes;
  value.ignoredPadding = unicode ? '文'.repeat(Math.floor(room / 3)) + 'x'.repeat(room % 3) : 'x'.repeat(room);
  const raw = JSON.stringify(value); assert.equal(Buffer.byteLength(raw), bytes); return raw;
}

test('Host intake raw JSON accepts exactly 128 KiB including multibyte UTF-8 and rejects the next byte before JSON.parse', t => {
  for (const unicode of [false, true]) {
    assert.equal(parse(paddedBytes(128 * 1024, unicode)).records.length, 0);
    const raw = paddedBytes(128 * 1024 + 1, unicode); let parsed = 0;
    const original = JSON.parse; const mock = t.mock.method(JSON, 'parse', (...args) => {parsed++; return original(...args);});
    assert.throws(() => parse(raw), /MEMORY_INTAKE_CONFIG_TOO_LARGE/); assert.equal(parsed, 0); mock.mock.restore();
  }
});

test('Host intake oversize whitespace and malformed raw text are rejected without trimming or parsing into records', () => {
  assert.equal(parse(undefined), undefined); assert.equal(parse('  \n\t'), undefined);
  for (const raw of [' '.repeat(128 * 1024 + 1), '{' + 'x'.repeat(128 * 1024)]) {
    assert.throws(() => parse(raw), /MEMORY_INTAKE_CONFIG_TOO_LARGE/);
  }
  assert.throws(() => parse('{invalid-json'), SyntaxError);
});

test('Host intake accepts 1000 valid records and rejects 1001 before per-record/source validation', () => {
  const accepted = parse(JSON.stringify(config(Array.from({length: 1000}, (_, i) => record(i)))));
  assert.equal(accepted.records.length, 1000);
  assert.throws(() => parse(JSON.stringify(config(Array.from({length: 1001}, (_, i) => record(i))))), /MEMORY_INTAKE_RECORD_LIMIT_EXCEEDED/);
  assert.throws(() => parse(JSON.stringify({contractVersion: '0.1.0', records: Array(1001).fill(null)})), /MEMORY_INTAKE_RECORD_LIMIT_EXCEEDED/);
});

test('direct typed adapter input cannot bypass the record count guard or allocate clones over the limit', t => {
  let clones = 0; t.mock.method(globalThis, 'structuredClone', () => {clones++; throw Error('unexpected-clone');});
  assert.throws(() => adapter(config(Array.from({length: 1001}, (_, i) => record(i)))), /MEMORY_INTAKE_RECORD_LIMIT_EXCEEDED/);
  assert.equal(clones, 0);
});

test('bounded synchronous snapshot stays isolated before the first pull and across consumers/pages', () => {
  const parsed = parse(JSON.stringify(config([record(1), record(2)])));
  const first = adapter(parsed), second = adapter(parsed), source = evidence(parsed.source);
  parsed.records[0].summary = 'mutated-before-use'; parsed.records.push({...record(3), sourceId: 's'}); parsed.source.trustLevel = 'HOST_VERIFIED';
  for (const runtime of [first, second]) {
    const page = pull(runtime, personal, {limit: 1}); assert.equal(page.records[0].summary, 's'); assert.equal(page.nextCursor, 'offset:1');
    page.records[0].summary = 'mutated-return'; assert.equal(pull(runtime).records[0].summary, 's');
    const last = pull(runtime, personal, {limit: 1, cursor: page.nextCursor}); assert.equal(last.records.length, 1); assert.equal(last.nextCursor, undefined);
  }
  const metadata = source.describe('s'); assert.equal(metadata.trustLevel, 'DECLARED'); metadata.trustLevel = 'HOST_VERIFIED';
  assert.equal(source.list()[0].trustLevel, 'DECLARED'); assert.equal(source.describe('unknown'), undefined);
});

test('budgeted records preserve Personal/Enterprise isolation and original bounded page/cursor rules', () => {
  const parsed = parse(JSON.stringify(config([record(1), record(2, enterprise('a')), record(3, enterprise('b'))])));
  const runtime = adapter(parsed);
  assert.deepEqual(pull(runtime).records.map(r => r.sourceRecordId), ['1']);
  assert.deepEqual(pull(runtime, enterprise('a')).records.map(r => r.sourceRecordId), ['2']);
  assert.deepEqual(pull(runtime, enterprise('b')).records.map(r => r.sourceRecordId), ['3']);
  assert.throws(() => pull(runtime, personal, {limit: 501}), /MEMORY_INTAKE_LIMIT_INVALID/);
  assert.throws(() => pull(runtime, personal, {cursor: 'arbitrary'}), /MEMORY_INTAKE_CURSOR_INVALID/);
});

test('rejected configuration does not change an existing registered snapshot and corrected input recovers explicitly', () => {
  const registry = createProviderRuntimeRegistry(), original = parse(JSON.stringify(config([record('old')]))), runtime = adapter(original);
  registry.replace(runtime.providerId, runtime); registry.setHealthProbe(runtime.providerId, health(original));
  assert.throws(() => parse(paddedBytes(128 * 1024 + 1)), /MEMORY_INTAKE_CONFIG_TOO_LARGE/);
  assert.equal(registry.get(runtime.providerId), runtime); assert.equal(pull(runtime).records[0].sourceRecordId, 'old');
  const recovered = adapter(parse(JSON.stringify(config([record('recovered')])))); registry.replace(recovered.providerId, recovered);
  assert.equal(pull(registry.get(recovered.providerId)).records[0].sourceRecordId, 'recovered');
  assert.equal(pull(runtime).records[0].sourceRecordId, 'old', 'no claim of lifecycle invalidation for retained direct references');
});

test('remaining configuration validation and canonical source provenance fail closed within the budget', () => {
  assert.throws(() => parse(JSON.stringify(config([record('same'), record('same')]))), /MEMORY_INTAKE_SOURCE_RECORD_DUPLICATE/);
  assert.throws(() => parse(JSON.stringify(config([{...record(1), sourceId: 'other-source'}]))), /MEMORY_INTAKE_RECORD_INVALID/);
  assert.throws(() => parse(JSON.stringify(config([{...record(1), proposedConfidence: 2}]))), /MEMORY_INTAKE_CONFIDENCE_INVALID/);
  const value = parse(JSON.stringify(config([{...record(1), evidenceRefs: ['b', 'a', 'a']}])));
  assert.equal(value.records[0].sourceId, 's'); assert.deepEqual(value.records[0].evidenceRefs, ['a', 'b']);
  assert.equal(value.source.trustLevel, 'DECLARED');
});

test('first use and all pages of the maximum snapshot keep original order and context scope', () => {
  const parsed = parse(JSON.stringify(config(Array.from({length: 1000}, (_, i) => record(i, i % 2 ? enterprise('a') : personal)))));
  assert.ok(Buffer.byteLength(JSON.stringify(config(Array.from({length: 1000}, (_, i) => record(i, i % 2 ? enterprise('a') : personal))))) < 128 * 1024);
  const runtime = adapter(parsed);
  for (const [context, parity] of [[personal, 0], [enterprise('a'), 1]]) {
    const ids = []; let cursor;
    do {const page = pull(runtime, context, {limit: 37, ...(cursor ? {cursor} : {})});
      assert.ok(page.records.length <= 37); ids.push(...page.records.map(r => Number(r.sourceRecordId))); cursor = page.nextCursor;
    } while (cursor);
    assert.deepEqual(ids, Array.from({length: 500}, (_, i) => i * 2 + parity));
  }
});

test('shared source identifiers cannot expand a small raw seed into an over-budget canonical snapshot', () => {
  const value = config(Array.from({length: 1000}, (_, i) => record(i))); value.source.sourceId = 's'.repeat(2048);
  const raw = JSON.stringify(value); assert.ok(Buffer.byteLength(raw) < 128 * 1024);
  assert.throws(() => parse(raw), /MEMORY_INTAKE_RECORD_BYTES_EXCEEDED/);
  value.source.sourceId = 's'; assert.equal(parse(JSON.stringify(value)).records.length, 1000);
});

test('direct canonical snapshot accepts exactly 512 KiB and rejects one more byte before cloning', t => {
  const canonical = parse(JSON.stringify(config([record(1)])));
  const current = Buffer.byteLength(JSON.stringify(canonical.records[0]));
  canonical.records[0].summary += 'x'.repeat(512 * 1024 - current);
  assert.equal(Buffer.byteLength(JSON.stringify(canonical.records[0])), 512 * 1024);
  assert.equal(pull(adapter(canonical)).records.length, 1);
  canonical.records[0].summary += 'x'; let clones = 0;
  t.mock.method(globalThis, 'structuredClone', () => {clones++; throw Error('unexpected-overbudget-clone');});
  assert.throws(() => adapter(canonical), /MEMORY_INTAKE_RECORD_BYTES_EXCEEDED/); assert.equal(clones, 0);
});
