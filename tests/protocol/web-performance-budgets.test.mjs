import test from "node:test";
import assert from "node:assert/strict";

import {
  WEB_SURFACE_BUDGETS_V010,
  evaluateWebSurfaceBudgetV010
} from "../../dist/manager/web-performance-budgets.js";

test("Web Surface budgets preserve independent mobile and desktop envelopes", () => {
  assert.ok(
    WEB_SURFACE_BUDGETS_V010.MOBILE_READ.coldJsBytesMax
    < WEB_SURFACE_BUDGETS_V010.MOBILE_TASK.coldJsBytesMax
  );
  assert.ok(
    WEB_SURFACE_BUDGETS_V010.MOBILE_TASK.coldJsBytesMax
    < WEB_SURFACE_BUDGETS_V010.DESKTOP_WORKBENCH.coldJsBytesMax
  );
  assert.equal(WEB_SURFACE_BUDGETS_V010.MOBILE_READ.warmJsBytesMax, 0);
});

test("budget evaluator reports only observed regressions above explicit limits", () => {
  assert.deepEqual(
    evaluateWebSurfaceBudgetV010("MOBILE_READ", {
      coldJsBytes: 18_243,
      warmJsBytes: 0,
      firstContentfulPaintMs: 1_200,
      largestContentfulPaintMs: 1_500,
      longTaskTotalMs: 100
    }),
    []
  );

  const violations = evaluateWebSurfaceBudgetV010("MOBILE_READ", {
    coldJsBytes: 31_000,
    warmJsBytes: 1
  });
  assert.deepEqual(
    violations.map(item => item.metric),
    ["coldJsBytes", "warmJsBytes"]
  );
});
