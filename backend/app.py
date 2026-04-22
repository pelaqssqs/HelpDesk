import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from sqlalchemy import inspect, text
from models import db, Usuario

bcrypt = Bcrypt()


def create_app():
    app = Flask(__name__)

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///helpdesk.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production-32chars')

    db.init_app(app)
    bcrypt.init_app(app)
    JWTManager(app)
    CORS(app, origins=['http://localhost:5173'])

    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.tickets import tickets_bp
    from routes.mensajes import mensajes_bp
    from routes.empleado import empleado_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(tickets_bp, url_prefix='/api/tickets')
    app.register_blueprint(mensajes_bp, url_prefix='/api/tickets')
    app.register_blueprint(empleado_bp, url_prefix='/api/empleado')

    with app.app_context():
        db.create_all()
        _migrate_add_disponibilidad()
        _seed_admin()

    return app


def _migrate_add_disponibilidad():
    cols = [c['name'] for c in inspect(db.engine).get_columns('usuarios')]
    if 'disponibilidad' not in cols:
        db.session.execute(
            text("ALTER TABLE usuarios ADD COLUMN disponibilidad VARCHAR(20) NOT NULL DEFAULT 'disponible'")
        )
        db.session.commit()


def _seed_admin():
    """Crea el usuario admin inicial si no existe ningún admin."""
    if not Usuario.query.filter_by(rol='admin').first():
        pw = bcrypt.generate_password_hash('admin123').decode('utf-8')
        admin = Usuario(
            nombre='Administrador',
            email='admin@helpdesk.com',
            password_hash=pw,
            rol='admin',
            debe_cambiar_password=False,
        )
        db.session.add(admin)
        db.session.commit()
        print('Admin inicial creado: admin@helpdesk.com / admin123')


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
