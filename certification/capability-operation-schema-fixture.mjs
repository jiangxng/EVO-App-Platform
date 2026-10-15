/**
 * PA05-02: deliberately bounded, side-effect-free certification fixture.
 *
 * This is NOT a general JSON Schema Draft 2020-12 validator or a Host
 * execution-time guard. It supports explicitly enumerated keywords used by
 * the selected built-in READ plugins. Unknown keywords fail CLOSED so that a
 * test cannot claim conformance to a rule it does not implement.
 */
import { isDeepStrictEqual } from "node:util";

const KEYWORDS = new Set([
  "type", "properties", "required", "additionalProperties",
  "items", "const", "enum", "minLength", "maxLength",
  "minimum", "maximum", "minItems", "maxItems",
  "title", "description"
]);

function record(value) {
  return value !== null && typeof value === "object"
    && !Array.isArray(value);
}

function valueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function matchesType(type, value) {
  if (type === "integer") return typeof value === "number" && Number.isSafeInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "object") return record(value);
  if (type === "array") return Array.isArray(value);
  if (type === "null") return value === null;
  return typeof value === type;
}

const STANDARD_TYPES = new Set([
  "string", "number", "integer", "boolean", "object", "array", "null"
]);

export function certifyCapabilitySchemaValueV010(schema, value, {
  side = "input",
  maxDepth = 12
} = {}) {
  if (side !== "input" && side !== "output") {
    throw new Error("PA05_CERT_SIDE_INVALID");
  }
  const issues = [];
  const add = (code, path) => {
    if (issues.length < 100) issues.push({ code, path });
  };

  function walk(spec, data, path, depth) {
    if (depth > maxDepth) {
      add("PA05_CERT_SCHEMA_DEPTH_EXCEEDED", path);
      return;
    }
    if (!record(spec)) {
      add("PA05_CERT_SCHEMA_NOT_OBJECT", path);
      return;
    }
    for (const keyword of Object.keys(spec)) {
      if (!KEYWORDS.has(keyword)) {
        add("PA05_CERT_SCHEMA_KEYWORD_UNSUPPORTED", path + "." + keyword);
      }
    }
    if (issues.some(issue => issue.code === "PA05_CERT_SCHEMA_KEYWORD_UNSUPPORTED")) {
      return;
    }

    const types = spec.type === undefined ? undefined
      : Array.isArray(spec.type) ? spec.type : [spec.type];
    if (types && (types.length === 0 || types.some(t => !STANDARD_TYPES.has(t)))) {
      add("PA05_CERT_SCHEMA_TYPE_UNSUPPORTED", path + ".type");
      return;
    }
    if (types && !types.some(t => matchesType(t, data))) {
      add("PA05_CERT_VALUE_TYPE", path);
      return;
    }
    if (Object.hasOwn(spec, "const") && !isDeepStrictEqual(data, spec.const)) {
      add("PA05_CERT_VALUE_CONST", path);
    }
    if (spec.enum !== undefined) {
      if (!Array.isArray(spec.enum) || spec.enum.length === 0) {
        add("PA05_CERT_SCHEMA_ENUM_INVALID", path);
      } else if (!spec.enum.some(option => isDeepStrictEqual(option, data))) {
        add("PA05_CERT_VALUE_ENUM", path);
      }
    }

    for (const [keyword, condition, code] of [
      ["minLength", typeof data === "string" && data.length < spec.minLength,
        "PA05_CERT_VALUE_MIN_LENGTH"],
      ["maxLength", typeof data === "string" && data.length > spec.maxLength,
        "PA05_CERT_VALUE_MAX_LENGTH"],
      ["minimum", typeof data === "number" && data < spec.minimum,
        "PA05_CERT_VALUE_MINIMUM"],
      ["maximum", typeof data === "number" && data > spec.maximum,
        "PA05_CERT_VALUE_MAXIMUM"],
      ["minItems", Array.isArray(data) && data.length < spec.minItems,
        "PA05_CERT_VALUE_MIN_ITEMS"],
      ["maxItems", Array.isArray(data) && data.length > spec.maxItems,
        "PA05_CERT_VALUE_MAX_ITEMS"]
    ]) {
      if (spec[keyword] !== undefined) {
        if (typeof spec[keyword] !== "number"
          || !Number.isFinite(spec[keyword]) || spec[keyword] < 0) {
          add("PA05_CERT_SCHEMA_BOUND_INVALID", path + "." + keyword);
        } else if (condition) {
          add(code, path);
        }
      }
    }

    if (spec.required !== undefined && (
      !Array.isArray(spec.required)
      || spec.required.some(key => typeof key !== "string")
    )) {
      add("PA05_CERT_SCHEMA_REQUIRED_INVALID", path);
    }

    if (spec.properties !== undefined && !record(spec.properties)) {
      add("PA05_CERT_SCHEMA_PROPERTIES_INVALID", path);
    }
    if (
      spec.additionalProperties !== undefined
      && typeof spec.additionalProperties !== "boolean"
    ) {
      add("PA05_CERT_SCHEMA_ADDITIONAL_PROPERTIES_UNSUPPORTED", path);
    }

    if (record(data)) {
      for (const key of Array.isArray(spec.required) ? spec.required : []) {
        if (!Object.hasOwn(data, key)) add("PA05_CERT_VALUE_REQUIRED", path + "." + key);
      }
      const props = record(spec.properties) ? spec.properties : {};
      for (const [key, item] of Object.entries(data)) {
        if (Object.hasOwn(props, key)) {
          walk(props[key], item, path + "." + key, depth + 1);
        } else if (spec.additionalProperties === false) {
          add("PA05_CERT_VALUE_ADDITIONAL_PROPERTY", path + "." + key);
        }
      }
    }
    if (spec.items !== undefined && !record(spec.items)) {
      add("PA05_CERT_SCHEMA_ITEMS_UNSUPPORTED", path + ".items");
    }
    if (Array.isArray(data) && record(spec.items)) {
      data.forEach((item, i) => walk(spec.items, item, path + "[" + i + "]", depth + 1));
    }
  }

  walk(schema, value, "$." + side, 0);
  return {
    contractVersion: "0.1.0",
    side,
    ok: issues.length === 0,
    issues
  };
}
