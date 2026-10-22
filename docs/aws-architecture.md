# CampusFix — Future AWS Cloud Integration Architecture

> **Notice:** The application currently operates in **Local Mock Mode** with 16 realistic seeded complaints and an in-browser repository abstraction. This document details the Phase 2 cloud migration plan to **Amazon Cognito**, **AWS Lambda**, and **Amazon DynamoDB**.

---

## 1. Architectural Overview & Zero-Trust Security

```
[ Frontend Client (React + Vite) ]
          │
          ├── 1. Authenticate (SRP / Hosted UI) ────► [ Amazon Cognito User Pool ]
          │                                                    │
          │  2. Return JWT (ID Token + Access Token)           │
          ◄────────────────────────────────────────────────────┘
          │
          ├── 3. Signed HTTPS Request (Bearer JWT) ──► [ Lambda Function URLs / API Gateway ]
                                                                   │
                                                                   ▼
                                                       [ Lambda JWT Authorizer ]
                                                       (Validates claims & groups)
                                                                   │
                                                                   ▼
                                                       [ Microservice Handlers ]
                                                                   │
                                                                   ▼
                                                       [ Amazon DynamoDB ]
                                                       (Single-Table Design)
```

### Authorization Principle
* **Frontend claims are never trusted.** Role labels stored locally are for UI presentation only.
* Every Lambda handler extracts the validated `sub` and `cognito:groups` directly from the cryptographic JWT header before executing read or write operations.

---

## 2. Amazon Cognito Identity & Access Management

### User Pool Configuration
* **User Pool Attributes:**
  * `email` (Username attribute, verified via SES code)
  * `name` (Standard string)
  * `custom:student_id` (e.g., `CS-2023-042`)
  * `custom:department` (e.g., `Computer Science & Engineering`)
* **Cognito User Groups:**
  1. `Students`: Granted standard permissions to submit tickets, view personal tickets, and append student notes.
  2. `Administrators`: Granted permissions to inspect all campus tickets, route departments, update status lifecycles, and access analytics aggregates.

### Adapter Integration in Codebase
In `src/services/auth/authService.ts`, replace `MockAuthAdapter` with `CognitoAuthAdapter` implementing `IAuthService`:
```typescript
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';

export class CognitoAuthAdapter implements IAuthService {
  async login(email: string, password?: string): Promise<User> {
    const { isSignedIn } = await signIn({ username: email, password: password! });
    const session = await fetchAuthSession();
    const payload = session.tokens?.idToken?.payload;
    return {
      id: payload?.sub as string,
      name: payload?.name as string,
      email: payload?.email as string,
      role: (payload?.['cognito:groups'] as string[])?.includes('Administrators') ? 'admin' : 'student',
      department: payload?.['custom:department'] as string,
      studentId: payload?.['custom:student_id'] as string
    };
  }
}
```

---

## 3. Amazon DynamoDB Single-Table Design

Table Name: `CampusFixData`
Billing Mode: On-Demand Pay-per-request

### Key Design Schema

| Entity | PK (Partition Key) | SK (Sort Key) | GSI1-PK | GSI1-SK | Attributes |
|---|---|---|---|---|---|
| **Complaint Metadata** | `CMP#<ticketId>` | `METADATA` | `USER#<studentId>` | `DATE#<createdAt>` | `title`, `description`, `category`, `priority`, `status`, `department`, `location`, `assignedTo` |
| **Audit History Entry**| `CMP#<ticketId>` | `HIST#<timestamp>#<id>` | — | — | `previousStatus`, `newStatus`, `actorId`, `actorName`, `actorRole`, `remark` |
| **Department Info**    | `DEPT#<deptId>`  | `INFO` | — | — | `name`, `headName`, `email`, `slaHours`, `location` |

### Global Secondary Indexes (GSIs)
1. **GSI1 (Student Queries):**
   * Partition Key: `GSI1-PK` (`USER#<studentId>`)
   * Sort Key: `GSI1-SK` (`DATE#<createdAt>`)
   * *Use Case:* Query all complaints filed by a specific student ordered by date.
2. **GSI2 (Status & Triage Queries):**
   * Partition Key: `status`
   * Sort Key: `priority`
   * *Use Case:* Fetch all "Submitted" or "In Progress" tickets sorted by critical priority.

---

## 4. AWS Lambda Serverless Handlers

| Endpoint / Action | Lambda Function | Authorizer Scope | DynamoDB Action |
|---|---|---|---|
| `POST /complaints` | `CreateComplaintHandler` | `Students` group | `TransactWriteItems` (Puts metadata + initial status history) |
| `GET /complaints/my` | `GetStudentComplaintsHandler` | `Students` group | `Query` on `GSI1-PK = USER#<claims.sub>` |
| `GET /complaints/{id}` | `GetComplaintDetailsHandler` | `Students` (if owner) OR `Administrators` | `Query` on `PK = CMP#<id>` (Pulls metadata + all history items) |
| `GET /complaints` | `GetAllComplaintsHandler` | `Administrators` group only | `Query` / `Scan` with status/priority filters |
| `PATCH /complaints/{id}/status` | `UpdateStatusHandler` | `Administrators` group only | `UpdateItem` with condition expression verifying business rule |
| `PATCH /complaints/{id}/assign` | `AssignDepartmentHandler`| `Administrators` group only | `UpdateItem` setting `department` and `assignedTo` |

---

## 5. Attachment Evidence Storage (Amazon S3)

* Attachments are stored in private S3 bucket `campusfix-complaint-attachments-prod`.
* Lambda generates short-lived presigned PUT URLs (15-minute expiry) for direct client upload.
* Bucket policy enforces server-side encryption with AWS KMS (`aws:kms`) and restricts public read.
