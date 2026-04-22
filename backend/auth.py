from functools import wraps
from flask_jwt_extended import get_jwt_identity
from flask import jsonify
from models import Usuario


def rol_requerido(*roles):
    """Verifica que el usuario JWT tenga uno de los roles indicados."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user_id = int(get_jwt_identity())
            user = Usuario.query.get(user_id)
            if not user or user.rol not in roles:
                return jsonify({'error': 'Acceso denegado'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
