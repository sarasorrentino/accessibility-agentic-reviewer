---
name: a11y-review
description: Review React components for WCAG 2.1/2.2 Level AA accessibility defects that static linters cannot catch — focus management, HTML semantics, keyboard handling, and common anti-patterns. Use when the user asks to review accessibility, check a11y, audit components for WCAG compliance, or runs /a11y-review. Also use before opening a PR that touches React components.
---

# Accessibility Review

Judgment layer over deterministic tooling. You adjudicate what linters cannot decide: intent, context, and cross-file structure.

Full rationale for every rule below is in `DESIGN.md` at the repository root of this agent. Do not re-derive decisions from first principles — follow this file.

## What you do NOT do

- Do not re-check what `eslint-plugin-jsx-a11y` already decides mechanically.
- Do not compute contrast ratios. They are precomputed in the token file's `$a11y.ratios`.
- Do not resolve ambiguous cases autonomously. Ambiguity becomes 🔵 NEEDS REVIEW, never a silent pass or a silent failure.
- Do not analyse runtime behaviour, rendered DOM, or screenshots. This is static source analysis.
- Do not modify source files. You report; a human or a coding agent fixes.

---

## Step 1 — Establish scope

Determine the mode from how you were invoked:

| Invocation | Mode | Scope |
|---|---|---|
| `/a11y-review` with no arguments | local | branch diff vs base |
| `/a11y-review <path>` | local | that file or directory |
| CI (GitHub Action) | ci | branch diff vs base |

Run the deterministic scan. It resolves the diff, filters to component files, and emits candidates:

```bash
node <skill-dir>/scripts/scan-patterns.mjs --base main
```

For an explicit path: `node <skill-dir>/scripts/scan-patterns.mjs --files src/components/Card.tsx`

The output JSON gives you: `files`, `changedLineRanges`, `candidates`, and `config`. Read it fully before proceeding.

If `files` is empty, stop and report: *No component files changed — nothing to review.*

## Step 2 — Run the linter, if available

```bash
npx eslint --no-eslintrc --plugin jsx-a11y --format json <files> 2>/dev/null || echo "SKIPPED"
```

If it fails or is not installed, continue without it and record that stage 1 was skipped — the report header must say so. Never block on the linter's absence.

## Step 3 — Load project context

From `config` in the scan output:

- **`tokens`** — read it. You need `$a11y.exempt` / `$a11y.exemptReason` to suppress false positives, and semantic token names to suggest concrete fixes.
- **`exceptions`** — read it. Each entry is keyed `file + component + criterion`.
- If `tokensConfigured` is `false`, you are in **degraded mode**: skip the four token-dependent checks and declare them in the report header (see Step 6).

## Step 4 — Judge, one subagent per file

Spawn one subagent per file in `files`, in parallel. Each receives only its own file's context.

Give each subagent:

1. The full source of its file.
2. The source of **directly imported project modules (depth 1)** — resolve relative imports only, skip `node_modules`. Needed because `<Button onClick={...}>` looks correct while `Button` internally uses `onPointerDown`.
3. That file's candidates from the scan, and any ESLint results.
4. The `judgmentQuestion` attached to each candidate.
5. The token file contents and active exceptions for that file.
6. The changed line ranges, for attribution.

### Subagent instructions

Use this prompt verbatim, filling the bracketed sections:

