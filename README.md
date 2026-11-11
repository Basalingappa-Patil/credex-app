# CredEx — Beckn-Based Skill Verification Network

CredEx is a skill and credential verification application intended to connect candidates, educational institutions, and employers through structured verification workflows. This repository contains a browser-based frontend, a Node.js/Express backend, and a separate Beckn Provider Platform (BPP) service.

> **Project status:** Prototype / active development. Protocol conformance, security, deployment reliability, and production readiness must be independently validated before use with real credentials or personal data. This README describes the code currently present in this repository; it does not claim third-party adoption or certification.

## Project goals

- Provide candidate-facing account and skill-profile workflows.
- Support employer-facing credential and skill verification flows.
- Maintain academic and skill evidence in a MongoDB-backed service.
- Expose backend APIs for credential and skill verification.
- Explore Beckn-style BAP/BPP interactions and ONEST-related use cases.
- Return verification outcomes with supporting evidence and qualification mapping where available.

## Architecture

```text
 Candidate / Employer / Admin
             |
             v
      Browser Frontend
      (HTML, CSS, JavaScript)
             |
             v
    Backend API (Express)
      |        |        |
     Auth  Verification BAP / Beckn
      |        |        |
      +--------+--------+
               |
            MongoDB

       Beckn network callbacks
               ^
               |
       BPP service (Express)
               |
       Provider / issuer data
```

The BAP and BPP are separate Node.js applications. The source includes Express routes, MongoDB models, verification services, QR-related workflows, and Beckn request/callback handlers. See the implementation and API documentation for the exact endpoints and payloads currently available.

## Repository layout

```text
credex-app/
├── backend/       # Express API, authentication, models and services
├── bpp-server/    # Beckn Provider Platform and callback handlers
├── frontend/      # HTML, CSS and browser-side JavaScript
├── js/            # Supporting JavaScript
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## Technology

- JavaScript and Node.js
- Express
- MongoDB and Mongoose
- HTML, CSS and browser JavaScript
- Beckn-style BAP/BPP request and callback flows
- Supporting libraries declared in each service's `package.json`

## Prerequisites

- Node.js 22 or a compatible supported version
- npm
- A MongoDB instance
- Environment configuration for each service you run

## Local development

Clone the repository:

```bash
git clone https://github.com/Basalingappa-Patil/credex-app.git
cd credex-app
```

### Backend API

```bash
cd backend
npm ci
```

Copy `.env.example` to `.env` and set values for your local environment. At minimum:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/skillverify
JWT_SECRET=generate-a-unique-secret-of-at-least-32-bytes
```

Generate a random local JWT secret with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Start the backend:

```bash
npm start
```

The health endpoint is `/api/health` when the backend is running.

### Beckn Provider Platform

In a second terminal:

```bash
cd bpp-server
npm ci
```

Copy `.env.example` to `.env`. Configure at least `MONGODB_URI`; the BPP server exits during startup if it is missing. Set `PORT`, `BPP_ID`, and `BPP_URI` to match your local or deployed environment.

Start the BPP service:

```bash
npm start
```

The BPP health endpoint is `/health`.

### Frontend

The backend serves the `frontend/` directory as static files. Start the backend and open its local URL. For standalone frontend work, use a local static-file server and configure the API base URL for that environment.

## Configuration and security

- Never commit `.env` files, API keys, database URLs, access tokens, or private keys.
- Use a unique, high-entropy `JWT_SECRET` (at least 32 bytes) for each environment.
- Store production secrets in the hosting provider's secret manager or environment configuration.
- Rotate any credential or private key that has been committed to a public repository.
- Do not log passwords, tokens, private key material, or full request bodies containing personal data.
- Restrict CORS origins and use HTTPS before exposing a deployment publicly. Configure `CORS_ORIGINS` as a comma-separated list of exact frontend origins (scheme + hostname, no path); production has no permissive wildcard default.
- Review authentication, authorization, input validation, file uploads, and cryptographic signing before production use.
- The current BPP crypto helper generates a new signing key pair in process memory at startup. Its identity is therefore not stable across restarts; use managed persistent key material and a documented key-registration/rotation process before relying on it for production signatures.

Read [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## Project documentation

- [Developer demo guide](docs/DEMO_GUIDE.md)
- [Known limitations and pilot blockers](docs/KNOWN_LIMITATIONS.md)
- [Staged pilot plan](docs/PILOT_PLAN.md)
- [Developer and institution outreach kit](docs/OUTREACH_KIT.md)
- [Backend API documentation](backend/API_DOCUMENTATION.md)
- [Backend implementation notes](backend/README.md)
- [BPP deployment guide](BPP_SERVER_DEPLOYMENT.md)
- [Frontend deployment guide](FRONTEND_DEPLOYMENT.md)
- [Implementation plan](IMPLEMENTATION_PLAN.md)
- [Walkthrough](WALKTHROUGH.md)

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), open an issue to discuss substantial changes, and submit focused pull requests with tests or reproducible verification steps.

## Licence

The project is intended to use the MIT License. See [LICENSE](LICENSE). Third-party dependencies and assets retain their own licences. Before redistributing the project, confirm that every included source file, asset, and dataset is owned by the project contributors or is distributed under compatible terms.
