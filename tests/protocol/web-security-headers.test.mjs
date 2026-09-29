import test from "node:test";
import assert from "node:assert/strict";

import {
  webSecurityHeadersV010
} from "../../dist/manager/web-security-headers.js";

test("browser security baseline locks script/frame/object surfaces", () => {
  const headers = webSecurityHeadersV010();

  assert.equal(headers["x-content-type-options"], "nosniff");
  assert.equal(headers["x-frame-options"], "DENY");
  assert.equal(
    headers["referrer-policy"],
    "strict-origin-when-cross-origin"
  );
  assert.equal(headers["cross-origin-resource-policy"], "same-origin");

  const csp = headers["content-security-policy"];
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'/);
  assert.match(csp, /connect-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /base-uri 'none'/);
  assert.match(csp, /form-action 'self'/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);

  // Eidos still uses element.style for deterministic surface layout.
  // This exception is explicit and is tightened only after that migration.
  assert.match(csp, /style-src 'self' 'unsafe-inline'/);
});

test("browser permissions default deny device capabilities", () => {
  const permissions = webSecurityHeadersV010()["permissions-policy"];

  for (const capability of [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "browsing-topics=()"
  ]) {
    assert.match(permissions, new RegExp(
      capability.replace(/[()]/g, value => "\\" + value)
    ));
  }
});
