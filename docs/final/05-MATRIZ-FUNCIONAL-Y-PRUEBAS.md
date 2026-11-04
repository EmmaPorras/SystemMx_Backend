# 05 — MATRIZ FUNCIONAL Y DE PRUEBAS — SYSTEM MX

**Proyecto:** System MX — Plataforma Web de Gestión Comercial  
**Versión:** 1.0.0 (Estabilización Final)  
**Fecha:** Noviembre de 2026  
**Total de Pruebas Automatizadas Verificadas:** 929 Pruebas (100% Exitosas)  

---

## 1. RESUMEN EJECUTIVO DE ASEGURAMIENTO DE CALIDAD

La calidad y confiabilidad de **System MX** se sustentan en una pirámide de pruebas automatizadas rigurosa, que abarca desde la validación estática de tipado y reglas de linting, pruebas unitarias aisladas de lógica de negocio, pruebas de integración de repositorios y controladores, pruebas integrales de accesibilidad con axe-core, hasta pruebas **End-to-End (E2E)** que recrean y migran una base de datos relacional limpia para ejecutar el ciclo comercial completo de principio a fin.

### Métricas Globales de Pruebas:
- **Frontend (Vitest 5 + Testing Library + axe-core):**
  - **46 suites de prueba** ejecutadas.
  - **249 pruebas unitarias y de integración** aprobadas (0 fallos).
  - Tiempo de ejecución: ~80.82 s en entorno local Windows.
- **Backend (Jest 30 - Unitarias e Integración):**
  - **55 suites de prueba** ejecutadas.
  - **626 pruebas unitarias y de integración** aprobadas (1 omitida intencionalmente por compatibilidad histórica, 0 fallos).
  - Tiempo de ejecución: ~35 s en modo `--runInBand`.
- **Backend (Supertest + Jest - E2E con SQL Server Aislado):**
  - **1 suite integral E2E** (`systemmx-install.e2e-spec.ts`).
  - **54 escenarios E2E** ejecutados sobre base de datos vacía `inventario_motos_systemmx_e2e`.
  - **4 migraciones oficiales** ejecutadas satisfactoriamente.
  - Tiempo de ejecución: ~17.97 s.
- **TOTAL CONSOLIDADO:** **929 pruebas automatizadas ejecutadas y superadas con 100% de éxito**.

---

## 2. MATRIZ DE TRAZABILIDAD FUNCIONAL Y COBERTURA

