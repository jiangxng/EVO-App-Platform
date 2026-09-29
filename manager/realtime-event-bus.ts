import { randomUUID } from "node:crypto";
import type {
  HostRealtimeEventInputV010,
  HostRealtimeEventV010
} from "../contracts/realtime-events.js";

export interface HostRealtimeEventFilterV010 {
  principalSubjectId: string;
  accessibleContextIds: ReadonlySet<string>;
}

export interface HostRealtimeReplayV010 {
  events: HostRealtimeEventV010[];
  resetRequired: boolean;
  cursorEventId?: string;
  cursorSequence?: number;
}

export interface HostRealtimeEventBusV010 {
  publish(input: HostRealtimeEventInputV010): HostRealtimeEventV010;
  subscribe(
    filter: HostRealtimeEventFilterV010,
    handler: (event: HostRealtimeEventV010) => void
  ): () => void;
  replayAfter(
    eventId: string | undefined,
    filter: HostRealtimeEventFilterV010
  ): HostRealtimeReplayV010;
  diagnostics(): {
    subscriberCount: number;
    bufferedEventCount: number;
    currentSequence: number;
    capacity: number;
  };
}

function visibleTo(
  event: HostRealtimeEventV010,
  filter: HostRealtimeEventFilterV010
): boolean {
  const scope = event.scope;
  if (!scope) return true;
  if (
    scope.principalSubjectId
    && scope.principalSubjectId !== filter.principalSubjectId
  ) {
    return false;
  }
  if (
    scope.contextId
    && !filter.accessibleContextIds.has(scope.contextId)
  ) {
    return false;
  }
  return true;
}

export function createHostRealtimeEventBusV010(input?: {
  now?: () => Date;
  capacity?: number;
}): HostRealtimeEventBusV010 {
  const now = input?.now ?? (() => new Date());
  const capacity = Math.max(64, input?.capacity ?? 2048);
  const ring: HostRealtimeEventV010[] = [];
  const subscribers = new Set<{
    filter: HostRealtimeEventFilterV010;
    handler: (event: HostRealtimeEventV010) => void;
  }>();
  let sequence = 0;

  return {
    publish(value) {
      sequence += 1;
      const event: HostRealtimeEventV010 = {
        contractVersion: "0.1.0",
        eventId: "realtime:" + sequence + ":" + randomUUID(),
        sequence,
        topic: value.topic,
        type: value.type,
        occurredAt: now().toISOString(),
        ...(value.scope ? { scope: structuredClone(value.scope) } : {}),
        ...(value.resource ? { resource: structuredClone(value.resource) } : {}),
        ...(value.correlationId
          ? { correlationId: value.correlationId }
          : {}),
        ...(value.causationId
          ? { causationId: value.causationId }
          : {}),
        ...(value.payload === undefined
          ? {}
          : { payload: structuredClone(value.payload) })
      };
      ring.push(event);
      if (ring.length > capacity) ring.splice(0, ring.length - capacity);

      for (const subscription of subscribers) {
        if (!visibleTo(event, subscription.filter)) continue;
        subscription.handler(structuredClone(event));
      }
      return structuredClone(event);
    },

    subscribe(filter, handler) {
      const subscription = { filter, handler };
      subscribers.add(subscription);
      return () => subscribers.delete(subscription);
    },

    replayAfter(eventId, filter) {
      if (!eventId) {
        return { events: [], resetRequired: false };
      }
      const index = ring.findIndex(event => event.eventId === eventId);
      if (index < 0) {
        const visible = ring.filter(event => visibleTo(event, filter));
        const cursor = visible.at(-1);
        return {
          events: [],
          resetRequired: visible.length > 0,
          ...(cursor
            ? {
                cursorEventId: cursor.eventId,
                cursorSequence: cursor.sequence
              }
            : {})
        };
      }
      return {
        events: ring
          .slice(index + 1)
          .filter(event => visibleTo(event, filter))
          .map(event => structuredClone(event)),
        resetRequired: false
      };
    },

    diagnostics() {
      return {
        subscriberCount: subscribers.size,
        bufferedEventCount: ring.length,
        currentSequence: sequence,
        capacity
      };
    }
  };
}
