import test from "node:test";
import assert from "node:assert/strict";

import { createEnterpriseAgentRuntime } from "../../dist/agents/enterprise-agent/runtime.js";
import { createDevelopmentAgentModel } from "../../dist/agents/enterprise-agent/development-model.js";
import { createProviderBackedAgentModel } from "../../dist/agents/enterprise-agent/provider-model.js";
import { personalAgentResponsibilityPolicyV010 } from "../../dist/agents/enterprise-agent/responsibility-policy.js";
import { createEnterpriseAgentHostToolCatalogV010 } from "../../dist/agents/enterprise-agent/host-tool-catalog.js";
import { presentPersonalAgentReplyV020 } from "../../dist/agents/enterprise-agent/reply-presentation.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  companyNotesPackage,
  evoFoundationPackage,
  tradingLitePackage
} from "../../dist/catalog/seed.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import {
  createAgentActionReceiptServiceV010,
  createMemoryAgentActionReceiptEventStoreV010
} from "../../dist/manager/agent-action-receipt-store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import { createProviderRuntimeRegistry } from "../../dist/providers/runtime-registry.js";
import { createMemoryProviderBindingStoreV010 } from "../../dist/manager/provider-resolution.js";
import {
  createPersonalAgentChatPageV020,
  createPersonalAgentSetupPageV010,
  evaluatePersonalAgentReadinessV010
} from "../../dist/manager/personal-agent-experience.js";
import { openAiLlmProviderPackage } from "../../dist/providers/openai/package.js";
import { hostEncryptedSecretsProviderPackage } from "../../dist/providers/secrets/package.js";
import { enterpriseAgentPackage } from "../../dist/agents/enterprise-agent/package.js";
import {
  applicationRuntimeBindingProviderPackage
} from "../../dist/providers/application-runtime-binding/package.js";

const testPrincipal = {
  contractVersion: "0.1.0",
  subjectId: "test-person",
  actorType: "HUMAN",
  identityProviderId: "test.identity",
  displayName: "Test Person"
};

const personalContext = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:test",
    ownerSubjectId: "test-person",
    displayName: "Test Person"
  },
  activeContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:test"
  }
};


let testReceiptSequence = 0;

function actionReceipt(sourceInteractionId = "test-interaction:" + (++testReceiptSequence)) {
  let eventSequence = 0;
  return {
    sourceInteractionId,
    sourceActionId: "enterprise-agent.chat",
    service: createAgentActionReceiptServiceV010({
      store: createMemoryAgentActionReceiptEventStoreV010(),
      eventId: () => "test-event-" + (++eventSequence)
    }),
    now: () => new Date("2026-09-27T16:00:00.000Z")
  };
}

function hostCatalog(manager, additional = [], context = personalContext) {
  return createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context,
    actionReceipt: actionReceipt(),
    listAvailableContexts() { return [structuredClone(context.activeContext)]; },
    listProviderBindings() { return []; },
    getProviderHealth(providerId) {
      return {
        state: "UNKNOWN",
        message: "test health for " + providerId
      };
    },
    authorizeWrite() { return { allowed: true }; },
    searchHelp(query, context) {
      return [{
        id: "test.help",
        title: "Test Help",
        kind: "reference",
        ownerPackageId: "evo-app-platform",
        locale: "en",
        route: "/help/test.help",
        score: 100,
        matchedBy: [
          "query:" + query,
          ...(context?.errorCodes ?? []).map(code => "error:" + code)
        ]
      }];
    }
  }, additional);
}

test("Host dynamically exposes Enterprise Agent tools with ownership and effect metadata", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  const catalog = hostCatalog(manager);
  const tools = await catalog.list();

  assert.deepEqual(tools.map(tool => tool.id), [
    "agent.action.receipt.get",
    "agent.action.receipt.list",
    "app.catalog.list",
    "app.install.execute",
    "app.install.plan",
    "capability.list",
    "context.available.list",
    "context.current.get",
    "help.search",
    "platform.snapshot.get",
    "provider.binding.list",
    "provider.health.get",
    "provider.list"
  ]);
  assert.equal(tools.find(tool => tool.id === "platform.snapshot.get").effect, "READ");
  assert.equal(tools.find(tool => tool.id === "app.install.plan").effect, "PLAN");
  assert.equal(tools.find(tool => tool.id === "app.install.execute").effect, "WRITE");
  assert.equal(tools.every(tool => tool.ownerPackageId === "evo-app-platform"), true);
});

test("Personal Agent can inspect the Host-resolved current Context", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  const catalog = hostCatalog(manager);
  const observation = await catalog.invoke({
    tool: "context.current.get",
    arguments: {}
  }, []);

  assert.equal(observation.ok, true);
  assert.deepEqual(observation.result, personalContext);
});

test("Personal Agent Memory tool reads only through the Host-bound current Context reader", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  let receivedInput;
  const catalog = createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context: personalContext,
    listAvailableContexts() { return [personalContext.activeContext]; },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    readContextMemory(input) {
      receivedInput = input;
      return {
        contractVersion: "0.1.0",
        items: [{
          memoryId: "memory:test",
          contextId: personalContext.activeContext.contextId,
          summary: "Host-bound current Context Memory"
        }]
      };
    },
    authorizeWrite() { return { allowed: true }; },
    searchHelp() { return []; }
  });

  const tools = await catalog.list();
  assert.equal(tools.some(tool => tool.id === "context.memory.search"), true);

  const observation = await catalog.invoke({
    tool: "context.memory.search",
    arguments: {
      query: "current",
      kind: "FACT",
      limit: 5,
      contextId: "enterprise:forged"
    }
  }, []);

  assert.equal(observation.ok, true);
  assert.deepEqual(receivedInput, {
    query: "current",
    kinds: ["FACT"],
    limit: 5
  });
  assert.equal(observation.result.items[0].contextId, "personal:test");
});

