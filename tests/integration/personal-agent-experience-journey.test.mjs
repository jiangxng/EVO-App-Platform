import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createPersonalAgentChatPageV020,
  createPersonalAgentPluginStoreProductStateV010,
  createPersonalAgentSetupPageV010,
  resolvePersonalAgentActiveContextV010
} from "../../dist/manager/personal-agent-experience.js";
import {
  createAppManagerActionHost
} from "../../dist/vendor/eidos/src/app-host/app-manager-action-host.js";
import {
  enterpriseAgentPackage
} from "../../dist/agents/enterprise-agent/package.js";

function readiness(overrides = {}) {
  return {
    contractVersion: "0.1.0",
    state: "setup-required",
    code: "LLM_PROVIDER_REQUIRED",
    message: "Install and configure an LLM Provider before using Personal Agent.",
    active: true,
    installedProviderPackageIds: [],
    catalogProviderPackageIds: ["openai-llm-provider"],
    ...overrides
  };
}

test("Personal Agent product journey maps Needs setup to Set up and Ready to Open", () => {
  const needsSetup = createPersonalAgentPluginStoreProductStateV010(readiness());
  assert.equal(needsSetup.readiness.id, "setup-required");
  assert.equal(needsSetup.primaryAction.id, "setup");
  assert.equal(needsSetup.primaryAction.route, "/enterprise-agent/setup");

  const ready = createPersonalAgentPluginStoreProductStateV010(readiness({
    state: "ready",
    code: "READY",
    message: "Personal Agent is ready.",
    providerId: "openai.responses",
    providerPackageId: "openai-llm-provider",
    installedProviderPackageIds: ["openai-llm-provider"]
  }));
  assert.equal(ready.readiness.id, "ready");
  assert.equal(ready.primaryAction.id, "open");
  assert.equal(ready.primaryAction.route, "/enterprise-agent");
});

test("first-run Setup points Provider discovery back to the real Plugin Store", () => {
  const setup = createPersonalAgentSetupPageV010(readiness());
  const provider = setup.steps.find(step => step.id === "provider");
  assert.equal(provider.state, "current");
  assert.equal(provider.primaryAction.id, "open-provider-catalog");
  assert.equal(provider.primaryAction.route, "/store");
  assert.deepEqual(provider.primaryAction.continuation, {
    onActionId: "install",
    route: "/enterprise-agent/setup",
    onItemIds: ["openai-llm-provider"]
  });
  assert.equal(setup.completionAction, undefined);
  assert.match(setup.title, /Set up Personal Agent/);
  assert.doesNotMatch(setup.description, /llm\.inference|Provider/);
  assert.doesNotMatch(provider.title + " " + provider.description, /llm\.inference|Provider/);
});

test("first-run Plugin Store continuation accepts any catalog AI service but not unrelated packages", () => {
  const setup = createPersonalAgentSetupPageV010(readiness({
    catalogProviderPackageIds: ["openai-llm-provider", "deepseek-llm-provider"]
  }));
  const provider = setup.steps.find(step => step.id === "provider");
  assert.deepEqual(provider.primaryAction.continuation, {
    onActionId: "install",
    route: "/enterprise-agent/setup",
    onItemIds: ["openai-llm-provider", "deepseek-llm-provider"]
  });
});

test("configured Provider step links real Provider Settings and Provider status", () => {
  const setup = createPersonalAgentSetupPageV010(readiness({
    code: "LLM_PROVIDER_CONFIGURATION_REQUIRED",
    message: "Provider configuration required.",
    providerPackageId: "openai-llm-provider",
    installedProviderPackageIds: ["openai-llm-provider"]
  }));
  const credentials = setup.steps.find(step => step.id === "credentials");
  assert.equal(credentials.state, "current");
  assert.equal(credentials.primaryAction.id, "configure-provider");
  assert.equal(credentials.primaryAction.route, "/settings/openai-llm-provider");
  assert.deepEqual(credentials.primaryAction.continuation, {
    onActionId: "settings.save",
    route: "/enterprise-agent/setup"
  });
  assert.equal(
    credentials.secondaryActions.find(action => action.id === "provider-status").route,
    "/providers/llm.inference"
  );
});

