export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface AppActionRequestV010 {
  contractVersion: "0.1.0";
  type: "command";
  command: {
    code: string;
    inputVersion: string;
  };
  values: Record<string, JsonValue>;
  sourceInteractionId: string;
  actionId: string;
  runtimeInstanceId?: string;
  requiresConfirmation: boolean;
}

export interface AppActionExecutionResultV010 {
  ok: boolean;
  correlationId?: string;
  result?: JsonValue;
  error?: {
    code: string;
    message: string;
  };
}

export interface AppActionHandler {
  readonly packageId: string;
  readonly featureId: string;
  readonly commandCode: string;
  execute(request: AppActionRequestV010): Promise<AppActionExecutionResultV010>;
}
