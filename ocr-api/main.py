import re
import io
import logging
import cv2
import numpy as np
import pytesseract
from typing import List, Dict, Any
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ocr-api")

app = FastAPI(
    title="Tax5 OCR API Backend",
    description="A FastAPI Tesseract OCR microservice for scanning and extracting receipt details.",
    version="1.1.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def score_ocr_text(text: str) -> float:
    """Evaluate OCR quality based on receipt features and layout indicators."""
    score = 0.0
    if not text or len(text.strip()) < 5:
        return score
    
    # 1. Contains date: check standard or compact formats
    date_pattern = r'\b\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}\b'
    compact_date_pattern = r'\b\d{8}\b|\b\d{4}/\d{4}\b'
    if re.search(date_pattern, text) or re.search(compact_date_pattern, text):
        score += 50.0
        
    # 2. Contains RM or decimal amount
    if re.search(r'\bRM\s*\d+', text, re.IGNORECASE) or re.search(r'\b\d+\.\d{2}\b', text):
        score += 40.0
        
    # 3. Receipt keywords
    keywords = ["total", "subtotal", "jumlah", "amount", "receipt", "resit", "bill", "invoice", "tarikh"]
    for kw in keywords:
        if kw in text.lower():
            score += 15.0
            
    # 4. Sentence structure / line length
    lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 4]
    score += min(len(lines) * 2.0, 30.0)
    
    return score


def extract_merchant(lines: List[str]) -> str:
    """Prioritizes clinic/hospital names, sdn bhd company names, or fallback clean top line."""
    candidates = []
    
    # Commonly avoided lines in the header
    avoid_keywords = [
        "invoice", "tax invoice", "official receipt", "resit rasmi", "resit", "receipt", 
        "bill summary", "inpatient bill", "bill", "charges", "payment advice", "statement",
        "customer copy", "merchant copy", "original", "duplicate"
    ]
    
    for i, line in enumerate(lines[:15]):  # Look at top 15 non-empty lines
        clean_line = line.strip()
        if not clean_line or len(clean_line) < 3:
            continue
            
        lower_line = clean_line.lower()
        
        # Avoid lines with email, website, phone, address markers, or typical noise
        if "@" in lower_line or "www." in lower_line or ".com" in lower_line or ".my" in lower_line:
            continue
            
        # Avoid lines with long numeric strings (like registration numbers or account numbers)
        # unless it is clearly a sdn bhd / hospital name
        if re.search(r'\d{5,}', lower_line):
            if not any(kw in lower_line for kw in ["sdn", "bhd", "hospital", "klinik", "poliklinik", "clinic", "centre", "pharmacy"]):
                continue
                
        # Avoid lines that are purely address details
        address_keywords = ["jalan", "taman", "lorong", "no.", "block", "street", "klang", "selangor", "kuala lumpur", "poskod", "postcode", "tel:", "fax:", "phone:"]
        if any(akw in lower_line for akw in address_keywords):
            if not any(kw in lower_line for kw in ["sdn", "bhd", "hospital", "klinik", "poliklinik", "clinic", "centre", "pharmacy"]):
                continue
                
        # Avoid titles
        is_title_only = False
        for title in avoid_keywords:
            if lower_line == title or lower_line.replace(" ", "") == title.replace(" ", ""):
                is_title_only = True
                break
        if is_title_only:
            continue
            
        # Avoid patient info lines
        if any(pkw in lower_line for pkw in ["patient name", "nama pesakit", "doctor", "doktor", "collected by", "billed to", "sold to", "patient no"]):
            continue
            
        # Avoid date/time/total amount lines
        if re.search(r'\b\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}\b', lower_line) or "total" in lower_line or "rm" in lower_line:
            continue
            
        # Score the line candidate
        score = 100.0 - (i * 6.0)  # Preference for lines closer to the top
        
        # Medical / Corporate keywords get a major boost
        biz_keywords = ["hospital", "klinik", "poliklinik", "medical centre", "pharmacy", "sdn bhd", "clinic", "healthcare", "farmasi"]
        if any(bkw in lower_line for bkw in biz_keywords):
            score += 150.0
            
        # Strip trailing/leading non-alphanumeric chars except parentheses/hyphens
        candidate_clean = re.sub(r'^[^\w\s\(\)\.\-]+|[^\w\s\(\)\.\-]+$', '', clean_line).strip()
        if candidate_clean:
            candidates.append((candidate_clean, score))
            
    if candidates:
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[0][0]
        
    return ""


