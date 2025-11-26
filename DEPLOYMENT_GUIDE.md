# Credex Deployment Guide for Render

This guide will walk you through deploying your Credex application (Backend, BPP Server, and Frontend) to Render using the `render.yaml` Blueprint we created.

## Prerequisites

1.  **GitHub Account**: You need a GitHub account.
2.  **Render Account**: Sign up at [render.com](https://render.com) using your GitHub account.
3.  **Git Installed**: Ensure Git is installed on your local machine.

## Step 1: Push Your Code to GitHub

If you haven't already, you need to push your code to a GitHub repository.

1.  Initialize Git (if not already done):
    ```bash
    git init
    ```
2.  Add all files:
    ```bash
    git add .
    ```
3.  Commit your changes:
    ```bash
    git commit -m "Prepare for Render deployment"
    ```
4.  Create a new repository on GitHub.
5.  Link your local repository to GitHub:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    ```
6.  Push your code:
    ```bash
    git push -u origin master
    ```

## Step 2: Deploy to Render

1.  **Log in to Render**.
2.  Click on the **"New +"** button and select **"Blueprint"**.
3.  Connect your GitHub account if you haven't already.
4.  Select the repository you just pushed.
5.  **Service Group Name**: Enter a name for your project (e.g., `credex-deployment`).
6.  **Environment Variables**:
    *   Render will detect the services defined in `render.yaml`.
    *   You will see a prompt to enter `MONGODB_URI` for the `credex-backend` service.
    *   **Action Required**: Enter your MongoDB connection string (e.g., from MongoDB Atlas).
7.  Click **"Apply Blueprint"**.

## Step 3: Final Configuration

Render will now start deploying your services.

1.  **Wait for Deployment**: It may take a few minutes for all services to build and deploy.
2.  **Update Frontend Configuration**:
    *   Once the **Backend** service is live, copy its URL (e.g., `https://credex-backend.onrender.com`).
    *   Go to your GitHub repository.
    *   Edit `frontend/js/config.js`.
    *   Update the `API_URL` to point to your deployed backend:
        ```javascript
        const CONFIG = {
            API_URL: 'https://credex-backend.onrender.com/api' // Replace with your actual Backend URL
        };
        ```
    *   Commit the change.
    *   Render will automatically redeploy the frontend with the new configuration.

## Troubleshooting

*   **Build Failed**: Check the logs in the Render dashboard for the specific service.
*   **CORS Errors**: Ensure your Backend allows requests from your Frontend URL. You might need to update the `cors` configuration in `backend/server.js` if it's too restrictive.
*   **Database Connection**: Double-check your `MONGODB_URI`. Ensure your IP is whitelisted in MongoDB Atlas (allow access from anywhere `0.0.0.0/0` for Render).

## Architecture Overview

*   **credex-backend**: Node.js API handling user data and verification logic.
*   **credex-bpp-server**: Node.js server for Beckn Protocol integration.
*   **credex-frontend**: Static HTML/JS site serving the user interface.

You are now live! 🚀
