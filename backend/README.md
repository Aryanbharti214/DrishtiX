# DrishtiX Backend

Express + TypeScript API for DrishtiX.

## Responsibilities

- Disaster event management
- Imagery ingestion and metadata persistence
- Serving uploaded imagery
- Calling the FastAPI AI service
- Validating AI responses
- Persisting AI runs and raw model outputs
- Creating and querying disaster findings
- Manual responder finding creation
- Human verification and audit history
- Multi-service health checks

## Stack

- Node.js
- Express 5
- TypeScript
- PostgreSQL
- Zod
- Axios
- Multer
- Pino

## Setup

```bash
npm install
cp .env.example .env
```

Example `.env`:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/drishtix
AI_SERVICE_URL=http://127.0.0.1:8000
CORS_ORIGIN=http://localhost:5173
```

## Database

Create the database:

```bash
createdb drishtix
```

Run migrations in order:

```bash
psql -U postgres -d drishtix -f migrations/001_create_disasters.sql
psql -U postgres -d drishtix -f migrations/002_create_imagery.sql
psql -U postgres -d drishtix -f migrations/003_create_ai_runs.sql
psql -U postgres -d drishtix -f migrations/004_create_findings.sql
psql -U postgres -d drishtix -f migrations/005_enhance_findings.sql
psql -U postgres -d drishtix -f migrations/006_create_finding_verifications.sql
```

## Run

```bash
npm run dev
```

Production build:

```bash
npm run typecheck
npm run build
npm start
```

## Health endpoint

```text
GET /api/v1/health
```

The endpoint checks both PostgreSQL and the FastAPI AI service.

## Main routes

### Disasters

```text
POST  /api/v1/disasters
GET   /api/v1/disasters
GET   /api/v1/disasters/:id
PATCH /api/v1/disasters/:id
```

### Imagery

```text
POST /api/v1/imagery
POST /api/v1/imagery/:id/analyze
GET  /api/v1/imagery/:id
GET  /api/v1/imagery/disaster/:disasterId
```

Imagery uploads use multipart field `image` and support JPEG, PNG, and WebP.

### Findings

```text
POST /api/v1/findings/manual
GET  /api/v1/findings/:id
GET  /api/v1/findings/disaster/:disasterId
GET  /api/v1/findings/imagery/:imageryId
POST /api/v1/findings/:id/verify
GET  /api/v1/findings/:id/verifications
```

## AI integration

The backend sends a stored image to:

```text
POST {AI_SERVICE_URL}/api/v1/analyze
```

The returned payload is validated before persistence. Generic detections are stored as raw AI output, while controlled disaster-domain findings are persisted separately.

## Finding sources

```text
AI
RESPONDER
FUSION
```

`FUSION` is reserved for the upcoming evidence-correlation layer.

## Verification

Verification decisions are:

```text
CONFIRMED
CORRECTED
REJECTED
```

Verification is transactional. The backend locks the finding row, applies the decision, and records immutable before/after snapshots in `finding_verifications`.

## Current limitations

- No authentication/RBAC yet
- Reviewer labels are development placeholders
- AI analysis is synchronous
- No PostGIS evidence correlation yet
- No priority scoring engine yet
