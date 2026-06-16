# GainsCloud - API Backend (Node.js & Express)

Este repositorio contiene la API REST que gestiona el núcleo lógico, la autenticación y la persistencia de datos de GainsCloud. Está diseñada bajo una arquitectura modular y segura, preparada para atender las peticiones de clientes externos de forma escalable.

API en producción: `https://gainscloud-backend.onrender.com`

Este enlace corresponde al servidor de la API REST. Si accedes directamente desde el navegador a la raíz, el servidor responderá con un estado por defecto (`Cannot GET /`). Para interactuar con la interfaz visual de la aplicación, por favor visita el link del Frontend `https://gainscloud-frontend.vercel.app`.

## Arquitectura y tecnologías

* **Node.js**: Entorno de ejecución asíncrono para JavaScript en el lado del servidor.
* **Express.js**: Framework minimalista para la creación de rutas, controladores y gestión de middlewares.
* **MySQL / TiDB Cloud**: Motor de base de datos relacional y distribuida en la nube para garantizar una alta disponibilidad de los datos.
* **JWT (JSON Web Tokens)**: Mecanismo estándar para la generación de tokens de acceso firmados digitalmente.
* **Bcrypt**: Algoritmo de hashing criptográfico para la protección y encriptación de credenciales.
* **CORS (Cross-Origin Resource Sharing)**: Middleware configurado para permitir peticiones seguras desde dominios cruzados autorizados (Frontend en Vercel).

## Seguridad y buenas prácticas

* **Cifrado de Contraseñas**: Las contraseñas sufren un proceso de hash con `bcrypt` antes de impactar en la base de datos. Nunca se almacenan ni viajan credenciales en texto plano.
* **Controladores y Rutas**: La API está estructurada de forma modular, separando las rutas de los controladores (*Controllers*) para mantener un código limpio, mantenible y escalable.

## Estructura de carpetas

El proyecto sigue el patrón de diseño arquitectónico de controladores y rutas para garantizar la separación de responsabilidades y facilitar la escalabilidad del código:

```text
gainscloud-back/
├── src/
│   ├── config/
│   │   ├── db.js           
│   ├── controllers/
│   │   ├── aiController.js
│   │   ├── authController.js
│   │   ├── exerciseController.js
│   │   ├── routineController.js
│   │   ├── workoutController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── premiumMiddleware.js
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   ├── authRoutes.js
│   │   ├── exerciseRoutes.js
│   │   ├── routineRoutes.js
│   │   ├── workoutRoutes.js
│   ├── test/
│   │   ├── exercise.test.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

## Endpoints API

La API cuenta con algunas de las siguientes rutas estructuradas por módulos para dar servicio completo al frontend:

### Módulo de autenticación ('api/auth')

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **POST** | `/register` | Registra un nuevo usuario |
| **POST** | `/login` | Autentica al usuario y devuelve el token JWT |

### Módulo de ejercicios/rutinas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **GET** | `/` | Obtiene todos los ejercicios del usuario actual |
| **GET** | `/:id` | Obtiene el detalle de un ejercicio específico |
| **POST** | `/` | Crea un nuevo ejercicio o rutina |
| **PUT** | `/:id` | Actualiza los datos de un ejercicio existente |
| **DELETE** | `/:id` | Elimina un ejercicio de la base de datos |


## Instalación y desarrollo local

1. Clonar el repositorio:
- git clone [https://github.com/monicasesal/gainscloud-backend.git]

2. Instalar dependencias:
- npm install

3. Configurar las variables de entorno en un archivo .env:
PORT=3005
DB_HOST=tu_host_tidb
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=gainscloud
JWT_SECRET=tu_clave_secreta

4. Arrancar servidor:
- npm start

## Infraestructura y despliegue

El servidor está desplegado en Render sobre una infraestructura Linux en la nube, conectada directamente a TiDB Cloud. Incorpora despliegues automatizados automáticos vinculados a la rama de producción de GitHub.

## Autor

Mónica Serrano Salazar
Junior Full-Stack Developer
GitHub: https://github.com/monicasesal