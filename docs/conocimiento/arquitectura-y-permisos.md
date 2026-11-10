# Arquitectura y permisos observados — SystemMx

**Ítems:** 1.2 y 1.4, insumo para 1.3. **Responsable:** Integrante 1.
**Estado:** borrador técnico; pendiente de revisión y aprobación humana. No constituye política de negocio.
**Alcance:** backend NestJS; lectura de controladores, guards, servicios, entidades, configuración y pruebas. No se inspeccionó una instancia desplegada ni se ejecutaron peticiones HTTP.

## Base de análisis y referencias

La aplicación compone módulos NestJS (`src/app.module.ts:21-59`), configura el prefijo `/api`, Helmet, CORS y validación DTO global (`src/bootstrap/configure-app.ts:11-45`), y registra los guards de rate limit, JWT y roles globalmente (`src/modules/auth/auth.module.ts:18-59`). Las rutas explícitamente públicas llevan `@Public`; las demás requieren JWT (`src/modules/auth/jwt-auth.guard.ts:26-76`). Los roles se validan por metadata de controlador/método; ausencia de rol requerido deja pasar el `RolesGuard` (`src/modules/auth/roles.guard.ts:25-50`).

Los roles que define el código son `ADMIN`, `VENTAS`, `COMPRAS`, `CONSULTA` y `DEMO` (`src/modules/usuarios/rol-usuario.enum.ts:1-7`). Los resultados de autorización descritos abajo son comportamiento del código y pruebas unitarias observadas, no aceptación de negocio ni evidencia de una prueba HTTP.

## Componentes

| Componente | Responsabilidad y límites observados | Fuentes |
|---|---|---|
| Cliente/navegador | Envía credenciales, JWT y datos de negocio por HTTP. El código acepta `Authorization: Bearer ...`; TLS depende de despliegue, no se valida desde este repositorio. | `src/modules/auth/jwt-auth.guard.ts:77-94`; `docs/backend-deployment.md` |
| API NestJS | Controladores HTTP, validación DTO, Helmet, CORS, throttling, autenticación/autorización y lógica de módulos. | `src/bootstrap/configure-app.ts:11-45`; `src/modules/auth/auth.module.ts:18-59` |
| Auth/Usuarios | Login, registro, activación, recuperación, tokens de acción, contraseñas y administración de usuarios. | `src/modules/auth/auth.controller.ts:30-133`; `src/modules/auth/auth.service.ts:20-88`; `src/modules/usuarios/usuarios.service.ts:118-340` |
| Ventas/Pedidos/Inventario | Operaciones de ventas, pagos, compras/recepciones, lotes y movimientos de inventario. | `src/modules/ventas/ventas.controller.ts:20-89`; `src/modules/pedidos/pedidos.controller.ts:20-75`; `src/modules/inventario/inventario.controller.ts:9-47` |
| Reportes | Consultas agregadas de ventas, compras, inventario, pagos y auditoría. | `src/modules/reportes/reportes.controller.ts:11-133`; `src/modules/reportes/reportes-auditoria.controller.ts:9-38` |
| Persistencia relacional | TypeORM con PostgreSQL o SQL Server según configuración; sincronización y migraciones automáticas desactivadas en runtime. | `src/app.module.ts:29-33`; `src/database/runtime-typeorm.options.ts:7-80` |
| Correo externo | Envío de invitación/activación/recuperación mediante Apps Script configurado; firma HMAC del payload. El proveedor es una frontera externa. | `src/modules/mail/mail.service.ts:17-57,83-171` |
| Datos demostrativos | `/api/demo/resumen` devuelve un resumen con valores marcados como simulados. | `src/modules/demo/demo.controller.ts:12-47` |

## Límites de confianza

