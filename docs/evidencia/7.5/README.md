# Evidencia — Ítem 7.5: registro único de hallazgos y excepciones

**Responsable:** Integrante 1 (requisitos/registro). **Revisor asignado por guía:** Integrante 2 (persona distinta del autor; revisión aún pendiente). **Estado:** implementación documental en rama propuesta, sin aprobación ni fusión. **Versión analizada:** `origin/development` en `be471f003e3aacfc95b0c0b8f5aa418d28864370`.

## Alcance y archivos

Se preparan los formularios de Issues, el proceso de registro único, tres hallazgos basados en hechos documentados por la guía y verificados en el árbol del repositorio, comandos de etiquetas y esta evidencia. Solo pertenecen a 7.5; no se tocaron código funcional, workflows ni tareas ajenas.

- `.github/ISSUE_TEMPLATE/hallazgo.yml`
- `.github/ISSUE_TEMPLATE/excepcion.yml`
- `docs/conocimiento/registro-hallazgos.md`
- `docs/evidencia/7.5/README.md`

Rama de trabajo: `docs/7.5-hallazgos-gerald`, creada desde `origin/development` (conforme GUIA §3.1). El worktree está aislado en `C:\Users\Estudiantes\SystemMx-SSDLC\SystemMx_Backend-7.5`; los archivos locales sin seguimiento del worktree principal no fueron copiados ni stageados.

## Guía aplicada

Leí `C:\Users\Estudiantes\Downloads\GUIA_PROYECTO_SSDLC.md`: §§3.6 y 7.3 para el registro/plantillas/campos/etiquetas/excepciones; §3.3 para H-n/E-n; §3.1 para la base de ramas; §2.3 y §13 para observaciones ya documentadas. La guía exige origen, versión SHA/digest, evidencia, severidad justificada, responsable, estado, tratamiento y referencias T-xx/E-n. Para excepciones exige alcance, justificación, responsable, dos aprobaciones humanas y fecha de vencimiento.

## Estado de GitHub (antes y después de crear Issues)

