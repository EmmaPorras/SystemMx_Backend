# 02 — MANUAL DE INSTALACIÓN Y DESPLIEGUE — SYSTEM MX

**Proyecto:** System MX — Plataforma Web de Gestión Comercial  
**Versión:** 1.0.0 (Estabilización Final)  
**Fecha:** Noviembre de 2026  
**Entorno de Despliegue:** Render (Cloud) + Neon PostgreSQL / MSSQL Server Local  

---

## 1. REQUISITOS PREVIOS DEL SISTEMA

Antes de iniciar la instalación de **System MX**, asegúrese de contar con las siguientes herramientas y dependencias instaladas en su entorno:

### 1.1 Entorno de Ejecución y Herramientas
- **Node.js**: Versión `v20.x`, `v22.x` o superior (verificado en Node.js v26.13.0).
- **npm**: Versión `10.x` o superior (incluido con Node.js).
- **Git**: Versión `2.40.x` o superior para control de versiones.
- **PowerShell** (Windows) o **Bash** (Linux/macOS) con permisos de ejecución de scripts.

### 1.2 Motores de Base de Datos
- **Entorno Local (Desarrollo y E2E):**
  - Microsoft SQL Server 2019, 2022 o SQL Server Express/LocalDB con autenticación SQL o Windows habilitada en el puerto estándar `1433`.
  - Herramienta cliente opcional: SQL Server Management Studio (SSMS) o Azure Data Studio.
- **Entorno Cloud (Producción):**
  - PostgreSQL 15/16 o Neon Serverless PostgreSQL con soporte para conexiones seguras SSL (`sslmode=require`).

---

## 2. INSTALACIÓN Y EJECUCIÓN EN ENTORNO LOCAL

El proyecto consta de dos repositorios independientes: `SystemMx_Backend` y `SystemMx_Frontend`.

### 2.1 Configuración del Backend (`SystemMx_Backend`)

#### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/EmmaPorras/SystemMx_Backend.git
cd SystemMx_Backend
git checkout prep-entrega-final
```

#### Paso 2: Instalar dependencias limpias
```bash
npm ci
```

#### Paso 3: Configurar variables de entorno
Copie la plantilla de variables de ejemplo:
```powershell
Copy-Item .env.example .env
```
Edite `.env` con los valores correspondientes a su instancia local de SQL Server:
```env
PORT=3000
NODE_ENV=development

# Configuración de Base de Datos SQL Server Local
DB_TYPE=mssql
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=TuPasswordSeguro123!
DB_DATABASE=inventario_motos_systemmx
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
DB_LOGGING=false

# Seguridad JWT
JWT_SECRET=super_secreto_para_desarrollo_local_systemmx_2026
JWT_EXPIRES_SECONDS=3600

# CORS (Permitir frontend local y Render)
CORS_ORIGINS=http://localhost:5173,https://systemmx-web-200684331.onrender.com

# Sembrado inicial del Administrador
SYSTEMMX_BOOTSTRAP_USERNAME=admin
SYSTEMMX_BOOTSTRAP_NOMBRE=Administrador General
SYSTEMMX_BOOTSTRAP_PASSWORD=AdminPassword123!

# Servicio de Correo (Google Apps Script Webhook)
SYSTEMMX_MAIL_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzhgblogxuMY6fx8toDEl_ni1YeoalG60HDXpfD_HMCzXNUW10oqz__kb4PYtCZ9ftc1w/exec
SYSTEMMX_MAIL_SECRET=clave_secreta_webhook
SYSTEMMX_MAIL_FROM=notificaciones@systemmx.com
SYSTEMMX_FRONTEND_URL=http://localhost:5173
```

#### Paso 4: Compilar y ejecutar migraciones
Compile el código TypeScript y ejecute las 4 migraciones estructurales sobre la base de datos:
```powershell
npm run build
npm run migration:run:dist
```

#### Paso 5: Sembrar el usuario administrador inicial
Cree el usuario administrador en la base de datos recién migrada:
```powershell
npm run bootstrap:user:dist
```

#### Paso 6: Iniciar el servidor backend en desarrollo
```powershell
npm run start:dev
```
El backend estará disponible en `http://localhost:3000/api`. Puede verificar la salud del servicio en `http://localhost:3000/api/health`.

