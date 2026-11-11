# Known limitations and pilot blockers

This document records issues visible in the current source tree. It is intended to prevent the prototype from being presented as production-ready before the relevant controls are implemented and tested.

## Do not use with real credentials or personal data yet

The following issues are release blockers for an open public pilot.

### 1. QR verification currently contains a signature-validation placeholder

In `backend/services/verificationService.js`, `verifyQR()` currently sets `isValid = true` instead of verifying the credential's cryptographic proof. It can therefore report a credential as valid without actually validating its signature. This must be replaced with issuer-key resolution, canonical payload verification, and negative tests before QR verification is used for trust decisions.

The ONEST registry path also has permissive behavior: when no registry URL is configured, the check is skipped; when the registry is unavailable, the code currently falls back to accepting based on the placeholder signature result. Fail closed for trust decisions.

### 2. Public signup accepts a caller-supplied admin role

In `backend/controllers/authController.js`, the signup handler accepts `role` from the request body and stores it, while the User model permits `admin`. Public self-registration must never be able to create an administrator. Restrict public signup to approved self-service roles and provision administrators through a separate trusted process. Add regression tests.

### 3. Employer and verification routes need authorization review

- `backend/routes/employer.js` does not apply authentication or employer-role middleware at router level.
- `backend/routes/verify.js` exposes candidate lookup/verification handlers without an authentication middleware at router level.
- Some routes return candidate or credential information.

Define an explicit access-control matrix for candidate, employer, issuer, and administrator roles. Enforce authorization on every route and verify that one user cannot read or mutate another user's data.

### 4. BPP request authentication and CORS need review

- `bpp-server/server.js` currently uses unrestricted `cors()`.
- `bpp-server/routes/becknRoutes.js` wires inbound Beckn handlers directly to controllers; no request-signature verification middleware is visible at this router boundary.

Implement the applicable Beckn authentication/signature requirements and strict origin policy before external exposure. CORS is not an authentication mechanism.

### 5. Signing-key lifecycle is not production-ready

The backend signature utility can generate and persist a local key file. The BPP crypto helper has been documented as generating an ephemeral key pair at process startup. A production issuer identity needs managed persistent key material, registration/discovery, rotation, revocation, and verification tests. Never rely on an ephemeral key identity for long-lived trust.

### 6. Dependencies need remediation

Earlier dependency installation reported outstanding advisories in the backend and BPP dependency trees, including critical-severity findings. Dependabot configuration creates update proposals; it does not itself remediate vulnerabilities. Review current audit output, upgrade dependencies deliberately, and run regression tests.

## Pilot safety requirements

Before inviting any institution or external user to a pilot:

- [ ] Fix and test administrator-role provisioning.
- [ ] Enforce authentication and role-based authorization on every sensitive route.
- [ ] Replace placeholder QR/signature validation and fail closed when issuer trust cannot be established.
- [ ] Implement stable issuer key management and Beckn request authentication.
- [ ] Restrict BPP CORS and validate callback destinations.
- [ ] Review upload validation, storage, retention, access controls, and malware handling.
- [ ] Review privacy notice, consent, data minimization, deletion, and incident-response procedures.
- [ ] Remediate dependency advisories and run automated tests.
- [ ] Perform a security review against a disposable environment.
- [ ] Obtain written approval from a pilot institution and use synthetic or explicitly consented test records.

## Safe current scope

Until the blockers are closed, keep demonstrations limited to local/disposable environments and synthetic data. Demonstrate the architecture and current prototype behavior as experimental; do not claim real credential authenticity, institutional integration, ONEST certification, or production readiness.
