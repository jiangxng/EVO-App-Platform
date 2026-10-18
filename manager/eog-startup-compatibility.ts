import { existsSync } from "node:fs";
import type { BusinessDefinitionRepositoryRuntimeV010 } from "../providers/enterprise-context/business-definitions.js";
import type { EnterpriseOperatingGraphHostServiceV010 } from "./enterprise-operating-graph-service.js";

// Compatibility migrations belong to the shared definition store, not one UI
// Feature. Preserve startup order/failures when legacy data actually exists.
export async function migrateExistingEogGraphsV010(input: {
  path: string | undefined;
  repository: BusinessDefinitionRepositoryRuntimeV010;
}) {
  if (!input.path || !existsSync(input.path)) return { sourcePresent: false, examined: 0, imported: 0, alreadyPresent: 0 };
  const module = await import("../apps/eog-2d-designer/legacy-definition-migration.js");
  return module.migrateLegacyEnterpriseOperatingGraphsV010(input);
}

export async function migrateExistingEogSopsV010(input: {
  path: string | undefined;
  repository: BusinessDefinitionRepositoryRuntimeV010;
}) {
  if (!input.path || !existsSync(input.path)) return { sourcePresent: false, examined: 0, imported: 0, alreadyPresent: 0 };
  const module = await import("../providers/enterprise-context/eog-sop-migration.js");
  return module.migrateLegacyEogSopsV010(input);
}

export async function applyConfiguredEogPreviewSeedV010(input: {
  raw: string | undefined;
  service: EnterpriseOperatingGraphHostServiceV010;
}): Promise<{ seeded: boolean; graphId?: string }> {
  if (!input.raw?.trim()) return { seeded: false };
  const module = await import("./eog-preview-seed.js");
  return module.applyEogPreviewSeedV010({ service: input.service, seed: module.parseEogPreviewSeedV010(input.raw) });
}
