# Contributing to CredEx

Thank you for considering a contribution. Contributions should improve correctness, security, usability, documentation, or maintainability.

## Before starting

1. Read the repository README and the documentation for the service you intend to change.
2. Search existing issues and pull requests to avoid duplicate work.
3. For substantial changes, open an issue first to discuss scope and design.
4. Never include API keys, database credentials, tokens, private keys, personal data, or production data in a commit.

## Development workflow

1. Fork the repository.
2. Create a focused branch from `master`.
3. Install dependencies in the service you are changing.
4. Implement the change with clear, maintainable code.
5. Run the available checks and state which checks you actually ran.
6. Update documentation when behaviour, configuration, or API contracts change.
7. Open a pull request describing the problem, solution, test evidence, and operational impact.

## Pull request expectations

- Keep each pull request focused on one coherent change.
- Explain the motivation and user-visible effect.
- Include reproducible steps to verify a bug fix or feature.
- Add or update tests where practical.
- Avoid unrelated formatting changes.
- Never report a check as passing unless it was actually run.

## Security-sensitive changes

Do not publish exploit details or secret values in a public issue. Follow [SECURITY.md](SECURITY.md). If a credential is exposed, revoke or rotate it; removing it from the latest file does not invalidate it or remove it from Git history.

## Code and documentation style

- Prefer explicit names and small functions.
- Validate untrusted input at API boundaries.
- Return safe error messages to clients; do not leak stack traces or credentials.
- Keep configuration in environment variables or approved secret stores.
- Document new environment variables in example files using placeholders only.
