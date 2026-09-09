import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

const CONTROL =
  'w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-base text-ink outline-none focus-visible:border-accent';

interface Common {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

function Wrapper({ id, label, error, hint, children }: Common & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-faint">{hint}</p>}
      {error && (
        <p id={`${id}-fehler`} className="text-sm text-danger">
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
        className={['min-h-11', CONTROL].join(' ')}
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
        className={['resize-y', CONTROL].join(' ')}
      />
    </Wrapper>
  );
}
