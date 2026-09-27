import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync
} from "node:fs";
import { dirname } from "node:path";
import type { ActiveContextRefV010 } from "../contracts/platform-services.js";

export type PersonalAgentFollowUpStateV010 =
  | "OPEN"
  | "COMPLETED"
  | "DISMISSED";

export type PersonalAgentFollowUpKindV010 =
  | "REVIEW_PREFERRED_MEMORY"
  | "CLARIFY_MEMORY_CONTEXT"
  | "REVIEW_MEMORY_RESOLUTION";

export interface PersonalAgentFollowUpEventV010 {
  contractVersion: "0.1.0";
  eventId: string;
  followUpId: string;
  principalSubjectId: string;
  context: ActiveContextRefV010;
  state: PersonalAgentFollowUpStateV010;
  kind: PersonalAgentFollowUpKindV010;
  sourceType: "MEMORY_CONTRADICTION";
  sourceId: string;
  title: string;
  instruction: string;
  relatedMemoryIds: string[];
  occurredAt: string;
  actorSubjectId: string;
}

export interface PersonalAgentFollowUpV010
  extends Omit<PersonalAgentFollowUpEventV010, "eventId"> {
  effectiveEventId: string;
}

export interface PersonalAgentFollowUpSnapshotV010 {
  contractVersion: "0.1.0";
  events: PersonalAgentFollowUpEventV010[];
}

export interface PersonalAgentFollowUpStoreV010 {
  snapshot(): PersonalAgentFollowUpSnapshotV010;
  append(event: PersonalAgentFollowUpEventV010): void;
  get(followUpId: string): PersonalAgentFollowUpV010 | undefined;
  listForPrincipal(
    principalSubjectId: string,
    context?: ActiveContextRefV010
  ): PersonalAgentFollowUpV010[];
  listOpen(
    principalSubjectId: string,
    context: ActiveContextRefV010
  ): PersonalAgentFollowUpV010[];
  findBySource(
    principalSubjectId: string,
    sourceType: "MEMORY_CONTRADICTION",
    sourceId: string
  ): PersonalAgentFollowUpV010 | undefined;
}

function sameContext(
  a: ActiveContextRefV010,
  b: ActiveContextRefV010
): boolean {
  return a.kind === b.kind
    && a.contextId === b.contextId
    && (
      a.kind !== "ENTERPRISE"
      || b.kind !== "ENTERPRISE"
      || a.enterpriseId === b.enterpriseId
    );
}

function validate(
  snapshot: PersonalAgentFollowUpSnapshotV010
): PersonalAgentFollowUpSnapshotV010 {
  if (
    snapshot.contractVersion !== "0.1.0"
    || !Array.isArray(snapshot.events)
  ) {
    throw new Error("PERSONAL_AGENT_FOLLOW_UP_STATE_INVALID");
  }

  const eventIds = new Set<string>();
  for (const event of snapshot.events) {
    if (
      event.contractVersion !== "0.1.0"
      || !event.eventId?.trim()
      || eventIds.has(event.eventId)
    ) {
      throw new Error("PERSONAL_AGENT_FOLLOW_UP_EVENT_INVALID");
    }
    eventIds.add(event.eventId);
    if (
      !event.followUpId?.trim()
      || !event.principalSubjectId?.trim()
      || !event.context?.contextId?.trim()
    ) {
      throw new Error("PERSONAL_AGENT_FOLLOW_UP_TARGET_INVALID");
    }
    if (!["OPEN", "COMPLETED", "DISMISSED"].includes(event.state)) {
      throw new Error("PERSONAL_AGENT_FOLLOW_UP_STATE_INVALID");
    }
    if (
      ![
        "REVIEW_PREFERRED_MEMORY",
        "CLARIFY_MEMORY_CONTEXT",
        "REVIEW_MEMORY_RESOLUTION"
      ].includes(event.kind)
    ) {
      throw new Error("PERSONAL_AGENT_FOLLOW_UP_KIND_INVALID");
    }
    if (
      event.sourceType !== "MEMORY_CONTRADICTION"
      || !event.sourceId?.trim()
      || !event.title?.trim()
      || !event.instruction?.trim()
      || !Array.isArray(event.relatedMemoryIds)
      || event.relatedMemoryIds.some(value => !value?.trim())
    ) {
      throw new Error("PERSONAL_AGENT_FOLLOW_UP_CONTENT_INVALID");
    }
    if (
      !Number.isFinite(Date.parse(event.occurredAt))
      || !event.actorSubjectId?.trim()
    ) {
      throw new Error("PERSONAL_AGENT_FOLLOW_UP_ATTRIBUTION_INVALID");
    }
  }
  return structuredClone(snapshot);
}

function latestMap(
  events: readonly PersonalAgentFollowUpEventV010[]
): Map<string, PersonalAgentFollowUpEventV010> {
  const map = new Map<string, PersonalAgentFollowUpEventV010>();
  for (const event of [...events].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt)
    || a.eventId.localeCompare(b.eventId)
  )) {
    map.set(event.followUpId, event);
  }
  return map;
}

