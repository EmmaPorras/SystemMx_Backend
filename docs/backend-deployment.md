# Guía Operativa de Despliegue y Base de Datos — SystemMx Backend

Esta guía documenta los procedimientos oficiales de instalación, actualización, desarrollo y gestión de migraciones para el backend de SystemMx.

---

## 1. Principios Fundamentales de Arquitectura

1. **Invariantes de Runtime (`synchronize: false`)**:
   El runtime de NestJS opera estrictamente con `synchronize: false`, `migrationsRun: false` y `dropSchema: false`. La sincronización automática de TypeORM está eliminada de la configuración de la aplicación en todos los entornos.

2. **Control de Schema Exclusivo por Migrations**:
   Todo cambio de base de datos se realiza mediante migraciones versionadas y reproducibles en TypeScript/JavaScript (`src/database/migrations`).

3. **Separación de Credenciales (Principio de Menor Privilegio)**:
   - **Runtime de NestJS (`DB_USERNAME` / `DB_PASSWORD`)**: Usuario de aplicación con permisos DML (SELECT, INSERT, UPDATE, DELETE).
   - **CLI de Migraciones (`DB_MIGRATION_USERNAME` / `DB_MIGRATION_PASSWORD`)**: Usuario de despliegue con permisos DDL (CREATE, ALTER, DROP). En desarrollo local hace fallback transparente al usuario runtime si no se definen.

4. **Inmutabilidad de Migraciones**:
   Una migración aplicada y versionada en Git **nunca** se modifica ni se elimina. Cualquier cambio o corrección posterior se efectúa mediante una nueva migración.

---

## 2. Variables de Entorno por Ambiente

| Variable | Descripción | Development | Test | Production |
|---|---|---|---|---|
| `NODE_ENV` | Entorno de ejecución | `development` | `test` | `production` |
| `PORT` | Puerto HTTP del backend | `3000` / `3001` | Variable | `3000` (o asignado por host) |
| `JWT_SECRET` | Secreto HMAC-SHA256 (mínimo 32 chars) | Secreto local | Secreto test | Clave criptográfica aleatoria |
| `JWT_EXPIRES_SECONDS` | Tiempo de vida del token JWT | `3600` | `3600` | `3600` (según política) |
| `CORS_ORIGINS` | Orígenes permitidos (lista separada por coma) | `http://localhost:5173,...` | N/A | `https://app.systemmx.com` |
| `DB_HOST` | Host de SQL Server | `localhost` | `localhost` / CI | IP/Host privado SQL Server |
| `DB_PORT` | Puerto de SQL Server | `1433` | `1433` | `1433` |
| `DB_USERNAME` | Usuario runtime (DML) | `inventario` | `inventario` | `usr_systemmx_app` |
| `DB_PASSWORD` | Contraseña runtime | Contraseña local | Contraseña test | Contraseña robusta |
| `DB_DATABASE` | Base de datos destino | `inventario_motos_dev` | `inventario_motos_test` | `inventario_motos_prod` |
| `DB_LOGGING` | Log de consultas SQL | `true` / `false` | `false` | `false` |
| `DB_ENCRYPT` | Encriptación de canal TDS | `false` / `true` | `false` | `true` |
| `DB_TRUST_SERVER_CERTIFICATE` | Confianza en certificado SSL/TLS | `true` (autofirmado) | `true` | `false` (CA válida) |
| `DB_MIGRATION_USERNAME` | Usuario DDL para migraciones | *(Opcional)* | *(Opcional)* | `usr_systemmx_deployer` |
| `DB_MIGRATION_PASSWORD` | Contraseña DDL para migraciones | *(Opcional)* | *(Opcional)* | Contraseña DDL |

---

## 3. Procedimiento: Instalación Limpia (Nueva Base de Datos)

Para aprovisionar un servidor o entorno completamente nuevo:

1. **Configurar el archivo `.env`** con los valores correspondientes al entorno.
2. **Instalar dependencias**:
   ```bash
   npm ci
   ```
3. **Compilar el proyecto**:
   ```bash
   npm run build
   ```
4. **Verificar migraciones pendientes**:
   ```bash
   npm run migration:show:dist
   ```
   *(Debe mostrar `[ ] InitialSchema...`)*
5. **Ejecutar migraciones sobre el artefacto compilado**:
   ```bash
   npm run migration:run:dist
   ```
