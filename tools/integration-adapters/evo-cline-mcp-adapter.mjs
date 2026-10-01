#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { pathToFileURL } from "node:url";

export const EVO_MODERN_PROTOCOL_VERSION = "2026-07-28";
export const DEFAULT_EVO_MCP_URL =
  "https://ledger-configurator-production.up.railway.app/mcp";
export const DEFAULT_EVO_OAUTH_CLIENT_ID =
  "https://raw.githubusercontent.com/jiangxng/EVO-App-Platform/main/docs/integration-clients/cline-local-adapter-client.json";
export const DEFAULT_REDIRECT_URI =
  "http://127.0.0.1:8791/oauth/callback";

const TOKEN_SKEW_MS = 30_000;
const AUTH_TIMEOUT_MS = 180_000;
const LOCAL_SERVER_NAME = "evo-cline-local-adapter";
const LOCAL_SERVER_VERSION = "0.1.0";
const DEFAULT_LOCAL_PROTOCOL_VERSION = "2025-11-25";

function log(message) {
  process.stderr.write("[evo-cline-adapter] " + message + "\n");
}

function normalizeUrl(value) {
  return new URL(value).toString().replace(/\/$/, "");
}

function tokenFilePath() {
  return process.env.EVO_ADAPTER_TOKEN_FILE
    || path.join(os.homedir(), ".evo", "cline-mcp-adapter-oauth.json");
}

async function ensurePrivateDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), {
    recursive: true,
    mode: 0o700
  });
}

export function base64urlSha256(value) {
  return createHash("sha256")
    .update(value, "ascii")
    .digest("base64url");
}

export function buildModernParams(params = {}) {
  const existingMeta = params?._meta;
  const safeMeta = existingMeta
    && typeof existingMeta === "object"
    && !Array.isArray(existingMeta)
    ? existingMeta
    : {};

  return {
    ...params,
    _meta: {
      ...safeMeta,
      "io.modelcontextprotocol/protocolVersion":
        EVO_MODERN_PROTOCOL_VERSION,
      "io.modelcontextprotocol/clientCapabilities": {
        tools: {}
      },
      "io.modelcontextprotocol/clientInfo": {
        name: LOCAL_SERVER_NAME,
        version: LOCAL_SERVER_VERSION
      }
    }
  };
}

export function translateModernToolsList(result) {
  const tools = Array.isArray(result?.tools) ? result.tools : [];
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      ...(tool.title ? { title: tool.title } : {}),
      ...(tool.description ? { description: tool.description } : {}),
      inputSchema:
        tool.inputSchema
        && typeof tool.inputSchema === "object"
        && !Array.isArray(tool.inputSchema)
          ? tool.inputSchema
          : { type: "object", properties: {} },
      ...(tool.outputSchema
        && typeof tool.outputSchema === "object"
        && !Array.isArray(tool.outputSchema)
          ? { outputSchema: tool.outputSchema }
          : {}),
      ...(tool.annotations
        && typeof tool.annotations === "object"
        && !Array.isArray(tool.annotations)
          ? { annotations: tool.annotations }
          : {})
    })),
    ...(typeof result?.nextCursor === "string"
      ? { nextCursor: result.nextCursor }
      : {})
  };
}

export function translateModernToolCall(result) {
  return {
    content: Array.isArray(result?.content) ? result.content : [],
    ...(result?.structuredContent === undefined
      ? {}
      : { structuredContent: result.structuredContent }),
    ...(result?.isError === undefined
      ? {}
      : { isError: result.isError })
  };
}

