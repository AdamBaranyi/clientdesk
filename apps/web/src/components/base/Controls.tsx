import type { ReactNode, SelectHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { CONTROL_BASE, CONTROL_LABEL } from './control-style.ts';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Wird vorgelesen; das Feld hat aus Platzgründen keine sichtbare Beschriftung. */
  label: string;
}

export function SearchField({ value, onChange, placeholder, label }: SearchFieldProps) {
  return (
    <div className="flex min-h-11 flex-1 items-center gap-2.5 rounded-sm border border-line bg-surface px-3 focus-within:border-ink">
      <Search size={16} strokeWidth={1.8} className="shrink-0 text-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="text-body min-w-0 flex-1 bg-transparent text-ink"
      />
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label: string;
  /** Beschriftung nur für Screenreader, wenn der Platz sie nicht hergibt. */
  labelHidden?: boolean;
  children: ReactNode;
}

export function SelectField({
  id,
  label,
  labelHidden = false,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelHidden ? 'sr-only' : CONTROL_LABEL}>
        {label}
      </label>
      <select {...props} id={id} className={`min-h-11 ${CONTROL_BASE}`}>
        {children}
      </select>
    </div>
  );
}

interface FilterGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  active: T;
  onSelect: (value: T) => void;
}

/**
 * Ein Filter trägt Tinte, keine Datenfarbe. Kobalt bliebe sonst nicht das,
 * was es ist — die Farbe der Daten und des aktuellen Ortes.
 */
export function FilterGroup<T extends string>({
  label,
  options,
  active,
  onSelect,
}: FilterGroupProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          aria-pressed={active === option.value}
          className={[
            'text-body min-h-11 rounded-sm border px-3 font-medium',
            'transition-colors ease-state duration-[var(--dur-snap)]',
            active === option.value
              ? 'border-ink bg-raised text-ink'
              : 'border-line text-muted hover:text-ink',
          ].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
