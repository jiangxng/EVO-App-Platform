import type { AgentActionReceiptV010 } from "../../contracts/agent-action-receipt.js";
import type {
  PlatformPrincipalV010,
  ResolvedContextSetV010
} from "../../contracts/platform-services.js";

export type AgentToolEffectV010 = "READ" | "PLAN" | "WRITE";

export interface AgentToolDescriptorV010 {
  contractVersion: "0.1.0";
  id: string;
  modelName: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  effect: AgentToolEffectV010;
  ownerPackageId: string;
  capability?: string;
}

export interface AgentToolCall {
  tool: string;
  arguments: Record<string, unknown>;
}

export interface AgentToolObservation {
  tool: string;
  ok: boolean;
  result?: unknown;
  error?: { code: string; message: string };
  receipt?: AgentActionReceiptV010;
}

export interface AgentConversationMessageV010 {
  role: "user" | "assistant";
  content: string;
}

export type AgentInteractionContextV010 = Record<string, unknown>;

export interface AgentModelInput {
  userMessage: string;
  conversationHistory?: readonly AgentConversationMessageV010[];
  interactionContext?: AgentInteractionContextV010;
  tools: AgentToolDescriptorV010[];
  observations: AgentToolObservation[];
  principal?: PlatformPrincipalV010;
  context?: ResolvedContextSetV010;
}

export type AgentModelDecision =
  | { type: "tool"; call: AgentToolCall }
  | { type: "final"; message: string };

export interface AgentModel {
  decide(input: AgentModelInput): Promise<AgentModelDecision>;
}

export interface AgentToolCatalogV010 {
  list(): Promise<AgentToolDescriptorV010[]> | AgentToolDescriptorV010[];
  invoke(
    call: AgentToolCall,
    observations: readonly AgentToolObservation[]
  ): Promise<AgentToolObservation>;
}

export interface PersonalAgentReplyV010 {
  contractVersion: "0.1.0";
  /**
   * Compatibility machine id. Product identity is Personal Agent.
   */
  agentId: "enterprise-agent";
  message: string;
  context?: ResolvedContextSetV010;
  tools: Array<Pick<
    AgentToolDescriptorV010,
    "id" | "title" | "effect" | "ownerPackageId" | "capability"
  >>;
  observations: AgentToolObservation[];
}


/**
 * Compatibility alias. New product-facing code should prefer PersonalAgentReplyV010.
 */
export type EnterpriseAgentReplyV010 = PersonalAgentReplyV010;
