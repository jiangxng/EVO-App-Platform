import { createActionRequest } from "../runtime/action.js";
import type { JsonValue } from "../runtime/contracts.js";
import type { ActionExecutionResult, ActionHost } from "../adapters/ports.js";
import type { AppHostLoadedPageV010 } from "./contracts.js";

export interface AppHostActionExecutionV010 {
  readonly request: ReturnType<typeof createActionRequest>;
  readonly result: ActionExecutionResult;
}

export async function executeAppHostPageAction(
  page: AppHostLoadedPageV010,
  values: Record<string, JsonValue>,
  host: ActionHost
): Promise<AppHostActionExecutionV010> {
  const request = createActionRequest(page.definition, values);
  const result = await host.execute(request);
  return { request, result };
}
