import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dropdown } from './Dropdown';
import { DropdownLegacy } from './DropdownLegacy';

const OPTIONS = [
  { value: 'raw', label: 'Raw materials' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'cooling', label: 'Cooling (disabled)', disabled: true },
  { value: 'storage', label: 'Storage' },
];

const meta = {
  title: 'Design System/Dropdown',
  component: Dropdown,
  parameters: {
    docs: {
      description: {
        component:
          'Implements the ARIA listbox keymap: Arrow keys, Home/End, Enter/Space to select, Escape to ' +
          'dismiss and return focus to the trigger. Adopting `role="listbox"` is a promise about ' +
          'behaviour — this component keeps it.',
      },
    },
  },
  args: { label: 'Process stage', options: OPTIONS, value: null, onChange: () => {} },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: StoryObj = {
  render: function DefaultStory() {
    const [v, setV] = useState<string | null>(null);
    return <Dropdown label="Process stage" options={OPTIONS} value={v} onChange={setV} />;
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Known defect, found during evaluation.** `handleKeyDown` has no `isOpen` guard and calls ' +
          '`preventDefault()` on Enter/Space, which cancels the trigger button’s own activation — so ' +
          'the list cannot be opened from the keyboard, and the first Enter silently commits the first ' +
          'option. Real WCAG 2.1.1 (A) failure in code that was reviewed and believed correct; see ' +
          '`EVAL-RUN-1.md` §4. Left unfixed deliberately so the finding stays reproducible.',
      },
    },
  },
};

export const Violating_Legacy: StoryObj = {
  name: '❌ Legacy (violating)',
  render: () => <DropdownLegacy options={OPTIONS} onChange={() => {}} />,
  parameters: {
    docs: {
      description: {
        story:
          'Declares `role="listbox"` and `role="option"` while implementing **none** of the keyboard ' +
          'contract those roles promise (WCAG 2.1.1 A). A screen-reader user is told "listbox", presses ' +
          'Arrow Down, and nothing happens — worse than an unlabelled div, because the promise is false.\n\n' +
          '`tabIndex={1}` is a positive tabindex: it hoists this control ahead of everything else on ' +
          'the page, wherever it is mounted (WCAG 2.4.3 A).',
      },
    },
  },
};
