import test from 'node:test';
import assert from 'node:assert/strict';

import { counterpartyPackage } from '../../dist/apps/counterparty/package.js';
import { dataImportPackage } from '../../dist/apps/data-import/package.js';
import { itemPackage } from '../../dist/apps/item/package.js';
import { warehousePackage } from '../../dist/apps/warehouse/package.js';
import { createCounterpartyProjectionPageV010 } from '../../dist/apps/counterparty/page.js';
import {
  COUNTERPARTY_CUSTOMERS_ROUTE,
  COUNTERPARTY_MY_CUSTOMERS_ROUTE,
  COUNTERPARTY_MY_SUPPLIERS_ROUTE,
  COUNTERPARTY_SUPPLIERS_ROUTE
} from '../../dist/apps/counterparty/constants.js';
import {
  COUNTERPARTY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
  COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
  COUNTERPARTY_SUPPLIER_PROJECTION_V010
} from '../../dist/apps/counterparty/projections.js';
import {
  dataImportUploadRouteV010,
  parseDataImportUploadIntentV010
} from '../../dist/apps/data-import/constants.js';
import { createDataImportDirectoryPageV010 } from '../../dist/apps/data-import/page.js';

const experience = pkg => pkg.features[0].contributions.find(
  contribution => contribution.kind === 'eidos.experience'
).manifest;
const page = (projectionId, options = {}) => createCounterpartyProjectionPageV010({
  projectionId, counterparties: [], locale: 'zh-CN', canManage: true, ...options
});

test('application navigation has two business destinations and one cross-object import center', () => {
  assert.deepEqual(experience(counterpartyPackage).navigation.map(item => item.route), [
    COUNTERPARTY_CUSTOMERS_ROUTE, COUNTERPARTY_SUPPLIERS_ROUTE
  ]);
  assert.deepEqual(experience(dataImportPackage).navigation.map(item => [item.label, item.route]), [
    ['Import Center', '/data-import']
  ]);

  const targets = [counterpartyPackage, itemPackage, warehousePackage].flatMap(pkg =>
    pkg.features[0].contributions
      .filter(contribution => contribution.kind === 'platform.data-import-target')
      .map(contribution => contribution.target)
  );
  assert.deepEqual(targets.map(target => target.targetId).sort(), [
    'counterparty.subject', 'item.subject', 'warehouse.location'
  ]);
  const center = createDataImportDirectoryPageV010({
    targets, jobs: [], locale: 'zh-CN'
  });
  assert.equal(center.title, '导入中心');
  assert.deepEqual(center.actions.map(action => action.id).sort(), [
    'import:counterparty.subject', 'import:item.subject', 'import:warehouse.location'
  ]);
  assert.match(center.description, /已启用的数据对象/);

  const history = createDataImportDirectoryPageV010({
    targets: [targets[0]],
    jobs: [{
      importJobId: 'prior', targetId: targets[0].targetId,
      state: 'COMMITTED', stagedAt: '2026-10-29T00:00:00.000Z',
      source: { kind: 'CSV', name: '客户.csv', headers: [], rows: [] }, mapping: []
    }, {
      importJobId: 'inactive', targetId: 'later.target',
      state: 'COMMITTED', stagedAt: '2026-10-28T00:00:00.000Z',
      source: { kind: 'CSV', name: '旧任务.csv', headers: [], rows: [] }, mapping: []
    }],
    locale: 'zh-CN'
  });
  assert.match(history.items[0].summary, /往来对象/);
  assert.match(history.items[1].summary, /当前未启用的导入对象/);
  assert.equal(history.items[1].summary.includes('later.target'), false);
});

test('customer and supplier journeys keep scope switching local and import returns to its own list', () => {
  for (const [allId, myId, allRoute, myRoute, role] of [
    [COUNTERPARTY_CUSTOMER_PROJECTION_V010, COUNTERPARTY_MY_CUSTOMER_PROJECTION_V010,
      COUNTERPARTY_CUSTOMERS_ROUTE, COUNTERPARTY_MY_CUSTOMERS_ROUTE, 'CUSTOMER'],
    [COUNTERPARTY_SUPPLIER_PROJECTION_V010, COUNTERPARTY_MY_SUPPLIER_PROJECTION_V010,
      COUNTERPARTY_SUPPLIERS_ROUTE, COUNTERPARTY_MY_SUPPLIERS_ROUTE, 'SUPPLIER']
  ]) {
    const importRoute = dataImportUploadRouteV010('counterparty.subject', {
      relationshipMode: role
    });
    const all = page(allId, { importRoute });
    assert.deepEqual(all.actions.map(action => action.id), ['responsibility-scope', 'import']);
    assert.equal(all.actions[0].route, myRoute);
    assert.equal(all.actions[1].route, importRoute);
    assert.deepEqual(parseDataImportUploadIntentV010(importRoute), {
      targetId: 'counterparty.subject', initialParameters: { relationshipMode: role }
    });

    const mine = page(myId, { importRoute });
    assert.deepEqual(mine.actions.map(action => action.id), ['responsibility-scope']);
    assert.equal(mine.actions[0].route, allRoute);
    assert.equal(mine.contextNavigation.items[0].route, '/counterparties');

    const reader = page(allId, { canManage: false, importRoute });
    assert.deepEqual(reader.actions.map(action => action.id), ['responsibility-scope']);
    const unavailable = page(allId);
    assert.deepEqual(unavailable.actions.map(action => action.id), ['responsibility-scope']);

    const searched = page(allId, {
      tableQuery: { search: '上海', sort: 'displayName', direction: 'desc', page: 3 }
    });
    assert.equal(searched.actions[0].route,
      myRoute + '?search=%E4%B8%8A%E6%B5%B7&sort=displayName&direction=desc&page=0&pageSize=25');
  }
});
