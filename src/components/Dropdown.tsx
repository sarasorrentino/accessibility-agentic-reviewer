import { useRef, useState } from 'react';
import { IconChevronDown } from './icons';

type Option = { value: string; label: string; disabled?: boolean };

type DropdownProps = {
  label: string;
  options: Option[];
  value: string | null;
  onChange: (value: string) => void;
};

/**
 * CONFORMING.
 * Implements the full listbox keymap: Arrow keys, Enter, Escape, Home/End.
 * Disabled options use the exempt token, which the agent should surface as
 * EXEMPT rather than as a contrast violation.
 */
export function Dropdown({ label, options, value, onChange }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectable = options.filter((o) => !o.disabled);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, selectable.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Home') setActiveIndex(0);
    if (e.key === 'End') setActiveIndex(selectable.length - 1);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(selectable[activeIndex].value);
      setIsOpen(false);
      buttonRef.current?.focus();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className="dropdown" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => setIsOpen((o) => !o)}
        style={{ minHeight: 'var(--space-touch-min)' }}
      >
        {options.find((o) => o.value === value)?.label ?? label}
        <IconChevronDown />
      </button>

      {isOpen && (
        <ul role="listbox" aria-label={label} tabIndex={-1}>
          {options.map((option, i) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
              className={i === activeIndex ? 'is-active' : undefined}
              style={option.disabled ? { color: 'var(--color-text-disabled)' } : undefined}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
