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

## Cómo cerrar una duda

1. Consultar código, pruebas y documentación, y confirmar la decisión con el integrante responsable.
2. Registrar la respuesta, evidencia (`archivo:línea`, Issue o PR) y persona que la aprobó.
3. Actualizar la sección «Reglas aprobadas» del flujo correspondiente.
4. Conservar el historial de la duda; no presentarla como aprobada antes de recibir respuesta.
