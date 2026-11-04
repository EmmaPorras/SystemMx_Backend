# SYSTEM MX — AUDITORÍA TÉCNICA INICIAL Y LÍNEA BASE
**Fecha:** 3 de noviembre de 2026  
**Proyecto:** System MX — Plataforma Web de Gestión Comercial Integral  
**Repositorios:**
- Frontend: `https://github.com/EmmaPorras/SystemMx_Frontend`
- Backend: `https://github.com/EmmaPorras/SystemMx_Backend`

---

## 1. ESTADO DE LOS REPOSITORIOS Y RAMAS

### 1.1 Frontend (`SystemMx_Frontend`)
- **Ramas activas analizadas:** `main`, `deploy-render`, `integracion-deploy-render`.
- **Línea base de commits:** `origin/main`, `origin/deploy-render` y `origin/integracion-deploy-render` se encuentran completamente sincronizadas en el commit `3b07b48` (*merge: sincronizar con origin/main*).
- **Estado de trabajo local:** Árbol limpio antes de iniciar.
- **Rama de preparación creada:** `prep-entrega-final` basada en `integracion-deploy-render` / `main`.
- **Compilación estática:**
  - Comando: `npm run build` (`tsc -b && vite build`)
  - Resultado: **EXITOSO (Exit Code 0)** en 41.53 segundos.
  - Artefactos: `dist/index.html` (2.03 kB), `dist/assets/index-DFqpVyU0.css` (70.53 kB), bundle JavaScript principal (2.14 MB).
- **Pruebas automatizadas (Vitest + JSDOM):**
  - Total: 46 archivos de prueba, 249 pruebas individuales.
  - Al ejecutarse de forma aislada: **100% de éxito**.
  - Al ejecutarse la suite completa en paralelo en Windows: 4 pruebas excedieron por pocos milisegundos el tiempo límite por defecto de 5000 ms (`testTimeout` requerido en `vitest.config.ts`).
- **Linter (ESLint):**
  - El archivo `eslint.config.js` existe en la raíz, pero el proyecto carece de las dependencias correspondientes (`@eslint/js`, `globals`, `typescript-eslint`, etc.) en `devDependencies` de `package.json` y no dispone de script `npm run lint`.
- **Integración Continua (CI):**
  - No cuenta con directorio `.github/workflows`.

### 1.2 Backend (`SystemMx_Backend`)
- **Ramas activas analizadas:** `main`, `deploy-neon`, `integracion-deploy-neon`.
- **Línea base de commits:** `origin/main`, `origin/deploy-neon` y `origin/integracion-deploy-neon` se encuentran sincronizadas en el commit `33f6085` (*fix(health): registrar AppController con endpoints de salud y raíz para prevenir 404/503 en Render*).
- **Estado de trabajo local:** Árbol limpio antes de iniciar.
- **Rama de preparación creada:** `prep-entrega-final` basada en `integracion-deploy-neon` / `main`.
- **Compilación:**
  - Comando: `npm run build` (`nest build`)
  - Resultado: **EXITOSO (Exit Code 0)**. Genera `dist/`.
- **Pruebas automatizadas (Jest):**
  - Comando: `npm test -- --runInBand`
  - Resultado: **55 Test Suites superadas (55/55), 626 pruebas exitosas, 1 omitida intencionalmente, 0 fallos**.
  - Tiempo de ejecución: 92.47 s. Cobertura en auth, usuarios, pedidos, inventario, ventas, reportes, migraciones y utilidades.
- **Linter (ESLint + Prettier):**
  - Script disponible: `npm run lint`. Detecta diferencias estilísticas de terminación de línea (CRLF/LF) asociadas al entorno Windows sin errores sintácticos de TypeScript.
- **Integración Continua (CI):**
  - Existe archivo `.github/workflows/neon-build-check.yml`, pero solo se activa en push a `deploy-neon` y solo ejecuta `npm run build` (sin pruebas unitarias ni validación en pull requests).

---

## 2. FUNCIONALIDADES ENCONTRADAS E IMPLEMENTADAS

System MX cuenta con un alcance funcional completo que cubre el ciclo operativo de comercio y gestión:

