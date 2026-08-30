# Accessibility Review Agent — Design Document

**Status:** design, pre-implementation
**Scope:** automated technical review of React components against WCAG 2.1/2.2 Level AA
**Part of:** Accessibility Knowledge Base — companion to *WCAG in the Design System*, *WCAG → React Impact Mapping*, *Developer Accessibility Checklist*, *Accessibility Tokens*

---

## 1. Purpose

An AI agent that reviews React components for accessibility defects that **cannot be caught by static linters alone**, and reports them in a form a developer (or a coding agent) can act on immediately.

The agent exists because component-by-component accessibility, verified by humans against a checklist, produces inconsistent results — the exact problem the Developer Checklist was written to solve. The checklist standardises *what* to verify; this agent automates *the verification itself* for the subset of items where automation is possible without loss of accuracy.

### What it is

A **judgment layer on top of deterministic tooling**. It adjudicates cases where the correct answer depends on intent, context, or cross-file structure.

### What it is not

- Not a replacement for `eslint-plugin-jsx-a11y`, `axe-core`, or contrast tooling. Those are faster, free, and do not hallucinate.
- Not a runtime or visual analyser. Phase 1 is **static source analysis only**.
- Not a substitute for manual screen-reader testing (Checklist 3 retains that requirement).
- Not an authority on ambiguous cases. Ambiguity is surfaced, never resolved autonomously.

---

## 2. Position in the toolchain

| Layer | Tool | Handles | Example |
|---|---|---|---|
| 1 — Deterministic rules | `eslint-plugin-jsx-a11y` | Mechanically decidable rules | Missing `alt`, invalid ARIA attribute, `aria-*` on wrong role |
| 2 — Deterministic patterns | grep/AST scripts derived from Checklist 2 | Known textual anti-patterns | `outline: none`, `onPointerDown`, `tabIndex > 0`, raw Tailwind colour classes |
| 3 — AI judgment | This agent | Intent, context, cross-file, absence-of-alternative | Is this focus trap intentional? Does this error state have a non-colour indicator? Should this `div` have been a `button`? |

Layers 1 and 2 produce **candidates**. Layer 3 adjudicates them **and** may add findings of its own.

### The value test

The agent earns its place only through findings that layers 1–2 structurally cannot produce. The report therefore separates these explicitly (§7), so the marginal value is visible on every run rather than assumed.

---

## 3. Architecture

### 3.1 Sequential pipeline

```
git diff (branch vs main)
  → file filter (components only)
  → [Stage 1] eslint-plugin-jsx-a11y
  → [Stage 2] deterministic pattern scan
  → [Stage 3] AI judgment — one subagent per file, in parallel
  → aggregation → report
```

Sequential rather than parallel: stages 1–2 are cheap and deterministic, and their output constrains stage 3, reducing both cost and hallucination surface.

### 3.2 One subagent per file

Each changed file is judged by its own subagent, in parallel. Rationale:

- **Constant quality** regardless of diff size — a 30-file PR does not degrade judgment on the last file.
- **Maps onto the output contract** — the report's per-file suggested prompt (§7.2) corresponds 1:1 to a subagent's scope.
- **Cacheable** — an unchanged file's verdict is reusable (§8.3).

Cross-file judgment is preserved through import resolution (§5.3), not through shared context.

### 3.3 Handoff contract between stages

The AI stage receives, per file:

1. Full source of the file under review
2. Source of directly imported project modules (depth 1)
3. Candidate list from stages 1–2 (rule, line, matched pattern)
4. Anti-pattern catalogue (§10)
5. Project configuration: token definitions, active exemptions

The AI stage **must** return a verdict on every candidate — `confirmed`, `exempt`, or `false-positive`, each with a stated reason — **and may** add findings not matched by any pattern, flagged as `ai-only`. Neither half is optional: candidate-only adjudication blinds the agent to what was never anticipated; free-form analysis alone loses the constraint that keeps it honest.

---

## 4. Inputs and configuration

A single `a11y-agent.config.json` at repository root, pointing at everything else. Explicit configuration is preferred over path conventions because client projects will not resemble each other.

```json
{
  "tokens": "./tokens/a11y.json",
  "exceptions": "./a11y-exceptions.json",
  "customAntiPatterns": "./a11y-patterns.json",
  "reportLanguage": "en",
  "blockingThreshold": "critical",
  "exemptionWarningThreshold": 15
}
```

