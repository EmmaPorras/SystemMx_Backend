# Evidencia del borrador SSDLC — Ítem 1.3

**Responsable:** Integrante 1.
**Estado:** borrador documental; revisión visual del D1 por Integrante 1 registrada; aprobación integral de amenazas y reglas pendiente.
**Fecha de actualización:** 2026-11-09.
**Alcance:** modelado de amenazas de diseño basado en código y configuración/documentación local. No es auditoría de producción ni certificación de seguridad.

## Topología representada en D1

D1 representa navegador/usuarios → frontend React 19 servido como Static Site en Render → backend NestJS como Web Service en Render → PostgreSQL en Neon para producción. Auth/Usuarios, operaciones comerciales y reportes se muestran dentro del backend. Apps Script permanece como servicio externo de correo.

SQL Server 2022 aparece aparte, marcado fuera del alcance productivo y sin conexión al backend Render: la documentación lo asocia con desarrollo local y pruebas E2E. Así no se sugiere que SQL Server alimente producción. La topología es la declarada en fuentes del repositorio; no se comprobó el estado de servicios desplegados ni se inspeccionó Neon en vivo.

Se conservaron los nueve IDs de flujos previos. Los dos accesos de usuario terminan ahora en el frontend y se añadió el flujo HTTPS REST frontend→API. Se mantienen las conexiones backend→Auth/Usuarios, backend→módulos F2/reportes, módulos→Neon y Auth→correo. El flujo REST indica JWT en rutas protegidas; rutas públicas no requieren token.

## Fuentes revisadas

- `render.yaml`: declara el sitio estático frontend y el servicio Node del backend en Render; configura la URL API y variables de conexión como valores de entorno no versionados.
- `README.md` del backend: documenta Neon Serverless PostgreSQL como persistencia productiva y Microsoft SQL Server local para desarrollo/E2E.
- `src/database/runtime-typeorm.options.ts`: usa PostgreSQL al detectar `DATABASE_URL`/tipo PostgreSQL y SQL Server para el modo local configurado; no se copiaron secretos al modelo.
- `C:\Users\Estudiantes\SystemMx-SSDLC\SystemMx_Frontend\package.json` y `README.md`: identifican React 19 y declaran el despliegue del frontend en Render. El repositorio frontend se inspeccionó en lectura solamente.
- `docs/final/01-ARQUITECTURA-Y-TECNOLOGIAS.md`: describe Render, Neon y SQL Server local/E2E como entornos distintos.

Estas fuentes respaldan una arquitectura declarada/documentada; no son una comprobación de disponibilidad, configuración efectiva ni controles del hosting en producción.

## Escenarios STRIDE

El modelo editable conserva los siete escenarios T-01…T-07, sus medidas M-01…M-07, IDs internos, estados `Open`, tipos STRIDE y celdas asociadas. Son hipótesis pendientes; **no se confirma ninguna vulnerabilidad**. No se afirma que las amenazas se hayan explotado ni que sus mitigaciones estén verificadas o aprobadas.

## Archivos preparados

- `docs/conocimiento/arquitectura-y-permisos.md` — componentes, permisos observados y comparación documental; no establece política aprobada.
- `docs/conocimiento/amenazas.md` — escenarios STRIDE y comprobaciones propuestas.
- `docs/conocimiento/threat-model/systemmx.json` — modelo D1 editable compatible con Threat Dragon v2.6.2.
- `docs/evidencia/1.3/ThreatDragon-SystemMx-D1-2026-11-09.pdf` — informe PDF exportado por Threat Dragon Desktop 2.6.2.
- `docs/conocimiento/dudas-abiertas.md` — decisiones pendientes; ninguna regla queda aprobada por este borrador.
- `docs/backend-api-matrix.md` — consultada para comparar; no modificada.

La guía `GUIA_PROYECTO_SSDLC.md` no estaba disponible en las rutas revisadas anteriormente. La comprobación contra sus secciones 1–5 y 7.2 queda pendiente de recibirla.