1. **Autenticación y Sesiones:**
   - Login por JWT con Argon2 para hash de contraseñas.
   - Activación de cuentas mediante token criptográfico y envío de correo vía webhook de Google Apps Script.
   - Recuperación de contraseña y restablecimiento seguro.
   - Registro público de usuarios (auto-asignación protegida de rol DEMO).
   - Bloqueo contra fuerza bruta / rate limiting con `@nestjs/throttler` (120 req/min).

2. **Roles y Control de Acceso (RBAC):**
   - Matriz de roles: `ADMIN`, `COMPRAS`, `VENTAS`, `CONSULTA`, `DEMO`.
   - Frontend: `ProtectedRoute` y mapa granular de permisos en `permissions.ts`.
   - Backend: `RolesGuard`, `JwtAuthGuard` y decorador `@Roles(...)`.
   - Blindaje de rol `DEMO`: navegación completa habilitada en solo lectura / operaciones aisladas, impidiendo alteraciones en catálogos comerciales reales.

3. **Catálogos Base:**
   - Proveedores: CRUD, filtros, asignación de país y moneda preferida.
   - Categorías: CRUD con control de unicidad de código y nombre.
   - Tarifas IVA: Soporte dinámico de tarifas activas/inactivas (0%, 5%, 13%, etc.) con almacenamiento numérico estricto.

4. **Gestión de Compras y Proveedores:**
   - Órdenes de compra con cálculo multimoneda y costo unitario real.
   - Selección de proveedor y detalle de ítems.

5. **Recepción de Mercadería y Lotes (FIFO):**
   - Recepciones totales y parciales vinculadas a órdenes de compra.
   - Generación automática de lotes (`lote-producto`) con fecha de vencimiento y costo de adquisición.
   - Registro automático en Kardex (`movimiento-inventario`).

6. **Inventario:**
   - Consulta de stock disponible consolidado y por lote.
   - Prohibición estricta de inventario negativo mediante validaciones a nivel de base de datos y de servicio.

7. **Ventas y Facturación:**
   - Creación de ventas con productos disponibles en stock.
   - Aplicación automática de método FIFO (First In, First Out) para la salida de lotes.
   - Cálculo automático de subtotal, descuentos e IVA según la tarifa seleccionada.
   - Rechazo inmediato de ventas ante stock insuficiente o lotes vencidos.

8. **Cuentas por Cobrar y Pagos:**
   - Soporte para ventas al contado y a crédito.
   - Registro de abonos parciales y liquidación total.
   - Control de saldo pendiente y trazabilidad de pagos recibidos.

9. **Anulaciones de Venta:**
   - Anulación con reversión íntegra de stock hacia los lotes originales.
   - Auditoría del motivo de anulación y usuario responsable.

10. **Módulo Analítico y Reportería (28 Reportes):**
    - Catálogo exhaustivo que incluye: ventas por período, ventas por vendedor, rotación de inventario, existencias valorizadas, vencimiento de lotes, antigüedad de saldos, márgenes de utilidad, auditoría de accesos y movimientos.
    - Exportación a PDF (jsPDF + autotable) y Excel (ExcelJS / SheetJS).

11. **Internacionalización y Accesibilidad:**
    - i18next con soporte para Español (`es`), Inglés (`en`) y Portugués (`pt`).
    - Widget de accesibilidad UserWay integrado en HTML principal (`data-account="fM98dI0Efj"`).
    - Pruebas de accesibilidad con `axe-core` en componentes clave.

---

## 3. ERRORES Y DEFECTOS CONFIRMADOS

