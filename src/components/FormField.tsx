import { useId } from 'react';
import { IconAlertCircle } from './icons';

type FormFieldProps = {
  label: string;
  type?: 'text' | 'email' | 'tel';
  name: string;
  autoComplete?: string;
  placeholder?: string;
  /** Hides the label visually but keeps it in the accessibility tree. */
  hideLabel?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
};

/**
 * CONFORMING.
 * The sr-only label plus a placeholder is a false-positive test for the
 * placeholder-as-label pattern: a visually hidden label is still a real label.
 */
export function FormField({
  label,
  type = 'text',
  name,
  autoComplete,
  placeholder,
  hideLabel,
  error,
  value,
  onChange,
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="form-field">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'form-field__label'}>
        {label}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
        style={{ borderColor: error ? 'var(--color-border-error)' : 'var(--color-border-input)' }}
      />

      <span id={errorId} role="alert" className="form-field__error">
        {error ? (
          <>
            <IconAlertCircle />
            {error}
          </>
        ) : null}
      </span>
    </div>
  );
}
