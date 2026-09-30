import type {
  EffectiveExternalAgentOAuthAccessV010
} from "../contracts/external-agent-oauth.js";
import type {
  ExternalAgentOAuthServiceV010
} from "./external-agent-oauth-service.js";
import type {
  McpModernHttpRequestV010,
  McpModernHttpResponseV010
} from "./mcp-modern-http.js";

export interface McpProtectedResourceHttpResponseV010
  extends McpModernHttpResponseV010 {}

export interface McpProtectedResourceOptionsV010 {
  oauth: ExternalAgentOAuthServiceV010;
  resourceIdentifier: string;
  resourceMetadataUrl: string;
  handleAuthorized(input: {
    access: EffectiveExternalAgentOAuthAccessV010;
    request: McpModernHttpRequestV010;
    correlationId: string;
  }): Promise<McpModernHttpResponseV010> | McpModernHttpResponseV010;
}

function bearerToken(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const key = Object.keys(headers).find(
    item => item.toLowerCase() === "authorization"
  );
  if (!key) return undefined;
  const raw = headers[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  const match = /^Bearer[ ]+([^ ]+)$/i.exec(value.trim());
  return match?.[1];
}

function challenge(
  resourceMetadataUrl: string,
  invalidToken = false
): McpProtectedResourceHttpResponseV010 {
  const parameters = [
    `resource_metadata="${resourceMetadataUrl.replace(/["\\]/g, "\\$&")}"`
  ];
  if (invalidToken) parameters.push('error="invalid_token"');

  return {
    status: 401,
    headers: {
      "www-authenticate": "Bearer " + parameters.join(", "),
      "cache-control": "no-store"
    }
  };
}

function validHttpsUrl(value: string, code: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(code);
  }
  if (
    url.protocol !== "https:"
    && url.hostname !== "localhost"
    && url.hostname !== "127.0.0.1"
  ) {
    throw new Error(code);
  }
  if (url.hash || url.search) throw new Error(code);
  return url.toString();
}

export function createMcpProtectedResourceV010(
  options: McpProtectedResourceOptionsV010
) {
  const resourceIdentifier = validHttpsUrl(
    options.resourceIdentifier,
    "MCP_RESOURCE_IDENTIFIER_INVALID"
  ).replace(/\/$/, "");
  const resourceMetadataUrl = validHttpsUrl(
    options.resourceMetadataUrl,
    "MCP_RESOURCE_METADATA_URL_INVALID"
  );

  return {
    async handle(input: {
      request: McpModernHttpRequestV010;
      correlationId: string;
    }): Promise<McpProtectedResourceHttpResponseV010> {
      const token = bearerToken(input.request.headers);
      if (!token) {
        return challenge(resourceMetadataUrl);
      }

      let access: EffectiveExternalAgentOAuthAccessV010;
      try {
        access = await options.oauth.resolveAccessToken(
          token,
          resourceIdentifier,
          input.correlationId
        );
      } catch {
        return challenge(resourceMetadataUrl, true);
      }

      if (access.resource !== resourceIdentifier) {
        return challenge(resourceMetadataUrl, true);
      }

      return options.handleAuthorized({
        access,
        request: input.request,
        correlationId: input.correlationId
      });
    }
  };
}
