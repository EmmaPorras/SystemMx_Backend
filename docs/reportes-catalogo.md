# Catálogo Técnico del Módulo de Reportes (SystemMx)

Este documento describe la arquitectura, endpoints, fuentes de verdad y garantías del módulo de Reportes de SystemMx Backend.

---

## 1. Principios de Diseño y Arquitectura

1. **Read-Only Estricto**: Ningún endpoint de reportes realiza escrituras, modificaciones, borrados ni transacciones de mutación (`0` operaciones `INSERT`, `UPDATE`, `DELETE`, `save`, `remove`).
2. **Sin Bloqueos Pesimistas**: No se utilizan locks de escritura (`pessimistic_write` / `setLock`).
3. **Sin Tablas de Reportes ni Caché Prematuro**: Todas las métricas se agregan directamente desde las tablas operativas transaccionales normalizadas de SQL Server.
4. **Seguridad Uniforme**:
   - Todos los endpoints (`28/28`) requieren autenticación JWT vía `JwtAuthGuard` global.
   - No existe ningún endpoint con `@Public`.
   - Los reportes generales están disponibles para roles: `ADMIN`, `OPERADOR`, `CONSULTA`.
   - Los reportes de trazabilidad y auditoría individual de usuarios (`/api/reportes/auditoria/*`) están restringidos exclusivamente al rol `ADMIN` (`@Roles(RolUsuario.ADMIN)`).
5. **Estructura Modular**:
   - `ReportesResumenService`: Dashboard y resumen ejecutivo global.
   - `ReportesVentasService`: Análisis de ventas, rentabilidad, productos, lotes y anuladas.
   - `ReportesInventarioService`: Valoración de stock actual, estados, productos sin stock y reconstrucción histórica.
   - `ReportesComprasService`: Pedidos de compra, evolución, proveedores, productos, desglose de costos y cancelaciones.
   - `ReportesPagosService`: Conciliación financiera, desglose por métodos, evolución y cuentas por cobrar con vencimientos.
   - `ReportesAuditoriaService`: Trazabilidad por usuario, movimientos auditados vs legacy y pagos procesados.
   - `ReportesService`: Fachada unificada que preserva los contratos e inyección de dependencias.

---

## 2. Inventario Completo de Endpoints (28)

