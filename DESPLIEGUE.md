# Despliegue e implementación

Sistema de Gestión Inteligente para Talleres de Mecánica Automotriz.

**Estado al 10/10/2026:** el backend está publicado en `https://taller-mecanico-api-9w77.onrender.com`. Se verificaron por HTTPS la salud, Swagger UI, el inicio de sesión ADMIN, la consulta protegida de usuarios y el cierre de sesión; el acceso sin token devuelve 401. MySQL de Aiven está conectado con TLS, la migración inicial está aplicada y el administrador tiene contraseña propia. Cloudinary está integrado y comprobado directamente. La publicación del frontend, el origen CORS definitivo y la verificación de los flujos completos siguen pendientes. Este documento acompaña la Bitácora 11.

## Propuesta de alojamiento gratuito

| Componente | Servicio propuesto | Plan y alcance |
|---|---|---|
| Frontend Vue | Render Static Site | Alojamiento gratuito del frontend compilado con dirección pública |
| Backend Express | Render Web Service | Instancia gratuita; se suspende tras 15 minutos sin tráfico y tarda aproximadamente un minuto en volver a responder |
| MySQL | Aiven for MySQL | Plan gratuito, sin tarjeta y sin plazo fijo de expiración; incluye 1 GB de almacenamiento y puede apagarse por inactividad |
| Fotografías de las órdenes | Cloudinary Image & Video API | Plan gratuito sin tarjeta; 25 créditos para almacenamiento, transferencia y transformaciones, compartidos entre esos usos |

Esta propuesta permite compartir la dirección del frontend para probar el sistema sin que el computador de desarrollo permanezca encendido. No requiere comprar un dominio. Su viabilidad debe verificarse en las cuentas concretas y en las pruebas de despliegue, respetando los límites de los planes gratuitos.

El backend permite elegir `STORAGE_PROVIDER=local` o `cloudinary`. Render gratuito no conserva los archivos locales al suspenderse, reiniciarse o desplegarse de nuevo, por lo que el destino utilizará Cloudinary. La integración de subida, visualización y eliminación ya está implementada y se verificó una subida real con consulta HTTPS y eliminación del archivo de prueba. La prueba desde una orden de trabajo en la aplicación desplegada sigue pendiente.

La presentación utilizará datos de demostración y cuentas de prueba por rol. Antes de compartir el enlace se verificará que la base de datos esté activa, se abrirá la aplicación y se comprobarán el inicio de sesión y la carga de imágenes. El arranque de la API después de un periodo sin uso puede introducir una espera inicial.

Fuentes oficiales consultadas el 10/10/2026:

