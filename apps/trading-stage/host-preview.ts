import type { PackageManifestV010 } from "../../contracts/package.js";
import { stagePreviewEnabledV010, stagePageSourceV010 } from "./demo-kit.js";
import { purchasingStagePackageV010, purchasingStagePageV010 } from "../trading-stage-purchasing/package.js";
import { receivingStagePackageV010, receivingStagePageV010 } from "../trading-stage-receiving/package.js";
import { salesStagePackageV010, salesStagePageV010 } from "../trading-stage-sales/package.js";
import { shipmentStagePackageV010, shipmentStagePageV010 } from "../trading-stage-shipment/package.js";
import { receivableStagePackageV010, receivableStagePageV010 } from "../trading-stage-receivable/package.js";
import { cashStagePackageV010, cashStagePageV010 } from "../trading-stage-cash/package.js";

/**
 * Opt-in six-package synthetic preview contribution to the normal Host catalog.
 * Unlike isolated unit tests, these packages can now be found and managed by
 * the real Store, but remain read-only fixtures (never authoritative facts).
 * Keep this in the package-owned adapter, not in Catalog/Core/ledger engines.
 */
export function createTradingStagePreviewContributionV010(): {
  packages: PackageManifestV010[];
  experienceAssets: Map<string, unknown>;
} {
  if (!stagePreviewEnabledV010()) {
    return { packages: [], experienceAssets: new Map<string, unknown>() };
  }
  return {
    packages: [
      purchasingStagePackageV010, receivingStagePackageV010,
      salesStagePackageV010, shipmentStagePackageV010,
      receivableStagePackageV010, cashStagePackageV010
    ],
    experienceAssets: new Map<string, unknown>([
      [stagePageSourceV010("purchasing"), purchasingStagePageV010],
      [stagePageSourceV010("receiving"), receivingStagePageV010],
      [stagePageSourceV010("sales"), salesStagePageV010],
      [stagePageSourceV010("shipment"), shipmentStagePageV010],
      [stagePageSourceV010("receivable"), receivableStagePageV010],
      [stagePageSourceV010("cash"), cashStagePageV010]
    ])
  };
}
