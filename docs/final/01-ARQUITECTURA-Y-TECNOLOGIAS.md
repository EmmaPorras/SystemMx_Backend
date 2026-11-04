# 01 — ARQUITECTURA Y TECNOLOGÍAS — SYSTEM MX

**Proyecto:** System MX — Plataforma Web de Gestión Comercial y Control de Inventarios  
**Versión:** 1.0.0 (Estabilización Final de Entrega)  
**Fecha:** Noviembre de 2026  
**Autores:** Equipo de Desarrollo System MX  

---

## 1. RESUMEN EJECUTIVO Y PROPÓSITO DEL SISTEMA

**System MX** es una solución integral de software empresarial diseñada para optimizar, centralizar y auditar el ciclo comercial completo de una organización comercializadora (especializada en repuestos, accesorios y motocicletas). La plataforma abarca desde el aprovisionamiento con proveedores internacionales y locales, control de pedidos de compra, recepción física en almacén mediante lotes de inventario bajo metodología **FIFO (First In, First Out)**, facturación de ventas con tarifas impositivas dinámicas (IVA), seguimiento de cuentas por cobrar, conciliación de pagos en un libro mayor (*ledger*) inmutable (*append-only*), hasta la generación de 28 reportes gerenciales reconciliados y auditoría forense de usuarios.

---

## 2. DIAGRAMA GENERAL DE ARQUITECTURA

La arquitectura del sistema responde a un modelo desacoplado de micro-servicios lógicos basado en **Frontend SPA (Single Page Application)** y **Backend REST API**, desplegados en la nube sobre la infraestructura de **Render** y persistencia en **Neon Serverless PostgreSQL**, manteniendo soporte dual local con **Microsoft SQL Server**.

```mermaid
flowchart TD
    subgraph Clientes["Capa de Presentación (Usuarios / Clientes)"]
        Browser["Navegador Web Moderno (Desktop / Tablet / Mobile)"]
        UserWay["Widget de Accesibilidad UserWay (WCAG 2.2 AAA)"]
        Browser <--> UserWay
    end

    subgraph CDN["Distribución y Red de Entrega (Cloudflare Edge)"]
        CF_Front["Cloudflare SSL / Caching Frontend"]
        CF_API["Cloudflare SSL / DDOS Protection Backend"]
    end

    subgraph FrontendApp["Servicio Frontend (Render Static Site)"]
        SPA["React 19 + TypeScript + Vite + Tailwind CSS"]
        Router["React Router (HashRouter)"]
        i18n["i18next (es / en / pt)"]
        AxiosClient["Axios API Client + Interceptor JWT"]
        SPA --> Router
        SPA --> i18n
        SPA --> AxiosClient
    end

    subgraph BackendApp["Servicio Backend (Render Web Service)"]
        NestApp["NestJS 11 Application Framework"]
        SecurityLayer["Helmet + Rate Limiting Throttler + CORS Guard"]
        AuthModule["Módulo de Autenticación (JWT + Argon2id)"]
        RBAC["Control de Acceso Basado en Roles (5 Roles)"]
        Modules["Módulos de Negocio:\n- Usuarios\n- Categorías / Tarifas\n- Proveedores\n- Pedidos y Recepción\n- Inventario FIFO\n- Ventas y Facturación\n- Pagos y Ledger\n- 28 Reportes Analíticos\n- Modo DEMO Aislado"]
        TypeORM["TypeORM 1.0 (Dual-Dialect Migrations)"]

        NestApp --> SecurityLayer
        SecurityLayer --> AuthModule
        AuthModule --> RBAC
        RBAC --> Modules
        Modules --> TypeORM
    end

    subgraph ExternalServices["Servicios Externos"]
        GAS["Google Apps Script Mailer (Invitaciones y Recuperación)"]
    end

    subgraph Databases["Capa de Persistencia de Datos"]
        subgraph NeonCloud["Producción Cloud (Render)"]
            PostgresNeon[("Neon Serverless PostgreSQL 16\n(Pooled / Direct Unpooled Connection)")]
        end
        subgraph LocalEnv["Desarrollo Local y Pruebas E2E"]
            SQLServer[("Microsoft SQL Server 2022\n(inventario_motos_systemmx_e2e)")]
        end
    end

    Browser <--> CF_Front
    CF_Front <--> SPA
    AxiosClient <--> CF_API
    CF_API <--> NestApp
    BackendApp --> GAS
    TypeORM --> PostgresNeon
    TypeORM -.-> SQLServer
```

