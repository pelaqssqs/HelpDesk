# HelpDesk Fullstack — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack HelpDesk system with role-based access (Admin, Empleado, Cliente), ticket management, real-time chat, and feedback collection.

**Architecture:** Flask REST API with SQLite + SQLAlchemy on the backend, JWT authentication with bcrypt password hashing. React + Tailwind SPA on the frontend with context-based auth state. Each module is independently testable before proceeding to the next.

**Tech Stack:** Python 3, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, flask-bcrypt, Flask-CORS, SQLite | React 18, Vite, Tailwind CSS 3, React Router v6, Axios

---

## ══════════════════════════════
## ARQUITECTURA COMPLETA
## ══════════════════════════════

---

## A. BASE DE DATOS — Modelos

### Tabla: `usuarios`
| Campo                  | Tipo         | Restricciones                         |
|------------------------|--------------|---------------------------------------|
| id                     | Integer      | PK, autoincrement                     |
| nombre                 | String(100)  | NOT NULL                              |
| email                  | String(150)  | NOT NULL, UNIQUE                      |
| password_hash          | String(255)  | NOT NULL                              |
| rol                    | String(20)   | NOT NULL — valores: admin/empleado/cliente |
| debe_cambiar_password  | Boolean      | NOT NULL, default=True                |
| fecha_creacion         | DateTime     | NOT NULL, default=utcnow              |

### Tabla: `tickets`
| Campo              | Tipo         | Restricciones                                          |
|--------------------|--------------|--------------------------------------------------------|
| id                 | Integer      | PK, autoincrement                                      |
| titulo             | String(200)  | NOT NULL                                               |
| descripcion        | Text         | NOT NULL                                               |
| prioridad          | String(10)   | NOT NULL — valores: baja/media/alta                    |
| estado             | String(20)   | NOT NULL, default='abierto' — valores: abierto/en_progreso/cerrado |
| fecha_creacion     | DateTime     | NOT NULL, default=utcnow                               |
| fecha_actualizacion| DateTime     | NOT NULL, default=utcnow, onupdate=utcnow              |
| id_cliente         | Integer      | FK → usuarios.id, NOT NULL                             |
| id_empleado        | Integer      | FK → usuarios.id, NULLABLE                             |
| ticket_origen_id   | Integer      | FK → tickets.id, NULLABLE (tickets reabiertos)         |
| es_reabierto       | Boolean      | NOT NULL, default=False                                |

### Tabla: `mensajes`
| Campo      | Tipo     | Restricciones                         |
|------------|----------|---------------------------------------|
| id         | Integer  | PK, autoincrement                     |
| contenido  | Text     | NOT NULL                              |
| fecha      | DateTime | NOT NULL, default=utcnow              |
| id_ticket  | Integer  | FK → tickets.id, NOT NULL             |
| id_usuario | Integer  | FK → usuarios.id, NOT NULL            |
| leido      | Boolean  | NOT NULL, default=False               |

### Tabla: `feedback`
| Campo      | Tipo         | Restricciones                              |
|------------|--------------|--------------------------------------------|
| id         | Integer      | PK, autoincrement                          |
| estrellas  | Integer      | NOT NULL — valores: 1 a 5                  |
| comentario | Text         | NULLABLE                                   |
| fecha      | DateTime     | NOT NULL, default=utcnow                   |
| id_ticket  | Integer      | FK → tickets.id, NOT NULL, UNIQUE          |
| id_cliente | Integer      | FK → usuarios.id, NOT NULL                 |

---

## B. BACKEND — Endpoints

### Auth (`/api/auth`)

| Método | Endpoint                        | Rol requerido   | Descripción                                                     |
|--------|---------------------------------|-----------------|-----------------------------------------------------------------|
| POST   | `/api/auth/login`               | Público         | Login con email/password. Devuelve JWT + info de usuario + flag `debe_cambiar_password` |
| POST   | `/api/auth/cambiar-password`    | Cualquier auth  | Cambia contraseña (requerido en primer login). Pone `debe_cambiar_password=False` |

### Admin (`/api/admin`)

| Método | Endpoint                            | Rol requerido | Descripción                                                                  |
|--------|-------------------------------------|---------------|------------------------------------------------------------------------------|
| POST   | `/api/admin/usuarios`               | Admin         | Crea usuario (empleado o cliente). Genera contraseña temporal aleatoria. Devuelve contraseña en texto plano una única vez. |
| GET    | `/api/admin/usuarios`               | Admin         | Lista todos los usuarios (sin passwords)                                     |
| DELETE | `/api/admin/usuarios/<id>`          | Admin         | Elimina un usuario                                                           |
| GET    | `/api/admin/dashboard`              | Admin         | Stats: count por estado, rating promedio por empleado, totales               |
| GET    | `/api/admin/tickets`                | Admin         | Lista todos los tickets con filtros opcionales (?estado=&cliente=&empleado=) |
| GET    | `/api/admin/tickets/<id>`           | Admin         | Detalle completo: ticket + todos los mensajes + feedback                     |
| PUT    | `/api/admin/tickets/<id>/cerrar`    | Admin         | Cierra manualmente un ticket inactivo                                        |

### Tickets (`/api/tickets`)

| Método | Endpoint                             | Rol requerido          | Descripción                                                             |
|--------|--------------------------------------|------------------------|-------------------------------------------------------------------------|
| POST   | `/api/tickets`                       | Cliente                | Crea ticket con título, descripción, prioridad                          |
| GET    | `/api/tickets`                       | Cliente / Empleado     | Lista tickets. Cliente: solo los suyos. Empleado: todos los abiertos + los propios en_progreso |
| GET    | `/api/tickets/<id>`                  | Cliente (propio) / Empleado (asignado) | Detalle del ticket                              |
| PUT    | `/api/tickets/<id>/tomar`            | Empleado               | Toma un ticket abierto → en_progreso, asigna `id_empleado`             |
| PUT    | `/api/tickets/<id>/liberar`          | Empleado asignado      | Libera ticket → abierto, `id_empleado=null`                            |
| PUT    | `/api/tickets/<id>/cerrar`           | Empleado asignado      | Cierra ticket → cerrado                                                 |
| PUT    | `/api/tickets/<id>/prioridad`        | Empleado asignado      | Actualiza prioridad (solo si el ticket está en_progreso)               |
| POST   | `/api/tickets/<id>/reabrir`          | Cliente (propio)       | Crea nuevo ticket con `ticket_origen_id` y `es_reabierto=True`         |

### Mensajes (`/api/tickets/<id>/mensajes`)

| Método | Endpoint                                      | Rol requerido                         | Descripción                                              |
|--------|-----------------------------------------------|---------------------------------------|----------------------------------------------------------|
| GET    | `/api/tickets/<id>/mensajes`                  | Cliente (propio) / Empleado (asignado) | Lista mensajes del ticket. Filtra por no_leidos opcionalmente. |
| POST   | `/api/tickets/<id>/mensajes`                  | Cliente (propio) / Empleado (asignado) | Envía mensaje al chat del ticket                        |
| PUT    | `/api/tickets/<id>/mensajes/leidos`           | Cliente (propio) / Empleado (asignado) | Marca como leídos todos los mensajes del interlocutor   |

### Feedback (`/api/tickets/<id>/feedback`)

| Método | Endpoint                         | Rol requerido     | Descripción                                                       |
|--------|----------------------------------|-------------------|-------------------------------------------------------------------|
| POST   | `/api/tickets/<id>/feedback`     | Cliente (propio)  | Envía feedback (1-5 estrellas + comentario opcional)              |
| GET    | `/api/tickets/<id>/feedback`     | Admin / Empleado asignado | Consulta el feedback de un ticket                        |

---

## C. FRONTEND — Componentes y Páginas

### Context
| Archivo                    | Responsabilidad                                                                         |
|----------------------------|-----------------------------------------------------------------------------------------|
| `context/AuthContext.jsx`  | JWT en localStorage, datos del usuario (id, nombre, rol, debe_cambiar_password), funciones login/logout. Redirige automáticamente a CambiarPassword si `debe_cambiar_password=True`. |

