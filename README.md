## git clone https://github.com/FCT-TaskManager/Backend.git
## cd task-management-backend

Instalar dependencias
## `npm install`

Crear archivo .env
## `cp .env.example .env`

Editar el archivo .env con los valores:
## `nano .env`

## PORT=3000
## DB_HOST=localhost
## DB_USER=taskapp
## DB_PASSWORD=password
## DB_NAME=task_manager
## JWT_SECRET=clavesecreta

Instalar MySQL (local)
## `sudo apt update`
## `sudo apt install mysql-server`

Iniciar MySQL
## `sudo systemctl start mysql`

Crear base de datos
## `mysql -u root -p`

En MySQL:
## CREATE DATABASE taskmaster_db;
## SHOW DATABASES;
## EXIT;

INICIAR EL BACKEND:

Modo desarrollo (con nodemon)
## `npm run dev`

O modo normal
## `npm start`

Verificar que funciona
## `curl http://localhost:3000`


