import { Navigate, Route, Routes, useParams } from 'react-router';
import type { SessionUser } from '@clientdesk/contracts';
import { AppShell } from './components/AppShell.tsx';
import { JoinPage } from './features/auth/JoinPage.tsx';
import { ContractDetailPage } from './features/contracts/ContractDetailPage.tsx';
import { ContractListPage } from './features/contracts/ContractListPage.tsx';
import { CustomerDetailPage } from './features/customers/CustomerDetailPage.tsx';
import { CustomerListPage } from './features/customers/CustomerListPage.tsx';
import { DashboardPage } from './features/dashboard/DashboardPage.tsx';
import { ProjectDetailPage } from './features/projects/ProjectDetailPage.tsx';
import { DocumentListPage } from './features/documents/DocumentListPage.tsx';
import { PortalShell } from './features/portal/PortalShell.tsx';
import {
  PortalContractsPage,
  PortalDocumentsPage,
  PortalOverviewPage,
  PortalProjectsPage,
} from './features/portal/PortalPages.tsx';
import { PortalRequestDetailPage } from './features/portal/PortalRequestDetailPage.tsx';
import { PortalRequestsPage } from './features/portal/PortalRequestsPage.tsx';
import { ProjectListPage } from './features/projects/ProjectListPage.tsx';
import { RequestDetailPage } from './features/requests/RequestDetailPage.tsx';
import { RequestListPage } from './features/requests/RequestListPage.tsx';
import { SettingsPage } from './features/settings/SettingsPage.tsx';
import { LoginPage } from './features/auth/LoginPage.tsx';
import { useSession } from './features/auth/use-session.ts';
import { workspacePath } from './lib/paths.ts';
import { portalPath } from './lib/portal-paths.ts';

export function App() {
  const session = useSession();

  if (session.isPending) return <FullPageMessage title="Wird geladen …" />;

  if (session.isError) {
    return (
      <FullPageMessage
        title="Server nicht erreichbar"
        detail="Die Anwendung konnte den Anmeldestatus nicht laden. Bitte Seite neu laden."
      />
    );
  }

  const user = session.data;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join/:token" element={<JoinPage />} />
      <Route
        path="/app/:workspaceId/*"
        element={user ? <WorkspaceRoutes user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/portal/:workspaceId/*"
        element={user ? <PortalRoutes user={user} /> : <Navigate to="/login" replace />}
      />
      <Route path="/portal" element={<FirstWorkspaceRedirect user={user} />} />
      <Route path="/app" element={<FirstWorkspaceRedirect user={user} />} />
      <Route path="*" element={<Navigate to={user ? '/app' : '/login'} replace />} />
    </Routes>
  );
}

/**
 * Die workspaceId aus der URL ist nur eine Auswahl. Gehört sie nicht zu den
 * Mitgliedschaften des Kontos, wird umgeleitet — die Berechtigung selbst prüft
 * ohnehin der Server bei jedem Request.
 */
function WorkspaceRoutes({ user }: { user: SessionUser }) {
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

/**
 * Die Rolle entscheidet über das Ziel: ein Kundenzugang gehört ins Portal,
 * nicht in die Teamansicht. Der Server würde die Teamansicht ohnehin
 * verweigern — hier wird nur nicht erst hingeschickt.
 */
function PortalRoutes({ user }: { user: SessionUser }) {
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
        <Route path="*" element={<Navigate to={portalPath(workspace.id, 'overview')} replace />} />
      </Route>
    </Routes>
  );
}

function FirstWorkspaceRedirect({ user }: { user: SessionUser | null }) {
  if (!user) return <Navigate to="/login" replace />;

  const first = user.workspaces[0];
  if (!first) {
    return (
      <FullPageMessage
        title="Kein Workspace zugeordnet"
        detail="Dieses Konto gehört zu keinem Workspace. Ein Owner muss eine Mitgliedschaft vergeben."
      />
    );
  }
  // Kundenzugänge landen im Portal, interne Rollen in der Teamansicht.
  return first.role === 'client' ? (
    <Navigate to={portalPath(first.id, 'overview')} replace />
  ) : (
    <Navigate to={workspacePath(first.id, 'dashboard')} replace />
  );
}

function FullPageMessage({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-[46ch] text-center">
        <p className="font-medium">{title}</p>
        {detail && <p className="mt-2 text-sm text-muted">{detail}</p>}
      </div>
    </div>
  );
}
