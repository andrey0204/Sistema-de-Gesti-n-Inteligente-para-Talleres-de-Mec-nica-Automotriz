# Despliegue e implementación

Sistema de Gestión Inteligente para Talleres de Mecánica Automotriz.

**Estado al 19/10/2026: Bitácora 11 cerrada documentalmente.** Frontend y backend publicados en Render, MySQL en Aiven y fotografías en Cloudinary. CORS, Rewrite, salud, autenticación y consulta protegida comprobados por HTTPS. El usuario confirmó el flujo de demostración y la subida de imágenes el 17/10/2026, y la conservación de datos e imágenes tras reiniciar el 19/10/2026. Se completó el procedimiento de respaldo y recuperación de MySQL y originales de fotos. El cierre acredita la documentación del procedimiento; la exportación y el ensayo de restauración no se ejecutaron en este cierre.

## Entorno de alojamiento gratuito elegido

| Componente | Servicio | Plan y alcance |
|---|---|---|
| Frontend Vue | Render Static Site | Alojamiento gratuito del frontend compilado con dirección pública |
| Backend Express | Render Web Service | Instancia gratuita; se suspende tras 15 minutos sin tráfico y tarda aproximadamente un minuto en volver a responder |
| MySQL | Aiven for MySQL | Plan gratuito, sin tarjeta y sin plazo fijo de expiración; incluye 1 GB de almacenamiento y puede apagarse por inactividad |
| Fotografías de las órdenes | Cloudinary Image & Video API | Plan gratuito sin tarjeta; 25 créditos para almacenamiento, transferencia y transformaciones, compartidos entre esos usos |

Esta distribución permite compartir la dirección del frontend para probar el sistema sin que el computador de desarrollo permanezca encendido. No requiere comprar un dominio. Su viabilidad debe verificarse en las cuentas concretas y en las pruebas de despliegue, respetando los límites de los planes gratuitos.

El backend permite elegir `STORAGE_PROVIDER=local` o `cloudinary`. Render gratuito no conserva los archivos locales al suspenderse, reiniciarse o desplegarse de nuevo, por lo que el destino utiliza Cloudinary. La integración de subida, visualización y eliminación ya está implementada y se verificó una subida real con consulta HTTPS y eliminación del archivo de prueba. El 17/10/2026 el usuario confirmó también la subida de imágenes desde el flujo de una orden en la aplicación publicada.

La presentación utilizará datos de demostración y cuentas de prueba por rol. Antes de compartir el enlace se verificará que la base de datos esté activa, se abrirá la aplicación y se comprobarán el inicio de sesión y la carga de imágenes. El arranque de la API después de un periodo sin uso puede introducir una espera inicial.

Fuentes oficiales consultadas el 10/10/2026:

