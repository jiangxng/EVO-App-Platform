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

function memoryProposalText(locale: string) {
  if (locale === "zh-CN") return {
    title: "审核记忆提案",
    summary: "这条候选知识只有在你审核并接受后，才会成为持久化 Context Memory。",
    risk: "接受会创建不可修改的 Memory 记录；编辑只会新增 Proposal revision。",
    action: "打开记忆审核",
    evidence: "证据引用",
    signals: "审核信号"
  };
  if (locale === "ja") return {
    title: "メモリー提案をレビュー",
    summary: "この候補知識は、レビューして承認するまで永続的な Context Memory にはなりません。",
    risk: "承認すると不変の Memory レコードが作成され、編集は Proposal revision として追加されます。",
    action: "メモリーレビューを開く",
    evidence: "証拠参照",
    signals: "レビュー信号"
  };
  if (locale === "zh-TW") return {
    title: "審核記憶提案",
    summary: "這筆候選知識只有在你審核並接受後，才會成為持久化 Context Memory。",
    risk: "接受會建立不可修改的 Memory 記錄；編輯只會新增 Proposal revision。",
    action: "開啟記憶審核",
    evidence: "證據引用",
    signals: "審核訊號"
  };
  return {
    title: "Review proposed memory",
    summary: "This proposed knowledge becomes durable Context Memory only after you review and accept it.",
    risk: "Accepting creates an immutable Memory record; edits append Proposal revisions.",
    action: "Open memory review",
    evidence: "Evidence refs",
    signals: "Review signals"
  };
}

function proposalFromMemoryReview(
  reply: PersonalAgentReplyV010,
  locale: string
): ChatMessagePartV020 | undefined {
  const observation = [...reply.observations].reverse().find(
    item => item.tool === "context.memory.proposal.create" && item.ok
  );
  if (!observation || observation.result === null || typeof observation.result !== "object") {
    return undefined;
  }
  const result = observation.result as {
    proposal?: {
      proposalId?: unknown;
      revisions?: Array<{
        summary?: unknown;
        evidenceRefs?: unknown;
        reviewSignals?: unknown;
      }>;
    };
    reviewRoute?: unknown;
  };
  if (
    !result.proposal
    || typeof result.proposal.proposalId !== "string"
    || typeof result.reviewRoute !== "string"
  ) {
    return undefined;
  }
  const revision = result.proposal.revisions?.at(-1);
  const text = memoryProposalText(locale);
  const evidenceCount = Array.isArray(revision?.evidenceRefs)
    ? revision!.evidenceRefs!.length
    : 0;
  const signalCount = Array.isArray(revision?.reviewSignals)
    ? revision!.reviewSignals!.length
    : 0;
  return {
    type: "proposal",
    title: text.title,
    summary: typeof revision?.summary === "string" && revision.summary.trim()
      ? revision.summary
      : text.summary,
    reasons: [
      text.summary,
      `${text.evidence}: ${evidenceCount}`,
      `${text.signals}: ${signalCount}`
    ],
    risk: text.risk,
    actions: [{
      id: "review-memory-proposal",
      label: text.action,
      type: "navigate",
      route: result.reviewRoute,
      primary: true
    }]
  };
}

export function presentPersonalAgentReplyV020(
  reply: PersonalAgentReplyV010,
  locale = "en"
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

  const memoryProposal = proposalFromMemoryReview(reply, locale);
  if (memoryProposal) parts.push(memoryProposal);

  const proposal = proposalFromInstallPlan(reply);
  if (proposal) parts.push(proposal);

  return parts;
}
