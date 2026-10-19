# Evaluación final — Bitácora 12

**Fecha real:** 19/10/2026.

**Competencia:** 220501098 — Controlar la calidad del servicio de software de
acuerdo con los estándares técnicos.

**Resultado:** evaluación del MVP y cierre académico con observaciones.

La revisión compara `REQUIREMENTS.md` con el código y las evidencias existentes.
Las pruebas manuales del despliegue fueron comunicadas por el usuario el
17/10/2026, y la conservación tras reiniciar el 19/10/2026. Las comprobaciones
locales de esta evaluación se ejecutaron el 19/10/2026. La especificación inicial
se conserva como referencia; sus diferencias se registran aquí.

## 1. Criterios de revisión y fuentes

Se revisaron funcionalidad, permisos, conservación de información, facilidad
de instalación y capacidad de repetir las comprobaciones. Se utilizaron:

- Requisitos y diseño iniciales: `REQUIREMENTS.md`, `ARCHITECTURE.md`.
- Código de rutas, servicios, validadores, repositorios y esquema Prisma.
- Pruebas Vitest del backend y frontend, builds y tipos de pruebas.
- Registro HTTPS, confirmaciones manuales y procedimiento de operación en
  `DESPLIEGUE.md`.
- `DEMO-PRESENTACION.md`, guion local del flujo de recepción, mecánico y administración.

En la matriz, **implementado** significa que existe el comportamiento en el
código y se identifica su evidencia; no equivale a una prueba independiente de
cada criterio en producción. **Parcial** identifica una diferencia concreta con
la especificación. **Adaptado** describe un cambio del entorno acordado durante
el despliegue. Las pruebas unitarias simulan los repositorios y no certifican
las consultas reales de MySQL ni las condiciones de carga.

## 2. Comparación de los 17 criterios iniciales

| Criterio | Resultado | Evidencia o diferencia |
|---|---|---|
| US-01: login | Implementado | `auth.service.ts`, sus pruebas y login público comprobado por HTTPS; flujo manual comunicado |
| US-02: renovación de sesión | Implementado | Rotación en `auth.service.ts` y pruebas; interceptor del frontend comparte una renovación ante varios 401 |
| US-03: logout | Implementado | Invalida el refresh token; pruebas de auth y cierre de sesión HTTPS |
| US-04: creación de usuarios con rol | Implementado | Validador y servicio de usuarios; guion manual de administración |
| US-05: desactivación y conservación del historial | Implementado | Baja lógica, rechazo de login para inactivos y relaciones conservadas; servicio y pruebas. Se añadió protección de la cuenta propia |
| US-06: registro de clientes y duplicados | Implementado | Validadores, servicio, restricciones del modelo y pruebas; flujo manual comunicado |
| US-07: búsqueda paginada de clientes | Implementado | Repositorio, paginación y vista de clientes; pruebas y flujo manual |
| US-08: vehículo asociado y placa única | Implementado | Modelo con relación y restricción única, validador y servicio; pruebas y flujo manual |
| US-09: búsqueda de vehículos por placa | Implementado | Búsqueda del repositorio y listado de vehículos; pruebas y flujo manual |
| US-10: apertura de orden en PENDING | Implementado | Estado predeterminado en Prisma, kilometraje y servicio de órdenes; flujo manual comunicado |
| US-11: asignar únicamente un MECHANIC | Parcial | La interfaz filtra mecánicos, pero `assignMechanic` y la creación de orden no comprueban el rol del usuario indicado mediante una llamada directa |
| US-12: diagnóstico por mecánico asignado o admin | Parcial | Se comprueba pertenencia del mecánico y transiciones, pero recepción también puede editar diagnóstico y avanzar estados; difiere del criterio original |
| US-13: servicios y repuestos | Implementado | Validadores, autorización y pertenencia en el servicio de ítems; pruebas y guion manual |
| US-14: historial técnico por vehículo | Parcial | Órdenes consultables por vehículo y estado; falta una consulta/vista específica que reúna COMPLETED y DELIVERED como historial del vehículo |
| US-15: fotografías en órdenes asignadas | Adaptado | Proveedor local conservado y Cloudinary para Render; permisos en el servicio, pruebas y subida manual expresamente confirmada por el usuario |
| US-16: recordatorios de mantenimiento | Implementado | Registro, listado y finalización por administración/recepción; pruebas y guion manual comunicado |
| US-17: reportes por periodo | Implementado | Servicios y vistas de reportes, conversión de límites de fecha y CSV; pruebas y guion manual comunicado |

