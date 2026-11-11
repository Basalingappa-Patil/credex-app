# Security Policy

## Project status

CredEx is under active development. A formal supported-version matrix and guaranteed security response time have not yet been established.

## Reporting a vulnerability

Please do not open a public issue containing exploit details, personal data, credentials, API keys, database connection strings, tokens, or private keys.

Use GitHub's private vulnerability reporting feature for this repository if it is enabled. Otherwise, contact the maintainer privately through the contact method listed on the maintainer's GitHub profile. Include:

- A concise description of the affected component.
- The potential impact.
- Reproduction steps that do not expose real user data or secrets.
- Any suggested mitigation.

## Exposed credentials

If a credential or private key is committed:

1. Revoke or rotate it immediately at the issuing service.
2. Replace it in deployment configuration using a secret manager or environment variable.
3. Remove it from the tracked working tree.
4. Assess whether Git history must be rewritten and coordinate any rewrite with collaborators.
5. Review provider audit logs for unexpected use.

Removing a secret from the latest commit does not make an exposed credential safe again.
