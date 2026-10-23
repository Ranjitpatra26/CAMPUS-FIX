# CampusFix Backend Service (`CampusFixBackendFunction`)

Single AWS Lambda function implementing the backend APIs for the **CampusFix College Complaint Management System**, deployed to **AWS Region `ap-southeast-2` (Sydney)**.

---

## 1. Architecture Overview

```
Frontend (React + Vite SPA)
       │
       │ HTTPS Request with Authorization: Bearer <Cognito_ID_Token>
       ▼
AWS Lambda Function URL (https://<url-id>.lambda-url.ap-southeast-2.on.aws)
       │
       ▼
CampusFixBackendFunction (Node.js 20 / TypeScript)
       │
       ├── aws-jwt-verify (Validates Cognito ID Token signature, iss, aud, exp)
       │   └── Extracts verified sub, email, and checks "Administrators" group
       │
       ▼
Amazon DynamoDB (CampusFixComplaints table in ap-southeast-2)
       ├── Primary Key: complaintId (String)
       ├── GSI 1: GSI_StudentQueue (PK: studentId, SK: createdAt)
       └── GSI 2: GSI_AdminQueue (PK: entityType = 'COMPLAINT', SK: createdAt)
```

---

## 2. API Endpoints Specification

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `OPTIONS` | `*` | Public | CORS preflight handler (returns `204 No Content`). |
| `GET` | `/health` | Public | Unauthenticated liveness and health check. |
| `GET` | `/complaints/my` | Any Authenticated Student | Returns all complaints created by caller (`claims.sub`). |
| `POST` | `/complaints` | Any Authenticated Student | Creates a new complaint. `studentId` and `studentEmail` are derived strictly from token claims. |
| `GET` | `/complaints/all` | Admin Only (`Administrators`) | Retrieves all campus complaints with optional filters (`status`, `priority`, `department`). |
| `GET` | `/complaints/:id` | Student (Owner) OR Admin | Retrieves a single complaint. Other students receive `403 Forbidden` (Student Data Isolation). |
| `PATCH` | `/complaints/:id/status` | Admin Only (`Administrators`) | Validates state transition, updates status, and appends audit log. |
| `PATCH` | `/complaints/:id/assign` | Admin Only (`Administrators`) | Assigns department and staff assignee. Transitions from `Submitted` to `Assigned`. |

---

## 3. DynamoDB Table Provisioning (`CampusFixComplaints`)

To create the DynamoDB table in AWS Console or via AWS CLI in `ap-southeast-2`:

```bash
aws dynamodb create-table \
    --table-name CampusFixComplaints \
    --region ap-southeast-2 \
    --billing-mode PAY_PER_REQUEST \
    --attribute-definitions \
        AttributeName=complaintId,AttributeType=S \
        AttributeName=studentId,AttributeType=S \
        AttributeName=entityType,AttributeType=S \
        AttributeName=createdAt,AttributeType=S \
    --key-schema \
        AttributeName=complaintId,KeyType=HASH \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"GSI_StudentQueue\",
                \"KeySchema\": [
                    {\"AttributeName\": \"studentId\", \"KeyType\": \"HASH\"},
                    {\"AttributeName\": \"createdAt\", \"KeyType\": \"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\": \"ALL\"}
            },
            {
                \"IndexName\": \"GSI_AdminQueue\",
                \"KeySchema\": [
                    {\"AttributeName\": \"entityType\", \"KeyType\": \"HASH\"},
                    {\"AttributeName\": \"createdAt\", \"KeyType\": \"RANGE\"}
                ],
                \"Projection\": {\"ProjectionType\": \"ALL\"}
            }
        ]"
```

---

## 4. IAM Least-Privilege Policy for Lambda

Attach this inline IAM policy to the Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBComplaintTableAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-southeast-2:*:table/CampusFixComplaints",
        "arn:aws:dynamodb:ap-southeast-2:*:table/CampusFixComplaints/index/*"
      ]
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-southeast-2:*:log-group:/aws/lambda/CampusFixBackendFunction:*"
    },
    {
      "Sid": "SESEmailSendingAccess",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 5. Deployment Instructions

### Step 1: Build & Package Lambda
From the `backend` directory:
```bash
# 1. Compile backend TypeScript
npm run build

# 2. Bundle into clean production deployment ZIP (campusfix-lambda.zip)
npm run package
```
Alternatively, from the project root:
```bash
npm run build --prefix backend
npm run package --prefix backend
```
This produces `backend/campusfix-lambda.zip` with root `index.js`, `package.json`, and isolated production `node_modules/`.

### Step 2: Create AWS Lambda Function
1. In the **AWS Console**, navigate to **Lambda** in region `ap-southeast-2` (Sydney).
2. Click **Create function**:
   - **Function name:** `CampusFixBackendFunction`
   - **Runtime:** `Node.js 20.x`
   - **Architecture:** `x86_64` (or `arm64`)
   - **Execution role:** Use role with the IAM policy from Section 4.
3. Under **Code source**, upload `campusfix-lambda.zip`.
4. Ensure the **Runtime settings > Handler** is set to: `index.handler` (pointing to `dist/index.js`).

### Step 3: Configure Environment Variables
In Lambda **Configuration > Environment variables**:
* `AWS_REGION`: `ap-southeast-2`
* `TABLE_NAME`: `CampusFixComplaints`
* `COGNITO_USER_POOL_ID`: `ap-southeast-2_tNhqL8tGi`
* `COGNITO_CLIENT_ID`: `4oq0kq3qljmhdu8rmbjclt94sl`
* `COGNITO_ADMIN_GROUP`: `Administrators`
* `ALLOWED_ORIGIN`: `http://localhost:5173`
* `SES_SOURCE_EMAIL`: `notifications@campusfix.edu` (must be a verified identity in Amazon SES)
* `ADMIN_NOTIFICATION_EMAIL`: `admin-alerts@campusfix.edu` (comma-separated for multiple admins)
* `FRONTEND_BASE_URL`: `https://campusfix.edu` (production web app URL; if unset or localhost, email CTA buttons are omitted)

### Step 4: Configure Lambda Function URL
1. Go to **Configuration > Function URL** > **Create function URL**.
2. **Auth type:** `NONE` (authentication is handled at application level by Cognito ID token validation).
3. **Configure CORS:**
   - **Allow origin:** `http://localhost:5173`
   - **Allow headers:** `Authorization, Content-Type, X-Amz-Date, X-Api-Key, X-Amz-Security-Token`
   - **Allow methods:** `GET, POST, PATCH, OPTIONS`
4. Copy the generated Function URL (e.g. `https://<id>.lambda-url.ap-southeast-2.on.aws/`).
5. Update your root `.env` with:
   ```env
   VITE_API_BASE_URL=https://<id>.lambda-url.ap-southeast-2.on.aws
   ```

---

## 6. Running Tests

Run the backend test suite:
```bash
npm test
```
All 73 tests (45 frontend + 28 backend) will execute and validate:
- Cognito token parsing and signature validation
- Zero-trust student identity enforcement
- Status transition matrix validation
- Student data isolation (403 when trying to access other students' complaints)
- Admin authorization enforcement
