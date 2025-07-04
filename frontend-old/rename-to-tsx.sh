find ./src -type f -name "*.js" | while read file; do
  # Si el archivo está en components, pages, hooks, context, lo pasamos a .tsx
  if [[ "$file" == *"/components/"* || "$file" == *"/pages/"* || "$file" == *"/hooks/"* || "$file" == *"/context/"* ]]; then
    mv "$file" "${file%.js}.tsx"
  else
    # Si no, lo pasamos a .ts (por ejemplo, utils, lib, etc)
    mv "$file" "${file%.js}.ts"
  fi
done

# Haz lo mismo para archivos .jsx
find ./src -type f -name "*.jsx" | while read file; do
  mv "$file" "${file%.jsx}.tsx"
done