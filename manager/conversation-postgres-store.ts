import { createHash, randomUUID } from "node:crypto";
import postgres from "postgres";
import type {
  ConversationMessageRoleV010,
  ConversationThreadEventV010,
  ConversationThreadStoreV010,
  ConversationThreadV010
} from "../contracts/conversation-thread.js";
import type { ActiveContextRefV010 } from "../contracts/platform-services.js";

const DEFAULT_SCHEMA = "app_platform_conversation";

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function safeSchema(value: string | undefined): string {
  const schema = value?.trim() || DEFAULT_SCHEMA;
  if (!/^[a-z][a-z0-9_]{0,62}$/u.test(schema)) {
    throw new Error("CONVERSATION_POSTGRES_SCHEMA_INVALID");
  }
  return schema;
}

function quoteIdentifier(value: string): string {
  return '"' + value.replaceAll('"', '""') + '"';
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const text = String(value);
  const parsed = new Date(text);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error("CONVERSATION_POSTGRES_TIMESTAMP_INVALID");
  }
  return parsed.toISOString();
}

function contextColumns(context: ActiveContextRefV010): {
  kind: string;
  contextId: string;
  enterpriseId: string | null;
} {
  if (
    !context
    || (context.kind !== "PERSONAL" && context.kind !== "ENTERPRISE")
    || !context.contextId?.trim()
  ) {
    throw new Error("CONVERSATION_THREAD_CONTEXT_INVALID");
  }
  if (context.kind === "ENTERPRISE") {
    if (!context.enterpriseId?.trim()) {
      throw new Error("CONVERSATION_THREAD_CONTEXT_INVALID");
    }
    return {
      kind: context.kind,
      contextId: context.contextId.trim(),
      enterpriseId: context.enterpriseId.trim()
    };
  }
  return {
    kind: context.kind,
    contextId: context.contextId.trim(),
    enterpriseId: null
  };
}

function contextFromRow(row: Record<string, unknown>): ActiveContextRefV010 {
  if (row.context_kind === "ENTERPRISE") {
    return {
      contractVersion: "0.1.0",
      kind: "ENTERPRISE",
      contextId: String(row.context_id),
      enterpriseId: String(row.enterprise_id)
    };
  }
  return {
    contractVersion: "0.1.0",
    kind: "PERSONAL",
    contextId: String(row.context_id)
  };
}

function jsonObject(value: unknown): Record<string, unknown> | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object" && !Array.isArray(value)) {
    return structuredClone(value as Record<string, unknown>);
  }
  if (typeof value === "string") {
    const parsed = JSON.parse(value) as unknown;
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }
  throw new Error("CONVERSATION_POSTGRES_JSON_INVALID");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stableValue(item)])
    );
  }
  return value;
}

function eventDigest(events: readonly ConversationThreadEventV010[]): string {
  const normalized = [...events]
    .sort((a, b) => a.eventId.localeCompare(b.eventId))
    .map(event => stableValue(event));
  return createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");
}

function eventFromRow(row: Record<string, unknown>): ConversationThreadEventV010 {
  const type = String(row.event_type);
  const event = {
    contractVersion: "0.1.0",
    eventId: String(row.event_id),
    threadId: String(row.thread_id),
    type,
    occurredAt: iso(row.occurred_at),
    payload: jsonObject(row.payload) ?? {}
  };
  if (
    type !== "THREAD_CREATED"
    && type !== "THREAD_ARCHIVED"
    && type !== "MESSAGE_APPENDED"
  ) {
    throw new Error("CONVERSATION_POSTGRES_EVENT_TYPE_INVALID");
  }
  return event as ConversationThreadEventV010;
}

export interface ConversationPostgresIntegrityV010 {
  schema: string;
  threadCount: number;
  messageCount: number;
  eventCount: number;
  eventDigest: string;
}

export interface ConversationPostgresImportResultV010 {
  sourceEventCount: number;
  sourceThreadCount: number;
  sourceMessageCount: number;
  sourceDigest: string;
  target: ConversationPostgresIntegrityV010;
  imported: boolean;
}

export interface PostgresConversationAuthorityV010 {
  store: ConversationThreadStoreV010;
  importEvents(
    events: readonly ConversationThreadEventV010[]
  ): Promise<ConversationPostgresImportResultV010>;
  integrity(): Promise<ConversationPostgresIntegrityV010>;
  close(): Promise<void>;
}

