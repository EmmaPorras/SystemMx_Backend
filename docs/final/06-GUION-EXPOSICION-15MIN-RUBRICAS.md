# 06 — GUION DE EXPOSICIÓN FINAL (15 MINUTOS) — SYSTEM MX
## ALINEACIÓN ESTRATÉGICA CON RÚBRICAS DE EVALUACIÓN ACADÉMICA

**Proyecto:** System MX — Plataforma Web de Gestión Comercial  
**Tiempo Límite Estricto:** 15 Minutos (900 Segundos)  
**Evaluación:** Rúbrica de Exposición (100 pts) + Rúbrica de Aplicación (100 pts)  
**Modalidad:** Demostración en Vivo en Producción (Render) con Respaldo Local (MSSQL)  

---

## 1. MAPA DE ALINEACIÓN CON LAS RÚBRICAS DE EVALUACIÓN

| Criterio de Evaluación | Pts | Minuto Clave | Elemento Demostrado en Vivo |
|---|:---:|:---:|---|
| **1. Introducción y Dominio del Problema** | 15% | Min 00:00 - 02:00 | Justificación comercial, problemática de inventarios y valor de System MX |
| **2. Arquitectura, Tecnologías y Base de Datos** | 20% | Min 02:00 - 04:30 | Diagrama C4, React 19, NestJS 11, estrategia dual-dialect (Neon PG / MSSQL) |
| **3. Demostración en Vivo: Ciclo Compras y Almacén** | 20% | Min 04:30 - 07:30 | Creación de pedido, nacimiento de producto, recepción parcial/total, lotes FIFO |
| **4. Demostración en Vivo: Ventas, Cobros y Reversión**| 20% | Min 07:30 - 10:30 | Facturación, deducción FIFO, cartera CxC, abonos en ledger, anulación y reversión |
| **5. Accesibilidad Universal, i18n y Usabilidad** | 10% | Min 10:30 - 12:00 | UserWay WCAG 2.2 AAA, teclado accesible, paridad idiomática (ES / EN / PT) |
| **6. Calidad Técnica, 929 Pruebas y CI/CD** | 10% | Min 12:00 - 13:30 | 54 E2E + 626 backend + 249 frontend, GitHub Actions, cobertura total |
| **7. Seguridad, Inmutabilidad y Conclusión** | 5% | Min 13:30 - 15:00 | Argon2id, invalidación dinámica de tokens, rol DEMO aislado, cierre |

---

## 2. REPARTO DE ROLES DE LOS EXPOSITORES

- **Expositor 1 (Líder de Arquitectura y Backend):**
  - Introducción general, problemática empresarial y arquitectura del sistema.
  - Demostración práctica del ciclo de compras, nacimiento de producto y recepción en almacén con lotes.
  - Presentación de la suite de 929 pruebas automatizadas y pipelines de CI/CD.
- **Expositor 2 (Líder de Frontend y Seguridad):**
  - Demostración práctica de punto de venta (FIFO), cuentas por cobrar, abonos y anulación con reversión.
  - Demostración de accesibilidad WCAG 2.2 AAA (UserWay), navegación por teclado e internacionalización (ES/EN/PT).
  - Explicación del modelo de seguridad (Argon2id, invalidación de sesiones, aislamiento DEMO) y conclusiones finales.

---

## 3. CRONOGRAMA MINUTO A MINUTO (00:00 A 15:00)

```mermaid
gantt
    title Cronograma de Exposición (15 Minutos Exactos)
    dateFormat mm:ss
    axisFormat %M:%S
    
    seccion Fase 1: Contexto
    Introducción y Planteamiento :00:00, 02:00
    Arquitectura y Dual-Dialect  :02:00, 04:30
    
    seccion Fase 2: Demo en Vivo
    Compras, Recepción y Lotes   :04:30, 07:30
    Ventas FIFO, Cobros y Reversión :07:30, 10:30
    
    seccion Fase 3: Calidad y Cierre
    Accesibilidad e i18n         :10:30, 12:00
    929 Pruebas, CI/CD y Seguridad:12:00, 14:00
    Conclusiones y Preguntas     :14:00, 15:00
```

---

### MINUTO 00:00 – 02:00 | INTRODUCCIÓN Y PROBLEMÁTICA EMPRESARIAL
**Responsable:** Expositor 1  
**Apoyo Visual:** Diapositiva 1 (Identidad y Propósito) y Navegador en pantalla de login.

