import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import {
  DASHBOARD_KEYS,
  DashboardKey,
  DashboardLayoutConfig,
  getDefaultDashboardLayout,
  loadDashboardLayout,
  saveDashboardLayout,
} from '@/lib/dashboardLayouts';
import {
  DashboardWidgetDefinition,
  getWidgetsForDashboard,
  getWidgetDefinition,
} from '@/lib/dashboardWidgetCatalog';

const DASHBOARD_LABELS: Record<DashboardKey, string> = {
  executive: 'navigation.executive',
  grc: 'navigation.grc',
  specialist: 'navigation.specialist',
};

export function DashboardLayoutManager() {
  const { t } = useTranslation();
  const [dashboardKey, setDashboardKey] = useState<DashboardKey>('executive');
  const [layout, setLayout] = useState<DashboardLayoutConfig>(
    getDefaultDashboardLayout('executive')
  );
  const [savedLayout, setSavedLayout] = useState<DashboardLayoutConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const catalog = useMemo(() => getWidgetsForDashboard(dashboardKey), [dashboardKey]);
  const catalogMap = useMemo(
    () => new Map(catalog.map((widget) => [widget.id, widget])),
    [catalog]
  );

  const selectedWidgets = useMemo(() => {
    return layout.widgets.map((id) => {
      const widget = catalogMap.get(id) || getWidgetDefinition(id);
      if (widget) return widget;
      return {
        id,
        dashboardKeys: [dashboardKey],
        category: 'core',
        labelKey: '',
      } as DashboardWidgetDefinition;
    });
  }, [layout.widgets, catalogMap, dashboardKey]);

  const availableWidgets = useMemo(() => {
    const selectedIds = new Set(layout.widgets);
    return catalog.filter((widget) => !selectedIds.has(widget.id));
  }, [catalog, layout.widgets]);

  const isDirty = useMemo(() => {
    if (!savedLayout) return true;
    return JSON.stringify(savedLayout.widgets) !== JSON.stringify(layout.widgets);
  }, [layout.widgets, savedLayout]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const loaded = await loadDashboardLayout(dashboardKey);
        if (!isMounted) return;
        setLayout(loaded);
        setSavedLayout(loaded);
      } catch (error) {
        console.error('Failed to load dashboard layout', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [dashboardKey]);

  const handleMove = (id: string, direction: 'up' | 'down') => {
    setLayout((prev) => {
      const index = prev.widgets.indexOf(id);
      if (index < 0) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.widgets.length) return prev;
      const widgets = [...prev.widgets];
      [widgets[index], widgets[targetIndex]] = [widgets[targetIndex], widgets[index]];
      return { ...prev, widgets };
    });
  };

  const handleRemove = (id: string) => {
    setLayout((prev) => ({ ...prev, widgets: prev.widgets.filter((widgetId) => widgetId !== id) }));
  };

  const handleAdd = (id: string) => {
    setLayout((prev) => ({ ...prev, widgets: [...prev.widgets, id] }));
  };

  const handleReset = () => {
    const defaults = getDefaultDashboardLayout(dashboardKey);
    setLayout(defaults);
    toast.message(t('settings.dashboardLayoutDefaultApplied'));
  };

  const handleDiscard = () => {
    if (!savedLayout) return;
    setLayout(savedLayout);
    toast.message(t('settings.dashboardLayoutDiscarded'));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDashboardLayout(dashboardKey, layout);
      setSavedLayout(layout);
      toast.success(t('settings.dashboardLayoutSaved'));
    } catch (error) {
      console.error('Failed to save dashboard layout', error);
      toast.error(t('settings.dashboardLayoutSaveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.dashboardLayoutTitle')}</CardTitle>
        <CardDescription>{t('settings.dashboardLayoutDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[220px]">
            <Select value={dashboardKey} onValueChange={(value) => setDashboardKey(value as DashboardKey)}>
              <SelectTrigger>
                <SelectValue placeholder={t('settings.dashboardLayoutSelect')} />
              </SelectTrigger>
              <SelectContent>
                {DASHBOARD_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(DASHBOARD_LABELS[key])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline">{t('settings.dashboardLayoutScope')}</Badge>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="text-sm font-medium">{t('settings.dashboardLayoutSelected')}</div>
                {selectedWidgets.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    {t('settings.dashboardLayoutEmpty')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedWidgets.map((widget) => (
                      <div key={widget.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <div className="text-sm font-medium">
                            {widget.labelKey ? t(widget.labelKey) : widget.id}
                          </div>
                          {widget.descriptionKey && (
                            <div className="text-xs text-muted-foreground">{t(widget.descriptionKey)}</div>
                          )}
                          <div className="mt-1 text-[11px] uppercase text-muted-foreground">{widget.category}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMove(widget.id, 'up')}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMove(widget.id, 'down')}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemove(widget.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">{t('settings.dashboardLayoutAvailable')}</div>
                {availableWidgets.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    {t('settings.dashboardLayoutNoAvailable')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableWidgets.map((widget) => (
                      <div key={widget.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <div className="text-sm font-medium">
                            {widget.labelKey ? t(widget.labelKey) : widget.id}
                          </div>
                          {widget.descriptionKey && (
                            <div className="text-xs text-muted-foreground">{t(widget.descriptionKey)}</div>
                          )}
                          <div className="mt-1 text-[11px] uppercase text-muted-foreground">{widget.category}</div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleAdd(widget.id)}>
                          <Plus className="mr-1 h-4 w-4" />
                          {t('settings.dashboardLayoutAdd')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('settings.dashboardLayoutReset')}
              </Button>
              <Button type="button" variant="ghost" onClick={handleDiscard} disabled={!isDirty}>
                {t('settings.dashboardLayoutDiscard')}
              </Button>
              <Button type="button" onClick={handleSave} disabled={!isDirty || saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? t('settings.dashboardLayoutSaving') : t('settings.dashboardLayoutSave')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
