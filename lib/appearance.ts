export const defaultThemeColor = "rose";

export const themeColors = [
  { value: "rose", label: "Rose" },
  { value: "blue", label: "Blue" },
  { value: "emerald", label: "Emerald" },
  { value: "violet", label: "Violet" },
  { value: "sky", label: "Sky" },
  { value: "indigo", label: "Indigo" },
] as const;

export type ThemeColor = (typeof themeColors)[number]["value"];

const themeColorValues = new Set<string>(
  themeColors.map((themeColor) => themeColor.value),
);

export function normalizeThemeColor(value: FormDataEntryValue | string | null) {
  const themeColor = String(value ?? defaultThemeColor);
  return themeColorValues.has(themeColor)
    ? (themeColor as ThemeColor)
    : defaultThemeColor;
}