La clasificación es **13 implementados, 1 adaptado y 3 parciales**. El resultado
no representa un cumplimiento completo de la especificación inicial. Además,
la matriz RBAC inicial permite algunas lecturas al mecánico que el frontend
actual no ofrece; recordatorios está restringido a ADMIN y RECEPTIONIST. La
recepción puede listar usuarios para asignar mecánicos, pero no administrarlos.
Las reglas definitivas de esos casos deben conciliarse con la operación esperada.

Otras diferencias: el listado de órdenes no tiene rango de fechas, aunque los
reportes sí; los reportes devuelven el conjunto y se paginan en el cliente.
Estas diferencias se conservan como observaciones de alcance.

## 3. Hallazgos y decisiones de mejora

| Hallazgo | Prioridad | Tratamiento |
|---|---|---|
| H-01: la API permitía al admin desactivarse o cambiar su propio rol | Alta | Corregido en esta revisión, con pruebas unitarias y HTTP local |
| H-02: README principal describía un backend inicial, variables y rutas antiguas | Media | Corregidos README principal y guías de ambos componentes; enlazada la evaluación desde los documentos iniciales |
| H-03: asignación directa sin comprobar rol MECHANIC, US-11 | Alta | Pendiente: validar rol y usuario activo al crear/asignar órdenes, con casos negativos y prueba de integración |
| H-04: diferencias de permisos, US-12 y matriz RBAC | Media | Pendiente: acordar la regla funcional y alinear API, frontend, documentación y pruebas |
| H-05: historial técnico dedicado, US-14 | Media | Pendiente: consulta de COMPLETED/DELIVERED por vehículo y vista correspondiente |
| H-06: restauración de usuarios no disponible desde la interfaz | Media | Pendiente: listado que permita descubrir desactivados y acción de restauración; la API ya expone el endpoint |
| H-07: recuperación desde respaldo sin ensayo real | Media | Procedimiento documentado en la 11; pendiente crear copia y ensayar su restauración en un destino separado |
| H-08: revocación de permisos de un access token ya emitido | Media | El middleware verifica el JWT sin consultar el estado actual del usuario; un token previo puede conservar permisos hasta caducar. Pendiente evaluar revocación o comprobación de estado |
| H-09: ausencia de pruebas de carga y suite de integración con MySQL | Media | Pendiente medir con volumen representativo y una base de pruebas independiente |

La mejora implementada en H-01 evita perder acceso administrativo mediante
operaciones sobre la cuenta propia. No resuelve la revocación de tokens de H-08
ni las diferencias de requisitos de H-03 a H-05. La priorización deja esas tareas
identificadas para continuidad y evita confundir un flujo de demostración correcto
con la validación de todos los escenarios posibles.

## 4. Mejora de protección del administrador

Antes de modificar el servicio se incorporaron cinco casos al archivo
`backend/tests/modules/users.service.test.ts`. La ejecución inicial dejó tres
fallos que reprodujeron el problema: cambio propio a RECEPTIONIST, cambio propio
a MECHANIC y baja de la propia cuenta. Los otros quince casos del archivo pasaron.

