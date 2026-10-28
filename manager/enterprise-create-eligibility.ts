import type {
  AuthorizationProviderV010,
  PlatformPrincipalV010
} from "../contracts/platform-services.js";
import type { CatalogBrowserV010 } from "../vendor/eidos/src/catalog-browser/contracts.js";
// Keep the Host read-only precheck independent of plugin modules.
// These stable public routes are mirrored by the optional Enterprise Context Experience.
const ENTERPRISE_CONTEXT_DIRECTORY_ROUTE = "/enterprise-contexts";
const ENTERPRISE_CONTEXT_CREATE_ROUTE = "/enterprise-contexts/new";

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

function personalCreateContinuation(
  state: EnterpriseCreateEligibilityV010,
  locale: string,
  personalContextId?: string
) {
  if (state.status !== "PERSONAL_CONTEXT_REQUIRED" || !personalContextId) return [];
  const zh = locale.toLowerCase().startsWith("zh");
  // Deliberately use the public lazy command code, not an eager Host→plugin import.
  // The existing action handler validates this exact context against the
  // authenticated principal's available registry before returning navigateTo.
  return [{
    id: "switch-personal-and-create",
    label: zh ? "切换个人空间并创建企业" : "Switch to personal space and create",
    type: "command" as const,
    command: "enterprise.context.select",
    inputVersion: "0.1.0",
    requiresConfirmation: false,
    primary: true,
    values: {
      targetContextId: personalContextId,
      navigateTo: ENTERPRISE_CONTEXT_CREATE_ROUTE
    }
  }];
}

export function createEnterpriseCreateNotAllowedPageV010(
  state: EnterpriseCreateEligibilityV010,
  locale = "en",
  personalContextId?: string
): CatalogBrowserV010 {
  const zh = locale.toLowerCase().startsWith("zh");
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo-enterprise-create.permission-guidance",
    title: zh ? "创建企业" : "Create enterprise",
    description: state.status === "PERSONAL_CONTEXT_REQUIRED"
      ? (zh
        ? "你当前在企业空间。切换到个人空间后可继续创建企业，系统会再次核实创建资格。"
        : "You are in an enterprise space. Switch to personal space to continue; eligibility will be checked again.")
      : state.message,
    actions: [
      ...personalCreateContinuation(state, locale, personalContextId),
      {
      id: "back-to-enterprise-directory",
      label: zh ? "返回企业列表" : "Back to enterprises",
      type: "navigate",
      route: ENTERPRISE_CONTEXT_DIRECTORY_ROUTE
    }],
    items: [],
    emptyMessage: state.status === "PERSONAL_CONTEXT_REQUIRED"
      ? (zh ? "已创建的企业不受影响。" : "Existing enterprises are not affected.")
      : (zh ? "请按上方提示处理后重试。" : "Follow the guidance above and try again.")
  };
}

export function createEnterpriseCreateEligibilityPageV010(
  state: EnterpriseCreateEligibilityV010,
  locale = "en",
  personalContextId?: string
): CatalogBrowserV010 {
  const zh = locale.toLowerCase().startsWith("zh");
  const stateLabels: Record<EnterpriseCreateEligibilityStatusV010, [string, string]> = {
    ALLOWED: ["可创建", "Can create"],
    AUTH_REQUIRED: ["请先登录", "Sign-in required"],
    PERSONAL_CONTEXT_REQUIRED: ["需切换个人空间", "Switch to personal space"],
    HUMAN_REQUIRED: ["需要个人账号", "Individual account required"],
    DENIED: ["未获授权", "Not authorized"],
    UNAVAILABLE: ["暂无法核实", "Unable to verify"]
  };
  return {
    contractVersion: "0.1.0",
    kind: "catalog-browser",
    id: "evo-enterprise-create.my-permissions",
    title: zh ? "创建企业资格" : "Enterprise creation eligibility",
    description: state.status === "PERSONAL_CONTEXT_REQUIRED"
      ? (zh
        ? "当前在企业空间。点击下方按钮切换个人空间并继续创建，这不代表你没有权限。"
        : "You are in an enterprise space. Switch to personal space to continue; this is not a permission denial.")
      : (zh
        ? "这里只查看当前账号的创建企业资格；授权与撤销由 EVO 平台管理员管理。"
        : "This checks only your account's creation eligibility. Platform administrators manage grants and revocations."),
    actions: [
      ...personalCreateContinuation(state, locale, personalContextId),
      {
      id: "back-to-enterprise-directory",
      label: zh ? "返回企业列表" : "Back to enterprises",
      type: "navigate",
      route: ENTERPRISE_CONTEXT_DIRECTORY_ROUTE
    }],
    items: state.status === "PERSONAL_CONTEXT_REQUIRED" ? [] : [{
      id: "enterprise-create-permission",
      title: zh ? "创建企业" : "Create enterprise",
      summary: state.status === "PERSONAL_CONTEXT_REQUIRED"
        ? (zh
          ? "当前处于企业空间。请使用顶部空间切换器选择个人空间后重新查看；这不代表你没有创建资格。"
          : "You are in an enterprise space. Select your personal space from the top switcher and check again; this does not mean your grant was revoked.")
        : state.message,
      status: {
        label: stateLabels[state.status][zh ? 0 : 1],
        tone: state.allowed ? "positive" : "neutral"
      },
      ...(state.allowed ? {
        primaryAction: {
          id: "go-create",
          label: zh ? "创建企业" : "Create enterprise",
          type: "navigate" as const,
          route: ENTERPRISE_CONTEXT_CREATE_ROUTE
        }
      } : {})
    }],
    emptyMessage: state.status === "PERSONAL_CONTEXT_REQUIRED"
      ? (zh ? "可以创建多个企业，创建时仍会检查权限。" : "You can create multiple enterprises, subject to authorization.")
      : (zh ? "暂无可展示的创建资格。" : "No eligibility information available.")
  };
}
