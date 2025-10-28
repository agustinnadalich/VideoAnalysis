# VideoAnalysis Project

## Requirements

- Docker
- Docker Compose

## Instructions to Run the Project

1. Clone the repository:

    ```sh
    git clone <your-repository-url>
    cd <your-repository-directory>
    ```

2. Place the video file `SBvsLIONS.mp4` in the `frontend/public` directory. You can download the video file from the link provided separately. 

Link to download (https://drive.google.com/file/d/1vM4BgL9VO7yC5cKg2N4HdBJLyxob31vc/view?usp=sharing )

3. Build and run the containers:

    ```sh
    docker-compose build
    docker-compose up
    ```

4. Open your web browser and navigate to `http://localhost:3000` to verify that the frontend application is running.

5. Verify that the backend is running by accessing `http://localhost:5001/events`.

## Project Structure

- `frontend/`: Source code for the frontend application.
- `backend/`: Source code for the backend application.
- `Dockerfile`: Dockerfile to build Docker images.
- `docker-compose.yml`: Docker Compose configuration file.
- `requirements.txt`: Dependencies for the backend.

## Additional Notes

- The video file `SBvsLIONS.mp4` is not included in the repository due to its size. Please download it separately and place it in the `frontend/public` directory.
- If you encounter any issues, please check the logs for both the frontend and backend containers to debug.

---

## Guía de trabajo con ramas

### Flujos recomendados

#### 1. Trabajar en el MVP (nueva versión)
- Cambia a la rama base_de_datos:
  ```bash
  git checkout base_de_datos
  ```
- Trabaja normalmente, haz commits y push.
- Para levantar el entorno completo (con base de datos):
  ```bash
  docker-compose -f docker-compose.db.yml up
  ```

#### 2. Preparar una presentación urgente
- Guarda tus cambios (commit y push) en base_de_datos.
- Cambia a la rama main:
  ```bash
  git checkout main
  ```
- Haz los cambios rápidos para la presentación (importar datos, cambiar video, etc).
- Haz commit y push en main.
- Para levantar el entorno simple (sin base de datos):
  ```bash
  docker-compose up
  ```
- Cuando termines, vuelve a base_de_datos:
  ```bash
  git checkout base_de_datos
  ```

### Consejos
- Siempre haz commit y push antes de cambiar de rama para no perder trabajo.
- Si necesitas actualizar el link del video, edita el archivo `backend/uploads/matchesPescara.json` y haz commit/push para que se redeploye en producción.
- Consulta este README cada vez que tengas dudas sobre el flujo de trabajo.