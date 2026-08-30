# Evaluation — Run 1

**Date:** 2026-08-29
**Scope:** 17 component files, one subagent per file, blind (agents forbidden from reading `EXPECTED.md`)
**Pipeline stages:** pattern scan ✓ · AI judgment ✓ · eslint ✗ (not installed in fixture)

---

## Scores

| Metric | Threshold | Result | |
|---|---|---|---|
| Recall on blocking A/AA | ≥ 90% | **16/16 = 100%** | ✅ |
| Blocking false positives | 0 | **0** | ✅ |
| Ambiguity correctly deferred | 4/4 | **2/4** | ⚠️ |
| Run-to-run variance | 🔵 only | not measurable (1 run) | — |

**Verdict: passes the two hard gates.** The ambiguity score is short, but on inspection two of the four cases were not genuinely ambiguous — see §3.

---

## 1. Recall — expected findings

All 8 violating components were correctly identified. Of the 17 blocking violations in `EXPECTED.md` §A, 16 were confirmed as 🔴.

The 17th — `FormFieldLegacy` colour-only-state — was returned as `false-positive`, and **the agent was right**: line 23 renders the error text under the same `error` condition, so colour is not the only channel. The ground truth was wrong. Corrected in `EXPECTED.md`.

Notable beyond simple recall:

- **`ModalLegacy` missing `role="dialog"`** was expected as an `ai-only` finding, uncovered by any pattern. It was found, as `ai-only`, correctly.
- **`ButtonLegacy`** produced an `ai-only` critical the ground truth did not anticipate and that is more severe than anything the patterns caught: `onPointerDown` is the sole handler, so the button is **entirely inoperable by keyboard and assistive technology** — Enter/Space and AT-synthesised activation dispatch `click`, never `pointerdown`. WCAG 2.1.1 (A).
- **`CardLegacy` raw-colour** was split rather than treated as one finding: `text-gray-900` → false-positive (it is the value behind `color.text.primary`, 16.75:1), `text-gray-400` → 🔴 critical, because it is the value behind `color.text.disabled` whose `$a11y.exempt` is conditioned on "disabled component" and here styles the live body of an enabled, clickable card at ~2.6:1. The agent read the exemption and refused to extend it past its stated condition.

## 2. False positives — the hard gate

**10/10 traps passed. Zero blocking false positives.**

| Trap | Verdict returned | |
|---|---|---|
| `FormField:47` sr-only label + placeholder | false-positive | ✅ |
| `FormField:52` live region, conditional content | false-positive | ✅ |
| `FormField:12` error linked via aria-describedby | false-positive | ✅ |
| `IconButton:29` 16px icon in 44px button | false-positive | ✅ |
| `Toast:27` two persistent sr-only regions | false-positive | ✅ |
| `Dropdown:65` full listbox keymap present | false-positive | ✅ |
| `icons:5,13` decorative SVG primitives | false-positive | ✅ |
| `Modal:29` intentional dialog trap | **exempt**, reason quoted | ✅ |
| `SortableList:22` move buttons alternative | **exempt**, reason quoted | ✅ |
| `Dropdown` disabled option colour | **exempt**, reason quoted | ✅ |

Two details worth recording:

- The `Modal` exemption was **verified on the merits before being accepted** — the agent checked the Tab cycle, the Escape handler and the `triggerRef` restore individually, then noted that 2.1.2 is not failed anyway, so the exemption documents a correct implementation rather than waiving a defect.
- The `Dropdown` disabled-token exemption was **surfaced proactively**. No scan candidate covered it; the agent raised it as ⚪ EXEMPT rather than letting it pass unmentioned. Suppression stayed visible, as the design requires.

## 3. Ambiguity — 2/4

| Case | Expected | Returned | Assessment |
|---|---|---|---|
| `CardLegacy:20` colour-only error | 🔵 | 🔵 needs-review | ✅ correct |
| `ModalLegacy` no close affordance | 🔵 | 🔵 needs-review | ✅ correct |
| `SortableListLegacy:24` 16px drag handle | 🔵 | false-positive | ground truth questionable |
| `Dropdown:65` container-level keymap | 🔵 | false-positive | ground truth questionable |

The two "misses" were both resolved with sound reasoning rather than guessed at. The drag handle is a `span` with no handlers — `draggable` and all three drag handlers sit on the full-width `<li>`, so the row is the target. The keymap is on the wrapper `div` and reachable by event bubbling from the only focusable element. In both cases the agent verified rather than assumed, and added a caveat about what would make the verdict change.

**These were mislabelled as ambiguous in the ground truth.** Corrected.

## 4. Real defects found in "conforming" fixture components

The agent found four genuine bugs in components written as conforming. None is a false positive; all were verified by hand.

| File | Severity | Defect |
|---|---|---|
| `Dropdown.tsx:37` | 🔴 critical | `handleKeyDown` has no `isOpen` guard and `preventDefault()`s Enter/Space on the collapsed trigger, suppressing the button's native click. **The dropdown cannot be opened by keyboard at all**, and the first Enter silently commits `selectable[0]`. |
| `Dropdown.tsx:72` | 🔵 | `activeIndex` indexes the filtered `selectable` array but the highlight compares against `i` from the unfiltered `options`. With any disabled option present, the highlighted row is not the row Enter selects. |
| `Modal.tsx:22` | 🟡 | Focus restore is unguarded against initial mount: a page rendering a closed Modal moves focus to its trigger on load. |
| `Card.tsx:19` | 🟡 | Wrapping the whole card in a `<button>` strips the `<h3>`'s heading role (ARIA presentational-children) and makes the accessible name the concatenation of the entire card body. |

The `Dropdown` critical is the single most valuable result of the run: it is a real, blocking, keyboard-accessibility failure in code that had been reviewed and labelled correct, and no pattern in the catalogue could have found it.

## 5. Defects found in the tooling itself

The agents reported four problems with the pipeline, all actionable:

1. **`conditional-live-region` fires on the wrong element.** It should test whether the element carrying `aria-live`/`role="status"`/`role="alert"` is itself inside a conditional, not whether a conditional appears anywhere in its subtree. Currently it matched a style ternary in `FormField.tsx:52` while the live region was at line 55 — right verdict, wrong line.
2. **`small-touch-target` should skip `aria-hidden="true"` elements** whose interactive ancestor declares `min-width`/`min-height` at or above the touch token.
3. **`bare-input-outside-formfield` should exclude `FormField.tsx` itself**, and `toast-outside-provider` should exclude the provider implementation. Both re-raise on every run against the very components that implement the rule.
4. **`custom-widget-no-keymap` matched a JSDoc comment** in `DropdownLegacy.tsx:12` rather than the `role="listbox"` at line 25. The defect it named was real, but the line attribution was wrong.

## 6. Exceptions file audit

The `SortableList` exemption's `reason` states the alternative is *"onMoveUp/onMoveDown buttons and arrow-key handling"*. **There is no arrow-key handling in that component** — only the buttons satisfy 2.5.1. The agent flagged that the approved rationale is broader than the code it approves, and noted that removing the buttons on the strength of that sentence would leave the exemption silently masking a real failure.

This is the exemption mechanism working as intended: the record is auditable, and the audit found it inaccurate.

---

## Actions

- [x] Correct `EXPECTED.md` §A item 9 (colour-only is not a violation in `FormFieldLegacy`)
- [x] Correct `EXPECTED.md` §B — reduce to the 2 genuinely ambiguous cases
- [ ] Fix the four real bugs in the conforming fixture components
- [ ] Fix the four pattern defects in §5
- [ ] Correct the `SortableList` exemption reason
- [ ] Runs 2 and 3, for variance