export function localInitializeResult(requestedVersion) {
  const supportedLegacy = new Set([
    "2024-11-05",
    "2025-03-26",
    "2025-06-18",
    "2025-11-25"
  ]);
  const protocolVersion = supportedLegacy.has(requestedVersion)
    ? requestedVersion
    : DEFAULT_LOCAL_PROTOCOL_VERSION;

  return {
    protocolVersion,
    capabilities: {
      tools: {
        listChanged: false
      }
    },
    serverInfo: {
      name: LOCAL_SERVER_NAME,
      version: LOCAL_SERVER_VERSION,
      title: "EVO Cline Local MCP Adapter"
    },
    instructions:
      "Local compatibility adapter. Business tools and authorization are owned by the remote EVO MCP server."
  };
}

async function readTokenState() {
  try {
    const raw = await fs.readFile(tokenFilePath(), "utf8");
    const parsed = JSON.parse(raw);
    return parsed
      && typeof parsed === "object"
      && typeof parsed.accessToken === "string"
      ? parsed
      : undefined;
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    return undefined;
  }
}

async function writeTokenState(state) {
  const filePath = tokenFilePath();
  await ensurePrivateDirectory(filePath);
  const temp = filePath + ".tmp";
  await fs.writeFile(temp, JSON.stringify(state, null, 2) + "\n", {
    mode: 0o600
  });
  await fs.chmod(temp, 0o600);
  await fs.rename(temp, filePath);
  await fs.chmod(filePath, 0o600);
}

