# Credex Comprehensive Deployment Guide

This guide explains exactly how to deploy your application to Render for free.

## ❓ Common Questions

### What about `node_modules`?
*   **We DO NOT upload `node_modules`**: You will notice we added `node_modules/` to a file called `.gitignore`. This tells Git to ignore that folder.
*   **Why?**: `node_modules` contains thousands of files that are specific to your computer (Windows). The server (Linux) needs its own version.
*   **How does Render get them?**: When you deploy, Render sees your `package.json` file. It automatically runs `npm install` (the "Build Command") to download and install fresh, compatible `node_modules` directly on the server.

---

## 🚀 Step-by-Step Deployment

### Phase 1: Push Your Code
First, we need to make sure your code (without `node_modules`) is on GitHub.

1.  **Check Status**:
    ```bash
    git status
    ```
    It should say "nothing to commit, working tree clean". If not, run:
    ```bash
    git add .
    git commit -m "Ready for deployment"
    ```

2.  **Push to GitHub**:
    ```bash
    git push origin master
    ```
    *   Go to your GitHub repository in your browser.
    *   Verify you see folders like `backend`, `frontend`, `bpp-server`.
    *   Verify you **DO NOT** see `node_modules`.

---

### Phase 2: Deploy the Backend (The Brain)
The backend handles the logic and database.

1.  Log in to [dashboard.render.com](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your `credex-app` repository.
4.  **Name**: Enter `credex-backend`.
5.  **Region**: Choose the one closest to you (e.g., Singapore or Frankfurt).
6.  **Branch**: `master`.
7.  **Root Directory**: Enter `backend`.
    *   *Explanation*: This tells Render that your backend code lives inside the `backend` folder, not at the top.
8.  **Runtime**: `Node`.
9.  **Build Command**: `npm install`.
    *   *Explanation*: This installs the dependencies (creates the `node_modules` on the server).
10. **Start Command**: `npm start`.
    *   *Explanation*: This runs `node server.js` to start your app.
11. **Instance Type**: Select **Free**.
12. **Environment Variables** (Scroll down to "Advanced"):
    *   Click **Add Environment Variable**.
    *   Key: `NODE_ENV` | Value: `production`
    *   Key: `JWT_SECRET` | Value: `supersecretkey123` (or any random text)
    *   Key: `MONGODB_URI` | Value: `your_mongodb_connection_string`
        *   *Note*: Get this from MongoDB Atlas. It looks like `mongodb+srv://user:pass@cluster...`
13. Click **Create Web Service**.
14. **Wait**: It will take 2-3 minutes. Once it says "Live", look for the URL at the top (e.g., `https://credex-backend.onrender.com`). **Copy this URL.**

---

### Phase 3: Deploy the BPP Server (The Network)
This connects your app to the Beckn network.

1.  Click **New +** -> **Web Service**.
2.  Connect `credex-app` again.
3.  **Name**: `credex-bpp-server`.
4.  **Root Directory**: `bpp-server`.
5.  **Runtime**: `Node`.
6.  **Build Command**: `npm install`.
7.  **Start Command**: `npm start`.
8.  **Instance Type**: **Free**.
9.  **Environment Variables**:
    *   Key: `BPP_ID` | Value: `credex-bpp`
10. Click **Create Web Service**.
11. **Wait**: Once "Live", **Copy the URL** (e.g., `https://credex-bpp-server.onrender.com`).

---

### Phase 4: Connect Backend to BPP
Now tell the Backend where the BPP Server is.

1.  Go to your **Backend** service dashboard on Render.
2.  Click **Environment** on the left.
3.  Click **Add Environment Variable**.
4.  Key: `BPP_HOST`
5.  Value: `credex-bpp-server.onrender.com`
    *   *Important*: Paste the BPP URL **without** `https://` and **without** any slashes `/`. Just the domain.
6.  Click **Save Changes**. The backend will automatically restart to apply this change.

---

### Phase 5: Deploy the Frontend (The Face)
This is the website users will see.

1.  **Update Local Config**:
    *   Open `frontend/js/config.js` in VS Code.
    *   Paste your **Backend URL** (from Phase 2) there.
    ```javascript
    const CONFIG = {
        API_URL: 'https://credex-backend.onrender.com/api' // Make sure /api is at the end
    };
    ```
2.  **Push Change**:
    ```bash
    git add .
    git commit -m "Update API URL for production"
    git push
    ```
3.  **Deploy on Render**:
    *   Click **New +** -> **Static Site**.
    *   Connect `credex-app`.
    *   **Name**: `credex-frontend`.
    *   **Root Directory**: `frontend`.
    *   **Build Command**: Leave empty (we don't need to build anything for simple HTML/JS).
    *   **Publish Directory**: `./` (this means "current directory", i.e., `frontend`).
    *   **Instance Type**: **Free**.
4.  Click **Create Static Site**.

**Success!** Click the URL provided by the Static Site to view your live application.
