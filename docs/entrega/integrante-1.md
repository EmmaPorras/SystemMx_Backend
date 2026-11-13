# Entrega — Integrante 1 (Planificación, amenazas y registro de hallazgos)

**Responsable:** Gerald (@Gerald120904) · **Revisión cruzada:** Integrante 2 (@Veldor09).  
**Corte documental:** 12 de noviembre de 2026. Este texto está preparado para la consolidación de entrega; la inclusión y versión final en Profelink debe comprobarse con quien suba el documento.

## Aportes y evidencias

| Ítem | Alcance efectivamente entregado | Evidencia | PR aprobado y fusionado |
|---|---|---|---|
| **1.1** | Documentación de tres flujos críticos: **F1 autenticación/sesión, F2 ventas/pagos y F3 usuarios/roles**; 14 criterios de aceptación **propuestos**, con éxito, error y abuso; separación de reglas observadas y por aprobar | [Flujos](../conocimiento/flujos.md), [README 1.1](../evidencia/1.1/README.md), [dudas abiertas](../conocimiento/dudas-abiertas.md) | [#24](https://github.com/EmmaPorras/SystemMx_Backend/pull/24) |
| **1.3** (insumos 1.2/1.4) | Arquitectura, límites de confianza, tabla de permisos observada; **siete escenarios STRIDE hipotéticos T-01…T-07** y medidas propuestas M-01…M-07; modelo editable OWASP Threat Dragon 2.6.2 e informe PDF | [Arquitectura](../conocimiento/arquitectura-y-permisos.md), [Amenazas](../conocimiento/amenazas.md), [Modelo JSON](../conocimiento/threat-model/systemmx.json), [Evidencia 1.3](../evidencia/1.3/README.md) | [#25](https://github.com/EmmaPorras/SystemMx_Backend/pull/25) |
| **7.5** | Registro único con plantillas de Issues para hallazgos/excepciones; diez etiquetas SSDLC, estados y severidades, seguimiento y doble aprobación de excepciones con vencimiento | [Registro](../conocimiento/registro-hallazgos.md), [Evidencia 7.5](../evidencia/7.5/README.md), [Issues](https://github.com/EmmaPorras/SystemMx_Backend/issues) | [#29](https://github.com/EmmaPorras/SystemMx_Backend/pull/29) |

Los tres PR principales fueron fusionados a `development`, con revisión humana en GitHub. **La aprobación de PR no demuestra que las políticas de negocio hayan sido aprobadas ni que todas las mitigaciones STRIDE estén verificadas.**

## Uso real del registro de seguridad

- Hallazgos originales: [H-26](https://github.com/EmmaPorras/SystemMx_Backend/issues/26) discrepancia de roles/matriz, [H-27](https://github.com/EmmaPorras/SystemMx_Backend/issues/27) `lint` con `--fix`, [H-28](https://github.com/EmmaPorras/SystemMx_Backend/issues/28) migraciones en `start:prod` bajo investigación.
- Seguimiento de trabajo de compañeros: [H-38](https://github.com/EmmaPorras/SystemMx_Backend/issues/38) avisos OSV y [E-39](https://github.com/EmmaPorras/SystemMx_Backend/issues/39) solicitud de excepción temporal. **Su análisis corresponde a los respectivos responsables**, no atribuirlo al Integrante 1.
- Hallazgos de controles del agente: [H-44](https://github.com/EmmaPorras/SystemMx_Backend/issues/44) probable falso positivo histórico Gitleaks y [H-45](https://github.com/EmmaPorras/SystemMx_Backend/issues/45) confirmación de edición de un `*.spec.ts` (retest documentado en [PR #50](https://github.com/EmmaPorras/SystemMx_Backend/pull/50); cierre requiere revisión).
- Nuevos registros de seguimiento: [H-52](https://github.com/EmmaPorras/SystemMx_Backend/issues/52) ESLint con reglas `warn` globales, correctivo [PR #48](https://github.com/EmmaPorras/SystemMx_Backend/pull/48) pendiente; [H-53](https://github.com/EmmaPorras/SystemMx_Backend/issues/53) placeholder histórico de `security`, sustituido por [PR #34](https://github.com/EmmaPorras/SystemMx_Backend/pull/34); [H-54](https://github.com/EmmaPorras/SystemMx_Backend/issues/54) placeholder histórico de `authz`, sustituido por [PR #41](https://github.com/EmmaPorras/SystemMx_Backend/pull/41). Estos dos últimos no deben presentarse como fallas actuales de CI.

## Decisiones todavía sin aprobación

Las **D-02 a D-06 y D-09** permanecen **«No resueltas — decisión de negocio pendiente»**, con motivo y observaciones verificadas en [dudas-abiertas.md](../conocimiento/dudas-abiertas.md). Tratan de revocación de JWT tras cambios de rol, alta pública DEMO, alcance de VENTAS, anulación con pagos, cinco roles oficiales y accesos de CONSULTA. Solo los responsables del negocio/funcionalidad pueden ratificar políticas, registrando fecha y evidencia. No inventar políticas a partir de pruebas o del código.

## Resultados, límites y revisión

- Se documentaron e inspeccionaron componentes y reglas de negocio, pero las siete amenazas STRIDE son **hipótesis**, no vulnerabilidades explotadas ni mitigaciones verificadas.
- El modelo conserva el PDF exportado de Threat Dragon y el JSON editable, con información de arquitectura y escenarios.
- El sistema de hallazgos es funcional y está siendo usado por los demás integrantes; los Issues abiertos no equivalen a fallos todos sin resolver y deben tratarse según evidencia.
- Las pruebas de autorización con Supertest/PostgreSQL realizadas por el Integrante 3 (PR #41) respaldan el **comportamiento del código**, pero no sustituyen aprobación de reglas de negocio; no atribuir su ejecución al Integrante 1.
- Documentación y análisis realizados con asistencia de **Codex/ChatGPT** para generar borradores, revisar fuentes y mantener trazabilidad; la responsabilidad de aceptación, revisión, decisiones de negocio y presentación es humana.
- Se requiere validar que esta sección coincide con el **documento realmente subido a Profelink**; no se dispone aquí de acceso confirmado al documento final en esa plataforma.

## Guion breve de defensa

1. **F1/F2/F3:** «Identifiqué los procesos con mayor impacto para credenciales, dinero y permisos; documenté éxito, error y abuso con 14 criterios propuestos».
2. **STRIDE:** «Modelé arquitectura, límites de confianza y siete escenarios hipotéticos con una medida por escenario; no afirmo haber explotado vulnerabilidades».
3. **Registro:** «Organicé hallazgos y excepciones en GitHub Issues con plantillas, estados, severidad, evidencia, responsables y aprobación doble para excepciones; el equipo ya usa el registro».
4. **Trazabilidad y límites:** «Los PR están revisados y fusionados, mientras las reglas D-02 a D-06/D-09 y algunos tratamientos requieren decisiones del equipo».
