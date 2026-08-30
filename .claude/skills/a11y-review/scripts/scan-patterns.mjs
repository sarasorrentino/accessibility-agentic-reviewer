#!/usr/bin/env node
/**
 * Stage 2 of the accessibility review pipeline: deterministic pattern scan.
 *
 * Produces CANDIDATES, not findings. Entries with requiresAiJudgment=true must
 * be adjudicated by the AI stage before they can appear in a report.
 *
 * Usage:
 *   node scan-patterns.mjs --base main            # scan the branch diff
 *   node scan-patterns.mjs --files a.tsx b.tsx    # scan specific files
 *   node scan-patterns.mjs --base main --json     # machine output only
 *
 * Output: JSON on stdout.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOGUE = resolve(__dirname, '../references/anti-patterns.json');

const COMPONENT_EXT = /\.(tsx|jsx)$/;
const SKIP = /(\.test\.|\.spec\.|\.stories\.|node_modules\/|\/dist\/|\/build\/|\.d\.ts$)/;

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const args = { base: null, files: [], config: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--base') args.base = argv[++i];
    else if (argv[i] === '--config') args.config = argv[++i];
    else if (argv[i] === '--files') {
      while (argv[i + 1] && !argv[i + 1].startsWith('--')) args.files.push(argv[++i]);
    }
  }
  return args;
}

// ---------------------------------------------------------------- git

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

/** Resolve the merge base so the diff describes the whole PR, not the last push. */
function mergeBase(base) {
  for (const ref of [base, `origin/${base}`]) {
    try {
      return sh(`git merge-base HEAD ${ref}`);
    } catch {
      /* try next */
    }
  }
  throw new Error(
    `Cannot resolve base branch "${base}". Pass --files explicitly, or check the branch exists.`
  );
}

function changedFiles(baseSha) {
  const out = sh(`git diff --name-only ${baseSha}...HEAD`);
  return out ? out.split('\n').filter(Boolean) : [];
}

/**
 * Line ranges added or modified in each file, so findings can be attributed to
 * this PR versus reported as pre-existing debt (DESIGN.md §5.2).
 */
function changedLineRanges(baseSha, file) {
  let diff;
  try {
    diff = sh(`git diff --unified=0 ${baseSha}...HEAD -- "${file}"`);
  } catch {
    return [];
  }
  const ranges = [];
  for (const line of diff.split('\n')) {
    const m = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
    if (m) {
      const start = Number(m[1]);
      const count = m[2] === undefined ? 1 : Number(m[2]);
      if (count > 0) ranges.push([start, start + count - 1]);
    }
  }
  return ranges;
}

const inRanges = (line, ranges) => ranges.some(([a, b]) => line >= a && line <= b);

// ---------------------------------------------------------------- scan

function loadCatalogue(configPath) {
  const base = JSON.parse(readFileSync(CATALOGUE, 'utf8'));
  const patterns = [...base.antiPatterns];

  let config = {};
  if (configPath && existsSync(configPath)) {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
    if (config.customAntiPatterns) {
      const customPath = resolve(dirname(configPath), config.customAntiPatterns);
      if (existsSync(customPath)) {
        const custom = JSON.parse(readFileSync(customPath, 'utf8'));
        for (const p of custom.antiPatterns ?? []) patterns.push({ ...p, custom: true });
      }
    }
  }
  return { patterns, config, catalogueVersion: base.version };
}

/** Default cap on matches per pattern per file, to keep the AI stage focused. */
const MAX_MATCHES_PER_PATTERN = 3;

/**
 * Scans the whole source rather than line by line: real JSX wraps its props
 * across lines, so a line-scoped regex misses most opening tags.
 */
function scanFile(file, patterns, ranges) {
  if (!existsSync(file)) return [];
  const source = readFileSync(file, 'utf8');

  // Precompute line-start offsets so a match index maps back to a line number.
  const lineStarts = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') lineStarts.push(i + 1);
  }
  const lineOf = (index) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (lineStarts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
  const textOfLine = (lineNo) =>
    source.slice(lineStarts[lineNo - 1], lineStarts[lineNo] ?? source.length).trim();

  const candidates = [];

  for (const ap of patterns) {
    if (ap.detection?.type !== 'pattern') continue;

    // JSX tags span lines: "s" lets . cross newlines, "m" keeps ^/$ per line.
    let re;
    try {
      re = new RegExp(ap.detection.pattern, 'gms');
    } catch {
      continue; // a malformed custom pattern must not break the run
    }

    const scope = ap.detection.scope ?? 'line';
    const cap = scope === 'file' ? 1 : ap.detection.maxMatches ?? MAX_MATCHES_PER_PATTERN;

    const seenLines = new Set();
    let matches = 0;
    let m;
    while ((m = re.exec(source)) !== null && matches < cap) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      const lineNo = lineOf(m.index);
      if (seenLines.has(lineNo)) continue;
      seenLines.add(lineNo);
      matches++;

      candidates.push({
        antiPatternId: ap.id,
        name: ap.name,
        wcag: ap.wcag,
        level: ap.level,
        severity: ap.severity,
        file,
        line: lineNo,
        scope,
        matchedText: textOfLine(lineNo).slice(0, 160),
        requiresAiJudgment: ap.detection.requiresAiJudgment === true,
        judgmentQuestion: ap.judgmentQuestion ?? null,
        why: ap.why,
        fix: ap.fix,
        checklistRef: ap.checklistRef ?? null,
        custom: ap.custom === true,
        attribution:
          ranges.length === 0 ? 'unknown' : inRanges(lineNo, ranges) ? 'introduced' : 'pre-existing',
      });
    }
  }
  return candidates;
}

// ---------------------------------------------------------------- main

function main() {
  const args = parseArgs(process.argv);
  const configPath = args.config ?? (existsSync('a11y-agent.config.json') ? 'a11y-agent.config.json' : null);
  const { patterns, config, catalogueVersion } = loadCatalogue(configPath);

  let files = args.files;
  let baseSha = null;
  const rangesByFile = {};

  if (files.length === 0) {
    const base = args.base ?? config.baseBranch ?? 'main';
    baseSha = mergeBase(base);
    files = changedFiles(baseSha);
  }

  files = files.filter((f) => COMPONENT_EXT.test(f) && !SKIP.test(f));

  const candidates = [];
  for (const file of files) {
    const ranges = baseSha ? changedLineRanges(baseSha, file) : [];
    rangesByFile[file] = ranges;
    candidates.push(...scanFile(file, patterns, ranges));
  }

  const tokensConfigured = Boolean(
    config.tokens && existsSync(resolve(dirname(configPath ?? '.'), config.tokens))
  );

  process.stdout.write(
    JSON.stringify(
      {
        catalogueVersion,
        baseSha,
        config: {
          path: configPath,
          tokensConfigured,
          tokens: config.tokens ?? null,
          exceptions: config.exceptions ?? null,
          customAntiPatterns: config.customAntiPatterns ?? null,
          exemptionWarningThreshold: config.exemptionWarningThreshold ?? 15,
          reportLanguage: config.reportLanguage ?? 'en',
        },
        files,
        changedLineRanges: rangesByFile,
        counts: {
          files: files.length,
          candidates: candidates.length,
          needsAiJudgment: candidates.filter((c) => c.requiresAiJudgment).length,
          deterministic: candidates.filter((c) => !c.requiresAiJudgment).length,
        },
        candidates,
      },
      null,
      2
    ) + '\n'
  );
}

try {
  main();
} catch (err) {
  process.stderr.write(`scan-patterns: ${err.message}\n`);
  process.exit(1);
}
