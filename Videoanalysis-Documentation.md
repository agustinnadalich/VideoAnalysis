# VideoAnalysis - Documentación Completa

## Objetivo del Proyecto

**VideoAnalysis** es una plataforma web para el análisis táctico y estadístico de partidos deportivos a partir de videos y eventos etiquetados.  
No realizamos el etiquetado en origen, sino que trabajamos con datos exportados desde herramientas como *LongoMatch*, *Sportscode* o *Nacsport*.  
Nuestra función es representar esos datos de forma clara, visual e interactiva, conectando la información estadística con los fragmentos de video correspondientes.

---

## Visualización avanzada del rendimiento

- Estadísticas individuales y colectivas.
- Filtrado dinámico de jugadas (por jugador, tipo de acción, fase del juego, etc.).
- Reproducción directa de cada evento etiquetado en el video.
- Mapas de calor y distribución geográfica de eventos sobre la cancha.
- Dashboard por club, con acceso a reportes individuales o combinados.

---

## Análisis Multi-Partido (acumulado)

Una de las herramientas más potentes es el **reporte Multi-Partido**, que permite seleccionar varios encuentros (una temporada, una gira, una fase del campeonato) para analizar tendencias, detectar patrones repetidos y diferenciar comportamientos aislados de problemas estructurales.  
Esta visión acumulada es clave para la toma de decisiones informadas.

---

## Datos físicos y GPS

Cuando se cuenta con datos provenientes de GPS o sensores, la plataforma también permite visualizar y cruzar estadísticas físicas:

- Velocidades y aceleraciones.
- Impactos y zonas de contacto.
- Distancia recorrida total y en alta intensidad.
- Cargas de trabajo por jugador y por equipo.

---

## Multi-equipo y gestión de accesos

Cada club puede tener múltiples equipos (categorías) bajo un mismo dashboard. El sistema permite configurar accesos personalizados según el rol del usuario:

- El director técnico (DT) puede ver todos los partidos y categorías del club.
- Entrenadores específicos acceden solo a su categoría.
- Jugadores ven únicamente los partidos en los que participaron.
- Se pueden generar reportes comparativos entre distintas categorías del mismo club.

Toda la información es **completamente privada** y de ninguna manera accesible por otros clubes.

---

## Clientes individuales

VideoAnalysis también está pensado para **jugadores individuales** que tengan sus propios análisis.  
Podrán seguir su progreso a lo largo de la temporada, visualizar y descargar videos con todas sus acciones (tackles, tries, patadas, etc.) y gestionar sus estadísticas de forma privada.

---

## Servicio de etiquetado

Además del uso autónomo, ofrecemos un servicio complementario en el que el club o entrenador nos envía el video, y nuestro equipo se encarga del **etiquetado completo** y la carga de datos en la plataforma, listo para su análisis.

---

## Futuras funciones

Estamos trabajando en nuevas herramientas como:

- **Generación automática de videos filtrados** a partir de los reportes.
- **Herramientas de marcación sobre el video**, para que entrenadores puedan destacar, pausar o explicar acciones directamente desde la plataforma.
- **Asistente IA especializado en rugby**, que ofrecerá análisis y reportes automatizados para detectar patrones y oportunidades de mejora.

---

## ¿Para quién es VideoAnalysis?

Está diseñada para **clubes, entrenadores y cuerpos técnicos** que deseen analizar el rendimiento de forma clara, profunda y visual.  
También permite **compartir reportes filtrados** con jugadores, y eventualmente publicar una vista limitada para seguidores y fanáticos del club a través del sitio web oficial.  
Además, los **jugadores individuales** pueden usar la plataforma para gestionar su evolución y rendimiento personal.



## Descripción General

El sistema está compuesto por un **frontend** en React y un **backend** en Flask. El frontend permite la interacción visual con los datos y el video, mientras que el backend expone una API para servir los eventos y manejar la lógica de negocio.

---

## Estructura del Proyecto