---

## 3. COMPONENTES DEL FRONTEND

El frontend de System MX ha sido desarrollado con tecnologías modernas orientadas a rendimiento, accesibilidad universal y seguridad:

| Tecnología | Versión | Rol Arquitectónico |
|---|---|---|
| **React** | 19.2.0 | Biblioteca central de renderizado declarativo e interfaz reactiva |
| **TypeScript** | 5.9.3 | Tipado estático estricto en todos los componentes, DTOs y utilidades |
| **Vite** | 7.3.1 | Empaquetador ultrarrápido y servidor de desarrollo HMR |
| **Tailwind CSS** | 4.1.18 | Motor de estilos utilitarios responsive y temas cromáticos con contraste accesible |
| **React Router** | 7.9.4 | Enrutamiento del lado del cliente configurado con `HashRouter` para compatibilidad estática CDN |
| **i18next / react-i18next** | 25.6.0 | Motor de internacionalización con paridad 100% de llaves en Español, Inglés y Portugués |
| **UserWay Widget** | v4 | Integración oficial de accesibilidad para lectura de pantalla, contraste y tamaño textual |
| **Lucide React** | 1.16.0 | Biblioteca de iconografía vectorial semántica |
| **Vitest** | 5.0.0 | Entorno de pruebas unitarias y de integración rápida en Node/JSDOM |
| **axe-core** | 4.11.1 | Motor de auditoría automatizada de accesibilidad (WCAG 2.2 AAA) |

### Estructura Modular del Frontend:
- `src/api/`: Configuración centralizada de Axios con interceptor automático para inyección de token Bearer y manejo de renovación/expiración.
- `src/auth/`: Proveedor de contexto `AuthProvider`, rutas protegidas `ProtectedRoute` y páginas de autenticación (`LoginPage`, `RegistroPage`, `ActivarCuentaPage`, `RecuperarPasswordPage`, `RestablecerPasswordPage`).
- `src/components/`:
  - `common/`: Componentes atómicos reusables y accesibles (`InputField`, `SelectField`, `MoneyInputField`, `DataTableShell`, `AppModal`, `ConfirmDialog`, `PasswordStrengthIndicator`, `LanguageSelector`).
  - `usuarios/`: Administración y gestión de estados de usuarios para rol `ADMIN`.
  - `proveedores/`, `categorias/`, `tarifas-iva/`: Mantenimiento de catálogos base.
  - `pedidos/`: Creación de órdenes de compra y asistente de recepción física de mercadería.
  - `inventario/`, `lotes/`, `movimientos/`: Visualización en tiempo real de lotes y kardex de movimientos.
  - `ventas/`: Punto de venta con cálculo impositivo dinámico y selección FIFO.
  - `cuentas-por-cobrar/`: Seguimiento de cartera y registro de abonos.
  - `reportes/`: Centro analítico con 28 reportes organizados en 7 familias y exportación CSV/PDF.
  - `demo/`: Panel interactivo para rol `DEMO` con métricas y catálogos de muestra aislados.
- `src/i18n/`: Archivos JSON de localización (`es.json`, `en.json`, `pt.json`) y detector de idioma del navegador.

---

## 4. COMPONENTES DEL BACKEND

El backend se estructura mediante **NestJS**, respetando el principio de responsabilidad única, inyección de dependencias y arquitectura modular empresarial:

| Tecnología | Versión | Rol Arquitectónico |
|---|---|---|
| **NestJS (`@nestjs/core`)** | 11.1.27 | Framework empresarial modular basado en Express |
| **TypeScript** | 5.7.3 | Tipado completo de controladores, servicios, repositorios y entidades |
| **TypeORM** | 1.0.0 | Mapeador relacional de objetos con control estricto de migraciones |
| **PostgreSQL Driver (`pg`)** | 8.13.3 | Conector para la base de datos de producción en Neon |
| **Microsoft SQL Driver (`mssql`)**| 12.6.0 | Conector para entorno de desarrollo local y suite de pruebas E2E |
| **Argon2 (`argon2`)** | 0.45.1 | Algoritmo de hashing de contraseñas de vanguardia (Argon2id) |
| **NestJS JWT (`@nestjs/jwt`)** | 11.0.2 | Generación y validación criptográfica de tokens JWT HMAC-SHA256 |
| **Throttler (`@nestjs/throttler`)**| 6.5.0 | Limitador de peticiones por ventana de tiempo contra ataques de fuerza bruta |
| **Helmet** | 8.3.0 | Configuración de cabeceras HTTP de endurecimiento (CSP, X-Frame-Options, HSTS) |
| **Class-Validator & Class-Transformer**| 0.14.1 | Validación declarativa de DTOs con rechazo de atributos no permitidos (`whitelist: true`, `forbidNonWhitelisted: true`) |
| **Jest & Supertest** | 30.0.0 / 7.0.0 | Framework de pruebas unitarias, integración de servicios y pruebas E2E |

