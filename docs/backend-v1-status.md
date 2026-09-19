# Estado Definitivo del Backend — SystemMx Backend v1

**Estado**: ✅ **CERRADO Y CONGELADO**  
**Versión**: `v1.0.0`  
**Fecha de Cierre**: 7 de Septiembre de 2026  
**Git Tag**: `backend-v1.0.0`  

---

## 1. Resumen Ejecutivo

SystemMx Backend v1 es una plataforma empresarial para la gestión de inventario, compras, pedidos, facturación y reportes analíticos construida con NestJS, TypeORM y Microsoft SQL Server. 

El backend ha superado satisfactoriamente todas las fases de estabilización, refactorización de seguridad, endurecimiento de base de datos (`synchronize: false` permanente y migration-first), auditoría append-only, reconciliación financiera y pruebas End-to-End reproducibles desde bases de datos vacías.

---

## 2. Stack Tecnológico y Dependencias

| Componente | Versión | Propósito |
|---|---|---|
| **Node.js** | `v24.19.0` | Entorno de ejecución JavaScript/TypeScript |
| **npm** | `11.17.0` | Gestor de paquetes |
| **NestJS (`@nestjs/core`)** | `11.1.27` | Framework modular de backend |
| **TypeORM** | `1.0.0` | ORM y motor de migraciones versionadas |
| **Microsoft SQL Server (`mssql`)** | `12.6.0` | Gestor de base de datos relacional |
| **Argon2 (`argon2`)** | `0.45.1` | Algoritmo de derivación y hashing de contraseñas (Argon2id) |
| **NestJS JWT (`@nestjs/jwt`)** | `11.0.2` | Emisión y verificación criptográfica de tokens JWT |
| **NestJS Throttler** | `6.5.0` | Rate limiting global y protección contra fuerza bruta |
| **Helmet** | `8.3.0` | Cabeceras de seguridad HTTP |
| **Dotenv** | `17.4.2` | Carga segura de variables de entorno |
| **Jest / Supertest** | `30.0.0` / `7.0.0` | Suite de pruebas unitarias, de integración y E2E |

---

## 3. Módulos Funcionales

1. **Auth & Seguridad**:
   - Autenticación con JWT firmado y verificación en base de datos.
   - Hashing seguro de contraseñas con **Argon2id**.
   - Control de acceso basado en roles (`ADMIN`, `OPERADOR`, `CONSULTA`).
   - Versionado de credenciales (`versionCredenciales`): la modificación de contraseña o cambio de rol/estado invalida inmediatamente los tokens existentes.
   - Protección contra eliminación o degradación del último administrador activo (*Last-Admin Guard*).
   - Rate limiting con Throttler (máximo 5 intentos de login por minuto por IP).

2. **Usuarios y Control de Acceso**:
   - Administración exclusiva por el rol `ADMIN`.
   - Normalización de usernames y estados booleanos.

3. **Catálogos Estructurales**:
   - **Categorías**: Clasificación de productos.
   - **Tarifas de IVA**: Configuración fiscal de impuestos.
   - **Proveedores**: Directorio de proveedores comerciales.
   - **Orígenes de Compra**: Catálogo estructural de procedencia de mercadería.

4. **Pedidos y Compras**:
   - **Nacimiento de Productos por Pedido**: El producto se crea o reutiliza exclusivamente al registrar un pedido; no existe creación manual desacoplada.
   - Recepción física y control de estados (`EN_PROCESO` $\to$ `RECIBIDO`).
   - Lotes inicializados en `EN_PROCESO` con stock recibido/disponible en 0 hasta su recepción efectiva.

5. **Inventario & Lotes**:
   - Stock disponible gobernado por `lote_producto.cantidad_disponible`.
   - **Ledger Transaccional Append-Only**: Todo cambio en el stock físico se registra mediante `MovimientoInventario` (`ENTRADA_COMPRA`, `SALIDA_VENTA`, `REINGRESO_ANULACION_VENTA`).
   - Sin endpoints CRUD genéricos que permitan alterar el inventario fuera de las transacciones de negocio.

