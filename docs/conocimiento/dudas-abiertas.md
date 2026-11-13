# Dudas abiertas — SystemMx SSDLC

**Responsable de seguimiento:** Integrante 1 (Gerald).\
**Estado:** preguntas no aprobadas ni resueltas.\
**Regla:** no suponer políticas de negocio ni permisos basándose únicamente en cómo se comporta el código.

| ID | Flujo | Pregunta pendiente | Responsable de resolver | Estado |
|---|---|---|---|---|
| D-01 | F1 | ¿La política aprobada para intentos de inicio de sesión es 5 solicitudes por minuto, tal como está declarada en el controlador? ¿Qué evidencia HTTP confirma el bloqueo? | Responsable de requisitos + encargado de autenticación | Abierta |
| D-02 | F1/F3 | ¿Cambiar el rol de un usuario debe invalidar sus JWT anteriores, o se considera suficiente consultar su rol vigente en cada petición? | Responsable de requisitos + encargado del backend | No resuelta — decisión de negocio pendiente |
| D-03 | F1/F3 | ¿Qué rol y permisos debe obtener una cuenta creada por registro público, y quién aprueba esa política? | Responsable de requisitos + encargado del backend | No resuelta — decisión de negocio pendiente |
| D-04 | F2 | ¿Hay reglas de propiedad sobre ventas y pagos, o todo usuario `VENTAS` puede acceder a todas las ventas? | Responsable de requisitos + encargado de ventas | No resuelta — decisión de negocio pendiente |
| D-05 | F2 | ¿Cuál es la política de negocio para anular una venta que ya tiene pagos registrados? ¿Cómo se trata el dinero cobrado? | Responsable de requisitos + encargado de ventas | No resuelta — decisión de negocio pendiente |
| D-06 | F3 | La matriz antigua menciona `OPERADOR` y tres roles; el código define cinco. ¿Confirmamos que los cinco roles son los vigentes antes de actualizar la matriz y aprobar la tabla de permisos? | Responsable de requisitos + encargado del backend | No resuelta — decisión de negocio pendiente |
| D-07 | 1.2/1.4 | ¿Qué recursos y campos (saldos, costos, márgenes, datos de proveedores, snapshots de usuarios) son confidenciales y cuáles puede consultar cada rol? | Responsable de requisitos + encargados funcionales | Abierta |
| D-08 | 1.2/1.4 | ¿`VENTAS` puede consultar y modificar cualquier venta/pago, o hay una regla de propiedad/segregación por usuario, sucursal o período? | Responsable de requisitos + encargado de ventas | Abierta |
| D-09 | 1.2/1.4 | ¿`CONSULTA` debe leer ventas, compras, inventario, proveedores y todos los reportes? El backend actual tiene permisos diferentes por módulo y la matriz enumera acceso más amplio. | Responsable de requisitos + encargados funcionales | No resuelta — decisión de negocio pendiente |
| D-10 | 1.2/1.4 | ¿Qué operaciones de pedidos se requieren: editar/eliminar como expone el controller o recibir/cancelar según la matriz? ¿Qué significa una eliminación en términos de trazabilidad? | Responsable de requisitos + encargado de compras | Abierta |
| D-11 | 1.2/1.4 | ¿El acceso `DEMO` debe limitarse al resumen de muestra? ¿Cómo se demuestra aislamiento de la base comercial y qué contenido se permite al usuario anónimo? | Responsable de requisitos + encargado backend | Abierta |
| D-12 | 1.3 | ¿Qué amenazas, prioridades y medidas se aceptan como parte del modelo de amenazas y quién es el revisor/propietario de cada medida? | Equipo SSDLC + responsable de seguridad | Abierta |
| D-13 | 1.3 | ¿Qué controles y garantías operativas existen en el Apps Script receptor, transporte TLS, proxy, base, secretos, backups y monitoreo desplegados? | Encargado backend + responsables de despliegue/correo | Abierta |
| D-14 | 1.3 | ¿Qué evidencia se aceptará para pasar una amenaza de hipotética a confirmada o mitigada (test unitario, prueba HTTP, inspección de despliegue, aprobación)? | Equipo SSDLC + profesora/responsable de revisión | Abierta |
| D-15 | 1.2/1.4 | ¿Se confirma que los límites de throttling, los códigos de respuesta y las rutas públicas configuradas actualmente reflejan la política de servicio aprobada? | Responsable de requisitos + encargado de autenticación/operación | Abierta |
| D-16 | 1.4 | ¿Qué retención, integridad y acceso deben aplicarse a los registros append-only y reportes de auditoría? | Responsable de auditoría + responsable de requisitos | Abierta |


## Corte de seguimiento del Integrante 1 — 12/11/2026

Las preguntas D-02, D-03, D-04, D-05, D-06 y D-09 quedan **administrativamente clasificadas como «No resuelta — decisión de negocio pendiente»**, no como aprobadas ni descartadas. Se requiere reunión o respuesta escrita del equipo (responsable de requisitos + dueños del módulo). No confundir código actual, pruebas automatizadas o revisión de un PR con una política aprobada.

