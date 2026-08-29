import type { ReactNode } from 'react';
import { IconAlertCircle } from './icons';

type CardProps = {
  title: string;
  children: ReactNode;
  onSelect?: () => void;
  error?: string;
};

/**
 * CONFORMING.
 * The whole card is a native button when selectable, and the error state
 * pairs colour with an icon and a text message.
 */
export function Card({ title, children, onSelect, error }: CardProps) {
  const content = (
    <>
      <h3>{title}</h3>
      {children}
      {error ? (
        <p className="card__error" style={{ color: 'var(--color-text-error)' }}>
          <IconAlertCircle />
          {error}
        </p>
      ) : null}
    </>
  );

  if (!onSelect) {
    return (
      <div
        className="card"
        style={{ borderColor: error ? 'var(--color-border-error)' : 'var(--color-border-input)' }}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className="card card--selectable"
      style={{
        borderColor: error ? 'var(--color-border-error)' : 'var(--color-border-input)',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {content}
    </button>
  );
}
