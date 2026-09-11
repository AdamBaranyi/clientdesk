import { Navigate, Route, Routes, useParams } from 'react-router';
import type { SessionUser } from '@tallyroom/contracts';
import { PortalAccountPage } from '../features/portal/PortalAccountPage.tsx';
import {
  PortalContractsPage,
  PortalDocumentsPage,
  PortalOverviewPage,
  PortalProjectsPage,
} from '../features/portal/PortalPages.tsx';
import { PortalRequestDetailPage } from '../features/portal/PortalRequestDetailPage.tsx';
import { PortalRequestsPage } from '../features/portal/PortalRequestsPage.tsx';
import { PortalShell } from '../features/portal/PortalShell.tsx';
import { workspacePath } from '../lib/paths.ts';
import { portalPath } from '../lib/portal-paths.ts';

/**
 * Die Rolle entscheidet über das Ziel: ein Kundenzugang gehört ins Portal,
 * nicht in die Teamansicht. Der Server würde die Teamansicht ohnehin
 * verweigern — hier wird nur nicht erst hingeschickt.
 */
export function PortalRoutes({ user }: { user: SessionUser }) {
  const { workspaceId } = useParams();
  const workspace = user.workspaces.find((entry) => entry.id === workspaceId);

  if (!workspace) return <Navigate to="/portal" replace />;
  if (workspace.role !== 'client') {
    return <Navigate to={workspacePath(workspace.id, 'dashboard')} replace />;
  }

  return (
    <Routes>
      <Route element={<PortalShell user={user} workspace={workspace} />}>
        <Route path="overview" element={<PortalOverviewPage workspace={workspace} />} />
        <Route path="projects" element={<PortalProjectsPage workspace={workspace} />} />
        <Route path="contracts" element={<PortalContractsPage workspace={workspace} />} />
        <Route path="requests" element={<PortalRequestsPage workspace={workspace} />} />
        <Route
          path="requests/:requestId"
          element={<PortalRequestDetailPage workspace={workspace} />}
        />
        <Route path="documents" element={<PortalDocumentsPage workspace={workspace} />} />
        <Route path="account" element={<PortalAccountPage workspace={workspace} />} />
        <Route path="*" element={<Navigate to={portalPath(workspace.id, 'overview')} replace />} />
      </Route>
    </Routes>
  );
}