> *"Muy buenos días, miembros del jurado evaluador. Hoy presentamos **System MX**, una plataforma integral de gestión comercial diseñada para resolver uno de los desafíos más críticos en las empresas comercializadoras: la falta de sincronización y trazabilidad entre las compras de mercadería, el control estricto de almacén y la facturación al cliente final.*  
>  
> *Tradicionalmente, las pequeñas y medianas empresas enfrentan pérdidas financieras por inventarios ciegos, compras duplicadas, costos de importación mal calculados y falta de control sobre las cuentas por cobrar. System MX fue concebido bajo tres pilares fundamentales:*  
> *1. **Integridad Transaccional Inmutable:** El stock se gobierna mediante metodología FIFO y libros mayores contables de solo anexado (append-only).*  
> *2. **Arquitectura Elástica Dual-Dialect:** Capaz de operar sobre PostgreSQL en la nube serverless y sobre SQL Server corporativo local.*  
> *3. **Accesibilidad e Inclusión Real:** Cumplimiento de estándares internacionales WCAG 2.2 AAA e internacionalización nativa en tres idiomas."*

---

### MINUTO 02:00 – 04:30 | ARQUITECTURA Y DECISIONES TÉCNICAS
**Responsable:** Expositor 1  
**Apoyo Visual:** Diapositiva 2 (Diagrama de Arquitectura C4 / Mermaid).

> *"En la capa de presentación implementamos una Single Page Application con **React 19, TypeScript y Vite**, estilizada mediante **Tailwind CSS**. La navegación utiliza `HashRouter`, lo que permite un despliegue estático de alto rendimiento en redes CDN sin dependencias complejas de reescritura en servidor.*  
>  
> *En la capa de servicios contamos con **NestJS 11**, estructurado en módulos desacoplados bajo principios SOLID. La seguridad perimetral implementa **Helmet, Throttler contra fuerza bruta** y un `ValidationPipe` estricto que rechaza cualquier atributo que no pertenezca al contrato DTO.*  
>  
> *En la persistencia, resolvimos un desafío de nivel corporativo: **soporte dual-dialect**. A través de TypeORM y migraciones inteligentes, System MX opera en producción sobre **PostgreSQL en Neon Cloud**, mientras que para desarrollo local y pruebas E2E aisladas ejecuta sobre **Microsoft SQL Server**. Esto nos otorga independencia de proveedor y portabilidad absoluta."*

---

### MINUTO 04:30 – 07:30 | DEMOSTRACIÓN EN VIVO: CICLO DE COMPRAS Y RECEPCIÓN
**Responsable:** Expositor 1  
**Acción en Vivo:** Iniciar sesión como `admin` (o `e2e_compras`) en `https://systemmx-web-200684331.onrender.com`.

> *"Pasemos a la demostración práctica en vivo. Iniciamos sesión en nuestra instancia oficial desplegada en Render.*  
>  
> *1. **Nacimiento de Producto por Pedido:** En System MX un producto no puede nacer de forma huérfana sin costo de origen. Vamos a 'Pedidos de Compra' y creamos una nueva orden al proveedor internacional 'Yamaha Racing Parts'.*  
> *Registramos el producto `Casco Integral RPHA-11 Pro`, categoría 'Cascos y Protección', lote sugerido `L1`, cantidad `5 unidades`, a un costo de `\$120 USD` y precio de venta recomendado `\$220 USD`.*  
>  
> *2. **Estado Inicial y Protección de Stock:** Al guardar, observen que el pedido queda en estado `REGISTRADO`. Si consultamos el inventario disponible para la venta, el stock es **0**, porque la mercadería está en tránsito y el lote está en estado `EN_PROCESO`.*  
>  
> *3. **Recepción Física en Bodega:** Supongamos que el camión arriba a nuestras instalaciones. Entramos a la opción 'Recepción' e ingresamos las 5 unidades conformes. En este instante exacto ocurre la magia transaccional:*  
> *- El pedido cambia a `RECIBIDO`.*  
> *- El lote `L1` pasa a `EN_STOCK` con 5 unidades disponibles.*  
> *- Se genera automáticamente una entrada en el kardex `movimiento_inventario` con snapshot del usuario que realizó la recepción."*

---

### MINUTO 07:30 – 10:30 | DEMOSTRACIÓN EN VIVO: VENTAS FIFO, COBRANZAS Y ANULACIÓN
**Responsable:** Expositor 2  
**Acción en Vivo:** Conmutar a módulo de Ventas con usuario `e2e_ventas` (o `admin`).

