/**
 * Theme System Types
 * Comprehensive type definitions for the TrustLayer theme system
 */

export interface ThemeColors {
  // Brand colors
  primary: string;
  secondary: string;
  accent: string;

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Neutrals
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;

  // Component-specific
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  sidebar: string;
  sidebarForeground: string;
  destructive: string;
  destructiveForeground: string;
}

export interface ThemeTypography {
  fontFamily: {
    sans: string;
    mono: string;
    heading: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeSpacing {
  unit: number; // Base unit (e.g., 4px)
}

export interface ThemeRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeAnimations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    default: string;
    in: string;
    out: string;
    inOut: string;
  };
}

export interface Theme {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  shadows: ThemeShadows;
  animations: ThemeAnimations;
}

export interface ThemeCustomization {
  colors?: Partial<ThemeColors>;
  typography?: Partial<ThemeTypography>;
  radius?: Partial<ThemeRadius>;
}

export interface OrganizationTheme {
  id: string;
  organizationId: string;
  baseTheme: string;
  customization?: ThemeCustomization;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserThemePreference {
  userId: string;
  themeId: string;
  customOverrides?: ThemeCustomization;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: Theme;
  themeId: string;
  mode: ThemeMode;
  setTheme: (themeId: string) => void;
  setMode: (mode: ThemeMode) => void;
  customize: (customization: ThemeCustomization) => void;
  reset: () => void;
}
