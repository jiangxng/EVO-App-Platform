import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createLoginExperienceHtmlV010,
  defaultLoginMethodsV010
} from "../../dist/manager/login-page.js";

function login(skin, revision) {
  return createLoginExperienceHtmlV010({
    skin, assetRevision: revision, locale: "zh-CN", returnTo: "/",
    authenticationEnabled: true,
    methods: defaultLoginMethodsV010({
      googleAvailable: true, locale: "zh-CN"
    })
  });
}

test("legacy six-way login skins converge to current standard/demo product behavior", () => {
  const normal = login("standard", "release-123");
  const demo = login("demo", "release-123");
  assert.match(normal, /data-login-skin="standard"/);
  assert.match(demo, /data-login-skin="demo"/);
  assert.doesNotMatch(normal, /\/login-assets\/tuge-logo-final\.png/);
  assert.doesNotMatch(normal, /\/login-assets\/tuge-login-background-final\.png/);
  assert.match(demo, /\/login-assets\/tuge-logo-final\.png\?rev=release-123/);
  assert.match(demo, /\/login-assets\/tuge-login-background-final\.png\?rev=release-123/);
  assert.match(demo, /#d2eaff/);
  assert.match(normal, /skin=demo/);
  assert.match(demo, /skin=standard/);
});

test("login asset revision is URL-encoded rather than becoming query injection", () => {
  const html = login("demo", "build 42&skin=standard");
  assert.match(html, /tuge-logo-final\.png\?rev=build%2042%26skin%3Dstandard/);
  assert.match(html, /tuge-login-background-final\.png\?rev=build%2042%26skin%3Dstandard/);
});

test("current TUGE user-provided PNG assets are authentic local binary files", () => {
  for (const path of [
    "manager/assets/tuge-logo-final.png",
    "manager/assets/tuge-login-background-final.png"
  ]) {
    const file = readFileSync(path);
    assert.ok(file.length > 100, path + " must not be a placeholder");
    assert.equal(file.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  }
});
