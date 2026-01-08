c# Credex Free Deployment Alternatives

Since Render is asking for a credit card, here are the best **truly free** alternatives that don't require one.

## Option 1: Railway (Best for Backend)
Railway often gives free credits without a card.

1.  **Sign Up**: Go to [railway.app](https://railway.app/) and login with GitHub.
2.  **Deploy Backend**:
    *   Click **New Project** -> **Deploy from GitHub repo**.
    *   Select `credex-app`.
    *   Click **Add Variables**.
    *   Add `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`.
    *   **Root Directory**: Go to Settings -> Root Directory and set it to `backend`.
3.  **Deploy BPP Server**:
    *   Repeat the process for `bpp-server`.
    *   Root Directory: `bpp-server`.
    *   Variables: `BPP_ID=credex-bpp`.
4.  **Link**: Get the URLs and update your Backend's `BPP_HOST` variable.

## Option 2: Glitch (Good for Testing)
Glitch is great for free Node.js hosting, but it sleeps after inactivity.

1.  Go to [glitch.com](https://glitch.com/).
2.  **New Project** -> **Import from GitHub**.
3.  Paste your repo URL.
4.  You might need to create separate Glitch projects for backend and bpp-server since it expects one package.json at the root.

## Option 3: Vercel (Best for Frontend)
Vercel is amazing for static sites and free forever.

1.  Go to [vercel.com](https://vercel.com/) and signup with GitHub.
2.  **Add New Project**.
3.  Import `credex-app`.
4.  **Root Directory**: Click Edit and select `frontend`.
5.  **Deploy**.
6.  It will give you a URL (e.g., `credex-app.vercel.app`).

---

## 💡 Recommended Setup for You
To avoid credit cards completely:

1.  **Backend + BPP**: Try **Railway** first. If they ask for a card, try **Glitch** or **Render (Manual Web Service)**.
    *   *Note*: Sometimes Render only asks for a card for "Blueprints" but allows "Web Services" for free. Did you try the **Manual Web Service** steps I sent earlier?
2.  **Frontend**: Use **Vercel**. It's faster and easier than Render for static sites.

### How to Deploy Frontend on Vercel
1.  Push your code to GitHub.
2.  Go to Vercel Dashboard -> Add New Project.
3.  Import `credex-app`.
4.  **Framework Preset**: Other.
5.  **Root Directory**: `frontend`.
6.  Click **Deploy**.
