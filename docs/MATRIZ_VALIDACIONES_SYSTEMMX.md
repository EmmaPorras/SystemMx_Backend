# MATRIZ INTEGRAL DE VALIDACIONES Y PARIDAD DE CONTRATOS — SYSTEMMX

## 1. OBJETIVO Y ALCANCE

Este documento define la **Matriz Integral de Validaciones** para el sistema SystemMx (Frontend React 19 + TypeScript y Backend NestJS 11 + TypeORM). Establece el contrato único e inquebrantable de validación entre ambas capas, garantizando:

1. **Paridad Absoluta Frontend / Backend**: Todo dato que el frontend acepte es validado y aceptado por el backend bajo las mismas restricciones. Todo dato que el backend rechace es advertido y rechazado en el frontend antes de la transmisión o devuelto con error comprensible sin provocar fallos de aplicación.
2. **Normalización y Sanitización**: Política explícita de manejo de espacios en blanco (`trim`), caracteres legítimos humanos (acentos, diéresis, virgulillas `ñ`, apóstrofes, guiones, Unicode internacional) sin prohibición indiscriminada de caracteres.
3. **Seguridad y Contratos Fuertes**: Validación en profundidad con `class-validator`, `class-transformer` con `whitelist: true` y `forbidNonWhitelisted: true`, consultas parametrizadas contra inyección SQL y política estricta de contraseñas de 15 a 128 caracteres.
4. **Traducción Tripartita de Errores**: Todos los mensajes de validación están estandarizados y cubiertos en Español (`es`), Inglés (`en`) y Portugués (`pt`).
5. **Trazabilidad de Pruebas**: Cada campo y regla cuenta con pruebas unitarias y de integración en Frontend (Vitest) y Backend (Jest).

---

## 2. POLÍTICA GLOBAL DE DATOS Y CARACTERES

### 2.1. Textos y Cadenas Humanas
- **Campos de Nombre, Descripción, Razón Social, Observaciones**:
  - Aceptan cualquier carácter alfanumérico Unicode (incluyendo letras con tildes `á, é, í, ó, ú, Á, É, Í, Ó, Ú`, `ñ, Ñ`, `ç, Ç`, apóstrofes `'`, comillas simples y dobles, guiones `-`, paréntesis `()`, puntos y signos de puntuación).
  - No se eliminan silenciosamente caracteres válidos.
  - Se normalizan mediante `trim()` eliminando espacios redundantes al inicio y al final en las capas de presentación y servicio.

### 2.2. Identificadores de Usuario (`username`)
- **Regla**: Alfanumérico con punto, guion y guion bajo (`/^[a-zA-Z0-9._-]+$/`).
- **Longitud**: Mínimo 3 caracteres, máximo 50 caracteres.
- **Normalización**: Minúsculas en base de datos para prevenir duplicados por casing. No permite espacios.

### 2.3. Contraseñas (`password`)
- **Política Nueva de Seguridad**:
  - Mínimo: 15 caracteres. Máximo: 128 caracteres.
  - Admite espacios intermedios, frases de paso (`passphrases`), símbolos y cualquier carácter Unicode.
  - **Prohibido aplicar `trim()`** o truncar silenciosamente. El usuario tiene control total sobre su frase secreta.
  - Rechaza contraseñas triviales (ej. secuencias numéricas, palabras de diccionario como `Password123456789!`, o caracteres repetidos).
  - **Compatibilidad histórica**: El endpoint `POST /api/auth/login` valida presencia sin exigir mínimo de 15 caracteres para permitir el acceso a cuentas creadas bajo esquemas anteriores, exigiendo la nueva política al cambiarla o restablecerla.

### 2.4. Números, Monedas y Porcentajes
- **Monedas**: Admitidas según catálogo de divisas (`CRC`, `USD`, `EUR`, `COP`, `BRL`).
- **Montos Monetarios**: Tipo numérico decimal con escala máxima de 2 decimales (`decimal(12,2)`). Se rechazan valores negativos, `NaN`, `Infinity` y valores con más de 2 cifras decimales en endpoints transaccionales.
- **Porcentajes**: Valores flotantes entre `0.00` y `100.00` con máximo 2 decimales.
- **Cantidades Físicas**: Enteros positivos estrictos (`>= 1`, máximo `99999`).

### 2.5. Fechas
- **Formato Estricto**: `YYYY-MM-DD` (ISO 8601).
- **Validación Cronológica**: Fechas iniciales (`fechaDesde`) deben ser menores o iguales a fechas finales (`fechaHasta`).
- **Recepción**: `fechaRecepcion >= fechaPedido`.

---

## 3. MATRIZ DETALLADA POR MÓDULO

### 3.1. Autenticación y Cuentas de Usuario