1. **L1 — Cliente ↔ API:** entradas HTTP no confiables; `ValidationPipe` transforma, restringe y rechaza campos no permitidos (`configure-app.ts:38-44`). CORS limita orígenes de navegador pero no sustituye autenticación ni controla clientes no navegador (`configure-app.ts:24-36`). El TLS depende del hosting/proxy.
2. **L2 — API ↔ base de datos:** la API usa credenciales de entorno; PostgreSQL/SQL Server almacena cuentas, tokens de acción, ventas, pagos, lotes, pedidos y movimientos. No se observó `synchronize`, `migrationsRun` ni `dropSchema` habilitado en runtime (`runtime-typeorm.options.ts:17-25,45-67`).
3. **L3 — API ↔ Apps Script/correo:** la API transmite correo destinatario y URL de acción con token; firma HMAC SHA-256, timestamp y nonce (`mail.service.ts:97-130`). El código del receptor no forma parte del repositorio analizado; la verificación, replay protection y manejo del correo son pendientes.
4. **L4 — Rol DEMO ↔ datos comerciales:** el endpoint demo entrega datos de muestra; los controladores operativos no incluyen `DEMO` en sus roles. La separación real de datos debe confirmarse en backend y no inferirse del texto informativo de la respuesta.

## Datos protegidos identificados

- Contraseñas recibidas y hashes Argon2id; el servicio mapea usuarios públicos sin exponer `passwordHash` (`src/modules/usuarios/password-hasher.service.ts:5-19`; `src/modules/usuarios/usuarios.service.ts:46-66`).
- Email, nombre, username, rol, estado de cuenta y versión de credenciales (`src/database/entities/usuario.entity.ts:41-120`).
- JWT (claims `sub`, `username`, `ver`) y secretos de configuración JWT/DB/correo. No se incluyen valores de secretos en este documento ni en el modelo (`src/modules/auth/auth.service.ts:51-75`; `src/config/env.validation.ts:15-46`).
- Tokens de activación/invitación/recuperación: se almacena SHA-256 del token, con estado/expiración y metadatos de solicitud (`src/database/entities/token-accion-usuario.entity.ts:23-80`; `src/modules/usuarios/usuarios.service.ts:223-249`). El token en claro aparece en URL de acción enviada por correo.
- Información financiera/comercial: total, saldo pendiente, costo y ganancia bruta de ventas (`src/database/entities/venta.entity.ts:15-140`); pagos con importe y snapshot del usuario (`src/database/entities/pago-venta.entity.ts:21-110`); costo/valoración y trazabilidad de movimientos (`src/database/entities/movimiento-inventario.entity.ts:34-159`).
- Datos de proveedores: contacto, email, teléfono y dirección pueden ser personales o confidenciales comerciales (`src/database/entities/origen-compra.entity.ts:12-43`). Clasificación/retención aprobada aún no definida.

## Flujos críticos F1–F3

### F1 — Autenticación y sesión

1. `POST /api/auth/login` es público; throttle específico 5 solicitudes/60 s. El servicio verifica que la cuenta exista/esté activa, no esté pendiente de activación y que la contraseña concuerde; emite JWT (`auth.controller.ts:33-44`; `auth.service.ts:26-75`).
2. El guard valida firma/claims, estado activo y versión de credenciales en cada ruta protegida (`jwt-auth.guard.ts:36-75`). El token ausente, malformado, vencido, firma inválida o usuario inactivo resulta en 401. Un token válido sin rol autorizado resulta en 403 (`roles.guard.ts:37-49`).
3. Registro, validación/activación y recuperación tienen rutas públicas con límites por handler; registro asigna `DEMO` y estado pendiente en el código (`auth.controller.ts:46-123`; `usuarios.service.ts:254-340`). Esto es comportamiento observado, no regla aprobada.

### F2 — Ventas, pagos y anulaciones

1. `ADMIN` y `VENTAS` pueden consultar y ejecutar rutas de ventas, pagos, papelera, restauración y anulación (`ventas.controller.ts:20-89`).
2. El servicio transaccional controla stock y pagos/saldos; las pruebas cubren casos de reglas comerciales y roles en parte (`ventas.service.ts:210-407,482-595,710-813`; `ventas.service.spec.ts:430-466`). Las condiciones de acceso por propiedad de venta y anulación tras pagos no están fijadas como política.
3. Pagos y movimientos conservan trazas de actor en sus registros (`pago-venta.entity.ts:21-110`; `movimiento-inventario.entity.ts:34-159`). No se verificó una prueba integrada de permisos HTTP contra base desplegada.

### F3 — Administración de usuarios y roles

