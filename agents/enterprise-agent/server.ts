import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createEnterpriseAgentRuntime } from "./runtime.js";
import { createDevelopmentAgentModel } from "./development-model.js";
import { createAppManagerHttpToolCatalogV010 } from "./app-manager-client.js";
import { createOpenAIResponsesAgentModel } from "./openai-responses-model.js";

const managerUrl = process.env.APP_MANAGER_URL ?? "http://localhost:4100";
const port = Number(process.env.PORT ?? 4300);
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
const openaiModel = process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna";
const openaiBaseUrl = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";

const agentModel = openaiApiKey
  ? createOpenAIResponsesAgentModel({
      apiKey: openaiApiKey,
      model: openaiModel,
      baseUrl: openaiBaseUrl
    })
  : createDevelopmentAgentModel();

const runtime = createEnterpriseAgentRuntime(
  agentModel,
  createAppManagerHttpToolCatalogV010({ baseUrl: managerUrl })
);

function applyCors(response: ServerResponse): void {
  response.setHeader("access-control-allow-origin", corsOrigin);
  response.setHeader("access-control-allow-methods", "POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type,accept");
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  applyCors(response);
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

async function body(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      applyCors(response);
      return response.end();
    }

    if (request.method === "POST" && request.url === "/v1/chat") {
      const input = await body(request) as { message?: unknown };
      if (typeof input.message !== "string" || !input.message.trim()) {
        return send(response, 400, { code: "MESSAGE_REQUIRED" });
      }
      return send(response, 200, await runtime.chat(input.message.trim()));
    }

    return send(response, 404, { code: "NOT_FOUND" });
  } catch (error) {
    return send(response, 500, {
      code: "ENTERPRISE_AGENT_ERROR",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(port, () => {
  console.log(`Enterprise Agent development server: http://localhost:${port}`);
  console.log(`App Manager: ${managerUrl}`);
  console.log(
    openaiApiKey
      ? `Model: OpenAI Responses API (${openaiModel})`
      : "Model: deterministic development adapter (set OPENAI_API_KEY for real LLM)"
  );
});
