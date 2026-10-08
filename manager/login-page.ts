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
  const brandMark = skin === "demo"
    ? `<img class="evo-login-customer-logo" src="/login-assets/tuge-logo-transparent.webp" alt="途鸽 TUGE GROUP">`
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
        <img class="evo-login-demo-art" src="/login-assets/tuge-login-background.webp" alt="">
        <div class="evo-login-demo-art-wash"></div>
        <div class="evo-login-demo-tags">
          <span class="tag-a">${text.demoTagOne}</span>
          <span class="tag-b">${text.demoTagTwo}</span>
          <span class="tag-c">${text.demoTagThree}</span>
          <span class="tag-d">${text.demoTagFour}</span>
        </div>
      </div>`
    : "";
  const demoTopbar = `<header class="evo-login-demo-topbar">
        <div class="evo-login-demo-logo">${brandMark}</div>
        <div class="evo-login-demo-topline">${skin === "demo" ? text.demoTopline : (locale === "zh-CN" ? "让目标、责任与结果清晰连接" : "Connect goals, ownership and results")}</div>
        <div class="evo-login-demo-top-actions">
          <a class="evo-login-demo-language" href="${switchHref}" hreflang="${switchLocale}">◎ ${switchLabel}</a>
          <nav class="evo-login-demo-skins" aria-label="${skinAria}">
            <a href="${standardHref}"${skin === "standard" ? ' aria-current="page"' : ""}>${locale === "zh-CN" ? "标准版" : "Standard"}</a>
            <a href="${demoHref}"${skin === "demo" ? ' aria-current="page"' : ""}>${locale === "zh-CN" ? "演示版" : "Demo"}</a>
          </nav>
        </div>
      </header>`;
  const methods = options.methods
    .map(method => providerButton(method, returnTo, locale, text))
    .join("");
  const googleMethod = options.methods
    .filter(method => method.id === "google")
    .map(method => providerButton(method, returnTo, locale, text))
    .join("");

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
.evo-login-brand{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:clamp(32px,5vw,72px);background:linear-gradient(145deg,#18344f 0%,#214d75 52%,#2b6cb0 100%);color:#fff}
.evo-login-brand:after{content:"";position:absolute;width:520px;height:520px;right:-180px;bottom:-220px;border:1px solid rgba(255,255,255,.18);border-radius:50%;box-shadow:0 0 0 72px rgba(255,255,255,.035),0 0 0 144px rgba(255,255,255,.025)}
.evo-login-wordmark{position:relative;z-index:1;display:inline-flex;align-items:center;gap:12px;font-size:18px;font-weight:720;letter-spacing:.01em}
.evo-login-mark{display:grid;place-items:center;width:36px;height:36px;border:1px solid rgba(255,255,255,.34);border-radius:10px;background:rgba(255,255,255,.11);font-size:16px;font-weight:750}
.evo-login-hero{position:relative;z-index:1;max-width:650px;margin:auto 0}
.evo-login-eyebrow{margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.72)}
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
.evo-login-customer-logo{display:block;width:auto;height:auto;max-width:252px;max-height:74px;object-fit:contain;object-position:left center;filter:none;transform:none}
.evo-login-demo-topbar{position:absolute;z-index:10;top:0;left:0;right:0;height:116px;display:grid;grid-template-columns:minmax(290px,1fr) minmax(320px,1fr) minmax(360px,1fr);align-items:center;padding:18px clamp(34px,4vw,72px);pointer-events:none}
.evo-login-demo-logo,.evo-login-demo-topline,.evo-login-demo-top-actions{pointer-events:auto}
.evo-login-demo-logo{justify-self:start}
.evo-login-demo-topline{justify-self:center;color:#6782a7;font-size:12px;letter-spacing:.32em;white-space:nowrap}
.evo-login-demo-top-actions{justify-self:end;display:flex;align-items:center;gap:14px}
.evo-login-demo-language{color:#536b8a;font-size:12px;text-decoration:none;padding:7px 4px}
.evo-login-demo-skins{display:flex;padding:2px;border:1px solid rgba(118,151,191,.22);border-radius:999px;background:rgba(255,255,255,.48);box-shadow:0 8px 24px rgba(63,111,165,.05)}
.evo-login-demo-skins a{min-width:66px;padding:7px 12px;border-radius:999px;color:#71839b;font-size:11px;text-align:center;text-decoration:none}
.evo-login-demo-skins a[data-active="true"]{background:rgba(255,255,255,.92);color:#1f6fdf;box-shadow:0 4px 14px rgba(45,112,202,.12)}
.evo-login-demo-metrics{position:relative;z-index:4;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));max-width:680px;margin-top:32px}
.evo-login-demo-metrics>div{min-height:58px;padding:0 28px;border-left:1px solid rgba(49,102,162,.18)}
.evo-login-demo-metrics>div:first-child{padding-left:0;border-left:0}
.evo-login-demo-metrics strong{display:block;color:#1269dc;font-size:30px;line-height:1;font-weight:760;letter-spacing:-.02em}
.evo-login-demo-metrics span{display:block;margin-top:9px;color:#506a8c;font-size:11px;line-height:1.45}
.evo-login-demo-scene{position:absolute;z-index:1;left:0;right:0;bottom:0;height:58%;overflow:hidden;pointer-events:none}
.evo-login-demo-art{position:absolute;left:-4%;bottom:-4%;width:108%;height:108%;object-fit:cover;object-position:58% 55%;filter:saturate(.92) brightness(1.06);opacity:.96}
.evo-login-demo-art-wash{position:absolute;inset:0;background:linear-gradient(180deg,#eaf5ff 0%,rgba(234,245,255,.70) 16%,rgba(234,245,255,.06) 48%,rgba(211,232,252,.08) 100%)}
.evo-login-demo-tags span{position:absolute;z-index:3;padding:8px 14px;border:1px solid rgba(255,255,255,.62);border-radius:8px;background:linear-gradient(180deg,rgba(79,153,239,.70),rgba(49,119,207,.58));color:#fff;font-size:11px;box-shadow:0 8px 24px rgba(24,90,168,.18);backdrop-filter:blur(10px)}
.evo-login-demo-tags .tag-a{left:7%;top:47%}.evo-login-demo-tags .tag-b{left:50%;top:35%}.evo-login-demo-tags .tag-c{left:68%;top:57%}.evo-login-demo-tags .tag-d{left:8%;top:76%}
.evo-login-shell[data-login-skin="demo"]{position:relative;grid-template-columns:minmax(0,1.23fr) minmax(430px,.77fr);min-height:100vh;background:#eaf5ff}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand{padding:150px clamp(44px,4.4vw,74px) 54px;background:linear-gradient(145deg,#f9fcff 0%,#edf7ff 37%,#dceeff 100%);color:#0a2240}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand:after{display:none}
.evo-login-shell[data-login-skin="demo"] .evo-login-wordmark{display:none}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero{z-index:4;max-width:760px;margin:0;padding-top:5vh}
.evo-login-shell[data-login-skin="demo"] .evo-login-eyebrow{margin-bottom:16px;color:#315d92;font-size:13px;letter-spacing:.02em;text-transform:none}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero h1{max-width:750px;color:#071b39;font-size:clamp(45px,4vw,66px);line-height:1.08;letter-spacing:-.04em}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero>p:last-of-type{max-width:680px;margin-top:20px;color:#526d8d;font-size:15px;line-height:1.8}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand-footer{z-index:5;margin-top:auto;color:#365f8b;font-size:12px}
.evo-login-shell[data-login-skin="demo"] .evo-login-main{padding:136px clamp(38px,4vw,68px) 48px;background:linear-gradient(180deg,#eaf5ff 0%,#e2f0ff 100%);align-items:center}
.evo-login-shell[data-login-skin="demo"] .evo-login-card{width:min(500px,100%);padding:42px 40px 34px;border:1px solid rgba(126,159,198,.30);border-radius:24px;background:rgba(255,255,255,.95);box-shadow:0 26px 70px rgba(42,91,148,.14);backdrop-filter:blur(16px)}
.evo-login-shell[data-login-skin="demo"] .evo-login-card-header{display:none}
.evo-login-shell[data-login-skin="demo"] .evo-login-card h2{font-size:31px;color:#132842}
.evo-login-shell[data-login-skin="demo"] .evo-login-lead{margin-bottom:30px}
.evo-login-shell[data-login-skin="demo"] .evo-login-methods{gap:10px}
.evo-login-shell[data-login-skin="demo"] .evo-login-method{min-height:58px;border-color:#d5e1ee;border-radius:10px;background:#fff}
.evo-login-shell[data-login-skin="demo"] .evo-login-method[data-status="PLANNED"],.evo-login-shell[data-login-skin="demo"] .evo-login-method[data-status="ADMIN_CONFIGURATION_REQUIRED"]{background:#f8fbfe}
.evo-login-shell[data-login-skin="demo"] .evo-login-method[href]:hover{border-color:#2475dd;box-shadow:0 0 0 3px rgba(36,117,221,.08)}
.evo-login-shell[data-login-skin="demo"] .evo-login-registration{margin-top:24px}
.evo-login-shell[data-login-skin="demo"] .evo-login-trust{margin-top:28px}
@media(max-width:900px){
  .evo-login-shell{grid-template-columns:1fr}
  .evo-login-brand{min-height:auto;padding:24px 24px 28px}
  .evo-login-hero{margin:44px 0 0}
  .evo-login-hero h1{font-size:34px}
  .evo-login-hero>p:last-of-type{font-size:14px}
  .evo-login-visual,.evo-login-demo-metrics,.evo-login-brand-footer{display:none}
  .evo-login-demo-topbar{height:84px;grid-template-columns:1fr auto;padding:14px 22px}
  .evo-login-demo-topline{display:none}
  .evo-login-customer-logo{max-width:190px;max-height:54px}
  .evo-login-demo-top-actions{gap:7px}
  .evo-login-demo-language{display:none}
  .evo-login-shell[data-login-skin="demo"] .evo-login-brand{padding:104px 24px 32px;min-height:460px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-hero{margin:0;padding-top:18px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-demo-scene{height:48%;opacity:.82}
  .evo-login-demo-tags{display:none}
  .evo-login-main{padding:30px 24px 46px;align-items:flex-start}
  .evo-login-shell[data-login-skin="demo"] .evo-login-main{padding-top:28px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-card{padding:28px 24px}
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
/* Final reference layout shared by Standard and Demo */
.evo-login-shell{position:relative;grid-template-columns:minmax(0,1.16fr) minmax(430px,.84fr);background:#eaf4ff}
.evo-login-demo-topbar{display:grid}
.evo-login-demo-logo .evo-login-mark{color:#fff;background:#2169b4;border-color:#2169b4}
.evo-login-demo-logo>span:last-child{color:#17385b;font-size:20px;font-weight:760}
.evo-login-demo-skins a[aria-current="page"]{background:#fff;color:#176be0;box-shadow:0 4px 14px rgba(45,112,202,.12)}
.evo-login-shell[data-login-skin="standard"] .evo-login-brand{padding:150px clamp(44px,4.4vw,74px) 54px;background:linear-gradient(145deg,#fbfdff 0%,#edf7ff 47%,#dcefff 100%);color:#0b2240}
.evo-login-shell[data-login-skin="standard"] .evo-login-brand:after{width:780px;height:780px;right:auto;left:-270px;bottom:-530px;border-color:rgba(42,117,201,.14);box-shadow:0 0 0 90px rgba(55,136,218,.035),0 0 0 180px rgba(55,136,218,.022)}
.evo-login-shell[data-login-skin="standard"] .evo-login-wordmark{display:none}
.evo-login-shell[data-login-skin="standard"] .evo-login-hero{max-width:760px;margin:0;padding-top:5vh}
.evo-login-shell[data-login-skin="standard"] .evo-login-eyebrow{color:#315d92;letter-spacing:.02em;text-transform:none}
.evo-login-shell[data-login-skin="standard"] .evo-login-hero h1{max-width:750px;color:#071b39;font-size:clamp(45px,4vw,66px);line-height:1.08;letter-spacing:-.04em}
.evo-login-shell[data-login-skin="standard"] .evo-login-hero>p:last-of-type{max-width:680px;color:#526d8d;font-size:15px}
.evo-login-shell[data-login-skin="standard"] .evo-login-visual{max-width:690px;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;margin-top:34px}
.evo-login-shell[data-login-skin="standard"] .evo-login-visual div{min-height:62px;padding:0 28px;border:0;border-left:1px solid rgba(49,102,162,.18);border-radius:0;background:transparent;backdrop-filter:none}
.evo-login-shell[data-login-skin="standard"] .evo-login-visual div:first-child{padding-left:0;border-left:0}
.evo-login-shell[data-login-skin="standard"] .evo-login-visual strong{color:#174e83;font-size:14px}
.evo-login-shell[data-login-skin="standard"] .evo-login-visual span{color:#627b98;font-size:11px;line-height:1.55}
.evo-login-shell[data-login-skin="standard"] .evo-login-brand-footer{color:#3d648c}
.evo-login-shell[data-login-skin="demo"] .evo-login-demo-scene{height:74%}
.evo-login-shell[data-login-skin="demo"] .evo-login-demo-art{left:0;bottom:0;width:100%;height:100%;object-fit:cover;object-position:center bottom;filter:none;opacity:1}
.evo-login-shell[data-login-skin="demo"] .evo-login-demo-art-wash{background:linear-gradient(180deg,#edf7ff 0%,rgba(237,247,255,.92) 11%,rgba(237,247,255,.48) 29%,rgba(237,247,255,.04) 58%,transparent 100%)}
.evo-login-main{padding:132px clamp(38px,4vw,68px) 48px;background:linear-gradient(180deg,#eaf5ff 0%,#e1efff 100%)}
.evo-login-final-card{width:min(510px,100%);padding:42px 40px 34px;border:1px solid rgba(126,158,196,.30);border-radius:24px;background:rgba(255,255,255,.965);box-shadow:0 26px 72px rgba(44,91,147,.15);backdrop-filter:blur(16px)}
.evo-login-final-card .evo-login-lead{margin:10px 0 22px;color:#627892}
.evo-login-final-card h2{color:#102743;font-size:32px}
.evo-login-coming-soon{display:inline-flex;margin-bottom:12px;padding:4px 8px;border-radius:999px;background:#f1f6fb;color:#7890a9;font-size:10px}
.evo-login-credential-field{display:grid;gap:8px;margin-top:16px}
.evo-login-credential-field label{color:#243b57;font-size:13px;font-weight:650}
.evo-login-input-wrap{position:relative}
.evo-login-input-wrap input{width:100%;height:54px;border:1px solid #d3dfec;border-radius:10px;padding:0 46px;color:#8b9caf;background:#f9fbfd;outline:none}
.evo-login-input-wrap input:disabled{cursor:not-allowed;opacity:1}
.evo-login-input-wrap input::placeholder{color:#a8b5c4}
.evo-login-input-icon{position:absolute;left:15px;top:50%;transform:translateY(-50%);color:#8297b0;font-size:17px}
.evo-login-password-eye{position:absolute;right:15px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#889bb2;font-size:17px;cursor:not-allowed}
.evo-login-credential-row{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:17px 0}
.evo-login-remember{display:flex;align-items:center;gap:8px;color:#5a708b;font-size:12px}
.evo-login-remember input{width:18px;height:18px}
.evo-login-text-action{border:0;background:transparent;color:#9aacbf;font-size:12px;padding:0;cursor:not-allowed}
.evo-login-primary-disabled{width:100%;height:56px;border:0;border-radius:9px;background:linear-gradient(90deg,#78acf0,#8ab8f2);color:rgba(255,255,255,.94);font-size:16px;font-weight:700;letter-spacing:.12em;cursor:not-allowed;opacity:.72}
.evo-login-divider{display:flex;align-items:center;gap:16px;margin:24px 0;color:#93a4b7;font-size:11px}
.evo-login-divider:before,.evo-login-divider:after{content:"";height:1px;flex:1;background:#dce5ef}
.evo-login-final-google .evo-login-method{min-height:52px;display:flex;align-items:center;justify-content:center;gap:12px;border-color:#d5e0ec;border-radius:9px;background:#fff}
.evo-login-final-google .evo-login-method-copy strong{font-size:13px}
.evo-login-final-google .evo-login-method-copy small,.evo-login-final-google .evo-login-status{display:none}
.evo-login-final-google .evo-login-provider-icon{width:auto;height:auto;border:0;background:transparent}
.evo-login-more-methods{margin-top:18px;padding:16px;border:1px dashed #d9e3ee;border-radius:10px;background:#fbfdff;text-align:center}
.evo-login-more-icons{display:flex;justify-content:center;gap:12px;margin-bottom:8px}
.evo-login-more-icons span{display:grid;place-items:center;min-width:28px;height:28px;padding:0 5px;border-radius:7px;background:#f0f4f8;color:#a0afbf;font-size:10px;font-weight:700}
.evo-login-more-methods p{margin:0;color:#9babbc;font-size:11px}
.evo-login-final-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:26px;padding-top:20px;border-top:1px solid #e1e8f0;color:#75889f;font-size:11px}
.evo-login-final-footer>div{display:flex;align-items:center;gap:8px}
.evo-login-final-footer button{border:0;background:transparent;color:#9aabba;font-size:11px;padding:0;cursor:not-allowed}
@media(max-width:900px){
  .evo-login-shell[data-login-skin="standard"] .evo-login-brand{padding:104px 24px 32px;min-height:460px}
  .evo-login-shell[data-login-skin="standard"] .evo-login-hero{margin:0;padding-top:18px}
  .evo-login-main{padding:30px 24px 46px}
  .evo-login-final-card{padding:28px 24px}
}
@media(max-width:520px){
  .evo-login-final-footer{align-items:flex-start;flex-direction:column}
}

@media(prefers-reduced-motion:reduce){.evo-login-method{transition:none}}
</style>
</head>
<body>
<main class="evo-login-shell" data-login-skin="${skin}">
  ${demoTopbar}
  <section class="evo-login-brand" aria-labelledby="evo-login-hero-title">
    <div class="evo-login-wordmark">${brandMark}</div>
    <div class="evo-login-hero">
      <p class="evo-login-eyebrow">${skin === "demo" ? text.demoEyebrow : text.eyebrow}</p>
      <h1 id="evo-login-hero-title">${text.heroTitle}</h1>
      <p>${heroBody}</p>
      ${visual}
    </div>
    ${demoScene}
    <div class="evo-login-brand-footer">${coverFooter}</div>
  </section>

  <section class="evo-login-main" aria-labelledby="evo-login-title">
    <div class="evo-login-card evo-login-final-card">
      <h2 id="evo-login-title">${locale === "zh-CN" ? "欢迎登录" : "Welcome"}</h2>
      <p class="evo-login-lead">${skin === "demo"
        ? (locale === "zh-CN" ? "登录企业工作空间，开启全球连接新可能。" : "Sign in to your enterprise workspace and unlock global connectivity.")
        : (locale === "zh-CN" ? "登录 EVO 企业工作空间，继续你的工作。" : "Sign in to your EVO enterprise workspace and continue your work.")}</p>
      ${options.authenticationEnabled ? "" : `<p class="evo-login-unavailable" role="status">${text.authenticationUnavailable}</p>`}
      <span class="evo-login-coming-soon">${locale === "zh-CN" ? "账号密码登录功能尚未启用" : "Account and password sign-in is not enabled yet"}</span>

      <div class="evo-login-credential-field">
        <label for="evo-login-account">${locale === "zh-CN" ? "账号 / 邮箱" : "Account / Email"}</label>
        <div class="evo-login-input-wrap">
          <span class="evo-login-input-icon" aria-hidden="true">✉</span>
          <input id="evo-login-account" type="email" autocomplete="username"
            placeholder="${locale === "zh-CN" ? "请输入账号或邮箱" : "Enter account or email"}"
            disabled aria-disabled="true">
        </div>
      </div>

      <div class="evo-login-credential-field">
        <label for="evo-login-password">${locale === "zh-CN" ? "密码" : "Password"}</label>
        <div class="evo-login-input-wrap">
          <span class="evo-login-input-icon" aria-hidden="true">▣</span>
          <input id="evo-login-password" type="password" autocomplete="current-password"
            placeholder="${locale === "zh-CN" ? "请输入密码" : "Enter password"}"
            disabled aria-disabled="true">
          <button class="evo-login-password-eye" type="button" disabled aria-disabled="true"
            title="${text.planned}">◉</button>
        </div>
      </div>

      <div class="evo-login-credential-row">
        <label class="evo-login-remember"><input type="checkbox" disabled aria-disabled="true">
          <span>${locale === "zh-CN" ? "记住我" : "Remember me"}</span></label>
        <button class="evo-login-text-action" type="button" disabled aria-disabled="true"
          title="${text.planned}">${locale === "zh-CN" ? "忘记密码？" : "Forgot password?"}</button>
      </div>

      <button class="evo-login-primary-disabled" type="button" disabled aria-disabled="true"
        title="${text.planned}">${locale === "zh-CN" ? "登 录" : "Sign in"} →</button>

      <div class="evo-login-divider"><span>${locale === "zh-CN" ? "或" : "or"}</span></div>
      <div class="evo-login-final-google">${googleMethod}</div>

      <div class="evo-login-more-methods" aria-disabled="true">
        <div class="evo-login-more-icons" aria-hidden="true"><span>M</span><span>SSO</span><span>•••</span></div>
        <p>${locale === "zh-CN" ? "更多登录方式，敬请期待" : "More sign-in methods coming soon"}</p>
      </div>

      <footer class="evo-login-final-footer">
        <div><span>${locale === "zh-CN" ? "还没有账号？" : "New to EVO?"}</span>
          <button type="button" disabled aria-disabled="true" title="${text.planned}">${locale === "zh-CN" ? "联系我们" : "Contact us"}</button></div>
        <button type="button" disabled aria-disabled="true" title="${text.planned}">${locale === "zh-CN" ? "帮助中心" : "Help center"}</button>
      </footer>
    </div>
  </section>
</main>
</body>
</html>`;
}
