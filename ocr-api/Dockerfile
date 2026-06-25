FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
tesseract-ocr \
tesseract-ocr-eng \
libglib2.0-0 \
libgl1 \
libsm6 \
libxext6 \
libxrender1 \
libgomp1 \
&& rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m pip install --upgrade pip && \
pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 10000

CMD sh -c "python -m uvicorn main:app --host 0.0.0.0 --port \${PORT:-10000}"