### Módulos del Backend:
1. **AuthModule**: Gestión de tokens, verificación de credenciales, activación de cuentas, restablecimiento de contraseñas y registro evaluativo.
2. **UsuariosModule**: CRUD de usuarios, gestión de invitaciones por correo electrónico y validación de políticas de contraseña.
3. **ProveedoresModule** y **CategoriasModule**: Control de proveedores y familias de artículos.
4. **TarifasModule**: Mantenimiento de impuestos de valor agregado (IVA) configurables.
5. **PedidosModule**: Órdenes de compra internacionales/nacionales y lógica transaccional de recepción en almacén con creación de lotes.
6. **InventarioModule**: Consulta de disponibilidad, desglose por lote y trazabilidad del libro de movimientos.
7. **VentasModule**: Registro de transacciones de venta, bloqueo pesimista contra condiciones de carrera, deducción FIFO, cálculo de ganancia real y reversión por anulación.
8. **ReportesModule**: Motor de reportería analítica compuesto por 6 sub-servicios especializados (Ventas, Compras, Inventario, Pagos, Auditoría y Resumen).
9. **DemoModule**: Endpoints con datos ficticios para evaluación controlada sin acceso a datos reales.
10. **MailModule**: Integración asíncrona mediante webhooks seguros con Google Apps Script para despacho de notificaciones transaccionales.

---

## 5. FLUJO DE DATOS Y CICLO COMERCIAL COMPLETO

El ciclo comercial de System MX garantiza la consistencia transaccional y la trazabilidad financiera desde la compra inicial hasta el cobro final:

```mermaid
sequenceDiagram
    autonumber
    actor Compras as Operador de Compras
    actor Almacen as Encargado de Bodega
    actor Ventas as Vendedor Comercial
    actor Cliente as Cliente Final
    participant API as Backend REST API
    participant DB as Base de Datos Transaccional
    participant Ledger as Libro Mayor (Append-Only)

    Note over Compras,DB: 1. Fase de Compra y Nacimiento de Producto
    Compras->>API: POST /api/pedidos (Proveedor, Items, Costos)
    API->>DB: INSERT pedido_compra + detalle_pedido_compra
    API->>DB: INSERT producto (Nacimiento de producto acoplado a la compra)
    API->>DB: INSERT lote_producto (Estado: EN_PROCESO, Stock Disponible: 0)
    API-->>Compras: HTTP 201 Created (Pedido Registrado)

    Note over Almacen,Ledger: 2. Fase de Recepción Física en Bodega
    Almacen->>API: PATCH /api/pedidos/{id}/recepcion (Cantidades recibidas)
    API->>DB: UPDATE lote_producto (Estado: EN_STOCK, Cantidad Disponible = Recibida)
    API->>DB: UPDATE pedido_compra (Estado: RECIBIDO / EN_TRANSITO)
    API->>Ledger: INSERT movimiento_inventario (Tipo: ENTRADA_COMPRA, Snapshot Usuario)
    API-->>Almacen: HTTP 200 OK (Mercadería Lista para Venta)

    Note over Ventas,Ledger: 3. Fase de Venta y Deducción FIFO
    Ventas->>API: POST /api/ventas (Cliente, Items, Tarifa IVA, Pago Inicial)
    API->>DB: SELECT lote_producto con Bloqueo Pesimista (FOR UPDATE / UPDLOCK)
    API->>DB: UPDATE lote_producto (Deduce unidades en orden FIFO de antigüedad)
    API->>DB: INSERT venta + detalle_venta (Guarda costoUnitarioReal histórico)
    API->>Ledger: INSERT movimiento_inventario (Tipo: SALIDA_VENTA, Snapshot Usuario)
    API->>Ledger: INSERT pago_venta (Si hubo pago inicial o contado)
    API-->>Ventas: HTTP 201 Created (Factura Emitida, Saldo Actualizado)

    Note over Ventas,Ledger: 4. Fase de Cartera y Cobranza Posterior
    Cliente->>Ventas: Realiza abono o liquidación de saldo
    Ventas->>API: POST /api/ventas/{id}/pagos (Monto, Método, Referencia)
    API->>DB: UPDATE venta (Disminuye saldo_pendiente)
    API->>Ledger: INSERT pago_venta (Ledger inmutable con auditoría)
    API-->>Ventas: HTTP 201 Created (Venta CONCILIADA con diferencia 0)

    Note over Ventas,Ledger: 5. Fase de Excepción (Anulación de Factura)
    Ventas->>API: PATCH /api/ventas/{id}/anular
    API->>DB: UPDATE venta (Estado: ANULADA)
    API->>DB: UPDATE lote_producto (Restaura stock a los lotes originales)
    API->>Ledger: INSERT movimiento_inventario (Tipo: REINGRESO_ANULACION_VENTA)
    Note right of Ledger: Los registros de pago_venta NO se borran (auditoría fiscal)
    API-->>Ventas: HTTP 200 OK (Inventario Revertido)
```

