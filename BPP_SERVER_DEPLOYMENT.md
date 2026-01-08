# BPP Server Deployment Guide for Render

Since you have already deployed the Backend, here are the specific steps to deploy the **BPP Server**.

## Step 1: Create a New Web Service

1.  Go to your [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Select the same repository you used for the backend (`credex` or similar).

## Step 2: Configure the Service

Fill in the following details:

*   **Name**: `credex-bpp-server` (or any name you prefer)
*   **Region**: Choose the same region as your Backend (e.g., Singapore, Oregon).
*   **Branch**: `master` (or `main`)
*   **Root Directory**: `bpp-server` (Important!)
*   **Runtime**: `Node`
*   **Build Command**: `npm install`
*   **Start Command**: `npm start`

## Step 3: Environment Variables

Scroll down to the **Environment Variables** section and add the following:

| Key | Value |
| :--- | :--- |
| `PORT` | `6001` (or any port, Render will override this internally but good to set) |
| `NODE_ENV` | `production` |
| `BPP_ID` | `credex-bpp` |
| `BPP_URI` | Leave empty for now, or put `https://your-bpp-server-name.onrender.com/beckn` once you know the URL. |

> **Note:** Since we updated the code, `dotenv` is optional, so you don't need to worry about `.env` errors if you don't have other secrets.

## Step 4: Deploy

1.  Click **Create Web Service**.
2.  Render will start building your BPP Server.
3.  Watch the logs. It should run `npm install` inside the `bpp-server` folder and then start the server.

## Step 5: Verification

Once deployed, you will see a URL like `https://credex-bpp-server.onrender.com`.

1.  Test the health endpoint:
    `https://credex-bpp-server.onrender.com/health`
2.  You should see a JSON response: `{"status":"active","service":"BPP",...}`

## Step 6: Connect to Backend (Optional)

If your Backend needs to talk to this BPP Server (e.g., for callbacks), you might need to update your **Backend's** environment variables with this new BPP URL.

1.  Go to your **Backend** service on Render.
2.  Go to **Environment**.
3.  Add/Update `BPP_URI` (if your backend uses it) to `https://credex-bpp-server.onrender.com`.
