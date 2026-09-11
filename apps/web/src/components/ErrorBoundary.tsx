import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useMessages } from '../i18n/messages.ts';
import { Button } from './base/Button.tsx';
import { shellMessages } from './messages.ts';

interface State {
  failed: boolean;
}

/**
 * Fängt Fehler beim Zeichnen ab. Ohne sie bliebe die Seite weiss, und niemand
 * wüsste, ob warten oder neu laden hilft. React kennt Fehlergrenzen bis heute
 * nur als Klasse.
 *
 * Der Fehler selbst geht in die Konsole und sonst nirgendwohin: es gibt
 * bewusst keinen Fehlerdienst eines Dritten, siehe Datenschutzerklärung.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Darstellungsfehler', error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.failed ? <CrashNotice /> : this.props.children;
  }
}

function CrashNotice() {
  const m = useMessages(shellMessages).crash;

  return (
    <div role="alert" className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex max-w-[46ch] flex-col items-start gap-3">
        <p className="text-section font-semibold">{m.title}</p>
        <p className="text-body text-muted">{m.detail}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          {m.reload}
        </Button>
      </div>
    </div>
  );
}
