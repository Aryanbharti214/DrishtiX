# DrishtiX

DrishtiX is a human-in-the-loop disaster intelligence and decision-support platform for collecting operational evidence, analyzing imagery, correlating geospatial findings, identifying corroborating or conflicting reports, generating human-reviewable fusion recommendations, and prioritizing situations that require responder attention.

The system is designed around one core principle:

```text
AI recommends.
Evidence supports.
Authorized humans decide.
```

DrishtiX does not treat raw AI detections as verified disaster facts.

---

## Why DrishtiX?

Disaster-response teams may receive observations from responders, imagery systems, automated computer-vision pipelines, and multiple independent reports.

The difficult problem is not simply collecting this information. It is determining:

```text
Which reports refer to the same event?

Which reports corroborate each other?

Which reports contradict trusted evidence?

Which reports might be duplicates?

Which evidence deserves immediate human review?

When is there enough support to synthesize a higher-level operational finding?
```

DrishtiX provides an explainable evidence-intelligence pipeline for answering these questions without removing human control.

---

## System Architecture

```text
                         ┌─────────────────────────┐
                         │     React + Vite        │
                         │   Operational Frontend  │
                         └────────────┬────────────┘
                                      │
                                      │ HTTP + Auth Token
                                      ▼
                         ┌─────────────────────────┐
                         │ Express + TypeScript    │
                         │    Backend API          │
                         └──────┬───────────┬──────┘
                                │           │
                                │           │
                                ▼           ▼
                    ┌───────────────┐   ┌──────────────────┐
                    │ PostgreSQL    │   │ FastAPI AI       │
                    │ + PostGIS     │   │ Service          │
                    └──────┬────────┘   └────────┬─────────┘
                           │                     │
                           │                     ▼
                           │              ┌──────────────┐
                           │              │ Ultralytics │
                           │              │ YOLO        │
                           │              └──────────────┘
                           │
                           ▼
                 Spatial Evidence Engine
                           │
                           ▼
             Findings → Relations → Clusters
                           │
                           ▼
                Fusion Recommendations
                           │
                           ▼
                    Human Review
                           │
                           ▼
                  Operational Priority
```

---

## Evidence Intelligence Pipeline

The main DrishtiX workflow is:

```text
AI observation / responder report
                │
                ▼
             Finding
                │
                ▼
     PostGIS spatial correlation
                │
                ▼
       Evidence relationships
                │
        ┌───────┼─────────┐
        ▼       ▼         ▼
 CORROBORATES RELATED  DISPUTED
        │
        └──────────────┐
                       ▼
                Evidence Cluster
                       │
                       ▼
              Fusion Recommendation
                       │
                       ▼
                  HUMAN REVIEW
                 /             \
             Reject           Approve
                                │
                                ▼
                         FUSION Finding
                                │
                                ▼
                   Verification = PENDING
                                │
                                ▼
                       Human Verification
                                │
                                ▼
                     Operational Priority
```

A fusion recommendation never automatically becomes a verified operational fact.

---

## Implemented Capabilities

DrishtiX currently includes disaster-event management, imagery upload and metadata tracking, FastAPI-based AI analysis, raw model-output persistence, geolocated responder findings, Leaflet-based operational mapping, human verification with immutable audit history, PostGIS-backed spatial correlation, deterministic evidence relationships, disaster-level evidence clustering, human-reviewed fusion recommendations, explainable operational priority scoring, a live operational dashboard, role-based access control, and a reproducible synthetic demo scenario.

---

## Data Integrity Model

DrishtiX deliberately keeps different levels of information separate.

```text
Raw AI Detection
      !=
Disaster Finding
      !=
Corroborated Evidence
      !=
Fusion Recommendation
      !=
Verified Operational Fact
```

Generic object detections are not converted into disaster damage claims merely because an object was detected.

A generic model detecting:

```text
person
car
truck
building-like object
```

does not prove:

```text
casualty
road blockage
structural damage
infrastructure failure
```

Disaster-domain findings therefore use a controlled finding schema and remain subject to human review.

---

## AI Service Status

The integrated AI service uses Ultralytics YOLO for computer-vision inference.

The current generic object detector produces raw observations. DrishtiX does not claim that generic YOLO detections are disaster-specific damage classifications.

The architecture is ready for a future disaster-specific model whose outputs can satisfy the validated disaster-domain finding contract.

The AI service is implemented with FastAPI. 

---

## Spatial Evidence Correlation

DrishtiX uses PostgreSQL with PostGIS to perform distance-based evidence discovery.

