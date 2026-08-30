import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from './Card';
import { CardLegacy } from './CardLegacy';

const meta = {
  title: 'Design System/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          'Renders as a plain container when static, and as a native `<button>` when `onSelect` is ' +
          'supplied — so a selectable card is keyboard-operable and correctly announced without any ' +
          'ARIA at the call site.',
      },
    },
  },
  args: { title: 'Batch 1042', children: <p>Received 08:15 · temperature within range</p> },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {};

export const Selectable: Story = {
  args: { onSelect: () => alert('Selected') },
  parameters: {
    docs: {
      description: {
        story:
          'Tab to it and press Enter or Space — both work, for free, because it is a real button.\n\n' +
          '**Known trade-off:** wrapping the whole card in a `<button>` makes the `<h3>` presentational ' +
          "under ARIA's children rule, so the title is lost to heading navigation and the accessible " +
          'name becomes the concatenated card content. Found during evaluation; see `EVAL-RUN-1.md` §4.',
      },
    },
  },
};

export const WithError: Story = {
  args: { error: 'Temperature out of range' },
  parameters: {
    docs: {
      description: {
        story: 'Colour is paired with an icon and a text message, so it is never the only channel (WCAG 1.4.1 A).',
      },
    },
  },
};

export const Violating_Legacy: StoryObj = {
  name: '❌ Legacy (violating)',
  render: () => (
    <CardLegacy title="Batch 1042" onSelect={() => alert('Selected')}>
      Received 08:15 · temperature within range
    </CardLegacy>
  ),
  parameters: {
    // Violates on purpose — report in the panel, never fail.
    a11y: { test: 'todo' },
    docs: {
      description: {
        story:
          '**Try to reach it with Tab — you cannot.** A `<div>` with `onClick`, no `role`, no ' +
          '`tabIndex`, no `onKeyDown`: invisible to keyboard and screen-reader users (WCAG 2.1.1 A, ' +
          '4.1.2 A).\n\n' +
          'The body text uses `text-gray-400` — the value behind `color.text.disabled`, whose ' +
          'exemption covers **disabled components only**. Applied to live content it measures ' +
          '**2.54:1** against white, well under 4.5:1 (WCAG 1.4.3 AA). This ratio was measured in ' +
          'the browser only after the stylesheet existed; before that, the review agent correctly ' +
          'declined to call it a violation because the surface was unknowable from the source.',
      },
    },
  },
};
