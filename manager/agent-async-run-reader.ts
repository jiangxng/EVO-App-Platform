import type { PlatformPrincipalV010, ResolvedContextSetV010 } from "../contracts/platform-services.js";
import type { AgentRunV010 } from "../contracts/agent-run.js";
import type { AsyncAgentRunReceiptRepositoryV020 } from "../contracts/agent-durability-async.js";
import { createHostScopedAsyncAgentRunBridgeV020 } from "./agent-durability-host-bridge.js";

export interface HostAsyncRunReaderPortV020 {
  read(input: {
    runId: string;
    principal: PlatformPrincipalV010;
    context: ResolvedContextSetV010;
  }): Promise<AgentRunV010 | undefined>;
}

/**
 * Explicitly injected, readonly database-backed Run adapter intended for the
 * Host enterprise-agent.run.get fallback. Caller MUST use the authenticated
 * Host principal and resolved, authorized active context, not request.values.
 *
 * The Run stays under the existing V010 reducer; no worker execution,
 * write dispatch, database schema creation or background job occurs here.
 */
export function createHostAsyncRunReaderPortV020(
  repository: Pick<AsyncAgentRunReceiptRepositoryV020,"listRunEvents">
): HostAsyncRunReaderPortV020 {
  if (!repository || typeof repository.listRunEvents !== "function") {
    throw Error("AGENT_ASYNC_READER_REPOSITORY_REQUIRED");
  }
  return {
    read(input) {
      if (!input || typeof input.runId !== "string" || !input.runId.trim()) {
        throw Error("AGENT_RUN_ID_REQUIRED");
      }
      return createHostScopedAsyncAgentRunBridgeV020({
        repository: repository as AsyncAgentRunReceiptRepositoryV020,
        principal: input.principal,
        context: input.context
      }).getRun(input.runId.trim());
    }
  };
}