6. **Ventas y Facturación**:
   - Descuento de stock FIFO/lote en una única transacción de base de datos.
   - Captura de costos históricos reales por lote (`costoUnitarioReal`, `costoTotal`, `gananciaBruta`).
   - Gestión de saldos pendientes y cobranza.
   - **Anulación de Ventas**: Restaura el stock físico mediante movimiento `REINGRESO_ANULACION_VENTA`, preserva el historial de pagos y excluye la venta de los reportes comerciales válidos.

7. **Pagos y Cobranzas**:
   - **Ledger de Pagos Append-Only** (`PagoVenta`): Registro de abonos con snapshot de usuario y fecha.
   - Conciliación automática entre total vendido, abonos en ledger y saldo pendiente.

8. **Reportes Financieros y Analíticos**:
   - **28 Endpoints de Solo Lectura (`GET`)**: Cubren Ventas, Compras, Inventario, Pagos, Cuentas por Cobrar y Auditoría.
   - Reconciliación matemática garantizada entre vistas ejecutivas, evoluciones y agrupaciones por producto/proveedor/método.
   - Reconstrucción de inventario histórico a cualquier fecha de corte con flags de consistencia.

9. **Auditoría**:
   - Auditoría de actores con snapshot en movimientos de inventario y pagos.
   - Reportes de productividad y transacciones por usuario exclusivos para el rol `ADMIN`.

---

## 4. Invariantes Críticas de Arquitectura y Base de Datos

1. **`synchronize: false` Permanente**:
   - No existe sincronización automática en el runtime de NestJS en ningún ambiente.
   - Toda alteración de base de datos se realiza mediante migraciones versionadas y reproducibles.
2. **Prohibición de Operaciones Destructivas**:
   - Comandos como `schema:sync`, `schema:drop` o `dropSchema: true` están completamente descartados del proyecto.
   - La única destrucción intencional permitida es el script `reset-e2e-db.ts`, protegido estrictamente por el sufijo `_e2e`.
3. **Ledger Inmutable**:
   - Ni los movimientos de inventario ni los pagos de venta se modifican o eliminan una vez registrados.
4. **Paridad de Configuración HTTP**:
   - La función `configureApp` centraliza la configuración de prefijos, ValidationPipe, CORS y Helmet tanto para el arranque en producción (`main.ts`) como para las pruebas E2E (`systemmx-install.e2e-spec.ts`).

---

## 5. Evidencia de Pruebas y Calidad

### 5.1. Pruebas Unitarias y de Integración (`npm test`)
- **Suites de prueba**: 42 suites
- **Tests ejecutados**: 477 tests
- **Resultado**: **477 passed, 0 failed (100% verde)**

### 5.2. Pruebas End-to-End Reproducibles (`npm run test:e2e:systemmx`)
- **Escenarios cubiertos**: 15 escenarios completos (desde BD vacía $\to$ reset $\to$ migraciones $\to$ bootstrap $\to$ flujos comerciales $\to$ integridad SQL directa).
- **Ejecuciones consecutivas**: **2 ejecuciones consecutivas limpias** mediante `.\scripts\run-systemmx-e2e.ps1`.
- **Resultado**: **52 passed, 0 failed por corrida**.

### 5.3. Schema Drift Check (TypeORM Entities vs SQL Server)
- **Base de datos DEV**: `No changes in database schema were found` (0 drift).
- **Base de datos E2E**: `No changes in database schema were found` (0 drift).

### 5.4. Linter y Compilación
- **ESLint**: `0 errors, 0 warnings`
- **TypeScript Build (`nest build`)**: Compilación limpia en `dist/`.

---

## 6. Integridad SQL Verificada en Base de Datos

