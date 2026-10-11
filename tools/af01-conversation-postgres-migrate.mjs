import { dirname, join } from "node:path";
import {
  createJsonlConversationThreadEventStoreV010
} from "../dist/manager/conversation-thread-store.js";
import {
  createPostgresConversationAuthorityV010
} from "../dist/manager/conversation-postgres-store.js";

function required(value, code) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(code);
  }
  return value.trim();
}

const databaseUrl = required(
  process.env.APP_PLATFORM_CONVERSATION_DATABASE_URL,
  "CONVERSATION_POSTGRES_DATABASE_URL_REQUIRED"
);
const stateFile = process.env.APP_PLATFORM_STATE_FILE?.trim();
const sourceFile =
  process.env.APP_PLATFORM_CONVERSATION_THREAD_FILE?.trim()
  || (stateFile ? join(dirname(stateFile), "conversation-threads.jsonl") : undefined);
if (!sourceFile) {
  throw new Error("CONVERSATION_JSONL_SOURCE_FILE_REQUIRED");
}
const schema =
  process.env.APP_PLATFORM_CONVERSATION_POSTGRES_SCHEMA?.trim()
  || "app_platform_conversation";

const source = createJsonlConversationThreadEventStoreV010(sourceFile);
const events = source.listEvents();
const authority = await createPostgresConversationAuthorityV010({
  connectionString: databaseUrl,
  schema
});

try {
  const before = await authority.integrity();
  const migrated = await authority.importEvents(events);
  const after = await authority.integrity();

  if (after.eventCount < migrated.sourceEventCount) {
    throw new Error("CONVERSATION_POSTGRES_EVENT_COUNT_INCOMPLETE");
  }
  if (after.threadCount < migrated.sourceThreadCount) {
    throw new Error("CONVERSATION_POSTGRES_THREAD_COUNT_INCOMPLETE");
  }
  if (after.messageCount < migrated.sourceMessageCount) {
    throw new Error("CONVERSATION_POSTGRES_MESSAGE_COUNT_INCOMPLETE");
  }

  console.log(
    "AF01_CONVERSATION_POSTGRES_MIGRATION_PASS",
    JSON.stringify({
      sourceFile,
      schema,
      before,
      after,
      sourceEventCount: migrated.sourceEventCount,
      sourceThreadCount: migrated.sourceThreadCount,
      sourceMessageCount: migrated.sourceMessageCount,
      sourceDigest: migrated.sourceDigest,
      imported: migrated.imported
    })
  );
} finally {
  await authority.close();
}
