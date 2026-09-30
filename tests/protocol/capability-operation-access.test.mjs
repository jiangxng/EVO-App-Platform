import test from "node:test";
import assert from "node:assert/strict";

import { createAppActionRouter } from "../../dist/actions/router.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  capabilityOperationPublicMetadataV010,
  createCapabilityOperationActionPreExecuteV010,
  listAuthorizedCapabilityOperationsV010
} from "../../dist/manager/capability-operation-access.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";

function plugin({
  operationId = "sample.read",
  commandCode = "sample.read",
  dataScope = "INSTALLATION",
  exposure = ["HUMAN", "EXTERNAL_AGENT"],
  idSource = "NONE"
} = {}) {
  return {
    contractVersion: "0.1.0",
    packageId: "sample-plugin",
    displayName: "Sample Plugin",
    version: "0.1.0",
    type: "APPLICATION",
    features: [{
      contractVersion: "0.1.0",
      featureId: "sample-plugin.default",
      packageId: "sample-plugin",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: ["sample"],
      contributions: [{
        kind: "platform.capability-operation",
        operation: {
          contractVersion: "0.1.0",
          operationId,
          capability: "sample",
          operationVersion: "1.0.0",
          title: "Sample Read",
          description: "Reads sample data.",
          effect: "READ",
          dataScope,
          authorization: {
            action: "sample.read",
            resource: {
              type: "sample",
              idSource
            }
          },
          inputSchema: {
            type: "object",
            additionalProperties: false,
            properties: {}
          },
          outputSchema: {
            type: "object"
          },
          binding: {
            type: "ACTION_HOST",
            commandCode,
            inputVersion: "0.1.0"
          },
          exposure
        }
      }]
    }]
  };
}

function managerFor(pkg = plugin()) {
  const manager = createAppManagerService(
    createPackageCatalog([pkg]),
    createMemoryLifecycleStore()
  );
  manager.install(pkg.packageId);
  return manager;
}

function humanContext({
  enterprise = false,
  companyId,
  workspaceId
} = {}) {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "human-1",
      actorType: "HUMAN",
      identityProviderId: "test.identity"
    },
    scope: {
      contractVersion: "0.1.0",
      ...(enterprise ? { enterpriseId: "ent-1" } : {}),
      ...(companyId ? { companyId } : {}),
      ...(workspaceId ? { workspaceId } : {}),
      userId: "human-1"
    },
    context: enterprise
      ? {
          contractVersion: "0.1.0",
          personalContext: {
            contractVersion: "0.1.0",
            contextId: "personal:human-1",
            subjectId: "human-1"
          },
          activeContext: {
            contractVersion: "0.1.0",
            kind: "ENTERPRISE",
            contextId: "enterprise:ent-1",
            enterpriseId: "ent-1"
          },
          enterpriseContext: {
            contractVersion: "0.1.0",
            kind: "ENTERPRISE",
            contextId: "enterprise:ent-1",
            enterpriseId: "ent-1",
            enterpriseProviderId: "test.enterprise",
            displayName: "Enterprise 1"
          }
        }
      : {
          contractVersion: "0.1.0",
          personalContext: {
            contractVersion: "0.1.0",
            contextId: "personal:human-1",
            subjectId: "human-1"
          },
          activeContext: {
            contractVersion: "0.1.0",
            kind: "PERSONAL",
            contextId: "personal:human-1"
          }
        },
    correlationId: "corr-1",
    locale: "en"
  };
}

function provider({ allowed = true, calls = [] } = {}) {
  return {
    providerId: "test.authorization",
    check(input) {
      calls.push(structuredClone(input));
      return {
        contractVersion: "0.1.0",
        allowed,
        policyProviderId: "test.authorization",
        reasonCodes: [allowed ? "TEST_ALLOW" : "TEST_DENY"]
      };
    }
  };
}

function request({
  code = "sample.read",
  inputVersion = "0.1.0",
  values = {}
} = {}) {
  return {
    contractVersion: "0.1.0",
    type: "command",
    command: { code, inputVersion },
    values,
    sourceInteractionId: "test",
    actionId: "test",
    requiresConfirmation: false
  };
}

test("authorized catalog exposes only operations allowed by current policy", async () => {
  const manager = managerFor();
  const calls = [];
  const catalog = await listAuthorizedCapabilityOperationsV010({
    manager,
    authorizationProvider: provider({ calls }),
    requestContext: humanContext(),
    audience: "HUMAN"
  });

  assert.deepEqual(
    catalog.operations.map(item => item.operationId),
    ["sample.read"]
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].action, "sample.read");
  assert.equal(calls[0].resource.type, "sample");
  assert.equal(calls[0].scope.userId, "human-1");
  assert.equal(calls[0].context.operationId, "sample.read");
});

test("authorization denial hides operation and missing Provider fails closed", async () => {
  const manager = managerFor();

  const denied = await listAuthorizedCapabilityOperationsV010({
    manager,
    authorizationProvider: provider({ allowed: false }),
    requestContext: humanContext(),
    audience: "HUMAN"
  });
  assert.deepEqual(denied.operations, []);
  assert.equal(denied.evaluations[0].reasonCodes[0], "TEST_DENY");

  const missing = await listAuthorizedCapabilityOperationsV010({
    manager,
    authorizationProvider: undefined,
    requestContext: humanContext(),
    audience: "HUMAN"
  });
  assert.deepEqual(missing.operations, []);
  assert.equal(
    missing.evaluations[0].reasonCodes[0],
    "AUTHORIZATION_PROVIDER_REQUIRED"
  );
});