> *"Ahora asumimos el rol de ventas. Un cliente solicita comprar 2 unidades del nuevo casco.*  
>  
> *1. **Deducción Transaccional FIFO:** Ingresamos a 'Nueva Venta'. Seleccionamos el cliente 'MotoClub Central'. El sistema muestra que tenemos exactamente 5 unidades disponibles. Seleccionamos 2 unidades con tarifa de IVA General (13%).*  
> *En la forma de pago, el cliente abona el 50% al contado (`\$248.60`) y deja el resto a crédito. Presionamos 'Emitir Venta'.*  
> *El sistema aplica un **bloqueo pesimista (`pessimistic_write`)** para evitar condiciones de carrera, descuenta las 2 unidades respetando la antigüedad FIFO del lote `L1`, y calcula la ganancia bruta real comparando el precio contra el costo histórico de adquisición.*  
>  
> *2. **Cuentas por Cobrar y Conciliación:** Al quedar un saldo pendiente, la factura ingresa automáticamente a 'Cuentas por Cobrar'. Abrimos la venta, registramos un abono por el saldo restante vía transferencia bancaria con su número de referencia. Al llegar el saldo a cero, la venta queda en estado **CONCILIADA** con diferencia cero en el informe de conciliación financiera.*  
>  
> *3. **Anulación y Reversión Contable:** ¿Qué ocurre si el cliente devuelve el producto por un error en la talla? En otros sistemas esto descalabra el stock. En System MX presionamos 'Anular Venta':*  
> *- El stock disponible en el lote `L1` se restaura de inmediato de 3 a 5 unidades.*  
> *- Se registra en el ledger el movimiento `REINGRESO_ANULACION_VENTA`.*  
> *- La venta se excluye de las ventas comerciales válidas.*  
> *- Y de acuerdo con las mejores prácticas fiscales, los registros de pago históricos **no se eliminan**, preservando la trazabilidad de auditoría."*

---

### MINUTO 10:30 – 12:00 | ACCESIBILIDAD UNIVERSAL (WCAG 2.2 AAA) E INTERNACIONALIZACIÓN
**Responsable:** Expositor 2  
**Acción en Vivo:** Interacción con UserWay, cambio de idioma y navegación por teclado.

> *"System MX fue diseñado bajo el principio de que el software empresarial debe ser verdaderamente inclusivo.*  
>  
> *1. **Accesibilidad WCAG 2.2 AAA en Vivo:** En la esquina inferior derecha pueden observar el widget oficial de **UserWay**. Con un clic activamos el modo de alto contraste para personas con debilidad visual, el ajuste dinámico de tipografía y espaciado de lectura para usuarios con dislexia, o la lectura en voz alta.*  
> *Además, soltamos el ratón: observen cómo navegamos por todos los menús, modales y formularios exclusivamente mediante la tecla `Tab`, `Enter` y `Escape`, con indicadores de foco visibles y atributos ARIA en cada elemento.*  
>  
> *2. **Internacionalización Dinámica (ES / EN / PT):** En el selector de idioma cambiamos a **English**: instantáneamente todos los títulos, tablas, botones y reportes se traducen al inglés. Cambiamos a **Português**: toda la interfaz se adapta al portugués. Este comportamiento está respaldado por pruebas de paridad automatizadas que garantizan que el 100% de las llaves coinciden entre los tres idiomas."*

---

### MINUTO 12:00 – 13:30 | CALIDAD TÉCNICA, 929 PRUEBAS Y CI/CD
**Responsable:** Expositor 1  
**Apoyo Visual:** Terminal con salida de pruebas y GitHub Actions en pantalla.

> *"Para que una plataforma de esta envergadura sea apta para producción, la estabilidad debe ser matemáticamente comprobable, no solo declarativa.*  
>  
> *System MX cuenta con **929 pruebas automatizadas** que superan el 100% de aprobación:*  
> *- **249 pruebas en Frontend:** Con Vitest y Testing Library, incluyendo 15 auditorías completas con `axe-core`.*  
> *- **626 pruebas unitarias e integración en Backend:** Con Jest, cubriendo todos los servicios y los 28 reportes gerenciales.*  
> *- **54 pruebas End-to-End (E2E):** Ejecutadas mediante un script automatizado que borra la base de datos de pruebas, ejecuta las 4 migraciones y valida el ciclo comercial completo sobre Microsoft SQL Server en tan solo 17 segundos.*  
>  
> *Ambos repositorios cuentan con pipelines automatizados en **GitHub Actions** que compilan, ejecutan linter y corren la totalidad de las pruebas en cada push o pull request antes de cualquier integración."*

---

### MINUTO 13:30 – 15:00 | SEGURIDAD AVANZADA, ROL DEMO Y CONCLUSIÓN
**Responsable:** Expositor 2  
**Apoyo Visual:** Pantalla con resumen de seguridad y panel DEMO.

