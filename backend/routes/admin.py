import secrets
import string
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, Usuario, Ticket, Feedback
from auth import rol_requerido
from app import bcrypt

admin_bp = Blueprint('admin', __name__)


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
        return jsonify({'error': 'Datos inválidos. Campos requeridos: nombre, email, rol (empleado|cliente)'}), 400

    if Usuario.query.filter_by(email=email).first():
        return jsonify({'error': 'El email ya está registrado'}), 409

    password_temporal = _generar_password()
    password_hash = bcrypt.generate_password_hash(password_temporal).decode('utf-8')

    usuario = Usuario(
        nombre=nombre,
        email=email,
        password_hash=password_hash,
        rol=rol,
        debe_cambiar_password=True,
    )
    db.session.add(usuario)
    db.session.commit()

    return jsonify({
        'usuario': usuario.to_dict(),
        'password_temporal': password_temporal,  # Solo se devuelve una vez
    }), 201


@admin_bp.route('/usuarios', methods=['GET'])
@jwt_required()
@rol_requerido('admin')
def listar_usuarios():
    usuarios = Usuario.query.order_by(Usuario.fecha_creacion.desc()).all()
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
    # Conteo de tickets por estado
    estados = (
        db.session.query(Ticket.estado, func.count(Ticket.id))
        .group_by(Ticket.estado)
        .all()
    )
    conteo_estados = {estado: count for estado, count in estados}

    # Todos los empleados con su disponibilidad y rating (si tienen feedback)
    empleados = Usuario.query.filter_by(rol='empleado').all()

    ratings_map = {
        r.id: {'promedio': round(float(r.promedio), 2), 'total': r.total_feedback}
        for r in (
            db.session.query(
                Usuario.id,
                func.avg(Feedback.estrellas).label('promedio'),
                func.count(Feedback.id).label('total_feedback'),
            )
            .join(Ticket, Ticket.id_empleado == Usuario.id)
            .join(Feedback, Feedback.id_ticket == Ticket.id)
            .filter(Usuario.rol == 'empleado')
            .group_by(Usuario.id)
            .all()
        )
    }

    return jsonify({
        'tickets_por_estado': {
            'abierto': conteo_estados.get('abierto', 0),
            'en_progreso': conteo_estados.get('en_progreso', 0),
            'cerrado': conteo_estados.get('cerrado', 0),
        },
        'rating_por_empleado': [
            {
                'id': e.id,
                'nombre': e.nombre,
                'disponibilidad': e.disponibilidad,
                'promedio': ratings_map.get(e.id, {}).get('promedio'),
                'total': ratings_map.get(e.id, {}).get('total', 0),
            }
            for e in empleados
        ],
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
    if ticket.estado == 'cerrado':
        return jsonify({'error': 'El ticket ya está cerrado'}), 400
    ticket.estado = 'cerrado'
    db.session.commit()
    return jsonify({'mensaje': 'Ticket cerrado', 'ticket': ticket.to_dict()}), 200
