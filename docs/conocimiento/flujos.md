# Ítem 1.1 — Flujos críticos de SystemMx

**Responsable:** Integrante 1 (Gerald)\
**Estado:** borrador de análisis, pendiente de aprobación humana\
**Código consultado:** rama `development` de `EmmaPorras/SystemMx_Backend` (9 de noviembre de 2026).\
**Alcance:** autenticación y sesiones (F1), ventas y pagos (F2), administración de usuarios y roles (F3).

> **Importante:** las referencias a código describen comportamientos observados. Ningún criterio de este borrador se presenta todavía como regla de negocio aprobada. Validar con el equipo antes de usarlo como fuente de verdad para pruebas de autorización.

## F1 — Autenticación y sesión

**Justificación:** controla quién ingresa al sistema y protege el acceso a información y operaciones según su sesión.

**Actor principal:** usuario registrado; para casos de abuso, persona sin sesión o con credenciales incorrectas.\
**Objetivo:** iniciar sesión y acceder a operaciones protegidas mediante un token JWT válido.\
**Resultado esperado:** se entrega acceso solo a una cuenta activa, con credenciales correctas y sesión vigente.

### 1. Reglas aprobadas

_Pendiente de aprobación por el responsable de requisitos y el equipo. No convertir observaciones técnicas en políticas de negocio automáticamente._

### 2. Comportamiento observado en el código

- `POST /api/auth/login` es público y el controlador declara un límite de 5 solicitudes por 60 segundos. Fuente: `src/modules/auth/auth.controller.ts:33-43`.
- El servicio rechaza usuarios inexistentes o inactivos, cuentas pendientes de activación y contraseñas que no coinciden; emite un JWT con `sub`, `username` y `ver` para cuentas autenticadas. Fuente: `src/modules/auth/auth.service.ts:26-73`.
- `GET /api/auth/me` devuelve el usuario cargado en la petición autenticada. Fuente: `src/modules/auth/auth.controller.ts:126-132`.
- El guard verifica el JWT, que la cuenta siga activa y que `ver` coincida con `versionCredenciales`; en caso contrario responde sin autorizar. Fuente: `src/modules/auth/jwt-auth.guard.ts:36-76`.
- Cambiar contraseña o desactivar una cuenta incrementa `versionCredenciales`. Fuente: `src/modules/usuarios/usuarios.service.ts:624-657,663-706`.

### 3. Criterios propuestos, pendientes de validación

- **F1-AC1 — éxito.** **Dado** un usuario activo y con cuenta habilitada, **cuando** envía usuario y contraseña correctos a `POST /api/auth/login`, **entonces** recibe una respuesta exitosa con token JWT, tipo de token, vencimiento y datos públicos del usuario.
- **F1-AC2 — error.** **Dado** un usuario inexistente, inactivo o una contraseña errónea, **cuando** intenta iniciar sesión, **entonces** se rechaza con HTTP 401 y no se entrega un token.
- **F1-AC3 — uso indebido.** **Dado** alguien sin token válido, **cuando** consulta `GET /api/auth/me`, **entonces** la API rechaza la solicitud con HTTP 401 y no expone el perfil.
- **F1-AC4 — token invalidado.** **Dado** un token emitido antes de que se cambie la contraseña o se desactive la cuenta, **cuando** ese token se utiliza nuevamente en una ruta protegida, **entonces** la API responde HTTP 401.

**Pendiente de validación:** comprobar mediante una prueba HTTP que el límite declarado de intentos provoca la respuesta esperada y confirmar su política para la defensa.

## F2 — Venta, pago y anulación

**Justificación:** maneja dinero, existencias y registros de movimientos. Un fallo podría alterar saldos o inventario.

**Actor principal:** usuario con rol `ADMIN` o `VENTAS`.\
**Objetivo:** registrar una venta con stock disponible, cobrar sin exceder el saldo y poder anular con trazabilidad.\
**Resultado esperado:** venta y movimientos quedan coherentes, y toda operación no permitida se rechaza.

### 1. Reglas aprobadas

_Pendiente de aprobación por el responsable de requisitos y el equipo._

### 2. Comportamiento observado en el código

- El controlador de ventas exige `ADMIN` o `VENTAS` tanto a nivel de clase como para las operaciones de crear, pagar y anular. Fuente: `src/modules/ventas/ventas.controller.ts:20-87`.
- `POST /api/ventas` realiza una transacción, calcula totales, evita un pago inicial mayor al total, registra detalles y movimientos `SALIDA_VENTA`. Fuente: `src/modules/ventas/ventas.service.ts:210-312`.
- La lógica impide vender cantidades mayores al stock disponible. Fuente: `src/modules/ventas/ventas.service.ts:710-813`; prueba relacionada: `src/modules/ventas/ventas.service.spec.ts:430-466`.
- `POST /api/ventas/:id/pagos` rechaza pagos sobre ventas anuladas, pagadas completamente, importes no positivos y montos superiores al saldo. Fuente: `src/modules/ventas/ventas.service.ts:313-407`.
- `PATCH /api/ventas/:id/anular` restaura existencias a los lotes, registra movimientos `REINGRESO_ANULACION_VENTA` y marca la venta como anulada. Fuente: `src/modules/ventas/ventas.service.ts:482-595`.

### 3. Criterios propuestos, pendientes de validación