### Pages — Auth
| Archivo                     | Responsabilidad                                                                |
|-----------------------------|--------------------------------------------------------------------------------|
| `pages/Login.jsx`           | Formulario email/password. POST /api/auth/login. Redirige según rol y flag de cambio de contraseña. |
| `pages/CambiarPassword.jsx` | Formulario nueva contraseña + confirmación. Solo accesible si `debe_cambiar_password=True`. |

### Pages — Admin
| Archivo                       | Responsabilidad                                                                          |
|-------------------------------|------------------------------------------------------------------------------------------|
| `pages/admin/Dashboard.jsx`   | Cards con conteo por estado. Tabla de rating promedio por empleado. Lista de todos los tickets con filtros. Click en ticket → modal/drawer con historial completo. |
| `pages/admin/GestionUsuarios.jsx` | Formulario para crear usuarios. Lista de usuarios existentes.                        |

### Pages — Empleado
| Archivo                            | Responsabilidad                                                                           |
|------------------------------------|-------------------------------------------------------------------------------------------|
| `pages/empleado/MisTickets.jsx`    | Dos secciones: tickets abiertos (con botón "Tomar") y mis tickets en progreso. Badge de mensajes sin leer. |
| `pages/empleado/TicketDetalle.jsx` | Info del ticket (prioridad editable, botones Cerrar/Liberar). Componente Chat. |

### Pages — Cliente
| Archivo                          | Responsabilidad                                                                               |
|----------------------------------|-----------------------------------------------------------------------------------------------|
| `pages/cliente/MisTickets.jsx`   | Lista tickets propios con estado. Badge si hay respuesta sin leer. Botón "Reabrir" en cerrados. |
| `pages/cliente/NuevoTicket.jsx`  | Formulario: título, descripción, prioridad. POST /api/tickets.                               |
| `pages/cliente/TicketDetalle.jsx`| Info del ticket + Chat. Solo si está en_progreso.                                            |
| `pages/cliente/Feedback.jsx`     | Pantalla de rating (1-5 estrellas) + comentario opcional. Se muestra al cerrar un ticket.    |

### Components
| Archivo                    | Responsabilidad                                                                                  |
|----------------------------|--------------------------------------------------------------------------------------------------|
| `components/Navbar.jsx`    | Links según rol. Muestra nombre del usuario. Botón logout.                                       |
| `components/TicketCard.jsx`| Card reutilizable: título, estado (badge de color), prioridad, fecha, badge de mensajes no leídos. |
| `components/Chat.jsx`      | Lista de mensajes con scroll automático al último. Input + botón enviar. Diferencia mensajes propios vs del interlocutor. Llama a PUT /leidos al montar. |
| `components/ProtectedRoute.jsx` | HOC que verifica JWT y rol antes de renderizar la ruta.                                    |
| `components/StarRating.jsx`| Componente de 5 estrellas interactivo para el Feedback.                                         |

### Routing
```
/                    → redirige según rol
/login               → Login.jsx
/cambiar-password    → CambiarPassword.jsx (solo si debe_cambiar_password)
/admin/dashboard     → admin/Dashboard.jsx
/admin/usuarios      → admin/GestionUsuarios.jsx
/empleado/tickets    → empleado/MisTickets.jsx
/empleado/tickets/:id → empleado/TicketDetalle.jsx
/cliente/tickets     → cliente/MisTickets.jsx
/cliente/tickets/:id → cliente/TicketDetalle.jsx
/cliente/nuevo-ticket → cliente/NuevoTicket.jsx
/cliente/feedback/:id → cliente/Feedback.jsx
```

---

## ══════════════════════════════
## PLAN DE IMPLEMENTACIÓN — TAREAS
## ══════════════════════════════

---

### Task 1: Backend — Fundación (app.py + models.py)

**Files:**
- Create: `backend/app.py`
- Create: `backend/models.py`
- Create: `backend/requirements.txt`

- [ ] **Step 1.1: Crear requirements.txt**

```
Flask==3.0.3
Flask-SQLAlchemy==3.1.1
Flask-JWT-Extended==4.6.0
flask-bcrypt==1.0.1
Flask-CORS==4.0.1
```

- [ ] **Step 1.2: Instalar dependencias**

```bash
cd backend
source venv/Scripts/activate   # Windows
pip install -r requirements.txt
```
Expected: todas las dependencias instaladas sin errores.

- [ ] **Step 1.3: Crear models.py**

```python
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), nullable=False)  # admin, empleado, cliente
    debe_cambiar_password = db.Column(db.Boolean, default=True, nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    tickets_como_cliente = db.relationship('Ticket', foreign_keys='Ticket.id_cliente', backref='cliente', lazy=True)
    tickets_como_empleado = db.relationship('Ticket', foreign_keys='Ticket.id_empleado', backref='empleado', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'rol': self.rol,
            'debe_cambiar_password': self.debe_cambiar_password,
            'fecha_creacion': self.fecha_creacion.isoformat()
        }

class Ticket(db.Model):
    __tablename__ = 'tickets'
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    prioridad = db.Column(db.String(10), nullable=False)  # baja, media, alta
    estado = db.Column(db.String(20), default='abierto', nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    id_cliente = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    id_empleado = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True)
    ticket_origen_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=True)
    es_reabierto = db.Column(db.Boolean, default=False, nullable=False)

    mensajes = db.relationship('Mensaje', backref='ticket', lazy=True, cascade='all, delete-orphan')
    feedback = db.relationship('Feedback', backref='ticket', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'prioridad': self.prioridad,
            'estado': self.estado,
            'fecha_creacion': self.fecha_creacion.isoformat(),
            'fecha_actualizacion': self.fecha_actualizacion.isoformat(),
            'id_cliente': self.id_cliente,
            'id_empleado': self.id_empleado,
            'ticket_origen_id': self.ticket_origen_id,
            'es_reabierto': self.es_reabierto,
            'cliente_nombre': self.cliente.nombre if self.cliente else None,
            'empleado_nombre': self.empleado.nombre if self.empleado else None,
        }

class Mensaje(db.Model):
    __tablename__ = 'mensajes'
    id = db.Column(db.Integer, primary_key=True)
    contenido = db.Column(db.Text, nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    id_ticket = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    leido = db.Column(db.Boolean, default=False, nullable=False)

    autor = db.relationship('Usuario', backref='mensajes', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'contenido': self.contenido,
            'fecha': self.fecha.isoformat(),
            'id_ticket': self.id_ticket,
            'id_usuario': self.id_usuario,
            'autor_nombre': self.autor.nombre if self.autor else None,
            'leido': self.leido
        }

class Feedback(db.Model):
    __tablename__ = 'feedback'
    id = db.Column(db.Integer, primary_key=True)
    estrellas = db.Column(db.Integer, nullable=False)
    comentario = db.Column(db.Text, nullable=True)
    fecha = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    id_ticket = db.Column(db.Integer, db.ForeignKey('tickets.id'), unique=True, nullable=False)
    id_cliente = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'estrellas': self.estrellas,
            'comentario': self.comentario,
            'fecha': self.fecha.isoformat(),
            'id_ticket': self.id_ticket,
            'id_cliente': self.id_cliente
        }
```

- [ ] **Step 1.4: Crear app.py**

```python
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from models import db, Usuario
import os

bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///helpdesk.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-change-in-prod')

    db.init_app(app)
    bcrypt.init_app(app)
    JWTManager(app)
    CORS(app, origins=['http://localhost:5173'])

    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.tickets import tickets_bp
    from routes.mensajes import mensajes_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(tickets_bp, url_prefix='/api/tickets')
    app.register_blueprint(mensajes_bp, url_prefix='/api/tickets')

    with app.app_context():
        db.create_all()
        _seed_admin()

    return app

def _seed_admin():
    """Crea el admin inicial si no existe."""
    if not Usuario.query.filter_by(rol='admin').first():
        from flask import current_app
        pw = bcrypt.generate_password_hash('admin123').decode('utf-8')
        admin = Usuario(
            nombre='Administrador',
            email='admin@helpdesk.com',
            password_hash=pw,
            rol='admin',
            debe_cambiar_password=False
        )
        db.session.add(admin)
        db.session.commit()

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
```