1. Todo `UsuariosController` requiere `ADMIN`: listar/detallar, crear, invitar, reenviar invitación, cambiar estado/contraseña/rol (`usuarios.controller.ts:22-78`).
2. Se previene desactivar o degradar el último administrador activo; cambiar contraseña/desactivar incrementa versión de credenciales (`usuarios.service.ts:624-760`). Si el cambio de rol invalida tokens previos está pendiente.
3. `RolesGuard` deniega usuario sin autenticación con 401 y rol no permitido con 403. Las pruebas de autorización modelan estos resultados (`roles.guard.ts:37-49`; `roles-authorization.spec.ts:31-74,82-129`).

## Matriz observada código → recurso → acción → condición

Condición común en rutas protegidas: Bearer JWT verificable, cuenta activa y versión vigente; sin ello, 401. Para principal autenticado con rol fuera de la lista, 403. Para rutas `@Public`, no se exige JWT; los throttles global y por ruta aplican donde estén configurados. «Lectura/escritura» agrupa handlers listados en controladores; no afirma una necesidad de negocio.

| Rol / actor | Recurso | Acción del código | Condición adicional observada |
|---|---|---|---|
| ADMIN | Auth | Login público; `/me` lectura autenticada | `/me` requiere JWT válido |
| ADMIN | Usuarios | CRUD/consulta/estado/contraseña/rol/invitaciones | Ruta requiere `ADMIN` |
| ADMIN | Ventas/pagos, pedidos/compras, catálogos, inventario, reportes, auditoría | Lectura/escritura según endpoints presentes | Auditoría solo ADMIN; las reglas de negocio de cada transición aplican |
| ADMIN | Demo | Ver resumen | Puede acceder según `@Roles(ADMIN, DEMO)` |
| VENTAS | Ventas/pagos/papelera/anulación | Lectura y escritura de venta; cuentas por cobrar | No se ve restricción de propiedad en el controlador; confirmar con responsable de ventas |
| VENTAS | Categorías/productos/tarifas/inventario | Lectura | Tarifas/categorías tienen escritura ADMIN-only; inventario es GET-only |
| VENTAS | Reportes | Solo cuentas por cobrar y vencimientos | Reportes globales se limitan a ADMIN/CONSULTA; auditoría denegada |
| VENTAS | Pedidos/proveedores/usuarios | No autorizado | 403 esperado si JWT vigente; soportado por roles de controladores y prueba de guards |
| COMPRAS | Pedidos | Lectura, creación, recepción, actualización y eliminación | ADMIN/COMPRAS en controller; validar significado de `DELETE` con regla de negocio |
| COMPRAS | Proveedores/categorías/productos/tarifas/inventario | Lectura | Proveedores y catálogos permiten consulta; inventario GET-only |
| COMPRAS | Ventas/reportes/usuarios/auditoría/demo | No autorizado | 403 esperado en rutas con roles distintos |
| CONSULTA | Categorías/productos/proveedores/tarifas/inventario | Lectura | Sin operaciones de escritura; inventario GET-only |
| CONSULTA | Reportes globales | Lectura | No incluye cuentas por cobrar (override ADMIN/VENTAS); auditoría solo ADMIN |
| CONSULTA | Ventas/pedidos/usuarios/demo | No autorizado | 403 esperado |
| DEMO | `/api/demo/resumen` | Lectura de dataset de muestra | `ADMIN` también permitido; DTO/flujo separado del dato comercial real es una afirmación del endpoint, no una verificación de aislamiento DB |
| DEMO | Rutas comerciales, reportes, inventario y usuarios | No autorizado | Sus roles no figuran en esos controladores; pruebas unitarias documentan negativas (`roles-authorization.spec.ts:222-273`) |
| Anónimo | Login, recuperación, validar token, activar cuenta, restablecer contraseña, registro y reenvío activación | Operaciones públicas | Throttle global; además por ruta hay límites selectivos (`auth.controller.ts:33-123`) |
| Anónimo | `/`, `/health`, `/api`, `/api/health` | Lectura de salud | `@Public()` (`src/app.controller.ts:8-42`) |
| Anónimo | Todo otro recurso no marcado público | Sin acceso | JWT guard: 401 (`jwt-auth.guard.ts:26-51`) |
| Token inválido/vencido/revocado | Recurso protegido | Sin acceso | 401 uniforme (`jwt-auth.guard.ts:36-75`) |
| Token válido pero rol no autorizado | Recurso con `@Roles` | Sin acceso | 403 (`roles.guard.ts:37-49`) |

