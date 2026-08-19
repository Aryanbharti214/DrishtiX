# DrishtiX Frontend

React/Vite frontend for DrishtiX.

## Stack

- React 19
- Vite
- Tailwind CSS
- React Leaflet
- Lucide React

## Current screens

- Dashboard
- Disaster Events
- Imagery
- Disaster Map & Hotspots
- Findings
- Human Verification
- Priority Queue
- Evidence
- Settings

Some dashboard/priority widgets still contain development placeholders until the priority engine is implemented.

## Setup

```bash
npm install
cp .env.example .env
```

Example `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_BACKEND_ORIGIN=http://localhost:4000
```

## Run

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Build

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Current functional flows

### Disaster selection

```text
Disaster Events
  -> create/select event
  -> current event is shared across the application
```

### Imagery

```text
Select disaster
  -> upload image
  -> backend stores image
  -> Run AI Analysis
  -> Express calls FastAPI
  -> image becomes ANALYZED or FAILED
```

### Findings

```text
Responder report
  -> PostgreSQL finding
  -> Findings page
  -> Live map marker
```

### Map reporting

```text
Report on Map
  -> click location
  -> coordinates captured
  -> create responder finding
  -> marker appears immediately
```

### Verification

```text
PENDING
  -> CONFIRMED
  -> CORRECTED
  -> REJECTED
```

Verification history is persisted by the backend and displayed in the UI.

## Design rule

The UI should never present a generic YOLO object detection as a verified disaster finding. Raw detections, disaster findings, and verified operational facts are intentionally separate concepts.

## Planned frontend work

- Real dashboard metrics
- Evidence correlation visualization
- Fusion recommendations
- Explainable priority scoring
- Authentication/RBAC-aware navigation and actions
- Better loading/error states and automated tests