- [ ] **Step 1.5: Crear estructura de routes/**

```bash
mkdir backend/routes
touch backend/routes/__init__.py
touch backend/routes/auth.py
touch backend/routes/admin.py
touch backend/routes/tickets.py
touch backend/routes/mensajes.py
```

- [ ] **Step 1.6: Verificar que la app arranca**

```bash
cd backend && python app.py
```
Expected: `Running on http://127.0.0.1:5000`, archivo `helpdesk.db` creado.

- [ ] **Step 1.7: Commit**

```bash
git init
git add backend/app.py backend/models.py backend/requirements.txt backend/routes/
git commit -m "feat: backend foundation — Flask app, SQLAlchemy models, DB init"
```

---

### Task 2: Backend — Auth routes

**Files:**
- Modify: `backend/routes/auth.py`
- Create: `backend/auth.py` (decoradores de rol)

- [ ] **Step 2.1: Crear auth.py (decoradores de rol)**

```python
from functools import wraps
from flask_jwt_extended import get_jwt_identity
from flask import jsonify
from models import Usuario

def rol_requerido(*roles):
    """Decorador que verifica que el usuario autenticado tenga uno de los roles indicados."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            user = Usuario.query.get(user_id)
            if not user or user.rol not in roles:
                return jsonify({'error': 'Acceso denegado'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
```

- [ ] **Step 2.2: Implementar routes/auth.py**

```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from models import db, Usuario

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = Usuario.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Credenciales incorrectas'}), 401

    token = create_access_token(identity=user.id)
    return jsonify({
        'token': token,
        'usuario': user.to_dict()
    }), 200

@auth_bp.route('/cambiar-password', methods=['POST'])
@jwt_required()
def cambiar_password():
    user_id = get_jwt_identity()
    user = Usuario.query.get(user_id)
    data = request.get_json()

    nueva = data.get('nueva_password', '')
    if len(nueva) < 6:
        return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400

    user.password_hash = bcrypt.generate_password_hash(nueva).decode('utf-8')
    user.debe_cambiar_password = False
    db.session.commit()

    return jsonify({'mensaje': 'Contraseña actualizada correctamente'}), 200
```

- [ ] **Step 2.3: Verificar login con curl**

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@helpdesk.com","password":"admin123"}' | python -m json.tool
```
Expected: JSON con `token` y objeto `usuario` con rol `admin`.

- [ ] **Step 2.4: Commit**

```bash
git add backend/routes/auth.py backend/auth.py
git commit -m "feat: JWT login + force password change endpoint"
```

---

### Task 3: Backend — Admin routes

**Files:**
- Modify: `backend/routes/admin.py`

- [ ] **Step 3.1: Implementar routes/admin.py**

```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from sqlalchemy import func
from models import db, Usuario, Ticket, Feedback
from auth import rol_requerido
import secrets
import string

admin_bp = Blueprint('admin', __name__)
bcrypt = Bcrypt()

def _generar_password(longitud=12):
    caracteres = string.ascii_letters + string.digits
    return ''.join(secrets.choice(caracteres) for _ in range(longitud))

@admin_bp.route('/usuarios', methods=['POST'])
@jwt_required()
@rol_requerido('admin')
def crear_usuario():
    data = request.get_json()
    nombre = data.get('nombre', '').strip()
    email = data.get('email', '').strip().lower()
    rol = data.get('rol', '')

    if not nombre or not email or rol not in ('empleado', 'cliente'):
        return jsonify({'error': 'Datos inválidos'}), 400

    if Usuario.query.filter_by(email=email).first():
        return jsonify({'error': 'El email ya está registrado'}), 409

    password_temporal = _generar_password()
    password_hash = bcrypt.generate_password_hash(password_temporal).decode('utf-8')

    usuario = Usuario(
        nombre=nombre,
        email=email,
        password_hash=password_hash,
        rol=rol,
        debe_cambiar_password=True
    )
    db.session.add(usuario)
    db.session.commit()

    return jsonify({
        'usuario': usuario.to_dict(),
        'password_temporal': password_temporal  # Solo se devuelve una vez
    }), 201

@admin_bp.route('/usuarios', methods=['GET'])
@jwt_required()
@rol_requerido('admin')
def listar_usuarios():
    usuarios = Usuario.query.all()
    return jsonify([u.to_dict() for u in usuarios]), 200

@admin_bp.route('/usuarios/<int:usuario_id>', methods=['DELETE'])
@jwt_required()
@rol_requerido('admin')
def eliminar_usuario(usuario_id):
    usuario = Usuario.query.get_or_404(usuario_id)
    if usuario.rol == 'admin':
        return jsonify({'error': 'No se puede eliminar al administrador'}), 403
    db.session.delete(usuario)
    db.session.commit()
    return jsonify({'mensaje': 'Usuario eliminado'}), 200

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@rol_requerido('admin')
def dashboard():
    # Conteo por estado
    estados = db.session.query(Ticket.estado, func.count(Ticket.id)).group_by(Ticket.estado).all()
    conteo_estados = {estado: count for estado, count in estados}

    # Rating promedio por empleado
    ratings = db.session.query(
        Usuario.id,
        Usuario.nombre,
        func.avg(Feedback.estrellas).label('promedio'),
        func.count(Feedback.id).label('total_feedback')
    ).join(Ticket, Ticket.id_empleado == Usuario.id)\
     .join(Feedback, Feedback.id_ticket == Ticket.id)\
     .filter(Usuario.rol == 'empleado')\
     .group_by(Usuario.id)\
     .all()

    return jsonify({
        'tickets_por_estado': {
            'abierto': conteo_estados.get('abierto', 0),
            'en_progreso': conteo_estados.get('en_progreso', 0),
            'cerrado': conteo_estados.get('cerrado', 0),
        },
        'rating_por_empleado': [
            {'id': r.id, 'nombre': r.nombre, 'promedio': round(float(r.promedio), 2), 'total': r.total_feedback}
            for r in ratings
        ]
    }), 200

@admin_bp.route('/tickets', methods=['GET'])
@jwt_required()
@rol_requerido('admin')
def listar_tickets():
    query = Ticket.query
    estado = request.args.get('estado')
    if estado:
        query = query.filter_by(estado=estado)
    tickets = query.order_by(Ticket.fecha_actualizacion.desc()).all()
    return jsonify([t.to_dict() for t in tickets]), 200

@admin_bp.route('/tickets/<int:ticket_id>', methods=['GET'])
@jwt_required()
@rol_requerido('admin')
def detalle_ticket_admin(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    data = ticket.to_dict()
    data['mensajes'] = [m.to_dict() for m in ticket.mensajes]
    data['feedback'] = ticket.feedback.to_dict() if ticket.feedback else None
    return jsonify(data), 200

@admin_bp.route('/tickets/<int:ticket_id>/cerrar', methods=['PUT'])
@jwt_required()
@rol_requerido('admin')
def cerrar_ticket_admin(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    ticket.estado = 'cerrado'
    db.session.commit()
    return jsonify({'mensaje': 'Ticket cerrado', 'ticket': ticket.to_dict()}), 200
```

- [ ] **Step 3.2: Verificar creación de usuario**

```bash
# Primero obtener token de admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@helpdesk.com","password":"admin123"}' | python -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s -X POST http://localhost:5000/api/admin/usuarios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana García","email":"ana@test.com","rol":"empleado"}' | python -m json.tool
```
Expected: JSON con `usuario` y `password_temporal`.

- [ ] **Step 3.3: Commit**

```bash
git add backend/routes/admin.py
git commit -m "feat: admin routes — user CRUD, dashboard stats, ticket management"
```

---

### Task 4: Backend — Tickets routes

**Files:**
- Modify: `backend/routes/tickets.py`

- [ ] **Step 4.1: Implementar routes/tickets.py**

```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, Ticket, Usuario
from auth import rol_requerido

tickets_bp = Blueprint('tickets', __name__)

@tickets_bp.route('', methods=['POST'])
@jwt_required()
@rol_requerido('cliente')
def crear_ticket():
    user_id = get_jwt_identity()
    data = request.get_json()
    titulo = data.get('titulo', '').strip()
    descripcion = data.get('descripcion', '').strip()
    prioridad = data.get('prioridad', '')

    if not titulo or not descripcion or prioridad not in ('baja', 'media', 'alta'):
        return jsonify({'error': 'Datos inválidos'}), 400

    ticket = Ticket(
        titulo=titulo,
        descripcion=descripcion,
        prioridad=prioridad,
        id_cliente=user_id
    )
    db.session.add(ticket)
    db.session.commit()
    return jsonify(ticket.to_dict()), 201

@tickets_bp.route('', methods=['GET'])
@jwt_required()
def listar_tickets():
    user_id = get_jwt_identity()
    user = Usuario.query.get(user_id)

    if user.rol == 'cliente':
        tickets = Ticket.query.filter_by(id_cliente=user_id).order_by(Ticket.fecha_actualizacion.desc()).all()
    elif user.rol == 'empleado':
        # Tickets abiertos + los propios en progreso
        tickets = Ticket.query.filter(
            (Ticket.estado == 'abierto') |
            ((Ticket.estado == 'en_progreso') & (Ticket.id_empleado == user_id))
        ).order_by(Ticket.fecha_actualizacion.desc()).all()
    else:
        return jsonify({'error': 'Acceso denegado'}), 403

    return jsonify([t.to_dict() for t in tickets]), 200

@tickets_bp.route('/<int:ticket_id>', methods=['GET'])
@jwt_required()
def detalle_ticket(ticket_id):
    user_id = get_jwt_identity()
    user = Usuario.query.get(user_id)
    ticket = Ticket.query.get_or_404(ticket_id)

    if user.rol == 'cliente' and ticket.id_cliente != user_id:
        return jsonify({'error': 'Acceso denegado'}), 403
    if user.rol == 'empleado' and ticket.id_empleado != user_id:
        return jsonify({'error': 'Acceso denegado'}), 403

    return jsonify(ticket.to_dict()), 200

@tickets_bp.route('/<int:ticket_id>/tomar', methods=['PUT'])
@jwt_required()
@rol_requerido('empleado')
def tomar_ticket(ticket_id):
    user_id = get_jwt_identity()
    ticket = Ticket.query.get_or_404(ticket_id)

    if ticket.estado != 'abierto':
        return jsonify({'error': 'El ticket no está disponible'}), 400

    ticket.estado = 'en_progreso'
    ticket.id_empleado = user_id
    ticket.fecha_actualizacion = datetime.utcnow()
    db.session.commit()
    return jsonify(ticket.to_dict()), 200

@tickets_bp.route('/<int:ticket_id>/liberar', methods=['PUT'])
@jwt_required()
@rol_requerido('empleado')
def liberar_ticket(ticket_id):
    user_id = get_jwt_identity()
    ticket = Ticket.query.get_or_404(ticket_id)

    if ticket.id_empleado != user_id:
        return jsonify({'error': 'No sos el empleado asignado'}), 403
    if ticket.estado != 'en_progreso':
        return jsonify({'error': 'El ticket no está en progreso'}), 400

    ticket.estado = 'abierto'
    ticket.id_empleado = None
    ticket.fecha_actualizacion = datetime.utcnow()
    db.session.commit()
    return jsonify(ticket.to_dict()), 200

@tickets_bp.route('/<int:ticket_id>/cerrar', methods=['PUT'])
@jwt_required()
@rol_requerido('empleado')
def cerrar_ticket(ticket_id):
    user_id = get_jwt_identity()
    ticket = Ticket.query.get_or_404(ticket_id)

    if ticket.id_empleado != user_id:
        return jsonify({'error': 'No sos el empleado asignado'}), 403

    ticket.estado = 'cerrado'
    ticket.fecha_actualizacion = datetime.utcnow()
    db.session.commit()
    return jsonify(ticket.to_dict()), 200

@tickets_bp.route('/<int:ticket_id>/prioridad', methods=['PUT'])
@jwt_required()
@rol_requerido('empleado')
def actualizar_prioridad(ticket_id):
    user_id = get_jwt_identity()
    ticket = Ticket.query.get_or_404(ticket_id)

    if ticket.id_empleado != user_id:
        return jsonify({'error': 'No sos el empleado asignado'}), 403

    data = request.get_json()
    nueva_prioridad = data.get('prioridad', '')
    if nueva_prioridad not in ('baja', 'media', 'alta'):
        return jsonify({'error': 'Prioridad inválida'}), 400

    ticket.prioridad = nueva_prioridad
    ticket.fecha_actualizacion = datetime.utcnow()
    db.session.commit()
    return jsonify(ticket.to_dict()), 200

@tickets_bp.route('/<int:ticket_id>/reabrir', methods=['POST'])
@jwt_required()
@rol_requerido('cliente')
def reabrir_ticket(ticket_id):
    user_id = get_jwt_identity()
    ticket_original = Ticket.query.get_or_404(ticket_id)

    if ticket_original.id_cliente != user_id:
        return jsonify({'error': 'Acceso denegado'}), 403
    if ticket_original.estado != 'cerrado':
        return jsonify({'error': 'Solo se pueden reabrir tickets cerrados'}), 400

    nuevo = Ticket(
        titulo=f"[REABIERTO] {ticket_original.titulo}",
        descripcion=ticket_original.descripcion,
        prioridad=ticket_original.prioridad,
        id_cliente=user_id,
        ticket_origen_id=ticket_id,
        es_reabierto=True
    )
    db.session.add(nuevo)
    db.session.commit()
    return jsonify(nuevo.to_dict()), 201
```

- [ ] **Step 4.2: Verificar flujo completo de ticket**

```bash
# 1. Crear cliente y empleado como admin, obtener tokens
# 2. POST /api/tickets como cliente → ticket creado
# 3. PUT /api/tickets/<id>/tomar como empleado → en_progreso
# 4. PUT /api/tickets/<id>/cerrar como empleado → cerrado
```
Expected: cada step devuelve el ticket con el estado correcto.

- [ ] **Step 4.3: Commit**

```bash
git add backend/routes/tickets.py
git commit -m "feat: tickets routes — CRUD, tomar/liberar/cerrar, prioridad, reabrir"
```

---

### Task 5: Backend — Mensajes y Feedback routes

**Files:**
- Modify: `backend/routes/mensajes.py`

- [ ] **Step 5.1: Implementar routes/mensajes.py**

```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Mensaje, Ticket, Feedback, Usuario

mensajes_bp = Blueprint('mensajes', __name__)

def _verificar_acceso_ticket(ticket, user_id, user_rol):
    """Verifica que el usuario tenga acceso al chat del ticket."""
    if user_rol == 'cliente' and ticket.id_cliente != user_id:
        return False
    if user_rol == 'empleado' and ticket.id_empleado != user_id:
        return False
    return True

@mensajes_bp.route('/<int:ticket_id>/mensajes', methods=['GET'])
@jwt_required()
def listar_mensajes(ticket_id):
    user_id = get_jwt_identity()
    user = Usuario.query.get(user_id)
    ticket = Ticket.query.get_or_404(ticket_id)

    if user.rol not in ('admin',) and not _verificar_acceso_ticket(ticket, user_id, user.rol):
        return jsonify({'error': 'Acceso denegado'}), 403

    mensajes = Mensaje.query.filter_by(id_ticket=ticket_id).order_by(Mensaje.fecha.asc()).all()
    return jsonify([m.to_dict() for m in mensajes]), 200

@mensajes_bp.route('/<int:ticket_id>/mensajes', methods=['POST'])
@jwt_required()
def enviar_mensaje(ticket_id):
    user_id = get_jwt_identity()
    user = Usuario.query.get(user_id)
    ticket = Ticket.query.get_or_404(ticket_id)

    if not _verificar_acceso_ticket(ticket, user_id, user.rol):
        return jsonify({'error': 'Acceso denegado'}), 403
    if ticket.estado != 'en_progreso':
        return jsonify({'error': 'Solo se puede chatear en tickets en progreso'}), 400

    data = request.get_json()
    contenido = data.get('contenido', '').strip()
    if not contenido:
        return jsonify({'error': 'El mensaje no puede estar vacío'}), 400

    mensaje = Mensaje(contenido=contenido, id_ticket=ticket_id, id_usuario=user_id)
    db.session.add(mensaje)
    db.session.commit()
    return jsonify(mensaje.to_dict()), 201

@mensajes_bp.route('/<int:ticket_id>/mensajes/leidos', methods=['PUT'])
@jwt_required()
def marcar_leidos(ticket_id):
    user_id = get_jwt_identity()
    user = Usuario.query.get(user_id)
    ticket = Ticket.query.get_or_404(ticket_id)

    if not _verificar_acceso_ticket(ticket, user_id, user.rol):
        return jsonify({'error': 'Acceso denegado'}), 403

    # Marcar como leídos los mensajes del interlocutor (no los propios)
    Mensaje.query.filter_by(id_ticket=ticket_id, leido=False).filter(
        Mensaje.id_usuario != user_id
    ).update({'leido': True})
    db.session.commit()
    return jsonify({'mensaje': 'Mensajes marcados como leídos'}), 200

@mensajes_bp.route('/<int:ticket_id>/feedback', methods=['POST'])
@jwt_required()
def enviar_feedback(ticket_id):
    user_id = get_jwt_identity()
    user = Usuario.query.get(user_id)
    ticket = Ticket.query.get_or_404(ticket_id)

    if user.rol != 'cliente' or ticket.id_cliente != user_id:
        return jsonify({'error': 'Acceso denegado'}), 403
    if ticket.estado != 'cerrado':
        return jsonify({'error': 'Solo se puede dar feedback a tickets cerrados'}), 400
    if ticket.feedback:
        return jsonify({'error': 'Ya enviaste feedback para este ticket'}), 409

    data = request.get_json()
    estrellas = data.get('estrellas')
    comentario = data.get('comentario', '').strip() or None

    if not isinstance(estrellas, int) or not (1 <= estrellas <= 5):
        return jsonify({'error': 'Las estrellas deben ser un número entre 1 y 5'}), 400

    fb = Feedback(
        estrellas=estrellas,
        comentario=comentario,
        id_ticket=ticket_id,
        id_cliente=user_id
    )
    db.session.add(fb)
    db.session.commit()
    return jsonify(fb.to_dict()), 201

@mensajes_bp.route('/<int:ticket_id>/feedback', methods=['GET'])
@jwt_required()
def ver_feedback(ticket_id):
    user_id = get_jwt_identity()
    user = Usuario.query.get(user_id)
    ticket = Ticket.query.get_or_404(ticket_id)

    if user.rol not in ('admin',) and not (user.rol == 'empleado' and ticket.id_empleado == user_id):
        return jsonify({'error': 'Acceso denegado'}), 403

    if not ticket.feedback:
        return jsonify({'feedback': None}), 200
    return jsonify(ticket.feedback.to_dict()), 200
```

- [ ] **Step 5.2: Verificar mensajes y feedback**

```bash
# POST /api/tickets/<id>/mensajes como cliente
# POST /api/tickets/<id>/mensajes como empleado asignado
# GET /api/tickets/<id>/mensajes → lista ambos mensajes
# PUT /api/tickets/<id>/mensajes/leidos → marca leídos los del interlocutor
# POST /api/tickets/<id>/feedback como cliente (después de cerrar) → feedback guardado
```

- [ ] **Step 5.3: Commit**

```bash
git add backend/routes/mensajes.py
git commit -m "feat: mensajes y feedback routes — chat, leidos, rating"
```

---

### Task 6: Frontend — Setup (Vite + Tailwind + Router)

**Files:**
- Create: `frontend/` (scaffolded via Vite)
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/main.jsx`
- Create: `frontend/src/api/axios.js`

- [ ] **Step 6.1: Crear proyecto Vite**

```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install axios react-router-dom
```

- [ ] **Step 6.2: Configurar Tailwind**

`frontend/tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

`frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6.3: Crear cliente Axios con interceptor JWT**

`frontend/src/api/axios.js`:
```js
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:5000/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
```

- [ ] **Step 6.4: Commit**

```bash
git add frontend/
git commit -m "feat: frontend scaffold — Vite React, Tailwind CSS, Axios client"
```

---

### Task 7: Frontend — AuthContext + ProtectedRoute

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`
- Create: `frontend/src/components/ProtectedRoute.jsx`
- Modify: `frontend/src/main.jsx`

- [ ] **Step 7.1: Crear AuthContext.jsx**

```jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const datosUsuario = localStorage.getItem('usuario')
    if (token && datosUsuario) {
      setUsuario(JSON.parse(datosUsuario))
    }
    setCargando(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('usuario', JSON.stringify(data.usuario))
    setUsuario(data.usuario)

    if (data.usuario.debe_cambiar_password) {
      navigate('/cambiar-password')
      return
    }
    redirigirSegunRol(data.usuario.rol)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    navigate('/login')
  }

  const actualizarUsuario = (datos) => {
    const actualizado = { ...usuario, ...datos }
    localStorage.setItem('usuario', JSON.stringify(actualizado))
    setUsuario(actualizado)
  }

  const redirigirSegunRol = (rol) => {
    if (rol === 'admin') navigate('/admin/dashboard')
    else if (rol === 'empleado') navigate('/empleado/tickets')
    else navigate('/cliente/tickets')
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

- [ ] **Step 7.2: Crear ProtectedRoute.jsx**

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { usuario, cargando } = useAuth()

  if (cargando) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!usuario) return <Navigate to="/login" replace />
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/login" replace />

  return children
}
```

- [ ] **Step 7.3: Configurar main.jsx con Router y rutas**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import CambiarPassword from './pages/CambiarPassword'
import AdminDashboard from './pages/admin/Dashboard'
import GestionUsuarios from './pages/admin/GestionUsuarios'
import EmpleadoTickets from './pages/empleado/MisTickets'
import EmpleadoTicketDetalle from './pages/empleado/TicketDetalle'
import ClienteTickets from './pages/cliente/MisTickets'
import ClienteNuevoTicket from './pages/cliente/NuevoTicket'
import ClienteTicketDetalle from './pages/cliente/TicketDetalle'
import ClienteFeedback from './pages/cliente/Feedback'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cambiar-password" element={<CambiarPassword />} />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/usuarios" element={
            <ProtectedRoute roles={['admin']}><GestionUsuarios /></ProtectedRoute>
          } />

          <Route path="/empleado/tickets" element={
            <ProtectedRoute roles={['empleado']}><EmpleadoTickets /></ProtectedRoute>
          } />
          <Route path="/empleado/tickets/:id" element={
            <ProtectedRoute roles={['empleado']}><EmpleadoTicketDetalle /></ProtectedRoute>
          } />

          <Route path="/cliente/tickets" element={
            <ProtectedRoute roles={['cliente']}><ClienteTickets /></ProtectedRoute>
          } />
          <Route path="/cliente/nuevo-ticket" element={
            <ProtectedRoute roles={['cliente']}><ClienteNuevoTicket /></ProtectedRoute>
          } />
          <Route path="/cliente/tickets/:id" element={
            <ProtectedRoute roles={['cliente']}><ClienteTicketDetalle /></ProtectedRoute>
          } />
          <Route path="/cliente/feedback/:id" element={
            <ProtectedRoute roles={['cliente']}><ClienteFeedback /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
```

- [ ] **Step 7.4: Commit**

```bash
git add frontend/src/context/ frontend/src/components/ProtectedRoute.jsx frontend/src/main.jsx
git commit -m "feat: AuthContext with JWT, ProtectedRoute with role check, app routing"
```

---

### Task 8: Frontend — Navbar + Login + CambiarPassword

**Files:**
- Create: `frontend/src/components/Navbar.jsx`
- Create: `frontend/src/pages/Login.jsx`
- Create: `frontend/src/pages/CambiarPassword.jsx`

- [ ] **Step 8.1: Crear Navbar.jsx**

```jsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { usuario, logout } = useAuth()

  const links = {
    admin: [
      { to: '/admin/dashboard', label: 'Dashboard' },
      { to: '/admin/usuarios', label: 'Usuarios' },
    ],
    empleado: [{ to: '/empleado/tickets', label: 'Tickets' }],
    cliente: [
      { to: '/cliente/tickets', label: 'Mis Tickets' },
      { to: '/cliente/nuevo-ticket', label: 'Nuevo Ticket' },
    ],
  }

  return (
    <nav className="bg-indigo-700 text-white px-6 py-3 flex items-center justify-between shadow">
      <span className="font-bold text-lg tracking-wide">HelpDesk</span>
      <div className="flex items-center gap-6 text-sm">
        {(links[usuario?.rol] || []).map((l) => (
          <Link key={l.to} to={l.to} className="hover:underline">{l.label}</Link>
        ))}
        <span className="opacity-75">{usuario?.nombre}</span>
        <button onClick={logout} className="bg-white text-indigo-700 px-3 py-1 rounded font-semibold hover:bg-indigo-50">
          Salir
        </button>
      </div>
    </nav>
  )
}
```

- [ ] **Step 8.2: Crear Login.jsx**

```jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-center">HelpDesk</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit" disabled={cargando}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 8.3: Crear CambiarPassword.jsx**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function CambiarPassword() {
  const { usuario, actualizarUsuario } = useAuth()
  const navigate = useNavigate()
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (nueva !== confirmar) { setError('Las contraseñas no coinciden'); return }
    if (nueva.length < 6) { setError('Mínimo 6 caracteres'); return }

    try {
      await api.post('/auth/cambiar-password', { nueva_password: nueva })
      actualizarUsuario({ debe_cambiar_password: false })
      setOk(true)
      setTimeout(() => {
        if (usuario.rol === 'admin') navigate('/admin/dashboard')
        else if (usuario.rol === 'empleado') navigate('/empleado/tickets')
        else navigate('/cliente/tickets')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-indigo-700 mb-2">Cambiá tu contraseña</h1>
        <p className="text-sm text-gray-500 mb-6">Es tu primer ingreso. Debés establecer una nueva contraseña.</p>
        {ok ? (
          <p className="text-green-600 font-semibold text-center">¡Contraseña actualizada! Redirigiendo...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
              <input type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700">
              Confirmar
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 8.4: Commit**

```bash
git add frontend/src/components/Navbar.jsx frontend/src/pages/Login.jsx frontend/src/pages/CambiarPassword.jsx
git commit -m "feat: Navbar, Login page, CambiarPassword page"
```

---

### Task 9: Frontend — Componentes compartidos (TicketCard + Chat + StarRating)

**Files:**
- Create: `frontend/src/components/TicketCard.jsx`
- Create: `frontend/src/components/Chat.jsx`
- Create: `frontend/src/components/StarRating.jsx`

- [ ] **Step 9.1: Crear TicketCard.jsx**

```jsx
const ESTADO_COLORS = {
  abierto: 'bg-green-100 text-green-700',
  en_progreso: 'bg-yellow-100 text-yellow-700',
  cerrado: 'bg-gray-100 text-gray-600',
}

const PRIORIDAD_COLORS = {
  alta: 'text-red-600 font-bold',
  media: 'text-yellow-600 font-semibold',
  baja: 'text-green-600',
}

export default function TicketCard({ ticket, mensajesSinLeer = 0, onClick, accion }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{ticket.titulo}</p>
          <p className="text-xs text-gray-500 mt-0.5">#{ticket.id} · {ticket.cliente_nombre || ticket.empleado_nombre}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${ESTADO_COLORS[ticket.estado]}`}>
          {ticket.estado.replace('_', ' ')}
        </span>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs ${PRIORIDAD_COLORS[ticket.prioridad]}`}>
          ▲ {ticket.prioridad}
        </span>
        <div className="flex items-center gap-2">
          {mensajesSinLeer > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
              {mensajesSinLeer} nuevo{mensajesSinLeer > 1 ? 's' : ''}
            </span>
          )}
          {accion}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 9.2: Crear Chat.jsx**

```jsx
import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Chat({ ticketId, activo }) {
  const { usuario } = useAuth()
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef(null)

  const cargarMensajes = async () => {
    const { data } = await api.get(`/tickets/${ticketId}/mensajes`)
    setMensajes(data)
    await api.put(`/tickets/${ticketId}/mensajes/leidos`)
  }

  useEffect(() => {
    cargarMensajes()
    const interval = setInterval(cargarMensajes, 5000)
    return () => clearInterval(interval)
  }, [ticketId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviar = async (e) => {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    try {
      await api.post(`/tickets/${ticketId}/mensajes`, { contenido: texto.trim() })
      setTexto('')
      await cargarMensajes()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col h-96 border rounded-xl overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensajes.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">Sin mensajes aún.</p>
        )}
        {mensajes.map((m) => {
          const propio = m.id_usuario === usuario.id
          return (
            <div key={m.id} className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm shadow-sm ${
                propio ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border'
              }`}>
                {!propio && <p className="text-xs font-semibold mb-1 text-indigo-600">{m.autor_nombre}</p>}
                <p>{m.contenido}</p>
                <p className={`text-xs mt-1 ${propio ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      {activo && (
        <form onSubmit={enviar} className="flex gap-2 p-3 border-t bg-white">
          <input
            value={texto} onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribí un mensaje..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" disabled={enviando}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
            Enviar
          </button>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 9.3: Crear StarRating.jsx**

```jsx
import { useState } from 'react'

export default function StarRating({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star} type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-3xl transition-colors ${
            (hover || value) >= star ? 'text-yellow-400' : 'text-gray-300'
          } ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 9.4: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: shared components — TicketCard, Chat with polling, StarRating"
```

---

### Task 10: Frontend — Admin pages

**Files:**
- Create: `frontend/src/pages/admin/Dashboard.jsx`
- Create: `frontend/src/pages/admin/GestionUsuarios.jsx`

- [ ] **Step 10.1: Crear admin/GestionUsuarios.jsx**

```jsx
import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', rol: 'empleado' })
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  const cargar = async () => {
    const { data } = await api.get('/admin/usuarios')
    setUsuarios(data)
  }

  useEffect(() => { cargar() }, [])

  const crear = async (e) => {
    e.preventDefault()
    setError('')
    setResultado(null)
    try {
      const { data } = await api.post('/admin/usuarios', form)
      setResultado(data)
      setForm({ nombre: '', email: '', rol: 'empleado' })
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear usuario')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return
    await api.delete(`/admin/usuarios/${id}`)
    cargar()
  }

  const ROL_BADGE = { admin: 'bg-purple-100 text-purple-700', empleado: 'bg-blue-100 text-blue-700', cliente: 'bg-green-100 text-green-700' }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Crear nuevo usuario</h2>
          <form onSubmit={crear} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input placeholder="Nombre completo" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            <input type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="empleado">Empleado</option>
              <option value="cliente">Cliente</option>
            </select>
            <button type="submit"
              className="sm:col-span-3 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700">
              Crear Usuario
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {resultado && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-semibold">Usuario creado exitosamente.</p>
              <p className="text-sm text-gray-700 mt-1">Contraseña temporal (copiala ahora):</p>
              <code className="text-lg font-mono bg-white border rounded px-3 py-1 inline-block mt-1 select-all">
                {resultado.password_temporal}
              </code>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Rol</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROL_BADGE[u.rol]}`}>{u.rol}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.debe_cambiar_password
                      ? <span className="text-xs text-orange-500">Pendiente primer login</span>
                      : <span className="text-xs text-green-500">Activo</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.rol !== 'admin' && (
                      <button onClick={() => eliminar(u.id)} className="text-red-400 hover:text-red-600 text-xs">Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 10.2: Crear admin/Dashboard.jsx**

```jsx
import { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [tickets, setTickets] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [ticketDetalle, setTicketDetalle] = useState(null)

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data))
    cargarTickets()
  }, [])

  const cargarTickets = async (estado = '') => {
    const params = estado ? `?estado=${estado}` : ''
    const { data } = await api.get(`/admin/tickets${params}`)
    setTickets(data)
  }

  const verDetalle = async (id) => {
    const { data } = await api.get(`/admin/tickets/${id}`)
    setTicketDetalle(data)
  }

  const cerrarTicket = async (id) => {
    await api.put(`/admin/tickets/${id}/cerrar`)
    setTicketDetalle(null)
    cargarTickets(filtroEstado)
  }

  const ESTADO_CARD = [
    { key: 'abierto', label: 'Abiertos', color: 'bg-green-50 border-green-200 text-green-700' },
    { key: 'en_progreso', label: 'En Progreso', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    { key: 'cerrado', label: 'Cerrados', color: 'bg-gray-50 border-gray-200 text-gray-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

        {stats && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {ESTADO_CARD.map(({ key, label, color }) => (
                <div key={key} className={`rounded-2xl border-2 p-5 ${color}`}>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-4xl font-bold mt-1">{stats.tickets_por_estado[key]}</p>
                </div>
              ))}
            </div>

            {stats.rating_por_empleado.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-5">
                <h2 className="font-semibold text-gray-700 mb-3">Rating por Empleado</h2>
                <div className="space-y-2">
                  {stats.rating_por_empleado.map((r) => (
                    <div key={r.id} className="flex items-center justify-between">
                      <span className="text-gray-800">{r.nombre}</span>
                      <span className="text-yellow-500 font-bold">★ {r.promedio} <span className="text-gray-400 text-xs font-normal">({r.total} reseñas)</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">Todos los Tickets</h2>
            <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); cargarTickets(e.target.value) }}
              className="border rounded-lg px-2 py-1 text-sm">
              <option value="">Todos</option>
              <option value="abierto">Abiertos</option>
              <option value="en_progreso">En Progreso</option>
              <option value="cerrado">Cerrados</option>
            </select>
          </div>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} onClick={() => verDetalle(t.id)}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium text-sm">{t.titulo}</p>
                  <p className="text-xs text-gray-500">Cliente: {t.cliente_nombre} · Empleado: {t.empleado_nombre || '—'}</p>
                </div>
                <span className="text-xs text-gray-400">{t.estado}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {ticketDetalle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between mb-4">
              <h2 className="font-bold text-lg">{ticketDetalle.titulo}</h2>
              <button onClick={() => setTicketDetalle(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-3">{ticketDetalle.descripcion}</p>
            <p className="text-xs text-gray-400 mb-4">Estado: {ticketDetalle.estado} · Prioridad: {ticketDetalle.prioridad}</p>
            <h3 className="font-semibold text-sm mb-2">Mensajes ({ticketDetalle.mensajes.length})</h3>
            <div className="space-y-2 mb-4">
              {ticketDetalle.mensajes.map((m) => (
                <div key={m.id} className="bg-gray-50 rounded p-2 text-sm">
                  <span className="font-medium text-indigo-600">{m.autor_nombre}:</span> {m.contenido}
                </div>
              ))}
            </div>
            {ticketDetalle.feedback && (
              <div className="bg-yellow-50 rounded p-3 text-sm mb-4">
                <p className="font-semibold">Feedback: {'★'.repeat(ticketDetalle.feedback.estrellas)}</p>
                {ticketDetalle.feedback.comentario && <p className="text-gray-600 mt-1">{ticketDetalle.feedback.comentario}</p>}
              </div>
            )}
            {ticketDetalle.estado !== 'cerrado' && (
              <button onClick={() => cerrarTicket(ticketDetalle.id)}
                className="w-full bg-red-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-600">
                Cerrar Ticket Manualmente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 10.3: Commit**

```bash
git add frontend/src/pages/admin/
git commit -m "feat: admin Dashboard and GestionUsuarios pages"
```

---

### Task 11: Frontend — Páginas de Empleado

**Files:**
- Create: `frontend/src/pages/empleado/MisTickets.jsx`
- Create: `frontend/src/pages/empleado/TicketDetalle.jsx`

- [ ] **Step 11.1: Crear empleado/MisTickets.jsx**

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import TicketCard from '../../components/TicketCard'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function EmpleadoTickets() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [sinLeer, setSinLeer] = useState({})

  const cargar = async () => {
    const { data } = await api.get('/tickets')
    setTickets(data)
    // Contar mensajes sin leer por ticket (solo para los en_progreso propios)
    const counts = {}
    for (const t of data.filter(t => t.estado === 'en_progreso' && t.id_empleado === usuario.id)) {
      const { data: msgs } = await api.get(`/tickets/${t.id}/mensajes`)
      counts[t.id] = msgs.filter(m => !m.leido && m.id_usuario !== usuario.id).length
    }
    setSinLeer(counts)
  }

  useEffect(() => { cargar() }, [])

  const tomar = async (e, id) => {
    e.stopPropagation()
    await api.put(`/tickets/${id}/tomar`)
    cargar()
  }

  const abiertos = tickets.filter(t => t.estado === 'abierto')
  const enProgreso = tickets.filter(t => t.estado === 'en_progreso')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Panel de Tickets</h1>

        <section>
          <h2 className="font-semibold text-gray-600 mb-3">Tickets Disponibles ({abiertos.length})</h2>
          <div className="space-y-3">
            {abiertos.length === 0 && <p className="text-sm text-gray-400">Sin tickets abiertos.</p>}
            {abiertos.map(t => (
              <TicketCard key={t.id} ticket={t}
                accion={<button onClick={(e) => tomar(e, t.id)}
                  className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700">
                  Tomar
                </button>}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-gray-600 mb-3">Mis Tickets en Progreso ({enProgreso.length})</h2>
          <div className="space-y-3">
            {enProgreso.length === 0 && <p className="text-sm text-gray-400">Sin tickets asignados.</p>}
            {enProgreso.map(t => (
              <TicketCard key={t.id} ticket={t}
                mensajesSinLeer={sinLeer[t.id] || 0}
                onClick={() => navigate(`/empleado/tickets/${t.id}`)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 11.2: Crear empleado/TicketDetalle.jsx**

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Chat from '../../components/Chat'
import api from '../../api/axios'

export default function EmpleadoTicketDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [editandoPrioridad, setEditandoPrioridad] = useState(false)
  const [nuevaPrioridad, setNuevaPrioridad] = useState('')

  const cargar = async () => {
    const { data } = await api.get(`/tickets/${id}`)
    setTicket(data)
    setNuevaPrioridad(data.prioridad)
  }

  useEffect(() => { cargar() }, [id])

  const liberar = async () => {
    if (!confirm('¿Liberar el ticket? Volverá a estar disponible para otros empleados.')) return
    await api.put(`/tickets/${id}/liberar`)
    navigate('/empleado/tickets')
  }

  const cerrar = async () => {
    if (!confirm('¿Cerrar el ticket?')) return
    await api.put(`/tickets/${id}/cerrar`)
    navigate('/empleado/tickets')
  }

  const guardarPrioridad = async () => {
    await api.put(`/tickets/${id}/prioridad`, { prioridad: nuevaPrioridad })
    setEditandoPrioridad(false)
    cargar()
  }

  if (!ticket) return <div className="p-8 text-gray-400">Cargando...</div>

  const PRIORIDAD_COLOR = { alta: 'text-red-500', media: 'text-yellow-500', baja: 'text-green-500' }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <button onClick={() => navigate('/empleado/tickets')} className="text-indigo-600 text-sm hover:underline">← Volver</button>

        <div className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold text-gray-800">{ticket.titulo}</h1>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">en progreso</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">{ticket.descripcion}</p>
          <p className="text-xs text-gray-400 mt-1">Cliente: {ticket.cliente_nombre}</p>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm text-gray-500">Prioridad:</span>
            {editandoPrioridad ? (
              <>
                <select value={nuevaPrioridad} onChange={(e) => setNuevaPrioridad(e.target.value)}
                  className="border rounded px-2 py-1 text-sm">
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
                <button onClick={guardarPrioridad} className="text-sm text-indigo-600 hover:underline">Guardar</button>
                <button onClick={() => setEditandoPrioridad(false)} className="text-sm text-gray-400 hover:underline">Cancelar</button>
              </>
            ) : (
              <>
                <span className={`text-sm font-semibold ${PRIORIDAD_COLOR[ticket.prioridad]}`}>{ticket.prioridad}</span>
                <button onClick={() => setEditandoPrioridad(true)} className="text-xs text-gray-400 hover:underline">Editar</button>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={cerrar} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700">
              Cerrar Ticket
            </button>
            <button onClick={liberar} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300">
              Liberar Ticket
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Chat con el cliente</h2>
          <Chat ticketId={parseInt(id)} activo={true} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 11.3: Commit**

```bash
git add frontend/src/pages/empleado/
git commit -m "feat: empleado pages — ticket list with take action, ticket detail with chat"
```

---

### Task 12: Frontend — Páginas de Cliente

**Files:**
- Create: `frontend/src/pages/cliente/MisTickets.jsx`
- Create: `frontend/src/pages/cliente/NuevoTicket.jsx`
- Create: `frontend/src/pages/cliente/TicketDetalle.jsx`
- Create: `frontend/src/pages/cliente/Feedback.jsx`

- [ ] **Step 12.1: Crear cliente/NuevoTicket.jsx**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import api from '../../api/axios'

export default function NuevoTicket() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ titulo: '', descripcion: '', prioridad: 'media' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await api.post('/tickets', form)
      navigate('/cliente/tickets')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el ticket')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto p-6">
        <button onClick={() => navigate('/cliente/tickets')} className="text-indigo-600 text-sm hover:underline mb-4 block">← Volver</button>
        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-5">Nuevo Ticket</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describí brevemente el problema" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={4} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Detallá el problema con toda la información relevante" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={enviando}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {enviando ? 'Enviando...' : 'Crear Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 12.2: Crear cliente/MisTickets.jsx**

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import TicketCard from '../../components/TicketCard'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function ClienteTickets() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [sinLeer, setSinLeer] = useState({})

  const cargar = async () => {
    const { data } = await api.get('/tickets')
    setTickets(data)
    const counts = {}
    for (const t of data.filter(t => t.estado === 'en_progreso')) {
      const { data: msgs } = await api.get(`/tickets/${t.id}/mensajes`)
      counts[t.id] = msgs.filter(m => !m.leido && m.id_usuario !== usuario.id).length
    }
    setSinLeer(counts)
  }

  useEffect(() => { cargar() }, [])

  const reabrir = async (e, id) => {
    e.stopPropagation()
    if (!confirm('¿Reabrir este ticket? Se creará un ticket nuevo.')) return
    const { data } = await api.post(`/tickets/${id}/reabrir`)
    navigate(`/cliente/tickets`)
    cargar()
  }

  const irAFeedback = (e, id) => {
    e.stopPropagation()
    navigate(`/cliente/feedback/${id}`)
  }

  const activos = tickets.filter(t => t.estado !== 'cerrado')
  const cerrados = tickets.filter(t => t.estado === 'cerrado')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Mis Tickets</h1>
          <button onClick={() => navigate('/cliente/nuevo-ticket')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">
            + Nuevo Ticket
          </button>
        </div>

        <section>
          <h2 className="font-semibold text-gray-600 mb-3">Activos ({activos.length})</h2>
          <div className="space-y-3">
            {activos.length === 0 && <p className="text-sm text-gray-400">Sin tickets activos.</p>}
            {activos.map(t => (
              <TicketCard key={t.id} ticket={t}
                mensajesSinLeer={sinLeer[t.id] || 0}
                onClick={() => t.estado === 'en_progreso' ? navigate(`/cliente/tickets/${t.id}`) : null}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-gray-600 mb-3">Cerrados ({cerrados.length})</h2>
          <div className="space-y-3">
            {cerrados.length === 0 && <p className="text-sm text-gray-400">Sin tickets cerrados.</p>}
            {cerrados.map(t => (
              <TicketCard key={t.id} ticket={t}
                accion={
                  <div className="flex gap-2">
                    {!t.tiene_feedback && (
                      <button onClick={(e) => irAFeedback(e, t.id)}
                        className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded hover:bg-yellow-500">
                        ★ Feedback
                      </button>
                    )}
                    <button onClick={(e) => reabrir(e, t.id)}
                      className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">
                      Reabrir
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 12.3: Crear cliente/TicketDetalle.jsx**

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Chat from '../../components/Chat'
import api from '../../api/axios'

export default function ClienteTicketDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)

  useEffect(() => {
    api.get(`/tickets/${id}`).then(({ data }) => setTicket(data))
  }, [id])

  if (!ticket) return <div className="p-8 text-gray-400">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <button onClick={() => navigate('/cliente/tickets')} className="text-indigo-600 text-sm hover:underline">← Volver</button>
        <div className="bg-white rounded-2xl shadow p-5">
          <h1 className="text-xl font-bold text-gray-800">{ticket.titulo}</h1>
          <p className="text-gray-600 text-sm mt-2">{ticket.descripcion}</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span>Prioridad: {ticket.prioridad}</span>
            <span>Empleado: {ticket.empleado_nombre || 'Sin asignar'}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Chat con el soporte</h2>
          <Chat ticketId={parseInt(id)} activo={ticket.estado === 'en_progreso'} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 12.4: Crear cliente/Feedback.jsx**

```jsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import StarRating from '../../components/StarRating'
import api from '../../api/axios'

export default function ClienteFeedback() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [estrellas, setEstrellas] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const enviar = async (e) => {
    e.preventDefault()
    if (!estrellas) { setError('Por favor seleccioná una calificación'); return }
    try {
      await api.post(`/tickets/${id}/feedback`, { estrellas, comentario: comentario || null })
      setEnviado(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar feedback')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          {enviado ? (
            <>
              <p className="text-4xl mb-3">🎉</p>
              <h1 className="text-xl font-bold text-gray-800 mb-2">¡Gracias por tu feedback!</h1>
              <p className="text-gray-500 text-sm mb-5">Tu opinión nos ayuda a mejorar el servicio.</p>
              <button onClick={() => navigate('/cliente/tickets')}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700">
                Volver a mis tickets
              </button>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-800 mb-2">¿Cómo fue la atención?</h1>
              <p className="text-gray-500 text-sm mb-6">Tu opinión es importante para nosotros.</p>
              <form onSubmit={enviar} className="space-y-5 text-left">
                <div className="flex justify-center">
                  <StarRating value={estrellas} onChange={setEstrellas} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
                  <textarea value={comentario} onChange={(e) => setComentario(e.target.value)}
                    rows={3} placeholder="¿Algo que quieras agregar?"
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700">
                  Enviar Feedback
                </button>
                <button type="button" onClick={() => navigate('/cliente/tickets')}
                  className="w-full text-gray-400 text-sm hover:underline">
                  Omitir por ahora
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 12.5: Commit**

```bash
git add frontend/src/pages/cliente/
git commit -m "feat: cliente pages — ticket list, new ticket, chat detail, feedback"
```

---

### Task 13: Verificación Final

- [ ] **Step 13.1: Levantar backend y verificar que no hay errores**

```bash
cd backend && source venv/Scripts/activate && python app.py
```

- [ ] **Step 13.2: Levantar frontend y verificar que compila sin errores**

```bash
cd frontend && npm run dev
```

- [ ] **Step 13.3: Flujo completo — Admin**
1. Login `admin@helpdesk.com` / `admin123`
2. Crear un empleado → copiar contraseña temporal
3. Crear un cliente → copiar contraseña temporal
4. Verificar Dashboard (debe mostrar 0 tickets en todos los estados)

- [ ] **Step 13.4: Flujo completo — Cliente**
1. Login con credenciales del cliente creado
2. Forzado a cambiar contraseña → cambiar
3. Crear un ticket con título, descripción y prioridad alta
4. Verificar que aparece en "Mis Tickets" como "abierto"

- [ ] **Step 13.5: Flujo completo — Empleado**
1. Login con credenciales del empleado creado
2. Forzado a cambiar contraseña → cambiar
3. Ver ticket abierto → tomar
4. Ir al detalle → chat → enviar mensaje
5. Cambiar prioridad del ticket
6. Cerrar ticket

- [ ] **Step 13.6: Flujo completo — Feedback y Reabrir**
1. Login como cliente
2. Ver ticket cerrado → ícono de feedback → completar (5 estrellas)
3. Reabrir ticket cerrado → verificar que se crea nuevo ticket con [REABIERTO]

- [ ] **Step 13.7: Verificar Dashboard del Admin**
1. Login admin → Dashboard
2. Verificar conteos actualizados
3. Verificar rating promedio del empleado
4. Click en ticket → ver historial completo con mensajes

- [ ] **Step 13.8: Commit final**

```bash
git add -A
git commit -m "chore: final verification — all flows tested"
```