async function clearTokenState() {
  try {
    await fs.unlink(tokenFilePath());
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  let body;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (!response.ok) {
    throw new Error(
      "HTTP_" + response.status + ": " + JSON.stringify(body ?? {})
    );
  }
  return body;
}

export async function discoverEvoOAuth(mcpUrl = DEFAULT_EVO_MCP_URL) {
  const resourceUrl = new URL(mcpUrl);
  const resourceMetadataUrl = new URL(
    "/.well-known/oauth-protected-resource" + resourceUrl.pathname,
    resourceUrl.origin
  ).toString();

  const resourceMetadata = await jsonFetch(resourceMetadataUrl, {
    headers: { accept: "application/json" }
  });

  if (
    typeof resourceMetadata?.resource !== "string"
    || !Array.isArray(resourceMetadata?.authorization_servers)
    || resourceMetadata.authorization_servers.length !== 1
  ) {
    throw new Error("EVO_OAUTH_RESOURCE_METADATA_INVALID");
  }

  const resource = normalizeUrl(resourceMetadata.resource);
  if (resource !== normalizeUrl(mcpUrl)) {
    throw new Error("EVO_OAUTH_RESOURCE_MISMATCH");
  }

  const issuer = normalizeUrl(resourceMetadata.authorization_servers[0]);
  const authorizationServerMetadataUrl = new URL(
    "/.well-known/oauth-authorization-server",
    issuer + "/"
  ).toString();
  const authorizationServerMetadata =
    await jsonFetch(authorizationServerMetadataUrl, {
      headers: { accept: "application/json" }
    });

  if (
    normalizeUrl(authorizationServerMetadata?.issuer) !== issuer
    || typeof authorizationServerMetadata?.authorization_endpoint !== "string"
    || typeof authorizationServerMetadata?.token_endpoint !== "string"
  ) {
    throw new Error("EVO_OAUTH_AUTHORIZATION_SERVER_METADATA_INVALID");
  }

  return {
    resource,
    issuer,
    resourceMetadataUrl,
    authorizationEndpoint:
      authorizationServerMetadata.authorization_endpoint,
    tokenEndpoint: authorizationServerMetadata.token_endpoint,
    revocationEndpoint:
      authorizationServerMetadata.revocation_endpoint
  };
}

function openBrowser(url) {
  if (process.env.EVO_ADAPTER_NO_BROWSER === "1") {
    log("Open this authorization URL in your browser: " + url);
    return;
  }

  let command;
  let args;

  if (process.platform === "darwin") {
    command = "open";
    args = [url];
  } else if (process.platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", url];
  } else {
    command = "xdg-open";
    args = [url];
  }

  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
}

function authorizationCallback({
  redirectUri,
  authorizationUrl,
  state,
  issuer
}) {
  const redirect = new URL(redirectUri);

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close(() => {
        if (error) reject(error);
        else resolve(value);
      });
    };

    const server = http.createServer((request, response) => {
      const requestUrl = new URL(
        request.url || "/",
        redirect.origin
      );

      if (requestUrl.pathname !== redirect.pathname) {
        response.writeHead(404, {
          "content-type": "text/plain; charset=utf-8"
        });
        response.end("Not found");
        return;
      }

      const returnedState = requestUrl.searchParams.get("state");
      const returnedIssuer = requestUrl.searchParams.get("iss");
      const oauthError = requestUrl.searchParams.get("error");
      const oauthDescription =
        requestUrl.searchParams.get("error_description");
      const code = requestUrl.searchParams.get("code");

      if (returnedState !== state) {
        response.writeHead(400, {
          "content-type": "text/plain; charset=utf-8"
        });
        response.end("OAuth state mismatch.");
        finish(new Error("EVO_OAUTH_STATE_MISMATCH"));
        return;
      }

      if (
        returnedIssuer
        && normalizeUrl(returnedIssuer) !== normalizeUrl(issuer)
      ) {
        response.writeHead(400, {
          "content-type": "text/plain; charset=utf-8"
        });
        response.end("OAuth issuer mismatch.");
        finish(new Error("EVO_OAUTH_ISSUER_MISMATCH"));
        return;
      }

      if (oauthError) {
        response.writeHead(403, {
          "content-type": "text/plain; charset=utf-8"
        });
        response.end(
          "EVO authorization failed: "
          + oauthError
          + (oauthDescription ? " — " + oauthDescription : "")
        );
        finish(
          new Error(
            "EVO_OAUTH_AUTHORIZATION_FAILED: "
            + oauthError
            + (oauthDescription ? ": " + oauthDescription : "")
          )
        );
        return;
      }

      if (!code) {
        response.writeHead(400, {
          "content-type": "text/plain; charset=utf-8"
        });
        response.end("Authorization code missing.");
        finish(new Error("EVO_OAUTH_CODE_MISSING"));
        return;
      }

      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8"
      });
      response.end(
        "<!doctype html><html><body>"
        + "<h2>EVO authorization complete.</h2>"
        + "<p>You can return to VS Code / Cline.</p>"
        + "</body></html>"
      );
      finish(undefined, { code });
    });

    server.on("error", error => finish(error));

    server.listen(
      Number(redirect.port),
      redirect.hostname,
      () => {
        log("Opening browser for EVO authorization.");
        openBrowser(authorizationUrl);
      }
    );

    const timer = setTimeout(() => {
      finish(new Error("EVO_OAUTH_AUTHORIZATION_TIMEOUT"));
    }, AUTH_TIMEOUT_MS);
  });
}

async function tokenRequest(
  tokenEndpoint,
  form
) {
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json"
    },
    body: form.toString()
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok || typeof body?.access_token !== "string") {
    throw new Error(
      "EVO_OAUTH_TOKEN_FAILED: " + JSON.stringify(body)
    );
  }

  return body;
}

