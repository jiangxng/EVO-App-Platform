import test from "node:test";
import assert from "node:assert/strict";

import {
  createEnterpriseOperatingGraphV010 as appCreateGraph,
  applyEnterpriseOperatingGraphOperationV010 as appApplyGraph
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-model.js";
import {
  createMemoryEnterpriseOperatingGraphStoreV010 as appCreateStore
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010 as appCreateService
} from "../../dist/apps/eog-2d-designer/enterprise-operating-graph-service.js";

import {
  createEnterpriseOperatingGraphV010 as compatibilityCreateGraph,
  applyEnterpriseOperatingGraphOperationV010 as compatibilityApplyGraph
} from "../../dist/manager/enterprise-operating-graph-model.js";
import {
  createMemoryEnterpriseOperatingGraphStoreV010 as compatibilityCreateStore
} from "../../dist/manager/enterprise-operating-graph-store.js";
import {
  createEnterpriseOperatingGraphHostServiceV010 as compatibilityCreateService
} from "../../dist/manager/enterprise-operating-graph-service.js";

test("EOG 2D Designer physically owns semantic model/store/service implementation", () => {
  assert.equal(compatibilityCreateGraph, appCreateGraph);
  assert.equal(compatibilityApplyGraph, appApplyGraph);
  assert.equal(compatibilityCreateStore, appCreateStore);
  assert.equal(compatibilityCreateService, appCreateService);
});