test("Personal Agent Memory Proposal tool stages review state without accepting a model-supplied Context", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  let proposed;
  let authorizedTool;
  const catalog = createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context: personalContext,
    actionReceipt: actionReceipt(),
    listAvailableContexts() { return [personalContext.activeContext]; },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    proposeContextMemory(input) {
      proposed = input;
      return {
        proposal: {
          proposalId: "memory-proposal:test",
          context: personalContext.activeContext,
          state: "PENDING",
          revisions: [{
            summary: input.summary,
            evidenceRefs: input.evidenceRefs,
            reviewSignals: []
          }]
        },
        reviewRoute: "/enterprise-agent/memory"
      };
    },
    authorizeWrite(descriptor) {
      authorizedTool = descriptor.id;
      return { allowed: true };
    },
    searchHelp() { return []; }
  });

  const tool = (await catalog.list()).find(
    item => item.id === "context.memory.proposal.create"
  );
  assert.ok(tool);
  assert.equal(tool.effect, "WRITE");
  assert.equal(tool.capability, "context.memory.write");

  const observation = await catalog.invoke({
    tool: "context.memory.proposal.create",
    arguments: {
      kind: "PRACTICE",
      summary: "Use two-person review.",
      evidenceRefs: ["policy:7"],
      proposedConfidence: 0.8,
      contextId: "enterprise:forged"
    }
  }, []);

  assert.equal(observation.ok, true);
  assert.equal(authorizedTool, "context.memory.proposal.create");
  assert.deepEqual(proposed, {
    kind: "PRACTICE",
    summary: "Use two-person review.",
    evidenceRefs: ["policy:7"],
    proposedConfidence: 0.8,
    potentialContradictionMemoryIds: []
  });
  assert.equal(observation.result.proposal.context.contextId, "personal:test");
  assert.equal(observation.result.proposal.state, "PENDING");
});

test("Personal Agent can authoritatively read back one current-context Memory Proposal", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  let requestedProposalId;
  const catalog = createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context: personalContext,
    listAvailableContexts() { return [personalContext.activeContext]; },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    getContextMemoryProposal(proposalId) {
      requestedProposalId = proposalId;
      return {
        contractVersion: "0.1.0",
        proposalId,
        context: personalContext.activeContext,
        state: "PENDING",
        revisions: [{
          revisionId: "memory-proposal-revision:test",
          kind: "FACT",
          summary: "仓库正常每天 17:00 截单",
          evidenceRefs: [],
          evidenceQuality: "UNVERIFIED",
          reviewSignals: [],
          authoredBy: "PERSONAL_AGENT",
          authorSubjectId: testPrincipal.subjectId,
          createdAt: "2026-09-27T10:29:05.048Z"
        }]
      };
    },
    authorizeWrite() { return { allowed: true }; },
    searchHelp() { return []; }
  });

  const tool = (await catalog.list()).find(
    item => item.id === "context.memory.proposal.get"
  );
  assert.ok(tool);
  assert.equal(tool.effect, "READ");

  const observation = await catalog.invoke({
    tool: "context.memory.proposal.get",
    arguments: {
      proposalId: "memory-proposal:dc107947-7016-4e33-8c20-b328bcc4030f",
      contextId: "enterprise:forged"
    }
  }, []);

  assert.equal(observation.ok, true);
  assert.equal(
    requestedProposalId,
    "memory-proposal:dc107947-7016-4e33-8c20-b328bcc4030f"
  );
  assert.equal(observation.result.state, "PENDING");
  assert.equal(
    observation.result.context.contextId,
    personalContext.activeContext.contextId
  );
});

test("Host authorization blocks Memory Proposal staging before proposal persistence", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  let proposalCalls = 0;
  const catalog = createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context: personalContext,
    actionReceipt: actionReceipt(),
    listAvailableContexts() { return [personalContext.activeContext]; },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    proposeContextMemory() {
      proposalCalls += 1;
      return {};
    },
    authorizeWrite(descriptor) {
      return {
        allowed: false,
        code: "STATIC_POLICY_NO_MATCH",
        message: "Denied " + descriptor.id
      };
    },
    searchHelp() { return []; }
  });

  const denied = await catalog.invoke({
    tool: "context.memory.proposal.create",
    arguments: {
      kind: "FACT",
      summary: "Candidate fact"
    }
  }, []);

  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "STATIC_POLICY_NO_MATCH");
  assert.equal(proposalCalls, 0);
});

test("Personal Agent model receives the Host-resolved Context for the run", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  let receivedContext;
  let receivedPrincipal;
  const model = {
    async decide(input) {
      receivedContext = input.context;
      receivedPrincipal = input.principal;
      return { type: "final", message: "ok" };
    }
  };
  const runtime = createEnterpriseAgentRuntime(model, hostCatalog(manager));
  const reply = await runtime.chat("inspect context", personalContext, testPrincipal);

  assert.deepEqual(receivedContext, personalContext);
  assert.deepEqual(receivedPrincipal, testPrincipal);
  assert.deepEqual(reply.context, personalContext);
});

test("Host tool catalog can accept a new tool without changing Enterprise Agent core", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  const catalog = hostCatalog(manager, [{
    descriptor: {
      contractVersion: "0.1.0",
      id: "demo.read",
      modelName: "demo_read",
      title: "Demo read",
      description: "Read a dynamically registered demo value.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      effect: "READ",
      ownerPackageId: "demo-package",
      capability: "demo.read"
    },
    execute() {
      return { value: 42 };
    }
  }]);

  assert.ok((await catalog.list()).some(tool => tool.id === "demo.read"));
  const observation = await catalog.invoke({
    tool: "demo.read",
    arguments: {}
  }, []);
  assert.equal(observation.ok, true);
  assert.deepEqual(observation.result, { value: 42 });
});

test("Provider-backed model builds LLM tool schema only from Host catalog", async () => {
  let captured;
  const provider = {
    providerId: "test.provider",
    modelId: "test-model",
    async infer(request) {
      captured = request;
      return {
        contractVersion: "0.1.0",
        providerId: "test.provider",
        modelId: "test-model",
        text: "",
        toolCalls: [{
          name: "demo_read",
          arguments: { value: "x" }
        }],
        usage: { inputTokens: 10, outputTokens: 2 },
        finishReason: "tool_calls"
      };
    }
  };

  const model = createProviderBackedAgentModel(provider);
  const decision = await model.decide({
    userMessage: "inspect demo",
    tools: [{
      contractVersion: "0.1.0",
      id: "demo.read",
      modelName: "demo_read",
      title: "Demo read",
      description: "Read demo data.",
      inputSchema: {
        type: "object",
        properties: {
          value: { type: "string" }
        },
        additionalProperties: false
      },
      effect: "READ",
      ownerPackageId: "demo-package",
      capability: "demo.read"
    }],
    observations: []
  });

  assert.deepEqual(captured.tools.map(tool => tool.name), ["demo_read"]);
  assert.match(captured.tools[0].description, /Effect: READ/);
  assert.deepEqual(decision, {
    type: "tool",
    call: {
      tool: "demo.read",
      arguments: { value: "x" }
    }
  });
});