| ID | Requerimiento de Negocio | Módulo / Componente | Endpoints / Contratos | Pruebas Automatizadas Asociadas | Estado de Verificación |
|:---:|---|---|---|---|:---:|
| **RF-01** | Inicio de sesión con JWT y Argon2id | AuthModule / LoginPage | `POST /api/auth/login`, `GET /api/auth/me` | `auth.service.spec.ts`, `LoginPage.test.tsx`, E2E Escenario 2 | ✅ APROBADO (100%) |
| **RF-02** | Registro público con asignación DEMO | AuthModule / RegistroPage | `POST /api/auth/registro` | `auth-registro.integration.spec.ts`, `RegistroPage.test.tsx` | ✅ APROBADO (100%) |
| **RF-03** | Activación de cuentas por invitación | UsuariosModule / ActivarCuentaPage | `POST /api/auth/activar-cuenta` | `usuarios.invitacion.spec.ts`, `auth-flows.test.tsx` | ✅ APROBADO (100%) |
| **RF-04** | Recuperación y cambio de clave | AuthModule / RecuperarPasswordPage | `POST /api/auth/solicitar-recuperacion` | `auth.service.spec.ts`, `auth-flows.test.tsx` | ✅ APROBADO (100%) |
| **RF-05** | Invalidación dinámica de sesiones | JwtAuthGuard / TokenStorage | `version_credenciales` check | `auth.service.spec.ts`, `tokenStorage.test.ts` | ✅ APROBADO (100%) |
| **RF-06** | Protección Last-Admin Guard | UsuariosService / UsuariosPage | `PATCH /api/usuarios/:id` | `usuarios.flujo-completo.spec.ts`, `UsuariosPage.test.tsx` | ✅ APROBADO (100%) |
| **RF-07** | Matriz RBAC de 5 roles | RolesGuard / ProtectedRoute | `@Roles(...)` en todos los controllers | `roles-authorization.spec.ts`, `permissions.test.ts`, E2E Escenario 4 | ✅ APROBADO (100%) |
| **RF-08** | Aislamiento estricto del rol DEMO | DemoController / DemoPage | `GET /api/demo/resumen` | `add-demo-role.spec.ts`, `UsuariosPage.test.tsx` | ✅ APROBADO (100%) |
| **RF-09** | Gestión de Categorías | CategoriasModule / CategoriasPage | `GET, POST, PATCH /api/categorias` | `categorias.service.spec.ts`, `categoriasApi.test.ts`, E2E Escenario 5 | ✅ APROBADO (100%) |
| **RF-10** | Mantenimiento de Tarifas IVA | TarifasModule / TarifasIVAPage | `GET, POST, PATCH /api/tarifas-iva` | `tarifas-iva.service.spec.ts`, `TarifasIVAPage.test.tsx`, E2E Escenario 5 | ✅ APROBADO (100%) |
| **RF-11** | Directorio de Proveedores | ProveedoresModule / ProveedoresPage | `GET, POST, PATCH /api/proveedores` | `proveedores.service.spec.ts`, E2E Escenario 5 | ✅ APROBADO (100%) |
| **RF-12** | Nacimiento de Producto por Pedido | PedidosModule / FormularioPedido | `POST /api/pedidos` | `pedidos.service.spec.ts`, `pedidosApi.test.ts`, E2E Escenario 6 | ✅ APROBADO (100%) |
| **RF-13** | Recepción Total de Pedido (+Stock) | PedidosModule / RecepcionPedido | `PATCH /api/pedidos/:id/recepcion` | `pedidos.service.spec.ts`, `recepcionPedido.utils.test.ts`, E2E Escenario 7 | ✅ APROBADO (100%) |
| **RF-14** | Recepción Parcial y Multilote | PedidosModule / RecepcionPedido | `PATCH /api/pedidos/:id/recepcion` | `pedidos.service.spec.ts` (test 34) | ✅ APROBADO (100%) |
| **RF-15** | Consulta de Lotes e Inventario | InventarioModule / TablaLotes | `GET /api/inventario/lotes/**` | `inventario.service.spec.ts`, `inventarioApi.test.ts`, E2E Escenario 7 | ✅ APROBADO (100%) |
| **RF-16** | Kardex de Movimientos Append-Only | InventarioModule / TablaMovimientos | `GET /api/inventario/movimientos` | `inventario.service.spec.ts`, `TablaMovimientos.test.tsx`, E2E Escenario 7 | ✅ APROBADO (100%) |
| **RF-17** | Emisión de Venta con Deducción FIFO | VentasModule / FormularioVenta | `POST /api/ventas` | `ventas.service.spec.ts`, `FormularioVenta.test.tsx`, E2E Escenario 8 | ✅ APROBADO (100%) |
| **RF-18** | Bloqueo Pesimista y Rechazo Stock 0 | VentasService / FormularioVenta | `pessimistic_write` lock | `ventas.service.spec.ts` (línea 545), E2E Escenario 8 | ✅ APROBADO (100%) |
| **RF-19** | Captura de Costo Real y Margen | DetalleVenta / Reportes | `costoUnitarioReal`, `gananciaBruta` | `ventas.service.spec.ts`, E2E Escenario 8 | ✅ APROBADO (100%) |
| **RF-20** | Cuentas por Cobrar y Saldos | ReportesModule / CuentasPorCobrar | `GET /api/reportes/cuentas-por-cobrar` | `cuentasPorCobrarApi.test.ts`, E2E Escenario 9 | ✅ APROBADO (100%) |
| **RF-21** | Registro de Abonos y Ledger Pagos | VentasModule / ModalPago | `POST /api/ventas/:id/pagos` | `ventas.service.spec.ts`, `registrar-pago-venta.dto.spec.ts`, E2E Escenario 10 | ✅ APROBADO (100%) |
| **RF-22** | Conciliación Financiera (Dif. = 0) | ReportesModule / Conciliacion | `GET /api/reportes/pagos/conciliacion` | `reportes-reconciliacion.spec.ts`, E2E Escenario 10 | ✅ APROBADO (100%) |
| **RF-23** | Anulación de Venta y Reversión Stock| VentasModule / TablaVentas | `PATCH /api/ventas/:id/anular` | `ventas.service.spec.ts`, E2E Escenario 14 | ✅ APROBADO (100%) |
| **RF-24** | Preservación de Pagos Históricos | PagoVenta / Auditoría | Inmutabilidad de `pago_venta` | `ventas.service.spec.ts`, E2E Escenario 14 | ✅ APROBADO (100%) |
| **RF-25** | Reconstrucción Inventario Histórico | ReportesModule / InventarioHistórico | `GET /api/reportes/inventario/historico` | `consulta-inventario-historico.dto.spec.ts`, E2E Escenario 12 y 15 | ✅ APROBADO (100%) |
| **RF-26** | 28 Reportes Analíticos Reconciliados | ReportesModule / ReportesPage | 28 Endpoints `/api/reportes/**` | `reportes.service.spec.ts` (1959 líneas), `reportesApi.test.ts` (28 tests) | ✅ APROBADO (100%) |
| **RF-27** | Auditoría de Usuarios y Operadores | ReportesAuditoriaService | `/api/reportes/auditoria/**` | `reportes-auditoria.controller.spec.ts`, E2E Escenario 13 | ✅ APROBADO (100%) |
| **RF-28** | Accesibilidad Universal WCAG 2.2 AAA| Componentes Common / axe-core | Formularios, Modales, Tablas | `accessibility.test.tsx` (15 tests axe-core) | ✅ APROBADO (100%) |
| **RF-29** | Paridad i18n (ES, EN, PT) | i18next / LanguageSelector | `es.json`, `en.json`, `pt.json` | `i18n.parity.test.ts`, `i18n.system.test.tsx` (16 tests) | ✅ APROBADO (100%) |

