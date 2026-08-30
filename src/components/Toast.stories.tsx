import { useState } from 'react';
import type { StoryObj } from '@storybook/react-vite';
import { ToastProvider, useToast } from './Toast';
import { ToastLegacy } from './ToastLegacy';
import { Button } from './Button';

export default {
  title: 'Design System/Toast',
  parameters: {
    docs: {
      description: {
        component:
          'Two live regions — `role="status"` for success, `role="alert"` for errors — mounted ' +
          'permanently and empty when idle. Messages are **injected into** them, never mounted ' +
          'alongside them, which is the only reliable way to get an announcement (WCAG 4.1.3 AA).',
      },
    },
  },
};

function Trigger() {
  const showToast = useToast();
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Button onClick={() => showToast({ message: 'Record saved', kind: 'success' })}>
        Success (polite)
      </Button>
      <Button
        variant="secondary"
        onClick={() => showToast({ message: 'Save failed — check the connection', kind: 'error' })}
      >
        Error (assertive)
      </Button>
    </div>
  );
}

export const Default: StoryObj = {
  render: () => (
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'With a screen reader running, trigger each. Success is announced politely (waits for a ' +
          'pause); the error is announced assertively (interrupts). The visual toast is separate from ' +
          'the announcement.\n\n' +
          '**Known issue from evaluation:** the 5000ms auto-dismiss has no pause, extend or dismiss ' +
          'control, which one run flagged as WCAG 2.2.1 (A). Left as-is so the finding stays live.',
      },
    },
  },
};

export const Violating_Legacy: StoryObj = {
  name: '❌ Legacy (violating)',
  render: function LegacyStory() {
    const [msg, setMsg] = useState<string | null>(null);
    return (
      <>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            setMsg(null);
            setTimeout(() => setMsg('Record saved'), 10);
          }}
        >
          Save (may announce nothing)
        </button>
        <ToastLegacy message={msg} />
      </>
    );
  },
  parameters: {
    // Violates on purpose — report in the panel, never fail.
    a11y: { test: 'todo' },
    docs: {
      description: {
        story:
          '**The defect is inaudible, not invisible.** The toast appears on screen exactly as it ' +
          'should — so a sighted reviewer sees nothing wrong. But the `role="status"` element is ' +
          'mounted *together with* its text, and screen readers only announce mutations to a region ' +
          'that already existed in the accessibility tree. The message is usually dropped entirely ' +
          '(WCAG 4.1.3 AA).\n\n' +
          'This is the clearest example in the fixture of why visual review is insufficient, and why ' +
          'the pattern scanner checks whether the live region itself is inside a conditional.',
      },
    },
  },
};
