import test from "node:test";
import assert from "node:assert/strict";

import { createAppActionRouter } from "../../dist/actions/router.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  createHostStaticAuthorizationProviderV010
} from "../../dist/providers/authorization/runtime.js";
import {
  createCapabilityOperationActionPreExecuteV010
} from "../../dist/manager/capability-operation-access.js";
import {
  createPersonalAgentCapabilityToolRegistrationsV010,
  PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID,
  PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID,
  personalAgentCapabilityRequestContextV010
} from "../../dist/agents/enterprise-agent/capability-fabric-tools.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";

function samplePackage() {
  const operation = ({
    operationId,
    commandCode,
    effect,
    action
  }) => ({
    kind: "platform.capability-operation",
    operation: {
      contractVersion: "0.1.0",
      operationId,
      capability: "sample",
      operationVersion: "0.1.0",
      title: operationId.includes("write") ? "Write sample mapping" : "Read sample mapping",
      description: operationId.includes("write")
        ? "Apply a deterministic sample field mapping."
        : "Inspect the current sample field mapping.",
      effect,
      dataScope: "ENTERPRISE",
      authorization: {
        action,
        resource: {
          type: "sample.mapping",
          idSource: "DATA_SCOPE"
        }
      },
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          value: { type: "string" }
        }
      },
      outputSchema: { type: "object" },
      binding: {
        type: "ACTION_HOST",
        commandCode,
        inputVersion: "0.1.0"
      },
      exposure: ["PERSONAL_AGENT"],
      ...(effect === "WRITE"
        ? {
            writeSafety: {
              idempotency: "HOST_REQUIRED",
              receipt: "HOST_REQUIRED"
            }
          }
        : {})
    }
  });

  return {
    contractVersion: "0.1.0",
    packageId: "sample-capability-plugin",
    displayName: "Sample Capability Plugin",
    version: "0.1.0",
    type: "APPLICATION",
    features: [{
      contractVersion: "0.1.0",
      featureId: "sample-capability-plugin.default",
      packageId: "sample-capability-plugin",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: ["sample"],
      contributions: [
        operation({
          operationId: "sample.mapping.read",
          commandCode: "sample.mapping.read",
          effect: "READ",
          action: "sample.mapping.read"
        }),
        operation({
          operationId: "sample.mapping.write",
          commandCode: "sample.mapping.write",
          effect: "WRITE",
          action: "sample.mapping.write"
        })
      ]
    }]
  };
}

function requestContext() {
  return {
    contractVersion: "0.1.0",
    principal: {
      contractVersion: "0.1.0",
      subjectId: "human-owner",
      actorType: "HUMAN",
      identityProviderId: "test.identity",
      sessionId: "session-1"
    },
    scope: {
      contractVersion: "0.1.0",
      enterpriseId: "ent-1",
      userId: "human-owner"
    },
    context: {
      contractVersion: "0.1.0",
      personalContext: {
        contractVersion: "0.1.0",
        kind: "PERSONAL",
        contextId: "personal:human-owner",
        ownerSubjectId: "human-owner"
      },
      activeContext: {
        contractVersion: "0.1.0",
        kind: "ENTERPRISE",
        contextId: "enterprise-context:ent-1",
        enterpriseId: "ent-1"
      }
    },
    correlationId: "corr-personal-agent-capability"
  };
}

