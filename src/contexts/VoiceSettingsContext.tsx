import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { isInlineSecretAllowed } from '@/lib/secretInput';
import { STTProviderType } from '@/lib/sttProviders';

export interface VoiceSettings {
  // TTS (Text-to-Speech) settings
  voice_language: string;
  voice_rate: number;
  voice_pitch: number;
  voice_volume: number;
  voice_name: string | null;
  voice_auto_speak: boolean;
  // STT (Speech-to-Text) settings
  stt_provider: STTProviderType;
  stt_api_key: string | null;
  stt_model: string;
  stt_endpoint_url: string | null;
}

interface VoiceSettingsContextValue {
  settings: VoiceSettings;
  isLoaded: boolean;
  updateSettings: (newSettings: Partial<VoiceSettings>) => void;
  refetch: () => Promise<void>;
}

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type VoiceSettingsRow = Pick<
  ProfileRow,
  | 'voice_language'
  | 'voice_rate'
  | 'voice_pitch'
  | 'voice_volume'
  | 'voice_name'
  | 'voice_auto_speak'
  | 'stt_provider'
  | 'stt_api_key_encrypted'
  | 'stt_model'
  | 'stt_endpoint_url'
>;

const defaultSettings: VoiceSettings = {
  // TTS defaults
  voice_language: 'pt-BR',
  voice_rate: 1.0,
  voice_pitch: 1.0,
  voice_volume: 1.0,
  voice_name: null,
  voice_auto_speak: false,
  // STT defaults
  stt_provider: 'web-speech-api',
  stt_api_key: null,
  stt_model: 'whisper-1',
  stt_endpoint_url: null,
};

const VoiceSettingsContext = createContext<VoiceSettingsContextValue>({
  settings: defaultSettings,
  isLoaded: false,
  updateSettings: () => {},
  refetch: async () => {},
});

export function VoiceSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings);
      setIsLoaded(true);
      return;
    }

    try {
      const inlineSecretsAllowed = isInlineSecretAllowed();
      const selectFields = [
        'voice_language',
        'voice_rate',
        'voice_pitch',
        'voice_volume',
        'voice_name',
        'voice_auto_speak',
        'stt_provider',
        'stt_model',
        'stt_endpoint_url',
      ];

      if (inlineSecretsAllowed) {
        selectFields.push('stt_api_key_encrypted');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(selectFields.join(', '))
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching voice settings:', error);
        }
        setIsLoaded(true);
        return;
      }

      if (data) {
        const row = data as VoiceSettingsRow;
        setSettings({
          voice_language: row.voice_language || 'pt-BR',
          voice_rate: Number(row.voice_rate) || 1.0,
          voice_pitch: Number(row.voice_pitch) || 1.0,
          voice_volume: Number(row.voice_volume) || 1.0,
          voice_name: row.voice_name || null,
          voice_auto_speak: row.voice_auto_speak ?? false,
          stt_provider: (row.stt_provider as STTProviderType) || 'web-speech-api',
          stt_api_key: inlineSecretsAllowed ? row.stt_api_key_encrypted || null : null,
          stt_model: row.stt_model || 'whisper-1',
          stt_endpoint_url: row.stt_endpoint_url || null,
        });
      }
    } catch (err) {
      console.error('Error fetching voice settings:', err);
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <VoiceSettingsContext.Provider value={{ settings, isLoaded, updateSettings, refetch: fetchSettings }}>
      {children}
    </VoiceSettingsContext.Provider>
  );
}

export function useVoiceSettings() {
  return useContext(VoiceSettingsContext);
}
