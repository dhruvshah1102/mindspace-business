import { Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from '@/app/TenantContext';
import { AuthProvider } from '@/app/AuthContext';
import { RequireHrAuth } from '@/app/RequireHrAuth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { AdminLayout } from '@/admin/AdminLayout';
import { ReportPage } from '@/admin/pages/ReportPage';
import { FeelingsPage } from '@/admin/pages/FeelingsPage';
import { PressuresPage } from '@/admin/pages/PressuresPage';
import { ActionsPage } from '@/admin/pages/ActionsPage';
import { EngagementPage } from '@/admin/pages/EngagementPage';
import { CohortHeatmapPage } from '@/admin/pages/CohortHeatmapPage';
import { WellbeingExplorerPage } from '@/admin/pages/WellbeingExplorerPage';
import { DriverAnalysisPage } from '@/admin/pages/DriverAnalysisPage';
import { LoginPage } from '@/pages/LoginPage';
import { CheckInPage } from '@/employee/CheckInPage';
import { LandingPage } from '@/pages/LandingPage';

export default function App() {
  return (
    <TenantProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Routes>
            {/* Main Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Employee Check-In & Assessment Flow */}
            <Route path="/check-in" element={<CheckInPage />} />

            {/* HR / Admin Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* HR Admin Console */}
            <Route
              path="/admin"
              element={
                <RequireHrAuth>
                  <AdminLayout />
                </RequireHrAuth>
              }
            >
              <Route index element={<Navigate to="report" replace />} />
              <Route path="report" element={<ReportPage />} />
              <Route path="feelings" element={<FeelingsPage />} />
              <Route path="pressures" element={<PressuresPage />} />
              <Route path="engagement" element={<EngagementPage />} />
              <Route path="actions" element={<ActionsPage />} />

              <Route path="data/heatmap" element={<CohortHeatmapPage />} />
              <Route path="data/explorer" element={<WellbeingExplorerPage />} />
              <Route path="data/drivers" element={<DriverAnalysisPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </TenantProvider>
  );
}
