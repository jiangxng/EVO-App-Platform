import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { SettingValueV010 } from "../contracts/package.js";

export interface SettingsStore {
  getNamespace(namespace: string): Record<string, SettingValueV010>;
  setNamespace(namespace: string, values: Record<string, SettingValueV010>): void;
  deleteNamespace(namespace: string): void;
  snapshot(): Record<string, Record<string, SettingValueV010>>;
}

export function createMemorySettingsStore(): SettingsStore {
  const values = new Map<string, Record<string, SettingValueV010>>();

  return {
    getNamespace(namespace) {
      return structuredClone(values.get(namespace) ?? {});
    },
    setNamespace(namespace, next) {
      values.set(namespace, structuredClone(next));
    },
    deleteNamespace(namespace) {
      values.delete(namespace);
    },
    snapshot() {
      return Object.fromEntries(
        [...values.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([namespace, item]) => [namespace, structuredClone(item)])
      );
    }
  };
}

interface PersistedSettingsV010 {
  contractVersion: "0.1.0";
  namespaces: Record<string, Record<string, SettingValueV010>>;
}

function load(filePath: string): PersistedSettingsV010 {
  if (!existsSync(filePath)) {
    return { contractVersion: "0.1.0", namespaces: {} };
  }
  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as PersistedSettingsV010;
  if (
    parsed.contractVersion !== "0.1.0"
    || parsed.namespaces === null
    || typeof parsed.namespaces !== "object"
    || Array.isArray(parsed.namespaces)
  ) {
    throw new Error(`SETTINGS_STATE_INVALID: ${filePath}`);
  }
  return parsed;
}

export function createFileSettingsStore(filePath: string): SettingsStore {
  const initial = load(filePath);
  const values = new Map<string, Record<string, SettingValueV010>>(
    Object.entries(initial.namespaces).map(([namespace, item]) => [
      namespace,
      structuredClone(item)
    ])
  );

  function persist(): void {
    mkdirSync(dirname(filePath), { recursive: true });
    const state: PersistedSettingsV010 = {
      contractVersion: "0.1.0",
      namespaces: Object.fromEntries(
        [...values.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([namespace, item]) => [namespace, structuredClone(item)])
      )
    };
    const tmp = `${filePath}.tmp`;
    writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n", "utf8");
    renameSync(tmp, filePath);
  }

  return {
    getNamespace(namespace) {
      return structuredClone(values.get(namespace) ?? {});
    },
    setNamespace(namespace, next) {
      values.set(namespace, structuredClone(next));
      persist();
    },
    deleteNamespace(namespace) {
      values.delete(namespace);
      persist();
    },
    snapshot() {
      return Object.fromEntries(
        [...values.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([namespace, item]) => [namespace, structuredClone(item)])
      );
    }
  };
}
