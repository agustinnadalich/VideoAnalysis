# Guía de trabajo con ramas - VideoAnalysis

## Resumen del problema resuelto

Teníamos dos versiones del proyecto que necesitaban coexistir:
1. **main**: Versión simple para presentaciones (JSON directo, sin DB)
2. **base_de_datos**: MVP avanzado (PostgreSQL, importación, features completas)

### Problema encontrado
Al cambiar de `main` a `base_de_datos`, el frontend no levantaba porque:
- `base_de_datos` usa **Vite + TypeScript** (moderno)
- `main` usa **Create React App** (simple, viejo)
- Docker estaba intentando usar react-scripts en lugar de Vite
- Faltaba la variable `DATABASE_URL` para el backend

### Solución implementada

#### 1. Docker Compose separados
- **main**: `docker-compose.yml` (backend + frontend simple)
- **base_de_datos**: `docker-compose.db.yml` (backend + frontend + PostgreSQL)

#### 2. Configuración corregida en `docker-compose.db.yml`
```yaml
services:
  backend:
    environment:
      - DATABASE_URL=postgresql://videoanalysis:videoanalysis@db:5432/videoanalysis
  
  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules  # ⚠️ IMPORTANTE: Volumen anónimo para evitar conflictos
```

## Flujo de trabajo diario

### Trabajar en MVP (base_de_datos)

```bash
# 1. Cambiar a la rama
git checkout base_de_datos

# 2. Levantar el entorno completo
docker-compose -f docker-compose.db.yml up -d

# 3. Ver logs si es necesario
docker-compose -f docker-compose.db.yml logs -f

# 4. Acceder a:
#    Frontend: http://localhost:3000
#    Backend:  http://localhost:5001
#    Database: localhost:5432
```

### Preparar presentación urgente (main)

```bash
# 1. Guardar trabajo en base_de_datos
git add . && git commit -m "save: trabajo en progreso"
git push origin base_de_datos

# 2. Cambiar a main
git checkout main

# 3. Levantar entorno simple
docker-compose up -d

# 4. Hacer cambios para la presentación
#    - Actualizar JSON en backend/uploads/
#    - Cambiar VIDEO_URL si es necesario

# 5. Guardar y deployar
git add . && git commit -m "update: presentación [nombre]"
git push origin main

# 6. Volver a base_de_datos cuando termines
git checkout base_de_datos
docker-compose -f docker-compose.db.yml up -d
```

## Diferencias clave entre ramas

| Aspecto | main | base_de_datos |
|---------|------|---------------|
| **Frontend** | CRA (react-scripts) | Vite + TypeScript |
| **Backend** | Flask simple | Flask + SQLAlchemy |
| **Base de datos** | ❌ No usa | ✅ PostgreSQL |
| **Importación** | Manual (JSON) | Avanzada (Excel, XML) |
| **Docker Compose** | `docker-compose.yml` | `docker-compose.db.yml` |
| **Puerto frontend** | 3000 | 3000 |
| **Puerto backend** | 5001 | 5001 |
| **Puerto DB** | - | 5432 |

## Comandos útiles

### Ver estado de los servicios
```bash
docker-compose -f docker-compose.db.yml ps
```

### Ver logs de un servicio específico
```bash
docker-compose -f docker-compose.db.yml logs frontend -f
docker-compose -f docker-compose.db.yml logs backend -f
```

### Reiniciar un servicio
```bash
docker-compose -f docker-compose.db.yml restart backend
```

### Detener todo
```bash
docker-compose -f docker-compose.db.yml down
```

### Rebuild completo (si hay cambios en Dockerfile)
```bash
docker-compose -f docker-compose.db.yml build --no-cache
docker-compose -f docker-compose.db.yml up -d
```

## Troubleshooting

### Frontend no levanta
```bash
# Rebuild del frontend
docker-compose -f docker-compose.db.yml build --no-cache frontend
docker-compose -f docker-compose.db.yml up -d
```

### Backend no se conecta a la DB
```bash
# Verificar que DATABASE_URL esté en docker-compose.db.yml
# Reiniciar servicios
docker-compose -f docker-compose.db.yml down
docker-compose -f docker-compose.db.yml up -d
```

### Conflictos de node_modules
```bash
# Ya está resuelto con el volumen anónimo
# Si persiste, eliminar node_modules local:
rm -rf frontend/node_modules
docker-compose -f docker-compose.db.yml build --no-cache frontend
```

## Actualizar VIDEO_URL (presentaciones)

Cuando el video expire (cada 12 horas):

```bash
# 1. Ir a main
git checkout main

# 2. Editar backend/uploads/matchesPescara.json
# Cambiar el campo VIDEO_URL con el nuevo link firmado

# 3. Commit y push
git add backend/uploads/matchesPescara.json
git commit -m "update: nuevo VIDEO_URL"
git push origin main

# 4. OnRender redeploya automáticamente (~5 min)

# 5. Volver a base_de_datos
git checkout base_de_datos
```

## Resumen visual

```
main (presentaciones)
├── frontend (CRA)
├── backend (Flask simple)
└── JSON files
    ↓
    docker-compose up
    ↓
    localhost:3000 (demo simple)

base_de_datos (MVP)
├── frontend (Vite + TS)
├── backend (Flask + SQLAlchemy)
└── PostgreSQL
    ↓
    docker-compose -f docker-compose.db.yml up
    ↓
    localhost:3000 (app completa)
```

## Notas importantes

⚠️ **Siempre hacer commit antes de cambiar de rama**
⚠️ **Usar el docker-compose correcto para cada rama**
⚠️ **No mezclar cambios de una rama en otra sin merge consciente**
⚠️ **El volumen anónimo de node_modules es crítico para que funcione**

---

**Última actualización**: 28 de octubre de 2025
**Creado por**: Agustin con ayuda de Copilot
