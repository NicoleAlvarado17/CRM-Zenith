# CRM Zenith

Sistema de Gestión de Relaciones con el Cliente desarrollado para **Zenith Soluciones Digitales**, como parte de los cursos SC-702 (Diseño y Desarrollo de Sistemas) y SC-803 (Implantación de Sistemas) de la Universidad Fidélitas.

**Autoras:** Nicole Alvarado Meoño · Sofía Fiorella Arana González · Valery Sofía Vargas Castillo

Este repositorio implementa técnicamente la arquitectura definida en el Documento de Arquitectura (Escenario 2: Node.js + Express + MongoDB Atlas + Vue.js), construida a partir de los requerimientos funcionales y no funcionales definidos en el documento AN01.

## Módulos implementados

| Módulo | Historias de Usuario | Estado |
|---|---|---|
| Gestión de Clientes | HU-01, HU-02, HU-03 | ✅ |
| Pipeline Comercial | HU-04, HU-05, HU-06 | ✅ |
| Bitácora Técnica | HU-07, HU-08, HU-09 | ✅ |
| Alertas de Mantenimiento | HU-10, HU-11, HU-12 | ✅ |
| Reportes | HU-13, HU-14, HU-15 | ✅ |

## Estructura del proyecto

```
crm-zenith/
├── backend/          # API REST (Node.js + Express + MongoDB)
│   ├── config/        # Conexión a la base de datos
│   ├── models/        # Esquemas de Mongoose (Cliente, Oportunidad, Bitácora, etc.)
│   ├── routes/        # Endpoints de la API organizados por módulo
│   ├── middleware/     # Autenticación (JWT), autorización por roles, manejo de errores
│   ├── utils/          # Generación de token, bitácora de auditoría, alertas automáticas, seed
│   └── server.js
├── frontend/          # Interfaz web (Vue 3 + Bootstrap 5, sin build step)
│   ├── css/
│   ├── js/             # Componentes Vue por módulo + conexión a la API
│   └── index.html
└── README.md
```

## Requisitos previos

- [Node.js](https://nodejs.org/) 18 LTS o superior
- Una base de datos MongoDB, ya sea:
  - Local (instalada en su computadora), o
  - En la nube mediante [MongoDB Atlas](https://www.mongodb.com/atlas) (plan gratuito, recomendado)
- Un navegador moderno (Chrome o Edge)

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone <URL-del-repositorio>
cd crm-zenith
```

### 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
```

Abra el archivo `.env` y complete al menos:

- `MONGO_URI`: su cadena de conexión a MongoDB (local o Atlas)
- `JWT_SECRET`: cualquier cadena larga y secreta de su elección

### 3. Cargar datos de ejemplo (usuarios y registros de prueba)

```bash
npm run seed
```

Esto crea automáticamente:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@zenith.com | Admin123! |
| Técnico | tecnico@zenith.com | Tecnico123! |
| Comercial | comercial@zenith.com | Comercial123! |

También crea un cliente, una oportunidad y un contrato de mantenimiento de ejemplo (con vencimiento en 10 días, para poder probar de inmediato el módulo de alertas).

### 4. Iniciar el servidor backend

```bash
npm start
```

El servidor quedará disponible en `http://localhost:4000`. Puede verificar que está activo visitando `http://localhost:4000/api/health`.

### 5. Abrir el frontend

El frontend no requiere instalación ni build: es HTML/CSS/JS puro que consume la API mediante `fetch`. Solo abra el archivo `frontend/index.html` en su navegador (recomendado usar la extensión **Live Server** de VS Code, o cualquier servidor estático local, para evitar restricciones del navegador con archivos locales).

Si su servidor backend corre en un puerto distinto a 4000, actualice la constante `API_BASE_URL` en `frontend/js/api.js`.

## Roles y permisos (RNF01 / Seguridad)

| Acción | Administrador | Técnico | Comercial |
|---|---|---|---|
| Ver / crear / editar clientes | ✅ | Solo lectura | ✅ |
| Eliminar clientes | ✅ | ❌ | ❌ |
| Pipeline comercial | ✅ | ❌ | ✅ |
| Bitácora técnica | ✅ | ✅ | ❌ |
| Alertas de mantenimiento | ✅ | ✅ | ❌ |
| Generar alertas manualmente | ✅ | ❌ | ❌ |
| Reportes | ✅ | ❌ | ❌ |

## Generación automática de alertas (RF04 / HU-10)

El servidor revisa automáticamente, cada 6 horas, los contratos de mantenimiento próximos a vencer (ventana de 15 días) y genera las alertas correspondientes. También puede dispararse manualmente desde el módulo de Alertas (botón "Generar alertas ahora", disponible solo para el rol Administrador).

## Seguridad implementada

- Contraseñas cifradas con `bcryptjs` (nunca se almacenan en texto plano).
- Autenticación mediante JSON Web Tokens (JWT) con expiración configurable.
- Autorización por roles en cada endpoint de la API (middleware `checkRole`).
- Validación de datos en el backend, independientemente de las validaciones del frontend.
- Bitácora interna de auditoría (`AuditLog`) que registra las acciones CRUD relevantes del sistema.

## Próximos pasos sugeridos

- Desplegar el backend en Render o Railway y la base de datos en MongoDB Atlas (ver sección 4.6.2 del Documento de Arquitectura).
- Agregar pruebas automatizadas (unitarias e integración).
- Incorporar recuperación de contraseña y confirmación por correo electrónico.

## Referencias

Ver el Documento de Arquitectura del proyecto para el detalle completo de las decisiones técnicas, restricciones y estándares seguidos en esta implementación.
