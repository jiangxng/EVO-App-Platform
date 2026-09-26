import type {
  ActiveContextRefV010,
  ContextMemoryItemV010,
  ContextMemoryReadRequestV010,
  ContextMemoryReadResultV010,
  ContextMemoryReaderV010,
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

export function createHostContextMemoryReaderV010(
  store: ContextMemoryStoreV010
): ContextMemoryReaderV010 {
  return {
    providerId: HOST_CONTEXT_MEMORY_READER_PROVIDER_ID,
    read(input: ContextMemoryReadRequestV010): ContextMemoryReadResultV010 {
      if (input.contractVersion !== "0.1.0") {
        throw new Error("CONTEXT_MEMORY_READ_CONTRACT_UNSUPPORTED");
      }
      const limit = canonicalLimit(input.limit);
      const offset = cursorOffset(input.cursor);
      const query = input.query?.trim().toLocaleLowerCase();
      const memoryIds = input.memoryIds ? new Set(input.memoryIds) : undefined;
      const kinds = input.kinds ? new Set(input.kinds) : undefined;

      const items = store.snapshot().items
        .filter(item => sameContext(item.context, input.context))
        .filter(item => !memoryIds || memoryIds.has(item.memoryId))
        .filter(item => !kinds || kinds.has(item.kind))
        .filter(item => {
          if (!query) return true;
          return item.summary.toLocaleLowerCase().includes(query)
            || item.provenance.evidenceRefs.some(ref =>
              ref.toLocaleLowerCase().includes(query)
            );
        })
        .sort((a, b) =>
          b.attribution.recordedAt.localeCompare(a.attribution.recordedAt)
          || b.memoryId.localeCompare(a.memoryId)
        );

      const page = items.slice(offset, offset + limit);
      const nextOffset = offset + page.length;
      return {
        contractVersion: "0.1.0",
        items: page.map(item => structuredClone(item)),
        ...(nextOffset < items.length
          ? { nextCursor: `offset:${nextOffset}` }
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
