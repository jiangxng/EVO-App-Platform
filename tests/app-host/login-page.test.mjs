import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

import {
  createLoginExperienceHtmlV010,
  defaultLoginMethodsV010
} from "../../dist/manager/login-page.js";

test("login experience exposes current Google sign-in and future identity methods without pretending they work", () => {
  const html = createLoginExperienceHtmlV010({
    assetRevision: "abc123",
    returnTo: "/enterprise/context?tab=overview",
    locale: "en",
    authenticationEnabled: true,
    methods: defaultLoginMethodsV010({ googleAvailable: true, locale: "en" })
  });

  assert.match(html, /Sign in to EVO/);
  assert.match(html, /Continue with Google/);
  assert.match(html, /developers\.google\.com\/static\/identity\/images\/g-logo\.png/);
  assert.match(html, /Google Workspace or Google account/);
  assert.match(html, /\/auth\/login\?returnTo=%2Fenterprise%2Fcontext%3Ftab%3Doverview&locale=en/);
  assert.match(html, /Work, school or Microsoft account/);
  assert.match(html, /Enterprise SSO/);
  assert.match(html, /Email-based or local account sign-in/);
  assert.match(html, /Coming soon/);
  assert.match(html, /Admin setup/);
  assert.match(html, /Create account/);
  assert.match(html, /Registration planned/);
  assert.match(html, /disabled aria-disabled="true"/);
});

test("login experience preserves the local-return boundary", () => {
  const html = createLoginExperienceHtmlV010({
    assetRevision: "rev",
    returnTo: "https://evil.example/steal",
    locale: "zh-CN",
    authenticationEnabled: true,
    methods: defaultLoginMethodsV010({ googleAvailable: true, locale: "en" })
  });

  assert.doesNotMatch(html, /evil\.example/);
  assert.match(html, /登录到 EVO/);
  assert.match(html, /创建账号/);
  assert.match(html, /returnTo=%2F/);
});