test("Enterprise Agent installs Company Notes through Host-discovered tools", async () => {
  const catalogSource = createPackageCatalog([companyNotesPackage]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(
    catalogSource,
    store,
    () => new Date("2026-09-23T00:00:00Z")
  );

  const runtime = createEnterpriseAgentRuntime(
    createDevelopmentAgentModel(),
    hostCatalog(manager)
  );

  const reply = await runtime.chat("帮我安装 Company Notes", personalContext);

  assert.match(reply.message, /安装完成/);
  assert.deepEqual(reply.observations.map(x => x.tool), [
    "app.catalog.list",
    "app.install.plan",
    "app.install.execute"
  ]);
  assert.ok(reply.tools.some(tool => tool.id === "help.search" && tool.effect === "READ"));
  assert.deepEqual(reply.context, personalContext);
  assert.deepEqual(manager.getSnapshot().installedPackages.map(x => x.packageId), [
    "company-notes"
  ]);
});

test("Enterprise Agent asks for a target when install request is ambiguous", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  const runtime = createEnterpriseAgentRuntime(
    createDevelopmentAgentModel(),
    hostCatalog(manager)
  );

  const reply = await runtime.chat("帮我安装一个应用");
  assert.match(reply.message, /Company Notes/);
  assert.deepEqual(reply.observations.map(x => x.tool), ["app.catalog.list"]);
});

test("Host blocks install execution without a successful plan", async () => {
  let installCalls = 0;
  const manager = {
    listCatalog() { return [companyNotesPackage]; },
    getSnapshot() {
      return {
        contractVersion: "0.1.0",
        installedPackages: [],
        activeFeatures: [],
        effectiveCapabilities: []
      };
    },
    planInstall() { throw new Error("should not plan"); },
    install() {
      installCalls += 1;
      throw new Error("should not install");
    },
    listEffectiveServiceProviders() { return []; }
  };

  const badModel = {
    async decide({ observations }) {
      if (observations.length === 0) {
        return {
          type: "tool",
          call: {
            tool: "app.install.execute",
            arguments: { packageId: "company-notes" }
          }
        };
      }
      return { type: "final", message: "done" };
    }
  };

  const runtime = createEnterpriseAgentRuntime(
    badModel,
    hostCatalog(manager)
  );
  const reply = await runtime.chat("帮我安装 Company Notes");

  assert.equal(installCalls, 0);
  assert.equal(reply.observations[0].ok, false);
  assert.equal(reply.observations[0].error.code, "INSTALL_PLAN_REQUIRED");
});

test("Tool calls not present in the effective Host catalog fail closed", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  const catalog = hostCatalog(manager);
  const observation = await catalog.invoke({
    tool: "imaginary.superpower",
    arguments: {}
  }, []);

  assert.equal(observation.ok, false);
  assert.equal(observation.error.code, "AGENT_TOOL_UNAVAILABLE");
});

test("Proof B: Enterprise Agent installs Trading Lite and its EVO dependency graph", async () => {
  const catalogSource = createPackageCatalog([
    companyNotesPackage,
    evoFoundationPackage,
    applicationRuntimeBindingProviderPackage,
    tradingLitePackage
  ]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(
    catalogSource,
    store,
    () => new Date("2026-09-23T00:00:00Z")
  );

  const runtime = createEnterpriseAgentRuntime(
    createDevelopmentAgentModel(),
    hostCatalog(manager)
  );

  const reply = await runtime.chat("帮我安装 Trading Lite");

  assert.match(reply.message, /安装完成/);
  assert.deepEqual(reply.observations.map(x => x.tool), [
    "app.catalog.list",
    "app.install.plan",
    "app.install.execute"
  ]);

  const plan = reply.observations[1].result;
  assert.equal(plan.packageId, "trading-lite");
  assert.deepEqual(plan.blockers, []);
  assert.deepEqual(plan.missingCapabilities, []);
  assert.deepEqual(plan.installPackages, [
    "evo-application-runtime-binding-provider",
    "evo.core",
    "trading-lite"
  ]);
  assert.deepEqual(plan.activateFeatures, [
    "evo-application-runtime-binding-provider.default",
    "evo.balance",
    "evo.business-data",
    "evo.ledger",
    "evo.posting",
    "trading-lite.default"
  ]);

  const snapshot = manager.getSnapshot();
  assert.deepEqual(snapshot.installedPackages.map(x => x.packageId), [
    "evo-application-runtime-binding-provider",
    "evo.core",
    "trading-lite"
  ]);
  assert.deepEqual(snapshot.effectiveCapabilities, [
    "enterprise.application-runtime-binding",
    "evo.balance",
    "evo.business-data",
    "evo.ledger",
    "evo.posting",
    "trading-lite"
  ]);
});


test("Personal Agent presents tool work as Chat v0.2 activity, evidence and proposal parts", () => {
  const parts = presentPersonalAgentReplyV020({
    contractVersion: "0.1.0",
    agentId: "enterprise-agent",
    message: "I prepared an installation plan.",
    context: personalContext,
    tools: [
      {
        id: "app.install.plan",
        title: "Plan Package installation",
        effect: "PLAN",
        ownerPackageId: "evo-app-platform"
      }
    ],
    observations: [
      {
        tool: "app.install.plan",
        ok: true,
        result: {
          packageId: "company-notes",
          blockers: [],
          sideEffectFree: true
        }
      }
    ]
  });

  assert.equal(parts[0].type, "text");
  assert.equal(parts[1].type, "activity");
  assert.equal(parts[1].state, "complete");
  assert.equal(parts[2].type, "evidence");
  assert.equal(parts[2].context, "Test Person");
  assert.equal(parts[3].type, "proposal");
  assert.equal(parts[3].title, "Install company-notes");
  assert.equal(parts[3].actions[0].route, "/store");
});


test("Personal Agent readiness distinguishes installed from ready", () => {
  const manager = createAppManagerService(
    createPackageCatalog([
      enterpriseAgentPackage,
      openAiLlmProviderPackage,
      hostEncryptedSecretsProviderPackage
    ]),
    createMemoryLifecycleStore()
  );
  const registry = createProviderRuntimeRegistry();
  const bindings = createMemoryProviderBindingStoreV010();

  manager.install("enterprise-agent");
  const missing = evaluatePersonalAgentReadinessV010(manager, registry, bindings);
  assert.equal(missing.state, "setup-required");
  assert.equal(missing.code, "LLM_PROVIDER_REQUIRED");

  manager.install("openai-llm-provider");
  const unconfigured = evaluatePersonalAgentReadinessV010(manager, registry, bindings);
  assert.equal(unconfigured.state, "setup-required");
  assert.equal(unconfigured.code, "LLM_PROVIDER_CONFIGURATION_REQUIRED");

  registry.register("openai.responses", { infer() {} });
  const ready = evaluatePersonalAgentReadinessV010(manager, registry, bindings);
  assert.equal(ready.state, "ready");
  assert.equal(ready.providerId, "openai.responses");

  const chat = createPersonalAgentChatPageV020(
    ready,
    personalContext,
    [
      {
        ref: personalContext.activeContext,
        label: "Test Person"
      },
      {
        ref: {
          contractVersion: "0.1.0",
          kind: "ENTERPRISE",
          contextId: "enterprise:acme",
          enterpriseId: "acme"
        },
        label: "Acme"
      }
    ]
  );
  assert.equal(chat.contractVersion, "0.2.0");
  assert.equal(chat.composer.disabled, false);
  assert.equal(chat.context.value, "Test Person");
  assert.equal(chat.context.selector, undefined);

  const setup = createPersonalAgentSetupPageV010(ready);
  assert.equal(setup.kind, "setup-flow");
  assert.equal(setup.steps.every(step => step.state === "complete"), true);
  assert.equal(setup.completionAction.route, "/enterprise-agent");
});


test("Personal Agent can list only Host-offered Context references", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  const catalog = createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context: personalContext,
    listAvailableContexts() {
      return [
        personalContext.activeContext,
        {
          contractVersion: "0.1.0",
          kind: "ENTERPRISE",
          contextId: "enterprise:acme",
          enterpriseId: "acme"
        }
      ];
    },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    searchHelp() { return []; },
    authorizeWrite() { return { allowed: true }; }
  });

  const observation = await catalog.invoke({
    tool: "context.available.list",
    arguments: {}
  }, []);

  assert.equal(observation.ok, true);
  assert.deepEqual(observation.result.map(item => item.contextId), [
    "personal:test",
    "enterprise:acme"
  ]);
});


