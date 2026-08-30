import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { ButtonLegacy } from './ButtonLegacy';

const meta = {
  title: 'Design System/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Native `<button>` with `onClick` as the primary handler, motion via `duration.interaction`, ' +
          'and focus styling inherited from the global `:focus-visible` rule.',
      },
    },
  },
  args: { children: 'Confirm', onClick: () => {} },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Disabled: Story = {
  args: { disabled: true },
  parameters: {
    docs: {
      description: {
        story:
          'Uses `color.text.disabled` / `color.border.disabled`, which carry `$a11y.exempt: true`. ' +
          'WCAG 1.4.11 explicitly exempts disabled components, so the low ratio here is intentional ' +
          'and documented — not a defect.',
      },
    },
  },
};

/**
 * The violating counterpart. Kept as a story so the defect is inspectable
 * rather than described: open the a11y panel, then try the keyboard.
 */
export const Violating_Legacy: StoryObj = {
  name: '❌ Legacy (violating)',
  render: () => <ButtonLegacy onPress={() => alert('Activated')}>Confirm</ButtonLegacy>,
  parameters: {
    docs: {
      description: {
        story:
          '**Three defects.** `onPointerDown` is the only handler, so the button is inoperable by ' +
          'keyboard and assistive technology (WCAG 2.1.1 A) and cannot be aborted by dragging off ' +
          '(2.5.2 A). Inline `outline: none` removes the focus indicator with no replacement (2.4.7 AA). ' +
          'The hardcoded `200ms` transition bypasses the `prefers-reduced-motion` override (2.3.3 AAA).\n\n' +
          '**Note:** axe-core will likely report *nothing* here. All three defects are invisible to ' +
          'static DOM analysis — this is exactly the gap the AI review stage exists to cover.',
      },
    },
  },
};
