import type {
  Diagnostic,
  UidlAction,
  UidlField,
  UidlFormV011,
  UidlOptionValue,
  ValidationResult
} from "./contracts.js";
import { isPlainObject, toJsonSnapshot } from "./json.js";
import {
  assertContextNavigationV010
} from "../navigation/context-navigation.js";

const controls = new Set([
  "text",
  "number",
  "money",
  "select",
  "date",
  "reference",
  "file"
]);
const docKeys = new Set([
  "contractVersion",
  "kind",
  "id",
  "title",
  "description",
  "contextNavigation",
  "purpose",
  "command",
  "fields",
  "actions",
  "metadata"
]);
const fieldKeys = new Set([
  "key",
  "label",
  "semanticType",
  "control",
  "required",
  "readOnly",
  "initialValue",
  "unit",
  "options",
  "accept",
  "maxBytes",
  "validation"
]);
const actionKeys = new Set([
  "id",
  "label",
  "type",
  "command",
  "requiresConfirmation",
  "prompt",
  "agentCapability",
  "context",
  "refreshSourceOnComplete"
]);

function d(
  code: string,
  path: string,
  message: string,
  fix?: string
): Diagnostic {
  return { code, path, message, ...(fix ? { fix } : {}) };
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function extraKeys(
  object: Record<string, unknown>,
  allowed: Set<string>,
  path: string,
  out: Diagnostic[]
): void {
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) {
      out.push(d(
        "EIDOS_SCHEMA_ADDITIONAL_PROPERTY",
        `${path}.${key}`,
        `Unknown property '${key}'`
      ));
    }
  }
}