| Operación / Endpoint | Campo (Frontend / Backend) | Tipo | Req / Opc | Opcional Permitido | Min / Max | Formato / Caracteres | Normalización | Rango / Negocio / BD | Mensajes Error (ES / EN / PT) | Pruebas Asociadas |
|---|---|---|---|---|---|---|---|---|---|---|
| `POST /api/auth/login` | `username` / `username` | String | Req | N/A | 1 - 50 | Alfanumérico `[a-zA-Z0-9._-]` | trim() | Existente en BD | **ES**: Usuario requerido.<br>**EN**: Username required.<br>**PT**: Usuário obrigatório. | Backend: `auth.service.spec.ts`<br>Frontend: `LoginPage.test.tsx` |
| `POST /api/auth/login` | `password` / `password` | String | Req | N/A | 1 - 128 | Texto libre / Unicode | Sin trim | Verificación Argon2id | **ES**: Contraseña requerida.<br>**EN**: Password required.<br>**PT**: Senha obrigatória. | Backend: `auth.service.spec.ts`<br>Frontend: `LoginPage.test.tsx` |
| `POST /api/auth/registro` | `nombre` / `nombre` | String | Req | N/A | 2 - 100 | Texto libre Unicode, acentos, espacios | trim() | Nombre de pila o razón | **ES**: El nombre debe tener al menos 2 caracteres.<br>**EN**: Name must be at least 2 characters.<br>**PT**: O nome deve ter pelo menos 2 caracteres. | Backend: `auth-registro.integration.spec.ts`<br>Frontend: `RegistroPage.test.tsx` |
| `POST /api/auth/registro` | `username` / `username` | String | Req | N/A | 3 - 50 | `/^[a-zA-Z0-9._-]+$/` | trim() | Único en tabla `usuario` | **ES**: Usuario debe tener 3 a 50 caracteres alfanuméricos.<br>**EN**: Username must have 3-50 alphanumeric characters.<br>**PT**: Usuário deve ter de 3 a 50 caracteres alfanuméricos. | Backend: `auth-registro.integration.spec.ts`<br>Frontend: `RegistroPage.test.tsx` |
| `POST /api/auth/registro` | `email` / `email` | String | Req | N/A | 5 - 100 | Formato RFC 5322 Email | trim(), lowercase | Único en tabla `usuario` | **ES**: Correo electrónico no válido.<br>**EN**: Invalid email format.<br>**PT**: Formato de e-mail inválido. | Backend: `auth-registro.integration.spec.ts`<br>Frontend: `RegistroPage.test.tsx` |
| `POST /api/auth/registro` | `password` / `password` | String | Req | N/A | 15 - 128 | Unicode, símbolos, espacios | Raw (sin trim) | Política fuerte, no trivial | **ES**: La contraseña debe tener entre 15 y 128 caracteres y no ser trivial.<br>**EN**: Password must be 15-128 chars and not trivial.<br>**PT**: A senha deve ter entre 15 e 128 caracteres e não ser trivial. | Backend: `password-policy.validator.spec.ts`<br>Frontend: `RegistroPage.test.tsx` |
| `POST /api/auth/registro` | `rol` / `rol` | String | Opc | undefined | Enum | RolUsuario (`DEMO` forzado en backend) | Asignación backend | Rol asignado siempre `DEMO` | **ES**: Rol no autorizado.<br>**EN**: Unauthorized role.<br>**PT**: Função não autorizada. | Backend: `auth-registro.integration.spec.ts` |
| `POST /api/auth/recuperar-password` | `email` / `email` | String | Req | N/A | 5 - 100 | Formato Email | trim(), lowercase | Genera token transaccional | **ES**: Correo no válido.<br>**EN**: Invalid email.<br>**PT**: E-mail inválido. | Backend: `usuarios.service.spec.ts`<br>Frontend: `auth-flows.test.tsx` |
| `POST /api/auth/activar-cuenta` | `token` / `token` | String | Req | N/A | 16 - 128 | Token hexadecimal seguro | trim() | Token activo, no expirado | **ES**: Token inválido o expirado.<br>**EN**: Invalid or expired token.<br>**PT**: Token inválido ou expirado. | Backend: `auth-registro.integration.spec.ts`<br>Frontend: `auth-flows.test.tsx` |
| `POST /api/auth/activar-cuenta` | `password` / `password` | String | Req | N/A | 15 - 128 | Unicode, símbolos, frases | Raw (sin trim) | Política fuerte (Argon2id) | **ES**: Contraseña debe cumplir mínimo 15 caracteres.<br>**EN**: Password must be at least 15 chars.<br>**PT**: Senha deve ter pelo menos 15 caracteres. | Backend: `password-policy.validator.spec.ts`<br>Frontend: `auth-flows.test.tsx` |
| `POST /api/auth/restablecer-password` | `token` / `token` | String | Req | N/A | 16 - 128 | Token hexadecimal | trim() | Token activo tipo recuperación | **ES**: Enlace no válido.<br>**EN**: Invalid link.<br>**PT**: Link inválido. | Backend: `usuarios.service.spec.ts`<br>Frontend: `auth-flows.test.tsx` |
| `POST /api/auth/restablecer-password` | `password` / `password` | String | Req | N/A | 15 - 128 | Unicode, frases | Raw | Invalida sesiones activas | **ES**: Mínimo 15 caracteres requeridos.<br>**EN**: Minimum 15 characters required.<br>**PT**: Mínimo de 15 caracteres necessários. | Backend: `password-policy.validator.spec.ts`<br>Frontend: `auth-flows.test.tsx` |