| Duda | Hecho comprobado en código | Por qué sigue sin resolverse | Decisión requerida |
|---|---|---|---|
| **D-02** | El guard verifica estado/versión del JWT y consulta usuario vigente; `cambiarRol` asigna rol sin incrementar `versionCredenciales`. [Guard](https://github.com/EmmaPorras/SystemMx_Backend/blob/development/src/modules/auth/jwt-auth.guard.ts#L58-L73) · [Servicio](https://github.com/EmmaPorras/SystemMx_Backend/blob/development/src/modules/usuarios/usuarios.service.ts#L718-L761) | Que los permisos se calculen con rol vigente no responde si la organización exige invalidar sesiones al cambiar roles | Aprobar si deben revocarse JWT anteriores por cambio de rol o basta la consulta del rol actual; responsable requisitos/backend |
| **D-03** | El registro público crea usuarios con rol `DEMO` y activación pendiente. [Servicio](https://github.com/EmmaPorras/SystemMx_Backend/blob/development/src/modules/usuarios/usuarios.service.ts#L297-L310) | Falta ratificación de que es la política de altas públicas deseada | Confirmar DEMO y activación por correo como requisitos de negocio |
| **D-04** | Los endpoints de ventas permiten `ADMIN` y `VENTAS`; `findAll` no muestra filtro de propiedad por usuario. [Controlador](https://github.com/EmmaPorras/SystemMx_Backend/blob/development/src/modules/ventas/ventas.controller.ts#L20-L70) · [Servicio](https://github.com/EmmaPorras/SystemMx_Backend/blob/development/src/modules/ventas/ventas.service.ts#L71-L102) | No está aprobada la política de acceso a ventas propias/ajenas, sucursales o períodos | Confirmar si VENTAS ve y modifica todas las ventas o solo un subconjunto |
| **D-05** | Anulación repone inventario, conserva historial y establece estado de venta/pago en `ANULADA` y saldo en 0. [Servicio](https://github.com/EmmaPorras/SystemMx_Backend/blob/development/src/modules/ventas/ventas.service.ts#L482-L593) | No consta una política aprobada de devolución, reversión contable y conciliación de dinero ya cobrado | Definir qué ocurre con pagos registrados, reembolsos y trazabilidad |
| **D-06** | El enum real contiene cinco roles: `ADMIN`, `VENTAS`, `COMPRAS`, `CONSULTA`, `DEMO`. [Enum](https://github.com/EmmaPorras/SystemMx_Backend/blob/development/src/modules/usuarios/rol-usuario.enum.ts#L1-L7) | La matriz documental antigua contiene nombres/alcances distintos; haber probado los roles actuales no equivale a aprobación funcional de la matriz | Confirmar oficialmente roles vigentes y quién actualizará la matriz vieja; relacionado con [H-26](https://github.com/EmmaPorras/SystemMx_Backend/issues/26) |
| **D-09** | `CONSULTA` accede a reportes globales, pero el controlador de ventas no le da acceso a sus rutas; el rol tiene restricciones por módulo. [Reportes](https://github.com/EmmaPorras/SystemMx_Backend/blob/development/src/modules/reportes/reportes.controller.ts#L9-L132) · [Ventas](https://github.com/EmmaPorras/SystemMx_Backend/blob/development/src/modules/ventas/ventas.controller.ts#L20-L89) | No existe decisión aprobada sobre datos sensibles/campos que CONSULTA puede visualizar | Aprobar matriz ruta/campo por rol, incluyendo costos, pagos, proveedores y reportes |

### Acuerdo requerido para cerrar cada duda

Registrar por duda: **decisión aprobada; nombre/cuenta de quien tiene autoridad para aprobarla; fecha; referencia a reunión, comentario o Issue; impacto en código, pruebas y documentación**. Solo entonces cambiar el estado a «Resuelta/aprobada» y actualizar `flujos.md` y `arquitectura-y-permisos.md` cuando corresponda. Si el equipo decide aceptar la política actual, registrar explícitamente esa aceptación; no deducirla del código.

**Nota sobre exposición:** presentar estas seis dudas como decisiones abiertas trazadas, con la justificación anterior. Esto no equivale a cerrar los requisitos de negocio ni garantiza que las pruebas de autorización definan la política deseada.

## Cómo cerrar una duda

1. Consultar código, pruebas y documentación, y confirmar la decisión con el integrante responsable.
2. Registrar la respuesta, evidencia (`archivo:línea`, Issue o PR) y persona que la aprobó.
3. Actualizar la sección «Reglas aprobadas» del flujo correspondiente.
4. Conservar el historial de la duda; no presentarla como aprobada antes de recibir respuesta.

Ninguna duda D-01 a D-16 se declara aprobada en este documento. D-02 a D-06 y D-09 tienen clasificación específica «No resuelta — decisión de negocio pendiente» al corte indicado; el resto permanece abierta. Las observaciones del código y las pruebas no cierran ni aprueban reglas.