function parseField(
  value: unknown,
  path: string,
  out: Diagnostic[]
): UidlField | undefined {
  if (!isPlainObject(value)) {
    out.push(d("EIDOS_SCHEMA_TYPE", path, "Field must be an object"));
    return;
  }

  extraKeys(value, fieldKeys, path, out);
  const {
    key,
    label,
    semanticType,
    control,
    required,
    readOnly,
    initialValue,
    unit,
    options,
    accept,
    maxBytes,
    validation
  } = value;

  if (!nonEmpty(key)) {
    out.push(d(
      "EIDOS_SCHEMA_REQUIRED",
      `${path}.key`,
      "Field key must be a non-empty string"
    ));
  }
  if (!nonEmpty(label)) {
    out.push(d(
      "EIDOS_SCHEMA_REQUIRED",
      `${path}.label`,
      "Field label must be a non-empty string"
    ));
  }
  if (!nonEmpty(semanticType)) {
    out.push(d(
      "EIDOS_SCHEMA_REQUIRED",
      `${path}.semanticType`,
      "semanticType must be a non-empty string"
    ));
  }
  if (typeof control !== "string" || !controls.has(control)) {
    out.push(d(
      "EIDOS_CONTROL_UNSUPPORTED",
      `${path}.control`,
      `Unsupported control '${String(control)}'`
    ));
  }
  if (typeof required !== "boolean") {
    out.push(d(
      "EIDOS_SCHEMA_REQUIRED",
      `${path}.required`,
      "required must be boolean"
    ));
  }
  if (readOnly !== undefined && typeof readOnly !== "boolean") {
    out.push(d(
      "EIDOS_SCHEMA_TYPE",
      `${path}.readOnly`,
      "readOnly must be boolean"
    ));
  }
  if (unit !== undefined && typeof unit !== "string") {
    out.push(d(
      "EIDOS_SCHEMA_TYPE",
      `${path}.unit`,
      "unit must be string"
    ));
  }

  let parsedAccept: string[] | undefined;
  if (accept !== undefined) {
    if (
      !Array.isArray(accept)
      || accept.length === 0
      || accept.some(item =>
        typeof item !== "string" || item.trim().length === 0
      )
    ) {
      out.push(d(
        "EIDOS_FILE_ACCEPT_INVALID",
        `${path}.accept`,
        "accept must be a non-empty array of strings"
      ));
    } else {
      parsedAccept = [
        ...new Set(accept.map(item => String(item).trim()))
      ];
    }
  }

  if (
    maxBytes !== undefined
    && (!Number.isInteger(maxBytes) || Number(maxBytes) <= 0)
  ) {
    out.push(d(
      "EIDOS_FILE_MAX_BYTES_INVALID",
      `${path}.maxBytes`,
      "maxBytes must be a positive integer"
    ));
  }

  if (
    control !== "file"
    && (accept !== undefined || maxBytes !== undefined)
  ) {
    out.push(d(
      "EIDOS_FILE_OPTIONS_CONTROL_MISMATCH",
      path,
      "accept/maxBytes are only valid for file controls"
    ));
  }

  if (control === "file" && initialValue !== undefined) {
    out.push(d(
      "EIDOS_FILE_INITIAL_VALUE_UNSUPPORTED",
      `${path}.initialValue`,
      "file controls do not support initialValue"
    ));
  }

  let parsedOptions: { value: UidlOptionValue; label: string }[] | undefined;
  if (options !== undefined) {
    if (!Array.isArray(options) || options.length === 0) {
      out.push(d(
        "EIDOS_SCHEMA_TYPE",
        `${path}.options`,
        "options must be a non-empty array"
      ));
    } else {
      parsedOptions = options.flatMap((option, index) => {
        if (!isPlainObject(option)) {
          out.push(d(
            "EIDOS_SCHEMA_TYPE",
            `${path}.options[${index}]`,
            "Option must be object"
          ));
          return [];
        }
        extraKeys(
          option,
          new Set(["value", "label"]),
          `${path}.options[${index}]`,
          out
        );
        if (
          !["string", "number", "boolean"].includes(typeof option.value)
        ) {
          out.push(d(
            "EIDOS_OPTION_VALUE_TYPE",
            `${path}.options[${index}].value`,
            "Option value must be string, number or boolean"
          ));
        }
        if (!nonEmpty(option.label)) {
          out.push(d(
            "EIDOS_SCHEMA_REQUIRED",
            `${path}.options[${index}].label`,
            "Option label must be non-empty"
          ));
        }
        return (
          ["string", "number", "boolean"].includes(typeof option.value)
          && nonEmpty(option.label)
        )
          ? [{
              value: option.value as UidlOptionValue,
              label: option.label
            }]
          : [];
      });
    }
  }

  if (
    control === "select"
    && (!parsedOptions || parsedOptions.length === 0)
  ) {
    out.push(d(
      "EIDOS_SELECT_OPTIONS_REQUIRED",
      `${path}.options`,
      "Select control requires options"
    ));
  }

  let parsedValidation: UidlField["validation"];
  if (validation !== undefined) {
    if (!isPlainObject(validation)) {
      out.push(d(
        "EIDOS_SCHEMA_TYPE",
        `${path}.validation`,
        "validation must be object"
      ));
    } else {
      extraKeys(
        validation,
        new Set(["min", "max", "pattern"]),
        `${path}.validation`,
        out
      );
      if (
        validation.min !== undefined
        && typeof validation.min !== "number"
      ) {
        out.push(d(
          "EIDOS_SCHEMA_TYPE",
          `${path}.validation.min`,
          "min must be number"
        ));
      }
      if (
        validation.max !== undefined
        && typeof validation.max !== "number"
      ) {
        out.push(d(
          "EIDOS_SCHEMA_TYPE",
          `${path}.validation.max`,
          "max must be number"
        ));
      }
      if (
        validation.pattern !== undefined
        && typeof validation.pattern !== "string"
      ) {
        out.push(d(
          "EIDOS_SCHEMA_TYPE",
          `${path}.validation.pattern`,
          "pattern must be string"
        ));
      }
      if (typeof validation.pattern === "string") {
        try {
          new RegExp(validation.pattern);
        } catch {
          out.push(d(
            "EIDOS_PATTERN_INVALID",
            `${path}.validation.pattern`,
            "pattern is not a valid RegExp source"
          ));
        }
      }
      if (
        typeof validation.min === "number"
        && typeof validation.max === "number"
        && validation.min > validation.max
      ) {
        out.push(d(
          "EIDOS_RANGE_INVALID",
          `${path}.validation`,
          "min must not exceed max"
        ));
      }
      parsedValidation = {
        ...(typeof validation.min === "number"
          ? { min: validation.min }
          : {}),
        ...(typeof validation.max === "number"
          ? { max: validation.max }
          : {}),
        ...(typeof validation.pattern === "string"
          ? { pattern: validation.pattern }
          : {})
      };
    }
  }

  if (
    !nonEmpty(key)
    || !nonEmpty(label)
    || !nonEmpty(semanticType)
    || typeof control !== "string"
    || !controls.has(control)
    || typeof required !== "boolean"
  ) {
    return;
  }

  return {
    key,
    label,
    semanticType,
    control: control as UidlField["control"],
    required,
    ...(typeof readOnly === "boolean" ? { readOnly } : {}),
    ...(
      ["string", "number", "boolean"].includes(typeof initialValue)
        ? { initialValue: initialValue as UidlOptionValue }
        : {}
    ),
    ...(typeof unit === "string" ? { unit } : {}),
    ...(parsedOptions ? { options: parsedOptions } : {}),
    ...(parsedAccept ? { accept: parsedAccept } : {}),
    ...(
      typeof maxBytes === "number"
      && Number.isInteger(maxBytes)
      && maxBytes > 0
        ? { maxBytes }
        : {}
    ),
    ...(parsedValidation ? { validation: parsedValidation } : {})
  };
}