| ID | Componente | Descripción del Defecto | Severidad | Impacto |
|---|---|---|---|---|
| ERR-01 | Frontend | `vitest.config.ts` no especifica `testTimeout`, causando fallos por timeout (>5000ms) en 4 pruebas cuando toda la suite corre en paralelo en Windows. | Media | Falso negativo en pruebas automatizadas completas. |
| ERR-02 | Frontend | Faltan paquetes de ESLint en `devDependencies` (`@eslint/js`, `typescript-eslint`, etc.) y falta script `npm run lint`. | Baja | Imposibilidad de ejecutar `npx eslint .` en frontend. |
| ERR-03 | Frontend | Archivo `.env` rastreado en Git. Si bien solo contiene `VITE_API_URL`, el `.gitignore` solo ignora `.env.local`. | Media | Riesgo de filtrar variables si se agregan secretos en el futuro. |
| ERR-04 | Backend | Workflow de GitHub Actions (`neon-build-check.yml`) solo compila y no ejecuta pruebas unitarias ni linters, ni valida PRs. | Media | Ausencia de validación continua de calidad en repositorios remotos. |
| ERR-05 | Frontend | Ausencia total de workflow de GitHub Actions en el repositorio frontend. | Media | Sin verificación automática de build/tests en push o PR del frontend. |
| ERR-06 | Documentación | Archivo `build-errors.txt` en la raíz del frontend genera confusión sobre errores ya corregidos. | Baja | Deuda documental. |

---

## 4. RIESGOS DE SEGURIDAD DETECTADOS

1. **Rastreo de `.env` en Frontend:**
   - Estado: El archivo contiene únicamente `VITE_API_URL=http://localhost:3001/api`. No hay secretos expuestos actualmente, pero debe removerse del rastreo de git y agregarse la regla general en `.gitignore` para prevenir futuras fugas.
2. **Ambiente de Base de Datos E2E:**
   - Verificado: El código cuenta con la función protectora `assertSafeE2eDatabaseName` que rechaza cualquier base de datos que no termine en `_e2e`. Esto garantiza que ninguna prueba destruya datos de desarrollo local ni de producción.
3. **Secretos en Backend:**
   - Verificado: En backend, `.env` está en `.gitignore`. En Render, los secretos (`JWT_SECRET`, `DATABASE_URL`, `SYSTEMMX_MAIL_SECRET`) están configurados como variables de entorno privadas en el panel del hosting, no en el repositorio.

---

## 5. ESTADO DE LOS DESPLIEGUES EN LA NUBE (RENDER)

Ambos servicios fueron verificados mediante solicitudes HTTP en vivo el 3 de noviembre de 2026:

1. **Backend API:**
   - URL: `https://systemmx-api-200684331.onrender.com/api/health`
   - Estado: **HTTP 200 OK**
   - Payload: `{"status":"ok","service":"systemmx-backend","timestamp":"2026-11-04T03:08:51.818Z"}`
   - Cabeceras de seguridad activas: CSP, X-Frame-Options (SAMEORIGIN), HSTS, Rate Limit (120 req/min).
2. **Frontend Web:**
   - URL: `https://systemmx-web-200684331.onrender.com`
   - Estado: **HTTP 200 OK**
   - Carga correcta de HTML5, UserWay widget, bundle CSS y JS, y script de redirección a HashRouter para compatibilidad estática.

---

## 6. MATRIZ DE PRIORIDADES DE CORRECCIÓN

1. **Prioridad 1 (Configuración y Seguridad):**
   - Corregir `.gitignore` del frontend para ignorar `.env` y variantes locales.
   - Retirar `.env` del índice de git manteniendo `.env.example`.
2. **Prioridad 2 (Compilación y Pruebas Automatizadas):**
   - Ajustar `testTimeout: 20000` en `vitest.config.ts` del frontend para asegurar 100% de pruebas verdes (249/249).
   - Instalar dependencias de ESLint en frontend y configurar script `npm run lint`.
   - Implementar GitHub Actions workflows en ambos repositorios (CI para build y pruebas).
3. **Prioridad 3 (Pruebas Funcionales e Integración):**
   - Ejecutar la batería E2E aislada `test:e2e:systemmx` contra SQL Server local.
   - Validar los 10 escenarios comerciales de extremo a extremo.
4. **Prioridad 4 (Usabilidad, Accesibilidad e Internacionalización):**
   - Validar paridad de traducciones (es, en, pt) y consistencia del widget UserWay.
5. **Prioridad 5 (Documentación y Preparación de Exposición):**
   - Elaborar toda la documentación técnica, manuales y guion para la rúbrica de 100 puntos en `docs/final/`.
