type Item = { id: string; label: string };

type SortableListLegacyProps = {
  items: Item[];
  onReorder: (from: number, to: number) => void;
};

/**
 * VIOLATING.
 * Reordering is possible only by dragging. Keyboard, switch-control and
 * head-pointer users cannot reorder at all.
 */
export function SortableListLegacy({ items, onReorder }: SortableListLegacyProps) {
  return (
    <ul className="sortable-list">
      {items.map((item, index) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('text/plain', String(index))}
          onDrop={(e) => onReorder(Number(e.dataTransfer.getData('text/plain')), index)}
          onDragOver={(e) => e.preventDefault()}
        >
          <span className="drag-handle" style={{ width: 16, height: 16 }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
