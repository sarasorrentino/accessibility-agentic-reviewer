import { useState } from 'react';

type Option = { value: string; label: string };

type DropdownLegacyProps = {
  options: Option[];
  onChange: (value: string) => void;
};

/**
 * VIOLATING.
 * Adopts role="listbox" without implementing any of the keyboard interaction
 * the pattern promises, and a positive tabIndex breaks the page focus order.
 */
export function DropdownLegacy({ options, onChange }: DropdownLegacyProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dropdown">
      <div className="dropdown__trigger" tabIndex={1} onClick={() => setIsOpen(!isOpen)}>
        Select an option
      </div>

      {isOpen && (
        <ul role="listbox">
          {options.map((option) => (
            <li key={option.value} role="option" onClick={() => onChange(option.value)}>
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