6. **Crear el primer usuario Administrador (Bootstrap inicial)**:
   ```bash
   # Configurar variables de bootstrap en el entorno temporalmente:
   # SYSTEMMX_BOOTSTRAP_USERNAME=admin
   # SYSTEMMX_BOOTSTRAP_NOMBRE="Administrador General"
   # SYSTEMMX_BOOTSTRAP_PASSWORD="PasswordSegura123!*"
   npm run bootstrap:user:dist
   ```
   > **Nota de Seguridad**: Inmediatamente después de la ejecución exitosa, retirar `SYSTEMMX_BOOTSTRAP_PASSWORD` de las variables de entorno.
7. **Iniciar la aplicación en producción**:
   ```bash
   npm run start:prod
   ```

---

## 4. Procedimiento: Actualización de Versión en Producción

Cuando se despliega un nuevo release con cambios de código y/o migraciones:

1. **Generar backup de seguridad** de la base de datos según la política de infraestructura.
2. **Desplegar el nuevo artefacto compilado (`dist/`)**.
3. **Revisar migraciones pendientes**:
   ```bash
   npm run migration:show:dist
   ```
4. **Ejecutar migraciones**:
   ```bash
   npm run migration:run:dist
   ```
5. **Reiniciar / Iniciar el servicio**:
   ```bash
   npm run start:prod
   ```
6. **Ejecutar pruebas de humo (Smoke Test)**:
   - `POST /api/auth/login` (200 OK, emisión de JWT).
   - `GET /api/auth/me` (200 OK, validación de perfil).
   - `GET /api/productos` (200 OK).
   - `GET /api/reportes/resumen` (200 OK).

> **Aviso sobre Reversiones**: No automatizar `migration:revert` en pipelines de CI/CD. Cualquier reversión en producción debe ser una decisión técnica explícita y analizada para evitar pérdida de datos transaccionales.

---

## 5. Procedimiento: Desarrollo Diario

Para el equipo de desarrollo trabajando en local:

1. **Iniciar el entorno y actualizar dependencias**:
   ```bash
   git pull
   npm ci
   ```
2. **Comprobar y ejecutar migraciones**:
   ```bash
   npm run migration:show
   npm run migration:run
   ```
3. **Iniciar el servidor en modo watch**:
   ```bash
   npm run start:dev
   ```

---

## 6. Procedimiento: Modificación de Schema (Nuevas Entidades / Columnas)

Cuando se requiere alterar la estructura de la base de datos:

1. **Modificar la entidad TypeORM** correspondiente en `src/database/entities/`.
2. **Generar la nueva migración**:
   ```bash
   npm run migration:generate -- src/database/migrations/NombreDescriptivoDelCambio
   ```
3. **Revisar el código generado** en el archivo `.ts` resultante:
   - Validar que el método `up()` contenga exactamente las operaciones requeridas.
   - Validar que el método `down()` revierta de forma exacta y simétrica el cambio.
4. **Probar la migración en una base de datos de prueba / descartable**:
   - `npm run migration:run`
   - `npm run migration:revert`
   - `npm run migration:run`
5. **Validar ausencia de drift**:
   ```bash
   npm run migration:generate -- src/database/migrations/DriftCheck
   # Debe responder: "No changes in database schema were found"
   ```
6. **Ejecutar suites de pruebas**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```
7. **Hacer commit conjunto** de la entidad modificada y el archivo de migración.

---

## 7. Procedimiento: Adopción de Bases de Datos Existentes (Baseline con `--fake`)

Si se conecta el sistema a una base de datos existente cuyo schema ya contiene las tablas creadas previamente:

1. **Verificar que el schema real coincida con las entidades actuales (cero drift)**:
   ```bash
   npm run migration:generate -- src/database/migrations/PreBaselineDriftCheck
   # Debe responder: "No changes in database schema were found"
   ```
2. **Registrar la migración inicial sin ejecutar DDL (Baseline)**:
   ```bash
   npx typeorm migration:run -d dist/database/data-source.js --fake
   ```
3. **Verificar que la migración figure como ejecutada**:
   ```bash
   npm run migration:show:dist
   # Debe mostrar: [X] InitialSchema...
   ```

---

## 8. Acciones Estrictamente Prohibidas

- ❌ **`synchronize: true`**: Prohibido en cualquier ambiente. No existe en el runtime.
- ❌ **`dropSchema: true`**: Prohibido.
- ❌ **`typeorm schema:sync` / `typeorm schema:drop`**: Comandos descartados por riesgo crítico de pérdida de datos.
- ❌ **Modificar archivos de migración ya aplicados o compartidos en el repositorio**.
- ❌ **Ejecutar migraciones DDL utilizando el usuario de runtime de la aplicación en producción**.
- ❌ **Definir `CORS_ORIGINS=*` en producción**.
- ❌ **Almacenar contraseñas de bootstrap o producción en archivos de repositorio o commits de Git**.
