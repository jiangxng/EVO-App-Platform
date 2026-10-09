import postgres from "postgres";

import type {
  PersonalWorkbenchStateStoreV010,
  PersonalWorkbenchStateV010
} from "./state.js";

const DEFAULT_SCHEMA = "evo_bi_workbench";
const LEGACY_SCHEMA = "app_platform_workbench";

function required(value: string, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

function safeSchema(value: string | undefined, fallback: string): string {
  const schema = value?.trim() || fallback;
  if (!/^[a-z][a-z0-9_]{0,62}$/u.test(schema)) {
    throw new Error("WORKBENCH_POSTGRES_SCHEMA_INVALID");
  }
  return schema;
}

function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return structuredClone(value) as T[];
  if (typeof value === "string") return JSON.parse(value) as T[];
  return [];
}

function rowToState(row: Record<string, unknown>): PersonalWorkbenchStateV010 {
  return {
    contractVersion: "0.1.0",
    personalContextId: String(row.personal_context_id),
    subjectId: String(row.subject_id),
    preferences: parseJsonArray(row.preferences),
    favoriteItemIds: parseJsonArray<string>(row.favorite_item_ids),
    recentItemIds: parseJsonArray<string>(row.recent_item_ids),
    updatedAt: new Date(String(row.updated_at)).toISOString()
  };
}

function initial(
  personalContextId: string,
  subjectId: string,
  updatedAt: string
): PersonalWorkbenchStateV010 {
  return {
    contractVersion: "0.1.0",
    personalContextId: required(
      personalContextId,
      "WORKBENCH_PERSONAL_CONTEXT_ID_REQUIRED"
    ),
    subjectId: required(subjectId, "WORKBENCH_SUBJECT_ID_REQUIRED"),
    preferences: [],
    favoriteItemIds: [],
    recentItemIds: [],
    updatedAt: required(updatedAt, "WORKBENCH_UPDATED_AT_REQUIRED")
  };
}

export async function createPostgresPersonalWorkbenchStateStoreV010(input: {
  connectionString: string;
  schema?: string;
  legacySchema?: string;
}): Promise<PersonalWorkbenchStateStoreV010 & { close(): Promise<void> }> {
  const connectionString = required(
    input.connectionString,
    "WORKBENCH_POSTGRES_DATABASE_URL_REQUIRED"
  );
  const schema = safeSchema(input.schema, DEFAULT_SCHEMA);
  const legacySchema = safeSchema(input.legacySchema, LEGACY_SCHEMA);
  const sql = postgres(connectionString, {
    max: 4,
    idle_timeout: 30,
    connect_timeout: 10
  });

  await sql.begin(async tx => {
    await tx.unsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await tx.unsafe(`
      CREATE TABLE IF NOT EXISTS "${schema}".personal_state (
        personal_context_id text NOT NULL,
        subject_id text NOT NULL,
        preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
        favorite_item_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        recent_item_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
        updated_at timestamptz NOT NULL,
        PRIMARY KEY(personal_context_id, subject_id)
      )
    `);

    if (legacySchema !== schema) {
      const legacy = await tx<{ relation: string | null }[]> `
        SELECT to_regclass(${legacySchema + ".personal_state"})::text AS relation
      `;
      if (legacy[0]?.relation) {
        await tx.unsafe(`
          INSERT INTO "${schema}".personal_state(
            personal_context_id,
            subject_id,
            preferences,
            favorite_item_ids,
            recent_item_ids,
            updated_at
          )
          SELECT
            personal_context_id,
            subject_id,
            preferences,
            favorite_item_ids,
            recent_item_ids,
            updated_at
          FROM "${legacySchema}".personal_state
          ON CONFLICT(personal_context_id, subject_id) DO NOTHING
        `);
      }
    }
  });

  const save = async (
    state: PersonalWorkbenchStateV010
  ): Promise<PersonalWorkbenchStateV010> => {
    await sql`
      INSERT INTO ${sql(schema)}.personal_state(
        personal_context_id,
        subject_id,
        preferences,
        favorite_item_ids,
        recent_item_ids,
        updated_at
      ) VALUES (
        ${state.personalContextId},
        ${state.subjectId},
        ${JSON.stringify(state.preferences)}::jsonb,
        ${JSON.stringify(state.favoriteItemIds)}::jsonb,
        ${JSON.stringify(state.recentItemIds)}::jsonb,
        ${state.updatedAt}
      )
      ON CONFLICT(personal_context_id, subject_id)
      DO UPDATE SET
        preferences = EXCLUDED.preferences,
        favorite_item_ids = EXCLUDED.favorite_item_ids,
        recent_item_ids = EXCLUDED.recent_item_ids,
        updated_at = EXCLUDED.updated_at
    `;
    return structuredClone(state);
  };

  const getState = async (
    personalContextId: string,
    subjectId: string
  ): Promise<PersonalWorkbenchStateV010 | undefined> => {
    const rows = await sql<Record<string, unknown>[]> `
      SELECT *
      FROM ${sql(schema)}.personal_state
      WHERE personal_context_id = ${required(
        personalContextId,
        "WORKBENCH_PERSONAL_CONTEXT_ID_REQUIRED"
      )}
        AND subject_id = ${required(
          subjectId,
          "WORKBENCH_SUBJECT_ID_REQUIRED"
        )}
      LIMIT 1
    `;
    return rows[0] ? rowToState(rows[0]) : undefined;
  };

  return {
    get: getState,

    async put(state) {
      return save({
        ...structuredClone(state),
        personalContextId: required(
          state.personalContextId,
          "WORKBENCH_PERSONAL_CONTEXT_ID_REQUIRED"
        ),
        subjectId: required(state.subjectId, "WORKBENCH_SUBJECT_ID_REQUIRED"),
        updatedAt: required(state.updatedAt, "WORKBENCH_UPDATED_AT_REQUIRED"),
        preferences: structuredClone(state.preferences ?? []),
        favoriteItemIds: [...new Set(state.favoriteItemIds ?? [])],
        recentItemIds: [...new Set(state.recentItemIds ?? [])]
      });
    },

    async recordRecent(request) {
      const limit = request.limit ?? 8;
      if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
        throw new Error("WORKBENCH_RECENT_LIMIT_INVALID");
      }
      const current =
        await getState(request.personalContextId, request.subjectId)
        ?? initial(
          request.personalContextId,
          request.subjectId,
          request.updatedAt
        );
      const itemId = required(request.itemId, "WORKBENCH_ITEM_ID_REQUIRED");
      return save({
        ...current,
        recentItemIds: [
          itemId,
          ...current.recentItemIds.filter(id => id !== itemId)
        ].slice(0, limit),
        updatedAt: request.updatedAt
      });
    },

    async setFavorite(request) {
      const current =
        await getState(request.personalContextId, request.subjectId)
        ?? initial(
          request.personalContextId,
          request.subjectId,
          request.updatedAt
        );
      const itemId = required(request.itemId, "WORKBENCH_ITEM_ID_REQUIRED");
      const favoriteItemIds = request.favorite
        ? [...new Set([...current.favoriteItemIds, itemId])]
        : current.favoriteItemIds.filter(id => id !== itemId);
      return save({
        ...current,
        favoriteItemIds,
        updatedAt: request.updatedAt
      });
    },

    async close() {
      await sql.end({ timeout: 5 });
    }
  };
}
