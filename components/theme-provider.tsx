"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  enableColorScheme = true,
  disableTransitionOnChange = false,
  storageKey = "theme",
  themes = ["light", "dark"],
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState(() =>
    storedTheme(storageKey, defaultTheme),
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    preferredSystemTheme(),
  );

  const resolvedTheme = resolveTheme(theme, systemTheme, enableSystem);

  const setTheme = useCallback(
    (nextTheme: ThemeSetter) => {
      setThemeState((currentTheme) => {
        const value =
          typeof nextTheme === "function" ? nextTheme(currentTheme) : nextTheme;

        try {
          localStorage.setItem(storageKey, value);
        } catch {
          return value;
        }

        return value;
      });
    },
    [storageKey],
  );

  useEffect(() => {
    if (!enableSystem) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", syncSystemTheme);

    return () => media.removeEventListener("change", syncSystemTheme);
  }, [enableSystem]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        setThemeState(event.newValue || defaultTheme);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    const cleanup = disableTransitionOnChange ? disableTransitions() : null;
    applyTheme({
      attribute,
      enableColorScheme,
      resolvedTheme: resolveTheme(
        forcedTheme ?? theme,
        systemTheme,
        enableSystem,
      ),
      themes,
    });
    cleanup?.();
  }, [
    attribute,
    disableTransitionOnChange,
    enableColorScheme,
    enableSystem,
    forcedTheme,
    systemTheme,
    theme,
    themes,
  ]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      forcedTheme,
      resolvedTheme,
      systemTheme: enableSystem ? systemTheme : undefined,
      themes: enableSystem ? [...themes, "system"] : themes,
    }),
    [
      enableSystem,
      forcedTheme,
      resolvedTheme,
      setTheme,
      systemTheme,
      theme,
      themes,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

type ThemeAttribute = "class" | `data-${string}` | Array<"class" | `data-${string}`>;
type ResolvedTheme = "light" | "dark";
type ThemeSetter = string | ((theme: string) => string);

type ThemeProviderProps = {
  children: ReactNode;
  attribute?: ThemeAttribute;
  defaultTheme?: string;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
  themes?: string[];
  forcedTheme?: string;
};

type ThemeContextValue = {
  theme: string;
  setTheme: (theme: ThemeSetter) => void;
  forcedTheme?: string;
  resolvedTheme: ResolvedTheme;
  systemTheme?: ResolvedTheme;
  themes: string[];
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
  systemTheme: "light",
  themes: ["light", "dark", "system"],
});

export function useTheme() {
  return useContext(ThemeContext);
}

function resolveTheme(
  theme: string,
  systemTheme: ResolvedTheme,
  enableSystem: boolean,
): ResolvedTheme {
  if (theme === "dark" || theme === "light") return theme;
  return enableSystem ? systemTheme : "light";
}

function storedTheme(storageKey: string, defaultTheme: string) {
  if (typeof window === "undefined") return defaultTheme;

  try {
    return localStorage.getItem(storageKey) || defaultTheme;
  } catch {
    return defaultTheme;
  }
}

function preferredSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme({
  attribute,
  enableColorScheme,
  resolvedTheme,
  themes,
}: {
  attribute: ThemeAttribute;
  enableColorScheme: boolean;
  resolvedTheme: ResolvedTheme;
  themes: string[];
}) {
  const root = document.documentElement;
  const attributes = Array.isArray(attribute) ? attribute : [attribute];

  for (const item of attributes) {
    if (item === "class") {
      root.classList.remove(...themes);
      root.classList.add(resolvedTheme);
    } else {
      root.setAttribute(item, resolvedTheme);
    }
  }

  if (enableColorScheme) {
    root.style.colorScheme = resolvedTheme;
  }
}

function disableTransitions() {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode(
      "*,*::before,*::after{transition:none!important}",
    ),
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    setTimeout(() => style.remove(), 1);
  };
}
