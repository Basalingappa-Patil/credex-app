# Production secret rotation runbook

Use this runbook before merging security changes or continuing to serve real users after a credential or private key has been committed to a public repository.

> Treat any private key that was ever present in public Git history as compromised, even if the file has since been deleted. Do not paste secret values into GitHub issues, pull requests, chat, logs, or source files.

## 1. Identify the exposed key and its consumers

1. Inspect the historical `backend/keys.json` locally in a trusted environment. Do not copy its values into tickets or messages.
2. Identify the key algorithm, key identifier, intended purpose, and every service or external party that trusts it.
3. Check whether the key was configured in the live backend, BPP service, CI, hosting provider, or any partner integration.
4. If you cannot establish that it was never used, continue as though it was active and exposed.

## 2. Rotate the exposed signing key

1. Generate a new key pair using the algorithm and format required by the actual integration.
2. Register or distribute the new public key with every relying party before switching signing traffic, if the protocol supports an overlap period.
3. Update the production secret store with the new private key; never commit it.
4. Deploy the service using the new key and verify signatures with a test integration.
5. Revoke the old public key / key identifier at every relying party.
6. Review provider and application audit logs for unexpected use of the old key.
7. Record the rotation date, key identifier, affected integrations, and verification result without recording secret material.

If the key's purpose or consumers cannot be determined, pause signing/verification operations that rely on it and investigate before resuming.

## 3. Rotate the backend JWT secret

The hardened backend requires `JWT_SECRET` to contain at least 32 bytes.

Generate a fresh value locally:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Then:

1. Set the new `JWT_SECRET` in the backend hosting provider's production environment / secret manager.
2. Deploy or restart the backend so the new value is loaded.
3. Verify login and authenticated API requests.
4. Expect tokens signed with the previous secret to become invalid; users may need to sign in again.
5. Never reuse the example placeholder from `backend/.env.example`.

Do not place the generated value in GitHub Actions YAML, source code, an issue, a pull request, or a committed `.env` file.

## 4. Check other production secrets

Review the backend, BPP, database provider, hosting provider, CI settings, and third-party integrations for any credentials that may have been stored alongside the exposed key. Rotate only credentials confirmed or reasonably suspected to be exposed, following each provider's documented procedure.

## 5. Remove historical copies after rotation

Deleting `backend/keys.json` from the current branch does not remove it from Git history.

After rotating credentials:

1. Coordinate a history rewrite with all collaborators.
2. Use a vetted history-rewriting tool to remove the sensitive file from every reachable commit and tag.
3. Force-push the cleaned history only after arranging a maintenance window.
4. Ask collaborators to re-clone or carefully reset their local copies.
5. Check forks, cached artifacts, deployment bundles, and backups; history rewriting cannot guarantee deletion of copies outside the repository.

History cleanup is not a substitute for credential rotation.

## 6. Post-rotation verification checklist

- [ ] New key is loaded by the intended production service.
- [ ] Signing and verification work with the new public key.
- [ ] Old key is revoked at all relying parties.
- [ ] Backend JWT secret is unique, configured, and at least 32 bytes.
- [ ] Login and protected API routes work after deployment.
- [ ] Old JWTs are rejected as expected.
- [ ] Relevant provider audit logs have been reviewed.
- [ ] Git history cleanup has been planned and coordinated.
- [ ] No real secrets are present in current tracked files.

## Important BPP design limitation

The current BPP crypto helper generates an ephemeral signing key pair at process startup. That means its signing identity changes after a restart. Do not use that implementation for production trust until persistent key storage, public-key registration, rotation, and verification behaviour have been implemented and tested.