---

### 3.2. Módulo de Usuarios

| Operación / Endpoint | Campo | Tipo | Req / Opc | Opcional Permitido | Min / Max | Formato / Caracteres | Normalización | Rango / Negocio / BD | Mensajes Error (ES / EN / PT) | Pruebas Asociadas |
|---|---|---|---|---|---|---|---|---|---|---|
| `POST /api/usuarios` | `username` | String | Req | N/A | 3 - 50 | `/^[a-zA-Z0-9._-]+$/` | trim() | Único en `usuario.username` | **ES**: Username debe ser único y alfanumérico.<br>**EN**: Username must be unique and alphanumeric.<br>**PT**: O usuário deve ser exclusivo e alfanumérico. | Backend: `create-usuario.dto.spec.ts`<br>Frontend: `UsuariosPage.test.tsx` |
| `POST /api/usuarios` | `nombre` | String | Req | N/A | 2 - 100 | Texto libre Unicode | trim() | Almacena nombre completo | **ES**: Nombre obligatorio (2-100 car.).<br>**EN**: Name required (2-100 chars).<br>**PT**: Nome obrigatório (2-100 car.). | Backend: `create-usuario.dto.spec.ts`<br>Frontend: `UsuariosPage.test.tsx` |
| `POST /api/usuarios` | `password` | String | Req | N/A | 15 - 128 | Unicode, símbolos | Raw | Hash Argon2id | **ES**: Mínimo 15 caracteres sin patrones triviales.<br>**EN**: Min 15 chars without trivial patterns.<br>**PT**: Mínimo de 15 car. sem padrões triviais. | Backend: `create-usuario.dto.spec.ts` |
| `POST /api/usuarios` | `rol` | Enum | Req | N/A | Enum | `ADMIN`, `VENTAS`, `COMPRAS`, `CONSULTA`, `DEMO` | Valor exacto | Catálogo de roles | **ES**: Rol no válido.<br>**EN**: Invalid role.<br>**PT**: Função inválida. | Backend: `create-usuario.dto.spec.ts` |
| `PATCH /api/usuarios/:id/estado` | `activo` | Boolean | Req | N/A | N/A | `true` o `false` | Booleano | Guard de último ADMIN activo | **ES**: No se puede desactivar al último administrador.<br>**EN**: Cannot deactivate the last administrator.<br>**PT**: Não é possível desativar o último administrador. | Backend: `usuarios.service.spec.ts` |
| `PATCH /api/usuarios/:id/rol` | `rol` | Enum | Req | N/A | Enum | `RolUsuario` | Valor exacto | Guard de último ADMIN | **ES**: No se puede quitar el rol al último administrador.<br>**EN**: Cannot demote the last administrator.<br>**PT**: Não é possível alterar a função do último administrador. | Backend: `usuarios.service.spec.ts` |
| `PATCH /api/usuarios/:id/password` | `password` | String | Req | N/A | 15 - 128 | Unicode, frases | Raw | Invalida tokens previos | **ES**: Mínimo 15 caracteres.<br>**EN**: Minimum 15 chars.<br>**PT**: Mínimo de 15 car. | Backend: `usuarios.service.spec.ts` |

---

### 3.3. Tarifas de IVA

| Operación / Endpoint | Campo | Tipo | Req / Opc | Opcional Permitido | Min / Max | Formato / Caracteres | Normalización | Rango / Negocio / BD | Mensajes Error (ES / EN / PT) | Pruebas Asociadas |
|---|---|---|---|---|---|---|---|---|---|---|
| `POST /api/tarifas-iva` | `codigo` | String | Req | N/A | 1 - 20 | Alfanumérico, guiones | trim(), uppercase | Único en `tarifa_iva.codigo` | **ES**: Código obligatorio (máx 20 car.).<br>**EN**: Code required (max 20 chars).<br>**PT**: Código obrigatório (máx. 20 car.). | Backend: `tarifas.service.spec.ts`<br>Frontend: `TarifasIVAPage.test.tsx` |
| `POST /api/tarifas-iva` | `porcentaje` | Decimal | Req | N/A | 0.00 - 100.00 | Número flotante (2 dec.) | Number | Rango 0 a 100 | **ES**: Porcentaje debe estar entre 0% y 100%.<br>**EN**: Percentage must be between 0% and 100%.<br>**PT**: A porcentagem deve estar entre 0% e 100%. | Backend: `tarifas.service.spec.ts`<br>Frontend: `TarifasIVAPage.test.tsx` |
| `POST /api/tarifas-iva` | `descripcion` | String | Req | N/A | 1 - 45 | Texto con acentos, espacios | trim() | Longitud max 45 en BD | **ES**: Descripción obligatoria (máx 45 car.).<br>**EN**: Description required (max 45 chars).<br>**PT**: Descrição obrigatória (máx. 45 car.). | Backend: `tarifas.service.spec.ts`<br>Frontend: `TarifasIVAPage.test.tsx` |
| `POST /api/tarifas-iva` | `estado` | String | Req | N/A | Enum | `ACTIVA`, `INACTIVA` | trim() | Activa / Inactiva | **ES**: Estado debe ser ACTIVA o INACTIVA.<br>**EN**: Status must be ACTIVA or INACTIVA.<br>**PT**: O status deve ser ACTIVA ou INACTIVA. | Backend: `tarifas.service.spec.ts` |

