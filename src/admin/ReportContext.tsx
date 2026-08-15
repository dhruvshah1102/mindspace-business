import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTenant } from '@/app/TenantContext';
import { getFeelingSnapshotAsync, getFeelingSnapshot } from '@/services/snapshot-service';
import { generateWellbeingReport, isGeminiConfigured } from '@/services/gemini-service';
import { loadCheckInsAsync, loadCheckIns } from '@/services/response-store';
import type { FeelingSnapshot } from '@/domain/snapshot';
import type { WellbeingReport } from '@/domain/wellbeing-report';
import { toast } from 'sonner';

interface ReportContextValue {
  report: WellbeingReport | null;
  snapshot: FeelingSnapshot | null;
  loading: boolean;
  isSyncing: boolean;
  /** Explicitly fetches Supabase + local check-ins and re-synthesizes the entire report with Gemini */
  syncAndRegenerate: () => Promise<void>;
  aiConfigured: boolean;
  liveCount: number;
}

const ReportContext = createContext<ReportContextValue | null>(null);

/** One report per session, shared by every console screen.
 * It does NOT make repeated API calls on page visits. It only calls Gemini
 * when the HR user explicitly clicks the Sync & Regenerate button. */
export function ReportProvider({ children }: { children: ReactNode }) {
  const { organization } = useTenant();
  const [report, setReport] = useState<WellbeingReport | null>(null);
  const [snapshot, setSnapshot] = useState<FeelingSnapshot | null>(() => getFeelingSnapshot(organization));
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [liveCount, setLiveCount] = useState(() => loadCheckIns().length);

  // Initial load reads from cache or local writer (0 API spam)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const liveItems = await loadCheckInsAsync(organization.orgId);
        if (mounted) setLiveCount(liveItems.length);
        const nextSnapshot = await getFeelingSnapshotAsync(organization);
        if (mounted) {
          setSnapshot(nextSnapshot);
          const cachedOrGenerated = await generateWellbeingReport(nextSnapshot, { force: false });
          setReport(cachedOrGenerated);
        }
      } catch (err) {
        console.error('[mindspace] Initial report load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [organization]);

  /** Explicitly triggered by HR click: loads Supabase check-ins, blends with demo data,
   * calls Gemini, and refreshes the entire multi-page report. */
  const syncAndRegenerate = useCallback(async () => {
    setIsSyncing(true);
    toast.loading('Syncing latest check-ins from Supabase and synthesizing report...', { id: 'report-sync' });

    try {
      const liveItems = await loadCheckInsAsync(organization.orgId);
      setLiveCount(liveItems.length);

      const nextSnapshot = await getFeelingSnapshotAsync(organization);
      setSnapshot(nextSnapshot);

      const updatedReport = await generateWellbeingReport(nextSnapshot, { force: true });
      setReport(updatedReport);

      const writerName = updatedReport.meta.writtenBy === 'gemini' ? 'Gemini 2.5 Flash' : 'Built-in Rules Engine';
      toast.success(
        `Report regenerated successfully (${writerName})! All 4 sections (Verdict, Feelings, Pressures, Actions) updated for ${nextSnapshot.responses} total responses.`,
        { id: 'report-sync' }
      );
    } catch (err) {
      console.error('[mindspace] Report regeneration failed:', err);
      toast.error('Failed to regenerate report. Using local synthesis fallback.', { id: 'report-sync' });
    } finally {
      setIsSyncing(false);
    }
  }, [organization]);

  const value = useMemo(
    () => ({
      report,
      snapshot,
      loading,
      isSyncing,
      syncAndRegenerate,
      aiConfigured: isGeminiConfigured,
      liveCount,
    }),
    [report, snapshot, loading, isSyncing, syncAndRegenerate, liveCount],
  );

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReport(): ReportContextValue {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReport must be used within a ReportProvider');
  return ctx;
}
