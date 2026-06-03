export const THEME_STORAGE_KEY = "internpal_theme_preference";
export const THEME_UPDATED_EVENT = "internpal:theme-updated";

export const THEME_IDS = [
  "internpal",
  "focus-dark",
  "sage",
  "rose",
  "amber",
] as const;

export type ThemePreference = (typeof THEME_IDS)[number];

export type ThemeOption = {
  id: ThemePreference;
  label: string;
  description: string;
  swatches: readonly string[];
};

export const DEFAULT_THEME: ThemePreference = "internpal";

export const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    id: "internpal",
    label: "InternPal Blue",
    description: "Clean, focused, and familiar.",
    swatches: ["#0b73d9", "#f6f7f9", "#ffffff"],
  },
  {
    id: "focus-dark",
    label: "Focus Dark",
    description: "Low-light mode for longer sessions.",
    swatches: ["#3b82f6", "#0f172a", "#1e293b"],
  },
  {
    id: "sage",
    label: "Sage",
    description: "Calm greens with academic energy.",
    swatches: ["#2f7d57", "#f3f7f1", "#ffffff"],
  },
  {
    id: "rose",
    label: "Rose",
    description: "Soft, warm, and personal.",
    swatches: ["#be486b", "#fff5f7", "#ffffff"],
  },
  {
    id: "amber",
    label: "Amber",
    description: "Warm progress and achievement tones.",
    swatches: ["#b45309", "#fff8ed", "#ffffff"],
  },
];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && THEME_IDS.includes(value as ThemePreference);
}

export function normalizeThemePreference(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : DEFAULT_THEME;
}

export function isDarkTheme(theme: ThemePreference): boolean {
  return theme === "focus-dark";
}

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return DEFAULT_THEME;

  try {
    return normalizeThemePreference(
      window.localStorage.getItem(THEME_STORAGE_KEY),
    );
  } catch {
    return DEFAULT_THEME;
  }
}

function storeTheme(theme: ThemePreference) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme persistence is nice-to-have; applying the theme still matters.
  }
}

function emitThemeUpdated(theme: ThemePreference) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<{ theme: ThemePreference }>(THEME_UPDATED_EVENT, {
      detail: { theme },
    }),
  );
}

export function applyTheme(
  value: unknown,
  options: { persist?: boolean; emit?: boolean } = {},
): ThemePreference {
  const theme = normalizeThemePreference(value);

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = isDarkTheme(theme)
      ? "dark"
      : "light";
  }

  if (options.persist ?? true) storeTheme(theme);
  if (options.emit ?? true) emitThemeUpdated(theme);

  return theme;
}

export function applyStoredTheme(): ThemePreference {
  return applyTheme(getStoredTheme(), { persist: false, emit: false });
}

export function subscribeToThemePreference(
  callback: (theme: ThemePreference) => void,
) {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    callback(
      normalizeThemePreference(
        (event as CustomEvent<{ theme?: unknown }>).detail?.theme,
      ),
    );
  };

  window.addEventListener(THEME_UPDATED_EVENT, handler);
  return () => window.removeEventListener(THEME_UPDATED_EVENT, handler);
}
