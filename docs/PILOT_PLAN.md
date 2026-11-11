# CredEx pilot plan

**Objective:** validate whether a small educational institution and a small group of employers find interoperable skill/credential verification useful. This is a proposed pilot, not an existing partnership or commitment.

## Stage 0 — Make the prototype safe

Do not onboard real users or real academic records until all items in [Known limitations and pilot blockers](KNOWN_LIMITATIONS.md) are resolved and tested.

Deliverables:
- role-based authorization matrix and regression tests;
- genuine issuer-signature verification with stable key lifecycle;
- privacy and consent flow;
- dependency remediation and security review;
- isolated staging environment with synthetic records;
- reproducible demo evidence.

Exit criterion: a reviewer can run the documented demo from a clean environment and reproduce both positive and negative test cases.

## Stage 1 — Developer validation

Audience: 3–5 developers familiar with Node.js, APIs, identity, or Beckn-style network integrations.

Ask them to:
1. Follow the setup guide on a clean machine.
2. Run backend and BPP health checks.
3. execute the synthetic verification example.
4. inspect the API and integration documentation.
5. report setup failures, unclear concepts, missing tests, and potential security issues.

Capture:
- date and participant consent;
- time to first successful local run;
- environment/setup failures;
- issues opened and pull requests submitted;
- feedback themes and maintainer response.

Do not count automated activity, self-authored accounts, or unmerged contributions as external adoption.

## Stage 2 — Institution discovery

Audience: one or two universities, colleges, or training providers willing to discuss credential issuance and verification.

Do not ask them to share student records at this stage. Conduct a discovery interview about:
- how credentials are issued and verified today;
- which evidence an employer is allowed to request;
- how issuer identity and revocation are handled;
- what interoperability standards and systems they already use;
- consent, retention, privacy, and legal requirements;
- what a safe synthetic-data pilot would need to demonstrate.

Outcome: a written problem statement and a mutually agreed pilot scope. Do not describe an exploratory conversation as a partnership.

## Stage 3 — Controlled pilot

Only after Stage 0 security exit criteria are met and an institution provides written approval.

Suggested initial scope:
- one institution/issuer;
- one credential type or a small, agreed set of skill claims;
- 5–10 consenting test participants or synthetic profiles;
- one employer-side verifier;
- test data first; real personal data only after privacy/security approval.

Measure:
- successful verifications / total attempts;
- median verification response time;
- false acceptance and false rejection test results;
- issuer callback success rate;
- unresolved defects;
- user-reported clarity and usefulness.

Define thresholds with the pilot institution before testing. Do not claim the pilot is successful based only on the number of records processed.

## Stage 4 — Publish results responsibly

Publish a short report with:
- scope, dates, and environment;
- number of participating organizations and consenting participants;
- synthetic versus real data clearly distinguished;
- test methodology and limitations;
- measured outcomes and known failures;
- issues fixed and next steps;
- explicit permission for any institution names, logos, quotes, or testimonials.

Never publish student data, private payloads, tokens, certificates, or personal information.

## Suggested 6-week schedule

| Week | Work | Evidence |
|---|---|---|
| 1 | Security and access-control fixes | Tests, review checklist |
| 2 | Reproducible synthetic demo | Setup log, screenshots, test results |
| 3 | Developer feedback | 3–5 independent feedback records |
| 4 | Institution discovery | Interview notes with consent |
| 5 | Pilot scope and privacy review | Written scope and approvals |
| 6 | Controlled test, if approved | Metrics and issue log |

This schedule is a planning estimate, not a promise. A pilot must not proceed merely to meet a date if security or institutional approval is incomplete.