function setup() {
  const pkg = samplePackage();
  const manager = createAppManagerService(
    createPackageCatalog([pkg]),
    createMemoryLifecycleStore()
  );
  manager.install(pkg.packageId);

  const authorizationProvider =
    createHostStaticAuthorizationProviderV010({
      contractVersion: "0.1.0",
      rules: [{
        id: "allow-personal-agent-sample",
        effect: "ALLOW",
        actions: ["sample.mapping.read", "sample.mapping.write"],
        actorTypes: ["AI"],
        resourceTypes: ["sample.mapping"]
      }]
    });

  const calls = [];
  const handlers = [
    {
      packageId: pkg.packageId,
      featureId: pkg.features[0].featureId,
      commandCode: "sample.mapping.read",
      async execute(request, context) {
        calls.push({
          command: request.command.code,
          actorType: context.principal.actorType,
          values: structuredClone(request.values)
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: { value: "read-ok" }
        };
      }
    },
    {
      packageId: pkg.packageId,
      featureId: pkg.features[0].featureId,
      commandCode: "sample.mapping.write",
      async execute(request, context) {
        calls.push({
          command: request.command.code,
          actorType: context.principal.actorType,
          values: structuredClone(request.values)
        });
        return {
          ok: true,
          correlationId: context.correlationId,
          result: { value: request.values.value }
        };
      }
    }
  ];
  const actionRouter = createAppActionRouter(
    handlers,
    () => true,
    createCapabilityOperationActionPreExecuteV010({
      manager,
      resolveAuthorizationProvider() {
        return authorizationProvider;
      }
    })
  );

  const registrations =
    createPersonalAgentCapabilityToolRegistrationsV010({
      manager,
      actionRouter,
      requestContext: requestContext(),
      resolveAuthorizationProvider() {
        return authorizationProvider;
      }
    });

  return { registrations, calls };
}

function registration(registrations, id) {
  const found = registrations.find(item => item.descriptor.id === id);
  assert.ok(found, "missing registration " + id);
  return found;
}

test("Personal Agent capability context preserves Human subject but executes as AI", () => {
  const context = personalAgentCapabilityRequestContextV010(requestContext());
  assert.equal(context.principal.subjectId, "human-owner");
  assert.equal(context.principal.actorType, "AI");
  assert.equal(context.context.activeContext.enterpriseId, "ent-1");
});

test("Personal Agent searches and describes authorized Capability Operations dynamically", async () => {
  const { registrations } = setup();

  const searched = await registration(
    registrations,
    PERSONAL_AGENT_CAPABILITY_SEARCH_TOOL_ID
  ).execute({ query: "mapping" }, []);
  assert.deepEqual(
    searched.items.map(item => item.operationId),
    ["sample.mapping.read", "sample.mapping.write"]
  );

  const described = await registration(
    registrations,
    PERSONAL_AGENT_CAPABILITY_DESCRIBE_TOOL_ID
  ).execute({ operationId: "sample.mapping.write" }, []);
  assert.equal(
    described.operation.operationId,
    "sample.mapping.write"
  );
  assert.equal(described.operation.effect, "WRITE");
  assert.equal("binding" in described.operation, false);
  assert.equal("authorization" in described.operation, false);
});

test("Personal Agent invokes READ/PLAN and WRITE Capability Operations through the same governed Action Host", async () => {
  const { registrations, calls } = setup();

  const read = await registration(
    registrations,
    PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID
  ).execute({
    operationId: "sample.mapping.read",
    input: {}
  }, []);
  assert.equal(read.result.value, "read-ok");

  const write = await registration(
    registrations,
    PERSONAL_AGENT_CAPABILITY_INVOKE_WRITE_TOOL_ID
  ).execute({
    operationId: "sample.mapping.write",
    input: { value: "write-ok" }
  }, []);
  assert.equal(write.result.value, "write-ok");

  assert.deepEqual(
    calls.map(item => [item.command, item.actorType]),
    [
      ["sample.mapping.read", "AI"],
      ["sample.mapping.write", "AI"]
    ]
  );
});

test("Personal Agent capability invocation fails closed on effect mismatch", async () => {
  const { registrations } = setup();

  await assert.rejects(
    () => registration(
      registrations,
      PERSONAL_AGENT_CAPABILITY_INVOKE_READ_PLAN_TOOL_ID
    ).execute({
      operationId: "sample.mapping.write",
      input: { value: "no" }
    }, []),
    /PERSONAL_AGENT_CAPABILITY_EFFECT_MISMATCH/
  );
});
