import type {
  EidosWorkbenchHomeItemContributionV010
} from "../contracts/package.js";

export interface WorkbenchItemPreferenceV010 {
  itemId: string;
  hidden?: boolean;
  order?: number;
}

export interface WorkbenchCompositionLayerV010 {
  layerId: "ENTERPRISE_ROLE_DEFAULT" | "PERSONAL_PREFERENCE";
  preferences: WorkbenchItemPreferenceV010[];
}

export type EffectiveWorkbenchHomeItemV010 =
  EidosWorkbenchHomeItemContributionV010["item"] & {
    packageId: string;
    featureId: string;
    effectiveOrder: number;
    hidden: boolean;
  };

export interface WorkbenchCompositionResultV010 {
  contractVersion: "0.1.0";
  items: EffectiveWorkbenchHomeItemV010[];
  rejectedPreferenceItemIds: string[];
}

export function composeWorkbenchHomeV010(input: {
  packageItems: Array<
    EidosWorkbenchHomeItemContributionV010["item"] & {
      packageId: string;
      featureId: string;
    }
  >;
  authorizedCapabilityOperationIds?: ReadonlySet<string>;
  enterpriseRoleDefault?: WorkbenchCompositionLayerV010;
  personalPreference?: WorkbenchCompositionLayerV010;
}): WorkbenchCompositionResultV010 {
  const authorized = input.packageItems.filter(item =>
    !item.capabilityOperationId
    || input.authorizedCapabilityOperationIds?.has(item.capabilityOperationId)
  );
  const byId = new Map(
    authorized.map(item => [
      item.id,
      {
        ...structuredClone(item),
        effectiveOrder: item.order ?? 0,
        hidden: false
      } satisfies EffectiveWorkbenchHomeItemV010
    ])
  );
  const rejected = new Set<string>();

  for (const layer of [
    input.enterpriseRoleDefault,
    input.personalPreference
  ]) {
    if (!layer) continue;
    for (const preference of layer.preferences) {
      const item = byId.get(preference.itemId);
      if (!item) {
        rejected.add(preference.itemId);
        continue;
      }
      if (preference.hidden !== undefined) item.hidden = preference.hidden;
      if (
        preference.order !== undefined
        && Number.isFinite(preference.order)
      ) {
        item.effectiveOrder = preference.order;
      }
    }
  }

  return {
    contractVersion: "0.1.0",
    items: [...byId.values()]
      .filter(item => !item.hidden)
      .sort((a, b) =>
        a.effectiveOrder - b.effectiveOrder
        || a.id.localeCompare(b.id)
      ),
    rejectedPreferenceItemIds: [...rejected].sort()
  };
}
