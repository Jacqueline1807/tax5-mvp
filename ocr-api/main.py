import re
import io
import logging
from typing import List, Dict, Any
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ocr-api")

app = FastAPI(
    title="Tax5 OCR API Backend",
    description="A FastAPI PaddleOCR microservice for scanning and extracting receipt details.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy initialization of PaddleOCR to speed up startup times
ocr_engine = None

def get_ocr_engine():
    global ocr_engine
    if ocr_engine is None:
        try:
            from paddleocr import PaddleOCR
            logger.info("Initializing PaddleOCR engine (en, ms)...")
            # Set use_angle_cls=False or True depending on rotation needs; we default to False for speed
            ocr_engine = PaddleOCR(lang="en")
            logger.info("PaddleOCR engine initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to load PaddleOCR library: {str(e)}")
            raise e
    return ocr_engine

def extract_metadata(text_lines: List[str]) -> Dict[str, str]:
    """Helper heuristics to extract merchant name, date, and amount from receipt raw text lines."""
    merchant_name = ""
    date_val = ""
    amount_val = ""

    # 1. Heuristic for Merchant Name: Usually the first non-empty line
    clean_lines = [line.strip() for line in text_lines if line.strip()]
    if clean_lines:
        merchant_name = clean_lines[0]
        # Check if first line is just random symbols/numbers, if so maybe try second line
        if len(merchant_name) < 3 or re.match(r'^[\d\W_]+$', merchant_name):
            if len(clean_lines) > 1:
                merchant_name = clean_lines[1]

    # Clean merchant name from common leading/trailing symbols
    merchant_name = re.sub(r'^[^\w\s]+|[^\w\s]+$', '', merchant_name).strip()

    # 2. Heuristic for Date: Match typical Malaysian / international formats
    # DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    date_patterns = [
        r'\b\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}\b',
        r'\b\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2}\b',
        r'\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b'
    ]
    
    found_dates = []
    for line in clean_lines:
        for pattern in date_patterns:
            matches = re.findall(pattern, line, re.IGNORECASE)
            if matches:
                found_dates.extend(matches)
                break
    
    if found_dates:
        # Use first matched date
        date_val = found_dates[0]

    # 3. Heuristic for Total Amount: Search for lines containing keywords like total, RM, amount
    amount_patterns = [
        r'\b(?:total|amount|rm|net|grand|sum|due|pay|cash)\b',
    ]
    decimal_pattern = r'\b\d+\.\d{2}\b'
    
    possible_amounts = []
    
    # First search for lines that have both a keyword and a decimal value
    for line in clean_lines:
        lower_line = line.lower()
        if any(re.search(pat, lower_line) for pat in amount_patterns):
            decimals = re.findall(decimal_pattern, line)
            if decimals:
                # Store (line, float_val)
                for dec in decimals:
                    try:
                        possible_amounts.append(float(dec))
                    except ValueError:
                        pass

    # If nothing found, just fall back to any decimal numbers on any line
    if not possible_amounts:
        for line in clean_lines:
            decimals = re.findall(decimal_pattern, line)
            for dec in decimals:
                try:
                    possible_amounts.append(float(dec))
                except ValueError:
                    pass

    if possible_amounts:
        # High likelihood that the maximum decimal value is the total amount on a receipt
        amount_val = f"{max(possible_amounts):.2f}"

    return {
        "merchantName": merchant_name,
        "date": date_val,
        "amount": amount_val
    }

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Tax5 OCR API Gateway",
        "engine": "FastAPI with PaddleOCR",
        "endpoints": {
            "health": "/",
            "ocr": "/ocr/receipt"
        }
    }

@app.post("/ocr/receipt")
async def ocr_receipt(file: UploadFile = File(...)):
    """Accepts an uploaded image file, processes it via PaddleOCR, and returns structured data."""
    try:
        # Read uploaded image bytes
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Ensure image is RGB
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        # Resize large images to reduce memory usage on Render Free
        image.thumbnail((1200, 1200))
            
        image_np = np.array(image)
        
        # Get the initialized OCR tool
        ocr = get_ocr_engine()
        
        # Run PaddleOCR inference
        result = ocr.ocr(image_np, cls=False)
        
        lines = []
        raw_text_parts = []
        
        # Parse output formats
        if result and len(result) > 0 and result[0] is not None:
            # Result is a list of lines, where each line is: [ [ [x,y], [x,y], ... ], (text, confidence) ]
            for line_res in result[0]:
                text = line_res[1][0]
                confidence = float(line_res[1][1])
                lines.append({
                    "text": text,
                    "confidence": confidence
                })
                raw_text_parts.append(text)
                
        raw_text = "\n".join(raw_text_parts)
        
        # Extract metadata metrics from lines
        extracted = extract_metadata(raw_text_parts)
        
        return {
            "ok": True,
            "engine": "PaddleOCR",
            "fields": {
                "merchantName": extracted["merchantName"],
                "date": extracted["date"],
                "amount": extracted["amount"],
                "rawText": raw_text,
                "lines": lines,
                "confidenceNote": "Receipt reading is basic in this MVP. Please review and edit the detected details before saving."
            }
        }
        
    except Exception as e:
        logger.exception("Inference processing anomaly occured:")
        return JSONResponse(
            status_code=500,
            content={
                "ok": False,
                "engine": "PaddleOCR",
                "error": str(e),
                "fields": {
                    "merchantName": "",
                    "date": "",
                    "amount": "",
                    "rawText": "",
                    "lines": [],
                    "confidenceNote": "Receipt reading failed. Please use Manual Add."
                }
            }
        )
