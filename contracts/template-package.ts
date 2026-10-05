import {
  assertTemplateTransferBundleV010,
  type TemplateTransferBundleV010
} from "./template-transfer.js";

export interface TemplateDownloadPackageV010 {
  contractVersion: "0.1.0";
  kind: "evo.template.package";
  templateId: string;
  storeVersion: number;
  bundle: TemplateTransferBundleV010;
}

function required(value: unknown, code: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(code);
  return value.trim();
}

export function assertTemplateDownloadPackageV010(
  value: TemplateDownloadPackageV010
): TemplateDownloadPackageV010 {
  if (
    value?.contractVersion !== "0.1.0"
    || value.kind !== "evo.template.package"
    || !Number.isInteger(value.storeVersion)
    || value.storeVersion < 1
  ) {
    throw new Error("TEMPLATE_DOWNLOAD_PACKAGE_INVALID");
  }

  return {
    contractVersion: "0.1.0",
    kind: "evo.template.package",
    templateId: required(
      value.templateId,
      "TEMPLATE_DOWNLOAD_TEMPLATE_ID_REQUIRED"
    ),
    storeVersion: value.storeVersion,
    bundle: assertTemplateTransferBundleV010(value.bundle)
  };
}

export function createTemplateDownloadPackageV010(input: {
  templateId: string;
  storeVersion: number;
  bundle: TemplateTransferBundleV010;
}): TemplateDownloadPackageV010 {
  return assertTemplateDownloadPackageV010({
    contractVersion: "0.1.0",
    kind: "evo.template.package",
    templateId: input.templateId,
    storeVersion: input.storeVersion,
    bundle: input.bundle
  });
}
