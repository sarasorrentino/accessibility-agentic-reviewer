# Report format

One format for both entry points. Local mode prints it to the terminal; CI mode posts it as a PR comment, updated in place.

## Header

```
Accessibility Review — <PR #N | branch name | path>
Stages: eslint ✓ · patterns ✓ · ai-judgment ✓
Config: tokens ✓ · exceptions ✓ (7 active) · custom patterns ✗

🔴 3 blocking · 🟡 5 warnings · 🔵 2 need review · 4 pre-existing · ⚪ 1 exempt
```

When a stage was skipped, say so on the Stages line and explain the consequence:

```
Stages: eslint ✗ (not installed) · patterns ✓ · ai-judgment ✓
⚠️ Token system not configured — 4 checks not executed: token reference flow,
   hardcoded colour → token suggestion, documented token exemptions,
   motion token override.
```

When the exemption count exceeds the threshold, this line opens the report, before everything else:

```
⚠️ 18 active exemptions on this project (threshold: 15).
   Accessibility debt is accumulating in a11y-exceptions.json.
```

## Finding

One block per finding. Every field is mandatory.

```
🔴 CRITICAL · WCAG 2.1.1 (A) · line 34 · introduced by this PR
   Clickable <div> with onClick but no keyboard handler and no role.
   Keyboard and screen-reader users cannot activate this card.
   Fix: use <button>, or add role="button" + onKeyDown (Enter/Space) + tabIndex={0}.
   Source: ai-judgment (not detected by static rules)
```

| Field | Rule |
|---|---|
| Severity | 🔴 CRITICAL / 🟡 WARNING / 🔵 NEEDS REVIEW / ⚪ EXEMPT |
| Criterion | WCAG number + level. Always the standard, never an internal checklist reference |
| Line | Single line number |
| Attribution | `introduced by this PR` or `pre-existing` |
| Defect | What is wrong, one sentence |
| Consequence | Who is harmed and how. Not a restatement of the rule |
| Fix | Concrete and actionable. Name the token when one applies |
| Source | `eslint` / `pattern-scan` / `ai-judgment`, plus the adjudication verdict where relevant |

`Source: ai-judgment (not detected by static rules)` is load-bearing: it is how the marginal value of this agent over a linter stays visible on every run instead of being assumed.

### Needs review

State what a human must check, never a guess at the answer.

```
🔵 NEEDS REVIEW · WCAG 1.4.1 (A) · line 51 · introduced by this PR
   Error state appears to rely on border colour alone. No icon or text found
   in this file, but the alternative may be rendered by the parent.
   Verify manually whether a non-chromatic indicator is present.
   Source: ai-judgment
```

### Exempt

Suppression is always visible, and always quotes its source.

```
⚪ EXEMPT · WCAG 1.4.11 · line 22
   color.border.disabled at 1.87:1 — exempt per $a11y.exemptReason:
   "Disabled component — exempt from WCAG 1.4.3"
   Source: eslint · adjudicated: exempt
```

## Suggested fix prompt

One per file, after that file's findings. Addressed to a coding agent.

```
── Suggested prompt for src/components/Card.tsx ──

Fix 3 accessibility issues in src/components/Card.tsx:

1. Line 34 — the <div> with onClick is not keyboard accessible.
   Replace with <button>, or add role="button", tabIndex={0}, and an
   onKeyDown handler activating on Enter and Space. (WCAG 2.1.1 A)

2. Line 12 — replace the hardcoded transition '200ms ease-out' with
   var(--duration-enter) var(--easing-default) so it responds to the
   prefers-reduced-motion override. (WCAG 2.3.3)

3. Line 47 — the icon-only button has no accessible name. Add an
   aria-label describing the action. (WCAG 2.5.3 A / 4.1.2 A)

Do not change visual appearance. Do not add exemptions.
```

Include 🔴 and 🟡 findings. Exclude 🔵 — those need a human decision first, and an agent asked to "fix" an ambiguity will invent a resolution.

Omit the prompt entirely for a file whose only findings are 🔵 or ⚪.

## Verdict

```
────────────────────────────────────────
❌ BLOCKING — 3 critical issues introduced by this PR.
   Pre-existing issues do not block. See baseline report for accumulated debt.
```

```
────────────────────────────────────────
✅ PASS — no critical issues introduced by this PR.
   2 items need human review before merge (see 🔵 above).
```
