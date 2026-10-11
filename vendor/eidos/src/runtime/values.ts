import type {
  Diagnostic,
  JsonValue,
  UidlFileValueV010,
  UidlFormV011,
  ValidationResult
} from "./contracts.js";
import { isPlainObject, toJsonSnapshot } from "./json.js";
import { assertValidUidl } from "./validate.js";

function diag(
  code: string,
  path: string,
  message: string
): Diagnostic {
  return { code, path, message };
}

function empty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function optionEq(a: unknown, b: unknown): boolean {
  return typeof a === typeof b && a === b;
}

function validBase64(value: string): boolean {
  if (value.length === 0 || value.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]*={0,2}$/u.test(value);
}

function validateFileValue(
  value: unknown,
  path: string,
  maxBytes: number | undefined,
  diagnostics: Diagnostic[]
): UidlFileValueV010 | undefined {
  if (!isPlainObject(value)) {
    diagnostics.push(diag(
      "EIDOS_FILE_VALUE_TYPE",
      path,
      "file requires an encoded file object"
    ));
    return;
  }

  const allowed = new Set([
    "name",
    "mediaType",
    "size",
    "contentBase64"
  ]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      diagnostics.push(diag(
        "EIDOS_FILE_VALUE_PROPERTY",
        `${path}.${key}`,
        `Unknown file property '${key}'`
      ));
    }
  }

  const name = typeof value.name === "string"
    ? value.name.trim()
    : "";
  const mediaType = typeof value.mediaType === "string"
    ? value.mediaType.trim()
    : "";
  const size = value.size;
  const contentBase64 = value.contentBase64;

  if (!name) {
    diagnostics.push(diag(
      "EIDOS_FILE_NAME_REQUIRED",
      `${path}.name`,
      "file name is required"
    ));
  }
  if (!mediaType) {
    diagnostics.push(diag(
      "EIDOS_FILE_MEDIA_TYPE_REQUIRED",
      `${path}.mediaType`,
      "file media type is required"
    ));
  }
  if (
    typeof size !== "number"
    || !Number.isInteger(size)
    || size < 0
  ) {
    diagnostics.push(diag(
      "EIDOS_FILE_SIZE_INVALID",
      `${path}.size`,
      "file size must be a non-negative integer"
    ));
  }
  if (
    typeof contentBase64 !== "string"
    || !validBase64(contentBase64)
  ) {
    diagnostics.push(diag(
      "EIDOS_FILE_BASE64_INVALID",
      `${path}.contentBase64`,
      "file contentBase64 must be valid base64"
    ));
  }
  if (
    typeof size === "number"
    && maxBytes !== undefined
    && size > maxBytes
  ) {
    diagnostics.push(diag(
      "EIDOS_FILE_TOO_LARGE",
      path,
      `file exceeds maxBytes ${maxBytes}`
    ));
  }

  if (
    !name
    || !mediaType
    || typeof size !== "number"
    || !Number.isInteger(size)
    || size < 0
    || typeof contentBase64 !== "string"
    || !validBase64(contentBase64)
  ) {
    return;
  }

  return {
    name,
    mediaType,
    size,
    contentBase64
  };
}

export function validateValues(
  document: unknown,
  values: unknown
): ValidationResult<Record<string, JsonValue>> {
  const doc: UidlFormV011 = assertValidUidl(document);
  const diagnostics: Diagnostic[] = [];

  if (!isPlainObject(values)) {
    return {
      ok: false,
      diagnostics: [diag(
        "EIDOS_VALUES_TYPE",
        "$values",
        "values must be a plain object"
      )]
    };
  }

  const allowed = new Set(doc.fields.map(field => field.key));
  for (const key of Object.keys(values)) {
    if (!allowed.has(key)) {
      diagnostics.push(diag(
        "EIDOS_VALUE_UNKNOWN",
        `$values.${key}`,
        `Unknown field '${key}'`
      ));
    }
  }

  const out: Record<string, JsonValue> = {};

  for (const field of doc.fields) {
    const value = values[field.key];

    if (field.required && empty(value)) {
      diagnostics.push(diag(
        "EIDOS_VALUE_REQUIRED",
        `$values.${field.key}`,
        `Required field missing: ${field.key}`
      ));
      continue;
    }
    if (empty(value)) continue;

    if (field.readOnly) {
      diagnostics.push(diag(
        "EIDOS_VALUE_READONLY",
        `$values.${field.key}`,
        `Read-only field '${field.key}' may not be supplied by user values`
      ));
      continue;
    }

    if (
      (field.control === "number" || field.control === "money")
      && typeof value !== "number"
    ) {
      diagnostics.push(diag(
        "EIDOS_VALUE_TYPE",
        `$values.${field.key}`,
        `${field.control} requires a number`
      ));
    }

    if (
      (
        field.control === "text"
        || field.control === "reference"
        || field.control === "date"
      )
      && typeof value !== "string"
    ) {
      diagnostics.push(diag(
        "EIDOS_VALUE_TYPE",
        `$values.${field.key}`,
        `${field.control} requires a string`
      ));
    }

    if (field.control === "file") {
      const file = validateFileValue(
        value,
        `$values.${field.key}`,
        field.maxBytes,
        diagnostics
      );
      if (file) {
        out[field.key] = toJsonSnapshot(file);
      }
      continue;
    }

    if (
      typeof value === "number"
      && field.validation?.min !== undefined
      && value < field.validation.min
    ) {
      diagnostics.push(diag(
        "EIDOS_VALUE_MIN",
        `$values.${field.key}`,
        `Value is below min ${field.validation.min}`
      ));
    }

    if (
      typeof value === "number"
      && field.validation?.max !== undefined
      && value > field.validation.max
    ) {
      diagnostics.push(diag(
        "EIDOS_VALUE_MAX",
        `$values.${field.key}`,
        `Value exceeds max ${field.validation.max}`
      ));
    }

    if (
      typeof value === "string"
      && field.validation?.pattern
      && !new RegExp(field.validation.pattern).test(value)
    ) {
      diagnostics.push(diag(
        "EIDOS_VALUE_PATTERN",
        `$values.${field.key}`,
        "Value does not match declared pattern"
      ));
    }

    if (
      field.control === "select"
      && !field.options?.some(option => optionEq(option.value, value))
    ) {
      diagnostics.push(diag(
        "EIDOS_VALUE_OPTION",
        `$values.${field.key}`,
        "Value is not one of the declared options"
      ));
    }

    try {
      out[field.key] = toJsonSnapshot(value);
    } catch (error) {
      diagnostics.push(diag(
        "EIDOS_VALUE_JSON",
        `$values.${field.key}`,
        error instanceof Error
          ? error.message
          : "Value is not JSON"
      ));
    }
  }

  return diagnostics.length
    ? { ok: false, diagnostics }
    : { ok: true, diagnostics: [], value: out };
}
