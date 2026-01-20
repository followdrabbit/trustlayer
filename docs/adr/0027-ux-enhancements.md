# ADR 0027: UX/UI Enhancements

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Design Team, Product Team

---

## Context

Para melhorar a experiência do usuário e customização enterprise, precisamos implementar:

1. **Theming avançado**: 5+ temas + customização de cores/fontes
2. **Animações**: Transições suaves em todas as páginas
3. **AI Assistant**: Posicionamento livre, habilitação por usuário
4. **Avatares**: Fotos de perfil para usuários
5. **White-label**: Logo customizado por empresa
6. **Dashboard customização**: Admin pode criar/desabilitar dashboards

## Decision

Implementaremos um **sistema de design modular e customizável** com as seguintes features:

### 1. Theme System

#### Theme Structure

```typescript
// lib/theme/types.ts
export interface Theme {
  id: string;
  name: string;
  description?: string;

  // Color palette
  colors: {
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
    border: string;

    // Component-specific
    card: string;
    popover: string;
    sidebar: string;
  };

  // Typography
  typography: {
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
  };

  // Spacing
  spacing: {
    unit: number; // Base unit (e.g., 4px)
  };

  // Border radius
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };

  // Shadows
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };

  // Animations
  animations: {
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
  };
}
```

#### Built-in Themes

```typescript
// lib/theme/presets.ts
export const themes: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'TrustLayer Default',
    colors: {
      primary: '#3B82F6', // Blue
      secondary: '#8B5CF6', // Purple
      // ...
    },
    // ...
  },

  dark: {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      primary: '#60A5FA',
      background: '#0F172A',
      foreground: '#F8FAFC',
      // ...
    },
    // ...
  },

  highContrast: {
    id: 'high-contrast',
    name: 'High Contrast',
    colors: {
      primary: '#000000',
      background: '#FFFFFF',
      foreground: '#000000',
      // WCAG AAA compliant
    },
    // ...
  },

  corporate: {
    id: 'corporate',
    name: 'Corporate Blue',
    colors: {
      primary: '#1E40AF',
      secondary: '#059669',
      // ...
    },
    // ...
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      primary: '#F59E0B',
      secondary: '#EF4444',
      // Warm colors
    },
    // ...
  },

  forest: {
    id: 'forest',
    name: 'Forest',
    colors: {
      primary: '#10B981',
      secondary: '#059669',
      // Green tones
    },
    // ...
  },
};
```

#### Theme Customization

```typescript
// Database schema
CREATE TABLE organization_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  -- Base theme
  base_theme TEXT NOT NULL DEFAULT 'default',

  -- Custom overrides
  colors JSONB,
  typography JSONB,

  -- White-label
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User preferences
ALTER TABLE profiles
ADD COLUMN theme_preference TEXT DEFAULT 'default',
ADD COLUMN theme_custom_overrides JSONB;
```

#### Theme Provider