def extract_date(lines: List[str]) -> str:
    """Finds and normalizes Malaysian / standard date formats, handling compact OCR errors."""
    std_pattern = r'\b(\d{1,2})[-/\.](\d{1,2})[-/\.](\d{2,4})\b'
    compact_slash_pattern = r'\b(\d{2})(\d{2})/(\d{4})\b'
    compact_numeric_pattern = r'\b(\d{2})(\d{2})(\d{4})\b'
    
    candidates = []
    
    for i, line in enumerate(lines):
        lower_line = line.lower()
        
        # 1. Standard patterns
        match_std = re.search(std_pattern, line)
        if match_std:
            day, month, year = match_std.groups()
            if len(day) == 1: day = "0" + day
            if len(month) == 1: month = "0" + month
            if len(year) == 2: year = "20" + year
            
            if 1 <= int(month) <= 12 and 1 <= int(day) <= 31:
                date_str = f"{day}/{month}/{year}"
                score = 100.0
                
                # Boost priority dates near labels
                if any(x in lower_line for x in ["bill date", "issue date", "receipt date", "invoice date"]):
                    score += 150.0
                elif "date" in lower_line or "tarikh" in lower_line:
                    if any(x in lower_line for x in ["admission", "discharge", "print"]):
                        score -= 50.0  # Avoid these secondary dates
                    else:
                        score += 80.0
                candidates.append((date_str, score, i))
                continue
                
        # 2. Compact slash error: e.g. 1701/2023 -> 17/01/2023
        match_comp_slash = re.search(compact_slash_pattern, line)
        if match_comp_slash:
            day, month, year = match_comp_slash.groups()
            if 1 <= int(month) <= 12 and 1 <= int(day) <= 31:
                date_str = f"{day}/{month}/{year}"
                score = 75.0
                if any(x in lower_line for x in ["bill date", "issue date", "receipt date", "invoice date"]):
                    score += 150.0
                elif "date" in lower_line or "tarikh" in lower_line:
                    if any(x in lower_line for x in ["admission", "discharge", "print"]):
                        score -= 50.0
                    else:
                        score += 80.0
                candidates.append((date_str, score, i))
                continue
                
        # 3. Compact numeric: e.g. 17012023 -> 17/01/2023
        match_comp_num = re.search(compact_numeric_pattern, line)
        if match_comp_num:
            day, month, year = match_comp_num.groups()
            if 1 <= int(month) <= 12 and 1 <= int(day) <= 31 and 2015 <= int(year) <= 2028:
                date_str = f"{day}/{month}/{year}"
                score = 60.0
                if any(x in lower_line for x in ["bill date", "issue date", "receipt date", "invoice date"]):
                    score += 150.0
                elif "date" in lower_line or "tarikh" in lower_line:
                    if any(x in lower_line for x in ["admission", "discharge", "print"]):
                        score -= 50.0
                    else:
                        score += 80.0
                candidates.append((date_str, score, i))
                continue
                
    if candidates:
        # Sort by score descending, then by line order ascending to prioritize earlier occurrences
        candidates.sort(key=lambda x: (x[1], -x[2]), reverse=True)
        return candidates[0][0]
        
    return ""