| Invariante SQL | Consulta de Verificación | Resultado |
|---|---|:---:|
| Stock Negativo | `SELECT COUNT(*) FROM lote_producto WHERE cantidad_disponible < 0` | **0** |
| Sobre-Stock | `SELECT COUNT(*) FROM lote_producto WHERE cantidad_disponible > cantidad_recibida` | **0** |
| Movimientos Inválidos | `SELECT COUNT(*) FROM movimiento_inventario WHERE cantidad <= 0 OR costo_unitario < 0 OR total_movimiento < 0` | **0** |
| Pagos Inválidos | `SELECT COUNT(*) FROM pago_venta WHERE monto <= 0` | **0** |
| Saldos Negativos | `SELECT COUNT(*) FROM venta WHERE saldo_pendiente < 0` | **0** |
| Pagos Excesivos en Venta Activa | `SELECT COUNT(*) FROM venta WHERE estado_venta <> 'ANULADA' AND monto_pagado > total_venta` | **0** |
| Detalles de Venta Huérfanos | `SELECT COUNT(*) FROM detalle_venta dv LEFT JOIN venta v ON v.id_venta = dv.id_venta WHERE v.id_venta IS NULL` | **0** |
| Pagos Huérfanos | `SELECT COUNT(*) FROM pago_venta p LEFT JOIN venta v ON v.id_venta = p.id_venta WHERE v.id_venta IS NULL` | **0** |
| Movimientos Huérfanos | `SELECT COUNT(*) FROM movimiento_inventario m LEFT JOIN lote_producto l ON l.id_lote = m.id_lote WHERE l.id_lote IS NULL` | **0** |
| Auditoría de Movimientos Huérfana | `SELECT COUNT(*) FROM movimiento_inventario m LEFT JOIN usuario u ON u.id_usuario = m.id_usuario WHERE m.id_usuario IS NOT NULL AND u.id_usuario IS NULL` | **0** |
| Auditoría de Pagos Huérfana | `SELECT COUNT(*) FROM pago_venta p LEFT JOIN usuario u ON u.id_usuario = p.id_usuario WHERE p.id_usuario IS NOT NULL AND u.id_usuario IS NULL` | **0** |
| Administradores Activos | `SELECT COUNT(*) FROM usuario WHERE rol = 'ADMIN' AND activo = 1` | **$\ge 1$ (1 activo)** |

---

## 7. Manifest de Migraciones Oficiales

| ID Migración | Nombre | Archivo | Estado en DEV |
|---|---|---|:---:|
| `1788762385395` | `InitialSchema1788762385395` | `src/database/migrations/1788762385395-InitialSchema.ts` | **[X] Aplicada** |

---

## 8. Documentación Relacionada

- [docs/backend-api-matrix.md](file:///c:/Users/Estudiantes/Desktop/SystemMx_Backend/docs/backend-api-matrix.md): Matriz completa de endpoints, métodos y roles.
- [docs/backend-deployment.md](file:///c:/Users/Estudiantes/Desktop/SystemMx_Backend/docs/backend-deployment.md): Guía operativa de despliegue, variables de entorno y migraciones.
- [docs/reportes-catalogo.md](file:///c:/Users/Estudiantes/Desktop/SystemMx_Backend/docs/reportes-catalogo.md): Catálogo financiero y analítico de los 28 reportes.
- [README.md](file:///c:/Users/Estudiantes/Desktop/SystemMx_Backend/README.md): Puerta de entrada y guía rápida de inicio.

---

## 9. Declaración de Cierre

```
╔═══════════════════════════════════════════════════════╗
║             SYSTEMMX BACKEND V1 — CLOSED              ║
║                                                       ║
║  ✅ Reproducible desde base de datos limpia           ║
║  ✅ Migration-First (synchronize: false permanente)   ║
║  ✅ Autenticación JWT + Roles en BD cerrados          ║
║  ✅ Modelo de negocio e invariantes de stock cerradas ║
║  ✅ 28 Reportes financieros reconciliados             ║
║  ✅ Auditoría ledger append-only cerrada              ║
║  ✅ 477 Unit Tests + 52 E2E Tests 100% Verdes         ║
║  ✅ Schema Drift = ZERO                               ║
║  ✅ Despliegue y contratos de API documentados        ║
║                                                       ║
║            🎉 LISTO PARA INTEGRACIÓN FRONTEND         ║
╚═══════════════════════════════════════════════════════╝
```
