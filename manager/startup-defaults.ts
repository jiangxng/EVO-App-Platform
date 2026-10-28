import type { SettingsStore } from "./settings-store.js";

export function resolveStartupProfileV010(value: string | undefined, managedSessionEnabled: boolean) {
  // New installations are intentionally empty. Legacy defaults require an explicit opt-in.
  const profile = value?.trim().toLowerCase() || "clean";
  if (profile !== "compatible" && profile !== "clean" && profile !== "minimal") {
    throw new Error("STARTUP_PROFILE_INVALID: expected compatible, clean or minimal");
  }
  if (profile === "minimal" && !managedSessionEnabled) {
    throw new Error("MINIMAL_STARTUP_REQUIRES_MANAGED_SESSION");
  }
  return profile;
}

// Clean hosts never auto-install optional business plugins. An explicit
// operator-configured capability is still permitted, and existing installs
// stay untouched. Minimal retains its separate managed-session requirement.
export function shouldBootstrapBusinessDefaultV010(
  profile: "compatible" | "clean" | "minimal",
  explicit: boolean
): boolean {
  return profile === "compatible" || explicit;
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
