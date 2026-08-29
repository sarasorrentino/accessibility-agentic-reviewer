# Ground truth

Reference answers for the fixture. Used to measure recall, false positives, and run-to-run variance (DESIGN.md §11).

Do not show this file to the agent during an evaluation run.

---

## A. Expected findings — must be reported

24 deliberate violations across the 8 `*Legacy` components.

### ButtonLegacy.tsx

| # | Line | Expected | Criterion | Defect |
|---|---|---|---|---|
| 1 | 18 | 🔴 | 2.5.2 A | `onPointerDown` fires the primary action; cannot be aborted by dragging away |
| 2 | 21 | 🔴 | 2.4.7 AA | `outline: 'none'` with no `:focus-visible` replacement |
| 3 | 22 | 🟡 | 2.3.3 AAA | Hardcoded `200ms`; ignores `prefers-reduced-motion` |

### IconButtonLegacy.tsx

| # | Line | Expected | Criterion | Defect |
|---|---|---|---|---|
| 4 | 14 | 🔴 | 4.1.2 A / 2.5.3 A | Icon-only button with no accessible name |
| 5 | 14 | 🔴 | 2.5.8 AA | Hit area 16×16, below the 24px legal minimum |

### FormFieldLegacy.tsx

| # | Line | Expected | Criterion | Defect |
|---|---|---|---|---|
| 6 | 19 | 🔴 | 3.3.2 A | Placeholder is the only label |
| 7 | 15 | 🔴 | 1.3.5 AA | No `autoComplete` on a personal-data email field |
| 8 | 23 | 🔴 | 3.3.1 A | Error not linked via `aria-invalid` / `aria-describedby` |
| 9 | 21–23 | 🔴 | 1.4.1 A | Error signalled by colour alone, no icon or text cue |
| 10 | 23 | 🟡 | 1.4.3 AA | Raw `text-red-500` bypasses the token system |

### ModalLegacy.tsx

| # | Line | Expected | Criterion | Defect |
|---|---|---|---|---|
| 11 | 21 | 🔴 | 2.1.2 A | Focus trap with no Escape handler and no focus restore |
| 12 | 37 | 🟡 | 1.4.10 AA | Fixed `800px` forces bidirectional scroll at 400% zoom |
| 13 | 36 | 🔴 | 4.1.2 A | No `role="dialog"` / `aria-modal` — **ai-only**, no pattern covers it |

### ToastLegacy.tsx

| # | Line | Expected | Criterion | Defect |
|---|---|---|---|---|
| 14 | 25 | 🔴 | 4.1.3 AA | Live region mounted with its message; announcement is missed |

### DropdownLegacy.tsx

| # | Line | Expected | Criterion | Defect |
|---|---|---|---|---|
| 15 | 12 | 🔴 | 2.1.1 A | `role="listbox"` with no Arrow/Enter/Escape handling |
| 16 | 20 | 🔴 | 2.4.3 A | `tabIndex={1}` breaks the page focus order |
| 17 | 20 | 🔴 | 2.1.1 A | Clickable `div` trigger, no role, not focusable |
| 18 | 27 | 🔴 | 2.1.1 A | `role="option"` with `onClick` and no keyboard path |

### SortableListLegacy.tsx

| # | Line | Expected | Criterion | Defect |
|---|---|---|---|---|
| 19 | 19 | 🔴 | 2.5.1 A | Reordering possible only by dragging |
| 20 | 24 | 🔵 | 2.5.8 AA | 16px drag handle — ambiguous, may be decorative (see §B) |

### CardLegacy.tsx

| # | Line | Expected | Criterion | Defect |
|---|---|---|---|---|
| 21 | 19 | 🔴 | 2.1.1 A | Clickable `div`, no role, no `tabIndex`, no `onKeyDown` |
| 22 | 20 | 🔵 | 1.4.1 A | Colour-only error — ambiguous, alternative may be in parent (see §B) |
| 23 | 24–25 | 🟡 | 1.4.3 AA | Raw `text-gray-900` / `text-gray-400` bypass the tokens |
| 24 | 22 | 🟡 | 2.3.3 AAA | Hardcoded `150ms` transition |

---

## B. Deliberately ambiguous — must be 🔵, never decided

The agent fails this section if it either confirms or dismisses these. Correct behaviour is to report them as needing human review, with a stated reason.

| Case | File | Why it is ambiguous |
|---|---|---|
| Colour-only error state | `CardLegacy.tsx:20` | The text alternative could plausibly be rendered by the parent; not decidable from this file |
| 16px drag handle | `SortableListLegacy.tsx:24` | A `span` with no handler — may be decorative rather than the hit area |
| Keymap at container level | `Dropdown.tsx:65` | `onKeyDown` sits on the wrapper, not the listbox; correct but unconventional |
| Focus restore on unmount | `ModalLegacy.tsx:21` | Whether a parent restores focus is not visible from this file |

---

## C. False-positive resistance — must NOT be reported as violations

Every one of these is matched by a pattern and is nevertheless correct. **A 🔴 on any of them is a blocking false positive and fails the run** (DESIGN.md §11.3).

| # | File | Pattern that fires | Correct verdict | Why it is conforming |
|---|---|---|---|---|
| 1 | `FormField.tsx:47` | `placeholder-as-label` | false-positive | An `sr-only` label is a real label |
| 2 | `FormField.tsx:52` | `conditional-live-region` | false-positive | Region is persistent; only its content is conditional |
| 3 | `FormField.tsx:12` | `error-not-programmatically-linked` | false-positive | `aria-invalid` and `aria-describedby` both present |
| 4 | `IconButton.tsx:29` | `small-touch-target` | false-positive | 16px icon inside a 44px `min-width`/`min-height` button |
| 5 | `Toast.tsx:27` | `conditional-live-region` | false-positive | Two permanently mounted `sr-only` regions |
| 6 | `Dropdown.tsx:65` | `custom-widget-no-keymap` | false-positive | Full listbox keymap implemented |
| 7 | `icons.tsx:5,13` | `small-touch-target` | false-positive | Decorative SVG primitives, not interactive |
| 8 | `Modal.tsx:29` | `focus-trap-no-exit` | ⚪ exempt | Intentional dialog trap; recorded in `a11y-exceptions.json` (2.1.2) |
| 9 | `SortableList.tsx:22` | `drag-only-interaction` | ⚪ exempt | Move buttons provide the alternative; recorded (2.5.1) |
| 10 | `Dropdown.tsx:79` | disabled option colour | ⚪ exempt | `color.text.disabled` carries `$a11y.exempt: true` |

Cases 8–10 must appear as ⚪ EXEMPT with the reason quoted — **not** silently omitted. Suppression is always visible.

---

## D. Scoring

Run the fixture three times.

| Metric | How to compute | Threshold |
|---|---|---|
| Recall (blocking) | Found 🔴 in §A ÷ total 🔴 in §A | ≥ 90% |
| Blocking false positives | Count of 🔴 raised on §C | **0** |
| Ambiguity handling | §B cases correctly marked 🔵 | 4 / 4 |
| Variance | Findings present in only 1 of 3 runs | 🔵 only |

A single 🔴 on §C fails the evaluation regardless of recall. The asymmetry is deliberate: a blocking false positive is the one error the tool does not recover from.

### Recording a run

```
Run 1 — 2026-08-29
  Recall (blocking):        16/17  (94%)
  Blocking false positives: 0
  Ambiguity:                3/4    (missed SortableListLegacy:24)
  Notes:                    …
```
