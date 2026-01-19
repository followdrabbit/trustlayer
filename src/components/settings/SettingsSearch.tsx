import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bell, Mic, Palette, Search, Sun, Volume2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SearchableItemConfig {
  id: string;
  titleKey: string;
  descriptionKey: string;
  keywords: string[];
  tab: 'preferences';
  sectionKey?: string;
  icon: React.ElementType;
}

interface SearchableItem {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  tab: 'preferences';
  section?: string;
  icon: React.ElementType;
}

const SEARCHABLE_ITEMS_CONFIG: SearchableItemConfig[] = [
  {
    id: 'appearance',
    titleKey: 'settingsSearch.appearance.title',
    descriptionKey: 'settingsSearch.appearance.description',
    keywords: ['aparencia', 'appearance', 'tema', 'theme', 'claro', 'light', 'escuro', 'dark', 'idioma', 'language'],
    tab: 'preferences',
    sectionKey: 'settingsSearch.appearance.section',
    icon: Sun,
  },
  {
    id: 'voice-settings',
    titleKey: 'settingsSearch.voiceSettings.title',
    descriptionKey: 'settingsSearch.voiceSettings.description',
    keywords: ['voz', 'voice', 'fala', 'speech', 'velocidade', 'speed', 'rate', 'tom', 'pitch', 'volume', 'tts', 'sintese', 'synthesis'],
    tab: 'preferences',
    sectionKey: 'settingsSearch.voiceSettings.section',
    icon: Volume2,
  },
  {
    id: 'stt-config',
    titleKey: 'settingsSearch.sttConfig.title',
    descriptionKey: 'settingsSearch.sttConfig.description',
    keywords: ['stt', 'speech to text', 'reconhecimento', 'recognition', 'whisper', 'transcricao', 'transcription', 'microfone', 'microphone', 'api key'],
    tab: 'preferences',
    sectionKey: 'settingsSearch.sttConfig.section',
    icon: Mic,
  },
  {
    id: 'voice-profile',
    titleKey: 'settingsSearch.voiceProfile.title',
    descriptionKey: 'settingsSearch.voiceProfile.description',
    keywords: ['perfil', 'profile', 'biometria', 'biometric', 'voice profile', 'speaker', 'reconhecimento', 'recognition', 'verificacao', 'verification'],
    tab: 'preferences',
    sectionKey: 'settingsSearch.voiceProfile.section',
    icon: Mic,
  },
  {
    id: 'notifications',
    titleKey: 'settingsSearch.notifications.title',
    descriptionKey: 'settingsSearch.notifications.description',
    keywords: ['notificacao', 'notification', 'alerta', 'alert', 'email', 'semanal', 'weekly', 'digest', 'atualizacao', 'update', 'novidades', 'news'],
    tab: 'preferences',
    sectionKey: 'settingsSearch.notifications.section',
    icon: Bell,
  },
];

interface SettingsSearchProps {
  onNavigate: (tab: string, sectionId?: string) => void;
}

export function SettingsSearch({ onNavigate }: SettingsSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const TAB_CONFIG = useMemo(
    () => ({
      preferences: { label: t('settings.preferencesTab'), icon: Palette, color: 'bg-pink-500/10 text-pink-700' },
    }),
    [t]
  );

  const searchableItems: SearchableItem[] = useMemo(() => {
    return SEARCHABLE_ITEMS_CONFIG.map((item) => ({
      id: item.id,
      title: t(item.titleKey),
      description: t(item.descriptionKey),
      keywords: item.keywords,
      tab: item.tab,
      section: item.sectionKey ? t(item.sectionKey) : undefined,
      icon: item.icon,
    }));
  }, [t]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
    return searchableItems
      .filter((item) => {
        const searchableText = [item.title, item.description, ...item.keywords, item.section || '']
          .join(' ')
          .toLowerCase();
        return searchTerms.every((term) => searchableText.includes(term));
      })
      .slice(0, 6);
  }, [query, searchableItems]);

  const handleSelect = useCallback(
    (item: SearchableItem) => {
      onNavigate(item.tab, item.id);
      setQuery('');
      setIsFocused(false);
    },
    [onNavigate]
  );

  const handleClear = useCallback(() => {
    setQuery('');
  }, []);

  const showResults = isFocused && query.trim().length > 0;

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t('settingsSearch.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="pl-9 pr-8 h-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {results.length > 0 ? (
            <ScrollArea className="max-h-[320px]">
              <div className="p-1">
                {results.map((item) => {
                  const tabConfig = TAB_CONFIG[item.tab];
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-start gap-3 p-3 rounded-md hover:bg-accent transition-colors text-left group"
                    >
                      <div className={cn('h-8 w-8 rounded-md flex items-center justify-center shrink-0', tabConfig.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{item.title}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                            {tabConfig.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                        {item.section && (
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">- {item.section}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{t('settingsSearch.noResults', { query })}</p>
              <p className="text-xs mt-1">{t('settingsSearch.tryTerms')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
