# Matriz Definitiva de la API — SystemMx Backend v1

Esta matriz documenta de forma exhaustiva todos los endpoints HTTP expuestos por la API de SystemMx Backend v1, incluyendo rutas, métodos, roles autorizados, tipo de operación y descripción funcional.

---

## 1. Convenciones y Seguridad Global

- **Prefijo Global**: Todas las rutas operan bajo el prefijo `/api` (ej. `/api/auth/login`).
- **Autenticación**: Obligatoria mediante `Bearer <token_jwt>` en el encabezado `Authorization`, salvo en rutas decoradas con `@Public()`.
- **Roles del Sistema**:
  - `ADMIN`: Control total de configuración, usuarios, operaciones, reportes y auditoría del sistema.
  - `OPERADOR`: Ejecución de procesos comerciales (pedidos, recepciones, ventas, pagos, anulaciones) y consulta de reportes operativos. No administra usuarios, catálogos estructurales ni accede a auditoría.
  - `CONSULTA`: Solo lectura de catálogos y reportes operativos. Prohibida toda operación de escritura o acceso a auditoría.

---

## 2. Módulo de Autenticación (`/api/auth`)

| Método | Ruta | ADMIN | OPERADOR | CONSULTA | Público | Tipo | Descripción |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `POST` | `/api/auth/login` | ✅ | ✅ | ✅ | **Sí** | Escritura | Autenticación con credenciales, validación Argon2id y emisión de JWT firmado. |
| `GET` | `/api/auth/me` | ✅ | ✅ | ✅ | No | Lectura | Retorna el perfil y rol del usuario autenticado a partir del token JWT. |

---

## 3. Módulo de Usuarios (`/api/usuarios`)

| Método | Ruta | ADMIN | OPERADOR | CONSULTA | Público | Tipo | Descripción |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `GET` | `/api/usuarios` | ✅ | ❌ | ❌ | No | Lectura | Lista usuarios del sistema con soporte de paginación y filtros. |
| `GET` | `/api/usuarios/:id` | ✅ | ❌ | ❌ | No | Lectura | Consulta detalle de un usuario por su ID. |
| `POST` | `/api/usuarios` | ✅ | ❌ | ❌ | No | Escritura | Registra un nuevo usuario con contraseña hasheada en Argon2id. |
| `PATCH` | `/api/usuarios/:id/estado` | ✅ | ❌ | ❌ | No | Escritura | Activa o desactiva un usuario (con guard de último ADMIN e invalidación de token). |
| `PATCH` | `/api/usuarios/:id/password` | ✅ | ❌ | ❌ | No | Escritura | Restablece la contraseña de un usuario e incrementa `versionCredenciales`. |
| `PATCH` | `/api/usuarios/:id/rol` | ✅ | ❌ | ❌ | No | Escritura | Modifica el rol de un usuario (con guard de último ADMIN e invalidación de token). |

---

## 4. Módulos de Catálogos Administrativos

### 4.1. Categorías (`/api/categorias`)

| Método | Ruta | ADMIN | OPERADOR | CONSULTA | Público | Tipo | Descripción |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `GET` | `/api/categorias` | ✅ | ✅ | ✅ | No | Lectura | Lista todas las categorías registradas. |
| `GET` | `/api/categorias/:id` | ✅ | ✅ | ✅ | No | Lectura | Detalle de una categoría por ID. |
| `POST` | `/api/categorias` | ✅ | ❌ | ❌ | No | Escritura | Crea una nueva categoría. |
| `PATCH` | `/api/categorias/:id` | ✅ | ❌ | ❌ | No | Escritura | Actualiza nombre o descripción de una categoría. |
| `DELETE` | `/api/categorias/:id` | ✅ | ❌ | ❌ | No | Escritura | Desactiva (soft-delete) una categoría. |

### 4.2. Tarifas de IVA (`/api/tarifas-iva`)