- **F2-AC1 — éxito.** **Dado** un usuario `VENTAS` autenticado y stock suficiente, **cuando** registra una venta válida, **entonces** la API guarda la venta y los movimientos de salida de inventario.
- **F2-AC2 — error.** **Dado** que el producto no tiene unidades suficientes, **cuando** intentan vender más unidades de las disponibles, **entonces** la API rechaza la venta y no confirma una salida de inventario.
- **F2-AC3 — uso indebido.** **Dado** un usuario `COMPRAS` autenticado, **cuando** intenta registrar una venta directamente por `POST /api/ventas`, **entonces** se rechaza con HTTP 403 y no cambia el inventario.
- **F2-AC4 — pago inválido.** **Dado** una venta con saldo pendiente de 2 000 unidades monetarias, **cuando** se intenta registrar un pago de 3 000, **entonces** la API responde HTTP 400 y no modifica el saldo.
- **F2-AC5 — anulación.** **Dado** una venta válida registrada, **cuando** un rol autorizado la anula, **entonces** la API la marca como anulada, devuelve la cantidad a los lotes correspondientes y conserva movimientos de trazabilidad.

**Pendiente de validación:** confirmar con el equipo la política de anulaciones cuando ya existen pagos y si hay reglas de propiedad por usuario sobre las ventas.

## F3 — Administración de usuarios y roles

**Justificación:** modificar roles, contraseñas o estados puede otorgar acceso indebido o dejar al sistema sin administrador.

**Actor principal:** usuario con rol `ADMIN`.\
**Objetivo:** administrar cuentas sin permitir escalación de privilegios ni pérdida del último administrador activo.\
**Resultado esperado:** solo personal autorizado altera usuarios y las restricciones críticas se respetan.

### 1. Reglas aprobadas

_Pendiente de aprobación por el responsable de requisitos y el equipo._

### 2. Comportamiento observado en el código

- Todo `UsuariosController` está marcado con `@Roles(RolUsuario.ADMIN)`; incluye consultar, crear, invitar y cambiar estado, contraseña o rol. Fuente: `src/modules/usuarios/usuarios.controller.ts:22-77`.
- `RolesGuard` devuelve HTTP 401 si no existe usuario autenticado y HTTP 403 cuando su rol no es permitido. Fuente: `src/modules/auth/roles.guard.ts:23-48`.
- Los roles definidos en el código son `ADMIN`, `VENTAS`, `COMPRAS`, `CONSULTA` y `DEMO`. Fuente: `src/modules/usuarios/rol-usuario.enum.ts:1-7`.
- Se impide desactivar o quitarle el rol al último administrador activo. Fuente: `src/modules/usuarios/usuarios.service.ts:663-760`.
- Cambiar contraseña incrementa la versión de credenciales para invalidar tokens previos; desactivar usuario también la incrementa. Fuente: `src/modules/usuarios/usuarios.service.ts:624-706`.

### 3. Criterios propuestos, pendientes de validación

- **F3-AC1 — éxito.** **Dado** un `ADMIN` autenticado, **cuando** crea un usuario con datos válidos, **entonces** la API registra la cuenta conforme a las validaciones existentes.
- **F3-AC2 — error.** **Dado** que existe un único administrador activo, **cuando** se intenta desactivarlo o quitarle `ADMIN`, **entonces** la API responde HTTP 409 y no aplica el cambio.
- **F3-AC3 — uso indebido.** **Dado** un usuario con rol `VENTAS`, **cuando** intenta `PATCH /api/usuarios/:id/rol` para otorgarse `ADMIN`, **entonces** la API devuelve HTTP 403 y el rol permanece igual.
- **F3-AC4 — sin sesión.** **Dado** una solicitud sin JWT, **cuando** intenta `POST /api/usuarios`, **entonces** la API responde HTTP 401 sin crear la cuenta.
- **F3-AC5 — cambio de contraseña.** **Dado** una cuenta con un token previamente emitido, **cuando** un administrador cambia su contraseña y ese token intenta acceder a una ruta protegida, **entonces** es rechazado con HTTP 401.

**Pendiente de validación:** aclarar si cambiar únicamente el rol debe invalidar el JWT anterior o si es suficiente con consultar el rol actual en cada petición.

## Observación transversal: discrepancia documental

`docs/backend-api-matrix.md` describe los roles `ADMIN`, `OPERADOR` y `CONSULTA`, pero `src/modules/usuarios/rol-usuario.enum.ts` define cinco roles: `ADMIN`, `VENTAS`, `COMPRAS`, `CONSULTA`, `DEMO`. **No utilizar la matriz antigua como tabla de autorización aprobada.** Actualizarla después de validar rutas y permisos con el código y el responsable de requisitos. Registrar esta discrepancia como hallazgo cuando el registro único de Issues esté listo.

## Revisión y evidencia pendiente

- [ ] Confirmar las reglas aprobadas con el equipo y registrar quién las validó.
- [ ] Revisar controladores, servicios y pruebas citados contra el commit final (agregar SHA).
- [ ] Corroborar HTTP 401/403/400/409 mediante pruebas reproducibles o evidencia existente.
- [ ] Resolver dudas en `dudas-abiertas.md`, sin inventar respuestas.
- [ ] Preparar `docs/evidencia/1.1/README.md` con enlaces a commit, PR y revisión humana.
- [ ] Abrir PR contra `development`, sin fusionarlo ni aprobarlo uno mismo.
