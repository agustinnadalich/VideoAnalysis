-- Migración para cambiar timestamp_sec de INTEGER a FLOAT
-- Ejecutar este script en la base de datos para actualizar el esquema

-- Paso 1: Agregar nueva columna temporal
ALTER TABLE Events ADD COLUMN timestamp_sec_temp FLOAT;

-- Paso 2: Copiar datos existentes convirtiéndolos a FLOAT
UPDATE Events SET timestamp_sec_temp = timestamp_sec::FLOAT;

-- Paso 3: Eliminar la columna antigua
ALTER TABLE Events DROP COLUMN timestamp_sec;

-- Paso 4: Renombrar la nueva columna
ALTER TABLE Events RENAME COLUMN timestamp_sec_temp TO timestamp_sec;

-- Verificar el cambio
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'events' AND column_name = 'timestamp_sec';
