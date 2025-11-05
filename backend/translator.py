"""
Sistema de traducción y mapeo de términos externos a categorías internas.

Permite mapear múltiples términos de diferentes idiomas/sistemas
a una única categoría estándar del sistema.

Ejemplo:
    'Tackle', 'Placcaggio', 'Placaje' → 'TACKLE'
"""

from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from models import CategoryMapping


class Translator:
    """
    Traductor inteligente que mapea términos externos a categorías estándar.
    """
    
    def __init__(self, db: Session = None):
        self.db = db
        self._cache: Dict[str, str] = {}  # Cache en memoria para performance
        self._load_mappings()
    
    def _load_mappings(self):
        """Carga todos los mapeos desde BD al cache"""
        if not self.db:
            return
        
        mappings = self.db.query(CategoryMapping).order_by(
            CategoryMapping.priority.desc()
        ).all()
        
        for mapping in mappings:
            # Normalizar clave: lowercase y sin espacios extras
            key = self._normalize_key(
                mapping.source_term, 
                mapping.mapping_type
            )
            self._cache[key] = mapping.target_category
        
        print(f"✅ Cargados {len(self._cache)} mapeos de categorías")
    
    def _normalize_key(self, term: str, mapping_type: str = 'event_type') -> str:
        """Normaliza término para búsqueda case-insensitive"""
        return f"{mapping_type}:{term.lower().strip()}"
    
    def translate(
        self, 
        term: str, 
        mapping_type: str = 'event_type',
        default: Optional[str] = None
    ) -> str:
        """
        Traduce un término externo a categoría interna.
        
        Args:
            term: Término a traducir (ej: 'Placcaggio')
            mapping_type: Tipo de mapeo ('event_type', 'descriptor', 'zone')
            default: Valor por defecto si no hay traducción (None = retorna original)
        
        Returns:
            Categoría traducida o valor original/default
        
        Examples:
            >>> translator.translate('Placcaggio')
            'TACKLE'
            
            >>> translator.translate('Tackle', 'event_type')
            'TACKLE'
            
            >>> translator.translate('OUTSIDE', 'descriptor')
            'OUTSIDE'  # Sin cambio si no hay mapeo
        """
        if not term:
            return default if default is not None else term
        
        key = self._normalize_key(term, mapping_type)
        
        if key in self._cache:
            return self._cache[key]
        
        # Si no hay traducción, retornar default o el término original
        return default if default is not None else term
    
    def translate_event_type(self, event_type: str) -> str:
        """Atajo para traducir tipos de eventos"""
        return self.translate(event_type, 'event_type')
    
    def translate_descriptor(self, descriptor: str) -> str:
        """Atajo para traducir descriptores"""
        return self.translate(descriptor, 'descriptor')
    
    def translate_zone(self, zone: str) -> str:
        """Atajo para traducir zonas del campo"""
        return self.translate(zone, 'zone')
    
    def translate_event(self, event: dict) -> dict:
        """
        Traduce todos los campos traducibles de un evento.
        
        Args:
            event: Diccionario con datos del evento
            
        Returns:
            Evento con campos traducidos
            
        Example:
            >>> event = {
            ...     'event_type': 'Placcaggio',
            ...     'extra_data': {
            ...         'ENCUADRE-TACKLE': 'Fuori',
            ...         'JUGADOR': 'Matera'
            ...     }
            ... }
            >>> translator.translate_event(event)
            {
                'event_type': 'TACKLE',
                'extra_data': {
                    'ENCUADRE-TACKLE': 'OUTSIDE',
                    'JUGADOR': 'Matera'
                }
            }
        """
        translated = event.copy()
        
        # Traducir tipo de evento
        if 'event_type' in translated:
            translated['event_type'] = self.translate_event_type(
                translated['event_type']
            )
        
        # Traducir descriptores en extra_data
        if 'extra_data' in translated and isinstance(translated['extra_data'], dict):
            extra = translated['extra_data'].copy()
            
            for key, value in extra.items():
                if isinstance(value, str):
                    # Intentar traducir el valor
                    extra[key] = self.translate_descriptor(value)
            
            translated['extra_data'] = extra
        
        return translated
    
    def translate_events_batch(self, events: List[dict]) -> List[dict]:
        """
        Traduce un lote de eventos de forma eficiente.
        
        Args:
            events: Lista de eventos
            
        Returns:
            Lista de eventos traducidos
        """
        return [self.translate_event(event) for event in events]
    
    def add_mapping(
        self,
        source_term: str,
        target_category: str,
        mapping_type: str = 'event_type',
        language: str = None,
        priority: int = 0,
        notes: str = None
    ) -> CategoryMapping:
        """
        Agrega un nuevo mapeo a la base de datos.
        
        Args:
            source_term: Término externo (ej: 'Placcaggio')
            target_category: Categoría interna (ej: 'TACKLE')
            mapping_type: Tipo de mapeo
            language: Código de idioma (opcional)
            priority: Prioridad (mayor = más importante)
            notes: Notas explicativas
            
        Returns:
            Objeto CategoryMapping creado
        """
        if not self.db:
            raise ValueError("DB session required to add mapping")
        
        # Verificar si ya existe
        existing = self.db.query(CategoryMapping).filter_by(
            source_term=source_term,
            target_category=target_category,
            mapping_type=mapping_type
        ).first()
        
        if existing:
            print(f"⚠️  Mapeo ya existe: {source_term} → {target_category}")
            return existing
        
        mapping = CategoryMapping(
            source_term=source_term,
            target_category=target_category,
            mapping_type=mapping_type,
            language=language,
            priority=priority,
            notes=notes
        )
        
        self.db.add(mapping)
        self.db.commit()
        
        # Actualizar cache
        key = self._normalize_key(source_term, mapping_type)
        self._cache[key] = target_category
        
        print(f"✅ Mapeo agregado: {source_term} → {target_category}")
        return mapping
    
    def bulk_add_mappings(self, mappings: List[Dict]) -> int:
        """
        Agrega múltiples mapeos de una vez.
        
        Args:
            mappings: Lista de diccionarios con los mapeos
            
        Example:
            >>> mappings = [
            ...     {'source_term': 'Tackle', 'target_category': 'TACKLE'},
            ...     {'source_term': 'Placcaggio', 'target_category': 'TACKLE'},
            ...     {'source_term': 'Placaje', 'target_category': 'TACKLE'}
            ... ]
            >>> translator.bulk_add_mappings(mappings)
            3
        """
        if not self.db:
            raise ValueError("DB session required")
        
        count = 0
        for mapping_data in mappings:
            try:
                self.add_mapping(
                    source_term=mapping_data['source_term'],
                    target_category=mapping_data['target_category'],
                    mapping_type=mapping_data.get('mapping_type', 'event_type'),
                    language=mapping_data.get('language'),
                    priority=mapping_data.get('priority', 0),
                    notes=mapping_data.get('notes')
                )
                count += 1
            except Exception as e:
                print(f"❌ Error agregando mapeo {mapping_data}: {e}")
        
        return count
    
    def get_all_mappings(self, mapping_type: str = None) -> List[Dict]:
        """
        Obtiene todos los mapeos, opcionalmente filtrados por tipo.
        
        Args:
            mapping_type: Tipo de mapeo a filtrar (opcional)
            
        Returns:
            Lista de diccionarios con los mapeos
        """
        if not self.db:
            return []
        
        query = self.db.query(CategoryMapping)
        
        if mapping_type:
            query = query.filter_by(mapping_type=mapping_type)
        
        mappings = query.order_by(
            CategoryMapping.target_category,
            CategoryMapping.priority.desc()
        ).all()
        
        return [m.to_dict() for m in mappings]
    
    def get_source_terms_for_category(
        self, 
        target_category: str,
        mapping_type: str = 'event_type'
    ) -> List[str]:
        """
        Obtiene todos los términos que mapean a una categoría específica.
        
        Args:
            target_category: Categoría interna (ej: 'TACKLE')
            mapping_type: Tipo de mapeo
            
        Returns:
            Lista de términos externos
            
        Example:
            >>> translator.get_source_terms_for_category('TACKLE')
            ['TACKLE', 'Tackle', 'Placcaggio', 'Placaje']
        """
        if not self.db:
            return []
        
        mappings = self.db.query(CategoryMapping).filter_by(
            target_category=target_category,
            mapping_type=mapping_type
        ).all()
        
        return [m.source_term for m in mappings]
    
    def reload_cache(self):
        """Recarga el cache desde la base de datos"""
        self._cache.clear()
        self._load_mappings()


