type Item = { id: string; label: string };

type SortableListProps = {
  items: Item[];
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onReorder: (from: number, to: number) => void;
};

/**
 * CONFORMING.
 * Drag is available but is not the only path — every item exposes move
 * up/down buttons, the single-pointer alternative WCAG 2.5.1 requires.
 * Recorded in a11y-exceptions.json under criterion 2.5.1.
 */
export function SortableList({ items, onMoveUp, onMoveDown, onReorder }: SortableListProps) {
  return (
    <ul className="sortable-list">
      {items.map((item, index) => (
        // Drag is an enhancement, never the only path: the move up/down
        // buttons below satisfy WCAG 2.5.1. Recorded in a11y-exceptions.json
        // under SortableList / 2.5.1 — the rule has no knowledge of that file.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <li
          key={item.id}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
          onDrop={(e) => onReorder(Number(e.dataTransfer.getData('text/plain')), index)}
          onDragOver={(e) => e.preventDefault()}
        >
          <span>{item.label}</span>

          <button
            type="button"
            onClick={() => onMoveUp(item.id)}
            disabled={index === 0}
            aria-label={`Move ${item.label} up`}
            style={{ minWidth: 'var(--space-touch-min)', minHeight: 'var(--space-touch-min)' }}
          >
            ↑
          </button>

          <button
            type="button"
            onClick={() => onMoveDown(item.id)}
            disabled={index === items.length - 1}
            aria-label={`Move ${item.label} down`}
            style={{ minWidth: 'var(--space-touch-min)', minHeight: 'var(--space-touch-min)' }}
          >
            ↓
          </button>
        </li>
      ))}
    </ul>
  );
}
