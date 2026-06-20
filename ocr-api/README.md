# Tax5 OCR Backend (PaddleOCR + FastAPI)

This is a high-performance Python-based OCR backend microservice for Tax5 designed to process receipt images and retrieve parsed fields using popular, lightweight neural models via PaddleOCR.

## Features

- **FastAPI HTTP Endpoint**: Fully optimized framework hosting `GET /` and `POST /ocr/receipt` routing.
- **PaddleOCR Engine**: Multi-lingual text localization and recognition matching layout constructs perfectly.
- **Robust Field Extraction**: Algorithmic sorting / regex heuristics prioritizing merchant details, transaction dates, and total amounts.
- **JSON Compatibility**: Consistent structured format aligning securely with client state and safety definitions.

## Project Structure

```bash
ocr-api/
├── main.py            # Main FastAPI server with custom ocr parsing routines
├── requirements.txt   # Third-party dependency definitions
└── README.md          # Implementation and guidelines documentation
```

## Setup & Running Guide

1. **Prerequisite**  
   Make sure Python 3.8+ is installed.

2. **Open the backend folder**
   ```bash
   cd ocr-api
   
3. **Execution**:
   ```bash
  cd ocr-api
  python -m uvicorn main:app --reload --port 8000
   ```

## Endpoint Specification

### GET `/`
Verifies server health status.

### POST `/ocr/receipt`
Accepts a binary receipt image file multipart transfer.

- **Request Form-Data Key**: `file` (Image file)
- **Response Format**:
  ```json
  {
    "ok": true,
    "engine": "PaddleOCR",
    "fields": {
      "merchantName": "GIANT SUPERMARKET",
      "date": "14/06/2026",
      "amount": "145.20",
      "rawText": "GIANT SUPERMARKET...\nTOTAL RM145.20...",
      "lines": [
        { "text": "GIANT SUPERMARKET", "confidence": 0.985 }
      ],
      "confidenceNote": "Receipt reading is basic in this MVP. Please review and edit the detected details before saving."
    }
  }
  ```