def extract_amount(lines: List[str], raw_text: str) -> str:
    """Extracts the best decimal or normalized amount from receipt lines."""
    # Collect all valid decimals in the entire text first
    all_decimals_str = re.findall(r'\b\d{1,3}(?:,\d{3})*\.\d{2}\b|\b\d+\.\d{2}\b', raw_text)
    all_decimals = []
    for dec in all_decimals_str:
        val_str = dec.replace(",", "")
        try:
            all_decimals.append(float(val_str))
        except ValueError:
            pass
            
    all_decimals_set = set(all_decimals)
    
    priority_keywords = [
        "total amount", "grand total", "total", "amount due", "payable", 
        "subtotal", "jumlah besar", "jumlah", "amaun", "bayaran", "net payable"
    ]
    
    candidates = []
    
    for i, line in enumerate(lines):
        lower_line = line.lower()
        
        # Skip date lines if they don't have total keywords
        if re.search(r'\b\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}\b', line):
            if not any(kw in lower_line for kw in ["total", "amount", "payable", "jumlah"]):
                continue
                
        # Skip lines representing phones, registration codes, accounts, or dates
        if any(noise in lower_line for noise in ["phone", "tel:", "acc:", "acc no", "reg no", "invoice no", "receipt no", "tax invoice no"]):
            continue
            
        # Avoid time values like 14:30 or 04.01 if there's time context on the line
        if any(t_noise in lower_line for t_noise in ["am", "pm", "hrs", "time"]):
            if re.search(r'\b\d{1,2}[:\.]\d{2}\b', line):
                continue
                
        # Match decimals on this specific line
        decimals_on_line = re.findall(r'\b\d{1,3}(?:,\d{3})*\.\d{2}\b|\b\d+\.\d{2}\b', line)
        for dec in decimals_on_line:
            val_str = dec.replace(",", "")
            try:
                val = float(val_str)
            except ValueError:
                continue
                
            score = 50.0  # Base score
            
            # Boost score based on keyword match priority
            matched_kw = False
            for kw in priority_keywords:
                if kw in lower_line:
                    score += 150.0 - (priority_keywords.index(kw) * 10.0)
                    matched_kw = True
                    break
                    
            # Boost if "RM" or "MYR" is right there on the line
            if "rm" in lower_line or "myr" in lower_line:
                score += 40.0
                
            # Penalize typical line items (containing @ or x quantity descriptors)
            if any(item_noise in lower_line for item_noise in ["qty", " x ", " @ "]):
                score -= 40.0
                
            candidates.append((val, score, i))
            
        # Check compact total error: e.g. "TOTAL AMOUNT 5400"
        if any(kw in lower_line for kw in ["total", "amount", "payable", "jumlah", "amaun"]):
            integers = re.findall(r'\b\d{3,6}\b', line)
            for int_str in integers:
                try:
                    val_int = int(int_str)
                except ValueError:
                    continue
                normalized_val = val_int / 100.0
                if normalized_val in all_decimals_set:
                    # Validating match found somewhere on the receipt
                    score = 180.0
                    candidates.append((normalized_val, score, i))
                    
    if candidates:
        # Sort by score descending, then by decimal value descending (to capture grand total)
        candidates.sort(key=lambda x: (x[1], x[0]), reverse=True)
        return f"{candidates[0][0]:.2f}"
        
    # Fallback to the maximum parsed decimal in the whole document
    if all_decimals:
        return f"{max(all_decimals):.2f}"
        
    return ""


def detect_document_type_and_needs_review(lines: List[str], amount: str) -> tuple:
    """Classifies invoice, hospital bill, or standard receipt and assesses needsReview state."""
    complex_keywords = [
        "invoice", "inpatient bill", "bill summary", "book copy", 
        "hospital charges", "payable", "gross amount", "tax amount"
    ]
    
    raw_text_lower = "\n".join(lines).lower()
    is_complex = any(ckw in raw_text_lower for ckw in complex_keywords)
    
    if is_complex:
        # Check count of decimals on the receipt
        decimal_matches = re.findall(r'\b\d{1,3}(?:,\d{3})*\.\d{2}\b|\b\d+\.\d{2}\b', raw_text_lower)
        
        # If there are many decimals (>= 5) or hospital-specific text
        if len(decimal_matches) >= 5 or "hospital" in raw_text_lower or "inpatient" in raw_text_lower:
            # Check for a very clear and explicit grand total line
            has_clear_total = any(gkw in raw_text_lower for gkw in ["grand total", "total payable", "amount due", "net payable", "total amount due"])
            if not has_clear_total:
                # Clear amount since we don't want to guess a random line item
                return "complex_bill", "", True, "This looks like a complex bill or invoice. Please confirm the final claimable amount before saving."
            else:
                return "complex_bill", amount, True, "This looks like a complex bill or invoice. Please confirm the final claimable amount before saving."
                
    return "receipt", amount, False, "Receipt reading is basic in this MVP. Please review and edit the detected details before saving."


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Tax5 OCR API Gateway",
        "engine": "FastAPI with Tesseract OCR",
        "endpoints": {
            "health": "/",
            "ocr": "/ocr/receipt"
        }
    }