test("Enterprise Context profile tool is absent in Personal Context and present in Enterprise Context", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );

  const personal = hostCatalog(manager);
  assert.equal(
    (await personal.list()).some(tool => tool.id === "enterprise.context.profile.get"),
    false
  );

  const enterpriseContext = {
    contractVersion: "0.1.0",
    personalContext: personalContext.personalContext,
    activeContext: {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:acme",
      enterpriseId: "acme"
    },
    enterpriseContext: {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:acme",
      enterpriseId: "acme",
      enterpriseProviderId: "test.enterprise-directory",
      displayName: "Acme"
    }
  };
  const enterprise = hostCatalog(manager, [], enterpriseContext);
  const tools = await enterprise.list();
  assert.equal(tools.some(tool => tool.id === "enterprise.context.profile.get"), true);

  const observation = await enterprise.invoke({
    tool: "enterprise.context.profile.get",
    arguments: {}
  }, []);
  assert.equal(observation.ok, true);
  assert.equal(observation.result.displayName, "Acme");
});


test("Host authorization blocks Personal Agent Material WRITE before tool execution", async () => {
  let installCalls = 0;
  const manager = {
    listCatalog() { return [companyNotesPackage]; },
    getSnapshot() {
      return {
        contractVersion: "0.1.0",
        installedPackages: [],
        activeFeatures: [],
        effectiveCapabilities: []
      };
    },
    planInstall(packageId) {
      return {
        packageId,
        blockers: [],
        missingCapabilities: [],
        installPackages: [packageId],
        activateFeatures: []
      };
    },
    install() {
      installCalls += 1;
      return {};
    },
    listEffectiveServiceProviders() { return []; }
  };

  const catalog = createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context: personalContext,
    actionReceipt: actionReceipt(),
    listAvailableContexts() { return [personalContext.activeContext]; },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    searchHelp() { return []; },
    authorizeWrite(descriptor) {
      return {
        allowed: false,
        code: "STATIC_POLICY_NO_MATCH",
        message: "Denied " + descriptor.id
      };
    }
  });

  const denied = await catalog.invoke({
    tool: "app.install.execute",
    arguments: { packageId: "company-notes" }
  }, [{
    tool: "app.install.plan",
    ok: true,
    result: {
      packageId: "company-notes",
      blockers: [],
      sideEffectFree: true
    }
  }]);

  assert.equal(denied.ok, false);
  assert.equal(denied.error.code, "STATIC_POLICY_NO_MATCH");
  assert.equal(installCalls, 0);

  const read = await catalog.invoke({
    tool: "app.catalog.list",
    arguments: {}
  }, []);
  assert.equal(read.ok, true);
});


test("Personal Agent responsibility policy keeps Human intent/authority while Agent owns execution follow-through", () => {
  assert.equal(
    personalAgentResponsibilityPolicyV010.principle,
    "Human owns intent and authority; Personal Agent owns understanding, judgment, execution and follow-through within that authority."
  );
  assert.deepEqual(personalAgentResponsibilityPolicyV010.toolEffectDefaults, {
    READ: "EXECUTE",
    PLAN: "EXECUTE",
    WRITE: "ASK_FOR_AUTHORIZATION"
  });
  assert.ok(
    personalAgentResponsibilityPolicyV010.clarificationRules.some(rule =>
      /Do not ask the human for information that can be discovered/.test(rule)
    )
  );
  assert.ok(
    personalAgentResponsibilityPolicyV010.continuationRules.some(rule =>
      /After authorization is granted, continue/.test(rule)
    )
  );
  assert.ok(
    personalAgentResponsibilityPolicyV010.evidenceRules.some(rule =>
      /exact Host scope and filters/.test(rule)
    )
  );
  assert.ok(
    personalAgentResponsibilityPolicyV010.evidenceRules.some(rule =>
      /same governance action again/.test(rule)
    )
  );
});

