import {
  EXTERNAL_AGENT_OAUTH_SCOPE,
  type EffectiveExternalAgentOAuthAccessV010
} from "../contracts/external-agent-oauth.js";
import type {
  McpModernToolSecuritySchemeV010,
  McpModernToolV010
} from "./mcp-modern-core.js";

export interface McpProductToolAdapterInputV010 {
  access: EffectiveExternalAgentOAuthAccessV010;
  effect: "READ" | "PLAN" | "WRITE";
  tool: McpModernToolV010;
}

export interface McpProductToolAdapterV010 {
  adaptTool(input: McpProductToolAdapterInputV010): McpModernToolV010;
}

function chatGptClientId(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.hostname !== "chatgpt.com") {
    return false;
  }
  return (
    url.pathname === "/oauth/client.json"
    || /^\/oauth\/[^/]+\/client\.json$/.test(url.pathname)
  );
}

function oauthSecurityScheme(): McpModernToolSecuritySchemeV010 {
  return {
    type: "oauth2",
    scopes: [EXTERNAL_AGENT_OAUTH_SCOPE]
  };
}

export function createChatGptMcpProductAdapterV010():
  McpProductToolAdapterV010 {
  return {
    adaptTool({ access, effect, tool }) {
      if (!chatGptClientId(access.token.oauthClientId)) {
        return structuredClone(tool);
      }

      const securitySchemes = [oauthSecurityScheme()];
      const readOnly = effect === "READ" || effect === "PLAN";

      return {
        ...structuredClone(tool),
        annotations: {
          ...(tool.annotations ?? {}),
          readOnlyHint: readOnly,
          destructiveHint: false,
          openWorldHint: false
        },
        securitySchemes,
        _meta: {
          ...(tool._meta ?? {}),
          securitySchemes: structuredClone(securitySchemes)
        }
      };
    }
  };
}

export function createCompositeMcpProductAdapterV010(
  adapters: readonly McpProductToolAdapterV010[]
): McpProductToolAdapterV010 {
  return {
    adaptTool(input) {
      return adapters.reduce(
        (tool, adapter) => adapter.adaptTool({
          ...input,
          tool
        }),
        structuredClone(input.tool)
      );
    }
  };
}
