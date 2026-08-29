import type { ReactNode } from 'react';

type ButtonLegacyProps = {
  children: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

/**
 * VIOLATING.
 * Three defects: down-event as the primary handler, a hardcoded duration,
 * and a focus outline removed with no replacement.
 */
export function ButtonLegacy({ children, onPress, variant = 'primary' }: ButtonLegacyProps) {
  return (
    <button
      type="button"
      onPointerDown={onPress}
      className={`btn btn--${variant}`}
      style={{
        outline: 'none',
        transition: 'background-color 200ms ease-out',
      }}
    >
      {children}
    </button>
  );
}
