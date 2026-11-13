# Evidencia — Ítem 1.1: flujos críticos de SystemMx

**Responsable:** Integrante 1 (Gerald, @Gerald120904).  
**Revisión requerida:** Integrante 2, persona distinta del autor. **Estado:** pendiente de validación humana.  
**Rama:** `docs/1.1-flujos-gerald` · **PR:** [#24](https://github.com/EmmaPorras/SystemMx_Backend/pull/24) (borrador hacia `development`).  
**Base de código/documentación examinada:** `be471f003e3aacfc95b0c0b8f5aa418d28864370` de `development` al elaborar el análisis; verificar nuevamente si el código cambia antes de la aprobación.

## Artefactos entregados

- [`docs/conocimiento/flujos.md`](../../conocimiento/flujos.md): documentación de F1, F2 y F3, con comportamiento observado, criterios propuestos de éxito/error/abuso y reglas pendientes de aprobar.
- [`docs/conocimiento/dudas-abiertas.md`](../../conocimiento/dudas-abiertas.md): cuestiones que requieren una decisión explícita del equipo.
- [PR #24](https://github.com/EmmaPorras/SystemMx_Backend/pull/24): historial y diferencias propuestas para revisión.

## Alcance de los tres flujos

| Flujo | Propósito | Criterios propuestos | Referencias de implementación |
| --- | --- | --- | --- |
| **F1 — Autenticación y sesión** | Inicio de sesión, JWT, rutas protegidas e invalidación de credenciales | F1-AC1…F1-AC4 | [auth.controller.ts](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/src/modules/auth/auth.controller.ts#L33-L43), [jwt-auth.guard.ts](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/src/modules/auth/jwt-auth.guard.ts#L36-L76) |
| **F2 — Venta, pago y anulación** | Permisos de ventas, saldo, existencias y trazabilidad | F2-AC1…F2-AC5 | [ventas.controller.ts](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/src/modules/ventas/ventas.controller.ts#L20-L87), [ventas.service.ts](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/src/modules/ventas/ventas.service.ts#L210-L407) |
| **F3 — Usuarios y roles** | Gestión por ADMIN, prevención de escalación y protección del último administrador | F3-AC1…F3-AC5 | [usuarios.controller.ts](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/src/modules/usuarios/usuarios.controller.ts#L22-L77), [roles.guard.ts](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/src/modules/auth/roles.guard.ts#L23-L48) |

En total hay **14 criterios propuestos**, separados explícitamente de las reglas todavía no aprobadas. Cada flujo contempla al menos un caso exitoso, un error y un escenario de uso indebido.

## Observaciones y trazabilidad

- Los roles observados en [`rol-usuario.enum.ts`](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/src/modules/usuarios/rol-usuario.enum.ts#L1-L6) son `ADMIN`, `VENTAS`, `COMPRAS`, `CONSULTA` y `DEMO`; la antigua matriz documental presenta una discrepancia. Véase el [hallazgo H-26](https://github.com/EmmaPorras/SystemMx_Backend/issues/26), registrado como hecho documental, **no** como acceso indebido demostrado.
- La continuación del análisis de amenazas se encuentra en el [PR #25](https://github.com/EmmaPorras/SystemMx_Backend/pull/25), que es un PR apilado sobre la rama de este ítem; el modelo STRIDE no convierte por sí mismo estos criterios en reglas aprobadas.
- Se distinguen los **comportamientos observados en código** de los **criterios de aceptación propuestos**. La identificación de rutas/roles no prueba que el sistema desplegado responda igual.

## Comprobaciones efectuadas

- Se elaboró el documento a partir de los archivos de implementación y pruebas mencionados en `flujos.md`.
- Se cotejaron la rama, el PR #24 y los archivos presentes en GitHub al preparar esta evidencia.
- **No consta ejecución reproducible de pruebas HTTP 401/403/400/409**, prueba de límite de intentos ni aceptación formal del negocio en este ítem. No se presenta la inspección estática como prueba de integración.
- No se modificó código productivo ni la matriz API antigua en esta tarea.

## Pendientes para cierre y revisión

- [ ] Identificar con nombre/cuenta al revisor Integrante 2 y registrar su revisión en GitHub.
- [ ] Confirmar las reglas de negocio con la persona responsable y actualizar las secciones `Reglas aprobadas` solamente con decisiones atribuibles.
- [ ] Resolver y dejar trazabilidad de las preguntas de `dudas-abiertas.md` (especialmente pagos/anulaciones, invalidación por rol y política de reintentos).
- [ ] Obtener pruebas reproducibles de los estados HTTP propuestos y restricciones críticas, con comandos/logs redactados, o señalar expresamente los casos no comprobados.
- [ ] Revalidar referencias y resultados frente al commit que finalmente se revise.
- [ ] Convertir el PR de borrador a listo para revisión cuando corresponda y obtener aprobación de otra persona antes de cualquier fusión.

Este README acredita el **análisis y su trazabilidad documental**; no certifica que el producto esté libre de defectos ni que los criterios tengan aprobación formal.
