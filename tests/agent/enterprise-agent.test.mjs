import test from "node:test";
import assert from "node:assert/strict";
import { createEnterpriseAgentRuntime } from "../../dist/agents/enterprise-agent/runtime.js";
import { createDevelopmentAgentModel } from "../../dist/agents/enterprise-agent/development-model.js";
import { createPackageCatalog } from "../../dist/catalog/catalog.js";
import { companyNotesPackage } from "../../dist/catalog/seed.js";
import { createMemoryLifecycleStore } from "../../dist/manager/store.js";
import { createAppManagerService } from "../../dist/manager/service.js";

test("Enterprise Agent installs Company Notes through App Manager tools", async () => {
  const catalog = createPackageCatalog([companyNotesPackage]);
  const store = createMemoryLifecycleStore();
  const manager = createAppManagerService(
    catalog,
    store,
    () => new Date("2026-09-23T00:00:00Z")
  );

  const runtime = createEnterpriseAgentRuntime(createDevelopmentAgentModel(), {
    async listCatalog() { return manager.listCatalog(); },
    async planInstall(packageId) { return manager.planInstall(packageId); },
    async install(packageId) { return manager.install(packageId); }
  });

  const reply = await runtime.chat("帮我安装 Company Notes");

  assert.match(reply.message, /安装完成/);
  assert.deepEqual(reply.observations.map(x => x.tool), [
    "app.catalog.list",
    "app.install.plan",
    "app.install.execute"
  ]);
  assert.deepEqual(manager.getSnapshot().installedPackages.map(x => x.packageId), [
    "company-notes"
  ]);
});

test("Enterprise Agent asks for a target when install request is ambiguous", async () => {
  const runtime = createEnterpriseAgentRuntime(createDevelopmentAgentModel(), {
    async listCatalog() { return [companyNotesPackage]; },
    async planInstall() { throw new Error("should not plan"); },
    async install() { throw new Error("should not install"); }
  });

  const reply = await runtime.chat("帮我安装一个应用");
  assert.match(reply.message, /Company Notes/);
  assert.deepEqual(reply.observations.map(x => x.tool), ["app.catalog.list"]);
});
