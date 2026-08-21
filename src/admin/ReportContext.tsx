import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTenant } from '@/app/TenantContext';
import { getRealFeelingSnapshot } from '@/services/real-snapshot-service';
import { currentPeriodLabel } from '@/services/snapshot-service';
import { generateWellbeingReport, isGeminiConfigured } from '@/services/gemini-service';
import type { FeelingSnapshot } from '@/domain/snapshot';
import type { WellbeingReport } from '@/domain/wellbeing-report';
import { toast } from 'sonner';

interface ReportContextValue {
  report: WellbeingReport | null;
  snapshot: FeelingSnapshot | null;
  loading: boolean;
  isSyncing: boolean;
  /** True once loading has finished and nobody has completed a real
   * assessment yet, so pages can show an honest empty state instead of a
   * report written from zero responses. */
  notEnoughData: boolean;
  /** Re-pulls assessment_records from Supabase and re-synthesizes the whole
   * report with Gemini. */
  syncAndRegenerate: () => Promise<void>;
  aiConfigured: boolean;
}

const ReportContext = createContext<ReportContextValue | null>(null);

/**
 * One report per session, shared by every console screen. Built from real
 * employee assessments (assessment_records), not the legacy anonymous
 * check-in flow this used to run on. It does not call Gemini on page load or
 * navigation — only when the HR user explicitly triggers a resync, or on the
 * very first load of a session (cached afterwards).
 */
export function ReportProvider({ children }: { children: ReactNode }) {
  const { organization } = useTenant();
  const [report, setReport] = useState<WellbeingReport | null>(null);
  const [snapshot, setSnapshot] = useState<FeelingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notEnoughData, setNotEnoughData] = useState(false);

  const loadReport = useCallback(
    async (opts: { callGemini: boolean; force?: boolean }) => {
      const periodLabel = currentPeriodLabel();
      const nextSnapshot = await getRealFeelingSnapshot(organization, periodLabel);

      if (!nextSnapshot) {
        setSnapshot(null);
        setReport(null);
        setNotEnoughData(true);
        return null;
      }

      setSnapshot(nextSnapshot);
      setNotEnoughData(false);
      const nextReport = await generateWellbeingReport(nextSnapshot, opts);
      setReport(nextReport);
      return nextReport;
    },
    [organization],
  );

  // Initial load: reads real assessment data, writes the report from cache
  // or the local rules engine (zero Gemini calls on page load).
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await loadReport({ callGemini: false });
      } catch (err) {
        console.error('[mindspace] Initial report load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadReport]);

  const syncAndRegenerate = useCallback(async () => {
    setIsSyncing(true);
    toast.loading('Pulling the latest assessment results and synthesizing with Gemini...', { id: 'report-sync' });

    try {
      const updatedReport = await loadReport({ force: true, callGemini: true });
      if (!updatedReport) {
        toast.info('No employees have completed an assessment yet.', { id: 'report-sync' });
        return;
      }
      const writerName = updatedReport.meta.writtenBy === 'gemini' ? 'Gemini 2.5 Flash' : 'Built-in Rules Engine';
      toast.success(
        `Report regenerated successfully (${writerName})! All 4 sections updated for ${updatedReport.meta.responses} total responses.`,
        { id: 'report-sync' },
      );
    } catch (err) {
      console.error('[mindspace] Sync and regenerate failed:', err);
      toast.error('Could not regenerate report with Gemini. Showing cached report.', { id: 'report-sync' });
    } finally {
      setIsSyncing(false);
    }
  }, [loadReport]);

  const value = useMemo<ReportContextValue>(
    () => ({
      report,
      snapshot,
      loading,
      isSyncing,
      notEnoughData,
      syncAndRegenerate,
      aiConfigured: isGeminiConfigured,
    }),
    [report, snapshot, loading, isSyncing, notEnoughData, syncAndRegenerate],
  );

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReport(): ReportContextValue {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReport must be used within a ReportProvider');
  return ctx;
}
