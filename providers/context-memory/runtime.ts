import type {
  ActiveContextRefV010,
  ContextMemoryGovernanceProviderV010,
  ContextMemoryItemV010,
  ContextMemoryReadRequestV010,
  ContextMemoryReadResultV010,
  ContextMemoryReaderV010,
  ContextMemorySemanticRetrieverV010,
  ContextMemoryWriterV010
} from "../../contracts/platform-services.js";
import type { ContextMemoryStoreV010 } from "../../manager/context-memory-store.js";
import {
  HOST_CONTEXT_MEMORY_READER_PROVIDER_ID,
  HOST_CONTEXT_MEMORY_WRITER_PROVIDER_ID
} from "./package.js";

function sameContext(
  left: ActiveContextRefV010,
  right: ActiveContextRefV010
): boolean {
  return left.kind === right.kind
    && left.contextId === right.contextId
    && (
      left.kind !== "ENTERPRISE"
      || right.kind !== "ENTERPRISE"
      || left.enterpriseId === right.enterpriseId
    );
}

function canonicalLimit(limit: number | undefined): number {
  if (limit === undefined) return 20;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("CONTEXT_MEMORY_LIMIT_INVALID");
  }
  return limit;
}

function cursorOffset(cursor: string | undefined): number {
  if (!cursor) return 0;
  if (!/^offset:\d+$/.test(cursor)) throw new Error("CONTEXT_MEMORY_CURSOR_INVALID");
  const offset = Number(cursor.slice("offset:".length));
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new Error("CONTEXT_MEMORY_CURSOR_INVALID");
  }
  return offset;
}

function lexicalScore(item: ContextMemoryItemV010, query: string | undefined) {
  if (!query) {
    return {
      score: 0,
      signals: ["RECENCY_ORDER"]
    };
  }
  const summary = item.summary.toLocaleLowerCase();
  const exact = summary === query;
  const summaryContains = summary.includes(query);
  const evidenceContains = item.provenance.evidenceRefs.some(ref =>
    ref.toLocaleLowerCase().includes(query)
  );
  const score = exact ? 1 : summaryContains ? 0.75 : evidenceContains ? 0.5 : 0;
  return {
    score,
    signals: [
      ...(exact ? ["SUMMARY_EXACT"] : []),
      ...(!exact && summaryContains ? ["SUMMARY_CONTAINS"] : []),
      ...(evidenceContains ? ["EVIDENCE_REF_CONTAINS"] : [])
    ]
  };
}

function visibleByGovernance(
  item: ContextMemoryItemV010,
  governance: ContextMemoryGovernanceProviderV010 | undefined
): boolean {
  const decision = governance?.get(item.memoryId);
  if (!decision) return true;
  return decision.state === "ACTIVE"
    && decision.privacyClass !== "RESTRICTED";
}

function validateSemanticRanking(
  ranking: Array<{ memoryId: string; score: number; signals: string[] }>,
  candidates: readonly ContextMemoryItemV010[]
): void {
  const ids = new Set(candidates.map(item => item.memoryId));
  const seen = new Set<string>();
  for (const item of ranking) {
    if (
      !ids.has(item.memoryId)
      || seen.has(item.memoryId)
      || !Number.isFinite(item.score)
      || item.score < 0
      || item.score > 1
      || !Array.isArray(item.signals)
    ) {
      throw new Error("CONTEXT_MEMORY_SEMANTIC_RANKING_INVALID");
    }
    seen.add(item.memoryId);
  }
}

