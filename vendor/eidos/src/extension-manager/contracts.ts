export type ExtensionStatusTone = "neutral" | "positive" | "warning" | "danger";

export interface ExtensionManagerActionV010 {
  id: string;
  label: string;
  type: "command" | "navigate";
  command?: string;
  inputVersion?: string;
  route?: string;
  requiresConfirmation?: boolean;
  enabled?: boolean;
  disabledReason?: string;
  helpText?: string;
}

export interface ExtensionContributionSummaryV010 {
  kind: string;
  count: number;
}

export interface ExtensionManagerItemV010 {
  id: string;
  title: string;
  description?: string;
  version: string;
  publisher?: string;
  category?: string;
  status: {
    id: "not-installed" | "enabled" | "disabled" | "incompatible" | "error";
    label: string;
    tone?: ExtensionStatusTone;
  };
  readiness?: {
    id: "ready" | "setup-required" | "blocked" | "degraded" | "error";
    label: string;
    tone?: ExtensionStatusTone;
    message?: string;
  };
  compatibility?: {
    protocolVersion: string;
    hostVersion?: string;
    eidosVersion?: string;
    state: "compatible" | "incompatible" | "unknown";
    message?: string;
  };
  capabilities?: {
    provides?: string[];
    requires?: string[];
  };
  contributions?: ExtensionContributionSummaryV010[];
  trust?: {
    level: "trusted" | "review" | "blocked";
    label: string;
    publisher?: string;
    source?: string;
    message?: string;
  };
  integrity?: {
    state: "verified" | "unsigned" | "untrusted" | "invalid" | "pending";
    label: string;
    algorithm?: string;
    keyId?: string;
    digest?: string;
    provenance?: string;
    message?: string;
  };
  permissions?: Array<{
    id: string;
    label: string;
    risk: "low" | "medium" | "high";
    granted?: boolean;
  }>;
  activation?: {
    mode: "eager" | "on-demand";
    events?: string[];
  };
  runtime?: {
    kind: "declarative" | "worker" | "process" | "remote";
    isolation: "host" | "worker" | "process" | "remote";
    status?: "ready" | "inactive" | "unsupported" | "error";
    health?: "healthy" | "degraded" | "stopped" | "unknown";
    metrics?: {
      invocations: number;
      failures: number;
      timeouts: number;
      crashes: number;
      restarts: number;
      lastEventAt?: string;
      lastError?: string;
    };
    history?: Array<{
      sequence: number;
      occurredAt: string;
      type: string;
      method?: string;
      durationMs?: number;
      message?: string;
    }>;
  };
  storage?: {
    scope: "package";
    state: "available" | "unavailable";
  };
  events?: {
    publish: string[];
    subscribe: string[];
  };
  primaryAction?: ExtensionManagerActionV010;
  secondaryActions?: ExtensionManagerActionV010[];
}

export interface ExtensionManagerV010 {
  contractVersion: "0.1.0";
  kind: "extension-manager";
  id: string;
  title: string;
  description?: string;
  protocol: {
    name: string;
    version: string;
    status: "stable" | "preview" | "experimental";
  };
  host: {
    name: string;
    version?: string;
    eidosVersion?: string;
  };
  items: ExtensionManagerItemV010[];
  emptyMessage?: string;
  technicalDetailsLabel?: string;
}

export function isExtensionManagerV010(input: unknown): input is ExtensionManagerV010 {
  if (!input || typeof input !== "object") return false;
  const value = input as Partial<ExtensionManagerV010>;
  return value.contractVersion === "0.1.0"
    && value.kind === "extension-manager"
    && typeof value.id === "string"
    && typeof value.title === "string"
    && !!value.protocol
    && !!value.host
    && Array.isArray(value.items);
}
