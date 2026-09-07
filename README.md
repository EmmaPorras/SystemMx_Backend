# SystemMx Backend v1

Backend oficial y motor de APIs para el sistema de inventario, compras, pedidos, ventas y reportes analíticos de **SystemMx**.

Construido con **NestJS**, **TypeORM** y **Microsoft SQL Server**.

---

## 🚀 Inicio Rápido (Desarrollo)

### 1. Instalación de dependencias
```bash
npm ci
```

### 2. Configurar variables de entorno
Copiar `.env.example` a `.env` y configurar las credenciales locales de SQL Server:
```bash
cp .env.example .env
```

### 3. Ejecutar migraciones
```bash
npm run migration:run
```

### 4. Crear usuario administrador inicial (Bootstrap)
```bash
# Configurar temporalmente en la terminal o .env:
# SYSTEMMX_BOOTSTRAP_USERNAME=admin
# SYSTEMMX_BOOTSTRAP_NOMBRE="Administrador General"
# SYSTEMMX_BOOTSTRAP_PASSWORD="PasswordSegura123!*"
npm run bootstrap:user
```

### 5. Iniciar el servidor
```bash
npm run start:dev
```
La API estará disponible en `http://localhost:3000/api`.

---

## 🧪 Pruebas y Calidad

```bash
# Pruebas unitarias y de integración (477 tests)
npm test

# Smoke Test E2E reproducible (Orquestador automatizado)
.\scripts\run-systemmx-e2e.ps1

# Linter (ESLint)
npm run lint

# Compilación TypeScript
npm run build
```

---

## 📚 Documentación Oficial

| Documento | Descripción |
|---|---|
| 📄 [Estado Definitivo de Backend v1](docs/backend-v1-status.md) | Resumen ejecutivo, arquitectura, invariantes y evidencia de calidad. |
| 🗺️ [Matriz Definitiva de Endpoints API](docs/backend-api-matrix.md) | Catálogo exhaustivo de rutas, métodos HTTP y control de acceso por roles. |
| 🛠️ [Guía Operativa de Despliegue y Base de Datos](docs/backend-deployment.md) | Procedimientos de instalación limpia, actualización, migrations y variables. |
| 📊 [Catálogo de Reportes Analíticos](docs/reportes-catalogo.md) | Documentación financiera, fórmulas de reconciliación y 28 endpoints de solo lectura. |

---

## 🔒 Invariantes de Arquitectura

- **`synchronize: false` permanente**: El runtime de NestJS no realiza alteraciones automáticas de schema; todo cambio de base de datos se realiza mediante migraciones versionadas.
- **Seguridad en Profundidad**: Autenticación JWT, contraseñas hasheadas con **Argon2id**, versionado de credenciales y *Last-Admin Guard*.
- **Ledger Inmutable**: Movimientos de inventario (`MovimientoInventario`) y pagos (`PagoVenta`) operan bajo el patrón append-only.
- **Nacimiento de Productos por Pedido**: Catálogo de productos desacoplado de creaciones manuales; los productos nacen o se reutilizan exclusivamente en los pedidos de compra.

---

## 📄 Licencia

Propiedad de SystemMx. Todos los derechos reservados.
