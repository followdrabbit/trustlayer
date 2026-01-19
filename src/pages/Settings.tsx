import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useSyncedSpeechSynthesis } from '@/hooks/useSyncedSpeechSynthesis';
import { useVoiceSettings, type VoiceSettings as VoiceSettingsContext } from '@/contexts/VoiceSettingsContext';
import type { Database } from '@/integrations/supabase/types';
import { isInlineSecretAllowed } from '@/lib/secretInput';
import { STTProviderType } from '@/lib/sttProviders';
import { SettingsSearch } from '@/components/settings/SettingsSearch';
import { STTConfigurationCard } from '@/components/settings/STTConfigurationCard';
import { VoiceProfileCard } from '@/components/settings/VoiceProfileCard';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Globe, Mic, Moon, Palette, Sun, Volume2 } from 'lucide-react';

const LANGUAGES = [
  { code: 'pt-BR', name: 'Portugues (Brasil)' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Espanol (Espanha)' },
] as const;

interface NotificationPreferences {
  notify_assessment_updates: boolean;
  notify_security_alerts: boolean;
  notify_weekly_digest: boolean;
  notify_new_features: boolean;
}

interface VoiceSettings {
  voice_language: string;
  voice_rate: number;
  voice_pitch: number;
  voice_volume: number;
  voice_name: string | null;
  voice_auto_speak: boolean;
}

interface STTSettings {
  stt_provider: STTProviderType;
  stt_api_key: string | null;
  stt_model: string;
  stt_endpoint_url: string | null;
}

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileSettingsRow = Pick<
  ProfileRow,
  | 'language'
  | 'notify_assessment_updates'
  | 'notify_security_alerts'
  | 'notify_weekly_digest'
  | 'notify_new_features'
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

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { voices, speak, stop, isSpeaking } = useSyncedSpeechSynthesis();
  const { updateSettings: updateVoiceSettingsContext } = useVoiceSettings();

  const [activeTab, setActiveTab] = useState('preferences');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const [language, setLanguage] = useState('pt-BR');
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    notify_assessment_updates: true,
    notify_security_alerts: true,
    notify_weekly_digest: false,
    notify_new_features: true,
  });
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice_language: 'pt-BR',
    voice_rate: 1.0,
    voice_pitch: 1.0,
    voice_volume: 1.0,
    voice_name: null,
    voice_auto_speak: false,
  });
  const [sttSettings, setSttSettings] = useState<STTSettings>({
    stt_provider: 'web-speech-api',
    stt_api_key: null,
    stt_model: 'whisper-1',
    stt_endpoint_url: null,
  });
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [savingVoice, setSavingVoice] = useState(false);
  const [savingSTT, setSavingSTT] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleSearchNavigate = useCallback((tab: string, sectionId?: string) => {
    setActiveTab(tab);

    if (!sectionId) return;
    setHighlightedSection(sectionId);
    setTimeout(() => {
      const element = sectionRefs.current[sectionId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => setHighlightedSection(null), 2000);
    }, 100);
  }, []);

  const setSectionRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

  useEffect(() => {
    if (!user) return;

    async function loadPreferences() {
      try {
        const inlineSecretsAllowed = isInlineSecretAllowed();
        const selectFields = [
          'language',
          'notify_assessment_updates',
          'notify_security_alerts',
          'notify_weekly_digest',
          'notify_new_features',
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
          console.error('Error loading preferences:', error);
          return;
        }

        if (!data) return;

        const row = data as ProfileSettingsRow;

        setLanguage(row.language || 'pt-BR');
        setNotifications({
          notify_assessment_updates: row.notify_assessment_updates ?? true,
          notify_security_alerts: row.notify_security_alerts ?? true,
          notify_weekly_digest: row.notify_weekly_digest ?? false,
          notify_new_features: row.notify_new_features ?? true,
        });
        setVoiceSettings({
          voice_language: row.voice_language || 'pt-BR',
          voice_rate: Number(row.voice_rate) || 1.0,
          voice_pitch: Number(row.voice_pitch) || 1.0,
          voice_volume: Number(row.voice_volume) || 1.0,
          voice_name: row.voice_name || null,
          voice_auto_speak: row.voice_auto_speak ?? false,
        });
        setSttSettings({
          stt_provider: (row.stt_provider as STTProviderType) || 'web-speech-api',
          stt_api_key: inlineSecretsAllowed ? row.stt_api_key_encrypted || null : null,
          stt_model: row.stt_model || 'whisper-1',
          stt_endpoint_url: row.stt_endpoint_url || null,
        });
      } catch (err) {
        console.error('Error loading preferences:', err);
      }
    }

    loadPreferences();
  }, [user]);

  const handleSaveLanguage = async (newLanguage: string) => {
    if (!user) return;

    const previousLanguage = language;
    setLanguage(newLanguage);
    setSavingLanguage(true);

    try {
      i18n.changeLanguage(newLanguage);

      const { error } = await supabase
        .from('profiles')
        .update({
          language: newLanguage,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      const langName = LANGUAGES.find((item) => item.code === newLanguage)?.name || newLanguage;
      toast.success(t('profile.languageChanged', { language: langName }));
    } catch (err: any) {
      setLanguage(previousLanguage);
      i18n.changeLanguage(previousLanguage);
      toast.error(err.message || t('errors.saveLanguage'));
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleSaveNotifications = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;

    const updatedNotifications = { ...notifications, [key]: value };
    setNotifications(updatedNotifications);
    setSavingNotifications(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          [key]: value,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(t('settings.preferenceSaved', 'Preferencia salva!'));
    } catch (err: any) {
      setNotifications(notifications);
      toast.error(err.message || 'Erro ao salvar preferencia');
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSaveVoiceSetting = async <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    if (!user) return;

    const previousValue = voiceSettings[key];
    setVoiceSettings((prev) => ({ ...prev, [key]: value }));
    setSavingVoice(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          [key]: value,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      updateVoiceSettingsContext({ [key]: value });
      toast.success(t('profile.voiceSettingsSaved', 'Configuracao de voz salva!'));
    } catch (err: any) {
      setVoiceSettings((prev) => ({ ...prev, [key]: previousValue }));
      toast.error(err.message || t('errors.saveVoiceSettings', 'Erro ao salvar configuracao de voz'));
    } finally {
      setSavingVoice(false);
    }
  };

  const testVoice = () => {
    const voice = voices.find((v) => v.name === voiceSettings.voice_name)
      || voices.find((v) => v.lang === voiceSettings.voice_language)
      || voices[0];

    const testText = voiceSettings.voice_language.startsWith('pt')
      ? 'Ola! Esta e uma demonstracao das configuracoes de voz.'
      : voiceSettings.voice_language.startsWith('es')
      ? 'Hola! Esta es una demostracion de la configuracion de voz.'
      : 'Hello! This is a demonstration of the voice settings.';

    if (isSpeaking) {
      stop();
      return;
    }

    speak(testText, {
      voice,
      rate: voiceSettings.voice_rate,
      pitch: voiceSettings.voice_pitch,
      volume: voiceSettings.voice_volume,
    });
  };

  const handleSaveSTTSetting = async (key: keyof STTSettings, value: string | null) => {
    if (!user) return;

    if (key === 'stt_api_key' && value && !isInlineSecretAllowed()) {
      toast.error(t('profile.inlineSecretsDisabled', 'Inline API keys are disabled by policy.'));
      return;
    }

    const dbKey = key === 'stt_api_key' ? 'stt_api_key_encrypted' : key;
    setSavingSTT(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          [dbKey]: value,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSttSettings((prev) => ({ ...prev, [key]: value }));
      updateVoiceSettingsContext({ [key]: value } as Partial<VoiceSettingsContext>);
      toast.success(t('profile.sttSettingsSaved', 'Configuracao de STT salva!'));
    } catch (err: any) {
      toast.error(err.message || t('errors.saveSTTSettings', 'Erro ao salvar configuracao de STT'));
    } finally {
      setSavingSTT(false);
    }
  };

  const filteredVoices = useMemo(
    () => voices.filter((voice) => voice.lang.startsWith(voiceSettings.voice_language.split('-')[0])),
    [voices, voiceSettings.voice_language]
  );

  return (
    <div className="space-y-6">
      <PageBreadcrumb items={[{ label: t('settings.title', 'Configuracoes'), href: '/settings' }]} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Palette className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('settings.title', 'Configuracoes')}</h1>
            <p className="text-muted-foreground">
              {t('settings.preferencesDesc', 'Ajustes pessoais de idioma, tema e voz.')}
            </p>
          </div>
        </div>
        <SettingsSearch onNavigate={handleSearchNavigate} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-lg">
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('settings.preferencesTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-6">
          <Card
            ref={setSectionRef('appearance')}
            className={cn(highlightedSection === 'appearance' && 'ring-2 ring-primary ring-offset-2')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                {t('settings.appearance', 'Aparencia')}
              </CardTitle>
              <CardDescription>{t('settings.appearanceDesc', 'Tema e idioma do sistema.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>{t('settings.theme', 'Tema')}</Label>
                <ToggleGroup
                  type="single"
                  value={theme || 'system'}
                  onValueChange={(value) => value && setTheme(value)}
                  className="justify-start"
                >
                  <ToggleGroupItem value="light" aria-label="Light">
                    <Sun className="h-4 w-4 mr-2" />
                    {t('settings.light', 'Claro')}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dark" aria-label="Dark">
                    <Moon className="h-4 w-4 mr-2" />
                    {t('settings.dark', 'Escuro')}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="system" aria-label="System">
                    <Globe className="h-4 w-4 mr-2" />
                    {t('settings.system', 'Sistema')}
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-3">
                <Label>{t('settings.language', 'Idioma')}</Label>
                <Select
                  value={language}
                  onValueChange={(value) => handleSaveLanguage(value)}
                  disabled={savingLanguage}
                >
                  <SelectTrigger className="max-w-sm">
                    <SelectValue placeholder={t('settings.language', 'Idioma')} />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card
            ref={setSectionRef('notifications')}
            className={cn(highlightedSection === 'notifications' && 'ring-2 ring-primary ring-offset-2')}
          >
            <CardHeader>
              <CardTitle>{t('profile.notifications', 'Notificacoes')}</CardTitle>
              <CardDescription>{t('profile.notificationsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify_assessment_updates">{t('profile.assessmentUpdates')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('profile.assessmentUpdatesDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_assessment_updates"
                  checked={notifications.notify_assessment_updates}
                  onCheckedChange={(checked) => handleSaveNotifications('notify_assessment_updates', checked)}
                  disabled={savingNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify_security_alerts">{t('profile.securityAlerts')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('profile.securityAlertsDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_security_alerts"
                  checked={notifications.notify_security_alerts}
                  onCheckedChange={(checked) => handleSaveNotifications('notify_security_alerts', checked)}
                  disabled={savingNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify_weekly_digest">{t('profile.weeklyDigest')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('profile.weeklyDigestDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_weekly_digest"
                  checked={notifications.notify_weekly_digest}
                  onCheckedChange={(checked) => handleSaveNotifications('notify_weekly_digest', checked)}
                  disabled={savingNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify_new_features">{t('profile.newFeatures')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('profile.newFeaturesDescription')}
                  </p>
                </div>
                <Switch
                  id="notify_new_features"
                  checked={notifications.notify_new_features}
                  onCheckedChange={(checked) => handleSaveNotifications('notify_new_features', checked)}
                  disabled={savingNotifications}
                />
              </div>
            </CardContent>
          </Card>

          <Card
            ref={setSectionRef('voice-settings')}
            className={cn(highlightedSection === 'voice-settings' && 'ring-2 ring-primary ring-offset-2')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                {t('profile.voiceSettings')}
              </CardTitle>
              <CardDescription>{t('profile.voiceSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('profile.voiceLanguage', 'Idioma')}</Label>
                  <Select
                    value={voiceSettings.voice_language}
                    onValueChange={(value) => handleSaveVoiceSetting('voice_language', value)}
                    disabled={savingVoice}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.voiceName', 'Voz')}</Label>
                  <Select
                    value={voiceSettings.voice_name || 'auto'}
                    onValueChange={(value) => handleSaveVoiceSetting('voice_name', value === 'auto' ? null : value)}
                    disabled={savingVoice}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t('profile.voiceAuto', 'Automatica')}</SelectItem>
                      {filteredVoices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('profile.voiceRate', 'Velocidade')}</Label>
                    <span className="text-sm text-muted-foreground">{voiceSettings.voice_rate.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[voiceSettings.voice_rate]}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={(value) => setVoiceSettings((prev) => ({ ...prev, voice_rate: value[0] }))}
                    onValueCommit={(value) => handleSaveVoiceSetting('voice_rate', value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('profile.voicePitch', 'Tom')}</Label>
                    <span className="text-sm text-muted-foreground">{voiceSettings.voice_pitch.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[voiceSettings.voice_pitch]}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={(value) => setVoiceSettings((prev) => ({ ...prev, voice_pitch: value[0] }))}
                    onValueCommit={(value) => handleSaveVoiceSetting('voice_pitch', value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('profile.voiceVolume', 'Volume')}</Label>
                    <span className="text-sm text-muted-foreground">{Math.round(voiceSettings.voice_volume * 100)}%</span>
                  </div>
                  <Slider
                    value={[voiceSettings.voice_volume]}
                    min={0}
                    max={1}
                    step={0.05}
                    onValueChange={(value) => setVoiceSettings((prev) => ({ ...prev, voice_volume: value[0] }))}
                    onValueCommit={(value) => handleSaveVoiceSetting('voice_volume', value[0])}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="voice_auto_speak">{t('profile.autoSpeak', 'Auto-fala')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('profile.autoSpeakDescription', 'Ler respostas do assistente automaticamente')}
                  </p>
                </div>
                <Switch
                  id="voice_auto_speak"
                  checked={voiceSettings.voice_auto_speak}
                  onCheckedChange={(checked) => handleSaveVoiceSetting('voice_auto_speak', checked)}
                  disabled={savingVoice}
                />
              </div>

              <Button variant="outline" onClick={testVoice}>
                {isSpeaking ? t('profile.stopVoiceTest', 'Parar teste') : t('profile.testVoice', 'Testar voz')}
              </Button>
            </CardContent>
          </Card>

          <Card
            ref={setSectionRef('stt-config')}
            className={cn(highlightedSection === 'stt-config' && 'ring-2 ring-primary ring-offset-2')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                {t('profile.sttSettings', 'STT')}
              </CardTitle>
              <CardDescription>{t('profile.sttSettingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <STTConfigurationCard
                settings={sttSettings}
                onSave={handleSaveSTTSetting}
                isSaving={savingSTT}
              />
            </CardContent>
          </Card>

          <div
            ref={setSectionRef('voice-profile')}
            className={cn(highlightedSection === 'voice-profile' && 'ring-2 ring-primary ring-offset-2 rounded-lg')}
          >
            <VoiceProfileCard language={voiceSettings.voice_language} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
