/**
 * Theme Provider
 * Manages theme state and applies CSS variables
 */

import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Theme, ThemeContextValue, ThemeMode, ThemeCustomization } from './types';
import { getTheme } from './presets';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'trustlayer-theme';
const MODE_STORAGE_KEY = 'trustlayer-theme-mode';
const CUSTOMIZATION_STORAGE_KEY = 'trustlayer-theme-customization';

interface ThemeProviderProps extends PropsWithChildren {
  defaultTheme?: string;
  defaultMode?: ThemeMode;
  storageKey?: string;
}

/**
 * Convert HSL string to CSS variable format
 * "217 91% 60%" -> "217 91% 60%"
 */
function hslToVar(hsl: string): string {
  return hsl;
}

/**
 * Apply theme to document root
 */
function applyThemeToDocument(theme: Theme, customization?: ThemeCustomization) {
  const root = document.documentElement;

  // Merge theme colors with customization
  const colors = { ...theme.colors, ...customization?.colors };

  // Apply color CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVarName, hslToVar(value));
  });

  // Apply typography CSS variables
  const typography = { ...theme.typography, ...customization?.typography };

  Object.entries(typography.fontFamily).forEach(([key, value]) => {
    root.style.setProperty(`--font-family-${key}`, value);
  });

  Object.entries(typography.fontSize).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${key}`, value);
  });

  Object.entries(typography.fontWeight).forEach(([key, value]) => {
    root.style.setProperty(`--font-weight-${key}`, value.toString());
  });

  Object.entries(typography.lineHeight).forEach(([key, value]) => {
    root.style.setProperty(`--line-height-${key}`, value.toString());
  });

  // Apply spacing
  root.style.setProperty('--spacing-unit', `${theme.spacing.unit}px`);

  // Apply radius
  const radius = { ...theme.radius, ...customization?.radius };
  Object.entries(radius).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value);
  });

  // Apply shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });

  // Apply animations
  Object.entries(theme.animations.duration).forEach(([key, value]) => {
    root.style.setProperty(`--duration-${key}`, value);
  });

  Object.entries(theme.animations.easing).forEach(([key, value]) => {
    root.style.setProperty(`--easing-${key}`, value);
  });
}

/**
 * Determine if system prefers dark mode
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Theme Provider Component
 */
export function ThemeProvider({
  children,
  defaultTheme = 'default',
  defaultMode = 'system',
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  // Load theme from localStorage or use default
  const [themeId, setThemeId] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return localStorage.getItem(storageKey) || defaultTheme;
  });

  // Load mode from localStorage or use default
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultMode;
    return (localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode) || defaultMode;
  });

  // Load customization from localStorage
  const [customization, setCustomization] = useState<ThemeCustomization | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const stored = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : undefined;
  });

  // Get current theme
  const [theme, setTheme] = useState<Theme>(() => {
    let themeToUse = themeId;

    // If mode is system, determine theme based on system preference
    if (mode === 'system') {
      const systemTheme = getSystemTheme();
      themeToUse = systemTheme === 'dark' ? 'dark' : defaultTheme;
    } else if (mode === 'dark') {
      themeToUse = 'dark';
    }

    return getTheme(themeToUse);
  });

  // Update theme when themeId or mode changes
  useEffect(() => {
    let themeToUse = themeId;

    if (mode === 'system') {
      const systemTheme = getSystemTheme();
      themeToUse = systemTheme === 'dark' ? 'dark' : themeId;
    } else if (mode === 'dark') {
      themeToUse = 'dark';
    }

    const newTheme = getTheme(themeToUse);
    setTheme(newTheme);
    applyThemeToDocument(newTheme, customization);
  }, [themeId, mode, customization]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const systemTheme = getSystemTheme();
      const themeToUse = systemTheme === 'dark' ? 'dark' : themeId;
      const newTheme = getTheme(themeToUse);
      setTheme(newTheme);
      applyThemeToDocument(newTheme, customization);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, themeId, customization]);

  // Set theme
  const handleSetTheme = useCallback((newThemeId: string) => {
    setThemeId(newThemeId);
    localStorage.setItem(storageKey, newThemeId);
  }, [storageKey]);

  // Set mode
  const handleSetMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
  }, []);

  // Customize theme
  const handleCustomize = useCallback((newCustomization: ThemeCustomization) => {
    setCustomization(newCustomization);
    localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(newCustomization));
  }, []);

  // Reset customization
  const handleReset = useCallback(() => {
    setCustomization(undefined);
    localStorage.removeItem(CUSTOMIZATION_STORAGE_KEY);
  }, []);

  const value: ThemeContextValue = {
    theme,
    themeId,
    mode,
    setTheme: handleSetTheme,
    setMode: handleSetMode,
    customize: handleCustomize,
    reset: handleReset,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to use theme context
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Hook to check if system prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
