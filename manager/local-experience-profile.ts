export const PERSONAL_AGENT_EXPERIENCE_SUBJECT_ID = "experience-user";
export const PERSONAL_AGENT_EXPERIENCE_ADMIN_TOKEN = "local-experience-admin";
export const PERSONAL_AGENT_EXPERIENCE_STATE_FILE =
  "./.local/personal-agent-experience/app-platform-state.json";

export interface PersonalAgentExperienceProfileV010 {
  contractVersion: "0.1.0";
  subjectId: string;
  bootstrapAdminToken: string;
  stateFile: string;
  environment: Record<string, string>;
}

export function createPersonalAgentExperienceProfileV010(
  base: NodeJS.ProcessEnv = process.env
): PersonalAgentExperienceProfileV010 {
  const subjectId =
    base.APP_PLATFORM_EXPERIENCE_SUBJECT_ID?.trim()
    || PERSONAL_AGENT_EXPERIENCE_SUBJECT_ID;
  const bootstrapAdminToken =
    base.APP_PLATFORM_EXPERIENCE_ADMIN_TOKEN?.trim()
    || PERSONAL_AGENT_EXPERIENCE_ADMIN_TOKEN;
  const stateFile =
    base.APP_PLATFORM_STATE_FILE?.trim()
    || PERSONAL_AGENT_EXPERIENCE_STATE_FILE;

  const staticSession = {
    contractVersion: "0.1.0",
    sessionId: "personal-agent-experience-session",
    principal: {
      contractVersion: "0.1.0",
      subjectId,
      actorType: "HUMAN",
      identityProviderId: "host.static-session",
      displayName: "Experience User"
    },
    issuedAt: "2026-01-01T00:00:00.000Z",
    assurance: ["LOCAL_EXPERIENCE_PROFILE"]
  };

  const authorizationPolicy = {
    contractVersion: "0.1.0",
    rules: [
      {
        id: "local-experience-human",
        effect: "ALLOW",
        actions: ["*"],
        subjectIds: [subjectId],
        actorTypes: ["HUMAN"]
      },
      {
        id: "local-experience-bootstrap-admin",
        effect: "ALLOW",
        actions: [
          "secret.value.manage",
          "provider.binding.update",
          "provider.health.probe",
          "provider.governance.audit.read"
        ],
        subjectIds: ["bootstrap-admin"],
        actorTypes: ["HUMAN"]
      }
    ]
  };

  return {
    contractVersion: "0.1.0",
    subjectId,
    bootstrapAdminToken,
    stateFile,
    environment: {
      ...Object.fromEntries(
        Object.entries(base)
          .filter((entry): entry is [string, string] =>
            typeof entry[1] === "string"
          )
      ),
      APP_PLATFORM_STATE_FILE: stateFile,
      APP_PLATFORM_STATIC_SESSION_JSON: JSON.stringify(staticSession),
      APP_PLATFORM_AUTHORIZATION_POLICY_JSON: JSON.stringify(
        authorizationPolicy
      ),
      APP_PLATFORM_BOOTSTRAP_ADMIN_TOKEN: bootstrapAdminToken,
      EVO_ACTOR_ID: base.EVO_ACTOR_ID?.trim() || subjectId,
      EVO_ACTOR_TYPE: base.EVO_ACTOR_TYPE?.trim() || "HUMAN"
    }
  };
}
