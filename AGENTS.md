# AGENTS.md — SystemMx Backend

Instrucciones para agentes de IA (Claude Code, Codex, Antigravity, Gemini). Las personas del equipo son responsables de todo cambio.

## Proyecto
API REST de inventario, compras, pedidos, ventas y reportes. NestJS 11, TypeORM, JWT + Argon2id, helmet, throttler. Node 22. Producción: Render + Neon (Postgres); desarrollo local: SQL Server. **La fuente de verdad del comportamiento es el código**, no `docs/backend-api-matrix.md` (desactualizado: documenta 3 roles; el código tiene 4 + DEMO).

## Base de conocimiento (`docs/conocimiento/`)
| Archivo | Contenido |
|---|---|
| `flujos.md` | Flujos críticos F1 (autenticación/sesión), F2 (venta y pago), F3 (usuarios y roles) con criterios Dado/Cuando/Entonces |
| `arquitectura-y-permisos.md` | Componentes, datos sensibles y tabla actor/rol → recurso → acción → condición |
| `amenazas.md` | Amenazas T-xx (STRIDE) y medidas M-xx con comprobación y responsable |
| `dudas-abiertas.md` | Preguntas sin respuesta y su responsable |
| `registro-hallazgos.md` | Cómo se registran hallazgos (H-n) y excepciones (E-n) en GitHub Issues |

**Regla:** antes de modificar F1, F2 o F3, consulta sus requisitos, permisos, amenazas y medidas, y verifica que el cambio no los viole. Si los cambia, actualiza esa documentación en el mismo PR.
**Si falta información de permisos o comportamiento: registra la duda en `docs/conocimiento/dudas-abiertas.md` y detente. No asumas.**
(Si `docs/conocimiento/` aún no existe en tu rama, pertenece al Integrante 1: trátalo como duda abierta.)

## Comandos
```bash
npm ci                # instalar con lockfile
npm run lint:ci       # ESLint SIN --fix (usa este para verificar; `npm run lint` modifica archivos)
npm run build
npm test
npm run check         # lint:ci + build + test + Gitleaks + Semgrep (reportes en reports/)
```

## Al terminar una tarea
Ejecuta `npm run check` y corrige hasta que pase, **máximo 3 intentos**. Si persiste, detente y reporta qué falla (en Claude Code el hook `Stop` lo impone; en otros agentes esta instrucción es el único mecanismo — limitación declarada).

## Convenciones
- Ramas `feat/<ítem>-<tema>` o `docs/<ítem>-<tema>` desde `development`; todo cambio entra por PR hacia `development` (y de ahí a `main`). Nunca commits directos a `main`/`development`.
- Conventional Commits (`feat(ci): ...`, `test(authz): ...`, `docs(conocimiento): ...`).
- Cada PR indica ítem que cubre, ID de flujo/amenaza/hallazgo, comandos ejecutados con resultado y qué quedó fuera.
- Un PR lo aprueba una persona distinta al autor.

## Límites del agente (aplicados además por `.claude/settings.json`)
- No leer ni escribir `.env*`, claves (`*.pem`, `*.key`) ni secretos. Si necesitas un secreto, detente y pide a una persona que lo configure (GitHub Actions secrets / variables de Render); nunca lo pidas en el prompt ni lo escribas en archivos.
- No editar `.github/workflows/**`, `.claude/**`, `scripts/check.mjs`, `.gitleaks.toml`, `.semgrep/**`, `.github/CODEOWNERS`: los cambia una persona.
- Ediciones en pruebas (`test/**`, `*.spec.ts`) requieren confirmación humana. **Nunca cambies la expectativa de una prueba para que coincida con el código**; si el código incumple, reporta el hallazgo.
- No desactivar controles (hooks, lint, Semgrep, Gitleaks), no `--no-verify`, no `push --force`, no push a `main`.
- No aprobar ni fusionar PR (`gh pr review`, `gh pr merge`). No `curl`/`wget`.
- Migraciones inmutables (crear una nueva, nunca editar una aplicada); `synchronize: false`.
- Datos y cuentas de prueba siempre ficticios; nada contra producción.
