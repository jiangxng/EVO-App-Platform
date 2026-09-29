export type WebBudgetSurfaceV010 =
  | "DESKTOP_WORKBENCH"
  | "MOBILE_TASK"
  | "MOBILE_READ"
  | "HANDOFF";

export interface WebSurfaceBudgetV010 {
  surface: WebBudgetSurfaceV010;
  coldJsBytesMax: number;
  warmJsBytesMax: number;
  firstContentfulPaintMsMax?: number;
  largestContentfulPaintMsMax?: number;
  longTaskTotalMsMax?: number;
}

export const WEB_SURFACE_BUDGETS_V010: Record<
  WebBudgetSurfaceV010,
  WebSurfaceBudgetV010
> = {
  DESKTOP_WORKBENCH: {
    surface: "DESKTOP_WORKBENCH",
    coldJsBytesMax: 130_000,
    warmJsBytesMax: 0,
    firstContentfulPaintMsMax: 5_000,
    largestContentfulPaintMsMax: 7_000,
    longTaskTotalMsMax: 2_000
  },
  MOBILE_TASK: {
    surface: "MOBILE_TASK",
    coldJsBytesMax: 55_000,
    warmJsBytesMax: 0,
    firstContentfulPaintMsMax: 4_000,
    largestContentfulPaintMsMax: 6_000,
    longTaskTotalMsMax: 1_500
  },
  MOBILE_READ: {
    surface: "MOBILE_READ",
    coldJsBytesMax: 30_000,
    warmJsBytesMax: 0,
    firstContentfulPaintMsMax: 3_500,
    largestContentfulPaintMsMax: 5_000,
    longTaskTotalMsMax: 1_000
  },
  HANDOFF: {
    surface: "HANDOFF",
    coldJsBytesMax: 20_000,
    warmJsBytesMax: 0,
    firstContentfulPaintMsMax: 3_000,
    largestContentfulPaintMsMax: 4_500,
    longTaskTotalMsMax: 750
  }
};

export interface WebBudgetObservationV010 {
  coldJsBytes?: number;
  warmJsBytes?: number;
  firstContentfulPaintMs?: number;
  largestContentfulPaintMs?: number;
  longTaskTotalMs?: number;
}

export interface WebBudgetViolationV010 {
  metric: keyof WebBudgetObservationV010;
  observed: number;
  maximum: number;
}

export function evaluateWebSurfaceBudgetV010(
  surface: WebBudgetSurfaceV010,
  observed: WebBudgetObservationV010
): WebBudgetViolationV010[] {
  const budget = WEB_SURFACE_BUDGETS_V010[surface];
  const checks: Array<[
    keyof WebBudgetObservationV010,
    number | undefined
  ]> = [
    ["coldJsBytes", budget.coldJsBytesMax],
    ["warmJsBytes", budget.warmJsBytesMax],
    ["firstContentfulPaintMs", budget.firstContentfulPaintMsMax],
    ["largestContentfulPaintMs", budget.largestContentfulPaintMsMax],
    ["longTaskTotalMs", budget.longTaskTotalMsMax]
  ];

  const violations: WebBudgetViolationV010[] = [];
  for (const [metric, maximum] of checks) {
    const value = observed[metric];
    if (
      maximum !== undefined
      && value !== undefined
      && Number.isFinite(value)
      && value > maximum
    ) {
      violations.push({
        metric,
        observed: value,
        maximum
      });
    }
  }
  return violations;
}
