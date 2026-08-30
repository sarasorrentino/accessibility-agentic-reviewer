import { useRef, useState } from 'react';
import type { StoryObj } from '@storybook/react-vite';
import { Modal } from './Modal';
import { ModalLegacy } from './ModalLegacy';
import { Button } from './Button';

export default {
  title: 'Design System/Modal',
  parameters: {
    docs: {
      description: {
        component:
          'The focus trap is **intentional** — the ARIA dialog pattern requires it — and is paired ' +
          'with an Escape handler and focus restore to the trigger. Recorded in `a11y-exceptions.json` ' +
          'under criterion 2.1.2, so the review agent reports it as ⚪ exempt rather than a violation.',
      },
    },
  },
};

export const Default: StoryObj = {
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    return (
      <>
        <button ref={trigger} type="button" className="btn btn--primary" onClick={() => setOpen(true)}>
          Open dialog
        </button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Confirm deletion"
          triggerRef={trigger as React.RefObject<HTMLElement>}
        >
          <p>This action cannot be undone.</p>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
        </Modal>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Open it, press Tab a few times to confirm focus cycles inside, then press Escape — focus ' +
          'returns to the trigger button.\n\n' +
          '**Known defect, found during evaluation:** the focus-restore effect is not guarded against ' +
          'initial mount, so a page rendering a closed Modal moves focus to its trigger on load ' +
          '(`EVAL-RUN-1.md` §4). Left unfixed so the finding stays reproducible.',
      },
    },
  },
};

export const Violating_Legacy: StoryObj = {
  name: '❌ Legacy (violating)',
  render: function LegacyStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" className="btn btn--secondary" onClick={() => setOpen(true)}>
          Open dialog
        </button>
        <ModalLegacy isOpen={open} title="Confirm deletion">
          <p>This action cannot be undone.</p>
          <button type="button" className="btn btn--secondary" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </ModalLegacy>
      </>
    );
  },
  parameters: {
    // Violates on purpose — report in the panel, never fail.
    a11y: { test: 'todo' },
    docs: {
      description: {
        story:
          '⚠️ **This story traps your keyboard.** Once open, every Tab is forced back to the first ' +
          'control, there is no Escape handler, and no focus restore — the only way out is the mouse ' +
          'or reloading the frame. That is precisely WCAG 2.1.2 (A), and experiencing it is more ' +
          'convincing than reading about it.\n\n' +
          'It is also a bare `<div>`: no `role="dialog"`, no `aria-modal`, no accessible name (4.1.2 A). ' +
          'And `width: 800px` cannot reflow to 320px at 400% zoom (1.4.10 AA).\n\n' +
          'The `a11y-exceptions.json` entry for 2.1.2 keys to `Modal.tsx`, **not** this file — and its ' +
          'stated basis (Escape + focus restore implemented) is false here, so it does not transfer.',
      },
    },
  },
};
