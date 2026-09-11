import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import type { SessionUser } from '@tallyroom/contracts';
import { JoinPage } from './features/auth/JoinPage.tsx';
import { LandingPage } from './features/landing/LandingPage.tsx';
import { LoginPage } from './features/auth/LoginPage.tsx';
import { useSession } from './features/auth/use-session.ts';
import { shellMessages } from './components/messages.ts';
import { useMessages } from './i18n/messages.ts';
import { workspacePath } from './lib/paths.ts';
import { portalPath } from './lib/portal-paths.ts';

/*
 * Wer die Startseite öffnet, braucht weder die Teamansicht noch das Portal
 * noch die Rechtstexte in vier Sprachen. Diese Bereiche kommen erst, wenn
 * sie aufgerufen werden. Vorher lud jeder Besucher die ganze Anwendung,
 * und mit Französisch und Italienisch lag die Erstlast über ihrem Budget.
 */
const WorkspaceRoutes = lazy(() =>
  import('./routes/WorkspaceRoutes.tsx').then((modul) => ({ default: modul.WorkspaceRoutes })),
);
const PortalRoutes = lazy(() =>
  import('./routes/PortalRoutes.tsx').then((modul) => ({ default: modul.PortalRoutes })),
);
const ImprintPage = lazy(() =>
  import('./features/legal/ImprintPage.tsx').then((modul) => ({ default: modul.ImprintPage })),
);
const PrivacyPage = lazy(() =>
  import('./features/legal/PrivacyPage.tsx').then((modul) => ({ default: modul.PrivacyPage })),
);

export function App() {
  const session = useSession();
  const m = useMessages(shellMessages);

  if (session.isPending) return <FullPageMessage title={m.loading} />;

  if (session.isError) {
    return (
      <FullPageMessage title={m.serverUnreachable.title} detail={m.serverUnreachable.detail} />
    );
  }

  const user = session.data;

  return (
    <Suspense fallback={<FullPageMessage title={m.loading} />}>
      <Routes>
        <Route path="/" element={user ? <FirstWorkspaceRedirect user={user} /> : <LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/join/:token" element={<JoinPage />} />
        <Route path="/impressum" element={<ImprintPage />} />
        <Route path="/datenschutz" element={<PrivacyPage />} />
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
        <Route path="*" element={<Navigate to={user ? '/app' : '/'} replace />} />
      </Routes>
    </Suspense>
  );
}

function FirstWorkspaceRedirect({ user }: { user: SessionUser | null }) {
  const m = useMessages(shellMessages);

  if (!user) return <Navigate to="/login" replace />;

  const first = user.workspaces[0];
  if (!first) {
    return <FullPageMessage title={m.noWorkspace.title} detail={m.noWorkspace.detail} />;
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
        {detail && <p className="mt-2 text-body text-muted">{detail}</p>}
      </div>
    </div>
  );
}