Relationships are deterministic and explainable.

```text
CORROBORATES
RELATED
POSSIBLE_DUPLICATE
DISPUTED
```

Relationship scores represent evidence-relationship strength, not probability and not AI confidence.

Examples include same-type reports within the configured spatial radius, source diversity, verification state, temporal proximity, and explicit trusted-versus-rejected contradictions.

Rejected evidence cannot become ordinary corroborating support.

---

## Evidence Clusters

Pairwise evidence relationships are converted into deterministic disaster-level evidence clusters.

Cluster states include:

```text
CORROBORATED
DISPUTED
RELATED
ISOLATED
```

Clusters are derived from findings and persisted relationships rather than stored as a separate source of truth.

Rejected findings may remain visible for auditability but are excluded from active support calculations.

Derived `FUSION` findings are intentionally excluded from source-evidence clustering to prevent feedback loops.

---

## Fusion Recommendations

A corroborated cluster may generate a deterministic fusion recommendation.

Fusion considers factors such as dominant finding type, trusted observations, source diversity, evidence membership, severity, and relationship structure.

A generated recommendation remains:

```text
PENDING
```

until a Commander reviews it.

Approval creates a new finding with:

```text
source = FUSION
verificationStatus = PENDING
```

The resulting finding must still pass the normal human verification workflow.

Fusion support strength is not AI confidence.

---

## Operational Prioritization

DrishtiX provides a deterministic inspection-priority engine.

Priority scores are based on explainable components including:

```text
severity
verification state
evidence-cluster state
source diversity
corroboration
recency
fusion review requirements
```

Priorities are ranked from `0–100` and mapped to operational levels:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

The score determines what humans should inspect first. It does not automatically dispatch resources.

---

## Human Verification

Findings can move through:

```text
PENDING
CONFIRMED
CORRECTED
REJECTED
```

Verification uses transactional updates and PostgreSQL row locking.

Every decision creates an immutable audit record containing before/after state and reviewer metadata.

Verification history remains visible even when the current finding state changes.

---

## Authentication and RBAC

DrishtiX currently implements signed backend-validated demo sessions with three operational roles.

| Role | Read operational intelligence | Submit evidence | Verify findings | Review fusion | Manage disasters |
|---|---:|---:|---:|---:|---:|
| `VIEWER` | Yes | No | No | No | No |
| `RESPONDER` | Yes | Yes | No | No | No |
| `COMMANDER` | Yes | Yes | Yes | Yes | Yes |

The backend is the security boundary. UI visibility rules improve the experience but do not replace server-side authorization.

Current authentication is suitable for the project demonstration. A production deployment should replace environment-backed demo accounts with persistent identities, hashed credentials or organizational SSO, token revocation, MFA where appropriate, and a complete authorization model.

---

## Repository Structure

```text
DrishtiX/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── public/
│
├── backend/
│   ├── migrations/
│   └── src/
│       ├── config/
│       ├── integrations/
│       ├── modules/
│       │   ├── auth/
│       │   ├── disasters/
│       │   ├── findings/
│       │   └── imagery/
│       └── scripts/
│
├── ai-service/
│   ├── app/
│   ├── routes/
│   ├── schemas/
│   └── services/
│
└── README.md
```

---

# Local Setup

## Prerequisites

Use Node.js 20+ and npm for the frontend/backend, PostgreSQL 18 with PostGIS for spatial features, Python 3.11+ for the AI service, and Git.

PostGIS is required for migrations `007+`.

---

## Clone

```bash
git clone https://github.com/Aryanbharti214/DrishtiX.git
cd DrishtiX
```

---

## PostgreSQL + PostGIS

Create the database:

```bash
createdb drishtix
```

Make sure PostgreSQL can see PostGIS:

```sql
SELECT name, default_version
FROM pg_available_extensions
WHERE name = 'postgis';
```

Enable it:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Run migrations in order:

```bash
psql -d drishtix -f backend/migrations/001_create_disasters.sql
psql -d drishtix -f backend/migrations/002_create_imagery.sql
psql -d drishtix -f backend/migrations/003_create_ai_runs.sql
psql -d drishtix -f backend/migrations/004_create_findings.sql
psql -d drishtix -f backend/migrations/005_enhance_findings.sql
psql -d drishtix -f backend/migrations/006_create_finding_verifications.sql
psql -d drishtix -f backend/migrations/007_add_postgis_spatial_findings.sql
psql -d drishtix -f backend/migrations/008_create_finding_relations.sql
psql -d drishtix -f backend/migrations/009_create_fusion_recommendations.sql
```