async function interactiveAuthorize(discovery) {
  const clientId =
    process.env.EVO_OAUTH_CLIENT_ID
    || DEFAULT_EVO_OAUTH_CLIENT_ID;
  const redirectUri =
    process.env.EVO_OAUTH_REDIRECT_URI
    || DEFAULT_REDIRECT_URI;

  const verifier = randomBytes(48).toString("base64url");
  const challenge = base64urlSha256(verifier);
  const state = randomBytes(24).toString("base64url");

  const authorizationUrl = new URL(
    discovery.authorizationEndpoint
  );
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set(
    "scope",
    "evo.capabilities offline_access"
  );
  authorizationUrl.searchParams.set(
    "resource",
    discovery.resource
  );
  authorizationUrl.searchParams.set(
    "code_challenge",
    challenge
  );
  authorizationUrl.searchParams.set(
    "code_challenge_method",
    "S256"
  );
  authorizationUrl.searchParams.set("state", state);

  const callback = await authorizationCallback({
    redirectUri,
    authorizationUrl: authorizationUrl.toString(),
    state,
    issuer: discovery.issuer
  });

  const token = await tokenRequest(
    discovery.tokenEndpoint,
    new URLSearchParams({
      grant_type: "authorization_code",
      code: callback.code,
      client_id: clientId,
      redirect_uri: redirectUri,
      resource: discovery.resource,
      code_verifier: verifier
    })
  );

  const stateRecord = {
    contractVersion: "0.1.0",
    clientId,
    resource: discovery.resource,
    accessToken: token.access_token,
    accessTokenExpiresAt:
      new Date(
        Date.now() + Number(token.expires_in || 0) * 1000
      ).toISOString(),
    ...(typeof token.refresh_token === "string"
      ? { refreshToken: token.refresh_token }
      : {}),
    scope: typeof token.scope === "string"
      ? token.scope
      : "evo.capabilities"
  };

  await writeTokenState(stateRecord);
  log("EVO OAuth authorization completed.");
  return stateRecord;
}

async function refreshToken(discovery, current) {
  if (typeof current?.refreshToken !== "string") return undefined;

  try {
    const token = await tokenRequest(
      discovery.tokenEndpoint,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: current.refreshToken,
        client_id: current.clientId,
        resource: discovery.resource
      })
    );

    const next = {
      contractVersion: "0.1.0",
      clientId: current.clientId,
      resource: discovery.resource,
      accessToken: token.access_token,
      accessTokenExpiresAt:
        new Date(
          Date.now() + Number(token.expires_in || 0) * 1000
        ).toISOString(),
      ...(typeof token.refresh_token === "string"
        ? { refreshToken: token.refresh_token }
        : {}),
      scope: typeof token.scope === "string"
        ? token.scope
        : current.scope
    };
    await writeTokenState(next);
    log("EVO OAuth token refreshed.");
    return next;
  } catch {
    await clearTokenState();
    return undefined;
  }
}

async function ensureToken(discovery) {
  const expectedClientId =
    process.env.EVO_OAUTH_CLIENT_ID
    || DEFAULT_EVO_OAUTH_CLIENT_ID;
  let current = await readTokenState();

  if (
    current
    && (
      current.clientId !== expectedClientId
      || normalizeUrl(current.resource) !==
        normalizeUrl(discovery.resource)
    )
  ) {
    await clearTokenState();
    current = undefined;
  }

  if (current) {
    const expiresAt = Date.parse(current.accessTokenExpiresAt);
    if (
      Number.isFinite(expiresAt)
      && expiresAt - TOKEN_SKEW_MS > Date.now()
    ) {
      return current;
    }

    const refreshed = await refreshToken(discovery, current);
    if (refreshed) return refreshed;
  }

  return interactiveAuthorize(discovery);
}

let remoteRequestId = 1;

async function remoteMcpRequest(method, params = {}) {
  const mcpUrl =
    process.env.EVO_MCP_URL || DEFAULT_EVO_MCP_URL;
  const discovery = await discoverEvoOAuth(mcpUrl);
  const token = await ensureToken(discovery);
  const id = remoteRequestId++;

  const headers = {
    authorization: "Bearer " + token.accessToken,
    "content-type": "application/json",
    accept: "application/json",
    "MCP-Protocol-Version": EVO_MODERN_PROTOCOL_VERSION,
    "Mcp-Method": method
  };

  if (method === "tools/call") {
    if (typeof params?.name !== "string" || !params.name) {
      throw new Error("MCP_TOOL_NAME_REQUIRED");
    }
    headers["Mcp-Name"] = params.name;
  }

  const response = await fetch(mcpUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params: buildModernParams(params)
    })
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (response.status === 401) {
    await clearTokenState();
    throw new Error(
      "EVO_AUTHORIZATION_REQUIRED: current delegated authority or token is no longer valid; reconnect to authorize again."
    );
  }

  if (!response.ok) {
    throw new Error(
      "EVO_MCP_HTTP_" + response.status + ": "
      + JSON.stringify(body ?? {})
    );
  }

  if (body?.error) {
    throw new Error(
      "EVO_MCP_ERROR "
      + body.error.code
      + ": "
      + body.error.message
      + (body.error.data
        ? " " + JSON.stringify(body.error.data)
        : "")
    );
  }

  if (!body?.result || typeof body.result !== "object") {
    throw new Error("EVO_MCP_RESULT_INVALID");
  }

  return body.result;
}

