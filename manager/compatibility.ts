import type {
  PackageManifestV010,
  PluginCompatibilityV010
} from "../contracts/package.js";
import { EVO_PLUGIN_PROTOCOL_VERSION } from "../contracts/plugin-protocol.js";

export const EVO_APP_PLATFORM_VERSION = "0.1.0" as const;
export const EIDOS_HOST_VERSION = "1.3.0" as const;

interface VersionTriple {
  major: number;
  minor: number;
  patch: number;
}

function parseVersion(value: string): VersionTriple | undefined {
  const match = value.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function compare(a: VersionTriple, b: VersionTriple): number {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

export function compareSemanticVersionsV010(
  left: string,
  right: string
): number | undefined {
  const a = parseVersion(left);
  const b = parseVersion(right);
  return a && b ? compare(a, b) : undefined;
}

function satisfiesComparator(version: VersionTriple, expression: string): boolean {
  const trimmed = expression.trim();
  if (!trimmed || trimmed === "*") return true;

  if (trimmed.startsWith("^")) {
    const base = parseVersion(trimmed.slice(1));
    if (!base) return false;
    const upper = base.major > 0
      ? { major: base.major + 1, minor: 0, patch: 0 }
      : { major: 0, minor: base.minor + 1, patch: 0 };
    return compare(version, base) >= 0 && compare(version, upper) < 0;
  }

  if (trimmed.startsWith("~")) {
    const base = parseVersion(trimmed.slice(1));
    if (!base) return false;
    const upper = { major: base.major, minor: base.minor + 1, patch: 0 };
    return compare(version, base) >= 0 && compare(version, upper) < 0;
  }

  const opMatch = trimmed.match(/^(>=|<=|>|<|=)?\s*(\d+\.\d+\.\d+)/);
  if (!opMatch) return false;
  const target = parseVersion(opMatch[2]);
  if (!target) return false;
  const cmp = compare(version, target);
  switch (opMatch[1] ?? "=") {
    case ">=": return cmp >= 0;
    case "<=": return cmp <= 0;
    case ">": return cmp > 0;
    case "<": return cmp < 0;
    default: return cmp === 0;
  }
}

export function satisfiesVersionRange(version: string, range: string): boolean {
  const parsed = parseVersion(version);
  if (!parsed) return false;
  const expressions = range.trim().split(/\s+/).filter(Boolean);
  if (expressions.length === 0) return false;
  return expressions.every(expression => satisfiesComparator(parsed, expression));
}

export interface PackageCompatibilityResultV010 {
  state: "COMPATIBLE" | "INCOMPATIBLE" | "UNKNOWN";
  messages: string[];
  required?: PluginCompatibilityV010;
  host: {
    appPlatform: string;
    eidos: string;
    pluginProtocol: string;
  };
}

export function evaluatePackageCompatibility(
  pkg: PackageManifestV010
): PackageCompatibilityResultV010 {
  const host = {
    appPlatform: EVO_APP_PLATFORM_VERSION,
    eidos: EIDOS_HOST_VERSION,
    pluginProtocol: EVO_PLUGIN_PROTOCOL_VERSION
  };

  if (!pkg.compatibility) {
    return {
      state: "UNKNOWN",
      messages: ["Package does not declare host compatibility ranges."],
      host
    };
  }

  const messages: string[] = [];
  let compatible = true;

  for (const [key, required, actual] of [
    ["App Platform", pkg.compatibility.appPlatform, host.appPlatform],
    ["Eidos", pkg.compatibility.eidos, host.eidos],
    ["Plugin Protocol", pkg.compatibility.pluginProtocol, host.pluginProtocol]
  ] as const) {
    if (!required) continue;
    if (!satisfiesVersionRange(actual, required)) {
      compatible = false;
      messages.push(`${key} ${actual} does not satisfy '${required}'.`);
    }
  }

  if (compatible) messages.push("Declared host compatibility requirements are satisfied.");

  return {
    state: compatible ? "COMPATIBLE" : "INCOMPATIBLE",
    messages,
    required: structuredClone(pkg.compatibility),
    host
  };
}
