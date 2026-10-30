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
  "reviewGroups",
  "reviewTable",
  "reviewTask",
  "reviewPlan",
  "actions",
  "metadata"
]);
const fieldKeys = new Set([
  "key",
  "label",
  "semanticType",
  "control",
  "required",
  "hidden",
  "readOnly",
  "initialValue",
  "unit",
  "options",
  "accept",
  "maxBytes",
  "validation",
  "contextLink",
  "exclusiveSelect"
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
    hidden,
    readOnly,
    initialValue,
    unit,
    options,
    accept,
    maxBytes,
    validation,
    contextLink,
    exclusiveSelect
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
  if (hidden !== undefined && typeof hidden !== "boolean") {
    out.push(d(
      "EIDOS_SCHEMA_TYPE",
      `${path}.hidden`,
      "hidden must be boolean"
    ));
  }
  if (hidden === true && (
    !["string", "number", "boolean"].includes(typeof initialValue)
    || control === "file"
    || contextLink !== undefined
  )) {
    out.push(d(
      "EIDOS_HIDDEN_FIELD_VALUE_INVALID",
      path,
      "Hidden fields require a primitive initialValue and cannot be file inputs or include context links"
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

  let parsedContextLink: UidlField["contextLink"];
  if (contextLink !== undefined) {
    if (!isPlainObject(contextLink)) {
      out.push(d("EIDOS_FIELD_CONTEXT_LINK_INVALID", `${path}.contextLink`, "Context link must be object"));
    } else {
      extraKeys(contextLink, new Set(["label", "route"]), `${path}.contextLink`, out);
      const linkLabel = contextLink.label;
      const route = contextLink.route;
      if (!nonEmpty(linkLabel) || !linkLabel.trim()
        || typeof route !== "string" || !route.startsWith("/")
        || route.startsWith("//") || route.includes("\\")
        || route.length > 2048) {
        out.push(d("EIDOS_FIELD_CONTEXT_LINK_INVALID", `${path}.contextLink`, "Context link requires a label and a local route"));
      } else {
        parsedContextLink = {label:linkLabel,route};
      }
    }
  }

  let parsedExclusiveSelect: UidlField["exclusiveSelect"];
  if (exclusiveSelect !== undefined) {
    if (!isPlainObject(exclusiveSelect)) {
      out.push(d("EIDOS_EXCLUSIVE_SELECT_INVALID", `${path}.exclusiveSelect`, "exclusiveSelect must be object"));
    } else {
      extraKeys(exclusiveSelect, new Set(["group", "exemptValues", "occupiedLabel"]), `${path}.exclusiveSelect`, out);
      const group=exclusiveSelect.group;
      const exempt=exclusiveSelect.exemptValues;
      const occupiedLabel=exclusiveSelect.occupiedLabel;
      if (control !== "select" || !nonEmpty(group) || !group.trim()
        || !Array.isArray(exempt) || exempt.some(item=>typeof item!=="string")
        || (occupiedLabel !== undefined && (!nonEmpty(occupiedLabel) || !occupiedLabel.trim()))) {
        out.push(d("EIDOS_EXCLUSIVE_SELECT_INVALID", `${path}.exclusiveSelect`, "Select requires a group and string exempt values"));
      } else {
        parsedExclusiveSelect={group,exemptValues:[...new Set(exempt)],
          ...(occupiedLabel === undefined ? {} : {occupiedLabel})};
      }
    }
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
    ...(typeof hidden === "boolean" ? { hidden } : {}),
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
    ...(parsedValidation ? { validation: parsedValidation } : {}),
    ...(parsedContextLink ? { contextLink: parsedContextLink } : {}),
    ...(parsedExclusiveSelect ? { exclusiveSelect: parsedExclusiveSelect } : {})
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

  const reviewGroups: import("./contracts.js").UidlFormReviewGroupV010[] = [];
  if (document.reviewGroups !== undefined) {
    if (!Array.isArray(document.reviewGroups)) {
      out.push(d("EIDOS_REVIEW_GROUPS_INVALID", "$.reviewGroups", "reviewGroups must be an array"));
    } else {
      const ids = new Set<string>(), used = new Set<string>();
      document.reviewGroups.forEach((group, index) => {
        const path = "$.reviewGroups[" + index + "]";
        if (!isPlainObject(group)) {
          out.push(d("EIDOS_REVIEW_GROUP_INVALID", path, "Group must be an object"));
          return;
        }
        extraKeys(group, new Set([
          "id", "title", "summary", "primaryFieldKey",
          "detailFieldKeys", "detailsLabel", "defaultExpanded", "reviewStatus",
          "statusByChoice"
        ]), path, out);
        if (!nonEmpty(group.id) || !group.id.trim()
          || !nonEmpty(group.title) || !group.title.trim()
          || !nonEmpty(group.primaryFieldKey)
          || !Array.isArray(group.detailFieldKeys)
          || !group.detailFieldKeys.every(nonEmpty)
          || group.summary !== undefined && typeof group.summary !== "string"
          || group.detailsLabel !== undefined && !nonEmpty(group.detailsLabel)
          || group.defaultExpanded !== undefined
            && typeof group.defaultExpanded !== "boolean"
          || group.reviewStatus !== undefined
            && (!isPlainObject(group.reviewStatus)
              || !nonEmpty(group.reviewStatus.key)
              || !/^[A-Za-z0-9._:-]{1,80}$/.test(group.reviewStatus.key)
              || !nonEmpty(group.reviewStatus.label)
              || group.reviewStatus.tone !== undefined
                && !["neutral","warning","positive"].includes(group.reviewStatus.tone as string))) {
          out.push(d("EIDOS_REVIEW_GROUP_INVALID", path, "Group requires id, title, primary field and detail field keys"));
          return;
        }
        if (ids.has(group.id)) {
          out.push(d("EIDOS_REVIEW_GROUP_DUPLICATE", path + ".id", "Duplicate group ID"));
        }
        ids.add(group.id);
        const refs = [group.primaryFieldKey, ...group.detailFieldKeys];
        for (const key of refs) {
          if (!fieldKeysSeen.has(key)) {
            out.push(d("EIDOS_REVIEW_GROUP_FIELD_MISSING", path, "Unknown field key: " + key));
          }
          if (used.has(key)) {
            out.push(d("EIDOS_REVIEW_GROUP_FIELD_REUSED", path, "Field belongs to multiple group slots: " + key));
          }
          used.add(key);
        }
        if (isPlainObject(group.reviewStatus)) {
          extraKeys(group.reviewStatus, new Set(["key","label","tone"]),
            path + ".reviewStatus",out);
        }
        let statusByChoice: import("./contracts.js").UidlFormReviewGroupV010["statusByChoice"];
        if (group.statusByChoice !== undefined) {
          const primary = fields.find(field => field.key === group.primaryFieldKey);
          const choices = new Set((primary?.options ?? []).map(option => String(option.value)));
          const entries = isPlainObject(group.statusByChoice)
            ? Object.entries(group.statusByChoice) : [];
          if (primary?.control !== "select" || entries.length < 1
            || entries.length > 300 || entries.some(([value,status]) =>
              !choices.has(value) || !isPlainObject(status)
              || !nonEmpty(status.key)
              || !/^[A-Za-z0-9._:-]{1,80}$/.test(status.key)
              || !nonEmpty(status.label)
              || status.tone !== undefined
                && !["neutral","warning","positive"].includes(status.tone as string))) {
            out.push(d("EIDOS_REVIEW_STATUS_BY_CHOICE_INVALID",
              path + ".statusByChoice",
              "Choice states require a select and bounded, real option values"));
          } else {
            for (const [value,status] of entries) {
              extraKeys(status as Record<string,unknown>,new Set(["key","label","tone"]),
                path + ".statusByChoice." + value,out);
            }
            statusByChoice=Object.fromEntries(entries.map(([value,raw]) => {
              const status=raw as {key:string;label:string;tone?:"neutral"|"warning"|"positive"};
              return [value,{key:status.key,label:status.label,
                ...(status.tone ? {tone:status.tone} : {})}];
            }));
          }
        }
        reviewGroups.push({
          id:group.id,title:group.title,
          ...(typeof group.summary === "string" ? {summary:group.summary} : {}),
          primaryFieldKey:group.primaryFieldKey,
          detailFieldKeys:[...group.detailFieldKeys],
          ...(typeof group.detailsLabel === "string" ? {detailsLabel:group.detailsLabel} : {}),
          ...(typeof group.defaultExpanded === "boolean" ? {defaultExpanded:group.defaultExpanded} : {}),
          ...(isPlainObject(group.reviewStatus)
            && typeof group.reviewStatus.key === "string"
            && typeof group.reviewStatus.label === "string"
            ? {reviewStatus:{
                key:group.reviewStatus.key,label:group.reviewStatus.label,
                ...(typeof group.reviewStatus.tone === "string"
                  ? {tone:group.reviewStatus.tone as "neutral"|"warning"|"positive"}
                  : {})
              }} : {}),
          ...(statusByChoice ? {statusByChoice} : {})
        });
      });
    }
  }

  let reviewTable: import("./contracts.js").UidlFormReviewTableV010 | undefined;
  if (document.reviewTable !== undefined) {
    const p = "$.reviewTable";
    const table = document.reviewTable;
    if (!isPlainObject(table) || !isPlainObject(table.columnLabels)
      || !["subject","evidence","decision","status"].every(k =>
        isPlainObject(table.columnLabels)
        && nonEmpty(table.columnLabels[k]) && table.columnLabels[k].trim().length > 0)
      || reviewGroups.length === 0
      || reviewGroups.some(g => !g.reviewStatus?.key?.trim()
        || !g.reviewStatus.label?.trim())) {
      out.push(d("EIDOS_REVIEW_TABLE_INVALID",p,
        "Review table needs headings and fully annotated review groups"));
    } else {
      extraKeys(table, new Set(["columnLabels","filter","presentation","evidenceLayout","heading","toolbarHint","footnote","agentActionId","utilityNavigation"]),p,out);
      for(const [key,max] of [["toolbarHint",240],["footnote",400]] as const){
        const value=table[key];
        if(value!==undefined && (!nonEmpty(value) || value.length>max)){
          out.push(d("EIDOS_REVIEW_TABLE_GUIDANCE_INVALID",p+"."+key,
            "Guidance must be a bounded, nonempty string"));
        }
      }
      if (table.heading !== undefined) {
        if (!isPlainObject(table.heading)
          || !nonEmpty(table.heading.title)
          || table.heading.title.length > 120
          || table.heading.description !== undefined
            && (typeof table.heading.description !== "string"
              || table.heading.description.length > 600)) {
          out.push(d("EIDOS_REVIEW_TABLE_HEADING_INVALID",p+".heading",
            "Heading requires a bounded nonempty title and optional description"));
        } else {
          extraKeys(table.heading,new Set(["title","description"]),p+".heading",out);
        }
      }
      if (table.presentation !== undefined
        && (!nonEmpty(table.presentation)
          || !["standard","compact","confirmation"].includes(table.presentation))) {
        out.push(d("EIDOS_REVIEW_TABLE_PRESENTATION_INVALID",p+".presentation",
          "Review-table presentation must be standard, compact or confirmation"));
      }
      if (table.evidenceLayout !== undefined
        && (typeof table.evidenceLayout !== "string"
          || !["stacked","inline-collapsed"].includes(table.evidenceLayout)
          || table.evidenceLayout==="inline-collapsed" && table.presentation!=="compact")) {
        out.push(d("EIDOS_REVIEW_TABLE_EVIDENCE_LAYOUT_INVALID",p+".evidenceLayout",
          "Inline collapsed evidence requires compact presentation"));
      }
      extraKeys(table.columnLabels,
        new Set(["subject","evidence","decision","status"]),p+".columnLabels",out);
      const labels = table.columnLabels as Record<"subject"|"evidence"|"decision"|"status",string>;
      let filter: import("./contracts.js").UidlFormReviewTableV010["filter"];
      if (table.filter !== undefined) {
        const f = table.filter;
        const keys = new Set(reviewGroups.flatMap(group => [
          group.reviewStatus!.key,
          ...Object.values(group.statusByChoice ?? {}).map(status => status.key)
        ]));
        if (!isPlainObject(f) || !nonEmpty(f.label)
          || !nonEmpty(f.selectedId) || !nonEmpty(f.noMatchesMessage)
          || !Array.isArray(f.options) || f.options.length===0
          || f.options.length>8) {
          out.push(d("EIDOS_REVIEW_TABLE_FILTER_INVALID",p+".filter",
            "Review table filter requires a bounded choice set"));
        } else {
          extraKeys(f,new Set(["label","selectedId","noMatchesMessage","options"]),
            p+".filter",out);
          const ids = new Set<string>(), options: NonNullable<
            import("./contracts.js").UidlFormReviewTableV010["filter"]
          >["options"] = [];
          const primaryChoices = new Set(reviewGroups.flatMap(group=>{
            const field=fields.find(item=>item.key===group.primaryFieldKey);
            return field?.control==="select"
              ? (field.options??[]).map(option=>String(option.value)) : [];
          }));
          let all = false;
          f.options.forEach((raw:unknown,i:number)=>{
            if (!isPlainObject(raw) || !nonEmpty(raw.id) || !raw.id.trim()
              || !nonEmpty(raw.label) || !raw.label.trim()
              || !Array.isArray(raw.statusKeys) || raw.statusKeys.length===0
              || raw.statusKeys.some((k:unknown)=>typeof k!=="string"||!keys.has(k))
              || new Set(raw.statusKeys).size!==raw.statusKeys.length
              || raw.choiceValues!==undefined
                && (!Array.isArray(raw.choiceValues)
                  || raw.choiceValues.length===0 || raw.choiceValues.length>12
                  || raw.choiceValues.some((value:unknown)=>
                    typeof value!=="string" || !primaryChoices.has(value))
                  || new Set(raw.choiceValues).size!==raw.choiceValues.length)
              || ids.has(raw.id)) {
              out.push(d("EIDOS_REVIEW_TABLE_FILTER_INVALID",
                p+".filter.options["+i+"]","Invalid or duplicated filter option"));
              return;
            }
            extraKeys(raw,new Set(["id","label","statusKeys","choiceValues"]),
              p+".filter.options["+i+"]",out);
            ids.add(raw.id);
            const statusKeys = [...raw.statusKeys] as string[];
            const choiceValues = raw.choiceValues===undefined
              ? undefined : [...raw.choiceValues] as string[];
            options.push({id:raw.id,label:raw.label,statusKeys,
              ...(choiceValues ? {choiceValues} : {})});
            if (!choiceValues && [...keys].every(k=>statusKeys.includes(k))) all=true;
          });
          if (!ids.has(f.selectedId) || !all) {
            out.push(d("EIDOS_REVIEW_TABLE_FILTER_ALL_MISSING",p+".filter",
              "Review table must provide a full-data option and a valid initial choice"));
          }
          filter={label:f.label,selectedId:f.selectedId,
            noMatchesMessage:f.noMatchesMessage,options};
        }
      }
      if (table.agentActionId !== undefined
        && (!nonEmpty(table.agentActionId)
          || table.agentActionId.length > 128)) {
        out.push(d("EIDOS_REVIEW_TABLE_AGENT_ACTION_INVALID",p+".agentActionId",
          "Toolbar agent action requires an existing action ID"));
      }
      let utilityNavigation:import("./contracts.js").UidlFormReviewTableV010["utilityNavigation"];
      if(table.utilityNavigation!==undefined){
        const nav=table.utilityNavigation;
        if(!isPlainObject(nav) || !nonEmpty(nav.label) || nav.label.length>64
          || !Array.isArray(nav.items) || nav.items.length<1
          || nav.items.length>3){
          out.push(d("EIDOS_REVIEW_TABLE_UTILITY_INVALID",p+".utilityNavigation",
            "Secondary navigation needs a bounded label and 1-3 internal routes"));
        }else{
          extraKeys(nav,new Set(["label","items"]),p+".utilityNavigation",out);
          const ids=new Set<string>();
          const items:{id:string;label:string;route:string}[]=[];
          for(const [index,raw] of nav.items.entries()){
            const at=p+".utilityNavigation.items["+index+"]";
            if(!isPlainObject(raw) || !nonEmpty(raw.id) || raw.id.length>80
              || ids.has(raw.id) || !nonEmpty(raw.label) || raw.label.length>150
              || !nonEmpty(raw.route) || raw.route.length>1024
              || !raw.route.startsWith("/") || raw.route.startsWith("//")
              || raw.route.includes("#") || raw.route.includes("\\")
              || raw.route.includes(String.fromCharCode(10))
              || raw.route.includes(String.fromCharCode(13))){
              out.push(d("EIDOS_REVIEW_TABLE_UTILITY_INVALID",at,
                "Only unique, bounded Host-internal navigation is allowed"));
            }else{
              extraKeys(raw,new Set(["id","label","route"]),at,out);
              ids.add(raw.id);
              items.push({id:raw.id,label:raw.label,route:raw.route});
            }
          }
          if(items.length===nav.items.length){
            utilityNavigation={label:nav.label,items};
          }
        }
      }
      reviewTable={
        ...(utilityNavigation ? {utilityNavigation} : {}),
        ...(nonEmpty(table.agentActionId) && table.agentActionId.length <= 128
          ? {agentActionId:table.agentActionId} : {}),
        ...(typeof table.toolbarHint==="string" && table.toolbarHint.trim()
          && table.toolbarHint.length<=240 ? {toolbarHint:table.toolbarHint} : {}),
        ...(typeof table.footnote==="string" && table.footnote.trim()
          && table.footnote.length<=400 ? {footnote:table.footnote} : {}),
        ...(isPlainObject(table.heading) && nonEmpty(table.heading.title)
          && table.heading.title.length <= 120
          && (table.heading.description === undefined
            || typeof table.heading.description === "string"
              && table.heading.description.length <= 600)
          ? {heading:{title:table.heading.title,
              ...(typeof table.heading.description === "string"
                ? {description:table.heading.description} : {})}} : {}),
        ...(table.presentation==="compact" || table.presentation==="standard"
          || table.presentation==="confirmation"
          ? {presentation:table.presentation} : {}),
        ...(table.evidenceLayout==="stacked" || table.evidenceLayout==="inline-collapsed"
          ? {evidenceLayout:table.evidenceLayout} : {}),
        columnLabels:{
          subject:labels.subject,evidence:labels.evidence,
          decision:labels.decision,status:labels.status
        },
        ...(filter ? {filter} : {})
      };
    }
  }

  let reviewPlan: import("./contracts.js").UidlFormReviewPlanV010 | undefined;
  if (document.reviewPlan !== undefined) {
    const raw=document.reviewPlan, path="$.reviewPlan";
    const fail=(reason:string)=>out.push(d("EIDOS_REVIEW_PLAN_INVALID",path,reason));
    const possible=new Set(reviewGroups.flatMap(group=>[
      group.reviewStatus?.key ?? "",
      ...Object.values(group.statusByChoice ?? {}).map(status=>status.key)
    ]).filter(Boolean));
    if (!reviewTable || !isPlainObject(raw)
      || !nonEmpty(raw.title) || !nonEmpty(raw.warning)
      || raw.description !== undefined && typeof raw.description !== "string"
      || !Array.isArray(raw.categories) || raw.categories.length<2
      || raw.categories.length>8 || possible.size===0) {
      fail("Plan needs a review table, title, warning and bounded status categories");
    } else {
      extraKeys(raw,new Set(["title","description","warning","categories","proposedFields"]),path,out);
      const categories: NonNullable<typeof reviewPlan>["categories"]=[];
      const allKeys=new Set<string>(), ids=new Set<string>();
      for (const [index,c] of raw.categories.entries()) {
        const at=path+".categories["+index+"]";
        if (!isPlainObject(c) || !nonEmpty(c.id) || !nonEmpty(c.label)
          || ids.has(c.id) || !Array.isArray(c.statusKeys)
          || c.statusKeys.some(k=>
            typeof k!=="string" || !possible.has(k) || allKeys.has(k))) {
          out.push(d("EIDOS_REVIEW_PLAN_INVALID",at,
            "Each category must have a unique ID and unique, real status keys"));
          continue;
        }
        extraKeys(c,new Set(["id","label","statusKeys"]),at,out);
        ids.add(c.id);
        c.statusKeys.forEach((k:string)=>allKeys.add(k));
        categories.push({id:c.id,label:c.label,statusKeys:[...c.statusKeys]});
      }
      if ([...possible].some(k=>!allKeys.has(k))) {
        fail("All reachable statuses need a preview outcome");
      }
      const proposedFields: NonNullable<typeof reviewPlan>["proposedFields"]=[];
      if (raw.proposedFields !== undefined) {
        if (!Array.isArray(raw.proposedFields) || raw.proposedFields.length>200) {
          fail("Proposed field list must be bounded");
        } else {
          const included=new Set<string>();
          raw.proposedFields.forEach((v:unknown,i:number)=>{
            const at=path+".proposedFields["+i+"]";
            if (!isPlainObject(v) || !nonEmpty(v.groupId)
              || !nonEmpty(v.labelFieldKey) || !nonEmpty(v.typeFieldKey)
              || included.has(v.groupId)) {
              out.push(d("EIDOS_REVIEW_PLAN_INVALID",at,"Invalid group/field references"));return;
            }
            extraKeys(v,new Set(["groupId","labelFieldKey","typeFieldKey"]),at,out);
            const group=reviewGroups.find(g=>g.id===v.groupId);
            const label=fields.find(f=>f.key===v.labelFieldKey);
            const type=fields.find(f=>f.key===v.typeFieldKey);
            if (!group || !group.detailFieldKeys.includes(v.labelFieldKey)
              || !group.detailFieldKeys.includes(v.typeFieldKey)
              || !label || label.control!=="text" || label.readOnly
              || !type || type.control!=="select" || type.readOnly) {
              out.push(d("EIDOS_REVIEW_PLAN_INVALID",at,"Proposal keys must be editable fields in the same group"));
              return;
            }
            included.add(v.groupId);
            proposedFields.push({groupId:v.groupId,
              labelFieldKey:v.labelFieldKey,typeFieldKey:v.typeFieldKey});
          });
        }
      }
      if (categories.length===raw.categories.length
        && [...possible].every(k=>allKeys.has(k))) {
        reviewPlan={title:raw.title,warning:raw.warning,
          ...(typeof raw.description==="string"?{description:raw.description}:{}),
          categories,
          ...(proposedFields.length?{proposedFields}:{})};
      }
    }
  }

  let reviewTask: import("./contracts.js").UidlFormReviewTaskV010 | undefined;
  if (document.reviewTask !== undefined) {
    const task = document.reviewTask, path = "$.reviewTask";
    let invalid = false;
    const fail = (part: string, msg: string) => {
      invalid = true;
      out.push(d("EIDOS_REVIEW_TASK_INVALID", part, msg));
    };
    if (!isPlainObject(task) || !isPlainObject(task.subject)
      || !nonEmpty(task.subject.title) || !task.subject.title.trim()) {
      fail(path, "Review task requires a subject title");
    } else {
      extraKeys(task, new Set(["subject","steps","metrics","issuesTitle",
        "issuesDescription","issues","issuesCountSuffix","issuesLayout","issuesPageSize","helpText","presentation","footer"]),path,out);
      if (task.presentation !== undefined
        && (typeof task.presentation !== "string"
          || !["full","decision-first","workbench"].includes(task.presentation))) {
        fail(path+".presentation","Unknown review task presentation mode");
      }
      if (task.issuesPageSize !== undefined
        && (task.presentation !== "workbench"
          || task.issuesPageSize !== 12
          || !Array.isArray(task.issues)
          || task.issues.length === 0)) {
        fail(path+".issuesPageSize",
          "Issue pagination requires a nonempty workbench list in groups of twelve");
      }
      if (task.issuesLayout !== undefined
        && (task.presentation !== "workbench"
          || task.issuesLayout !== "connected"
          || !Array.isArray(task.issues) || task.issues.length === 0)) {
        fail(path+".issuesLayout",
          "Connected issues need a nonempty opt-in workbench issue list");
      }
      extraKeys(task.subject,new Set(["title","subtitle","statusLabel","statusTone","iconLabel","facts"]),
        path+".subject",out);
      if ((task.subject.subtitle !== undefined && typeof task.subject.subtitle !== "string")
        || (task.subject.statusLabel !== undefined
          && typeof task.subject.statusLabel !== "string")) {
        fail(path+".subject","Subject copy must be text");
      }
      if (task.subject.statusTone !== undefined
        && (typeof task.subject.statusTone !== "string"
          || !["neutral","positive","warning"].includes(task.subject.statusTone)
          || !nonEmpty(task.subject.statusLabel))) {
        fail(path+".subject.statusTone",
          "Source status tone needs a visible status label and known semantic tone");
      }
      if (task.subject.iconLabel !== undefined
        && (typeof task.subject.iconLabel !== "string"
          || !task.subject.iconLabel.trim()
          || task.subject.iconLabel.trim().length > 8)) {
        fail(path+".subject.iconLabel","Decorative iconLabel must have 1-8 characters");
      }
      if (task.footer !== undefined) {
        if (task.presentation !== "workbench" || !isPlainObject(task.footer)) {
          fail(path+".footer","Footer controls require a workbench task");
        } else {
          extraKeys(task.footer,new Set(["back","resetLabel","saveHint"]),path+".footer",out);
          if (task.footer.back !== undefined
            && (!isPlainObject(task.footer.back)
              || !nonEmpty(task.footer.back.label)
              || typeof task.footer.back.route !== "string"
              || !task.footer.back.route.startsWith("/")
              || task.footer.back.route.startsWith("//")
              || task.footer.back.route.includes(String.fromCharCode(10))
              || task.footer.back.route.includes(String.fromCharCode(13)))) {
            fail(path+".footer.back","Back requires a labeled internal route");
          } else if (isPlainObject(task.footer.back)) {
            extraKeys(task.footer.back,new Set(["label","route"]),path+".footer.back",out);
          }
          for (const key of ["resetLabel","saveHint"]) {
            const value=task.footer[key];
            if (value !== undefined && !nonEmpty(value)) {
              fail(path+".footer."+key,"Footer text must be nonempty");
            }
          }
        }
      }
      const checkIds = (items: unknown, pathName: string, max: number,
        predicate: (item:Record<string,unknown>,at:string)=>boolean) => {
        if (items === undefined) return;
        if (!Array.isArray(items) || items.length>max) {
          fail(pathName,"Review task collection is not a bounded array");return;
        }
        const ids=new Set<string>();
        items.forEach((raw:unknown,index:number)=>{
          const at=pathName+"["+index+"]";
          if (!isPlainObject(raw) || !nonEmpty(raw.id) || !raw.id.trim()
            || ids.has(raw.id) || !predicate(raw,at)) {
            fail(at,"Review task item has missing, duplicate or invalid fields");
          } else ids.add(raw.id);
        });
      };
      checkIds(task.subject.facts,path+".subject.facts",8,(item,at)=>{
        extraKeys(item,new Set(["id","label","value"]),at,out);
        return nonEmpty(item.label) && typeof item.value==="string";
      });
      checkIds(task.steps,path+".steps",6,(item,at)=>{
        extraKeys(item,new Set(["id","label","state"]),at,out);
        return nonEmpty(item.label)
          && ["complete","current","upcoming"].includes(item.state as string);
      });
      if (Array.isArray(task.steps) && task.steps.length
        && task.steps.filter((step:unknown)=>isPlainObject(step)
          && step.state==="current").length !== 1) {
        fail(path+".steps","Exactly one step must be current");
      }
      checkIds(task.metrics,path+".metrics",8,(item,at)=>{
        extraKeys(item,new Set(["id","label","value","tone","reactive"]),at,out);
        return nonEmpty(item.label) && typeof item.value==="string"
          && (item.reactive===undefined || typeof item.reactive==="boolean")
          && (item.tone===undefined
            || ["neutral","positive","warning","danger"].includes(item.tone as string));
      });
      // Existing workbenches remain capped at 12. Opt-in pages may retain
      // the full issue catalog up to a bounded 4096 entries; above this,
      // validation must fail instead of silently dropping outstanding tasks.
      checkIds(task.issues,path+".issues",task.issuesPageSize===12?4096:12,(item,at)=>{
        extraKeys(item,new Set(["id","title","description",
          "focusGroupId","actionLabel","relatedRoutes"]),at,out);
        return nonEmpty(item.title)
          && (item.description===undefined || typeof item.description==="string")
          && (item.focusGroupId===undefined
            || nonEmpty(item.focusGroupId)
              && reviewGroups.some(group=>group.id===item.focusGroupId))
          && (item.actionLabel===undefined || nonEmpty(item.actionLabel))
          && (item.actionLabel===undefined
            || item.focusGroupId!==undefined || item.relatedRoutes!==undefined)
          && (item.relatedRoutes===undefined || Array.isArray(item.relatedRoutes)
            && item.relatedRoutes.length>=1 && item.relatedRoutes.length<=8
            && item.relatedRoutes.every((raw:unknown)=>isPlainObject(raw)
              && nonEmpty(raw.label) && raw.label.length<=80
              && typeof raw.route==="string" && raw.route.length<=360
              && raw.route.startsWith("/") && !raw.route.startsWith("//")
              && !raw.route.includes(String.fromCharCode(10))
              && !raw.route.includes(String.fromCharCode(13)))
            && new Set(item.relatedRoutes.map((v:{route:string})=>v.route)).size
              === item.relatedRoutes.length);
      });
      if (task.issuesCountSuffix !== undefined
        && (task.presentation !== "workbench"
          || !nonEmpty(task.issuesCountSuffix)
          || task.issuesCountSuffix.trim().length > 32
          || !Array.isArray(task.issues) || task.issues.length === 0)) {
        fail(path+".issuesCountSuffix",
          "Issue count badge needs nonempty workbench issues and a bounded suffix");
      }
      for (const key of ["issuesTitle","issuesDescription","helpText"] as const) {
        if (task[key]!==undefined && typeof task[key]!=="string") {
          fail(path+"."+key,"Review task copy must be text");
        }
      }
      if (!invalid) {
        reviewTask = structuredClone(task) as unknown as import("./contracts.js").UidlFormReviewTaskV010;
      }
    }
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

  if(reviewTable?.agentActionId && !actions.some(action=>
    action.type === "agent" && action.id === reviewTable.agentActionId)){
    out.push(d("EIDOS_REVIEW_TABLE_AGENT_ACTION_INVALID",
      "$.reviewTable.agentActionId",
      "Toolbar action must reference a declared Agent action"));
  }
  const submits = actions.filter(action => action.type === "submit");
  if (submits.length < 1 || submits.length > 3) {
    out.push(d("EIDOS_SUBMIT_CARDINALITY", "$.actions",
      `One to three declared submit actions are allowed; found ${submits.length}`));
  }
  if (command && submits[0]?.command && submits[0].command !== command.code) {
    out.push(d("EIDOS_COMMAND_MISMATCH", "$.actions",
      "Primary submit command must match document command.code"));
  }
  for (const [index,action] of submits.entries()) {
    if (index > 0 && !action.command) {
      out.push(d("EIDOS_ADDITIONAL_SUBMIT_COMMAND_REQUIRED",
        "$.actions", "Every secondary submit requires an explicit command"));
    }
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
      ...(document.reviewGroups !== undefined ? {reviewGroups} : {}),
      ...(reviewTable ? {reviewTable} : {}),
      ...(reviewTask ? {reviewTask} : {}),
      ...(reviewPlan ? {reviewPlan} : {}),
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
