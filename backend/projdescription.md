# Beckn-Based Skill Verification Network

## Overview

A production-ready skill verification platform that automates the verification of candidate skills using the Beckn Protocol. The system integrates with ONEST for educational credentials and maps skills to NSQF (National Skills Qualification Framework) standards. It provides instant verification through API endpoints or QR codes, generating cryptographically signed verifiable presentations for employers.

The platform solves fragmented and unreliable skill verification in hiring by aggregating credentials from multiple issuers, standardizing them against NSQF competency levels, and providing instant, verifiable proof of skills.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack

**Frontend Architecture**
- Pure HTML5, CSS3, and Vanilla JavaScript (no frameworks)
- Client-side routing handled through multiple HTML pages
- Local storage for JWT token management and user session
- Fetch API for all backend communication
- Role-based UI rendering (candidate, employer, admin dashboards)

**Backend Architecture**
- Node.js with Express.js framework
- RESTful API design with role-based middleware protection
- JWT-based stateless authentication
- Service-oriented architecture with clear separation of concerns:
  - Controllers handle HTTP request/response
  - Services contain business logic
  - Models define data schemas
  - Middleware handles auth and validation

**Data Storage**
- MongoDB as primary database
- Mongoose ODM for schema definition and data validation
- Collections: Users, Credentials, Skills, Issuers, SkillGraphs, TransactionLogs, VerificationLogs
- Indexed fields for performance on frequent queries (candidateId, transactionId, normalized skill names)

**Beckn Protocol Implementation**
- Full Beckn transaction lifecycle: search → on_search → select → on_select → confirm → on_confirm → status → on_status
- BAP (Beckn Application Platform) and BPP (Beckn Provider Platform) roles
- Transaction logging for all Beckn messages
- Context management with transaction IDs and message IDs
- Async callback pattern for Beckn responses

**Authentication & Authorization**
- JWT tokens with 7-day expiration
- Three user roles: candidate, employer, admin
- Role-based middleware for endpoint protection
- Password hashing using bcrypt (10 rounds)
- Token stored client-side in localStorage

**Skill Mapping & NSQF Framework**
- 8-level NSQF competency mapping (Entry to Senior Professional)
- Automated skill normalization and categorization
- Proficiency scoring algorithm based on credential type and source weight
- Recency scoring based on verification date
- Skill graph generation aggregating multiple credential sources
- Related skills and synonyms mapping

**Verification Workflows**
- Multi-step verification process logged in VerificationLog
- Credential fetching from ONEST (mock implementation with extensibility for real API)
- Credential validation against issuer signatures
- Skill extraction and NSQF mapping
- Skill graph updates and aggregation
- W3C Verifiable Credential format for output
- OpenID4VP-compatible verifiable presentations

**QR Code System**
- Base64-encoded JSON data with candidate ID and timestamp
- 24-hour expiration for security
- QR codes generated as PNG data URLs
- Verification endpoint accepts QR data for instant skill verification

**Background Jobs**
- Node-cron for scheduled tasks
- Job queue with sequential processing
- Automatic skill graph updates
- Recency score recalculation (daily)
- Credential expiry checks

### Key Architectural Decisions

**Why MongoDB over relational DB:**
- Flexible schema for varying credential formats from different issuers
- Native JSON storage for Beckn protocol messages
- Easy aggregation for skill graph calculations
- Horizontal scalability for growing credential data

**Why vanilla JavaScript for frontend:**
- No build process or bundling required
- Simpler deployment (static file serving)
- Lower learning curve for modifications
- Direct DOM manipulation sufficient for UI complexity

**Why service layer separation:**
- Business logic isolated from HTTP concerns
- Easier testing of core verification logic
- Services can be reused across different controllers
- Clear boundaries for future microservice extraction

**Why mock ONEST implementation:**
- Demonstrates integration pattern without external dependencies
- Allows testing without ONEST credentials
- Easy switch to real ONEST API by updating service methods
- Maintains same contract throughout system

**Why skill graph over simple credential list:**
- Aggregates skills from multiple sources with weighted trust scores
- Handles skill evolution and recency
- Provides holistic competency view
- Enables NSQF-level insights and comparisons

**Why JWT over sessions:**
- Stateless authentication scales better
- No server-side session storage needed
- Works well with multi-server deployments
- Client can verify token expiration independently

## External Dependencies

**NPM Packages:**
- `express` - Web framework for REST API
- `mongoose` - MongoDB ODM for data modeling
- `jsonwebtoken` - JWT creation and verification
- `bcrypt` - Password hashing
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `express-validator` - Request validation
- `qrcode` - QR code generation
- `node-cron` - Background job scheduling
- `uuid` - Unique ID generation
- `morgan` - HTTP request logging

**Database:**
- MongoDB (local or MongoDB Atlas for production)
- Connection URI configurable via MONGODB_URI environment variable
- Graceful degradation if MongoDB unavailable (server runs with limited functionality)

**External APIs (Integration Points):**
- ONEST Network API - Educational credential fetching (currently mocked)
- Beckn Gateway - For production Beckn network participation
- W3C Verifiable Credentials - Standard output format
- OpenID4VP - Verification presentation protocol

**Environment Variables:**
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `BAP_URI` - Beckn Application Platform callback URI
- `API_URL` - Base API URL for QR code verification links

**Standards & Protocols:**
- Beckn Protocol v1.1.0 - Discovery and transaction
- ONEST/DSEP - Digital education ecosystem
- NSQF Framework - 8-level skill competency standard
- W3C Verifiable Credentials - Credential format
- OpenID4VP - Presentation protocol
- Ed25519Signature2020 - Cryptographic proofs