---

### 3.4. Categorías de Productos

| Operación / Endpoint | Campo | Tipo | Req / Opc | Opcional Permitido | Min / Max | Formato / Caracteres | Normalización | Rango / Negocio / BD | Mensajes Error (ES / EN / PT) | Pruebas Asociadas |
|---|---|---|---|---|---|---|---|---|---|---|
| `POST /api/categorias` | `nombre` | String | Req | N/A | 1 - 100 | Alfanumérico Unicode | trim() | Único en `categoria.nombre` | **ES**: Nombre de categoría obligatorio (máx 100).<br>**EN**: Category name required (max 100).<br>**PT**: Nome da categoria obrigatório (máx. 100). | Backend: `categorias.service.spec.ts`<br>Frontend: `CategoriasPage.test.tsx` |
| `POST /api/categorias` | `descripcion` | String | Opc | null, undefined | 0 - 255 | Texto libre Unicode | trim() | Detalle de la categoría | **ES**: Descripción no debe exceder 255 car.<br>**EN**: Description cannot exceed 255 chars.<br>**PT**: A descrição não pode exceder 255 car. | Backend: `categorias.service.spec.ts` |
| `POST /api/categorias` | `activo` | Boolean | Opc | undefined | Booleano | `true` o `false` | Default true | Estado operativo | **ES**: Activo debe ser verdadero o falso.<br>**EN**: Active must be true or false.<br>**PT**: Ativo deve ser verdadeiro ou falso. | Backend: `categorias.service.spec.ts` |

---

### 3.5. Proveedores y Orígenes de Compra

| Operación / Endpoint | Campo | Tipo | Req / Opc | Opcional Permitido | Min / Max | Formato / Caracteres | Normalización | Rango / Negocio / BD | Mensajes Error (ES / EN / PT) | Pruebas Asociadas |
|---|---|---|---|---|---|---|---|---|---|---|
| `POST /api/proveedores` | `tipoOrigen` | String | Req | N/A | Enum | `Proveedor`, `Local`, `Pago en especie`, `Otro` | trim() | Tipo en `origen_compra` | **ES**: Tipo de origen no válido.<br>**EN**: Invalid origin type.<br>**PT**: Tipo de origem inválido. | Backend: `proveedores.service.spec.ts`<br>Frontend: `ProveedoresPage.test.tsx` |
| `POST /api/proveedores` | `nombreReferencia` | String | Req | N/A | 1 - 150 | Alfanumérico, acentos, símbolos | trim() | Único en BD | **ES**: Nombre de referencia requerido (máx 150).<br>**EN**: Reference name required (max 150).<br>**PT**: Nome de referência obrigatório (máx. 150). | Backend: `proveedores.service.spec.ts`<br>Frontend: `ProveedoresPage.test.tsx` |
| `POST /api/proveedores` | `telefono` | String | Req | N/A | 3 - 20 | `/^[0-9+\s()-]+$/` | trim() | Formato telefónico internacional | **ES**: Formato de teléfono inválido.<br>**EN**: Invalid phone format.<br>**PT**: Formato de telefone inválido. | Backend: `proveedores.service.spec.ts`<br>Frontend: `ProveedoresPage.test.tsx` |
| `POST /api/proveedores` | `correo` | String | Req | N/A | 5 - 100 | Formato Email RFC 5322 | trim(), lowercase | Correo electrónico de contacto | **ES**: Correo electrónico inválido.<br>**EN**: Invalid email address.<br>**PT**: Endereço de e-mail inválido. | Backend: `proveedores.service.spec.ts`<br>Frontend: `ProveedoresPage.test.tsx` |
| `POST /api/proveedores` | `pais` | String | Req | N/A | 1 - 100 | Texto libre con acentos | trim() | País de origen fiscal | **ES**: País requerido (máx 100 car.).<br>**EN**: Country required (max 100 chars).<br>**PT**: País obrigatório (máx. 100 car.). | Backend: `proveedores.service.spec.ts`<br>Frontend: `ProveedoresPage.test.tsx` |
| `POST /api/proveedores` | `direccion` | String | Opc | null, undefined | 0 - 150 | Texto libre | trim() | Dirección física | **ES**: Dirección máx 150 caracteres.<br>**EN**: Address max 150 characters.<br>**PT**: Endereço máx. 150 caracteres. | Backend: `proveedores.service.spec.ts` |
| `POST /api/proveedores` | `contacto` | String | Opc | null, undefined | 0 - 150 | Texto libre con acentos | trim() | Persona de contacto | **ES**: Contacto máx 150 caracteres.<br>**EN**: Contact max 150 characters.<br>**PT**: Contato máx. 150 caracteres. | Backend: `proveedores.service.spec.ts` |
| `POST /api/proveedores` | `monedaPreferida` | String | Opc | undefined | Enum | `CRC`, `USD`, `EUR`, `COP`, `BRL` | trim() | Divisa habitual | **ES**: Moneda no admitida.<br>**EN**: Currency not supported.<br>**PT**: Moeda não suportada. | Backend: `proveedores.service.spec.ts` |
| `POST /api/proveedores` | `observaciones` | String | Opc | null, undefined | 0 - 500 | Texto libre | trim() | Notas comerciales | **ES**: Observaciones máx 500 caracteres.<br>**EN**: Notes max 500 characters.<br>**PT**: Observações máx. 500 caracteres. | Backend: `proveedores.service.spec.ts` |
| `POST /api/proveedores` | `estado` | String | Req | N/A | Enum | `ACTIVO`, `INACTIVO` | trim() | Estado operativo | **ES**: Estado debe ser ACTIVO o INACTIVO.<br>**EN**: Status must be ACTIVO or INACTIVO.<br>**PT**: Status deve ser ACTIVO ou INACTIVO. | Backend: `proveedores.service.spec.ts` |

