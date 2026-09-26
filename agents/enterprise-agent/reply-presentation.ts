import type { ChatMessagePartV020 } from "../../vendor/eidos/src/chat/contracts.js";
import type { PersonalAgentReplyV010 } from "./contracts.js";

function contextLabel(reply: PersonalAgentReplyV010): string | undefined {
  const context = reply.context;
  if (!context) return undefined;
  if (context.activeContext.kind === "PERSONAL") {
    return context.personalContext.displayName ?? context.activeContext.contextId;
  }
  return context.enterpriseContext?.displayName ?? context.activeContext.contextId;
}

function proposalFromInstallPlan(
  reply: PersonalAgentReplyV010
): ChatMessagePartV020 | undefined {
  const observation = reply.observations.find(
    item => item.tool === "app.install.plan" && item.ok
  );
  if (!observation || observation.result === null || typeof observation.result !== "object") {
    return undefined;
  }

  const plan = observation.result as {
    packageId?: unknown;
    blockers?: unknown;
    sideEffectFree?: unknown;
  };
  if (typeof plan.packageId !== "string" || plan.sideEffectFree !== true) {
    return undefined;
  }

  const blockers = Array.isArray(plan.blockers)
    ? plan.blockers
        .map(value => {
          if (value && typeof value === "object" && "message" in value) {
            const message = (value as { message?: unknown }).message;
            return typeof message === "string" ? message : undefined;
          }
          return undefined;
        })
        .filter((value): value is string => Boolean(value))
    : [];

  return {
    type: "proposal",
    title: `Install ${plan.packageId}`,
    summary: blockers.length === 0
      ? "The side-effect-free installation preflight has no blockers."
      : "The installation preflight found blockers that need review.",
    reasons: blockers.length > 0
      ? blockers
      : ["A side-effect-free installation preflight completed successfully."],
    risk: "Installation changes platform state and remains Host-governed.",
    actions: [
      {
        id: "review-installation",
        label: "Review in workspace",
        type: "navigate",
        route: "/store",
        primary: true
      }
    ]
  };
}

export function presentPersonalAgentReplyV020(
  reply: PersonalAgentReplyV010
): ChatMessagePartV020[] {
  const parts: ChatMessagePartV020[] = [];
  if (reply.message.trim()) {
    parts.push({ type: "text", text: reply.message });
  }

  const tools = new Map(reply.tools.map(tool => [tool.id, tool]));
  const context = contextLabel(reply);

  for (const observation of reply.observations) {
    const tool = tools.get(observation.tool);
    parts.push({
      type: "activity",
      label: tool?.title ?? observation.tool,
      state: observation.ok ? "complete" : "error",
      ...(observation.ok
        ? {}
        : { detail: observation.error?.code ?? "TOOL_EXECUTION_FAILED" })
    });

    if (observation.ok && tool && (tool.effect === "READ" || tool.effect === "PLAN")) {
      parts.push({
        type: "evidence",
        title: tool.title,
        source: tool.ownerPackageId,
        ...(context ? { context } : {})
      });
    }
  }

  const proposal = proposalFromInstallPlan(reply);
  if (proposal) parts.push(proposal);

  return parts;
}
