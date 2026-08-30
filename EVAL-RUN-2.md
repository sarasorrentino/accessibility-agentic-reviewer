# Evaluation — Run 2 and variance vs Run 1

**Date:** 2026-08-29
**Configuration:** identical to run 1 — no pattern, fixture, or exception changes between runs, so the comparison is valid.
**Protocol change:** subagents wrote structured JSON to disk instead of returning prose, so variance is computed rather than eyeballed.

---

## 1. Variance on candidate verdicts

39 candidate verdicts compared across both runs.

| | |
|---|---|
| Identical verdict | **36 / 39 = 92.3%** |
| Divergent | 3 |
| **Divergences that flip blocking status** | **2 / 39 = 5.1%** |

| File | Candidate | Run 1 | Run 2 | Blocks? |
|---|---|---|---|---|
| `CardLegacy` | `raw-colour-utility@25` | 🔴 confirmed/critical | 🔵 needs-review | **flips** |
| `FormFieldLegacy` | `bare-input-outside-formfield@15` | 🔴 confirmed/critical | 🟡 confirmed/warning | **flips** |
| `CardLegacy` | `raw-colour-utility@24` | false-positive | 🟡 confirmed/warning | no |

**This fails the variance threshold**, which tolerates variance only on 🔵. Two findings changed whether they would block a merge. On a check that gates merges, the outcome of a PR can depend on which run it got.

Both flips are on the *same axis*: **severity assignment**, not detection. In every case both runs saw the same code and reached the same factual conclusion — they disagreed on how certain to be about it. `text-gray-400` is the clearest example: run 1 argued it fails 4.5:1 against a light surface and called it critical; run 2 argued the surface is not set in the file so the ratio is unresolvable and called it needs-review. Both arguments are defensible.

## 2. False positives — the hard gate holds

**Zero fabricated critical findings across both runs (34 file-reviews total).**

Two `ai-only` criticals appeared on "conforming" files in run 2 that run 1 had not raised at that severity. Both were verified by hand and both are **real defects in the fixture**, not false positives:

| File | Criterion | Defect | Run 1 | Run 2 |
|---|---|---|---|---|
| `Dropdown.tsx` | 4.1.2 (A) | No `aria-activedescendant`, no option ids, listbox never focused — `activeIndex` is invisible to assistive technology | 🟡 warning | 🔴 critical |
| `Toast.tsx` | 2.2.1 (A) | 5000ms auto-dismiss with no dismiss control, no pause-on-hover/focus, no way to extend | 🟡 warning | 🔴 critical |

Same pattern as §1: the defect is detected consistently, the severity is not.

All 10 false-positive traps in `EXPECTED.md` §C were passed in both runs, including the three exemptions.

## 3. Correction to an earlier reading

An intermediate comparison suggested `ModalLegacy` produced two `ai-only` criticals in run 1 and none in run 2, implying a recall collapse. **That reading was wrong.** Run 2 found the same defects — missing `role="dialog"`/`aria-modal`, no Escape handler, no focus restore — and classified them as `warning` and inside the candidate adjudication rather than as `ai-only` criticals. Nothing was missed.

This is a lesson about the metric, not the agent: counting `aiCritical` array lengths across runs measures *where a finding was filed and at what severity*, not whether it was found. Any future variance scoring must match findings on criterion + line, not on their bucket.

## 4. What this means for the design

The blocking policy (DESIGN.md §8.2) assumes 🔴 is a stable category. It is not, at 5% flip rate. Three options, in order of preference:

1. **Raise the bar for 🔴.** Require a finding to be critical *on the evidence available in the file* — if the judgment depends on information not present (the surrounding surface colour, the parent's markup), it is 🔵 by construction, never 🔴. Both flips in §1 are exactly this case, and this rule would have made both runs agree on 🔵.
2. **Block on the deterministic tier only.** `eslint` and pattern hits whose `requiresAiJudgment` is false do not vary at all. AI-only findings become advisory. This guarantees stability but discards most of the agent's value as a gate.
3. **Two-run consensus for 🔴.** Only findings critical in both of two independent passes block. Doubles cost, and does not remove variance so much as average it.

Option 1 is the cheapest and addresses the actual cause. It is a change to the subagent prompt, not to the architecture.

> **Adopted 2026-08-30.** Option 1 is now the rule, written into the subagent prompt in `SKILL.md` Step 4 as the *decidability test* and into `DESIGN.md` §6.1. Whether it actually removes the flips is unverified — that is what run 3 is for, and until run 3 measures it, the 5.1% figure above still stands as the last measurement.

## 5. Scores

| Metric | Threshold | Run 1 | Run 2 | |
|---|---|---|---|---|
| Recall on blocking A/AA | ≥ 90% | 100% | 100% | ✅ |
| Blocking false positives | 0 | 0 | 0 | ✅ |
| Fabricated findings | 0 | 0 | 0 | ✅ |
| Blocking-status variance | 🔵 only | — | **5.1%** | ❌ |

## 6. Execution note

Six of the 17 subagents in run 2 failed on first launch — an account session limit, one stall, and one host sleep. All six succeeded on retry with no change to their inputs. Worth recording because the CI design (DESIGN.md §8.4) specifies two retries then fail-open: this run is empirical evidence that transient failures are common enough at 17 parallel subagents that the retry path is load-bearing, not defensive decoration.

## 7. Run 3

Not yet executed. Given that runs 1 and 2 agree on *detection* and disagree only on *severity*, run 3's value is confirming the flip rate rather than discovering a new failure mode. Worth doing after the option-1 prompt change, to measure whether it actually removes the flips — which is a more useful experiment than a third measurement of the current behaviour.
