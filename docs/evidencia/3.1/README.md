# Evidencia ítem 3.1 — Pipeline de CI para Pull Requests y ramas principales

- **Responsable:** Integrante 3 (Joseth) · **Revisor:** Integrante 4 · **Fecha:** 2026-11-09
- **Qué cubre / qué NO cubre (límites):**
  - **Qué cubre:** Creación del workflow `.github/workflows/ci.yml` que se ejecuta automáticamente en cada Pull Request y push hacia las ramas `development` y `main`. Implementa el principio de menor privilegio (`permissions: contents: read`), cancelación de ejecuciones redundantes (`concurrency`), fijación de acciones de terceros por SHA completo de commit para prevenir ataques a la cadena de suministro, y jobs con nombres estables (`quality`, `security`, `authz`, `build-image`). El job `quality` valida el código mediante instalación limpia (`npm ci` basado en `package-lock.json`), linter estricto sin autofix (`lint:ci`), compilación (`build`) y pruebas automatizadas (`test`). El job `build-image` empaqueta la imagen Docker inmutable etiquetada con el commit (`GIT_SHA`) y la guarda como artefacto descargable.
  - **Qué NO cubre:** El análisis estático de seguridad y dependencias (Semgrep, Gitleaks, OSV-Scanner cubiertos en el Ítem 3.2), la suite de pruebas de autorización con Supertest (cubierta en el Ítem 4.5) ni la publicación/despliegue a Docker Hub y Render (cubiertos por el Integrante 4 en 5.5 y 6.1).
- **Archivos modificados/creados:**
  - `.github/workflows/ci.yml` (definición del pipeline de integración continua)
  - `package.json` (adición del script `lint:ci` sin flag `--fix`)
- **Cómo reproducirlo (comandos exactos):**
  1. Abrir un Pull Request desde la rama de trabajo hacia `development`.
  2. Verificar en la pestaña de *Actions* de GitHub que se inicie automáticamente el workflow `CI`.
  3. Confirmar que el job `quality` complete en verde: `npm ci` -> `npm run lint:ci` -> `npm run build` -> `npm test`.
  4. Confirmar que el job `build-image` construya la imagen usando el `Dockerfile` del proyecto y suba el artefacto `backend-image-<SHA>`.
- **Resultado esperado vs observado:**
  - **Esperado:** El workflow se ejecuta en un contenedor Ubuntu aislado, aplica los estándares de calidad definidos y genera el artefacto de imagen candidata sin exponer credenciales ni permitir saltarse fallos.
  - **Observado:** (Enlazar aquí el run de GitHub Actions una vez subido el PR).
- **Commit evaluado:** (Registrar el SHA del commit del PR).
- **Run de Actions:** (Enlace al run en GitHub Actions).
- **Revisión humana:** (Enlace al PR en GitHub con la aprobación del Integrante 4).
- **Hallazgos o excepciones relacionados:** Ninguno.
