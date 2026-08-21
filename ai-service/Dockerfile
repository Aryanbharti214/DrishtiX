FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV YOLO_CONFIG_DIR=/tmp/Ultralytics

RUN apt-get update \
    && apt-get install -y \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-deploy.txt ./requirements.txt

RUN pip install \
    --no-cache-dir \
    -r requirements.txt

COPY . .

RUN test -f /app/models/best.pt

RUN mkdir -p \
    /app/temp \
    /app/analysis_results

EXPOSE 8000

CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]