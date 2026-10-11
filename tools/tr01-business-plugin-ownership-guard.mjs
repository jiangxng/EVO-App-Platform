// TR-01 scoped architecture tripwire. Deliberately not a repository-wide linter:
// it protects the already-established reference flow without rewriting legacy
// compatibility modules or prejudging the later B2D4/EVO owner plugin boundary.
export const TR01_BUSINESS_GUARD_FILES_V010 = Object.freeze([
  "apps/counterparty/package.ts",
  "apps/item/package.ts",
  "apps/warehouse/package.ts",
  "apps/trading-reference/package.ts",
  "apps/trading-reference/purchase-loop.ts",
  "apps/trading-reference/sales-loop.ts",
  "apps/trading-reference/finance-intent-admission.ts",
  "contracts/evo-business-data.ts"
]);

const requiredPolicy = {
  applicationPackage: "apps/trading-reference/package.ts",
  masterObjectPackages: [
    "apps/counterparty/package.ts",
    "apps/item/package.ts",
    "apps/warehouse/package.ts"
  ],
  factComposers: [
    "apps/trading-reference/purchase-loop.ts",
    "apps/trading-reference/sales-loop.ts"
  ],
  publicEvoBusinessDataPort: "contracts/evo-business-data.ts",
  financeIntentPreflight: "apps/trading-reference/finance-intent-admission.ts",
  deterministicLedgerOwner: "EVO",
  applicationOwner: "APPLICATION",
  hostCoreRole: "GENERIC_LIFECYCLE_AUTHORIZATION_COMPOSITION",
  financialExecutionState: "READ_ONLY_NOT_ADMITTED"
};

const immutableReferenceFacts = {
  "apps/trading-reference/purchase-loop.ts": [
    "purchase_order.approved", "goods_receipt.received", "goods_receipt.reversed"
  ],
  "apps/trading-reference/sales-loop.ts": [
    "sales_order.approved", "production.completed",
    "sales_shipment.created", "cash.received"
  ]
};

const forbiddenDomainSource = [
  [/(?:from\s*["'](?:node:)?(?:pg|kysely|sqlite3|better-sqlite3)(?:\/[^"']*)?["'])/u,
    "direct SQL/database implementation import"],
  [/(?:from\s*["'][^"']*(?:\/manager\/|\/modules\/(?:cost|allocation|valuation)\/)[^"']*["'])/u,
    "Host private manager or EVO private runtime import"],
  [/\b(?:runtime\.cost|runtime\.allocation|runtime\.ledger|process\.env\.DATABASE_URL)\b/u,
    "private ledger/cost/allocation runtime access"],
  [/\/api\/v1\/demo\//u, "demo EVO financial endpoint"],
  [/\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(?:ledger_|allocation_|cost_run)/iu,
    "direct financial table mutation"]
];

function equalJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Pure inspection allows CI tests to verify both green baseline and red-path
 * injection without mutating the real source tree.
 */
export function inspectTr01BusinessPluginOwnershipV010({ policy, files }) {
  const errors = [];
  const configured = policy?.businessPluginOwnership?.tr01;
  if (!configured || typeof configured !== "object") {
    errors.push("TR-01 business plugin ownership policy missing.");
  } else {
    for (const [key, expected] of Object.entries(requiredPolicy)) {
      if (!equalJson(configured[key], expected)) {
        errors.push("TR-01 business ownership policy drift: " + key);
      }
    }
  }

  function source(path) {
    const value = files?.[path];
    if (typeof value !== "string") {
      errors.push("TR-01 architecture guard missing source: " + path);
      return "";
    }
    return value;
  }

  const publicPort = source(requiredPolicy.publicEvoBusinessDataPort);
  if (!/interface\s+EvoBusinessDataAdapterV010\b/u.test(publicPort)
      || !/submit\s*\(/u.test(publicPort)) {
    errors.push("EVO immutable BusinessData public adapter contract missing.");
  }

  for (const path of requiredPolicy.masterObjectPackages) {
    const app = source(path);
    if (!/\btype:\s*["']APPLICATION["']/u.test(app)
        || !/\bactivationScope:\s*["']INSTALLATION["']/u.test(app)) {
      errors.push("Foundation object must retain install-scoped Application package: " + path);
    }
  }

  const trading = source(requiredPolicy.applicationPackage);
  if (!/\btype:\s*["']APPLICATION["']/u.test(trading)
      || !/\bactivationScope:\s*["']INSTALLATION["']/u.test(trading)) {
    errors.push("Trading Reference business composition must remain an install-scoped APPLICATION.");
  }
  if (!/\beffect:\s*["']READ["']/u.test(trading)
      || /\beffect:\s*["'](?:WRITE|EXECUTE|MUTATE)["']/u.test(trading)) {
    errors.push("TR-01 B2D3 Trading Reference package must remain read-only; financial writes require a separate admitted B2D4 capability.");
  }
  if (!/kind:\s*["']eidos\.experience["']/u.test(trading)) {
    errors.push("Trading Reference Human Experience must be an Application contribution, not Host-owned UI.");
  }

  for (const path of requiredPolicy.factComposers) {
    const business = source(path);
    if (!/\bEvoBusinessDataAdapterV010\b/u.test(business)
        || !/input\.adapter\.submit\s*\(/u.test(business)) {
      errors.push("Business facts must be submitted by the Application via public EVO adapter: " + path);
    }
    for (const fact of immutableReferenceFacts[path]) {
      if (!business.includes('"' + fact + '"')) {
        errors.push("TR-01 immutable business fact missing from Application: " + fact);
      }
    }
    for (const [pattern, label] of forbiddenDomainSource) {
      if (pattern.test(business)) {
        errors.push("TR-01 Application bypasses owner boundary (" + label + "): " + path);
      }
    }
  }

  const preflight = source(requiredPolicy.financeIntentPreflight);
  if (!/executionAllowed:\s*false\b/u.test(preflight)
      || !/resolveOwnerPreflight/u.test(preflight)
      || !/TR01B2D_OWNER_PLUGIN_NOT_ADMITTED/u.test(preflight)) {
    errors.push("B2D3 finance preflight must remain fail-closed, owner-gated and executionAllowed:false.");
  }
  for (const [pattern, label] of forbiddenDomainSource) {
    if (pattern.test(preflight)) {
      errors.push("Finance preflight bypasses owner boundary (" + label + ").");
    }
  }
  return errors;
}
