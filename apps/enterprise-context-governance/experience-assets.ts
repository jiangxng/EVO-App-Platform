import {
  ENTERPRISE_SOFTWARE_PAGE_SOURCE
} from "./constants.js";

export const enterpriseContextGovernanceExperienceAssets =
  new Map<string, unknown>([
    [
      "app://evo-enterprise-context-governance/pages/create",
      {
        contractVersion: "0.1.1",
        kind: "form",
        id: "evo-enterprise-context-governance.create",
        title: "Create Enterprise Context",
        purpose: "execute-command",
        command: {
          code: "enterprise.context.create",
          inputVersion: "0.1.0"
        },
        fields: [
          {
            key: "displayName",
            label: "Enterprise name",
            semanticType: "enterprise.display-name",
            control: "text",
            required: true
          },
          {
            key: "code",
            label: "Enterprise code",
            semanticType: "enterprise.code",
            control: "text",
            required: false
          }
        ],
        actions: [{
          id: "create",
          label: "Create enterprise",
          type: "submit",
          command: "enterprise.context.create",
          requiresConfirmation: true
        }],
        metadata: {
          dataOwnerCapability: "enterprise.directory",
          commandOwner: "host-enterprise-context-provider",
          designOwner: "evo-enterprise-context-governance",
          creationFactsImmutable: true,
          initialRelationship: "OWNER"
        }
      }
    ],
    [
      ENTERPRISE_SOFTWARE_PAGE_SOURCE,
      {
        contractVersion: "0.1.0",
        kind: "catalog-browser",
        id: "evo-enterprise-context-governance.software",
        title: "Enterprise Software",
        description: "Select an Enterprise Context to manage enterprise software.",
        items: [],
        emptyMessage: "No enterprise software definitions are available."
      }
    ]
  ]);
