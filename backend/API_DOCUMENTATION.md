# API Documentation

Complete API reference for Beckn Skill Verification Network is slow cxcxexe

## Base URL
```
http://localhost:5000/api
```

## Authentication

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

---

## Auth APIs

### POST /auth/signup
Register a new user

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "candidate",
  "phone": "+91-1234567890",
  "organization": "Company Name"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "candidate"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/login
Login to existing account

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "candidate"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/profile
Get current user profile (Requires Auth)

**Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "candidate",
    "phone": "+91-1234567890",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Candidate APIs

All candidate APIs require authentication and candidate role.

### GET /candidate/profile
Get candidate profile with skills and credentials

**Response (200):**
```json
{
  "skillGraph": {
    "candidateId": "507f1f77bcf86cd799439011",
    "skills": [...],
    "overallScore": 85,
    "strengthAreas": ["technical", "domain"],
    "skillCount": 12,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  },
  "credentials": [...],
  "credentialCount": 3,
  "verifiedCount": 3
}
```

### POST /candidate/credentials/add
Add a new credential from ONEST or other issuers

**Request:**
```json
{
  "credentialReferenceId": "ONEST001",
  "issuerType": "onest"
}
```

**Available Mock Credentials:**
- `ONEST001` - B.Tech Computer Science
- `ONEST002` - AWS Solutions Architect
- `ONEST003` - Full Stack Development Assessment

**Response (201):**
```json
{
  "message": "Credential added successfully",
  "credential": {
    "id": "507f1f77bcf86cd799439012",
    "credentialId": "ONEST001",
    "type": "education",
    "title": "Bachelor of Technology - Computer Science",
    "issuerName": "Indian Institute of Technology",
    "verificationStatus": "verified",
    "skills": [...]
  }
}
```

### GET /candidate/skill-graph
Get detailed skill graph

**Response (200):**
```json
{
  "candidateId": "507f1f77bcf86cd799439011",
  "skills": [
    {
      "skill": "507f1f77bcf86cd799439013",
      "skillName": "JavaScript",
      "nsqfLevel": 4,
      "proficiency": 92,
      "recencyScore": 100,
      "sources": [
        {
          "credentialId": "507f1f77bcf86cd799439012",
          "issuerName": "NSDC Platform",
          "verifiedDate": "2024-01-15T10:00:00.000Z",
          "weight": 0.85
        }
      ],
      "lastVerified": "2024-01-15T10:00:00.000Z"
    }
  ],
  "overallScore": 85,
  "strengthAreas": ["technical"],
  "skillCount": 12
}
```

### POST /candidate/refresh-verification
Refresh skill verification and recalculate scores

**Response (200):**
```json
{
  "message": "Verification refreshed successfully",
  "skillGraph": {...}
}
```

### GET /candidate/qrcode
Generate QR code for skill profile

**Response (200):**
```json
{
  "message": "QR code generated successfully",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "qrData": "eyJjYW5kaWRhdGVJZCI6IjUwN2YxZjc3YmN...",
  "expiresAt": "2024-01-16T10:00:00.000Z"
}
```

---

## Beckn Protocol APIs

### POST /beckn/search
Search for skill issuers and verification services

**Request:**
```json
{
  "context": {...},
  "message": {
    "intent": {
      "skillName": "JavaScript",
      "issuerName": "",
      "category": "skill-verification"
    }
  }
}
```

**Response (200):**
```json
{
  "message": {
    "ack": {
      "status": "ACK"
    }
  }
}
```

### POST /beckn/on_search
Receive search results from providers

**Response (200):**
```json
{
  "context": {...},
  "message": {
    "catalog": {
      "providers": [
        {
          "id": "507f1f77bcf86cd799439014",
          "descriptor": {
            "name": "ONEST Network"
          },
          "items": [...],
          "fulfillments": [...]
        }
      ]
    }
  }
}
```

### POST /beckn/select
Select a provider and service

**Request:**
```json
{
  "context": {...},
  "message": {
    "order": {
      "provider": { "id": "507f1f77bcf86cd799439014" },
      "items": [{ "id": "item-001" }]
    }
  }
}
```

### POST /beckn/confirm
Confirm verification order

**Request:**
```json
{
  "context": {...},
  "message": {
    "order": {...}
  }
}
```

### POST /beckn/status
Check order status

**Request:**
```json
{
  "context": {...},
  "message": {
    "order_id": "order-123"
  }
}
```

### POST /beckn/support
Get support information

**Request:**
```json
{
  "context": {...},
  "message": {
    "ref_id": "order-123"
  }
}
```

---

## Verification APIs

### GET /verify/by-id/:candidateId
Verify candidate skills by ID (No auth required for employers)

**Response (200):**
```json
{
  "success": true,
  "verification": {
    "candidateId": "507f1f77bcf86cd799439011",
    "candidateName": "John Doe",
    "verificationStatus": "verified",
    "timestamp": "2024-01-15T11:00:00.000Z",
    "skillCount": 12,
    "overallScore": 85,
    "skills": [...],
    "verifiablePresentation": {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      "type": ["VerifiablePresentation"],
      "verifiableCredential": [...],
      "proof": {...}
    }
  }
}
```

### POST /verify/by-qr
Verify using QR code data

**Request:**
```json
{
  "qrData": "eyJjYW5kaWRhdGVJZCI6IjUwN2YxZjc3YmN..."
}
```

**Response (200):**
```json
{
  "success": true,
  "verification": {
    "valid": true,
    "candidateId": "507f1f77bcf86cd799439011",
    "candidateName": "John Doe",
    "verificationStatus": "verified",
    "skills": [...]
  }
}
```

### GET /verify/revocation/:credentialId
Check credential revocation status

**Response (200):**
```json
{
  "credentialId": "ONEST001",
  "isRevoked": false,
  "lastChecked": "2024-01-15T11:00:00.000Z",
  "status": "active"
}
```

---

## Admin APIs

All admin APIs require authentication and admin role.

### GET /admin/dashboard
Get system overview and statistics

**Response (200):**
```json
{
  "stats": {
    "totalCandidates": 150,
    "totalEmployers": 25,
    "totalCredentials": 420,
    "verifiedCredentials": 398,
    "totalIssuers": 8,
    "totalVerifications": 1250
  },
  "recentVerifications": [...]
}
```

### GET /admin/candidates
List all candidates with pagination

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response (200):**
```json
{
  "candidates": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "pages": 8
  }
}
```

### GET /admin/issuers
List all issuers and assessors

**Response (200):**
```json
{
  "issuers": [
    {
      "id": "507f1f77bcf86cd799439014",
      "name": "ONEST Network",
      "type": "onest",
      "trustScore": 85,
      "credentialCount": 125,
      "isActive": true
    }
  ]
}
```

### GET /admin/verification-logs
Get verification workflow logs

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response (200):**
```json
{
  "logs": [...],
  "pagination": {...}
}
```

### GET /admin/beckn-logs
Get Beckn transaction logs

**Response (200):**
```json
{
  "logs": [
    {
      "transactionId": "uuid-123",
      "action": "search",
      "role": "BAP",
      "status": "completed",
      "timestamp": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### GET /admin/errors
Get failed workflow logs

**Response (200):**
```json
{
  "errors": [
    {
      "workflowId": "uuid-456",
      "type": "credential_fetch",
      "errorMessage": "Credential not found",
      "candidateId": {...},
      "startedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

## Error Responses

All APIs return standardized error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid input data"
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden:**
```json
{
  "error": "Admin access required"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider:
- 100 requests/minute for authenticated users
- 20 requests/minute for unauthenticated verification APIs

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.