| Método | Ruta | ADMIN | OPERADOR | CONSULTA | Público | Tipo | Descripción |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `GET` | `/api/tarifas-iva` | ✅ | ✅ | ✅ | No | Lectura | Lista todas las tarifas de IVA configuradas. |
| `GET` | `/api/tarifas-iva/:id` | ✅ | ✅ | ✅ | No | Lectura | Detalle de una tarifa de IVA por ID. |
| `POST` | `/api/tarifas-iva` | ✅ | ❌ | ❌ | No | Escritura | Registra una nueva tarifa de IVA. |
| `PATCH` | `/api/tarifas-iva/:id` | ✅ | ❌ | ❌ | No | Escritura | Modifica porcentaje o descripción de una tarifa. |
| `DELETE` | `/api/tarifas-iva/:id` | ✅ | ❌ | ❌ | No | Escritura | Desactiva una tarifa de IVA. |

### 4.3. Proveedores (`/api/proveedores`)

| Método | Ruta | ADMIN | OPERADOR | CONSULTA | Público | Tipo | Descripción |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `GET` | `/api/proveedores` | ✅ | ✅ | ✅ | No | Lectura | Lista proveedores registrados con filtros. |
| `GET` | `/api/proveedores/:id` | ✅ | ✅ | ✅ | No | Lectura | Detalle de un proveedor por ID. |
| `POST` | `/api/proveedores` | ✅ | ❌ | ❌ | No | Escritura | Registra un nuevo proveedor comercial. |
| `PATCH` | `/api/proveedores/:id` | ✅ | ❌ | ❌ | No | Escritura | Actualiza datos de contacto o fiscales de un proveedor. |
| `DELETE` | `/api/proveedores/:id` | ✅ | ❌ | ❌ | No | Escritura | Desactiva un proveedor. |

---

## 5. Módulo de Pedidos y Compras (`/api/pedidos`)

| Método | Ruta | ADMIN | OPERADOR | CONSULTA | Público | Tipo | Descripción |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `GET` | `/api/pedidos` | ✅ | ✅ | ✅ | No | Lectura | Lista pedidos de compra registrados. |
| `GET` | `/api/pedidos/origenes-compra` | ✅ | ✅ | ✅ | No | Lectura | Catálogo estructural de orígenes de compra. |
| `GET` | `/api/pedidos/:id` | ✅ | ✅ | ✅ | No | Lectura | Detalle de un pedido y sus líneas de detalle. |
| `POST` | `/api/pedidos` | ✅ | ✅ | ❌ | No | Escritura | Registra pedido. **El producto nace/reutiliza aquí** y el lote inicia en `EN_PROCESO`. |
| `PATCH` | `/api/pedidos/:id/recepcion` | ✅ | ✅ | ❌ | No | Escritura | Recibe unidades de compra, actualiza stock en lote y genera ledger `ENTRADA_COMPRA`. |
| `PATCH` | `/api/pedidos/:id/cancelar` | ✅ | ✅ | ❌ | No | Escritura | Cancela un pedido que se encuentra en estado `EN_PROCESO`. |

---

## 6. Módulo de Productos (`/api/productos`)

> **Regla de Arquitectura**: El catálogo de productos es de **solo lectura**. No existe `POST /productos` manual; los productos nacen o se reutilizan exclusivamente a través de los Pedidos de Compra.

| Método | Ruta | ADMIN | OPERADOR | CONSULTA | Público | Tipo | Descripción |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `GET` | `/api/productos` | ✅ | ✅ | ✅ | No | Lectura | Lista productos existentes en catálogo con sus categorías. |
| `GET` | `/api/productos/:id` | ✅ | ✅ | ✅ | No | Lectura | Detalle de un producto por ID. |
| `GET` | `/api/productos/:id/lotes` | ✅ | ✅ | ✅ | No | Lectura | Lotes asociados al producto. |

---

## 7. Módulo de Inventario (`/api/inventario`)

> **Regla de Arquitectura**: El inventario opera mediante **ledger transaccional append-only**. No existen endpoints CRUD para crear o mutar lotes/movimientos manualmente.