@app.post("/ocr/receipt")
async def ocr_receipt(file: UploadFile = File(...)):
    """Accepts an uploaded image file, processes it via Tesseract with preprocessing, and returns structured data."""
    try:
        # Read uploaded image bytes
        image_bytes = await file.read()
        
        logger.info("Preprocessing applied")
        
        # 1. Load image using PIL to support wide file encodings, convert to RGB safely
        image_pil = Image.open(io.BytesIO(image_bytes))
        if image_pil.mode != "RGB":
            image_pil = image_pil.convert("RGB")
            
        # Convert PIL Image to OpenCV BGR
        img = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
        
        # 2. Upscale image to 180% using cubic interpolation
        height, width = img.shape[:2]
        new_width = int(width * 1.8)
        new_height = int(height * 1.8)
        upscaled = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
        
        # 3. Convert to grayscale
        gray = cv2.cvtColor(upscaled, cv2.COLOR_BGR2GRAY)
        
        # 4. Apply Otsu thresholding
        _, processed_img = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # 5. Run Tesseract PSM modes to find the best layout parsing
        psm_modes = ["6", "11", "4"]
        ocr_results = {}
        
        for psm in psm_modes:
            config = f"--psm {psm}"
            logger.info(f"Running Tesseract PSM {psm}")
            try:
                text = pytesseract.image_to_string(processed_img, config=config)
                score = score_ocr_text(text)
                ocr_results[psm] = {
                    "text": text,
                    "score": score
                }
            except Exception as e:
                logger.warning(f"Failed to run Tesseract with PSM {psm}: {str(e)}")
                
        if not ocr_results:
            raise Exception("Tesseract OCR execution failed across all PSM modes.")
            
        # Select best PSM mode
        best_psm = max(ocr_results.keys(), key=lambda k: ocr_results[k]["score"])
        best_text = ocr_results[best_psm]["text"]
        logger.info(f"Selected OCR result: psm_{best_psm}")
        
        # Clean lines
        raw_lines = [line.strip() for line in best_text.split("\n") if line.strip()]
        lines_field = [{"text": line, "confidence": 0.95} for line in raw_lines]
        
        # Extract metadata
        merchant_name = extract_merchant(raw_lines)
        date_val = extract_date(raw_lines)
        amount_val = extract_amount(raw_lines, best_text)
        
        # Classify document type
        doc_type, amount_val, needs_review, conf_note = detect_document_type_and_needs_review(raw_lines, amount_val)
        
        logger.info(f"Document type: {doc_type}")
        logger.info(f"Needs review: {str(needs_review).lower()}")
        
        return {
            "ok": True,
            "engine": "Tesseract OCR",
            "preprocessingApplied": True,
            "selectedPsm": f"psm_{best_psm}",
            "needsReview": needs_review,
            "documentType": doc_type,
            "fields": {
                "merchantName": merchant_name,
                "date": date_val,
                "amount": amount_val,
                "rawText": best_text,
                "lines": lines_field,
                "confidenceNote": conf_note
            }
        }
        
    except Exception as e:
        logger.exception("Inference processing anomaly occured:")
        return JSONResponse(
            status_code=500,
            content={
                "ok": False,
                "engine": "Tesseract OCR",
                "preprocessingApplied": True,
                "selectedPsm": "",
                "needsReview": True,
                "documentType": "unknown",
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
