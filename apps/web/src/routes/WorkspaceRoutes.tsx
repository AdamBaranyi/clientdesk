import { Navigate, Route, Routes, useParams } from 'react-router';
import type { SessionUser } from '@tallyroom/contracts';
import { AppShell } from '../components/AppShell.tsx';
import { ContractDetailPage } from '../features/contracts/ContractDetailPage.tsx';
import { ContractListPage } from '../features/contracts/ContractListPage.tsx';
import { CustomerDetailPage } from '../features/customers/CustomerDetailPage.tsx';
import { CustomerListPage } from '../features/customers/CustomerListPage.tsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.tsx';
import { DocumentListPage } from '../features/documents/DocumentListPage.tsx';
import { ProjectDetailPage } from '../features/projects/ProjectDetailPage.tsx';
import { ProjectListPage } from '../features/projects/ProjectListPage.tsx';
import { RequestDetailPage } from '../features/requests/RequestDetailPage.tsx';
import { RequestListPage } from '../features/requests/RequestListPage.tsx';
import { SettingsPage } from '../features/settings/SettingsPage.tsx';
import { workspacePath } from '../lib/paths.ts';

/**
 * Die workspaceId aus der URL ist nur eine Auswahl. Gehört sie nicht zu den
 * Mitgliedschaften des Kontos, wird umgeleitet — die Berechtigung selbst prüft
 * ohnehin der Server bei jedem Request.
 */
export function WorkspaceRoutes({ user }: { user: SessionUser }) {
  const { workspaceId } = useParams();
  const workspace = user.workspaces.find((entry) => entry.id === workspaceId);

  if (!workspace) return <Navigate to="/app" replace />;

  return (
    <Routes>
      <Route element={<AppShell user={user} workspace={workspace} />}>
        <Route path="dashboard" element={<DashboardPage workspace={workspace} />} />
        <Route path="customers" element={<CustomerListPage workspace={workspace} />} />
        <Route
          path="customers/:customerId"
          element={<CustomerDetailPage workspace={workspace} />}
        />
        <Route path="projects" element={<ProjectListPage workspace={workspace} />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage workspace={workspace} />} />
        <Route path="contracts" element={<ContractListPage workspace={workspace} />} />
        <Route
          path="contracts/:contractId"
          element={<ContractDetailPage workspace={workspace} />}
        />
        <Route path="requests" element={<RequestListPage workspace={workspace} />} />
        <Route path="requests/:requestId" element={<RequestDetailPage workspace={workspace} />} />
        <Route path="documents" element={<DocumentListPage workspace={workspace} />} />
        <Route path="settings" element={<SettingsPage workspace={workspace} />} />
        <Route
          path="*"
          element={<Navigate to={workspacePath(workspace.id, 'dashboard')} replace />}
        />
      </Route>
    </Routes>
  );
}
