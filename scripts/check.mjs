#!/usr/bin/env node
// Verificación local única: lint:ci, build, test, Gitleaks y Semgrep.
// Multiplataforma (Node). Sale con código != 0 si algo falla O NO PUDO EJECUTARSE.
// Uso: npm run check            (todo)
//      npm run check -- --only=gitleaks,semgrep   (subconjunto)
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Versiones fijadas (verificadas en nov-2026). Cambiarlas es un cambio revisado por CODEOWNERS.
const GITLEAKS_IMAGE = 'ghcr.io/gitleaks/gitleaks:v8.30.1';
const SEMGREP_IMAGE = 'semgrep/semgrep:1.184.0';
const SEMGREP_CONFIGS = ['p/typescript', 'p/nodejs', 'p/owasp-top-ten', '.semgrep/'];

const root = process.cwd();
const reportsDir = resolve(root, 'reports');
mkdirSync(reportsDir, { recursive: true });

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice(7).split(',') : null;
const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';

function run(cmd, args, opts = {}) {
  // shell solo en Windows para resolver .cmd; los argumentos son constantes del script.
  return spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    shell: isWin && cmd.endsWith('.cmd'),
    maxBuffer: 64 * 1024 * 1024,
    ...opts,
  });
}

function has(cmd, versionArg = '--version') {
  const r = run(cmd, [versionArg]);
  return !r.error && r.status === 0;
}

function dockerUp() {
  const r = run('docker', ['info']);
  return !r.error && r.status === 0;
}

// Cada paso devuelve { status: 'ok' | 'fail' | 'incompleto', output }
function npmStep(script) {
  return () => {
    const r = run(npm, ['run', script]);
    return { status: r.status === 0 ? 'ok' : 'fail', output: (r.stdout ?? '') + (r.stderr ?? '') + (r.error ? String(r.error) : '') };
  };
}

function gitleaksStep() {
  const report = resolve(reportsDir, 'gitleaks.json');
  const common = ['dir', '.', '--redact', '--no-banner', '--report-format', 'json', '--report-path'];
  let r;
  if (has('gitleaks', 'version')) {
    r = run('gitleaks', [...common, report]);
  } else if (dockerUp()) {
    r = run('docker', ['run', '--rm', '-v', `${root}:/repo`, '-w', '/repo', GITLEAKS_IMAGE, ...common, '/repo/reports/gitleaks.json']);
  } else {
    return { status: 'incompleto', output: 'Gitleaks no pudo ejecutarse: instala el binario o inicia Docker Desktop.' };
  }
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  // gitleaks: 0 = limpio, 1 = hallazgos; cualquier otro caso o error = no se pudo ejecutar.
  if (r.error || (r.status !== 0 && r.status !== 1)) return { status: 'incompleto', output: out + String(r.error ?? '') };
  return { status: r.status === 0 ? 'ok' : 'fail', output: out };
}

function semgrepStep() {
  const report = 'reports/semgrep.json';
  const configs = SEMGREP_CONFIGS.filter((c) => !c.endsWith('/') || existsSync(resolve(root, c))).flatMap((c) => ['--config', c]);
  const args = [
    'scan', ...configs, '--metrics=off', '--error', '--severity=ERROR',
    '--exclude=node_modules', '--exclude=dist', '--exclude=reports', '--exclude=coverage',
    '--json', `--output=${report}`, '--quiet', 'src', 'test', 'scripts',
  ];
  let r;
  if (has('semgrep')) {
    r = run('semgrep', args);
  } else if (dockerUp()) {
    r = run('docker', ['run', '--rm', '-v', `${root}:/src`, '-w', '/src', SEMGREP_IMAGE, 'semgrep', ...args]);
  } else {
    return { status: 'incompleto', output: 'Semgrep no pudo ejecutarse: instala semgrep o inicia Docker Desktop.' };
  }
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  // semgrep --error: 0 = limpio, 1 = hallazgos; otro código (2, ...) = error de ejecución.
  if (r.error || (r.status !== 0 && r.status !== 1)) return { status: 'incompleto', output: out + String(r.error ?? '') };
  return { status: r.status === 0 ? 'ok' : 'fail', output: out + summarizeSemgrep(resolve(root, report)) };
}

function summarizeSemgrep(path) {
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    return (data.results ?? [])
      .map((x) => `  [${x.extra?.severity}] ${x.check_id} ${x.path}:${x.start?.line}`)
      .join('\n');
  } catch {
    return '';
  }
}

const STEPS = [
  ['lint:ci', npmStep('lint:ci')],
  ['build', npmStep('build')],
  ['test', npmStep('test')],
  ['gitleaks', gitleaksStep],
  ['semgrep', semgrepStep],
];

const results = [];
for (const [name, fn] of STEPS) {
  if (only && !only.includes(name)) continue;
  process.stdout.write(`▶ ${name} ... `);
  const t0 = Date.now();
  let res;
  try {
    res = fn();
  } catch (e) {
    res = { status: 'incompleto', output: String(e) };
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`${res.status.toUpperCase()} (${secs}s)`);
  writeFileSync(resolve(reportsDir, `${name.replace(':', '-')}.log`), res.output ?? '');
  results.push({ name, ...res, secs });
}

console.log('\n=== Resumen de check ===');
for (const r of results) console.log(`${r.status === 'ok' ? '✔' : '✘'} ${r.name.padEnd(9)} ${r.status}`);
const bad = results.filter((r) => r.status !== 'ok');
for (const r of bad) {
  const tail = (r.output ?? '').trim().split('\n').slice(-25).join('\n');
  console.log(`\n--- ${r.name} (${r.status}) ---\n${tail}`);
}
writeFileSync(resolve(reportsDir, 'check-summary.json'), JSON.stringify({ at: new Date().toISOString(), results: results.map(({ name, status, secs }) => ({ name, status, secs })) }, null, 2));
// 'incompleto' cuenta como fallo: incompleto = no aprobado.
process.exit(bad.length === 0 && results.length > 0 ? 0 : 1);
