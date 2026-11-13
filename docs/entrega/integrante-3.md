# Entrega — Integrante 3 (Integración Continua y Pruebas de Autorización)

- **Nombre:** Joseth Manuel Vargas Venegas
- **Cuenta de GitHub:** [@ROSHIII96](https://github.com/ROSHIII96)
- **Rol en el equipo:** Responsable de Integración (mantiene el pipeline, validación estricta de PRs y verificación de controles de calidad y seguridad).
- **Revisor oficial de mis ítems:** Integrante 4 (Emmanuel — [@EmmaPorras](https://github.com/EmmaPorras)).
- **Ítems como autor:**
  - **3.1:** Pipeline de CI Base (`.github/workflows/ci.yml` con `quality` y `build-image`).
  - **3.2:** Seguridad en CI (Semgrep CE, Gitleaks, OSV-Scanner y subida de reportes SARIF/JSON).
  - **4.5:** Pruebas de autorización basadas en datos (Supertest), BD efímera en CI y verificación de no-mutación.
- **Ítems como revisor oficial:**
  - **2.3, 2.4, 2.5:** Integrante 2 (Derek — [@Veldor09](https://github.com/Veldor09) en [PR #33](https://github.com/EmmaPorras/SystemMx_Backend/pull/33)).
- **Responsabilidades CODEOWNERS:** `/.github/workflows/`, `/.github/CODEOWNERS`, `/test/`, `/Dockerfile`, `/.dockerignore`.

---

## 1. Qué se hizo y dónde está la evidencia

| Ítem | Qué quedó implementado | Evidencia | PR y Commits |
|---|---|---|---|
| **3.1** | `.github/workflows/ci.yml`: Triggers en PR y push (`development`, `main`), menor privilegio (`permissions: contents: read`), concurrencia cancelable, acciones fijadas por SHA completo de commit. Job `quality` (`npm ci`, `lint:ci`, `build`, `test` con 55 suites y 627 tests) y job `build-image` (imagen candidata Docker inmutable de 124 MB guardada como artefacto). Demo de fallo por calidad superada. | [docs/evidencia/3.1/README.md](../evidencia/3.1/README.md) | [PR #31](https://github.com/EmmaPorras/SystemMx_Backend/pull/31) · Commit merge [`c89f18e`](https://github.com/EmmaPorras/SystemMx_Backend/commit/c89f18e) · Run verde [#42773861460](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42773861460) |
| **3.2** | Job `security` en `ci.yml`: Gitleaks v8.30.1 (`fetch-depth: 0`, binario verificado por SHA-256), Semgrep CE v1.184.0 (`--error`, `--severity=ERROR`, reglas TS/Node/OWASP + locales en `.semgrep/`), OSV-Scanner v1.9.2 con `osv-scanner.toml`. Subida de reportes SARIF/JSON (`if: always()`). Demostración de bloqueo por defecto SAST y secreto ficticio en CI. Trazabilidad con hallazgo **H-38** y excepción **E-39**. | [docs/evidencia/3.2/README.md](../evidencia/3.2/README.md) | [PR #34](https://github.com/EmmaPorras/SystemMx_Backend/pull/34) · Commit merge [`3339bd4`](https://github.com/EmmaPorras/SystemMx_Backend/commit/3339bd4) · Run verde [#43117322809](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/43117322809) · Run bloqueo [#42960987332](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42960987332) |
| **4.5** | Suite `test/authz/` ejecutable con `npm run test:authz`: Contenedor efímero `postgres:16-alpine` en CI con migraciones TypeORM (`migration:run:dist`). Matriz de permisos exhaustiva (`matriz-permisos.ts`) para 5 roles + sin sesión + token corrupto en flujos F1, F2, F3. Runner Supertest (`authz.e2e-spec.ts`) con verificación de no-mutación en BD tras rechazos 401/403. Reglas de dominio: último ADMIN (409), rotación de contraseña (401) y aislamiento DEMO (403). Demo de defecto controlado en CI. | [docs/evidencia/4.5/README.md](../evidencia/4.5/README.md) | [PR #41](https://github.com/EmmaPorras/SystemMx_Backend/pull/41) · Commit merge [`6222251`](https://github.com/EmmaPorras/SystemMx_Backend/commit/6222251d3edaf7f277b81a651d504286addfe367) · Run verde [#43126266549](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/43126266549) · Run post-merge dev [#43261646365](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/43261646365) · Run bloqueo [#43125318316](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/43125318316) |

---

## 2. Decisiones Técnicas y Justificación de Seguridad

1. **Principio de Menor Privilegio en Workflows:**
   - Se configuró `permissions: contents: read` a nivel global en `.github/workflows/ci.yml`. Ningún job puede escribir en el repositorio, modificar etiquetas, ni aprobar PRs automáticamente mediante el `GITHUB_TOKEN`.
2. **Inmutabilidad y Protección de Cadena de Suministro (Supply Chain Security):**
   - Todas las acciones de terceros (`actions/checkout`, `actions/setup-node`, `actions/setup-python`, `actions/upload-artifact`) están fijadas mediante su **hash SHA completo de commit** de 40 caracteres, acompañado de un comentario con el tag semántico verificado. Esto mitiga ataques de sustitución de tags maliciosos.
   - Los binarios externos descargados en CI (Gitleaks y OSV-Scanner) se validan mediante **checksums SHA-256** estrictos antes de su ejecución.
3. **Política de Bloqueo "Incompleto = No Aprobado":**
   - Los jobs de seguridad y calidad devuelven código de salida distinto de 0 (`exit 1`) no solo si encuentran hallazgos críticos, sino también si una herramienta no pudo descargarse o falló en su ejecución.
4. **Base de Datos Efímera en CI (Opción A):**
   - Se seleccionó la **Opción A** (contenedor de servicio PostgreSQL `postgres:16-alpine` en el runner de GitHub Actions). Las migraciones oficiales de TypeORM se ejecutan desde cero en limpio (`npm run migration:run:dist`), garantizando aislamiento total, determinismo e independencia entre corridas sin depender de bases de datos persistentes de desarrollo o producción.
5. **Comprobación de No-Modificación de Datos:**
   - La suite de pruebas de autorización no se limita a validar códigos HTTP 401/403. Tras cada intento de escritura denegado, se realizan consultas asincrónicas a la base de datos para certificar que el conteo de ventas no aumentó, que el stock en lotes no se redujo y que los roles de usuario no fueron alterados.
6. **Construcción de Imagen Única para Despliegue:**
   - El job `build-image` genera la imagen Docker candidata inmutable y la almacena como artefacto tar (`backend-image-${{ github.sha }}`) para que el job `release` de la etapa de operaciones la publique directamente en Docker Hub sin reconstruir el código, preservando la garantía criptográfica del artefacto evaluado.

---

## 3. Limitaciones Declaradas (Conformidad con la Sección 13)

- **Alcance SAST y SCA vs DAST:** Semgrep CE, Gitleaks y OSV-Scanner detectan secretos conocidos, patrones de código vulnerables y dependencias con CVEs públicas, pero no sustituyen un análisis dinámico en tiempo de ejecución (DAST / OWASP ZAP) ni auditorías de lógica de negocio avanzadas.
- **Entorno de Datos en Desarrollo vs CI/Producción:** En desarrollo local inicial el proyecto utilizó soporte de SQL Server / SQLite / PostgreSQL según configuración del desarrollador; en CI y Producción (Neon/Render) se estandarizó en PostgreSQL. Las pruebas de autorización corren al 100% en PostgreSQL.
- **Pruebas de Resiliencia bajo Red Insegura:** Quedaron fuera del alcance de este ciclo pruebas de latencia o inyección de fallas de red con Toxiproxy.

---

## 4. Uso de IA

- **Agente utilizado:** Antigravity / Codex (asistente de ingeniería de software y DevSecOps).
- **Licencia / Plan:** Entorno de asistencia técnica de Google DeepMind / OpenAI con uso autorizado para desarrollo académico y profesional.
- **Rol de la IA:** Asistencia en la generación de esqueletos de workflows en GitHub Actions, resolución de compatibilidad de dialectos SQL en scripts de seed de PostgreSQL y diseño de aserciones en Supertest.
- **Validación humana estricta:** Ninguna decisión de autorización o regla de seguridad fue delegada a la IA:
  - Todas las expectativas de permisos provienen exclusivamente de la matriz aprobada en `docs/conocimiento/arquitectura-y-permisos.md`.
  - Toda configuración y script fue ejecutado y validado localmente y en el pipeline de CI en GitHub Actions.
  - Las aprobaciones de código se realizaron exclusivamente entre integrantes humanos mediante Pull Requests y CODEOWNERS.

