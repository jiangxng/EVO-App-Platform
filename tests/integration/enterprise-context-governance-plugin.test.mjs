import test from "node:test";
import assert from "node:assert/strict";

import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";
import {
  enterpriseContextGovernanceAppPackage,
  ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID
} from "../../dist/apps/enterprise-context-governance/package.js";
import {
  enterpriseContextGovernanceExperienceAssets
} from "../../dist/apps/enterprise-context-governance/experience-assets.js";
import {
  hostEnterpriseContextProviderPackage
} from "../../dist/providers/enterprise-context/package.js";
import {
  hostStaticAuthorizationProviderPackage
} from "../../dist/providers/authorization/package.js";

test("Enterprise Context Governance is an installable Experience plugin over provider-owned data", () => {
  const manager = createAppManagerService(
    createPackageCatalog([
      enterpriseContextGovernanceAppPackage,
      hostEnterpriseContextProviderPackage,
      hostStaticAuthorizationProviderPackage
    ]),
    createMemoryLifecycleStore(),
    () => new Date("2026-10-01T00:00:00.000Z"),
    enterpriseContextGovernanceExperienceAssets
  );

  assert.equal(
    manager.listEffectiveExperiences().some(
      item => item.experienceId === "evo-enterprise-context-governance"
    ),
    false
  );

  manager.install(enterpriseContextGovernanceAppPackage.packageId);

  const snapshot = manager.getSnapshot();
  assert.equal(
    snapshot.activeFeatures.some(
      item => item.featureId === ENTERPRISE_CONTEXT_GOVERNANCE_APP_FEATURE_ID
    ),
    true
  );

  const experience = manager.listEffectiveExperiences().find(
    item => item.experienceId === "evo-enterprise-context-governance"
  );
  assert.ok(experience);
  assert.equal(experience.defaultRoute, "/enterprise-contexts");
  assert.equal(
    experience.pages.some(
      item => item.source === "app://evo-enterprise-context-governance/pages/directory"
    ),
    true
  );
  assert.equal(
    experience.pages.some(
      item => item.source === "app://evo-enterprise-context-governance/pages/software"
    ),
    false
  );
  assert.equal(
    experience.routes.some(
      item =>
        item.path === "/enterprise-contexts/overview"
        && item.pageId === "evo-enterprise-context-governance.overview"
    ),
    true
  );
  assert.equal(
    experience.routes.some(
      item =>
        item.path === "/enterprise-contexts/applications"
        && item.pageId === "evo-enterprise-context-governance.overview"
    ),
    true
  );
  assert.deepEqual(experience.navigation ?? [], []);

  const page = manager.loadExperiencePage(
    "app://evo-enterprise-context-governance/pages/create"
  );
  assert.ok(page);
  assert.equal(page.kind, "form");
  assert.equal(page.command.code, "enterprise.context.create");
  assert.equal(page.actions[0].requiresConfirmation, true);
  assert.equal(page.metadata.dataOwnerCapability, "enterprise.directory");
  assert.equal(page.metadata.commandOwner, "host-enterprise-context-provider");
  assert.equal(page.metadata.designOwner, "evo-enterprise-context-governance");
  assert.equal("contexts" in page.metadata, false);

  assert.equal(
    manager.loadExperiencePage(
      "app://evo-enterprise-context-governance/pages/overview"
    ),
    undefined
  );
});

test("Enterprise Context Governance declares provider and authorization dependencies", () => {
  const feature = enterpriseContextGovernanceAppPackage.features[0];
  assert.deepEqual(
    [...feature.requiresCapabilities].sort(),
    [
      "authorization.check",
      "enterprise.directory"
    ]
  );
  assert.equal(
    feature.contributions.some(
      item => item.kind === "eidos.experience"
    ),
    true
  );
  assert.equal(
    feature.contributions.some(
      item => item.kind === "platform.service-provider"
    ),
    false
  );
});