---

### 3.6. Pedidos de Compra y Recepciones

| Operación / Endpoint | Campo | Tipo | Req / Opc | Opcional Permitido | Min / Max | Formato / Caracteres | Normalización | Rango / Negocio / BD | Mensajes Error (ES / EN / PT) | Pruebas Asociadas |
|---|---|---|---|---|---|---|---|---|---|---|
| `POST /api/pedidos` | `fecha` | String | Req | N/A | 10 | `YYYY-MM-DD` | trim() | Fecha del pedido | **ES**: Fecha en formato YYYY-MM-DD.<br>**EN**: Date in YYYY-MM-DD format.<br>**PT**: Data no formato YYYY-MM-DD. | Backend: `pedidos.service.spec.ts`<br>Frontend: `PedidosPage.test.tsx` |
| `POST /api/pedidos` | `origen` | String | Req | N/A | 1 - 100 | Texto libre con acentos | trim() | Origen o ciudad de despacho | **ES**: Origen requerido (máx 100 car.).<br>**EN**: Origin required (max 100 chars).<br>**PT**: Origem obrigatória (máx. 100 car.). | Backend: `pedidos.service.spec.ts` |
| `POST /api/pedidos` | `proveedorId` | Int | Req | N/A | >= 1 | Entero positivo | Number | FK existente en `origen_compra` | **ES**: Proveedor requerido y existente.<br>**EN**: Supplier required and existing.<br>**PT**: Fornecedor obrigatório e existente. | Backend: `pedidos.service.spec.ts` |
| `POST /api/pedidos` | `monedaCompra` | String | Req | N/A | Enum | `CRC`, `USD`, `EUR`, `COP`, `BRL` | trim() | Divisa de la factura de compra | **ES**: Moneda de compra no soportada.<br>**EN**: Purchase currency not supported.<br>**PT**: Moeda de compra não suportada. | Backend: `pedidos.service.spec.ts` |
| `POST /api/pedidos` | `tipoCambio` | Decimal | Req | N/A | 0.01 - 999.99 | Flotante positivo | Number | Tipo de cambio a moneda base | **ES**: Tipo de cambio inválido (0.01 - 999.99).<br>**EN**: Invalid exchange rate.<br>**PT**: Taxa de câmbio inválida. | Backend: `pedidos.service.spec.ts` |
| `POST /api/pedidos` | `estado` | String | Req | N/A | Enum | `REGISTRADO`, `EN_TRANSITO` | trim() | Estado inicial del pedido | **ES**: Estado debe ser REGISTRADO o EN_TRANSITO.<br>**EN**: Status must be REGISTRADO or EN_TRANSITO.<br>**PT**: O status deve ser REGISTRADO ou EN_TRANSITO. | Backend: `pedidos.service.spec.ts` |
| `POST /api/pedidos` | `detalles` | Array | Req | N/A | Mín 1 | Arreglo de objetos | N/A | Mínimo 1 línea de detalle | **ES**: El pedido debe incluir al menos un detalle.<br>**EN**: Order must include at least one detail line.<br>**PT**: O pedido deve incluir pelo menos uma linha de detalhe. | Backend: `pedidos.service.spec.ts` |
| `POST /api/pedidos` (detalle) | `productoNombre` | String | Req | N/A | 1 - 150 | Alfanumérico con acentos | trim() | Nace o reutiliza producto | **ES**: Nombre de producto requerido.<br>**EN**: Product name required.<br>**PT**: Nome do produto obrigatório. | Backend: `pedidos.service.spec.ts` |
| `POST /api/pedidos` (detalle) | `categoriaId` | Int | Req | N/A | >= 1 | Entero positivo | Number | FK existente en `categoria` | **ES**: Categoría requerida.<br>**EN**: Category required.<br>**PT**: Categoria obrigatória. | Backend: `pedidos.service.spec.ts` |
| `POST /api/pedidos` (detalle) | `loteCodigo` | String | Req | N/A | 2 - 3 | `/^L([1-9]\|10)$/` | trim(), uppercase | Código de lote en ciclo (L1 a L10) | **ES**: Código de lote debe ser L1 a L10.<br>**EN**: Batch code must be L1 to L10.<br>**PT**: Código do lote deve ser L1 a L10. | Backend: `pedidos.service.spec.ts` |
| `POST /api/pedidos` (detalle) | `cantidad` | Int | Req | N/A | 1 - 99999 | Entero positivo | Number | Unidades solicitadas | **ES**: Cantidad debe ser entre 1 y 99,999.<br>**EN**: Quantity must be between 1 and 99,999.<br>**PT**: Quantidade deve ser entre 1 e 99.999. | Backend: `pedidos.service.spec.ts` |
| `POST /api/pedidos` (detalle) | `costoUnitarioOrigen` | Decimal | Req | N/A | 0.00 - 99999999 | Flotante no negativo | Number | Costo unitario en divisa origen | **ES**: Costo unitario debe ser >= 0.<br>**EN**: Unit cost must be >= 0.<br>**PT**: Custo unitário deve ser >= 0. | Backend: `pedidos.service.spec.ts` |
| `PATCH /api/pedidos/:id/recepcion` | `fechaRecepcion` | String | Req | N/A | 10 | `YYYY-MM-DD` | trim() | `>= pedido.fechaPedido` | **ES**: Fecha de recepción inválida.<br>**EN**: Invalid reception date.<br>**PT**: Data de recebimento inválida. | Backend: `pedidos.service.spec.ts` |
| `PATCH /api/pedidos/:id/recepcion` (detalle) | `idLote` | Int | Req | N/A | >= 1 | Entero | Number | Lote en `EN_PROCESO` | **ES**: Lote no encontrado en el pedido.<br>**EN**: Batch not found in order.<br>**PT**: Lote não encontrado no pedido. | Backend: `pedidos.service.spec.ts` |
| `PATCH /api/pedidos/:id/recepcion` (detalle) | `cantidadRecibida` | Int | Req | N/A | 1 - 99999 | Entero positivo | Number | Cantidad física ingresada | **ES**: Cantidad recibida inválida.<br>**EN**: Invalid received quantity.<br>**PT**: Quantidade recebida inválida. | Backend: `pedidos.service.spec.ts` |

