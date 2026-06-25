import React, { useState, useRef } from "react";
import { Camera, Sparkles, AlertCircle, Check, Loader2, Info, ChevronDown, ChevronUp, Trash2, Lock, Crown } from "lucide-react";
import { ClaimCategory, ClaimStatus, Receipt, SmartSetupData } from "../types";
import { SCAN_TEMPLATES, ScanTemplate } from "../data/mockTemplates";
import { adjustReceiptSuggestion, calculateCompletionStatus } from "../utils/suggestionEngine";
import { SuggestionInsightsCard } from "./SuggestionInsightsCard";
import { useLanguage } from "../context/LanguageContext";
import { BulkUploadView } from "./BulkUploadView";

export interface BulkReceiptQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
  status: "waiting" | "scanning" | "ready" | "failed";
  merchant: string;
  date: string;
  amount: string;
  category: ClaimCategory | "";
  claimStatus: ClaimStatus | "";
  notes: string;
  formBEItem: string;
  tax5DisplayName: string;
  evidenceType: string;
  detectedText: string;
  confidence: "High" | "Medium" | "Low";
  suggestionWhy: string;
  suggestionCheck: string;
  receiptImageDataUrl?: string;
  errorMsg?: string;
  validationErrors?: Record<string, string>;
}

interface AddScanViewProps {
  onSaveReceipt: (receipt: Omit<Receipt, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  smartSetup: SmartSetupData | null;
  isDemo?: boolean;
  simulatedPlan?: string;
  onTriggerUpgrade?: () => void;
  receiptsCount?: number;
}

const generateMockCanvasDataUrl = (merchant: string, amount: string, date: string, category?: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Background
  ctx.fillStyle = "#fcfcf9";
  ctx.fillRect(0, 0, 320, 420);

  // Border Dash/Solid
  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(8, 8, 304, 404);
  ctx.setLineDash([]); // Reset line dash

  // Header Title
  ctx.fillStyle = "#111827";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  const name = (merchant || "RECEIPT").toUpperCase();
  ctx.fillText(name, 160, 45);

  // Subtitle
  ctx.fillStyle = "#6B7280";
  ctx.font = "bold 10px monospace";
  ctx.fillText("DEMO RECEIPT PROOF", 160, 65);

  // Solid line
  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(25, 80);
  ctx.lineTo(295, 80);
  ctx.stroke();

  // Basic Info
  ctx.textAlign = "left";
  ctx.fillStyle = "#111827";
  ctx.font = "11px monospace";
  ctx.fillText(`DATE: ${date || "2026-06-17"}`, 25, 110);
  ctx.fillText(`REF: TX5-DEMO-${Math.floor(100000 + Math.random() * 900000)}`, 25, 128);
  ctx.fillText("STATUS: APPROVED", 25, 146);

  // Dashed line
  ctx.strokeStyle = "#4B5563";
  ctx.beginPath();
  ctx.setLineDash([3, 3]);
  ctx.moveTo(25, 165);
  ctx.lineTo(295, 165);
  ctx.stroke();
  ctx.setLineDash([]);

  // Category & Item
  ctx.fillStyle = "#111827";
  ctx.font = "bold 12px monospace";
  ctx.fillText("ITEMS", 25, 190);

  ctx.fillStyle = "#4B5563";
  ctx.font = "10px monospace";
  ctx.fillText(`Category: ${category || "Lifestyle/Other"}`, 25, 210);
  
  ctx.fillStyle = "#111827";
  ctx.font = "11px monospace";
  ctx.fillText("1x Verified Claim Expense", 25, 230);
  
  ctx.textAlign = "right";
  ctx.fillText(`RM ${amount}`, 295, 230);

  // Dashed line
  ctx.beginPath();
  ctx.setLineDash([3, 3]);
  ctx.moveTo(25, 260);
  ctx.lineTo(295, 260);
  ctx.stroke();
  ctx.setLineDash([]);

  // Total
  ctx.textAlign = "left";
  ctx.fillStyle = "#111827";
  ctx.font = "bold 13px monospace";
  ctx.fillText("TOTAL TYPE RM", 25, 290);

  ctx.textAlign = "right";
  ctx.fillText(`RM ${amount}`, 295, 290);

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = "#6B7280";
  ctx.font = "9px monospace";
  ctx.fillText("Thank you for testing Tax5!", 160, 350);

  return canvas.toDataURL("image/jpeg", 0.85);
};

export const AddScanView: React.FC<AddScanViewProps> = ({
  onSaveReceipt,
  onCancel,
  smartSetup,
  isDemo,
  simulatedPlan = "Free Demo",
  onTriggerUpgrade,
  receiptsCount = 0,
}) => {
  const { t, language } = useLanguage();
  
  const isOcrLocked = simulatedPlan === "Free Demo" && receiptsCount >= 3;

  const handleProAction = (e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onTriggerUpgrade) {
      onTriggerUpgrade();
    }
  };

  // Device camera and file picker input references
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Local state for the form fields
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ClaimCategory | "">("");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | "">("");
  const [notes, setNotes] = useState("");

  // Classification Guide Suggester State
  const [formBEItem, setFormBEItem] = useState("");
  const [tax5DisplayName, setTax5DisplayName] = useState("");
  const [evidenceType, setEvidenceType] = useState("");
  const [classificationReason, setClassificationReason] = useState("");

  // Smart suggestions insights states
  const [confidence, setConfidence] = useState<"High" | "Medium" | "Low">("Medium");
  const [suggestionWhy, setSuggestionWhy] = useState("");
  const [suggestionCheck, setSuggestionCheck] = useState("");

  // Mode selection state: "single" | "bulk"
  const [bulkUploadMode, setBulkUploadMode] = useState<"single" | "bulk">("single");

