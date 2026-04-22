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
    disponibilidad = db.Column(db.String(20), default='disponible', nullable=False)

    tickets_como_cliente = db.relationship(
        'Ticket', foreign_keys='Ticket.id_cliente', backref='cliente', lazy=True
    )
    tickets_como_empleado = db.relationship(
        'Ticket', foreign_keys='Ticket.id_empleado', backref='empleado', lazy=True
    )

    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'rol': self.rol,
            'debe_cambiar_password': self.debe_cambiar_password,
            'fecha_creacion': self.fecha_creacion.isoformat(),
            'disponibilidad': self.disponibilidad,
        }


class Ticket(db.Model):
    __tablename__ = 'tickets'

    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    prioridad = db.Column(db.String(10), nullable=False)   # baja, media, alta
    estado = db.Column(db.String(20), default='abierto', nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    fecha_actualizacion = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    id_cliente = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    id_empleado = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True)
    ticket_origen_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=True)
    es_reabierto = db.Column(db.Boolean, default=False, nullable=False)

    mensajes = db.relationship(
        'Mensaje', backref='ticket', lazy=True, cascade='all, delete-orphan'
    )
    feedback = db.relationship(
        'Feedback', backref='ticket', uselist=False, cascade='all, delete-orphan'
    )

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
            'tiene_feedback': self.feedback is not None,
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
            'leido': self.leido,
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
            'id_cliente': self.id_cliente,
        }
