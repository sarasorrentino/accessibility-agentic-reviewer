import type { ReactNode } from 'react';

type IconButtonProps = {
  icon: ReactNode;
  /** Required. Describes the ACTION, not the icon. */
  ariaLabel: string;
  onClick: () => void;
};

/**
 * CONFORMING.
 * The icon is 16px but the hit area is min 44px via token — a false-positive
 * test for the small-touch-target pattern, which matches the icon dimension.
 */
export function IconButton({ icon, ariaLabel, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        minWidth: 'var(--space-touch-min)',
        minHeight: 'var(--space-touch-min)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span aria-hidden="true" style={{ width: 16, height: 16 }}>
        {icon}
      </span>
    </button>
  );
}
