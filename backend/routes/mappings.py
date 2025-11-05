"""
Endpoints para gestión de mapeos de categorías (traducciones).
"""

from flask import Blueprint, request, jsonify
from db import SessionLocal
from models import CategoryMapping
from translator import Translator, init_default_mappings

mappings_bp = Blueprint('mappings', __name__)


@mappings_bp.route('/api/mappings', methods=['GET'])
def get_all_mappings():
    """
    Obtiene todos los mapeos de categorías.
    
    Query params:
        - mapping_type: Filtrar por tipo ('event_type', 'descriptor', 'zone')
        - language: Filtrar por idioma ('es', 'it', 'en', etc.)
        - target_category: Filtrar por categoría destino
    """
    db = SessionLocal()
    try:
        query = db.query(CategoryMapping)
        
        # Filtros opcionales
        mapping_type = request.args.get('mapping_type')
        language = request.args.get('language')
        target_category = request.args.get('target_category')
        
        if mapping_type:
            query = query.filter_by(mapping_type=mapping_type)
        if language:
            query = query.filter_by(language=language)
        if target_category:
            query = query.filter_by(target_category=target_category)
        
        mappings = query.order_by(
            CategoryMapping.target_category,
            CategoryMapping.priority.desc()
        ).all()
        
        return jsonify({
            "mappings": [m.to_dict() for m in mappings],
            "count": len(mappings)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@mappings_bp.route('/api/mappings/grouped', methods=['GET'])
def get_mappings_grouped():
    """
    Obtiene mapeos agrupados por categoría destino.
    
    Query params:
        - mapping_type: Filtrar por tipo
    
    Response:
        {
            "TACKLE": ["TACKLE", "Tackle", "Placcaggio", "Placaje"],
            "PENALTY": ["PENALTY", "Penalty", "Penal", "Penalità"],
            ...
        }
    """
    db = SessionLocal()
    try:
        mapping_type = request.args.get('mapping_type', 'event_type')
        
        mappings = db.query(CategoryMapping).filter_by(
            mapping_type=mapping_type
        ).order_by(
            CategoryMapping.target_category,
            CategoryMapping.priority.desc()
        ).all()
        
        # Agrupar por target_category
        grouped = {}
        for m in mappings:
            if m.target_category not in grouped:
                grouped[m.target_category] = []
            grouped[m.target_category].append({
                "source_term": m.source_term,
                "language": m.language,
                "priority": m.priority
            })
        
        return jsonify({
            "grouped_mappings": grouped,
            "categories": list(grouped.keys())
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@mappings_bp.route('/api/mappings', methods=['POST'])
def create_mapping():
    """
    Crea un nuevo mapeo de categoría.
    
    Body:
        {
            "source_term": "Placcaggio",
            "target_category": "TACKLE",
            "mapping_type": "event_type",
            "language": "it",
            "priority": 9,
            "notes": "Término italiano para tackle"
        }
    """
    db = SessionLocal()
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        if not data.get('source_term') or not data.get('target_category'):
            return jsonify({
                "error": "source_term y target_category son requeridos"
            }), 400
        
        # Verificar si ya existe
        existing = db.query(CategoryMapping).filter_by(
            source_term=data['source_term'],
            target_category=data['target_category'],
            mapping_type=data.get('mapping_type', 'event_type')
        ).first()
        
        if existing:
            return jsonify({
                "error": "Este mapeo ya existe",
                "existing": existing.to_dict()
            }), 409
        
        # Crear nuevo mapeo
        mapping = CategoryMapping(
            source_term=data['source_term'],
            target_category=data['target_category'],
            mapping_type=data.get('mapping_type', 'event_type'),
            language=data.get('language'),
            priority=data.get('priority', 0),
            notes=data.get('notes')
        )
        
        db.add(mapping)
        db.commit()
        
        # Recargar cache del traductor
        translator = Translator(db)
        translator.reload_cache()
        
        return jsonify({
            "success": True,
            "mapping": mapping.to_dict()
        }), 201
        
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@mappings_bp.route('/api/mappings/bulk', methods=['POST'])
def create_bulk_mappings():
    """
    Crea múltiples mapeos de una vez.
    
    Body:
        {
            "mappings": [
                {
                    "source_term": "Placcaggio",
                    "target_category": "TACKLE",
                    "language": "it"
                },
                {
                    "source_term": "Placaje",
                    "target_category": "TACKLE",
                    "language": "es"
                }
            ]
        }
    """
    db = SessionLocal()
    try:
        data = request.get_json()
        mappings_data = data.get('mappings', [])
        
        if not mappings_data:
            return jsonify({"error": "No mappings provided"}), 400
        
        translator = Translator(db)
        count = translator.bulk_add_mappings(mappings_data)
        
        return jsonify({
            "success": True,
            "count": count,
            "message": f"Se agregaron {count} mapeos"
        }), 201
        
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@mappings_bp.route('/api/mappings/<int:mapping_id>', methods=['PUT'])
def update_mapping(mapping_id):
    """
    Actualiza un mapeo existente.
    
    Body:
        {
            "target_category": "NEW_CATEGORY",
            "priority": 10,
            "notes": "Updated notes"
        }
    """
    db = SessionLocal()
    try:
        mapping = db.query(CategoryMapping).filter_by(id=mapping_id).first()
        
        if not mapping:
            return jsonify({"error": "Mapeo no encontrado"}), 404
        
        data = request.get_json()
        
        # Actualizar campos permitidos
        if 'target_category' in data:
            mapping.target_category = data['target_category']
        if 'mapping_type' in data:
            mapping.mapping_type = data['mapping_type']
        if 'language' in data:
            mapping.language = data['language']
        if 'priority' in data:
            mapping.priority = data['priority']
        if 'notes' in data:
            mapping.notes = data['notes']
        
        db.commit()
        
        # Recargar cache
        translator = Translator(db)
        translator.reload_cache()
        
        return jsonify({
            "success": True,
            "mapping": mapping.to_dict()
        }), 200
        
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@mappings_bp.route('/api/mappings/<int:mapping_id>', methods=['DELETE'])
def delete_mapping(mapping_id):
    """Elimina un mapeo"""
    db = SessionLocal()
    try:
        mapping = db.query(CategoryMapping).filter_by(id=mapping_id).first()
        
        if not mapping:
            return jsonify({"error": "Mapeo no encontrado"}), 404
        
        db.delete(mapping)
        db.commit()
        
        # Recargar cache
        translator = Translator(db)
        translator.reload_cache()
        
        return jsonify({
            "success": True,
            "message": "Mapeo eliminado correctamente"
        }), 200
        
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@mappings_bp.route('/api/mappings/init-defaults', methods=['POST'])
def init_defaults():
    """
    Inicializa los mapeos por defecto (rugby en ES/IT/EN).
    
    Body (opcional):
        {
            "reset": true  // Si true, elimina mapeos existentes antes
        }
    """
    db = SessionLocal()
    try:
        data = request.get_json() or {}
        reset = data.get('reset', False)
        
        if reset:
            deleted = db.query(CategoryMapping).delete()
            db.commit()
            print(f"🗑️  Eliminados {deleted} mapeos existentes")
        
        count = init_default_mappings(db)
        
        return jsonify({
            "success": True,
            "count": count,
            "message": f"Se inicializaron {count} mapeos por defecto"
        }), 200
        
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


@mappings_bp.route('/api/mappings/test-translation', methods=['POST'])
def test_translation():
    """
    Endpoint de prueba para traducir términos sin importar.
    
    Body:
        {
            "terms": ["Placcaggio", "Penalty", "Melé"],
            "mapping_type": "event_type"
        }
    
    Response:
        {
            "translations": {
                "Placcaggio": "TACKLE",
                "Penalty": "PENALTY",
                "Melé": "SCRUM"
            }
        }
    """
    db = SessionLocal()
    try:
        data = request.get_json()
        terms = data.get('terms', [])
        mapping_type = data.get('mapping_type', 'event_type')
        
        if not terms:
            return jsonify({"error": "No terms provided"}), 400
        
        translator = Translator(db)
        translations = {}
        
        for term in terms:
            translated = translator.translate(term, mapping_type)
            translations[term] = translated
        
        return jsonify({
            "translations": translations,
            "mapping_type": mapping_type
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()