## Revisión visual y exportación registrada

El Integrante 1 informa que abrió el modelo actualizado en OWASP Threat Dragon Desktop 2.6.2, revisó visualmente D1 y generó el informe PDF adjunto. El archivo local identifica como creador a ThreatDragon/2.6.2; `pdfinfo` reporta 6 páginas A3 y fecha de creación 2026-11-09 18:18 (hora de Costa Rica). Esta constancia documenta la revisión visual informada por el integrante; no implica aprobación integral del análisis ni validación de medidas.

## Verificaciones y resultados reales

- **Parseo:** PowerShell `ConvertFrom-Json` aceptó el modelo actualizado.
- **Esquema:** AJV aceptó el JSON contra el esquema oficial de OWASP Threat Dragon v2.6.2 (`td.vue/src/assets/schema/threat-dragon-v2.schema.json`). Resultado: `docs/conocimiento/threat-model/systemmx.json valid`.
- **Estructura:** 24 celdas: 3 actores, 5 procesos, 3 almacenes, 10 flujos y 3 límites de confianza. Se conservaron 9 IDs de flujo y se agregó 1 conexión frontend→API.
- **Amenazas/referencias:** 7 IDs de amenaza únicos con medidas M-01…M-07; no hay referencias de flujos rotas. Una comparación con copia local previa confirmó que el payload STRIDE original (IDs, medidas, estados, tipos y celdas) no cambió.
- **Geometría aproximada:** 0 cajas de nodos superpuestas; 0 cruces calculados de flujos con nodos no relacionados; 0 cajas aproximadas de etiquetas superpuestas con nodos o entre sí; 0 límites cruzando nodos. SQL Server local no tiene conexión con el backend Render en D1.
- **Límite de geometría:** se estimaron cajas rectangulares de nodos, trayectorias lineales usando centros/vértices y dimensiones aproximadas de etiquetas. No se reproduce el renderizado de curvas, tipografía, selección, zoom ni la aplicación; esta comprobación no reemplaza la revisión visual reportada arriba.
- **Hallazgos:** ninguna vulnerabilidad confirmada. No se ejecutaron pruebas HTTP o de aplicación para esta actualización.
- **Alcance de archivos:** no se cambió matriz, código funcional, base de datos, pruebas, migraciones, secretos ni infraestructura. No se fusionan ramas ni se modifican `main` o `development`.

## Comandos de validación reproducibles

Desde `C:\Users\Estudiantes\SystemMx-SSDLC\SystemMx_Backend`:

```powershell
# Parsear JSON
Get-Content -Raw docs/conocimiento/threat-model/systemmx.json | ConvertFrom-Json | Out-Null

# Validar con esquema oficial v2.6.2
New-Item -ItemType Directory -Force work | Out-Null
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/OWASP/threat-dragon/v2.6.2/td.vue/src/assets/schema/threat-dragon-v2.schema.json' -OutFile .\work\threat-dragon-v2.6.2.schema.json
npx --yes ajv-cli validate --allow-union-types -s .\work\threat-dragon-v2.6.2.schema.json --all-errors --verbose -d docs/conocimiento/threat-model/systemmx.json

# Revisar cambios whitespace y estado
git diff --check
git status --short --branch
```

La comprobación geométrica adicional usó un validador temporal fuera del repositorio. La copia previa al ajuste de topología está fuera del repositorio en `C:\Users\Estudiantes\Documents\Codex\2026-11-09\trabaja-como-asistente-de-seguridad-ssdlc\work\systemmx-before-render-neon-20261109.json` y no se incluye en el alcance Git.

## Pendientes

- Aprobación integral de escenarios, prioridades, medidas, roles y reglas por las personas responsables. La revisión visual informada por Integrante 1 no cierra estos pendientes.
- Confirmar que la configuración documentada de Render/Neon corresponde al despliegue vivo; no se inspeccionó hosting ni base de producción.
- Incorporar `GUIA_PROYECTO_SSDLC.md` y contrastar las secciones 1–5 y 7.2.


\n