---

### 3.7. Ventas y Pagos

| Operación / Endpoint | Campo | Tipo | Req / Opc | Opcional Permitido | Min / Max | Formato / Caracteres | Normalización | Rango / Negocio / BD | Mensajes Error (ES / EN / PT) | Pruebas Asociadas |
|---|---|---|---|---|---|---|---|---|---|---|
| `POST /api/ventas` | `fechaVenta` | String | Req | N/A | 10 | `YYYY-MM-DD` | trim() | Fecha de facturación | **ES**: Fecha de venta en formato YYYY-MM-DD.<br>**EN**: Sale date in YYYY-MM-DD format.<br>**PT**: Data da venda no formato YYYY-MM-DD. | Backend: `ventas.service.spec.ts`<br>Frontend: `FormularioVenta.test.tsx` |
| `POST /api/ventas` | `clienteNombre` | String | Opc | null, undefined, "" | 0 - 100 | Texto libre con acentos | trim() | Nombre del cliente | **ES**: Cliente no puede exceder 100 caracteres.<br>**EN**: Client name max 100 chars.<br>**PT**: Nome do cliente máx. 100 caracteres. | Backend: `ventas.service.spec.ts` |
| `POST /api/ventas` | `medioPago` | String | Req | N/A | Enum | `EFECTIVO`, `SINPE`, `TRANSFERENCIA`, `TARJETA`, `MIXTO`, `OTRO` | trim() | Medio de pago registrado | **ES**: Medio de pago no admitido.<br>**EN**: Payment method not supported.<br>**PT**: Meio de pagamento não suportado. | Backend: `ventas.service.spec.ts`<br>Frontend: `FormularioVenta.test.tsx` |
| `POST /api/ventas` | `montoPagado` | Decimal | Opc | undefined | 0.00 - 99999999 | Flotante (2 dec.) | Number | Abono inicial (`<= total`) | **ES**: Monto pagado no puede ser negativo ni exceder el total.<br>**EN**: Paid amount cannot be negative or exceed total.<br>**PT**: O valor pago não pode ser negativo nem exceder o total. | Backend: `ventas.service.spec.ts` |
| `POST /api/ventas` | `detalles` | Array | Req | N/A | Mín 1 | Arreglo de líneas | N/A | Mínimo 1 producto a vender | **ES**: La venta debe contener al menos un producto.<br>**EN**: Sale must have at least one product.<br>**PT**: A venda deve ter pelo menos um produto. | Backend: `ventas.service.spec.ts`<br>Frontend: `FormularioVenta.test.tsx` |
| `POST /api/ventas` (detalle) | `productoId` | Int | Req | N/A | >= 1 | Entero positivo | Number | FK existente con stock | **ES**: Producto no válido.<br>**EN**: Invalid product.<br>**PT**: Produto inválido. | Backend: `ventas.service.spec.ts` |
| `POST /api/ventas` (detalle) | `cantidad` | Int | Req | N/A | 1 - 99999 | Entero positivo | Number | `<= stock disponible` | **ES**: Cantidad supera el stock disponible.<br>**EN**: Quantity exceeds available stock.<br>**PT**: A quantidade excede o estoque disponível. | Backend: `ventas.service.spec.ts`<br>Frontend: `FormularioVenta.test.tsx` |
| `POST /api/ventas` (detalle) | `precioUnitario` | Decimal | Req | N/A | 0.01 - 99999999 | Flotante positivo | Number | Precio pactado | **ES**: Precio unitario debe ser mayor a 0.<br>**EN**: Unit price must be greater than 0.<br>**PT**: O preço unitário deve ser maior que 0. | Backend: `ventas.service.spec.ts` |
| `POST /api/ventas` (detalle) | `porcentajeDescuento` | Decimal | Opc | undefined, 0 | 0.00 - 100.00 | Flotante (2 dec.) | Number | Porcentaje de rebaja | **ES**: Descuento debe ser entre 0% y 100%.<br>**EN**: Discount must be 0% to 100%.<br>**PT**: O desconto deve ser de 0% a 100%. | Backend: `ventas.service.spec.ts` |
| `POST /api/ventas` (detalle) | `tipoTarifa` | String | Req | N/A | Enum | `IVA`, `EXENTO`, `ESPECIAL` | trim() | Régimen tributario de línea | **ES**: Tipo de tarifa debe ser IVA, EXENTO o ESPECIAL.<br>**EN**: Rate type must be IVA, EXENTO or ESPECIAL.<br>**PT**: O tipo de tarifa deve ser IVA, EXENTO ou ESPECIAL. | Backend: `ventas.service.spec.ts` |
| `POST /api/ventas` (detalle) | `idTarifaIva` | Int | Opc | undefined | >= 1 | Entero | Number | Requerido si `tipoTarifa == 'IVA'` | **ES**: Tarifa de IVA requerida cuando no es exento.<br>**EN**: VAT rate required when not exempt.<br>**PT**: Taxa de IVA obrigatória quando não isento. | Backend: `ventas.service.spec.ts` |
| `POST /api/ventas/:id/pagos` | `monto` | Decimal | Req | N/A | 0.01 - 99999999 | Flotante (2 dec.) | Number | `<= saldo pendiente` | **ES**: El monto a pagar excede el saldo pendiente.<br>**EN**: Payment amount exceeds balance.<br>**PT**: O valor do pagamento excede o saldo pendente. | Backend: `ventas.service.spec.ts`<br>Frontend: `VentasPage.test.tsx` |
| `POST /api/ventas/:id/pagos` | `metodoPago` | String | Req | N/A | Enum | `EFECTIVO`, `SINPE`, `TRANSFERENCIA`, `TARJETA`, `MIXTO`, `OTRO` | trim() | Medio utilizado | **ES**: Método de pago no admitido.<br>**EN**: Payment method not supported.<br>**PT**: Método de pagamento não suportado. | Backend: `ventas.service.spec.ts` |
| `POST /api/ventas/:id/pagos` | `referencia` | String | Opc | null, undefined | 0 - 150 | Alfanumérico, símbolos | trim() | Comprobante / Voucher | **ES**: Referencia máx 150 caracteres.<br>**EN**: Reference max 150 characters.<br>**PT**: Referência máx. 150 caracteres. | Backend: `ventas.service.spec.ts` |
| `POST /api/ventas/:id/pagos` | `observaciones` | String | Opc | null, undefined | 0 - 1000 | Texto libre | trim() | Justificación contable | **ES**: Observaciones máx 1000 caracteres.<br>**EN**: Notes max 1000 characters.<br>**PT**: Observações máx. 1000 caracteres. | Backend: `ventas.service.spec.ts` |

