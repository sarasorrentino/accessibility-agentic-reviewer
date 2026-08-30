import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';
import { IconButtonLegacy } from './IconButtonLegacy';
import { IconTrash } from './icons';

const meta = {
  title: 'Design System/IconButton',
  component: IconButton,
  parameters: {
    docs: {
      description: {
        component:
          'Icon-only control. `ariaLabel` is a **required** prop, so TypeScript rejects an unlabelled ' +
          'usage at compile time — the accessible name cannot be forgotten. The icon is 16px but the ' +
          'hit area is `space.touch.min` (44px).',
      },
    },
  },
  args: { icon: <IconTrash />, ariaLabel: 'Delete record', onClick: () => {} },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NameDescribesAction: Story = {
  args: { ariaLabel: 'Delete batch 1042' },
  parameters: {
    docs: {
      description: {
        story:
          'The name describes the **action and its object**, not the glyph. "Delete batch 1042" is ' +
          'useful to a voice-control user; "Trash icon" is not.',
      },
    },
  },
};

export const Violating_Legacy: StoryObj = {
  name: '❌ Legacy (violating)',
  render: () => <IconButtonLegacy onClick={() => alert('Deleted')} />,
  parameters: {
    // Violates on purpose — report in the panel, never fail.
    a11y: { test: 'todo' },
    docs: {
      description: {
        story:
          '**Two defects, both detectable.** No accessible name — the button has no text and its only ' +
          'child is `aria-hidden` (WCAG 4.1.2 A). And `width: 16, height: 16, padding: 0` gives a ' +
          '16×16 target, below the 24px legal minimum and far below the 44px token (WCAG 2.5.8 AA).\n\n' +
          'Unlike the Button case, **axe-core should flag the missing name here** — it is mechanically ' +
          'decidable from the DOM. Compare the a11y panel between this story and the conforming ones.',
      },
    },
  },
};