| Field | Required | Purpose |
|---|---|---|
| `tokens` | no | Design token file with `$a11y` metadata (§4.1) |
| `exceptions` | no | Recorded human decisions (§9) |
| `customAntiPatterns` | no | Project-specific DS conventions (§10.2) |
| `reportLanguage` | no | Output language, default `en` |
| `blockingThreshold` | no | Which severity fails CI, default `critical` |
| `exemptionWarningThreshold` | no | Exemption count that triggers the header warning |

The anti-pattern catalogue itself is **not** configurable per project: it ships with the agent and is fixed across projects, as is the Developer Checklist it derives from.

### 4.1 Why the token file matters in static analysis

Not to compute contrast — ratios are precomputed in the `$a11y.ratios` field. It serves three purposes no linter can:

1. **Actionable fixes.** A grep finds `className="text-gray-400"`; the token file lets the agent say *use `color.text.secondary`* rather than *hardcoded colour, suspicious*.
2. **Documented exemptions.** `color.border.disabled` sits at 1.87:1 with `exempt: true` — WCAG 1.4.11 explicitly exempts disabled components. An agent without the token file reports it as a violation on every run.
3. **Reference-flow discipline.** The rule *components reference semantic or component-specific tokens, never primitives* is statically checkable, is specific to this design system, and no existing tool enforces it.

### 4.2 Degraded mode

When `tokens` is absent — the expected case on a client project not yet using the token system — the agent runs everything else and **declares the gap in the report header**:

> ⚠️ Token system not configured — 4 checks not executed: token reference flow, hardcoded colour → token suggestion, documented token exemptions, motion token override.

Silence about what was *not* checked is dangerous in front of a client: it implies a broader guarantee of conformance than was actually made. Inferring tokens from Tailwind config or CSS custom properties is explicitly rejected — it generates exactly the false positives §11 is designed to eliminate.

---

## 5. Analysis scope

### 5.1 Trigger

Two entry points, one implementation:

- **CI** — on every push to a branch with an open PR. Primary path, produces the merge verdict.
- **Local** — `/a11y-review` before pushing. Same skill, same logic, terminal output instead of a PR comment.

The local path is not optional. With a blocking check, a developer's first encounter with the agent would otherwise be *"you cannot merge"* — the worst possible introduction to a tool intended for voluntary adoption. It also restores the Checklist 1 principle: *start during development, not at the end*.

### 5.2 Diff perimeter

Diff is **branch vs base branch**, not last-push-vs-previous — the verdict always describes the complete PR.

Within a touched file, the agent reports the **whole file**, marking findings outside the diff as `pre-existing`:

- Findings on changed lines → attributed to this PR, **blocking** if critical.
- Findings elsewhere in the file → reported as pre-existing debt, **never blocking**.

Without this distinction, whoever touches an old file inherits someone else's debt and the bot becomes an obstacle to route around. With it, debt surfaces gradually without a dedicated audit — the operational counterpart to Checklist 3's *"an unchecked item is accessibility debt to be planned"*.

### 5.3 Import depth

Each file is analysed together with its **directly imported project modules (depth 1)**.

Necessary because most judgments are not decidable from one file. `<Button onClick={...}>` looks correct; if `Button` internally uses `onPointerDown`, the violation is real and invisible at the call site. Same for `outline: none` in a global stylesheet with the replacement declared elsewhere.

Full import-graph traversal is deferred until a concrete case demands it — cost grows quickly and depth 1 resolves the large majority of false negatives (wrappers, focus hooks, DS primitives).

### 5.4 File filter

Analysed: `.tsx`, `.jsx` under source directories.
Skipped: tests, stories, config, generated files, `node_modules`.

---

## 6. Judgment model

### 6.1 Severity

Three levels, collapsing WCAG severity and agent confidence onto **one axis**. Two independent axes (AA × high-confidence, AA × low-confidence…) are conceptually cleaner and produce a matrix nobody reads.

| Level | Meaning | Blocks merge |
|---|---|---|
| 🔴 **Critical** | Level A/AA violated with certainty | **Yes** |
| 🟡 **Warning** | Best practice / AAA, or Level A/AA with material uncertainty | No |
| 🔵 **Needs review** | Human judgment required | No |

🔵 findings remain visible in the PR comment as *requires a human decision before merge* — delegated to code review, not to the bot. If 🔵 were blocking, the only way to unblock would be to write an exemption, converting *needs review* into *needs silencing*.