function writeJsonRpc(message) {
  process.stdout.write(JSON.stringify(message) + "\n");
}

function jsonRpcError(id, code, message) {
  writeJsonRpc({
    jsonrpc: "2.0",
    id: id ?? null,
    error: {
      code,
      message
    }
  });
}

async function handleLocalMessage(message) {
  if (
    !message
    || message.jsonrpc !== "2.0"
    || typeof message.method !== "string"
  ) {
    if (message?.id !== undefined) {
      jsonRpcError(message.id, -32600, "Invalid Request");
    }
    return;
  }

  const isNotification = message.id === undefined;

  if (message.method === "notifications/initialized") {
    return;
  }

  if (message.method === "notifications/cancelled") {
    return;
  }

  if (message.method === "initialize") {
    if (isNotification) return;
    writeJsonRpc({
      jsonrpc: "2.0",
      id: message.id,
      result: localInitializeResult(
        message.params?.protocolVersion
      )
    });
    return;
  }

  if (message.method === "ping") {
    if (isNotification) return;
    writeJsonRpc({
      jsonrpc: "2.0",
      id: message.id,
      result: {}
    });
    return;
  }

  if (message.method === "tools/list") {
    if (isNotification) return;
    try {
      const result = await remoteMcpRequest(
        "tools/list",
        typeof message.params === "object" && message.params
          ? message.params
          : {}
      );
      writeJsonRpc({
        jsonrpc: "2.0",
        id: message.id,
        result: translateModernToolsList(result)
      });
    } catch (error) {
      jsonRpcError(
        message.id,
        -32603,
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
    return;
  }

  if (message.method === "tools/call") {
    if (isNotification) return;
    try {
      const params =
        message.params
        && typeof message.params === "object"
        && !Array.isArray(message.params)
          ? message.params
          : {};
      const result = await remoteMcpRequest(
        "tools/call",
        {
          name: params.name,
          arguments:
            params.arguments
            && typeof params.arguments === "object"
            && !Array.isArray(params.arguments)
              ? params.arguments
              : {}
        }
      );
      writeJsonRpc({
        jsonrpc: "2.0",
        id: message.id,
        result: translateModernToolCall(result)
      });
    } catch (error) {
      jsonRpcError(
        message.id,
        -32603,
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
    return;
  }

  if (!isNotification) {
    jsonRpcError(message.id, -32601, "Method not found");
  }
}

export async function main() {
  log(
    "Starting local stdio bridge to "
    + (process.env.EVO_MCP_URL || DEFAULT_EVO_MCP_URL)
  );
  log(
    "OAuth tokens are stored locally at "
    + tokenFilePath()
    + " with owner-only file permissions."
  );

  const input = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity
  });

  for await (const line of input) {
    if (!line.trim()) continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      jsonRpcError(null, -32700, "Parse error");
      continue;
    }
    await handleLocalMessage(message);
  }
}

const invokedAsMain =
  process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (invokedAsMain) {
  main().catch(error => {
    log(
      "Fatal: "
      + (error instanceof Error ? error.message : String(error))
    );
    process.exitCode = 1;
  });
}
