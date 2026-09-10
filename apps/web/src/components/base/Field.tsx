import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { CONTROL_BASE } from './control-style.ts';

interface Common {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

function Wrapper({ id, label, error, hint, children }: Common & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-dense font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-micro text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-fehler`} className="text-dense text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Common & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ id, label, error, hint, ...props }: TextFieldProps) {
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-fehler` : undefined}
        className={['min-h-11', CONTROL_BASE].join(' ')}
      />
    </Wrapper>
  );
}

type TextAreaProps = Common & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ id, label, error, hint, ...props }: TextAreaProps) {
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <textarea
        {...props}
        id={id}
        rows={props.rows ?? 3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-fehler` : undefined}
        className={['resize-y', CONTROL_BASE].join(' ')}
      />
    </Wrapper>
  );
}
