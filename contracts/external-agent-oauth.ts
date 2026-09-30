export const EVO_EXTERNAL_AGENT_READ_SCOPE = "evo:read";
export const EVO_EXTERNAL_AGENT_PLAN_SCOPE = "evo:plan";

export type ExternalAgentOAuthScopeV010 =
  | typeof EVO_EXTERNAL_AGENT_READ_SCOPE
  | typeof EVO_EXTERNAL_AGENT_PLAN_SCOPE;

export interface ExternalAgentProtectedResourceMetadataV010 {
  resource: string;
  authorization_servers: string[];
  scopes_supported: ExternalAgentOAuthScopeV010[];
  bearer_methods_supported: ["header"];
  resource_name: string;
}

export interface ExternalAgentAuthorizationServerMetadataV010 {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  response_types_supported: ["code"];
  grant_types_supported: ["authorization_code"];
  code_challenge_methods_supported: ["S256"];
  token_endpoint_auth_methods_supported: ["none"];
  scopes_supported: ExternalAgentOAuthScopeV010[];
  authorization_response_iss_parameter_supported: true;
  protected_resources: string[];
}
