import type { ActionExecutionResult, ActionHost } from "../adapters/ports.js";
import type { ActionRequestV010 } from "../runtime/contracts.js";

export interface AppManagerActionHostOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  locale?: () => string | undefined;
}

function normalizeBaseUrl(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function createAppManagerActionHost(
  options: AppManagerActionHostOptions
): ActionHost {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;

  if (!fetchImpl) {
    throw new Error("EIDOS_APP_MANAGER_ACTION_HOST_FETCH_UNAVAILABLE");
  }

  return {
    async execute(request: ActionRequestV010): Promise<ActionExecutionResult> {
      const actionUrl = new URL(`${baseUrl}/v1/actions`);
      const locale = options.locale?.()?.trim();
      if (locale) actionUrl.searchParams.set("locale", locale);
      const response = await fetchImpl(actionUrl.toString(), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify(request)
      });

      const body = await response.json() as ActionExecutionResult;
      if (!response.ok) {
        const message = body.error?.message ?? `Action execution failed with HTTP ${response.status}`;
        return {
          ok: false,
          ...(body.correlationId ? { correlationId: body.correlationId } : {}),
          error: {
            code: body.error?.code ?? "EIDOS_APP_MANAGER_ACTION_FAILED",
            message
          }
        };
      }

      return body;
    }
  };
}
