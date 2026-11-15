# 🌱 Agenda Digital Agrícola – Hacienda La Querencia

**Sistema web para la programación y seguimiento de actividades agrícolas y recomendaciones de insumos.**

<p align="center">
  <img src="https://img.shields.io/badge/React-2026-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-Estilos-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
</p>

---

## 📌 Descripción del proyecto

La **Agenda Digital Agrícola de la Hacienda La Querencia** es una aplicación web orientada a mejorar la organización y el control de las actividades agrícolas mediante herramientas digitales.

El sistema permitirá programar actividades relacionadas con el manejo del cultivo, registrar su ejecución y realizar un seguimiento de las tareas pendientes y completadas. También incorporará recomendaciones de insumos agrícolas como apoyo para la planificación de las labores en la hacienda.

Su desarrollo busca centralizar la información agrícola en una plataforma accesible, facilitando la consulta de actividades y el seguimiento de las operaciones realizadas.

## 🎯 Objetivo general

Desarrollar una agenda digital para la programación y seguimiento de actividades agrícolas y recomendaciones de insumos en la Hacienda La Querencia, mediante tecnologías de desarrollo web.

## ⚙️ Tecnologías utilizadas

| Tecnología | Descripción |
|---|---|
| **React** | Desarrollo de la interfaz de usuario mediante componentes reutilizables. |
| **Supabase** | Gestión de base de datos, autenticación y almacenamiento de información. |
| **Tailwind CSS** | Diseño y personalización de la interfaz mediante clases utilitarias. |
| **JavaScript** | Implementación de la lógica y funcionalidades del sistema. |
| **Git y GitHub** | Control de versiones y administración del código fuente. |

## 🧩 Módulos del sistema

- **📅 Agenda agrícola:** programación y visualización de actividades agrícolas por fecha.
- **🌾 Gestión de actividades:** registro, consulta, edición y seguimiento de las labores agrícolas.
- **🧪 Recomendaciones de insumos:** consulta y registro de recomendaciones de insumos relacionados con las actividades agrícolas.
- **📊 Seguimiento de actividades:** visualización del estado de las tareas programadas, pendientes y completadas.
- **👤 Gestión de usuarios:** administración del acceso de los usuarios a la aplicación.
- **📈 Panel principal:** resumen de actividades y datos relevantes para la organización agrícola.

## 🖥️ Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone URL_DE_TU_REPOSITORIO
```

### 2. Ingresar al directorio

```bash
cd nombre-del-proyecto
```

### 3. Instalar las dependencias

```bash
npm install
```

### 4. Configurar las variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
REACT_APP_SUPABASE_URL=TU_URL_DE_SUPABASE
REACT_APP_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA_DE_SUPABASE
```

**Importante:** No publicar claves secretas de Supabase en el repositorio.

### 5. Ejecutar la aplicación

```bash
npm start
```

La aplicación estará disponible en:

```text
http://localhost:3000
```

## 🗄️ Base de datos

El proyecto utiliza **Supabase** como servicio de backend, permitiendo gestionar la información de la aplicación mediante PostgreSQL.

Entre los datos que se contemplan para el sistema se encuentran:

- Información de usuarios.
- Actividades agrícolas programadas.
- Fechas y estados de las actividades.
- Recomendaciones de insumos.
- Registros de seguimiento.

## 📂 Estructura del proyecto

```text
agenda-agricola/
│
├── public/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── context/
│   ├── styles/
│   ├── supabase/
│   │   └── supabaseClient.js
│   ├── App.js
│   └── index.js
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

*La estructura puede variar según la organización definitiva del proyecto.*

## 🚀 Alcance del proyecto

La aplicación está orientada a digitalizar la planificación y el seguimiento de las actividades agrícolas de la Hacienda La Querencia, proporcionando un espacio centralizado para administrar las tareas y consultar recomendaciones de insumos.

## 👨‍💻 Desarrollo

Proyecto desarrollado como una solución tecnológica para apoyar la gestión y organización de las actividades agrícolas de la Hacienda La Querencia.

---

<p align="center">
  🌱 <strong>AGENDA DIGITAL AGRÍCOLA</strong><br/>
  <em>Organización, planificación y seguimiento para una mejor gestión agrícola.</em>
</p>