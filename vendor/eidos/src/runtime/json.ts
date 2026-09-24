import type { JsonValue } from "./contracts.js";

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

export function toJsonSnapshot(value: unknown, path = "$", seen = new Set<object>()): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${path}: non-finite number is not JSON`);
    return value;
  }
  if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") {
    throw new Error(`${path}: value is not JSON-serializable`);
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) throw new Error(`${path}: cyclic value`); seen.add(value);
    const out = value.map((item, i) => toJsonSnapshot(item, `${path}[${i}]`, seen)); seen.delete(value); return out;
  }
  if (!isPlainObject(value)) throw new Error(`${path}: only plain JSON objects may cross the runtime boundary`);
  if (seen.has(value)) throw new Error(`${path}: cyclic value`); seen.add(value);
  const out: Record<string, JsonValue> = {};
  for (const key of Object.keys(value).sort()) out[key] = toJsonSnapshot(value[key], `${path}.${key}`, seen);
  seen.delete(value); return out;
}
