import { useEffect, useState } from 'react';

type ToastLegacyProps = {
  message: string | null;
};

/**
 * VIOLATING.
 * The live region is mounted together with its message, so screen readers
 * frequently miss the announcement entirely.
 */
export function ToastLegacy({ message }: ToastLegacyProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const t = window.setTimeout(() => setVisible(false), 5000);
      return () => window.clearTimeout(t);
    }
  }, [message]);

  return (
    <div className="toast-wrapper">
      {visible && message && (
        <div role="status" aria-live="polite" className="toast">
          {message}
        </div>
      )}
    </div>
  );
}