---

## 6. DECISIONES TÉCNICAS JUSTIFICADAS

1. **Arquitectura Dual-Dialect de Base de Datos:**
   - *Decisión:* Permitir que el sistema ejecute de manera transparente sobre **PostgreSQL** (para producción cloud gratuita y escalable en Neon) y sobre **Microsoft SQL Server** (para entornos corporativos locales, desarrollo y pruebas E2E aisladas).
   - *Justificación:* Asegura máxima portabilidad sin atar el proyecto a un único proveedor de base de datos. Las migraciones detectan automáticamente el dialecto de la conexión y aplican la sintaxis adecuada (`IDENTITY(1,1)` vs `SERIAL`, `datetime2` vs `timestamptz`, `bit` vs `boolean`).

2. **`synchronize: false` Permanente (Migration-First):**
   - *Decisión:* Desactivar completamente la sincronización automática de TypeORM en todos los ambientes.
   - *Justificación:* Evita modificaciones destructivas en caliente, alteración inadvertida de tipos de datos o eliminación de columnas en producción. Toda alteración estructural requiere una migración versionada y auditada.

3. **Ledger Inmutable (*Append-Only*) para Inventario y Pagos:**
   - *Decisión:* Las tablas `movimiento_inventario` y `pago_venta` no cuentan con operaciones `UPDATE` ni `DELETE` en la API.
   - *Justificación:* Garantiza la integridad contable y la trazabilidad forense. Toda corrección de inventario se realiza mediante un nuevo movimiento en sentido opuesto (`REINGRESO_ANULACION_VENTA`), preservando el historial para auditorías externas.

4. **Nacimiento de Productos Acoplado al Pedido de Compra:**
   - *Decisión:* No permitir crear productos huérfanos sin una orden de compra o proveedor asociado.
   - *Justificación:* Elimina discrepancias en el catálogo de artículos y asegura que todo artículo tenga siempre registrado su costo unitario de origen, tasa cambiaria y lote de procedencia.

5. **HashRouter en Frontend:**
   - *Decisión:* Implementar `HashRouter` en React Router en lugar de `BrowserRouter`.
   - *Justificación:* Garantiza el correcto funcionamiento de las rutas en servidores estáticos (CDN de Render, GitHub Pages o S3) sin requerir reescrituras complejas del servidor web Nginx/Apache al recargar páginas profundas (`F5`).

6. **Algoritmo Argon2id para Contraseñas:**
   - *Decisión:* Reemplazar algoritmos heredados (MD5, SHA-256 o bcrypt simple) por **Argon2id**.
   - *Justificación:* Es el estándar recomendado por OWASP y ganador de la Password Hashing Competition, resistente a ataques acelerados por GPU y circuitos ASIC gracias a su consumo configurable de memoria y tiempo.

---

## 7. MODELO DE DATOS ENTIDAD-RELACIÓN

El sistema opera sobre **13 tablas relacionales** rigurosamente normalizadas (en 3FN) con integridad referencial garantizada por llaves foráneas (`FOREIGN KEY`) y restricciones de unicidad (`UNIQUE`):

