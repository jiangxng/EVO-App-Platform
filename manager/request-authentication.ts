export interface RequestAuthenticationHttpFailureV010 {
  status: 401 | 503;
  code: "AUTHENTICATION_REQUIRED" | "AUTHENTICATION_UNAVAILABLE";
  message: string;
}

export function requestAuthenticationHttpFailureV010(
  error: unknown
): RequestAuthenticationHttpFailureV010 | undefined {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message === "REQUEST_IDENTITY_SESSION_REQUIRED"
    || message === "IDENTITY_SESSION_REQUIRED"
    || message === "IDENTITY_SESSION_COOKIE_AMBIGUOUS"
  ) {
    return {
      status: 401,
      code: "AUTHENTICATION_REQUIRED",
      message: "A valid request-bound identity Session is required."
    };
  }
  if (
    message === "REQUEST_IDENTITY_SESSION_PROVIDER_UNAVAILABLE"
    || message === "IDENTITY_SESSION_PROVIDER_UNAVAILABLE"
  ) {
    return {
      status: 503,
      code: "AUTHENTICATION_UNAVAILABLE",
      message: "The configured identity Session Provider is unavailable."
    };
  }
  return undefined;
}
