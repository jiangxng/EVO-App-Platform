import type { PackageManifestV010 } from "../contracts/package.js";

export const EXTERNAL_AGENT_GOVERNANCE_PACKAGE_ID =
  "evo.external-agent-governance";
export const EXTERNAL_AGENT_GOVERNANCE_FEATURE_ID =
  "evo.external-agent-governance.default";
export const EXTERNAL_AGENT_GOVERNANCE_CAPABILITY =
  "external.agent.governance";

export const externalAgentGovernancePackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: EXTERNAL_AGENT_GOVERNANCE_PACKAGE_ID,
  displayName: "EVO External Agent Governance",
  version: "0.1.0",
  type: "FOUNDATION_RUNTIME",
  publisher: {
    id: "evo",
    displayName: "EVO",
    trust: "FIRST_PARTY",
    source: "built-in"
  },
  compatibility: {
    appPlatform: ">=0.1.0 <0.2.0",
    eidos: "^1.3.0",
    pluginProtocol: "0.1.0"
  },
  features: [{
    contractVersion: "0.1.0",
    featureId: EXTERNAL_AGENT_GOVERNANCE_FEATURE_ID,
    packageId: EXTERNAL_AGENT_GOVERNANCE_PACKAGE_ID,
    version: "0.1.0",
    activationScope: "INSTALLATION",
    defaultActivation: true,
    providesCapabilities: [EXTERNAL_AGENT_GOVERNANCE_CAPABILITY]
  }]
};
