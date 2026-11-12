# Evidencia ítem 2.3 — Semgrep CE y Gitleaks en desarrollo
- Responsable: Integrante 2 · Revisor: Integrante 3 · Fecha: 2026-11-08
- Qué cubre: `npm run check` ejecuta Gitleaks v8.30.1 (árbol de trabajo, `--redact`) y Semgrep CE 1.184.0 (`p/typescript`, `p/nodejs`, `p/owasp-top-ten` + `.semgrep/`, `--metrics=off`, bloquea `ERROR`) sobre `src`, `test`, `scripts`. Falla si una herramienta no puede ejecutarse.
- Qué NO cubre: Semgrep no hace análisis de flujo de datos completo (las reglas del registro NO detectaron `eval(req.query...)`; se añadió la regla propia `systemmx-eval-dinamico`). Gitleaks solo ve patrones/entropía. El historial se escanea aparte con `gitleaks git`.
- Archivos: `scripts/check.mjs`, `.gitleaks.toml`, `.semgrep/inyeccion.yml`, `.semgrep/systemmx.yml`, README (sección Calidad y seguridad local).
- Reproducir: `npm run check -- --only=gitleaks,semgrep` (requiere Docker Desktop o binarios).
- Demostración: se creó `src/tmp-defecto-demo.ts` (eval sobre parámetro + token ficticio aleatorio con formato `ghp_`), sin commit.
  - Con defecto: `salida-con-defecto.txt` → gitleaks FAIL (1 hallazgo), semgrep FAIL (`systemmx-eval-dinamico` línea 5), exit=1.
  - Archivo borrado: `salida-sin-defecto.txt` → ambos OK, exit=0.
- Hallazgos reales / falsos positivos (para registrar como H-n en Issues, ítem 7.5):
  - 16 coincidencias `generic-api-key` en `*.spec.ts` (contraseñas ficticias de prueba) → falso positivo, allowlist limitada a esa regla y a specs.
  - `.env` local: no versionado (`git log --all -- .env` vacío); excluido del escaneo del árbol.
  - Historial: 1 coincidencia en `README.md:5` del commit `ecfa4feb` (probable enlace de insignia CircleCI) → falso positivo probable, pendiente de confirmar.
- Limitación: Semgrep en Docker sobre Windows tarda ~9 min; en CI debería ser mucho menor.
- Revisión humana: pendiente (PR aprobado por Integrante 3).

## Justificación del falso positivo H-44 (README.md:5, commit ecfa4feb)
- **Qué es:** la definición del enlace `[circleci-image]` (URL de la insignia de CircleCI de `nestjs/nest`, con un parámetro de ejemplo de 12 caracteres) del README plantilla de NestJS, presente desde el primer commit del repositorio (`ecfa4feb`, "Primer commit", 2026-07-05). Pertenece a una insignia de estado del proyecto `nestjs/nest`, no a este proyecto.
- **Por qué no es un secreto:** el valor es un marcador de ejemplo de la plantilla oficial de NestJS (letras y dígitos consecutivos de muestra), no una credencial; la insignia ni siquiera apunta a un servicio de este equipo. Regla que lo marca: `generic-api-key` (coincidencia por la palabra "token" en la URL).
- **Tratamiento:** allowlist por commit en `.gitleaks.toml` (`commits = ["ecfa4feb..."]`), de alcance mínimo: no exime archivos ni reglas, solo ese commit. El resto del historial sigue escaneándose.
- **Verificación:** `gitleaks git` sobre el historial completo devolvió 1 coincidencia (esta); tras la allowlist, 0.

## Por qué el PR toca `src/` y `eslint.config.mjs` (no cambia reglas de negocio)
Estos cambios existen para que `npm run check` (ítem 2.3/2.4) pueda pasar de forma honesta:
- `src/bootstrap/configure-app.ts`: se tipa `httpAdapter.getInstance()` (antes `any`) para quitar 4 errores `no-unsafe-*`. Misma llamada `instance.set('trust proxy', 1)`; sin cambio de comportamiento.
- `src/modules/usuarios/usuarios.service.ts`: se elimina un import sin uso (`resolveSqlExpr`) y `mailError` pasa de `any` a `unknown` con `instanceof Error ? mailError.message : String(mailError)`. El mensaje de error es el mismo; no cambia validaciones, permisos ni flujos.
- `eslint.config.mjs`: las reglas `no-unsafe-*` y afines pasan a `warn` **solo en `*.spec.ts` y `test/**`** (deuda registrada, ~300 avisos); producción mantiene `error`. Tras la integración de #31 en `development`, esta parte coincide con la relajación acordada allí.
- Ninguno toca controladores, guards, roles, ventas ni usuarios en su lógica; las 626 pruebas existentes siguen pasando.