> You are reviewing ONE React file for WCAG 2.1/2.2 Level AA accessibility defects.
>
> FILE: [path]
> SOURCE: [full source, line-numbered]
> DIRECT IMPORTS: [source of relative imports]
> CHANGED LINE RANGES IN THIS PR: [ranges]
> CANDIDATES FROM DETERMINISTIC SCAN: [candidates with judgmentQuestion]
> DESIGN TOKENS: [$a11y entries, or "not configured"]
> ACTIVE EXCEPTIONS FOR THIS FILE: [entries, or "none"]
>
> Do two things, in order.
>
> **A. Adjudicate every candidate.** For each, return exactly one verdict:
> - `confirmed` — a real violation. State the consequence for a specific user, not the rule.
> - `exempt` — covered by a documented token exemption or an entry in the exceptions file. Quote the reason.
> - `false-positive` — the pattern matched but no violation exists. Say what makes it correct.
> - `needs-review` — you cannot decide from the source available. Say precisely what a human must check.
>
> Answer the candidate's `judgmentQuestion` explicitly. Never leave a candidate unaddressed.
>
> **B. Add findings the patterns missed.** Read the file for accessibility defects no candidate covers — wrong heading levels, focus moved on mount, a select rebuilt as a div, an aria-expanded that never updates, a disabled element still reachable by keyboard. Mark these `ai-only`. This is the reason you exist rather than a grep script; do not skip it.
>
> **Severity, one axis:**
> - 🔴 `critical` — Level A/AA violated with certainty, **decidable from the evidence in front of you**
> - 🟡 `warning` — best practice/AAA, or A/AA with material uncertainty
> - 🔵 `needs-review` — human judgment required, or the evidence needed is not available to you
>
> **The decidability test — apply it to every 🔴 before you assign it.** Ask: *is this a violation using only the file under review and its direct imports?* If establishing it would require something you were not given — the computed background behind an element, what a parent renders into `children`, the contents of a stylesheet that is not in the repo, how a call site uses the component — then it is **🔵 by construction, never 🔴**, no matter how likely the violation seems.
>
> Two worked examples, both from real runs that disagreed with themselves:
> - `className="text-gray-400"` on body text. Whether this fails 4.5:1 depends on the surface behind it, which the file does not set. **🔵**, not 🔴 — even though gray-400 on white would fail. Say: *"fails 4.5:1 if the surface is light; the file does not set it — confirm the rendered background."*
> - An error state styled only by border colour, where the text alternative could come from `children`. **🔵**, not 🔴.
>
> By contrast, these are decidable from the file alone and stay 🔴: a `<div onClick>` with no role/tabIndex/onKeyDown; `tabIndex={1}`; an icon-only button whose only child is `aria-hidden` and which has no `aria-label`; `width: 16` with `padding: 0` on the interactive element itself.
>
> **Be conservative on 🔴 and generous on 🔵.** A false 🔴 blocks a merge and destroys trust in this tool; a 🔵 costs one human glance. If you are not certain, it is not 🔴.
>
> Do not compensate for the stricter bar by inflating 🔵 into 🔴 elsewhere, and do not downgrade a genuinely decidable violation to 🔵 to be safe — the point is accuracy about *what you can establish*, not timidity.
>
> **Cite WCAG, not internal documents.** Write "WCAG 2.1.1 (A)", never "checklist item 4". Consult project exemptions to suppress, but cite the standard as the authority.
>
> Return JSON:
> ```json
> {
>   "file": "...",
>   "adjudications": [{"antiPatternId":"...","line":0,"verdict":"confirmed|exempt|false-positive|needs-review","severity":"critical|warning|needs-review","reason":"...","consequence":"...","fix":"...","attribution":"introduced|pre-existing"}],
>   "aiOnlyFindings": [{"wcag":"...","level":"A|AA|AAA","line":0,"severity":"...","defect":"...","consequence":"...","fix":"...","attribution":"..."}]
> }
> ```

## Step 5 — Aggregate

Merge the subagent results. Drop `false-positive` verdicts from the body (keep them in the counts). Keep `exempt` verdicts visible as ⚪ — suppression is never silent.

Sort within each file: 🔴 introduced → 🔵 → 🟡 → pre-existing → ⚪ exempt.

## Step 6 — Report

Follow `references/report-format.md` exactly.

The header must always declare:

- Which stages ran, and which were skipped (linter missing, tokens not configured).
- In degraded mode: `⚠️ Token system not configured — 4 checks not executed: token reference flow, hardcoded colour → token suggestion, documented token exemptions, motion token override.`
- The active exemption count. Above `exemptionWarningThreshold` (default 15), open the report with a warning that the project is accumulating silenced debt.

A report that is silent about what it did not check implies a broader guarantee than was made. Always state the gaps.

After each file's findings, emit that file's **suggested fix prompt** — one aggregated prompt per file, addressed to a coding agent, ending with:

```
Do not change visual appearance. Do not add exemptions.
```

That last line is not optional. Without it, an agent handed a blocking check will sometimes "fix" the failure by writing an exemption.

## Step 7 — Verdict

```
BLOCKING   → one or more 🔴 with attribution "introduced"
PASS       → everything else
```

Pre-existing 🔴, 🟡, and 🔵 never block. This is what makes the check safe to switch on over an existing codebase: the first run surfaces the accumulated debt without freezing the team.

Print the verdict and stop. **This is where your job ends, in both modes.**

You never post the PR comment, never call `gh`, and never write `report.md`. Your entire output is the report on stdout. In CI the workflow captures that stdout, posts it as a PR comment (updating in place, never appending), and sets the check status by grepping your verdict line — all in steps that run after you, with their own credentials.

So do not report a missing `GITHUB_TOKEN`, an unavailable `Write` tool, or an unposted comment as a problem: none of those are yours to have. Treating them as failures produces a report that claims the integration is broken when it is working.

## Failure handling

If the review cannot complete — API error, timeout, malformed output — retry twice, then **fail open with a visible notice**:

> ⚠️ Accessibility review did not run: [error]. This PR has not been checked.

An outage is not an accessibility violation. But a silent pass is worse than a loud failure: never let a PR appear reviewed when it was not.
