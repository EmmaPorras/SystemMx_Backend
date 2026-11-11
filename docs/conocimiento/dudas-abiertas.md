# Dudas abiertas — SystemMx SSDLC

**Responsable de seguimiento:** Integrante 1 (Gerald).\
**Estado:** preguntas no aprobadas ni resueltas.\
**Regla:** no suponer políticas de negocio ni permisos basándose únicamente en cómo se comporta el código.

| ID | Flujo | Pregunta pendiente | Responsable de resolver | Estado |
|---|---|---|---|---|
| D-01 | F1 | ¿La política aprobada para intentos de inicio de sesión es 5 solicitudes por minuto, tal como está declarada en el controlador? ¿Qué evidencia HTTP confirma el bloqueo? | Responsable de requisitos + encargado de autenticación | Abierta |
| D-02 | F1/F3 | ¿Cambiar el rol de un usuario debe invalidar sus JWT anteriores, o se considera suficiente consultar su rol vigente en cada petición? | Responsable de requisitos + encargado del backend | Abierta |
| D-03 | F1/F3 | ¿Qué rol y permisos debe obtener una cuenta creada por registro público, y quién aprueba esa política? | Responsable de requisitos + encargado del backend | Abierta |
| D-04 | F2 | ¿Hay reglas de propiedad sobre ventas y pagos, o todo usuario `VENTAS` puede acceder a todas las ventas? | Responsable de requisitos + encargado de ventas | Abierta |
| D-05 | F2 | ¿Cuál es la política de negocio para anular una venta que ya tiene pagos registrados? ¿Cómo se trata el dinero cobrado? | Responsable de requisitos + encargado de ventas | Abierta |
| D-06 | F3 | La matriz antigua menciona `OPERADOR` y tres roles; el código define cinco. ¿Confirmamos que los cinco roles son los vigentes antes de actualizar la matriz y aprobar la tabla de permisos? | Responsable de requisitos + encargado del backend | Abierta |
| D-07 | 1.2/1.4 | ¿Qué recursos y campos (saldos, costos, márgenes, datos de proveedores, snapshots de usuarios) son confidenciales y cuáles puede consultar cada rol? | Responsable de requisitos + encargados funcionales | Abierta |
| D-08 | 1.2/1.4 | ¿`VENTAS` puede consultar y modificar cualquier venta/pago, o hay una regla de propiedad/segregación por usuario, sucursal o período? | Responsable de requisitos + encargado de ventas | Abierta |
| D-09 | 1.2/1.4 | ¿`CONSULTA` debe leer ventas, compras, inventario, proveedores y todos los reportes? El backend actual tiene permisos diferentes por módulo y la matriz enumera acceso más amplio. | Responsable de requisitos + encargados funcionales | Abierta |
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

Las dudas D-01 a D-16 permanecen abiertas en este borrador. Las observaciones del código, pruebas existentes y documentos previos no cierran ni aprueban una regla.
