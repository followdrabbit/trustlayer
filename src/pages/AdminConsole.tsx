import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnswersStore } from '@/lib/stores';
import { frameworks, Framework, getQuestionFrameworkIds } from '@/lib/frameworks';
import { questions } from '@/lib/dataset';
import { exportAnswersToXLSX, downloadXLSX, generateExportFilename } from '@/lib/xlsxExport';
import { DomainManagement } from '@/components/settings/DomainManagement';
import { FrameworkManagement } from '@/components/settings/FrameworkManagement';
import { QuestionManagement } from '@/components/settings/QuestionManagement';
import { DashboardLayoutManager } from '@/components/settings/DashboardLayoutManager';
import { AuditLogsPanel } from '@/components/settings/AuditLogsPanel';
import { SIEMIntegrationsPanel } from '@/components/settings/SIEMIntegrationsPanel';
import { SIEMHealthPanel } from '@/components/settings/SIEMHealthPanel';
import { AIProvidersPanel } from '@/components/settings/AIProvidersPanel';
import { PageBreadcrumb } from '@/components/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  BookMarked,
  ClipboardList,
  Cog,
  Activity,
  Server,
  Bot,
  FileDown,
  Trash2,
  Info,
  LayoutGrid,
} from 'lucide-react';

export default function AdminConsole() {
  const { t } = useTranslation();
  const { enabledFrameworks, setEnabledFrameworks, answers, clearAnswers } = useAnswersStore();
  const [pendingFrameworks, setPendingFrameworks] = useState<string[]>(enabledFrameworks);
  const [hasChanges, setHasChanges] = useState(false);

  const TAB_CONFIG = {
    content: {
      label: t('settings.contentTab'),
      icon: BookMarked,
      description: t('settings.manageContentDesc'),
    },
    assessment: {
      label: t('settings.assessmentTab'),
      icon: ClipboardList,
      description: t('settings.configureAssessmentDesc'),
    },
    system: {
      label: t('settings.systemTab'),
      icon: Cog,
      description: t('settings.exportAndGeneralDesc'),
    },
    dashboards: {
      label: t('settings.dashboardLayoutTab'),
      icon: LayoutGrid,
      description: t('settings.dashboardLayoutDescription'),
    },
    audit: {
      label: t('auditLogs.title'),
      icon: Activity,
      description: t('auditLogs.description'),
    },
    siem: {
      label: t('siem.tabTitle'),
      icon: Server,
      description: t('siem.tabDescription'),
    },
    ai: {
      label: t('aiProviders.tabTitle', 'Assistente IA'),
      icon: Bot,
      description: t('aiProviders.tabDescription', 'Configure provedores de IA'),
    },
  };

  const questionCountByFramework = useMemo(() => {
    const counts: Record<string, number> = {};
    frameworks.forEach((fw) => {
      counts[fw.frameworkId] = 0;
    });

    questions.forEach((question) => {
      const fwIds = getQuestionFrameworkIds(question.frameworks);
      fwIds.forEach((fwId) => {
        if (counts[fwId] !== undefined) counts[fwId] += 1;
      });
    });

    return counts;
  }, []);

  const answeredCountByFramework = useMemo(() => {
    const counts: Record<string, number> = {};
    frameworks.forEach((fw) => {
      counts[fw.frameworkId] = 0;
    });

    answers.forEach((answer, questionId) => {
      if (!answer.response) return;
      const question = questions.find((item) => item.questionId === questionId);
      if (!question) return;
      const fwIds = getQuestionFrameworkIds(question.frameworks);
      fwIds.forEach((fwId) => {
        if (counts[fwId] !== undefined) counts[fwId] += 1;
      });
    });

    return counts;
  }, [answers]);

  const totalQuestions = useMemo(() => {
    const uniqueQuestions = new Set<string>();
    questions.forEach((question) => {
      const fwIds = getQuestionFrameworkIds(question.frameworks);
      if (fwIds.some((id) => pendingFrameworks.includes(id))) {
        uniqueQuestions.add(question.questionId);
      }
    });
    return uniqueQuestions.size;
  }, [pendingFrameworks]);

  const totalAnswered = answers.size;

  const toggleFramework = (frameworkId: string) => {
    setPendingFrameworks((prev) => {
      const isEnabled = prev.includes(frameworkId);
      const next = isEnabled ? prev.filter((id) => id !== frameworkId) : [...prev, frameworkId];
      setHasChanges(true);
      return next;
    });
  };

  const selectAll = () => {
    setPendingFrameworks(frameworks.map((fw) => fw.frameworkId));
    setHasChanges(true);
  };

  const selectDefaults = () => {
    setPendingFrameworks(frameworks.filter((fw) => fw.defaultEnabled).map((fw) => fw.frameworkId));
    setHasChanges(true);
  };

  const selectNone = () => {
    setPendingFrameworks([]);
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (pendingFrameworks.length === 0) {
      toast.error(t('settings.selectAtLeastOne'));
      return;
    }
    await setEnabledFrameworks(pendingFrameworks);
    setHasChanges(false);
    toast.success(t('settings.settingsSaved'));
  };

  const cancelChanges = () => {
    setPendingFrameworks(enabledFrameworks);
    setHasChanges(false);
  };

  const handleExportData = async () => {
    try {
      const blob = await exportAnswersToXLSX(answers);
      const filename = generateExportFilename();
      downloadXLSX(blob, filename);
      toast.success(t('settings.exportSuccess'));
    } catch (error) {
      toast.error(t('settings.exportError'));
      console.error(error);
    }
  };

  const FrameworkCard = ({ fw }: { fw: Framework }) => {
    const isEnabled = pendingFrameworks.includes(fw.frameworkId);
    const questionCount = questionCountByFramework[fw.frameworkId] || 0;
    const answeredCount = answeredCountByFramework[fw.frameworkId] || 0;

    return (
      <Card
        className={cn(
          'transition-colors h-full cursor-pointer',
          isEnabled
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'border-border opacity-70 hover:opacity-100 hover:border-primary/50'
        )}
        onClick={() => toggleFramework(fw.frameworkId)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                {fw.shortName}
                {fw.defaultEnabled && <Badge variant="outline">{t('common.default')}</Badge>}
              </CardTitle>
              <CardDescription className="text-xs mt-1">{fw.name}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('settings.questions')}</span>
            <span className="font-medium text-foreground">{questionCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('common.answered')}</span>
            <span className="font-medium text-foreground">{answeredCount}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb items={[{ label: 'Administracao', href: '/admin' }]} />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Administracao</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie conteudo, integracoes e configuracoes globais da plataforma.
        </p>
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 h-auto bg-transparent p-0">
          {Object.entries(TAB_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-background"
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{config.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.manageContent')}</CardTitle>
              <CardDescription>{t('settings.manageContentDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DomainManagement />
              <FrameworkManagement />
              <QuestionManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.configureAssessment')}</CardTitle>
              <CardDescription>{t('settings.configureAssessmentDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {t('settings.selectAll')}
                </Button>
                <Button variant="outline" size="sm" onClick={selectDefaults}>
                  {t('settings.selectDefaults')}
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone}>
                  {t('settings.selectNone')}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {frameworks.map((fw) => (
                  <FrameworkCard key={fw.frameworkId} fw={fw} />
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {t('settings.totalQuestions', { count: totalQuestions })}
                </div>
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <Button variant="ghost" onClick={cancelChanges}>
                      {t('common.cancel')}
                    </Button>
                  )}
                  <Button onClick={saveChanges} disabled={!hasChanges}>
                    {t('common.saveChanges', 'Salvar alteracoes')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.systemTab')}</CardTitle>
              <CardDescription>{t('settings.exportAndGeneralDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileDown className="h-4 w-4" />
                      {t('settings.exportBackup')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{t('settings.exportDescription')}</p>
                    <Button variant="outline" onClick={handleExportData} className="w-full justify-start">
                      <FileDown className="h-4 w-4 mr-2" />
                      {t('settings.exportToExcel')}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      {t('settings.dangerZone')}
                    </CardTitle>
                    <CardDescription>{t('settings.dangerZoneDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div>
                        <div className="font-medium text-sm">{t('settings.clearAnswers')}</div>
                        <div className="text-xs text-muted-foreground">
                          {t('settings.removesAllAnswers', { count: totalAnswered })}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {t('settings.clear')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('settings.clearAllAnswersTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('settings.clearAllAnswersDesc', { count: totalAnswered })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={clearAnswers}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t('settings.clearAnswers')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {t('settings.aboutPlatform')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground mb-2">{t('settings.supportedFrameworks')}</p>
                    <div className="flex flex-wrap gap-2">
                      {frameworks.map((fw) => (
                        <Badge key={fw.frameworkId} variant="outline" className="text-xs">
                          {fw.shortName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboards" className="space-y-6">
          <DashboardLayoutManager />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('auditLogs.title')}</CardTitle>
              <CardDescription>{t('auditLogs.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <AuditLogsPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="siem" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('siem.title')}</CardTitle>
              <CardDescription>{t('siem.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SIEMIntegrationsPanel />
              <SIEMHealthPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('aiProviders.title', 'Provedores de IA')}</CardTitle>
              <CardDescription>
                {t('aiProviders.description', 'Configure diferentes provedores de IA para o assistente')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIProvidersPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