### Cobertura por familias de controladores

- **ADMIN-only:** `/usuarios`; mutaciones de `/categorias`, `/tarifas-iva`, `/proveedores`; `/reportes/auditoria/*` (`usuarios.controller.ts:22`; `categorias.controller.ts:34-52`; `tarifas-iva.controller.ts:32-50`; `proveedores.controller.ts:32-49`; `reportes-auditoria.controller.ts:9-36`).
- **ADMIN/VENTAS:** `/ventas/*` y `/reportes/cuentas-por-cobrar*` (`ventas.controller.ts:20`; `reportes.controller.ts:123-133`).
- **ADMIN/COMPRAS:** `/pedidos/*` (`pedidos.controller.ts:21,46-75`).
- **ADMIN/VENTAS/COMPRAS/CONSULTA:** lectura de `/inventario/*`, `/productos/*`, lecturas de `/categorias/*` y `/tarifas-iva/*` (`inventario.controller.ts:9-45`; `productos.controller.ts:6-21`; `categorias.controller.ts:22-31`; `tarifas-iva.controller.ts:17-29`).
- **ADMIN/COMPRAS/CONSULTA:** lectura de `/proveedores/*` (`proveedores.controller.ts:17-29`).
- **ADMIN/CONSULTA:** reportes generales, con excepciones de cuentas por cobrar (`reportes.controller.ts:11-133`).
- **ADMIN/DEMO:** `/demo/resumen` (`demo.controller.ts:12-15`).

## Comparación con `docs/backend-api-matrix.md`

La matriz vigente no coincide con el código en roles ni en permisos; **no se modifica en este ítem**. Propuesta solo para revisión humana: elaborar una nueva matriz a partir de los controladores actuales, y reemplazar `OPERADOR` por el mapa de roles vigente únicamente después de confirmar políticas.

| Diferencia observada | Código | Matriz | Estado |
|---|---|---|---|
| Vocabulario de roles | `ADMIN`, `VENTAS`, `COMPRAS`, `CONSULTA`, `DEMO` | `ADMIN`, `OPERADOR`, `CONSULTA` | Inconsistencia documental confirmada |
| Compras | ADMIN/COMPRAS en pedidos | ADMIN/OPERADOR en pedidos | Inconsistencia documental; equivalencia `OPERADOR` no aprobada |
| Reporte general | ADMIN/CONSULTA; VENTAS solo cuentas por cobrar | ADMIN/OPERADOR/CONSULTA en reportes operativos | Diferencia de acceso documentada |
| Lectura de ventas | ADMIN/VENTAS; no CONSULTA en controller | ADMIN/OPERADOR/CONSULTA en lectura | Diferencia de acceso documentada |
| Proveedores | ADMIN/COMPRAS/CONSULTA lectura | ADMIN/OPERADOR/CONSULTA | Diferencia por reemplazo de rol |
| Demo | endpoint aislado ADMIN/DEMO omitido en matriz | No aparece | Omisión documental |
| Operaciones de pedidos | controlador permite update/delete | matriz enumera recepción y cancelar (rutas distintas) | Diferencia de endpoints; verificar semántica antes de modificar matriz |
| Catálogos/reportes/pagos | endpoints actuales no siempre corresponden a métodos y permisos descritos | matriz exhaustiva afirma cobertura | Revalidar matriz completa contra rutas actuales |

La matriz enumera algunas rutas que no coinciden con handlers actuales (por ejemplo, `DELETE /pedidos/:id` frente a la ruta rotulada cancelación, y papelera/restaurar/consultas de ventas). No se afirma aquí que una descripción sea «correcta»: el equipo debe acordar la fuente de verdad y actualizarla de forma revisada.

## Alcance y límites

- Se examinaron controladores, guards, servicios y entidades relevantes y pruebas de autorización existentes. Las pruebas observadas no se ejecutaron como parte de este borrador.
- Los permisos son lo que declara el código hoy; no se presentan como mínimo privilegio aprobado.
- No se evaluaron controles del frontend, configuración real del hosting, base de producción, Apps Script receptor, registros, backups, red, dependencias ni comportamiento HTTP desplegado.
- Todos los requisitos/reglas de negocio continúan pendientes de aprobación humana. Véase `docs/conocimiento/dudas-abiertas.md`.
\n