function parseAction(
  value: unknown,
  path: string,
  out: Diagnostic[]
): UidlAction | undefined {
  if (!isPlainObject(value)) {
    out.push(d("EIDOS_SCHEMA_TYPE", path, "Action must be object"));
    return;
  }
  extraKeys(value, actionKeys, path, out);
  if (!nonEmpty(value.id)) {
    out.push(d(
      "EIDOS_SCHEMA_REQUIRED",
      `${path}.id`,
      "Action id must be non-empty"
    ));
  }
  if (!nonEmpty(value.label)) {
    out.push(d(
      "EIDOS_SCHEMA_REQUIRED",
      `${path}.label`,
      "Action label must be non-empty"
    ));
  }
  if (
    value.type !== "submit"
    && value.type !== "cancel"
    && value.type !== "agent"
  ) {
    out.push(d(
      "EIDOS_ACTION_TYPE",
      `${path}.type`,
      "Action type must be submit, cancel or agent"
    ));
  }
  if (value.command !== undefined && !nonEmpty(value.command)) {
    out.push(d(
      "EIDOS_SCHEMA_TYPE",
      `${path}.command`,
      "command must be non-empty when present"
    ));
  }
  if (
    value.requiresConfirmation !== undefined
    && typeof value.requiresConfirmation !== "boolean"
  ) {
    out.push(d(
      "EIDOS_SCHEMA_TYPE",
      `${path}.requiresConfirmation`,
      "requiresConfirmation must be boolean"
    ));
  }
  if (
    value.agentCapability !== undefined
    && !nonEmpty(value.agentCapability)
  ) {
    out.push(d(
      "EIDOS_SCHEMA_TYPE",
      `${path}.agentCapability`,
      "agentCapability must be non-empty when present"
    ));
  }
  if (
    value.refreshSourceOnComplete !== undefined
    && typeof value.refreshSourceOnComplete !== "boolean"
  ) {
    out.push(d(
      "EIDOS_SCHEMA_TYPE",
      `${path}.refreshSourceOnComplete`,
      "refreshSourceOnComplete must be boolean when present"
    ));
  }
  if (value.type === "agent" && !nonEmpty(value.prompt)) {
    out.push(d(
      "EIDOS_AGENT_ACTION_PROMPT_REQUIRED",
      `${path}.prompt`,
      "Agent action prompt must be a non-empty string"
    ));
  }
  if (value.context !== undefined) {
    try {
      const snapshot = toJsonSnapshot(value.context);
      if (!isPlainObject(snapshot)) {
        out.push(d(
          "EIDOS_AGENT_ACTION_CONTEXT_TYPE",
          `${path}.context`,
          "Agent action context must be a JSON object"
        ));
      }
    } catch (error) {
      out.push(d(
        "EIDOS_AGENT_ACTION_CONTEXT_JSON",
        `${path}.context`,
        error instanceof Error
          ? error.message
          : "Agent action context is not JSON"
      ));
    }
  }
  if (
    !nonEmpty(value.id)
    || !nonEmpty(value.label)
    || (
      value.type !== "submit"
      && value.type !== "cancel"
      && value.type !== "agent"
    )
    || (value.type === "agent" && !nonEmpty(value.prompt))
  ) {
    return;
  }
  let parsedContext: Record<string, import("./contracts.js").JsonValue> | undefined;
  if (value.context !== undefined) {
    const snapshot = toJsonSnapshot(value.context);
    if (isPlainObject(snapshot)) {
      parsedContext = snapshot as Record<
        string,
        import("./contracts.js").JsonValue
      >;
    }
  }

  return {
    id: value.id,
    label: value.label,
    type: value.type,
    ...(nonEmpty(value.command) ? { command: value.command } : {}),
    ...(typeof value.requiresConfirmation === "boolean"
      ? { requiresConfirmation: value.requiresConfirmation }
      : {}),
    ...(nonEmpty(value.prompt) ? { prompt: value.prompt } : {}),
    ...(nonEmpty(value.agentCapability)
      ? { agentCapability: value.agentCapability }
      : {}),
    ...(parsedContext ? { context: parsedContext } : {}),
    ...(typeof value.refreshSourceOnComplete === "boolean"
      ? { refreshSourceOnComplete: value.refreshSourceOnComplete }
      : {})
  };
}