export async function createPostgresConversationAuthorityV010(input: {
  connectionString: string;
  schema?: string;
  maxConnections?: number;
}): Promise<PostgresConversationAuthorityV010> {
  const connectionString = required(
    input.connectionString,
    "CONVERSATION_POSTGRES_DATABASE_URL_REQUIRED"
  );
  const schema = safeSchema(input.schema);
  const qSchema = quoteIdentifier(schema);
  const sql = postgres(connectionString, {
    max: Math.max(1, Math.min(10, input.maxConnections ?? 5)),
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false
  });

  await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS ${qSchema}`);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${qSchema}.schema_migrations (
      version text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const migration = await sql<{ version: string }[]> `
    SELECT version
    FROM ${sql(schema)}.schema_migrations
    WHERE version = '0001_conversation_authority'
  `;
  if (migration.length === 0) {
    await sql.begin(async tx => {
      await tx.unsafe(`
        CREATE TABLE IF NOT EXISTS ${qSchema}.threads (
          thread_id text PRIMARY KEY,
          contract_version text NOT NULL,
          state text NOT NULL CHECK (state IN ('ACTIVE','ARCHIVED')),
          principal_subject_id text NOT NULL,
          principal_actor_type text NOT NULL,
          context_kind text NOT NULL CHECK (context_kind IN ('PERSONAL','ENTERPRISE')),
          context_id text NOT NULL,
          enterprise_id text,
          source_interaction_id text,
          title text,
          created_at timestamptz NOT NULL,
          updated_at timestamptz NOT NULL,
          archived_at timestamptz,
          archived_by_subject_id text,
          last_event_id text NOT NULL
        )
      `);
      await tx.unsafe(`
        CREATE INDEX IF NOT EXISTS threads_scope_updated_idx
        ON ${qSchema}.threads(
          principal_subject_id,
          principal_actor_type,
          context_kind,
          context_id,
          enterprise_id,
          updated_at DESC,
          thread_id DESC
        )
      `);
      await tx.unsafe(`
        CREATE TABLE IF NOT EXISTS ${qSchema}.messages (
          message_id text PRIMARY KEY,
          thread_id text NOT NULL REFERENCES ${qSchema}.threads(thread_id) ON DELETE RESTRICT,
          contract_version text NOT NULL,
          role text NOT NULL CHECK (role IN ('USER','ASSISTANT','SYSTEM')),
          content text NOT NULL,
          created_at timestamptz NOT NULL,
          run_id text,
          reply_to_message_id text REFERENCES ${qSchema}.messages(message_id) ON DELETE RESTRICT,
          presentation jsonb,
          event_id text NOT NULL UNIQUE
        )
      `);
      await tx.unsafe(`
        CREATE INDEX IF NOT EXISTS messages_thread_created_idx
        ON ${qSchema}.messages(thread_id, created_at, event_id)
      `);
      await tx.unsafe(`
        CREATE INDEX IF NOT EXISTS messages_run_idx
        ON ${qSchema}.messages(run_id)
        WHERE run_id IS NOT NULL
      `);
      await tx.unsafe(`
        CREATE TABLE IF NOT EXISTS ${qSchema}.events (
          event_id text PRIMARY KEY,
          thread_id text NOT NULL REFERENCES ${qSchema}.threads(thread_id) ON DELETE RESTRICT,
          event_type text NOT NULL CHECK (
            event_type IN ('THREAD_CREATED','THREAD_ARCHIVED','MESSAGE_APPENDED')
          ),
          occurred_at timestamptz NOT NULL,
          payload jsonb NOT NULL
        )
      `);
      await tx.unsafe(`
        CREATE INDEX IF NOT EXISTS events_thread_order_idx
        ON ${qSchema}.events(thread_id, occurred_at, event_id)
      `);
      await tx`
        INSERT INTO ${tx(schema)}.schema_migrations(version)
        VALUES ('0001_conversation_authority')
        ON CONFLICT (version) DO NOTHING
      `;
    });
  }

  async function readThread(
    threadId: string
  ): Promise<ConversationThreadV010 | undefined> {
    const rows = await sql<Record<string, unknown>[]> `
      SELECT *
      FROM ${sql(schema)}.threads
      WHERE thread_id = ${threadId}
    `;
    if (rows.length === 0) return undefined;
    const row = rows[0];
    const messageRows = await sql<Record<string, unknown>[]> `
      SELECT *
      FROM ${sql(schema)}.messages
      WHERE thread_id = ${threadId}
      ORDER BY created_at ASC, event_id ASC
    `;
    const messages = messageRows.map(message => ({
      contractVersion: "0.1.0" as const,
      messageId: String(message.message_id),
      threadId: String(message.thread_id),
      role: String(message.role) as ConversationMessageRoleV010,
      content: String(message.content),
      createdAt: iso(message.created_at),
      ...(message.run_id ? { runId: String(message.run_id) } : {}),
      ...(message.reply_to_message_id
        ? { replyToMessageId: String(message.reply_to_message_id) }
        : {}),
      ...(message.presentation
        ? { presentation: jsonObject(message.presentation)! }
        : {}),
      eventId: String(message.event_id)
    }));
    return {
      contractVersion: "0.1.0",
      threadId: String(row.thread_id),
      state: String(row.state) as "ACTIVE" | "ARCHIVED",
      principalSubjectId: String(row.principal_subject_id),
      principalActorType: String(row.principal_actor_type) as ConversationThreadV010["principalActorType"],
      context: contextFromRow(row),
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at),
      ...(row.source_interaction_id
        ? { sourceInteractionId: String(row.source_interaction_id) }
        : {}),
      ...(row.title ? { title: String(row.title) } : {}),
      ...(row.archived_at ? { archivedAt: iso(row.archived_at) } : {}),
      ...(row.archived_by_subject_id
        ? { archivedBySubjectId: String(row.archived_by_subject_id) }
        : {}),
      messages,
      lastEventId: String(row.last_event_id)
    };
  }

  const eventId = () => randomUUID();

  const store: ConversationThreadStoreV010 = {
    async create(request) {
      const context = contextColumns(request.context);
      const id = required(request.threadId, "CONVERSATION_THREAD_ID_REQUIRED");
      const principalSubjectId = required(
        request.principalSubjectId,
        "CONVERSATION_THREAD_PRINCIPAL_REQUIRED"
      );
      const createdAt = iso(request.createdAt);
      const newEventId = "conversation-thread-event:" + eventId();
      const payload = {
        principalSubjectId,
        principalActorType: request.principalActorType,
        context: structuredClone(request.context),
        createdAt,
        ...(request.sourceInteractionId?.trim()
          ? { sourceInteractionId: request.sourceInteractionId.trim() }
          : {}),
        ...(request.title?.trim() ? { title: request.title.trim() } : {})
      };
      try {
        await sql.begin(async tx => {
          await tx`
            INSERT INTO ${tx(schema)}.threads(
              thread_id, contract_version, state,
              principal_subject_id, principal_actor_type,
              context_kind, context_id, enterprise_id,
              source_interaction_id, title,
              created_at, updated_at, last_event_id
            ) VALUES (
              ${id}, '0.1.0', 'ACTIVE',
              ${principalSubjectId}, ${request.principalActorType},
              ${context.kind}, ${context.contextId}, ${context.enterpriseId},
              ${request.sourceInteractionId?.trim() || null},
              ${request.title?.trim() || null},
              ${createdAt}, ${createdAt}, ${newEventId}
            )
          `;
          await tx`
            INSERT INTO ${tx(schema)}.events(
              event_id, thread_id, event_type, occurred_at, payload
            ) VALUES (
              ${newEventId}, ${id}, 'THREAD_CREATED',
              ${createdAt}, ${JSON.stringify(payload)}::jsonb
            )
          `;
        });
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === "23505") {
          throw new Error("CONVERSATION_THREAD_ALREADY_EXISTS");
        }
        throw error;
      }
      return (await readThread(id))!;
    },

    async archive(request) {
      const id = required(request.threadId, "CONVERSATION_THREAD_ID_REQUIRED");
      const archivedAt = iso(request.archivedAt);
      const archivedBySubjectId = required(
        request.archivedBySubjectId,
        "CONVERSATION_THREAD_ARCHIVED_BY_REQUIRED"
      );
      await sql.begin(async tx => {
        const rows = await tx<Record<string, unknown>[]> `
          SELECT *
          FROM ${tx(schema)}.threads
          WHERE thread_id = ${id}
          FOR UPDATE
        `;
        if (rows.length === 0) throw new Error("CONVERSATION_THREAD_NOT_FOUND");
        if (rows[0].state === "ARCHIVED") {
          return;
        }
        const newEventId = "conversation-thread-event:" + eventId();
        const payload = { archivedAt, archivedBySubjectId };
        await tx`
          INSERT INTO ${tx(schema)}.events(
            event_id, thread_id, event_type, occurred_at, payload
          ) VALUES (
            ${newEventId}, ${id}, 'THREAD_ARCHIVED',
            ${archivedAt}, ${JSON.stringify(payload)}::jsonb
          )
        `;
        await tx`
          UPDATE ${tx(schema)}.threads
          SET
            state = 'ARCHIVED',
            archived_at = ${archivedAt},
            archived_by_subject_id = ${archivedBySubjectId},
            updated_at = ${archivedAt},
            last_event_id = ${newEventId}
          WHERE thread_id = ${id}
        `;
      });
      const archived = await readThread(id);
      if (!archived) throw new Error("CONVERSATION_THREAD_NOT_FOUND");
      return archived;
    },

    async appendMessage(request) {
      const id = required(request.threadId, "CONVERSATION_THREAD_ID_REQUIRED");
      const messageId = required(
        request.messageId,
        "CONVERSATION_MESSAGE_ID_REQUIRED"
      );
      const content = required(
        request.content,
        "CONVERSATION_MESSAGE_CONTENT_REQUIRED"
      );
      const createdAt = iso(request.createdAt);
      const newEventId = "conversation-thread-event:" + eventId();
      await sql.begin(async tx => {
        const threads = await tx<Record<string, unknown>[]> `
          SELECT state
          FROM ${tx(schema)}.threads
          WHERE thread_id = ${id}
          FOR UPDATE
        `;
        if (threads.length === 0) throw new Error("CONVERSATION_THREAD_NOT_FOUND");
        if (threads[0].state === "ARCHIVED") {
          throw new Error("CONVERSATION_THREAD_ARCHIVED");
        }
        if (request.replyToMessageId) {
          const reply = await tx `
            SELECT message_id
            FROM ${tx(schema)}.messages
            WHERE thread_id = ${id}
              AND message_id = ${request.replyToMessageId}
          `;
          if (reply.length === 0) {
            throw new Error("CONVERSATION_MESSAGE_REPLY_TARGET_NOT_FOUND");
          }
        }
        const payload = {
          messageId,
          role: request.role,
          content,
          createdAt,
          ...(request.runId?.trim() ? { runId: request.runId.trim() } : {}),
          ...(request.replyToMessageId?.trim()
            ? { replyToMessageId: request.replyToMessageId.trim() }
            : {}),
          ...(request.presentation
            ? { presentation: structuredClone(request.presentation) }
            : {})
        };
        try {
          await tx`
            INSERT INTO ${tx(schema)}.messages(
              message_id, thread_id, contract_version, role, content,
              created_at, run_id, reply_to_message_id, presentation, event_id
            ) VALUES (
              ${messageId}, ${id}, '0.1.0', ${request.role}, ${content},
              ${createdAt}, ${request.runId?.trim() || null},
              ${request.replyToMessageId?.trim() || null},
              ${request.presentation ? JSON.stringify(request.presentation) : null}::jsonb,
              ${newEventId}
            )
          `;
        } catch (error) {
          if ((error as { code?: string }).code === "23505") {
            throw new Error("CONVERSATION_MESSAGE_ID_DUPLICATE");
          }
          throw error;
        }
        await tx`
          INSERT INTO ${tx(schema)}.events(
            event_id, thread_id, event_type, occurred_at, payload
          ) VALUES (
            ${newEventId}, ${id}, 'MESSAGE_APPENDED',
            ${createdAt}, ${JSON.stringify(payload)}::jsonb
          )
        `;
        await tx`
          UPDATE ${tx(schema)}.threads
          SET updated_at = ${createdAt}, last_event_id = ${newEventId}
          WHERE thread_id = ${id}
        `;
      });
      return (await readThread(id))!;
    },

    async get(threadId) {
      return readThread(
        required(threadId, "CONVERSATION_THREAD_ID_REQUIRED")
      );
    },

    async list(request) {
      const limit = request.limit ?? 20;
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("CONVERSATION_THREAD_LIMIT_INVALID");
      }
      const context = contextColumns(request.context);
      const rows = await sql<{ thread_id: string }[]> `
        SELECT thread_id
        FROM ${sql(schema)}.threads
        WHERE principal_subject_id = ${request.principalSubjectId}
          AND context_kind = ${context.kind}
          AND context_id = ${context.contextId}
          AND (
            (${context.enterpriseId}::text IS NULL AND enterprise_id IS NULL)
            OR enterprise_id = ${context.enterpriseId}
          )
          AND (${request.includeArchived === true} OR state = 'ACTIVE')
        ORDER BY updated_at DESC, thread_id DESC
        LIMIT ${limit}
      `;
      const values: ConversationThreadV010[] = [];
      for (const row of rows) {
        const thread = await readThread(row.thread_id);
        if (thread) values.push(thread);
      }
      return values;
    },

    async events(threadId) {
      const id = required(threadId, "CONVERSATION_THREAD_ID_REQUIRED");
      const rows = await sql<Record<string, unknown>[]> `
        SELECT event_id, thread_id, event_type, occurred_at, payload
        FROM ${sql(schema)}.events
        WHERE thread_id = ${id}
        ORDER BY occurred_at ASC, event_id ASC
      `;
      return rows.map(eventFromRow);
    },

    async conversationHistory(request) {
      const id = required(request.threadId, "CONVERSATION_THREAD_ID_REQUIRED");
      const maxMessages = request.maxMessages ?? 16;
      const maxTotalCharacters = request.maxTotalCharacters ?? 24_000;
      const maxCharactersPerMessage = request.maxCharactersPerMessage ?? 8_000;
      if (
        !Number.isInteger(maxMessages) || maxMessages < 1 || maxMessages > 100
        || !Number.isInteger(maxTotalCharacters) || maxTotalCharacters < 1
        || !Number.isInteger(maxCharactersPerMessage) || maxCharactersPerMessage < 1
      ) {
        throw new Error("CONVERSATION_HISTORY_LIMIT_INVALID");
      }
      const thread = await sql `
        SELECT thread_id
        FROM ${sql(schema)}.threads
        WHERE thread_id = ${id}
      `;
      if (thread.length === 0) throw new Error("CONVERSATION_THREAD_NOT_FOUND");

      const rows = await sql<Record<string, unknown>[]> `
        SELECT role, content, created_at, event_id
        FROM ${sql(schema)}.messages
        WHERE thread_id = ${id}
          AND role IN ('USER','ASSISTANT')
          AND (
            ${request.excludeMessageId ?? null}::text IS NULL
            OR message_id <> ${request.excludeMessageId ?? null}
          )
        ORDER BY created_at DESC, event_id DESC
        LIMIT ${maxMessages}
      `;
      const candidates = rows.map(row => ({
        role: row.role === "USER" ? "user" as const : "assistant" as const,
        content: String(row.content).slice(0, maxCharactersPerMessage)
      }));
      const selected = [];
      let total = 0;
      for (const item of candidates) {
        if (!item.content) continue;
        if (total + item.content.length > maxTotalCharacters) break;
        selected.push(item);
        total += item.content.length;
      }
      return selected.reverse();
    }
  };

  async function integrity(): Promise<ConversationPostgresIntegrityV010> {
    const [counts] = await sql<{
      thread_count: number;
      message_count: number;
      event_count: number;
    }[]> `
      SELECT
        (SELECT count(*)::int FROM ${sql(schema)}.threads) AS thread_count,
        (SELECT count(*)::int FROM ${sql(schema)}.messages) AS message_count,
        (SELECT count(*)::int FROM ${sql(schema)}.events) AS event_count
    `;
    const eventRows = await sql<Record<string, unknown>[]> `
      SELECT event_id, thread_id, event_type, occurred_at, payload
      FROM ${sql(schema)}.events
      ORDER BY event_id ASC
    `;
    return {
      schema,
      threadCount: Number(counts.thread_count),
      messageCount: Number(counts.message_count),
      eventCount: Number(counts.event_count),
      eventDigest: eventDigest(eventRows.map(eventFromRow))
    };
  }

  async function importEvents(
    events: readonly ConversationThreadEventV010[]
  ): Promise<ConversationPostgresImportResultV010> {
    const ordered = [...events].sort((a, b) =>
      a.occurredAt.localeCompare(b.occurredAt)
      || a.eventId.localeCompare(b.eventId)
    );
    const sourceThreadCount = ordered.filter(
      event => event.type === "THREAD_CREATED"
    ).length;
    const sourceMessageCount = ordered.filter(
      event => event.type === "MESSAGE_APPENDED"
    ).length;
    const sourceDigest = eventDigest(ordered);

    if (ordered.length === 0) {
      const target = await integrity();
      return {
        sourceEventCount: 0,
        sourceThreadCount: 0,
        sourceMessageCount: 0,
        sourceDigest,
        target,
        imported: true
      };
    }

    await sql.begin(async tx => {
      for (const event of ordered) {
        const existing = await tx<Record<string, unknown>[]> `
          SELECT event_id, thread_id, event_type, occurred_at, payload
          FROM ${tx(schema)}.events
          WHERE event_id = ${event.eventId}
        `;
        if (existing.length > 0) {
          const prior = eventFromRow(existing[0]);
          if (eventDigest([prior]) !== eventDigest([event])) {
            throw new Error("CONVERSATION_POSTGRES_MIGRATION_CONFLICT");
          }
          continue;
        }

        if (event.type === "THREAD_CREATED") {
          const context = contextColumns(event.payload.context);
          await tx`
            INSERT INTO ${tx(schema)}.threads(
              thread_id, contract_version, state,
              principal_subject_id, principal_actor_type,
              context_kind, context_id, enterprise_id,
              source_interaction_id, title,
              created_at, updated_at, last_event_id
            ) VALUES (
              ${event.threadId}, '0.1.0', 'ACTIVE',
              ${event.payload.principalSubjectId},
              ${event.payload.principalActorType},
              ${context.kind}, ${context.contextId}, ${context.enterpriseId},
              ${event.payload.sourceInteractionId ?? null},
              ${event.payload.title ?? null},
              ${event.payload.createdAt}, ${event.occurredAt}, ${event.eventId}
            )
            ON CONFLICT (thread_id) DO NOTHING
          `;
        } else if (event.type === "MESSAGE_APPENDED") {
          await tx`
            INSERT INTO ${tx(schema)}.messages(
              message_id, thread_id, contract_version, role, content,
              created_at, run_id, reply_to_message_id, presentation, event_id
            ) VALUES (
              ${event.payload.messageId}, ${event.threadId}, '0.1.0',
              ${event.payload.role}, ${event.payload.content},
              ${event.payload.createdAt}, ${event.payload.runId ?? null},
              ${event.payload.replyToMessageId ?? null},
              ${event.payload.presentation
                ? JSON.stringify(event.payload.presentation)
                : null}::jsonb,
              ${event.eventId}
            )
            ON CONFLICT (message_id) DO NOTHING
          `;
          await tx`
            UPDATE ${tx(schema)}.threads
            SET updated_at = ${event.occurredAt}, last_event_id = ${event.eventId}
            WHERE thread_id = ${event.threadId}
          `;
        } else {
          await tx`
            UPDATE ${tx(schema)}.threads
            SET
              state = 'ARCHIVED',
              archived_at = ${event.payload.archivedAt},
              archived_by_subject_id = ${event.payload.archivedBySubjectId},
              updated_at = ${event.occurredAt},
              last_event_id = ${event.eventId}
            WHERE thread_id = ${event.threadId}
          `;
        }

        await tx`
          INSERT INTO ${tx(schema)}.events(
            event_id, thread_id, event_type, occurred_at, payload
          ) VALUES (
            ${event.eventId}, ${event.threadId}, ${event.type},
            ${event.occurredAt}, ${JSON.stringify(event.payload)}::jsonb
          )
        `;
      }
    });

    const target = await integrity();
    const importedSubset = await sql<Record<string, unknown>[]> `
      SELECT event_id, thread_id, event_type, occurred_at, payload
      FROM ${sql(schema)}.events
      WHERE event_id IN ${sql(ordered.map(event => event.eventId))}
      ORDER BY event_id ASC
    `;
    const importedDigest = eventDigest(importedSubset.map(eventFromRow));
    if (
      importedSubset.length !== ordered.length
      || importedDigest !== sourceDigest
    ) {
      throw new Error("CONVERSATION_POSTGRES_MIGRATION_INTEGRITY_FAILED");
    }
    return {
      sourceEventCount: ordered.length,
      sourceThreadCount,
      sourceMessageCount,
      sourceDigest,
      target,
      imported: true
    };
  }

  return {
    store,
    importEvents,
    integrity,
    async close() {
      await sql.end({ timeout: 5 });
    }
  };
}
