import postgres from "postgres";

import type {
  ConversationCheckpointV010,
  ConversationContextArtifactStoreV010,
  ConversationSourceRevocationPortV010,
  ConversationSummaryArtifactV010
} from "../contracts/conversation-context.js";

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

function parseSummary(row: Record<string, unknown>): ConversationSummaryArtifactV010 {
  return {
    contractVersion: "0.1.0",
    summaryId: String(row.summary_id),
    threadId: String(row.thread_id),
    artifactVersion: Number(row.artifact_version),
    sourceMessageIds: Array.isArray(row.source_message_ids)
      ? row.source_message_ids.map(String)
      : JSON.parse(String(row.source_message_ids)),
    sourceFirstMessageId: String(row.source_first_message_id),
    sourceLastMessageId: String(row.source_last_message_id),
    sourceMessageCount: Number(row.source_message_count),
    sourceCharacterCount: Number(row.source_character_count),
    content: String(row.content),
    activeGoals: Array.isArray(row.active_goals)
      ? row.active_goals.map(String)
      : JSON.parse(String(row.active_goals)),
    decisions: Array.isArray(row.decisions)
      ? row.decisions.map(String)
      : JSON.parse(String(row.decisions)),
    unresolvedQuestions: Array.isArray(row.unresolved_questions)
      ? row.unresolved_questions.map(String)
      : JSON.parse(String(row.unresolved_questions)),
    relevantToolOutcomes: Array.isArray(row.relevant_tool_outcomes)
      ? row.relevant_tool_outcomes.map(String)
      : JSON.parse(String(row.relevant_tool_outcomes)),
    provenance: typeof row.provenance === "string"
      ? JSON.parse(row.provenance)
      : structuredClone(row.provenance as ConversationSummaryArtifactV010["provenance"])
  };
}