test("Provider selection and degraded/unavailable readiness stay on governed Provider surfaces", () => {
  const selection = createPersonalAgentSetupPageV010(readiness({
    code: "LLM_PROVIDER_SELECTION_REQUIRED",
    message: "Choose Provider.",
    installedProviderPackageIds: ["openai-llm-provider", "other-llm-provider"],
    catalogProviderPackageIds: ["openai-llm-provider", "other-llm-provider"]
  }));
  const selectionAction = selection.steps.find(step => step.id === "provider").primaryAction;
  assert.equal(selectionAction.route, "/providers/llm.inference");
  assert.deepEqual(selectionAction.continuation, {
    onActionId: "settings.save",
    route: "/enterprise-agent/setup"
  });

  const unavailable = createPersonalAgentSetupPageV010(readiness({
    state: "unavailable",
    code: "LLM_PROVIDER_UNAVAILABLE",
    message: "Provider unavailable.",
    installedProviderPackageIds: ["openai-llm-provider"],
    providerPackageId: "openai-llm-provider"
  }));
  const providerReadiness = unavailable.steps.find(step => step.id === "readiness");
  assert.equal(providerReadiness.state, "error");
  assert.equal(providerReadiness.primaryAction.route, "/providers/llm.inference");
  assert.equal(providerReadiness.secondaryActions[0].route, "/enterprise-agent/setup");
});

test("Ready completes setup with one clear next action instead of unrelated exit links", () => {
  const setup = createPersonalAgentSetupPageV010(readiness({
    state: "ready",
    code: "READY",
    message: "Personal Agent is ready.",
    providerId: "openai.responses",
    providerPackageId: "openai-llm-provider",
    installedProviderPackageIds: ["openai-llm-provider"]
  }));

  assert.equal(setup.steps.every(step => step.state === "complete"), true);
  assert.equal(setup.completionAction.route, "/enterprise-agent");
  assert.equal(setup.completionAction.label, "Start using Personal Agent");

  const finalStep = setup.steps.find(step => step.id === "ready");
  assert.equal(finalStep.title, "Ready to use");
  assert.equal(finalStep.secondaryActions, undefined);
});

test("Personal Agent first-class locale bundles keep exact key parity", () => {
  const bundles = enterpriseAgentPackage.features[0].contributions
    .filter(contribution => contribution.kind === "eidos.localization-bundle")
    .map(contribution => contribution.bundle);
  assert.deepEqual(bundles.map(item => item.locale).sort(), [
    "en",
    "ja",
    "zh-CN",
    "zh-TW"
  ]);

  const byLocale = Object.fromEntries(bundles.map(bundle => [bundle.locale, bundle.messages]));
  const baseline = Object.keys(byLocale.en).sort();
  for (const locale of ["en", "ja", "zh-CN", "zh-TW"]) {
    assert.deepEqual(
      Object.keys(byLocale[locale]).sort(),
      baseline,
      locale + " Personal Agent localization keys diverged from en"
    );
  }
});

test("Personal Agent shows resolved Context without a second Context selector", () => {
  const context = {
    contractVersion: "0.1.0",
    activeContext: {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:acme",
      enterpriseId: "acme"
    },
    personalContext: {
      contractVersion: "0.1.0",
      kind: "PERSONAL",
      contextId: "personal:preview-user",
      ownerSubjectId: "preview-user",
      displayName: "Preview User"
    },
    enterpriseContext: {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: "enterprise:acme",
      enterpriseId: "acme",
      displayName: "ACME Japan"
    }
  };
  const definition = createPersonalAgentChatPageV020(
    readiness({
      state: "ready",
      code: "READY",
      message: "Personal Agent is ready.",
      providerId: "openai.responses",
      providerPackageId: "openai-llm-provider",
      installedProviderPackageIds: ["openai-llm-provider"]
    }),
    context,
    [
      {
        ref: {
          contractVersion: "0.1.0",
          kind: "PERSONAL",
          contextId: "personal:preview-user"
        },
        label: "Preview User"
      },
      {
        ref: {
          contractVersion: "0.1.0",
          kind: "ENTERPRISE",
          contextId: "enterprise:acme",
          enterpriseId: "acme"
        },
        label: "ACME Japan"
      }
    ]
  );

  assert.equal(definition.context.label, "Current enterprise");
  assert.equal(definition.context.value, "ACME Japan");
  assert.equal(definition.context.selector, undefined);
});

