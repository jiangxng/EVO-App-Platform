import type {
  TemplatePreviewSelectionV010,
  TemplatePreviewSessionStoreV010
} from "../contracts/template-preview.js";

export function createMemoryTemplatePreviewSessionStoreV010(input?: {
  ttlMs?: number;
  now?: () => number;
}): TemplatePreviewSessionStoreV010 {
  const ttlMs = input?.ttlMs ?? 10 * 60 * 1000;
  const now = input?.now ?? Date.now;
  const values = new Map<string, TemplatePreviewSelectionV010>();

  const valid = (value: TemplatePreviewSelectionV010): boolean =>
    now() - Date.parse(value.selectedAt) <= ttlMs;

  return {
    set(sessionKey, selection) {
      const key = sessionKey.trim();
      if (!key) throw new Error("TEMPLATE_PREVIEW_SESSION_KEY_REQUIRED");
      values.set(key, structuredClone(selection));
    },
    get(sessionKey) {
      const key = sessionKey.trim();
      if (!key) return undefined;
      const value = values.get(key);
      if (!value) return undefined;
      if (!valid(value)) {
        values.delete(key);
        return undefined;
      }
      return structuredClone(value);
    },
    remove(sessionKey) {
      values.delete(sessionKey.trim());
    }
  };
}
