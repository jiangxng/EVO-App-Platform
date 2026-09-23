import type { InstallPlanV010, PackageManifestV010, PlatformSnapshotV010 } from "../../contracts/package.js";

export type AgentToolName =
  | "app.catalog.list"
  | "app.install.plan"
  | "app.install.execute";

export interface AgentToolCall {
  tool: AgentToolName;
  arguments: Record<string, unknown>;
}

export interface AgentToolObservation {
  tool: AgentToolName;
  ok: boolean;
  result?: unknown;
  error?: { code: string; message: string };
}

export interface AgentModelInput {
  userMessage: string;
  observations: AgentToolObservation[];
}

export type AgentModelDecision =
  | { type: "tool"; call: AgentToolCall }
  | { type: "final"; message: string };

export interface AgentModel {
  decide(input: AgentModelInput): Promise<AgentModelDecision>;
}

export interface AppManagerAgentTools {
  listCatalog(): Promise<PackageManifestV010[]>;
  planInstall(packageId: string): Promise<InstallPlanV010>;
  install(packageId: string): Promise<PlatformSnapshotV010>;
}

export interface EnterpriseAgentReplyV010 {
  contractVersion: "0.1.0";
  agentId: "enterprise-agent";
  message: string;
  observations: AgentToolObservation[];
}
