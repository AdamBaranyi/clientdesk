import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Modal } from './Modal.tsx';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Der Dialog scrollt bei Bedarf innen; Titelzeile und Schliessen bleiben
 * sichtbar. Auf 320 Pixeln füllt er die Breite bis auf einen schmalen Rand.
 *
 * Fokusfalle, inerter Hintergrund und Fokusrückgabe kommen aus `Modal`.
 */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  if (!open) return null;

  return (
    <Modal label={title} onClose={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-[520px] flex-col border border-line bg-surface">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="text-dense font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 shrink-0 items-center justify-center rounded-sm text-muted hover:text-ink"
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
            <span className="sr-only">Schliessen</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
      </div>
    </Modal>
  );
}