# Singleton global (para usar sin instanciar cada vez)
_translator_instance: Optional[Translator] = None

def get_translator(db: Session = None) -> Translator:
    """
    Obtiene la instancia singleton del traductor.
    
    Args:
        db: Sesión de base de datos (opcional, solo para primera inicialización)
        
    Returns:
        Instancia de Translator
    """
    global _translator_instance
    
    if _translator_instance is None and db is not None:
        _translator_instance = Translator(db)
    
    return _translator_instance


# Mapeos por defecto (Rugby en español, italiano, inglés)
DEFAULT_MAPPINGS = [
    # TACKLE - Placajes
    {'source_term': 'TACKLE', 'target_category': 'TACKLE', 'language': 'en', 'priority': 10},
    {'source_term': 'Tackle', 'target_category': 'TACKLE', 'language': 'en', 'priority': 9},
    {'source_term': 'tackle', 'target_category': 'TACKLE', 'language': 'en', 'priority': 8},
    {'source_term': 'Placcaggio', 'target_category': 'TACKLE', 'language': 'it', 'priority': 9},
    {'source_term': 'placcaggio', 'target_category': 'TACKLE', 'language': 'it', 'priority': 8},
    {'source_term': 'Placaje', 'target_category': 'TACKLE', 'language': 'es', 'priority': 9},
    {'source_term': 'placaje', 'target_category': 'TACKLE', 'language': 'es', 'priority': 8},
    
    # PENALTY - Penales
    {'source_term': 'PENALTY', 'target_category': 'PENALTY', 'language': 'en', 'priority': 10},
    {'source_term': 'Penalty', 'target_category': 'PENALTY', 'language': 'en', 'priority': 9},
    {'source_term': 'Penal', 'target_category': 'PENALTY', 'language': 'es', 'priority': 9},
    {'source_term': 'Penalità', 'target_category': 'PENALTY', 'language': 'it', 'priority': 9},
    {'source_term': 'Punizione', 'target_category': 'PENALTY', 'language': 'it', 'priority': 8},
    
    # SCRUM - Melé
    {'source_term': 'SCRUM', 'target_category': 'SCRUM', 'language': 'en', 'priority': 10},
    {'source_term': 'Scrum', 'target_category': 'SCRUM', 'language': 'en', 'priority': 9},
    {'source_term': 'Melé', 'target_category': 'SCRUM', 'language': 'es', 'priority': 9},
    {'source_term': 'Mêlée', 'target_category': 'SCRUM', 'language': 'fr', 'priority': 9},
    {'source_term': 'Mischia', 'target_category': 'SCRUM', 'language': 'it', 'priority': 9},
    
    # LINEOUT - Touch/Line
    {'source_term': 'LINEOUT', 'target_category': 'LINEOUT', 'language': 'en', 'priority': 10},
    {'source_term': 'Line-out', 'target_category': 'LINEOUT', 'language': 'en', 'priority': 9},
    {'source_term': 'Touche', 'target_category': 'LINEOUT', 'language': 'fr', 'priority': 9},
    {'source_term': 'Touch', 'target_category': 'LINEOUT', 'language': 'es', 'priority': 9},
    {'source_term': 'Rimessa laterale', 'target_category': 'LINEOUT', 'language': 'it', 'priority': 9},
    
    # RUCK
    {'source_term': 'RUCK', 'target_category': 'RUCK', 'language': 'en', 'priority': 10},
    {'source_term': 'Ruck', 'target_category': 'RUCK', 'language': 'en', 'priority': 9},
    {'source_term': 'Raggrupamento', 'target_category': 'RUCK', 'language': 'it', 'priority': 9},
    
    # MAUL - Maul
    {'source_term': 'MAUL', 'target_category': 'MAUL', 'language': 'en', 'priority': 10},
    {'source_term': 'Maul', 'target_category': 'MAUL', 'language': 'en', 'priority': 9},
    {'source_term': 'Agglomerato', 'target_category': 'MAUL', 'language': 'it', 'priority': 9},
    
    # TRY - Ensayo
    {'source_term': 'TRY', 'target_category': 'TRY', 'language': 'en', 'priority': 10},
    {'source_term': 'Try', 'target_category': 'TRY', 'language': 'en', 'priority': 9},
    {'source_term': 'Ensayo', 'target_category': 'TRY', 'language': 'es', 'priority': 9},
    {'source_term': 'Meta', 'target_category': 'TRY', 'language': 'it', 'priority': 9},
    
    # KICK - Patada
    {'source_term': 'KICK', 'target_category': 'KICK', 'language': 'en', 'priority': 10},
    {'source_term': 'Kick', 'target_category': 'KICK', 'language': 'en', 'priority': 9},
    {'source_term': 'Patada', 'target_category': 'KICK', 'language': 'es', 'priority': 9},
    {'source_term': 'Calcio', 'target_category': 'KICK', 'language': 'it', 'priority': 9},
    
    # PASS - Pase
    {'source_term': 'PASS', 'target_category': 'PASS', 'language': 'en', 'priority': 10},
    {'source_term': 'Pass', 'target_category': 'PASS', 'language': 'en', 'priority': 9},
    {'source_term': 'Pase', 'target_category': 'PASS', 'language': 'es', 'priority': 9},
    {'source_term': 'Passaggio', 'target_category': 'PASS', 'language': 'it', 'priority': 9},
    
    # TURNOVER - Recuperación/Pérdida
    {'source_term': 'TURNOVER', 'target_category': 'TURNOVER', 'language': 'en', 'priority': 10},
    {'source_term': 'Turnover', 'target_category': 'TURNOVER', 'language': 'en', 'priority': 9},
    {'source_term': 'Recuperación', 'target_category': 'TURNOVER', 'language': 'es', 'priority': 9},
    {'source_term': 'Pérdida', 'target_category': 'TURNOVER', 'language': 'es', 'priority': 8},
    {'source_term': 'Recupero', 'target_category': 'TURNOVER', 'language': 'it', 'priority': 9},
    
    # Descriptores - OUTSIDE/INSIDE (Encuadre tackle)
    {'source_term': 'OUTSIDE', 'target_category': 'OUTSIDE', 'mapping_type': 'descriptor', 'language': 'en', 'priority': 10},
    {'source_term': 'Fuori', 'target_category': 'OUTSIDE', 'mapping_type': 'descriptor', 'language': 'it', 'priority': 9},
    {'source_term': 'Afuera', 'target_category': 'OUTSIDE', 'mapping_type': 'descriptor', 'language': 'es', 'priority': 9},
    
    {'source_term': 'INSIDE', 'target_category': 'INSIDE', 'mapping_type': 'descriptor', 'language': 'en', 'priority': 10},
    {'source_term': 'Dentro', 'target_category': 'INSIDE', 'mapping_type': 'descriptor', 'language': 'it', 'priority': 9},
    {'source_term': 'Adentro', 'target_category': 'INSIDE', 'mapping_type': 'descriptor', 'language': 'es', 'priority': 9},
    
    # Descriptores - Resultado (WIN/LOST)
    {'source_term': 'WIN', 'target_category': 'WIN', 'mapping_type': 'descriptor', 'language': 'en', 'priority': 10},
    {'source_term': 'Ganado', 'target_category': 'WIN', 'mapping_type': 'descriptor', 'language': 'es', 'priority': 9},
    {'source_term': 'Vinto', 'target_category': 'WIN', 'mapping_type': 'descriptor', 'language': 'it', 'priority': 9},
    
    {'source_term': 'LOST', 'target_category': 'LOST', 'mapping_type': 'descriptor', 'language': 'en', 'priority': 10},
    {'source_term': 'Perdido', 'target_category': 'LOST', 'mapping_type': 'descriptor', 'language': 'es', 'priority': 9},
    {'source_term': 'Perso', 'target_category': 'LOST', 'mapping_type': 'descriptor', 'language': 'it', 'priority': 9},
]


def init_default_mappings(db: Session) -> int:
    """
    Inicializa los mapeos por defecto en la base de datos.
    
    Args:
        db: Sesión de base de datos
        
    Returns:
        Cantidad de mapeos agregados
    """
    translator = Translator(db)
    return translator.bulk_add_mappings(DEFAULT_MAPPINGS)
