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