export function createHostContextMemoryReaderV010(
  store: ContextMemoryStoreV010,
  options: {
    governance?: ContextMemoryGovernanceProviderV010;
    semanticRetriever?: ContextMemorySemanticRetrieverV010;
  } = {}
): ContextMemoryReaderV010 {
  return {
    providerId: HOST_CONTEXT_MEMORY_READER_PROVIDER_ID,
    async read(input: ContextMemoryReadRequestV010): Promise<ContextMemoryReadResultV010> {
      if (input.contractVersion !== "0.1.0") {
        throw new Error("CONTEXT_MEMORY_READ_CONTRACT_UNSUPPORTED");
      }
      const strategy = input.strategy ?? "LEXICAL";
      const limit = canonicalLimit(input.limit);
      const offset = cursorOffset(input.cursor);
      const query = input.query?.trim().toLocaleLowerCase();
      const memoryIds = input.memoryIds ? new Set(input.memoryIds) : undefined;
      const kinds = input.kinds ? new Set(input.kinds) : undefined;

      const candidates = store.snapshot().items
        .filter(item => sameContext(item.context, input.context))
        .filter(item => !memoryIds || memoryIds.has(item.memoryId))
        .filter(item => !kinds || kinds.has(item.kind))
        .filter(item => visibleByGovernance(item, options.governance));

      if (strategy === "LEXICAL") {
        const scored = candidates
          .map(item => ({ item, ...lexicalScore(item, query) }))
          .filter(entry => !query || entry.score > 0)
          .sort((a, b) =>
            b.score - a.score
            || b.item.attribution.recordedAt.localeCompare(a.item.attribution.recordedAt)
            || b.item.memoryId.localeCompare(a.item.memoryId)
          );
        const page = scored.slice(offset, offset + limit);
        const nextOffset = offset + page.length;
        return {
          contractVersion: "0.1.0",
          items: page.map(entry => structuredClone(entry.item)),
          strategyUsed: "LEXICAL",
          ranking: page.map(entry => ({
            contractVersion: "0.1.0",
            memoryId: entry.item.memoryId,
            score: entry.score,
            signals: [...entry.signals]
          })),
          ...(nextOffset < scored.length ? { nextCursor: `offset:${nextOffset}` } : {})
        };
      }

      if (!query) {
        throw new Error("CONTEXT_MEMORY_SEMANTIC_QUERY_REQUIRED");
      }
      if (!options.semanticRetriever) {
        throw new Error(`CONTEXT_MEMORY_RETRIEVAL_STRATEGY_UNSUPPORTED: ${strategy}`);
      }

      const semantic = await options.semanticRetriever.search({
        contractVersion: "0.1.0",
        context: structuredClone(input.context),
        query,
        candidates: candidates.map(item => ({
          contractVersion: "0.1.0",
          memoryId: item.memoryId,
          summary: item.summary,
          kind: item.kind,
          evidenceRefs: [...item.provenance.evidenceRefs]
        })),
        limit: Math.min(100, Math.max(limit + offset, limit))
      });
      validateSemanticRanking(semantic.ranking, candidates);

      const byId = new Map(candidates.map(item => [item.memoryId, item]));
      let ranking = semantic.ranking.map(entry => ({
        memoryId: entry.memoryId,
        score: entry.score,
        signals: [...entry.signals.map(signal => `SEMANTIC:${signal}`)]
      }));

      if (strategy === "HYBRID") {
        const semanticById = new Map(ranking.map(item => [item.memoryId, item]));
        ranking = candidates
          .map(item => {
            const lexical = lexicalScore(item, query);
            const semanticEntry = semanticById.get(item.memoryId);
            const semanticScore = semanticEntry?.score ?? 0;
            return {
              memoryId: item.memoryId,
              score: (lexical.score + semanticScore) / 2,
              signals: [
                ...lexical.signals.map(signal => `LEXICAL:${signal}`),
                ...(semanticEntry?.signals ?? [])
              ]
            };
          })
          .filter(item => item.score > 0);
      }

      ranking.sort((a, b) =>
        b.score - a.score
        || (byId.get(b.memoryId)?.attribution.recordedAt ?? "")
          .localeCompare(byId.get(a.memoryId)?.attribution.recordedAt ?? "")
        || b.memoryId.localeCompare(a.memoryId)
      );
      const pageRanking = ranking.slice(offset, offset + limit);
      const items = pageRanking
        .map(entry => byId.get(entry.memoryId))
        .filter((item): item is ContextMemoryItemV010 => item !== undefined);

      return {
        contractVersion: "0.1.0",
        items: items.map(item => structuredClone(item)),
        strategyUsed: strategy,
        ranking: pageRanking.map(entry => ({
          contractVersion: "0.1.0",
          memoryId: entry.memoryId,
          score: entry.score,
          signals: [...entry.signals]
        })),
        ...(offset + pageRanking.length < ranking.length
          ? { nextCursor: `offset:${offset + pageRanking.length}` }
          : {})
      };
    }
  };
}

export function createHostContextMemoryWriterV010(
  store: ContextMemoryStoreV010
): ContextMemoryWriterV010 {
  return {
    providerId: HOST_CONTEXT_MEMORY_WRITER_PROVIDER_ID,
    write(input) {
      if (input.contractVersion !== "0.1.0") {
        throw new Error("CONTEXT_MEMORY_WRITE_CONTRACT_UNSUPPORTED");
      }
      const snapshot = store.snapshot();
      if (snapshot.items.some(item => item.memoryId === input.item.memoryId)) {
        throw new Error(`CONTEXT_MEMORY_DUPLICATE: ${input.item.memoryId}`);
      }
      store.save({
        contractVersion: "0.1.0",
        items: [...snapshot.items, structuredClone(input.item)]
      });
      return structuredClone(input.item);
    }
  };
}

export function createHostContextMemoryHealthProbeV010(
  store: ContextMemoryStoreV010
) {
  return () => ({
    state: "HEALTHY" as const,
    message: `Host Context Memory store contains ${store.snapshot().items.length} immutable record(s).`
  });
}
