import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-action text-action-fg hover:bg-action-hover',
  secondary: 'border border-line bg-surface text-ink hover:border-ink',
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
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4',
        'text-body font-medium disabled:opacity-60',
        'transition-colors ease-state duration-[var(--dur-snap)]',
        VARIANTS[variant],
        className,
      ].join(' ')}
    />
  );
}
