import React, { useState, useRef } from "react";
import { Camera, Sparkles, AlertCircle, Check, Loader2, Info, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { ClaimCategory, ClaimStatus, Receipt, SmartSetupData } from "../types";
import { SCAN_TEMPLATES, ScanTemplate } from "../data/mockTemplates";
import { adjustReceiptSuggestion, calculateCompletionStatus } from "../utils/suggestionEngine";
import { SuggestionInsightsCard } from "./SuggestionInsightsCard";

interface AddScanViewProps {
  onSaveReceipt: (receipt: Omit<Receipt, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  smartSetup: SmartSetupData | null;
  isDemo?: boolean;
}

export const AddScanView: React.FC<AddScanViewProps> = ({ onSaveReceipt, onCancel, smartSetup, isDemo }) => {
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

  // Full rich dropdown categories mapping to Form BE codes
  const dropdownOptions = [
    { id: "G9", label: "Lifestyle", category: ClaimCategory.Lifestyle, helper: "Capped RM2,500", displayName: "Lifestyle - Reading, Tech & Internet" },
    { id: "G6/G7", label: "Medical / Health Screening", category: ClaimCategory.Medical, helper: "Combined RM10,000", displayName: "Medical / Health Screening" },
    { id: "G5", label: "Education Fees", category: ClaimCategory.Education, helper: "Capped RM7,050", displayName: "Self-Education Fees" },
    { id: "G10", label: "Sports Equipment / Activities", category: ClaimCategory.Sports, helper: "Capped RM1,000", displayName: "Lifestyle - Sports" },
    { id: "G17/G19", label: "Insurance / Takaful", category: ClaimCategory.Insurance, helper: "Combined RM3,000", displayName: "Insurance / Takaful" },
    { id: "G2", label: "Parents / Grandparents Support", category: ClaimCategory.Other, helper: "Needs review", displayName: "Parents' Medical & Carer Expenses" },
    { id: "G3", label: "Basic Supporting Equipment", category: ClaimCategory.Other, helper: "Capped RM6,000", displayName: "Basic Supporting Equipment" },
    { id: "G11", label: "Breastfeeding Equipment", category: ClaimCategory.Other, helper: "Capped RM1,000", displayName: "Breastfeeding Equipment" },
    { id: "G12", label: "Childcare / Kindergarten", category: ClaimCategory.Other, helper: "Capped RM3,000", displayName: "Childcare & Kindergarten Relief" },
    { id: "G13", label: "SSPN Savings", category: ClaimCategory.Other, helper: "Capped RM8,000", displayName: "SSPN Net Savings" },
    { id: "G18", label: "Private Retirement Scheme (PRS)", category: ClaimCategory.Other, helper: "Capped RM3,000", displayName: "PRS Deferred Annuity" },
    { id: "G20", label: "SOCSO / EIS", category: ClaimCategory.Other, helper: "Capped RM350", displayName: "SOCSO / EIS Contribution" },
    { id: "G21", label: "Food Waste Composting Machine", category: ClaimCategory.Other, helper: "Capped RM2,500", displayName: "Food Waste Composting Machine" },
    { id: "G22", label: "First Home Loan Interest", category: ClaimCategory.Other, helper: "Needs review", displayName: "First Home Loan Interest" },
    { id: "Other", label: "Other Allowed Relief", category: ClaimCategory.Other, helper: "Needs review", displayName: "Other Allowed Relief" }
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
      applySmartSuggestions(option.id, claimStatus || ClaimStatus.CheckAgain);
    }
  };

  const applySmartSuggestions = (itemCode: string, initialStatus: ClaimStatus) => {
    const activeCategory = (category as ClaimCategory) || ClaimCategory.Other;
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
  const [isReading, setIsReading] = useState(false);
  const [detectedText, setDetectedText] = useState("");
  const [isDetectedTextExpanded, setIsDetectedTextExpanded] = useState(false);
  const [geminiErrorMsg, setGeminiErrorMsg] = useState<string | null>(null);

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
    setDetectedText("");
    setScanMessage(null);
    setGeminiErrorMsg(null);
    setErrors({});
    setIsFromCamera(false);
    setAutoReadAfterImageLoad(false);
    
    // Revoke object URL to avoid memory leak
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
  };

  // Call Gemini OCR backend processing
  const handleReadReceipt = async () => {
    if (!imageBase64 || !imageMimeType) {
      setErrors((prev) => ({ ...prev, upload: "Please select or upload a receipt image first." }));
      return;
    }

    setIsReading(true);
    setErrors({});
    setScanMessage(null);
    setGeminiErrorMsg(null);
    setDetectedText("");

    try {
      const response = await fetch("/api/read-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: imageBase64,
          mimeType: imageMimeType,
        }),
      });

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch (_) {}
        throw new Error(errData.error || "Could not read receipt clearly. Please enter details manually.");
      }

      const data = await response.json();

      if (!data || typeof data !== "object") {
        throw new Error("Could not read receipt clearly. Please enter details manually.");
      }

      // Auto-fill our forms
      setMerchant(data.merchant || "");
      setDate(data.date || "");
      
      // Keep amount formatting consistent
      let formattedAmount = "";
      if (data.amount) {
        // Strip non-numeric currency signs
        const cleaned = data.amount.replace(/[^0-9.]/g, "");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) {
          formattedAmount = parsed.toFixed(2);
        } else {
          formattedAmount = data.amount;
        }
      }
      setAmount(formattedAmount);

      setCategory(data.category || "");
      setNotes(data.note || "");
      setDetectedText(data.detectedText || "");

      // Classification suggestions and notes from Tax5 App Classification Guide
      setFormBEItem(data.formBEItem || "");
      setTax5DisplayName(data.tax5DisplayName || "");
      setEvidenceType(data.evidenceType || "");
      setClassificationReason(data.classificationReason || "");

      // Call our smart suggestion engine
      applySmartSuggestions(data.formBEItem || "Other", (data.claimStatus as ClaimStatus) || ClaimStatus.CheckAgain);

      // Handle situations where key fields couldn't be auto-detected
      const isMissingMerchant = !data.merchant;
      const isMissingDate = !data.date;
      const isMissingAmount = !data.amount;
      const isMissingCategory = !data.category;
      const isMissingClaimStatus = !data.claimStatus;

      if (data.fallback) {
        setScanMessage("⚠️ Gemini is busy right now (503). Standard fields have been pre-filled with a default template. Please inspect and manually customize them below!");
      } else if (isMissingMerchant || isMissingDate || isMissingAmount || isMissingCategory || isMissingClaimStatus) {
        setErrors((prev) => ({
          ...prev,
          read: "Some details could not be detected. Please enter them manually."
        }));
      } else {
        setScanMessage("Receipt successfully processed by Gemini!");
      }
    } catch (err: any) {
      console.error("Gemini receipt extraction failed:", err);
      setGeminiErrorMsg("Tax5 could not read this receipt automatically right now. You can still enter the details manually and review the category suggestion.");
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
      setNotes(template.notes);

      // Programmatic Simulation Guide info
      let simGCode = "Other";
      let simDisplayName = "Other allowable relief";
      let simEvidence = "Receipt-based";
      let simReason = "This transaction does not match a standard tax relief category. Please verify this is business or personal.";

      if (template.merchant === "Popular Bookstore") {
        simGCode = "G9";
        simDisplayName = "Lifestyle - Reading, Tech & Internet";
        simEvidence = "Receipt-based";
        simReason = "This looks like a Lifestyle receipt for books. Please confirm this was for personal or family use.";
      } else if (template.merchant === "Pantai Hospital Kuala Lumpur") {
        simGCode = "G2";
        simDisplayName = "Parents' Medical & Carer Expenses";
        simEvidence = "Receipt-based";
        simReason = "This may be Medical, but it needs checking because medical claims for parents require certified bills or registered carer documents.";
      } else if (template.merchant === "Decathlon KL East") {
        simGCode = "G10";
        simDisplayName = "Lifestyle - Sports";
        simEvidence = "Receipt-based";
        simReason = "This looks like a Lifestyle Sports receipt. Please confirm it was for personal or family use and not motorized/commercial sports.";
      } else if (template.merchant === "Prudential Assurance Malaysia") {
        simGCode = "G17";
        simDisplayName = "Life Insurance & EPF";
        simEvidence = "Payment-record-based";
        simReason = "This looks like an insurance payment. Please check the policy type before filing. Pensionable public servants have different limits.";
      } else if (template.merchant === "Brickfields College (BAC)") {
        simGCode = "G5";
        simDisplayName = "Self-Education Fees";
        simEvidence = "Receipt-based";
        simReason = "Self-education course fees need to be verified against LHDN's list of recognized institutions and eligible courses of study.";
      } else if (template.merchant === "FamilyMart Bangsar") {
        simGCode = "Other";
        simDisplayName = "Other allowable relief";
        simEvidence = "Receipt-based";
        simReason = "This looks like dining or food expenditure. Personal meals cannot be claimed under Malaysian tax reliefs.";
      } else if (template.merchant === "SSPN-i Deposit (PTPTN)") {
        simGCode = "G13";
        simDisplayName = "SSPN Net Savings";
        simEvidence = "Receipt-based";
        simReason = "SSPN child savings receipt. Remember that the receipts alone may not show your net savings. Check your SSPN statement and update the final amount if needed.";
      }

      setFormBEItem(simGCode);
      setTax5DisplayName(simDisplayName);
      setEvidenceType(simEvidence);
      setClassificationReason(`${simReason} \n\nDisclaimer: Tax5 gives a preparation suggestion only. Final claim eligibility must be checked using official LHDN/MyTax information.`);

      // Apply smart suggestions
      applySmartSuggestions(simGCode, template.claimStatus);
      
      const rawText = `=== SIMULATED RAW RECEIPT ===\nSTORE: ${template.merchant}\nDATE: ${selectedDate}\nPAYMENT: CASH / ONLINE\nITEMS:\n- taxable items 1x RM ${template.amount.toFixed(2)}\nTOTAL: RM ${template.amount.toFixed(2)}\n=============================\nTAX5 RULES DETECTED\nNO OFFICIAL ADVICE IMPLIED.`;
      setDetectedText(rawText);

      setIsScanning(false);
      setScanMessage("Simulation complete! Verify the pre-filled fields below.");
    }, 900);
  };

  // Validation & Save Call
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Custom form validations
    if (!merchant.trim()) {
      newErrors.merchant = "Please enter the receipt name.";
    }
    if (!date) {
      newErrors.date = "Please choose the receipt date.";
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Please enter a valid receipt amount.";
    }
    if (!category) {
      newErrors.category = "Please choose a claim category.";
    }
    if (!claimStatus) {
      newErrors.claimStatus = "Please choose a claim status.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
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
          <h2 className="text-xl font-bold font-heading text-navy">Scan Receipt</h2>
          <p className="text-xs text-neutral-500">Keep receipts organized for Form BE draft.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-neutral-200 text-neutral-500 hover:text-navy cursor-pointer hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        
        {/* ================= STEP 1: ADD RECEIVED FILE ================= */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/60 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-brand-light text-teal-brand text-[10px] font-extrabold">1</span>
              <span className="font-bold text-xs text-navy uppercase tracking-wider">Add your receipt</span>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
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
                    <span className="text-xs font-medium text-neutral-400">Starting camera...</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-0.5 text-[8px] font-bold text-white tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                  <span>LIVE CAMERA</span>
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
                  <span>Capture Photo</span>
                </button>
                <button
                  type="button"
                  id="btn-cancel-camera"
                  onClick={stopCamera}
                  className="h-9 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs cursor-pointer active:scale-[0.98] transition-all"
                >
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : !imagePreviewUrl ? (
            <div className="border-2 border-dashed border-neutral-250 bg-[#FAFBFB] rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all">
              <div className="p-3 bg-white rounded-full text-teal-brand shadow-xs mb-3">
                <Camera className="w-6 h-6 stroke-[2]" />
              </div>

              <p className="text-xs font-bold text-navy mb-1">Take Photo or Upload Image</p>
              <p className="text-[10px] text-neutral-400 mb-4 font-semibold">Supports PNG, JPG, or JPEG file types</p>

              <div className="flex flex-col gap-2 w-full max-w-[260px]">
                {isDemo && (
                  <button
                    type="button"
                    id="btn-try-demo-receipt"
                    onClick={handleSimulateScan}
                    className="w-full h-10 bg-amber-brand/10 hover:bg-amber-brand/20 text-[#B45309] border border-amber-brand/35 font-extrabold rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-pointer transition-all active:scale-[0.98] mb-1 animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Try demo receipt</span>
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
                  <span>Scan Receipt / Take Photo</span>
                </button>

                {/* Upload File button triggering standard hidden file picker input */}
                <button
                  type="button"
                  id="btn-upload-file"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-9 bg-[#F3FBF8] hover:bg-[#EAF7F4] text-teal-brand border border-teal-500/10 font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span>Upload File</span>
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
                  Ready to read
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
                  <span>Reading your receipt...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Read Receipt</span>
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
                    <span>Extracting sample...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Use sample receipt (Demo Mode)</span>
                  </>
                )}
              </button>
            )}

            <span className="block text-[9.5px] text-neutral-400 text-center leading-normal">
              Receipt reading is basic in this MVP. Please check the details before saving.
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
              {scanMessage}
              <p className="text-[10px] text-neutral-400 mt-1 leading-normal font-sans">
                💡 SCANNED DATA LOADED. Feel free to adjust any fields below.
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
                  {isFromCamera ? "Scanning Failed" : "AI Reading Unavailable"}
                </span>
                <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                  {isFromCamera 
                    ? "Tax5 could not read this photo clearly. Please retake the photo or enter details manually." 
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
                    <span>Retake Photo</span>
                  </button>
                  
                  <button
                    type="button"
                    id="btn-enter-manually-camera"
                    onClick={handleEnterManually}
                    className="h-9 px-4 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Enter Manually
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
                    <span>Try Again</span>
                  </button>
                  
                  <button
                    type="button"
                    id="btn-enter-manually-gemini"
                    onClick={handleEnterManually}
                    className="h-9 px-4 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Enter Manually
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
                <span>Detected Text</span>
                <span className="bg-teal-brand-light text-teal-brand text-[9px] px-1.5 py-0.5 rounded font-black">
                  Transcribed
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

          {/* ================= TAX5 AI CLASSIFICATION GUIDE SUGGESTION ================= */}
          {formBEItem && (
            <SuggestionInsightsCard
              formBEItem={formBEItem}
              claimStatus={claimStatus}
              confidence={confidence}
              suggestionWhy={suggestionWhy}
              suggestionCheck={suggestionCheck}
            />
          )}
          
          {/* ================= STEP 2: CHECK THE DETAILS ================= */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/60 space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-brand-light text-teal-brand text-[10px] font-extrabold">2</span>
              <span className="font-bold text-xs text-navy uppercase tracking-wider">Check the details</span>
            </div>

            {/* Merchant Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-600">
                Receipt Name / Merchant <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="input-merchant"
                placeholder="e.g. Popular Bookstore, Pantai Hospital"
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
                  Receipt Date <span className="text-red-500">*</span>
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
                  Amount in RM <span className="text-red-500">*</span>
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
              <span className="font-bold text-xs text-navy uppercase tracking-wider">Choose claim info</span>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-neutral-600">
                  Claim Category <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-neutral-400 font-bold">RM Limit Capped</span>
              </div>
              
              <select
                id="select-category"
                value={selectedOptionId}
                onChange={(e) => handleDropdownChange(e.target.value)}
                className={`w-full h-10 px-3 rounded-xl bg-[#FAFBFB] border text-xs focus:bg-white focus:outline-none transition-all cursor-pointer ${
                  errors.category ? "border-red-500 focus:border-red-500" : "border-neutral-250 focus:border-teal-brand"
                }`}
              >
                <option value="">-- Choose Category --</option>
                {dropdownOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {selectedOptionId && (
                <p className="text-[10.5px] text-teal-brand font-medium mt-1 bg-[#F3FBF8] border border-teal-500/10 px-2.5 py-1 rounded-lg">
                  💡 Limit status: <span className="font-bold text-teal-brand">{dropdownOptions.find(o => o.id === selectedOptionId)?.helper}</span>
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
                Malaysian Claim Status <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { 
                    id: ClaimStatus.Claimable, 
                    label: "Claimable", 
                    style: "border-teal-brand/35 bg-[#F1FBF9] text-teal-brand hover:bg-teal-brand/10",
                    activeStyle: "border-teal-brand bg-teal-brand text-white rounded-xl ring-2 ring-teal-brand/20 shadow-xs"
                  },
                  { 
                    id: ClaimStatus.CheckAgain, 
                    label: "Needs Review", 
                    style: "border-amber-brand/35 bg-[#FFFDF5] text-amber-brand hover:bg-[#FFFDF5]",
                    activeStyle: "border-amber-brand bg-amber-brand text-white rounded-xl ring-2 ring-amber-brand/30 shadow-xs"
                  },
                  { 
                    id: ClaimStatus.NonClaimable, 
                    label: "Not-eligible", 
                    style: "border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100",
                    activeStyle: "border-neutral-700 bg-neutral-800 text-white rounded-xl shadow-xs"
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
                      className={`h-11 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center text-center ${
                        isSelected ? pill.activeStyle : `${pill.style} border-neutral-200`
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
                Notes (Optional)
              </label>
              <textarea
                placeholder="Provide context like purchase item or vendor details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-16 p-3 rounded-xl bg-[#FAFBFB] border border-neutral-250 text-xs focus:bg-white focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Legal and official disclaimer context box */}
          <div className="flex gap-2 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-navy">
            <Info className="w-4 h-4 text-navy-light shrink-0 mt-0.5" />
            <div className="text-[10px] text-navy/80 leading-normal space-y-1">
              <p>
                <strong>Important Notice:</strong> While Tax5 simplifies tracking using smart OCR classification, it <strong>does not</strong> constitute official tax or financial advice.
              </p>
              <p>
                Please keep physical copies of your tax receipts for at least 7 years under LHDN audit requirements.
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
              Save Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddScanView;
