/**
 * Theme System Entry Point
 * Exports all theme-related functionality
 */

export * from './types';
export * from './presets';
export * from './theme-provider';

// Re-export commonly used items
export { defaultTheme, darkTheme, highContrastTheme } from './presets';
export { ThemeProvider, useTheme, usePrefersReducedMotion } from './theme-provider';
