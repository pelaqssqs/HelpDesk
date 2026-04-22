from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Ticket, Usuario
from auth import rol_requerido

tickets_bp = Blueprint('tickets', __name__)


@tickets_bp.route('', methods=['POST'])
@jwt_required()
@rol_requerido('cliente')
def crear_ticket():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    titulo = data.get('titulo', '').strip()
    descripcion = data.get('descripcion', '').strip()
    prioridad = data.get('prioridad', '')

    if not titulo or not descripcion or prioridad not in ('baja', 'media', 'alta'):
        return jsonify({'error': 'Datos inválidos. Requeridos: titulo, descripcion, prioridad (baja|media|alta)'}), 400

    ticket = Ticket(titulo=titulo, descripcion=descripcion, prioridad=prioridad, id_cliente=user_id)
    db.session.add(ticket)
    db.session.commit()
    return jsonify(ticket.to_dict()), 201


@tickets_bp.route('', methods=['GET'])
@jwt_required()
def listar_tickets():
    user_id = int(get_jwt_identity())
    user = Usuario.query.get(user_id)

    if user.rol == 'cliente':
        tickets = (
            Ticket.query
            .filter_by(id_cliente=user_id)
            .order_by(Ticket.fecha_actualizacion.desc())
            .all()
        )
    elif user.rol == 'empleado':
        # Tickets disponibles para tomar + los propios en progreso
        tickets = (
            Ticket.query
            .filter(
                (Ticket.estado == 'abierto') |
                ((Ticket.estado == 'en_progreso') & (Ticket.id_empleado == user_id))
            )
            .order_by(Ticket.fecha_actualizacion.desc())
            .all()
        )
    else:
        return jsonify({'error': 'Acceso denegado'}), 403

    return jsonify([t.to_dict() for t in tickets]), 200


@tickets_bp.route('/<int:ticket_id>', methods=['GET'])
@jwt_required()
def detalle_ticket(ticket_id):
    user_id = int(get_jwt_identity())
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
    user_id = int(get_jwt_identity())
    ticket = Ticket.query.get_or_404(ticket_id)

    if ticket.estado != 'abierto':
        return jsonify({'error': 'El ticket no está disponible para tomar'}), 400

    ticket.estado = 'en_progreso'
    ticket.id_empleado = user_id
    ticket.fecha_actualizacion = datetime.utcnow()
    db.session.commit()
    return jsonify(ticket.to_dict()), 200


@tickets_bp.route('/<int:ticket_id>/liberar', methods=['PUT'])
@jwt_required()
@rol_requerido('empleado')
def liberar_ticket(ticket_id):
    user_id = int(get_jwt_identity())
    ticket = Ticket.query.get_or_404(ticket_id)

    if ticket.id_empleado != user_id:
        return jsonify({'error': 'No sos el empleado asignado a este ticket'}), 403
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
    user_id = int(get_jwt_identity())
    ticket = Ticket.query.get_or_404(ticket_id)

    if ticket.id_empleado != user_id:
        return jsonify({'error': 'No sos el empleado asignado a este ticket'}), 403

    ticket.estado = 'cerrado'
    ticket.fecha_actualizacion = datetime.utcnow()
    db.session.commit()
    return jsonify(ticket.to_dict()), 200


@tickets_bp.route('/<int:ticket_id>/prioridad', methods=['PUT'])
@jwt_required()
@rol_requerido('empleado')
def actualizar_prioridad(ticket_id):
    user_id = int(get_jwt_identity())
    ticket = Ticket.query.get_or_404(ticket_id)

    if ticket.id_empleado != user_id:
        return jsonify({'error': 'No sos el empleado asignado a este ticket'}), 403

    data = request.get_json()
    nueva_prioridad = data.get('prioridad', '')
    if nueva_prioridad not in ('baja', 'media', 'alta'):
        return jsonify({'error': 'Prioridad inválida. Valores posibles: baja, media, alta'}), 400

    ticket.prioridad = nueva_prioridad
    ticket.fecha_actualizacion = datetime.utcnow()
    db.session.commit()
    return jsonify(ticket.to_dict()), 200


@tickets_bp.route('/<int:ticket_id>/reabrir', methods=['POST'])
@jwt_required()
@rol_requerido('cliente')
def reabrir_ticket(ticket_id):
    user_id = int(get_jwt_identity())
    ticket_original = Ticket.query.get_or_404(ticket_id)

    if ticket_original.id_cliente != user_id:
        return jsonify({'error': 'Acceso denegado'}), 403
    if ticket_original.estado != 'cerrado':
        return jsonify({'error': 'Solo se pueden reabrir tickets cerrados'}), 400

    nuevo = Ticket(
        titulo=f'[REABIERTO] {ticket_original.titulo}',
        descripcion=ticket_original.descripcion,
        prioridad=ticket_original.prioridad,
        id_cliente=user_id,
        ticket_origen_id=ticket_id,
        es_reabierto=True,
    )
    db.session.add(nuevo)
    db.session.commit()
    return jsonify(nuevo.to_dict()), 201
