import { Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from '@/app/TenantContext';
import { AuthProvider } from '@/app/AuthContext';
import { RequireHrAuth } from '@/app/RequireHrAuth';
import { EmployeeAuthProvider } from '@/app/EmployeeAuthContext';
import { RequireEmployeeAuth } from '@/app/RequireEmployeeAuth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { AdminLayout } from '@/admin/AdminLayout';
import { ReportPage } from '@/admin/pages/ReportPage';
import { FeelingsPage } from '@/admin/pages/FeelingsPage';
import { PressuresPage } from '@/admin/pages/PressuresPage';
import { ActionsPage } from '@/admin/pages/ActionsPage';
import { CohortHeatmapPage } from '@/admin/pages/CohortHeatmapPage';
import { WellbeingExplorerPage } from '@/admin/pages/WellbeingExplorerPage';
import { DriverAnalysisPage } from '@/admin/pages/DriverAnalysisPage';
import { LoginPage } from '@/pages/LoginPage';
import { EmployeeLoginPage } from '@/pages/EmployeeLoginPage';
import { EmployeeLayout } from '@/employee/EmployeeLayout';
import { TaraPage } from '@/employee/TaraPage';
import { AssessmentsPage } from '@/employee/AssessmentsPage';
import { AssessmentRunnerPage } from '@/employee/AssessmentRunnerPage';
import { BookSessionPage } from '@/employee/BookSessionPage';
import { ProfilePage } from '@/employee/ProfilePage';
import { LandingPage } from '@/pages/LandingPage';

export default function App() {
  return (
    <TenantProvider>
      <AuthProvider>
        <EmployeeAuthProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Routes>
              {/* Main Public Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* HR / Admin Login */}
              <Route path="/login" element={<LoginPage />} />

              {/* Employee account sign-in (Google, via Supabase) */}
              <Route path="/app/login" element={<EmployeeLoginPage />} />

              {/* Employee App — Tara, unlimited assessments, therapy booking */}
              <Route
                path="/app"
                element={
                  <RequireEmployeeAuth>
                    <EmployeeLayout />
                  </RequireEmployeeAuth>
                }
              >
                <Route index element={<Navigate to="tara" replace />} />
                <Route path="tara" element={<TaraPage />} />
                <Route path="assessments" element={<AssessmentsPage />} />
                <Route path="assessments/:type" element={<AssessmentRunnerPage />} />
                <Route path="book" element={<BookSessionPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

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
                <Route path="actions" element={<ActionsPage />} />

                <Route path="data/heatmap" element={<CohortHeatmapPage />} />
                <Route path="data/explorer" element={<WellbeingExplorerPage />} />
                <Route path="data/drivers" element={<DriverAnalysisPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TooltipProvider>
        </EmployeeAuthProvider>
      </AuthProvider>
    </TenantProvider>
  );
}
