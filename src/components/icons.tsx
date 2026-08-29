/** Decorative icon primitives. Consumers supply the accessible name. */

export function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3 4h10v10H3z" fill="currentColor" />
    </svg>
  );
}

export function IconAlertCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" />
      <path d="M8 4v5M8 11v1" stroke="currentColor" />
    </svg>
  );
}

export function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" />
    </svg>
  );
}
