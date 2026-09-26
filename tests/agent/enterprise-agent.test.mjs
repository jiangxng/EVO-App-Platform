import test from "node:test";
import assert from "node:assert/strict";

import { createEnterpriseAgentRuntime } from "../../dist/agents/enterprise-agent/runtime.js";
import { createDevelopmentAgentModel } from "../../dist/agents/enterprise-agent/development-model.js";
import { createProviderBackedAgentModel } from "../../dist/agents/enterprise-agent/provider-model.js";
import { createEnterpriseAgentHostToolCatalogV010 } from "../../dist/agents/enterprise-agent/host-tool-catalog.js";
import { presentPersonalAgentReplyV020 } from "../../dist/agents/enterprise-agent/reply-presentation.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import {
  companyNotesPackage,
  evoFoundationPackage,
  tradingLitePackage
} from "../../dist/catalog/seed.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
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

const personalContext = {
  contractVersion: "0.1.0",
  personalContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:test",
    displayName: "Test Person"
  },
  activeContext: {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:test"
  }
};


function hostCatalog(manager, additional = [], context = personalContext) {
  return createEnterpriseAgentHostToolCatalogV010({
    manager,
    context,
    listProviderBindings() { return []; },
    getProviderHealth(providerId) {
      return {
        state: "UNKNOWN",
        message: "test health for " + providerId
      };
    },
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
    "app.catalog.list",
    "app.install.execute",
    "app.install.plan",
    "capability.list",
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

test("Personal Agent model receives the Host-resolved Context for the run", async () => {
  const manager = createAppManagerService(
    createPackageCatalog([companyNotesPackage]),
    createMemoryLifecycleStore()
  );
  let receivedContext;
  const model = {
    async decide(input) {
      receivedContext = input.context;
      return { type: "final", message: "ok" };
    }
  };
  const runtime = createEnterpriseAgentRuntime(model, hostCatalog(manager));
  const reply = await runtime.chat("inspect context", personalContext);

  assert.deepEqual(receivedContext, personalContext);
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
  assert.deepEqual(plan.installPackages, ["evo.core", "trading-lite"]);
  assert.deepEqual(plan.activateFeatures, [
    "evo.balance",
    "evo.business-data",
    "evo.ledger",
    "evo.posting",
    "trading-lite.default"
  ]);

  const snapshot = manager.getSnapshot();
  assert.deepEqual(snapshot.installedPackages.map(x => x.packageId), [
    "evo.core",
    "trading-lite"
  ]);
  assert.deepEqual(snapshot.effectiveCapabilities, [
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
  assert.equal(parts[2].context, "Personal");
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

  const chat = createPersonalAgentChatPageV020(ready, "Personal");
  assert.equal(chat.contractVersion, "0.2.0");
  assert.equal(chat.composer.disabled, false);
  assert.equal(chat.context.value, "Personal");

  const setup = createPersonalAgentSetupPageV010(ready);
  assert.equal(setup.kind, "setup-flow");
  assert.equal(setup.steps.every(step => step.state === "complete"), true);
  assert.equal(setup.completionAction.route, "/enterprise-agent");
});
