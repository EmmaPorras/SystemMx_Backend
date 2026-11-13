#!/usr/bin/env node
// Hook Stop de Claude Code: al terminar el agente ejecuta `npm run check`.
// Pasa -> exit 0. Falla (<3) -> stderr truncado + exit 2 (el agente corrige).
// Falla (>=3) -> reports/BLOQUEO.md + exit 0 (sin bucle). Sin cambios -> exit 0 sin ejecutar.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const MAX_ATTEMPTS = 3;
const MAX_CHARS = 3500;
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const reportsDir = resolve(root, 'reports');
const counterFile = resolve(root, '.claude', '.stop-attempts.json');
mkdirSync(reportsDir, { recursive: true });

const log = (e) =>
  appendFileSync(resolve(reportsDir, 'hook-log.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...e }) + '\n');
const load = () => { try { return JSON.parse(readFileSync(counterFile, 'utf8')); } catch { return {}; } };
const save = (c) => writeFileSync(counterFile, JSON.stringify(c, null, 2));

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { /* sin stdin */ }
const sid = input.session_id || 'sin-sesion';
const counters = load();

const git = spawnSync('git', ['status', '--porcelain', '--', '.', ':!reports'], { cwd: root, encoding: 'utf8' });
if (!git.error && git.status === 0 && git.stdout.trim() === '') {
  log({ sid, result: 'skip-sin-cambios' });
  process.exit(0);
}

const win = process.platform === 'win32';
const r = spawnSync(win ? 'npm.cmd' : 'npm', ['run', 'check'], { cwd: root, encoding: 'utf8', shell: win, maxBuffer: 64 * 1024 * 1024 });
const out = (r.stdout ?? '') + (r.stderr ?? '') + (r.error ? String(r.error) : '');

if (r.status === 0) {
  delete counters[sid]; save(counters); log({ sid, result: 'pass' });
  process.exit(0);
}

const attempts = (counters[sid] ?? 0) + 1;
const summary = out.length > MAX_CHARS ? '...(truncado)...\n' + out.slice(-MAX_CHARS) : out;

if (attempts >= MAX_ATTEMPTS) {
  writeFileSync(
    resolve(reportsDir, 'BLOQUEO.md'),
    `# Bloqueo: npm run check sigue fallando tras ${MAX_ATTEMPTS} intentos\n\n- Sesión: ${sid}\n- Fecha: ${new Date().toISOString()}\n- Reportes completos: reports/\n\n## Último resultado\n\n\`\`\`\n${summary}\n\`\`\`\n\nRequiere intervención humana.\n`,
  );
  log({ sid, result: 'bloqueo', attempts });
  delete counters[sid]; save(counters);
  process.stderr.write(`BLOQUEADO: check falló ${MAX_ATTEMPTS} veces. Ver reports/BLOQUEO.md. Requiere intervención humana.\n`);
  process.exit(0);
}

counters[sid] = attempts; save(counters);
log({ sid, result: 'fail', attempts, stop_hook_active: Boolean(input.stop_hook_active) });
process.stderr.write(`npm run check falló (intento ${attempts}/${MAX_ATTEMPTS}). Corrige sin debilitar pruebas ni controles:\n\n${summary}\n`);
process.exit(2);