---

### 2.2 Configuración del Frontend (`SystemMx_Frontend`)

#### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/EmmaPorras/SystemMx_Frontend.git
cd SystemMx_Frontend
git checkout prep-entrega-final
```

#### Paso 2: Instalar dependencias limpias
```bash
npm ci
```

#### Paso 3: Configurar variables de entorno
Copie la plantilla de variables de entorno:
```powershell
Copy-Item .env.example .env
```
Configure la URL de la API backend en `.env`:
```env
# Para desarrollo local apuntando a backend local:
VITE_API_URL=http://localhost:3000/api

# O para desarrollo apuntando a la API de producción en Render:
# VITE_API_URL=https://systemmx-api-200684331.onrender.com/api
```

#### Paso 4: Iniciar el servidor de desarrollo
```powershell
npm run dev
```
La aplicación web se abrirá automáticamente en `http://localhost:5173` (con soporte para hot-module-reloading).

---

## 3. EJECUCIÓN DE PRUEBAS AUTOMATIZADAS LOCALES

### 3.1 Pruebas del Backend

#### Pruebas Unitarias y de Integración (55 suites, 626 pruebas):
```powershell
cd SystemMx_Backend
npm test -- --runInBand
```

#### Pruebas End-to-End (E2E) con Base de Datos Aislada:
El backend incluye un script automatizado que valida la seguridad del entorno (`DB_DATABASE` debe terminar en `_e2e`), recrea la base de datos de pruebas desde cero, ejecuta las 4 migraciones y corre las 54 pruebas E2E:
```powershell
cd SystemMx_Backend
.\scripts\run-systemmx-e2e.ps1
```
*Resultado esperado:* 54 passed (100% éxito) en ~18 segundos.

### 3.2 Pruebas del Frontend

#### Ejecución de la suite completa Vitest (46 suites, 249 pruebas):
```powershell
cd SystemMx_Frontend
npm test -- --run
```

#### Auditoría de Código (ESLint):
```powershell
npm run lint
```
*Resultado esperado:* 0 errores y 0 advertencias.

#### Compilación de Producción:
```powershell
npm run build
```
Genera la carpeta optimizada `./dist` lista para entrega o alojamiento en CDN.

---

## 4. DESPLIEGUE EN LA NUBE (RENDER)

El sistema se encuentra configurado para despliegue automático en **Render** mediante el archivo de infraestructura como código `render.yaml`.

### 4.1 Despliegue del Backend (`Web Service` en Render)

| Parámetro | Valor de Configuración |
|---|---|
| **Tipo de Servicio** | Web Service |
| **Nombre** | `systemmx-api-200684331` |
| **Entorno de Ejecución** | Node.js (Node 22) |
| **Plan** | Free / Standard |
| **Región** | Oregon o Virginia |
| **Repositorio** | `https://github.com/EmmaPorras/SystemMx_Backend` |
| **Rama de Producción** | `deploy-neon` (o `main`) |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Initial Deploy Hook**| `npm run bootstrap:user:dist` |
| **Health Check Path** | `/api/health` |

#### Variables de Entorno Requeridas en Render (Backend):
- `NODE_ENV`: `production`
- `PORT`: `10000` (asignado automáticamente por Render)
- `DATABASE_URL`: Cadena de conexión Neon PostgreSQL con pool (e.g., `postgresql://user:pass@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`)
- `DATABASE_URL_UNPOOLED`: Cadena directa sin pool para migraciones DDL (e.g., `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`)
- `JWT_SECRET`: Token alfanumérico seguro de al menos 64 caracteres generado automáticamente por Render.
- `JWT_EXPIRES_SECONDS`: `3600` (1 hora)
- `CORS_ORIGINS`: `https://systemmx-web-200684331.onrender.com`
- `SYSTEMMX_BOOTSTRAP_USERNAME`: Nombre del administrador inicial (e.g., `admin`).
- `SYSTEMMX_BOOTSTRAP_NOMBRE`: Nombre completo del administrador.
- `SYSTEMMX_BOOTSTRAP_PASSWORD`: Contraseña de alta seguridad (mínimo 15 caracteres con mayúsculas, minúsculas, números y símbolos).
- `SYSTEMMX_MAIL_APPS_SCRIPT_URL`: Webhook de Google Apps Script para notificaciones de invitaciones.
- `SYSTEMMX_MAIL_SECRET`: Clave de autenticación del webhook de correo.
- `SYSTEMMX_MAIL_FROM`: Dirección del remitente de notificaciones.
- `SYSTEMMX_FRONTEND_URL`: `https://systemmx-web-200684331.onrender.com`

