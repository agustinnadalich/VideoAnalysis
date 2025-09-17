# Informe de Proyecto: VideoAnalysis

## Resumen Ejecutivo
VideoAnalysis es una plataforma integral de análisis de video deportivo, orientada principalmente al rugby, que permite importar, visualizar y analizar datos de partidos junto con sus videos asociados. El sistema está diseñado para facilitar el trabajo de entrenadores, analistas y clubes, conectando eventos estadísticos con la reproducción de video para obtener insights tácticos y estratégicos.

## Objetivos del Proyecto
- Digitalizar y centralizar la información de partidos y eventos deportivos.
- Permitir la importación de datos desde herramientas profesionales (LongoMatch, Sportscode, Nacsport, Excel, JSON).
- Vincular eventos y categorías con momentos específicos del video del partido.
- Ofrecer una interfaz intuitiva para la revisión, filtrado y edición de datos antes de su almacenamiento.
- Facilitar la visualización y análisis táctico para la toma de decisiones.

## Arquitectura Técnica
- **Frontend:** React + TypeScript, con componentes modernos (Radix UI, Tailwind CSS).
- **Backend:** Flask (Python) + SQLAlchemy, expone una API REST y gestiona la lógica de importación y almacenamiento.
- **Base de Datos:** PostgreSQL, con modelos relacionales para Club, Equipo, Partido, Jugador y Evento.
- **Docker:** Contenedores separados para frontend, backend y base de datos, facilitando el despliegue y la escalabilidad.

## Flujo de Trabajo
1. **Importación de Datos:**
   - El usuario sube un archivo (Excel, JSON, XML) con datos del partido.
   - El backend normaliza y procesa los datos, detectando eventos y categorías.
   - Si existen etiquetas sin grupo, se muestran en la preview para que el usuario las asigne manualmente.
2. **Revisión y Edición:**
   - El frontend permite visualizar los datos importados, filtrar categorías y editar metadatos antes de guardar.
3. **Almacenamiento:**
   - Los datos confirmados se guardan en la base de datos relacional, vinculando eventos, jugadores y partidos.
4. **Visualización y Análisis:**
   - El usuario puede navegar por los partidos, ver estadísticas y reproducir el video en el instante de cada evento.

## Características Clave
- **Importación flexible:** Soporte para múltiples formatos y perfiles de importación personalizados.
- **Preview inteligente:** Detección de inconsistencias y etiquetas sin grupo para revisión manual.
- **Vinculación con video:** Reproducción sincronizada con eventos y categorías.
- **Gestión de entidades:** Clubes, equipos, jugadores y partidos con relaciones jerárquicas.
- **Interfaz moderna:** UI responsiva y componentes reutilizables.

## Casos de Uso
- Analistas deportivos que desean extraer insights tácticos de partidos.
- Entrenadores que buscan visualizar jugadas clave y estadísticas.
- Clubes que necesitan centralizar y digitalizar su información histórica.

## Estado Actual
- Backend y frontend funcionales, con importación y visualización de datos operativa.
- Base de datos lista para almacenar grandes volúmenes de información.
- Integración con video y eventos implementada.
- Listo para pruebas y validación con usuarios reales.

## Potencial de Negocio
- Escalable a otros deportes y mercados.
- Integración futura con IA para análisis avanzado.
- Posibilidad de ofrecer el sistema como SaaS a clubes y federaciones.

## Conclusión
VideoAnalysis representa una solución moderna y escalable para el análisis deportivo, combinando tecnología de punta con una interfaz amigable y procesos automatizados. El proyecto está listo para ser presentado a socios estratégicos y escalar a nuevos mercados.
