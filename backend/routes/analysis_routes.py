from flask import Blueprint, request, jsonify
from db import SessionLocal
from models import AnalysisProfile
import json

analysis_bp = Blueprint('analysis', __name__, url_prefix='/api/analysis')

@analysis_bp.route('/profiles', methods=['GET'])
def get_analysis_profiles():
    """Obtener todos los perfiles de análisis disponibles"""
    db = SessionLocal()
    try:
        profiles = db.query(AnalysisProfile).all()
        return jsonify({
            'profiles': [profile.to_dict() for profile in profiles]
        })
    finally:
        db.close()

@analysis_bp.route('/profiles', methods=['POST'])
def create_analysis_profile():
    """Crear un nuevo perfil de análisis"""
    data = request.get_json()

    db = SessionLocal()
    try:
        # Verificar si ya existe un perfil con ese nombre
        existing = db.query(AnalysisProfile).filter_by(name=data['name']).first()
        if existing:
            return jsonify({'error': 'Ya existe un perfil con ese nombre'}), 400

        profile = AnalysisProfile(
            name=data['name'],
            description=data.get('description', ''),
            sport=data.get('sport', 'rugby'),
            is_default=data.get('is_default', 0),
            chart_config=data.get('chart_config', {}),
            category_mapping=data.get('category_mapping', {}),
            descriptor_mapping=data.get('descriptor_mapping', {})
        )

        db.add(profile)
        db.commit()
        db.refresh(profile)

        return jsonify({
            'message': 'Perfil creado exitosamente',
            'profile': profile.to_dict()
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@analysis_bp.route('/profiles/<int:profile_id>', methods=['PUT'])
def update_analysis_profile(profile_id):
    """Actualizar un perfil de análisis"""
    data = request.get_json()

    db = SessionLocal()
    try:
        profile = db.query(AnalysisProfile).filter_by(id=profile_id).first()
        if not profile:
            return jsonify({'error': 'Perfil no encontrado'}), 404

        # Actualizar campos
        for field in ['name', 'description', 'sport', 'is_default', 'chart_config', 'category_mapping', 'descriptor_mapping']:
            if field in data:
                setattr(profile, field, data[field])

        db.commit()
        db.refresh(profile)

        return jsonify({
            'message': 'Perfil actualizado exitosamente',
            'profile': profile.to_dict()
        })

    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@analysis_bp.route('/profiles/<int:profile_id>', methods=['DELETE'])
def delete_analysis_profile(profile_id):
    """Eliminar un perfil de análisis"""
    db = SessionLocal()
    try:
        profile = db.query(AnalysisProfile).filter_by(id=profile_id).first()
        if not profile:
            return jsonify({'error': 'Perfil no encontrado'}), 404

        db.delete(profile)
        db.commit()

        return jsonify({'message': 'Perfil eliminado exitosamente'})

    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@analysis_bp.route('/extract-schema/<int:match_id>', methods=['GET'])
def extract_match_schema(match_id):
    """Extraer esquema de categorías y descriptores de un partido"""
    from models import Event, Match

    db = SessionLocal()
    try:
        # Verificar que el partido existe
        match = db.query(Match).filter_by(id=match_id).first()
        if not match:
            return jsonify({'error': 'Partido no encontrado'}), 404

        # Extraer categorías únicas
        events = db.query(Event).filter_by(match_id=match_id).all()

        categories = set()
        descriptors = {}

        for event in events:
            if event.event_type is not None:
                categories.add(event.event_type)

            # Extraer descriptores del extra_data
            if event.extra_data is not None:
                for key, value in event.extra_data.items():
                    if key not in descriptors:
                        descriptors[key] = set()

                    if isinstance(value, str):
                        descriptors[key].add(value)
                    elif isinstance(value, list):
                        for item in value:
                            if isinstance(item, str):
                                descriptors[key].add(item)

        # Convertir sets a listas para JSON
        descriptors_clean = {k: list(v) for k, v in descriptors.items()}

        return jsonify({
            'match_id': match_id,
            'categories': list(categories),
            'descriptors': descriptors_clean,
            'total_events': len(events)
        })

    finally:
        db.close()
