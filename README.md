# Accessibility Review Agent

Automated technical review of React components against WCAG 2.1/2.2 Level AA.

A judgment layer on top of deterministic tooling: linters handle what is mechanically decidable, this agent handles what depends on intent, context, and cross-file structure.

Design rationale for every decision: [`DESIGN.md`](./DESIGN.md).

---

## Layout

This repo is both the agent and its own demo/evaluation target — the skill lives at `.claude/skills/`, the fixture components it reviews live at `src/components/`, exactly as they would in a real project that adopted it.

```
.
├── DESIGN.md                          Design document — read this first
├── EXPECTED.md                        Ground truth for the fixture — do not show the agent
├── EVAL-RUN-1.md, EVAL-RUN-2.md        Evaluation results and variance analysis
├── .claude/skills/a11y-review/
│   ├── SKILL.md                       Orchestration: scope → lint → scan → judge → report
│   ├── references/
│   │   ├── anti-patterns.json         18 anti-patterns, fixed across projects
│   │   └── report-format.md           Output contract
│   └── scripts/
│       └── scan-patterns.mjs          Stage 2 — deterministic pattern scan
├── src/components/                    8 component pairs, conforming / violating
├── tokens/a11y.json                   Design tokens with $a11y metadata
├── a11y-agent.config.json             Project configuration
├── a11y-exceptions.json               Recorded human decisions
├── a11y-patterns.json                 Project-specific anti-patterns
└── .github/workflows/a11y-review.yml  CI integration
```

Two branches: `main` holds the conforming components, `demo/violating-components` adds the violating variants — the diff between them is the demo, and also the source of the PR used to test CI.

## Install in another repository

Copy the skill directory into the target repository:

```bash
mkdir -p .claude/skills && cp -r .claude/skills/a11y-review /path/to/target-repo/.claude/skills/
```

Add `a11y-agent.config.json` at the repository root. Every field is optional — with none of them, the agent runs in degraded mode and says so in the report.

```json
{
  "tokens": "./tokens/a11y.json",
  "exceptions": "./a11y-exceptions.json",
  "customAntiPatterns": "./a11y-patterns.json",
  "reportLanguage": "en",
  "exemptionWarningThreshold": 15
}
```

## Run

Locally, before pushing:

```bash
/a11y-review
```

On a specific path:

```bash
/a11y-review src/components/Card.tsx
```

The deterministic scan on its own, without the AI stage:

```bash
node .claude/skills/a11y-review/scripts/scan-patterns.mjs --base main
```

In CI: the workflow triggers on every push to a branch with an open PR, posts the report as a PR comment updated in place, and fails the check only on critical findings **introduced by that PR**.

## How it works

| Stage | What runs | Output |
|---|---|---|
| 1 | `eslint-plugin-jsx-a11y`, if installed | Rule violations |
| 2 | `scan-patterns.mjs` against the catalogue | Candidates |
| 3 | One AI subagent per file, in parallel | Adjudications + findings the patterns missed |

Stage 3 must return a verdict on **every** candidate — `confirmed`, `exempt`, `false-positive`, or `needs-review` — and may add findings of its own, marked `ai-only`. That last category is the agent's reason to exist over a grep script, and the report labels it so the marginal value stays visible on every run.

### Severity

| Level | Meaning | Blocks merge |
|---|---|---|
| 🔴 Critical | Level A/AA violated with certainty | Yes, if introduced by this PR |
| 🟡 Warning | Best practice/AAA, or A/AA with material uncertainty | No |
| 🔵 Needs review | Human judgment required | No |

Pre-existing findings never block. This is what makes the check safe to switch on over an existing codebase: the first run produces a debt baseline instead of freezing the team.

The agent is tuned **conservative on red, generous on blue**. A blocking false positive is the one error the tool does not recover from; a false negative is absorbed by the manual checklist that already exists.

## Exemptions

Two levels, no duplication:

- **Token-level** — already modelled in `$a11y.exempt` / `$a11y.exemptReason` in the token file.
- **Component-level** — `a11y-exceptions.json`, keyed by **file + component + WCAG criterion**, never by line number, which drifts on the first refactor.

`reason` and `approvedBy` are mandatory. An exemption without a written reason is worth nothing in a client audit — and because the override lands in the PR diff, it is reviewed like any other change. That is what makes a blocking check safe: unblocking is always possible, but only in writing.

Every report header shows the active exemption count. Above the configured threshold it opens with a warning that the project is accumulating silenced debt.

## Validating before client use

The fixture is both the demo target and the evaluation set. `EXPECTED.md` holds the ground truth: 24 deliberate violations, 4 deliberately ambiguous cases that must come back 🔵, and 10 false-positive traps that must not be reported.

Run three times and score:

| Metric | Threshold |
|---|---|
| Recall on blocking A/AA | ≥ 90% |
| Blocking false positives | **0** |
| Ambiguity correctly deferred | 2 / 2 |
| Blocking-status variance | 🔵 only |

A single 🔴 on a false-positive trap fails the evaluation regardless of recall. See [`EVAL-RUN-1.md`](./EVAL-RUN-1.md) and [`EVAL-RUN-2.md`](./EVAL-RUN-2.md) for full results, including the two blocking-status flips run 2 found and what they imply for the severity rule (DESIGN.md §6.1).

### Demo

```bash
git checkout demo/violating-components
node .claude/skills/a11y-review/scripts/scan-patterns.mjs --base main
```

## Scope

**In scope:** static source analysis of `.tsx` / `.jsx`, direct imports at depth 1, HTML semantics, ARIA, keyboard and focus management, handler correctness, token adherence.

**Out of scope:** runtime and visual analysis, full import-graph traversal, standalone CLI, automatic fix application, Figma/design-side review. See DESIGN.md §12.