```typescript
// components/theme-provider.tsx
export function ThemeProvider({ children }: PropsWithChildren) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Apply CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    // ... apply all theme variables
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 2. Animation System

#### Animation Library

```typescript
// lib/animations/presets.ts
export const animations = {
  // Page transitions
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },

  slideInRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Component animations
  scaleOnHover: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  },

  shimmer: {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },

  // Card stagger
  staggerChildren: {
    animate: { transition: { staggerChildren: 0.1 } },
  },

  cardItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
};
```

#### Usage Examples

```typescript
// components/animated-page.tsx
export function AnimatedPage({ children }: PropsWithChildren) {
  return (
    <motion.div
      variants={animations.fadeIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

// components/card-grid.tsx
export function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <motion.div
      className="grid grid-cols-3 gap-4"
      variants={animations.staggerChildren}
      initial="initial"
      animate="animate"
    >
      {cards.map(card => (
        <motion.div
          key={card.id}
          variants={animations.cardItem}
          whileHover={animations.scaleOnHover.whileHover}
        >
          <Card {...card} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 3. AI Assistant Enhancement

#### Draggable Assistant

```typescript
// components/ai-assistant/draggable-assistant.tsx
export function DraggableAIAssistant() {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Draggable
      position={position}
      onDrag={(e, data) => {
        setPosition({ x: data.x, y: data.y });
        setIsDragging(true);
      }}
      onStop={() => {
        setIsDragging(false);
        // Save position to localStorage
        localStorage.setItem('ai-assistant-position', JSON.stringify(position));
      }}
    >
      <div className={cn(
        'fixed z-50 transition-shadow',
        isDragging ? 'cursor-grabbing shadow-2xl' : 'cursor-grab shadow-lg'
      )}>
        <AIAssistantButton />
      </div>
    </Draggable>
  );
}
```

#### User Preferences

```typescript
// Database schema
ALTER TABLE profiles
ADD COLUMN ai_assistant_enabled BOOLEAN DEFAULT true,
ADD COLUMN ai_assistant_position JSONB DEFAULT '{"x": 20, "y": 20}',
ADD COLUMN audio_enabled BOOLEAN DEFAULT true;

-- Global settings (admin-controlled)
CREATE TABLE global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO global_settings (key, value) VALUES
('ai_assistant_available', 'true'),
('audio_features_available', 'true');
```

#### Settings UI

```typescript
// components/settings/ai-assistant-settings.tsx
export function AIAssistantSettings() {
  const { profile, updateProfile } = useProfile();
  const globalSettings = useGlobalSettings();

  if (!globalSettings.ai_assistant_available) {
    return <Alert>AI Assistant is not available for your organization</Alert>;
  }

  return (
    <div>
      <Switch
        checked={profile.ai_assistant_enabled}
        onCheckedChange={(enabled) =>
          updateProfile({ ai_assistant_enabled: enabled })
        }
      >
        Enable AI Assistant
      </Switch>

      {profile.ai_assistant_enabled && (
        <Button onClick={resetAssistantPosition}>
          Reset Assistant Position
        </Button>
      )}
    </div>
  );
}
```

### 4. User Avatars

#### Upload & Storage

```typescript
// services/avatar-service.ts
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  // Validate
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File must be less than 5MB');
  }

  // Resize using canvas
  const resized = await resizeImage(file, 256, 256);

  // Upload to Supabase Storage
  const fileName = `${userId}/avatar.jpg`;
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, resized, { upsert: true });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // Update profile
  await supabase
    .from('profiles')
    .update({ avatar_url: urlData.publicUrl })
    .eq('user_id', userId);

  return urlData.publicUrl;
}
```

#### Avatar Component

```typescript
// components/avatar.tsx
export function UserAvatar({ user, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={user.avatar_url} alt={user.display_name} />
      <AvatarFallback>
        {user.display_name?.slice(0, 2).toUpperCase() || 'U'}
      </AvatarFallback>
    </Avatar>
  );
}
```

### 5. Custom Dashboards

#### Dashboard Configuration

```typescript
// Database schema
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  name TEXT NOT NULL,
  description TEXT,

  -- Layout
  layout JSONB NOT NULL, -- Grid layout configuration
  widgets JSONB NOT NULL, -- Widget instances

  -- Permissions
  visibility TEXT NOT NULL CHECK (visibility IN ('private', 'role', 'global')),
  allowed_roles TEXT[],
  created_by UUID REFERENCES auth.users(id),

  -- Status
  is_default BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default dashboards (built-in)
CREATE TABLE default_dashboards (
  id TEXT PRIMARY KEY, -- 'executive', 'grc', 'specialist'
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  can_be_disabled BOOLEAN DEFAULT true
);
```

#### Dashboard Builder

```typescript
// pages/admin/dashboard-builder.tsx
export function DashboardBuilder() {
  const [layout, setLayout] = useState<Layout>([]);
  const [widgets, setWidgets] = useState<Widget[]>([]);

  return (
    <div className="grid grid-cols-[300px_1fr] gap-4">
      {/* Sidebar: Widget Library */}
      <WidgetLibrary
        onAddWidget={(widget) => {
          setWidgets([...widgets, widget]);
        }}
      />

      {/* Main: Canvas */}
      <GridLayout
        layout={layout}
        onLayoutChange={setLayout}
        draggableHandle=".drag-handle"
      >
        {widgets.map(widget => (
          <div key={widget.id} data-grid={widget.grid}>
            <WidgetRenderer widget={widget} />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
```

## Consequences

### Positivo

✅ **Customization**: Empresas podem ter visual próprio
✅ **Accessibility**: High contrast theme para WCAG compliance
✅ **UX**: Animações melhoram percepção de performance
✅ **Flexibility**: Dashboards adaptados para cada org
✅ **Personalization**: Cada usuário controla AI assistant

### Negativo

❌ **Complexity**: Mais código para manter
❌ **Performance**: Animações podem ser pesadas em devices antigos
❌ **Storage**: Avatars e logos consomem storage

### Mitigação

- **Performance**: Animations only on modern browsers (prefers-reduced-motion)
- **Storage limits**: Max 5MB per avatar, auto-compress
- **Fallbacks**: Graceful degradation sem JavaScript

## Implementation Plan

### Phase 1: Theme System (Sprint 1-2)
- [ ] Theme data structure
- [ ] 5 built-in themes
- [ ] Theme provider
- [ ] Theme switcher UI

### Phase 2: Animations (Sprint 2-3)
- [ ] Animation library (Framer Motion)
- [ ] Page transitions
- [ ] Component animations
- [ ] Stagger effects

### Phase 3: AI Assistant (Sprint 3)
- [ ] Draggable component
- [ ] Position persistence
- [ ] User preferences (enable/disable)
- [ ] Global admin toggle

### Phase 4: Avatars & White-label (Sprint 4)
- [ ] Avatar upload
- [ ] Image resize/compression
- [ ] Organization logo upload
- [ ] Favicon customization

### Phase 5: Custom Dashboards (Sprint 5-6)
- [ ] Dashboard builder UI
- [ ] Widget library
- [ ] Layout persistence
- [ ] Admin controls (enable/disable)

## Related ADRs

- ADR-0024: Modular architecture (dashboards as widgets)

## References

- [Framer Motion](https://www.framer.com/motion/)
- [React Grid Layout](https://github.com/react-grid-layout/react-grid-layout)
- [Radix UI Themes](https://www.radix-ui.com/themes/docs/overview/getting-started)
