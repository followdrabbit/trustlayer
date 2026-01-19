import { useEffect, useCallback } from 'react';
import { useAnswersStore } from '@/lib/stores';
import { 
  saveMaturitySnapshot, 
  getLastSnapshotDate,
  DomainSnapshot,
  FrameworkSnapshot,
  FrameworkCategorySnapshot
} from '@/lib/database';
import { calculateOverallMetrics, getFrameworkCoverage } from '@/lib/scoring';
import { questions as defaultQuestions, loadCatalogFromDatabase } from '@/lib/dataset';
import { getAllCustomQuestions, getDisabledQuestions, getEnabledFrameworks } from '@/lib/database';
import { getQuestionFrameworkIds, loadFrameworksFromDatabase } from '@/lib/frameworks';
import { useUserRole } from '@/hooks/useUserRole';
import { canEditAssessments } from '@/lib/roles';
import { exportAnalyticsSnapshot } from '@/lib/analyticsExport';

export function useMaturitySnapshots() {
  const { answers, isLoading, selectedSecurityDomain } = useAnswersStore();
  const { role } = useUserRole();
  const canEdit = canEditAssessments(role);

  const captureSnapshot = useCallback(async (snapshotType: 'automatic' | 'manual' = 'automatic') => {
    if (!canEdit) return;
    if (answers.size === 0) return;

    try {
      await Promise.all([
        loadCatalogFromDatabase(),
        loadFrameworksFromDatabase(),
      ]);

      // Load all questions considering enabled frameworks
      const [customQuestions, disabledQuestionIds, enabledIds] = await Promise.all([
        getAllCustomQuestions(),
        getDisabledQuestions(),
        getEnabledFrameworks()
      ]);

      // Combine questions
      const allQuestions = [
        ...defaultQuestions
          .filter(q => !disabledQuestionIds.includes(q.questionId))
          .map(q => ({
            questionId: q.questionId,
            questionText: q.questionText,
            subcatId: q.subcatId,
            domainId: q.domainId,
            ownershipType: q.ownershipType,
            frameworks: q.frameworks || []
          })),
        ...customQuestions
          .filter(q => !q.isDisabled)
          .map(q => ({
            questionId: q.questionId,
            questionText: q.questionText,
            subcatId: q.subcatId || '',
            domainId: q.domainId,
            ownershipType: q.ownershipType,
            frameworks: q.frameworks || []
          }))
      ];

      // Filter by enabled frameworks
      const enabledSet = new Set(enabledIds);
      const questionsFiltered = enabledIds.length > 0
        ? allQuestions.filter(q => {
            const questionFrameworkIds = getQuestionFrameworkIds(q.frameworks);
            return questionFrameworkIds.some(id => enabledSet.has(id));
          })
        : allQuestions;

      // Calculate metrics
      const metrics = calculateOverallMetrics(answers, questionsFiltered);
      const frameworkCoverage = getFrameworkCoverage(answers, questionsFiltered);

      // Prepare domain snapshots
      const domainMetrics: DomainSnapshot[] = metrics.domainMetrics.map(dm => ({
        domainId: dm.domainId,
        domainName: dm.domainName,
        score: dm.score,
        coverage: dm.coverage,
        criticalGaps: dm.criticalGaps
      }));

      // Prepare framework snapshots
      const frameworkMetrics: FrameworkSnapshot[] = frameworkCoverage.map(fw => ({
        framework: fw.framework,
        score: fw.averageScore,
        coverage: fw.coverage,
        totalQuestions: fw.totalQuestions,
        answeredQuestions: fw.answeredQuestions
      }));

      // Prepare framework category snapshots
      const frameworkCategoryMetrics: FrameworkCategorySnapshot[] = metrics.frameworkCategoryMetrics.map(fc => ({
        categoryId: fc.categoryId,
        categoryName: fc.categoryName,
        score: fc.score,
        coverage: fc.coverage
      }));

      const snapshotPayload = {
        snapshotDate: new Date().toISOString().split('T')[0],
        snapshotType,
        securityDomainId: selectedSecurityDomain || undefined,
        overallScore: metrics.overallScore,
        overallCoverage: metrics.coverage,
        evidenceReadiness: metrics.evidenceReadiness,
        maturityLevel: metrics.maturityLevel.level,
        totalQuestions: metrics.totalQuestions,
        answeredQuestions: metrics.answeredQuestions,
        criticalGaps: metrics.criticalGaps,
        domainMetrics,
        frameworkMetrics,
        frameworkCategoryMetrics
      };

      // Save snapshot with security domain
      await saveMaturitySnapshot(snapshotPayload);
      await exportAnalyticsSnapshot(snapshotPayload);

      console.log('Maturity snapshot saved successfully for domain:', selectedSecurityDomain);
    } catch (error) {
      console.error('Error saving maturity snapshot:', error);
    }
  }, [answers, selectedSecurityDomain, canEdit]);

  // Auto-capture daily snapshot
  useEffect(() => {
    if (!canEdit) return;
    if (isLoading || answers.size === 0) return;

    const checkAndCaptureSnapshot = async () => {
      try {
        const lastDate = await getLastSnapshotDate(selectedSecurityDomain || undefined);
        const today = new Date().toISOString().split('T')[0];
        
        // If no snapshot today for this domain, capture one
        if (lastDate !== today) {
          await captureSnapshot('automatic');
        }
      } catch (error) {
        console.error('Error checking snapshot date:', error);
      }
    };

    // Check on mount and after a delay
    const timeoutId = setTimeout(checkAndCaptureSnapshot, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [isLoading, answers.size, captureSnapshot, selectedSecurityDomain, canEdit]);

  return { captureSnapshot };
}
