/**
 * Built-in Theme Presets
 * 5+ themes with comprehensive styling
 */

import type { Theme } from './types';

const baseTypography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code", "JetBrains Mono", Consolas, monospace',
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

const baseSpacing = {
  unit: 4,
};

const baseRadius = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
};

const baseShadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

const baseAnimations = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * Default Theme (TrustLayer Blue)
 */
export const defaultTheme: Theme = {
  id: 'default',
  name: 'TrustLayer Default',
  description: 'Professional blue theme with excellent readability',
  colors: {
    primary: '217 91% 60%',      // hsl(217, 91%, 60%) - Blue
    secondary: '262 83% 58%',     // hsl(262, 83%, 58%) - Purple
    accent: '199 89% 48%',        // hsl(199, 89%, 48%) - Cyan

    success: '142 71% 45%',       // hsl(142, 71%, 45%) - Green
    warning: '38 92% 50%',        // hsl(38, 92%, 50%) - Orange
    error: '0 84% 60%',           // hsl(0, 84%, 60%) - Red
    info: '199 89% 48%',          // hsl(199, 89%, 48%) - Blue

    background: '0 0% 100%',      // White
    foreground: '222.2 84% 4.9%', // Dark gray
    muted: '210 40% 96.1%',       // Light gray
    mutedForeground: '215.4 16.3% 46.9%',
    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '217 91% 60%',

    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%',
    popover: '0 0% 100%',
    popoverForeground: '222.2 84% 4.9%',
    sidebar: '0 0% 98%',
    sidebarForeground: '222.2 84% 4.9%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 98%',
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radius: baseRadius,
  shadows: baseShadows,
  animations: baseAnimations,
};

/**
 * Dark Theme
 */
export const darkTheme: Theme = {
  id: 'dark',
  name: 'Dark Mode',
  description: 'Easy on the eyes dark theme',
  colors: {
    primary: '217 91% 60%',
    secondary: '262 83% 58%',
    accent: '199 89% 48%',

    success: '142 71% 45%',
    warning: '38 92% 50%',
    error: '0 84% 60%',
    info: '199 89% 48%',

    background: '222.2 84% 4.9%',   // Dark
    foreground: '210 40% 98%',       // Light
    muted: '217.2 32.6% 17.5%',
    mutedForeground: '215 20.2% 65.1%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 17.5%',
    ring: '217 91% 60%',

    card: '222.2 84% 4.9%',
    cardForeground: '210 40% 98%',
    popover: '222.2 84% 4.9%',
    popoverForeground: '210 40% 98%',
    sidebar: '220 13% 8%',
    sidebarForeground: '210 40% 98%',
    destructive: '0 62.8% 30.6%',
    destructiveForeground: '0 0% 98%',
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radius: baseRadius,
  shadows: baseShadows,
  animations: baseAnimations,
};

/**
 * High Contrast Theme (Accessibility)
 */
export const highContrastTheme: Theme = {
  id: 'high-contrast',
  name: 'High Contrast',
  description: 'WCAG AAA compliant high contrast theme',
  colors: {
    primary: '0 0% 0%',           // Black
    secondary: '0 0% 20%',        // Dark gray
    accent: '0 0% 30%',

    success: '120 100% 25%',      // Dark green
    warning: '40 100% 30%',       // Dark orange
    error: '0 100% 30%',          // Dark red
    info: '200 100% 30%',

    background: '0 0% 100%',      // White
    foreground: '0 0% 0%',        // Black
    muted: '0 0% 90%',
    mutedForeground: '0 0% 0%',
    border: '0 0% 0%',
    input: '0 0% 95%',
    ring: '0 0% 0%',

    card: '0 0% 100%',
    cardForeground: '0 0% 0%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 0%',
    sidebar: '0 0% 95%',
    sidebarForeground: '0 0% 0%',
    destructive: '0 100% 30%',
    destructiveForeground: '0 0% 100%',
  },
  typography: {
    ...baseTypography,
    fontWeight: {
      light: 400,
      normal: 500,
      medium: 600,
      semibold: 700,
      bold: 800,
    },
  },
  spacing: baseSpacing,
  radius: {
    sm: '0',
    md: '0',
    lg: '0',
    xl: '0',
    full: '0',
  },
  shadows: {
    sm: 'none',
    md: '0 0 0 1px rgb(0 0 0)',
    lg: '0 0 0 2px rgb(0 0 0)',
    xl: '0 0 0 3px rgb(0 0 0)',
    '2xl': '0 0 0 4px rgb(0 0 0)',
  },
  animations: baseAnimations,
};

/**
 * Corporate Theme (Professional Blue/Green)
 */
export const corporateTheme: Theme = {
  id: 'corporate',
  name: 'Corporate Blue',
  description: 'Professional theme for enterprise environments',
  colors: {
    primary: '210 100% 35%',      // Corporate blue
    secondary: '160 60% 40%',     // Teal
    accent: '210 100% 45%',

    success: '150 60% 40%',
    warning: '35 95% 50%',
    error: '0 70% 50%',
    info: '210 100% 50%',

    background: '0 0% 100%',
    foreground: '210 20% 15%',
    muted: '210 30% 96%',
    mutedForeground: '210 10% 50%',
    border: '210 20% 88%',
    input: '210 20% 94%',
    ring: '210 100% 35%',

    card: '0 0% 100%',
    cardForeground: '210 20% 15%',
    popover: '0 0% 100%',
    popoverForeground: '210 20% 15%',
    sidebar: '210 30% 98%',
    sidebarForeground: '210 20% 15%',
    destructive: '0 70% 50%',
    destructiveForeground: '0 0% 98%',
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radius: {
    sm: '0.125rem',
    md: '0.25rem',
    lg: '0.375rem',
    xl: '0.5rem',
    full: '9999px',
  },
  shadows: baseShadows,
  animations: baseAnimations,
};

/**
 * Sunset Theme (Warm Colors)
 */
export const sunsetTheme: Theme = {
  id: 'sunset',
  name: 'Sunset',
  description: 'Warm and inviting theme with sunset colors',
  colors: {
    primary: '25 95% 53%',        // Orange
    secondary: '0 85% 60%',       // Red-orange
    accent: '40 96% 51%',         // Yellow-orange

    success: '150 60% 45%',
    warning: '35 95% 50%',
    error: '0 85% 55%',
    info: '200 70% 50%',

    background: '40 20% 98%',     // Warm white
    foreground: '25 15% 15%',
    muted: '40 20% 94%',
    mutedForeground: '25 10% 45%',
    border: '40 15% 88%',
    input: '40 15% 92%',
    ring: '25 95% 53%',

    card: '0 0% 100%',
    cardForeground: '25 15% 15%',
    popover: '0 0% 100%',
    popoverForeground: '25 15% 15%',
    sidebar: '40 25% 96%',
    sidebarForeground: '25 15% 15%',
    destructive: '0 85% 55%',
    destructiveForeground: '0 0% 98%',
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radius: baseRadius,
  shadows: baseShadows,
  animations: baseAnimations,
};

/**
 * Forest Theme (Green Tones)
 */
export const forestTheme: Theme = {
  id: 'forest',
  name: 'Forest',
  description: 'Calming green theme inspired by nature',
  colors: {
    primary: '142 71% 45%',       // Forest green
    secondary: '160 60% 40%',     // Teal green
    accent: '120 50% 50%',

    success: '140 70% 45%',
    warning: '40 90% 50%',
    error: '0 70% 50%',
    info: '190 70% 45%',

    background: '140 10% 98%',    // Light green-white
    foreground: '140 20% 15%',
    muted: '140 15% 95%',
    mutedForeground: '140 10% 45%',
    border: '140 15% 88%',
    input: '140 15% 92%',
    ring: '142 71% 45%',

    card: '0 0% 100%',
    cardForeground: '140 20% 15%',
    popover: '0 0% 100%',
    popoverForeground: '140 20% 15%',
    sidebar: '140 20% 97%',
    sidebarForeground: '140 20% 15%',
    destructive: '0 70% 50%',
    destructiveForeground: '0 0% 98%',
  },
  typography: baseTypography,
  spacing: baseSpacing,
  radius: baseRadius,
  shadows: baseShadows,
  animations: baseAnimations,
};

/**
 * All available themes
 */
export const themes: Record<string, Theme> = {
  default: defaultTheme,
  dark: darkTheme,
  'high-contrast': highContrastTheme,
  corporate: corporateTheme,
  sunset: sunsetTheme,
  forest: forestTheme,
};

/**
 * Get theme by ID
 */
export function getTheme(id: string): Theme {
  return themes[id] || defaultTheme;
}

/**
 * Get all theme IDs
 */
export function getThemeIds(): string[] {
  return Object.keys(themes);
}

/**
 * Get all themes as array
 */
export function getAllThemes(): Theme[] {
  return Object.values(themes);
}
