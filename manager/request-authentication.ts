export interface RequestAuthenticationHttpFailureV010 {
  status: 401 | 403 | 503;
  code:
    | "AUTHENTICATION_REQUIRED"
    | "AUTHENTICATION_FORBIDDEN"
    | "AUTHENTICATION_UNAVAILABLE";
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
  if (
    message === "IDENTITY_AUTHENTICATION_PROVIDER_UNAVAILABLE"
    || message === "AUTHENTICATION_PUBLIC_BASE_URL_REQUIRED"
    || message === "AUTHENTICATION_PUBLIC_BASE_URL_HTTPS_REQUIRED"
    || message === "AUTHENTICATION_REDIRECT_HTTPS_REQUIRED"
    || message === "MANAGED_IDENTITY_SESSION_NOT_ENABLED"
    || message === "IDENTITY_USER_DIRECTORY_PROVIDER_UNAVAILABLE"
  ) {
    return {
      status: 503,
      code: "AUTHENTICATION_UNAVAILABLE",
      message: "The configured authentication service is unavailable."
    };
  }
  if (
    message === "IDENTITY_USER_DIRECTORY_PRINCIPAL_DISABLED"
    || message === "IDENTITY_USER_DIRECTORY_PROVIDER_MISMATCH"
  ) {
    return {
      status: 403,
      code: "AUTHENTICATION_FORBIDDEN",
      message:
        "The authenticated Principal is not active for this EVO installation."
    };
  }
  return undefined;
}
