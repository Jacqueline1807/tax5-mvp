---

title: Tax5 OCR API
emoji: 🧾
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
-------------

# Tax5 OCR Backend (Tesseract OCR + FastAPI)

This is a lightweight Python-based OCR backend microservice for Tax5. It processes receipt images and returns structured receipt fields using Tesseract OCR with OpenCV preprocessing.

This backend is used as a backup OCR service for Tax5 receipt scanning.

## Why Tesseract OCR?

* **Lighter Footprint**: Replaces the resource-heavy PaddleOCR framework to reduce hosting issues on free deployment platforms.
* **No API Token Usage**: Tesseract runs through the backend and does not consume Gemini API tokens.
* **Preprocessing Support**: Receipt images are resized, converted to grayscale, and cleaned with Otsu thresholding before OCR.
* **Review-Based Output**: Extracted results are still treated as draft values. Users must review and edit receipt details before saving.

## Preprocessing & Extraction Pipeline

1. **Image Loading**: The uploaded receipt image is opened using PIL and converted safely to RGB/BGR.

2. **Image Resizing**: Large images are resized to reduce processing load.

3. **Grayscaling**: The image is converted into grayscale.

4. **Otsu Thresholding**: The image is binarized to improve text-background contrast:

   ```python
   cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
   ```

5. **Tesseract OCR**: The backend runs Tesseract OCR using selected Page Segmentation Modes such as `PSM 6` and fallback modes when needed.

6. **Heuristic Parsing**: The backend extracts merchant name, receipt date, amount, document type, and review status from the OCR text.

7. **Manual Review Reminder**: The returned result includes a confidence note reminding users to review detected details before saving.

## Project Structure

In the GitHub repository, this backend is stored in:

```bash
ocr-api/
├── main.py
├── requirements.txt
├── Dockerfile
└── README.md
```

When synced to Hugging Face Spaces, the files are placed at the Space root:

```bash
Dockerfile
main.py
requirements.txt
README.md
```

## Local Setup Guide

1. Install Tesseract OCR on your system:

   * macOS:

     ```bash
     brew install tesseract
     ```

   * Ubuntu/Debian:

     ```bash
     sudo apt-get install tesseract-ocr
     ```

   * Windows: Install Tesseract OCR from a trusted Windows installer such as UB Mannheim.

2. Open the backend folder:

   ```bash
   cd ocr-api
   ```

3. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Run the server locally:

   ```bash
   python -m uvicorn main:app --reload --port 7860
   ```

5. Test the backend:

   ```text
   http://localhost:7860/
   http://localhost:7860/docs
   ```

## Hugging Face Spaces Deployment

This backend is deployed as a Docker Space.

Required Hugging Face Space configuration is included at the top of this README:

```yaml
sdk: docker
app_port: 7860
```

The Dockerfile must expose and run the app on port `7860`.

Test URLs after deployment:

```text
https://jacqqq-tax5-ocr-api.hf.space/
https://jacqqq-tax5-ocr-api.hf.space/docs
```

## Render Deployment Settings

This backend can also be deployed on Render using Docker.

Recommended settings:

```text
Root Directory: ocr-api
Runtime / Environment: Docker
Health Check Path: /
```

For Render, Docker deployment is required because `pytesseract` needs the actual system Tesseract engine installed inside the container.

## API Endpoints

### Health Check

```http
GET /
```

Example response:

```json
{
  "status": "online",
  "service": "Tax5 OCR API Gateway",
  "engine": "FastAPI with Tesseract OCR",
  "endpoints": {
    "health": "/",
    "ocr": "/ocr/receipt"
  }
}
```

### Receipt OCR

```http
POST /ocr/receipt
```

Request format:

```text
multipart/form-data
file: receipt image
```

## Response Schema

### Clear Receipt

```json
{
  "ok": true,
  "engine": "Tesseract OCR",
  "preprocessingApplied": true,
  "selectedPsm": "psm_6",
  "needsReview": false,
  "documentType": "receipt",
  "fields": {
    "merchantName": "KLINIK KESIHATAN CO",
    "date": "14/06/2026",
    "amount": "145.20",
    "rawText": "KLINIK KESIHATAN CO...\nTOTAL RM145.20...",
    "lines": [
      {
        "text": "KLINIK KESIHATAN CO",
        "confidence": 0.95
      }
    ],
    "confidenceNote": "Receipt reading is basic in this MVP. Please review and edit the detected details before saving."
  }
}
```

### Complex Bill / Hospital Invoice

```json
{
  "ok": true,
  "engine": "Tesseract OCR",
  "preprocessingApplied": true,
  "selectedPsm": "psm_11",
  "needsReview": true,
  "documentType": "complex_bill",
  "fields": {
    "merchantName": "COLUMBIA ASIA HOSPITAL",
    "date": "18/06/2026",
    "amount": "",
    "rawText": "COLUMBIA ASIA HOSPITAL...\nPATIENT ID 19283...\nLAB CHARGES 500.00\nWARD CHARGES 300.00",
    "lines": [],
    "confidenceNote": "This looks like a complex bill or invoice. Please confirm the final claimable amount before saving."
  }
}
```

### OCR Failure

```json
{
  "ok": false,
  "engine": "Tesseract OCR",
  "preprocessingApplied": true,
  "selectedPsm": "",
  "needsReview": true,
  "documentType": "unknown",
  "error": "OCR took too long or failed. Please use Manual Add.",
  "fields": {
    "merchantName": "",
    "date": "",
    "amount": "",
    "rawText": "",
    "lines": [],
    "confidenceNote": "Receipt reading failed. Please use Manual Add."
  }
}
```

## Important Notes

Tax5 is a pre-filing support tool only. OCR results are not official tax approval. Users must review receipt details and verify final claim eligibility using LHDN/MyTax information before filing.