---

## 3. PRUEBAS DE CASOS LÍMITE Y RESILIENCIA TÉCNICA

Durante el proceso de auditoría y estabilización se ejecutaron pruebas específicas para evaluar el comportamiento del sistema ante condiciones adversas:

1. **Intento de Venta con Stock Insuficiente:**
   - *Escenario:* Un producto cuenta con 2 unidades en un lote y 1 unidad en otro (total: 3). Se intenta emitir una venta por 4 unidades.
   - *Resultado:* El sistema rechaza la operación antes de persistir cualquier cambio con `BadRequestException: "Stock total insuficiente para cubrir la cantidad solicitada"`. Las existencias físicas permanecen intactas en 3 unidades y no se genera movimiento alguno.

2. **Concurrencia y Condiciones de Carrera (*Race Conditions*):**
   - *Escenario:* Dos transacciones concurrentes intentan adquirir la última unidad disponible de un lote al mismo milisegundo.
   - *Resultado:* Gracias al uso de `pessimistic_write` (`UPDLOCK` / `FOR UPDATE`), la primera transacción bloquea el registro en base de datos. La segunda transacción espera la liberación del bloqueo y, al verificar que la cantidad disponible descendió a cero, es rechazada de forma controlada sin provocar inventario negativo.

3. **Intento de Acceso a Módulos Prohibidos (RBAC):**
   - *Escenario:* Usuario con rol `VENTAS` intenta crear una orden de compra o consultar la auditoría gerencial; usuario con rol `CONSULTA` intenta modificar una categoría.
   - *Resultado:* El guardián de autorización `RolesGuard` intercepta la petición y responde inmediatamente con `HTTP 403 Forbidden: "No tienes los permisos requeridos para acceder a este recurso"`.

4. **Inyección de Atributos no Permitidos (Seguridad DTO):**
   - *Escenario:* Un cliente malicioso envía atributos adicionales en la carga útil JSON (e.g., `{ "rol": "ADMIN", "numeroPedido": 9999 }`).
   - *Resultado:* El `ValidationPipe` con directiva `forbidNonWhitelisted: true` rechaza la petición con `HTTP 400 Bad Request: "property numeroPedido should not exist"`.

5. **Paridad Lingüística Estricta:**
   - *Escenario:* Comprobación automatizada de las llaves de traducción entre los tres idiomas oficiales.
   - *Resultado:* La prueba `i18n.parity.test.ts` valida que las 186 llaves de traducción del archivo maestro en español coinciden al 100% con los diccionarios de inglés y portugués, con 0 valores vacíos.

---

## 4. EVIDENCIA DE EJECUCIÓN DE PRUEBAS E2E (SQL SERVER)

A continuación se presenta el registro literal emitido por el script `run-systemmx-e2e.ps1` ejecutado exitosamente:

