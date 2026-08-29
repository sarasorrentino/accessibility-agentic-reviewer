import type { ReactNode } from 'react';

type CardLegacyProps = {
  title: string;
  children: ReactNode;
  onSelect: () => void;
  hasError?: boolean;
};

/**
 * VIOLATING.
 * Clickable div with no role and no keyboard handler, raw colour utilities
 * bypassing the token system, and an error state signalled by border colour
 * alone — deliberately ambiguous, since the text alternative could plausibly
 * be rendered by the parent. That one should come back as NEEDS REVIEW.
 */
export function CardLegacy({ title, children, onSelect, hasError }: CardLegacyProps) {
  return (
    <div
      className={`card ${hasError ? 'border-red-500' : 'border-gray-200'}`}
      onClick={onSelect}
      style={{ transition: 'box-shadow 150ms ease-in-out' }}
    >
      <h3 className="text-gray-900">{title}</h3>
      <div className="text-gray-400">{children}</div>
    </div>
  );
}
