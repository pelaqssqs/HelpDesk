from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from models import db, Usuario, Ticket, Feedback
from auth import rol_requerido

empleado_bp = Blueprint('empleado', __name__)


@empleado_bp.route('/perfil', methods=['GET'])
@jwt_required()
@rol_requerido('empleado')
def perfil():
    user_id = int(get_jwt_identity())
    usuario = Usuario.query.get_or_404(user_id)

    tickets_cerrados = (
        Ticket.query
        .filter_by(id_empleado=user_id, estado='cerrado')
        .order_by(Ticket.fecha_actualizacion.desc())
        .all()
    )

    tickets_en_progreso = Ticket.query.filter_by(
        id_empleado=user_id, estado='en_progreso'
    ).count()

    promedio = (
        db.session.query(func.avg(Feedback.estrellas))
        .join(Ticket, Feedback.id_ticket == Ticket.id)
        .filter(Ticket.id_empleado == user_id)
        .scalar()
    )

    historial = []
    for t in tickets_cerrados:
        entry = {
            'id': t.id,
            'titulo': t.titulo,
            'prioridad': t.prioridad,
            'fecha_cierre': t.fecha_actualizacion.isoformat(),
            'estrellas': t.feedback.estrellas if t.feedback else None,
        }
        historial.append(entry)

    return jsonify({
        'perfil': usuario.to_dict(),
        'metricas': {
            'tickets_resueltos': len(tickets_cerrados),
            'promedio_estrellas': round(float(promedio), 2) if promedio else None,
            'tickets_en_progreso': tickets_en_progreso,
        },
        'historial': historial,
    }), 200


@empleado_bp.route('/disponibilidad', methods=['PUT'])
@jwt_required()
@rol_requerido('empleado')
def actualizar_disponibilidad():
    user_id = int(get_jwt_identity())
    usuario = Usuario.query.get_or_404(user_id)

    data = request.get_json()
    nueva = data.get('disponibilidad', '')
    if nueva not in ('disponible', 'ocupado'):
        return jsonify({'error': 'Valor inválido. Opciones: disponible, ocupado'}), 400

    usuario.disponibilidad = nueva
    db.session.commit()
    return jsonify({'disponibilidad': usuario.disponibilidad}), 200
