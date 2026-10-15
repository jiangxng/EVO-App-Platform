/**
 * PA05-02B experimental READ execution guard. Explicit opt-in only.
 *
 * This wraps the existing Action Host, not its authorization/receipt or business
 * owner. It does not register a plugin, touch Agent core, or enable production.
 * Only exact admitted READ operation IDs can pass through this gateway.
 * Schema subset / runtime wiring must be independently signed before use.
 */
import { createHash } from "node:crypto";
import {
  certifyCapabilitySchemaDefinitionV010,
  certifyCapabilitySchemaValueV010
} from "./capability-operation-schema-fixture.mjs";
import {
  checkCapabilityOperationActionV010
} from "../dist/manager/capability-operation-access.js";

function failure(context, code) {
  return {
    ok: false,
    ...(typeof context?.correlationId === "string"
      ? { correlationId: context.correlationId } : {}),
    error: { code, message: "Certified READ operation unavailable or rejected." }
  };
}

function digest(operation) {
  return createHash("sha256").update(JSON.stringify({
    operationId: operation.operationId,
    capability: operation.capability,
    operationVersion: operation.operationVersion,
    packageId: operation.packageId,
    featureId: operation.featureId,
    effect: operation.effect,
    dataScope: operation.dataScope,
    authorization: operation.authorization,
    exposure: operation.exposure,
    binding: operation.binding,
    inputSchema: operation.inputSchema,
    outputSchema: operation.outputSchema
  })).digest("hex");
}

function currentOperation(manager, operationId) {
  try {
    const matching = manager.listEffectiveCapabilityOperations()
      .filter(operation => operation.operationId === operationId);
    return matching.length === 1 ? matching[0] : undefined;
  } catch {
    return undefined;
  }
}

function schemaAccepted(operation) {
  return certifyCapabilitySchemaDefinitionV010(operation.inputSchema).ok
    && certifyCapabilitySchemaDefinitionV010(operation.outputSchema).ok;
}

/**
 * @param {object} deps
 * @param {object} deps.manager Existing lifecycle-managed AppManager.
 * @param {object} deps.actionRouter Existing Action Host router.
 * @param {Function} deps.resolveAuthorizationProvider Live Host auth resolver.
 * @param {string[]} deps.certifiedOperationIds Exact READ IDs. No wildcard.
 */
export function createPa05CertifiedReadActionGatewayV010(deps) {
  const { manager, actionRouter, resolveAuthorizationProvider } = deps ?? {};
  const ids = deps?.certifiedOperationIds;
  if (!manager || !actionRouter || typeof actionRouter.execute !== "function"
    || typeof resolveAuthorizationProvider !== "function"
    || !Array.isArray(ids) || ids.length === 0
    || ids.some(id => typeof id !== "string" || !id.trim())
    || new Set(ids).size !== ids.length) {
    throw new Error("PA05_READ_GATEWAY_ADMISSION_INVALID");
  }

  const admitted = new Map();
  for (const id of ids) {
    const operation = currentOperation(manager, id);
    if (!operation || operation.effect !== "READ"
      || operation.binding?.type !== "ACTION_HOST"
      || !schemaAccepted(operation)) {
      throw new Error("PA05_READ_GATEWAY_SCHEMA_OR_OPERATION_NOT_CERTIFIED");
    }
    if (admitted.has(operation.binding.commandCode)) {
      throw new Error("PA05_READ_GATEWAY_BINDING_CONFLICT");
    }
    admitted.set(operation.binding.commandCode, {
      operationId: id,
      fingerprint: digest(operation)
    });
  }

  // The shared Capability Access preflight does not independently refuse
  // nonempty authorization obligations. For this *strict* READ gateway we do.
  const liveProvider = () => {
    const actual = resolveAuthorizationProvider();
    if (!actual) return undefined;
    return {
      providerId: actual.providerId,
      async check(input) {
        const result = await actual.check(input);
        if (result.obligations?.length) {
          return {
            ...result,
            allowed: false,
            reasonCodes: ["PA05_UNFULFILLED_AUTHORIZATION_OBLIGATIONS"]
          };
        }
        return result;
      }
    };
  };

  return {
    async execute(request, context) {
      const admission = admitted.get(request?.command?.code);
      if (!admission) return failure(context, "PA05_READ_GATEWAY_OPERATION_NOT_ADMITTED");
      // Keep one request-bound identity/scope, never reinterpret client text as
      // an Actor or Enterprise binding. The underlying Action Host rechecks.
      if (!context || request?.contractVersion !== "0.1.0"
        || request?.type !== "command") {
        return failure(context, "PA05_READ_GATEWAY_REQUEST_INVALID");
      }
      const resolvedContext = structuredClone(context);
      const resolvedRequest = structuredClone(request);
      const selected = currentOperation(manager, admission.operationId);
      if (!selected || digest(selected) !== admission.fingerprint
        || selected.binding.commandCode !== resolvedRequest.command.code) {
        return failure(resolvedContext, "PA05_READ_GATEWAY_OPERATION_CHANGED");
      }
      const check = () => checkCapabilityOperationActionV010({
        manager,
        resolveAuthorizationProvider: liveProvider,
        request: resolvedRequest,
        context: resolvedContext
      });
      // Current authorization must precede instance validation: denied callers
      // should not learn business schema specifics from a validation response.
      const preflight = await check();
      if (preflight) return preflight;
      const input = certifyCapabilitySchemaValueV010(
        selected.inputSchema, resolvedRequest.values
      );
      if (!input.ok) return failure(resolvedContext, "PA05_READ_GATEWAY_INPUT_INVALID");
      let result;
      try {
        result = await actionRouter.execute(resolvedRequest, resolvedContext);
      } catch {
        return failure(resolvedContext, "PA05_READ_GATEWAY_OWNER_FAILED");
      }
      if (result?.ok !== true) return result ?? failure(resolvedContext, "PA05_READ_GATEWAY_OWNER_FAILED");
      // A running READ may race a plugin disable/upgrade or permission revoke;
      // suppress any stale/sensitive result before publishing it to the Agent.
      const current = currentOperation(manager, admission.operationId);
      if (!current || digest(current) !== admission.fingerprint) {
        return failure(resolvedContext, "PA05_READ_GATEWAY_OPERATION_CHANGED");
      }
      const postflight = await check();
      if (postflight) return postflight;
      if (!certifyCapabilitySchemaValueV010(
        selected.outputSchema, result.result, { side: "output" }
      ).ok) {
        return failure(resolvedContext, "PA05_READ_GATEWAY_OUTPUT_INVALID");
      }
      return result;
    }
  };
}
