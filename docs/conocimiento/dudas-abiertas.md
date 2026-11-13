# Dudas abiertas — SystemMx SSDLC

**Responsable de seguimiento:** Integrante 1 (Gerald).\
**Estado:** D-02, D-03, D-04, D-06 y D-09 tienen respuesta propuesta (ver «Resoluciones propuestas»); D-05 queda NO RESUELTA con justificación; el resto sigue abierto.\
**Regla:** no suponer políticas de negocio ni permisos basándose únicamente en cómo se comporta el código.

| ID | Flujo | Pregunta pendiente | Responsable de resolver | Estado |
|---|---|---|---|---|
| D-01 | F1 | ¿La política aprobada para intentos de inicio de sesión es 5 solicitudes por minuto, tal como está declarada en el controlador? ¿Qué evidencia HTTP confirma el bloqueo? | Responsable de requisitos + encargado de autenticación | Abierta |
| D-02 | F1/F3 | ¿Cambiar el rol de un usuario debe invalidar sus JWT anteriores, o se considera suficiente consultar su rol vigente en cada petición? | Responsable de requisitos + encargado del backend | Resuelta (propuesta, ver R-02) |
| D-03 | F1/F3 | ¿Qué rol y permisos debe obtener una cuenta creada por registro público, y quién aprueba esa política? | Responsable de requisitos + encargado del backend | Resuelta (propuesta, ver R-03) |
| D-04 | F2 | ¿Hay reglas de propiedad sobre ventas y pagos, o todo usuario `VENTAS` puede acceder a todas las ventas? | Responsable de requisitos + encargado de ventas | Resuelta como decisión de alcance (ver R-04) |
| D-05 | F2 | ¿Cuál es la política de negocio para anular una venta que ya tiene pagos registrados? ¿Cómo se trata el dinero cobrado? | Responsable de requisitos + encargado de ventas | NO RESUELTA (ver R-05) |
| D-06 | F3 | La matriz antigua menciona `OPERADOR` y tres roles; el código define cinco. ¿Confirmamos que los cinco roles son los vigentes antes de actualizar la matriz y aprobar la tabla de permisos? | Responsable de requisitos + encargado del backend | Resuelta (propuesta, ver R-06) |
| D-07 | 1.2/1.4 | ¿Qué recursos y campos (saldos, costos, márgenes, datos de proveedores, snapshots de usuarios) son confidenciales y cuáles puede consultar cada rol? | Responsable de requisitos + encargados funcionales | Abierta |
| D-08 | 1.2/1.4 | ¿`VENTAS` puede consultar y modificar cualquier venta/pago, o hay una regla de propiedad/segregación por usuario, sucursal o período? | Responsable de requisitos + encargado de ventas | Abierta |
| D-09 | 1.2/1.4 | ¿`CONSULTA` debe leer ventas, compras, inventario, proveedores y todos los reportes? El backend actual tiene permisos diferentes por módulo y la matriz enumera acceso más amplio. | Responsable de requisitos + encargados funcionales | Resuelta (propuesta, ver R-09) |
| D-10 | 1.2/1.4 | ¿Qué operaciones de pedidos se requieren: editar/eliminar como expone el controller o recibir/cancelar según la matriz? ¿Qué significa una eliminación en términos de trazabilidad? | Responsable de requisitos + encargado de compras | Abierta |
| D-11 | 1.2/1.4 | ¿El acceso `DEMO` debe limitarse al resumen de muestra? ¿Cómo se demuestra aislamiento de la base comercial y qué contenido se permite al usuario anónimo? | Responsable de requisitos + encargado backend | Abierta |
| D-12 | 1.3 | ¿Qué amenazas, prioridades y medidas se aceptan como parte del modelo de amenazas y quién es el revisor/propietario de cada medida? | Equipo SSDLC + responsable de seguridad | Abierta |
| D-13 | 1.3 | ¿Qué controles y garantías operativas existen en el Apps Script receptor, transporte TLS, proxy, base, secretos, backups y monitoreo desplegados? | Encargado backend + responsables de despliegue/correo | Abierta |
| D-14 | 1.3 | ¿Qué evidencia se aceptará para pasar una amenaza de hipotética a confirmada o mitigada (test unitario, prueba HTTP, inspección de despliegue, aprobación)? | Equipo SSDLC + profesora/responsable de revisión | Abierta |
| D-15 | 1.2/1.4 | ¿Se confirma que los límites de throttling, los códigos de respuesta y las rutas públicas configuradas actualmente reflejan la política de servicio aprobada? | Responsable de requisitos + encargado de autenticación/operación | Abierta |
| D-16 | 1.4 | ¿Qué retención, integridad y acceso deben aplicarse a los registros append-only y reportes de auditoría? | Responsable de auditoría + responsable de requisitos | Abierta |

