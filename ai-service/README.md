# DrishtiX AI Service

AI service for post-disaster flood assessment using semantic segmentation.

## Tech Stack

- Python
- FastAPI
- Ultralytics YOLO26n Semantic Segmentation
- PyTorch
- OpenCV
- NumPy

## Model

Production model:

- Name: `floodnet-yolo26n-sem`
- Version: `1.0.0`
- Task: Semantic Segmentation
- Input size: `640x640`
- Dataset: FloodNet

## Semantic Classes

| ID | Class |
|---:|---|
| 0 | Background |
| 1 | Building-flooded |
| 2 | Building-non-flooded |
| 3 | Road-flooded |
| 4 | Road-non-flooded |
| 5 | Water |
| 6 | Tree |
| 7 | Vehicle |
| 8 | Pool |
| 9 | Grass |

## API Endpoints

### Health Check

```http
GET /health