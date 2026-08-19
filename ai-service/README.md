# DrishtiX AI Service

FastAPI service responsible for image analysis in DrishtiX.

## Current model behavior

The current integrated model is a generic Ultralytics YOLO detector. It returns raw object detections such as `person`, `car`, or `truck`.

DrishtiX intentionally does **not** convert those generic detections into disaster-domain findings such as `ROAD_BLOCKAGE` or `BUILDING_DAMAGE`.

Current response model:

```json
{
  "imageId": "...",
  "analysisType": "GENERIC_OBJECT_DETECTION",
  "model": {
    "name": "yolo26n",
    "version": "0.1.0"
  },
  "processingTimeMs": 125.4,
  "detections": [],
  "findings": []
}
```

## Structure

```text
ai-service/
├── app/
│   └── main.py
├── routes/
│   ├── analyze.py
│   └── images.py
├── schemas/
│   └── analyze.py
├── services/
│   ├── analyze_service.py
│   ├── image_service.py
│   └── model_service.py
└── requirements.txt
```

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## Health

```bash
curl http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"healthy"}
```

## Swagger

```text
http://127.0.0.1:8000/docs
```

## Analyze endpoint

```text
POST /api/v1/analyze
```

Multipart fields:

- `image`: JPEG, PNG, or WebP
- `imageId`: valid imagery UUID

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/analyze \
  -F "image=@/absolute/path/to/image.jpg" \
  -F "imageId=2a3b0adc-1418-4f35-ba81-e710fdd4b786"
```

## Validation contract

The AI response contains:

- `imageId`
- `analysisType`
- `model.name`
- `model.version`
- `processingTimeMs`
- `detections[]`
- `findings[]`

Bounding boxes are validated as exactly four numeric coordinates. The Express backend validates the complete response again with Zod before it is persisted.

## Important design rule

```text
Raw detection != disaster finding != verified operational fact
```

A future disaster-specific model can populate the `findings` array using the shared finding types:

- `BUILDING_DAMAGE`
- `ROAD_BLOCKAGE`
- `INFRASTRUCTURE_DAMAGE`
- `SERVICE_DISRUPTION`

## Development checks

```bash
python -m compileall app routes schemas services
```

## Planned AI work

- Disaster-specific model integration
- Better geospatial metadata propagation
- Model/version provenance
- Model evaluation and confidence calibration
- Optional background execution when inference latency warrants it
