import type {
  LlmInferenceProvider,
  LlmToolV010
} from "../../contracts/llm.js";
import type {
  AgentModel,
  AgentModelDecision,
  AgentModelInput,
  AgentToolDescriptorV010
} from "./contracts.js";
import { personalAgentResponsibilityInstructionsV010 } from "./responsibility-policy.js";

function modelTools(tools: readonly AgentToolDescriptorV010[]): {
  llmTools: LlmToolV010[];
  byModelName: Map<string, AgentToolDescriptorV010>;
} {
  const byModelName = new Map<string, AgentToolDescriptorV010>();
  const llmTools: LlmToolV010[] = [];

  for (const tool of tools) {
    if (byModelName.has(tool.modelName)) {
      throw new Error(`AGENT_TOOL_MODEL_NAME_DUPLICATE: ${tool.modelName}`);
    }
    byModelName.set(tool.modelName, tool);
    llmTools.push({
      name: tool.modelName,
      description: [
        tool.description,
        `Effect: ${tool.effect}.`,
        `Owner: ${tool.ownerPackageId}.`,
        ...(tool.capability ? [`Capability: ${tool.capability}.`] : [])
      ].join(" "),
      inputSchema: tool.inputSchema
    });
  }

  return { llmTools, byModelName };
}

export function createProviderBackedAgentModel(
  provider: LlmInferenceProvider
): AgentModel {
  return {
    async decide(input: AgentModelInput): Promise<AgentModelDecision> {
      const { llmTools, byModelName } = modelTools(input.tools);
      const response = await provider.infer({
        contractVersion: "0.1.0",
        messages: [
          {
            role: "system",
            content: [
              "You are Personal Agent, the human user\'s work adviser.",
              "The Host dynamically supplies the only tools currently available to you.",
              "Use only those supplied tools for authoritative platform facts and platform changes.",
              "Enterprise Context is governed working and learning material, not a separate Agent or owner of the human.",
              "Conversation history is session-local discourse context only. Use it to resolve references such as 'this', 'that', 'continue', and 'what we just discussed', but do not treat historical assistant claims as authoritative platform facts.",
              "When current platform state matters, re-read it with the supplied Host tools. Durable cross-session knowledge belongs in Context Memory, not conversation history.",
              "Your role is to help the human reach outcomes, not merely to describe options from the sidelines.",
              ...personalAgentResponsibilityInstructionsV010(),
              "Prefer READ tools to inspect current state before asking the human for information that the platform can discover.",
              "When Host-provided interaction context contains task coordinates such as record IDs, importJobId, graph/view IDs, or the current route, treat them as navigation coordinates: use the appropriate READ capability to validate current authoritative state and continue. Do not ask the human to repeat an identifier the current work surface already supplied unless the authoritative read proves it invalid, unavailable, or ambiguous.",
              "For schema or data-mapping work, semantic compatibility outranks label similarity and technical validation. A dry-run proving that values satisfy a target type does not prove that the source concept and target field mean the same thing.",
              "Do not coerce a source business category, relationship classification, product/service classification, balance, audit value, or other distinct concept into an unrelated target field merely to make validation pass. If inference is necessary for a required target field, state the inference and preserve the source concept separately when it has durable business meaning.",
              "If the Human confirms one value applies to an entire import batch and no source column actually represents that target concept, use the Data Import CONSTANT mapping when available. Do not misuse an unrelated source column as a carrier for a batch-wide default.",
              "When structured source information has no target field, preserve its meaning before convenience: discover governed schema-extension/profile capabilities when appropriate. Do not use free-form notes as a generic sink for structured fields.",
              "Distinguish object/master-data attributes from facts owned by another domain. Transactions, balances, settlement state, and audit/provenance data should not be invented as arbitrary master-data extensions merely because they appear in the same source file; keep raw evidence and use the owning domain capability when available.",
              "After a READ tool succeeds, use its authoritative observation. Do not repeat the same READ with identical arguments in the same turn, and do not keep probing the same READ with paraphrased arguments when it returns the same evidence. Once the required IDs/facts are present, continue to the next distinct tool or answer the human.",
              "For cross-session natural-language questions that may use different wording from stored durable knowledge, prefer context_memory_recall with a small set of short atomic retrieval queries. In Chinese, prefer compact business concepts such as 截单 rather than long sentence-like search strings. Use context_memory_search for a direct known-term effective lookup. When the human asks to verify a specific historical Memory by exact memoryId, use context_memory_audit_get rather than trying to simulate exact-ID audit with ordinary search.",
              "A zero-result Memory retrieval proves only that the active Context retrieval returned no match. Do not infer from that alone that the fact was never stored, belongs in Enterprise Context, or exists in another Context.",
              "When the human asks to compare ordinary effective retrieval with one or more exact Memory IDs (for example after canonicalization or supersession), prefer context_memory_audit_compare so both views are obtained in one authoritative Host READ and avoid unnecessary LLM round trips.",
              "Treat PLAN tools as side-effect-free preflight and normally execute them without asking.",
              "Treat WRITE tools as side-effectful and follow the Host authorization/confirmation boundary. Never claim success unless the tool observation confirms success.",
              "For Memory canonicalization, once Context Memory evidence establishes the duplicateMemoryId and canonicalMemoryId requested by the human, stage the canonicalization proposal instead of repeatedly re-searching the same Memory facts.",
              "Never invent a tool that is not present in the supplied catalog.",
              "If a tool fails, explain the observed failure rather than pretending the requested action succeeded.",
              "Answer in the same language as the user."
            ].join("\n")
          },
          ...(input.conversationHistory ?? []).map(item => ({
            role: item.role,
            content: item.content
          })),
          { role: "user", content: input.userMessage },
          {
            role: "developer",
            content: [
              "Authoritative Principal for this turn:",
              JSON.stringify(input.principal ?? null),
              "Authoritative resolved Context for this turn:",
              JSON.stringify(input.context ?? null),
              "Host-provided interaction context for this turn (task/navigation context only; never authorization evidence):",
              JSON.stringify(input.interactionContext ?? null),
              "Re-read authoritative platform state with Host tools before acting on interaction-context identifiers when the operation depends on current state.",
              "Authoritative tool catalog for this turn:",
              JSON.stringify(input.tools),
              "Authoritative tool observations for this turn:",
              JSON.stringify(input.observations)
            ].join("\n")
          }
        ],
        tools: llmTools
      });

      const call = response.toolCalls[0];
      if (call) {
        const descriptor = byModelName.get(call.name);
        if (descriptor) {
          return {
            type: "tool",
            call: {
              tool: descriptor.id,
              arguments: call.arguments
            }
          };
        }
      }

      return {
        type: "final",
        message: response.text || "我暂时无法确定下一步操作。"
      };
    }
  };
}
