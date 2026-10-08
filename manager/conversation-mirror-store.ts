import type {
  ConversationThreadStoreV010,
  ConversationThreadV010
} from "../contracts/conversation-thread.js";
import type {
  PostgresConversationAuthorityV010
} from "./conversation-postgres-store.js";

export function createMirroredConversationThreadStoreV010(input: {
  primary: ConversationThreadStoreV010;
  postgres: PostgresConversationAuthorityV010;
  onMirrorError?: (error: unknown, threadId: string) => void;
}): ConversationThreadStoreV010 {
  async function mirror(threadId: string): Promise<void> {
    try {
      const events = await input.primary.events(threadId);
      await input.postgres.importEvents(events);
    } catch (error) {
      input.onMirrorError?.(error, threadId);
    }
  }

  return {
    async create(request): Promise<ConversationThreadV010> {
      const thread = await input.primary.create(request);
      await mirror(thread.threadId);
      return thread;
    },

    async archive(request): Promise<ConversationThreadV010> {
      const thread = await input.primary.archive(request);
      await mirror(thread.threadId);
      return thread;
    },

    async appendMessage(request): Promise<ConversationThreadV010> {
      const thread = await input.primary.appendMessage(request);
      await mirror(thread.threadId);
      return thread;
    },

    get(threadId) {
      return input.primary.get(threadId);
    },

    list(request) {
      return input.primary.list(request);
    },

    events(threadId) {
      return input.primary.events(threadId);
    },

    conversationHistory(request) {
      return input.primary.conversationHistory(request);
    }
  };
}