| Método | Ruta | ADMIN | OPERADOR | CONSULTA | Público | Tipo | Descripción |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `GET` | `/api/inventario/lotes` | ✅ | ✅ | ✅ | No | Lectura | Lista lotes de productos con stock recibido y disponible. |
| `GET` | `/api/inventario/lotes/:id` | ✅ | ✅ | ✅ | No | Lectura | Detalle de un lote por ID. |
| `GET` | `/api/inventario/movimientos` | ✅ | ✅ | ✅ | No | Lectura | Historial transaccional (ledger) de movimientos de inventario. |
| `GET` | `/api/inventario/movimientos/:id` | ✅ | ✅ | ✅ | No | Lectura | Detalle de un movimiento de inventario específico. |

---

## 8. Módulo de Ventas y Pagos (`/api/ventas`)

| Método | Ruta | ADMIN | OPERADOR | CONSULTA | Público | Tipo | Descripción |
|---|---|:---:|:---:|:---:|:---:|:---:|---|
| `GET` | `/api/ventas` | ✅ | ✅ | ✅ | No | Lectura | Lista ventas registradas con filtros por estado y fecha. |
| `GET` | `/api/ventas/inventario-disponible` | ✅ | ✅ | ✅ | No | Lectura | Stock disponible por producto para cotización y facturación. |
| `GET` | `/api/ventas/:id` | ✅ | ✅ | ✅ | No | Lectura | Detalle de una venta con desglose de lotes y costos históricos. |
| `GET` | `/api/ventas/:id/pagos` | ✅ | ✅ | ✅ | No | Lectura | Historial append-only de pagos registrados para la venta. |
| `POST` | `/api/ventas` | ✅ | ✅ | ❌ | No | Escritura | Registra venta, descuenta stock, crea `SALIDA_VENTA`, captura ganancia bruta y pago inicial opcional. |
| `POST` | `/api/ventas/:id/pagos` | ✅ | ✅ | ❌ | No | Escritura | Registra un abono a deuda (`PagoVenta` append-only con snapshot de usuario). |
| `PATCH` | `/api/ventas/:id/papelera` | ✅ | ✅ | ❌ | No | Escritura | Envía una venta a la papelera. |
| `PATCH` | `/api/ventas/:id/restaurar` | ✅ | ✅ | ❌ | No | Escritura | Restaura una venta desde la papelera. |
| `PATCH` | `/api/ventas/:id/anular` | ✅ | ✅ | ❌ | No | Escritura | Anula venta, reingresa stock (`REINGRESO_ANULACION_VENTA`), preserva pagos históricos. |

---

## 9. Módulo de Reportes (`/api/reportes`)

