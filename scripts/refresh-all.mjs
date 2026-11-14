#!/usr/bin/env node

/**
 * Run every `refresh:*` script in package.json, one after another.
 *
 * The weekly workflow (.github/workflows/refresh-data.yml) runs this, and it
 * can be run by hand (`pnpm refresh:all`). The list is read from package.json
 * so a new refresh script is picked up without editing anything here.
 *
 * One upstream page being down must not cost the other datasets their
 * refresh, so a failing script is recorded, whatever it wrote under
 * `src/data` is put back, and the run carries on. The exit code is 0 unless
 * `--strict` is passed; the report says what failed either way.
 *
 * Writes a Markdown report to `refresh-report.md` in the directory named by
 * `RUNNER_TEMP` (or the OS temp directory), and to the GitHub step summary
 * when there is one.
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DATA_DIR = 'src/data';
const strict = process.argv.includes('--strict');

const scripts = Object.keys(JSON.parse(readFileSync('package.json', 'utf8')).scripts)
  .filter((name) => name.startsWith('refresh:') && name !== 'refresh:all')
  .sort();

const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });
const changedFiles = () =>
  git('status', '--porcelain', '--', DATA_DIR)
    .stdout.split('\n')
    .filter(Boolean)
    .map((line) => ({ untracked: line.startsWith('??'), path: line.slice(3) }));

const results = [];

for (const name of scripts) {
  const before = new Set(changedFiles().map((file) => file.path));
  const started = Date.now();
  const run = spawnSync('pnpm', ['-s', name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const seconds = Math.round((Date.now() - started) / 1000);
  const touched = changedFiles().filter((file) => !before.has(file.path));
  const ok = run.status === 0;

  if (!ok) {
    for (const file of touched) {
      if (file.untracked) git('clean', '-fq', '--', file.path);
      else git('checkout', '-q', '--', file.path);
    }
  }

  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`.trim().split('\n');
  results.push({
    name,
    ok,
    seconds,
    changed: ok ? touched.map((file) => file.path) : [],
    last: output.at(-1) ?? '',
  });
  console.log(`${ok ? 'ok    ' : 'FAILED'} ${name} (${seconds}s)${ok && touched.length ? `: ${touched.length} file(s) changed` : ''}`);
  if (!ok) console.log(output.slice(-15).join('\n'));
}

const failed = results.filter((result) => !result.ok);
const report = [
  '| Script | Result | Files changed | Time |',
  '|---|---|---|---|',
  ...results.map(
    (result) =>
      `| \`${result.name}\` | ${result.ok ? 'ok' : '**failed**'} | ${
        result.changed.length ? result.changed.map((path) => `\`${path}\``).join('<br>') : '—'
      } | ${result.seconds}s |`
  ),
  '',
  ...(failed.length
    ? [
        'Failed scripts left their data as it was. Last line of output from each:',
        '',
        ...failed.map((result) => `- \`${result.name}\`: ${result.last}`),
        '',
      ]
    : []),
].join('\n');

writeFileSync(join(process.env.RUNNER_TEMP ?? tmpdir(), 'refresh-report.md'), report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Data refresh\n\n${report}\n`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `failed=${failed.length}\n`);

process.exit(strict && failed.length ? 1 : 0);
