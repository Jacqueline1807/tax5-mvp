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
   ```

3. **Execution**:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

## Hugging Face Spaces Deployment (Docker)

To deploy this backend as a lightweight, scaling microservice on Hugging Face Spaces:

1. **Create a New Space**:
   - Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
   - Set a name for your Space.
   - For **SDK**, select **Docker** (choose the **Blank** template option / no pre-configured space to use the custom `Dockerfile`).
   - Choose your space visibility (Public or Private).

2. **Upload/Commit Files**:
   - Copy or upload the files inside the `ocr-api` folder (`Dockerfile`, `main.py`, `requirements.txt`) into the root directory of your Space repository.
   - You can upload these via the Hugging Face web interface or clone the Space's Git repository and push them.

3. **Port Routing**:
   - Hugging Face automatically detects and routes traffic on container port **7860**.
   - The provided `Dockerfile` is pre-configured to expose and listen on port **7860** via:
     ```dockerfile
     CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
     ```

4. **Verify Application status**:
   - Once building and startup completes, visit your space URL at standard HTTP endpoints:
     - `GET /` to verify the online status.
     - `GET /docs` to use the interactive Swagger documentation and test the API directly.

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