---

### 4.2 Despliegue del Frontend (`Static Site` en Render)

| Parámetro | Valor de Configuración |
|---|---|
| **Tipo de Servicio** | Static Site |
| **Nombre** | `systemmx-web-200684331` |
| **Repositorio** | `https://github.com/EmmaPorras/SystemMx_Frontend` |
| **Rama de Producción** | `deploy-render` (o `main`) |
| **Build Command** | `npm ci && npm run build` |
| **Publish Directory** | `./dist` |
| **Regla de Reescritura**| Source: `/*` -> Destination: `/index.html` (Tipo: Rewrite) |

#### Variables de Entorno en Render (Frontend):
- `VITE_API_URL`: `https://systemmx-api-200684331.onrender.com/api`

---

### 4.3 Despliegue con Infraestructura como Código (`render.yaml`)

El repositorio contiene el manifiesto `render.yaml` que permite levantar ambos servicios de manera coordinada directamente desde el dashboard de Render seleccionando **"New +" -> "Blueprint"**:

```yaml
services:
  - type: web
    name: systemmx-api-200684331
    runtime: node
    plan: free
    region: virginia
    repo: https://github.com/EmmaPorras/SystemMx_Backend
    branch: deploy-neon
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    initialDeployHook: npm run bootstrap:user:dist
    autoDeployTrigger: commit
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_SECONDS
        value: "3600"
      - key: CORS_ORIGINS
        value: https://systemmx-web-200684331.onrender.com
      - key: DB_LOGGING
        value: "false"

  - type: web
    name: systemmx-web-200684331
    runtime: static
    repo: https://github.com/EmmaPorras/SystemMx_Frontend
    branch: deploy-render
    buildCommand: npm ci && npm run build
    staticPublishPath: ./dist
    autoDeployTrigger: commit
    envVars:
      - key: VITE_API_URL
        value: https://systemmx-api-200684331.onrender.com/api
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

---

## 5. VERIFICACIÓN Y DIAGNÓSTICO POST-DESPLIEGUE

### 5.1 Comprobación Rápida de Salud
Ejecute la siguiente consulta en consola para validar que el servicio backend esté respondiendo activamente:
```bash
curl -i https://systemmx-api-200684331.onrender.com/api/health
```
*Respuesta esperada:*
```json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"ok","service":"systemmx-backend","timestamp":"2026-11-04T03:51:53.317Z"}
```

### 5.2 Diagnóstico de Errores Comunes

1. **Error CORS (`Access-Control-Allow-Origin`):**
   - *Causa:* El dominio del frontend no coincide con los orígenes listados en `CORS_ORIGINS`.
   - *Solución:* Asegurarse de que `CORS_ORIGINS` en el backend contenga la URL exacta del frontend sin barra diagonal final (`https://systemmx-web-200684331.onrender.com`).

2. **Error 401 en Peticiones Post-Login:**
   - *Causa:* Desincronización del reloj del servidor o expiración del token JWT (duración configurada en `JWT_EXPIRES_SECONDS=3600`).
   - *Solución:* Iniciar sesión nuevamente para emitir un token nuevo. Si el usuario cambió de contraseña o rol, el sistema incrementa `version_credenciales`, lo cual invalida intencionalmente los tokens anteriores por seguridad.

3. **Error de Conexión a Neon PostgreSQL (`Connection Terminated Unexpectedly`):**
   - *Causa:* La conexión al pool de Neon se suspende tras inactividad en el plan serverless.
   - *Solución:* TypeORM reconecta automáticamente al recibir una petición entrante; el endpoint `/api/health` sirve como *keep-alive*.
