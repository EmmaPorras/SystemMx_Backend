# Evidencia ítem 3.2 — Análisis de código, secretos y dependencias en CI

- **Responsable:** Integrante 3 (Joseth) · **Revisor:** Integrante 4 (Emma) · **Fecha:** 2026-11-10
- **Qué cubre / qué NO cubre (límites):**
  - **Qué cubre:** Implementación del job `security` en el workflow `.github/workflows/ci.yml`. Incluye la integración de tres herramientas de seguridad con versiones fijas y ejecución automatizada: 
    1. **Gitleaks v8.30.1:** Detección de secretos tanto en el árbol de trabajo (`gitleaks dir`) como en el historial completo de commits (`gitleaks git` con `fetch-depth: 0`) utilizando `.gitleaks.toml`.
    2. **Semgrep CE v1.184.0:** Análisis estático de código (SAST) evaluando los rulepacks recomendados (`p/typescript`, `p/nodejs`, `p/owasp-top-ten`) y reglas locales del proyecto (`.semgrep/`), configurado con `--error` y `--severity=ERROR` para fallar con código != 0 ante vulnerabilidades bloqueantes.
    3. **OSV-Scanner v1.9.2:** Análisis de composición de software (SCA) sobre `package-lock.json`, gestionando vulnerabilidades transitivas heredadas bajo la excepción documentada `E-01` en `osv-scanner.toml`.
    4. **Preservación de reportes:** Sube los reportes generados (`reports/`) como artefactos descargables (`security-reports-<SHA>`) con `upload-artifact` fijado por SHA.
  - **Qué NO cubre:** Análisis dinámico de seguridad (DAST), escaneo de contenedores en runtime ni pruebas de autorización Supertest (cubiertas en el Ítem 4.5).
- **Archivos modificados/creados:**
  - `.github/workflows/ci.yml` (implementación del job `security`)
  - `.gitleaks.toml` (configuración de Gitleaks y allowlist de pruebas/historial)
  - `.semgrep/inyeccion.yml` y `.semgrep/systemmx.yml` (reglas locales de Semgrep)
  - `osv-scanner.toml` (política y excepciones documentadas para dependencias)
  - `docs/evidencia/3.2/README.md` (documento de evidencia oficial)
- **Cómo reproducirlo (comandos exactos):**
  1. Abrir un Pull Request desde la rama `feat/3.2-ci-security` hacia `development`.
  2. Verificar que el workflow `CI` ejecute automáticamente el job `security`.
  3. Confirmar que Gitleaks escanee commits y árbol de trabajo con código de salida 0.
  4. Confirmar que Semgrep CE analice `src`, `test` y `scripts` sin errores bloqueantes.
  5. Confirmar que OSV-Scanner audite `package-lock.json` y aplique las excepciones vigentes de `osv-scanner.toml`.
  6. Confirmar la generación y subida del artefacto `security-reports-<SHA>`.
- **Resultado esperado vs observado:**
  - **Esperado:** El pipeline ejecuta las tres herramientas en un contenedor aislado, bloquea ante secretos expuestos o vulnerabilidades críticas no autorizadas, y genera los reportes correspondientes.
  - **Observado:** 
    - **Demostración de bloqueo:** En la ejecución de prueba controlada ([Run #42960987332](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42960987332) en PR #36), el job `security` falló en 6 segundos en el paso `Run Gitleaks` al detectar una credencial ficticia de AWS (`aws-access-token` en `src/security-test-leak.ts`), retornando código de salida 1 con 1 leak encontrado y bloqueando el merge en GitHub Actions. Esto evidencia que los controles de seguridad detienen eficazmente la integración ante fuga de secretos.
    - **Demostración de aprobación:** En la ejecución oficial de la rama `feat/3.2-ci-security` ([Run #42938085521](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42938085521) en [PR #34](https://github.com/EmmaPorras/SystemMx_Backend/pull/34)), todos los jobs (`quality`, `security`, `authz`, `build-image`) finalizaron en **VERDE (Success)**. Gitleaks, Semgrep CE y OSV-Scanner completaron con código 0 y se generó el artefacto descargable `security-reports-c2b5b668eff3ad8c63439bc326ad06436ac9ae9d` (34.4 KB) conteniendo los reportes SARIF y JSON.
- **Commit evaluado:** `692f1fb8a558db892db33012b6869b5a10e074c3`
- **Pull Request:** [PR #34 en GitHub](https://github.com/EmmaPorras/SystemMx_Backend/pull/34)
- **Run de Actions exitoso (verde):** https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42938085521
- **Run de Actions previo (bloqueo por fallo controlado):** https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42960987332
- **Artefactos generados:**
  - `security-reports-c2b5b668eff3ad8c63439bc326ad06436ac9ae9d` (34.4 KB)
  - `backend-image-c2b5b668eff3ad8c63439bc326ad06436ac9ae9d` (124 MB)
- **Revisión humana:** Pendiente de aprobación por Integrante 4 (Emma) en PR #34.
- **Hallazgos o excepciones relacionados:** Excepción E-01 (dependencias transitivas en `osv-scanner.toml`).

