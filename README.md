# 🔧 Sistema de Gestión Inteligente para Talleres de Mecánica Automotriz

## 📌 Descripción

Este proyecto consiste en el desarrollo de un sistema web orientado a la gestión integral de talleres de mecánica automotriz, permitiendo administrar clientes, vehículos, órdenes de trabajo, historial técnico y recordatorios de mantenimiento.

El sistema busca digitalizar procesos que actualmente se realizan de manera manual, mejorando la organización, productividad y fidelización de clientes en talleres del sector.

---

## 🎯 Objetivo

Desarrollar una solución tecnológica que permita optimizar la gestión administrativa y técnica de talleres mecánicos mediante una plataforma web moderna, escalable y fácil de usar.

---

## 🧱 Stack Tecnológico

### Backend

* Node.js
* Express
* TypeScript
* Prisma ORM
* MySQL
* Zod (validación)
* Swagger / OpenAPI

### Herramientas

* Git & GitHub
* Postman
* Docker (opcional)
* VS Code

---

## 📁 Estructura del Proyecto

```bash
src/
│
├── config/         # Configuración general (env, db, etc)
├── routes/         # Definición de rutas
├── controllers/    # Controladores (manejo de request/response)
├── services/       # Lógica de negocio
├── validators/     # Validaciones con Zod
├── middlewares/    # Middlewares (auth, errores, etc)
├── docs/           # OpenAPI (swagger)
├── utils/          # Funciones auxiliares
└── app.ts          # Configuración principal de Express
```

---

## ⚙️ Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/taller-mecanico-backend.git
cd taller-mecanico-backend
```

---

### 2. Instalar dependencias

```bash
npm install
```

---

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz:

```env
PORT=3000

DATABASE_URL="mysql://usuario:password@localhost:3306/taller_mecanico"

JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=1d
```

---

### 4. Configurar base de datos

```bash
npx prisma migrate dev
npx prisma generate
```

---

### 5. Ejecutar el proyecto

```bash
npm run dev
```

Servidor disponible en:

```bash
http://localhost:3000
```

---

## 📚 Documentación de API

La documentación está disponible en:

```bash
http://localhost:3000/docs
```

Incluye:

* Swagger UI interactivo
* Endpoints documentados
* Ejemplos de request/response

---

## 📄 Archivos OpenAPI

El proyecto permite exportar la documentación en:

* `openapi.json`
* `openapi.yaml`

Ubicación:

```bash
/src/docs/
```

---

## 📬 Colección Postman

Se incluye una colección de Postman con:

* Autenticación
* CRUD de clientes
* CRUD de vehículos
* Órdenes de trabajo

Ubicación:

```bash
/docs/postman_collection.json
```

---

## 🔐 Autenticación

El sistema utiliza:

* JWT (JSON Web Tokens)
* Middleware de protección de rutas
* Roles (admin, usuario)

---

## 📦 Módulos del Sistema

* 🔐 Autenticación
* 👤 Usuarios
* 👥 Clientes
* 🚗 Vehículos
* 🧾 Órdenes de trabajo
* 🛠 Historial técnico
* ⏰ Recordatorios de mantenimiento

---

## 🧪 Scripts disponibles

```bash
npm run dev       # Ejecutar en desarrollo
npm run build     # Compilar TypeScript
npm start         # Ejecutar en producción
```

---

## 🚀 Estado del Proyecto

🟡 En desarrollo (Fase inicial - Backend)

---

## 🎓 Proyecto Académico

Este proyecto es desarrollado como parte de la etapa productiva del programa:

**Tecnología en Análisis y Desarrollo de Software – SENA**

---

## 📌 Autor

**Andrey**
Desarrollador Frontend / Full Stack en formación

---

## 📄 Licencia

Este proyecto es de uso académico y puede evolucionar a un producto comercial.
