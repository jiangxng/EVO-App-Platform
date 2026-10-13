import type { SettingsStore } from "./settings-store.js";

// A separate host-owned journal, never a plugin's editable settings namespace.
// Successful defaults are one-time bootstrap actions, not desired-state loops.
export function createStartupDefaultsV010(journal: SettingsStore) {
  const namespace = "host.startup-defaults.v1";
  return {
    apply(input: {
      packageId: string;
      installed: boolean;
      ready?: boolean;
      install(): void;
    }): "PRESERVED" | "DEFERRED" | "INSTALLED" {
      const state = journal.getNamespace(namespace);
      if (state[input.packageId] === true) return "PRESERVED";
      // An existing installation may intentionally have inactive Features.
      if (input.installed) {
        journal.setNamespace(namespace, { ...state, [input.packageId]: true });
        return "PRESERVED";
      }
      if (input.ready === false) return "DEFERRED";
      input.install(); // Failure must not be recorded as a completed migration.
      journal.setNamespace(namespace, { ...state, [input.packageId]: true });
      return "INSTALLED";
    }
  };
}
