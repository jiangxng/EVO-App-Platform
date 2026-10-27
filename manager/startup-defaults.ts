import type { SettingsStore } from "./settings-store.js";

export function resolveStartupProfileV010(value: string | undefined, managedSessionEnabled: boolean) {
  const profile = value?.trim().toLowerCase() || "compatible";
  if (profile !== "compatible" && profile !== "minimal" && profile !== "clean") {
    throw new Error("STARTUP_PROFILE_INVALID: expected compatible, clean or minimal");
  }
  if (profile === "minimal" && !managedSessionEnabled) {
    throw new Error("MINIMAL_STARTUP_REQUIRES_MANAGED_SESSION");
  }
  return profile;
}

// A separate host-owned journal, never a plugin's editable settings namespace.
// Successful defaults are one-time bootstrap actions, not desired-state loops.
export function createStartupDefaultsV010(journal: SettingsStore) {
  const namespace = "host.startup-defaults.v1";
  return {
    migrate(input: { id: string; ready: boolean; run(): void }): void {
      const key = "host.startup-migrations.v1";
      const state = journal.getNamespace(key);
      if (!input.ready || state[input.id] === true) return;
      input.run();
      journal.setNamespace(key, { ...state, [input.id]: true });
    },
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
