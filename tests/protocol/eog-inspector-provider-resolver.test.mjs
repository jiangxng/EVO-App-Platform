import test from "node:test";
import assert from "node:assert/strict";

import {
  createEnterpriseOperatingGraphInspectorPropertyResolverV010
} from "../../dist/manager/enterprise-operating-graph-inspector-provider.js";
import {
  createProviderRuntimeRegistry
} from "../../dist/providers/runtime-registry.js";

const target = {
  kind: "NODE",
  nodeId: "app:1",
  nodeKind: "APPLICATION",
  semanticRef: {
    authority: "ENTERPRISE",
    kind: "APPLICATION",
    refId: "application:sales"
  }
};

test("Inspector resolver aggregates all active provider contributions deterministically", async () => {
  const registry = createProviderRuntimeRegistry();

  registry.register("provider:b", {
    providerId: "provider:b",
    async inspect(input) {
      return {
        contractVersion: "0.1.0",
        providerId: "provider:b",
        target: structuredClone(input.target),
        properties: [{ key: "b", label: "B", value: "two" }]
      };
    }
  });

  registry.register("provider:a", {
    providerId: "provider:a",
    async inspect(input) {
      return {
        contractVersion: "0.1.0",
        providerId: "provider:a",
        target: structuredClone(input.target),
        properties: [{ key: "a", label: "A", value: "one" }]
      };
    }
  });

  const manager = {
    listEffectiveServiceProviders() {
      return [
        {
          contractVersion: "0.1.0",
          providerId: "provider:b",
          capability: "enterprise.operating-graph.inspector-properties",
          providerContract: "evo.enterprise-operating-graph.inspector-properties",
          providerContractVersion: "0.1.0",
          binding: { type: "IN_PROCESS", ref: "provider:b" },
          packageId: "package:b",
          featureId: "package:b.default"
        },
        {
          contractVersion: "0.1.0",
          providerId: "provider:a",
          capability: "enterprise.operating-graph.inspector-properties",
          providerContract: "evo.enterprise-operating-graph.inspector-properties",
          providerContractVersion: "0.1.0",
          binding: { type: "IN_PROCESS", ref: "provider:a" },
          packageId: "package:a",
          featureId: "package:a.default"
        }
      ];
    }
  };

  const resolver =
    createEnterpriseOperatingGraphInspectorPropertyResolverV010({
      manager,
      registry
    });

  assert.equal(resolver.hasCandidates(), true);

  const result = await resolver.inspect({
    enterpriseId: "enterprise:demo",
    graphId: "eog:primary",
    target
  });

  assert.deepEqual(
    result.map(item => item.providerId),
    ["provider:a", "provider:b"]
  );
});

test("Inspector resolver rejects provider identity or target mismatches", async () => {
  const registry = createProviderRuntimeRegistry();
  registry.register("provider:bad", {
    providerId: "provider:bad",
    async inspect(input) {
      return {
        contractVersion: "0.1.0",
        providerId: "provider:bad",
        target: {
          ...structuredClone(input.target),
          nodeId: "other"
        },
        properties: []
      };
    }
  });

  const manager = {
    listEffectiveServiceProviders() {
      return [{
        contractVersion: "0.1.0",
        providerId: "provider:bad",
        capability: "enterprise.operating-graph.inspector-properties",
        providerContract: "evo.enterprise-operating-graph.inspector-properties",
        providerContractVersion: "0.1.0",
        binding: { type: "IN_PROCESS", ref: "provider:bad" },
        packageId: "package:bad",
        featureId: "package:bad.default"
      }];
    }
  };

  const resolver =
    createEnterpriseOperatingGraphInspectorPropertyResolverV010({
      manager,
      registry
    });

  await assert.rejects(
    () => resolver.inspect({
      enterpriseId: "enterprise:demo",
      graphId: "eog:primary",
      target
    }),
    /EOG_INSPECTOR_PROVIDER_CONTRACT_MISMATCH/
  );
});
