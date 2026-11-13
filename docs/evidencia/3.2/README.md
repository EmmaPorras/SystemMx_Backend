# Evidencia ítem 3.2 — Análisis de código, secretos y dependencias en CI

- **Responsable:** Integrante 3 (Joseth) · **Revisor:** Integrante 4 (Emma) · **Fecha:** 2026-11-10
- **Qué cubre / qué NO cubre (límites):**
  - **Qué cubre:** Implementación del job `security` en el workflow `.github/workflows/ci.yml`. Incluye la integración de tres herramientas de seguridad con versiones fijas, verificación de integridad SHA-256 para binarios descargados y ejecución automatizada: 
    1. **Gitleaks v8.30.1 (SHA-256 verificado):** Detección de secretos tanto en el árbol de trabajo (`gitleaks dir`) como en el historial completo de commits (`gitleaks git` con `fetch-depth: 0`) utilizando `.gitleaks.toml` y salida redactada (`--redact`). **Política de bloqueo:** cualquier secreto detectado fuera de la allowlist retorna código de salida `1` y bloquea el PR.
    2. **Semgrep CE v1.184.0:** Análisis estático de código (SAST) evaluando los rulepacks recomendados (`p/typescript`, `p/nodejs`, `p/owasp-top-ten`) y reglas locales del proyecto (`.semgrep/`) con `--metrics=off`, `--error` y `--severity=ERROR` sobre `src`, `test` y `scripts`. **Política de bloqueo:** hallazgos de severidad `ERROR` retornan código de salida `!= 0` y bloquean el PR; hallazgos `WARNING` se registran en el reporte SARIF sin bloquear.
    3. **OSV-Scanner v1.9.2 (SHA-256 verificado):** Análisis de composición de software (SCA) sobre `package-lock.json` en una única ejecución que genera `reports/osv-report.json`. **Política de bloqueo:** bloquea (`exit != 0`) ante cualquier vulnerabilidad detectada en `package-lock.json` que no cuente con una excepción vigente documentada en `osv-scanner.toml`.
    4. **Fallo por no ejecución ("incompleto = no aprobado"):** Si falla la descarga, la verificación `sha256sum -c` o la ejecución de cualquiera de las tres herramientas, el job termina con código `!= 0` y bloquea la integración.
    5. **Preservación de reportes:** Sube los reportes generados (`reports/`) como artefactos descargables (`security-reports-<SHA>`) con `upload-artifact` fijado por SHA (`if: always()`).
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
    - **Demostración de aprobación:** En la ejecución oficial de la rama `feat/3.2-ci-security` ([Run #43116848026](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/43116848026) en [PR #34](https://github.com/EmmaPorras/SystemMx_Backend/pull/34)), todos los jobs (`quality`, `security`, `authz`, `build-image`) finalizaron en **VERDE (Success)**. Gitleaks, Semgrep CE y OSV-Scanner completaron con código 0 con verificación de integridad SHA-256 en binarios descargados, se validó la excepción E-39 y se generaron los artefactos descargables conteniendo los reportes SARIF y JSON y la imagen candidata.
- **Commit evaluado:** `c4df876b6d51c72dfb7e5e3474d2fece349b142e`
- **Pull Request:** [PR #34 en GitHub](https://github.com/EmmaPorras/SystemMx_Backend/pull/34)
- **Run de Actions exitoso (verde):** https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/43116848026
- **Run de Actions previo (bloqueo por fallo controlado):** https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/42960987332
- **Artefactos generados:**
  - `security-reports-374ca6f0f46083c4cebf22ea79f23d1956f60074` (35.2 KB)
  - `backend-image-374ca6f0f46083c4cebf22ea79f23d1956f60074` (124 MB)
- **Revisión humana:** Aprobado en el [PR #34](https://github.com/EmmaPorras/SystemMx_Backend/pull/34) por `@EmmaPorras` (revisora asignada) y `@Gerald120904`, y fusionado en `development` (commit merge [`3339bd4`](https://github.com/EmmaPorras/SystemMx_Backend/commit/3339bd4), fusionado por `@Veldor09` el 2026-11-11).
- **Hallazgos o excepciones relacionados:** [H-38](https://github.com/EmmaPorras/SystemMx_Backend/issues/38) (hallazgo de dependencias transitivas en `package-lock.json`) y [E-39](https://github.com/EmmaPorras/SystemMx_Backend/issues/39) (solicitud de excepción temporal en `osv-scanner.toml`).

