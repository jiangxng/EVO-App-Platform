import type { ChatExperienceV020 } from "../../vendor/eidos/src/chat/contracts.js";
import type { SetupFlowV010 } from "../../vendor/eidos/src/setup-flow/contracts.js";
import type { ResolvedContextSetV010 } from "../../contracts/platform-services.js";
import {
  PERSONAL_AGENT_HOME_ROUTE,
  PERSONAL_AGENT_SETUP_ROUTE
} from "./package.js";
import type { PersonalAgentReadinessV010 } from "./readiness.js";

function canonicalUiLocale(locale: string): "en" | "zh-CN" | "ja" | "zh-TW" {
  try {
    const canonical = Intl.getCanonicalLocales(locale.trim())[0] ?? "en";
    if (canonical === "zh-CN" || canonical.startsWith("zh-Hans")) return "zh-CN";
    if (canonical === "zh-TW" || canonical === "zh-HK" || canonical.startsWith("zh-Hant")) return "zh-TW";
    if (canonical === "ja" || canonical.startsWith("ja-")) return "ja";
    return "en";
  } catch {
    return "en";
  }
}

function contextValue(context: ResolvedContextSetV010, locale: string): string {
  if (context.activeContext.kind === "ENTERPRISE") {
    return context.enterpriseContext?.displayName
      ?? context.enterpriseContext?.enterpriseId
      ?? context.activeContext.enterpriseId;
  }
  const displayName = context.personalContext.displayName?.trim();
  if (displayName && displayName !== "Personal") return displayName;
  const labels = {
    en: "Personal",
    "zh-CN": "个人",
    ja: "個人",
    "zh-TW": "個人"
  } as const;
  return labels[canonicalUiLocale(locale)];
}

export function createPersonalAgentChatPageV020(
  readiness: PersonalAgentReadinessV010,
  context: ResolvedContextSetV010,
  locale = "en"
): ChatExperienceV020 {
  const ready = readiness.state === "READY";
  return {
    contractVersion: "0.2.0",
    kind: "chat",
    id: "enterprise-agent.home",
    title: "Personal Agent",
    command: {
      code: "enterprise-agent.chat",
      inputVersion: "0.1.0"
    },
    composer: {
      key: "message",
      placeholder: "Ask a question or describe a task",
      sendLabel: "Send",
      disabled: !ready
    },
    context: {
      label: "Context",
      value: contextValue(context, locale),
      tone: "neutral"
    },
    readiness: ready
      ? {
          state: "ready",
          label: "Ready"
        }
      : {
          state: readiness.state === "UNAVAILABLE" ? "unavailable" : "setup-required",
          label: readiness.state === "UNAVAILABLE"
            ? "Personal Agent is unavailable"
            : "Personal Agent needs setup",
          message: readiness.message,
          action: {
            id: "setup",
            label: "Set up",
            type: "navigate",
            route: PERSONAL_AGENT_SETUP_ROUTE,
            primary: true
          }
        },
    emptyState: ready
      ? {
          title: "How can I help?",
          description: "I can inspect the current Context, explain what is happening, and prepare an opinion or plan for you to review.",
          suggestions: [
            {
              id: "attention",
              label: "What needs my attention?",
              prompt: "What needs my attention right now?"
            },
            {
              id: "apps",
              label: "Show available apps",
              prompt: "Show me the apps I can use."
            },
            {
              id: "workspace",
              label: "Explain this workspace",
              prompt: "Explain the current workspace and what I can do here."
            }
          ]
        }
      : undefined,
    metadata: {
      productIdentity: "Personal Agent",
      readinessCode: readiness.code,
      activeContextKind: context.activeContext.kind
    }
  };
}

function providerPackageForConfiguration(readiness: PersonalAgentReadinessV010) {
  if (readiness.providerPackageId) {
    return readiness.candidates.find(item => item.packageId === readiness.providerPackageId);
  }
  const installed = readiness.candidates.filter(item => item.installed);
  if (installed.length === 1) return installed[0];
  return undefined;
}

export function createPersonalAgentSetupPageV010(
  readiness: PersonalAgentReadinessV010
): SetupFlowV010 {
  const ready = readiness.state === "READY";
  const providerConfigured = readiness.code === "READY" || readiness.code === "PROVIDER_UNAVAILABLE";
  const providerChosen = readiness.code !== "NO_PROVIDER_INSTALLED"
    && readiness.code !== "PROVIDER_NOT_ACTIVE"
    && readiness.code !== "PROVIDER_AMBIGUOUS";
  const candidate = providerPackageForConfiguration(readiness);

  const providerAction = readiness.code === "PROVIDER_AMBIGUOUS"
    ? {
        id: "choose-provider",
        label: "Choose provider",
        type: "navigate" as const,
        route: "/providers/llm.inference",
        primary: true
      }
    : readiness.code === "NO_PROVIDER_INSTALLED" || readiness.code === "PROVIDER_NOT_ACTIVE"
      ? {
          id: "open-plugins",
          label: "Open Plugins",
          type: "navigate" as const,
          route: "/store",
          primary: true
        }
      : undefined;

  const configureAction = !ready && candidate?.settingsRoute
    ? {
        id: "configure-provider",
        label: "Configure provider",
        type: "navigate" as const,
        route: candidate.settingsRoute,
        primary: true
      }
    : undefined;

  return {
    contractVersion: "0.1.0",
    kind: "setup-flow",
    id: "personal-agent.setup",
    title: "Personal Agent setup",
    description: "Complete the required steps to make Personal Agent ready.",
    steps: [
      {
        id: "provider",
        title: "LLM Provider",
        description: "Choose or install the inference Provider Personal Agent will use.",
        state: providerChosen ? "complete" : readiness.state === "UNAVAILABLE" ? "error" : "current",
        statusDetail: providerChosen ? "Complete" : readiness.message,
        ...(providerAction ? { primaryAction: providerAction } : {})
      },
      {
        id: "credentials",
        title: "Provider credentials",
        description: "Configure credentials on the Provider-owned Settings surface.",
        state: ready || providerConfigured
          ? "complete"
          : providerChosen
            ? "current"
            : "pending",
        statusDetail: ready || providerConfigured
          ? "Complete"
          : providerChosen
            ? "Required"
            : "Waiting",
        ...(providerChosen && !providerConfigured && configureAction
          ? { primaryAction: configureAction }
          : {})
      },
      {
        id: "readiness",
        title: "Provider readiness",
        description: "The Host verifies that a usable Provider runtime can be resolved.",
        state: ready
          ? "complete"
          : readiness.state === "UNAVAILABLE"
            ? "error"
            : providerConfigured
              ? "current"
              : "pending",
        statusDetail: ready
          ? "Ready"
          : readiness.state === "UNAVAILABLE"
            ? readiness.message
            : providerConfigured
              ? "Checking"
              : "Waiting",
        ...(readiness.state === "UNAVAILABLE" && configureAction
          ? { primaryAction: configureAction }
          : {})
      },
      {
        id: "ready",
        title: "Ready",
        description: "Personal Agent is ready for use.",
        state: ready ? "complete" : "pending",
        statusDetail: ready ? "Complete" : "Waiting"
      }
    ],
    ...(ready
      ? {
          completionAction: {
            id: "open-agent",
            label: "Open Personal Agent",
            type: "navigate",
            route: PERSONAL_AGENT_HOME_ROUTE,
            primary: true
          }
        }
      : {})
  };
}