---

### 3.8. Reportes (28 Endpoints) y Filtros

| Operación / Endpoint | Campo | Tipo | Req / Opc | Opcional Permitido | Min / Max | Formato / Caracteres | Normalización | Rango / Negocio / BD | Mensajes Error (ES / EN / PT) | Pruebas Asociadas |
|---|---|---|---|---|---|---|---|---|---|---|
| Reportes Temporales (23 operativos) | `fechaDesde` | String | Opc | undefined | 10 | `/^\d{4}-\d{2}-\d{2}$/` | trim() | `fechaDesde <= fechaHasta` | **ES**: fechaDesde debe tener formato YYYY-MM-DD.<br>**EN**: fechaDesde must match YYYY-MM-DD.<br>**PT**: fechaDesde deve corresponder a YYYY-MM-DD. | Backend: `reportes.controller.spec.ts`<br>Frontend: `ReportesPage.test.tsx` |
| Reportes Temporales (23 operativos) | `fechaHasta` | String | Opc | undefined | 10 | `/^\d{4}-\d{2}-\d{2}$/` | trim() | `fechaHasta >= fechaDesde` | **ES**: fechaHasta debe tener formato YYYY-MM-DD.<br>**EN**: fechaHasta must match YYYY-MM-DD.<br>**PT**: fechaHasta deve corresponder a YYYY-MM-DD. | Backend: `reportes.controller.spec.ts`<br>Frontend: `ReportesPage.test.tsx` |
| Cuentas por Cobrar Vencimientos | `fechaCorte` | String | Req | N/A | 10 | `/^\d{4}-\d{2}-\d{2}$/` | trim() | Fecha de corte para cálculo | **ES**: fechaCorte es obligatoria en formato YYYY-MM-DD.<br>**EN**: fechaCorte is required in YYYY-MM-DD format.<br>**PT**: fechaCorte é obrigatória no formato YYYY-MM-DD. | Backend: `reportes.controller.spec.ts`<br>Frontend: `CuentasPorCobrarPage.test.tsx` |
| Inventario Histórico | `fechaCorte` | String | Req | N/A | 10 | `/^\d{4}-\d{2}-\d{2}$/` | trim() | Reconstrucción ledger | **ES**: fechaCorte es obligatoria (YYYY-MM-DD).<br>**EN**: fechaCorte is required (YYYY-MM-DD).<br>**PT**: fechaCorte é obrigatória (YYYY-MM-DD). | Backend: `reportes.controller.spec.ts` |
| Reportes Auditoría (5 endpoints) | `usuarioId` | Int | Opc | undefined | >= 1 | Entero | Number | Usuario actor auditado | **ES**: usuarioId debe ser un entero positivo.<br>**EN**: usuarioId must be a positive integer.<br>**PT**: usuarioId deve ser um número inteiro positivo. | Backend: `auditoria.service.spec.ts`<br>Frontend: `AuditoriaPage.test.tsx` |
| Paginación Global | `pagina` / `page` | Int | Opc | undefined, 1 | >= 1 | Entero positivo | Number | Página de resultados | **ES**: Página debe ser >= 1.<br>**EN**: Page must be >= 1.<br>**PT**: A página deve ser >= 1. | Backend: `pagination.spec.ts`<br>Frontend: `PaginationControls.test.tsx` |
| Paginación Global | `limite` / `limit` | Int | Opc | undefined, 50 | 1 - 200 | Entero positivo | Number | Máximo 200 por página | **ES**: Límite debe estar entre 1 y 200.<br>**EN**: Limit must be between 1 and 200.<br>**PT**: O limite deve estar entre 1 e 200. | Backend: `pagination.spec.ts` |

