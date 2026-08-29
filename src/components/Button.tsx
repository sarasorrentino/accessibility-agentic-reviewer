import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

/**
 * CONFORMING.
 * Native <button>, onClick as the primary handler, motion via token,
 * focus styling inherited from the global :focus-visible rule.
 */
export function Button({ children, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn btn--${variant}`}
      style={{
        minHeight: 'var(--space-touch-min)',
        transition: 'background-color var(--duration-interaction) var(--easing-default)',
      }}
    >
      {children}
    </button>
  );
}