export async function createPostgresConversationContextArtifactStoreV010(input: {
  connectionString: string;
  schema?: string;
}): Promise<ConversationContextArtifactStoreV010 & ConversationSourceRevocationPortV010 & { close(): Promise<void> }> {
  const connectionString = required(
    input.connectionString,
    "CONVERSATION_POSTGRES_DATABASE_URL_REQUIRED"
  );
  const schema = safeSchema(input.schema);
  const sql = postgres(connectionString, {
    max: 4,
    idle_timeout: 30,
    connect_timeout: 10
  });

  await sql.begin(async tx => {
    await tx.unsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await tx.unsafe(`
      CREATE TABLE IF NOT EXISTS "${schema}".context_summaries (
        summary_id text PRIMARY KEY,
        thread_id text NOT NULL REFERENCES "${schema}".threads(thread_id) ON DELETE RESTRICT,
        artifact_version integer NOT NULL,
        policy_id text NOT NULL,
        policy_version text NOT NULL,
        source_message_ids jsonb NOT NULL,
        source_first_message_id text NOT NULL,
        source_last_message_id text NOT NULL,
        source_message_count integer NOT NULL,
        source_character_count integer NOT NULL,
        content text NOT NULL,
        active_goals jsonb NOT NULL,
        decisions jsonb NOT NULL,
        unresolved_questions jsonb NOT NULL,
        relevant_tool_outcomes jsonb NOT NULL,
        provenance jsonb NOT NULL,
        generated_at timestamptz NOT NULL
      )
    `);
    await tx.unsafe(`
      ALTER TABLE "${schema}".context_summaries
      DROP CONSTRAINT IF EXISTS context_summaries_thread_id_artifact_version_key
    `);
    await tx.unsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS context_summaries_thread_policy_artifact_version_uidx
      ON "${schema}".context_summaries(
        thread_id, policy_id, policy_version, artifact_version
      )
    `);
    await tx.unsafe(`
      CREATE INDEX IF NOT EXISTS context_summaries_thread_policy_idx
      ON "${schema}".context_summaries(
        thread_id, policy_id, policy_version, artifact_version DESC
      )
    `);
    await tx.unsafe(`
      CREATE TABLE IF NOT EXISTS "${schema}".context_checkpoints (
        checkpoint_id text PRIMARY KEY,
        thread_id text NOT NULL REFERENCES "${schema}".threads(thread_id) ON DELETE RESTRICT,
        summary_id text NOT NULL REFERENCES "${schema}".context_summaries(summary_id) ON DELETE RESTRICT,
        through_message_id text NOT NULL,
        created_at timestamptz NOT NULL
      )
    `);
    await tx.unsafe(`
      CREATE TABLE IF NOT EXISTS "${schema}".context_source_revocations (
        thread_id text NOT NULL REFERENCES "${schema}".threads(thread_id) ON DELETE RESTRICT,
        source_message_id text NOT NULL,
        PRIMARY KEY(thread_id, source_message_id)
      )
    `);
    await tx`
      INSERT INTO ${tx(schema)}.schema_migrations(version)
      VALUES ('0004_pa04_context_source_revocations')
      ON CONFLICT (version) DO NOTHING
    `;
    await tx`
      INSERT INTO ${tx(schema)}.schema_migrations(version)
      VALUES ('0002_long_context_v01')
      ON CONFLICT (version) DO NOTHING
    `;
    await tx`
      INSERT INTO ${tx(schema)}.schema_migrations(version)
      VALUES ('0003_long_context_policy_scoped_versions')
      ON CONFLICT (version) DO NOTHING
    `;
  });

  return {
    async latestSummary(request) {
      const rows = await sql<Record<string, unknown>[]> `
        SELECT s.*
        FROM ${sql(schema)}.context_summaries AS s
        WHERE s.thread_id = ${request.threadId}
          AND s.policy_id = ${request.policyId}
          AND s.policy_version = ${request.policyVersion}
          AND NOT EXISTS (
            SELECT 1 FROM ${sql(schema)}.context_source_revocations AS revoked
            WHERE revoked.thread_id = s.thread_id
              AND EXISTS (
                SELECT 1 FROM jsonb_array_elements_text(
                  CASE
                    WHEN jsonb_typeof(s.source_message_ids) = 'array'
                      THEN s.source_message_ids
                    WHEN jsonb_typeof(s.source_message_ids) = 'string'
                      THEN (s.source_message_ids #>> '{}')::jsonb
                    ELSE '[]'::jsonb
                  END
                ) AS source(source_id)
                WHERE source.source_id = revoked.source_message_id
              )
          )
        ORDER BY s.artifact_version DESC
        LIMIT 1
      `;
      return rows.length > 0 ? parseSummary(rows[0]) : undefined;
    },

    async saveSummary(summary) {
      // The lock serializes all writes/revocations for this exact thread.
      // A compressor that started before a source was revoked cannot
      // resurrect that source in durable derived content after deletion.
      return await sql.begin(async tx => {
        await tx`SELECT pg_advisory_xact_lock(hashtext(${schema}), hashtext(${summary.threadId}))`;
        const revoked = await tx`
          SELECT 1
          FROM ${tx(schema)}.context_source_revocations
          WHERE thread_id = ${summary.threadId}
            AND source_message_id = ANY(${summary.sourceMessageIds}::text[])
          LIMIT 1
        `;
        if (revoked.length > 0) throw Error("CONVERSATION_DERIVED_SOURCE_REVOKED");
        await tx`
          INSERT INTO ${tx(schema)}.context_summaries(
            summary_id, thread_id, artifact_version,
            policy_id, policy_version,
            source_message_ids, source_first_message_id, source_last_message_id,
            source_message_count, source_character_count,
            content, active_goals, decisions, unresolved_questions,
            relevant_tool_outcomes, provenance, generated_at
          ) VALUES (
            ${summary.summaryId},
            ${summary.threadId},
            ${summary.artifactVersion},
            ${summary.provenance.policyId},
            ${summary.provenance.policyVersion},
            ${JSON.stringify(summary.sourceMessageIds)}::jsonb,
            ${summary.sourceFirstMessageId},
            ${summary.sourceLastMessageId},
            ${summary.sourceMessageCount},
            ${summary.sourceCharacterCount},
            ${summary.content},
            ${JSON.stringify(summary.activeGoals)}::jsonb,
            ${JSON.stringify(summary.decisions)}::jsonb,
            ${JSON.stringify(summary.unresolvedQuestions)}::jsonb,
            ${JSON.stringify(summary.relevantToolOutcomes)}::jsonb,
            ${JSON.stringify(summary.provenance)}::jsonb,
            ${summary.provenance.generatedAt}
          )
          ON CONFLICT (summary_id) DO NOTHING
        `;
        const rows = await tx<Record<string, unknown>[]>`
          SELECT *
          FROM ${tx(schema)}.context_summaries
          WHERE summary_id = ${summary.summaryId} AND thread_id = ${summary.threadId}
        `;
        if (rows.length !== 1) throw Error("CONVERSATION_DERIVED_SUMMARY_SAVE_FAILED");
        return parseSummary(rows[0]);
      });
    },

    async saveCheckpoint(checkpoint: ConversationCheckpointV010) {
      return await sql.begin(async tx => {
        await tx`SELECT pg_advisory_xact_lock(hashtext(${schema}), hashtext(${checkpoint.threadId}))`;
        const usable = await tx`
          SELECT 1 FROM ${tx(schema)}.context_summaries s
          WHERE s.thread_id = ${checkpoint.threadId}
            AND s.summary_id = ${checkpoint.summaryId}
            AND NOT EXISTS (
              SELECT 1 FROM ${tx(schema)}.context_source_revocations revoked
              WHERE revoked.thread_id = s.thread_id
                AND EXISTS (
                  SELECT 1 FROM jsonb_array_elements_text(
                  CASE
                    WHEN jsonb_typeof(s.source_message_ids) = 'array'
                      THEN s.source_message_ids
                    WHEN jsonb_typeof(s.source_message_ids) = 'string'
                      THEN (s.source_message_ids #>> '{}')::jsonb
                    ELSE '[]'::jsonb
                  END
                ) AS source(source_id)
                  WHERE source.source_id = revoked.source_message_id
                )
            )
        `;
        if (usable.length === 0) throw Error("CONVERSATION_DERIVED_SOURCE_REVOKED");
        await tx`
          INSERT INTO ${tx(schema)}.context_checkpoints(
            checkpoint_id, thread_id, summary_id, through_message_id, created_at
          ) VALUES (
            ${checkpoint.checkpointId},
            ${checkpoint.threadId},
            ${checkpoint.summaryId},
            ${checkpoint.throughMessageId},
            ${checkpoint.createdAt}
          )
          ON CONFLICT (checkpoint_id) DO NOTHING
        `;
        return structuredClone(checkpoint);
      });
    },

    async revokeSourceMessages(input) {
      const threadId = required(input.threadId, "CONVERSATION_THREAD_ID_REQUIRED");
      if (!Array.isArray(input.sourceMessageIds)
        || input.sourceMessageIds.length === 0
        || input.sourceMessageIds.length > 1000
        || input.sourceMessageIds.some(id => typeof id !== "string" || !id.trim())) {
        throw Error("CONVERSATION_REVOKED_SOURCE_IDS_INVALID");
      }
      const ids = [...new Set(input.sourceMessageIds.map(id => id.trim()))];
      return await sql.begin(async tx => {
        await tx`SELECT pg_advisory_xact_lock(hashtext(${schema}), hashtext(${threadId}))`;
        const newIds = await tx`
          INSERT INTO ${tx(schema)}.context_source_revocations(thread_id, source_message_id)
          SELECT ${threadId}, source_id FROM unnest(${ids}::text[]) AS source(source_id)
          ON CONFLICT (thread_id, source_message_id) DO NOTHING
          RETURNING source_message_id
        `;
        const affected = await tx`
          SELECT summary_id FROM ${tx(schema)}.context_summaries s
          WHERE thread_id = ${threadId}
            AND EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(
                  CASE
                    WHEN jsonb_typeof(s.source_message_ids) = 'array'
                      THEN s.source_message_ids
                    WHEN jsonb_typeof(s.source_message_ids) = 'string'
                      THEN (s.source_message_ids #>> '{}')::jsonb
                    ELSE '[]'::jsonb
                  END
                ) AS source(source_id)
              WHERE source.source_id = ANY(${ids}::text[])
            )
        `;
        const affectedIds = affected.map(x => String(x.summary_id));
        if (affectedIds.length === 0) {
          return { removedSummaries: 0, removedCheckpoints: 0,
            newlyRevokedSources: newIds.length };
        }
        const removedCheckpoints = await tx`
          DELETE FROM ${tx(schema)}.context_checkpoints
          WHERE thread_id = ${threadId} AND summary_id = ANY(${affectedIds}::text[])
          RETURNING checkpoint_id
        `;
        const removedSummaries = await tx`
          DELETE FROM ${tx(schema)}.context_summaries
          WHERE thread_id = ${threadId} AND summary_id = ANY(${affectedIds}::text[])
          RETURNING summary_id
        `;
        return {
          removedSummaries: removedSummaries.length,
          removedCheckpoints: removedCheckpoints.length,
          newlyRevokedSources: newIds.length
        };
      });
    },

    async close() {
      await sql.end({ timeout: 5 });
    }
  };
}
