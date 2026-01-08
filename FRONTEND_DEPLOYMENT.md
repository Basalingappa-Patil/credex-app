# Frontend Deployment Guide for Render

Now that your Backend and BPP Server are running, let's deploy the **Frontend**.

## Step 1: Create a New Static Site

1.  Go to your [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Static Site**.
3.  Select the same repository (`credex`).

## Step 2: Configure the Site

Fill in the following details:

*   **Name**: `credex-frontend` (or any name you prefer)
*   **Branch**: `master` (or `main`)
*   **Root Directory**: `frontend` (Important!)
*   **Build Command**: Leave empty (since it's just HTML/JS)
*   **Publish Directory**: `./` (or just leave default if it says `public`, but for us `./` inside `frontend` is correct. If Render asks for "Publish directory" relative to root, it might just be `.` if you set Root Directory to `frontend`. If you don't set Root Directory, it would be `frontend`).
    *   *Recommendation*: Set **Root Directory** to `frontend` and **Publish Directory** to `.` (dot).

## Step 3: Deploy

1.  Click **Create Static Site**.
2.  Render will deploy your HTML files immediately.

## Step 4: Connect Frontend to Backend

Once deployed, your frontend needs to know where your backend is hosted.

1.  **Get Backend URL**: Go to your **Backend** service in Render and copy the URL (e.g., `https://credex-backend.onrender.com`).
2.  **Update Config**:
    *   You cannot set environment variables for a simple Static Site in the browser to change the code dynamically (unless you use a build process).
    *   **Action Required**: You must edit `frontend/js/config.js` in your code.

    Open `frontend/js/config.js` locally and update it:

    ```javascript
    const CONFIG = {
        // Replace with your actual Render Backend URL
        API_URL: 'https://your-backend-service-name.onrender.com/api'
    };
    ```

3.  **Push Changes**:
    ```bash
    git add frontend/js/config.js
    git commit -m "Update API URL for production"
    git push origin master
    ```

4.  Render will detect the push and automatically redeploy your frontend with the correct connection.

## Step 5: Verification

1.  Open your new Frontend URL (e.g., `https://credex-frontend.onrender.com`).
2.  Try to **Sign Up** or **Login**.
3.  If it works, your full stack is live! 🚀

## Troubleshooting

*   **404 Not Found**: Ensure your **Root Directory** is set to `frontend`.
*   **API Errors**: Check the browser console (F12). If you see connection errors, double-check that `API_URL` in `config.js` matches your Backend URL exactly (including `/api` at the end).
*   **CORS Errors**: If the console says "CORS error", you might need to check your Backend logs. (We already configured CORS to allow all origins, so this should be rare).