El controlador pasa el identificador obtenido de `req.user.id`, establecido por
el JWT autenticado. El servicio devuelve 403 cuando el destino es la cuenta
propia y se solicita un rol distinto o su desactivación, antes de escribir en el
repositorio. Sigue permitiendo editar nombre, correo y contraseña, conservar el
rol actual y administrar otras cuentas. No cambia el formato de la API ni el
esquema de MySQL. Swagger documenta las nuevas respuestas 403.

El comando `npm run test:admin-guard`, disponible en `backend/` después de
`npm run build`, inicia un servidor efímero en `127.0.0.1` con repositorios
simulados y JWT de prueba. Ejecuta ocho peticiones:

- Cambio propio a MECHANIC y RECEPTIONIST: 403, sin escritura.
- Baja propia: 403, sin escritura.
- Edición del perfil propio conservando ADMIN: 200.
- Cambio de rol y baja de otra cuenta: 200.
- Petición sin sesión: 401; petición de un mecánico: 403.

Las peticiones prohibidas incluyen un `actorId` distinto en el cuerpo: se
comprobó que no suplanta al identificador del JWT. El script se cierra al terminar
y no conecta con MySQL ni modifica usuarios reales. Estas ocho peticiones son
una comprobación HTTP adicional y no incrementan el número de pruebas Vitest.

## 5. Regresión ejecutada el 19/10/2026

| Comprobación | Resultado |
|---|---|
| Backend: `npm test` | 266 pruebas correctas, 22 archivos |
| Frontend: `npm test` | 137 pruebas correctas, 9 archivos |
| Backend: `npm run build` | Correcto |
| Frontend: `npm run build` | Correcto |
| Frontend: `npm run test:types` | Correcto |
| Backend: `npm run test:admin-guard` | Ocho peticiones HTTP locales correctas, datos simulados |

Total: **403 pruebas unitarias**, cinco más que las 398 del cierre anterior.
No se recalculó cobertura: los porcentajes de la Bitácora 10 corresponden a su
medición histórica. Los tiempos de una ejecución local no se usan como prueba
de rendimiento del servicio publicado.

La verificación de los rechazos HTTP corresponde al código compilado localmente
con datos simulados. Tras subir el commit `aaca42f` a GitHub, se comprobó en
Render el OpenAPI público con las nuevas descripciones y respuestas 403 de
usuarios, la salud de la API, CORS y la entrega de las rutas `/login`, `/clientes`
y `/ordenes` con HTTP 200. Esta comprobación pública fue de lectura; no se
enviaron peticiones para desactivar ni degradar al administrador real.

## 6. Entrega y continuidad

La documentación de entrada describe ahora los dos componentes, sus variables,
comandos, seed y ubicación real de Swagger y Postman. El seed crea solamente
el administrador; las cuentas y datos del guion se preparan por separado.
La guía local de demostración distingue contraseñas de desarrollo y del destino,
usa `/docs` y explica las URLs de Cloudinary.

| Entregable | Referencia |
|---|---|
| Código y pruebas | `backend/`, `frontend/` |
| Requisitos y diseño de referencia | `REQUIREMENTS.md`, `ARCHITECTURE.md` |
| Instalación y API | `README.md`, `backend/README.md`, `frontend/README.md` |
| Operación, respaldo y evidencias del despliegue | `DESPLIEGUE.md` |
| Evaluación y observaciones | `EVALUACION-FINAL.md` |
| Estado para continuidad | `SESSION.md` |
| Bitácoras y sustentación académica | `backend/Bitacoras.md`, `backend/Bitacora-12-Sustentacion.md`, archivos locales ignorados por Git |

Se cierra la evaluación académica con resultados reproducibles, una mejora
implementada y observaciones abiertas. El proyecto sigue disponible para la
demostración del flujo principal ya comunicado por el usuario. Antes de ampliar
su uso, la continuidad debe atender primero la asignación por rol, la conciliación
de permisos y el ensayo de recuperación, conservando la matriz de requisitos
y las pruebas como registro de lo completado y de lo pendiente.
