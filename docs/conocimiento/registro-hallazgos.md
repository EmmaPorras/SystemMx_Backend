# Registro único de hallazgos y excepciones

**Ítem:** 7.5. **Responsable principal:** Integrante 1 (responsable de requisitos, según GUIA_PROYECTO_SSDLC.md §7). **Revisor:** Integrante 2, persona distinta del autor. **Estado:** mecanismo documental propuesto; H-26, H-27 y H-28 ya se crearon y están abiertos. Etiquetas remotas y revisión humana siguen pendientes según `docs/evidencia/7.5/README.md`.

## Fuente de verdad e identificadores

El registro oficial es la colección de GitHub Issues de `EmmaPorras/SystemMx_Backend` (guía §3.6). Este archivo define el proceso, criterios y comandos; no sustituye los Issues ni debe duplicarse como una lista divergente.

- **H-n:** hallazgo con número `n` igual al número del GitHub Issue. El Issue lleva la etiqueta `hallazgo`.
- **E-n:** excepción temporal con número `n` igual al número de Issue y etiqueta `excepcion`. Una solicitud no aprobada también se registra como Issue `excepcion`, pero no autoriza a aceptar el riesgo.
- Enlaces cruzados se escriben como `T-xx`, `M-xx`, `H-n`, `E-n` y URL al PR correctivo cuando exista. Si no hay relación directa con una amenaza o excepción, se indica `Sin relación directa` / `Ninguna`; no se fuerza una asociación.

No se reserva ni inventa un número antes de crear el Issue. La plantilla explica la convención; la evidencia registra los números/URLs comprobados H-26, H-27 y H-28.

## Campos y calidad del registro

Cada hallazgo debe registrar origen (herramienta o ítem), versión afectada con SHA completo o digest, evidencia enlazable/reproducible, severidad razonada, responsable, estado, tratamiento, amenaza T-xx relacionada, excepción E-n relacionada y PR correctivo cuando exista. Describe por separado:

1. **Hecho observado:** archivo/configuración, commit, comando o salida que lo demuestra.
2. **Impacto/riesgo:** consecuencia posible, expresada condicionalmente cuando dependa de permisos, despliegue o contexto no inspeccionado.
3. **Límites de evidencia:** qué no se ejecutó o no se pudo verificar.
4. **Tratamiento:** acción propuesta, responsable, condición de cierre y comprobación posterior.

No incluyas secretos, tokens, datos personales, capturas con credenciales ni valores privados de entorno. Redacta logs antes de enlazarlos. El estado `confirmado` confirma el hecho específico descrito (por ejemplo, una discrepancia documental o una configuración); no significa que una vulnerabilidad haya sido explotada. `en-tratamiento` no significa corregido. Solo `cerrado` cuando una nueva comprobación aporte evidencia y un revisor confirme el cierre.

## Estados y severidad

Estados de la guía (etiquetas exactas):

- `confirmado`: evidencia suficiente para confirmar el hecho descrito. No equivale automáticamente a vulnerabilidad confirmada.
- `falso-positivo`: evidencia de que la alerta o sospecha no aplica; registrar el razonamiento y revisión.
- `pendiente-investigacion`: falta verificar contexto, alcance, permisos efectivos o reproducibilidad.
- `en-tratamiento`: tratamiento aprobado/en curso, con responsable y seguimiento.
- `cerrado`: tratamiento o descarte comprobado por evidencia nueva y revisado; nunca cerrar solo porque exista un PR.

Severidades de la guía: `sev:alta`, `sev:media`, `sev:baja`. La persona responsable propone una y documenta el impacto/alcance/racional; no inferir CVSS sin vector/evidencia. El revisor puede cuestionar o cambiar la etiqueta con justificación. Los valores iniciales de los tres registros candidatos del README son evaluaciones cualitativas propuestas, no clasificación aprobada.

## Excepciones: aprobación doble y vencimiento

Una excepción acepta temporalmente un hallazgo; no lo elimina ni declara mitigado. Abrir un Issue con etiqueta `excepcion` y enlazar H-n. Antes de considerar el riesgo aceptado, el mismo Issue debe contener:

