export interface WebSecurityHeadersV010 {
  [name: string]: string;
}

/**
 * Browser delivery baseline.
 *
 * style-src keeps 'unsafe-inline' temporarily because Eidos surfaces still use
 * element.style for layout/state projection. Script execution is already
 * restricted to same-origin modules. Tightening style-src is a separate
 * migration that must first remove inline style attributes from generated UI.
 */
export function webSecurityHeadersV010(): WebSecurityHeadersV010 {
  return {
    "content-security-policy": [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "manifest-src 'self'",
      "worker-src 'self' blob:"
    ].join("; "),
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "browsing-topics=()"
    ].join(", "),
    "cross-origin-resource-policy": "same-origin"
  };
}
