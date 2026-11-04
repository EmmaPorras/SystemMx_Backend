# System MX — Backend REST API Engine

**System MX Backend** es el motor transaccional empresarial para la gestión de compras, inventario por lotes FIFO, facturación comercial, cobranza de cartera, conciliación financiera y reportería analítica.

Desplegado en producción sobre **Render** con base de datos en **Neon Serverless PostgreSQL**:  
🔗 **API Backend Oficial:** [https://systemmx-api-200684331.onrender.com/api](https://systemmx-api-200684331.onrender.com/api)  
🔗 **Endpoint de Salud:** [https://systemmx-api-200684331.onrender.com/api/health](https://systemmx-api-200684331.onrender.com/api/health)  
🔗 **Frontend Oficial:** [https://systemmx-web-200684331.onrender.com](https://systemmx-web-200684331.onrender.com)  

---

## 🚀 Tecnologías Principales

- **NestJS 11** (`@nestjs/core` 11.1.27)
- **TypeScript 5.7**
- **TypeORM 1.0** (Estrategia `synchronize: false` permanente con migraciones dual-dialect)
- **Motores de Base de Datos Soportados:**
  - **PostgreSQL 16** / Neon Serverless (Entorno de producción en la nube)
  - **Microsoft SQL Server 2022** / LocalDB (Entorno de desarrollo local y pruebas E2E aisladas)
- **Argon2id** (`argon2` 0.45.1 para hashing de contraseñas de alta seguridad)
- **NestJS JWT** (Autenticación con invalidación dinámica por versión de credenciales)
- **Throttler & Helmet** (Seguridad perimetral y rate limiting contra ataques de fuerza bruta)
- **Class-Validator** (Validación estricta de DTOs con rechazo de campos no autorizados)
- **Jest 30 + Supertest 7** (Suite de 626 pruebas unitarias/integración + 54 pruebas E2E)
- **GitHub Actions** (CI automatizado en `.github/workflows/neon-build-check.yml`)

---

## 🛠️ Inicio Rápido en Desarrollo Local

### 1. Requisitos Previos
- Node.js `v20.x` o superior (probado en Node v22 y v26)
- Microsoft SQL Server 2019/2022 en ejecución local (`localhost:1433`)
- Base de datos local creada: `inventario_motos_systemmx`

### 2. Instalación de Dependencias
```bash
npm ci
```

### 3. Configuración de Variables de Entorno
Copie `.env.example` a `.env` y ajuste las credenciales locales de SQL Server:
```powershell
cp .env.example .env
```

### 4. Compilación y Ejecución de Migraciones
```bash
npm run build
npm run migration:run:dist
```

### 5. Sembrado del Usuario Administrador
```bash
npm run bootstrap:user:dist
```

### 6. Iniciar Servidor en Desarrollo
```bash
npm run start:dev
```
La API estará disponible en `http://localhost:3000/api`.

---

## 🧪 Pruebas Automatizadas y Calidad

```bash
# Pruebas unitarias y de integración (626 pruebas aprobadas)
npm test -- --runInBand

# Pruebas End-to-End (E2E) con Base de Datos Aislada (54 pruebas)
# (Recrea inventario_motos_systemmx_e2e, migra y valida el ciclo comercial completo)
.\scripts\run-systemmx-e2e.ps1

# Compilar proyecto para producción
npm run build
```

---

## 📚 Documentación Oficial del Proyecto

La documentación exhaustiva se encuentra centralizada en la carpeta [`docs/final/`](docs/final/):

- [`00-AUDITORIA-INICIAL.md`](docs/final/00-AUDITORIA-INICIAL.md): Diagnóstico técnico de línea base y verificación de despliegue.
- [`01-ARQUITECTURA-Y-TECNOLOGIAS.md`](docs/final/01-ARQUITECTURA-Y-TECNOLOGIAS.md): Arquitectura C4, modelo entidad-relación (13 tablas) y decisiones técnicas.
- [`02-MANUAL-INSTALACION-Y-DESPLIEGUE.md`](docs/final/02-MANUAL-INSTALACION-Y-DESPLIEGUE.md): Manual paso a paso de instalación local y despliegue en Render / Neon.
- [`03-MANUAL-TECNICO-Y-SEGURIDAD.md`](docs/final/03-MANUAL-TECNICO-Y-SEGURIDAD.md): Modelo RBAC de 5 roles, Argon2id, invalidación de sesiones y prevención de ataques.
- [`04-MANUAL-DE-USUARIO.md`](docs/final/04-MANUAL-DE-USUARIO.md): Guía de uso de compras, almacén FIFO, punto de venta, cobranzas y reportes.
- [`05-MATRIZ-FUNCIONAL-Y-PRUEBAS.md`](docs/final/05-MATRIZ-FUNCIONAL-Y-PRUEBAS.md): Matriz de trazabilidad y evidencia real de 929 pruebas superadas.
- [`06-GUION-EXPOSICION-15MIN-RUBRICAS.md`](docs/final/06-GUION-EXPOSICION-15MIN-RUBRICAS.md): Guion de presentación evaluativa minuto a minuto con respuestas al jurado.
- [`SEGUIMIENTO-ENTREGA.md`](docs/final/SEGUIMIENTO-ENTREGA.md): Registro acumulativo de todas las fases ejecutadas.

---

## 👥 Equipo de Desarrollo

Proyecto desarrollado para la evaluación final de Ingeniería de Software — Noviembre 2026.
