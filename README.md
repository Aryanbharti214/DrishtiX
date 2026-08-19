# DrishtiX

DrishtiX is a human-in-the-loop disaster intelligence platform for collecting imagery, running AI-assisted analysis, recording geolocated operational findings, visualizing them on a live map, and verifying findings before they are used for downstream prioritization.

> Current AI status: the integrated AI service uses a generic YOLO object detector and stores raw detections separately from disaster-domain findings. It does **not** claim that generic detections such as `car`, `truck`, or `person` are disaster damage assessments. Disaster-domain findings are currently created through responder reporting and the shared finding model is ready for a future disaster-specific model.

## Current architecture

```text
React + Vite
    |
    v
Express + TypeScript
    |---------------------- PostgreSQL
    |                         |
    |                         +-- disasters
    |                         +-- imagery
    |                         +-- ai_runs
    |                         +-- findings
    |                         +-- finding_verifications
    |
    v
FastAPI
    |
    v
Ultralytics YOLO
```

## Implemented capabilities

- Disaster event creation, listing, selection, and status tracking
- JPEG/PNG/WebP imagery upload with file validation and metadata storage
- Static imagery serving from the backend
- Express-to-FastAPI image analysis integration
- AI-run lifecycle tracking and raw model output persistence
- Strict separation between raw CV detections and disaster-domain findings
- Manual responder findings with geolocation, severity, title, and description
- Live Leaflet disaster map backed by PostgreSQL findings
- Map-click responder reporting
- Findings filtering by source and severity
- Human verification workflow: Confirm, Correct, Reject
- Transactional verification updates using row locking
- Immutable before/after verification snapshots
- Multi-service health endpoint for API, database, and AI service

## Repository structure

```text
DrishtiX/
├── frontend/      # React + Vite + Tailwind + React Leaflet
├── backend/       # Express + TypeScript + PostgreSQL
├── ai-service/    # FastAPI + Ultralytics YOLO
└── README.md
```

## Prerequisites

- Node.js 20+ recommended
- npm
- PostgreSQL
- Python 3.11+ recommended
- Git

The AI service may run on newer Python versions, but using a widely supported Python release is recommended for ML dependency compatibility.

## 1. Clone

```bash
git clone https://github.com/Aryanbharti214/DrishtiX.git
cd DrishtiX
```

## 2. PostgreSQL

Create a database:

```bash
createdb drishtix
```

Run migrations in order:

```bash
psql -U postgres -d drishtix -f backend/migrations/001_create_disasters.sql
psql -U postgres -d drishtix -f backend/migrations/002_create_imagery.sql
psql -U postgres -d drishtix -f backend/migrations/003_create_ai_runs.sql
psql -U postgres -d drishtix -f backend/migrations/004_create_findings.sql
psql -U postgres -d drishtix -f backend/migrations/005_enhance_findings.sql
psql -U postgres -d drishtix -f backend/migrations/006_create_finding_verifications.sql
```

## 3. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Example configuration:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/drishtix
AI_SERVICE_URL=http://127.0.0.1:8000
CORS_ORIGIN=http://localhost:5173
```

Run:

```bash
npm run dev
```

Backend health:

```bash
curl http://localhost:4000/api/v1/health
```

## 4. AI service

Open another terminal:

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run:

```bash
uvicorn app.main:app --reload --port 8000
```

AI health:

```bash
curl http://127.0.0.1:8000/health
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

The primary analysis endpoint is:

```text
POST /api/v1/analyze
```

It accepts multipart fields:

- `image`
- `imageId`

and returns a normalized response containing model metadata, raw detections, and disaster-domain findings.

## 5. Frontend

Open another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Environment variables

### Backend

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | Express server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `AI_SERVICE_URL` | FastAPI base URL |
| `CORS_ORIGIN` | Allowed frontend origin |

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Express API base URL |
| `VITE_BACKEND_ORIGIN` | Backend origin used for uploaded imagery assets |

## Core API routes

### System

```text
GET /api/v1/health
```

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

### Findings

```text
POST /api/v1/findings/manual
GET  /api/v1/findings/:id
GET  /api/v1/findings/disaster/:disasterId
GET  /api/v1/findings/imagery/:imageryId
POST /api/v1/findings/:id/verify
GET  /api/v1/findings/:id/verifications
```

## Current analysis flow

```text
1. User selects a disaster
2. User uploads imagery
3. Backend stores file + imagery metadata
4. User starts AI analysis
5. Express sends stored image to FastAPI
6. FastAPI runs generic YOLO inference
7. Raw detections are validated by the backend
8. AI run and raw output are persisted
9. Domain findings, if provided by a future disaster model, are persisted
10. Responders can create field findings manually
11. Findings appear on the live map
12. Human reviewers Confirm / Correct / Reject findings
13. Every verification creates an audit record
```

## Data integrity principles

DrishtiX deliberately separates three concepts:

```text
Raw detection != disaster finding != verified operational fact
```

- Generic model detections are preserved as raw evidence.
- Disaster findings use a controlled domain schema.
- Operational decisions remain human-controlled.
- Corrections preserve the original state in the audit trail.

## Development commands

Backend:

```bash
npm run dev
npm run typecheck
npm run build
npm start
```

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

AI service:

```bash
python -m compileall app routes schemas services
uvicorn app.main:app --reload --port 8000
```

## Known development-stage limitations

- Generic YOLO currently provides object detections, not disaster-specific damage classification.
- Authentication/RBAC is not implemented yet; reviewer labels are temporary development identifiers.
- AI analysis is synchronous through Express; a background queue can be introduced later if inference latency or concurrency requires it.
- Dashboard/priority widgets still contain development placeholders until the priority engine is implemented.
- PostGIS spatial evidence correlation is planned but not yet implemented.

## Next milestones

1. PostGIS-backed nearby-finding queries
2. Spatial/temporal evidence correlation
3. Evidence relationship types and explainable correlation scores
4. Human-approved fusion recommendations
5. Explainable priority scoring
6. Real dashboard metrics
7. Authentication and role-based access control
8. Disaster-specific CV model integration
9. Tests, containerization, CI, and deployment hardening

## Safety and decision model

DrishtiX is designed as a decision-support system. AI may recommend or surface evidence, but authorized responders make final operational decisions.

## License

A project license has not yet been selected.
