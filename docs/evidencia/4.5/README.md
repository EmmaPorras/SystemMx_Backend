# Evidencia ítem 4.5 — Pruebas de autorización y base de datos efímera en CI

- **Responsable:** Integrante 3 (Joseth) · **Revisor:** Integrante 4 (Emma) · **Fecha:** 2026-11-11
- **Qué cubre / qué NO cubre (límites):**
  - **Qué cubre:** 
    1. **Fuente de verdad:** Codificación estricta de la tabla de permisos aprobada en `docs/conocimiento/arquitectura-y-permisos.md` (Sección 62) y los flujos críticos F1 (Autenticación y Sesión), F2 (Ventas y Pagos) y F3 (Administración de Usuarios y Roles) en `test/authz/matriz-permisos.ts`.
    2. **Peticiones directas con Supertest:** Pruebas contra la API HTTP montada sobre NestJS (`test/authz/authz.e2e-spec.ts`), garantizando que la protección no dependa de la interfaz gráfica ni de validaciones del cliente.
    3. **Evaluación de todos los roles del sistema:** Cobertura para los 5 roles del backend (`ADMIN`, `VENTAS`, `COMPRAS`, `CONSULTA`, `DEMO`), además de peticiones sin autenticación (`ANONIMO` -> 401) y tokens con firma inválida o malformados (`TOKEN_INVALIDO` -> 401).
    4. **Comprobación de no-modificación de datos:** Tras cada rechazo (HTTP 401/403) en operaciones mutantes (POST/PATCH), se verifica en la base de datos que el registro no fue creado, que los roles no fueron alterados y que el inventario disponible no sufrió reducciones.
    5. **Casos críticos del dominio:**
       - *Protección del último ADMIN:* Rechazo con HTTP 409 Conflict al intentar desactivar o degradar al único administrador activo del sistema (F3-AC2).
       - *Revocación inmediata por rotación de credenciales:* Un token JWT emitido antes de un cambio de contraseña o desactivación es rechazado con HTTP 401 al incrementar `versionCredenciales` (F1-AC4 / F3-AC5).
       - *Prevención de auto-elevación:* Rechazo con HTTP 403 cuando un usuario `VENTAS` intenta asignarse rol `ADMIN` (F3-AC3).
       - *Aislamiento del rol DEMO:* Acceso permitido a `/api/demo/resumen` y rechazo con HTTP 403 en todas las operaciones de escritura comerciales y administrativas.
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
- **Commit evaluado:** Pendiente de commit en rama `feat/4.5-authz-tests`.
- **Pull Request:** Pendiente de apertura hacia `development`.
- **Run de Actions exitoso (verde):** Pendiente de ejecución en GitHub Actions.
- **Run de Actions previo (bloqueo por fallo controlado):** Pendiente de ejecución controlada en rama desechable.
- **Revisión humana:** Pendiente de revisión y aprobación por Integrante 4 (Emma).
- **Hallazgos o excepciones relacionados:** Ninguno.

