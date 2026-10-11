import type {
  TemplateTransferBundleV010
} from "./template-transfer.js";

export const TEMPLATE_PUBLICATION_CAPABILITY_V010 =
  "template.store.publication" as const;

export interface TemplatePublicationResultV010 {
  templateId: string;
  version: number;
  publishedAt: string;
}

export interface TemplatePublicationProviderV010 {
  providerId: string;
  publish(input: {
    templateId: string;
    bundle: TemplateTransferBundleV010;
    publishedAt?: string;
  }): TemplatePublicationResultV010;
}
