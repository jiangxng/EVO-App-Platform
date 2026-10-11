export type EidosTextScalePreferenceV010 =
  | "system"
  | "small"
  | "standard"
  | "large";

export const eidosTextScalePreferencesV010 = [
  {
    id: "system",
    additionalScale: 1,
    default: true,
    followsSystem: true
  },
  {
    id: "small",
    additionalScale: 0.9,
    default: false,
    followsSystem: true
  },
  {
    id: "standard",
    additionalScale: 1,
    default: false,
    followsSystem: true
  },
  {
    id: "large",
    additionalScale: 1.15,
    default: false,
    followsSystem: true
  }
] as const;

export function normalizeEidosTextScalePreferenceV010(
  value: unknown
): EidosTextScalePreferenceV010 {
  return value === "small"
    || value === "standard"
    || value === "large"
    || value === "system"
    ? value
    : "system";
}

export function applyEidosTextScalePreferenceV010(
  root: HTMLElement,
  preference: EidosTextScalePreferenceV010
): void {
  if (preference === "system") {
    root.removeAttribute("data-eidos-text-scale");
    return;
  }
  root.setAttribute("data-eidos-text-scale", preference);
}