```
VideoAnalysis/
├── backend/
│   ├── uploads/                # Videos y archivos de datos subidos para análisis
│   │   ├── SDV_1003.mp4
│   │   ├── Archivos de ejemplo de partidos.json/xlsx/xml
│   │   └── ...
│   ├── app.py                  # Backend principal (Flask)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── build/                  # Archivos generados por React build (para producción)
│   ├── public/                 # Archivos públicos y recursos estáticos
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   ├── SBvsLIONS.mp4
│   │   ├── Cancha Rugby.JPG
│   │   ├── CANCHA-CORTADA.jpg
│   │   ├── Archivos de ejemplo de partidos.json/xlsx/xml
│   │   └── ...otros recursos y videos
│   ├── src/                    # Código fuente principal de React
│   │   ├── components/         # Componentes reutilizables (Charts, Sidebar, VideoPlayer, MatchReport, etc)
│   │   │   ├── charts/         # Subcarpeta de componentes de gráficos
│   │   │   ├── Sidebar.js
│   │   │   ├── VideoPlayer.js
│   │   │   ├── MatchReportLeft.js
│   │   │   ├── MatchReportRight.js
│   │   │   └── ...otros componentes
│   │   ├── context/            # Contextos globales (filtros, etc)
│   │   ├── services/           # Lógica de acceso a APIs
│   │   ├── pages/              # Páginas principales (Dashboard, VideoAnalysisPage, MultiMatchReportPage)
│   │   ├── App.js              # Componente raíz de la app
│   │   ├── index.js            # Punto de entrada de React
│   │   └── ...otros archivos fuente y estilos
│   ├── package.json            # Dependencias y scripts del frontend
│   ├── README.md               # Documentación específica del frontend
│   └── ...otros archivos de configuración (.gitignore, Dockerfile, etc)
├── docker-compose.yml          # Orquestación de servicios
└── README.md                   # Instrucciones rápidas
└── Videoanalysis-Documentation.md                  
```

---

## Rutas y Endpoints

### Frontend

- `/` : Dashboard principal
- `/analysis/:id` : Página de análisis de un partido específico

### Backend (Flask)

- `GET /events?match_id=<id>` : Devuelve los eventos del partido con ese ID
- (Puedes agregar más endpoints según necesidades futuras)

---

## Principales Componentes

- **VideoPlayer**: Reproduce el video y permite saltar a eventos específicos.
- **Sidebar**: Permite filtrar eventos por tipo, jugador, tiempo, etc.
- **Charts**: Visualizaciones de datos (barras, tortas, timeline, etc).
- **MatchReportLeft/Right**: Estadísticas y reportes rápidos.
- **FilterProvider**: Contexto global para filtros.

---

## Cómo Ejecutar el Proyecto

1. Clona el repositorio y entra en la carpeta.
2. Descarga el video `SBvsLIONS.mp4` y colócalo en `frontend/public`.
3. Construye y levanta los servicios con Docker:
    ```sh
    docker-compose build
    docker-compose up
    ```
4. Accede a `http://localhost:3000` para el frontend y `http://localhost:5001/events` para el backend.

---

## Cosas por Hacer (TODO)

- [ ] Mejorar la documentación de endpoints y ejemplos de payloads.
- [ ] Agregar autenticación de usuarios.
- [ ] Permitir subir nuevos videos y eventos desde el frontend.
- [ ] Mejorar la visualización de estadísticas avanzadas.
- [ ] Internacionalización (i18n) y soporte multilenguaje.
- [ ] Tests automáticos para frontend y backend.
- [ ] Optimizar el rendimiento para videos largos.
- [ ] Mejorar la experiencia móvil.

---

## Notas y Consejos

- El video principal no se incluye por tamaño, debe descargarse aparte.
- Si tienes problemas, revisa los logs de los contenedores Docker.
- Puedes modificar los componentes en `frontend/src/components` para personalizar visualizaciones.

---

## Créditos

Desarrollado por Agustin y colaboradores.  
Para dudas o sugerencias, contacta al equipo de desarrollo.

---