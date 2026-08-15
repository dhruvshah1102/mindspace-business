import { Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from '@/app/TenantContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AdminLayout } from '@/admin/AdminLayout';
import { OverviewPage } from '@/admin/pages/OverviewPage';
import { CohortHeatmapPage } from '@/admin/pages/CohortHeatmapPage';
import { WellbeingExplorerPage } from '@/admin/pages/WellbeingExplorerPage';
import { DriverAnalysisPage } from '@/admin/pages/DriverAnalysisPage';

export default function App() {
  return (
    <TenantProvider>
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="heatmap" element={<CohortHeatmapPage />} />
            <Route path="explorer" element={<WellbeingExplorerPage />} />
            <Route path="drivers" element={<DriverAnalysisPage />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </TenantProvider>
  );
}
