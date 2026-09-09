import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:opacity-90',
  secondary: 'border border-line bg-surface text-ink hover:border-faint',
  ghost: 'text-muted hover:text-ink',
  danger: 'border border-line bg-surface text-danger hover:border-danger',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

/** Mindesthöhe 44 Pixel, damit die Bedienung auch auf dem Telefon trägt. */
export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4',
        'text-sm font-medium transition-colors disabled:opacity-60',
        VARIANTS[variant],
        className,
      ].join(' ')}
    />
  );
}
