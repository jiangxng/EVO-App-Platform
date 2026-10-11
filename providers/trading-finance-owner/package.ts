import type { PackageManifestV010 } from "../../contracts/package.js";

/** Optional, internal-only read-only provider; no Human/Agent tool exposure. */
export const TRADING_FINANCE_OWNER_PACKAGE_ID_V010 =
  "evo-trading-finance-owner-provider" as const;
export const TRADING_FINANCE_OWNER_FEATURE_ID_V010 =
  "evo-trading-finance-owner-provider.default" as const;
export const TRADING_FINANCE_OWNER_PROVIDER_ID_V010 =
  "evo.trading-finance.owner.readonly" as const;
export const TRADING_FINANCE_OWNER_CAPABILITY_V010 =
  "evo.trading-finance.owner.verify-readonly" as const;

export const tradingFinanceOwnerProviderPackageV010: PackageManifestV010 = {
  contractVersion:"0.1.0",
  packageId:TRADING_FINANCE_OWNER_PACKAGE_ID_V010,
  displayName:"EVO Trusted Trading Finance Owner (Read-only)",
  version:"0.1.0",
  type:"PLATFORM_PROVIDER",
  publisher:{id:"evo",displayName:"EVO",trust:"FIRST_PARTY",source:"built-in"},
  compatibility:{appPlatform:">=0.1.0 <0.2.0",eidos:"^1.3.0",pluginProtocol:"0.1.0"},
  features:[{
    contractVersion:"0.1.0",
    featureId:TRADING_FINANCE_OWNER_FEATURE_ID_V010,
    packageId:TRADING_FINANCE_OWNER_PACKAGE_ID_V010,
    version:"0.1.0",
    activationScope:"INSTALLATION",
    defaultActivation:true,
    providesCapabilities:[TRADING_FINANCE_OWNER_CAPABILITY_V010],
    contributions:[{
      kind:"platform.service-provider",
      provider:{
        contractVersion:"0.1.0",
        providerId:TRADING_FINANCE_OWNER_PROVIDER_ID_V010,
        capability:TRADING_FINANCE_OWNER_CAPABILITY_V010,
        providerContract:"evo.trading-finance.owner.readonly",
        providerContractVersion:"0.1.0",
        binding:{type:"IN_PROCESS",ref:"runtime://evo.trading-finance.owner.readonly"},
        metadata:{
          effect:"READ",
          trust:"EXPLICIT_INSTALLATION_AND_HOST_SECRETS",
          delegate:"ED25519_BOUND_ONCE_POSTGRES",
          executionAllowed:"false",
          userAndAgentOperations:"NOT_EXPOSED"
        }
      }
    }]
  }]
};
