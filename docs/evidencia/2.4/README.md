# Evidencia ítem 2.4 — Hook Stop que conecta el agente con las comprobaciones
- Responsable: Integrante 2 · Revisor: Integrante 3 · Fecha: 2026-11-08
- Qué cubre: `.claude/settings.json` registra un hook `Stop` → `.claude/hooks/stop-check.mjs`, que ejecuta `npm run check`.
  - Pasa → exit 0 y contador reiniciado.
  - Falla (<3) → resumen truncado (3500 caracteres) por **stderr** + **exit 2**, que Claude Code devuelve al agente como motivo para seguir.
  - Falla (3.ª vez, por `session_id`) → escribe `reports/BLOQUEO.md`, mensaje "requiere intervención humana" y **exit 0** (sin bucle).
  - Sin cambios en el árbol de trabajo → no ejecuta nada (turnos de solo conversación).
  - Cada ejecución queda en `reports/hook-log.jsonl`.
- Qué NO cubre / límites: además de la invocación manual con JSON de evento Stop (ver abajo), el ciclo completo con un agente real se grabó en vivo (sección "Ciclo en vivo"). Agentes sin hooks (Codex, Antigravity, Gemini) solo tienen la instrucción de `AGENTS.md`.
- Reproducir (simulación manual; ojo: `no-unused-vars` fue `warn` en producción desde #31 hasta el PR #48 y por eso ya no falló en la grabación; usar el defecto de tipos de la sección "Ciclo en vivo"): crear `src/tmp-lint-demo.ts` con `const sinUsarDemo = 1;`, ejecutar tres veces `echo '{"session_id":"x"}' | node .claude/hooks/stop-check.mjs`, borrar el archivo y repetir.
- Resultado observado (`salida-hook.txt`, `hook-log.jsonl`, `BLOQUEO-ejemplo.md`):
  - Stop #1 y #2: exit=2, stderr con `'sinUsarDemo' is assigned a value but never used` (intentos 1/3 y 2/3).
  - Stop #3: exit=0 + `BLOQUEADO: check falló 3 veces` y `BLOQUEO.md` generado.
  - Stop #4 (error eliminado, sesión nueva): exit=0, `result: pass`.
- Cambio relacionado: Semgrep en Docker ahora copia el código dentro del contenedor (de ~9 min a ~7 s), necesario para que el hook sea usable (`check` completo ≈ 40 s).
- Revisión humana: el hook y esta evidencia entraron a `development` con el PR #33 (revisor del ítem: Integrante 3); esta ampliación (ciclo en vivo) va en un PR aparte, pendiente de revisión.

## Ciclo en vivo (agente real corrigiendo solo)
- **Fecha y ejecución:** 2026-11-12 ~18:25–18:27 (hora de Costa Rica; en el log: 2026-11-13T00:26Z). Ejecutó: Integrante 2 · Herramienta: Claude Code, sesión nueva abierta en la carpeta del backend con permisos en modo por defecto · Rama de trabajo: `docs/2-ciclo-hook-evidencia` (creada desde `development`).
- **Preparación:** contador (`.claude/.stop-attempts.json`) y bitácora (`reports/hook-log.jsonl`) borrados; `npm run check` pasaba completo (5/5) antes de sembrar el defecto. Defecto sembrado por una persona, sin commit: `src/tmp-demo-ciclo.ts` con `export const edadDemo: number = 'veinte';` (error de tipos que rompe el paso `build` con TS2322; se comprobó antes que lo hace). Se cambió el defecto de lint de la primera tentativa porque `no-unused-vars` era solo `warn` en producción y no bloqueaba (hallazgo; corrección en PR #48).
- **Instrucción dada al agente (sin mencionar el defecto):** "Revisa git status y dime en una frase qué archivos hay sin commitear. No modifiques nada todavía."
- **Qué ocurrió (según `hook-log-ciclo-vivo.jsonl` y el estado final del repositorio):**
  1. El agente terminó su turno y el hook ejecutó `npm run check`, que falló: entrada `result: fail`, `attempts: 1` (de 3), `stop_hook_active: false`, a las 00:26:05Z.
  2. El agente recibió el motivo por stderr y **corrigió el archivo** (`'veinte'` → `20`; no lo borró ni tocó pruebas, reglas ni configuración).
  3. Al terminar de nuevo, el chequeo pasó: entrada `result: pass` a las 00:27:39Z (≈ 1 min 34 s después). Intentos usados: 1 de 3. El contador quedó reiniciado (`{}`) y no se generó `reports/BLOQUEO.md`.
- **Evidencia:** `docs/evidencia/2.4/hook-log-ciclo-vivo.jsonl` (secuencia `fail` → `pass`); video de la grabación (carpeta de Drive con acceso por enlace, archivo `Desktop 2026.11.12 - 18.25.15.02.mp4`): https://drive.google.com/drive/folders/1bMi8nFRkE-vI7tFbDEa6957tjTS21s5S?usp=sharing (no se sube al repositorio). El texto exacto del error devuelto al agente se ve en el video; el log solo registra el resultado.
- **Limpieza:** `src/tmp-demo-ciclo.ts` eliminado; árbol de trabajo sin cambios residuales.

### Qué sigue sin cubrir
- Agentes sin hooks (Codex, Antigravity, Gemini) solo tienen la instrucción de `AGENTS.md`.
- Las reglas `deny` de `settings.json` frenan las herramientas Edit/Write del agente, pero no comandos de consola (p. ej. `cat >> .gitleaks.toml`); el respaldo es la revisión por CODEOWNERS.
- El ciclo se grabó con un defecto sembrado a propósito, no con un error surgido de una tarea real.
