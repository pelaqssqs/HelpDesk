# HelpDesk Pro

Sistema de gestión de tickets de soporte interno con tres roles de usuario: administrador, empleado y cliente. Permite crear, asignar y resolver tickets con chat en tiempo real por ticket, sistema de feedback, y panel de administración completo.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Python 3 · Flask · Flask-SQLAlchemy · Flask-JWT-Extended · Flask-Bcrypt · Flask-CORS |
| Base de datos | SQLite (archivo local, generado automáticamente) |
| Frontend | React 19 · React Router v7 · Axios · Tailwind CSS v3 · Vite |

---

## Estructura del proyecto

```
HelpDesk/
├── backend/
│   ├── app.py              # Factory de la app Flask y seeder inicial
│   ├── models.py           # Modelos SQLAlchemy (Usuario, Ticket, Mensaje)
│   ├── auth.py             # Extensión Bcrypt
│   ├── requirements.txt
│   └── routes/
│       ├── auth.py         # Login, cambio de password
│       ├── admin.py        # CRUD de usuarios, dashboard
│       ├── tickets.py      # Creación, listado, cierre de tickets
│       ├── mensajes.py     # Chat por ticket
│       └── empleado.py     # Tomar/liberar tickets
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── CambiarPassword.jsx
        │   ├── admin/        # Dashboard, GestionUsuarios
        │   ├── cliente/      # MisTickets, NuevoTicket, TicketDetalle, Feedback
        │   └── empleado/     # MisTickets, TicketDetalle, Perfil
        └── components/       # Layout, Chat, StarRating, TicketCard, Icon
```

---

## Instalación y uso local

### Requisitos previos

- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend

# Crear y activar entorno virtual
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor (puerto 5000)
python app.py
```

Al arrancar por primera vez Flask crea la base de datos SQLite en `backend/instance/helpdesk.db` y siembra el usuario administrador automáticamente.

### 2. Frontend

Abre otra terminal en la raíz del proyecto:

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 5173)
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador.

---

## Credenciales de prueba

| Rol | Email | Password |
|---|---|---|
| Administrador | `admin@helpdesk.com` | `admin123` |

El administrador puede crear cuentas de empleado y cliente desde el panel **Gestión de Usuarios**. Los empleados y clientes reciben una contraseña temporal y se les pide cambiarla en el primer inicio de sesión.

---

## Flujo de trabajo

1. **Admin** crea usuarios (empleados y clientes) desde el panel de administración.
2. **Cliente** abre un ticket describiendo su problema.
3. **Empleado** toma el ticket, intercambia mensajes con el cliente a través del chat interno del ticket.
4. **Empleado** cierra el ticket cuando el problema queda resuelto.
5. **Cliente** deja una valoración (1–5 estrellas) y comentario opcionales.

---

## Variables de entorno

El backend acepta la siguiente variable de entorno (opcional en desarrollo):

| Variable | Descripción | Default |
|---|---|---|
| `JWT_SECRET_KEY` | Clave secreta para firmar tokens JWT | `dev-secret-key-change-in-production-32chars` |

Para producción, define esta variable con un valor seguro y aleatorio.