export class UidlValidationError extends Error {
  constructor(public diagnostics: Diagnostic[]) {
    super(diagnostics.map(item =>
      `${item.path}: ${item.message}`
    ).join("; "));
    this.name = "UidlValidationError";
  }
}

export function validateUidl(
  document: unknown
): ValidationResult<UidlFormV011> {
  const out: Diagnostic[] = [];

  if (!isPlainObject(document)) {
    return {
      ok: false,
      diagnostics: [d(
        "EIDOS_SCHEMA_TYPE",
        "$",
        "UIDL document must be a plain object"
      )]
    };
  }

  extraKeys(document, docKeys, "$", out);

  if (document.contractVersion !== "0.1.1") {
    out.push(d(
      "EIDOS_VERSION_UNSUPPORTED",
      "$.contractVersion",
      `Unsupported UIDL version: ${String(document.contractVersion)}`,
      "Use a declared supported version; 0.1.0 remains blocked pending identity resolution."
    ));
  }
  if (document.kind !== "form") {
    out.push(d(
      "EIDOS_KIND_UNSUPPORTED",
      "$.kind",
      "Only form UIDL is supported by this profile"
    ));
  }
  if (document.purpose !== "execute-command") {
    out.push(d(
      "EIDOS_PURPOSE_UNSUPPORTED",
      "$.purpose",
      "Only execute-command is supported by this profile"
    ));
  }
  if (!nonEmpty(document.id)) {
    out.push(d(
      "EIDOS_SCHEMA_REQUIRED",
      "$.id",
      "id must be non-empty"
    ));
  }
  if (!nonEmpty(document.title)) {
    out.push(d(
      "EIDOS_SCHEMA_REQUIRED",
      "$.title",
      "title must be non-empty"
    ));
  }

  if (
    document.description !== undefined
    && !nonEmpty(document.description)
  ) {
    out.push(d(
      "EIDOS_SCHEMA_TYPE",
      "$.description",
      "description must be non-empty when present"
    ));
  }

  let contextNavigation:
    import("../navigation/context-navigation.js").EidosContextNavigationV010
    | undefined;
  if (document.contextNavigation !== undefined) {
    try {
      contextNavigation = assertContextNavigationV010(
        document.contextNavigation as import("../navigation/context-navigation.js").EidosContextNavigationV010
      );
    } catch (error) {
      out.push(d(
        "EIDOS_CONTEXT_NAVIGATION_INVALID",
        "$.contextNavigation",
        error instanceof Error
          ? error.message
          : "Context navigation is invalid"
      ));
    }
  }

  let command: { code: string; inputVersion: string } | undefined;
  if (!isPlainObject(document.command)) {
    out.push(d(
      "EIDOS_SCHEMA_REQUIRED",
      "$.command",
      "command is required"
    ));
  } else {
    extraKeys(
      document.command,
      new Set(["code", "inputVersion"]),
      "$.command",
      out
    );
    if (!nonEmpty(document.command.code)) {
      out.push(d(
        "EIDOS_SCHEMA_REQUIRED",
        "$.command.code",
        "command.code must be non-empty"
      ));
    }
    if (!nonEmpty(document.command.inputVersion)) {
      out.push(d(
        "EIDOS_SCHEMA_REQUIRED",
        "$.command.inputVersion",
        "command.inputVersion must be non-empty"
      ));
    }
    if (
      nonEmpty(document.command.code)
      && nonEmpty(document.command.inputVersion)
    ) {
      command = {
        code: document.command.code,
        inputVersion: document.command.inputVersion
      };
    }
  }

  const fields: UidlField[] = [];
  const fieldKeysSeen = new Set<string>();
  if (!Array.isArray(document.fields)) {
    out.push(d(
      "EIDOS_SCHEMA_REQUIRED",
      "$.fields",
      "fields must be an array"
    ));
  } else {
    document.fields.forEach((field, index) => {
      const parsed = parseField(
        field,
        `$.fields[${index}]`,
        out
      );
      if (!parsed) return;
      if (fieldKeysSeen.has(parsed.key)) {
        out.push(d(
          "EIDOS_FIELD_DUPLICATE",
          `$.fields[${index}].key`,
          `Duplicate field key: ${parsed.key}`
        ));
      }
      fieldKeysSeen.add(parsed.key);
      fields.push(parsed);
    });
  }

  const actions: UidlAction[] = [];
  const actionIds = new Set<string>();
  if (!Array.isArray(document.actions) || document.actions.length === 0) {
    out.push(d(
      "EIDOS_SCHEMA_REQUIRED",
      "$.actions",
      "actions must be a non-empty array"
    ));
  } else {
    document.actions.forEach((action, index) => {
      const parsed = parseAction(
        action,
        `$.actions[${index}]`,
        out
      );
      if (!parsed) return;
      if (actionIds.has(parsed.id)) {
        out.push(d(
          "EIDOS_ACTION_DUPLICATE",
          `$.actions[${index}].id`,
          `Duplicate action id: ${parsed.id}`
        ));
      }
      actionIds.add(parsed.id);
      actions.push(parsed);
    });
  }

  const submits = actions.filter(action => action.type === "submit");
  if (submits.length !== 1) {
    out.push(d(
      "EIDOS_SUBMIT_CARDINALITY",
      "$.actions",
      `Exactly one submit action is required; found ${submits.length}`
    ));
  }
  if (
    command
    && submits[0]?.command
    && submits[0].command !== command.code
  ) {
    out.push(d(
      "EIDOS_COMMAND_MISMATCH",
      "$.actions",
      "Submit action command must match document command.code"
    ));
  }

  if (document.metadata !== undefined) {
    try {
      const snapshot = toJsonSnapshot(document.metadata);
      if (!isPlainObject(snapshot)) {
        out.push(d(
          "EIDOS_METADATA_TYPE",
          "$.metadata",
          "metadata must be a JSON object"
        ));
      }
    } catch (error) {
      out.push(d(
        "EIDOS_METADATA_JSON",
        "$.metadata",
        error instanceof Error
          ? error.message
          : "metadata is not JSON"
      ));
    }
  }

  if (
    out.length
    || document.contractVersion !== "0.1.1"
    || document.kind !== "form"
    || document.purpose !== "execute-command"
    || !nonEmpty(document.id)
    || !nonEmpty(document.title)
    || !command
  ) {
    return { ok: false, diagnostics: out };
  }

  return {
    ok: true,
    diagnostics: [],
    value: {
      contractVersion: "0.1.1",
      kind: "form",
      id: document.id,
      title: document.title,
      ...(nonEmpty(document.description)
        ? { description: document.description }
        : {}),
      ...(contextNavigation
        ? { contextNavigation }
        : {}),
      purpose: "execute-command",
      command,
      fields,
      actions,
      ...(document.metadata !== undefined
        ? {
            metadata: toJsonSnapshot(document.metadata) as Record<
              string,
              import("./contracts.js").JsonValue
            >
          }
        : {})
    }
  };
}

export function assertValidUidl(document: unknown): UidlFormV011 {
  const result = validateUidl(document);
  if (!result.ok || !result.value) {
    throw new UidlValidationError(result.diagnostics);
  }
  return result.value;
}
