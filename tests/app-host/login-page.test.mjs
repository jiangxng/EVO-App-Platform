import test from "node:test";
import assert from "node:assert/strict";

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
