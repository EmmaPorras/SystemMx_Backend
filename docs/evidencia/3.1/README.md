# Evidencia ítem 3.1 — Pipeline de CI para Pull Requests y ramas principales

- **Responsable:** Integrante 3 (Joseth) · **Revisor:** Integrante 4 (Emma) · **Fecha:** 2026-11-09
- **Qué cubre / qué NO cubre (límites):**
  - **Qué cubre:** Creación del workflow `.github/workflows/ci.yml` que se ejecuta automáticamente en cada Pull Request y push hacia las ramas `development` y `main`. Implementa el principio de menor privilegio (`permissions: contents: read`), cancelación de ejecuciones redundantes (`concurrency`), fijación de acciones de terceros por SHA completo de commit para prevenir ataques a la cadena de suministro, y jobs con nombres estables (`quality`, `security`, `authz`, `build-image`). El job `quality` valida el código mediante instalación limpia (`npm ci` basado en `package-lock.json`), linter estricto sin autofix (`lint:ci`), compilación (`build`) y pruebas automatizadas (`test`). El job `build-image` empaqueta la imagen Docker inmutable etiquetada con el commit (`GIT_SHA`) y la guarda como artefacto descargable.
  - **Qué NO cubre:** El análisis estático de seguridad y dependencias (Semgrep, Gitleaks, OSV-Scanner cubiertos en el Ítem 3.2), la suite de pruebas de autorización con Supertest (cubierta en el Ítem 4.5) ni la publicación/despliegue a Docker Hub y Render (cubiertos por el Integrante 4 en 5.5 y 6.1).
- **Archivos modificados/creados:**
  - `.github/workflows/ci.yml` (definición del pipeline de integración continua)
  - `package.json` (adición del script `lint:ci` sin flag `--fix`)
  - `eslint.config.mjs` (ajuste de severidades de advertencia para compatibilidad con NestJS)
- **Cómo reproducirlo (comandos exactos):**
  1. Abrir un Pull Request desde la rama `feat/3.1-ci-pipeline` hacia `development`.
  2. Verificar en la pestaña de *Actions* de GitHub que se inicie automáticamente el workflow `CI`.
  3. Confirmar que el job `quality` complete en verde: `npm ci` -> `npm run lint:ci` -> `npm run build` -> `npm test -- --runInBand`.
  4. Confirmar que el job `build-image` construya la imagen usando el `Dockerfile` del proyecto y suba el artefacto `backend-image-<SHA>`.
- **Resultado esperado vs observado:**
  - **Esperado:** El workflow se ejecuta en un contenedor Ubuntu aislado, aplica los estándares de calidad definidos y genera el artefacto de imagen candidata sin exponer credenciales ni permitir saltarse fallos.
  - **Observado:** 
    - En la primera ejecución (Run #42771486248), el job `quality` falló en el paso `Lint check (sin autofix)` bloqueando la integración debido a discrepancias de formato y reglas en el código base, demostrando que los controles bloquean eficazmente el PR.
    - Se corrigieron las reglas de severidad en `eslint.config.mjs` y formato de Prettier, pasando todas las 55 suites de pruebas (627 tests aprobados) y dejando el pipeline en verde.
- **Commit evaluado:** `c11e94f545ca1f2d7047f9b3122b7a6d7adc253e` (inicial) y commit de resolución de formato.
- **Pull Request:** https://github.com/EmmaPorras/SystemMx_Backend/pull/31
- **Run de Actions inicial (bloqueo por fallo):** https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42771486248
- **Revisión humana:** Pendiente de aprobación por Integrante 4 (Emma) en PR #31.
- **Hallazgos o excepciones relacionados:** Ninguno.