test("provider-backed Personal Agent receives durable responsibility policy independent of model Provider", async () => {
  let captured;
  const provider = {
    providerId: "test.provider",
    modelId: "replaceable-model",
    async infer(request) {
      captured = request;
      return {
        contractVersion: "0.1.0",
        providerId: "test.provider",
        modelId: "replaceable-model",
        text: "done",
        toolCalls: [],
        usage: { inputTokens: 1, outputTokens: 1 },
        finishReason: "stop"
      };
    }
  };

  const model = createProviderBackedAgentModel(provider);
  const result = await model.decide({
    userMessage: "Please handle this for me.",
    tools: [],
    observations: []
  });

  assert.equal(result.type, "final");
  assert.equal(result.message, "done");
  const system = captured.messages.find(message => message.role === "system").content;
  assert.match(system, /Human owns intent and authority/);
  assert.match(system, /Do not ask the human for information that can be discovered/);
  assert.match(system, /Prefer repairing the approach and continuing/);
  assert.match(system, /After authorization is granted, continue/);
  assert.match(system, /not merely to describe options from the sidelines/);
  assert.match(system, /context_memory_audit_compare/);
  assert.match(system, /context_memory_recall/);
  assert.match(system, /Do not infer from that alone that the fact was never stored/);
  assert.match(system, /Evidence policy:/);
  assert.match(system, /not exhaustive inventory/);
  assert.match(system, /Separate authoritative facts from inference/);
  assert.match(system, /completeness-sensitive Memory question/);
  assert.match(system, /deterministic inventory tool/);
  assert.match(system, /Inventory completeness applies only to the exact Host scope and filters/);
  assert.match(system, /do not recommend or offer to stage the same governance action again/);
});


test("Personal Agent suppresses an identical successful READ and forces evidence-based convergence", async () => {
  let readCalls = 0;
  let modelCalls = 0;
  let convergenceInput;

  const catalog = {
    list() {
      return [{
        contractVersion: "0.1.0",
        id: "context.memory.search",
        modelName: "context_memory_search",
        title: "Context Memory",
        description: "Read current Context Memory.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform",
        capability: "context.memory.read"
      }];
    },
    async invoke(call) {
      readCalls += 1;
      return {
        tool: call.tool,
        ok: true,
        result: {
          items: [{
            memoryId: "memory:cutoff",
            summary: "仓库正常每天17:00截单"
          }]
        }
      };
    }
  };

  const model = {
    async decide(input) {
      modelCalls += 1;
      if (
        input.observations.at(-1)?.error?.code === "AGENT_READ_REPEAT_SUPPRESSED"
      ) {
        convergenceInput = input;
        return {
          type: "final",
          message: "我从 Context Memory 查到：仓库正常每天 17:00 截单。"
        };
      }
      return {
        type: "tool",
        call: {
          tool: "context.memory.search",
          arguments: { query: "截单" }
        }
      };
    }
  };

  const runtime = createEnterpriseAgentRuntime(model, catalog);
  const reply = await runtime.chat(
    "请从 Context Memory 查询仓库正常几点截单",
    personalContext,
    testPrincipal
  );

  assert.equal(readCalls, 1);
  assert.equal(modelCalls, 3);
  assert.equal(reply.observations.length, 1);
  assert.equal(reply.observations[0].ok, true);
  assert.match(reply.message, /17:00/);
  assert.equal(convergenceInput.tools.length, 0);
  assert.equal(convergenceInput.observations.length, 2);
  assert.equal(
    convergenceInput.observations[1].error.code,
    "AGENT_READ_REPEAT_SUPPRESSED"
  );
});

test("Personal Agent can continue with a different READ after an identical READ is suppressed", async () => {
  const calls = [];
  let suppressedInput;
  const catalog = {
    list() {
      return [{
        contractVersion: "0.1.0",
        id: "context.memory.search",
        modelName: "context_memory_search",
        title: "Context Memory",
        description: "Read current Context Memory.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" } },
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }, {
        contractVersion: "0.1.0",
        id: "context.memory.proposal.get",
        modelName: "context_memory_proposal_get",
        title: "Context Memory Proposal",
        description: "Read one proposal.",
        inputSchema: {
          type: "object",
          properties: { proposalId: { type: "string" } },
          required: ["proposalId"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "enterprise-agent"
      }];
    },
    async invoke(call) {
      calls.push(call.tool);
      if (call.tool === "context.memory.search") {
        return {
          tool: call.tool,
          ok: true,
          result: { items: [{ memoryId: "memory:cutoff" }] }
        };
      }
      return {
        tool: call.tool,
        ok: true,
        result: { proposalId: call.arguments.proposalId, state: "PENDING" }
      };
    }
  };

  let step = 0;
  const model = {
    async decide(input) {
      step += 1;
      if (step === 1 || step === 2) {
        return {
          type: "tool",
          call: {
            tool: "context.memory.search",
            arguments: { query: "截单" }
          }
        };
      }
      if (step === 3) {
        suppressedInput = input;
        return {
          type: "tool",
          call: {
            tool: "context.memory.proposal.get",
            arguments: { proposalId: "memory-proposal:test" }
          }
        };
      }
      return { type: "final", message: "proposal verified" };
    }
  };

  const runtime = createEnterpriseAgentRuntime(model, catalog);
  const reply = await runtime.chat("verify", personalContext, testPrincipal);

  assert.deepEqual(calls, [
    "context.memory.search",
    "context.memory.proposal.get"
  ]);
  assert.equal(suppressedInput.tools.length, 1);
  assert.equal(
    suppressedInput.tools[0].id,
    "context.memory.proposal.get"
  );
  assert.equal(
    suppressedInput.observations.at(-1).error.code,
    "AGENT_READ_REPEAT_SUPPRESSED"
  );
  assert.equal(reply.observations.length, 2);
  assert.equal(reply.observations[1].result.state, "PENDING");
  assert.equal(reply.message, "proposal verified");
});

