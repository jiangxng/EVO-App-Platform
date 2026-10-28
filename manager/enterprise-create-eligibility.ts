import type {
  AuthorizationProviderV010,
  PlatformPrincipalV010
} from "../contracts/platform-services.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";

export type EnterpriseCreateEligibilityStatusV010 =
  | "ALLOWED"
  | "AUTH_REQUIRED"
  | "PERSONAL_CONTEXT_REQUIRED"
  | "HUMAN_REQUIRED"
  | "DENIED"
  | "UNAVAILABLE";

export interface EnterpriseCreateEligibilityV010 {
  contractVersion: "0.1.0";
  action: "enterprise.context.create";
  allowed: boolean;
  status: EnterpriseCreateEligibilityStatusV010;
  message: string;
}

function eligibility(
  status: EnterpriseCreateEligibilityStatusV010,
  locale: string
): EnterpriseCreateEligibilityV010 {
  const zh = locale.toLowerCase().startsWith("zh");
  const messages: Record<EnterpriseCreateEligibilityStatusV010, [string, string]> = {
    ALLOWED: ["当前账号可以创建企业。提交时仍会重新检查权限。",
      "You may create an enterprise. Permission is checked again on submission."],
    AUTH_REQUIRED: ["请先登录个人账号，再查看创建企业权限。",
      "Sign in with an individual account to check enterprise creation permission."],
    PERSONAL_CONTEXT_REQUIRED: ["请先切换到个人空间，再创建企业。",
      "Switch to your personal context before creating an enterprise."],
    HUMAN_REQUIRED: ["创建企业需要已登录的真实用户身份。",
      "Enterprise creation requires a signed-in human account."],
    DENIED: ["当前账号尚未获得创建企业权限，请联系平台管理员。",
      "Your account cannot create enterprises. Contact the platform administrator."],
    UNAVAILABLE: ["暂时无法核实创建企业权限，请稍后重试或联系管理员。",
      "Enterprise creation permission cannot be verified. Please try again or contact an administrator."]
  };
  return {
    contractVersion: "0.1.0",
    action: "enterprise.context.create",
    allowed: status === "ALLOWED",
    status,
    message: messages[status][zh ? 0 : 1]
  };
}

/** Read-only hint. The create-command handler remains the security boundary. */
export async function checkEnterpriseCreateEligibilityV010(input: {
  principal?: PlatformPrincipalV010;
  provider?: AuthorizationProviderV010;
  activeContextKind?: "PERSONAL" | "ENTERPRISE";
  locale?: string;
}): Promise<EnterpriseCreateEligibilityV010> {
  const locale = input.locale ?? "en";
  if (!input.principal) return eligibility("AUTH_REQUIRED", locale);
  if (input.principal.actorType !== "HUMAN") return eligibility("HUMAN_REQUIRED", locale);
  if (input.activeContextKind === "ENTERPRISE") {
    return eligibility("PERSONAL_CONTEXT_REQUIRED", locale);
  }
  if (!input.provider) return eligibility("UNAVAILABLE", locale);
  try {
    const result = await input.provider.check({
      contractVersion: "0.1.0",
      principal: input.principal,
      scope: {
        contractVersion: "0.1.0",
        userId: input.principal.subjectId
      },
      action: "enterprise.context.create",
      resource: { type: "enterprise.context" },
      context: {
        activeContextKind: "PERSONAL",
        activeContextId: `personal:${input.principal.subjectId}`,
        correlationId: "enterprise-create-eligibility"
      }
    });
    return eligibility(result.allowed ? "ALLOWED" : "DENIED", locale);
  } catch {
    return eligibility("UNAVAILABLE", locale);
  }
}

export function createEnterpriseCreateNotAllowedPageV010(
  state: EnterpriseCreateEligibilityV010,
  locale = "en"
): CatalogBrowserV010 {
  const zh = locale.toLowerCase().startsWith("zh");
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo-enterprise-create.permission-guidance",
    title: zh ? "创建企业权限" : "Enterprise creation permission",
    description: state.message,
    items: [],
    emptyMessage: state.message
  };
}
