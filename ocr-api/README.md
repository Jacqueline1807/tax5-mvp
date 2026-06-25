# Tax5 OCR Backend (Tesseract OCR + FastAPI)

This is a lightweight, high-performance Python-based OCR backend microservice for Tax5 designed to process receipt images and retrieve parsed fields using Tesseract OCR. 

## Why Tesseract OCR?

- **Lighter Footprint**: Replaces the resource-heavy PaddleOCR framework to prevent out-of-memory container crashes on free hosting tiers (such as Render Free).
- **Advanced Preprocessing Pipeline**: Compensates for direct text recognition variance by executing high-precision image enhancement using OpenCV.
- **Multi-PSM Layout Evaluation**: Automatically runs multiple Page Segmentation Modes (PSM) and scores parsing results to select the cleanest text structure.

## Preprocessing & Extraction Pipeline

1. **Upscaling**: Safe BGR conversion followed by resizing the input image to **180%** using cubic interpolation (`cv2.INTER_CUBIC`).
2. **Grayscaling**: Normalizes chrominance details into single-channel luminance data.
3. **Otsu Thresholding**: Applies bimodal image binarization to clean text-background separation cleanly:
   ```python
   cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
   ```
4. **Scoring & Layout Assessment**: Evaluates outputs from Tesseract `PSM 6`, `PSM 11`, and `PSM 4` using date matches, currency indicators, receipt keywords, and line-length features.
5. **Heuristic Parsing**: Parses and extracts dates (resolving common compact OCR format errors like `17012023` to `17/01/2023`), amounts, complex hospital/medical invoices, and company/clinic merchant names.

---

## Project Structure

```bash
ocr-api/
├── main.py            # FastAPI entry point & Tesseract parsing routines
├── requirements.txt   # Third-party Python dependencies
├── Dockerfile         # Docker containerization configuration (Render compatible)
└── README.md          # Technical documentation and setup guidelines
```

---

## Local Setup Guide

1. **Install Tesseract OCR on your system**:
   - **macOS**: `brew install tesseract`
   - **Ubuntu/Debian**: `sudo apt-get install tesseract-ocr`
   - **Windows**: Download the installer from UB Mannheim.

2. **Open the backend folder**:
   ```bash
   cd ocr-api
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Server**:
   ```bash
   python -m uvicorn main:app --reload --port 10000
   ```

---

## Render Deployment Settings (Docker)

To host this backend on Render's free or paid tiers:

1. **Create Web Service**:
   - Connect your GitHub repository to Render.
   - Choose **Web Service**.

2. **Render Configurations**:
   - **Root Directory**: `ocr-api`
   - **Runtime / Environment**: `Docker`
   - **Instance Type**: Free or Starter
   - **Health Check Path**: `/`

3. **Test Endpoints & URLs**:
   - Root URL: `GET /` (checks backend online status)
   - Interactive Swagger docs: `GET /docs` (to manually test image upload and check extraction output)

---

## Response Schema Specifications

### Clear Receipt (`GET /ocr/receipt`)
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
      { "text": "KLINIK KESIHATAN CO", "confidence": 0.95 }
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
