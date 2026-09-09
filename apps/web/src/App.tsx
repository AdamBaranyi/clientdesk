import { Navigate, Route, Routes, useParams } from 'react-router';
import type { SessionUser } from '@clientdesk/contracts';
import { AppShell } from './components/AppShell.tsx';
import { CustomerDetailPage } from './features/customers/CustomerDetailPage.tsx';
import { CustomerListPage } from './features/customers/CustomerListPage.tsx';
import { DashboardPage } from './features/dashboard/DashboardPage.tsx';
import { ProjectDetailPage } from './features/projects/ProjectDetailPage.tsx';
import { ProjectListPage } from './features/projects/ProjectListPage.tsx';
import { LoginPage } from './features/auth/LoginPage.tsx';
import { useSession } from './features/auth/use-session.ts';
import { workspacePath } from './lib/paths.ts';

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
      <Route
        path="/app/:workspaceId/*"
        element={user ? <WorkspaceRoutes user={user} /> : <Navigate to="/login" replace />}
      />
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
        <Route
          path="*"
          element={<Navigate to={workspacePath(workspace.id, 'dashboard')} replace />}
        />
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
  return <Navigate to={`/app/${first.id}/dashboard`} replace />;
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
