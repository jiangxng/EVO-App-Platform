import type { PackageManifestV010 } from "../contracts/package.js";

export const companyNotesPackage: PackageManifestV010 = {
  contractVersion: "0.1.0",
  packageId: "company-notes",
  displayName: "Company Notes",
  version: "0.1.0",
  type: "APPLICATION",
  features: [
    {
      contractVersion: "0.1.0",
      featureId: "company-notes.default",
      packageId: "company-notes",
      version: "0.1.0",
      activationScope: "INSTALLATION",
      defaultActivation: true,
      providesCapabilities: ["company-notes"],
      contributions: [
        {
          kind: "eidos.experience",
          manifest: {
            contractVersion: "0.1.0",
            experienceId: "company-notes",
            packageId: "company-notes",
            featureId: "company-notes.default",
            defaultRoute: "/notes",
            pages: [
              {
                id: "company-notes.home",
                title: "Company Notes",
                source: "app://company-notes/pages/home"
              }
            ],
            routes: [
              {
                id: "company-notes.home",
                path: "/notes",
                pageId: "company-notes.home"
              }
            ],
            navigation: [
              {
                id: "company-notes.nav",
                label: "Company Notes",
                route: "/notes",
                order: 20
              }
            ]
          }
        }
      ]
    }
  ]
};


export const companyNotesExperienceAssets = new Map<string, unknown>([
  [
    "app://company-notes/pages/home",
    {
      contractVersion: "0.1.1",
      kind: "form",
      id: "company-notes.home",
      title: "Company Notes",
      purpose: "execute-command",
      command: {
        code: "company-notes.save-note",
        inputVersion: "0.1.0"
      },
      fields: [
        {
          key: "title",
          label: "Title",
          semanticType: "note-title",
          control: "text",
          required: true
        },
        {
          key: "content",
          label: "Content",
          semanticType: "note-content",
          control: "text",
          required: true
        }
      ],
      actions: [
        {
          id: "save",
          label: "Save Note",
          type: "submit",
          command: "company-notes.save-note",
          requiresConfirmation: false
        }
      ],
      metadata: {
        packageId: "company-notes",
        featureId: "company-notes.default"
      }
    }
  ]
]);
