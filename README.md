# Edle Ultraanzeige, wie warm das Wasser auf dem Ofen ist

## Overview
Brief overview of the project.

## config.json
the `config.json` in root dir should be filled. This config should be copied to `frontend/src/config.json`

## Backend Setup
1. Navigate to the `/backend` directory.
2. Install the required Python packages using the following command:
    ```bash
    pip install -r requirements.txt
    ```
3. Start the Python backend server:
    ```bash
    python main.py
    ```

## Frontend Setup
1. Navigate to the `/frontend` directory.
2. Install the required Node.js packages using npm or yarn:
    ```bash
    npm install
    # or
    yarn install
    ```
3. Start the frontend development server:
    ```bash
    npm start
    # or
    yarn start
    ```

## Accessing the Application
Once the backend and frontend servers are running, you can access the application in your web browser:

- Frontend: http://localhost:3000
- Backend: http://localhost:8889

## client start
```
cd client
docker-compose -f docker-compose\ client.yaml up --build
``

## Additional Notes
Add any additional notes or instructions here.
