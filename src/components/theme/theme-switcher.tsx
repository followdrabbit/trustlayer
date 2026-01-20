/**
 * Theme Switcher Component
 * Allows users to select and preview themes
 */

import { Check, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-provider';
import { getAllThemes } from '@/lib/theme/presets';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function ThemeSwitcher() {
  const { theme, themeId, mode, setTheme, setMode } = useTheme();
  const themes = getAllThemes();

  const modeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const ModeIcon = modeIcons[mode];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <ModeIcon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{t.name}</span>
              {t.description && (
                <span className="text-xs text-muted-foreground">{t.description}</span>
              )}
            </div>
            {themeId === t.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Mode</DropdownMenuLabel>

        {(['light', 'dark', 'system'] as const).map((m) => {
          const Icon = modeIcons[m];
          return (
            <DropdownMenuItem
              key={m}
              onClick={() => setMode(m)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="capitalize">{m}</span>
              </div>
              {mode === m && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Theme Preview Card
 * Shows visual preview of theme colors
 */
interface ThemePreviewProps {
  themeId: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function ThemePreview({ themeId, isActive, onClick }: ThemePreviewProps) {
  const themes = getAllThemes();
  const theme = themes.find((t) => t.id === themeId);

  if (!theme) return null;

  // Convert HSL to rgb for preview
  const hslToRgb = (hsl: string) => {
    const [h, s, l] = hsl.split(' ').map((v) => parseFloat(v));
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col gap-2 rounded-lg border-2 p-4 transition-all hover:border-primary',
        isActive ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border'
      )}
    >
      {/* Theme name */}
      <div className="flex items-center justify-between">
        <span className="font-medium">{theme.name}</span>
        {isActive && <Check className="h-4 w-4 text-primary" />}
      </div>

      {/* Color palette preview */}
      <div className="grid grid-cols-6 gap-1">
        <div
          className="h-8 rounded"
          style={{ backgroundColor: hslToRgb(theme.colors.primary) }}
          title="Primary"
        />
        <div
          className="h-8 rounded"
          style={{ backgroundColor: hslToRgb(theme.colors.secondary) }}
          title="Secondary"
        />
        <div
          className="h-8 rounded"
          style={{ backgroundColor: hslToRgb(theme.colors.accent) }}
          title="Accent"
        />
        <div
          className="h-8 rounded"
          style={{ backgroundColor: hslToRgb(theme.colors.success) }}
          title="Success"
        />
        <div
          className="h-8 rounded"
          style={{ backgroundColor: hslToRgb(theme.colors.warning) }}
          title="Warning"
        />
        <div
          className="h-8 rounded"
          style={{ backgroundColor: hslToRgb(theme.colors.error) }}
          title="Error"
        />
      </div>

      {/* Description */}
      {theme.description && (
        <p className="text-left text-xs text-muted-foreground">{theme.description}</p>
      )}
    </button>
  );
}

/**
 * Theme Gallery
 * Grid of theme previews
 */
export function ThemeGallery() {
  const { themeId, setTheme } = useTheme();
  const themes = getAllThemes();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {themes.map((theme) => (
        <ThemePreview
          key={theme.id}
          themeId={theme.id}
          isActive={themeId === theme.id}
          onClick={() => setTheme(theme.id)}
        />
      ))}
    </div>
  );
}