> *"En materia de seguridad, no utilizamos contraseñas en texto plano ni algoritmos vulnerables: implementamos **Argon2id**, el estándar más robusto de la industria. Implementamos **invalidación dinámica de sesiones**: si el administrador modifica el rol o la contraseña de un usuario, todas sus sesiones activas son destruidas de inmediato mediante versionado de credenciales.*  
>  
> *Asimismo, incorporamos el **rol DEMO**. Cualquier usuario que se registre públicamente ingresa a un entorno completamente aislado con datos ficticios en memoria, bloqueado con HTTP 403 para cualquier operación comercial real, protegiendo así los datos de la empresa.*  
>  
> *En conclusión: System MX es una solución integral, robusta, altamente probada y lista para producción. Agradecemos su atención y quedamos a su entera disposición para la sesión de preguntas."*

---

## 4. BATERÍA DE PREGUNTAS Y RESPUESTAS PREPARADAS ANTE EL JURADO

### Pregunta 1: ¿Por qué decidieron utilizar dos motores de base de datos diferentes (PostgreSQL y SQL Server)?
> **Respuesta:** *"Tomamos esta decisión para demostrar máxima portabilidad empresarial. En la nube utilizamos Neon Serverless PostgreSQL debido a su elasticidad y costo cero para el despliegue en Render. En local y pruebas E2E utilizamos Microsoft SQL Server por su amplia presencia en entornos corporativos. Logramos esta convivencia mediante TypeORM implementando migraciones con dialecto dinámico (`isPostgres ? ... : ...`), asegurando que el código no dependa de un único proveedor."*

### Pregunta 2: ¿Cómo garantizan que dos vendedores no vendan la misma unidad física al mismo tiempo?
> **Respuesta:** *"Lo garantizamos mediante control de concurrencia pesimista (`pessimistic_write`). Al iniciar la transacción de venta, se ejecuta un bloqueo a nivel de fila (`FOR UPDATE` en PostgreSQL y `UPDLOCK, ROWLOCK` en SQL Server) sobre los lotes que contienen el producto. Las transacciones concurrentes quedan en cola hasta que la primera confirma o cancela la transacción. Si el stock desciende a cero, la segunda transacción recibe un rechazo limpio con `400 Bad Request: Stock insuficiente`, impidiendo cualquier inventario negativo."*

### Pregunta 3: ¿Por qué el rol DEMO no puede acceder a las tablas reales de la base de datos?
> **Respuesta:** *"Por el principio de mínimo privilegio y defensa en profundidad. Al habilitar un registro público en la web, cualquier persona externa puede crear una cuenta. Si le diéramos acceso de solo lectura a la base de datos real, estaríamos exponiendo nombres de clientes, precios mayoristas y costos de compra de proveedores. El controlador `DemoController` sirve datos de muestra en memoria estructurados, permitiendo que el evaluador conozca el funcionamiento de la herramienta sin exponer la información confidencial de la empresa."*

### Pregunta 4: ¿Qué sucede con las ventas si el servidor de correo (Google Apps Script) falla?
> **Respuesta:** *"El despacho de correos para invitaciones y recuperación de contraseñas opera de manera asíncrona mediante un servicio desacoplado (`MailService`). Los fallos de red hacia el webhook de correo se capturan en bloques `try/catch` con registro en bitácora de auditoría, evitando que un problema externo bloquee las transacciones de negocio en la base de datos."*

### Pregunta 5: ¿Por qué eligieron Argon2id sobre bcrypt para el hash de contraseñas?
> **Respuesta:** *"Argon2id fue el ganador unánime de la Password Hashing Competition y es el algoritmo expresamente recomendado por OWASP. A diferencia de bcrypt, que solo utiliza ciclos de CPU, Argon2id permite configurar el consumo de memoria RAM y el número de hilos de ejecución paralelos. Esto lo hace invulnerable frente a ataques de fuerza bruta masiva ejecutados mediante matrices de tarjetas gráficas (GPUs) o hardware dedicado (ASICs)."*

---

## 5. PLAN DE CONTINGENCIA ANTE FALLOS TÉCNICOS

| Escenario de Riesgo | Probabilidad | Acción de Mitigación Inmediata |
|---|:---:|---|
| **Latencia o caída del servicio en Render Free** | Baja | El backend local se encuentra encendido en `http://localhost:3000` con SQL Server listo. Con solo cambiar `VITE_API_URL` a local o alternar a la pestaña local del navegador, la demostración continúa sin interrupción. |
| **Pérdida de conexión a Internet** | Media | Se ejecuta la aplicación completamente en local: `npm run dev` en Frontend y `npm run start:dev` en Backend con SQL Server local. La suite E2E corre 100% offline. |
| **Olvido de credenciales de prueba en vivo** | Baja | Se tienen anotadas en una tarjeta de apoyo: `admin` / `AdminPassword123!`, `e2e_compras`, `e2e_ventas`, `e2e_consulta` con la contraseña `PasswordE2E123!`. |
| **Error tipográfico en demostración** | Media | Los formularios cuentan con validación visual en tiempo real que previene el envío de datos corruptos, permitiendo corregir el campo al instante. |
