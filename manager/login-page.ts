import { normalizeAuthenticationReturnToV010 } from "./authentication-flow.js";

export type LoginMethodStatusV010 =
  | "AVAILABLE"
  | "ADMIN_CONFIGURATION_REQUIRED"
  | "PLANNED";

export interface LoginMethodV010 {
  id: "google" | "microsoft" | "enterprise-sso" | "email";
  label: string;
  supportingText: string;
  status: LoginMethodStatusV010;
  actionPath?: string;
}

export type LoginSkinV010 = "standard" | "demo";

export interface LoginExperienceOptionsV010 {
  assetRevision: string;
  returnTo?: string;
  locale?: string;
  skin?: LoginSkinV010;
  authenticationEnabled: boolean;
  methods: readonly LoginMethodV010[];
}

function safeRevision(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9._-]/gu, "-") || "dev";
}

function normalizedLocale(value: string | undefined): "en" | "zh-CN" {
  return value?.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

function copy(locale: "en" | "zh-CN") {
  return locale === "zh-CN"
    ? {
        pageTitle: "登录 EVO",
        eyebrow: "我们的共同目标",
        heroTitle: "以客户为中心，以奋斗者为本。",
        heroBody: "每一项工作，都应该知道为什么做、由谁负责、进展到哪里。让信息透明、责任清晰、协作顺畅，让每个人都知道现在最重要的事情是什么。",
        valueOneTitle: "目标一致",
        valueOneBody: "理解公司的方向，也清楚自己的工作如何支持共同目标。",
        valueTwoTitle: "责任清晰",
        valueTwoBody: "明确负责人、时间和下一步，让事情持续向前推进。",
        valueThreeTitle: "持续改善",
        valueThreeBody: "用事实发现问题，用结果检验行动，让好的做法不断沉淀下来。",
        coverFooter: "今天的每一步，都在推动企业向目标前进。",
        demoEyebrow: "全球云通信与AIoT平台",
        demoTopline: "全球连接 · 云端智能 · 让世界更近",
        demoHeroBody: "以全球连接能力与云端智能，帮助企业打通人与设备、连接全球市场，让业务在世界各地稳定运行。",
        demoMetricOneValue: "50+",
        demoMetricOneLabel: "业务落地国家和地区",
        demoMetricTwoValue: "200+",
        demoMetricTwoLabel: "网络资源覆盖国家和地区",
        demoMetricThreeValue: "1000+",
        demoMetricThreeLabel: "用户足迹覆盖城市",
        demoTagOne: "全球连接",
        demoTagTwo: "云端智能",
        demoTagThree: "AIoT 设备",
        demoTagFour: "跨运营商网络",
        demoFooter: "连接全球 · 驱动更多可能",
        demoWelcome: "欢迎登录",
        demoWelcomeBody: "登录途鸽企业平台，开启全球连接新可能",
        demoAccountLabel: "账号 / 邮箱",
        demoAccountPlaceholder: "请输入账号或邮箱",
        demoPasswordLabel: "密码",
        demoPasswordPlaceholder: "请输入密码",
        demoRemember: "记住我",
        demoForgot: "忘记密码？",
        demoLogin: "登 录",
        demoOr: "或",
        demoGoogle: "使用 Google 账号登录",
        demoMoreMethods: "更多登录方式，敬请期待",
        demoNoAccount: "还没有账号？",
        demoContact: "联系我们",
        demoHelp: "帮助中心",
        demoMode: "演示",
        standardMode: "标准",
        switchToDemo: "切换为企业演示封面",
        switchToStandard: "切换为标准登录封面",
        signInTitle: "登录到 EVO",
        signInBody: "选择你的身份方式继续。",
        available: "可用",
        admin: "需管理员配置",
        planned: "即将支持",
        noRegistrationTitle: "还没有 EVO 账号？",
        noRegistrationBody: "目前不开放自助注册。未来将支持组织邀请与自助注册流程。",
        createAccount: "创建账号",
        registrationPlanned: "注册功能规划中",
        security: "安全登录",
        securityBody: "EVO 不在浏览器会话中保存第三方身份提供商的访问令牌。",
        access: "组织管理",
        accessBody: "企业可决定允许的登录方式、成员与访问范围。",
        flexible: "可扩展身份",
        flexibleBody: "Google 之外，登录体验已为 Microsoft、企业 SSO 与邮箱身份预留。",
        authenticationUnavailable: "此部署尚未启用身份认证。管理员完成配置后即可使用登录。",
        english: "English",
        chinese: "中文"
      }
    : {
        pageTitle: "Sign in to EVO",
        eyebrow: "Our shared goal",
        heroTitle: "Customer-centric. Strivers at the core.",
        heroBody: "Every piece of work should have a clear purpose, owner and sense of progress. Keep information visible, responsibilities clear and collaboration moving so everyone knows what matters most now.",
        valueOneTitle: "Aligned goals",
        valueOneBody: "Understand where the company is going and how your work supports the shared goal.",
        valueTwoTitle: "Clear ownership",
        valueTwoBody: "Make the owner, timing and next step clear so work keeps moving forward.",
        valueThreeTitle: "Continuous improvement",
        valueThreeBody: "Use facts to find problems and results to test actions, then keep what works.",
        coverFooter: "Every step today moves the enterprise closer to its goals.",
        demoEyebrow: "Global Cloud Connectivity & AIoT",
        demoTopline: "Global connectivity · Cloud intelligence · Bring the world closer",
        demoHeroBody: "Connect people, devices and global markets through worldwide connectivity and cloud intelligence so business can operate reliably wherever it goes.",
        demoMetricOneValue: "50+",
        demoMetricOneLabel: "markets with live business",
        demoMetricTwoValue: "200+",
        demoMetricTwoLabel: "countries and regions covered",
        demoMetricThreeValue: "1000+",
        demoMetricThreeLabel: "cities reached by users",
        demoTagOne: "Global connectivity",
        demoTagTwo: "Cloud intelligence",
        demoTagThree: "AIoT devices",
        demoTagFour: "Multi-operator networks",
        demoFooter: "Connect globally · Enable more possibilities",
        demoWelcome: "Welcome",
        demoWelcomeBody: "Sign in to TUGE Enterprise Platform and connect globally",
        demoAccountLabel: "Account / Email",
        demoAccountPlaceholder: "Enter account or email",
        demoPasswordLabel: "Password",
        demoPasswordPlaceholder: "Enter password",
        demoRemember: "Remember me",
        demoForgot: "Forgot password?",
        demoLogin: "Sign in",
        demoOr: "or",
        demoGoogle: "Sign in with Google",
        demoMoreMethods: "More sign-in methods coming soon",
        demoNoAccount: "No account yet?",
        demoContact: "Contact us",
        demoHelp: "Help center",
        demoMode: "Demo",
        standardMode: "Standard",
        switchToDemo: "Switch to enterprise demo cover",
        switchToStandard: "Switch to standard login cover",
        signInTitle: "Sign in to EVO",
        signInBody: "Choose an identity method to continue.",
        available: "Available",
        admin: "Admin setup",
        planned: "Coming soon",
        noRegistrationTitle: "New to EVO?",
        noRegistrationBody: "Self-service registration is not enabled yet. Organization invitations and account registration are planned.",
        createAccount: "Create account",
        registrationPlanned: "Registration planned",
        security: "Secure sign-in",
        securityBody: "EVO does not place third-party identity-provider access tokens in the browser session.",
        access: "Organization governed",
        accessBody: "Enterprises can control allowed sign-in methods, membership and access scope.",
        flexible: "Identity ready",
        flexibleBody: "Beyond Google, the experience is prepared for Microsoft, enterprise SSO and email identity.",
        authenticationUnavailable: "Authentication is not enabled for this deployment yet. An administrator can configure it later.",
        english: "English",
        chinese: "中文"
      };
}

function statusLabel(
  status: LoginMethodStatusV010,
  text: ReturnType<typeof copy>
): string {
  if (status === "AVAILABLE") return text.available;
  if (status === "ADMIN_CONFIGURATION_REQUIRED") return text.admin;
  return text.planned;
}

function providerIcon(method: LoginMethodV010["id"]): string {
  if (method === "google") {
    return `<img src="https://developers.google.com/static/identity/images/g-logo.png" alt="" width="18" height="18">`;
  }
  if (method === "microsoft") return "M";
  if (method === "enterprise-sso") return "SSO";
  return "@";
}

function providerButton(
  method: LoginMethodV010,
  returnTo: string,
  locale: "en" | "zh-CN",
  text: ReturnType<typeof copy>
): string {
  const available = method.status === "AVAILABLE" && Boolean(method.actionPath);
  const href = available
    ? method.actionPath
      + "?returnTo=" + encodeURIComponent(returnTo)
      + "&locale=" + encodeURIComponent(locale)
    : undefined;
  const tag = available ? "a" : "button";
  const interaction = available
    ? ` href="${href}"`
    : ` type="button" disabled aria-disabled="true"`;
  const status = statusLabel(method.status, text);
  return `<${tag} class="evo-login-method" data-provider="${method.id}" data-status="${method.status}"${interaction}>
    <span class="evo-login-provider-icon" aria-hidden="true">${providerIcon(method.id)}</span>
    <span class="evo-login-method-copy">
      <strong>${method.label}</strong>
      <small>${method.supportingText}</small>
    </span>
    <span class="evo-login-status">${status}</span>
  </${tag}>`;
}

export function defaultLoginMethodsV010(input: {
  googleAvailable: boolean;
  locale?: string;
}): readonly LoginMethodV010[] {
  const locale = normalizedLocale(input.locale);
  const zh = locale === "zh-CN";
  return [
    {
      id: "google",
      label: zh ? "使用 Google 继续" : "Continue with Google",
      supportingText: zh ? "Google Workspace 或 Google 账号" : "Google Workspace or Google account",
      status: input.googleAvailable ? "AVAILABLE" : "ADMIN_CONFIGURATION_REQUIRED",
      ...(input.googleAvailable ? { actionPath: "/auth/login" } : {})
    },
    {
      id: "microsoft",
      label: zh ? "使用 Microsoft 继续" : "Continue with Microsoft",
      supportingText: zh ? "工作、学校或 Microsoft 账号" : "Work, school or Microsoft account",
      status: "PLANNED"
    },
    {
      id: "enterprise-sso",
      label: zh ? "企业 SSO" : "Enterprise SSO",
      supportingText: zh ? "使用组织的身份提供商" : "Your organization's identity provider",
      status: "ADMIN_CONFIGURATION_REQUIRED"
    },
    {
      id: "email",
      label: zh ? "使用邮箱继续" : "Continue with email",
      supportingText: zh ? "邮箱或本地账号登录" : "Email-based or local account sign-in",
      status: "PLANNED"
    }
  ];
}

export function createLoginExperienceHtmlV010(
  options: LoginExperienceOptionsV010
): string {
  const locale = normalizedLocale(options.locale);
  const text = copy(locale);
  const revision = safeRevision(options.assetRevision);
  const returnTo = normalizeAuthenticationReturnToV010(options.returnTo);
  const skin: LoginSkinV010 = options.skin === "demo" ? "demo" : "standard";
  const switchSkin: LoginSkinV010 = skin === "demo" ? "standard" : "demo";
  const switchLocale = locale === "zh-CN" ? "en" : "zh-CN";
  const switchLabel = locale === "zh-CN" ? text.english : text.chinese;
  const switchHref = "/login?returnTo=" + encodeURIComponent(returnTo)
    + "&locale=" + encodeURIComponent(switchLocale)
    + "&skin=" + encodeURIComponent(skin);
  const skinHref = "/login?returnTo=" + encodeURIComponent(returnTo)
    + "&locale=" + encodeURIComponent(locale)
    + "&skin=" + encodeURIComponent(switchSkin);
  const standardHref = "/login?returnTo=" + encodeURIComponent(returnTo)
    + "&locale=" + encodeURIComponent(locale)
    + "&skin=standard";
  const demoHref = "/login?returnTo=" + encodeURIComponent(returnTo)
    + "&locale=" + encodeURIComponent(locale)
    + "&skin=demo";
  const skinLabel = skin === "demo" ? text.standardMode : text.demoMode;
  const skinAria = skin === "demo" ? text.switchToStandard : text.switchToDemo;
  const loginAssetRevision = encodeURIComponent(options.assetRevision);
  const brandMark = skin === "demo"
    ? `<img class="evo-login-customer-logo" src="/login-assets/tuge-logo-final.png?rev=${loginAssetRevision}" alt="途鸽科技">`
    : `<span class="evo-login-mark" aria-hidden="true">E</span><span>EVO</span>`;
  const heroBody = skin === "demo" ? text.demoHeroBody : text.heroBody;
  const coverFooter = skin === "demo" ? text.demoFooter : text.coverFooter;
  const visual = skin === "demo"
    ? `<div class="evo-login-demo-metrics" aria-label="${text.demoEyebrow}">
        <div><strong>${text.demoMetricOneValue}</strong><span>${text.demoMetricOneLabel}</span></div>
        <div><strong>${text.demoMetricTwoValue}</strong><span>${text.demoMetricTwoLabel}</span></div>
        <div><strong>${text.demoMetricThreeValue}</strong><span>${text.demoMetricThreeLabel}</span></div>
      </div>`
    : `<div class="evo-login-visual" aria-hidden="true">
        <div><strong>${text.valueOneTitle}</strong><span>${text.valueOneBody}</span></div>
        <div><strong>${text.valueTwoTitle}</strong><span>${text.valueTwoBody}</span></div>
        <div><strong>${text.valueThreeTitle}</strong><span>${text.valueThreeBody}</span></div>
      </div>`;
  const demoScene = skin === "demo"
    ? `<div class="evo-login-demo-scene" aria-hidden="true">
        <img class="evo-login-demo-art" src="/login-assets/tuge-login-background-final.png?rev=${loginAssetRevision}" alt="">
        <div class="evo-login-demo-art-wash"></div>
        <div class="evo-login-demo-tags">
          <span class="tag-a">${text.demoTagOne}</span>
          <span class="tag-b">${text.demoTagTwo}</span>
          <span class="tag-c">${text.demoTagThree}</span>
          <span class="tag-d">${text.demoTagFour}</span>
        </div>
      </div>`
    : "";
  const demoTopbar = skin === "demo"
    ? `<header class="evo-login-demo-topbar">
        <div class="evo-login-demo-logo">${brandMark}</div>
        <div class="evo-login-demo-topline">${text.demoTopline}</div>
        <div class="evo-login-demo-top-actions">
          <a class="evo-login-demo-language" href="${switchHref}" hreflang="${switchLocale}">◎ ${switchLabel}</a>
          <nav class="evo-login-demo-skins" aria-label="${skinAria}">
            <a href="${standardHref}" data-active="false">${text.standardMode}版</a>
            <a href="${demoHref}" data-active="true">${text.demoMode}版</a>
          </nav>
        </div>
      </header>`
    : "";
  const methods = options.methods
    .map(method => providerButton(method, returnTo, locale, text))
    .join("");
  const googleMethod = options.methods.find(method => method.id === "google");
  const demoGoogleAvailable = googleMethod?.status === "AVAILABLE"
    && Boolean(googleMethod.actionPath);
  const demoGoogleHref = demoGoogleAvailable
    ? googleMethod!.actionPath
      + "?returnTo=" + encodeURIComponent(returnTo)
      + "&locale=" + encodeURIComponent(locale)
    : undefined;
  const demoGoogleControl = demoGoogleAvailable
    ? `<a class="evo-login-demo-google" href="${demoGoogleHref}">
        <span class="evo-login-demo-google-icon" aria-hidden="true">${providerIcon("google")}</span>
        <span>${text.demoGoogle}</span>
      </a>`
    : `<button class="evo-login-demo-google" type="button" disabled aria-disabled="true">
        <span class="evo-login-demo-google-icon" aria-hidden="true">${providerIcon("google")}</span>
        <span>${text.demoGoogle}</span>
      </button>`;

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<title>${text.pageTitle}</title>
<link rel="stylesheet" href="/assets/${revision}/manager/app-host-shell.css">
<style>
html,body{min-height:100%;margin:0}
body{font-family:var(--eidos-font-family);color:var(--eidos-fg);background:var(--eidos-bg-subtle)}
*{box-sizing:border-box}
a{color:inherit}
.evo-login-shell{min-height:100vh;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(420px,.92fr)}
.evo-login-brand{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:clamp(32px,5vw,72px);color:#fff}
.evo-login-brand:after{content:"";position:absolute;width:520px;height:520px;right:-180px;bottom:-220px;border:1px solid rgba(255,255,255,.18);border-radius:50%;box-shadow:0 0 0 72px rgba(255,255,255,.035),0 0 0 144px rgba(255,255,255,.025)}
.evo-login-wordmark{position:relative;z-index:1;display:inline-flex;align-items:center;gap:12px;font-size:18px;font-weight:720;letter-spacing:.01em}
.evo-login-mark{display:grid;place-items:center;width:36px;height:36px;border:1px solid rgba(255,255,255,.34);border-radius:10px;background:rgba(255,255,255,.11);font-size:16px;font-weight:750}
.evo-login-hero{position:relative;z-index:1;max-width:650px;margin:auto 0}
.evo-login-eyebrow{margin:0 0 14px;font-size:12px;font-weight:700;color:rgba(255,255,255,.72)}
.evo-login-shell:not([data-login-skin="demo"]) .evo-login-eyebrow{letter-spacing:.1em;text-transform:uppercase}
.evo-login-hero h1{max-width:640px;margin:0;font-size:clamp(34px,4.5vw,58px);line-height:1.04;letter-spacing:-.035em}
.evo-login-hero>p:last-of-type{max-width:580px;margin:22px 0 0;font-size:16px;line-height:1.7;color:rgba(255,255,255,.78)}
.evo-login-visual{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;max-width:620px;margin-top:44px}
.evo-login-visual div{min-height:80px;padding:14px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(255,255,255,.08);backdrop-filter:blur(6px)}
.evo-login-visual strong{display:block;font-size:13px}
.evo-login-visual span{display:block;margin-top:5px;font-size:11px;line-height:1.45;color:rgba(255,255,255,.65)}
.evo-login-brand-footer{position:relative;z-index:1;font-size:12px;color:rgba(255,255,255,.58)}
.evo-login-main{display:flex;min-width:0;align-items:center;justify-content:center;padding:clamp(24px,5vw,68px);background:var(--eidos-bg)}
.evo-login-card{width:min(460px,100%)}
.evo-login-card-header{display:flex;justify-content:flex-end;margin-bottom:46px}
.evo-login-locale{font-size:12px;color:var(--eidos-fg-muted);text-decoration:none;padding:7px 10px;border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-sm)}
.evo-login-locale:hover{background:var(--eidos-bg-hover);color:var(--eidos-fg)}
.evo-login-card h2{margin:0;font-size:30px;line-height:1.15;letter-spacing:-.025em}
.evo-login-lead{margin:10px 0 28px;color:var(--eidos-fg-muted);font-size:14px;line-height:1.55}
.evo-login-unavailable{margin:0 0 16px;padding:12px 14px;border:1px solid color-mix(in srgb,var(--eidos-warning) 25%,var(--eidos-border));border-radius:var(--eidos-radius-md);background:var(--eidos-warning-bg);color:var(--eidos-fg);font-size:12px;line-height:1.5}
.evo-login-methods{display:grid;gap:10px}
.evo-login-method{width:100%;min-height:58px;display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:12px;padding:9px 12px;border:1px solid var(--eidos-border-strong);border-radius:var(--eidos-radius-md);background:var(--eidos-bg);color:var(--eidos-fg);font:inherit;text-align:left;text-decoration:none;transition:border-color .12s ease,box-shadow .12s ease,background .12s ease}
.evo-login-method[href]:hover{border-color:var(--eidos-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--eidos-primary) 10%,transparent)}
.evo-login-method[href]:focus-visible,.evo-login-locale:focus-visible{outline:2px solid var(--eidos-focus);outline-offset:2px}
.evo-login-method:disabled{cursor:not-allowed;opacity:.68}
.evo-login-method[data-status="PLANNED"],.evo-login-method[data-status="ADMIN_CONFIGURATION_REQUIRED"]{border-color:var(--eidos-border);background:var(--eidos-bg-subtle)}
.evo-login-provider-icon{display:grid;place-items:center;width:32px;height:32px;border:1px solid var(--eidos-border);border-radius:9px;background:var(--eidos-bg);font-size:12px;font-weight:750;color:var(--eidos-fg-muted)}
.evo-login-provider-icon img{display:block;width:18px;height:18px;object-fit:contain}
.evo-login-method[data-provider="microsoft"] .evo-login-provider-icon{color:#5e5e5e}
.evo-login-method-copy{min-width:0}
.evo-login-method-copy strong{display:block;font-size:13px;font-weight:650}
.evo-login-method-copy small{display:block;margin-top:3px;color:var(--eidos-fg-muted);font-size:11px;white-space:normal}
.evo-login-status{font-size:10px;font-weight:650;color:var(--eidos-fg-subtle);white-space:nowrap;padding:4px 7px;border-radius:999px;background:var(--eidos-bg-hover)}
.evo-login-method[data-status="AVAILABLE"] .evo-login-status{color:var(--eidos-success);background:var(--eidos-success-bg)}
.evo-login-registration{margin-top:26px;padding-top:22px;border-top:1px solid var(--eidos-border)}
.evo-login-registration-row{display:flex;gap:16px;align-items:center;justify-content:space-between}
.evo-login-registration h3{margin:0;font-size:14px}
.evo-login-registration p{margin:5px 0 0;max-width:300px;color:var(--eidos-fg-muted);font-size:11px;line-height:1.45}
.evo-login-create{min-height:36px;white-space:nowrap;border:1px solid var(--eidos-border);border-radius:var(--eidos-radius-sm);padding:0 12px;background:var(--eidos-bg-subtle);color:var(--eidos-fg-muted)}
.evo-login-create:disabled{cursor:not-allowed}
.evo-login-trust{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:34px}
.evo-login-trust article{padding-top:12px;border-top:1px solid var(--eidos-border)}
.evo-login-trust strong{display:block;font-size:11px}
.evo-login-trust p{margin:5px 0 0;color:var(--eidos-fg-subtle);font-size:10px;line-height:1.5}
.evo-login-card-header{align-items:center;gap:8px}
.evo-login-skin-toggle{display:inline-flex;align-items:center;gap:5px;font-size:10px;color:var(--eidos-fg-subtle);text-decoration:none;padding:5px 8px;border:1px solid color-mix(in srgb,var(--eidos-border) 70%,transparent);border-radius:999px;background:transparent}
.evo-login-skin-toggle:hover{color:var(--eidos-fg-muted);background:var(--eidos-bg-hover)}
.evo-login-skin-dot{width:6px;height:6px;border-radius:50%;background:var(--eidos-border-strong);box-shadow:0 0 0 2px var(--eidos-bg)}
.evo-login-customer-logo{display:block;width:auto;height:auto;max-width:310px;max-height:94px;object-fit:contain;object-position:left center;filter:none;transform:none}
.evo-login-demo-topbar{position:absolute;z-index:10;top:0;left:0;right:0;height:126px;display:grid;grid-template-columns:minmax(300px,1fr) minmax(320px,1fr) minmax(360px,1fr);align-items:center;padding:16px clamp(34px,4vw,72px);pointer-events:none}
.evo-login-demo-logo,.evo-login-demo-topline,.evo-login-demo-top-actions{pointer-events:auto}
.evo-login-demo-logo{justify-self:start}
.evo-login-demo-topline{justify-self:center;color:#637fa4;font-size:12px;letter-spacing:.30em;white-space:nowrap}
.evo-login-demo-top-actions{justify-self:end;display:flex;align-items:center;gap:14px}
.evo-login-demo-language{color:#536b8a;font-size:12px;text-decoration:none;padding:7px 4px}
.evo-login-demo-skins{display:flex;padding:2px;border:1px solid rgba(118,151,191,.22);border-radius:999px;background:rgba(255,255,255,.54);box-shadow:0 8px 24px rgba(63,111,165,.06)}
.evo-login-demo-skins a{min-width:66px;padding:7px 12px;border-radius:999px;color:#71839b;font-size:11px;text-align:center;text-decoration:none}
.evo-login-demo-skins a[data-active="true"]{background:rgba(255,255,255,.96);color:#176fe6;box-shadow:0 4px 14px rgba(45,112,202,.14)}
.evo-login-demo-metrics{position:relative;z-index:4;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));max-width:660px;margin-top:31px}
.evo-login-demo-metrics>div{min-height:60px;padding:0 28px;border-left:1px solid rgba(49,102,162,.18)}
.evo-login-demo-metrics>div:first-child{padding-left:0;border-left:0}
.evo-login-demo-metrics strong{display:block;color:#0f68df;font-size:31px;line-height:1;font-weight:760;letter-spacing:-.02em}
.evo-login-demo-metrics span{display:block;margin-top:9px;color:#526b8b;font-size:11px;line-height:1.45}
.evo-login-demo-scene{position:absolute;z-index:0;inset:0;overflow:hidden;pointer-events:none}
.evo-login-demo-art{position:absolute;inset:0;height:100%;object-fit:cover;object-position:center bottom;filter:none;opacity:1}
.evo-login-demo-art-wash{position:absolute;inset:0;background:linear-gradient(180deg,rgba(244,250,255,.86) 0%,rgba(242,249,255,.54) 30%,rgba(240,248,255,.08) 52%,rgba(255,255,255,0) 72%)}
.evo-login-demo-tags span{position:absolute;z-index:3;padding:8px 14px;border:1px solid rgba(255,255,255,.68);border-radius:8px;background:linear-gradient(180deg,rgba(74,153,242,.82),rgba(39,112,205,.68));color:#fff;font-size:11px;box-shadow:0 8px 24px rgba(24,90,168,.18);backdrop-filter:blur(9px)}
.evo-login-demo-tags .tag-a{left:7%;top:68%}.evo-login-demo-tags .tag-b{left:49%;top:63%}.evo-login-demo-tags .tag-c{left:68%;top:75%}.evo-login-demo-tags .tag-d{left:8%;top:86%}
.evo-login-shell[data-login-skin="demo"]{position:relative;isolation:isolate;grid-template-columns:minmax(0,1.18fr) minmax(460px,.82fr);min-height:100vh;padding-inline:clamp(0px,3vw,60px);overflow:hidden;background:#d2eaff}
.evo-login-shell[data-login-skin="demo"]:before{content:"";position:absolute;z-index:1;inset:0;pointer-events:none;background:linear-gradient(90deg,#eef8ff 0%,rgba(238,248,255,.78) 3.5%,rgba(238,248,255,0) 10%,rgba(238,248,255,0) 90%,rgba(238,248,255,.78) 96.5%,#eef8ff 100%)}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand,.evo-login-shell[data-login-skin="demo"] .evo-login-main{position:relative;z-index:2}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand{padding:150px clamp(48px,4.6vw,78px) 54px;color:#081d3c}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand:after{display:none}
.evo-login-shell[data-login-skin="demo"] .evo-login-wordmark{display:none}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero{z-index:4;max-width:760px;margin:0;padding-top:3.5vh}
.evo-login-shell[data-login-skin="demo"] .evo-login-eyebrow{margin-bottom:16px;color:#536f91;font-size:18px}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero h1{max-width:760px;color:#061b3a;font-size:clamp(45px,4vw,66px);line-height:1.08;letter-spacing:-.04em}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero>p:last-of-type{max-width:670px;margin-top:20px;color:#536f91;font-size:18px;line-height:1.8}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand-footer{z-index:5;margin-top:auto;color:#365f8b;font-size:12px}
.evo-login-shell[data-login-skin="demo"] .evo-login-main{padding:134px clamp(40px,4vw,72px) 52px;background:transparent;align-items:center}
.evo-login-shell[data-login-skin="demo"] .evo-login-card{width:min(510px,100%);padding:44px 42px 34px;border:1px solid rgba(126,159,198,.30);border-radius:24px;background:rgba(255,255,255,.96);box-shadow:0 28px 72px rgba(42,91,148,.14);backdrop-filter:blur(16px)}
.evo-login-shell[data-login-skin="demo"] .evo-login-card-header{display:none}
.evo-login-standard-content{display:block}
.evo-login-demo-content{display:none}
.evo-login-shell[data-login-skin="demo"] .evo-login-standard-content{display:none}
.evo-login-shell[data-login-skin="demo"] .evo-login-demo-content{display:block}
.evo-login-demo-title{margin:0;color:#0d2445;font-size:34px;line-height:1.18;letter-spacing:-.03em}
.evo-login-demo-subtitle{margin:10px 0 30px;color:#667b98;font-size:14px;line-height:1.55}
.evo-login-demo-field{display:grid;gap:9px;margin-top:20px}
.evo-login-demo-field label{color:#233a58;font-size:13px;font-weight:650}
.evo-login-demo-input{height:56px;width:100%;border:1px solid #cbd9e9;border-radius:9px;padding:0 16px 0 46px;background-color:#fbfdff;color:#92a1b4;font:inherit;font-size:14px;background-repeat:no-repeat;background-position:16px center;background-size:20px 20px}
.evo-login-demo-input[data-icon="account"]{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%235f7898' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21a8 8 0 0 0-16 0'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E")}
.evo-login-demo-input[data-icon="password"]{padding-right:46px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%235f7898' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='5' y='10' width='14' height='10' rx='2'/%3E%3Cpath d='M8 10V7a4 4 0 0 1 8 0v3'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23859ab4' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 3l18 18'/%3E%3Cpath d='M10.6 10.6a2 2 0 0 0 2.8 2.8'/%3E%3Cpath d='M9.9 4.2A10.6 10.6 0 0 1 12 4c5 0 9 4.5 9 8a8.4 8.4 0 0 1-2.1 4.9'/%3E%3Cpath d='M6.6 6.6C4.4 8 3 10 3 12c0 3.5 4 8 9 8 1.5 0 2.9-.4 4.1-1.1'/%3E%3C/svg%3E");background-position:16px center,calc(100% - 16px) center;background-size:20px 20px,20px 20px}
.evo-login-demo-input:disabled{opacity:1;cursor:not-allowed;-webkit-text-fill-color:#a0aec0}
.evo-login-demo-row{display:flex;align-items:center;justify-content:space-between;margin:17px 0 24px;color:#637792;font-size:12px}
.evo-login-demo-check{display:inline-flex;align-items:center;gap:8px}
.evo-login-demo-check input{width:18px;height:18px;margin:0;accent-color:#1b6fe8}
.evo-login-demo-link-disabled{border:0;padding:0;background:transparent;color:#5b83be;font:inherit;font-size:12px;opacity:.62;cursor:not-allowed}
.evo-login-demo-primary{width:100%;height:56px;border:0;border-radius:9px;background:linear-gradient(90deg,#1268e8,#1d6ff0);color:#fff;font-size:15px;font-weight:700;letter-spacing:.22em;box-shadow:0 12px 28px rgba(29,111,240,.18);opacity:.48;cursor:not-allowed}
.evo-login-demo-divider{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:16px;margin:28px 0 24px;color:#95a4b8;font-size:12px}
.evo-login-demo-divider:before,.evo-login-demo-divider:after{content:"";height:1px;background:#dce5ef}
.evo-login-demo-google{width:100%;height:52px;display:flex;align-items:center;justify-content:center;gap:12px;border:1px solid #ccd9e8;border-radius:9px;background:#fff;color:#1d2e47;font:inherit;font-size:14px;font-weight:620;text-decoration:none}
.evo-login-demo-google[href]:hover{border-color:#8bb5ec;box-shadow:0 0 0 3px rgba(36,117,221,.07)}
.evo-login-demo-google:disabled{opacity:.62;cursor:not-allowed}
.evo-login-demo-google-icon{display:grid;place-items:center;width:22px;height:22px}
.evo-login-demo-google-icon img{display:block;width:20px;height:20px}
.evo-login-demo-more{margin-top:20px;padding:16px;border:1px dashed #d6e1ed;border-radius:10px;text-align:center;background:#fcfdff}
.evo-login-demo-more-icons{display:flex;justify-content:center;gap:13px;margin-bottom:9px}
.evo-login-demo-more-icons button{width:31px;height:31px;display:grid;place-items:center;border:1px solid #dce5ee;border-radius:8px;background:#f6f8fb;color:#9ba8ba;cursor:not-allowed}
.evo-login-demo-more-icon{display:block;width:17px;height:17px}
.evo-login-demo-more p{margin:0;color:#a0adbd;font-size:11px}
.evo-login-demo-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:28px;padding-top:22px;border-top:1px solid #e1e8f0;color:#7e8da2;font-size:12px}
.evo-login-demo-footer-group{display:flex;align-items:center;gap:7px}
.evo-login-demo-footer button{border:0;padding:0;background:transparent;color:#3e78c8;font:inherit;font-size:12px;opacity:.66;cursor:not-allowed}
@media(max-width:900px){
  .evo-login-shell{grid-template-columns:1fr}
  .evo-login-brand{min-height:auto;padding:24px 24px 28px}
  .evo-login-hero{margin:44px 0 0}
  .evo-login-hero h1{font-size:34px}
  .evo-login-hero>p:last-of-type{font-size:14px}
  .evo-login-visual,.evo-login-demo-metrics,.evo-login-brand-footer{display:none}
  .evo-login-demo-topbar{height:92px;grid-template-columns:1fr auto;padding:12px 20px}
  .evo-login-demo-topline{display:none}
  .evo-login-customer-logo{max-width:205px;max-height:68px}
  .evo-login-demo-top-actions{gap:7px}
  .evo-login-demo-language{display:none}
  .evo-login-shell[data-login-skin="demo"] .evo-login-brand{padding:108px 24px 32px;min-height:500px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-hero{margin:0;padding-top:12px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-demo-scene{opacity:.92}
  .evo-login-demo-tags{display:none}
  .evo-login-main{padding:30px 24px 46px;align-items:flex-start}
  .evo-login-shell[data-login-skin="demo"] .evo-login-main{padding-top:28px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-card{padding:30px 24px}
  .evo-login-demo-title{font-size:29px}
  .evo-login-card-header{margin-bottom:28px}
}
@media(max-width:520px){
  .evo-login-brand{padding:20px}
  .evo-login-hero{margin-top:30px}
  .evo-login-hero h1{font-size:28px}
  .evo-login-main{padding:24px 18px 36px}
  .evo-login-card h2{font-size:26px}
  .evo-login-registration-row{align-items:flex-start;flex-direction:column}
  .evo-login-trust{grid-template-columns:1fr}
}
@media(prefers-reduced-motion:reduce){.evo-login-method{transition:none}}
</style>
</head>
<body>
<main class="evo-login-shell" data-login-skin="${skin}">
  ${demoTopbar}
  ${demoScene}
  <section class="evo-login-brand" aria-labelledby="evo-login-hero-title">
    <div class="evo-login-wordmark">${brandMark}</div>
    <div class="evo-login-hero">
      <p class="evo-login-eyebrow">${skin === "demo" ? text.demoEyebrow : text.eyebrow}</p>
      <h1 id="evo-login-hero-title">${text.heroTitle}</h1>
      <p>${heroBody}</p>
      ${visual}
    </div>
    <div class="evo-login-brand-footer">${coverFooter}</div>
  </section>

  <section class="evo-login-main" aria-labelledby="evo-login-title">
    <div class="evo-login-card">
      <div class="evo-login-card-header">
        <a class="evo-login-skin-toggle" href="${skinHref}" aria-label="${skinAria}" title="${skinAria}">
          <span class="evo-login-skin-dot" aria-hidden="true"></span><span>${skinLabel}</span>
        </a>
        <a class="evo-login-locale" href="${switchHref}" hreflang="${switchLocale}">${switchLabel}</a>
      </div>
      <div class="evo-login-standard-content">
        <h2 id="evo-login-title">${text.signInTitle}</h2>
        <p class="evo-login-lead">${text.signInBody}</p>
        ${options.authenticationEnabled ? "" : `<p class="evo-login-unavailable" role="status">${text.authenticationUnavailable}</p>`}
        <div class="evo-login-methods" aria-label="${text.signInTitle}">
          ${methods}
        </div>

        <section class="evo-login-registration" aria-labelledby="evo-registration-title">
          <div class="evo-login-registration-row">
            <div>
              <h3 id="evo-registration-title">${text.noRegistrationTitle}</h3>
              <p>${text.noRegistrationBody}</p>
            </div>
            <button class="evo-login-create" type="button" disabled aria-disabled="true" title="${text.registrationPlanned}">${text.createAccount}</button>
          </div>
        </section>

        <div class="evo-login-trust">
          <article><strong>${text.security}</strong><p>${text.securityBody}</p></article>
          <article><strong>${text.access}</strong><p>${text.accessBody}</p></article>
          <article><strong>${text.flexible}</strong><p>${text.flexibleBody}</p></article>
        </div>
      </div>

      <div class="evo-login-demo-content" aria-labelledby="evo-demo-login-title">
        <h2 class="evo-login-demo-title" id="evo-demo-login-title">${text.demoWelcome}</h2>
        <p class="evo-login-demo-subtitle">${text.demoWelcomeBody}</p>
        ${options.authenticationEnabled ? "" : `<p class="evo-login-unavailable" role="status">${text.authenticationUnavailable}</p>`}

        <div class="evo-login-demo-field">
          <label for="evo-demo-account">${text.demoAccountLabel}</label>
          <input id="evo-demo-account" class="evo-login-demo-input" data-icon="account" type="text" placeholder="${text.demoAccountPlaceholder}" disabled aria-disabled="true">
        </div>
        <div class="evo-login-demo-field">
          <label for="evo-demo-password">${text.demoPasswordLabel}</label>
          <input id="evo-demo-password" class="evo-login-demo-input" data-icon="password" type="password" placeholder="${text.demoPasswordPlaceholder}" disabled aria-disabled="true">
        </div>
        <div class="evo-login-demo-row">
          <label class="evo-login-demo-check">
            <input type="checkbox" disabled aria-disabled="true"><span>${text.demoRemember}</span>
          </label>
          <button class="evo-login-demo-link-disabled" type="button" disabled aria-disabled="true">${text.demoForgot}</button>
        </div>
        <button class="evo-login-demo-primary" type="button" disabled aria-disabled="true">${text.demoLogin} →</button>

        <div class="evo-login-demo-divider"><span>${text.demoOr}</span></div>
        ${demoGoogleControl}

        <div class="evo-login-demo-more" aria-label="${text.demoMoreMethods}">
          <div class="evo-login-demo-more-icons">
            <button type="button" disabled aria-disabled="true" title="Microsoft">
              <svg class="evo-login-demo-more-icon" data-demo-method-icon="microsoft" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="3" width="8" height="8" rx="1" fill="currentColor"></rect>
                <rect x="13" y="3" width="8" height="8" rx="1" fill="currentColor"></rect>
                <rect x="3" y="13" width="8" height="8" rx="1" fill="currentColor"></rect>
                <rect x="13" y="13" width="8" height="8" rx="1" fill="currentColor"></rect>
              </svg>
            </button>
            <button type="button" disabled aria-disabled="true" title="Apple">
              <svg class="evo-login-demo-more-icon" data-demo-method-icon="apple" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M15.4 3.2c.8-.9 2-1.4 3.1-1.5.1 1.2-.3 2.3-1.1 3.2-.8.9-1.9 1.5-3.1 1.4-.1-1.1.4-2.3 1.1-3.1ZM19.4 12.7c0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.4-2.2-4.1-2.2-1.8-.2-3.4 1-4.3 1-.9 0-2.2-1-3.7-.9-1.9 0-3.7 1.1-4.7 2.8-2 3.5-.5 8.7 1.4 11.5.9 1.4 2.1 3 3.5 2.9 1.4-.1 1.9-.9 3.6-.9s2.1.9 3.6.9c1.5 0 2.5-1.4 3.4-2.8 1.1-1.6 1.6-3.2 1.6-3.3-.1 0-2.7-1-2.7-4.8Z"></path>
              </svg>
            </button>
            <button type="button" disabled aria-disabled="true" title="Enterprise SSO">
              <svg class="evo-login-demo-more-icon" data-demo-method-icon="sso" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 5 6v5c0 4.5 2.8 8.6 7 10 4.2-1.4 7-5.5 7-10V6l-7-3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
                <path d="M9.2 12.1 11 14l3.9-4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </button>
          </div>
          <p>${text.demoMoreMethods}</p>
        </div>

        <div class="evo-login-demo-footer">
          <div class="evo-login-demo-footer-group">
            <span>${text.demoNoAccount}</span>
            <button type="button" disabled aria-disabled="true">${text.demoContact}</button>
          </div>
          <button type="button" disabled aria-disabled="true">${text.demoHelp}</button>
        </div>
      </div>
    </div>
  </section>
</main>
</body>
</html>`;
}