```text
> inventario-motos-backend@0.0.1 build
> nest build

BD E2E recreada: inventario_motos_systemmx_e2e
[X] 1 InitialSchema1788762385395
[X] 2 UserInvitationsAndTokens1788762400000
[X] 3 RolesVentasCompras1788762500000
[X] 4 AddDemoRole1788762600000

PASS test/systemmx-install.e2e-spec.ts (17.014 s)
  SystemMx Backend v1 — Smoke / E2E Installation Test
    Escenario 1 — Verificación de Schema Inicial e Instalación
      √ comprueba que las migraciones oficiales se ejecutaron (24 ms)
      √ comprueba la existencia de las tablas de negocio (12 comerciales + tokens) (108 ms)
    Escenario 2 — Bootstrap y Autenticación Inicial
      √ inicia sesión con el usuario ADMIN creado por el bootstrap (357 ms)
      √ permite consultar /api/auth/me con token de ADMIN (40 ms)
      √ rechaza con 401 peticiones sin token (13 ms)
    Escenario 3 — Creación y Login de Usuarios de Prueba
      √ ADMIN crea usuario COMPRAS (247 ms)
      √ inicia sesión con COMPRAS (102 ms)
      √ ADMIN crea usuario VENTAS (127 ms)
      √ ADMIN crea usuario CONSULTA (149 ms)
      √ inicia sesión con VENTAS (76 ms)
      √ inicia sesión con CONSULTA (72 ms)
    Escenario 4 — Matriz de Seguridad y Roles
      √ CONSULTA puede leer /api/productos (74 ms)
      √ CONSULTA no puede crear proveedores (403) (24 ms)
      √ VENTAS no puede crear proveedores (403) (30 ms)
      √ CONSULTA y VENTAS no pueden ver auditoría (403) (47 ms)
      √ ADMIN puede acceder a auditoría (200) (59 ms)
    Escenario 5 — Configuración Administrativa Mínima
      √ ADMIN crea proveedor (85 ms)
      √ ADMIN crea categoría (71 ms)
      √ ADMIN crea tarifa IVA (61 ms)
      √ comprueba que existe catálogo de OrigenCompra reproducible (16 ms)
    Escenario 6 — Creación de Pedido y Nacimiento de Producto
      √ COMPRAS registra Pedido (cantidad = 5) (317 ms)
      √ el Producto nace exclusivamente por el Pedido (50 ms)
      √ el lote inicial queda en estado EN_PROCESO con stock 0 (53 ms)
    Escenario 7 — Recepción de Pedido e Ingreso al Inventario
      √ COMPRAS recibe el pedido completamente (+5) (360 ms)
      √ el lote actualiza cantidadRecibida = 5 y cantidadDisponible = 5 (76 ms)
      √ se registra movimiento ENTRADA_COMPRA con snapshot de usuario operador (59 ms)
    Escenario 8 — Venta y Salida de Inventario
      √ verifica 5 unidades disponibles antes de vender (52 ms)
      √ VENTAS vende 2 unidades dejando saldo pendiente (259 ms)
      √ el stock disponible disminuye a 3 unidades (5 - 2) (39 ms)
      √ se registra movimiento SALIDA_VENTA de 2 unidades (47 ms)
      √ la venta conserva detalle de costos históricos reales (50 ms)
    Escenario 9 — Cuentas por Cobrar
      √ la venta con saldo pendiente aparece en cuentas por cobrar (48 ms)
    Escenario 10 — Pago y Conciliación Financiera
      √ VENTAS registra abono para cancelar el saldo restante (182 ms)
      √ el ledger append-only registra los pagos con snapshot de usuario (119 ms)
      √ la venta queda CONCILIADA con diferencia 0 en conciliación (76 ms)
    Escenario 11 — Reportes Reconciliados antes de Anular
      √ reconciliación de reportes de inventario (stock = 3) (47 ms)
      √ reconciliación de pagos en resumen y métodos (52 ms)
    Escenario 12 — Inventario Histórico Moderno
      √ el lote moderno tiene historialCompleto = true y 0 legacy (58 ms)
    Escenario 13 — Auditoría Moderna
      √ auditoría general muestra 0 movimientos y 0 pagos legacy (59 ms)
      √ actividad por usuario atribuye operaciones al operador (62 ms)
    Escenario 14 — Anulación de Venta
      √ VENTAS anula la venta (215 ms)
      √ el stock disponible se restaura a 5 unidades (3 + 2) (120 ms)
      √ se registra movimiento REINGRESO_ANULACION_VENTA de 2 unidades (56 ms)
      √ los pagos históricos se preservan y no son eliminados (66 ms)
      √ la venta anulada sale de las ventas comerciales válidas (72 ms)
      √ la venta aparece en el reporte de ventas anuladas (24 ms)
      √ la venta anulada ya no aparece en cuentas por cobrar (40 ms)
    Escenario 15 — Inventario Histórico Posterior a la Anulación
      √ el stock histórico y actual vuelven a ser 5 (41 ms)
    Integridad SQL Directa en BD E2E
      √ 0 stock negativo en lotes (20 ms)
      √ 0 movimientos de inventario inválidos (13 ms)
      √ 0 pagos con monto inválido (10 ms)
      √ 0 detalles de venta huérfanos (13 ms)
      √ 0 pagos huérfanos (13 ms)
      √ 0 movimientos o pagos sin usuario (legacy = 0 en BD nueva) (28 ms)

Test Suites: 1 passed, 1 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        17.97 s
```