- alcance preciso (componente, ambiente, datos, rutas y versiones incluidos/excluidos) y justificación;
- responsable que ejecutará controles y seguimiento;
- controles compensatorios y riesgo residual;
- aprobación explícita del responsable designado **y** de un segundo integrante, en cuentas/personas distintas, registrada en comentarios/reviews enlazables; ninguna aprobación se presume por ser autor;
- fecha de vencimiento futura, plan de revisión y tratamiento/corrección objetivo.

Hasta registrar las dos aprobaciones independientes y la fecha de vencimiento, la excepción es **solicitud pendiente** y no autorización efectiva. Al vencer, debe renovarse con nueva aprobación doble y fecha futura o cerrarse luego de corregir/verificar el hallazgo. No poner etiquetas de aceptación ni afirmar que el riesgo está aprobado antes de cumplir estos criterios.

## Flujo de trabajo

1. Leer Issues abiertos/cerrados antes de crear uno y buscar duplicados por título, H/E, componente y evidencia.
2. Abrir el formulario apropiado (`hallazgo.yml` o `excepcion.yml`) y completar campos con hechos y enlaces; para una excepción, iniciar en `pendiente-investigacion`.
3. Crear H-n/E-n usando el número que GitHub asigna. Aplicar una sola etiqueta de tipo, una de estado y una severidad a hallazgos; mover la etiqueta de estado al cambiarlo. En excepciones, conservar `excepcion` y aplicar estado de seguimiento. Los comandos están en `docs/evidencia/7.5/README.md`.
4. Si requiere corrección, asignar responsable; abrir PR separado, referenciar H-n en el PR y enlazarlo al Issue. No modificar `main` ni `development` directamente.
5. Mantener abierta la investigación hasta prueba/evidencia nueva. El revisor verifica reproducción, tratamiento y evidencia de no regresión antes de cerrar.
6. Para excepción, validar las dos aprobaciones independientes y expiración antes de indicar que se acepta el riesgo. Revisar al menos en la fecha acordada y cerrar/revocar o renovar con nueva doble aprobación.

## Etiquetas requeridas

Las etiquetas exactas definidas en §7.3 son:

- Tipo: `hallazgo`, `excepcion`.
- Estado: `confirmado`, `falso-positivo`, `pendiente-investigacion`, `en-tratamiento`, `cerrado`.
- Severidad: `sev:alta`, `sev:media`, `sev:baja`.

Los comandos `gh label create` con nombres, colores y descripciones reproducibles están en `docs/evidencia/7.5/README.md`. Deben ejecutarse por alguien con permiso de administrar etiquetas; el contenido documental no crea etiquetas remotas por sí solo.

## Registros candidatos verificados

La guía §2.3 documenta tres observaciones que se contrastaron con el árbol fuente de `origin/development` en el commit indicado en la evidencia: la matriz de roles, `lint --fix` y migraciones al arrancar `start:prod`. El README identifica cada URL/línea, evaluación provisional, responsable propuesto, estado y limitación. No se editaron esos componentes. Los Issues reales H-26, H-27 y H-28 se enlazan abajo.

## Issues creados en la revisión 7.5

- [H-26 — Matriz API y roles](https://github.com/EmmaPorras/SystemMx_Backend/issues/26): confirmado, severidad baja propuesta.
- [H-27 — lint con --fix](https://github.com/EmmaPorras/SystemMx_Backend/issues/27): confirmado para la configuración; severidad baja propuesta.
- [H-28 — migraciones en start:prod](https://github.com/EmmaPorras/SystemMx_Backend/issues/28): pendiente-investigacion; severidad media provisional.

Los tres Issues están abiertos y aún sin labels porque las etiquetas SSDLC no existen y la sesión local de gh no está autenticada. `confirmado` describe el hecho registrado, no explotación ni vulnerabilidad comprobada. Revisar cuerpos para evidencia, versiones y tratamientos.