---

## 4. PREVENCIÓN DE VULNERABILIDADES Y CRITERIOS DE INGENIERÍA

1. **Inyección SQL**: Todas las consultas hacia PostgreSQL y SQL Server se realizan a través del query builder y repositorios fuertemente tipados de TypeORM con parámetros nombrados (`:param`). Prohibida la interpolación directa de cadenas en cláusulas SQL.
2. **Cross-Site Scripting (XSS)**: React 19 escapa por defecto cualquier contenido renderizado en JSX. En ningún componente se utiliza `dangerouslySetInnerHTML`.
3. **Parameter Tampering / Mass Assignment**: El `ValidationPipe` global de NestJS está configurado con:
   ```typescript
   new ValidationPipe({
     whitelist: true,
     forbidNonWhitelisted: true,
     transform: true,
   })
   ```
   Cualquier propiedad enviada por el cliente que no esté explícitamente declarada y decorada en el DTO correspondiente es inmediatamente rechazada con un error HTTP 400 Bad Request.
4. **Contratos Inmutables**: Los movimientos de inventario (`movimiento_inventario`) y los pagos de venta (`pago_venta`) son ledgers transaccionales de sólo inserción (`append-only`). No existen endpoints `PUT`, `PATCH` o `DELETE` que permitan mutar datos históricos financieros o de stock.
