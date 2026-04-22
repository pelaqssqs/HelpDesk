from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Mensaje, Ticket, Feedback, Usuario

mensajes_bp = Blueprint('mensajes', __name__)


def _tiene_acceso_chat(ticket, user_id, user_rol):
    """Devuelve True si el usuario puede leer/escribir en el chat del ticket."""
    if user_rol == 'cliente':
        return ticket.id_cliente == user_id
    if user_rol == 'empleado':
        return ticket.id_empleado == user_id
    return False


@mensajes_bp.route('/<int:ticket_id>/mensajes', methods=['GET'])
@jwt_required()
def listar_mensajes(ticket_id):
    user_id = int(get_jwt_identity())
    user = Usuario.query.get(user_id)
    ticket = Ticket.query.get_or_404(ticket_id)

    # Admin puede ver todos los mensajes (para el dashboard)
    if user.rol != 'admin' and not _tiene_acceso_chat(ticket, user_id, user.rol):
        return jsonify({'error': 'Acceso denegado'}), 403

    mensajes = (
        Mensaje.query
        .filter_by(id_ticket=ticket_id)
        .order_by(Mensaje.fecha.asc())
        .all()
    )
    return jsonify([m.to_dict() for m in mensajes]), 200


@mensajes_bp.route('/<int:ticket_id>/mensajes', methods=['POST'])
@jwt_required()
def enviar_mensaje(ticket_id):
    user_id = int(get_jwt_identity())
    user = Usuario.query.get(user_id)
    ticket = Ticket.query.get_or_404(ticket_id)

    if not _tiene_acceso_chat(ticket, user_id, user.rol):
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
    user_id = int(get_jwt_identity())
    user = Usuario.query.get(user_id)
    ticket = Ticket.query.get_or_404(ticket_id)

    if not _tiene_acceso_chat(ticket, user_id, user.rol):
        return jsonify({'error': 'Acceso denegado'}), 403

    # Marca como leídos los mensajes del interlocutor (no los propios)
    Mensaje.query.filter(
        Mensaje.id_ticket == ticket_id,
        Mensaje.leido == False,
        Mensaje.id_usuario != user_id,
    ).update({'leido': True})
    db.session.commit()
    return jsonify({'mensaje': 'Mensajes marcados como leídos'}), 200


@mensajes_bp.route('/<int:ticket_id>/feedback', methods=['POST'])
@jwt_required()
def enviar_feedback(ticket_id):
    user_id = int(get_jwt_identity())
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
    comentario = data.get('comentario', '')
    comentario = comentario.strip() if comentario else None

    if not isinstance(estrellas, int) or not (1 <= estrellas <= 5):
        return jsonify({'error': 'Las estrellas deben ser un entero entre 1 y 5'}), 400

    fb = Feedback(
        estrellas=estrellas,
        comentario=comentario,
        id_ticket=ticket_id,
        id_cliente=user_id,
    )
    db.session.add(fb)
    db.session.commit()
    return jsonify(fb.to_dict()), 201


@mensajes_bp.route('/<int:ticket_id>/feedback', methods=['GET'])
@jwt_required()
def ver_feedback(ticket_id):
    user_id = int(get_jwt_identity())
    user = Usuario.query.get(user_id)
    ticket = Ticket.query.get_or_404(ticket_id)

    es_admin = user.rol == 'admin'
    es_empleado_asignado = user.rol == 'empleado' and ticket.id_empleado == user_id

    if not es_admin and not es_empleado_asignado:
        return jsonify({'error': 'Acceso denegado'}), 403

    if not ticket.feedback:
        return jsonify({'feedback': None}), 200
    return jsonify(ticket.feedback.to_dict()), 200
