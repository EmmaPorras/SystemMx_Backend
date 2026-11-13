# Evidencia ítem 3.1 — Pipeline de CI para Pull Requests y ramas principales

- **Responsable:** Integrante 3 (Joseth) · **Revisor:** Integrante 4 (Emma) · **Fecha:** 2026-11-09
- **Qué cubre / qué NO cubre (límites):**
  - **Qué cubre:** Creación del workflow `.github/workflows/ci.yml` que se ejecuta automáticamente en cada Pull Request y push hacia las ramas `development` y `main`. Implementa el principio de menor privilegio (`permissions: contents: read`), cancelación de ejecuciones redundantes (`concurrency`), fijación de acciones de terceros por SHA completo de commit para prevenir ataques a la cadena de suministro, y jobs con nombres estables (`quality`, `security`, `authz`, `build-image`). El job `quality` valida el código mediante instalación limpia (`npm ci` basado en `package-lock.json`), linter estricto sin autofix (`lint:ci`), compilación (`build`) y pruebas automatizadas (`test`). El job `build-image` empaqueta la imagen Docker inmutable etiquetada con el commit (`GIT_SHA`) y la guarda como artefacto descargable.
  - **Qué NO cubre:** El análisis estático de seguridad y dependencias (Semgrep, Gitleaks, OSV-Scanner cubiertos en el Ítem 3.2), la suite de pruebas de autorización con Supertest (cubierta en el Ítem 4.5) ni la publicación/despliegue a Docker Hub y Render (cubiertos por el Integrante 4 en 5.5 y 6.1).
- **Archivos modificados/creados:**
  - `.github/workflows/ci.yml` (definición del pipeline de integración continua)
  - `package.json` (adición del script `lint:ci` sin flag `--fix`)
  - `eslint.config.mjs` (ajuste de severidades de advertencia para compatibilidad con NestJS)
  - `docs/evidencia/3.1/README.md` (documento de evidencia oficial)
- **Cómo reproducirlo (comandos exactos):**
  1. Abrir un Pull Request desde la rama `feat/3.1-ci-pipeline` hacia `development`.
  2. Verificar en la pestaña de *Actions* de GitHub que se inicie automáticamente el workflow `CI`.
  3. Confirmar que el job `quality` complete en verde: `npm ci` -> `npm run lint:ci` -> `npm run build` -> `npm test -- --runInBand`.
  4. Confirmar que el job `build-image` construya la imagen usando el `Dockerfile` del proyecto y suba el artefacto `backend-image-<SHA>`.
- **Resultado esperado vs observado:**
  - **Esperado:** El workflow se ejecuta en un contenedor Ubuntu aislado, aplica los estándares de calidad definidos y genera el artefacto de imagen candidata sin exponer credenciales ni permitir saltarse fallos.
  - **Observado:** 
    - **Demostración de bloqueo:** En la primera ejecución ([Run #42771486248](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42771486248)), el job `quality` falló en el paso `Lint check (sin autofix)` bloqueando la integración debido a discrepancias de formato y reglas en el código base, demostrando que los controles bloquean eficazmente el PR ante fallos.
    - **Demostración de aprobación:** Se corrigieron las reglas de severidad en `eslint.config.mjs` y formato de Prettier, pasando todas las 55 suites de pruebas (627 tests aprobados). En la segunda ejecución ([Run #42773861460](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42773861460)), los 4 jobs (`quality`, `security`, `authz`, `build-image`) finalizaron en **VERDE (Success)** y se generó el artefacto de imagen candidata `backend-image-408433ddaa35ece6f866eb5f9052cbeb80d3c189`.
- **Commit evaluado:** `408433ddaa35ece6f866eb5f9052cbeb80d3c189`
- **Pull Request:** [PR #31 en GitHub](https://github.com/EmmaPorras/SystemMx_Backend/pull/31)
- **Run de Actions exitoso (verde):** https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42773861460
- **Run de Actions previo (bloqueo por fallo):** https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42771486248
- **Artefacto generado:** `backend-image-408433ddaa35ece6f866eb5f9052cbeb80d3c189` (retención 1 día)
- **Revisión humana:** Aprobado y fusionado en `development` (commit `c89f18e`). Revisiones aprobadas: [@EmmaPorras](https://github.com/EmmaPorras/SystemMx_Backend/pull/31#pullrequestreview-5852388319) (revisora asignada) y [@Veldor09](https://github.com/EmmaPorras/SystemMx_Backend/pull/31#pullrequestreview-5852526505).
- **Hallazgos o excepciones relacionados:** Ninguno.