> **Regla de Arquitectura**: Todos los reportes son estrictamente de **solo lectura** (`GET`). Para documentación detallada sobre cálculos, reconciliación y semántica financiera, consultar [docs/reportes-catalogo.md](file:///c:/Users/Estudiantes/Desktop/SystemMx_Backend/docs/reportes-catalogo.md).

### 9.1. Reportes Operativos (ADMIN, OPERADOR, CONSULTA) — 23 Endpoints

| Método | Ruta | ADMIN | OPERADOR | CONSULTA | Tipo | Descripción |
|---|---|:---:|:---:|:---:|:---:|---|
| `GET` | `/api/reportes/resumen` | ✅ | ✅ | ✅ | Lectura | Dashboard ejecutivo integral de ventas, compras, inventario y deuda. |
| `GET` | `/api/reportes/ventas/resumen` | ✅ | ✅ | ✅ | Lectura | Resumen de ventas, descuentos, impuestos y ganancias brutas. |
| `GET` | `/api/reportes/ventas/evolucion` | ✅ | ✅ | ✅ | Lectura | Evolución temporal de ventas y margen comercial. |
| `GET` | `/api/reportes/ventas/productos` | ✅ | ✅ | ✅ | Lectura | Agrupación de ventas y rentabilidad por producto. |
| `GET` | `/api/reportes/ventas/lotes` | ✅ | ✅ | ✅ | Lectura | Trazabilidad de ventas y costo real por lote específico. |
| `GET` | `/api/reportes/ventas/anuladas` | ✅ | ✅ | ✅ | Lectura | Reporte de ventas anuladas con impacto económico. |
| `GET` | `/api/reportes/inventario/resumen` | ✅ | ✅ | ✅ | Lectura | Valorización total de inventario y conteo de unidades físicas. |
| `GET` | `/api/reportes/inventario/productos` | ✅ | ✅ | ✅ | Lectura | Stock y valorización agrupados por producto. |
| `GET` | `/api/reportes/inventario/estados` | ✅ | ✅ | ✅ | Lectura | Desglose de lotes por estado (`DISPONIBLE`, `AGOTADO`, `EN_PROCESO`). |
| `GET` | `/api/reportes/inventario/sin-stock` | ✅ | ✅ | ✅ | Lectura | Alerta de productos con stock cero o por debajo del mínimo. |
| `GET` | `/api/reportes/inventario/historico` | ✅ | ✅ | ✅ | Lectura | Reconstrucción retroactiva de stock a una fecha de corte con flag de consistencia. |
| `GET` | `/api/reportes/compras/resumen` | ✅ | ✅ | ✅ | Lectura | Inversión total en compras y costos de adquisición. |
| `GET` | `/api/reportes/compras/evolucion` | ✅ | ✅ | ✅ | Lectura | Evolución temporal de compras y adquisiciones. |
| `GET` | `/api/reportes/compras/proveedores` | ✅ | ✅ | ✅ | Lectura | Inversión y volumen de compras agrupado por proveedor. |
| `GET` | `/api/reportes/compras/productos` | ✅ | ✅ | ✅ | Lectura | Compras y costos reales agrupados por producto. |
| `GET` | `/api/reportes/compras/costos` | ✅ | ✅ | ✅ | Lectura | Desglose de composición de costos (FOB, flete, aduana, aranceles). |
| `GET` | `/api/reportes/compras/canceladas` | ✅ | ✅ | ✅ | Lectura | Reporte de pedidos cancelados antes de recepción. |
| `GET` | `/api/reportes/pagos/resumen` | ✅ | ✅ | ✅ | Lectura | Total de cobros recaudados y distribución por estado de venta. |
| `GET` | `/api/reportes/pagos/evolucion` | ✅ | ✅ | ✅ | Lectura | Evolución temporal de cobros y flujo de caja. |
| `GET` | `/api/reportes/pagos/metodos` | ✅ | ✅ | ✅ | Lectura | Recaudación total desglosada por método de pago. |
| `GET` | `/api/reportes/pagos/conciliacion` | ✅ | ✅ | ✅ | Lectura | Conciliación entre ventas registradas, ledger de pagos y saldos. |
| `GET` | `/api/reportes/cuentas-por-cobrar` | ✅ | ✅ | ✅ | Lectura | Cartera de clientes con saldo pendiente de cobro. |
| `GET` | `/api/reportes/cuentas-por-cobrar/vencimientos` | ✅ | ✅ | ✅ | Lectura | Antigüedad de saldos (buckets: corriente, 1-30, 31-60, 61-90, 90+ días). |

### 9.2. Reportes de Auditoría (`/api/reportes/auditoria`) — 5 Endpoints (ADMIN-only)

| Método | Ruta | ADMIN | OPERADOR | CONSULTA | Tipo | Descripción |
|---|---|:---:|:---:|:---:|:---:|---|
| `GET` | `/api/reportes/auditoria/resumen` | ✅ | ❌ | ❌ | Lectura | Balance global de auditoría (movimientos/pagos auditados vs legacy). |
| `GET` | `/api/reportes/auditoria/usuarios` | ✅ | ❌ | ❌ | Lectura | Productividad y operaciones ejecutadas agrupadas por usuario responsable. |
| `GET` | `/api/reportes/auditoria/movimientos` | ✅ | ❌ | ❌ | Lectura | Registro detallado de movimientos de inventario con snapshot de actor. |
| `GET` | `/api/reportes/auditoria/movimientos/resumen` | ✅ | ❌ | ❌ | Lectura | Resumen de movimientos de inventario por tipo y usuario. |
| `GET` | `/api/reportes/auditoria/pagos` | ✅ | ❌ | ❌ | Lectura | Registro detallado de pagos de venta con snapshot de usuario recaudador. |
