# Usa una imagen base de Python
FROM python:3.8

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia el archivo requirements.txt y lo instala
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Instala el paquete openai
RUN pip install openai

# Copia el resto del código de la aplicación al contenedor
COPY . .

# Expone el puerto en el que la aplicación se ejecutará
EXPOSE 5001

# Comando para ejecutar la aplicación
CMD ["python", "app.py"]