  // Bulk Upload Queue states
  const [bulkQueue, setBulkQueue] = useState<BulkReceiptQueueItem[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Full rich dropdown categories mapping to Form BE codes
  const dropdownOptions = [
    { id: "G9", label: language === "BM" ? "Gaya Hidup" : "Lifestyle", category: ClaimCategory.Lifestyle, helper: language === "BM" ? "Had RM2,500" : "Capped RM2,500", displayName: language === "BM" ? "Gaya Hidup - Membaca, Peranti & Internet" : "Lifestyle - Reading, Tech & Internet" },
    { id: "G6/G7", label: language === "BM" ? "Perubatan / Saringan Kesihatan" : "Medical / Health Screening", category: ClaimCategory.Medical, helper: language === "BM" ? "Gabungan RM10,000" : "Combined RM10,000", displayName: language === "BM" ? "Perubatan / Saringan Kesihatan" : "Medical / Health Screening" },
    { id: "G5", label: language === "BM" ? "Yuran Pendidikan" : "Education Fees", category: ClaimCategory.Education, helper: language === "BM" ? "Had RM7,050" : "Capped RM7,050", displayName: language === "BM" ? "Yuran Pendidikan Diri" : "Self-Education Fees" },
    { id: "G10", label: language === "BM" ? "Peralatan / Aktiviti Sukan" : "Sports Equipment / Activities", category: ClaimCategory.Sports, helper: language === "BM" ? "Had RM1,000" : "Capped RM1,000", displayName: language === "BM" ? "Gaya Hidup - Sukan" : "Lifestyle - Sports" },
    { id: "G17/G19", label: language === "BM" ? "Insurans / Takaful" : "Insurance / Takaful", category: ClaimCategory.Insurance, helper: language === "BM" ? "Gabungan RM3,000" : "Combined RM3,000", displayName: language === "BM" ? "Insurans / Takaful" : "Insurance / Takaful" },
    { id: "G2", label: language === "BM" ? "Ibu Bapa / Datuk Nenek" : "Parents / Grandparents Support", category: ClaimCategory.Other, helper: language === "BM" ? "Perlu semakan" : "Needs review", displayName: language === "BM" ? "Perbelanjaan Perubatan Ibu Bapa" : "Parents' Medical & Carer Expenses" },
    { id: "G3", label: language === "BM" ? "Peralatan Sokongan Asas" : "Basic Supporting Equipment", category: ClaimCategory.Other, helper: language === "BM" ? "Had RM6,000" : "Capped RM6,000", displayName: language === "BM" ? "Peralatan Sokongan Asas" : "Basic Supporting Equipment" },
    { id: "G11", label: language === "BM" ? "Peralatan Penyusuan Susu Ibu" : "Breastfeeding Equipment", category: ClaimCategory.Other, helper: language === "BM" ? "Had RM1,000" : "Capped RM1,000", displayName: language === "BM" ? "Peralatan Penyusuan Susu Ibu" : "Breastfeeding Equipment" },
    { id: "G12", label: language === "BM" ? "Tadika / Taska" : "Childcare / Kindergarten", category: ClaimCategory.Other, helper: language === "BM" ? "Had RM3,000" : "Capped RM3,000", displayName: language === "BM" ? "Pelepasan Yuran Tadika & Taska" : "Childcare & Kindergarten Relief" },
    { id: "G13", label: language === "BM" ? "Simpanan SSPN" : "SSPN Savings", category: ClaimCategory.Other, helper: language === "BM" ? "Had RM8,000" : "Capped RM8,000", displayName: language === "BM" ? "Simpanan Bersih SSPN" : "SSPN Net Savings" },
    { id: "G18", label: language === "BM" ? "Skim Persaraan Swasta (PRS)" : "Private Retirement Scheme (PRS)", category: ClaimCategory.Other, helper: language === "BM" ? "Had RM3,000" : "Capped RM3,000", displayName: language === "BM" ? "Anuiti PRS" : "PRS Deferred Annuity" },
    { id: "G20", label: "SOCSO / EIS", category: ClaimCategory.Other, helper: language === "BM" ? "Had RM350" : "Capped RM350", displayName: language === "BM" ? "Sumbangan PERKESO / SIP" : "SOCSO / EIS Contribution" },
    { id: "G21", label: language === "BM" ? "Mesin Kompos Sisa Makanan" : "Food Waste Composting Machine", category: ClaimCategory.Other, helper: language === "BM" ? "Had RM2,500" : "Capped RM2,500", displayName: language === "BM" ? "Mesin Kompos Sisa Makanan" : "Food Waste Composting Machine" },
    { id: "G22", label: language === "BM" ? "Faedah Pinjaman Perumahan Pertama" : "First Home Loan Interest", category: ClaimCategory.Other, helper: language === "BM" ? "Perlu semakan" : "Needs review", displayName: language === "BM" ? "Faedah Pinjaman Perumahan Pertama" : "First Home Loan Interest" },
    { id: "Other", label: language === "BM" ? "Pelepasan Lain Dibenarkan" : "Other Allowed Relief", category: ClaimCategory.Other, helper: language === "BM" ? "Perlu semakan" : "Needs review", displayName: language === "BM" ? "Pelepasan Lain Dibenarkan" : "Other Allowed Relief" }
  ];

  const [selectedOptionId, setSelectedOptionId] = useState("");

  // Synchronize dropdown visualization with simulated or Gemini-detected formBEItem
  React.useEffect(() => {
    if (formBEItem) {
      const optionExists = dropdownOptions.some(o => o.id === formBEItem);
      if (optionExists) {
        setSelectedOptionId(formBEItem);
      } else {
        setSelectedOptionId("Other");
      }
    } else {
      setSelectedOptionId("");
    }
  }, [formBEItem]);

  const handleDropdownChange = (selectedId: string) => {
    setSelectedOptionId(selectedId);
    if (!selectedId) {
      setCategory("");
      setFormBEItem("");
      setTax5DisplayName("");
      return;
    }
    const option = dropdownOptions.find(o => o.id === selectedId);
    if (option) {
      setCategory(option.category);
      setFormBEItem(option.id);
      setTax5DisplayName(option.displayName);
      if (errors.category) {
        setErrors(prev => ({ ...prev, category: "" }));
      }
      const isOther = option.id === "Other";
      const statusToApply = isOther ? ClaimStatus.CheckAgain : (claimStatus || ClaimStatus.Claimable);
      applySmartSuggestions(option.id, statusToApply, option.category);
    }
  };

  const applySmartSuggestions = (itemCode: string, initialStatus: ClaimStatus, overrideCategory?: ClaimCategory) => {
    const activeCategory = overrideCategory || (category as ClaimCategory) || ClaimCategory.Other;
    const result = adjustReceiptSuggestion(itemCode, activeCategory, initialStatus, smartSetup);
    setClaimStatus(result.claimStatus);
    setConfidence(result.confidence);
    setSuggestionWhy(result.why);
    setSuggestionCheck(result.check);
  };
  
  // Tracking current mockup templates
  const [templateIndex, setTemplateIndex] = useState(0);

  // UX animation states
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Receipt reading states (Gemini Integration)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [detectedText, setDetectedText] = useState("");
  const [isDetectedTextExpanded, setIsDetectedTextExpanded] = useState(false);
  const [geminiErrorMsg, setGeminiErrorMsg] = useState<string | null>(null);

  // Custom OCR states for Hugging Face
  const [ocrConfidenceNote, setOcrConfidenceNote] = useState<string | null>(null);
  const [ocrNeedsReview, setOcrNeedsReview] = useState<boolean>(false);
  const [ocrDocumentType, setOcrDocumentType] = useState<string | null>(null);

  // Camera in-app states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoReadAfterImageLoad, setAutoReadAfterImageLoad] = useState(false);
  const [isFromCamera, setIsFromCamera] = useState(false);

  // Clean stop tracks on unmount
  React.useEffect(() => {
    return () => {
      console.log("AddScanView component unmounting, stopping stream if active");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log("track stopped on unmount:", track.label);
        });
      }
    };
  }, []);

  // Set up camera controls
  const startCamera = async () => {
    console.log("camera start requested");
    setErrors({});
    setCameraError(null);
    setIsCameraOpen(true);
    setIsCameraStarting(true);
    setIsCameraReady(false);

    try {
      const constraints = {
        video: { facingMode: { ideal: "environment" } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("stream received", stream);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play()
          .then(() => console.log("video stream playing immediately"))
          .catch((err) => console.log("video play ready deferred", err));
      }
    } catch (err: any) {
      console.error("camera error", err);
      stopCamera();
      setErrors((prev) => ({
        ...prev,
        upload: "Camera is not available in this preview. Please use Upload File instead."
      }));
    }
  };

  const stopCamera = () => {
    console.log("stopping camera stream");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("track stopped:", track.label);
      });
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setIsCameraStarting(false);
    setIsCameraReady(false);
  };

  const checkVideoReady = () => {
    const video = videoRef.current;
    if (video) {
      console.log("checking dimensions:", video.videoWidth, "x", video.videoHeight);
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        console.log("video dimensions ready:", video.videoWidth, "x", video.videoHeight);
        setIsCameraReady(true);
        setIsCameraStarting(false);
      } else {
        setTimeout(checkVideoReady, 100);
      }
    }
  };

  const handleVideoLoadedMetadata = () => {
    console.log("video metadata loaded");
    checkVideoReady();
  };

  const handleVideoPlaying = () => {
    console.log("video starts playing");
    checkVideoReady();
  };

  const videoRefCallback = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      if (el.srcObject !== streamRef.current) {
        console.log("assigning stream in callback ref");
        el.srcObject = streamRef.current;
        el.play()
          .then(() => console.log("play succeeded inside callback ref"))
          .catch((err) => console.log("play waiting in callback ref", err));
      }
    }
  };

  const capturePhoto = () => {
    console.log("capture clicked");
    const video = videoRef.current;
    if (!video || !streamRef.current || !isCameraReady) {
      console.log("capture failed: camera not ready to snap");
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    console.log("video dimensions ready for paint", { width, height });

    if (width === 0 || height === 0) {
      console.log("video dimensions are zero");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            console.log("capture success", { blobSize: blob.size });
            const capturedFile = new File([blob], `captured_receipt_${Date.now()}.jpg`, { type: "image/jpeg" });
            setIsFromCamera(true);
            setAutoReadAfterImageLoad(true);
            processFile(capturedFile);
          } else {
            console.error("camera error: failed to convert canvas to blob");
            setErrors((prev) => ({ ...prev, upload: "Failed to grab frame from video stream. Please try again." }));
          }
        }, "image/jpeg");
      } else {
        console.error("camera error: canvas context init failed");
        setErrors((prev) => ({ ...prev, upload: "Failed to capture receipt. Please try again." }));
      }
    } catch (err) {
      console.error("camera error while drawing canvas frame:", err);
      setErrors((prev) => ({ ...prev, upload: "Failed to capture receipt. Please upload a file instead." }));
    } finally {
      stopCamera();
    }
  };

  // Shared processor for any files (both upload and camera captures)
  const processFile = (file: File) => {
    try {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, upload: "Please capture or select an image file format." }));
        return;
      }

      setSelectedFile(file);
      setErrors({});
      setScanMessage(null);
      setDetectedText("");
      setGeminiErrorMsg(null);

      // Establish preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);

      // Read as DataURL/Base64
      const reader = new FileReader();
      reader.onerror = () => {
        setErrors((prev) => ({ ...prev, upload: "Failed to load and read the image content. Please try again." }));
        setIsReading(false);
      };
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        const parts = resultStr.split(",");
        if (parts.length > 1) {
          setImageBase64(parts[1]);
        } else {
          setErrors((prev) => ({ ...prev, upload: "Failed to process image contents. Please try again." }));
        }
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File processing failure:", err);
      setErrors((prev) => ({ ...prev, upload: "An unexpected error occurred while processing the file." }));
    }
  };

  // Auto-read after captured photo loads Base64 & Mimetype
  React.useEffect(() => {
    if (imageBase64 && imageMimeType && autoReadAfterImageLoad) {
      setAutoReadAfterImageLoad(false);
      console.log("autoReadAfterImageLoad triggered, executing handleReadReceipt");
      handleReadReceipt();
    }
  }, [imageBase64, imageMimeType, autoReadAfterImageLoad]);

  // Background resize & compression for localStorage safety
  React.useEffect(() => {
    if (imageBase64 && imageMimeType) {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1000; // max dimension to keep localStorage safe
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.75); // high compression, beautiful look
            setCompressedDataUrl(dataUrl);
          } else {
            setCompressedDataUrl(`data:${imageMimeType};base64,${imageBase64}`);
          }
        } catch (err) {
          console.error("Failed to compress image:", err);
          setCompressedDataUrl(`data:${imageMimeType};base64,${imageBase64}`);
        }
      };
      img.onerror = () => {
        setCompressedDataUrl(`data:${imageMimeType};base64,${imageBase64}`);
      };
      img.src = `data:${imageMimeType};base64,${imageBase64}`;
    }
  }, [imageBase64, imageMimeType]);

  // Image Upload and Base64 convert handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files.length > 0) {
        console.log("file loaded via input:", e.target.files[0].name, e.target.files[0].size);
        setIsFromCamera(false);
        processFile(e.target.files[0]);
      }
    } finally {
      // Reset input value so it can be reselected
      e.target.value = "";
    }
  };

  // Clear or reset image states
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setImageBase64(null);
    setImageMimeType(null);
    setCompressedDataUrl(null);
    setDetectedText("");
    setScanMessage(null);
    setGeminiErrorMsg(null);
    setOcrConfidenceNote(null);
    setOcrNeedsReview(false);
    setOcrDocumentType(null);
    setErrors({});
    setIsFromCamera(false);
    setAutoReadAfterImageLoad(false);
    
    // Revoke object URL to avoid memory leak
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
  };

  const convertOcrDateToInputFormat = (ocrDate: string): string => {
    if (!ocrDate) return "";
    const cleaned = ocrDate.replace(/[-\.]/g, "/");
    const parts = cleaned.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (day.length <= 2 && month.length <= 2 && year.length === 4) {
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(ocrDate)) {
      return ocrDate;
    }
    return "";
  };

  const mapOcrToTaxCode = (merchant: string, rawText: string, linesText: string = ""): string => {
    const combined = `${merchant} ${rawText} ${linesText}`.toLowerCase();
    
    // 1. G6/G7: Medical / Health Screening (Check medical keywords first to be precise)
    if (/hospital|medical bill|clinic|klinik|poliklinik|pharmacy|farmasi|medicine|medicines|ubat|consultation|treatment|dialysis|peritoneal dialysis|health screening|pemeriksaan kesihatan|laboratory|imaging|rehabilitation|nursing care|guardian|watsons|caring pharmacy|screen|blood test|ultrasound|covid|thermometer|oximeter|doctor|physio|dental|gigi/.test(combined)) {
      return "G6/G7";
    }

    // 2. G9: Lifestyle Books & Devices
    if (/bookstore|book|books|popular|mph|kinokuniya|border|stationery|laptop|computer|smartphone|wifi|internet|telekom|unifi|maxis|digi|celcom|u mobile|asus|lenovo|hp |dell|apple|macbook|ipad/.test(combined)) {
      return "G9";
    }
    
    // 3. G10: Lifestyle Sports
    if (/sports|gym|decathlon|equipment|badminton|fitness|nike|adidas|puma|under armour|runners|running|court|golf|tennis|swim|bicycle|cycling/.test(combined)) {
      return "G10";
    }
    
    // 4. G5: Education Fees
    if (/university|tuition|course|education|school|training|college|universiti|yuran|akademi/.test(combined)) {
      return "G5";
    }
    
    // 5. G17/G19: Insurance / Takaful
    if (/insurance|takaful|premium|aia|prudential|allianz|great eastern|zurich|etiqa|manulife/.test(combined)) {
      return "G17/G19";
    }
    
    // 6. G12: Childcare & Kindergarten Relief
    if (/taska|tadika|kindergarten|childcare|nursery|preschool/.test(combined)) {
      return "G12";
    }
    
    // 7. G11: Breastfeeding Equipment
    if (/breast pump|breastpump|lactation|breastfeed|milk cooler|cooler bag/.test(combined)) {
      return "G11";
    }
    
    // 8. G18: PRS
    if (/prs|private retirement scheme|public mutual prs|kenanga prs|affin prs/.test(combined)) {
      return "G18";
    }
    
    // 9. G13: SSPN
    if (/sspn|simpan sspn|ptptn/.test(combined)) {
      return "G13";
    }
    
    // 10. G20: SOCSO / EIS
    if (/socso|perkeso|eis|sip sumb/.test(combined)) {
      return "G20";
    }
    
    // 11. G21: Food Waste Composting Machine
    if (/compost|composter|sisa makanan/.test(combined)) {
      return "G21";
    }

    // 12. G22: First housing loan
    if (/housing loan|interest spa|housing interest/.test(combined)) {
      return "G22";
    }

    // 13. G2: Parents Medical
    if (/parents medical|parent medical|ibu bapa perubatan/.test(combined)) {
      return "G2";
    }

    // 14. G3: Basic supporting equipment
    if (/wheelchair|artificial limb|jkm/.test(combined)) {
      return "G3";
    }

    return "Other";
  };

  // Call Tesseract OCR backend processing
  const handleReadReceipt = async () => {
    let fileToUpload = selectedFile;
    if (!fileToUpload && imageBase64) {
      try {
        const byteString = atob(imageBase64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: imageMimeType || "image/jpeg" });
        fileToUpload = new File([blob], "receipt.jpg", { type: imageMimeType || "image/jpeg" });
      } catch (err) {
        console.error("Failed to recover file from base64:", err);
      }
    }
    
    if (!fileToUpload) {
      setErrors((prev) => ({ ...prev, upload: language === "BM" ? "Sila pilih atau muat naik imej resit terlebih dahulu." : "Please select or upload a receipt image first." }));
      return;
    }

    setIsReading(true);
    setErrors({});
    setScanMessage(null);
    setGeminiErrorMsg(null);
    setDetectedText("");
    setOcrConfidenceNote(null);
    setOcrNeedsReview(false);
    setOcrDocumentType(null);

    try {
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const response = await fetch("https://jacqqq-tax5-ocr-api.hf.space/ocr/receipt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Could not read receipt clearly. Please enter details manually.");
      }

      const data = await response.json();

      if (!data || !data.ok || !data.fields) {
        throw new Error("Could not read receipt clearly. Please enter details manually.");
      }

      const fields = data.fields;

      // Auto-fill our forms
      setMerchant(fields.merchantName || "");
      
      const parsedInputDate = convertOcrDateToInputFormat(fields.date);
      setDate(parsedInputDate || "");
      
      // Keep amount formatting consistent
      let formattedAmount = "";
      if (fields.amount) {
        // Strip non-numeric currency signs
        const cleaned = fields.amount.replace(/[^0-9.]/g, "");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          formattedAmount = parsed.toFixed(2);
        } else {
          formattedAmount = fields.amount;
        }
      }
      setAmount(formattedAmount);

      setNotes(fields.confidenceNote || "");
      setDetectedText(fields.rawText || "");
      
      // Custom Tesseract metadata states
      setOcrConfidenceNote(fields.confidenceNote || null);
      setOcrNeedsReview(!!data.needsReview);
      setOcrDocumentType(data.documentType || null);

      // Client-side Tax Code classification
      const combinedLinesText = (fields.lines || []).map((l: any) => l.text || "").join(" ");
      const matchedCode = mapOcrToTaxCode(fields.merchantName || "", fields.rawText || "", combinedLinesText);
      const matchedOption = dropdownOptions.find(o => o.id === matchedCode) || dropdownOptions.find(o => o.id === "Other");

      if (matchedOption) {
        setCategory(matchedOption.category);
        setFormBEItem(matchedOption.id);
        setTax5DisplayName(matchedOption.displayName);
        setEvidenceType(matchedOption.id === "Other" ? "Receipt-based" : (matchedOption.id === "G22" ? "SPA/Contract-based" : "Receipt-based"));
        
        let classificationText = language === "BM"
          ? "Penjenisan cukai dicadangkan menggunakan enjin padanan pintar Tax5."
          : "Tax classification suggested using Tax5 smart matching engine.";
        if (data.needsReview) {
          classificationText += " " + (language === "BM" ? "Disyorkan untuk semakan tambahan." : "Additional review recommended.");
        }
        setClassificationReason(classificationText);

        // Claim status consistency logic:
        // - If category is confidently matched and needsReview is false, allow suggested status “Claimable”.
        // - If category is not matched (i.e. is "Other"), set status to “Needs Review”.
        // - If documentType is “complex_bill”, set status to “Needs Review”.
        // - If needsReview is true, set status to “Needs Review”.
        const categoryMatched = matchedOption.id !== "Other";
        const isComplex = data.documentType === "complex_bill";
        const needsReview = !!data.needsReview;

        const shouldNeedReview = !categoryMatched || needsReview || isComplex;
        const initialStatus = shouldNeedReview ? ClaimStatus.CheckAgain : ClaimStatus.Claimable;

        // Call our smart suggestion engine with appropriate initial status
        const result = adjustReceiptSuggestion(matchedOption.id, matchedOption.category, initialStatus, smartSetup);
        
        setClaimStatus(result.claimStatus);
        setConfidence(result.confidence);
        setSuggestionWhy(result.why);
        setSuggestionCheck(result.check);
      }

      setScanMessage(
        language === "BM"
          ? "Resit berjaya diproses oleh Tesseract OCR!"
          : "Receipt successfully processed by Tesseract OCR!"
      );
    } catch (err: any) {
      console.error("Hugging Face receipt extraction failed:", err);
      setGeminiErrorMsg(
        language === "BM"
          ? "Bacaan resit tidak tersedia buat masa ini. Anda boleh terus menggunakan Tambah Manual."
          : "Receipt reading is unavailable right now. You can continue using Manual Add."
      );
    } finally {
      setIsReading(false);
    }
  };

  const handleEnterManually = () => {
    setGeminiErrorMsg(null);
    const mInput = document.getElementById("input-merchant");
    if (mInput) {
      mInput.focus();
      mInput.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Triggering the receipt scanner simulation as fallback
  const handleSimulateScan = () => {
    setIsScanning(true);
    setErrors({});
    setScanMessage(null);
    setDetectedText("");

    // Simulate OCR Extraction delay (800ms)
    setTimeout(() => {
      // Pick template and rotate index for subsequent clicks
      const template: ScanTemplate = SCAN_TEMPLATES[templateIndex];
      setTemplateIndex((prev) => (prev + 1) % SCAN_TEMPLATES.length);

      // Populate form
      setMerchant(template.merchant);
      
      // Pick dynamic recent date to look relevant (current dates in 2026/2025)
      const mockDates = ["2026-03-15", "2026-04-02", "2026-05-10", "2026-01-20", "2026-02-28", "2026-05-18"];
      const selectedDate = mockDates[Math.floor(Math.random() * mockDates.length)];
      setDate(selectedDate);
      
      setAmount(template.amount.toFixed(2));
      setCategory(template.category);
      setClaimStatus(template.claimStatus);
      setNotes(language === "BM" && template.notesBM ? template.notesBM : template.notes);

      // Programmatic Simulation Guide info
      let simGCode = "Other";
      let simDisplayName = language === "BM" ? "Pelepasan cukai dibenarkan yang lain" : "Other allowable relief";
      let simEvidence = language === "BM" ? "Berasaskan resit" : "Receipt-based";
      let simReason = language === "BM"
        ? "Transaksi ini tidak sepadan dengan kategori pelepasan cukai standard. Sila sahkan sama ada ini adalah perbelanjaun perniagaan atau peribadi."
        : "This transaction does not match a standard tax relief category. Please verify this is business or personal.";

      if (template.merchant === "Popular Bookstore") {
        simGCode = "G9";
        simDisplayName = language === "BM" ? "Gaya Hidup - Membaca, Peranti & Internet" : "Lifestyle - Reading, Tech & Internet";
        simEvidence = language === "BM" ? "Berasaskan resit" : "Receipt-based";
        simReason = language === "BM"
          ? "Ini kelihatan seperti resit Gaya Hidup untuk buku. Sila sahkan ini adalah untuk kegunaan peribadi atau keluarga."
          : "This looks like a Lifestyle receipt for books. Please confirm this was for personal or family use.";
      } else if (template.merchant === "Pantai Hospital Kuala Lumpur") {
        simGCode = "G2";
        simDisplayName = language === "BM" ? "Kos Perubatan & Penjagaan Ibu Bapa" : "Parents' Medical & Carer Expenses";
        simEvidence = language === "BM" ? "Berasaskan resit" : "Receipt-based";
        simReason = language === "BM"
          ? "Ini mungkin tuntutan Perubatan, tetapi ia memerlukan pemeriksaan lanjut kerana tuntutan perubatan untuk ibu bapa memerlukan bil yang diperakui atau dokumen penjaga berdaftar."
          : "This may be Medical, but it needs checking because medical claims for parents require certified bills or registered carer documents.";
      } else if (template.merchant === "Decathlon KL East") {
        simGCode = "G10";
        simDisplayName = language === "BM" ? "Gaya Hidup - Sukan" : "Lifestyle - Sports";
        simEvidence = language === "BM" ? "Berasaskan resit" : "Receipt-based";
        simReason = language === "BM"
          ? "Ini kelihatan seperti resit Gaya Hidup Sukan. Sila sahkan ia adalah untuk kegunaan peribadi atau keluarga dan bukan sukan bermotor/komersial."
          : "This looks like a Lifestyle Sports receipt. Please confirm it was for personal or family use and not motorized/commercial sports.";
      } else if (template.merchant === "Prudential Assurance Malaysia") {
        simGCode = "G17";
        simDisplayName = language === "BM" ? "Insurans Hayat & KWSP" : "Life Insurance & EPF";
        simEvidence = language === "BM" ? "Berasaskan rekod pembayaran" : "Payment-record-based";
        simReason = language === "BM"
          ? "Ini kelihatan seperti pembayaran insurans. Sila semak jenis polisi sebelum memfailkan. Penjawat awam berpencen mempunyai had yang berbeza."
          : "This looks like an insurance payment. Please check the policy type before filing. Pensionable public servants have different limits.";
      } else if (template.merchant === "Brickfields College (BAC)") {
        simGCode = "G5";
        simDisplayName = language === "BM" ? "Yuran Pendidikan Diri" : "Self-Education Fees";
        simEvidence = language === "BM" ? "Berasaskan resit" : "Receipt-based";
        simReason = language === "BM"
          ? "Yuran kursus pendidikan diri perlu disahkan dengan senarai institusi yang diiktiraf oleh LHDN dan kursus pengajian yang layak."
          : "Self-education course fees need to be verified against LHDN's list of recognized institutions and eligible courses of study.";
      } else if (template.merchant === "FamilyMart Bangsar") {
        simGCode = "Other";
        simDisplayName = language === "BM" ? "Pelepasan cukai dibenarkan yang lain" : "Other allowable relief";
        simEvidence = language === "BM" ? "Berasaskan resit" : "Receipt-based";
        simReason = language === "BM"
          ? "Ini kelihatan seperti perbelanjaan makanan atau makan minum. Perbelanjaan makan peribadi tidak boleh dituntut di bawah pelepasan cukai Malaysia."
          : "This looks like dining or food expenditure. Personal meals cannot be claimed under Malaysian tax reliefs.";
      } else if (template.merchant === "SSPN-i Deposit (PTPTN)") {
        simGCode = "G13";
        simDisplayName = language === "BM" ? "Tabungan Bersih SSPN" : "SSPN Net Savings";
        simEvidence = language === "BM" ? "Berasaskan resit" : "Receipt-based";
        simReason = language === "BM"
          ? "Resit simpanan pendidikan anak SSPN. Ingat bahawa resit sahaja mungkin tidak menunjukkan simpanan bersih anda. Semak penyata SSPN anda dan kemas kini jumlah jika perlu."
          : "SSPN child savings receipt. Remember that the receipts alone may not show your net savings. Check your SSPN statement and update the final amount if needed.";
      }

      setFormBEItem(simGCode);
      setTax5DisplayName(simDisplayName);
      setEvidenceType(simEvidence);

      const simDisclaimer = language === "BM"
        ? "Penafian: Tax5 memberikan cadangan persediaan sahaja. Kelayakan tuntutan akhir mesti disemak menggunakan maklumat rasmi LHDN/MyTax."
        : "Disclaimer: Tax5 gives a preparation suggestion only. Final claim eligibility must be checked using official LHDN/MyTax information.";

      setClassificationReason(`${simReason} \n\n${simDisclaimer}`);

      // Apply smart suggestions
      applySmartSuggestions(simGCode, template.claimStatus);
      
      const rawText = language === "BM"
        ? `=== RAW RESIT DISIMULASIKAN ===\nKEDAI: ${template.merchant}\nTARIKH: ${selectedDate}\nPEMBAYARAN: TUNAI / ATAS TALIAN\nITEM:\n- item boleh cukai 1x RM ${template.amount.toFixed(2)}\nJUMLAH: RM ${template.amount.toFixed(2)}\n=============================\nPERATURAN TAX5 DIKESAN\nTIADA NASIHAT RASMI DIMAKSUDKAN.`
        : `=== SIMULATED RAW RECEIPT ===\nSTORE: ${template.merchant}\nDATE: ${selectedDate}\nPAYMENT: CASH / ONLINE\nITEMS:\n- taxable items 1x RM ${template.amount.toFixed(2)}\nTOTAL: RM ${template.amount.toFixed(2)}\n=============================\nTAX5 RULES DETECTED\nNO OFFICIAL ADVICE IMPLIED.`;
      setDetectedText(rawText);

      // Generate inline mock proof receipt image!
      const mockSvgUrl = generateMockCanvasDataUrl(template.merchant, template.amount.toFixed(2), selectedDate);
      setCompressedDataUrl(mockSvgUrl);

      setIsScanning(false);
      setScanMessage(language === "BM" ? "Simulasi selesai! Sila sahkan medan yang telah diisi di bawah." : "Simulation complete! Verify the pre-filled fields below.");
    }, 900);
  };

  const readFileAsBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        const parts = resultStr.split(",");
        if (parts.length > 1) {
          resolve({ base64: parts[1], mimeType: file.type });
        } else {
          reject(new Error("Failed to extract base64 data."));
        }
      };
      reader.onerror = () => {
        reject(new Error("FileReader error."));
      };
      reader.readAsDataURL(file);
    });
  };

  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (!file || file.size === 0) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDim = 1000;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL("image/jpeg", 0.75));
            } else {
              resolve(reader.result as string);
            }
          } catch (err) {
            console.error("Compression error:", err);
            resolve(reader.result as string);
          }
        };
        img.onerror = () => resolve(reader.result as string);
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const processSequentialQueue = async (currentQueue: BulkReceiptQueueItem[]) => {
    setIsProcessingBulk(true);
    
    for (let i = 0; i < currentQueue.length; i++) {
      const item = currentQueue[i];
      if (item.status !== "waiting") continue;

      setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "scanning" } : q));

      try {
        const compressedDataUrl = await compressImageFile(item.file);

        const formData = new FormData();
        formData.append("file", item.file);

        const response = await fetch("https://jacqqq-tax5-ocr-api.hf.space/ocr/receipt", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to scan receipt");
        }

        const resData = await response.json();
        if (!resData || !resData.ok || !resData.fields) {
          throw new Error("Could not read receipt clearly.");
        }

        const fields = resData.fields;

        let formattedAmount = "";
        if (fields.amount) {
          const cleaned = fields.amount.replace(/[^0-9.]/g, "");
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed)) {
            formattedAmount = parsed.toFixed(2);
          } else {
            formattedAmount = fields.amount;
          }
        }

        const combinedLinesText = (fields.lines || []).map((l: any) => l.text || "").join(" ");
        const matchedCode = mapOcrToTaxCode(fields.merchantName || "", fields.rawText || "", combinedLinesText);
        const matchedOption = dropdownOptions.find(o => o.id === matchedCode) || dropdownOptions.find(o => o.id === "Other");
        
        const categoryMatched = matchedOption && matchedOption.id !== "Other";
        const isComplex = resData.documentType === "complex_bill";
        const needsReview = !!resData.needsReview;

        const shouldNeedReview = !categoryMatched || needsReview || isComplex;
        const initialStatus = shouldNeedReview ? ClaimStatus.CheckAgain : ClaimStatus.Claimable;

        const activeCategory = matchedOption?.category || ClaimCategory.Other;
        const resultSuggestion = adjustReceiptSuggestion(matchedOption?.id || "Other", activeCategory, initialStatus, smartSetup);

        const parsedInputDate = convertOcrDateToInputFormat(fields.date);

        setBulkQueue(prev => prev.map(q => q.id === item.id ? {
          ...q,
          status: "ready",
          merchant: fields.merchantName || "",
          date: parsedInputDate || "",
          amount: formattedAmount,
          category: activeCategory,
          claimStatus: resultSuggestion.claimStatus,
          notes: fields.confidenceNote || "",
          formBEItem: matchedOption?.id || "Other",
          tax5DisplayName: matchedOption?.displayName || "Other Allowed Relief",
          evidenceType: matchedOption?.id === "Other" ? "Receipt-based" : (matchedOption?.id === "G22" ? "SPA/Contract-based" : "Receipt-based"),
          detectedText: fields.rawText || "",
          confidence: resultSuggestion.confidence,
          suggestionWhy: resultSuggestion.why,
          suggestionCheck: resultSuggestion.check,
          receiptImageDataUrl: compressedDataUrl,
          previewUrl: compressedDataUrl,
        } : q));

      } catch (err) {
        console.error(`Error processing bulk item ${item.id}:`, err);
        let fallbackImg = "";
        try {
          fallbackImg = await compressImageFile(item.file);
        } catch (_) {}

        setBulkQueue(prev => prev.map(q => q.id === item.id ? {
          ...q,
          status: "failed",
          previewUrl: fallbackImg,
          receiptImageDataUrl: fallbackImg,
          errorMsg: language === "BM"
            ? "Bacaan resit gagal. Anda boleh edit secara manual atau buang draf ini."
            : "Receipt reading failed. You can edit manually or remove this draft."
        } : q));
      }
    }

    setIsProcessingBulk(false);
  };

  const handleSaveBulkItem = (item: BulkReceiptQueueItem) => {
    const itemErrors: Record<string, string> = {};
    if (!item.merchant.trim()) {
      itemErrors.merchant = language === "BM" ? "Sila masukkan nama resit." : "Please enter the receipt name.";
    }
    if (!item.date) {
      itemErrors.date = language === "BM" ? "Sila pilih tarikh resit." : "Please choose the receipt date.";
    }
    if (!item.amount.trim() || isNaN(Number(item.amount)) || Number(item.amount) <= 0) {
      itemErrors.amount = language === "BM" ? "Sila masukkan jumlah resit yang sah." : "Please enter a valid receipt amount.";
    }
    if (!item.category) {
      itemErrors.category = language === "BM" ? "Sila pilih kategori tuntutan." : "Please choose a claim category.";
    }
    if (!item.claimStatus) {
      itemErrors.claimStatus = language === "BM" ? "Sila pilih status tuntutan." : "Please choose a claim status.";
    }

    if (Object.keys(itemErrors).length > 0) {
      setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, validationErrors: itemErrors } : q));
      setEditingItemId(item.id);
      return;
    }

    let finalReceiptImageDataUrl = item.receiptImageDataUrl || item.previewUrl || undefined;
    if (isDemo && !finalReceiptImageDataUrl) {
      finalReceiptImageDataUrl = generateMockCanvasDataUrl(item.merchant, parseFloat(item.amount).toFixed(2), item.date, item.category);
    }

    onSaveReceipt({
      merchant: item.merchant,
      date: item.date,
      amount: parseFloat(item.amount),
      category: item.category as ClaimCategory,
      claimStatus: item.claimStatus as ClaimStatus,
      notes: item.notes,
      formBEItem: item.formBEItem,
      tax5DisplayName: item.tax5DisplayName,
      evidenceType: item.evidenceType,
      detectedText: item.detectedText,
      note: item.notes || item.tax5DisplayName,
      confidence: item.confidence,
      suggestionWhy: item.suggestionWhy,
      suggestionCheck: item.suggestionCheck,
      receiptImageDataUrl: finalReceiptImageDataUrl,
    });

    setBulkQueue(prev => {
      const remaining = prev.filter(q => q.id !== item.id);
      if (item.previewUrl && item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return remaining;
    });

    if (editingItemId === item.id) {
      setEditingItemId(null);
    }
  };

  const handleRemoveBulkItem = (id: string) => {
    setBulkQueue(prev => {
      const item = prev.find(q => q.id === id);
      if (item?.previewUrl && item.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(q => q.id !== id);
    });
    if (editingItemId === id) {
      setEditingItemId(null);
    }
  };

  const handleUpdateBulkItemField = (id: string, field: string, value: any) => {
    setBulkQueue(prev => prev.map(q => {
      if (q.id === id) {
        const updated = { ...q, [field]: value };
        if (updated.validationErrors && updated.validationErrors[field]) {
          const newErrors = { ...updated.validationErrors };
          delete newErrors[field];
          updated.validationErrors = newErrors;
        }
        if (field === "formBEItem") {
          const option = dropdownOptions.find(o => o.id === value);
          if (option) {
            updated.category = option.category;
            updated.tax5DisplayName = option.displayName;
            const activeCategory = option.category || ClaimCategory.Other;
            const result = adjustReceiptSuggestion(option.id, activeCategory, (updated.claimStatus as ClaimStatus) || ClaimStatus.CheckAgain, smartSetup);
            updated.claimStatus = result.claimStatus;
            updated.confidence = result.confidence;
            updated.suggestionWhy = result.why;
            updated.suggestionCheck = result.check;
          } else {
            updated.category = "";
            updated.tax5DisplayName = "";
          }
        }
        return updated;
      }
      return q;
    }));
  };

  const handleBulkFileInit = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      if (files.length > 5) {
        setBulkError(language === "BM"
          ? "Bulk Upload Beta menyokong sehingga 5 resit pada satu masa untuk ujian MVP."
          : "Bulk Upload Beta supports up to 5 receipts at a time for MVP testing."
        );
        e.target.value = "";
        return;
      }

      setBulkError(null);

      const newItems: BulkReceiptQueueItem[] = files.map((file, i) => {
        const previewUrl = URL.createObjectURL(file);
        return {
          id: `bulk-item-${i}-${Date.now()}-${Math.random()}`,
          file,
          previewUrl,
          base64: "",
          mimeType: file.type,
          status: "waiting",
          merchant: "",
          date: "",
          amount: "",
          category: "",
          claimStatus: ClaimStatus.CheckAgain,
          notes: "",
          formBEItem: "Other",
          tax5DisplayName: dropdownOptions.find(o => o.id === "Other")?.displayName || "",
          evidenceType: "Receipt-based",
          detectedText: "",
          confidence: "Medium",
          suggestionWhy: "",
          suggestionCheck: "",
        };
      });

      setBulkQueue(newItems);
      processSequentialQueue(newItems);
    }
    e.target.value = "";
  };

  const handleAddManualDraft = () => {
    setBulkError(null);
    const manualId = `bulk-manual-${Date.now()}`;
    const newManualItem: BulkReceiptQueueItem = {
      id: manualId,
      file: new File([""], "manual_entry.jpg", { type: "image/jpeg" }),
      previewUrl: "",
      base64: "",
      mimeType: "",
      status: "ready",
      merchant: "",
      date: "",
      amount: "",
      category: "",
      claimStatus: ClaimStatus.CheckAgain,
      notes: "",
      formBEItem: "Other",
      tax5DisplayName: dropdownOptions.find(o => o.id === "Other")?.displayName || "",
      evidenceType: "Receipt-based",
      detectedText: language === "BM" ? "Ditambah Secara Manual" : "Manually Added",
      confidence: "Medium",
      suggestionWhy: "",
      suggestionCheck: "",
    };
    setBulkQueue(prev => [...prev, newManualItem]);
    setEditingItemId(manualId);
  };

  const handleSimulateBulkQueue = () => {
    setBulkError(null);
    const mockItems: BulkReceiptQueueItem[] = [
      {
        id: `bulk-mock-1-${Date.now()}`,
        file: new File([""], "popular_books.jpg", { type: "image/jpeg" }),
        previewUrl: "",
        base64: "",
        mimeType: "image/jpeg",
        status: "waiting",
        merchant: "Popular Bookstore",
        date: "",
        amount: "",
        category: "",
        claimStatus: "",
        notes: "",
        formBEItem: "",
        tax5DisplayName: "",
        evidenceType: "",
        detectedText: "",
        confidence: "Medium",
        suggestionWhy: "",
        suggestionCheck: "",
      },
      {
        id: `bulk-mock-2-${Date.now()}`,
        file: new File([""], "decathlon_sport.jpg", { type: "image/jpeg" }),
        previewUrl: "",
        base64: "",
        mimeType: "image/jpeg",
        status: "waiting",
        merchant: "Decathlon KL East",
        date: "",
        amount: "",
        category: "",
        claimStatus: "",
        notes: "",
        formBEItem: "",
        tax5DisplayName: "",
        evidenceType: "",
        detectedText: "",
        confidence: "Medium",
        suggestionWhy: "",
        suggestionCheck: "",
      },
      {
        id: `bulk-mock-3-${Date.now()}`,
        file: new File([""], "lunch_receipt_fail.jpg", { type: "image/jpeg" }),
        previewUrl: "",
        base64: "",
        mimeType: "image/jpeg",
        status: "waiting",
        merchant: "FamilyMart Bangsar",
        date: "",
        amount: "",
        category: "",
        claimStatus: "",
        notes: "",
        formBEItem: "",
        tax5DisplayName: "",
        evidenceType: "",
        detectedText: "",
        confidence: "Medium",
        suggestionWhy: "",
        suggestionCheck: "",
      }
    ];

    setBulkQueue(mockItems);
    setIsProcessingBulk(true);

    let index = 0;
    const processNextMock = () => {
      if (index >= mockItems.length) {
        setIsProcessingBulk(false);
        return;
      }

      const item = mockItems[index];
      setBulkQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "scanning" } : q));

      setTimeout(() => {
        const mockDates = ["2026-04-18", "2026-05-12", "2026-06-02"];
        const dateVal = mockDates[index];
        
        if (index === 0) {
          const activeCategory = ClaimCategory.Lifestyle;
          const resultSuggestion = adjustReceiptSuggestion("G9", activeCategory, ClaimStatus.Claimable, smartSetup);

          setBulkQueue(prev => prev.map(q => q.id === item.id ? {
            ...q,
            status: "ready",
            merchant: "Popular Bookstore",
            date: dateVal,
            amount: "85.20",
            category: activeCategory,
            claimStatus: resultSuggestion.claimStatus,
            notes: language === "BM" ? "Buku rujukan bahasa melayu dan sains." : "Reference books on language and science.",
            formBEItem: "G9",
            tax5DisplayName: language === "BM" ? "Gaya Hidup - Membaca, Peranti & Internet" : "Lifestyle - Reading, Tech & Internet",
            evidenceType: language === "BM" ? "Berasaskan resit" : "Receipt-based",
            detectedText: "POPULAR BOOK CO.\nBANDAR UTAMA\n1x VERIFIED BOOKS RM 85.20\nTOTAL RM 85.20",
            confidence: resultSuggestion.confidence,
            suggestionWhy: resultSuggestion.why,
            suggestionCheck: resultSuggestion.check,
            receiptImageDataUrl: generateMockCanvasDataUrl("Popular Bookstore", "85.20", dateVal, "Lifestyle"),
            previewUrl: generateMockCanvasDataUrl("Popular Bookstore", "85.20", dateVal, "Lifestyle"),
          } : q));
        } else if (index === 1) {
          const activeCategory = ClaimCategory.Sports;
          const resultSuggestion = adjustReceiptSuggestion("G10", activeCategory, ClaimStatus.Claimable, smartSetup);

          setBulkQueue(prev => prev.map(q => q.id === item.id ? {
            ...q,
            status: "ready",
            merchant: "Decathlon KL East",
            date: dateVal,
            amount: "120.00",
            category: activeCategory,
            claimStatus: resultSuggestion.claimStatus,
            notes: language === "BM" ? "Kasut larian ergonomik." : "Ergonomic running shoes.",
            formBEItem: "G10",
            tax5DisplayName: language === "BM" ? "Gaya Hidup - Sukan" : "Lifestyle - Sports",
            evidenceType: language === "BM" ? "Berasaskan resit" : "Receipt-based",
            detectedText: "DECATHLON SPORT\nKL EAST MALL\n1x RUNNING SHOES RM 120.00\nTOTAL RM 120.00",
            confidence: resultSuggestion.confidence,
            suggestionWhy: resultSuggestion.why,
            suggestionCheck: resultSuggestion.check,
            receiptImageDataUrl: generateMockCanvasDataUrl("Decathlon KL East", "120.00", dateVal, "Sports"),
            previewUrl: generateMockCanvasDataUrl("Decathlon KL East", "120.00", dateVal, "Sports"),
          } : q));
        } else {
          const canvasUrl = generateMockCanvasDataUrl("FamilyMart Bangsar", "14.50", dateVal, "Other");
          setBulkQueue(prev => prev.map(q => q.id === item.id ? {
            ...q,
            status: "failed",
            merchant: "FamilyMart Bangsar",
            date: dateVal,
            amount: "14.50",
            category: ClaimCategory.Other,
            previewUrl: canvasUrl,
            receiptImageDataUrl: canvasUrl,
            errorMsg: language === "BM"
              ? "Bacaan resit gagal. Anda boleh edit secara manual atau buang draf ini."
              : "Receipt reading failed. You can edit manually or remove this draft."
          } : q));
        }

        index++;
        processNextMock();
      }, 1200);
    };

    processNextMock();
  };

  // Validation & Save Call
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Custom form validations
    if (!merchant.trim()) {
      newErrors.merchant = language === "BM" ? "Sila masukkan nama resit." : "Please enter the receipt name.";
    }
    if (!date) {
      newErrors.date = language === "BM" ? "Sila pilih tarikh resit." : "Please choose the receipt date.";
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = language === "BM" ? "Sila masukkan jumlah resit yang sah." : "Please enter a valid receipt amount.";
    }
    if (!category) {
      newErrors.category = language === "BM" ? "Sila pilih kategori tuntutan." : "Please choose a claim category.";
    }
    if (!claimStatus) {
      newErrors.claimStatus = language === "BM" ? "Sila pilih status tuntutan." : "Please choose a claim status.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let finalReceiptImageDataUrl = compressedDataUrl || undefined;
    if (isDemo && !finalReceiptImageDataUrl) {
      finalReceiptImageDataUrl = generateMockCanvasDataUrl(merchant, parseFloat(amount).toFixed(2), date, category);
    }

    // Call submit matching exact Omit parameters with newly added metadata fields
    onSaveReceipt({
      merchant,
      date,
      amount: parseFloat(amount),
      category: category as ClaimCategory,
      claimStatus: claimStatus as ClaimStatus,
      notes,
      formBEItem,
      tax5DisplayName,
      evidenceType,
      detectedText,
      note: notes || tax5DisplayName,
      confidence,
      suggestionWhy,
      suggestionCheck,
      receiptImageDataUrl: finalReceiptImageDataUrl,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-5 bg-[#F7F9FA] space-y-4 pb-12 relative overflow-x-hidden">
      {/* Soft circular low-opacity decorative gradient background blobs (Lighter version for Scan Receipt) */}
      <div className="absolute top-[-5%] left-[-15%] w-[250px] h-[250px] rounded-full bg-[#E5F5EF] blur-[90px] opacity-45 pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[220px] h-[220px] rounded-full bg-[#FFFBE3] blur-[80px] opacity-40 pointer-events-none z-0"></div>

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
        <div>
          <h2 className="text-xl font-bold font-heading text-navy">{language === "BM" ? "Imbas Resit" : "Scan Receipt"}</h2>
          <p className="text-xs text-neutral-500">{language === "BM" ? "Susun resit dengan teratur untuk draf Borang BE." : "Keep receipts organized for Form BE draft."}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-neutral-200 text-neutral-500 hover:text-navy cursor-pointer hover:bg-neutral-50 transition-colors"
        >
          {t("common", "cancel")}
        </button>
      </div>

      {/* Mode selection tabs */}
      <div className="flex bg-[#FAFBFB] p-1.5 rounded-2xl border border-neutral-200/60 max-w-sm">
        <button
          type="button"
          onClick={() => {
            if (!isProcessingBulk) {
              setBulkUploadMode("single");
            }
          }}
          disabled={isProcessingBulk}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
            bulkUploadMode === "single"
              ? "bg-white text-navy shadow-3xs border border-neutral-200/30"
              : "text-neutral-500 hover:text-navy hover:bg-neutral-50"
          } ${isProcessingBulk ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {language === "BM" ? "Resit Tunggal" : "Single Receipt"}
        </button>
        <button
          type="button"
          onClick={() => setBulkUploadMode("bulk")}
          className={`flex-1 py-1 px-2.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
            bulkUploadMode === "bulk"
              ? "bg-white text-navy shadow-3xs border border-neutral-200/30"
              : "text-neutral-500 hover:text-navy hover:bg-neutral-50"
          }`}
        >
          <span>{language === "BM" ? "Muat Naik Pukal" : "Bulk Upload"}</span>
          <span className="bg-amber-500 text-white text-[8px] font-black px-1.2 py-0.2 rounded uppercase tracking-wider scale-90">BETA</span>
        </button>
      </div>

      {bulkUploadMode === "single" ? (
        <div className="space-y-4">
          
          {/* ================= STEP 1: ADD RECEIVED FILE ================= */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/60 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-brand-light text-teal-brand text-[10px] font-extrabold">1</span>
              <span className="font-bold text-xs text-navy uppercase tracking-wider">{language === "BM" ? "Tambah resit anda" : "Add your receipt"}</span>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === "BM" ? "Padam" : "Remove"}</span>
              </button>
            )}
          </div>

          {/* Image Drag and Upload Area / Camera Preview */}
          {isCameraOpen ? (
            <div id="camera-preview-container" className="border-2 border-teal-brand/20 bg-black rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden animate-fadeIn">
              <div className="relative w-full aspect-video bg-neutral-900 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
                <video
                  ref={videoRefCallback}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onPlaying={handleVideoPlaying}
                  className={`w-full h-full object-cover ${isCameraReady ? "block" : "hidden"}`}
                />
                {!isCameraReady && (
                  <div className="flex flex-col items-center justify-center gap-2 text-white">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-brand" />
                    <span className="text-xs font-medium text-neutral-400">{language === "BM" ? "Memulakan kamera..." : "Starting camera..."}</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-0.5 text-[8px] font-bold text-white tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                  <span>{language === "BM" ? "KAMERA AKTIF" : "LIVE CAMERA"}</span>
                </div>
              </div>
              
              <div className="flex gap-2 w-full max-w-[260px]">
                <button
                  type="button"
                  id="btn-capture-photo"
                  onClick={capturePhoto}
                  disabled={!isCameraReady}
                  className={`flex-1 h-9 font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs active:scale-[0.98] transition-all ${
                    isCameraReady 
                      ? "bg-teal-brand hover:bg-[#009170] text-white cursor-pointer" 
                      : "bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50"
                  }`}
                >
                  <span>{language === "BM" ? "Tangkap Foto" : "Capture Photo"}</span>
                </button>
                <button
                  type="button"
                  id="btn-cancel-camera"
                  onClick={stopCamera}
                  className="h-9 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs cursor-pointer active:scale-[0.98] transition-all"
                >
                  <span>{t("common", "cancel")}</span>
                </button>
              </div>
            </div>
          ) : !imagePreviewUrl ? (
            <div className="border-2 border-dashed border-neutral-250 bg-[#FAFBFB] rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all">
              <div className="p-3 bg-white rounded-full text-teal-brand shadow-xs mb-3">
                <Camera className="w-6 h-6 stroke-[2]" />
              </div>

              <p className="text-xs font-bold text-navy mb-1">{language === "BM" ? "Ambil Foto atau Muat Naik Imej" : "Take Photo or Upload Image"}</p>
              <p className="text-[10px] text-neutral-400 mb-4 font-semibold">{language === "BM" ? "Menyokong fail jenis PNG, JPG, atau JPEG" : "Supports PNG, JPG, or JPEG file types"}</p>

              <div className="flex flex-col gap-2 w-full max-w-[260px]">
                {isDemo && (
                  <button
                    type="button"
                    id="btn-try-demo-receipt"
                    onClick={handleSimulateScan}
                    className="w-full h-10 bg-amber-brand/10 hover:bg-amber-brand/20 text-[#B45309] border border-amber-brand/35 font-extrabold rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-pointer transition-all active:scale-[0.98] mb-1 relative"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>{language === "BM" ? "Cuba resit demo" : "Try demo receipt"}</span>
                  </button>
                )}

                {/* Take Photo / Scan Receipt button triggering native camera capture */}
                <button
                  type="button"
                  id="btn-scan-receipt-camera"
                  onClick={startCamera}
                  className="w-full h-9 bg-teal-brand hover:bg-[#009170] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <span>{language === "BM" ? "Ambil Foto / Imbas Resit" : "Scan Receipt / Take Photo"}</span>
                </button>

                {/* Upload File button triggering standard hidden file picker input */}
                <button
                  type="button"
                  id="btn-upload-file"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-9 bg-[#F3FBF8] hover:bg-[#EAF7F4] text-teal-brand border border-teal-500/10 font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>{language === "BM" ? "Muat Naik Fail" : "Upload File"}</span>
                </button>
              </div>

              {/* Hidden configuration file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative bg-neutral-50 border border-neutral-150 rounded-xl p-3 flex items-center gap-3 animate-fadeIn">
              <img 
                src={imagePreviewUrl} 
                alt="Receipt snapshot" 
                referrerPolicy="no-referrer"
                className="w-16 h-16 object-cover rounded-lg border border-neutral-200" 
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-navy truncate">{selectedFile?.name}</p>
                <p className="text-[10px] text-neutral-400 font-medium">
                  {selectedFile ? (selectedFile.size / 1024).toFixed(1) : "0"} KB
                </p>
                <span className="inline-block mt-1 text-[9px] bg-teal-brand-light text-teal-brand font-bold px-1.5 py-0.5 rounded">
                  {language === "BM" ? "Sedia untuk dibaca" : "Ready to read"}
                </span>
              </div>
            </div>
          )}

          {/* Trigger Read and Simulation Controls */}
          <div className="space-y-2">
            <button
              type="button"
              id="btn-read-receipt"
              onClick={handleReadReceipt}
              disabled={isReading || isScanning || !imageBase64}
              className="w-full h-11 bg-teal-brand hover:bg-[#009170] text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isReading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>{language === "BM" ? "Membaca resit anda..." : "Reading your receipt..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>{language === "BM" ? "Baca Resit" : "Read Receipt"}</span>
                </>
              )}
            </button>

            {/* Backups trigger */}
            {isDemo && (
              <button
                type="button"
                id="btn-simulate-scan"
                onClick={handleSimulateScan}
                disabled={isReading || isScanning}
                className="w-full h-10 bg-white hover:bg-neutral-50 text-neutral-500 border border-neutral-200/60 font-medium rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === "BM" ? "Mengekstrak sampel..." : "Extracting sample..."}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>{language === "BM" ? "Guna resit contoh (Mod Demo)" : "Use sample receipt (Demo Mode)"}</span>
                  </>
                )}
              </button>
            )}

            <span className="block text-[9.5px] text-neutral-400 text-center leading-normal mb-1.5">
              {language === "BM" ? "Pembacaan resit di tahap asas dalam MVP ini. Sila semak butiran sebelum menyimpan." : "Receipt reading is basic in this MVP. Please check the details before saving."}
            </span>
          </div>
        </div>

        {/* Dynamic Warning and success notifications */}
        {scanMessage && (
          <div className="bg-[#F1FBF9] border border-teal-brand/10 rounded-xl p-3 animate-fadeIn flex items-start gap-2.5">
            <div className="p-1 bg-teal-brand text-white rounded-full mt-0.5">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <div className="text-xs font-medium text-[#008064]">
              {language === "BM" ? "Hasil Imbasan Berjaya Dimuatkan" : scanMessage}
              <p className="text-[10px] text-neutral-400 mt-1 leading-normal font-sans">
                💡 {language === "BM" ? "DATA IMBASAN TELAH DIISI. Anda bebas untuk melaraskan mana-mana butiran di bawah." : "SCANNED DATA LOADED. Feel free to adjust any fields below."}
              </p>
            </div>
          </div>
        )}

        {errors.upload && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 animate-fadeIn flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-red-600">{errors.upload}</span>
          </div>
        )}

        {geminiErrorMsg && (
          <div id="gemini-fallback-notice" className="bg-[#FFFDF5] border border-amber-brand/20 rounded-2xl p-4 animate-fadeIn space-y-3.5">
            <div className="flex gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-brand shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-neutral-800 block">
                  {isFromCamera 
                    ? (language === "BM" ? "Imbasan Gagal" : "Scanning Failed") 
                    : (language === "BM" ? "Pembacaan AI Tidak Tersedia" : "AI Reading Unavailable")}
                </span>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                  {isFromCamera 
                    ? (language === "BM" 
                      ? "Tax5 tidak dapat membaca foto ini dengan jelas. Sila ambil semula foto atau masukkan butiran secara manual." 
                      : "Tax5 could not read this photo clearly. Please retake the photo or enter details manually.") 
                    : geminiErrorMsg}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-1 border-t border-amber-brand/10">
              {isFromCamera ? (
                <>
                  <button
                    type="button"
                    id="btn-retake-camera"
                    onClick={() => {
                      handleRemoveImage();
                      startCamera();
                    }}
                    className="h-9 px-4 bg-teal-brand hover:bg-[#009170] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{language === "BM" ? "Ambil Semula Foto" : "Retake Photo"}</span>
                  </button>
                  
                  <button
                    type="button"
                    id="btn-enter-manually-camera"
                    onClick={handleEnterManually}
                    className="h-9 px-4 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    {language === "BM" ? "Masukkan Manual" : "Enter Manually"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    id="btn-try-again-gemini"
                    onClick={handleReadReceipt}
                    className="h-9 px-4 bg-teal-brand hover:bg-[#009170] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{language === "BM" ? "Cuba Lagi" : "Try Again"}</span>
                  </button>
                  
                  <button
                    type="button"
                    id="btn-enter-manually-gemini"
                    onClick={handleEnterManually}
                    className="h-9 px-4 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    {language === "BM" ? "Masukkan Manual" : "Enter Manually"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Expandable Detected Text Panel */}
        {detectedText && (
          <div className="bg-white rounded-2xl border border-neutral-200/60 overflow-hidden shadow-xs animate-fadeIn">
            <button
              type="button"
              onClick={() => setIsDetectedTextExpanded(!isDetectedTextExpanded)}
              className="w-full px-4 py-3 bg-neutral-50/50 flex items-center justify-between border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors"
            >
              <span className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                <span>{language === "BM" ? "Teks Dikesan" : "Detected Text"}</span>
                <span className="bg-teal-brand-light text-teal-brand text-[9px] px-1.5 py-0.5 rounded font-black">
                  {language === "BM" ? "Disalin" : "Transcribed"}
                </span>
              </span>
              {isDetectedTextExpanded ? (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </button>
            {isDetectedTextExpanded && (
              <div className="p-4 bg-[#FAFBFB]">
                <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-neutral-600 bg-neutral-100/50 rounded-xl p-3 max-h-40 overflow-y-auto border border-neutral-200">
                  {detectedText}
                </pre>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* ================= STEP 2: CHECK THE DETAILS ================= */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/60 space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-brand-light text-teal-brand text-[10px] font-extrabold">2</span>
              <span className="font-bold text-xs text-navy uppercase tracking-wider">{language === "BM" ? "Semak butiran" : "Check the details"}</span>
            </div>

            {/* OCR API Specific Custom Meta Notes */}
            {(ocrConfidenceNote || ocrNeedsReview || (ocrDocumentType && ocrDocumentType !== 'receipt')) && (
              <div className="p-3.5 bg-neutral-50/80 border border-neutral-200/50 rounded-xl space-y-2 text-xs text-neutral-700 font-sans">
                {ocrDocumentType && ocrDocumentType !== 'receipt' && (
                  <div className="flex gap-2 items-start">
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold uppercase rounded tracking-wider shrink-0 mt-0.5">
                      {language === "BM" ? "Dokumen Kompleks" : "Complex Document"}
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {language === "BM"
                        ? "Ini kelihatan seperti bil atau invois kompleks. Sila sahkan jumlah tuntutan akhir sebelum menyimpan."
                        : "This looks like a complex bill or invoice. Please confirm the final claimable amount before saving."}
                    </p>
                  </div>
                )}
                {ocrNeedsReview && (
                  <div className="flex gap-2 items-start">
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-bold uppercase rounded tracking-wider shrink-0 mt-0.5">
                      {language === "BM" ? "Perlu Semakan" : "Need Review"}
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {language === "BM"
                        ? "Peringatan: Bacaan resit mengesan maklumat tidak lengkap atau meragukan. Sila sahkan semua butiran."
                        : "Reminder: The scanned receipt contains missing or ambiguous details. Please double-check all fields."}
                    </p>
                  </div>
                )}
                {ocrConfidenceNote && (
                  <div className="flex gap-2 items-start border-t border-neutral-200/40 pt-2 text-[11px] text-neutral-500 italic">
                    <span>{ocrConfidenceNote}</span>
                  </div>
                )}
              </div>
            )}

            {/* Merchant Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-600">
                {language === "BM" ? "Nama Resit / Peniaga" : "Receipt Name / Merchant"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="input-merchant"
                placeholder={language === "BM" ? "cth. Kedai Buku Popular, Hospital Pantai" : "e.g. Popular Bookstore, Pantai Hospital"}
                value={merchant}
                onChange={(e) => {
                  setMerchant(e.target.value);
                  if (errors.merchant) setErrors(prev => ({ ...prev, merchant: "" }));
                }}
                className={`w-full h-10 px-3 rounded-xl bg-[#FAFBFB] border text-xs focus:bg-white focus:outline-none transition-all ${
                  errors.merchant ? "border-red-500 focus:border-red-500" : "border-neutral-250 focus:border-teal-brand"
                }`}
              />
              {errors.merchant && (
                <p className="text-[10.5px] text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.merchant}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Receipt Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-600">
                  {language === "BM" ? "Tarikh Resit" : "Receipt Date"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="input-date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) setErrors(prev => ({ ...prev, date: "" }));
                  }}
                  className={`w-full h-10 px-3 rounded-xl bg-[#FAFBFB] border text-xs focus:bg-white focus:outline-none transition-all ${
                    errors.date ? "border-red-500 focus:border-red-500" : "border-neutral-250 focus:border-teal-brand"
                  }`}
                />
                {errors.date && (
                  <p className="text-[10.5px] text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.date}</span>
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-600">
                  {language === "BM" ? "Jumlah dalam RM" : "Amount in RM"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">RM</span>
                  <input
                    type="text"
                    id="input-amount"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (errors.amount) setErrors(prev => ({ ...prev, amount: "" }));
                    }}
                    className={`w-full h-10 pl-9 pr-3 rounded-xl bg-[#FAFBFB] border text-xs focus:bg-white focus:outline-none transition-all font-mono font-semibold ${
                      errors.amount ? "border-red-500 focus:border-red-500" : "border-neutral-250 focus:border-teal-brand"
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-[10.5px] text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.amount}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ================= STEP 3: CHOOSE TAX CLAIM OPTIONS ================= */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/60 space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-brand-light text-teal-brand text-[10px] font-extrabold">3</span>
              <span className="font-bold text-xs text-navy uppercase tracking-wider">{language === "BM" ? "Pilih maklumat tuntutan" : "Choose claim info"}</span>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-neutral-600">
                  {language === "BM" ? "Kategori Tuntutan" : "Claim Category"} <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-neutral-400 font-bold">{language === "BM" ? "Had Maksimum" : "RM Limit Capped"}</span>
              </div>
              
              <select
                id="select-category"
                value={selectedOptionId}
                onChange={(e) => handleDropdownChange(e.target.value)}
                className={`w-full h-10 px-3 rounded-xl bg-[#FAFBFB] border text-xs focus:bg-white focus:outline-none transition-all cursor-pointer ${
                  errors.category ? "border-red-500 focus:border-red-500" : "border-neutral-250 focus:border-teal-brand"
                }`}
              >
                <option value="">{language === "BM" ? "-- Pilih Kategori --" : "-- Choose Category --"}</option>
                {dropdownOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {selectedOptionId && (
                <p className="text-[10.5px] text-teal-brand font-medium mt-1 bg-[#F3FBF8] border border-teal-500/10 px-2.5 py-1 rounded-lg">
                  💡 {language === "BM" ? "Status had" : "Limit status"}: <span className="font-bold text-teal-brand">{dropdownOptions.find(o => o.id === selectedOptionId)?.helper}</span>
                </p>
              )}

              {errors.category && (
                <p className="text-[10.5px] text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.category}</span>
                </p>
              )}
            </div>

            {/* Claim Status Selection */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-600 mb-1">
                {language === "BM" ? "Status Tuntutan Malaysia" : "Malaysian Claim Status"} <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-3 gap-2 w-full">
                {[
                  { 
                    id: ClaimStatus.Claimable, 
                    label: language === "BM" ? "Boleh Dituntut" : "Claimable", 
                    style: "border-teal-brand/30 bg-[#EAFDF5] text-teal-brand hover:bg-[#D1FAE5]/60",
                    activeStyle: "border-teal-brand bg-teal-brand text-white shadow-3xs"
                  },
                  { 
                    id: ClaimStatus.CheckAgain, 
                    label: language === "BM" ? "Perlu Semakan" : "Need Review", 
                    style: "border-amber-300/30 bg-[#FFFBEB] text-amber-700 hover:bg-[#FEF3C7]/60",
                    activeStyle: "border-[#FBBF24] bg-[#FBBF24] text-[#09244A] shadow-3xs"
                  },
                  { 
                    id: ClaimStatus.NonClaimable, 
                    label: language === "BM" ? "Tidak Layak" : "Not Eligible", 
                    style: "border-neutral-300/30 bg-[#F8FAFC] text-neutral-500 hover:bg-neutral-100/60",
                    activeStyle: "border-neutral-500 bg-neutral-500 text-white shadow-3xs"
                  }
                ].map((pill) => {
                  const isSelected = claimStatus === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => {
                        setClaimStatus(pill.id);
                        if (errors.claimStatus) setErrors(prev => ({ ...prev, claimStatus: "" }));
                      }}
                      className={`h-10 px-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center text-center ${
                        isSelected ? pill.activeStyle : pill.style
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
              
              {errors.claimStatus && (
                <p className="text-[10.5px] text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.claimStatus}</span>
                </p>
              )}
            </div>

            {/* Entry Notes */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-600">
                {language === "BM" ? "Nota (Pilihan)" : "Notes (Optional)"}
              </label>
              <textarea
                placeholder={language === "BM" ? "Berikan konteks seperti butiran pembelian atau butiran peniaga..." : "Provide context like purchase item or vendor details..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-16 p-3 rounded-xl bg-[#FAFBFB] border border-neutral-250 text-xs focus:bg-white focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* ================= TAX5 AI CLASSIFICATION GUIDE SUGGESTION ================= */}
          {formBEItem && (
            <SuggestionInsightsCard
              formBEItem={formBEItem}
              claimStatus={claimStatus}
              confidence={confidence}
              suggestionWhy={suggestionWhy}
              suggestionCheck={suggestionCheck}
              receiptId="new-scan"
            />
          )}

          {/* Legal and official disclaimer context box */}
          <div className="flex gap-2 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-navy">
            <Info className="w-4 h-4 text-navy-light shrink-0 mt-0.5" />
            <div className="text-[10px] text-navy/80 leading-normal space-y-1">
              <p>
                <strong>{language === "BM" ? "Notis Penting:" : "Important Notice:"}</strong> {language === "BM" ? "Walaupun Tax5 memudahkan penjejakan menggunakan klasifikasi OCR pintar, ia tidak membentuk nasihat cukai atau kewangan rasmi." : "While Tax5 simplifies tracking using smart OCR classification, it does not constitute official tax or financial advice."}
              </p>
              <p>
                {language === "BM" ? "Sila simpan salinan fizikal resit cukai anda sekurang-kurangnya 7 tahun di bawah keperluan audit LHDN." : "Please keep physical copies of your tax receipts for at least 7 years under LHDN audit requirements."}
              </p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-save-receipt"
              className="w-full h-12 bg-teal-brand hover:bg-[#009170] text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs text-xs hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              {language === "BM" ? "Simpan Resit" : "Save Receipt"}
            </button>
          </div>
        </form>
        </div>
      ) : (
        <BulkUploadView
          bulkQueue={bulkQueue}
          editingItemId={editingItemId}
          isProcessingBulk={isProcessingBulk}
          bulkError={bulkError}
          language={language}
          isDemo={isDemo}
          dropdownOptions={dropdownOptions}
          setBulkQueue={setBulkQueue}
          setEditingItemId={setEditingItemId}
          setBulkError={setBulkError}
          handleSimulateBulkQueue={handleSimulateBulkQueue}
          handleRemoveBulkItem={handleRemoveBulkItem}
          handleSaveBulkItem={handleSaveBulkItem}
          handleUpdateBulkItemField={handleUpdateBulkItemField}
          handleAddManualDraft={handleAddManualDraft}
          bulkFileInputRef={bulkFileInputRef}
          handleBulkFileInit={handleBulkFileInit}
        />
      )}
    </div>
  );
};
export default AddScanView;
