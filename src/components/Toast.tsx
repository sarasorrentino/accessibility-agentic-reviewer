import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastKind = 'success' | 'error';
type Toast = { message: string; kind: ToastKind };

const ToastContext = createContext<(t: Toast) => void>(() => {});
export const useToast = () => useContext(ToastContext);

/**
 * CONFORMING.
 * Both live regions are mounted permanently and empty when idle. Messages are
 * injected into them, never mounted alongside them.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback((t: Toast) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 5000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {toast?.kind === 'success' ? toast.message : ''}
      </div>

      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {toast?.kind === 'error' ? toast.message : ''}
      </div>

      {toast ? <div className="toast toast--visual">{toast.message}</div> : null}
    </ToastContext.Provider>
  );
}
