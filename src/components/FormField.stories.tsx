import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormField } from './FormField';
import { FormFieldLegacy } from './FormFieldLegacy';

const meta = {
  title: 'Design System/FormField',
  component: FormField,
  parameters: {
    docs: {
      description: {
        component:
          'Generates the label/input association from a `useId()`, wires `aria-invalid` and ' +
          '`aria-describedby` automatically, and keeps the error live region mounted at all times. ' +
          'Consumers cannot forget any of it — which is the point of putting it in the design system.',
      },
    },
  },
  args: { label: 'Email', name: 'email', type: 'email', value: '', onChange: () => {} },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { autoComplete: 'email', placeholder: 'name@example.com' },
};

export const WithError: Story = {
  args: { value: 'not-an-email', error: 'Enter a valid email address', autoComplete: 'email' },
  parameters: {
    docs: {
      description: {
        story:
          'The error is announced through a persistently-mounted `role="alert"` region, linked to the ' +
          'input via `aria-describedby`, and paired with an icon so colour is never the only channel ' +
          '(WCAG 1.4.1 A, 3.3.1 A).',
      },
    },
  },
};

export const HiddenLabel: Story = {
  args: { hideLabel: true, placeholder: 'Search records', label: 'Search records' },
  parameters: {
    docs: {
      description: {
        story:
          'A visually hidden label is still a **real** label — it stays in the accessibility tree. ' +
          'This is the correct way to omit a label visually, and is why a pattern scanner flagging ' +
          '"placeholder present" must be adjudicated rather than trusted.',
      },
    },
  },
};

/** Interactive so the disappearing-placeholder defect is reproducible by typing. */
export const Violating_Legacy: StoryObj = {
  name: '❌ Legacy (violating)',
  render: function LegacyStory() {
    const [v, setV] = useState('');
    return (
      <FormFieldLegacy
        value={v}
        onChange={setV}
        error={v && !v.includes('@') ? 'Enter a valid email address' : undefined}
      />
    );
  },
  parameters: {
    // Violates on purpose — report in the panel, never fail.
    a11y: { test: 'todo' },
    docs: {
      description: {
        story:
          '**Type into it, then look away and back.** The placeholder was the only label, and it is ' +
          'gone the moment you type (WCAG 3.3.2 A). The error is not linked to the field — no ' +
          '`aria-invalid`, no `aria-describedby` (3.3.1 A). No `autoComplete` on a personal-data ' +
          'field (1.3.5 AA). Colours bypass the token system entirely (1.4.3 AA).',
      },
    },
  },
};
