# VideoAnalysis - Guía de Configuración

## 🎯 Dos Modos de Operación

Este proyecto soporta dos configuraciones para trabajar en paralelo:

### 1. 🚀 DEMO RÁPIDO (SQLite) - Para presentaciones
**Ventajas:**
- ✅ Setup en 2 minutos
- ✅ No necesita servicios externos
- ✅ Perfecto para demos y conferencias
- ✅ Base de datos en un solo archivo

**Cómo usar:**
```bash
# 1. Levantar servicios (SQLite por defecto)
docker-compose up -d

# 2. Inicializar base de datos
docker-compose exec backend python init_db.py

# 3. Acceder a la app
# Frontend: http://localhost:3000
# Backend: http://localhost:5001
```

### 2. 🏗️ DESARROLLO COMPLETO (PostgreSQL) - Para trabajo continuo
**Ventajas:**
- ✅ Base de datos robusta (PostgreSQL)
- ✅ Múltiples conexiones simultáneas
- ✅ Mejor para producción
- ✅ Transacciones ACID completas

**Cómo usar:**
```bash
# 1. Editar docker-compose.yml:
#    - Descomentar el servicio 'db' (líneas ~30-40)
#    - Descomentar 'depends_on: - db' en backend
#    - Descomentar la línea DATABASE_URL en backend.environment
#    - Descomentar 'volumes: postgres_data' al final

# 2. Levantar servicios
docker-compose up -d

# 3. Inicializar base de datos
docker-compose exec backend python init_db.py

# 4. Acceder a la app
# Frontend: http://localhost:3000
# Backend: http://localhost:5001
# PostgreSQL: localhost:5432
```

## 📊 Importar Datos

### Opción A: Interfaz Web
1. Ir a http://localhost:3000/import
2. Seleccionar archivo XML (LongoMatch format)
3. Completar información del partido
4. Agregar URL del video
5. Importar

### Opción B: Script directo
```bash
# Editar backend/scripts/import_emergency_pescara.py con tus datos
docker-compose exec backend python scripts/import_emergency_pescara.py
```

## 🔄 Cambiar entre SQLite y PostgreSQL

### De SQLite a PostgreSQL:
1. Editar `docker-compose.yml` (descomentar sección PostgreSQL)
2. `docker-compose down`
3. `docker-compose up -d`
4. `docker-compose exec backend python init_db.py`

### De PostgreSQL a SQLite:
1. Editar `docker-compose.yml` (comentar sección PostgreSQL)
2. Comentar `DATABASE_URL` en backend.environment
3. `docker-compose down`
4. `docker-compose up -d`

## 📁 Archivos de Base de Datos

- **SQLite:** `backend/videoanalysis_demo.db` (se crea automáticamente)
- **PostgreSQL:** Volumen Docker `postgres_data`

## 🆘 Troubleshooting

### Frontend no inicia:
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Backend no conecta a DB:
```bash
# Ver logs
docker-compose logs backend

# Verificar que init_db.py se ejecutó
docker-compose exec backend python init_db.py
```

### Reiniciar todo:
```bash
docker-compose down
rm backend/videoanalysis_demo.db  # Solo si usas SQLite
docker-compose up -d
docker-compose exec backend python init_db.py
```

## 📝 Notas

- El archivo SQLite se persiste en `backend/videoanalysis_demo.db`
- Puedes tener ambas configuraciones en paralelo usando diferentes carpetas
- Para producción, se recomienda PostgreSQL
- Para demos/conferencias, SQLite es más que suficiente
