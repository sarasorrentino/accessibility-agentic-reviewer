type FormFieldLegacyProps = {
  error?: string;
  value: string;
  onChange: (value: string) => void;
};

/**
 * VIOLATING.
 * Placeholder is the only label, the error is not programmatically linked to
 * the field, and a personal-data field carries no autocomplete.
 */
export function FormFieldLegacy({ error, value, onChange }: FormFieldLegacyProps) {
  return (
    <div className="form-field">
      <input
        type="email"
        name="email"
        value={value}
        placeholder="Email"
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'border-red-500' : 'border-gray-300'}
      />
      {error && <span className="text-red-500">{error}</span>}
    </div>
  );
}