- [Render: planes gratuitos, sitios estáticos y límites de la API](https://render.com/docs/free).
- [Render: facturación al superar límites y comportamiento sin método de pago](https://render.com/docs/faq).
- [Aiven: características y límites del plan gratuito de MySQL](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier).
- [Cloudinary: plan gratuito y consumo de créditos](https://cloudinary.com/documentation/billing_and_plans).

Los cambios de Cloudinary y Aiven se publicaron en `main` mediante el commit
`b40b6b4`; la configuración de Render y Swagger relativo se publicaron en
`93cf66a`. El siguiente paso es publicar el frontend y configurar su origen en la API.

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

`CORS_ORIGIN=http://localhost:5173` es provisional. Se sustituirá por la URL
pública exacta del frontend al crear su Static Site. Swagger utiliza `/api`
como dirección relativa y funciona en la dirección del servidor publicado.

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

Una vez asignada la URL del frontend, actualizar `CORS_ORIGIN` en el servicio
del backend con ese origen exacto, sin `/` final ni rutas, y guardar con
redespliegue. Sin esta actualización, el navegador no podrá usar la API desde
el nuevo sitio. Sincronizar también el valor en los archivos privados locales
`backend/.env.production` y `backend/.env.render`. Verificar después el login,
la navegación directa y los flujos operativos desde el navegador.

Referencias: [Vue y rutas en Render](https://render.com/docs/deploy-vue-js) y
[sitios estáticos e instalación de dependencias](https://render.com/docs/static-sites).

## Avance de la creación de servicios

- Render: backend publicado en `https://taller-mecanico-api-9w77.onrender.com`; salud, Swagger UI, login ADMIN, consulta protegida y logout comprobados por HTTPS. Frontend pendiente.
- Aiven: proyecto `taller-mecanico-am`, servicio `taller-mecanico-db`, MySQL 8.4.11, plan `Free-1-1gb`, base `defaultdb`. Conexión TLS verificada, migración `20260413200324_init` aplicada y ocho tablas del sistema presentes. Administrador inicial creado y login por HTTP comprobado desde la API temporal local.
- Cloudinary: cuenta creada y tres credenciales configuradas en `backend/.env`, archivo ignorado por Git. Integración implementada y `STORAGE_PROVIDER=cloudinary` activado localmente. Prueba real de subida, consulta HTTPS y eliminación correcta; prueba desde la aplicación desplegada pendiente.

Se solicitó renovar la contraseña de Aiven porque quedó visible en una captura. El usuario configuró la contraseña del destino localmente y la autenticación con Aiven se comprobó correctamente. Las credenciales reales no se registran en este documento. El certificado CA está guardado en `backend/prisma/aiven-ca.pem`: OpenSSL lo interpreta correctamente, identifica `CA:TRUE` y verifica su firma con resultado `OK`; su vigencia termina el 07/10/2036. La conexión TLS al servicio se verificó correctamente mediante `npm run db:check:prod`.

El proyecto utiliza Prisma 6: su conexión MySQL permite `sslcert` para indicar el certificado CA y `sslaccept=strict` para validar el certificado. Las rutas relativas del certificado se resuelven desde `backend/prisma/`. La URI de Aiven se adaptará a esos parámetros; no basta con trasladar su parámetro `ssl-mode=REQUIRED` a la configuración de Prisma. Referencia: [conexión MySQL y SSL en Prisma 6](https://docs.prisma.io/docs/orm/v6/overview/databases/mysql).

## Preparación de la conexión a Aiven

Se creó `backend/.env.production`, separado de `backend/.env` e ignorado por Git. Incluye el host, puerto, usuario y base de datos observados en Aiven, las credenciales locales de Cloudinary y nuevos secretos JWT propios del destino. `AIVEN_PASSWORD` está configurada por el usuario y `DATABASE_URL` fue generada y guardada después de verificar la conexión. `CORS_ORIGIN` conserva un valor provisional que se sustituirá por la dirección pública del frontend antes del despliegue.

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
preparación del backend y MySQL; el acceso desde la dirección pública de Render
se comprobará después del despliegue.

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

La versión de Node declarada en `frontend/.nvmrc` es 24.13.1. La revisión local se realizó con Node 22.14.0; la versión del destino debe definirse y comprobarse al preparar el despliegue.

## Configuración por definir

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

Los ejemplos de configuración que se incorporen deben contener nombres de variables y valores de ejemplo. Las credenciales reales se configurarán en el entorno de destino.

## Secuencia de implementación

1. Seleccionar el entorno de destino y las direcciones de acceso.
2. Preparar los archivos de despliegue y la configuración de producción.
3. Crear una base de datos de destino independiente y aplicar las migraciones existentes.
4. Preparar el administrador inicial: configurar `ADMIN_EMAIL`, `ADMIN_PASSWORD` y, opcionalmente, `ADMIN_FULL_NAME`; el seed exige credenciales propias en producción.
5. Iniciar la API y comprobar su conexión a MySQL.
6. Compilar y servir el frontend con las direcciones definitivas de la API y de las imágenes.
7. Verificar los flujos operativos y la conservación de datos e imágenes tras reiniciar los servicios.
8. Documentar los comandos reales de puesta en marcha, actualización y respaldo.

Los comandos específicos y las rutas de acceso se completarán cuando se seleccione el entorno.

## Registro de verificación del despliegue

| Comprobación | Resultado |
|---|---|
| Conexión desde Prisma, consulta y cifrado TLS con Aiven | Correcto mediante `npm run db:check:prod` |
| Migraciones aplicadas en el destino | Correcto: `20260413200324_init` aplicada en Aiven |
| API conectada a MySQL y `/api/health` accesible | Correcto en Render por HTTPS: salud y consulta autenticada de usuarios, HTTP 200 |
| Inicio de sesión del administrador | Correcto en Render por HTTPS, HTTP 200; logout correcto y acceso sin sesión rechazado con 401 |
| Acceso y restricciones de los tres roles | Pendiente |
| Recarga directa de rutas internas del frontend | Pendiente |
| Creación y consulta de una orden de trabajo | Pendiente |
| Carga y visualización de imágenes | Pendiente |
| Subida, consulta HTTPS y eliminación directa en Cloudinary | Correcto mediante `npm run test:storage`; prueba desde la aplicación pendiente |
| Consulta de recordatorios y reportes | Pendiente |
| Swagger UI y especificación OpenAPI | Correcto en Render: UI y descargas JSON/YAML con HTTP 200 y servidor relativo /api |
| Datos e imágenes conservados tras reiniciar los servicios | Pendiente |
| Procedimiento de respaldo y recuperación documentado | Pendiente |

El endpoint de salud actual informa que el proceso responde; no consulta MySQL en cada petición. La conexión a la base de datos y las operaciones de lectura y escritura se verificarán también mediante los flujos de la aplicación.