test("External Agent discovery remains closed until delegated authority exists", async () => {
  const calls = [];
  const catalog = await listAuthorizedCapabilityOperationsV010({
    manager: managerFor(),
    authorizationProvider: provider({ calls }),
    requestContext: humanContext(),
    audience: "EXTERNAL_AGENT"
  });

  assert.deepEqual(catalog.operations, []);
  assert.equal(calls.length, 0);
  assert.equal(
    catalog.evaluations[0].reasonCodes[0],
    "EXTERNAL_AGENT_DELEGATED_AUTHORITY_REQUIRED"
  );
});

test("Enterprise-scoped operation is hidden outside an active Enterprise Context", async () => {
  const manager = managerFor(plugin({
    dataScope: "ENTERPRISE",
    idSource: "DATA_SCOPE"
  }));

  const personal = await listAuthorizedCapabilityOperationsV010({
    manager,
    authorizationProvider: provider(),
    requestContext: humanContext(),
    audience: "HUMAN"
  });
  assert.deepEqual(personal.operations, []);
  assert.equal(
    personal.evaluations[0].reasonCodes[0],
    "CAPABILITY_OPERATION_DATA_SCOPE_UNAVAILABLE"
  );

  const calls = [];
  const enterprise = await listAuthorizedCapabilityOperationsV010({
    manager,
    authorizationProvider: provider({ calls }),
    requestContext: humanContext({ enterprise: true }),
    audience: "HUMAN"
  });
  assert.deepEqual(
    enterprise.operations.map(item => item.operationId),
    ["sample.read"]
  );
  assert.equal(calls[0].resource.id, "ent-1");
});

test("Capability Operation direct Host Action invocation cannot bypass authorization", async () => {
  const manager = managerFor();
  let handlerCalls = 0;
  const handler = {
    packageId: "sample-plugin",
    featureId: "sample-plugin.default",
    commandCode: "sample.read",
    async execute() {
      handlerCalls += 1;
      return { ok: true, result: { value: 1 } };
    }
  };

  const deniedRouter = createAppActionRouter(
    [handler],
    () => true,
    createCapabilityOperationActionPreExecuteV010({
      manager,
      resolveAuthorizationProvider() {
        return provider({ allowed: false });
      }
    })
  );
  const denied = await deniedRouter.execute(request(), humanContext());
  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "TEST_DENY");
  assert.equal(handlerCalls, 0);

  const allowedRouter = createAppActionRouter(
    [handler],
    () => true,
    createCapabilityOperationActionPreExecuteV010({
      manager,
      resolveAuthorizationProvider() {
        return provider();
      }
    })
  );
  const allowed = await allowedRouter.execute(request(), humanContext());
  assert.equal(allowed.ok, true);
  assert.equal(handlerCalls, 1);
});

test("Capability Operation Action preflight enforces binding input version", async () => {
  const manager = managerFor();
  let handlerCalls = 0;
  const router = createAppActionRouter(
    [{
      packageId: "sample-plugin",
      featureId: "sample-plugin.default",
      commandCode: "sample.read",
      async execute() {
        handlerCalls += 1;
        return { ok: true };
      }
    }],
    () => true,
    createCapabilityOperationActionPreExecuteV010({
      manager,
      resolveAuthorizationProvider() {
        return provider();
      }
    })
  );

  const result = await router.execute(
    request({ inputVersion: "9.9.9" }),
    humanContext()
  );
  assert.equal(result.ok, false);
  assert.equal(
    result.error.code,
    "CAPABILITY_OPERATION_INPUT_VERSION_UNSUPPORTED"
  );
  assert.equal(handlerCalls, 0);
});

test("ordinary non-Capability Action remains unaffected by Capability Operation preflight", async () => {
  const manager = managerFor();
  let calls = 0;
  const router = createAppActionRouter(
    [{
      packageId: "other-plugin",
      featureId: "other-plugin.default",
      commandCode: "other.command",
      async execute() {
        calls += 1;
        return { ok: true };
      }
    }],
    () => true,
    createCapabilityOperationActionPreExecuteV010({
      manager,
      resolveAuthorizationProvider() {
        return undefined;
      }
    })
  );

  const result = await router.execute(
    request({ code: "other.command" }),
    humanContext()
  );
  assert.equal(result.ok, true);
  assert.equal(calls, 1);
});

test("public Capability Operation metadata omits Host binding and authorization internals", () => {
  const manager = managerFor();
  const operation = manager.listEffectiveCapabilityOperations()[0];
  const publicMetadata = capabilityOperationPublicMetadataV010(operation);

  assert.equal(publicMetadata.operationId, "sample.read");
  assert.equal(publicMetadata.dataScope, "INSTALLATION");
  assert.equal("binding" in publicMetadata, false);
  assert.equal("authorization" in publicMetadata, false);
});