- [Render: planes gratuitos, sitios estáticos y límites de la API](https://render.com/docs/free).
- [Render: facturación al superar límites y comportamiento sin método de pago](https://render.com/docs/faq).
- [Aiven: características y límites del plan gratuito de MySQL](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier).
- [Cloudinary: plan gratuito y consumo de créditos](https://cloudinary.com/documentation/billing_and_plans).

Los cambios de Cloudinary y Aiven se publicaron en `main` mediante el commit
`b40b6b4`; la configuración de Render y Swagger relativo se publicaron en
`93cf66a`. El flujo de demostración fue completado por el usuario el 17/10/2026 con resultado correcto. La conservación de datos e imágenes tras reiniciar fue confirmada por el usuario el 19/10/2026. El procedimiento de respaldo y recuperación está documentado más adelante. La evaluación de la Bitácora 12 está en [EVALUACION-FINAL.md](EVALUACION-FINAL.md), con su mejora, resultados y observaciones de continuidad.

## Configuración del backend en Render

Crear un **Web Service** desde el repositorio de GitHub, usando estos valores:

| Campo | Valor |
|---|---|
| Name | `taller-mecanico-api` (si está disponible) |
| Language | `Node` |
| Branch | `main` |
| Region | `Oregon (US West)` |
| Root Directory | `backend` |
| Compute | `Free` |
| Build Command | `npm ci --include=dev && npm run db:generate && npm run build` |
| Start Command | `npm run db:migrate:prod && npm start` |
| Health Check Path | `/api/health` |

Las dependencias de desarrollo se incluyen durante la instalación porque la
compilación necesita TypeScript y los comandos de base de datos necesitan el
CLI de Prisma. El comando de inicio aplica las migraciones pendientes antes
de arrancar la API. El administrador ya existe en Aiven.

Se preparó `backend/.env.render`, privado e ignorado por Git, con las variables
del backend copiadas de `.env.production` y `NODE_VERSION=24.13.1`. Importar su
contenido mediante **Add from .env** en Render. Contiene los secretos de JWT,
la URL MySQL y las credenciales de Cloudinary; las credenciales del
administrador y las variables auxiliares `AIVEN_*` se conservan en la
configuración local de preparación. Render asigna `PORT`.

`CORS_ORIGIN=https://taller-mecanico-web.onrender.com` está configurado tanto
en Render como en los archivos privados locales. Comprobados los preflights
de login y de consulta con token: origen público, métodos y cabeceras correctos.
Swagger utiliza `/api` relativo y funciona en el servidor publicado.

Servicio publicado: `https://taller-mecanico-api-9w77.onrender.com`.
Verificación por HTTPS: `/api/health` y `/docs/` devuelven 200; el login
ADMIN, `GET /api/users` autenticado y el logout devuelven 200. Sin token,
`GET /api/users` devuelve 401. La sesión de prueba quedó cerrada.

La primera comprobación detectó que Swagger UI interceptaba las descargas
OpenAPI y devolvía HTML. Se registraron las rutas JSON y YAML antes de ese
middleware. Tras publicar `a87ff21`, ambas descargas devuelven HTTP 200 con
contenido OpenAPI correcto y servidor relativo `/api`; también se repitieron
correctamente las comprobaciones de autenticación y consulta protegida.

Referencias: [servicios web en Render](https://render.com/docs/web-services),
[variables e importación desde .env](https://render.com/docs/configure-environment-variables)
y [versión de Node](https://render.com/docs/node-version).

## Configuración del frontend en Render

Crear **New → Static Site** desde el mismo repositorio de GitHub:

| Campo | Valor |
|---|---|
| Name | `taller-mecanico-web` (si está disponible) |
| Branch | `main` |
| Root Directory | `frontend` |
| Build Command | `npm ci --include=dev && npm run build` |
| Publish Directory | `dist` |

Importar mediante **Add from .env** el archivo local `frontend/.env.render`,
ignorado por Git. Contiene `NODE_VERSION=24.13.1`, `SKIP_INSTALL_DEPS=true`
(la instalación está incluida en el comando),
`VITE_API_URL=https://taller-mecanico-api-9w77.onrender.com/api` y
`VITE_UPLOADS_URL=https://taller-mecanico-api-9w77.onrender.com/uploads`.
Las variables `VITE_*` contienen direcciones públicas; los secretos se conservan
exclusivamente en el backend. Las imágenes de Cloudinary utilizan su propia URL HTTPS.

En **Redirects/Rewrites**, añadir **Source Path** `/*`, **Destination Path**
`/index.html`, **Action** `Rewrite`, para permitir la recarga de rutas de Vue Router.

Frontend publicado en `https://taller-mecanico-web.onrender.com`. Comprobación
por HTTPS: raíz y JavaScript principal devuelven 200; la compilación contiene
`https://taller-mecanico-api-9w77.onrender.com/api`. Las rutas `/login`,
`/clientes`, `/ordenes` y `/ordenes/1` devuelven ahora 200 y el mismo documento
Vue que la raíz, tras guardar Rewrite `/*` a `/index.html` en Render. Esta
comprobación acredita la entrega de la SPA al acceder directamente. El usuario
confirmó después la ejecución correcta del guion desde el navegador; el registro
manual se encuentra más adelante.

El preflight OPTIONS del login devuelve 204 con
`Access-Control-Allow-Origin: https://taller-mecanico-web.onrender.com`,
credenciales habilitadas, POST y Content-Type permitidos. El preflight de
`/api/users` permite también Authorization. Tras actualizar Environment del
backend y desplegar, se repitieron por HTTPS salud, login ADMIN, consulta
protegida y logout con el encabezado Origin del frontend: respuestas correctas.
Sin token, la consulta protegida conserva el rechazo 401. La sesión de prueba
fue cerrada. Los archivos privados del backend están sincronizados con ese origen.

Referencias: [Vue y rutas en Render](https://render.com/docs/deploy-vue-js) y
[sitios estáticos e instalación de dependencias](https://render.com/docs/static-sites).

## Avance de la creación de servicios

- Render: backend publicado en `https://taller-mecanico-api-9w77.onrender.com`; salud, Swagger UI, login ADMIN, consulta protegida y logout comprobados por HTTPS. Frontend publicado en `https://taller-mecanico-web.onrender.com`, con raíz, JavaScript, rutas directas y CORS verificados. Login ADMIN y consulta protegida comprobados con Origin del frontend; flujo desde navegador confirmado por el usuario el 17/10/2026.
- Aiven: proyecto `taller-mecanico-am`, servicio `taller-mecanico-db`, MySQL 8.4.11, plan `Free-1-1gb`, base `defaultdb`. Conexión TLS verificada, migración `20260413200324_init` aplicada y ocho tablas del sistema presentes. Administrador inicial creado y login por HTTP comprobado desde la API temporal local.
- Cloudinary: cuenta creada y tres credenciales configuradas en `backend/.env`, archivo ignorado por Git. Integración implementada y `STORAGE_PROVIDER=cloudinary` activado localmente. Prueba real de subida, consulta HTTPS y eliminación correcta; subida desde la aplicación desplegada confirmada por el usuario el 17/10/2026.

Se solicitó renovar la contraseña de Aiven porque quedó visible en una captura. El usuario configuró la contraseña del destino localmente y la autenticación con Aiven se comprobó correctamente. Las credenciales reales no se registran en este documento. El certificado CA está guardado en `backend/prisma/aiven-ca.pem`: OpenSSL lo interpreta correctamente, identifica `CA:TRUE` y verifica su firma con resultado `OK`; su vigencia termina el 07/10/2036. La conexión TLS al servicio se verificó correctamente mediante `npm run db:check:prod`.

El proyecto utiliza Prisma 6: su conexión MySQL permite `sslcert` para indicar el certificado CA y `sslaccept=strict` para validar el certificado. Las rutas relativas del certificado se resuelven desde `backend/prisma/`. La URI de Aiven se adaptó a esos parámetros; no basta con trasladar su parámetro `ssl-mode=REQUIRED` a la configuración de Prisma. Referencia: [conexión MySQL y SSL en Prisma 6](https://docs.prisma.io/docs/orm/v6/overview/databases/mysql).

## Preparación de la conexión a Aiven

Se creó `backend/.env.production`, separado de `backend/.env` e ignorado por Git. Incluye el host, puerto, usuario y base de datos observados en Aiven, las credenciales locales de Cloudinary y nuevos secretos JWT propios del destino. `AIVEN_PASSWORD` está configurada por el usuario y `DATABASE_URL` fue generada y guardada después de verificar la conexión. `CORS_ORIGIN` ya utiliza la dirección pública del frontend, tanto localmente como en Render.

1. Introducir la contraseña renovada del usuario de Aiven en `AIVEN_PASSWORD`, entre las comillas, y guardar el archivo.
2. Desde `backend/`, ejecutar `npm run db:check:prod`.
3. El script verifica una consulta `SELECT 1` y la existencia de cifrado TLS usando el certificado CA con validación estricta. Si ambos pasos pasan, guarda `DATABASE_URL` en el mismo archivo, codificando la contraseña para su uso en una URL sin imprimirla.

La comprobación de conexión no crea tablas, usuarios ni modifica registros en MySQL. No carga la configuración de desarrollo. Se verificaron tanto la salida controlada cuando falta la contraseña como la conexión real con Aiven: autenticación, consulta `SELECT 1` y cifrado TLS correctos. Las migraciones y el administrador se prepararon después, con los comandos del apartado siguiente. El ejemplo sin secretos está en `backend/.env.production.example`.

## Migraciones y administrador del destino

Los comandos siguientes se ejecutan desde `backend/`. `scripts/run-aiven.mjs`
carga explícitamente `.env.production`, comprueba que la URL apunte al servicio
de Aiven configurado y requiera TLS estricto, y pasa esos valores al proceso
elegido. La configuración del destino prevalece sobre cualquier variable local
o valor de `.env`.

| Comando | Función y resultado observado |
|---|---|
| `npm run db:migrate:aiven` | Ejecuta `prisma migrate deploy`; migración `20260413200324_init` aplicada correctamente |
| `npm run db:status:aiven` | Consulta el historial y las migraciones pendientes; disponible para operación |
| `npm run db:seed:aiven` | Crea solo el administrador inicial; ejecutado correctamente y repetido sin duplicar la cuenta |
| `npm run db:verify:aiven` | Comprueba las ocho tablas y `_prisma_migrations`, el hash bcrypt, `/api/health`, el login ADMIN y `/api/users`; ejecutado correctamente |

El administrador creado utiliza el correo `admin@workshop.com`. Su contraseña
aleatoria está guardada exclusivamente en `ADMIN_PASSWORD` de
`backend/.env.production`; no se registra en esta documentación ni en Git.
El seed exige correo y contraseña propios en producción, con mínimo 12
caracteres y máximo 72 bytes para bcrypt. También admite `ADMIN_FULL_NAME`.
Si ya existe un administrador activo, conserva su cuenta y contraseña.

La verificación HTTP inicia una API temporal solo en `127.0.0.1`, conectada a
Aiven, y cierra la sesión de prueba y el servidor al terminar. Acredita la
preparación del backend y MySQL. El acceso público de Render se comprobó
después mediante salud, login, consulta protegida y logout, como se registra arriba.

Validación tras preparar el administrador: 261 pruebas del backend superadas,
compilación correcta y comprobación de tipos de los scripts y del seed correcta.
Con las 137 pruebas del frontend ya verificadas, el conjunto tiene 398 pruebas.
Las seis pruebas nuevas comprueban credenciales de producción explícitas,
contraseña propia y límite de bytes de bcrypt.

## Integración de fotografías verificada

El backend recibe el archivo en memoria con el filtro de tipos y el límite de tamaño existentes. El servicio comprueba el acceso a la orden antes de guardarlo en el proveedor elegido. Si falla el registro en MySQL después de una subida, intenta eliminar el archivo para evitar fotografías sin registro.

No se requiere una migración adicional de la tabla de imágenes: `filename` almacena el nombre local o el `public_id` de Cloudinary y `path` la ruta local o la URL HTTPS. El frontend utiliza la URL de Cloudinary cuando corresponde y conserva el acceso a las fotografías locales mediante `VITE_UPLOADS_URL`. La eliminación identifica el proveedor a partir de la ruta guardada, incluso si cambió el proveedor configurado. Las imágenes locales anteriores no se migran automáticamente a Cloudinary.

Para activar Cloudinary en Render, configurar exclusivamente en el backend:

```dotenv
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Las credenciales no deben incluirse en variables `VITE_*`. La implementación sigue el [SDK Node.js de Cloudinary](https://cloudinary.com/documentation/node_image_and_video_upload) y su [API de eliminación](https://cloudinary.com/documentation/image_upload_api_reference).

Verificaciones tras la integración:

- Backend: `npm test`, 255 pruebas superadas; `npm run build`, compilación correcta.
- Frontend: `npm test`, 137 pruebas superadas; `npm run build` y `npm run test:types`, correctos.
- Total: 392 pruebas; 23 incorporadas para permisos y compensación de la subida, almacenamiento local y remoto, selección del proveedor y visualización de URLs.
- `cd backend` y `npm run test:storage`: crea un GIF de un píxel en Cloudinary, consulta su URL HTTPS y elimina el archivo creado. Ejecutado con resultado correcto; no consulta ni modifica MySQL. Esta prueba manual realiza peticiones reales y no forma parte de `npm test`.

## Diagnóstico inicial

La verificación local del proyecto dejó estos resultados:

- Backend: 235 pruebas unitarias superadas y compilación TypeScript correcta.
- Frontend: 134 pruebas unitarias superadas, compilación de producción y comprobación de tipos de las pruebas correctas.
- Las pruebas existentes utilizan simulaciones de la capa de datos; no acreditan el funcionamiento de una instalación desplegada.
- Existen scripts para compilar, iniciar la API y aplicar migraciones en producción.
- No hay archivos de infraestructura de despliegue en el repositorio.

## Componentes que debe alojar el entorno

| Componente | Requisito de operación |
|---|---|
| API | Proceso Node.js que ejecute `backend/dist/server.js`, dependencias de ejecución y cliente Prisma generado |
| Base de datos | MySQL y aplicación de las migraciones existentes mediante `prisma migrate deploy` |
| Frontend | Archivos de `frontend/dist/` servidos por HTTP; resolución de las rutas de Vue Router mediante `index.html` |
| Imágenes | Cloudinary para el destino gratuito; almacenamiento local mediante `UPLOAD_DIR` y `/uploads` disponible para desarrollo |
| Autenticación | Administrador inicial y secretos de acceso propios del entorno |

La versión de Node declarada en `frontend/.nvmrc` y fijada mediante `NODE_VERSION` es 24.13.1. La revisión local se realizó con Node 22.14.0; el registro del primer despliegue del frontend mostró Node 24.13.1.

## Variables del entorno

| Variable | Momento y propósito |
|---|---|
| `NODE_ENV=production` | Ejecución del backend; activa el tratamiento de errores de producción |
| `PORT` | Puerto interno de la API |
| `DATABASE_URL` | Conexión a la base de datos del destino |
| `JWT_ACCESS_SECRET` | Firma de los tokens de acceso; valor propio del destino |
| `JWT_REFRESH_SECRET` | Variable requerida por la configuración actual; los refresh tokens implementados son valores aleatorios almacenados en MySQL |
| `JWT_ACCESS_EXPIRATION` / `JWT_REFRESH_EXPIRATION` | Duración de los tokens, por defecto `15m` y `7d` |
| `STORAGE_PROVIDER` | `cloudinary` en el destino gratuito; `local` por defecto |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Credenciales del backend, obligatorias al activar Cloudinary |
| `UPLOAD_DIR` / `MAX_FILE_SIZE` | Directorio para el proveedor local y límite de carga de archivos para ambos proveedores |
| `CORS_ORIGIN` | Origen HTTP exacto del frontend desplegado |
| `VITE_API_URL` | Compilación del frontend; dirección pública de la API con el prefijo `/api` |
| `VITE_UPLOADS_URL` | Compilación del frontend; dirección pública de `/uploads` para fotografías locales. Cloudinary utiliza la URL devuelta por la API |

Los ejemplos de configuración contienen nombres de variables y valores de ejemplo. Las credenciales reales se conservan en la configuración privada del destino.

## Secuencia de implementación

1. Seleccionar el entorno de destino y las direcciones de acceso.
2. Preparar los archivos de despliegue y la configuración de producción.
3. Crear una base de datos de destino independiente y aplicar las migraciones existentes.
4. Preparar el administrador inicial: configurar `ADMIN_EMAIL`, `ADMIN_PASSWORD` y, opcionalmente, `ADMIN_FULL_NAME`; el seed exige credenciales propias en producción.
5. Iniciar la API y comprobar su conexión a MySQL.
6. Compilar y servir el frontend con las direcciones definitivas de la API y de las imágenes.
7. Verificar los flujos operativos y la conservación de datos e imágenes tras reiniciar los servicios.
8. Documentar los comandos reales de puesta en marcha, actualización y respaldo.

Los comandos de publicación y las rutas reales están registrados en los apartados anteriores; el procedimiento de respaldo y recuperación se desarrolla más adelante.

## Prueba manual del flujo publicado — 17/10/2026

El usuario indicó que seguiría `DEMO-PRESENTACION.md` y, al terminar, comunicó
que las pruebas funcionaron correctamente, incluida la subida de imágenes.
Se registra como prueba manual ejecutada por el usuario en el entorno desplegado.

El flujo principal del guion recorre recepción, mecánico y administración:
clientes y vehículos, creación y asignación de órdenes, diagnóstico, ítems,
transiciones de estado, permisos, fotografías, recordatorios, usuarios,
reportes y cierre de sesión. El resultado global comunicado fue correcto.
Las variantes marcadas como opcionales en el guion no tienen resultado individual
registrado. La confirmación no incrementa las 398 pruebas automatizadas existentes.

Ese mismo día se reactivó MySQL de Aiven tras aparecer apagado por inactividad.
Se comprobó desde la API pública el acceso del administrador existente, la consulta
protegida de usuarios y el cierre de sesión, todos con HTTP 200; el acceso sin
sesión mantuvo HTTP 401. Esto acredita la recuperación de conexión y el acceso
a la cuenta existente. La comprobación manual posterior de persistencia se
registra en el apartado siguiente.

## Prueba manual de persistencia — 19/10/2026

El usuario confirmó que reinició y comprobó que los datos y las imágenes se
conservan. Se registra como resultado correcto de una prueba manual ejecutada
por el usuario en el entorno desplegado. La recuperación desde un respaldo
es un procedimiento distinto y se documenta en el apartado siguiente.

## Procedimiento de respaldo y recuperación

**Documentado el 19/10/2026.** Responsable: administrador del proyecto. El
conjunto de respaldo incluye MySQL, los originales de las imágenes y su relación
con las órdenes. Un archivo SQL contiene referencias a Cloudinary, no las fotos.
Los pasos siguientes son instrucciones de operación; en este cierre no se ejecutó
una exportación ni se restauró información en la base publicada.

### Frecuencia y contenido

Hacer una copia antes de una actualización o presentación y al terminar cada día
en que se registren cambios. Conservar las siete copias más recientes y una copia
de la entrega académica. Guardarlas fuera del repositorio, con acceso exclusivo
del responsable, y mantener otra copia cifrada en un almacenamiento independiente.
El SQL incluye información personal, hashes de contraseñas y tokens de sesión.

Cada carpeta debe contener:

| Archivo | Contenido |
|---|---|
| `base.sql` | Estructura y datos de las ocho tablas y `_prisma_migrations` |
| `imagenes.tsv` | Identificador de imagen y orden, `filename`, URL y metadatos |
| `originales/` | Fotos originales descargadas de Cloudinary, conservando su relación con el manifiesto |
| `control.txt` | Fecha, commit del código, resultado de los comandos, cantidades de registros y correspondencia de archivos descargados |
| `SHA256SUMS` | Huellas de los archivos, para detectar copias dañadas |

Guardar también, en un gestor privado de contraseñas o copia cifrada separada,
las variables necesarias para reconstruir el entorno. Los ejemplos públicos y
el certificado CA permanecen en Git. Una copia alojada solo en el mismo proveedor
no sustituye esta copia independiente.

### Exportar MySQL e inventariar las imágenes

Usar el cliente oficial MySQL compatible con el servidor 8.4; comprobar
`mysqldump --version` y `mysql --version`. En este equipo están instalados los
clientes 8.0.46 y se verificó que reconocen las opciones del ejemplo; la ejecución
contra Aiven se deberá confirmar al crear la primera copia. Los comandos se
ejecutan desde la raíz del repositorio y piden la contraseña en la terminal.
Usar la contraseña de Aiven, disponible en la configuración privada del destino.
Antes de empezar, comprobar que MySQL esté en **Running** y que host, puerto y
certificado correspondan a los datos actuales de Aiven.

Durante la copia, detener la edición de órdenes, la subida y el borrado de fotos.
Mantener esa pausa hasta terminar SQL, inventario y descarga de originales para
que los tres correspondan al mismo estado. No ejecutar migraciones en ese intervalo.

```bash
umask 077
TALLER_RESPALDO="$HOME/respaldos-taller/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$TALLER_RESPALDO/originales"

mysqldump --no-defaults \
  --host=taller-mecanico-db-taller-mecanico-am.f.aivencloud.com \
  --port=21792 --user=avnadmin --password \
  --ssl-mode=VERIFY_IDENTITY --ssl-ca=backend/prisma/aiven-ca.pem \
  --single-transaction --quick --no-tablespaces \
  --set-gtid-purged=OFF --column-statistics=0 --hex-blob \
  --result-file="$TALLER_RESPALDO/base.sql" defaultdb
```

Comprobar que el comando termina con código 0 y que `base.sql` tiene contenido.
Si falla, conservar la copia anterior y marcar la nueva como incompleta. El
volcado selecciona únicamente `defaultdb`, sin `--databases` ni bases del sistema,
para poder importarlo en una base distinta. Incluye el historial de Prisma.
`--single-transaction` permite una lectura consistente de las tablas InnoDB;
`--set-gtid-purged=OFF` evita trasladar el estado global de replicación.
[Procedimiento oficial de Aiven](https://aiven.io/docs/products/mysql/howto/migrate-database-mysqldump).

Con la misma pausa de escritura, crear el inventario:

```bash
mysql --no-defaults \
  --host=taller-mecanico-db-taller-mecanico-am.f.aivencloud.com \
  --port=21792 --user=avnadmin --password \
  --ssl-mode=VERIFY_IDENTITY --ssl-ca=backend/prisma/aiven-ca.pem \
  --default-character-set=utf8mb4 --batch \
  --execute='SELECT id, workOrderId, filename, path, originalName, mimeType, size FROM work_order_images ORDER BY id' \
  defaultdb > "$TALLER_RESPALDO/imagenes.tsv"
```

Comprobar también su salida correcta. En los registros de Cloudinary, `filename`
es el `public_id`; se conserva con su prefijo, por ejemplo `taller-mecanico/work-orders/...`.
No usar `originalName` como identificador único: dos imágenes pueden tener el
mismo nombre original. La salida por lotes escapa tabulaciones y saltos de línea.
TLS valida la CA y la identidad del servidor mediante `VERIFY_IDENTITY`.
[Conexiones cifradas en MySQL](https://dev.mysql.com/doc/refman/8.4/en/using-encrypted-connections.html).

### Conservar las fotos y comprobar el conjunto

1. En Cloudinary, abrir **Media Library** y localizar los activos cuyos Public ID
   figuran en `imagenes.tsv`. El prefijo del Public ID puede diferir de la carpeta
   visual que muestra la biblioteca.
2. Descargar los **originales**, individualmente o seleccionados en ZIP, y
   colocarlos en `originales/`. Anotar en `control.txt` la relación de cada archivo
   descargado con su `id` y Public ID del manifiesto. Conservar todos los originales,
   aunque varios tengan el mismo nombre de archivo; no sustituirlos por miniaturas.
3. Comprobar que cada fila del inventario tiene su archivo, que se abre y que su
   tamaño corresponde a `size`. Si hay registros de almacenamiento local, copiar
   sus archivos desde el `UPLOAD_DIR` original y registrar esa procedencia.
4. Registrar cantidades de filas y un ejemplo de cliente, vehículo, orden e imagen,
   junto con la fecha, el commit (`git rev-parse HEAD`) y el resultado de los comandos.
5. Calcular y conservar las huellas antes de copiar el conjunto a su segunda ubicación.

[Descarga de originales y ZIP desde Media Library](https://cloudinary.com/documentation/media_library_for_developers).

Para registrar cantidades, ejecutar esta consulta en el origen durante la pausa
y guardar el resultado en `control.txt`. Se reutiliza en la base restaurada:

```sql
SELECT 'users' AS tabla, COUNT(*) AS filas FROM users
UNION ALL SELECT 'clients', COUNT(*) FROM clients
UNION ALL SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL SELECT 'work_orders', COUNT(*) FROM work_orders
UNION ALL SELECT 'work_order_items', COUNT(*) FROM work_order_items
UNION ALL SELECT 'work_order_images', COUNT(*) FROM work_order_images
UNION ALL SELECT 'maintenance_reminders', COUNT(*) FROM maintenance_reminders
UNION ALL SELECT '_prisma_migrations', COUNT(*) FROM _prisma_migrations;
```

Los tokens de sesión son temporales y se eliminan al recuperar; no forman parte
de esta comparación de cantidades. Para generar y verificar las huellas en Linux:

```bash
cd "$TALLER_RESPALDO"
find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS
sha256sum -c SHA256SUMS
```

Las huellas detectan alteraciones de los archivos, pero no demuestran por sí
solas que la recuperación funciona. Después de copiarlos a la segunda ubicación,
repetir la verificación allí. Reanudar el uso de la aplicación cuando la copia
del conjunto haya terminado correctamente.

### Recuperar primero en una base independiente

Elegir una copia completa, verificar `SHA256SUMS` y preparar un servidor MySQL
compatible con la versión del origen. Usar una base nueva y vacía, distinta de
`defaultdb`, para ensayar y validar. Configurar los valores de ejemplo siguientes
con las credenciales y el certificado de **ese destino de recuperación**:

El usuario de recuperación debe tener permisos para crear la base y cargar las
tablas y sus datos. Obtener esos permisos en el destino separado antes del ensayo.

```bash
TALLER_DESTINO_HOST="HOST_DEL_DESTINO_DE_RECUPERACION"
TALLER_DESTINO_PORT="3306"
TALLER_DESTINO_USER="USUARIO_DEL_DESTINO"
TALLER_DESTINO_CA="/ruta/al/certificado-ca-del-destino.pem"
TALLER_RESPALDO="/ruta/a/la/copia/completa"

mysql --no-defaults --host="$TALLER_DESTINO_HOST" \
  --port="$TALLER_DESTINO_PORT" --user="$TALLER_DESTINO_USER" --password \
  --ssl-mode=VERIFY_IDENTITY --ssl-ca="$TALLER_DESTINO_CA" \
  --execute='CREATE DATABASE taller_restore_ensayo CHARACTER SET utf8mb4'
```

Continuar solo si la creación termina correctamente. Si la base ya existe,
elegir otro nombre nuevo en ambos comandos; no reutilizar una base con datos.
El volcado puede contener `DROP TABLE` y la importación actúa sobre la base
indicada. La copia no se importa sobre `defaultdb` como parte de un ensayo.

```bash
mysql --no-defaults --host="$TALLER_DESTINO_HOST" \
  --port="$TALLER_DESTINO_PORT" --user="$TALLER_DESTINO_USER" --password \
  --ssl-mode=VERIFY_IDENTITY --ssl-ca="$TALLER_DESTINO_CA" \
  --default-character-set=utf8mb4 taller_restore_ensayo < "$TALLER_RESPALDO/base.sql"
```

Exigir código de salida 0. En la base restaurada, comparar las cantidades con
`control.txt`, comprobar los ejemplos registrados y vaciar las sesiones copiadas:

```sql
DELETE FROM refresh_tokens;
```

Configurar una API de recuperación con `DATABASE_URL` de esa base y secretos JWT
nuevos, manteniendo los usuarios y hashes restaurados. Conservar TLS estricto y
el certificado del nuevo servidor en la URL de Prisma. No ejecutar el seed ni
`prisma migrate dev` para recuperar datos. El historial `_prisma_migrations`
restaurado permite revisar `prisma migrate status` con el código del commit
respaldado antes de decidir si hay migraciones posteriores que aplicar.

### Recuperar las imágenes y validar el servicio

Si los originales de Cloudinary siguen disponibles, comprobar las URLs del
manifiesto sin volver a subirlos. Para una imagen ausente, subir el original
respaldado al producto/cuenta de Cloudinary elegido conservando exactamente el
Public ID guardado en `filename`. Comprobar el Public ID de la respuesta; una
nueva subida puede devolver una versión y una URL diferentes. Actualizar `path`
con la URL HTTPS original devuelta y `size` con los bytes reales, únicamente en
el registro restaurado que tenga ese `id` y `filename`. Si cambia el Public ID,
actualizar también `filename` para que la eliminación use el identificador correcto.

Estas operaciones se realizan primero en el entorno de recuperación. Una imagen
que sigue disponible en la cuenta actual se reutiliza; no se sobrescribe para
ensayar. Las fotos locales se reponen en el directorio local correspondiente.
La descarga del conjunto y su reimportación pueden prepararse mediante la
[biblioteca o API de Cloudinary](https://cloudinary.com/documentation/ts_how_can_i_download_my_accounts_assets).
El proyecto no presupone que el historial automático de versiones esté activado.

La aceptación de una recuperación exige comprobar login, permisos, clientes,
vehículos, órdenes e ítems, recordatorios, reportes y apertura de las fotos del
inventario. Verificar al menos una relación orden–imagen mediante su identificador
y su archivo, además de los recuentos. Registrar fecha, copia utilizada y resultado.

En un incidente real, detener las escrituras mientras se valida la copia,
conservar una copia del estado disponible antes de cambiar el destino y publicar
la configuración del backend que apunta al entorno recuperado. Usar sus
credenciales, certificado y secretos nuevos; después repetir la comprobación
desde el frontend y reabrir el servicio. Las operaciones posteriores a la fecha
del respaldo no están incluidas en él.

### Alcance del cierre

Se documentaron exportación, conservación de originales, inventario, integridad,
importación en una base separada y validación posterior. Se revisaron el esquema
real del proyecto, las opciones de los clientes instalados y las fuentes oficiales.
La ejecución de una copia completa y un ensayo de restauración quedan como
verificación operativa posterior; no se presentan como realizados en esta bitácora.

## Registro de verificación del despliegue

| Comprobación | Resultado |
|---|---|
| Conexión desde Prisma, consulta y cifrado TLS con Aiven | Correcto mediante `npm run db:check:prod` |
| Migraciones aplicadas en el destino | Correcto: `20260413200324_init` aplicada en Aiven |
| API conectada a MySQL y `/api/health` accesible | Correcto en Render por HTTPS: salud y consulta autenticada de usuarios, HTTP 200 |
| Inicio de sesión del administrador | Correcto en Render por HTTPS, HTTP 200; logout correcto y acceso sin sesión rechazado con 401 |
| Acceso y restricciones de los tres roles | Correcto según confirmación del usuario del flujo principal de DEMO-PRESENTACION.md, 17/10/2026 |
| Frontend y dirección de API en la compilación | Correcto: raíz y JavaScript HTTP 200, URL de API de Render presente |
| CORS desde el frontend publicado | Correcto: preflights 204 con origen público, Content-Type y Authorization permitidos; respuesta real y login con Origin correctos |
| Entrega de la SPA al acceder directamente a rutas internas | Correcto: /login, /clientes, /ordenes y /ordenes/1 devuelven 200 y el documento Vue; flujo del navegador confirmado por el usuario el 17/10/2026 |
| Creación y consulta de una orden de trabajo | Correcto según ejecución manual del guion comunicada por el usuario, 17/10/2026 |
| Carga y visualización de imágenes | Flujo manual del guion confirmado por el usuario, con subida de imágenes expresamente confirmada, 17/10/2026 |
| Subida, consulta HTTPS y eliminación directa en Cloudinary | Correcto mediante `npm run test:storage`; subida desde la aplicación confirmada por el usuario el 17/10/2026 |
| Consulta de recordatorios y reportes | Correcto según ejecución manual del flujo principal del guion comunicada por el usuario, 17/10/2026 |
| Swagger UI y especificación OpenAPI | Correcto en Render: UI y descargas JSON/YAML con HTTP 200 y servidor relativo /api |
| Datos e imágenes conservados tras reiniciar los servicios | Correcto según comprobación manual confirmada por el usuario el 19/10/2026 |
| Procedimiento de respaldo y recuperación documentado | Completado el 19/10/2026: SQL, originales, inventario, integridad, destino separado y validación; exportación y ensayo de restauración no ejecutados en este cierre |

El endpoint de salud actual informa que el proceso responde; no consulta MySQL en cada petición. La conexión y la lectura se comprobaron además con login y consulta autenticada; el usuario confirmó después el flujo manual de la aplicación con escritura y subida de imágenes.
