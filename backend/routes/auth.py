from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import bcrypt
from models import db, Usuario

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = Usuario.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Credenciales incorrectas'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'token': token,
        'usuario': user.to_dict(),
    }), 200


@auth_bp.route('/cambiar-password', methods=['POST'])
@jwt_required()
def cambiar_password():
    user_id = int(get_jwt_identity())
    user = Usuario.query.get(user_id)
    data = request.get_json()

    nueva = data.get('nueva_password', '')
    if len(nueva) < 6:
        return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400

    user.password_hash = bcrypt.generate_password_hash(nueva).decode('utf-8')
    user.debe_cambiar_password = False
    db.session.commit()

    return jsonify({'mensaje': 'Contraseña actualizada correctamente'}), 200
