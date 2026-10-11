import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {
  collectEvoRuntimeBoundarySourcesV010,
  inspectEvoRuntimeSingleOwnerV010
} from '../../tools/tr01-evo-runtime-single-owner-guard.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));

test('Platform does not implement a second EVO FIFO, allocation or Ledger engine',()=>{
  const sources=collectEvoRuntimeBoundarySourcesV010(root);
  assert.ok(Object.keys(sources).length>40,'must scan the Platform source tree, not an empty fixture');
  assert.deepEqual(inspectEvoRuntimeSingleOwnerV010(sources),[]);
});

test('a future private EVO engine import is rejected',()=>{
  const issues=inspectEvoRuntimeSingleOwnerV010({
    'apps/sales/duplicate.ts': 'import { CostEngine } from "../../EVO/modules/cost/application/engine.js";'
  });
  assert.ok(issues.some(x=>x.includes('private EVO finance/ledger module')));
});

test('a duplicate allocation runtime or direct financial table write is rejected',()=>{
  const issues=inspectEvoRuntimeSingleOwnerV010({
    'apps/cash/duplicate.ts': 'class AllocationEngine {}\nconst sql="INSERT INTO allocation_instruction (id) VALUES ($1)";'
  });
  assert.ok(issues.some(x=>x.includes('duplicate financial/ledger engine declaration')));
  assert.ok(issues.some(x=>x.includes('direct write/schema ownership')));
});

test('public EVO delegation, guards and declared finance request shape remain allowed',()=>{
  assert.deepEqual(inspectEvoRuntimeSingleOwnerV010({
    'apps/purchasing/adapter.ts': `import type {EvoBusinessDataAdapterV010} from '../../contracts/evo-business-data.js';
      // FIFO calculation must stay in EVO
      export const costReport = (view) => view.inventoryBalance;
      export function verifyDelegation(input) { return input.executionAllowed === false; }`
  }),[]);
});
