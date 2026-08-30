import { useState } from 'react';
import type { StoryObj } from '@storybook/react-vite';
import { SortableList } from './SortableList';
import { SortableListLegacy } from './SortableListLegacy';

const INITIAL = [
  { id: '1', label: 'Receiving' },
  { id: '2', label: 'Storage' },
  { id: '3', label: 'Preparation' },
];

function useItems() {
  const [items, setItems] = useState(INITIAL);
  const move = (id: string, dir: -1 | 1) =>
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const reorder = (from: number, to: number) =>
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  return { items, move, reorder };
}

export default {
  title: 'Design System/SortableList',
  parameters: {
    docs: {
      description: {
        component:
          'Drag is available but never the **only** path — each row exposes move up/down buttons, the ' +
          'single-pointer alternative WCAG 2.5.1 (A) requires. Recorded in `a11y-exceptions.json` ' +
          'under 2.5.1, so the drag handlers are reported ⚪ exempt rather than as a violation.',
      },
    },
  },
};

export const Default: StoryObj = {
  render: function DefaultStory() {
    const { items, move, reorder } = useItems();
    return (
      <SortableList
        items={items}
        onMoveUp={(id) => move(id, -1)}
        onMoveDown={(id) => move(id, 1)}
        onReorder={reorder}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Reorder it using only the keyboard — Tab to a move button and press Enter.\n\n' +
          '**Audit note:** the recorded exception says the alternative is "move buttons **and ' +
          'arrow-key handling**". There is no arrow-key handling in this component; only the buttons ' +
          'satisfy 2.5.1. The review agent caught that the approved rationale is broader than the code ' +
          'it approves (`EVAL-RUN-1.md` §6) — which is the exemption mechanism working as intended.',
      },
    },
  },
};

export const Violating_Legacy: StoryObj = {
  name: '❌ Legacy (violating)',
  render: function LegacyStory() {
    const { items, reorder } = useItems();
    return <SortableListLegacy items={items} onReorder={reorder} />;
  },
  parameters: {
    // Violates on purpose — report in the panel, never fail.
    a11y: { test: 'todo' },
    docs: {
      description: {
        story:
          '**Try to reorder these with the keyboard.** You cannot — reordering is drag-only, and no ' +
          'row is even focusable (WCAG 2.5.1 A, 2.1.1 A). Keyboard, switch-control, head-pointer and ' +
          'eye-tracker users lose the feature entirely, not merely find it awkward.\n\n' +
          'The 16×16 drag handle is also below the 24px minimum (2.5.8 AA) — though whether the handle ' +
          'or the whole row is the target is a judgment the review agent correctly declined to make ' +
          'from source alone.',
      },
    },
  },
};