### 6.2 Ambiguity is never resolved autonomously

Cases requiring intent — a focus trap in a component that may or may not be a modal, low contrast on a possibly-exempt disabled state, colour used as a state indicator where the alternative may exist elsewhere — are classified 🔵 with a stated reason. The agent never decides them silently in either direction.

### 6.3 Grounding: authority vs context

Two distinct sources, deliberately separated:

- **Authority cited in the report** is always **WCAG or established best practice**. A finding that cites *"WCAG 1.4.3 AA — contrast below 4.5:1"* is defensible to a client; *"item 4 of the internal checklist"* is not.
- **Context consulted to suppress false positives** is the project's own documentation — the `$a11y.exempt` fields and the exceptions file.

Suppressions are **visible, never silent**: a suppressed finding still appears in the report as *exempt: [reason]*.

---

## 7. Output contract

### 7.1 Report structure

```
Accessibility Review — PR #142
Config: tokens ✓ · exceptions ✓ (7 active) · custom patterns ✗

🔴 3 blocking · 🟡 5 warnings · 🔵 2 need review · 4 pre-existing

────────────────────────────────────────
src/components/Card.tsx

🔴 CRITICAL · WCAG 2.1.1 (A) · line 34 · introduced by this PR
   Clickable <div> with onClick but no keyboard handler and no role.
   Keyboard and screen-reader users cannot activate this card.
   Fix: use <button>, or add role="button" + onKeyDown (Enter/Space) + tabIndex={0}.
   Source: ai-judgment (not detected by static rules)

🔵 NEEDS REVIEW · WCAG 1.4.1 (A) · line 51 · introduced by this PR
   Error state appears to rely on border colour alone. No icon or text
   found in this file, but the alternative may be rendered by the parent.
   Verify manually whether a non-chromatic indicator is present.
   Source: ai-judgment

🟡 WARNING · WCAG 2.3.3 (AAA) · line 12 · pre-existing
   Hardcoded transition '200ms ease-out' — does not respond to
   prefers-reduced-motion. Use var(--duration-enter).
   Source: pattern-scan · adjudicated: confirmed

⚪ EXEMPT · WCAG 1.4.11 · line 22
   color.border.disabled at 1.87:1 — exempt per $a11y.exemptReason:
   "Disabled component — exempt from WCAG 1.4.3"
   Source: eslint · adjudicated: exempt
```

Every finding carries: severity, WCAG criterion + level, line, attribution (introduced/pre-existing), the defect, the consequence, the fix, and its **source** (`eslint` / `pattern-scan` / `ai-judgment`) with the AI's adjudication where applicable.

### 7.2 Suggested fix prompt

One aggregated prompt **per file**, written for a coding agent, appended after that file's findings:

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