## Cómo cerrar una duda

1. Consultar código, pruebas y documentación, y confirmar la decisión con el integrante responsable.
2. Registrar la respuesta, evidencia (`archivo:línea`, Issue o PR) y persona que la aprobó.
3. Actualizar la sección «Reglas aprobadas» del flujo correspondiente.
4. Conservar el historial de la duda; no presentarla como aprobada antes de recibir respuesta.

Las dudas no mencionadas en «Resoluciones propuestas» permanecen abiertas en este borrador. Las observaciones del código, pruebas existentes y documentos previos no cierran ni aprueban una regla.

## Resoluciones propuestas (2026-11-12)

**Quién las propone y aprueba:** Integrante 2 (Veldor09) propone con base en el código y Integrante 1 (Gerald) está de acuerdo. **Limitación declarada:** ninguna fue validada con un dueño de negocio ni con la profesora; son decisiones del equipo para el alcance del proyecto y quedan sujetas a corrección. Siguen sin darse por aprobadas las que dependen de política de negocio (D-05). Pendiente de Integrante 1: reflejarlas en «Reglas aprobadas» de los flujos F1/F2/F3.

| ID | Respuesta propuesta | Evidencia en el código |
|---|---|---|
| R-02 (D-02) | Basta consultar el usuario vigente en cada petición: un cambio de rol se aplica de inmediato aunque el JWT sea anterior. El JWT se invalida (campo `ver`) solo cuando cambian credenciales (contraseña, activación). Cambiar el rol NO incrementa la versión de credenciales, y es aceptable. Mejora opcional: una prueba que degrade un rol y compruebe que el token anterior pierde acceso. | `src/modules/auth/jwt-auth.guard.ts:61-72` (carga la sesión por petición y compara `ver`); `src/modules/usuarios/usuarios.service.ts:718-760` (`cambiarRol` guarda el rol sin tocar `versionCredenciales`) |
| R-03 (D-03) | El registro público crea siempre una cuenta con rol `DEMO` (mínimo privilegio), pendiente de activación por correo. Subir de rol solo lo hace un `ADMIN`. | `src/modules/usuarios/usuarios.service.ts:297-308` |
| R-04 (D-04) | Decisión de alcance: no hay reglas de propiedad; todo usuario `VENTAS` (y `ADMIN`) puede consultar y operar todas las ventas y pagos. Se acepta como riesgo del negocio de un solo local y se registra como tal en las amenazas. Misma respuesta que D-08 (la decide el responsable de ventas). | `src/modules/ventas/ventas.controller.ts:20` (`@Roles(ADMIN, VENTAS)` en toda la clase, sin filtro por usuario) |
| R-05 (D-05) | **NO RESUELTA.** Qué hacer con el dinero ya cobrado al anular una venta con pagos es una política de negocio (devolución, nota de crédito, contabilidad) y el código no la define: al anular solo pone `estadoPago = 'ANULADA'` y `saldoPendiente = 0`, sin revertir ni registrar los pagos. No se debe suponer una regla. Debe decidirla el responsable de ventas/dueño; mientras tanto se declara como hallazgo y límite del sistema. | `src/modules/ventas/ventas.service.ts:482-590` (`anularVenta`) |
| R-06 (D-06) | Los cinco roles vigentes son `ADMIN`, `VENTAS`, `COMPRAS`, `CONSULTA` y `DEMO`. `OPERADOR` y la matriz de tres roles están obsoletos; se actualiza la matriz (`docs/backend-api-matrix.md`) para que coincida con el código. | `src/modules/usuarios/rol-usuario.enum.ts`; migraciones `1788762500000-RolesVentasCompras.ts` y `1788762600000-AddDemoRole.ts` |
| R-09 (D-09) | Se aprueba como base el acceso actual de `CONSULTA` (mínimo privilegio): reportes, proveedores e inventario en lectura. NO accede a los módulos de ventas ni de pedidos, aunque los reportes incluyan resúmenes de ventas. Si el negocio quiere más acceso, se cambia con una decisión explícita y su prueba, no por defecto. La matriz debe alinearse al código. | `reportes.controller.ts:11`, `proveedores.controller.ts:17`, `inventario.controller.ts:9-14` (incluyen `CONSULTA`); `ventas.controller.ts:20` y `pedidos.controller.ts:21` (no la incluyen); `reportes.roles.spec.ts` |
