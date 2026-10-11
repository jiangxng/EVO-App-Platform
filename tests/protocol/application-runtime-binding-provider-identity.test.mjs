import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010,
  ENTERPRISE_APPLICATION_RUNTIME_BINDING_CONTRACT_V010,
  ENTERPRISE_APPLICATION_RUNTIME_BINDING_VERSION_V010
} from "../../dist/contracts/enterprise-application-runtime-binding.js";
import {
  EOG_APPLICATION_RUNTIME_BINDING_VERSION_V010
} from "../../dist/contracts/enterprise-operating-graph-application-runtime.js";
import {
  APPLICATION_RUNTIME_BINDING_PACKAGE_ID,
  APPLICATION_RUNTIME_BINDING_PROVIDER_ID,
  applicationRuntimeBindingProviderPackage
} from "../../dist/providers/application-runtime-binding/package.js";

test("Application Runtime Binding is a generic install-gated headless provider identity", () => {
  assert.equal(
    APPLICATION_RUNTIME_BINDING_PACKAGE_ID,
    "evo-application-runtime-binding-provider"
  );
  assert.equal(
    APPLICATION_RUNTIME_BINDING_PROVIDER_ID,
    "evo.application-runtime-binding"
  );
  assert.equal(
    ENTERPRISE_APPLICATION_RUNTIME_BINDING_CAPABILITY_V010,
    "enterprise.application-runtime-binding"
  );
  assert.equal(
    ENTERPRISE_APPLICATION_RUNTIME_BINDING_CONTRACT_V010,
    "evo.enterprise.application-runtime-binding"
  );
  assert.equal(applicationRuntimeBindingProviderPackage.type, "PLATFORM_PROVIDER");
  assert.equal(
    applicationRuntimeBindingProviderPackage.features[0]?.defaultActivation,
    true
  );
});

test("legacy EOG runtime-binding contract is compatibility-only", async () => {
  assert.equal(
    EOG_APPLICATION_RUNTIME_BINDING_VERSION_V010,
    ENTERPRISE_APPLICATION_RUNTIME_BINDING_VERSION_V010
  );
  const legacy = await readFile(
    "contracts/enterprise-operating-graph-application-runtime.ts",
    "utf8"
  );
  assert.equal(
    legacy.includes("./enterprise-application-runtime-binding.js"),
    true
  );
  assert.equal(legacy.includes("interface EogApplicationRuntimeBindingV010"), false);
});

test("Runtime Binding provider scaffold does not depend on EOG application implementation", async () => {
  const source = await readFile(
    "providers/application-runtime-binding/package.ts",
    "utf8"
  );
  assert.equal(source.includes("apps/eog-"), false);
  assert.equal(source.includes("manager/"), false);
});
