import type {
  PlatformCapabilityOperationContributionV010
} from "../../contracts/package.js";
import {
  BUSINESS_DICTIONARY_AUTH_RESOURCE_V010 as RESOURCE,
  BUSINESS_DICTIONARY_CAPABILITY_V010 as CAPABILITY,
  BUSINESS_DICTIONARY_DRAFT_COMMAND_V010 as DRAFT,
  BUSINESS_DICTIONARY_LIST_COMMAND_V010 as LIST,
  BUSINESS_DICTIONARY_PUBLISH_COMMAND_V010 as PUBLISH,
  BUSINESS_DICTIONARY_RESOLVE_COMMAND_V010 as RESOLVE,
  BUSINESS_DICTIONARY_PUBLISH_ACTION_V010 as PUBLISH_ACTION,
  BUSINESS_DICTIONARY_READ_ACTION_V010 as READ_ACTION,
  BUSINESS_DICTIONARY_WRITE_ACTION_V010 as WRITE_ACTION
} from "./constants.js";

const optionSchema = {
  type: "object", required: ["code", "label", "status"],
  properties: {
    code: { type: "string", minLength: 1 },
    label: { type: "object" },
    aliases: { type: "array", items: { type: "string" } },
    status: { enum: ["ACTIVE", "INACTIVE"] }
  }
} as const;

const dictionarySchema = {
  type: "object",
  required: ["contractVersion", "contextId", "dictionaryId", "version", "state", "options"],
  properties: {
    contractVersion: { const: "0.1.0" },
    contextId: { type: "string" }, dictionaryId: { type: "string" },
    version: { type: "integer" },
    state: { enum: ["DRAFT", "PUBLISHED"] },
    options: { type: "array", items: optionSchema }
  }
} as const;

const op = (operationId: string, effect: "READ" | "WRITE", action: string,
  commandCode: string, properties: Record<string, unknown>, required: string[] = []) => ({
  kind: "platform.capability-operation" as const,
  operation: {
    contractVersion: "0.1.0" as const,
    operationId, capability: CAPABILITY, operationVersion: "0.1.0",
    title: operationId, description: "Enterprise-scoped governed business dictionary operation",
    effect, dataScope: "ENTERPRISE" as const,
    authorization: { action, resource: {
      type: RESOURCE, idSource: "DATA_SCOPE" as const
    } },
    inputSchema: {
      type: "object", additionalProperties: false, required, properties
    },
    outputSchema: { type: "object" },
    binding: { type: "ACTION_HOST" as const, commandCode, inputVersion: "0.1.0" },
    exposure: (effect === "READ" ? ["HUMAN", "PERSONAL_AGENT"]
      : ["HUMAN"]) as ("HUMAN" | "PERSONAL_AGENT")[],
    ...(effect === "WRITE" ? { writeSafety: {
      idempotency: "HOST_REQUIRED" as const,
      receipt: "HOST_REQUIRED" as const
    } } : {})
  }
});

export const businessDictionaryCapabilityContributionsV010:
  PlatformCapabilityOperationContributionV010[] = [
    op(LIST, "READ", READ_ACTION, LIST,
      { dictionaryId: { type: "string" } }),
    op(RESOLVE, "READ", READ_ACTION, RESOLVE, {
      dictionaryId: { type: "string", minLength: 1 },
      expectedVersion: { type: "integer" },
      sourceValues: { type: "array", items: { type: "string" } }
    }, ["dictionaryId", "sourceValues"]),
    op(DRAFT, "WRITE", WRITE_ACTION, DRAFT, {
      dictionaryId: { type: "string", minLength: 1 },
      expectedVersion: { type: "integer", minimum: 0 },
      options: { type: "array", items: optionSchema }
    }, ["dictionaryId", "expectedVersion", "options"]),
    op(PUBLISH, "WRITE", PUBLISH_ACTION, PUBLISH, {
      dictionaryId: { type: "string", minLength: 1 },
      expectedVersion: { type: "integer", minimum: 1 }
    }, ["dictionaryId", "expectedVersion"])
  ];
