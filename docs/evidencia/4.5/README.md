# Evidencia ítem 4.5 — Pruebas de autorización y base de datos efímera en CI

- **Responsable:** Integrante 3 (Joseth) · **Revisor:** Integrante 4 (Emma) · **Fecha:** 2026-11-11
- **Qué cubre / qué NO cubre (límites):**
  - **Qué cubre:**
    1. **Fuente de verdad:** Codificación estricta de la tabla de permisos aprobada en `docs/conocimiento/arquitectura-y-permisos.md` (Sección 62) y los flujos críticos F1 (Autenticación y Sesión), F2 (Ventas y Pagos) y F3 (Administración de Usuarios y Roles) en `test/authz/matriz-permisos.ts`.
    2. **Peticiones directas con Supertest:** Pruebas contra la API HTTP montada sobre NestJS (`test/authz/authz.e2e-spec.ts`), garantizando que la protección no dependa de la interfaz gráfica ni de validaciones del cliente.
    3. **Evaluación de todos los roles del sistema:** Cobertura para los 5 roles del backend (`ADMIN`, `VENTAS`, `COMPRAS`, `CONSULTA`, `DEMO`), además de peticiones sin autenticación (`ANONIMO` -> 401) y tokens con firma inválida o malformados (`TOKEN_INVALIDO` -> 401).
    4. **Comprobación de no-modificación de datos:** Tras cada rechazo (HTTP 401/403) en operaciones mutantes (POST/PATCH), se verifica en la base de datos que el registro no fue creado, que los roles no fueron alterados y que el inventario disponible no sufrió reducciones.
    5. **Casos críticos del dominio:**
       - _Protección del último ADMIN:_ Rechazo con HTTP 409 Conflict al intentar desactivar o degradar al único administrador activo del sistema (F3-AC2).
       - _Revocación inmediata por rotación de credenciales:_ Un token JWT emitido antes de un cambio de contraseña o desactivación es rechazado con HTTP 401 al incrementar `versionCredenciales` (F1-AC4 / F3-AC5).
       - _Prevención de auto-elevación:_ Rechazo con HTTP 403 cuando un usuario `VENTAS` intenta asignarse rol `ADMIN` (F3-AC3).
       - _Aislamiento del rol DEMO:_ Acceso permitido a `/api/demo/resumen` y rechazo con HTTP 403 en todas las operaciones de escritura comerciales y administrativas.
    6. **Base de datos efímera en CI (Opción A):** Servicio `postgres:16-alpine` en el job `authz` de GitHub Actions (`.github/workflows/ci.yml`), ejecutando las migraciones oficiales (`npm run migration:run:dist`) y sembrando datos de prueba limpios sin depender de datos de producción ni de ejecuciones anteriores.
  - **Qué NO cubre:** Análisis dinámico automatizado de escaneo DAST (ZAP Framework, fuera del alcance mínimo), pruebas de estrés o concurrencia con latencia (Toxiproxy).
- **Archivos creados/modificados:**
  - `test/authz/matriz-permisos.ts` (matriz de control de acceso por endpoint y rol)
  - `test/authz/authz-test-helpers.ts` (helpers de inicialización, siembra y limpieza en BD efímera)
  - `test/authz/authz.e2e-spec.ts` (suite de pruebas con Supertest y comprobación de no-modificación)
  - `test/jest-authz.json` (configuración de Jest para la suite de autorización)
  - `package.json` (adición del script `test:authz`)
  - `.github/workflows/ci.yml` (configuración del job `authz` con contenedor de servicio PostgreSQL)
  - `docs/evidencia/4.5/README.md` (documento de evidencia oficial)
- **Decisión de base de datos efímera (Opción A):**
  - Se seleccionó la **Opción A** (servicio PostgreSQL en el job de CI) debido a que las migraciones de TypeORM del proyecto (`InitialSchema1788762385395`, etc.) contienen soporte nativo para el dialecto PostgreSQL, que es idéntico al motor relacional utilizado en producción en Neon / Render. El contenedor de servicio en GitHub Actions garantiza aislamiento total, ambiente reproducible y ejecución limpia en cada PR.
- **Cómo reproducirlo (comandos exactos):**
  1. **En CI (GitHub Actions):** Abrir un Pull Request hacia `development`. El workflow ejecuta el job `authz`, levanta el contenedor `postgres:16-alpine`, corre `npm run migration:run:dist` y ejecuta `npm run test:authz`.
  2. **En entorno local (con Docker o PostgreSQL iniciado):**
     ```bash
     # Con PostgreSQL corriendo en localhost:5432 con usuario test_user, pass test_password y db systemmx_authz:
     npm run build
     npm run migration:run:dist
     npm run test:authz
     ```
- **Resultado esperado vs observado:**
  - **Esperado:** Todas las peticiones directas a la API aplican la matriz de autorización aprobada: roles autorizados reciben 2xx, roles no autorizados reciben 403, peticiones sin sesión o con token corrupto reciben 401, y el último ADMIN está protegido con 409 Conflict. Los intentos de escritura denegados no alteran la base de datos.
  - **Observado:** Ejecución automatizada en el job `authz` en GitHub Actions completando exitosamente en verde con todas las aserciones de autorización y no-modificación superadas.
- **Commit evaluado:** [`e2a4e12e84d4fa7df802e3b2e3e57f12e9b04f7c`](https://github.com/EmmaPorras/SystemMx_Backend/commit/e2a4e12e84d4fa7df802e3b2e3e57f12e9b04f7c) en rama `feat/4.5-authz-tests`.
- **Pull Request:** [PR #41 (feat(authz): pruebas de autorizacion por rol con supertest y bd efimera en CI)](https://github.com/EmmaPorras/SystemMx_Backend/pull/41) hacia `development`.
- **Run de Actions exitoso (verde):** [Run #43124579323](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/43124579323)
  - Job `authz`: Completado exitosamente (`success`, exit code 0).
  - Resumen Jest: `Test Suites: 1 passed, 1 total; Tests: 101 passed, 101 total; Snapshots: 0 total; Time: 3.079 s`.
  - Base de datos: Contenedor efímero `postgres:16-alpine`, migraciones `npm run migration:run:dist` aplicadas al 100% en limpio.
- **Run de Actions previo (bloqueo por fallo controlado):** [Run #43125318316](https://github.com/EmmaPorras/SystemMx_Backend/actions/runs/43125318316)
  - Rama temporal desechable: `test/4.5-fallo-autorizacion` (Draft PR #42, cerrado y eliminado tras la demostración).
  - Defecto probado: Relajación indebida de control de acceso en `src/modules/usuarios/usuarios.controller.ts` añadiendo `@Roles(RolUsuario.ADMIN, RolUsuario.CONSULTA)` en `GET /api/usuarios`.
  - Comportamiento observado: La suite Supertest detectó que el rol `CONSULTA` recibió HTTP 200 en lugar del HTTP 403 estipulado en la matriz de permisos (`F3-USUARIOS-LISTAR: Expected 403, Received 200`), provocando fallo inmediato (`exit code 1`) en el job `authz` y bloqueando la integración en el pipeline de GitHub Actions.
- **Revisión humana:** Pendiente de revisión y aprobación por Integrante 4 (Emma — `@EmmaPorras`) y codeowner `@Veldor09` en PR #41.
- **Hallazgos o excepciones relacionados:** Ninguno.