| Endpoint | Método | Roles Permitidos | Filtros Aceptados | Fuente de Verdad | Regla de Inclusión / Exclusión |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `/api/reportes/resumen` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `venta`, `lote_producto`, `pedido_compra` | Ventas/Pedidos por período; Inventario/Deuda snapshot actual. |
| `/api/reportes/ventas/resumen` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.venta` | `estado_venta <> 'ANULADA'`. Filtro por `fecha_venta`. |
| `/api/reportes/ventas/evolucion` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.venta` | Agrupado por `fecha_venta`. Excluye `ANULADA`. |
| `/api/reportes/ventas/productos` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.detalle_venta`, `dbo.venta` | Agrupado por `id_producto`. Costo y ganancia real. |
| `/api/reportes/ventas/lotes` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.detalle_venta`, `dbo.venta` | Agrupado por `id_lote`. |
| `/api/reportes/ventas/anuladas` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.venta` | Universo aislado: `estado_venta = 'ANULADA'`. |
| `/api/reportes/inventario/resumen` | GET | ADMIN, OPERADOR, CONSULTA | *Ninguno* | `dbo.lote_producto` | Snapshot actual de `cantidad_disponible` y valoración costo. |
| `/api/reportes/inventario/productos` | GET | ADMIN, OPERADOR, CONSULTA | *Ninguno* | `dbo.producto`, `dbo.lote_producto` | Todos los productos con su stock disponible y valoración. |
| `/api/reportes/inventario/estados` | GET | ADMIN, OPERADOR, CONSULTA | *Ninguno* | `dbo.lote_producto` | Agrupado por `estado_lote` (`EN_STOCK`, `AGOTADO`, etc.). |
| `/api/reportes/inventario/sin-stock` | GET | ADMIN, OPERADOR, CONSULTA | *Ninguno* | `dbo.producto`, `dbo.lote_producto` | Productos con `stockDisponible = 0`. |
| `/api/reportes/inventario/historico` | GET | ADMIN, OPERADOR, CONSULTA | `fechaCorte` (obligatorio) | `dbo.movimiento_inventario`, `dbo.lote_producto` | Reconstrucción por eventos ledger con bandera `historialCompleto`. |
| `/api/reportes/compras/resumen` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.pedido_compra`, `dbo.detalle_pedido_compra`, `dbo.lote_producto` | Comercial: `pedido.estado <> 'CANCELADO'`. Concilia recepción. |
| `/api/reportes/compras/evolucion` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.detalle_pedido_compra`, `dbo.pedido_compra` | Agrupado por `fecha_pedido`. Excluye cancelados. |
| `/api/reportes/compras/proveedores` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.detalle_pedido_compra`, `dbo.origen_compra` | Agrupado por proveedor con mercadería y costos adicionales. |
| `/api/reportes/compras/productos` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.detalle_pedido_compra`, `dbo.producto` | Agrupado por producto con desglose de flete e impuestos. |
| `/api/reportes/compras/costos` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.detalle_pedido_compra` | Composición de costos (`mercaderia`, `envio`, `impuestos`, `otros`). |
| `/api/reportes/compras/canceladas` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.pedido_compra`, `dbo.detalle_pedido_compra` | Universo aislado: `pedido.estado = 'CANCELADO'`. |
| `/api/reportes/pagos/resumen` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.pago_venta`, `dbo.venta` | Ledger append-only. Filtro por `pago.created_at`. |
| `/api/reportes/pagos/evolucion` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.pago_venta` | Agrupado por día (`CAST(created_at AS DATE)`). |
| `/api/reportes/pagos/metodos` | GET | ADMIN, OPERADOR, CONSULTA | `fechaDesde`, `fechaHasta` | `dbo.pago_venta` | Agrupado por `metodo_pago` con desglose ventas activas vs anuladas. |
| `/api/reportes/pagos/conciliacion` | GET | ADMIN, OPERADOR, CONSULTA | *Ninguno* | `dbo.venta`, `dbo.pago_venta` | Cruce `venta.monto_pagado` vs ledger con diferencia de cobertura. |
| `/api/reportes/cuentas-por-cobrar` | GET | ADMIN, OPERADOR, CONSULTA | *Ninguno* | `dbo.venta`, `dbo.cliente` | Snapshot actual de deudas con `saldo_pendiente > 0`. |
| `/api/reportes/cuentas-por-cobrar/vencimientos` | GET | ADMIN, OPERADOR, CONSULTA | `fechaCorte` (opcional) | `dbo.venta` | Clasificación en 4 buckets: sin vencimiento, vencidas, hoy, por vencer. |
| `/api/reportes/auditoria/resumen` | GET | ADMIN únicamente | `fechaDesde`, `fechaHasta` | `dbo.movimiento_inventario`, `dbo.pago_venta` | Cobertura de auditoría (auditados vs legacy sin usuario). |
| `/api/reportes/auditoria/usuarios` | GET | ADMIN únicamente | `fechaDesde`, `fechaHasta` | `dbo.usuario`, `movimiento_inventario`, `pago_venta` | Actividad individual de usuarios (movimientos + pagos). |
| `/api/reportes/auditoria/movimientos` | GET | ADMIN únicamente | `fechaDesde`, `fechaHasta`, `usuarioId`, `tipoMovimiento` | `dbo.movimiento_inventario` | Historial detallado de movimientos con snapshots y usuario actual. |
| `/api/reportes/auditoria/pagos` | GET | ADMIN únicamente | `fechaDesde`, `fechaHasta`, `usuarioId` | `dbo.pago_venta`, `dbo.venta` | Historial de pagos procesados con auditoría de usuario. |
| `/api/reportes/auditoria/legacy` | GET | ADMIN únicamente | *Ninguno* | `dbo.movimiento_inventario`, `dbo.pago_venta` | Registro de operaciones históricas sin id_usuario asignado. |

---

## 3. Limitaciones Históricas Conocidas y Cobertura

Existen dos condiciones del historial de datos heredado que el frontend y consumidores de la API deben considerar:

1. **Movimientos de Inventario Anteriores a la Etapa 6C**:
   - Algunos lotes antiguos pueden no contar con un registro `ENTRADA_COMPRA` explícito en `movimiento_inventario`.
   - En `/api/reportes/inventario/historico`, estos lotes se identifican con `historialCompleto: false`, devolviendo `stockHistorico: null` para evitar cálculos especulativos o falsos.
2. **Ventas y Pagos Anteriores a la Etapa 7D**:
   - Ventas antiguas registraron `montoPagado` directamente en la entidad `venta` antes de la incorporación del ledger append-only `pago_venta`.
   - En `/api/reportes/pagos/conciliacion`, se expone la diferencia matemática legítima como `diferenciaCobertura` (por ejemplo, ₡5.000 en el snapshot inicial), conservando `inconsistentes: 0`.

---

## 4. Criterios Operativos de Reevaluación de Índices

Actualmente, el volumen de datos de desarrollo y testing es pequeño (`15` ventas, `23` pedidos, `24` lotes, `35` movimientos, `12` pagos), por lo que los índices existentes en SQL Server son óptimos (tiempos de respuesta entre 10ms y 35ms).

Se recomienda reevaluar planes de ejecución (`STATISTICS IO/TIME`, `Index Seek` vs `Index Scan`) y considerar índices compuestos cuando el volumen transaccional alcance:
- `dbo.venta` > 10,000 registros (posible índice en `(fecha_venta, estado_venta)`).
- `dbo.pedido_compra` > 10,000 registros (posible índice en `(fecha_pedido, estado)`).
- `dbo.pago_venta` > 50,000 registros (posible índice en `(created_at, metodo_pago)`).
- `dbo.movimiento_inventario` > 50,000 registros.
