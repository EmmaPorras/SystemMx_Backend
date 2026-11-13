# Entrega — Integrante 2 (Desarrollo asistido por agente)

- Cuenta de GitHub: @Veldor09 · Revisor de mis ítems: Integrante 3 (@ROSHIII96); por CODEOWNERS también @Gerald120904.
- Ítems: **2.3** Semgrep CE y Gitleaks en desarrollo · **2.4** hook que conecta el agente con las comprobaciones · **2.5** límites de actuación del agente. Requisitos previos: 1.8 (`AGENTS.md`/`CLAUDE.md`) y 2.2 (comandos de calidad en README).

## Qué se hizo y dónde está la evidencia
| Ítem | Qué quedó | Evidencia | PR |
|---|---|---|---|
| 1.8 / 2.2 | `AGENTS.md`, `CLAUDE.md` (`@AGENTS.md`), `npm run lint:ci`, `npm run check`, sección "Calidad y seguridad local" del README | `AGENTS.md`, `README.md`, `scripts/check.mjs` | [#33](https://github.com/EmmaPorras/SystemMx_Backend/pull/33) |
| 2.3 | `.gitleaks.toml` (allowlist mínima), `.semgrep/` (regla propia `systemmx-eval-dinamico` bloqueante), versiones fijadas (Gitleaks 8.30.1, Semgrep 1.184.0). Demo: defecto + token ficticio → `check` falla; sin ellos pasa | `docs/evidencia/2.3/` | #33 |
| 2.4 | Hook `Stop` (`.claude/hooks/stop-check.mjs`): ejecuta `npm run check`, devuelve fallos por stderr con exit 2, 3 reintentos por sesión, `reports/BLOQUEO.md` al agotarlos | `docs/evidencia/2.4/` | #33, [#49](https://github.com/EmmaPorras/SystemMx_Backend/pull/49) |
| 2.5 | Permisos allow/ask/deny en `.claude/settings.json` + tabla de límites con su mecanismo y resultado observado | `docs/evidencia/2.5/` | #33, [#50](https://github.com/EmmaPorras/SystemMx_Backend/pull/50) |
| (apoyo) | Formato prettier, `lint:ci` y corrección de errores de lint | `docs/evidencia/` de 3.1 | [#32](https://github.com/EmmaPorras/SystemMx_Backend/pull/32) / #31 |
| (apoyo) | Producción vuelve a `error` en ESLint (las 7 reglas que estaban en `warn` global); `warn` solo en specs y `test/` | `eslint.config.mjs` | [#48](https://github.com/EmmaPorras/SystemMx_Backend/pull/48) (fusionado) |

## Decisiones y límites
- `npm run check` falla si una herramienta **no pudo ejecutarse** (incompleto = no aprobado).
- Semgrep en Docker/Windows tardaba ~9 min escaneando el bind-mount; se copia el código dentro del contenedor (~7 s).
- Las reglas del registro de Semgrep no detectaron `eval(req.query...)`; se añadió una regla propia. Semgrep y Gitleaks no sustituyen pruebas de autorización ni revisión humana.
- Hook demostrado de dos formas: invocándolo con el JSON de un evento Stop y con un **ciclo en vivo del agente** (falla → el hook devuelve el error → el agente corrige → pasa), grabado en video; ver `docs/evidencia/2.4/` (PR [#49](https://github.com/EmmaPorras/SystemMx_Backend/pull/49)). El defecto de la demo es un error de tipos que rompe `build`.
- Límites 1–7 de 2.5 se bloquearon en la prueba en vivo (algunos solo parcialmente: 4, 5, 6 y 7 no se probaron en todos sus casos). **Límite 8 comprobado** (2026-11-12): editar `*.spec.ts` pide confirmación; la prueba del 10-nov no la pidió porque esa sesión auto-aprobaba ediciones. **Límite 9 comprobado**: `npm install` y `git push` piden confirmación. **Límite 11 comprobado** por el Integrante 4 (cuenta `Veldor09` con permiso write, sin administración; capturas sin fecha). Las pruebas 8 y 9 se hicieron en modo «Aceptar ediciones» (PR [#50](https://github.com/EmmaPorras/SystemMx_Backend/pull/50)). El límite 10 (no debilitar pruebas, no asumir permisos) es solo documental.
- Los permisos del agente aplican a Claude Code; Codex/Antigravity/Gemini solo tienen la instrucción de `AGENTS.md` y las protecciones de rama.

## Uso de IA
- Agente: Claude Code (modelo Claude Sonnet 5.5) para redactar scripts, configuración y borradores de evidencia.
- Licencia/plan utilizado: Claude Plan Pro (suscripción mensual, individual, contratada por la persona integrante); aplican los términos de uso de Anthropic para ese plan.
- Validación: cada cambio se ejecutó localmente (`lint:ci`, build, 626 pruebas, Gitleaks, Semgrep) y se revisó por otra persona vía PR; los resultados de la demo están en `docs/evidencia/`.
