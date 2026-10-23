/**
 * PA05-05 E01A — non-production Host composition preflight only.
 *
 * A manifest and an active Capability Operation are NOT a working Host
 * integration. This function examines the *actual manager snapshot* and
 * the *handlers supplied by the composing Host*, not Agent-provided claims.
 * The handler inventory is not cryptographically attested: even a READY
 * composition cannot sign a real Human/Provider/enterprise environment.
 *
 * This function never installs, invokes, grants, writes, or deploys.
 */
const required = (value, name) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("PA05_E01_PREFLIGHT_CONFIG_INVALID:" + name);
  }
  return value;
};

function handlersFor(all, commandCode) {
  return all.filter(handler => handler?.commandCode === commandCode);
}

const unsatisfiedRealWorldGates = Object.freeze([
  "HUMAN_APPROVED_ACTUAL_INSTALLATION",
  "LIVE_HOST_ACTION_REGISTRATION_ATTESTED",
  "REAL_ENTERPRISE_DATA_AND_TENANT_BINDING",
  "TWO_INDEPENDENT_AUTHENTICATED_PRINCIPALS",
  "REAL_AUTHORIZATION_PROVIDER_AND_GRANTS",
  "REAL_MODEL_PROVIDER_ENVIRONMENT_AND_BROWSER",
  "HUMAN_ACCEPTANCE_AND_ORIGINAL_OWNER_EVIDENCE"
]);

export function inspectPa05E01HostReadinessV010(input) {
  if (!input || typeof input.manager?.listEffectiveCapabilityOperations !== "function" ||
      !Array.isArray(input.hostActionHandlers)) {
    throw new Error("PA05_E01_PREFLIGHT_TRUSTED_INPUT_REQUIRED");
  }
  const targetPackageId = required(input.targetPackageId, "targetPackageId");
  const targetOperationId = required(input.targetOperationId, "targetOperationId");
  const sourcePackageId = required(input.sourcePackageId, "sourcePackageId");
  const sourceOperationId = required(input.sourceOperationId, "sourceOperationId");
  if (targetPackageId === sourcePackageId || targetOperationId === sourceOperationId) {
    throw new Error("PA05_E01_PREFLIGHT_SEPARATE_BUSINESS_OWNERS_REQUIRED");
  }
  const all = input.manager.listEffectiveCapabilityOperations();
  if (!Array.isArray(all)) {
    throw new Error("PA05_E01_PREFLIGHT_EFFECTIVE_CATALOG_REQUIRED");
  }
  const blockers = [];
  const inspectOperation = (operationId, packageId, prefix) => {
    const matches = all.filter(op => op?.operationId === operationId);
    if (matches.length !== 1 || matches[0].packageId !== packageId) {
      blockers.push(prefix + "_OPERATION_NOT_ACTIVE_OR_OWNER_MISMATCH");
      return null;
    }
    const operation = matches[0];
    if (operation.effect !== "READ" ||
        !["HUMAN", "PERSONAL_AGENT"].every(x => operation.exposure?.includes(x)) ||
        operation.binding?.type !== "ACTION_HOST" ||
        typeof operation.binding?.commandCode !== "string" ||
        !operation.binding.commandCode ||
        typeof operation.binding?.inputVersion !== "string" ||
        !operation.binding.inputVersion ||
        typeof operation.featureId !== "string" || !operation.featureId) {
      blockers.push(prefix + "_READ_CONTRACT_NOT_READY");
      return null;
    }
    return operation;
  };

  const target = inspectOperation(targetOperationId, targetPackageId, "TARGET");
  const source = inspectOperation(sourceOperationId, sourcePackageId, "SOURCE");
  const checkHandler = (operation, prefix) => {
    if (!operation) return;
    const matches = handlersFor(input.hostActionHandlers, operation.binding.commandCode);
    if (matches.length !== 1) {
      blockers.push(prefix + (matches.length === 0
        ? "_ACTION_HANDLER_NOT_REGISTERED" : "_ACTION_HANDLER_CONFLICT"));
      return;
    }
    const handler = matches[0];
    if (handler.packageId !== operation.packageId ||
        handler.featureId !== operation.featureId ||
        typeof handler.execute !== "function") {
      blockers.push(prefix + "_ACTION_HANDLER_OWNER_MISMATCH");
    }
  };
  checkHandler(target, "TARGET");
  checkHandler(source, "SOURCE");

  // Even with all executable pieces in an isolated Host composition,
  // deployment origin, genuine data, Human/Agent sessions, live Provider and
  // explicit acceptance cannot be proven by a caller-supplied handler list.
  return Object.freeze({
    contractVersion: "0.1.0",
    gate: "PA05-05/E01A",
    targetPackageId,
    targetOperationId,
    sourcePackageId,
    sourceOperationId,
    hostCompositionReady: blockers.length === 0,
    blockers: Object.freeze(blockers),
    outstandingRealEnvironmentGates: unsatisfiedRealWorldGates,
    e01ProductionCertified: false,
    pa05Signed: false,
    productionWriteEnabled: false
  });
}