test("login experience can honestly represent an unconfigured authentication deployment", () => {
  const html = createLoginExperienceHtmlV010({
    assetRevision: "rev",
    returnTo: "/",
    locale: "en",
    authenticationEnabled: false,
    methods: defaultLoginMethodsV010({ googleAvailable: false, locale: "en" })
  });

  assert.match(html, /Authentication is not enabled/);
  assert.doesNotMatch(html, /href="\/auth\/login/);
  assert.match(html, /ADMIN_CONFIGURATION_REQUIRED/);
});


test("login cover defaults to enterprise-to-employee messaging rather than platform technology messaging", () => {
  const zh = createLoginExperienceHtmlV010({
    assetRevision: "rev",
    returnTo: "/",
    locale: "zh-CN",
    authenticationEnabled: true,
    methods: defaultLoginMethodsV010({ googleAvailable: true, locale: "zh-CN" })
  });
  assert.match(zh, /以客户为中心，以奋斗者为本。/);
  assert.match(zh, /目标一致/);
  assert.match(zh, /责任清晰/);
  assert.match(zh, /持续改善/);
  assert.match(zh, /今天的每一步，都在推动企业向目标前进。/);
  assert.doesNotMatch(zh, />Applications</);
  assert.doesNotMatch(zh, />Context</);
  assert.doesNotMatch(zh, />Intelligence</);
});


test("standard login remains the default and only exposes a subtle demo-skin switch", () => {
  const html = createLoginExperienceHtmlV010({
    assetRevision: "rev",
    returnTo: "/",
    locale: "zh-CN",
    authenticationEnabled: true,
    methods: defaultLoginMethodsV010({ googleAvailable: true, locale: "zh-CN" })
  });

  assert.match(html, /data-login-skin="standard"/);
  assert.match(
    html,
    /\.evo-login-shell:not\(\[data-login-skin="demo"\]\) \.evo-login-brand\{background:linear-gradient\(145deg,#18344f 0%,#214d75 52%,#2b6cb0 100%\)\}/
  );
  assert.match(html, /以客户为中心，以奋斗者为本。/);
  assert.doesNotMatch(html, /\/login-assets\/tuge-logo-final\.png/);
  assert.doesNotMatch(html, /\/login-assets\/tuge-login-background-final\.png/);
  assert.match(html, /class="evo-login-skin-toggle"/);
  assert.match(html, /skin=demo/);
});

test("demo login keeps the approved headline while changing only enterprise cover presentation", () => {
  const html = createLoginExperienceHtmlV010({
    assetRevision: "rev",
    returnTo: "/enterprise-agent",
    locale: "zh-CN",
    skin: "demo",
    authenticationEnabled: true,
    methods: defaultLoginMethodsV010({ googleAvailable: true, locale: "zh-CN" })
  });

  assert.match(html, /data-login-skin="demo"/);
  assert.match(html, /以客户为中心，以奋斗者为本。/);
  assert.match(html, /全球云通信与AIoT平台/);
  assert.match(html, /50\+/);
  assert.match(html, /200\+/);
  assert.match(html, /1000\+/);
  assert.match(html, /\/login-assets\/tuge-logo-final\.png/);
  assert.match(html, /\/login-assets\/tuge-login-background-final\.png/);
  assert.match(html, /alt="途鸽科技"/);
  assert.match(html, /全球连接 · 云端智能 · 让世界更近/);
  assert.match(html, /evo-login-demo-topbar/);
  assert.match(html, /evo-login-demo-art/);
  assert.match(html, /filter:none;transform:none/);
  assert.doesNotMatch(html, /manuals\.plus/);
  assert.doesNotMatch(html, /TUGE TECHNOLOGIES/);
  assert.match(html, /skin=standard/);
  assert.match(html, /skin=demo/);
  assert.match(html, /Continue with Google|使用 Google 继续/);
});

test("locale switching preserves the selected login skin", () => {
  const html = createLoginExperienceHtmlV010({
    assetRevision: "rev",
    returnTo: "/",
    locale: "zh-CN",
    skin: "demo",
    authenticationEnabled: true,
    methods: defaultLoginMethodsV010({ googleAvailable: true, locale: "zh-CN" })
  });

  assert.match(html, /locale=en&amp;skin=demo|locale=en&skin=demo/);
});


test("TUGE demo visual assets are local presentation assets and do not replace authentication semantics", () => {
  const html = createLoginExperienceHtmlV010({
    assetRevision: "rev",
    returnTo: "/",
    locale: "zh-CN",
    skin: "demo",
    authenticationEnabled: true,
    methods: defaultLoginMethodsV010({ googleAvailable: true, locale: "zh-CN" })
  });

  assert.match(html, /以客户为中心，以奋斗者为本。/);
  assert.match(html, /\/auth\/login\?returnTo=/);
  assert.match(html, /data-provider="google" data-status="AVAILABLE"/);
  assert.match(html, /data-provider="microsoft" data-status="PLANNED"/);
  assert.match(html, /data-provider="enterprise-sso" data-status="ADMIN_CONFIGURATION_REQUIRED"/);
  assert.match(html, /data-provider="email" data-status="PLANNED"/);
});


test("final TUGE demo card stages future local login controls as disabled while Google stays real", () => {
  const html = createLoginExperienceHtmlV010({
    assetRevision: "rev",
    returnTo: "/",
    locale: "zh-CN",
    skin: "demo",
    authenticationEnabled: true,
    methods: defaultLoginMethodsV010({ googleAvailable: true, locale: "zh-CN" })
  });

  assert.match(html, /欢迎登录/);
  assert.match(html, /登录途鸽企业平台，开启全球连接新可能/);
  assert.match(html, /id="evo-demo-account"[^>]*disabled/);
  assert.match(html, /id="evo-demo-password"[^>]*disabled/);
  assert.match(html, /evo-login-demo-primary" type="button" disabled/);
  assert.match(html, /记住我/);
  assert.match(html, /忘记密码？/);
  assert.match(html, /更多登录方式，敬请期待/);
  assert.match(html, /data-demo-method-icon="microsoft"/);
  assert.match(html, /data-demo-method-icon="apple"/);
  assert.match(html, /data-demo-method-icon="sso"/);
  assert.doesNotMatch(html, /title="Microsoft">M<\/button>/);
  assert.doesNotMatch(html, /title="Apple">A<\/button>/);
  assert.doesNotMatch(html, /title="Enterprise SSO">SSO<\/button>/);
  assert.match(html, /background:#d2eaff/);
  assert.match(html, /evo-login-demo-art[^\n]*height:100%/);
  assert.doesNotMatch(html, /evo-login-demo-art[^\n]*width:100%/);
  assert.match(html, /联系我们/);
  assert.match(html, /帮助中心/);
  assert.match(html, /class="evo-login-demo-google" href="\/auth\/login\?returnTo=/);
});

test("final TUGE demo uses the user-supplied local logo and background assets", () => {
  const html = createLoginExperienceHtmlV010({
    assetRevision: "rev",
    returnTo: "/",
    locale: "zh-CN",
    skin: "demo",
    authenticationEnabled: true,
    methods: defaultLoginMethodsV010({ googleAvailable: true, locale: "zh-CN" })
  });

  assert.match(html, /\/login-assets\/tuge-logo-final\.png\?rev=rev/);
  assert.match(html, /\/login-assets\/tuge-login-background-final\.png\?rev=rev/);
  assert.doesNotMatch(html, /tuge-logo-reference\.webp/);
  assert.doesNotMatch(html, /tuge-global-connectivity-demo\.webp/);
  assert.match(html, /filter:none;transform:none/);
  assert.match(html, /evo-login-demo-art[^\n]*filter:none/);
});


test("build emits valid login assets at the runtime path used by Railpack", async () => {
  const logoUrl = new URL(
    "../../dist/manager/assets/tuge-logo-final.png",
    import.meta.url
  );
  const backgroundUrl = new URL(
    "../../dist/manager/assets/tuge-login-background-final.png",
    import.meta.url
  );
  const [logo, background, logoBytes, backgroundBytes] = await Promise.all([
    stat(logoUrl),
    stat(backgroundUrl),
    readFile(logoUrl),
    readFile(backgroundUrl)
  ]);

  assert.ok(logo.isFile());
  assert.ok(background.isFile());
  assert.ok(logo.size > 20_000);
  assert.ok(background.size > 100_000);
  assert.deepEqual(
    [...logoBytes.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  );
  assert.deepEqual(
    [...backgroundBytes.subarray(0, 8)],
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  );
});
