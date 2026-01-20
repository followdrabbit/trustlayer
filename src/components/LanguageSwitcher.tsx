/**
 * Language Switcher Component
 * Allows users to switch between supported languages
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'pt-BR',
    name: 'Portuguese (Brazil)',
    nativeName: 'Português (Brasil)',
    flag: '🇧🇷',
  },
  {
    code: 'en-US',
    name: 'English (United States)',
    nativeName: 'English (United States)',
    flag: '🇺🇸',
  },
  {
    code: 'es-ES',
    name: 'Spanish (Spain)',
    nativeName: 'Español (España)',
    flag: '🇪🇸',
  },
];

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'icon-only';
  showFlag?: boolean;
  align?: 'start' | 'center' | 'end';
}

export function LanguageSwitcher({
  variant = 'default',
  showFlag = true,
  align = 'end',
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || SUPPORTED_LANGUAGES[0];

  const changeLanguage = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      // Store preference in localStorage
      localStorage.setItem('preferredLanguage', languageCode);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  if (variant === 'icon-only') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Globe className="h-4 w-4" />
            <span className="sr-only">Change language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-56">
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {showFlag && <span className="text-lg">{language.flag}</span>}
                <span>{language.nativeName}</span>
              </div>
              {language.code === currentLanguage.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-2">
            {showFlag && <span>{currentLanguage.flag}</span>}
            <span className="text-sm">{currentLanguage.code.split('-')[0].toUpperCase()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-56">
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {showFlag && <span className="text-lg">{language.flag}</span>}
                <span>{language.nativeName}</span>
              </div>
              {language.code === currentLanguage.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {showFlag && `${currentLanguage.flag} `}
            {currentLanguage.nativeName}
          </span>
          <span className="sm:hidden">
            {currentLanguage.code.split('-')[0].toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64">
        <div className="px-2 py-1.5 text-sm font-semibold">Select Language</div>
        {SUPPORTED_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className="flex items-center justify-between cursor-pointer py-2"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {showFlag && <span className="text-lg">{language.flag}</span>}
                <span className="font-medium">{language.nativeName}</span>
              </div>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
            {language.code === currentLanguage.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Simple language switcher for mobile/compact layouts
 */
export function LanguageSwitcherSimple() {
  const { i18n } = useTranslation();

  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || SUPPORTED_LANGUAGES[0];

  const changeLanguage = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      localStorage.setItem('preferredLanguage', languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <select
        value={currentLanguage.code}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent border-none text-sm focus:outline-none cursor-pointer"
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Hook to get current language information
 */
export function useCurrentLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || SUPPORTED_LANGUAGES[0];

  return {
    language: currentLanguage,
    isRTL: false, // None of our supported languages are RTL
    changeLanguage: i18n.changeLanguage,
  };
}

/**
 * Get language display name
 */
export function getLanguageName(code: string, native: boolean = true): string {
  const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
  if (!language) return code;
  return native ? language.nativeName : language.name;
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): Language[] {
  return SUPPORTED_LANGUAGES;
}
