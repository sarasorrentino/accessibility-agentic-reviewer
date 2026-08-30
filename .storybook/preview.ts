import type { Preview } from '@storybook/react-vite';

// The same tokens and component styles the app uses — stories must render
// against the real design system, not an approximation of it.
import '../src/styles/tokens.css';
import '../src/styles/components.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: {
      // Report violations, don't fail the story render. The *Legacy stories
      // are supposed to be violating — a failing render would make them
      // impossible to display and inspect, which is their whole purpose.
      test: 'todo',
    },
    docs: { toc: true },
  },
};

export default preview;
