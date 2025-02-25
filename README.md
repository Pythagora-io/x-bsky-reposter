```markdown
# X -> Bluesky Reposter

This application automatically reposts your Twitter (X) posts onto BlueSky. It allows connecting multiple Twitter (X) accounts with multiple BlueSky accounts, viewing posts on both platforms, and detecting any missing reposts on BlueSky.

## Overview

The project is built with a split frontend and backend architecture:

- **Frontend**: Built with ReactJS, utilizing Vite for the development server. The frontend code resides in the `client/` folder and uses the Shadcn UI component library and Tailwind CSS for styling. It also features client-side routing with `react-router-dom` and runs on port 5173.
- **Backend**: Implemented using Express.js, this server handles REST API endpoints located in the `server/` folder. The backend communicates with a MongoDB database using Mongoose and includes JWT-based authentication. It runs on port 3000.

Concurrent execution of both the client and server is managed through a single command (`npm run start`).

### Project Structure

#### Frontend

- **`client/`**: The main folder containing the frontend code.
  - **`client/src`**: Source code for the frontend.
    - **`api/`**: Contains code for API requests.
    - **`components/`**: Reusable UI components.
    - **`contexts/`**: Context providers including authentication.
    - **`pages/`**: Various page components for routing.
  - **`index.css`**: Global CSS file incorporating Tailwind CSS styles.
  - **`vite.config.ts`**: Configuration file for the Vite development server.

#### Backend

- **`server/`**: The main folder containing the backend code.
  - **`api/`**: Implements REST API endpoints.
  - **`models/`**: Mongoose models for database schemas.
  - **`routes/`**: API route handlers.
  - **`services/`**: Service layer handling business logic.
  - **`utils/`**: Utility functions including password hashing and JWT token generation.
  - **`server.js`**: Entry point for the Express server.
  - **`config/database.js`**: MongoDB connection setup.
  - **`.env`**: Environment variables for configuration.

## Features

- **Twitter and BlueSky Account Management**: Connect multiple accounts from both platforms.
- **Automatic Reposting**: Automatically detect new tweets and repost them to BlueSky.
- **Post Sync Tracking**: View all posts on Twitter along with their corresponding reposts on BlueSky, highlighting any missing reposts.
- **Token-based Authentication**: Secure authentication and user session management.

## Getting started

### Requirements

- Node.js (version 14 or above)
- MongoDB (fully operational MongoDB instance)
- `npm` (Node Package Manager)

### Quickstart

1. **Clone the repository**:
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2. **Setup environment variables**:
    - Create a `.env` file in the `server/` directory with the following variables:
    ```sh
    PORT=3000
    DATABASE_URL=<your-mongo-db-url>
    JWT_SECRET=<your-jwt-secret>
    REFRESH_TOKEN_SECRET=<your-refresh-token-secret>
    TWITTER_CLIENT_ID=<your-twitter-client-id>
    TWITTER_CLIENT_SECRET=<your-twitter-client-secret>
    TWITTER_CALLBACK_URL=<your-callback-url>
    ```

3. **Install dependencies for both frontend and backend**:
    ```sh
    npm install
    cd client
    npm install
    cd ../server
    npm install
    ```

4. **Setup and run the application**:
    - Ensure MongoDB is running.
    - In the root directory, run the following command to start both frontend and backend:
    ```sh
    npm run start
    ```

5. **Access the application**:
    - Open a web browser and navigate to `http://localhost:5173`.

### License

Copyright (c) 2024.
```

This README file provides an overview, features, and step-by-step instructions to get the project up and running. Adjust the `<repository-url>` and any personal details where necessary.