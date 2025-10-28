# Usa una imagen base de Node.js
FROM node:18

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia solo package.json y package-lock.json para optimizar la instalación
COPY package*.json ./

# Fuerza la instalación de dependencias con la opción --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Copia el resto del código después de instalar dependencias
COPY . .

# Copia el archivo de configuración de Babel
COPY .babelrc ./

# Copia el archivo de configuración de Webpack
COPY webpack.config.js ./

# Verifica que node_modules se creó correctamente
RUN ls -la node_modules && npm list --depth=0

# Establece la variable de entorno para solucionar el problema de OpenSSL
ENV NODE_OPTIONS=--openssl-legacy-provider

# Expone el puerto de la aplicación
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npx", "react-scripts", "start"]