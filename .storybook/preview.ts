import type { Preview } from '@storybook/react-vite';

// The same tokens and component styles the app uses — stories must render
// against the real design system, not an approximation of it.
import '../src/styles/tokens.css';
import '../src/styles/components.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: {
      /*
       * 'error' by default, so an axe violation in a conforming component
       * fails rather than being quietly listed. The *Legacy stories opt out
       * individually with test: 'todo' — they violate on purpose, and a
       * failing render would make the defect impossible to inspect.
       *
       * 'off'   — do not run axe at all
       * 'todo'  — run and report in the panel, never fail
       * 'error' — run and fail the story / test run
       */
      test: 'error',
      options: {
        // Scope to what this project actually claims: WCAG 2.1/2.2 Level AA.
        // Without this, axe also reports best-practice rules that are not
        // part of the conformance target, which makes a failing run
        // ambiguous about whether conformance was actually broken.
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
        },
      },
    },
    docs: { toc: true },
  },
};

export default preview;
