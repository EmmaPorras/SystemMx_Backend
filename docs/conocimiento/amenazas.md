# Amenazas STRIDE — SystemMx

**Ítems:** 1.3; insumos 1.2/1.4. **Responsable:** Integrante 1.
**Estado global:** borrador de modelado, sin revisión ni aceptación humana.
**Prioridad:** orden cualitativo inicial por impacto probable y exposición del flujo; no representa CVSS ni vulnerabilidades confirmadas.

## Criterio

Las amenazas siguientes son **escenarios hipotéticos que deben comprobarse**, no hallazgos de vulnerabilidad. El comportamiento esperado de guard/servicio y pruebas ya existentes se cita por separado. «Mitigación propuesta» no significa que esté implementada ni aprobada. El `status: Open` del modelo Threat Dragon indica que la amenaza está pendiente, no que haya una falla confirmada.

| ID / prioridad | STRIDE y componente | Escenario e impacto potencial | Medida propuesta | Comprobación prevista | Responsable | Estado |
|---|---|---|---|---|---|---|
| **T-01 / P1** | Elevación de privilegios; API/guards de roles | Si un token o rol alterado/inconsistente permite ejecutar una ruta ajena, se podría administrar usuarios, manipular ventas o cambiar existencias. Impacto: compromiso de cuenta y datos/integridad comercial. | **M-01:** conservar verificación de firma, estado y versión de credenciales; verificar rol por cada petición y cubrir rutas críticas con pruebas HTTP negativas/positivas. | Revisión `JwtAuthGuard`/`RolesGuard` y suite de autorizaciones; preparar casos HTTP con cada rol, token inválido y cuenta desactivada. La suite actual es unit-test del guard y no sustituye HTTP. | Integrante 1 + encargado backend | Hipótesis abierta; no confirmada |
| **T-02 / P1** | Spoofing / elevación; Auth, registro y recuperación | Un atacante remoto abusa de endpoints públicos, credenciales, flujos de recuperación o tokens de activación para apropiarse de una cuenta, enumerarla o degradar disponibilidad. | **M-02:** validar límites y respuestas genéricas en ejecución, caducidad/uso único de tokens, no filtrar datos y revisar telemetría/alertas. | Revisar tests de `AuthService` y acciones; ejecutar pruebas HTTP controladas de throttle, respuestas, expiración, replay y enumeración, sin cuentas reales. | Encargado auth + Integrante 1 | Hipótesis abierta; límites en código no equivalen a verificación dinámica |
| **T-03 / P1** | Information disclosure; BD/API/reportes | Un rol accede a campos financieros, costos/márgenes, saldos, proveedor o trazabilidad no necesarios para su función. Impacto: exposición de información comercial y datos personales. | **M-03:** acordar matriz por ruta y campos; aplicar filtrado por rol/atributo cuando corresponda; probar respuestas para cada rol y revisar exports/logs. | Comparar handlers/DTO/respuestas de reportes y ventas con clasificación aprobada; pruebas HTTP para VENTAS, COMPRAS, CONSULTA, DEMO. | Responsable de requisitos + encargados ventas/compras/backend | Hipótesis abierta; matriz actual inconsistente |
| **T-04 / P1** | Tampering; servicios de ventas/inventario/pedidos/BD | Solicitudes repetidas, concurrentes o manipuladas alteran importes, saldo, lote, stock o el historial de movimientos pese a las reglas esperadas. Impacto: pérdidas y datos inconsistentes. | **M-04:** mantener transacciones/controles de saldo y stock; probar concurrencia, idempotencia si se decide, integridad referencial y reconciliación. | Revisar pruebas de servicios e integración; casos de dos ventas concurrentes, pagos al límite y anulación tras pago; no suponer reglas no aprobadas. | Encargados ventas/compras/inventario | Hipótesis abierta; no hallazgo confirmado |
| **T-05 / P2** | Repudiation; pagos/movimientos/auditoría | La atribución de quién ejecutó un pago/movimiento puede ser incompleta, alterable o insuficiente para resolver disputas. Impacto: no poder reconstruir operaciones. | **M-05:** aprobar requisitos de auditoría/retención; preservar actor, hora, referencia y cambios; controlar modificación de registros y revisar acceso a reportes de auditoría. | Verificar campos snapshots, escritura por servicios, permisos de auditoría y pruebas de reconciliación; confirmar política de retención con responsables. | Encargado backend + responsable operativo | Hipótesis abierta; campos de actor existen, integridad/retención por confirmar |
| **T-06 / P2** | Information disclosure / spoofing; correo externo | URL de acción con token filtrada en correo, logs, historial o servicio externo permite activar/restablecer cuenta sin autorización o exponer PII. | **M-06:** restringir vida/uso único de tokens, minimizar logs, mantener enmascarado, validar HMAC/nonce en receptor y limitar destino/origen. | Revisar `MailService`, búsqueda de logs de URL, almacenamiento del token hash y evidencia del Apps Script receptor; probar token consumido/expirado. | Encargado backend + responsable Apps Script/correo | Hipótesis abierta; receptor externo fuera del alcance |
| **T-07 / P2** | Denial of service; endpoints públicos y DB | Automatización de login/recuperación/registro, llamadas costosas o tráfico elevado degradan API/DB/correo. | **M-07:** verificar throttles por IP y política de proxy; límites de payload, tiempos, cuotas y observabilidad. | Reproducir límites controlados y revisar rate limiting global (120/60 s) y por endpoint; probar configuración detrás del proxy declarado, sin carga destructiva. | Encargado backend/operación | Hipótesis abierta; rate limiting configurado, configuración de producción por comprobar |

## Hallazgos confirmados versus hipótesis

- **Vulnerabilidades confirmadas por este trabajo: ninguna.** No se ejecutó prueba dinámica, explotación, revisión de configuración desplegada ni análisis de la aplicación real en producción.
- **Hechos documentales/código observados:** hay una matriz de API cuyo vocabulario de roles no coincide con el enum actual; existen guards globales, handlers públicos con throttling, y registros de actor en entidades. Estas observaciones no son por sí solas vulnerabilidades.
- **Riesgos hipotéticos:** T-01 a T-07 requieren prueba y contexto de negocio. No etiquetar como CVE, bug confirmado ni incidencia hasta presentar evidencia reproducible y revisión humana.

## Trazabilidad de medidas y modelo

El diagrama D1 acompaña cada escenario en `docs/conocimiento/threat-model/systemmx.json`. El documento de arquitectura y permisos aporta componentes, límites y condiciones observadas en `docs/conocimiento/arquitectura-y-permisos.md`. Las reglas no aprobadas permanecen en `docs/conocimiento/dudas-abiertas.md`.

## Revisión

- [ ] Aprobación de alcance y escenarios por equipo/responsables.
- [ ] Asignar persona nominal a cada responsable de área.
- [ ] Revisar prioridad cuando se confirme contexto, exposición y controles del despliegue.
- [ ] Registrar pruebas y resultados reales antes de cambiar estados a mitigado o confirmado.
\n
