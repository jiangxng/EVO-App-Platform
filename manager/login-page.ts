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
        demoEyebrow: "全球云通信 · AIoT",
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
        demoEyebrow: "Global Cloud Connectivity · AIoT",
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
  const skinLabel = skin === "demo" ? text.standardMode : text.demoMode;
  const skinAria = skin === "demo" ? text.switchToStandard : text.switchToDemo;
  const brandMark = skin === "demo"
    ? `<img class="evo-login-customer-logo" src="https://manuals.plus/wp-content/uploads/2024/12/TUGE-TECHNOLOGIES-Logo.jpg" alt="TUGE TECHNOLOGIES">`
    : `<span class="evo-login-mark" aria-hidden="true">E</span><span>EVO</span>`;
  const heroBody = skin === "demo" ? text.demoHeroBody : text.heroBody;
  const coverFooter = skin === "demo" ? text.demoFooter : text.coverFooter;
  const visual = skin === "demo"
    ? `<div class="evo-login-demo-metrics" aria-label="${text.demoEyebrow}">
        <div><strong>${text.demoMetricOneValue}</strong><span>${text.demoMetricOneLabel}</span></div>
        <div><strong>${text.demoMetricTwoValue}</strong><span>${text.demoMetricTwoLabel}</span></div>
        <div><strong>${text.demoMetricThreeValue}</strong><span>${text.demoMetricThreeLabel}</span></div>
      </div>
      <div class="evo-login-demo-tags" aria-hidden="true">
        <span>${text.demoTagOne}</span><span>${text.demoTagTwo}</span>
        <span>${text.demoTagThree}</span><span>${text.demoTagFour}</span>
      </div>`
    : `<div class="evo-login-visual" aria-hidden="true">
        <div><strong>${text.valueOneTitle}</strong><span>${text.valueOneBody}</span></div>
        <div><strong>${text.valueTwoTitle}</strong><span>${text.valueTwoBody}</span></div>
        <div><strong>${text.valueThreeTitle}</strong><span>${text.valueThreeBody}</span></div>
      </div>`;
  const demoScene = skin === "demo"
    ? `<div class="evo-login-demo-scene" aria-hidden="true">
        <div class="evo-login-demo-orbit orbit-a"></div>
        <div class="evo-login-demo-orbit orbit-b"></div>
        <div class="evo-login-demo-orbit orbit-c"></div>
        <div class="evo-login-demo-globe">
          <span class="node node-a"></span><span class="node node-b"></span>
          <span class="node node-c"></span><span class="node node-d"></span>
          <span class="node node-e"></span>
        </div>
      </div>`
    : "";
  const methods = options.methods
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
.evo-login-customer-logo{display:block;max-width:250px;max-height:72px;width:auto;height:auto;object-fit:contain;object-position:left center;filter:none;mix-blend-mode:normal}
.evo-login-demo-metrics{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;max-width:650px;margin-top:34px}
.evo-login-demo-metrics>div{padding:0 24px;border-left:1px solid rgba(20,71,130,.18)}
.evo-login-demo-metrics>div:first-child{padding-left:0;border-left:0}
.evo-login-demo-metrics strong{display:block;font-size:30px;line-height:1;color:#1769d2}
.evo-login-demo-metrics span{display:block;margin-top:8px;color:#536b89;font-size:11px;line-height:1.5}
.evo-login-demo-tags{position:relative;z-index:2;display:flex;flex-wrap:wrap;gap:8px;max-width:640px;margin-top:28px}
.evo-login-demo-tags span{padding:7px 11px;border:1px solid rgba(31,111,235,.18);border-radius:999px;background:rgba(255,255,255,.52);color:#315d91;font-size:11px;backdrop-filter:blur(8px)}
.evo-login-demo-scene{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.evo-login-demo-globe{position:absolute;width:min(66vw,880px);aspect-ratio:1;left:-9vw;bottom:-48%;border-radius:50%;background:
  radial-gradient(circle at 62% 30%,rgba(255,255,255,.78) 0 1.5%,transparent 1.8%),
  radial-gradient(circle at 38% 45%,rgba(255,255,255,.68) 0 1%,transparent 1.3%),
  radial-gradient(circle at 70% 52%,rgba(255,255,255,.75) 0 1.1%,transparent 1.4%),
  repeating-radial-gradient(circle at 50% 50%,rgba(255,255,255,.16) 0 1px,transparent 1px 58px),
  repeating-conic-gradient(from 0deg,rgba(255,255,255,.15) 0 1deg,transparent 1deg 22deg),
  radial-gradient(circle at 43% 34%,#79bff5 0 22%,#2c7bd3 44%,#0d4b99 70%,#08376f 100%);
  box-shadow:0 -24px 90px rgba(67,148,231,.25),inset 0 0 70px rgba(255,255,255,.2)}
.evo-login-demo-globe:after{content:"";position:absolute;inset:-3%;border-radius:50%;border:1px solid rgba(111,186,255,.7);box-shadow:0 0 22px rgba(67,150,240,.55),0 0 80px rgba(67,150,240,.22)}
.evo-login-demo-orbit{position:absolute;border:1px solid rgba(56,137,226,.22);border-radius:50%;transform:rotate(-10deg)}
.evo-login-demo-orbit.orbit-a{width:72%;height:25%;left:2%;bottom:23%}
.evo-login-demo-orbit.orbit-b{width:61%;height:18%;left:10%;bottom:32%;transform:rotate(8deg)}
.evo-login-demo-orbit.orbit-c{width:56%;height:15%;left:18%;bottom:18%;transform:rotate(-24deg)}
.evo-login-demo-globe .node{position:absolute;width:8px;height:8px;border:2px solid rgba(255,255,255,.9);border-radius:50%;background:#3f9cf4;box-shadow:0 0 0 5px rgba(72,160,242,.12),0 0 18px rgba(72,160,242,.8)}
.evo-login-demo-globe .node-a{left:48%;top:19%}.evo-login-demo-globe .node-b{left:64%;top:27%}.evo-login-demo-globe .node-c{left:56%;top:41%}.evo-login-demo-globe .node-d{left:76%;top:38%}.evo-login-demo-globe .node-e{left:42%;top:52%}
.evo-login-shell[data-login-skin="demo"]{grid-template-columns:minmax(0,1.24fr) minmax(430px,.76fr);background:#eef6ff}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand{padding:clamp(34px,4.6vw,70px);background:
  radial-gradient(circle at 18% 18%,rgba(255,255,255,.95),transparent 28%),
  radial-gradient(circle at 70% 12%,rgba(166,213,255,.34),transparent 35%),
  linear-gradient(145deg,#f8fbff 0%,#e4f1ff 58%,#cfe7ff 100%);color:#0b2240}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand:after{display:none}
.evo-login-shell[data-login-skin="demo"] .evo-login-wordmark{z-index:3}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero{z-index:3;max-width:720px;margin:10vh 0 auto}
.evo-login-shell[data-login-skin="demo"] .evo-login-eyebrow{color:#3a6698;letter-spacing:.08em}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero h1{max-width:720px;color:#071a36;font-size:clamp(40px,4.5vw,64px)}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero>p:last-of-type{max-width:650px;color:#516b89;font-size:16px}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand-footer{z-index:3;color:#4d6887}
.evo-login-shell[data-login-skin="demo"] .evo-login-main{background:linear-gradient(180deg,#edf6ff 0%,#e6f1ff 100%);padding:clamp(26px,4vw,56px)}
.evo-login-shell[data-login-skin="demo"] .evo-login-card{width:min(470px,100%);padding:34px 34px 30px;border:1px solid rgba(143,176,215,.34);border-radius:24px;background:rgba(255,255,255,.92);box-shadow:0 24px 70px rgba(60,108,164,.15);backdrop-filter:blur(14px)}
.evo-login-shell[data-login-skin="demo"] .evo-login-card-header{margin-bottom:34px}
.evo-login-shell[data-login-skin="demo"] .evo-login-method{border-color:#d5e0ed}
.evo-login-shell[data-login-skin="demo"] .evo-login-method[href]:hover{border-color:#2475dd;box-shadow:0 0 0 3px rgba(36,117,221,.08)}
.evo-login-shell[data-login-skin="demo"] .evo-login-skin-dot{background:#2d7fe1}
@media(max-width:900px){
  .evo-login-shell{grid-template-columns:1fr}
  .evo-login-brand{min-height:auto;padding:24px 24px 28px}
  .evo-login-hero{margin:44px 0 0}
  .evo-login-hero h1{font-size:34px}
  .evo-login-hero>p:last-of-type{font-size:14px}
  .evo-login-visual,.evo-login-demo-metrics,.evo-login-demo-tags,.evo-login-brand-footer{display:none}
  .evo-login-demo-scene{opacity:.62}
  .evo-login-customer-logo{max-width:210px;max-height:58px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-hero{margin:44px 0 0}
  .evo-login-main{padding:30px 24px 46px;align-items:flex-start}
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
@media(prefers-reduced-motion:reduce){.evo-login-method{transition:none}}
</style>
</head>
<body>
<main class="evo-login-shell" data-login-skin="${skin}">
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
    <div class="evo-login-card">
      <div class="evo-login-card-header">
        <a class="evo-login-skin-toggle" href="${skinHref}" aria-label="${skinAria}" title="${skinAria}">
          <span class="evo-login-skin-dot" aria-hidden="true"></span><span>${skinLabel}</span>
        </a>
        <a class="evo-login-locale" href="${switchHref}" hreflang="${switchLocale}">${switchLabel}</a>
      </div>
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
  </section>
</main>
</body>
</html>`;
}