function materialize(
  event: PersonalAgentFollowUpEventV010
): PersonalAgentFollowUpV010 {
  const { eventId, ...rest } = event;
  return {
    ...structuredClone(rest),
    effectiveEventId: eventId
  };
}

export function createMemoryPersonalAgentFollowUpStoreV010(
  seed: PersonalAgentFollowUpSnapshotV010 = {
    contractVersion: "0.1.0",
    events: []
  }
): PersonalAgentFollowUpStoreV010 {
  let current = validate(seed);
  return {
    snapshot() {
      return structuredClone(current);
    },
    append(event) {
      if (current.events.some(value => value.eventId === event.eventId)) {
        throw new Error("PERSONAL_AGENT_FOLLOW_UP_EVENT_DUPLICATE");
      }
      const previous = latestMap(current.events).get(event.followUpId);
      if (previous) {
        if (
          previous.principalSubjectId !== event.principalSubjectId
          || !sameContext(previous.context, event.context)
          || previous.sourceType !== event.sourceType
          || previous.sourceId !== event.sourceId
          || previous.kind !== event.kind
          || previous.title !== event.title
          || previous.instruction !== event.instruction
          || JSON.stringify(previous.relatedMemoryIds)
            !== JSON.stringify(event.relatedMemoryIds)
        ) {
          throw new Error("PERSONAL_AGENT_FOLLOW_UP_ID_IMMUTABLE");
        }
        if (previous.state !== "OPEN") {
          throw new Error("PERSONAL_AGENT_FOLLOW_UP_TERMINAL_IMMUTABLE");
        }
        if (event.state === "OPEN") {
          throw new Error("PERSONAL_AGENT_FOLLOW_UP_OPEN_DUPLICATE");
        }
      } else if (event.state !== "OPEN") {
        throw new Error("PERSONAL_AGENT_FOLLOW_UP_OPEN_REQUIRED");
      }

      current = validate({
        contractVersion: "0.1.0",
        events: [...current.events, structuredClone(event)]
      });
    },
    get(followUpId) {
      const value = latestMap(current.events).get(followUpId);
      return value ? materialize(value) : undefined;
    },
    listForPrincipal(principalSubjectId, context) {
      return [...latestMap(current.events).values()]
        .filter(event =>
          event.principalSubjectId === principalSubjectId
          && (!context || sameContext(event.context, context))
        )
        .map(materialize)
        .sort((a, b) =>
          b.occurredAt.localeCompare(a.occurredAt)
          || a.followUpId.localeCompare(b.followUpId)
        );
    },
    listOpen(principalSubjectId, context) {
      return [...latestMap(current.events).values()]
        .filter(event =>
          event.state === "OPEN"
          && event.principalSubjectId === principalSubjectId
          && sameContext(event.context, context)
        )
        .map(materialize)
        .sort((a, b) =>
          b.occurredAt.localeCompare(a.occurredAt)
          || a.followUpId.localeCompare(b.followUpId)
        );
    },
    findBySource(principalSubjectId, sourceType, sourceId) {
      const value = [...latestMap(current.events).values()]
        .find(event =>
          event.principalSubjectId === principalSubjectId
          && event.sourceType === sourceType
          && event.sourceId === sourceId
        );
      return value ? materialize(value) : undefined;
    }
  };
}

function readFileState(path: string): PersonalAgentFollowUpSnapshotV010 {
  if (!existsSync(path)) {
    return {
      contractVersion: "0.1.0",
      events: []
    };
  }
  return validate(
    JSON.parse(readFileSync(path, "utf8")) as PersonalAgentFollowUpSnapshotV010
  );
}

function writeFileState(
  path: string,
  snapshot: PersonalAgentFollowUpSnapshotV010
): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  writeFileSync(tmp, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  renameSync(tmp, path);
}

export function createFilePersonalAgentFollowUpStoreV010(
  path: string
): PersonalAgentFollowUpStoreV010 {
  return {
    snapshot() {
      return readFileState(path);
    },
    append(event) {
      const memory = createMemoryPersonalAgentFollowUpStoreV010(
        readFileState(path)
      );
      memory.append(event);
      writeFileState(path, memory.snapshot());
    },
    get(id) {
      return createMemoryPersonalAgentFollowUpStoreV010(
        readFileState(path)
      ).get(id);
    },
    listForPrincipal(subjectId, context) {
      return createMemoryPersonalAgentFollowUpStoreV010(
        readFileState(path)
      ).listForPrincipal(subjectId, context);
    },
    listOpen(subjectId, context) {
      return createMemoryPersonalAgentFollowUpStoreV010(
        readFileState(path)
      ).listOpen(subjectId, context);
    },
    findBySource(subjectId, sourceType, sourceId) {
      return createMemoryPersonalAgentFollowUpStoreV010(
        readFileState(path)
      ).findBySource(subjectId, sourceType, sourceId);
    }
  };
}
