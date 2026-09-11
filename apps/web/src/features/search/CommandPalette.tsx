import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import type { SearchHit } from '@tallyroom/contracts';
import { Modal } from '../../components/base/Modal.tsx';
import { useMessages } from '../../i18n/messages.ts';
import { MIN_TERM_LENGTH, useSearch } from './api.ts';
import { searchMessages } from './messages.ts';
import { hitPath } from './paths.ts';

interface Props {
  workspaceId: string;
  onClose: () => void;
}

/**
 * Springt an eine Stelle, statt eine Liste zu filtern.
 *
 * Die Palette ist als Kombinationsfeld ausgezeichnet: das Eingabefeld behält
 * den Fokus, die Trefferliste wird über `aria-activedescendant` bedient. Den
 * Fokus in die Liste zu bewegen wäre einfacher zu schreiben und für
 * Screenreader schlechter — der eingegebene Text wäre dann nicht mehr das,
 * was vorgelesen wird.
 */
export function CommandPalette({ workspaceId, onClose }: Props) {
  const navigate = useNavigate();
  const m = useMessages(searchMessages);
  const [term, setTerm] = useState('');
  const [markiert, setMarkiert] = useState(0);
  const eingabe = useRef<HTMLInputElement>(null);

  const query = useSearch(workspaceId, term);
  const hits = useMemo(() => query.data?.hits ?? [], [query.data]);

  /*
   * Eine neue Trefferliste beginnt wieder oben, sonst zeigt die Markierung auf
   * einen Treffer, den es nicht mehr gibt.
   *
   * Das steht im Render und nicht in einem Effekt: ein Effekt würde eine
   * Runde mit falscher Markierung zeichnen und erst danach berichtigen. React
   * verwirft diesen Durchlauf und rechnet sofort neu.
   */
  const [letzteHits, setLetzteHits] = useState(hits);
  if (letzteHits !== hits) {
    setLetzteHits(hits);
    setMarkiert(0);
  }

  // Die Palette wird beim Öffnen eingehängt, deshalb genügt einmal beim Start.
  useEffect(() => eingabe.current?.focus(), []);

  function springe(hit: SearchHit | undefined) {
    if (!hit) return;
    onClose();
    void navigate(hitPath(workspaceId, hit));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      springe(hits[markiert]);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    event.preventDefault();
    if (hits.length === 0) return;
    const richtung = event.key === 'ArrowDown' ? 1 : -1;
    // Umlaufend: von unten wieder nach oben, das erspart das Zurückhalten.
    setMarkiert((vorher) => (vorher + richtung + hits.length) % hits.length);
  }

  return (
    <Modal label={m.dialogLabel} onClose={onClose} align="top">
      <div className="flex w-full max-w-[560px] flex-col border border-line bg-surface">
        <input
          ref={eingabe}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={hits.length > 0}
          aria-controls="palette-treffer"
          aria-activedescendant={hits.length > 0 ? `palette-treffer-${markiert}` : undefined}
          aria-label={m.inputLabel}
          placeholder={m.placeholder}
          className="text-body min-h-12 border-b border-line bg-transparent px-4 text-ink"
        />

        <Ergebnisse
          hits={hits}
          markiert={markiert}
          term={term}
          laedt={query.isFetching}
          onSelect={springe}
          onHover={setMarkiert}
        />

        <p className="text-micro flex items-center gap-4 border-t border-line px-4 py-2 text-muted">
          <span>
            <Taste>↑</Taste> <Taste>↓</Taste> {m.keys.select}
          </span>
          <span>
            <Taste>↵</Taste> {m.keys.jump}
          </span>
          <span>
            <Taste>Esc</Taste> {m.keys.close}
          </span>
        </p>
      </div>
    </Modal>
  );
}

function Taste({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="border border-line px-1 py-0.5 font-mono text-ink not-italic">{children}</kbd>
  );
}

interface ErgebnisseProps {
  hits: SearchHit[];
  markiert: number;
  term: string;
  laedt: boolean;
  onSelect: (hit: SearchHit) => void;
  onHover: (index: number) => void;
}

function Ergebnisse({ hits, markiert, term, laedt, onSelect, onHover }: ErgebnisseProps) {
  const m = useMessages(searchMessages);
  const kurz = term.trim().length < MIN_TERM_LENGTH;

  if (kurz) {
    return <p className="text-dense px-4 py-6 text-muted">{m.tooShort(MIN_TERM_LENGTH)}</p>;
  }

  if (hits.length === 0) {
    return (
      <p className="text-dense px-4 py-6 text-muted" role="status">
        {laedt ? m.searching : m.noResults(term.trim())}
      </p>
    );
  }

  return (
    <ul
      id="palette-treffer"
      role="listbox"
      aria-label={m.resultsLabel}
      className="max-h-[50vh] overflow-y-auto"
    >
      {hits.map((hit, index) => (
        /*
         * Ein Eintrag in einer Auswahlliste bekommt keinen eigenen
         * Tastaturgriff. Beim Kombinationsfeld bleibt der Fokus im
         * Eingabefeld, und Pfeile und Enter werden dort behandelt — genau
         * darum geht es bei `aria-activedescendant`. Ein Griff hier bekäme nie
         * ein Tastenereignis zu sehen.
         */
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <li
          key={`${hit.kind}-${hit.id}`}
          id={`palette-treffer-${index}`}
          role="option"
          aria-selected={index === markiert}
          onMouseEnter={() => onHover(index)}
          onClick={() => onSelect(hit)}
          className={[
            'flex cursor-pointer items-baseline gap-3 border-b border-line-soft px-4 py-2.5 last:border-b-0',
            index === markiert ? 'bg-raised' : '',
          ].join(' ')}
        >
          <span className="font-condensed text-label w-16 shrink-0 tracking-[0.1em] text-muted uppercase">
            {m.kind[hit.kind]}
          </span>
          <span className="text-dense min-w-0 flex-1 truncate text-ink">{hit.title}</span>
          {hit.subtitle && (
            <span className="text-micro shrink-0 truncate text-muted">{hit.subtitle}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