- Pull requests consultados: [#24](https://github.com/EmmaPorras/SystemMx_Backend/pull/24), abierto como draft hacia `development`; [#25](https://github.com/EmmaPorras/SystemMx_Backend/pull/25), abierto como draft hacia `docs/1.1-flujos-gerald`. No se aprobó ni fusionó ninguno.
- Antes de crear: la API pública devolvió 25 registros, todos con `pull_request`, y 0 Issues reales; las búsquedas por H-1/H-2/H-3 y “registro de hallazgos” tampoco devolvieron resultados.
- Después de verificar que no había Issues duplicados, la integración GitHub creó **[H-26](https://github.com/EmmaPorras/SystemMx_Backend/issues/26), [H-27](https://github.com/EmmaPorras/SystemMx_Backend/issues/27) y [H-28](https://github.com/EmmaPorras/SystemMx_Backend/issues/28)**. Los tres están abiertos, con cuerpo completo, labels todavía vacíos (las etiquetas SSDLC no existían); los estados/severidades están registrados en el cuerpo.
- Se consultaron etiquetas públicas: las etiquetas personalizadas de 7.5 aún no existen. El acceso local de `gh` informa que no hay sesión autenticada (`gh auth status`). Por ello, los comandos de abajo quedan preparados para una persona autenticada con permiso; no se afirma que se hayan creado etiquetas remotamente.
- **Issues de hallazgo:** creados mediante la integración GitHub tras comprobar que no había duplicados: H-26, H-27 y H-28 (enlaces y evidencia debajo). No se crearon excepciones porque no hay solicitud documentada con aprobaciones dobles.

## Hallazgos documentados e Issues creados

Los tres hechos candidatos están enumerados en §2.3 de la guía y se contrastaron contra el commit base indicado arriba. Severidades son **clasificaciones iniciales propuestas con justificación**, pendientes de revisión humana. `confirmado` se aplica al hecho específico del repositorio; no declara vulnerabilidad explotada.

### H-26 — discrepancia de roles

**Issue:** [H-26](https://github.com/EmmaPorras/SystemMx_Backend/issues/26). **Título:** `[hallazgo] H-26 — Matriz API documenta roles distintos a los del backend`
**Origen:** GUIA §2.3 / discrepancias conocidas; revisión documental 7.5.
**Versión afectada:** `be471f003e3aacfc95b0c0b8f5aa418d28864370`.
**Evidencia:** [matriz, roles descritos](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/docs/backend-api-matrix.md#L11-L14); [enum actual](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/src/modules/usuarios/rol-usuario.enum.ts#L1-L6). La matriz enumera ADMIN/OPERADOR/CONSULTA; el código enumera ADMIN/VENTAS/COMPRAS/CONSULTA/DEMO.
**Severidad propuesta:** `sev:baja`. La discrepancia es documental y no cambia los guards; puede inducir expectativas o revisiones de acceso erróneas.
**Responsable propuesto:** Integrante 1 (requisitos); confirmar con responsable del backend.
**Estado propuesto:** `confirmado` (hecho documental contrastado; no vulnerabilidad confirmada).
**Tratamiento:** acordar roles/semántica con responsables; proponer una corrección separada de la matriz, con revisión humana; cerrar solo al cotejar todo endpoint con controladores y aprobar el cambio.
**Amenaza relacionada:** T-01/T-03, relación de análisis de autorización; no implica que esas amenazas se hayan materializado.
**Excepción relacionada:** ninguna registrada. **PR correctivo:** no existe; PR #25 menciona la inconsistencia como contexto pero no modifica la matriz.

### H-27 — configuración de `lint --fix`

**Issue:** [H-27](https://github.com/EmmaPorras/SystemMx_Backend/issues/27). **Título:** `[hallazgo] H-27 — El comando lint está configurado para modificar archivos`
**Origen:** GUIA §2.3; inspección de `package.json`.
**Versión afectada:** `be471f003e3aacfc95b0c0b8f5aa418d28864370`.
**Evidencia:** [script lint en package.json](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/package.json#L15). `lint` incluye `eslint ... --fix`; no se ejecutó lint en este trabajo y no afirmo que haya alterado archivos.
**Severidad propuesta:** `sev:baja`; una comprobación puede reescribir el árbol de trabajo y dificultar reproducir/revisar el diff. No hay evidencia de alteración concreta en esta inspección.
**Responsable propuesto:** Integrante 2, encargado de checks locales por GUIA §8.1; confirmar asignación.
**Estado propuesto:** `confirmado` (configuración del script confirmada).
**Tratamiento:** crear/usar variante de verificación sin `--fix` para CI y revisión; mantener autofix como paso explícito, separado; validar que la variante sin escritura detecte errores. No se cambió `package.json`.
**Amenaza relacionada:** sin relación STRIDE directa. **Excepción relacionada:** ninguna. **PR correctivo:** no existe.

### H-28 — migraciones en el arranque de `start:prod`

**Issue:** [H-28](https://github.com/EmmaPorras/SystemMx_Backend/issues/28). **Título:** `[hallazgo] H-28 — start:prod ejecuta migraciones antes de iniciar el servicio web`
**Origen:** GUIA §§2.3 y 13; inspección de `package.json`, `render.yaml` y `src/database/data-source.ts`.
**Versión afectada:** `be471f003e3aacfc95b0c0b8f5aa418d28864370`.
**Evidencia:** [script start:prod](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/package.json#L14), [comando de arranque Render](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/render.yaml#L4-L24), [selección de URL para migraciones](https://github.com/EmmaPorras/SystemMx_Backend/blob/be471f003e3aacfc95b0c0b8f5aa418d28864370/src/database/data-source.ts#L56-L105). El código ejecuta migraciones al inicio; con URL PostgreSQL selecciona `DATABASE_URL_UNPOOLED` o `DATABASE_URL`. Los valores/grants reales de Render no están visibles ni fueron inspeccionados; no se afirma qué principal o privilegios efectivos usa la instancia.
**Severidad propuesta:** `sev:media` provisional: acoplar migración y arranque puede afectar disponibilidad; si la credencial usada por servicio permite DDL, también importa el límite de privilegios. Ese permiso y la ejecución en vivo deben verificarse antes de elevar una conclusión.
**Responsable propuesto:** Integrante 4 (operación/despliegue), con confirmación del encargado backend.
**Estado propuesto:** `pendiente-investigacion` (efecto/credenciales efectivas no verificados).
**Tratamiento:** verificar sin revelar valores la identidad/permisos efectivos, concurrencia/orden y salida de arranque; evaluar separar job de migración con credencial DDL de la cuenta runtime. La guía §13 ya lo documenta como limitación, pero no consta aquí doble aprobación de una excepción.
**Amenaza relacionada:** sin relación STRIDE directa confirmada; el posible impacto operativo no debe mapearse automáticamente a T-07. **Excepción relacionada:** ninguna aprobada/registrada. **PR correctivo:** no existe.

## Etiquetas y comandos para crearlas

Se contrastó la lista actual de etiquetas: los nombres siguientes no están creados en el repositorio. Estos comandos no se ejecutaron por falta de sesión de `gh` en este entorno. Ejecutar una sola vez, con cuenta autorizada:

```sh
gh auth login
gh label create "hallazgo" --repo EmmaPorras/SystemMx_Backend --color "b60205" --description "Hallazgo del registro SSDLC"
gh label create "excepcion" --repo EmmaPorras/SystemMx_Backend --color "5319e7" --description "Solicitud/registro de excepción temporal"
gh label create "confirmado" --repo EmmaPorras/SystemMx_Backend --color "0e8a16" --description "Hecho descrito confirmado con evidencia; no implica explotación"
gh label create "falso-positivo" --repo EmmaPorras/SystemMx_Backend --color "cfd3d7" --description "Evidencia demuestra que el hallazgo no aplica"
gh label create "pendiente-investigacion" --repo EmmaPorras/SystemMx_Backend --color "fbca04" --description "Falta verificar contexto o alcance"
gh label create "en-tratamiento" --repo EmmaPorras/SystemMx_Backend --color "1d76db" --description "Tratamiento asignado y en curso"
gh label create "cerrado" --repo EmmaPorras/SystemMx_Backend --color "6f42c1" --description "Cierre respaldado por nueva comprobación"
gh label create "sev:alta" --repo EmmaPorras/SystemMx_Backend --color "b60205" --description "Impacto alto justificado en el Issue"
gh label create "sev:media" --repo EmmaPorras/SystemMx_Backend --color "d93f0b" --description "Impacto medio justificado en el Issue"
gh label create "sev:baja" --repo EmmaPorras/SystemMx_Backend --color "0075ca" --description "Impacto bajo/limitado justificado en el Issue"
```

Los formularios aplican automáticamente la etiqueta de tipo (cuando esté creada). Tras crear un Issue, aplicar manualmente la etiqueta de severidad y una sola de estado según lo registrado; al cambiar estado, quitar la anterior para no mantener estados contradictorios. Ejemplo:

```sh
gh issue edit <n> --repo EmmaPorras/SystemMx_Backend --add-label "hallazgo" --add-label "confirmado" --add-label "sev:baja"
```

## Validaciones ejecutadas

- Guía leída en la ruta local indicada; secciones 3.6 y 7.3 consultadas.
- Rama/worktree derivado de `origin/development` en `be471f003e3aacfc95b0c0b8f5aa418d28864370`; PR #24/#25 consultados como abiertos en draft; no aprobados ni fusionados.
- GitHub: antes de crear, 0 Issues reales y ningún duplicado en las búsquedas; después, H-26/H-27/H-28 están abiertos con metadatos completos.
- Fuentes de H-26/H-27/H-28 verificadas en commit `be471f...`; no se ejecutó `npm run lint`, no se modificó matriz ni configuración de migraciones.
- `gh auth status`: no hay sesión CLI. La integración creó Issues; las etiquetas propuestas no existen en el repositorio y los Issues muestran labels vacíos.
- YAML: ambos formularios parsean con `js-yaml`; 11 campos del formulario hallazgo y 10 de excepción; los campos requeridos están presentes e IDs son únicos.
- No se ejecutaron pruebas del backend, análisis de dependencias, migraciones ni peticiones HTTP.

## Pendientes

- Crear las etiquetas requeridas con `gh label create` y aplicar a H-26/H-27/H-28 una etiqueta de estado y la severidad registrada en cada cuerpo.
- Mantener los enlaces reales H-26/H-27/H-28 y añadir enlaces al PR correctivo cuando exista.
- Revisor Integrante 2 y responsable humano deben confirmar severidades, responsables, tratamientos y estados.
- No aceptar excepción hasta contar con dos aprobaciones humanas diferentes, evidencia enlazada y vencimiento futuro.
- No se aprueba ni se fusiona PR; el PR de 7.5 deberá apuntar a `development` y tener revisor distinto del autor.