test("Personal Agent context policy follows the current/default enterprise before Personal", () => {
  const personal = {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: "personal:user-1"
  };
  const enterpriseA = {
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: "enterprise:a",
    enterpriseId: "a"
  };
  const enterpriseB = {
    contractVersion: "0.1.0",
    kind: "ENTERPRISE",
    contextId: "enterprise:b",
    enterpriseId: "b"
  };

  assert.deepEqual(
    resolvePersonalAgentActiveContextV010({
      requestedContext: enterpriseB,
      defaultEnterpriseContext: enterpriseA,
      availableContexts: [personal, enterpriseA, enterpriseB]
    }),
    enterpriseB
  );
  assert.deepEqual(
    resolvePersonalAgentActiveContextV010({
      requestedContext: personal,
      defaultEnterpriseContext: enterpriseA,
      availableContexts: [personal, enterpriseA, enterpriseB]
    }),
    enterpriseA
  );
  assert.deepEqual(
    resolvePersonalAgentActiveContextV010({
      requestedContext: personal,
      availableContexts: [personal]
    }),
    personal
  );
});


test("Personal Agent chat transport exposes an abortable action execution path", async () => {
  let capturedSignal;
  const fetchImpl = async (_url, init) => {
    capturedSignal = init.signal;
    return await new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });
  };

  const host = createAppManagerActionHost({
    baseUrl: "https://example.test",
    fetchImpl
  });
  const controller = new AbortController();
  const pending = host.executeWithSignal({
    contractVersion: "0.1.0",
    type: "command",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    values: { message: "hello" },
    sourceInteractionId: "enterprise-agent.home",
    actionId: "chat.send",
    requiresConfirmation: false
  }, controller.signal);

  controller.abort();
  await assert.rejects(pending, error => error?.name === "AbortError");
  assert.equal(capturedSignal, controller.signal);
  assert.equal(capturedSignal.aborted, true);
});

test("Personal Agent chat overlay keeps mature feedback and message actions", async () => {
  const source = await readFile(
    new URL("../../dist/vendor/eidos/src/app-host/page-controller.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /data-eidos-chat-pending/);
  assert.match(source, /data-eidos-chat-stop/);
  assert.match(source, /data-eidos-chat-message-copy/);
  assert.match(source, /data-eidos-chat-message-retry/);
  assert.match(source, /AbortController/);
  assert.match(source, /chatUiTextV010/);
});

test("Personal Agent chat header uses Eidos Workbench chrome and progressive disclosure", async () => {
  const [source, designLanguage] = await Promise.all([
    readFile(
      new URL("../../dist/vendor/eidos/src/app-host/page-controller.js", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../../dist/vendor/eidos/src/design-language/productive-workbench-css.js", import.meta.url),
      "utf8"
    )
  ]);

  assert.match(source, /data-eidos-chat-heading-group/);
  assert.match(source, /data-eidos-chat-thread-controls/);
  assert.match(source, /data-eidos-chat-history-menu/);
  assert.match(source, /data-eidos-chat-history-item/);
  assert.match(source, /data-eidos-chat-more-menu/);
  assert.match(source, /data-eidos-chat-archive-thread/);
  assert.match(source, /data-eidos-chat-context/);
  assert.match(source, /createEidosIconElement/);
  assert.match(source, /"newChat"/);
  assert.match(source, /"history"/);
  assert.match(source, /"moreHorizontal"/);
  assert.match(source, /data-eidos-chat-toolbar-label/);
  assert.doesNotMatch(source, /moreSummary\.textContent = "⋯"/);
  assert.doesNotMatch(source, /threadControls\.append\(threadSelect, newThreadButton, archiveThreadButton\)/);

  assert.match(
    designLanguage,
    /data-eidos-workspace-content\]:has\(> \[data-eidos-chat\]\)/
  );
  assert.match(designLanguage, /data-eidos-chat-new-thread/);
  assert.match(designLanguage, /data-eidos-chat-history-toggle/);
  assert.match(designLanguage, /data-eidos-chat-more-toggle/);
});

test("Personal Agent thinking state is transient and hidden after terminal progress", async () => {
  const source = await readFile(
    new URL("../../dist/vendor/eidos/src/app-host/page-controller.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /pendingIndicator\.style\.display = "none"/);
  assert.match(source, /pendingIndicator\.style\.display = busy \? "flex" : "none"/);
  assert.match(source, /\["SUCCEEDED", "BLOCKED", "FAILED", "CANCELLED"\]/);
  assert.match(source, /message => message\.id !== runProgressMessageId/);
});

test("Workbench suppresses a duplicate side chat while the workspace itself is chat", async () => {
  const source = await readFile(
    new URL("../../dist/manager/desktop-workbench-runtime.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /data-evo-workspace-chat-exclusive/);
  assert.match(source, /data-eidos-workspace-content/);
  assert.match(source, /data-eidos-side-panel-content/);
  assert.match(source, /data-eidos-chat/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /gridTemplateColumns/);
});
