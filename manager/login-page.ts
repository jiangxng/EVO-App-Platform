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
  const zh = locale === "zh-CN";
  const text = copy(locale);
  const revision = safeRevision(options.assetRevision);
  const returnTo = normalizeAuthenticationReturnToV010(options.returnTo);
  const skin: LoginSkinV010 = options.skin === "demo" ? "demo" : "standard";
  const switchLocale = locale === "zh-CN" ? "en" : "zh-CN";
  const switchLabel = locale === "zh-CN" ? text.english : text.chinese;
  const switchHref = "/login?returnTo=" + encodeURIComponent(returnTo)
    + "&locale=" + encodeURIComponent(switchLocale)
    + "&skin=" + encodeURIComponent(skin);
  const standardHref = "/login?returnTo=" + encodeURIComponent(returnTo)
    + "&locale=" + encodeURIComponent(locale)
    + "&skin=standard";
  const demoHref = "/login?returnTo=" + encodeURIComponent(returnTo)
    + "&locale=" + encodeURIComponent(locale)
    + "&skin=demo";

  const formText = zh
    ? {
        welcome: skin === "demo" ? "欢迎登录" : "登录到 EVO",
        subtitle: skin === "demo"
          ? "登录途鸽企业平台，开启全球连接新可能"
          : "使用你的企业身份安全进入工作空间。",
        account: "账号 / 邮箱",
        accountPlaceholder: "请输入账号或邮箱",
        password: "密码",
        passwordPlaceholder: "请输入密码",
        remember: "记住我",
        forgot: "忘记密码？",
        signIn: "登 录",
        or: "或",
        google: "使用 Google 账号登录",
        more: "更多登录方式，敬请期待",
        noAccount: "还没有账号？",
        contact: "联系我们",
        help: "帮助中心",
        unavailable: "该登录方式尚未开放",
        standard: "标准版",
        demo: "演示版"
      }
    : {
        welcome: skin === "demo" ? "Welcome" : "Sign in to EVO",
        subtitle: skin === "demo"
          ? "Sign in to the TUGE enterprise platform and connect globally."
          : "Use your enterprise identity to enter the workspace securely.",
        account: "Account / Email",
        accountPlaceholder: "Enter account or email",
        password: "Password",
        passwordPlaceholder: "Enter password",
        remember: "Remember me",
        forgot: "Forgot password?",
        signIn: "Sign in",
        or: "or",
        google: "Continue with Google",
        more: "More sign-in methods coming soon",
        noAccount: "Need an account?",
        contact: "Contact us",
        help: "Help center",
        unavailable: "This sign-in method is not available yet",
        standard: "Standard",
        demo: "Demo"
      };

  const google = options.methods.find(method => method.id === "google");
  const googleAvailable = options.authenticationEnabled
    && google?.status === "AVAILABLE"
    && Boolean(google.actionPath);
  const googleHref = googleAvailable && google?.actionPath
    ? google.actionPath
      + "?returnTo=" + encodeURIComponent(returnTo)
      + "&locale=" + encodeURIComponent(locale)
    : undefined;

  const skinSwitch = `<nav class="evo-login-skin-switch" aria-label="${text.switchToDemo}">
    <a href="${standardHref}" data-active="${skin === "standard"}">${formText.standard}</a>
    <a href="${demoHref}" data-active="${skin === "demo"}">${formText.demo}</a>
  </nav>`;

  const card = `<section class="evo-login-main" aria-labelledby="evo-login-title">
    <div class="evo-login-card">
      <div class="evo-login-card-tools">
        ${skin === "standard" ? skinSwitch : ""}
        <a class="evo-login-locale" href="${switchHref}" hreflang="${switchLocale}">${switchLabel}</a>
      </div>

      <h2 id="evo-login-title">${formText.welcome}</h2>
      <p class="evo-login-lead">${formText.subtitle}</p>
      ${options.authenticationEnabled ? "" : `<p class="evo-login-unavailable" role="status">${text.authenticationUnavailable}</p>`}

      <form class="evo-login-local-form" data-evo-login-local-credentials aria-label="${formText.welcome}">
        <label class="evo-login-field">
          <span>${formText.account}</span>
          <span class="evo-login-input-shell">
            <span class="evo-login-field-icon" aria-hidden="true">✉</span>
            <input type="text" placeholder="${formText.accountPlaceholder}" disabled aria-disabled="true">
          </span>
        </label>

        <label class="evo-login-field">
          <span>${formText.password}</span>
          <span class="evo-login-input-shell">
            <span class="evo-login-field-icon" aria-hidden="true">▣</span>
            <input type="password" placeholder="${formText.passwordPlaceholder}" disabled aria-disabled="true">
            <span class="evo-login-eye" aria-hidden="true">◉</span>
          </span>
        </label>

        <div class="evo-login-form-meta">
          <label class="evo-login-remember">
            <input type="checkbox" disabled aria-disabled="true">
            <span>${formText.remember}</span>
          </label>
          <button type="button" class="evo-login-link-button" disabled aria-disabled="true" title="${formText.unavailable}">${formText.forgot}</button>
        </div>

        <button class="evo-login-primary" type="button" disabled aria-disabled="true" title="${formText.unavailable}">
          <span>${formText.signIn}</span><span aria-hidden="true">→</span>
        </button>
      </form>

      <div class="evo-login-divider"><span>${formText.or}</span></div>

      ${googleAvailable
        ? `<a class="evo-login-google" href="${googleHref}">
            <img src="https://developers.google.com/static/identity/images/g-logo.png" alt="" width="20" height="20">
            <span>${formText.google}</span>
          </a>`
        : `<button class="evo-login-google" type="button" disabled aria-disabled="true">
            <img src="https://developers.google.com/static/identity/images/g-logo.png" alt="" width="20" height="20">
            <span>${formText.google}</span>
          </button>`}

      <div class="evo-login-more-methods" aria-label="${formText.more}">
        <div class="evo-login-more-icons" aria-hidden="true">
          <span>⊞</span><span>SSO</span><span>@</span>
        </div>
        <p>${formText.more}</p>
      </div>

      <footer class="evo-login-card-footer">
        <div><span>${formText.noAccount}</span> <button type="button" disabled aria-disabled="true">${formText.contact}</button></div>
        <button type="button" disabled aria-disabled="true">${formText.help}</button>
      </footer>
    </div>
  </section>`;

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
body{font-family:var(--eidos-font-family);color:#0c2340;background:#eaf5ff}
*{box-sizing:border-box}
a{color:inherit}
button,input{font:inherit}
.evo-login-shell{position:relative;min-height:100vh;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(430px,.92fr);overflow:hidden;background:#f4f7fa}
.evo-login-brand{position:relative;min-width:0;overflow:hidden;display:flex;flex-direction:column;padding:clamp(34px,5vw,74px);background:linear-gradient(145deg,#18344f 0%,#214d75 52%,#2b6cb0 100%);color:#fff}
.evo-login-wordmark{position:relative;z-index:3;display:inline-flex;align-items:center;gap:12px;font-size:18px;font-weight:720;letter-spacing:.01em}
.evo-login-mark{display:grid;place-items:center;width:36px;height:36px;border:1px solid rgba(255,255,255,.34);border-radius:10px;background:rgba(255,255,255,.11);font-size:16px;font-weight:750}
.evo-login-hero{position:relative;z-index:3;max-width:700px;margin:auto 0}
.evo-login-eyebrow{margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.72)}
.evo-login-hero h1{max-width:680px;margin:0;font-size:clamp(36px,4.4vw,60px);line-height:1.05;letter-spacing:-.038em}
.evo-login-hero>p:last-of-type{max-width:610px;margin:22px 0 0;font-size:16px;line-height:1.75;color:rgba(255,255,255,.79)}
.evo-login-visual{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;max-width:640px;margin-top:42px}
.evo-login-visual div{min-height:80px;padding:14px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(255,255,255,.08);backdrop-filter:blur(6px)}
.evo-login-visual strong{display:block;font-size:13px}.evo-login-visual span{display:block;margin-top:5px;font-size:11px;line-height:1.45;color:rgba(255,255,255,.65)}
.evo-login-brand-footer{position:relative;z-index:3;margin-top:auto;font-size:12px;color:rgba(255,255,255,.58)}

.evo-login-main{position:relative;z-index:4;display:flex;min-width:0;align-items:center;justify-content:center;padding:clamp(30px,4vw,66px);background:#f5f8fc}
.evo-login-card{width:min(500px,100%);padding:42px 40px 34px;border:1px solid #dbe5ef;border-radius:24px;background:rgba(255,255,255,.97);box-shadow:0 26px 70px rgba(35,74,118,.12)}
.evo-login-card-tools{min-height:32px;display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-bottom:24px}
.evo-login-locale{font-size:11px;color:#64748b;text-decoration:none;padding:7px 9px;border:1px solid #dbe4ee;border-radius:999px;background:#fff}
.evo-login-locale:hover{background:#f7fafc;color:#1e3a5f}
.evo-login-skin-switch{display:inline-flex;padding:2px;border:1px solid #dbe5ef;border-radius:999px;background:#f8fbff}
.evo-login-skin-switch a{min-width:62px;padding:6px 11px;border-radius:999px;color:#718096;font-size:10px;text-align:center;text-decoration:none}
.evo-login-skin-switch a[data-active="true"]{background:#fff;color:#1d6fe8;box-shadow:0 4px 14px rgba(45,112,202,.12)}
.evo-login-card h2{margin:0;color:#102a47;font-size:31px;line-height:1.15;letter-spacing:-.025em}
.evo-login-lead{margin:10px 0 30px;color:#6c7f95;font-size:13px;line-height:1.6}
.evo-login-unavailable{margin:0 0 18px;padding:10px 12px;border:1px solid #f4dfae;border-radius:10px;background:#fff8e8;color:#6b5722;font-size:11px;line-height:1.5}
.evo-login-local-form{display:grid;gap:17px}
.evo-login-field{display:grid;gap:8px;color:#243b55;font-size:12px;font-weight:650}
.evo-login-input-shell{height:54px;display:grid;grid-template-columns:34px minmax(0,1fr) 30px;align-items:center;border:1px solid #d7e1eb;border-radius:10px;background:#fbfcfe}
.evo-login-input-shell:focus-within{border-color:#8bb8ef;box-shadow:0 0 0 3px rgba(36,117,221,.08)}
.evo-login-field-icon,.evo-login-eye{display:grid;place-items:center;color:#8292a6;font-size:16px}
.evo-login-input-shell input{min-width:0;width:100%;height:100%;border:0;outline:0;background:transparent;color:#64748b;font-size:13px}
.evo-login-input-shell input::placeholder{color:#a4afbd}
.evo-login-form-meta{display:flex;align-items:center;justify-content:space-between;gap:16px;color:#52657a;font-size:12px}
.evo-login-remember{display:flex;align-items:center;gap:8px}
.evo-login-remember input{width:18px;height:18px;margin:0}
.evo-login-link-button,.evo-login-card-footer button{border:0;padding:0;background:transparent;color:#1f6fe5;font-size:12px}
.evo-login-link-button:disabled,.evo-login-card-footer button:disabled{cursor:not-allowed;opacity:.66}
.evo-login-primary{height:56px;display:flex;align-items:center;justify-content:center;gap:18px;border:0;border-radius:9px;background:linear-gradient(135deg,#1769ef,#1f61dd);color:#fff;font-size:15px;font-weight:700;letter-spacing:.2em;box-shadow:0 10px 22px rgba(31,105,229,.18)}
.evo-login-primary:disabled{cursor:not-allowed;opacity:.82}
.evo-login-divider{display:flex;align-items:center;gap:14px;margin:25px 0;color:#94a3b8;font-size:11px}
.evo-login-divider:before,.evo-login-divider:after{content:"";height:1px;flex:1;background:#e0e7ef}
.evo-login-google{width:100%;height:52px;display:flex;align-items:center;justify-content:center;gap:12px;border:1px solid #d5e0eb;border-radius:9px;background:#fff;color:#23374f;font-size:13px;font-weight:650;text-decoration:none}
.evo-login-google[href]:hover{border-color:#9ebee7;box-shadow:0 0 0 3px rgba(36,117,221,.06)}
.evo-login-google:disabled{opacity:.62;cursor:not-allowed}
.evo-login-more-methods{margin-top:18px;padding:15px 16px 14px;border:1px dashed #d8e2ed;border-radius:10px;background:#fbfdff;text-align:center}
.evo-login-more-icons{display:flex;justify-content:center;gap:10px}
.evo-login-more-icons span{min-width:31px;height:31px;display:grid;place-items:center;border-radius:8px;background:#f0f4f8;color:#94a3b8;font-size:10px;font-weight:700}
.evo-login-more-methods p{margin:8px 0 0;color:#9aa7b6;font-size:10px}
.evo-login-card-footer{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-top:26px;padding-top:20px;border-top:1px solid #e4eaf1;color:#8795a6;font-size:11px}

.evo-login-demo-topbar{position:absolute;z-index:8;top:0;left:0;right:0;height:116px;display:grid;grid-template-columns:minmax(280px,1fr) minmax(340px,1fr) minmax(330px,1fr);align-items:center;padding:18px clamp(34px,4vw,72px);pointer-events:none}
.evo-login-demo-logo,.evo-login-demo-topline,.evo-login-demo-actions{pointer-events:auto}
.evo-login-demo-logo{justify-self:start}
.evo-login-customer-logo{display:block;max-width:255px;max-height:84px;width:auto;height:auto;object-fit:contain;filter:none;transform:none}
.evo-login-demo-topline{justify-self:center;color:#6681a4;font-size:12px;letter-spacing:.28em;white-space:nowrap}
.evo-login-demo-actions{justify-self:end;display:flex;align-items:center;gap:14px}
.evo-login-demo-language{color:#536b8a;font-size:11px;text-decoration:none;padding:7px 4px}
.evo-login-demo-metrics{position:relative;z-index:4;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));max-width:670px;margin-top:30px}
.evo-login-demo-metrics>div{min-height:56px;padding:0 26px;border-left:1px solid rgba(49,102,162,.18)}
.evo-login-demo-metrics>div:first-child{padding-left:0;border-left:0}
.evo-login-demo-metrics strong{display:block;color:#1269dc;font-size:30px;line-height:1;font-weight:760}
.evo-login-demo-metrics span{display:block;margin-top:8px;color:#526d8d;font-size:11px;line-height:1.45}
.evo-login-demo-tags span{position:absolute;z-index:4;padding:8px 14px;border:1px solid rgba(255,255,255,.7);border-radius:8px;background:linear-gradient(180deg,rgba(80,157,241,.79),rgba(42,113,205,.67));color:#fff;font-size:11px;box-shadow:0 8px 24px rgba(24,90,168,.16);backdrop-filter:blur(8px)}
.evo-login-demo-tags .tag-a{left:7%;top:65%}.evo-login-demo-tags .tag-b{left:45%;top:59%}.evo-login-demo-tags .tag-c{left:64%;top:70%}.evo-login-demo-tags .tag-d{left:8%;top:83%}

.evo-login-shell[data-login-skin="demo"]{grid-template-columns:minmax(0,1.28fr) minmax(430px,.72fr);background:#eaf5ff}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand{padding:148px clamp(48px,4.5vw,78px) 54px;background:
  linear-gradient(180deg,rgba(245,251,255,.90) 0%,rgba(238,248,255,.70) 24%,rgba(225,241,255,.12) 54%,rgba(215,235,254,.04) 100%),
  url("/login-assets/tuge-login-background.webp") center bottom/cover no-repeat;color:#09213e}
.evo-login-shell[data-login-skin="demo"] .evo-login-wordmark{display:none}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero{max-width:760px;margin:0;padding-top:4vh}
.evo-login-shell[data-login-skin="demo"] .evo-login-eyebrow{color:#315d92;font-size:13px;letter-spacing:.02em;text-transform:none}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero h1{max-width:760px;color:#071b39;font-size:clamp(44px,4vw,66px);line-height:1.08}
.evo-login-shell[data-login-skin="demo"] .evo-login-hero>p:last-of-type{max-width:670px;color:#526d8d;font-size:15px}
.evo-login-shell[data-login-skin="demo"] .evo-login-brand-footer{color:#315d8c}
.evo-login-shell[data-login-skin="demo"] .evo-login-main{padding:136px clamp(38px,4vw,66px) 48px;background:linear-gradient(180deg,#eaf5ff 0%,#e2f0ff 100%)}
.evo-login-shell[data-login-skin="demo"] .evo-login-card-tools{display:none}

@media(max-width:1040px){
  .evo-login-demo-topbar{grid-template-columns:1fr auto;height:92px;padding:14px 24px}
  .evo-login-demo-topline{display:none}
  .evo-login-customer-logo{max-width:205px;max-height:68px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-brand{padding:112px 28px 34px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-main{padding:108px 28px 36px}
}
@media(max-width:900px){
  .evo-login-shell,.evo-login-shell[data-login-skin="demo"]{grid-template-columns:1fr;overflow:visible}
  .evo-login-brand{min-height:350px;padding:26px 24px}
  .evo-login-hero{margin:54px 0 0}
  .evo-login-hero h1{font-size:34px}
  .evo-login-visual,.evo-login-brand-footer{display:none}
  .evo-login-main{padding:30px 22px 44px;align-items:flex-start}
  .evo-login-card{padding:30px 24px 26px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-brand{min-height:520px;padding:100px 24px 32px;background-position:48% bottom}
  .evo-login-shell[data-login-skin="demo"] .evo-login-hero{padding-top:12px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-hero h1{font-size:38px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-demo-metrics{display:none}
  .evo-login-shell[data-login-skin="demo"] .evo-login-demo-tags{display:none}
  .evo-login-shell[data-login-skin="demo"] .evo-login-main{padding:28px 18px 42px}
  .evo-login-demo-actions{gap:7px}.evo-login-demo-language{display:none}
}
@media(max-width:520px){
  .evo-login-card h2{font-size:27px}
  .evo-login-card-footer{align-items:flex-start;flex-direction:column}
  .evo-login-demo-topbar{height:82px;padding:12px 18px}
  .evo-login-customer-logo{max-width:178px;max-height:60px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-brand{min-height:460px;padding-top:88px}
  .evo-login-shell[data-login-skin="demo"] .evo-login-hero h1{font-size:32px}
}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
</style>
</head>
<body>
<main class="evo-login-shell" data-login-skin="${skin}">
  ${skin === "demo" ? `<header class="evo-login-demo-topbar">
    <div class="evo-login-demo-logo"><img class="evo-login-customer-logo" src="/login-assets/tuge-logo-transparent.png" alt="途鸽科技"></div>
    <div class="evo-login-demo-topline">${text.demoTopline}</div>
    <div class="evo-login-demo-actions">
      <a class="evo-login-demo-language" href="${switchHref}" hreflang="${switchLocale}">◎ ${switchLabel}</a>
      ${skinSwitch}
    </div>
  </header>` : ""}

  <section class="evo-login-brand" aria-labelledby="evo-login-hero-title">
    <div class="evo-login-wordmark"><span class="evo-login-mark" aria-hidden="true">E</span><span>EVO</span></div>
    <div class="evo-login-hero">
      <p class="evo-login-eyebrow">${skin === "demo" ? text.demoEyebrow : text.eyebrow}</p>
      <h1 id="evo-login-hero-title">${text.heroTitle}</h1>
      <p>${skin === "demo" ? text.demoHeroBody : text.heroBody}</p>
      ${skin === "demo"
        ? `<div class="evo-login-demo-metrics" aria-label="${text.demoEyebrow}">
            <div><strong>${text.demoMetricOneValue}</strong><span>${text.demoMetricOneLabel}</span></div>
            <div><strong>${text.demoMetricTwoValue}</strong><span>${text.demoMetricTwoLabel}</span></div>
            <div><strong>${text.demoMetricThreeValue}</strong><span>${text.demoMetricThreeLabel}</span></div>
          </div>
          <div class="evo-login-demo-tags" aria-hidden="true">
            <span class="tag-a">${text.demoTagOne}</span>
            <span class="tag-b">${text.demoTagTwo}</span>
            <span class="tag-c">${text.demoTagThree}</span>
            <span class="tag-d">${text.demoTagFour}</span>
          </div>`
        : `<div class="evo-login-visual" aria-hidden="true">
            <div><strong>${text.valueOneTitle}</strong><span>${text.valueOneBody}</span></div>
            <div><strong>${text.valueTwoTitle}</strong><span>${text.valueTwoBody}</span></div>
            <div><strong>${text.valueThreeTitle}</strong><span>${text.valueThreeBody}</span></div>
          </div>`}
    </div>
    <div class="evo-login-brand-footer">${skin === "demo" ? text.demoFooter : text.coverFooter}</div>
  </section>

  ${card}
</main>
</body>
</html>`;
}