Per-file rather than per-finding (fifteen separate blocks to copy) or per-run (too large, degrades the executing agent's precision).

The trailing constraint is deliberate: without it, a coding agent handed a blocking check will sometimes "fix" the failure by writing an exemption.

### 7.3 Language

Report and anti-pattern catalogue: **English**. Configurable per project via `reportLanguage`.

---

## 8. CI integration

### 8.1 Delivery

Published as a **PR comment**, updated in place on each run (not appended, to avoid a wall of stale comments), plus a **check status**.

### 8.2 Blocking policy

The check **fails when any 🔴 finding is attributed to this PR**. Pre-existing 🔴 findings, 🟡, and 🔵 do not fail the check.

This is what makes a blocking check safe to introduce on an existing codebase: the first run on a client project will surface a large number of pre-existing violations, and if those blocked, nobody could merge anything from day one. That first run instead produces a **baseline** — effectively an automated Checklist 3 audit — delivered as a standalone artefact and planned separately. It is a saleable deliverable in itself: *here is your accessibility debt today, here is the plan*.

### 8.3 Caching

Verdicts are cached per file content hash. A push touching one file re-judges one file and reuses nineteen stored verdicts; a cached 🔴 on an untouched file still blocks.

No loss of rigour — a byte-identical file cannot warrant a different verdict — and a side benefit: caching **reduces** run-to-run variance (§11.3) rather than hiding it.

### 8.4 Failure handling

Two retries, then **fail-open with a prominent notice** in the PR comment, and the event logged:

> ⚠️ Accessibility review did not run: [error]. This PR has not been checked.

An infrastructure outage is not an accessibility violation, and blocking an entire team because a service is down produces the worst outcome available: the check gets disabled. But a silent fail-open is equally dangerous — a PR could pass having never been reviewed. Hence: open, but loudly.

---

## 9. Exemptions

### 9.1 Two levels

- **Token-level** — already modelled in `$a11y.exempt` / `$a11y.exemptReason`. Not duplicated anywhere.
- **Component-level** — recorded in the central `a11y-exceptions.json`.

### 9.2 Keying

Keyed by **file + component + WCAG criterion** — never by line number, which drifts on the first refactor and either detaches (the false positive returns) or attaches to the wrong line (a real violation is hidden).

```json
{
  "exceptions": [
    {
      "file": "src/components/Modal.tsx",
      "component": "Modal",
      "criterion": "2.1.2",
      "reason": "Focus trap is intentional — ARIA dialog pattern requires it",
      "approvedBy": "sara",
      "date": "2026-08-29"
    }
  ]
}
```

`reason` and `approvedBy` are mandatory. An exemption without a written reason is worth nothing in a client audit.

### 9.3 Self-declaration and counter-pressure

Any team member may declare an exemption; the control is PR review, not a gate.

This is defensible **only because of the escape hatch it creates**: a blocking check without a documented way out is a check that gets disabled the first time a false positive lands during an urgent release. Here, unblocking is always possible — but only in writing, in the PR diff, reviewed like any other change. The override is not a loophole; it is **an audit artefact**.

The counter-pressure is the counter. Every report header shows the active exemption count, and **above `exemptionWarningThreshold` (default 15) the report opens with a warning** that the project is accumulating silenced debt. A counter alone becomes invisible through habit within two weeks; a line that appears only when the number grows gets noticed. If these reports reach a client, the warning also protects the team: it demonstrates the debt was declared, not concealed.

---

## 10. Anti-pattern catalogue

### 10.1 Format

One entry per anti-pattern, machine-readable, derived from the Developer Checklist but organised along a different axis: *what to look for, and who judges it*.

```json
{
  "id": "clickable-non-interactive-element",
  "name": "Clickable div/span without role and keyboard handler",
  "wcag": "2.1.1",
  "level": "A",
  "detection": {
    "type": "pattern",
    "pattern": "<(div|span)[^>]*onClick",
    "requiresAiJudgment": true
  },
  "why": "Keyboard and screen-reader users cannot activate the element. A click handler on a non-interactive element is invisible to assistive technology.",
  "fix": "Use a native <button>. If markup constraints prevent it, add role=\"button\", tabIndex={0}, and an onKeyDown handler for Enter and Space.",
  "examples": {
    "bad": "<div onClick={handleSelect}>Select</div>",
    "good": "<button type=\"button\" onClick={handleSelect}>Select</button>"
  },
  "checklistRef": "Checklist 2 — Keyboard, item 1"
}
```

`requiresAiJudgment` drives the pipeline: `false` → fully resolved by stages 1–2; `true` → the pattern produces a candidate that stage 3 adjudicates.

`checklistRef` keeps every finding traceable back to the Knowledge Base, even though the report cites WCAG rather than the checklist.

### 10.2 Base catalogue (fixed, cross-project)

Derived from Checklist 2:

| Anti-pattern | WCAG | AI judgment |
|---|---|---|
| `outline: none` without a visible replacement | 2.4.7 AA | yes |
| `onPointerDown`/`onMouseDown` as primary action handler | 2.5.2 A | yes |
| Clickable `div`/`span` without role + keyboard handler | 2.1.1 A | yes |
| Placeholder as the only label | 3.3.2 A | yes |
| `tabIndex > 0` | 2.4.3 A | no |
| Live region conditionally mounted/unmounted | 4.1.3 AA | yes |
| Icon-only button without accessible name | 2.5.3 A / 4.1.2 A | yes |
| Error state signalled by colour alone | 1.4.1 A | yes |
| Hardcoded duration instead of `duration.*` token | 2.3.3 AAA | no |
| Fixed px width on layout containers | 1.4.10 AA | yes |
| Raw colour utility classes instead of semantic tokens | 1.4.3 AA | no |
| Missing `autocomplete` on personal-data fields | 1.3.5 AA | yes |
| Focus trap without an exit path | 2.1.2 A | yes |
| Redundant ARIA role on a native element | 4.1.2 A | no |
| Interactive target below `space.touch.min` | 2.5.8 AA | yes |

### 10.3 Project-specific anti-patterns

Conventions of a particular design system's API — accessibility-relevant but invisible to any generic tool:

- *Never a bare `<input>`; always inside `<FormField>`*
- *Never `<Modal>` without `initialFocusRef`*
- *`<Toast>` only inside `ToastProvider`*

Same schema, loaded from `customAntiPatterns`. Over time this file becomes the accumulated value of the agent on a given client.

---

## 11. Validation protocol

Reliability must be measured before the agent is trusted on client work.

### 11.1 Fixture

A purpose-built mini design system — eight component pairs (conforming / violating), plus a `tokens/a11y.json`:

`Button` · `IconButton` · `FormField + Input` · `Modal` · `Toast` · `Dropdown` · `SortableList` · clickable `Card`

Approximately **20 deliberate violations**, of which **3–4 are deliberately ambiguous** — present to verify the agent classifies them 🔵 rather than deciding either way.

The fixture serves double duty: demo target and evaluation set.

> `Card` and `SortableList` are included specifically because they are the two components that most often break accessibility in real projects and that no linter catches. Substitute `DataTable` or `DatePicker` for `Dropdown` if those recur more often in client work.

### 11.2 Metrics

Run the fixture **three times** and measure:

1. **Recall** against the ~20 known violations
2. **False positives** on the conforming components
3. **Run-to-run variance** — findings appearing in 1 of 3 runs

### 11.3 Thresholds

| Metric | Threshold |
|---|---|
| Recall on blocking A/AA violations | ≥ 90% |
| False positives at 🔴 | **zero** |
| Variance | tolerated on 🔵 only |

**The asymmetry is deliberate.** A blocking false positive costs far more than a false negative: it destroys trust and the tool gets disabled. A false negative is absorbed by the manual checklist that already exists. The agent must be **conservative on red and generous on blue**.

---

## 12. Phase 2 — deferred

Explicitly out of scope for the first implementation:

- **Runtime and visual analysis** — real DOM, computed contrast, actual focus order. Natural adjacency with the planned Figma analysis agent.
- **Full import-graph traversal** — deferred until a concrete false negative demands it.
- **Standalone CLI** — justified only if a client must run the agent without Claude Code.
- **Automatic fix application** — the agent proposes; a human or a coding agent disposes.
- **Designer checklist automation** — a separate agent, on Figma files, not source code.

---

## 13. Decision log

| # | Decision | Rationale |
|---|---|---|
| 1 | Judgment layer over static tools, not a replacement | Linters are faster, free, and do not hallucinate |
| 2 | Static source analysis only in phase 1 | Faster to build and validate; covers most of Checklists 1–2 |
| 3 | Sequential pipeline (lint → patterns → AI) | Avoids spending judgment on deterministically decidable cases |
| 4 | AI adjudicates all candidates **and** may add its own findings | Candidate-only is blind; free-form alone is unconstrained |
| 5 | CI on every push, plus a local command | Blocking check demands an early feedback path |
| 6 | Branch-vs-base diff, whole touched file, pre-existing marked | Nobody inherits someone else's debt |
| 7 | Import depth 1 | Resolves most cross-file false negatives at bounded cost |
| 8 | Three severity levels on one axis | A confidence × severity matrix is not read |
| 9 | Ambiguity always 🔵, never autonomously resolved | Intent is not statically decidable |
| 10 | Cite WCAG, consult project docs | Report defensible to clients; exemptions still respected |
| 11 | Central exceptions file, keyed file + component + criterion | Survives refactors; line numbers drift |
| 12 | Self-declared exemptions + threshold warning | Escape hatch makes blocking safe; counter prevents decay |
| 13 | Blocking on 🔴 introduced by this PR only | Allows adoption on an existing codebase without freezing it |
| 14 | Per-file verdict caching | Lower cost, and less run-to-run variance |
| 15 | Fail-open after two retries, loudly | Outages are not violations; silent passes are dangerous |
| 16 | Fixture doubles as evaluation set | Demo and validation from one artefact |
| 17 | Zero blocking false positives as a hard gate | The only error the tool does not recover from |
| 18 | English output; single config file | Portability across client projects |

---

## 14. Open items before implementation

1. Confirm the fixture component set, or substitute `DataTable` / `DatePicker` for `Dropdown` based on what recurs in client work.
2. Decide the repository for the fixture and the agent (same repo or separate).
3. Confirm whether this document should also be published to Confluence alongside the rest of the Knowledge Base.
