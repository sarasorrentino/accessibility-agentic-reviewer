import { useEffect, useRef, type ReactNode } from 'react';

type ModalLegacyProps = {
  isOpen: boolean;
  title: string;
  children: ReactNode;
};

/**
 * VIOLATING.
 * The focus trap has no exit: no Escape handler and no focus restore. The
 * fixed 800px width also forces bidirectional scrolling at 400% zoom.
 */
export function ModalLegacy({ isOpen, title, children }: ModalLegacyProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button, input');
        if (!focusables?.length) return;
        e.preventDefault();
        focusables[0].focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal__overlay">
      <div ref={dialogRef} style={{ width: '800px' }}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