If PostgreSQL runs on a non-default port, add for example:

```bash
-p 5433
```

to the `psql` commands.

---

## Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configure `.env` with the correct database URL, AI service URL, role credentials, and a strong token secret.

Generate a token secret with:

```bash
openssl rand -hex 32
```

Run:

```bash
npm run dev
```

Backend:

```text
http://localhost:4000
```

Health:

```bash
curl http://localhost:4000/api/v1/health
```

Backend scripts include the reproducible demo seed command. 

---

## AI Service

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

The current FastAPI application exposes its health endpoint from `app/main.py`. 

Health:

```bash
curl http://127.0.0.1:8000/health
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend

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

---

# Demo Dataset

A deterministic synthetic incident can be generated with:

```bash
cd backend
npm run seed:demo
```

The command is defined in the backend package scripts. 

The demo is intentionally synthetic and exists to exercise the actual DrishtiX evidence pipeline.

It demonstrates responder findings, synthetic machine-assisted observations, corroboration, possible duplication, conflicting evidence, related evidence, isolation, cluster generation, priority ranking, fusion review, and verification.

Do not present seeded evidence as real-world disaster data.

---

## Recommended Demo Flow

```text
Login as VIEWER
    ↓
Dashboard
    ↓
Inspect live metrics and priority queue
    ↓
Open Intelligence Map
    ↓
Inspect corroborated evidence cluster
    ↓
Inspect evidence relationships
    ↓
Inspect disputed evidence
    ↓

Login as RESPONDER
    ↓
Create field finding / upload imagery
    ↓
Evidence enters correlation pipeline
    ↓

Login as COMMANDER
    ↓
Review evidence
    ↓
Generate fusion recommendation
    ↓
Approve recommendation
    ↓
FUSION finding created as PENDING
    ↓
Human verification
    ↓
Priority/dashboard state updates
```

This demonstrates both the intelligence pipeline and separation of operational responsibilities.

---

# Core API

Public endpoints:

```text
GET  /api/v1/health

POST /api/v1/auth/login
GET  /api/v1/auth/session
```

Authenticated disaster endpoints:

```text
GET   /api/v1/disasters
GET   /api/v1/disasters/:id

POST  /api/v1/disasters
PATCH /api/v1/disasters/:id
```

Authenticated imagery endpoints:

```text
POST /api/v1/imagery
POST /api/v1/imagery/:id/analyze

GET  /api/v1/imagery/:id
GET  /api/v1/imagery/disaster/:disasterId
```

Finding and verification endpoints:

```text
POST /api/v1/findings/manual

GET  /api/v1/findings/:id
GET  /api/v1/findings/disaster/:disasterId
GET  /api/v1/findings/imagery/:imageryId

POST /api/v1/findings/:id/verify
GET  /api/v1/findings/:id/verifications
```

Evidence-intelligence endpoints:

```text
POST /api/v1/findings/:id/correlate
GET  /api/v1/findings/:id/relations

GET  /api/v1/findings/disaster/:disasterId/clusters
GET  /api/v1/findings/disaster/:disasterId/priorities
```

Fusion endpoints:

```text
POST /api/v1/findings/disaster/:disasterId/clusters/:anchorFindingId/fusion-recommendation

GET  /api/v1/findings/disaster/:disasterId/fusion-recommendations

POST /api/v1/findings/fusion-recommendations/:id/review
```

---

# Development Checks

Backend:

```bash
cd backend
npm run typecheck
npm run build
```

Frontend:

```bash
cd frontend
npm run build
```

AI service:

```bash
cd ai-service
python -m compileall app routes schemas services
```

---

# Current Limitations

The current YOLO model is a generic object detector rather than a disaster-specific damage classifier.

Authentication currently uses environment-configured demonstration identities rather than a persistent user-management system.

The current Express-to-FastAPI analysis path is synchronous.

The evidence-correlation, clustering, fusion, and prioritization systems are deterministic decision-support mechanisms. They are not autonomous response systems.

Production hardening would additionally require broader automated testing, secrets management, CI/CD, observability, durable identity management, deployment hardening, and an appropriate disaster-specific model.

---

# Safety and Decision Model

DrishtiX is designed for decision support.

```text
AI output
   ↓
Evidence
   ↓
Correlation
   ↓
Recommendation
   ↓
Authorized human decision
```

The system does not automatically dispatch emergency resources, automatically verify findings, or convert generic object detections into disaster claims.

Operational authority remains with authorized human responders.