```mermaid
erDiagram
    usuario ||--o{ movimiento_inventario : "registra"
    usuario ||--o{ pago_venta : "procesa"
    usuario ||--o{ token_accion_usuario : "posee"
    
    categoria ||--o{ producto : "clasifica"
    tarifa_iva ||--o{ producto : "grava"
    tarifa_iva ||--o{ detalle_venta : "aplica"
    
    origen_compra ||--o{ pedido_compra : "suministra"
    
    pedido_compra ||--|{ detalle_pedido_compra : "contiene"
    pedido_compra ||--|{ lote_producto : "origina"
    
    producto ||--o{ detalle_pedido_compra : "solicitado_en"
    producto ||--|{ lote_producto : "materializado_en"
    producto ||--o{ detalle_venta : "vendido_en"
    
    lote_producto ||--o{ movimiento_inventario : "trazado_por"
    lote_producto ||--o{ detalle_venta : "despachado_por"
    
    venta ||--|{ detalle_venta : "desglosa"
    venta ||--o{ pago_venta : "recibe"

    usuario {
        int id_usuario PK
        string username UK
        string password_hash
        string nombre
        string rol "ADMIN, COMPRAS, VENTAS, CONSULTA, DEMO"
        boolean activo
        int version_credenciales
        datetime created_at
    }

    token_accion_usuario {
        int id_token PK
        int id_usuario FK
        string tipo_accion "INVITACION, RECUPERACION"
        string token_hash
        datetime fecha_expiracion
        boolean utilizado
    }

    categoria {
        int id_categoria PK
        string nombre UK
        string descripcion
        boolean activo
    }

    tarifa_iva {
        int id_tarifa_iva PK
        string codigo UK
        string descripcion
        decimal porcentaje
        boolean activo
    }

    origen_compra {
        int id_origen_compra PK
        string tipo_origen "Proveedor, Fabricante"
        string nombre_referencia
        string pais
        string telefono
        string correo
        string estado "ACTIVO, INACTIVO"
    }

    pedido_compra {
        int id_pedido PK
        int numero_pedido
        string nombre_pedido
        int id_origen_compra FK
        date fecha_pedido
        date fecha_recepcion
        string estado "REGISTRADO, EN_TRANSITO, RECIBIDO, CANCELADO"
        decimal inversion_total
        decimal costo_envio
        decimal impuestos_importacion
    }

    detalle_pedido_compra {
        int id_detalle_pedido PK
        int id_pedido FK
        int id_producto FK
        int cantidad_pedida
        decimal costo_unitario_origen
    }

    producto {
        int id_producto PK
        int id_categoria FK
        int id_tarifa_iva FK
        string nombre UK
        string sku
        decimal precio_venta_sugerido_sin_iva
        int stock_minimo
        boolean activo
    }

    lote_producto {
        int id_lote PK
        int id_pedido FK
        int id_producto FK
        string codigo_lote "L1, L2, etc."
        int cantidad_inicial
        int cantidad_recibida
        int cantidad_disponible
        decimal costo_unitario_real
        decimal precio_venta_recomendado
        string estado_lote "EN_PROCESO, EN_STOCK, VENDIDO_PARCIAL, AGOTADO"
        date fecha_entrada
    }

    movimiento_inventario {
        int id_movimiento PK
        int id_lote FK
        int id_usuario FK
        string tipo_movimiento "ENTRADA_COMPRA, SALIDA_VENTA, REINGRESO_ANULACION_VENTA"
        int cantidad
        decimal costo_unitario
        decimal total_movimiento
        datetime fecha_movimiento
    }

    venta {
        int id_venta PK
        int numero_venta UK
        datetime fecha_venta
        string cliente_nombre
        string medio_pago
        decimal subtotal
        decimal total_iva
        decimal total_descuento
        decimal total_venta
        decimal monto_pagado
        decimal saldo_pendiente
        string estado_venta "COMPLETADA, ANULADA"
    }

    detalle_venta {
        int id_detalle_venta PK
        int id_venta FK
        int id_producto FK
        int id_lote FK
        int cantidad
        decimal precio_unitario
        decimal porcentaje_descuento
        decimal descuento
        decimal iva
        decimal total_linea
        decimal costo_unitario_real
        decimal costo_total
        decimal ganancia_bruta
    }

    pago_venta {
        int id_pago PK
        int id_venta FK
        int id_usuario FK
        decimal monto
        string metodo_pago
        string referencia
        datetime fecha_pago
    }
```

---

## 8. CONCLUSIONES DE ARQUITECTURA

La arquitectura de **System MX** garantiza alta cohesión, bajo acoplamiento y cumplimiento riguroso de principios de seguridad e integridad financiera. Su diseño dual-dialect y su separación estricta entre la capa de presentación (SPA con accesibilidad WCAG 2.2 AAA e internacionalización) y la capa de servicios (NestJS con RBAC y ledger append-only) proporcionan una base sólida, mantenible y preparada para entornos de producción corporativos.
