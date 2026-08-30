import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

/**
 * Stage 1 of the accessibility review pipeline: mechanically decidable rules.
 *
 * Deliberately narrow — this config carries accessibility rules only. Code
 * style, imports and TypeScript correctness belong elsewhere; mixing them in
 * would mean an a11y check that fails for reasons unrelated to accessibility,
 * which is exactly what makes teams stop reading a check.
 */
export default [
  {
    ignores: ['dist/**', 'storybook-static/**', 'node_modules/**', '.storybook/**'],
  },
  {
    files: ['src/**/*.{jsx,tsx}'],
    languageOptions: {
      // The default parser cannot read TypeScript. Type information is not
      // needed for these rules, so the plain parser (no `project`) is enough
      // and keeps the run fast.
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser },
    },
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      // The plugin's recommended set, which maps to mechanically decidable
      // WCAG failures: missing alt text, invalid ARIA attributes, roles that
      // do not exist, labels not associated with a control.
      ...jsxA11y.flatConfigs.recommended.rules,

      // Escalated to error: these three are the anti-patterns the fixture and
      // the checklist treat as blocking, and a warning would let them merge.
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },
  {
    // Stories render violating components on purpose. Linting them would
    // report the fixture's own deliberate defects as project errors.
    files: ['src/**/*.stories.tsx', 'src/demo/**'],
    rules: Object.fromEntries(
      Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, 'off'])
    ),
  },
];
