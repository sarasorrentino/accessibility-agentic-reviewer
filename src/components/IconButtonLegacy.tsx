import { IconTrash } from './icons';

type IconButtonLegacyProps = {
  onClick: () => void;
};

/**
 * VIOLATING.
 * No accessible name, and the hit area is the icon itself at 16x16 —
 * well under the 24px legal minimum and the 44px best practice.
 */
export function IconButtonLegacy({ onClick }: IconButtonLegacyProps) {
  return (
    <button type="button" onClick={onClick} style={{ width: 16, height: 16, padding: 0 }}>
      <IconTrash />
    </button>
  );
}