test("Host exposes deterministic Memory inventory separately from ranked retrieval", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  let receivedInput;
  const catalog = createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context: personalContext,
    listAvailableContexts() { return [personalContext.activeContext]; },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    inventoryContextMemory(input) {
      receivedInput = structuredClone(input);
      return {
        contractVersion: "0.1.0",
        items: [],
        totalCount: 0,
        complete: true,
        order: "RECORDED_AT_ASC_MEMORY_ID_ASC",
        scope: "READER_VISIBLE_CURRENT_CONTEXT",
        snapshotDigest: "0".repeat(64)
      };
    },
    searchHelp() { return []; },
    authorizeWrite() { return { allowed: true }; }
  });

  const tools = await catalog.list();
  const tool = tools.find(item => item.id === "context.memory.inventory.list");
  assert.ok(tool);
  assert.equal(tool.effect, "READ");
  assert.equal(tool.capability, "context.memory.inventory");
  assert.match(tool.description, /inventory, not relevance retrieval/i);

  const observation = await catalog.invoke({
    tool: "context.memory.inventory.list",
    arguments: {
      kind: "FACT",
      includeHistorical: true,
      limit: 25,
      cursor: "opaque-cursor",
      contextId: "enterprise:forged"
    }
  }, []);

  assert.equal(observation.ok, true);
  assert.deepEqual(receivedInput, {
    kinds: ["FACT"],
    includeHistorical: true,
    limit: 25,
    cursor: "opaque-cursor"
  });
  assert.equal(observation.result.totalCount, 0);
  assert.equal(observation.result.complete, true);
});

test("Host Memory recall merges short query expansion in one governed READ tool", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  const reads = [];
  const catalog = createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context: personalContext,
    listAvailableContexts() { return [personalContext.activeContext]; },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    readContextMemory(input) {
      reads.push(structuredClone(input));
      if (input.query === "截单") {
        return {
          contractVersion: "0.1.0",
          items: [{
            memoryId: "memory:b",
            summary: "仓库正常每天 17:00 截单；正常意味着可能存在例外。"
          }],
          strategyUsed: "LEXICAL",
          ranking: [{
            contractVersion: "0.1.0",
            memoryId: "memory:b",
            score: 0.75,
            signals: ["SUMMARY_CONTAINS"]
          }]
        };
      }
      if (input.query === "仓库") {
        return {
          contractVersion: "0.1.0",
          items: [{
            memoryId: "memory:b",
            summary: "仓库正常每天 17:00 截单；正常意味着可能存在例外。"
          }],
          strategyUsed: "LEXICAL",
          ranking: [{
            contractVersion: "0.1.0",
            memoryId: "memory:b",
            score: 0.75,
            signals: ["SUMMARY_CONTAINS"]
          }]
        };
      }
      return {
        contractVersion: "0.1.0",
        items: [],
        strategyUsed: "LEXICAL",
        ranking: []
      };
    },
    searchHelp() { return []; },
    authorizeWrite() { return { allowed: true }; }
  });

  const tools = await catalog.list();
  assert.equal(
    tools.some(tool => tool.id === "context.memory.recall"),
    true
  );

  const observation = await catalog.invoke({
    tool: "context.memory.recall",
    arguments: {
      queries: ["订单当天处理", "截单", "仓库", "截单"],
      kind: "FACT",
      limit: 20
    }
  }, []);

  assert.equal(observation.ok, true);
  assert.equal(observation.result.strategyUsed, "LEXICAL_QUERY_EXPANSION");
  assert.equal(observation.result.exhaustive, false);
  assert.equal(
    observation.result.completeness,
    "RANKED_RETRIEVAL_NOT_INVENTORY"
  );
  assert.deepEqual(observation.result.queries, [
    "订单当天处理",
    "截单",
    "仓库"
  ]);
  assert.deepEqual(
    observation.result.items.map(item => item.memoryId),
    ["memory:b"]
  );
  assert.deepEqual(
    observation.result.ranking[0].matchedQueries,
    ["截单", "仓库"]
  );
  assert.equal(observation.result.ranking[0].score, 0.75);
  assert.equal(reads.length, 3);
  assert.deepEqual(reads[1], {
    query: "截单",
    kinds: ["FACT"],
    limit: 20
  });
});

test("Host exposes exact-ID Memory audit separately from ordinary retrieval", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  const reads = [];
  const catalog = createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context: personalContext,
    listAvailableContexts() { return [personalContext.activeContext]; },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    readContextMemory(input) {
      reads.push(input);
      return {
        contractVersion: "0.1.0",
        items: [{
          memoryId: input.memoryIds?.[0] ?? "memory:ordinary",
          summary: "仓库正常每天 17:00 截单"
        }],
        strategyUsed: "LEXICAL",
        ranking: []
      };
    },
    searchHelp() { return []; },
    authorizeWrite() { return { allowed: true }; }
  });

  const tools = await catalog.list();
  assert.equal(
    tools.some(tool => tool.id === "context.memory.search"),
    true
  );
  assert.equal(
    tools.some(tool => tool.id === "context.memory.audit.get"),
    true
  );

  const observation = await catalog.invoke({
    tool: "context.memory.audit.get",
    arguments: { memoryId: "memory:a" }
  }, []);

  assert.equal(observation.ok, true);
  assert.equal(observation.result.items[0].memoryId, "memory:a");
  assert.deepEqual(reads, [{
    memoryIds: ["memory:a"],
    limit: 1
  }]);
});

test("Host can compare effective retrieval with exact-ID history in one Memory READ tool", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  const reads = [];
  const catalog = createEnterpriseAgentHostToolCatalogV010({
    manager,
    principal: testPrincipal,
    context: personalContext,
    listAvailableContexts() { return [personalContext.activeContext]; },
    listProviderBindings() { return []; },
    getProviderHealth() { return { state: "UNKNOWN" }; },
    readContextMemory(input) {
      reads.push(structuredClone(input));
      if (input.memoryIds) {
        return {
          contractVersion: "0.1.0",
          items: input.memoryIds.map(memoryId => ({
            memoryId,
            summary: "historical"
          })),
          strategyUsed: "LEXICAL",
          ranking: []
        };
      }
      return {
        contractVersion: "0.1.0",
        items: [{
          memoryId: "memory:b",
          summary: "仓库正常每天 17:00 截单"
        }],
        strategyUsed: "LEXICAL",
        ranking: []
      };
    },
    searchHelp() { return []; },
    authorizeWrite() { return { allowed: true }; }
  });

  const tools = await catalog.list();
  assert.equal(
    tools.some(tool => tool.id === "context.memory.audit.compare"),
    true
  );

  const observation = await catalog.invoke({
    tool: "context.memory.audit.compare",
    arguments: {
      query: "仓库 17:00 截单",
      memoryIds: ["memory:a", "memory:b"]
    }
  }, []);

  assert.equal(observation.ok, true);
  assert.deepEqual(
    observation.result.effective.items.map(item => item.memoryId),
    ["memory:b"]
  );
  assert.deepEqual(
    new Set(observation.result.audit.items.map(item => item.memoryId)),
    new Set(["memory:a", "memory:b"])
  );
  assert.deepEqual(observation.result.missingMemoryIds, []);
  assert.equal(reads.length, 2);
  assert.deepEqual(reads[0], {
    query: "仓库 17:00 截单",
    limit: 100
  });
  assert.deepEqual(reads[1], {
    memoryIds: ["memory:a", "memory:b"],
    limit: 2
  });
});

