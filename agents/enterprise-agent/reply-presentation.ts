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

function canonicalizationProposalFromMemoryReview(
  reply: PersonalAgentReplyV010,
  locale: string
): ChatMessagePartV020 | undefined {
  const observation = [...reply.observations].reverse().find(
    item => item.tool === "context.memory.canonicalization.proposal.create" && item.ok
  );
  if (!observation || observation.result === null || typeof observation.result !== "object") {
    return undefined;
  }
  const result = observation.result as {
    proposal?: {
      proposalId?: unknown;
      duplicateMemoryId?: unknown;
      canonicalMemoryId?: unknown;
      reason?: unknown;
    };
    reviewRoute?: unknown;
  };
  if (
    !result.proposal
    || typeof result.proposal.proposalId !== "string"
    || typeof result.proposal.duplicateMemoryId !== "string"
    || typeof result.proposal.canonicalMemoryId !== "string"
    || typeof result.reviewRoute !== "string"
  ) {
    return undefined;
  }

  const zh = locale.toLowerCase().startsWith("zh");
  const ja = locale.toLowerCase().startsWith("ja");
  const title = zh
    ? "审核记忆去重提案"
    : ja
      ? "メモリー正規化提案をレビュー"
      : "Review Memory canonicalization";
  const summary = zh
    ? "该提案只建立已有 Memory 之间的 duplicate → canonical 治理关系，不会创建、编辑或删除 Memory 正文。"
    : ja
      ? "この提案は既存 Memory 間の duplicate → canonical ガバナンス関係のみを作成し、Memory 本文は作成・編集・削除しません。"
      : "This proposal only creates a duplicate → canonical governance relation between existing Memory records; it does not create, edit or delete Memory content.";
  const risk = zh
    ? "接受后，重复记录会退出普通检索，但仍可通过精确 ID 用于审计。"
    : ja
      ? "承認後、重複記録は通常検索から除外されますが、正確な ID では監査用に引き続き参照できます。"
      : "After acceptance, the duplicate leaves ordinary retrieval but remains addressable by exact ID for audit.";
  const action = zh ? "打开记忆审核" : ja ? "メモリーレビューを開く" : "Open memory review";

  return {
    type: "proposal",
    title,
    summary,
    reasons: [
      summary,
      `duplicate: ${result.proposal.duplicateMemoryId}`,
      `canonical: ${result.proposal.canonicalMemoryId}`,
      ...(typeof result.proposal.reason === "string" && result.proposal.reason.trim()
        ? [`reason: ${result.proposal.reason}`]
        : [])
    ],
    risk,
    actions: [{
      id: "review-memory-canonicalization",
      label: action,
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

  const canonicalizationProposal = canonicalizationProposalFromMemoryReview(reply, locale);
  if (canonicalizationProposal) parts.push(canonicalizationProposal);

  const proposal = proposalFromInstallPlan(reply);
  if (proposal) parts.push(proposal);

  return parts;
}
