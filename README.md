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