test("Personal Agent fresh-session recall can bridge different wording without conversation history", async () => {
  const calls = [];
  const catalog = {
    list() {
      return [{
        contractVersion: "0.1.0",
        id: "context.memory.recall",
        modelName: "context_memory_recall",
        title: "Context Memory recall",
        description: "Recall durable Memory with query expansion.",
        inputSchema: {
          type: "object",
          properties: {
            queries: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["queries"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }];
    },
    async invoke(call) {
      calls.push(structuredClone(call));
      return {
        tool: call.tool,
        ok: true,
        result: {
          contractVersion: "0.1.0",
          strategyUsed: "LEXICAL_QUERY_EXPANSION",
          queries: call.arguments.queries,
          items: [{
            memoryId: "memory:b",
            kind: "FACT",
            summary: "仓库正常每天 17:00 截单；正常意味着可能存在例外，涉及当天判断时应确认是否有例外。"
          }],
          ranking: [{
            contractVersion: "0.1.0",
            memoryId: "memory:b",
            score: 0.75,
            signals: ["SUMMARY_CONTAINS"],
            matchedQueries: ["截单"]
          }]
        }
      };
    }
  };

  let step = 0;
  const model = {
    async decide(input) {
      step += 1;
      if (step === 1) {
        assert.equal(input.conversationHistory?.length ?? 0, 0);
        return {
          type: "tool",
          call: {
            tool: "context.memory.recall",
            arguments: {
              queries: ["订单当天处理", "截单", "仓库"]
            }
          }
        };
      }
      assert.equal(input.observations[0].result.items[0].memoryId, "memory:b");
      return {
        type: "final",
        message: "根据 memory:b：正常每天 17:00 截单，所以 18:00 通常已超过当天截单时间；但“正常”意味着可能存在例外，需要确认今天是否有例外安排。"
      };
    }
  };

  const runtime = createEnterpriseAgentRuntime(model, catalog);
  const reply = await runtime.chat(
    "今天 18:00 的订单还能当天处理吗？请根据已经保存的 Context Memory 判断。",
    personalContext,
    testPrincipal,
    []
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].tool, "context.memory.recall");
  assert.deepEqual(calls[0].arguments.queries, [
    "订单当天处理",
    "截单",
    "仓库"
  ]);
  assert.match(reply.message, /memory:b/);
  assert.match(reply.message, /通常已超过当天截单时间/);
  assert.match(reply.message, /可能存在例外/);
});

test("Personal Agent can finish ordinary retrieval plus exact-ID audit after search retirement", async () => {
  const calls = [];
  const catalog = {
    list() {
      return [{
        contractVersion: "0.1.0",
        id: "context.memory.search",
        modelName: "context_memory_search",
        title: "Context Memory",
        description: "Read effective Memory.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" } },
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }, {
        contractVersion: "0.1.0",
        id: "context.memory.audit.get",
        modelName: "context_memory_audit_get",
        title: "Context Memory exact-ID audit",
        description: "Read one Memory by exact ID.",
        inputSchema: {
          type: "object",
          properties: { memoryId: { type: "string" } },
          required: ["memoryId"],
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }];
    },
    async invoke(call) {
      calls.push([call.tool, structuredClone(call.arguments)]);
      if (call.tool === "context.memory.search") {
        return {
          tool: call.tool,
          ok: true,
          result: {
            items: [{
              memoryId: "memory:b",
              summary: "仓库正常每天 17:00 截单"
            }]
          }
        };
      }
      return {
        tool: call.tool,
        ok: true,
        result: {
          items: [{
            memoryId: call.arguments.memoryId,
            summary: "historical"
          }]
        }
      };
    }
  };

  let step = 0;
  const model = {
    async decide(input) {
      step += 1;
      if (step === 1 || step === 2) {
        return {
          type: "tool",
          call: {
            tool: "context.memory.search",
            arguments: { query: "仓库 17:00 截单" }
          }
        };
      }
      if (step === 3) {
        assert.equal(
          input.tools.some(tool => tool.id === "context.memory.search"),
          false
        );
        assert.equal(
          input.tools.some(tool => tool.id === "context.memory.audit.get"),
          true
        );
        return {
          type: "tool",
          call: {
            tool: "context.memory.audit.get",
            arguments: { memoryId: "memory:a" }
          }
        };
      }
      if (step === 4) {
        return {
          type: "tool",
          call: {
            tool: "context.memory.audit.get",
            arguments: { memoryId: "memory:b" }
          }
        };
      }
      return {
        type: "final",
        message: "普通检索仅 B；精确审计 A/B 均存在。"
      };
    }
  };

  const runtime = createEnterpriseAgentRuntime(model, catalog);
  const reply = await runtime.chat(
    "普通检索后精确审计 A 和 B",
    personalContext,
    testPrincipal
  );

  assert.deepEqual(calls.map(item => item[0]), [
    "context.memory.search",
    "context.memory.audit.get",
    "context.memory.audit.get"
  ]);
  assert.equal(reply.observations.length, 3);
  assert.match(reply.message, /仅 B/);
  assert.match(reply.message, /A\/B 均存在/);
});

test("Personal Agent converges when paraphrased Memory READs return the same authoritative evidence", async () => {
  const calls = [];
  let convergenceInput;
  const catalog = {
    list() {
      return [{
        contractVersion: "0.1.0",
        id: "context.memory.search",
        modelName: "context_memory_search",
        title: "Context Memory",
        description: "Read current Context Memory.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" } },
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }, {
        contractVersion: "0.1.0",
        id: "context.memory.canonicalization.proposal.create",
        modelName: "context_memory_canonicalization_proposal_create",
        title: "Propose Memory canonicalization",
        description: "Stage duplicate to canonical relation.",
        inputSchema: {
          type: "object",
          properties: {
            duplicateMemoryId: { type: "string" },
            canonicalMemoryId: { type: "string" }
          },
          required: ["duplicateMemoryId", "canonicalMemoryId"],
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: "enterprise-agent"
      }];
    },
    async invoke(call) {
      calls.push(call.tool);
      if (call.tool === "context.memory.search") {
        return {
          tool: call.tool,
          ok: true,
          result: {
            contractVersion: "0.1.0",
            items: [
              { memoryId: "memory:a", summary: "仓库正常每天 17:00 截单。" },
              { memoryId: "memory:b", summary: "仓库正常每天 17:00 截单；可能有例外。" }
            ],
            strategyUsed: "LEXICAL",
            ranking: []
          }
        };
      }
      return {
        tool: call.tool,
        ok: true,
        result: {
          proposal: {
            proposalId: "memory-canonicalization-proposal:test",
            duplicateMemoryId: "memory:a",
            canonicalMemoryId: "memory:b",
            state: "PENDING"
          },
          reviewRoute: "/enterprise-agent/memory"
        }
      };
    }
  };

  let step = 0;
  const model = {
    async decide(input) {
      step += 1;
      if (step === 1) {
        return {
          type: "tool",
          call: {
            tool: "context.memory.search",
            arguments: { query: "17:00 截单" }
          }
        };
      }
      if (step === 2) {
        return {
          type: "tool",
          call: {
            tool: "context.memory.search",
            arguments: { query: "仓库正常截单时间" }
          }
        };
      }
      if (step === 3) {
        convergenceInput = input;
        assert.equal(
          input.tools.some(tool => tool.id === "context.memory.search"),
          false
        );
        assert.equal(
          input.tools.some(tool =>
            tool.id === "context.memory.canonicalization.proposal.create"
          ),
          true
        );
        assert.equal(
          input.observations.at(-1).error.code,
          "AGENT_READ_CONVERGENCE_REQUIRED"
        );
        return {
          type: "tool",
          call: {
            tool: "context.memory.canonicalization.proposal.create",
            arguments: {
              duplicateMemoryId: "memory:a",
              canonicalMemoryId: "memory:b"
            }
          }
        };
      }
      return {
        type: "final",
        message: "已提交 canonicalization proposal，等待人工审核。"
      };
    }
  };

  const runtime = createEnterpriseAgentRuntime(model, catalog);
  const reply = await runtime.chat(
    "核实 A/B 后提交 A → B canonicalization proposal",
    personalContext,
    testPrincipal
  );

  assert.deepEqual(calls, [
    "context.memory.search",
    "context.memory.search",
    "context.memory.canonicalization.proposal.create"
  ]);
  assert.ok(convergenceInput);
  assert.equal(reply.observations.length, 3);
  assert.equal(
    reply.observations[2].result.proposal.state,
    "PENDING"
  );
  assert.match(reply.message, /等待人工审核/);
});

