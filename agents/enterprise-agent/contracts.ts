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
}

export interface AgentModelInput {
  userMessage: string;
  tools: AgentToolDescriptorV010[];
  observations: AgentToolObservation[];
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

export interface EnterpriseAgentReplyV010 {
  contractVersion: "0.1.0";
  agentId: "enterprise-agent";
  message: string;
  tools: Array<Pick<
    AgentToolDescriptorV010,
    "id" | "title" | "effect" | "ownerPackageId" | "capability"
  >>;
  observations: AgentToolObservation[];
}
