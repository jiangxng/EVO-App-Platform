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

export interface LoginExperienceOptionsV010 {
  assetRevision: string;
  returnTo?: string;
  locale?: string;
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
        eyebrow: "EVO 企业工作空间",
        heroTitle: "一个入口，连接企业工作。",
        heroBody: "安全进入应用、企业数据与智能能力。身份由组织策略统一管理。",
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
        eyebrow: "EVO enterprise workspace",
        heroTitle: "One secure entry to your enterprise work.",
        heroBody: "Access applications, enterprise data and intelligence through organization-governed identity.",
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

function iconText(method: LoginMethodV010["id"]): string {
  if (method === "google") return "G";
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
    <span class="evo-login-provider-icon" aria-hidden="true">${iconText(method.id)}</span>
    <span class="evo-login-method-copy">
      <strong>${method.label}</strong>
      <small>${method.supportingText}</small>
    </span>
    <span class="evo-login-status">${status}</span>
  </${tag}>`;
}

export function defaultLoginMethodsV010(input: {
  googleAvailable: boolean;
}): readonly LoginMethodV010[] {
  return [
    {
      id: "google",
      label: "Google",
      supportingText: "Google Workspace or Google account",
      status: input.googleAvailable ? "AVAILABLE" : "ADMIN_CONFIGURATION_REQUIRED",
      ...(input.googleAvailable ? { actionPath: "/auth/login" } : {})
    },
    {
      id: "microsoft",
      label: "Microsoft",
      supportingText: "Work, school or Microsoft account",
      status: "PLANNED"
    },
    {
      id: "enterprise-sso",
      label: "Enterprise SSO",
      supportingText: "Your organization's identity provider",
      status: "ADMIN_CONFIGURATION_REQUIRED"
    },
    {
      id: "email",
      label: "Email",
      supportingText: "Email-based or local account sign-in",
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
  const switchLocale = locale === "zh-CN" ? "en" : "zh-CN";
  const switchLabel = locale === "zh-CN" ? text.english : text.chinese;
  const switchHref = "/login?returnTo=" + encodeURIComponent(returnTo)
    + "&locale=" + encodeURIComponent(switchLocale);
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
.evo-login-method[data-provider="google"] .evo-login-provider-icon{color:#1a73e8}
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
@media(max-width:900px){
  .evo-login-shell{grid-template-columns:1fr}
  .evo-login-brand{min-height:auto;padding:24px 24px 28px}
  .evo-login-hero{margin:44px 0 0}
  .evo-login-hero h1{font-size:34px}
  .evo-login-hero>p:last-of-type{font-size:14px}
  .evo-login-visual,.evo-login-brand-footer{display:none}
  .evo-login-main{padding:30px 24px 46px;align-items:flex-start}
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
<main class="evo-login-shell">
  <section class="evo-login-brand" aria-labelledby="evo-login-hero-title">
    <div class="evo-login-wordmark"><span class="evo-login-mark" aria-hidden="true">E</span><span>EVO</span></div>
    <div class="evo-login-hero">
      <p class="evo-login-eyebrow">${text.eyebrow}</p>
      <h1 id="evo-login-hero-title">${text.heroTitle}</h1>
      <p>${text.heroBody}</p>
      <div class="evo-login-visual" aria-hidden="true">
        <div><strong>Applications</strong><span>Composable enterprise work</span></div>
        <div><strong>Context</strong><span>Governed enterprise resources</span></div>
        <div><strong>Intelligence</strong><span>Assistance with clear authority</span></div>
      </div>
    </div>
    <div class="evo-login-brand-footer">EVO · Enterprise software control plane</div>
  </section>

  <section class="evo-login-main" aria-labelledby="evo-login-title">
    <div class="evo-login-card">
      <div class="evo-login-card-header">
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