test("Personal Agent caps successful READ attempts per tool even when each result differs", async () => {
  const calls = [];
  const catalog = {
    list() {
      return [{
        contractVersion: "0.1.0",
        id: "context.memory.search",
        modelName: "context_memory_search",
        title: "Context Memory",
        description: "Read current Context Memory.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" } },
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }, {
        contractVersion: "0.1.0",
        id: "context.memory.canonicalization.proposal.create",
        modelName: "context_memory_canonicalization_proposal_create",
        title: "Propose Memory canonicalization",
        description: "Stage duplicate to canonical relation.",
        inputSchema: {
          type: "object",
          properties: {
            duplicateMemoryId: { type: "string" },
            canonicalMemoryId: { type: "string" }
          },
          required: ["duplicateMemoryId", "canonicalMemoryId"],
          additionalProperties: false
        },
        effect: "WRITE",
        ownerPackageId: "enterprise-agent"
      }];
    },
    async invoke(call) {
      calls.push(call.tool);
      if (call.tool === "context.memory.search") {
        const index = calls.filter(item => item === "context.memory.search").length;
        return {
          tool: call.tool,
          ok: true,
          result: {
            items: [{ memoryId: `memory:${index}` }]
          }
        };
      }
      return {
        tool: call.tool,
        ok: true,
        result: { proposal: { state: "PENDING" } }
      };
    }
  };

  let step = 0;
  const model = {
    async decide(input) {
      step += 1;
      if (step <= 4) {
        return {
          type: "tool",
          call: {
            tool: "context.memory.search",
            arguments: { query: `query-${step}` }
          }
        };
      }
      assert.equal(
        input.tools.some(tool => tool.id === "context.memory.search"),
        false
      );
      assert.equal(
        input.observations.at(-1).error.code,
        "AGENT_READ_CONVERGENCE_REQUIRED"
      );
      return { type: "final", message: "bounded" };
    }
  };

  const runtime = createEnterpriseAgentRuntime(model, catalog);
  const reply = await runtime.chat("inspect", personalContext, testPrincipal);

  assert.equal(calls.filter(item => item === "context.memory.search").length, 4);
  assert.equal(reply.message, "bounded");
});

test("Personal Agent still permits distinct READ arguments within one turn", async () => {
  const calls = [];
  const catalog = {
    list() {
      return [{
        contractVersion: "0.1.0",
        id: "context.memory.search",
        modelName: "context_memory_search",
        title: "Context Memory",
        description: "Read current Context Memory.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" }
          },
          additionalProperties: false
        },
        effect: "READ",
        ownerPackageId: "evo-app-platform"
      }];
    },
    async invoke(call) {
      calls.push(call.arguments.query);
      return {
        tool: call.tool,
        ok: true,
        result: { query: call.arguments.query }
      };
    }
  };

  let step = 0;
  const model = {
    async decide() {
      step += 1;
      if (step === 1) {
        return {
          type: "tool",
          call: {
            tool: "context.memory.search",
            arguments: { query: "截单" }
          }
        };
      }
      if (step === 2) {
        return {
          type: "tool",
          call: {
            tool: "context.memory.search",
            arguments: { query: "例外" }
          }
        };
      }
      return {
        type: "final",
        message: "done"
      };
    }
  };

  const runtime = createEnterpriseAgentRuntime(model, catalog);
  const reply = await runtime.chat("compare", personalContext, testPrincipal);

  assert.deepEqual(calls, ["截单", "例外"]);
  assert.equal(reply.observations.length, 2);
  assert.equal(reply.message, "done");
});
