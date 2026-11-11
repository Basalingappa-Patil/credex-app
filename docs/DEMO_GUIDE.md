# CredEx developer demo guide

**Status:** prototype walkthrough for local development. This is not a production deployment guide, security certification, or proof of Beckn/ONEST conformance.

## Before you start

Use a dedicated local or disposable MongoDB database containing synthetic records only. Do not use production credentials, real student records, uploaded certificates, or personal data for this walkthrough.

The current repository has important limitations that make an unrestricted public demo unsafe. Read [Known limitations and pilot blockers](KNOWN_LIMITATIONS.md) first. In particular, QR signature validation contains a placeholder that currently accepts signatures, public signup accepts a caller-supplied role (including `admin`), and several employer/verification routes are not protected by role-based authorization. Do not invite the public to create accounts or submit real credentials until these issues are fixed and independently tested.

## Components

- **Frontend:** static HTML/CSS/JavaScript in `frontend/`.
- **Backend:** Express API in `backend/`, with MongoDB persistence.
- **BPP:** separate Express service in `bpp-server/`, with issuer/student/subject/marks models and Beckn-style endpoints.

The configured production frontend currently points to a Vercel deployment. The checked-in frontend config defaults to `https://credex-backend.onrender.com/api` outside localhost. Confirm that these URLs still match the live services before relying on them.

## Local setup

Requirements: Node.js 22, npm, and a local/disposable MongoDB database.

1. Clone the repository and create local environment files from the examples:
   - `backend/.env.example` → `backend/.env`
   - `bpp-server/.env.example` → `bpp-server/.env`
2. Configure each service with a separate database name or a dedicated disposable database. Use a unique random `JWT_SECRET` of at least 32 bytes for the backend.
3. Install and start the backend:

   ```bash
   cd backend
   npm ci
   npm start
   ```

   The backend health endpoint is `GET /api/health`.

4. In a second terminal, install and start the BPP:

   ```bash
   cd bpp-server
   npm ci
   npm start
   ```

   The BPP health endpoint is `GET /health`.

5. Open the frontend through the backend's static hosting, or use a static server and ensure `frontend/js/config.js` points to the local backend API.

## Synthetic BPP verification walkthrough

The repository includes a small synthetic university dataset and a direct service test:

- `bpp-server/scripts/seed_university_data.js`
- `bpp-server/scripts/test_verify.js`

The seed script currently deletes all documents from the BPP `Student`, `Subject`, and `StudentMark` collections before inserting its fixture. **Never run it against production or any database containing real records.** It also currently loads dotenv from a relative path that should be checked against the shell's working directory before running.

The fixture represents a fictional test student, `STU001`, with a React-related subject and a mark of 78. The test script calls the BPP verification service for that synthetic record. This demonstrates the repository's current local service logic only; it does not establish a real university integration, trusted issuer relationship, cryptographic credential verification, or standards conformance.

## API exploration

The backend API reference is in [backend/API_DOCUMENTATION.md](../backend/API_DOCUMENTATION.md). Treat it as a starting point, not a complete contract: some examples and port numbers may be stale relative to current code. Confirm actual routes and payloads in `backend/routes/` before building an integration.

The BPP exposes these Beckn-style routes under `/beckn`:

- `POST /search`
- `POST /select`
- `POST /init`
- `POST /confirm`
- `POST /status`

Use synthetic identifiers and payloads only.

## What a successful demo should prove

Record evidence for each item rather than assuming it works:

- [ ] Backend starts with required environment variables and connects to the disposable database.
- [ ] BPP starts and connects to the disposable database.
- [ ] Frontend loads and reaches the intended backend.
- [ ] Candidate registration/login works in the isolated environment after role controls are fixed.
- [ ] A synthetic student/subject/marks fixture produces the expected BPP verification response.
- [ ] A Beckn request/callback round trip is captured with request IDs, timestamps, and redacted payloads.
- [ ] Failure cases (unknown student, unknown skill, no matching marks, invalid signature, unavailable callback URL) return safe and explainable errors.

Do not describe the workflow as end-to-end verified until the checklist has been executed and evidence retained. Do not present synthetic verification as verification of a real person's qualification.
