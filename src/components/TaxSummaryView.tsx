import React, { useState } from "react";
import { 
  Calculator, 
  HelpCircle, 
  AlertCircle,
  Ban,
  TrendingUp, 
  ArrowLeft,
  ChevronRight,
  Info,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Book,
  Lock,
  Crown,
  Sparkles
} from "lucide-react";
import { Receipt, ClaimCategory, ClaimStatus, CATEGORY_LIMITS, SmartSetupData } from "../types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import JSZip from "jszip";
import { useLanguage } from "../context/LanguageContext";

interface TaxSummaryViewProps {
  receipts: Receipt[];
  smartSetup: SmartSetupData | null;
  onBackToHome: () => void;
  onNavigateToScan: () => void;
  onNavigateToSetup: () => void;
  currentUser?: { id?: string; name: string; email: string; isDemo?: boolean } | null;
  onSaveSmartSetup?: (data: SmartSetupData) => void;
  simulatedPlan?: string;
  onTriggerUpgrade?: () => void;
}

interface Employer {
  id: string;
  name: string;
  tin?: string;
  period: string;
  income: number;
  mtd: number;
  taxBorne: "Yes" | "No" | "Not sure";
  epf?: number;
  socso?: number;
  eis?: number;
  docType?: "EA form" | "EC form";
  attachedFile?: string;
}

export const TaxSummaryView: React.FC<TaxSummaryViewProps> = ({
  receipts,
  smartSetup,
  onBackToHome,
  onNavigateToScan,
  onNavigateToSetup,
  currentUser,
  onSaveSmartSetup,
  simulatedPlan = "Free Demo",
  onTriggerUpgrade,
}) => {
  const { t, language } = useLanguage();
  const [isBEGuideExpanded, setIsBEGuideExpanded] = useState(false);
  const [isAllCategoriesExpanded, setIsAllCategoriesExpanded] = useState(false);

  // Active view to manage transition between general summary and full screen employment details
  const [activeView, setActiveView] = useState<"summary" | "employment">("summary");
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  // Dynamic storage key helper for EA employers
  const getEmployersKey = (user: any) => {
    if (!user) return "tax5_ea_employers";
    return user.isDemo 
      ? "tax5_ea_employers_demo" 
      : `tax5_ea_employers_user_${user.id || user.email}`;
  };

  const [employers, setEmployers] = useState<Employer[]>([]);

  // Sync employers state with the active user context
  React.useEffect(() => {
    try {
      const key = getEmployersKey(currentUser);
      const raw = localStorage.getItem(key);
      setEmployers(raw ? JSON.parse(raw) : []);
    } catch (e) {
      setEmployers([]);
    }
  }, [currentUser]);

  // Inline employer questionnaire modal/form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmpDocType, setNewEmpDocType] = useState<"EA form" | "EC form">("EA form");
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpTin, setNewEmpTin] = useState("");
  const [newEmpPeriod, setNewEmpPeriod] = useState("01/01/2026 - 31/12/2026");
  const [newEmpIncome, setNewEmpIncome] = useState("");
  const [newEmpMtd, setNewEmpMtd] = useState("");
  const [newEmpEpf, setNewEmpEpf] = useState("");
  const [newEmpSocso, setNewEmpSocso] = useState("");
  const [newEmpEis, setNewEmpEis] = useState("");
  const [newEmpTaxBorne, setNewEmpTaxBorne] = useState<"Yes" | "No" | "Not sure">("No");

  const saveEmployers = (list: Employer[]) => {
    setEmployers(list);
    try {
      const key = getEmployersKey(currentUser);
      localStorage.setItem(key, JSON.stringify(list));

      // Propagate totals to smartSetup if callback exists
      if (onSaveSmartSetup && smartSetup) {
        const sumIncome = list.reduce((acc, current) => acc + (current.income || 0), 0);
        const sumMtd = list.reduce((acc, current) => acc + (current.mtd || 0), 0);
        const sumEpf = list.reduce((acc, current) => acc + (current.epf || 0), 0);
        const sumSocso = list.reduce((acc, current) => acc + (current.socso || 0), 0);
        const sumEis = list.reduce((acc, current) => acc + (current.eis || 0), 0);

        const updatedData: SmartSetupData = {
          ...smartSetup,
          numberOfEmployments: list.length === 0 ? "" : list.length === 1 ? "1" : list.length === 2 ? "2" : "3 or more",
          annualEmploymentIncome: sumIncome > 0 ? sumIncome.toString() : "",
          pcbPaid: sumMtd > 0 ? sumMtd.toString() : "",
          epfAmount: sumEpf > 0 ? sumEpf.toString() : smartSetup.epfAmount,
          socsoAmount: sumSocso > 0 ? sumSocso.toString() : smartSetup.socsoAmount,
          eisAmount: sumEis > 0 ? sumEis.toString() : smartSetup.eisAmount,
        };
        onSaveSmartSetup(updatedData);
      }
    } catch (e) {
      console.error("Failed to sync EA employers to device:", e);
    }
  };

  const handleSaveEmployer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpPeriod.trim() || !newEmpIncome.trim()) return;

    const newEmp: Employer = {
      id: "emp_" + Math.random().toString(36).substring(2, 9),
      name: newEmpName.trim(),
      tin: newEmpTin.trim() || "E-9999999",
      period: newEmpPeriod.trim(),
      income: parseFloat(newEmpIncome) || 0,
      mtd: parseFloat(newEmpMtd) || 0,
      taxBorne: newEmpTaxBorne,
      epf: parseFloat(newEmpEpf) || 0,
      socso: parseFloat(newEmpSocso) || 0,
      eis: parseFloat(newEmpEis) || 0,
      docType: newEmpDocType,
      attachedFile: attachedFile || undefined,
    };

    const updated = [...employers, newEmp];
    saveEmployers(updated);

    // Reset Form inputs
    setNewEmpName("");
    setNewEmpTin("");
    setNewEmpPeriod("01/01/2026 - 31/12/2026");
    setNewEmpIncome("");
    setNewEmpMtd("");
    setNewEmpEpf("");
    setNewEmpSocso("");
    setNewEmpEis("");
    setNewEmpTaxBorne("No");
    setNewEmpDocType("EA form");
    setAttachedFile(null);
  };

  const handleDeleteEmployer = (id: string) => {
    const updated = employers.filter((emp) => emp.id !== id);
    saveEmployers(updated);
  };

  const handleLoadDemoDetails = () => {
    setNewEmpDocType("EA form");
    setNewEmpName("Tax5 Demo Sdn Bhd");
    setNewEmpPeriod("01/01/2026 - 31/12/2026");
    setNewEmpIncome("85000");
    setNewEmpMtd("3400");
    setNewEmpEpf("9350");
    setNewEmpSocso("400");
    setNewEmpEis("80");
    setNewEmpTaxBorne("No");
  };

  // Sum employer incomes and deductions, falling back to smart setup profile inputs if no explicit records exist
  const totalIncome = employers.length > 0 
    ? employers.reduce((sum, emp) => sum + emp.income, 0)
    : parseFloat(smartSetup?.annualEmploymentIncome || "0") || 0;

  const totalMtd = employers.length > 0
    ? employers.reduce((sum, emp) => sum + emp.mtd, 0)
    : parseFloat(smartSetup?.pcbPaid || "0") || 0;

  const numEmployments = employers.length > 0
    ? employers.length.toString()
    : smartSetup?.numberOfEmployments || "1";

  // Combine smart setup completeness or presence of at least one verified EA Form employer record
  const isSetupComplete = !!smartSetup && employers.length > 0;

  // Filter receipt types
  const claimableReceipts = receipts.filter(r => r.claimStatus === ClaimStatus.Claimable);
  const checkAgainReceipts = receipts.filter(r => r.claimStatus === ClaimStatus.CheckAgain);
  const nonClaimableReceipts = receipts.filter(r => r.claimStatus === ClaimStatus.NonClaimable);

  const hasSspnReceipt = receipts.some(r => r.formBEItem === "G13" || (r.tax5DisplayName || "").toLowerCase().includes("sspn") || (r.notes || "").toLowerCase().includes("sspn") || (r.merchant || "").toLowerCase().includes("sspn"));
  const showSspnReminder = !!(hasSspnReceipt || smartSetup?.sspnSavingsChild === "Yes" || smartSetup?.sspnSavingsChild === "Not sure");

  // Calculate total spent per category (Only for Claimable receipts)
  const categoryTotals: Record<ClaimCategory, number> = {
    [ClaimCategory.Lifestyle]: 0,
    [ClaimCategory.Medical]: 0,
    [ClaimCategory.Education]: 0,
    [ClaimCategory.Sports]: 0,
    [ClaimCategory.Insurance]: 0,
    [ClaimCategory.Other]: 0,
  };

  claimableReceipts.forEach((r) => {
    if (categoryTotals[r.category] !== undefined) {
      categoryTotals[r.category] += r.amount;
    }
  });

  // Calculate capped values
  const cappedCategoryTotals: Record<ClaimCategory, number> = {
    [ClaimCategory.Lifestyle]: Math.min(categoryTotals[ClaimCategory.Lifestyle], CATEGORY_LIMITS[ClaimCategory.Lifestyle].limit),
    [ClaimCategory.Medical]: Math.min(categoryTotals[ClaimCategory.Medical], CATEGORY_LIMITS[ClaimCategory.Medical].limit),
    [ClaimCategory.Education]: Math.min(categoryTotals[ClaimCategory.Education], CATEGORY_LIMITS[ClaimCategory.Education].limit),
    [ClaimCategory.Sports]: Math.min(categoryTotals[ClaimCategory.Sports], CATEGORY_LIMITS[ClaimCategory.Sports].limit),
    [ClaimCategory.Insurance]: Math.min(categoryTotals[ClaimCategory.Insurance], CATEGORY_LIMITS[ClaimCategory.Insurance].limit),
    [ClaimCategory.Other]: Math.min(categoryTotals[ClaimCategory.Other], CATEGORY_LIMITS[ClaimCategory.Other].limit),
  };

  const totalCappedClaim = Object.values(cappedCategoryTotals).reduce((sum, val) => sum + val, 0);

  const [showDownloadReminder, setShowDownloadReminder] = useState(false);

  // Helper to scroll to Section G Guide
  const handleViewDraftGuide = () => {
    const el = document.getElementById("section-g-guide");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // PDF file downloader helper
  const handleDownloadDraft = () => {
    if (simulatedPlan === "Free Demo") {
      if (onTriggerUpgrade) {
        onTriggerUpgrade();
      }
      return;
    }
    executeDownload();
  };

  const handleDownloadAllReceiptImages = async () => {
    const receiptsWithImages = receipts.filter(r => r.receiptImageDataUrl);
    if (receiptsWithImages.length === 0) {
      alert("No receipt images available to download yet.");
      return;
    }

    const dataURLtoBlob = (dataUrl: string): Blob | null => {
      try {
        const parts = dataUrl.split(",");
        if (parts.length < 2) return null;
        const header = parts[0];
        const base64Data = parts[1];
        
        const mimeMatch = header.match(/data:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
        
        const binaryStr = atob(base64Data);
        const len = binaryStr.length;
        const u8arr = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          u8arr[i] = binaryStr.charCodeAt(i);
        }
        return new Blob([u8arr], { type: mimeType });
      } catch (err) {
        console.error("Failed to parse data URL to Blob", err);
        return null;
      }
    };

    const getExtensionFromDataUrl = (dataUrl: string): string => {
      if (dataUrl.startsWith("data:image/png")) return "png";
      if (dataUrl.startsWith("data:image/webp")) return "webp";
      if (dataUrl.startsWith("data:image/gif")) return "gif";
      if (dataUrl.startsWith("data:image/svg+xml")) return "svg";
      return "jpg"; // Default
    };

    let hasInvalidData = false;

    // Single image direct download
    if (receiptsWithImages.length === 1) {
      const receipt = receiptsWithImages[0];
      const dataUrl = receipt.receiptImageDataUrl!;
      const blob = dataURLtoBlob(dataUrl);
      if (!blob) {
        alert("The stored image data was invalid.");
        return;
      }

      const ext = getExtensionFromDataUrl(dataUrl);
      const merchantClean = (receipt.merchant || "receipt")
        .toLowerCase()
        .replace(/[^a-z0-9\s-_]/g, "")
        .trim()
        .replace(/\s+/g, "_");
        
      const dateStr = receipt.date || (receipt.createdAt ? new Date(receipt.createdAt).toISOString().split('T')[0] : "2026-06-17");
      const filename = `${merchantClean}_${dateStr}_receipt.${ext}`;

      const link = document.createElement("a");
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      return;
    }

    // Multiple images ZIP download
    const zip = new JSZip();
    const usedFilenames = new Set<string>();

    receiptsWithImages.forEach((receipt) => {
      const dataUrl = receipt.receiptImageDataUrl!;
      const blob = dataURLtoBlob(dataUrl);
      if (!blob) {
        hasInvalidData = true;
        return; // Skip invalid
      }

      const ext = getExtensionFromDataUrl(dataUrl);
      const merchantClean = (receipt.merchant || "receipt")
        .toLowerCase()
        .replace(/[^a-z0-9\s-_]/g, "")
        .trim()
        .replace(/\s+/g, "_");
        
      const dateStr = receipt.date || (receipt.createdAt ? new Date(receipt.createdAt).toISOString().split('T')[0] : "2026-06-17");
      
      const baseName = `${merchantClean}_${dateStr}_receipt`;
      let filename = `${baseName}.${ext}`;
      let counter = 1;

      while (usedFilenames.has(filename.toLowerCase())) {
        filename = `${baseName}_${counter}.${ext}`;
        counter++;
      }

      usedFilenames.add(filename.toLowerCase());
      zip.file(filename, blob);
    });

    try {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      const zipUrl = URL.createObjectURL(zipBlob);
      link.href = zipUrl;
      link.download = "tax5_receipts_YA2026.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 100);

      if (hasInvalidData) {
        alert("Some receipt images could not be included because the stored image data was invalid.");
      }
    } catch (zipErr) {
      console.error("Failed to generate ZIP", zipErr);
      alert("Error generating ZIP download. Resorting to fallback individual downloads.");
      
      receiptsWithImages.forEach((receipt, index) => {
        const dataUrl = receipt.receiptImageDataUrl!;
        const ext = getExtensionFromDataUrl(dataUrl);
        const merchantClean = (receipt.merchant || "receipt")
          .toLowerCase()
          .replace(/[^a-z0-9\s-_]/g, "")
          .trim()
          .replace(/\s+/g, "_");
          
        const dateStr = receipt.date || (receipt.createdAt ? new Date(receipt.createdAt).toISOString().split('T')[0] : "2026-06-17");
        const filename = `${merchantClean}_${dateStr}_receipt.${ext}`;

        setTimeout(() => {
          const l = document.createElement("a");
          l.href = dataUrl;
          l.download = filename;
          document.body.appendChild(l);
          l.click();
          document.body.removeChild(l);
        }, index * 400);
      });
    }
  };

  const executeDownload = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const dateStr = new Date().toLocaleDateString(language === "BM" ? "ms-MY" : "en-MY", { year: "numeric", month: "long", day: "numeric" });

    // Header Frame - Clean & Compact
    doc.setDrawColor(180, 185, 190);
    doc.setLineWidth(0.4);
    doc.setFillColor(245, 246, 248);
    doc.rect(15, 12, 180, 14, "FD");

    // Tax5 Brand & Title
    doc.setTextColor(9, 36, 74); // Navy
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(
      language === "BM" 
        ? "DRAF PERSEDIAAN BERGAYA BORANG BE TAX5" 
        : "TAX5 FORM BE-STYLE PREPARATION DRAFT", 
      19, 
      17.5
    );

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 90, 100);
    doc.text(
      language === "BM"
        ? `BUKAN BORANG BE LHDN YANG RASMI  •  DIJANA PADA: ${dateStr}`
        : `NOT THE OFFICIAL LHDN FORM BE  •  GENERATED ON: ${dateStr}`, 
      19, 
      22.5
    );

    // Year of Assessment Right Align Accent
    doc.setTextColor(0, 168, 132); // Green Accent
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("YA 2026", 172, 17.5);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 140, 150);
    doc.text(
      language === "BM" ? "TAHUN TAKSIRAN" : "YEAR OF ASSESSMENT", 
      language === "BM" ? 168 : 158, 
      22.5
    );

    // Disclaimer Block - Compact
    doc.setFillColor(254, 252, 244); // light warning bg
    doc.setDrawColor(217, 119, 6); // amber border
    doc.setLineWidth(0.3);
    doc.rect(15, 29, 180, 7, "FD");

    doc.setTextColor(180, 83, 9); // deep amber text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(
      language === "BM" ? "NOTIS PENTING & PENAFIAN:" : "IMPORTANT NOTICE & DISCLAIMER:", 
      18, 
      33.5
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(
      language === "BM"
        ? "Pembantu draf pra-pemfailan Tax5. Ini BUKAN Borang BE LHDN yang rasmi. Sahkan semua pengiraan sebelum penyerahan e-Filing akhir."
        : "Tax5 pre-filing draft helper. This is NOT the official LHDN Form BE. Verify all calculations before final e-Filing submission.", 
      language === "BM" ? 56 : 68, 
      33.5
    );

    // Profile details resolution
    let realName = smartSetup?.fullName || "";
    let realEmail = smartSetup?.email || "";
    if (!realName || !realEmail) {
      if (currentUser && !currentUser.isDemo) {
        if (!realName) realName = currentUser.name;
        if (!realEmail) realEmail = currentUser.email;
      } else {
        try {
          const rawUser = localStorage.getItem("tax5_simulated_user");
          if (rawUser) {
            const parsed = JSON.parse(rawUser);
            if (!realName && parsed.name) realName = parsed.name;
            if (!realEmail && parsed.email) realEmail = parsed.email;
          }
        } catch (e) {}
      }
    }
    if (!realName) realName = "Not provided";
    if (!realEmail) realEmail = "Not provided";

    const assessmentType = (() => {
      if (!smartSetup) return "Needs review";
      
      if (
        smartSetup.maritalStatus === "Not sure" || 
        smartSetup.maritalStatusA4 === "Not sure yet" || 
        smartSetup.spouseAssessmentChoice === "Not sure yet" ||
        smartSetup.assessmentTypeA6 === "unknown"
      ) {
        return "Needs review";
      }

      if (smartSetup.maritalStatus === "Married") {
        const a6 = smartSetup.assessmentTypeA6;
        if (a6 === "1") return "Joint assessment in husband’s name";
        if (a6 === "2") return "Joint assessment in wife’s name";
        if (a6 === "3") return "Separate assessment";
        if (a6 === "4") return "Spouse has no income / no source / tax-exempt income";
        
        const choice = smartSetup.spouseAssessmentChoice;
        if (choice === "Together under my name") {
          if (smartSetup.gender === "Male") return "Joint assessment in husband’s name";
          if (smartSetup.gender === "Female") return "Joint assessment in wife’s name";
          return "Joint assessment in husband’s name";
        }
        if (choice === "Together under my spouse's name") {
          if (smartSetup.gender === "Male") return "Joint assessment in wife’s name";
          if (smartSetup.gender === "Female") return "Joint assessment in husband’s name";
          return "Joint assessment in wife’s name";
        }
        if (choice === "My spouse has no income") return "Spouse has no income / no source / tax-exempt income";
        if (choice === "Separately" || choice === "Separately from my spouse" || a6 === "3") return "Separate assessment";
        
        return "Needs review";
      }

      const statusA4 = smartSetup.maritalStatusA4;
      const status = smartSetup.maritalStatus;

      if (status === "Single" || statusA4 === "Single") {
        return "Self only: single";
      }
      if (status === "Divorced" || statusA4 === "Divorcee") {
        return "Self only: divorcee";
      }
      if (status === "Widowed" || statusA4 === "Widow / Widower") {
        return "Self only: widow / widower";
      }

      return "Needs review";
    })();

    const translatedAssessmentType = (() => {
      if (language === "BM") {
        if (assessmentType === "Needs review") return "Perlu semakan";
        if (assessmentType === "Joint assessment in husband’s name") return "Taksiran bersama atas nama suami";
        if (assessmentType === "Joint assessment in wife’s name") return "Taksiran bersama atas nama isteri";
        if (assessmentType === "Separate assessment") return "Taksiran berasingan";
        if (assessmentType === "Spouse has no income / no source / tax-exempt income") return "Pasangan tiada pendapatan / tiada sumber / pendapatan dikecualikan cukai";
        if (assessmentType === "Self only: single") return "Diri sendiri sahaja: bujang";
        if (assessmentType === "Self only: divorcee") return "Diri sendiri sahaja: bercerai";
        if (assessmentType === "Self only: widow / widower") return "Diri sendiri sahaja: balu / duda";
      }
      return assessmentType;
    })();

    // Shared Form BE Theme Style with grey label headers and black/dark-grey outline borders
    const formBeThemeStyles: any = {
      theme: "plain",
      styles: { fontSize: 7, cellPadding: 1.2, font: "helvetica", textColor: [20, 20, 20], lineColor: [140, 145, 150], lineWidth: 0.18 },
      headStyles: { fillColor: [232, 235, 238], fontStyle: "bold", textColor: [9, 36, 74], lineColor: [140, 145, 150], lineWidth: 0.18 },
    };

    // B. BASIC PARTICULARS
    autoTable(doc, {
      startY: 39,
      margin: { left: 15, right: 15 },
      head: [[{ content: language === "BM" ? "BUTIRAN ASAS" : "BASIC PARTICULARS", colSpan: 4 }]],
      body: [
        ["1", language === "BM" ? "Nama (Seperti di dalam dokumen pengenalan)" : "Name (As per identification document)", { content: realName, colSpan: 2, styles: { fontStyle: "bold" } }],
        ["2", language === "BM" ? "No. Pengenalan Cukai (TIN)" : "Tax Identification No. (TIN)", { content: smartSetup?.tin || (language === "BM" ? "Tidak disediakan" : "Not provided"), colSpan: 2 }],
        ["3", language === "BM" ? "No. Kad Pengenalan / MyKad / Pasport" : "Identification No. / MyKad / Passport", smartSetup?.identificationNumber || (language === "BM" ? "Tidak disediakan" : "Not provided"), "5", language === "BM" ? `Pasport didaftarkan dengan LHDNM: ${smartSetup?.identificationNumber ? "Ya" : "Tidak disediakan"}` : `Passport registered with LHDNM: ${smartSetup?.identificationNumber ? "Yes" : "Not provided"}`],
        ["4", language === "BM" ? "Alamat E-mel" : "Email Address", { content: realEmail, colSpan: 2 }, language === "BM" ? "Tahun Taksiran" : "Year of Assessment", smartSetup?.yearOfAssessment || "YA 2026"]
      ],
      ...formBeThemeStyles,
      columnStyles: {
        0: { cellWidth: 8, fontStyle: "bold", textColor: [9, 36, 74] },
        1: { cellWidth: 55, fontStyle: "bold" },
        2: { cellWidth: 60 }
      }
    } as any);

    const genderVal = smartSetup?.gender === "Male" ? (language === "BM" ? "Lelaki" : "Male") : smartSetup?.gender === "Female" ? (language === "BM" ? "Perempuan" : "Female") : (language === "BM" ? "Tidak disediakan / Tiada spesifikasi" : "Not provided / Unspecified");
    const maritalVal = (() => {
      const val = smartSetup?.maritalStatus;
      if (!val) return language === "BM" ? "Tidak disediakan" : "Not provided";
      if (language === "BM") {
        if (val === "Single") return "Bujang";
        if (val === "Married") return "Kahwin";
        if (val === "Divorced") return "Bercerai";
        if (val === "Widowed") return "Balu / Duda";
      }
      return val;
    })();
    const citizenVal = smartSetup?.salariedBE === "No" ? (language === "BM" ? "Bukan Pemastautin" : "Non-Resident") : (language === "BM" ? "MYS / Individu Pemastautin" : "MYS / Resident Individual");

    // C. PART A: PARTICULARS OF INDIVIDUAL
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 3,
      margin: { left: 15, right: 15 },
      head: [[{ content: language === "BM" ? "BAHAGIAN A: BUTIRAN PERIBADI INDIVIDU" : "PART A: PARTICULARS OF INDIVIDUAL", colSpan: 5 }]],
      body: [
        ["A1", language === "BM" ? "Status Warganegara / Pemastautin" : "Citizen Status / Resident", citizenVal, "A2", `${language === "BM" ? "Jantina" : "Gender"}: ${genderVal}`],
        ["A3", language === "BM" ? "Tarikh Lahir" : "Date of Birth", smartSetup?.dateOfBirth || (language === "BM" ? "Tidak disediakan" : "Not provided"), "A4", `${language === "BM" ? "Status pada 31-12-2025" : "Status as at 31-12-2025"}: ${maritalVal}`],
        ["A5", language === "BM" ? "Situasi Pasangan" : "Spouse Situation", smartSetup?.spouseSituation || (language === "BM" ? "Tidak disediakan" : "Not provided"), "A6", `${language === "BM" ? "Jenis taksiran" : "Type of assessment"}: ${translatedAssessmentType}`]
      ],
      ...formBeThemeStyles,
      columnStyles: {
        0: { cellWidth: 8, fontStyle: "bold", textColor: [9, 36, 74] },
        1: { cellWidth: 44, fontStyle: "bold" },
        2: { cellWidth: 50 },
        3: { cellWidth: 8, fontStyle: "bold", textColor: [9, 36, 74] }
      }
    } as any);

    // D. EMPLOYMENT RECORDS / EA SUMMARY Table (Always on Page 1)
    let eaBody = [];
    let eaHeaders = [];
    let eaColStyles: any = {};
    if (employers.length === 0) {
      eaHeaders = language === "BM"
        ? [["Kod Item", "Rekod / Kategori", "Butiran / Nilai"]]
        : [["Item Code", "Record / Category", "Details / Value"]];
      eaBody = [
        ["B1", language === "BM" ? "Pendapatan penggajian" : "Employment income", language === "BM" ? "Tidak disediakan" : "Not provided"],
        ["B1a", language === "BM" ? "Bilangan penggajian" : "Number of employments", "0"],
        ["Status", language === "BM" ? "Status Borang EA" : "EA Form Status", language === "BM" ? "Butiran borang EA belum ditambah" : "EA form details not added yet"]
      ];
      eaColStyles = {
        0: { cellWidth: 20, fontStyle: "bold", textColor: [9, 36, 74] },
        1: { cellWidth: 60, fontStyle: "bold" },
        2: { cellWidth: 100 }
      };
    } else {
      eaHeaders = language === "BM"
        ? [["Ruj", "Nama Majikan", "Ruj TIN", "Tempoh Pekerjaan", "Gaji Pekerjaan", "MTD PCB", "Status"]]
        : [["Ref", "Employer Name", "TIN Ref", "Period of Employment", "Employment Wages", "MTD PCB", "Status"]];
      eaBody = employers.map((emp, index) => [
        `${(emp.docType || "EA").toUpperCase().replace(" FORM", "")} #${index + 1}`,
        emp.name,
        emp.tin || (language === "BM" ? "Tidak disediakan" : "Not provided"),
        emp.period || (language === "BM" ? "Tidak disediakan" : "Not provided"),
        `RM${emp.income.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `RM${emp.mtd.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        language === "BM" ? `Cukai Ditanggung: ${emp.taxBorne === "Yes" ? "Ya" : emp.taxBorne === "No" ? "Tidak" : "Kurang Pasti"}` : `Tax Borne: ${emp.taxBorne}`
      ]);
      eaColStyles = {
        0: { cellWidth: 12, fontStyle: "bold", textColor: [9, 36, 74] },
        1: { fontStyle: "bold", cellWidth: 38 },
        2: { cellWidth: 20 },
        3: { cellWidth: 32 },
        4: { fontStyle: "bold", cellWidth: 26 },
        5: { fontStyle: "bold", cellWidth: 22 },
        6: { cellWidth: 30 }
      };
    }

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 3,
      margin: { left: 15, right: 15 },
      head: eaHeaders,
      body: eaBody,
      ...formBeThemeStyles,
      columnStyles: eaColStyles
    } as any);

    // Helper math values for Part BA, PART BC, Part G
    const checkedContributions = smartSetup?.availableContributions || [];
    const hasSocso = checkedContributions.includes("SOCSO / PERKESO");
    const hasEis = checkedContributions.includes("EIS / SIP");
    const socsoVal = hasSocso && smartSetup?.socsoAmount && !isNaN(parseFloat(smartSetup.socsoAmount)) ? parseFloat(smartSetup.socsoAmount) : 0;
    const eisVal = hasEis && smartSetup?.eisAmount && !isNaN(parseFloat(smartSetup.eisAmount)) ? parseFloat(smartSetup.eisAmount) : 0;
    const totalG20 = Math.min(socsoVal + eisVal, 350); // Capped at G20 maximum limit of RM350

    const epfVal = smartSetup?.epfAmount && !isNaN(parseFloat(smartSetup.epfAmount)) ? parseFloat(smartSetup.epfAmount) : 0;
    const epfCapped = Math.min(epfVal, 4000);

    // SSPN claim calculation
    const sspnReceiptAmount = receipts
      ? receipts
          .filter(r => r.claimStatus === ClaimStatus.Claimable && (r.formBEItem === "G13" || (r.tax5DisplayName || "").toLowerCase().includes("sspn") || (r.notes || "").toLowerCase().includes("sspn") || (r.merchant || "").toLowerCase().includes("sspn")))
          .reduce((sum, r) => sum + r.amount, 0)
      : 0;
    const sspnCapped = Math.min(sspnReceiptAmount, 8000);

    const hasSpouseRelief = smartSetup?.maritalStatus === "Married" && smartSetup?.spouseAssessmentChoice === "My spouse has no income";
    const spouseReliefAmount = hasSpouseRelief ? 4000 : 0;

    const totalReliefVal = 9000 + totalCappedClaim + epfCapped + totalG20 + sspnCapped + spouseReliefAmount;

    const hasIncomeDetails = employers.length > 0 || (!!smartSetup?.annualEmploymentIncome && parseFloat(smartSetup.annualEmploymentIncome) > 0);
    const calculatedChargeableIncome = hasIncomeDetails ? Math.max(0, totalIncome - totalReliefVal) : 0;

    // LHDN YA 2025 Tax Bracket Calculator
    let estimatedTax = 0;
    if (hasIncomeDetails && calculatedChargeableIncome > 5000) {
      if (calculatedChargeableIncome <= 20000) {
        estimatedTax = (calculatedChargeableIncome - 5000) * 0.01;
      } else if (calculatedChargeableIncome <= 35000) {
        estimatedTax = 150 + (calculatedChargeableIncome - 20000) * 0.03;
      } else if (calculatedChargeableIncome <= 50000) {
        estimatedTax = 600 + (calculatedChargeableIncome - 35000) * 0.06;
      } else if (calculatedChargeableIncome <= 70000) {
        estimatedTax = 1500 + (calculatedChargeableIncome - 50000) * 0.11;
      } else if (calculatedChargeableIncome <= 100000) {
        estimatedTax = 3700 + (calculatedChargeableIncome - 70000) * 0.19;
      } else if (calculatedChargeableIncome <= 400000) {
        estimatedTax = 9400 + (calculatedChargeableIncome - 100000) * 0.25;
      } else {
        estimatedTax = 84400 + (calculatedChargeableIncome - 400000) * 0.26;
      }
    }

    // Individual rebate RM400 for chargeable income <= RM35,000
    if (hasIncomeDetails && calculatedChargeableIncome <= 35000 && calculatedChargeableIncome > 0) {
      estimatedTax = Math.max(0, estimatedTax - 400);
    }

    const netDiff = hasIncomeDetails ? estimatedTax - totalMtd : 0;

    // Continuous flow on Page 1: B13 / B14 / B27 PREPARATION SUMMARY & DETAILED EXPLANATION NOTE
    let currentY = (doc as any).lastAutoTable.finalY + 3;

    // D. PART BA: COMPUTATION OF CHARGEABLE INCOME PREPARATION
    let baBody = [];
    baBody = [
      ["B1", language === "BM" ? "Pendapatan berkanun daripada sumber penggajian di Malaysia" : "Statutory income from sources of employment in Malaysia", { content: hasIncomeDetails ? `RM${totalIncome.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (language === "BM" ? "Tidak disediakan" : "Not provided"), styles: { fontStyle: "normal" } }],
      ["B1a", language === "BM" ? "Bilangan penggajian" : "Number of employments", { content: hasIncomeDetails ? String(numEmployments) : (language === "BM" ? "Tiada rekod" : "No records"), styles: { fontStyle: "normal" } }],
      ["B13", language === "BM" ? "Jumlah Pemindahan Pelepasan (Pindahan dari Item G23)" : "Total Relief Transfer (Transfer from Item G23)", { content: `RM${totalReliefVal.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { fontStyle: "bold" } }],
      ["B14", language === "BM" ? "Anggaran Deraf Pendapatan Bercukai (B1 tolak subjumlah B13)" : "Chargeable Income Draft Estimate (B1 minus B13 subtotal)", { content: hasIncomeDetails ? `RM${calculatedChargeableIncome.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (language === "BM" ? "Tidak dikira" : "Not calculated"), styles: { fontStyle: "bold" } }]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: 15, right: 15 },
      head: [[{ content: language === "BM" ? "BAHAGIAN BA: PENGIRAAN PERSEDIAAN CUKAI" : "PART BA: COMPUTATION of tax PREPARATION", colSpan: 3 }]],
      body: baBody,
      ...formBeThemeStyles,
      columnStyles: {
        0: { cellWidth: 12, fontStyle: "bold", textColor: [9, 36, 74] },
        1: { cellWidth: 120, fontStyle: "bold" },
        2: { cellWidth: 48, textColor: [9, 36, 74] } // regular font weight (not bold)
      }
    } as any);

    // E. PART BC: TAX PAYABLE / REPAYABLE PREPARATION
    const bcStatusVal = (() => {
      if (!hasIncomeDetails) {
        return language === "BM" 
          ? "Tidak dikira - masukkan butiran akhir dalam LHDN/MyTax" 
          : "Not calculated - enter final details in LHDN/MyTax";
      }
      if (netDiff < 0) {
        return language === "BM"
          ? `Boleh Dituntut (Bayaran Balik): RM${Math.abs(netDiff).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `Repayable (Refund): RM${Math.abs(netDiff).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (netDiff > 0) {
        return language === "BM"
          ? `Anggaran Baki Perlu Dibayar: RM${netDiff.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `Estimated Balance Payable: RM${netDiff.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return language === "BM" ? "Baki Sifar (Tiada cukai kena dibayar)" : "Zero Balance (No tax due)";
    })();

    const bcBody = [
      ["B27", language === "BM" ? "Potongan Cukai Bulanan (MTD / PCB Dipotong bagi YA 2025)" : "Monthly Tax Deduction (MTD / PCB Deducted for YA 2025)", { content: hasIncomeDetails ? `RM${totalMtd.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (language === "BM" ? "Tidak disediakan" : "Not provided"), styles: { fontStyle: "normal" } }],
      ["B28", language === "BM" ? "Status Anggaran Cukai Perlu Dibayar / Dibayar Balik" : "Tax Payable / Repayables Estimation Status", { content: bcStatusVal, styles: { fontStyle: "bold" } }]
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 3,
      margin: { left: 15, right: 15 },
      head: [[{ content: language === "BM" ? "BAHAGIAN BC: STATUS ANGGARAN CUKAI PERSEDIAAN" : "PART BC: EST. DEDUCTION & TAX PAYABLE PREPARATION", colSpan: 3 }]],
      body: bcBody,
      ...formBeThemeStyles,
      columnStyles: {
        0: { cellWidth: 12, fontStyle: "bold", textColor: [9, 36, 74] },
        1: { cellWidth: 120, fontStyle: "bold" },
        2: { cellWidth: 48, textColor: [9, 36, 74] } // regular font weight (not bold)
      }
    } as any);

    // Compact Total Relief Explanation Note Strip underneath Part BA / Part BC tables
    let yNote = (doc as any).lastAutoTable.finalY + 3;
    doc.setFillColor(245, 246, 248);
    doc.setDrawColor(200, 205, 210);
    doc.setLineWidth(0.25);
    doc.rect(15, yNote, 180, 11, "FD");

    doc.setTextColor(9, 36, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(
      language === "BM" ? "NOTA KOMPOSISI JUMLAH PELEPASAN:" : "TOTAL RELIEF COMPOSITION NOTE:", 
      18, 
      yNote + 3.5
    );

    doc.setTextColor(80, 90, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    const noteText = language === "BM"
      ? `Nota: Jumlah tuntutan resit Tax5 ialah RM${totalCappedClaim.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Anggaran jumlah pelepasan Borang BE ialah RM${totalReliefVal.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kerana pelepasan individu G1 bernilai RM9,000.00 disertakan secara automatik. Potongan profil seperti KWSP dan PERKESO(SOCSO)/SIP(EIS) ialah RM${(epfCapped + totalG20).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} dan SSPN ialah RM${sspnCapped.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      : `Note: Tax5 receipt claim total is RM${totalCappedClaim.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Estimated Form BE total relief is RM${totalReliefVal.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} because G1 individual relief of RM9,000.00 is included automatically. Profile deductions such as EPF and SOCSO/EIS are RM${(epfCapped + totalG20).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} and SSPN is RM${sspnCapped.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
    const noteLines = doc.splitTextToSize(noteText, 172);
    doc.text(noteLines, 18, yNote + 6.8);

    // Force Page break to present Part G (Reliefs breakdown) beautifully on Page 2
    doc.addPage();
    currentY = 20;

    // F. PART G: RELIEF
    doc.setTextColor(9, 36, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      language === "BM"
        ? "BAHAGIAN G: PELEPASAN & KATEGORI TUNTUTAN TERPETA (PELEPASAN CUKAI DIISYTIHARKAN)"
        : "PART G: RELIEF & MAPPED CLAIM CATEGORIES (DECLARED TAX RELIEFS)", 
      15, 
      currentY
    );
    doc.setDrawColor(180, 185, 190);
    doc.line(15, currentY + 2, 195, currentY + 2);
    currentY += 5;

    const formatRM = (val: number) => `RM${val.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const reliefRows = [
      [
        "G1", 
        language === "BM" ? "Pelepasan Individu (Automatik)" : "Individual Relief (Automatic)", 
        "RM9,000.00", 
        "RM9,000.00", 
        "RM9,000.00", 
        language === "BM" ? "Pelepasan peribadi automatik disertakan untuk anggaran gaya Borang BE." : "Automatic personal relief included for Form BE-style estimate."
      ],
      [
        "G5", 
        language === "BM" ? "Pendidikan" : "Education", 
        formatRM(categoryTotals[ClaimCategory.Education] || 0), 
        formatRM(CATEGORY_LIMITS[ClaimCategory.Education].limit), 
        formatRM(cappedCategoryTotals[ClaimCategory.Education] || 0), 
        language === "BM" ? "Kursus pengajian sendiri dan pengajian ijazah." : "Self study courses and degrees study."
      ],
      ...(hasSpouseRelief ? [
        [
          "G5 Sp", 
          language === "BM" ? "Pelepasan Pasangan (tiada sumber pendapatan)" : "Spouse Relief (no income source)", 
          "RM4,000.00", 
          "RM4,000.00", 
          "RM4,000.00", 
          language === "BM" ? "Tuntutan untuk pasangan tanpa sumber pendapatan" : "Claim for spouse with no source of income"
        ]
      ] : []),
      [
        "G6/G7", 
        language === "BM" ? "Perubatan" : "Medical", 
        formatRM(categoryTotals[ClaimCategory.Medical] || 0), 
        formatRM(CATEGORY_LIMITS[ClaimCategory.Medical].limit), 
        formatRM(cappedCategoryTotals[ClaimCategory.Medical] || 0), 
        language === "BM" ? "Perubatan atau vaksin diri/pasangan/anak." : "Self/spouse/children medical or vaccines."
      ],
      [
        "G9", 
        language === "BM" ? "Gaya Hidup" : "Lifestyle", 
        formatRM(categoryTotals[ClaimCategory.Lifestyle] || 0), 
        formatRM(CATEGORY_LIMITS[ClaimCategory.Lifestyle].limit), 
        formatRM(cappedCategoryTotals[ClaimCategory.Lifestyle] || 0), 
        language === "BM" ? "Tuntutan buku, teknologi, internet" : "Books, tech, internet claim"
      ],
      [
        "G10", 
        language === "BM" ? "Sukan" : "Sports", 
        formatRM(categoryTotals[ClaimCategory.Sports] || 0), 
        formatRM(CATEGORY_LIMITS[ClaimCategory.Sports].limit), 
        formatRM(cappedCategoryTotals[ClaimCategory.Sports] || 0), 
        language === "BM" ? "Peralatan sukan, yuran gim" : "Sports equipment, gym fees"
      ],
      [
        "G13", 
        language === "BM" ? "Caruman Simpanan Bersih SSPN" : "SSPN Net Savings Contribution", 
        formatRM(sspnReceiptAmount), 
        "RM8,000.00", 
        formatRM(sspnCapped), 
        language === "BM" ? "Penyata simpanan tahunan bersih" : "Net annual savings statement"
      ],
      [
        "G17", 
        language === "BM" ? "Caruman KWSP" : "EPF Contributions", 
        formatRM(epfVal), 
        "RM4,000.00", 
        formatRM(epfCapped), 
        epfVal > 4000 
          ? (language === "BM" ? "Dihadkan pada maks RM4,000" : "Capped at max RM4,000") 
          : (language === "BM" ? "Caruman KWSP digunakan" : "EPF contribution applied")
      ],
      [
        "G20", 
        "SOCSO / EIS", 
        formatRM(socsoVal + eisVal), 
        "RM350.00", 
        formatRM(totalG20), 
        language === "BM" ? "Caruman keselamatan sosial" : "Social security contributions"
      ],
      [
        "Other", 
        language === "BM" ? "Tuntutan Lain" : "Other Claims", 
        formatRM(categoryTotals[ClaimCategory.Other] || 0), 
        formatRM(CATEGORY_LIMITS[ClaimCategory.Other].limit), 
        formatRM(cappedCategoryTotals[ClaimCategory.Other] || 0), 
        language === "BM" ? "Subjumlah resit cukai lain" : "Other tax receipts subtotal"
      ],
      [
        "G23", 
        language === "BM" ? "Jumlah Pelepasan (Pindah ke B13)" : "Total Relief (Transfer to B13)", 
        { content: formatRM(totalReliefVal), styles: { fontStyle: "bold" } }, 
        "-", 
        { content: formatRM(totalReliefVal), styles: { fontStyle: "bold" } }, 
        language === "BM" ? "Jumlah tuntutan G1 hingga G22 dipindahkan terus ke B13." : "Sum of G1 to G22 claims transferred directly to B13."
      ]
    ];

    const formBePartGThemeStyles: any = {
      theme: "plain",
      styles: { 
        fontSize: 6.5, 
        cellPadding: 1.0, 
        font: "helvetica", 
        textColor: [20, 20, 20], 
        lineColor: [140, 145, 150], 
        lineWidth: 0.18,
        overflow: "linebreak" 
      },
      headStyles: { 
        fillColor: [232, 235, 238], 
        fontStyle: "bold", 
        textColor: [9, 36, 74], 
        lineColor: [140, 145, 150], 
        lineWidth: 0.18,
        fontSize: 6.5 
      },
    };

    autoTable(doc, {
      startY: currentY,
      margin: { left: 15, right: 15 },
      head: language === "BM"
        ? [["Item", "Nama Kategori Pelepasan Borang BE / Butiran", "Perbelanjaan Diisytiharkan", "Had Maksimum", "Dituntut (Dihadkan)", "Nota Status"]]
        : [["Item", "Form BE Relief Category Name / Details", "Declared Spent", "Max Limit", "Claimed (Capped)", "Status Note"]],
      body: reliefRows,
      ...formBePartGThemeStyles,
      columnStyles: {
        0: { cellWidth: 10, fontStyle: "bold", textColor: [9, 36, 74] },
        1: { cellWidth: 60, fontStyle: "bold" },
        2: { cellWidth: 22 }, 
        3: { cellWidth: 20 },
        4: { cellWidth: 22, fontStyle: "bold", textColor: [0, 168, 132] },
        5: { cellWidth: 46 }
      }
    } as any);

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // G. RECEIPT EVIDENCE ATTACHMENT SUMMARY
    doc.setTextColor(9, 36, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      language === "BM" ? "RINGKASAN LAMPIRAN BUKTI RESIT" : "RECEIPT EVIDENCE ATTACHMENT SUMMARY", 
      15, 
      currentY
    );
    doc.line(15, currentY + 2, 195, currentY + 2);
    currentY += 5;

    if (receipts.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(115, 115, 115);
      doc.setFontSize(8.5);
      doc.text(
        language === "BM" ? "Tiada resit disimpan lagi." : "No saved receipts yet.", 
        15, 
        currentY + 4
      );
      currentY += 10;
    } else {
      const receiptsBody = receipts.map((r, index) => {
        const itemCode = r.formBEItem || (() => {
          switch (r.category) {
            case ClaimCategory.Lifestyle: return "G9";
            case ClaimCategory.Sports: return "G10";
            case ClaimCategory.Education: return "G5";
            case ClaimCategory.Medical: return "G6/G7";
            case ClaimCategory.Insurance: return "G17/G19";
            default: return "Other";
          }
        })();
        return [
          `${index + 1}`,
          r.merchant,
          r.date || "N/A",
          `RM${r.amount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          itemCode,
          r.claimStatus,
          r.notes || "-"
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: 15, right: 15 },
        head: language === "BM"
          ? [["No.", "Peniaga", "Tarikh", "Jumlah", "Item BE", "Status", "Nota"]]
          : [["No.", "Merchant", "Date", "Amount", "BE Item", "Status", "Notes"]],
        headStyles: { fillColor: [9, 36, 74], fontStyle: "bold" },
        body: receiptsBody,
        theme: "striped",
        styles: { fontSize: 7, cellPadding: 1.4, font: "helvetica" },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 42 },
          2: { cellWidth: 20 },
          3: { cellWidth: 22, fontStyle: "bold" },
          4: { cellWidth: 18, fontStyle: "bold", textColor: [0, 168, 132] },
          5: { cellWidth: 20, fontStyle: "bold" },
          6: { cellWidth: 50 }
        }
      } as any);
      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // H. NEEDS REVIEW BEFORE FILING
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(9, 36, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      language === "BM" ? "PERLU SEMAKAN SEBELUM MEMFAILKAN" : "NEEDS REVIEW BEFORE FILING", 
      15, 
      currentY
    );
    doc.line(15, currentY + 2, 195, currentY + 2);
    currentY += 5;

    if (checkAgainReceipts.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(115, 115, 115);
      doc.setFontSize(8.5);
      doc.text(
        language === "BM" 
          ? "Tiada resit ditandakan Perlu Semak pada masa ini." 
          : "No receipts currently marked as Needs Review.", 
        15, 
        currentY + 4
      );
      currentY += 10;
    } else {
      const checkAgainBody = checkAgainReceipts.map((r, index) => [
        `${index + 1}`,
        r.merchant,
        r.date || "N/A",
        `RM${r.amount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        r.category,
        r.notes || (language === "BM" ? "Sila semak kelayakan dan pengesahan sebelum memfailkan." : "Please check eligibility and verification before filing.")
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: 15, right: 15 },
        head: language === "BM"
          ? [["No.", "Peniaga", "Tarikh", "Jumlah", "Kategori", "Nota Semakan Belum Selesai"]]
          : [["No.", "Merchant", "Date", "Amount", "Category", "Unresolved Review Notes"]],
        body: checkAgainBody,
        theme: "striped",
        styles: { fontSize: 7, cellPadding: 1.2, font: "helvetica" },
        headStyles: { fillColor: [245, 158, 11], fontStyle: "bold" }, // Amber header
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20 },
          3: { cellWidth: 22, fontStyle: "bold" },
          4: { cellWidth: 25 },
          5: { cellWidth: 65, textColor: [180, 83, 9] }
        }
      } as any);
      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // I. NOT INCLUDED / EXCLUDED RECEIPTS
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(9, 36, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      language === "BM" ? "ITEM TIDAK DISERTAKAN / DIKECUALIKAN" : "NOT INCLUDED / EXCLUDED ITEMS", 
      15, 
      currentY
    );
    doc.line(15, currentY + 2, 195, currentY + 2);
    currentY += 5;

    if (nonClaimableReceipts.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(115, 115, 115);
      doc.setFontSize(8.5);
      doc.text(
        language === "BM" ? "Tiada item dikecualikan pada masa ini." : "No receipts currently excluded.", 
        15, 
        currentY + 4
      );
      currentY += 10;
    } else {
      const nonEligibleBody = nonClaimableReceipts.map((r, index) => [
        `${index + 1}`,
        r.merchant,
        r.date || "N/A",
        `RM${r.amount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        r.category,
        r.notes || (language === "BM" ? "Resit dikecualikan daripada draf kelayakan" : "Receipt excluded from draft eligibility")
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: 15, right: 15 },
        head: language === "BM"
          ? [["No.", "Peniaga", "Tarikh", "Jumlah", "Kategori", "Sebab Dikecualikan / Nota"]]
          : [["No.", "Merchant", "Date", "Amount", "Category", "Excluded Reason / Notes"]],
        body: nonEligibleBody,
        theme: "striped",
        styles: { fontSize: 7, cellPadding: 1.2, font: "helvetica" },
        headStyles: { fillColor: [120, 120, 120], fontStyle: "bold" }, // Grey header
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20 },
          3: { cellWidth: 22, fontStyle: "bold" },
          4: { cellWidth: 25 },
          5: { cellWidth: 65 }
        }
      } as any);
      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // J. RECORD KEEPING COMPLIANCE REMINDER
    const reminderTitle = language === "BM" ? "PERINGATAN PENYIMPANAN 7 TAHUN" : "7-YEAR RECORD KEEPING REMINDER";
    const reminderDesc = language === "BM"
      ? "Simpan resit, helaian kerja, dan dokumen sokongan selama tujuh (7) tahun untuk tujuan rujukan atau pemeriksaan audit pada masa hadapan."
      : "Keep receipts, working sheets, and supporting documents for seven (7) years for future reference or audit inspection.";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    const wrappedDescLines: string[] = doc.splitTextToSize(reminderDesc, 174);

    const boxHeight = 11 + (wrappedDescLines.length * 4);

    if (currentY > (280 - boxHeight)) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(245, 246, 248);
    doc.setDrawColor(200, 202, 205);
    doc.setLineWidth(0.3);
    doc.rect(15, currentY, 180, boxHeight, "FD");

    doc.setTextColor(9, 36, 74);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(reminderTitle, 18, currentY + 5);

    doc.setTextColor(80, 90, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);

    let textY = currentY + 10;
    wrappedDescLines.forEach((line: string) => {
      doc.text(line, 18, textY);
      textY += 4;
    });

    // Apply Page Numbers, dynamic titles and header lines across all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Decent Header line decoration
      doc.setDrawColor(220, 224, 228);
      doc.setLineWidth(0.3);
      doc.line(15, 10, 195, 10);

      doc.setTextColor(130, 140, 150);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(
        language === "BM" 
          ? "TAX5 - HELAIAN PANDUAN PERSEDIAAN RINGKASAN UNTUK e-FILING BORANG BE LHDN" 
          : "TAX5 - SUMMARY PREPARATION GUIDE SHEET FOR LHDN FORM BE e-FILING", 
        15, 
        8
      );

      // Decent Footer line decoration
      doc.line(15, 282, 195, 282);

      doc.text(
        language === "BM" ? "Dijana oleh Tax5" : "Generated by Tax5", 
        15, 
        286
      );
      doc.text(
        language === "BM" 
          ? "Kelayakan akhir mesti disahkan dengan LHDN/MyTax." 
          : "Final eligibility must be verified with LHDN/MyTax.", 
        60, 
        286
      );
      doc.text(
        language === "BM" ? `Halaman ${i} daripada ${totalPages}` : `Page ${i} of ${totalPages}`, 
        180, 
        286
      );

      doc.text(
        language === "BM"
          ? "Sumber rujukan: Maklumat pelepasan cukai dirujuk daripada Nota Penerangan HASiL/LHDN Borang BE 2025"
          : "Source reference: Tax relief details are sourced from HASiL/LHDN Form BE 2025 Explanatory Notes",
        15,
        290
      );
    }

    // Output and save
    doc.save(
      language === "BM"
        ? "Tax5_Draf_Ringkasan_Gaya_Borang_BE_YA2026.pdf"
        : "Tax5_Form_BE_Style_Draft_Summary_YA2026.pdf"
    );
  };

  if (activeView === "employment") {
    return (
      <div className="flex-1 flex flex-col p-4 bg-[#F5FAF7] space-y-4 pb-32 relative overflow-x-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-[-5%] left-[-15%] w-[250px] h-[250px] rounded-full bg-[#E5F5EF] blur-[85px] opacity-75 pointer-events-none z-0"></div>
        <div className="absolute bottom-[8%] right-[-10%] w-[220px] h-[220px] rounded-full bg-[#FFFBE3] blur-[75px] opacity-65 pointer-events-none z-0"></div>

        {/* Header */}
        <div className="flex items-center gap-2 pb-1 border-b border-neutral-100 z-10 relative">
          <button
            onClick={() => setActiveView("summary")}
            className="w-7 h-7 bg-white border border-neutral-200/55 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-500" />
          </button>
          <div>
            <h2 className="text-xl font-bold font-heading text-navy">
              {language === "BM" ? "Butiran Pendapatan Penggajian" : "Employment Income Details"}
            </h2>
            <p className="text-xs text-neutral-500 font-semibold leading-tight mt-0.5">
              {language === "BM" ? "Butiran EA atau EC tahunan" : "yearly EA or EC details"}
            </p>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-[#FFFDF0] border border-[#FFF1C2]/30 rounded-2xl p-4.5 shadow-3xs space-y-2 text-left z-10 relative">
          <p className="text-[11.5px] text-[#5C450B] font-bold leading-relaxed">
            {language === "BM"
              ? "Masukkan butiran EA atau EC tahunan anda untuk mendapatkan anggaran draf cukai yang lebih tepat. Maklumat ini adalah 100% pilihan, dan anda tidak perlu memuat naik sebarang dokumen kecuali untuk rujukan sendiri."
              : "Add your yearly EA or EC details to receive more precise tax draft calculations. Entering these details is 100% optional, and you don't need to upload any documents unless you wish to for your own reference."}
          </p>
        </div>

        {/* List of current Employers */}
        {employers.length > 0 && (
          <div className="bg-white border border-neutral-200/50 rounded-2xl p-4 shadow-3xs z-10 relative space-y-3.5 text-left animate-fadeIn">
            <h3 className="font-extrabold text-[#0B2545] text-[11px] block font-heading uppercase tracking-wider">
              {language === "BM" ? `Majikan Ditambah Sedia Ada (${employers.length})` : `Currently Added Employers (${employers.length})`}
            </h3>
            <div className="space-y-2 max-h-[180px] overflow-y-auto no-scrollbar">
              {employers.map((emp) => (
                <div key={emp.id} className="p-3 border border-neutral-200/55 rounded-xl bg-neutral-50/50 flex justify-between items-center text-xs">
                  <div className="truncate pr-4">
                    <span className="font-black text-navy text-[11.5px] block truncate">{emp.name}</span>
                    <span className="text-[10px] text-neutral-500 font-semibold space-x-1 block">
                      <span>{emp.docType ? (emp.docType === "EA form" ? (language === "BM" ? "Borang EA" : "EA Form") : (language === "BM" ? "Borang EC" : "EC Form")) : (language === "BM" ? "Borang EA" : "EA Form")}</span>
                      <span>•</span>
                      <span>{language === "BM" ? "Pendapatan Tahunan" : "Annual Income"}: RM {emp.income.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      <span>•</span>
                      <span>{language === "BM" ? "PCB Dibayar" : "PCB Paid"}: RM {emp.mtd.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </span>
                    {emp.attachedFile && (
                      <span className="text-[9px] text-[#00A884] font-bold block mt-1">
                        {language === "BM" ? `📎 Rujukan dilampirkan: ${emp.attachedFile}` : `📎 Attached reference: ${emp.attachedFile}`}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteEmployer(emp.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-white transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Form section */}
        <div className="bg-white border border-neutral-200/55 rounded-2xl p-5 shadow-3xs z-10 relative text-left space-y-4">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <h3 className="font-extrabold text-navy text-xs font-heading uppercase tracking-wider">
              {language === "BM" ? "Masukkan Butiran Pendapatan EA / EC" : "Enter EA / EC Income Details"}
            </h3>
            {currentUser?.isDemo && (
              <button
                type="button"
                onClick={handleLoadDemoDetails}
                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-300 text-amber-700 rounded-lg text-[9.5px] font-black cursor-pointer transition-all shadow-2xs flex items-center gap-1 shrink-0"
              >
                {language === "BM" ? "Gunakan maklumat demo EA/EC" : "Use demo EA/EC information"}
              </button>
            )}
          </div>

          <form onSubmit={handleSaveEmployer} className="space-y-4">
            {/* Document Type Selector Fields */}
            <div className="space-y-1.5">
              <label className="block font-bold text-neutral-400 text-[10px] uppercase">{language === "BM" ? "Jenis Dokumen" : "Document Type"}</label>
              <div className="flex gap-2">
                {(["EA form", "EC form"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewEmpDocType(type)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      newEmpDocType === type
                        ? "bg-[#0B2545] text-white border-[#0B2545] font-black"
                        : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                    }`}
                  >
                    {type === "EA form" ? (language === "BM" ? "Borang EA (Sektor Swasta)" : "EA Form (Private Sector)") : (language === "BM" ? "Borang EC (Sektor Awam)" : "EC Form (Public Sector)")}
                  </button>
                ))}
              </div>
            </div>

            {/* Employer Name */}
            <div>
              <label className="block font-bold text-neutral-450 text-[10px] uppercase mb-1">
                {language === "BM" ? "Nama Majikan / Syarikat" : "Employer / Company Name"}
              </label>
              <input
                type="text"
                required
                placeholder={language === "BM" ? "cth. Acme Corporation Sdn Bhd" : "e.g. Acme Corporation Sdn Bhd"}
                className="w-full h-9.5 px-3 bg-neutral-50 border border-neutral-250 rounded-xl text-xs font-bold text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-brand/35 transition-all"
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
              />
            </div>

            {/* Employment Period Field */}
            <div>
              <label className="block font-bold text-neutral-450 text-[10px] uppercase mb-1">{language === "BM" ? "Tempoh Pekerjaan" : "Employment Period"}</label>
              <input
                type="text"
                required
                placeholder={language === "BM" ? "cth. 01/01/2026 - 31/12/2026" : "e.g. 01/01/2026 - 31/12/2026"}
                className="w-full h-9.5 px-3 bg-neutral-50 border border-neutral-250 rounded-xl text-xs font-bold text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-brand/35 transition-all"
                value={newEmpPeriod}
                onChange={(e) => setNewEmpPeriod(e.target.value)}
              />
            </div>

            {/* Annual Income & MTD / PCB Paid side-by-side */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-neutral-450 text-[10px] uppercase mb-1">{language === "BM" ? "Pendapatan Tahunan (RM)" : "Annual Income (RM)"}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full h-9.5 px-3 bg-neutral-50 border border-neutral-250 rounded-xl text-xs font-semibold text-neutral-700 font-mono outline-none focus:bg-white focus:ring-1 focus:ring-teal-brand/35 transition-all"
                  value={newEmpIncome}
                  onChange={(e) => setNewEmpIncome(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-450 text-[10px] uppercase mb-1">
                  {language === "BM" ? "PCB Dibayar (RM)" : "PCB Paid (RM)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full h-9.5 px-3 bg-neutral-50 border border-neutral-250 rounded-xl text-xs font-semibold text-neutral-700 font-mono outline-none focus:bg-white focus:ring-1 focus:ring-teal-brand/35 transition-all"
                  value={newEmpMtd}
                  onChange={(e) => setNewEmpMtd(e.target.value)}
                />
              </div>
            </div>

            {/* EPF & SOCSO side-by-side */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-neutral-450 text-[10px] uppercase mb-1">{language === "BM" ? "Caruman KWSP (RM)" : "EPF Contribution (RM)"}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={language === "BM" ? "0.00 (Pilihan)" : "0.00 (Optional)"}
                  className="w-full h-9.5 px-3 bg-neutral-50 border border-neutral-250 rounded-xl text-xs font-semibold text-neutral-700 font-mono outline-none focus:bg-white focus:ring-1 focus:ring-teal-brand/35 transition-all"
                  value={newEmpEpf}
                  onChange={(e) => setNewEmpEpf(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-450 text-[10px] uppercase mb-1">{language === "BM" ? "Caruman PERKESO (RM)" : "SOCSO Contribution (RM)"}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={language === "BM" ? "0.00 (Pilihan)" : "0.00 (Optional)"}
                  className="w-full h-9.5 px-3 bg-neutral-50 border border-neutral-250 rounded-xl text-xs font-semibold text-neutral-700 font-mono outline-none focus:bg-white focus:ring-1 focus:ring-teal-brand/35 transition-all"
                  value={newEmpSocso}
                  onChange={(e) => setNewEmpSocso(e.target.value)}
                />
              </div>
            </div>

            {/* EIS & Tax Borne by Employer side-by-side */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block font-bold text-neutral-450 text-[10px] uppercase mb-1">{language === "BM" ? "Caruman SIP (RM)" : "EIS Contribution (RM)"}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={language === "BM" ? "0.00 (Pilihan)" : "0.00 (Optional)"}
                  className="w-full h-9.5 px-3 bg-[#f5f5f5] bg-neutral-50 border border-neutral-250 rounded-xl text-xs font-semibold text-neutral-700 font-mono outline-none focus:bg-white focus:ring-1 focus:ring-teal-brand/35 transition-all"
                  value={newEmpEis}
                  onChange={(e) => setNewEmpEis(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-450 text-[10px] uppercase mb-1">
                  {language === "BM" ? "Cukai Ditanggung oleh Majikan" : "Tax Borne By Employer"}
                </label>
                <div className="flex gap-1">
                  {(["Yes", "No", "Not sure"] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setNewEmpTaxBorne(choice)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        newEmpTaxBorne === choice
                          ? "bg-[#09244A] text-white border-[#09244A]"
                          : "bg-white text-[#526070] border-neutral-250 hover:bg-neutral-50"
                      }`}
                    >
                      {choice === "Yes" ? (language === "BM" ? "Ya" : "Yes") : choice === "No" ? (language === "BM" ? "Tidak" : "No") : (language === "BM" ? "Tidak Pasti" : "Not sure")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional upload/attach ref only container */}
            <div className="p-3.5 bg-neutral-50 border-2 border-dashed border-neutral-250 rounded-xl text-center space-y-1.5 relative hover:border-teal-brand/35 transition-all">
              <span className="block text-[11px] font-semibold text-neutral-600">
                {language === "BM" ? "Pilihan: Lampirkan Borang EA/EC PDF/Imej untuk Rujukan" : "Optional: Attach EA/EC Form PDF/Image for Reference"}
              </span>
              <p className="text-[9.5px] text-neutral-400 font-semibold leading-none">
                {language === "BM" ? "Fail disimpan secara tempatan sahaja untuk rujukan semakan. Had saiz 10MB." : "File is stored locally only to assist your review process. Size limit 10MB."}
              </p>
              
              <div className="pt-1 select-none">
                {attachedFile ? (
                  <div className="bg-[#EAFDF5] border border-teal-500/10 p-1.5 px-3 rounded-lg flex items-center justify-between text-[11px] font-bold text-[#009170] mx-auto max-w-[280px]">
                    <span className="truncate pr-2">{language === "BM" ? "📎 Dilampirkan: " : "📎 Attached: "}{attachedFile}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="text-[9.5px] font-black text-red-500 hover:underline cursor-pointer"
                    >
                      {language === "BM" ? "Padam" : "Remove"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const names = ["EA_Acme_Form_2026.pdf", "EC_Draft_Summary.jpeg", "MyTAX_EA26_Statement.pdf"];
                      setAttachedFile(names[Math.floor(Math.random() * names.length)]);
                    }}
                    className="py-1 px-3 bg-white hover:bg-neutral-50 border border-neutral-250 text-[#09244A] rounded-lg text-[10px] font-black cursor-pointer shadow-5xs active:scale-[0.98] transition-all"
                  >
                    {language === "BM" ? "Pilih fail rujukan..." : "Select reference file..."}
                  </button>
                )}
              </div>
            </div>

            {/* Form actions: Save / Clear */}
            <div className="flex gap-2.5 pt-2.5 border-t border-neutral-100 font-sans">
              <button
                type="submit"
                className="flex-1 py-2 bg-teal-brand hover:bg-[#009473] text-white text-[11px] font-black rounded-xl cursor-pointer text-center shadow-3xs"
              >
                {language === "BM" ? "Simpan Rekod Majikan" : "Save Employer Record"}
              </button>
            </div>
          </form>
        </div>

        {/* Done Button */}
        <button
          onClick={() => setActiveView("summary")}
          className="w-full py-2.5 bg-[#0B2545] hover:bg-[#081C35] text-white font-black text-[11.5px] rounded-xl cursor-pointer shadow-3xs transition-all text-center z-10 relative"
        >
          {language === "BM" ? "Semak dan Kembali ke Ringkasan Cukai" : "Check and Return to Tax Summary"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 bg-[#F5FAF7] space-y-4 pb-32 relative overflow-x-hidden">
      {/* Soft circular low-opacity decorative gradient background blobs */}
      <div className="absolute top-[-5%] left-[-15%] w-[250px] h-[250px] rounded-full bg-[#E5F5EF] blur-[85px] opacity-75 pointer-events-none z-0"></div>
      <div className="absolute bottom-[8%] right-[-10%] w-[220px] h-[220px] rounded-full bg-[#FFFBE3] blur-[75px] opacity-65 pointer-events-none z-0"></div>

        {/* Top Standard Header */}
        <div className="flex items-center justify-between pb-1 border-b border-neutral-100 z-10 relative">
          <div className="flex items-center gap-1.5 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold font-heading text-navy">{language === "BM" ? "Ringkasan Cukai" : "Tax Summary"}</h2>
              <p className="text-xs text-neutral-500 font-semibold leading-tight mt-0.5">{language === "BM" ? "Draf Ringkasan gaya Borang BE" : "Form BE-style Draft Summary"}</p>
            </div>
          </div>
        </div>

      {/* 1. Top Summary Action Card */}
      <div className="bg-white border border-neutral-200/55 rounded-2xl p-5 shadow-3xs space-y-4 z-10 relative animate-fadeIn">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider block">
              {language === "BM" ? "Jumlah tuntutan dianggarkan" : "Estimated claim total"}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-baseline gap-0.5">
                <span className="text-xs font-bold text-navy font-mono">RM</span>
                <span className="text-2xl font-black text-navy tracking-tight font-mono">
                  {totalCappedClaim.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 bg-[#EAFDF5] text-[#166534] border border-[#BBF7D0]/30 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,168,132,0.01)] select-none whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shrink-0"></span>
                <span>{language === "BM" ? "Boleh Dituntut" : "Claimable"}</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider block">
              {language === "BM" ? "Resit disimpan" : "Saved receipts"}
            </span>
            <div className="flex items-center justify-end gap-1 mt-1 text-navy font-extrabold text-lg">
              <FileCheck className="w-4 h-4 text-teal-brand shrink-0" />
              <span>{receipts.length}</span>
            </div>
          </div>
        </div>

        {/* Setup status sub-card */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#F5FAF7] border border-[#00A884]/10 rounded-xl">
          <span className="text-[11.5px] font-bold text-[#5F6B7A]">
            {language === "BM" ? "Status Tetapan" : "Setup Status"}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
            isSetupComplete 
              ? "bg-[#EAFDF5] text-[#00A884] border border-[#00A884]/20" 
              : "bg-[#FFF8E8] text-[#D97706] border border-amber-500/15"
          }`}>
            {isSetupComplete ? (language === "BM" ? "Tetapan Selesai" : "Setup Complete") : (language === "BM" ? "Tetapan Belum Selesai" : "Setup Incomplete")}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 pb-0.5">
          {/* Main action: View Draft Guide (Allowed for everyone) */}
          <button
            type="button"
            onClick={handleViewDraftGuide}
            className="w-full h-10 bg-teal-brand hover:bg-[#009473] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
            <span>
              {language === "BM" ? "Lihat Panduan Draf" : "View Draft Guide"}
            </span>
          </button>

          {/* Secondary Actions Grid: Receipt download and PDF Doc download */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadAllReceiptImages}
              className="h-9 px-2 rounded-xl text-[9.5px] font-black tracking-wide border border-neutral-250 bg-white text-[#09244A] hover:bg-neutral-50 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
            >
              <span>
                {language === "BM" ? "Muat Turun Resit" : "Download Receipts"}
              </span>
            </button>
            <button
              onClick={handleDownloadDraft}
              className={`h-9 px-2 rounded-xl text-[9px] font-black tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                simulatedPlan === "Free Demo"
                  ? "bg-amber-50/20 hover:bg-amber-50/40 text-[#713F12]/80 border-amber-300/35"
                  : "bg-[#09244A] text-white hover:bg-[#061730] border-transparent"
              }`}
            >
              {simulatedPlan === "Free Demo" ? (
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-700/60 shrink-0" />
                  <span>
                    {language === "BM" ? "Muat Turun Draf PDF" : "Download PDF Draft"}
                  </span>
                  <span className="bg-[#FEF6E0] text-[#78350F] border border-[#FDE68A]/80 text-[8px] font-black px-1.2 py-0.5 rounded uppercase shrink-0">
                    PRO
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0 animate-pulse" />
                  <span>
                    {language === "BM" ? "Muat Turun Draf PDF" : "Download PDF Draft"}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Joint Assessment Info Reminder for Together under my spouse’s name */}
      {smartSetup?.maritalStatus === "Married" && smartSetup?.spouseAssessmentChoice === "Together under my spouse's name" && (
        <div className="p-3.5 bg-[#EBF7F5] border border-[#00A884]/20 rounded-2xl flex items-start gap-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10 relative animate-fadeIn">
          <FileCheck className="w-5 h-5 text-teal-brand flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[12px] font-extrabold text-[#052e16] font-sans">{language === "BM" ? "Eksport untuk Fail Pasangan" : "Export for Spouse's Filing"}</h4>
            <p className="text-[11px] text-[#526070] font-semibold leading-relaxed">
              {language === "BM" ? "Pasangan anda adalah pemfail utama. Tax5 akan menyimpan rekod anda di sini supaya anda boleh mengeksportnya untuk pemfailan pasangan anda." : "Your spouse is the main filer. Tax5 will keep your records here so you can export them for your spouse’s filing."}
            </p>
          </div>
        </div>
      )}

      {/* Joint Assessment Info Reminder for Together under my name */}
      {smartSetup?.maritalStatus === "Married" && smartSetup?.spouseAssessmentChoice === "Together under my name" && (
        <div className="p-3.5 bg-[#FAF8F5] border border-[#D97706]/20 rounded-2xl flex items-start gap-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10 relative animate-fadeIn">
          <Info className="w-5 h-5 text-[#D97706]/85 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[12px] font-extrabold text-[#A16207] font-sans">{language === "BM" ? "Pendapatan pasangan diperlukan" : "Spouse income needed"}</h4>
            <p className="text-[11px] text-[#526070] font-semibold leading-relaxed">
              {language === "BM" ? "Sebab anda memilih taksiran bersama di bawah nama anda, tambah jumlah pendapatan pasangan anda sebelum menyediakan ringkasan cukai akhir anda." : "Because you chose joint assessment under your name, add your spouse’s total income before preparing your final tax summary."}
            </p>
          </div>
        </div>
      )}

      {/* Joint Assessment Info Reminder for My spouse has no income */}
      {smartSetup?.maritalStatus === "Married" && smartSetup?.spouseAssessmentChoice === "My spouse has no income" && (
        <div className="p-3.5 bg-[#EBF7F5] border border-[#00A884]/20 rounded-2xl flex items-start gap-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] z-10 relative animate-fadeIn">
          <FileCheck className="w-5 h-5 text-teal-brand flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[12px] font-extrabold text-[#001D11] font-sans">{language === "BM" ? "Layak pelepasan pasangan" : "Spouse relief eligible"}</h4>
            <p className="text-[11px] text-[#526070] font-semibold leading-relaxed">
              {language === "BM" ? "Memandangkan pasangan anda tiada pendapatan, anda layak menuntut Pelepasan Pasangan sehingga RM4,000 pada draf Borang BE anda. Simpan dokumen perkahwinan sebagai bukti." : "Because your spouse has no income, you are eligible to claim a Spouse Relief of up to RM 4,000 on your Form BE draft. Keep marriage documents as proof."}
            </p>
          </div>
        </div>
      )}

      {/* 2. Soft & Compact Category Progressive Tracker Block */}
      <div className="space-y-3 bg-white rounded-2xl border border-neutral-200/50 p-4.5 shadow-3xs z-10 relative animate-fadeIn">
        <h3 className="font-extrabold text-[11px] text-navy uppercase tracking-wider flex items-center gap-1.5 pb-0.5">
          <TrendingUp className="w-4 h-4 text-teal-brand" />
          <span>{language === "BM" ? "Pecahan Kategori Tuntutan" : "Claim Categories Breakdown"}</span>
        </h3>

        <div className="space-y-3 pt-0.5">
          {(() => {
            const commonCategories = [
              ClaimCategory.Lifestyle,
              ClaimCategory.Medical,
              ClaimCategory.Education
            ];

            // Prioritize:
            // 1) Claim amount above RM0
            // 2) Commonly used categories (Lifestyle, Medical, Education)
            // 3) Rest
            const orderedCategories = Object.values(ClaimCategory).sort((a, b) => {
              const spentA = categoryTotals[a] || 0;
              const spentB = categoryTotals[b] || 0;

              // Priority 1: spent amount above RM0
              if (spentA > 0 && spentB === 0) return -1;
              if (spentB > 0 && spentA === 0) return 1;
              if (spentA > 0 && spentB > 0) {
                return spentB - spentA; // Higher amounts first
              }

              // Priority 2: commonly used categories
              const idxCommonA = commonCategories.indexOf(a);
              const idxCommonB = commonCategories.indexOf(b);
              if (idxCommonA !== -1 && idxCommonB === -1) return -1;
              if (idxCommonB !== -1 && idxCommonA === -1) return 1;
              if (idxCommonA !== -1 && idxCommonB !== -1) {
                return idxCommonA - idxCommonB;
              }

              return 0;
            });

            return orderedCategories
              .slice(0, isAllCategoriesExpanded ? 6 : 3)
              .map((cat) => {
                const limit = CATEGORY_LIMITS[cat].limit;
                const spent = categoryTotals[cat];
                const isCapped = spent > limit;
                const percentageValue = Math.min((spent / limit) * 100, 100);

                return (
                  <div key={cat} className="space-y-1.5 animate-fadeIn">
                    {/* Text and figures */}
                    <div className="flex justify-between items-start text-xs leading-none">
                      <div>
                        <span className="font-extrabold text-navy text-[11px] block">{language === "BM" ? (cat === "Lifestyle" ? "Gaya Hidup" : cat === "Medical" ? "Perubatan" : cat === "Education" ? "Pendidikan" : cat === "Sports" ? "Sukan" : cat === "Insurance" ? "Insurans" : "Lain-lain") : cat}</span>
                        <span className="text-[9px] text-neutral-450 font-sans block max-w-[170px] leading-tight mt-0.5">
                          {language === "BM" ? CATEGORY_LIMITS[cat].descriptionBM || CATEGORY_LIMITS[cat].description : CATEGORY_LIMITS[cat].description}
                        </span>
                      </div>
                      
                      <div className="text-right leading-none">
                        <div className="font-bold text-navy text-[11px] font-mono">
                          RM{spent.toFixed(2)} {language === "BM" ? "daripada" : "of"} <span className="text-neutral-450 font-medium font-sans">RM{limit.toLocaleString("en-US")}</span>
                        </div>
                        {isCapped && (
                          <span className="inline-block px-1 py-0.5 bg-amber-50 text-amber-700 rounded text-[7.5px] font-bold mt-1 leading-none shadow-3xs">
                            {language === "BM" ? "HAD MAKSIMUM DICAPAI" : "CAPPED AT LIMIT"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar matching color styling rules */}
                    <div className="h-2 w-full bg-[#EAF7F4] rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCapped ? "bg-amber-brand" : "bg-[#4FAE91]"
                        }`}
                        style={{ width: `${percentageValue}%` }}
                      ></div>
                    </div>
                  </div>
                );
              });
          })()}
        </div>

        {/* View all categories toggle button */}
        <button
          type="button"
          onClick={() => setIsAllCategoriesExpanded(!isAllCategoriesExpanded)}
          className="w-full py-2.5 mt-2 bg-neutral-50 hover:bg-neutral-100/60 border border-neutral-200/50 rounded-xl text-[10px] font-bold text-neutral-500 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
        >
          <span>{isAllCategoriesExpanded ? (language === "BM" ? "Tunjukkan Kurang" : "Show Less") : (language === "BM" ? "Lihat Semua Kategori" : "View All Categories")}</span>
          {isAllCategoriesExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </button>
      </div>

      {/* 3. EA Form & Multiple Employment Setup Block */}
      <div className="bg-[#F5F8FC]/50 border border-[#DEE5ED] rounded-[22px] p-4.5 shadow-3xs z-10 relative space-y-4 transition-all duration-300">
        <div className="flex justify-between items-center bg-[#EBF1F7] -mx-4.5 -mt-4.5 px-4.5 py-3.5 border-b border-[#DEE5ED]/80 rounded-t-[21px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8.5 h-8.5 rounded-xl bg-[#FAF8F5] flex items-center justify-center text-amber-600 shrink-0 border border-amber-500/10 shadow-3xs">
              <FileCheck className="w-4.5 h-4.5 stroke-[2]" />
            </div>
            <div className="min-w-0 text-left">
              <h3 className="font-extrabold text-[12.5px] text-[#0B2545] font-heading tracking-tight">
                {language === "BM" ? "Butiran Pendapatan Penggajian" : "Employment Income Details"}
              </h3>
              <p className="text-[10px] text-neutral-500 font-semibold mt-0.5 leading-normal">
                {language === "BM" ? "Urus borang penggajian tahunan anda (EA / EC)" : "Manage your yearly employment forms (EA / EC)"}
              </p>
            </div>
          </div>
        </div>

        {employers.length === 0 ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-[#FFFDF0] border border-[#FFF1C2]/45 rounded-xl text-left leading-normal animate-fadeIn">
              <p className="text-[11.5px] text-[#5C450B] font-bold">
                {language === "BM" ? "Butiran pendapatan penggajian belum ditambah lagi. Tambah jumlah EA/EC apabila anda menerima borang penggajian tahunan anda untuk anggaran cukai yang lebih jelas." : "Employment income details not added yet. Add EA/EC totals when you receive your yearly employment form for a clearer tax estimate."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView("employment")}
                className="flex-1 py-2 px-3 bg-[#0B2545] hover:bg-[#031427] text-white text-[11px] font-black rounded-xl transition-all cursor-pointer shadow-3xs text-center"
              >
                {language === "BM" ? "Tambah Pendapatan Penggajian" : "Add Employment Income"}
              </button>
              <button
                onClick={executeDownload}
                className="flex-1 py-2 px-3 bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-250 text-[11px] font-extrabold rounded-xl transition-all cursor-pointer text-center"
              >
                {language === "BM" ? "Muat Turun Draf Resit Sahaja" : "Only Download Receipt Draft"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-[#EAF7F4] p-3 rounded-xl flex justify-between items-center text-[11px] text-[#001D11]">
              <div>
                <span className="font-extrabold block text-left">{language === "BM" ? "Jumlah Borang EA Ditambah:" : "EA Form Totals Added:"}</span>
                <span className="text-[9.5px] text-neutral-500 font-semibold block text-left">
                  {employers.length} {language === "BM" ? "rekod pekerjaan" : (employers.length === 1 ? "employment record" : "employment records")}
                </span>
              </div>
              <div className="text-right">
                <span className="font-extrabold block font-mono text-xs">
                  RM {totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9.5px] text-[#00A884] font-black leading-none block">
                  {language === "BM" ? "Jumlah PCB" : "Total MTD"}: RM {totalMtd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[150px] overflow-y-auto no-scrollbar">
              {employers.map((emp) => (
                <div key={emp.id} className="p-2 border border-neutral-200/50 rounded-xl bg-neutral-50/55 flex justify-between items-center text-xs">
                  <div className="truncate pr-4 text-left">
                    <span className="font-extrabold text-navy text-[11px] block truncate">{emp.name}</span>
                    <span className="text-[9px] text-neutral-500 font-medium">{language === "BM" ? "Pendapatan" : "Income"}: RM {emp.income.toLocaleString()} • {language === "BM" ? "Dokumen" : "Doc"}: {emp.docType ? (emp.docType === "EA form" ? (language === "BM" ? "Borang EA" : "EA form") : (language === "BM" ? "Borang EC" : "EC form")) : (language === "BM" ? "Borang EA" : "EA form")}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteEmployer(emp.id)}
                    className="p-1 text-neutral-400 hover:text-red-500/90 rounded-lg cursor-pointer hover:bg-white transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveView("employment")}
              className="w-full py-2 bg-neutral-100 hover:bg-neutral-200/80 text-navy font-bold text-[11px] rounded-xl cursor-pointer text-center transition-all"
            >
              {language === "BM" ? "Urus Butiran Pendapatan Penggajian" : "Manage Employment Income Details"}
            </button>
          </div>
        )}
      </div>

      {/* Reusable bottom sections component containing Needs Review, Not Included, Form BE Draft Filing Guide, Disclaimer, and Back to Home */}
      <TaxSummaryBottomSections
        checkAgainReceipts={checkAgainReceipts}
        nonClaimableReceipts={nonClaimableReceipts}
        isBEGuideExpanded={isBEGuideExpanded}
        setIsBEGuideExpanded={setIsBEGuideExpanded}
        smartSetup={smartSetup}
        totalIncome={totalIncome}
        numEmployments={employers.length === 0 ? "No records" : employers.length === 1 ? "1" : employers.length === 2 ? "2" : "3 or more"}
        totalMtd={totalMtd}
        showSspnReminder={showSspnReminder}
        onBackToHome={onBackToHome}
        receipts={receipts}
        categoryTotals={categoryTotals}
        cappedCategoryTotals={cappedCategoryTotals}
        totalCappedClaim={totalCappedClaim}
        employersLength={employers.length}
      />
    </div>
  );
};

interface TaxSummaryBottomSectionsProps {
  checkAgainReceipts: Receipt[];
  nonClaimableReceipts: Receipt[];
  isBEGuideExpanded: boolean;
  setIsBEGuideExpanded: (expanded: boolean) => void;
  smartSetup: SmartSetupData | null;
  totalIncome: number;
  numEmployments: string | number;
  totalMtd: number;
  showSspnReminder: boolean;
  onBackToHome: () => void;
  receipts: Receipt[];
  categoryTotals: Record<ClaimCategory, number>;
  cappedCategoryTotals: Record<ClaimCategory, number>;
  totalCappedClaim: number;
  employersLength: number;
}

const TaxSummaryBottomSections: React.FC<TaxSummaryBottomSectionsProps> = ({
  checkAgainReceipts,
  nonClaimableReceipts,
  isBEGuideExpanded,
  setIsBEGuideExpanded,
  smartSetup,
  totalIncome,
  numEmployments,
  totalMtd,
  showSspnReminder,
  onBackToHome,
  receipts,
  categoryTotals,
  cappedCategoryTotals,
  totalCappedClaim,
  employersLength,
}) => {
  const [showAllReliefs, setShowAllReliefs] = React.useState(false);
  const { language } = useLanguage();

  // SSPN claim calculation
  const sspnReceiptAmount = receipts
    ? receipts
        .filter(r => r.claimStatus === ClaimStatus.Claimable && (r.formBEItem === "G13" || (r.tax5DisplayName || "").toLowerCase().includes("sspn") || (r.notes || "").toLowerCase().includes("sspn") || (r.merchant || "").toLowerCase().includes("sspn")))
        .reduce((sum, r) => sum + r.amount, 0)
    : 0;
  const sspnCapped = Math.min(sspnReceiptAmount, 8000);

  const epfVal = smartSetup?.epfAmount && !isNaN(parseFloat(smartSetup.epfAmount)) ? parseFloat(smartSetup.epfAmount) : 0;
  const epfCapped = Math.min(epfVal, 4000);

  const checkedContributions = smartSetup?.availableContributions || [];
  const hasSocso = checkedContributions.includes("SOCSO / PERKESO");
  const hasEis = checkedContributions.includes("EIS / SIP");
  const socsoVal = hasSocso && smartSetup?.socsoAmount && !isNaN(parseFloat(smartSetup.socsoAmount)) ? parseFloat(smartSetup.socsoAmount) : 0;
  const eisVal = hasEis && smartSetup?.eisAmount && !isNaN(parseFloat(smartSetup.eisAmount)) ? parseFloat(smartSetup.eisAmount) : 0;
  const totalG20 = Math.min(socsoVal + eisVal, 350); // Capped at G20 maximum limit of RM350

  const hasSpouseRelief = smartSetup?.maritalStatus === "Married" && smartSetup?.spouseAssessmentChoice === "My spouse has no income";
  const spouseReliefAmount = hasSpouseRelief ? 4000 : 0;

  const totalReliefVal = 9000 + totalCappedClaim + epfCapped + totalG20 + sspnCapped + spouseReliefAmount;

  const hasIncomeDetails = employersLength > 0 || (!!smartSetup?.annualEmploymentIncome && parseFloat(smartSetup.annualEmploymentIncome) > 0);
  const chargeableIncome = hasIncomeDetails ? Math.max(0, totalIncome - totalReliefVal) : 0;

  // LHDN YA 2025 Tax Bracket Calculator
  let estimatedTax = 0;
  if (hasIncomeDetails && chargeableIncome > 5000) {
    if (chargeableIncome <= 20000) {
      estimatedTax = (chargeableIncome - 5000) * 0.01;
    } else if (chargeableIncome <= 35000) {
      estimatedTax = 150 + (chargeableIncome - 20000) * 0.03;
    } else if (chargeableIncome <= 50000) {
      estimatedTax = 600 + (chargeableIncome - 35000) * 0.06;
    } else if (chargeableIncome <= 70000) {
      estimatedTax = 1500 + (chargeableIncome - 50000) * 0.11;
    } else if (chargeableIncome <= 100000) {
      estimatedTax = 3700 + (chargeableIncome - 70000) * 0.19;
    } else if (chargeableIncome <= 400000) {
      estimatedTax = 9400 + (chargeableIncome - 100000) * 0.25;
    } else {
      estimatedTax = 84400 + (chargeableIncome - 400000) * 0.26;
    }
  }

  // Individual rebate RM400 for chargeable income <= RM35,000
  if (hasIncomeDetails && chargeableIncome <= 35000 && chargeableIncome > 0) {
    estimatedTax = Math.max(0, estimatedTax - 400);
  }

  const netDiff = hasIncomeDetails ? estimatedTax - totalMtd : 0;

  return (
    <div className="space-y-4">
      {/* SEPARATE SECTION 1: Needs review receipts (Check Again) */}
      <div className="bg-[#FFFDF4] border border-[#F2DEB4] rounded-[22px] p-4.5 shadow-3xs z-10 relative space-y-3 animate-fadeIn transition-all duration-300">
        <div className="flex items-center gap-3 bg-[#FAF2DF] -mx-4.5 -mt-4.5 px-4.5 py-3.5 border-b border-[#F4E3C1]/50 rounded-t-[21px]">
          <div className="w-8.5 h-8.5 rounded-xl bg-[#FFF9E6] flex items-center justify-center text-amber-600 shrink-0 border border-[#F1D89A]/45 shadow-3xs">
            <AlertCircle className="w-4.5 h-4.5 stroke-[2]" />
          </div>
          <div className="min-w-0 text-left">
            <h3 className="font-extrabold text-[12.5px] text-[#9A5B00] font-heading tracking-tight">
              {language === "BM" ? "Memerlukan Semakan Sebelum Pemfailan" : "Needs Review Before Filing"}
            </h3>
            <p className="text-[10px] text-[#344054] font-semibold mt-0.5 leading-normal">
              {language === "BM" ? "Resit-resit ini mungkin memerlukan pemeriksaan lanjut sebelum anda memasukkannya." : "These receipts may need more checking before you include them."}
            </p>
          </div>
        </div>

        {checkAgainReceipts.length === 0 && !(smartSetup?.maritalStatus === "Married" && smartSetup?.spouseAssessmentChoice === "Not sure yet") ? (
          <p className="text-[11px] text-neutral-500 font-semibold text-center py-2.5 font-sans">
            {language === "BM" ? "Tiada item yang memerlukan semakan. Semuanya teratur!" : "No items need review. Everything is streamlined!"}
          </p>
        ) : (
          <div className="space-y-2">
            {smartSetup?.maritalStatus === "Married" && smartSetup?.spouseAssessmentChoice === "Not sure yet" && (
              <div className="p-3 bg-[#FFFDF2] border border-[#EAD5A8]/55 rounded-xl space-y-1 text-left animate-fadeIn">
                <span className="text-[9.5px] uppercase font-extrabold text-[#9A5B00] block font-sans">
                  {language === "BM" ? "Status Taksiran: Memerlukan Semakan" : "Assessment Status: Needs Review"}
                </span>
                <p className="text-[11px] text-[#344054] font-semibold leading-relaxed font-sans">
                  {language === "BM" ? "Anda memilih \"Kurang pasti lagi\" untuk pilihan taksiran di bawah tetapan. Sila sahkan sama ada anda memfailkan secara berasingan atau bersama." : "You selected \"Not sure yet\" for assessment choice under setup. Please confirm whether you are filing separately or jointly."}
                </p>
              </div>
            )}
            {checkAgainReceipts.length > 0 && (
              <>
                <p className="text-[10.5px] text-[#344054] font-semibold bg-[#FFFDF4] p-2.5 rounded-xl border border-[#EAD5A8]/45 leading-normal font-sans text-left">
                  {language === "BM" ? "Beberapa item memerlukan semakan sebelum pemfailan. Ketik resit di bawah Rekod Cukai untuk mengedit atau menjelaskan." : "Some items need checking before filing. Tap a receipt under Tax Records to edit or clarify."}
                </p>
                {checkAgainReceipts.map((r) => (
                  <div key={r.id} className="flex justify-between items-center gap-2 p-3 bg-white hover:bg-[#FCF8EC]/40 border border-[#F3E1B9]/25 rounded-xl leading-none transition-colors">
                    <div className="min-w-0 flex-1 text-left">
                      <span className="font-extrabold text-navy block text-[11.5px] truncate">{r.merchant}</span>
                      <span className="text-[9.5px] text-[#4F5B66] font-semibold mt-0.5 block truncate">{r.category}</span>
                    </div>
                    <div className="text-right font-mono font-black text-[#9A5B00] text-[11.5px] shrink-0">
                      RM {r.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* SEPARATE SECTION 2: Non-claimable receipts (Not Included) */}
      <div className="bg-[#FCFCFC] border border-[#EBEBEB] rounded-[22px] p-4.5 shadow-3xs z-10 relative space-y-3 animate-fadeIn opacity-95 transition-all duration-300">
        <div className="flex items-center gap-3 bg-[#F4F4F4] -mx-4.5 -mt-4.5 px-4.5 py-3.5 border-b border-neutral-200/50 rounded-t-[21px]">
          <div className="w-8.5 h-8.5 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-450 shrink-0 border border-neutral-200 shadow-3xs">
            <Ban className="w-4.5 h-4.5 stroke-[2]" />
          </div>
          <div className="min-w-0 text-left">
            <h3 className="font-extrabold text-[12.5px] text-neutral-500 font-heading tracking-tight">
              {language === "BM" ? "Tidak Disertakan" : "Not Included"}
            </h3>
            <p className="text-[10px] text-neutral-450 font-semibold mt-0.5 leading-normal">
              {language === "BM" ? "Resit disimpan yang tidak dikira dalam jumlah tuntutan anda." : "Saved receipts that are not counted in your claim total."}
            </p>
          </div>
        </div>

        {nonClaimableReceipts.length === 0 ? (
          <p className="text-[11px] text-neutral-400 font-semibold text-center py-2.5 font-sans">
            {language === "BM" ? "Tiada resit dalam blok ini." : "No receipts in this block."}
          </p>
        ) : (
          <div className="space-y-2">
            {nonClaimableReceipts.map((r) => (
              <div key={r.id} className="flex justify-between items-center gap-2 p-3 bg-white hover:bg-neutral-50 border border-neutral-200/50 rounded-xl leading-none transition-colors">
                <div className="min-w-0 flex-1 text-left">
                  <span className="font-bold text-neutral-500 block text-[11.5px] truncate">{r.merchant}</span>
                  <span className="text-[9.5px] text-neutral-400 font-semibold mt-0.5 block truncate">{r.category}</span>
                </div>
                <div className="text-right font-mono font-semibold text-[#8E8E8E] text-[11.5px] shrink-0">
                  RM {r.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form BE official mapping block */}
      <div className="bg-white rounded-[1.5rem] border border-neutral-200/65 overflow-hidden shadow-3xs z-10 relative transition-all duration-300">
        <button
          onClick={() => setIsBEGuideExpanded(!isBEGuideExpanded)}
          className={`w-full text-left p-4 flex justify-between items-center transition-colors cursor-pointer ${
            isBEGuideExpanded ? "bg-[#09244A] text-white" : "bg-white text-navy hover:bg-neutral-50"
          }`}
        >
          <div>
            <h3 className={`font-extrabold text-[12px] uppercase tracking-wider ${isBEGuideExpanded ? "text-[#4FAE91]" : "text-navy"}`}>
              {language === "BM" ? "Panduan Pemfailan Draf Borang BE" : "Form BE Draft Filing Guide"}
            </h3>
            <p className={`text-[10px] mt-0.5 leading-normal text-left ${isBEGuideExpanded ? "text-neutral-300 font-medium" : "text-neutral-500 font-semibold"}`}>
              {language === "BM" ? "Ketik untuk melihat tag pemfailan salin-tampal" : "Tap to view copy-paste filing tags"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck className={`w-4 h-4 shrink-0 ${isBEGuideExpanded ? "text-[#4FAE91]" : "text-neutral-450"}`} />
            {isBEGuideExpanded ? (
              <ChevronUp className={`w-4 h-4 ${isBEGuideExpanded ? "text-neutral-300" : "text-neutral-400"}`} />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            )}
          </div>
        </button>

        {isBEGuideExpanded && (
          <div className="p-4 space-y-4 border-t border-neutral-100 bg-[#FAFBFB] animate-slideDown max-w-full overflow-x-hidden">
            {/* Section A: Personal Particulars */}
            <div className="space-y-2.5 text-left font-sans">
              <span className="text-[9px] font-black text-[#0B2545] uppercase tracking-widest block border-b border-neutral-100 pb-1">
                {language === "BM" ? "Seksyen A: Maklumat Peribadi" : "Section A: Personal Particulars"}
              </span>
              
              <div className="space-y-2">
                {/* A6: Type of Assessment */}
                <div className="bg-white border border-neutral-200/50 rounded-xl p-3 shadow-3xs flex flex-col gap-2 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 bg-[#0B2545] text-white rounded font-mono text-[9px] font-extrabold shrink-0 select-none">
                        A6
                      </span>
                      <span className="text-[11px] font-bold text-[#0B2545] text-wrap">
                        {language === "BM" ? "Jenis taksiran" : "Type of assessment"}
                      </span>
                    </div>
                    {(() => {
                      const choiceText = (() => {
                        if (!smartSetup) return "Needs review";
                        
                        // Check if Not Sure or unknown
                        if (
                          smartSetup.maritalStatus === "Not sure" || 
                          smartSetup.maritalStatusA4 === "Not sure yet" || 
                          smartSetup.spouseAssessmentChoice === "Not sure yet" ||
                          smartSetup.assessmentTypeA6 === "unknown"
                        ) {
                          return "Needs review";
                        }

                        // Married (spouse = Yes)
                        if (smartSetup.maritalStatus === "Married") {
                          const a6 = smartSetup.assessmentTypeA6;
                          if (a6 === "1") return "Joint assessment in husband’s name";
                          if (a6 === "2") return "Joint assessment in wife’s name";
                          if (a6 === "3") return "Separate assessment";
                          if (a6 === "4") return "Spouse has no income / no source / tax-exempt income";
                          
                          // Fallbacks based on spouseAssessmentChoice
                          const choice = smartSetup.spouseAssessmentChoice;
                          if (choice === "Together under my name") {
                            if (smartSetup.gender === "Male") return "Joint assessment in husband’s name";
                            if (smartSetup.gender === "Female") return "Joint assessment in wife’s name";
                            return "Joint assessment in husband’s name";
                          }
                          if (choice === "Together under my spouse's name") {
                            if (smartSetup.gender === "Male") return "Joint assessment in wife’s name";
                            if (smartSetup.gender === "Female") return "Joint assessment in husband’s name";
                            return "Joint assessment in wife’s name";
                          }
                          if (choice === "My spouse has no income") return "Spouse has no income / no source / tax-exempt income";
                          if (choice === "Separately" || choice === "Separately from my spouse" || a6 === "3") return "Separate assessment";
                          
                          return "Needs review";
                        }

                        // Not Married (spouse = No)
                        const statusA4 = smartSetup.maritalStatusA4;
                        const status = smartSetup.maritalStatus;

                        if (status === "Single" || statusA4 === "Single") {
                          return "Self only: single";
                        }
                        if (status === "Divorced" || statusA4 === "Divorcee") {
                          return "Self only: divorcee";
                        }
                        if (status === "Widowed" || statusA4 === "Widow / Widower") {
                          return "Self only: widow / widower";
                        }

                        return "Needs review";
                      })();
                      const isReady = choiceText !== "Needs review";
                      const getLocalizedChoiceText = (text: string) => {
                        if (language !== "BM") return text;
                        switch (text) {
                          case "Needs review": return "Memerlukan semakan";
                          case "Joint assessment in husband’s name": return "Taksiran bersama atas nama suami";
                          case "Joint assessment in wife’s name": return "Taksiran bersama atas nama isteri";
                          case "Separate assessment": return "Taksiran berasingan";
                          case "Spouse has no income / no source / tax-exempt income": return "Pasangan tiada punca pendapatan / pendapatan dikecualikan cukai";
                          case "Self only: single": return "Diri sendiri: bujang";
                          case "Self only: divorcee": return "Diri sendiri: duda/janda";
                          case "Self only: widow / widower": return "Diri sendiri: balu / duda";
                          default: return text;
                        }
                      };
                      return (
                        <div className="shrink-0 text-right">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full select-none whitespace-nowrap border ${
                            isReady 
                              ? "text-[#00A884] bg-[#EAF7F4] border-[#00A884]/15" 
                              : "text-[#D97706] bg-[#FFF8E8] border-[#D97706]/15"
                          }`}>
                            {getLocalizedChoiceText(choiceText)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <p className="text-[9.5px] text-[#6B7280] leading-normal font-medium text-wrap">
                    {language === "BM" ? "Pilihan pemfailan berdasarkan tetapan anda" : "Filing choice based on your setup"}
                  </p>
                </div>
              </div>
            </div>

            {/* Section B: Income & Deductions */}
            <div className="space-y-2.5 text-left font-sans">
              <span className="text-[9px] font-black text-[#0B2545] uppercase tracking-widest block border-b border-neutral-100 pb-1">
                {language === "BM" ? "Seksyen B: Pendapatan Berkanun & Cukai Kena Dibayar" : "Section B: Statutory Income & Tax Payable"}
              </span>
              
              <div className="space-y-2">
                {/* B1: Annual employment income */}
                <div className="bg-white border border-neutral-200/50 rounded-xl p-3 shadow-3xs flex flex-col gap-2 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 bg-[#0B2545] text-white rounded font-mono text-[9px] font-extrabold shrink-0 select-none">
                        B1
                      </span>
                      <span className="text-[11px] font-bold text-[#0B2545] text-wrap">
                        {language === "BM" ? "Pendapatan daripada penggajian" : "Income from employment"}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[11.5px] font-black font-mono ${hasIncomeDetails ? "text-[#00A884]" : "text-neutral-450"}`}>
                        {hasIncomeDetails 
                          ? `RM ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : (language === "BM" ? "Tidak disediakan" : "Not provided")}
                      </span>
                    </div>
                  </div>
                  <p className="text-[9.5px] text-[#6B7280] leading-normal font-medium text-wrap">
                    {language === "BM" ? "Jumlah pendapatan berkanun tahunan daripada senarai EA" : "Summed statutory annual income total from EA lists"}
                  </p>
                </div>

                {/* B1a: Number of employments */}
                <div className="bg-white border border-neutral-200/50 rounded-xl p-3 shadow-3xs flex flex-col gap-2 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 bg-[#0B2545] text-white rounded font-mono text-[9px] font-extrabold shrink-0 select-none">
                        B1a
                      </span>
                      <span className="text-[11px] font-bold text-[#0B2545] text-wrap">
                        {language === "BM" ? "Bilangan penggajian" : "Number of employments"}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full select-none whitespace-nowrap border ${
                        !hasIncomeDetails || numEmployments === "No records" || numEmployments === 0
                          ? "text-[#D97706] bg-[#FFF8E8] border-[#D97706]/15"
                          : "text-[#00A884] bg-[#EAF7F4] border-[#00A884]/15"
                      }`}>
                        {hasIncomeDetails ? (language === "BM" ? `${numEmployments} rekod` : numEmployments) : (language === "BM" ? "Tiada rekod" : "No records")}
                      </span>
                    </div>
                  </div>
                  <p className="text-[9.5px] text-[#6B7280] leading-normal font-medium text-wrap">
                    {language === "BM" ? "Jumlah majikan dikira daripada senarai EA" : "Total employers count calculated from EA lists"}
                  </p>
                </div>

                {/* B11: Spouse income needed */}
                {smartSetup?.maritalStatus === "Married" && smartSetup?.spouseAssessmentChoice === "Together under my name" && (
                  <div className="bg-[#FFF8E8] border border-amber-500/15 rounded-xl p-3 flex flex-col gap-2 text-left animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-1.5 py-0.5 bg-[#D97706] text-white rounded font-mono text-[9px] font-extrabold shrink-0 select-none">
                          B11
                        </span>
                        <span className="text-[11px] font-bold text-[#A16207] text-wrap">
                          {language === "BM" ? "Pendapatan pasangan diperlukan" : "Spouse income needed"}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9.5px] font-extrabold text-[#D97706] bg-[#FFEFE5] px-2.5 py-0.5 border border-amber-500/15 rounded-full select-none">
                          {language === "BM" ? "Diperlukan" : "Required"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[9.5px] text-[#A16207]/80 leading-normal font-medium text-wrap">
                      {language === "BM" ? "Pendapatan berkanun pasangan diperlukan untuk taksiran bersama" : "Statutory income of spouse is required for joint assessment"}
                    </p>
                  </div>
                )}

                {/* B13: Total Relief */}
                <div className="bg-white border border-neutral-200/50 rounded-xl p-3 shadow-3xs flex flex-col gap-2 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 bg-[#0B2545] text-white rounded font-mono text-[9px] font-extrabold shrink-0 select-none">
                        B13
                      </span>
                      <span className="text-[11px] font-bold text-[#0B2545] text-wrap">
                        {language === "BM" ? "Jumlah pelepasan (daripada Bahagian G / G23)" : "Total relief (from Part G / G23)"}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11.5px] font-black text-[#00A884] font-mono">
                        RM {totalReliefVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <p className="text-[9.5px] text-[#6B7280] leading-normal font-medium text-wrap">
                    {language === "BM" ? "Jumlah pelepasan individu automatik dan simpanan resit boleh dituntut terkumpul" : "Sum of automatic individual relief and accumulated claimable receipts"}
                  </p>
                </div>

                {/* B14: Chargeable income draft estimate */}
                <div className="bg-white border border-neutral-200/50 rounded-xl p-3 shadow-3xs flex flex-col gap-2 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 bg-[#0B2545] text-white rounded font-mono text-[9px] font-extrabold shrink-0 select-none">
                        B14
                      </span>
                      <span className="text-[11px] font-bold text-[#0B2545] text-wrap">
                        {language === "BM" ? "Anggaran draf pendapatan bercukai" : "Chargeable income draft estimate"}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[11.5px] font-black font-mono ${hasIncomeDetails ? "text-[#00A884]" : "text-[#D97706]"}`}>
                        {hasIncomeDetails 
                          ? `RM ${chargeableIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : (language === "BM" ? "Belum dikira" : "Not calculated")}
                      </span>
                    </div>
                  </div>
                  <p className="text-[9.5px] text-[#6B7280] leading-normal font-medium text-wrap">
                    {language === "BM" ? "Pendapatan penggajian berkanun ditolak jumlah pelepasan cukai (min RM0.00)" : "Statutory employment income minus total relief deductions (min RM0.00)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Section BC: Tax Deduction & Tax Payable Preparation */}
            <div className="space-y-2.5 text-left font-sans">
              <span className="text-[9px] font-black text-[#0B2545] uppercase tracking-widest block border-b border-neutral-100 pb-1">
                {language === "BM" ? "Seksyen BC: Potongan Cukai & Penyediaan Cukai Kena Dibayar" : "Section BC: Tax Deduction & Tax Payable Preparation"}
              </span>
              
              <div className="space-y-2">
                {/* B27: PCB / MTD paid */}
                <div className="bg-white border border-neutral-200/50 rounded-xl p-3 shadow-3xs flex flex-col gap-2 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 bg-[#0B2545] text-white rounded font-mono text-[9px] font-extrabold shrink-0 select-none">
                        B27
                      </span>
                      <span className="text-[11px] font-bold text-[#0B2545] text-wrap">
                        {language === "BM" ? "Potongan Cukai (PCB)" : "Tax Deduction (PCB / MTD)"}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[11.5px] font-black font-mono ${hasIncomeDetails ? "text-[#00A884]" : "text-neutral-450"}`}>
                        {hasIncomeDetails 
                          ? `RM ${totalMtd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : (language === "BM" ? "Tidak disediakan" : "Not provided")}
                      </span>
                    </div>
                  </div>
                  <p className="text-[9.5px] text-[#6B7280] leading-normal font-medium text-wrap">
                    {language === "BM" ? "Jumlah potongan cukai bulanan yang telah dipotong daripada senarai EA bagi YA 2025" : "Summed monthly tax already deducted from EA lists for YA 2025"}
                  </p>
                </div>

                {/* B28: Tax payable / repayable estimation status */}
                <div className="bg-white border border-neutral-200/50 rounded-xl p-3 shadow-3xs flex flex-col gap-2 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 bg-[#0B2545] text-white rounded font-mono text-[9px] font-extrabold shrink-0 select-none">
                        B28
                      </span>
                      <span className="text-[11px] font-bold text-[#0B2545] text-wrap">
                        {language === "BM" ? "Anggaran status cukai kena dibayar / bayar balik" : "Tax payable / repayable estimation status"}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      {hasIncomeDetails ? (
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          netDiff < 0 
                            ? "text-[#00A884] bg-[#EAF7F4] border-[#00A884]/15" 
                            : netDiff > 0 
                              ? "text-[#D97706] bg-[#FFF8E8] border-[#D97706]/15"
                              : "text-neutral-500 bg-neutral-50 border-neutral-200/55"
                        }`}>
                          {netDiff < 0 
                            ? `${language === "BM" ? "Anggaran Mulangan Cukai (Bayar Balik)" : "Repayable (Refund) estimate"}: RM ${Math.abs(netDiff).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : netDiff > 0 
                              ? `${language === "BM" ? "Anggaran Baki Cukai Kena Dibayar" : "Estimated Balance Payable"}: RM ${netDiff.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                              : (language === "BM" ? "Baki Sifar (Tiada baki cukai)" : "Zero Balance (No tax due)")}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#D97706] bg-[#FFF8E8] border border-[#D97706]/15 px-2.5 py-0.5 rounded-full">
                          {language === "BM" ? "Belum dikira — tambah butiran penggajian EA/EC terlebih dahulu" : "Not calculated — add EA/EC employment details first"}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[9.5px] text-[#6B7280] leading-normal font-medium text-wrap">
                    {language === "BM" ? "Pengiraan berdasarkan kadar cukai e-Filing standard dan caruman PCB bagi YA 2025" : "Calculation based on standard e-Filing tax rates and MTD contributions for YA 2025"}
                  </p>
                </div>

                {/* Output: Export records for spouse’s filing */}
                {smartSetup?.maritalStatus === "Married" && smartSetup?.spouseAssessmentChoice === "Together under my spouse's name" && (
                  <div className="bg-[#EAF7F4] border border-[#00A884]/15 rounded-xl p-3 flex flex-col gap-2 text-left animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="px-1.5 py-0.5 bg-[#00A884] text-white rounded font-mono text-[9px] font-extrabold shrink-0 select-none">
                          Output
                        </span>
                        <span className="text-[11px] font-bold text-[#00A884] text-wrap font-heading">
                          {language === "BM" ? "Eksport rekod untuk pasangan" : "Export records for spouse"}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-extrabold text-[#000] bg-teal-brand hover:bg-[#009473] px-2.5 py-1 rounded-full select-none cursor-pointer">
                          {language === "BM" ? "Sedia Dieksport" : "Export Ready"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[9.5px] text-[#6B7280] leading-normal font-medium text-wrap">
                      {language === "BM" ? "Muat turun pek bukti pemfailan untuk pasangan anda" : "Download filing proof pack for your spouse"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Section G: Approved Deductions & Reliefs */}
            <div id="section-g-guide" className="space-y-2.5 pt-1 text-left font-sans scroll-mt-6">
              <span className="text-[9px] font-black text-[#0B2545] uppercase tracking-widest block border-b border-neutral-100 pb-1">
                {language === "BM" ? "Seksyen G: Pelepasan & Potongan Cukai" : "Section G: Tax Reliefs & Deductions"}
              </span>

              <div className="space-y-3">
                <p className="text-[9.5px] text-[#6B7280] leading-normal font-medium">
                  {language === "BM" ? "Pelepasan yang kini disertakan dalam draf Tax5 anda." : "Reliefs currently included in your Tax5 draft."}
                </p>

                {(() => {
                  const allReliefLines = [
                    {
                      code: "G1",
                      name: language === "BM" ? "Pelepasan Automatik Individu" : "Individual Automatic Relief",
                      spent: 9000,
                      limit: 9000,
                      claimed: 9000,
                      note: language === "BM" ? "Tuntutan individu pemastautin automatik." : "Automatic resident individual claim.",
                      statusText: "Automatic",
                      isActive: true,
                    },
                    {
                      code: "G5",
                      name: language === "BM" ? "Yuran Pengajian (Diri Sendiri)" : "Education Fees (Self)",
                      spent: categoryTotals[ClaimCategory.Education] || 0,
                      limit: CATEGORY_LIMITS[ClaimCategory.Education].limit,
                      claimed: cappedCategoryTotals[ClaimCategory.Education] || 0,
                      note: language === "BM" ? "Kursus pengajian sendiri dan pengajian peringkat ijazah." : "Self study courses and degrees study.",
                      statusText: receipts.some(r => r.category === ClaimCategory.Education && r.claimStatus === ClaimStatus.CheckAgain)
                        ? "Needs Review"
                        : "From saved receipts",
                      isActive: (cappedCategoryTotals[ClaimCategory.Education] > 0) || (categoryTotals[ClaimCategory.Education] > 0) || receipts.some(r => r.category === ClaimCategory.Education),
                    },
                    ...(smartSetup?.maritalStatus === "Married" ? [{
                      code: "G5 Spouse",
                      name: language === "BM" ? "Pelepasan Pasangan" : "Spouse Relief",
                      spent: hasSpouseRelief ? 4000 : 0,
                      limit: 4000,
                      claimed: hasSpouseRelief ? 4000 : 0,
                      note: hasSpouseRelief 
                        ? (language === "BM" ? "Tuntutan untuk pasangan tanpa punca pendapatan." : "Claim for spouse with no source of income.") 
                        : (smartSetup.spouseAssessmentChoice === "Not sure yet" || smartSetup.spouseAssessmentSituation === "Not sure yet")
                          ? (language === "BM" ? "Pilihan taksiran perkahwinan belum pasti." : "Married assessment choices are uncertain.")
                          : (language === "BM" ? "Sila pilih sama ada taksiran bersama / berasingan." : "Married separate/joint assessment chosen."),
                      statusText: hasSpouseRelief 
                        ? "From profile setup" 
                        : (smartSetup.spouseAssessmentChoice === "Not sure yet" || smartSetup.spouseAssessmentSituation === "Not sure yet")
                          ? "Needs Review"
                          : "Not included",
                      isActive: hasSpouseRelief || (smartSetup.spouseAssessmentChoice === "Not sure yet" || smartSetup.spouseAssessmentSituation === "Not sure yet"),
                    }] : []),
                    {
                      code: "G6/G7",
                      name: language === "BM" ? "Perbelanjaan Perubatan & Kesihatan" : "Medical & Health Expenses",
                      spent: categoryTotals[ClaimCategory.Medical] || 0,
                      limit: CATEGORY_LIMITS[ClaimCategory.Medical].limit,
                      claimed: cappedCategoryTotals[ClaimCategory.Medical] || 0,
                      note: language === "BM" ? "Rawatan perubatan atau imunisasi diri sendiri, pasangan atau anak." : "Self, spouse, child medical or vaccination.",
                      statusText: receipts.some(r => r.category === ClaimCategory.Medical && r.claimStatus === ClaimStatus.CheckAgain)
                        ? "Needs Review"
                        : "From saved receipts",
                      isActive: (cappedCategoryTotals[ClaimCategory.Medical] > 0) || (categoryTotals[ClaimCategory.Medical] > 0) || receipts.some(r => r.category === ClaimCategory.Medical),
                    },
                    {
                      code: "G9",
                      name: language === "BM" ? "Pelepasan Gaya Hidup" : "Lifestyle Deductions",
                      spent: categoryTotals[ClaimCategory.Lifestyle] || 0,
                      limit: CATEGORY_LIMITS[ClaimCategory.Lifestyle].limit,
                      claimed: cappedCategoryTotals[ClaimCategory.Lifestyle] || 0,
                      note: language === "BM" ? "Buku, akhbar, komputer, telefon pintar, internet." : "Books, reading material, tech, internet.",
                      statusText: receipts.some(r => r.category === ClaimCategory.Lifestyle && r.claimStatus === ClaimStatus.CheckAgain)
                        ? "Needs Review"
                        : "From saved receipts",
                      isActive: (cappedCategoryTotals[ClaimCategory.Lifestyle] > 0) || (categoryTotals[ClaimCategory.Lifestyle] > 0) || receipts.some(r => r.category === ClaimCategory.Lifestyle),
                    },
                    {
                      code: "G10",
                      name: language === "BM" ? "Peralatan Sukan & Aktiviti Fizikal" : "Sports & Gymnasium Equipment",
                      spent: categoryTotals[ClaimCategory.Sports] || 0,
                      limit: CATEGORY_LIMITS[ClaimCategory.Sports].limit,
                      claimed: cappedCategoryTotals[ClaimCategory.Sports] || 0,
                      note: language === "BM" ? "Keahlian gim, penyertaan acara sukan dan peralatan sukan." : "Gym fees, sports events, equipment.",
                      statusText: receipts.some(r => r.category === ClaimCategory.Sports && r.claimStatus === ClaimStatus.CheckAgain)
                        ? "Needs Review"
                        : "From saved receipts",
                      isActive: (cappedCategoryTotals[ClaimCategory.Sports] > 0) || (categoryTotals[ClaimCategory.Sports] > 0) || receipts.some(r => r.category === ClaimCategory.Sports),
                    },
                    {
                      code: "G13",
                      name: language === "BM" ? "Tabungan Bersih SSPN" : "SSPN Net Savings",
                      spent: sspnReceiptAmount,
                      limit: 8000,
                      claimed: sspnCapped,
                      note: sspnReceiptAmount > 0 
                        ? (language === "BM" ? "Penyata simpanan bersih simpanan SSPN." : "Net deposit savings statement.") 
                        : (smartSetup?.sspnSavingsChild === "Yes" ? (language === "BM" ? "Penyata simpanan SSPN dijangka tetapi tiada resit dimuat naik lagi." : "SSPN saving statement expected but no receipts uploaded yet.") : (language === "BM" ? "Kurang pasti jika simpanan SSPN berkenaan." : "Unsure if SSPN contribution applies.")),
                      statusText: sspnReceiptAmount > 0 
                        ? (receipts.some(r => (r.formBEItem === "G13" || (r.tax5DisplayName || "").toLowerCase().includes("sspn") || (r.notes || "").toLowerCase().includes("sspn") || (r.merchant || "").toLowerCase().includes("sspn")) && r.claimStatus === ClaimStatus.CheckAgain) ? "Needs Review" : "From saved receipts")
                        : (smartSetup?.sspnSavingsChild === "Yes" || smartSetup?.sspnSavingsChild === "Not sure") ? "Needs Review" : "Not included",
                      isActive: sspnReceiptAmount > 0 || (smartSetup?.sspnSavingsChild === "Yes" || smartSetup?.sspnSavingsChild === "Not sure"),
                    },
                    {
                      code: "G17",
                      name: language === "BM" ? "Caruman KWSP" : "EPF Contributions",
                      spent: epfVal,
                      limit: 4000,
                      claimed: epfCapped,
                      note: language === "BM" ? "Deposit Kumpulan Wang Simpanan Pekerja." : "Employees Provident Fund deposits.",
                      statusText: "From employment details",
                      isActive: epfVal > 0,
                    },
                    {
                      code: "G20",
                      name: language === "BM" ? "Caruman PERKESO & SIP" : "SOCSO & EIS Contributions",
                      spent: socsoVal + eisVal,
                      limit: 350,
                      claimed: totalG20,
                      note: language === "BM" ? "Caruman Pertubuhan Keselamatan Sosial." : "Social security contributions.",
                      statusText: "From employment details",
                      isActive: (socsoVal + eisVal) > 0,
                    },
                    ...(smartSetup?.childrenCount && smartSetup.childrenCount !== "0" && smartSetup.childrenCount !== "Prefer not to say" && smartSetup.childrenCount !== "" ? [{
                      code: "G11-G12",
                      name: language === "BM" ? "Pelepasan Anak (Bawah 18 / Jagaan)" : "Child Relief (Under 18 / Care / Educ)",
                      spent: 0,
                      limit: 8000,
                      claimed: 0,
                      note: smartSetup.childrenCount === "Not sure"
                        ? (language === "BM" ? "Kurang pasti butiran jagaan anak." : "Unsure of child support details.")
                        : (language === "BM" ? "Menuntut pelepasan jagaan anak di MyTax." : "Applied child support relief in MyTax."),
                      statusText: smartSetup.childrenCount === "Not sure" ? "Needs Review" : "From profile setup",
                      isActive: true,
                    }] : []),
                    ...(smartSetup?.supportingParents && smartSetup.supportingParents !== "No" && smartSetup.supportingParents !== "Prefer not to say" && smartSetup.supportingParents !== "" ? [{
                      code: "G6 (Parents)",
                      name: language === "BM" ? "Rawatan Perubatan Ibu Bapa" : "Parents Medical Treatment & Support",
                      spent: 0,
                      limit: 8000,
                      claimed: 0,
                      note: smartSetup.supportingParents === "Not sure"
                        ? (language === "BM" ? "Kurang pasti butiran rawatan perubatan ibu bapa." : "Unsure of parents medical support details.")
                        : (language === "BM" ? "Tuntutan pelepasan rawatan/jagaan ibu bapa digunakan." : "Parents medical/care support relief applied."),
                      statusText: smartSetup.supportingParents === "Not sure" ? "Needs Review" : "From profile setup",
                      isActive: true,
                    }] : []),
                    {
                      code: "Other",
                      name: language === "BM" ? "Resit Tuntutan Lain" : "Other Claim Receipts",
                      spent: categoryTotals[ClaimCategory.Other] || 0,
                      limit: CATEGORY_LIMITS[ClaimCategory.Other].limit,
                      claimed: cappedCategoryTotals[ClaimCategory.Other] || 0,
                      note: language === "BM" ? "Jumlah kecil baki resit tuntutan lain." : "Remaining tax receipts subtotal.",
                      statusText: receipts.some(r => r.category === ClaimCategory.Other && r.claimStatus === ClaimStatus.CheckAgain)
                        ? "Needs Review"
                        : "From saved receipts",
                      isActive: (cappedCategoryTotals[ClaimCategory.Other] > 0) || (categoryTotals[ClaimCategory.Other] > 0) || receipts.some(r => r.category === ClaimCategory.Other),
                    }
                  ];

                  const filteredRows = allReliefLines.filter(row => row.isActive && row.statusText !== "Not included");
                  const unusedRows = allReliefLines.filter(row => !row.isActive || row.statusText === "Not included");

                  const getLocalizedStatusText = (text: string) => {
                    if (language !== "BM") return text;
                    switch (text) {
                      case "Automatic": return "Automatik";
                      case "Needs Review": return "Semak Semula";
                      case "From saved receipts": return "Resit Disimpan";
                      case "From employment details": return "Butiran Pekerjaan";
                      case "From profile setup": return "Tetapan Profil";
                      default: return text;
                    }
                  };

                  return (
                    <div className="space-y-3">
                      {filteredRows.length === 0 ? (
                        <div className="p-4 bg-white border border-neutral-200/50 rounded-xl text-center text-[11px] text-[#6B7280]">
                          {language === "BM" ? "Tiada pelepasan berasaskan resit ditambah lagi." : "No receipt-based reliefs added yet."}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredRows.map((row) => (
                            <div key={row.code} className="bg-white border border-neutral-200/50 rounded-xl p-3 shadow-3xs flex flex-col gap-1.5 text-left transition-all hover:bg-neutral-50/20">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-extrabold shrink-0 select-none ${
                                    row.code === "G1" ? "bg-[#00A884] text-white" : "bg-[#0B2545] text-white"
                                  }`}>
                                    {row.code}
                                  </span>
                                  <span className="text-[11px] font-bold text-[#0B2545] truncate">
                                    {row.name}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className={`text-[11.5px] font-black font-mono ${
                                    row.claimed > 0 ? "text-[#00A884]" : "text-[#D97706]"
                                  }`}>
                                    RM {row.claimed.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between gap-2 text-[9.5px] text-[#6B7280]">
                                <span className="font-semibold truncate max-w-[70%] text-neutral-500">
                                  {row.note} {row.spent > row.limit && <span className="text-amber-600 font-bold">({language === "BM" ? "Had mak: " : "Capped at RM"}{row.limit})</span>}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded-full font-bold select-none text-[8px] tracking-wide uppercase whitespace-nowrap ${
                                  row.statusText === "Automatic"
                                    ? "bg-[#EAF7F4] text-[#00A884] border border-[#00A884]/15"
                                    : row.statusText === "Needs Review"
                                      ? "bg-[#FFF8E8] text-[#D97706] border border-[#D97706]/15"
                                      : row.statusText === "From employment details"
                                        ? "bg-[#EBF3FF] text-[#2563EB] border border-[#2563EB]/15"
                                        : row.statusText === "From profile setup"
                                          ? "bg-[#F3F4F6] text-[#374151] border border-[#374151]/15"
                                          : "bg-neutral-50 text-[#6B7280] border border-neutral-200/55"
                                }`}>
                                  {getLocalizedStatusText(row.statusText)}
                                </span>
                              </div>

                              <div className="text-[8px] text-neutral-400 font-medium italic mt-0.5 border-t border-neutral-100 pt-1 flex items-center gap-1 select-none">
                                <Book className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                                <span>
                                  {language === "BM"
                                    ? `Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025${row.code !== "Other" ? `, Item ${row.code.split(" ")[0]}` : ""}`
                                    : `Source: HASiL/LHDN Form BE 2025 Explanatory Notes${row.code !== "Other" ? `, Item ${row.code.split(" ")[0]}` : ""}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Total line B13 container */}
                      <div className="bg-[#FAFDFD] border border-teal-brand/15 rounded-xl p-3 shadow-3xs flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="px-1.5 py-0.5 bg-[#00A884] text-white rounded font-mono text-[9px] font-extrabold shrink-0 select-none">
                              G23
                            </span>
                            <span className="text-[11px] font-black text-[#0B2545] truncate uppercase tracking-wider">
                              {language === "BM" ? "Jumlah Pelepasan (Jumlah Kecil B13)" : "Total Relief (B13 subtotal)"}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[12px] font-black text-[#00A884] font-mono underline">
                              RM {totalReliefVal.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                        <p className="text-[9px] text-[#6B7280] font-semibold leading-normal">
                          {language === "BM" ? "Jumlah kecil pemfailan dipindahkan secara langsung ke Baris B13 di bawah Bahagian BA." : "Filing subtotal transferred directly to Line B13 under Part BA."}
                        </p>
                      </div>

                      {/* Optional collapsed view link */}
                      <button
                        type="button"
                        onClick={() => setShowAllReliefs(!showAllReliefs)}
                        className="w-full h-9 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-[10px] font-bold text-neutral-500 flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs mt-1"
                      >
                        <span>{showAllReliefs ? (language === "BM" ? "Sembunyikan kategori tidak disertakan" : "Hide categories not included") : (language === "BM" ? "Lihat kategori yang tidak disertakan dalam draf ini" : "View categories not included in this draft")}</span>
                        {showAllReliefs ? (
                          <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </button>

                      {showAllReliefs && (
                        <div className="space-y-3 pt-2 mt-1 border-t border-neutral-100">
                          <div className="p-3 bg-neutral-50/50 border border-neutral-200/20 rounded-xl text-left">
                            <p className="text-[9.5px] text-neutral-500 leading-snug font-medium">
                              {language === "BM" ? "Ini adalah kategori Borang BE yang sah, tetapi tidak disertakan dalam draf semasa anda kerana tiada jumlah atau maklumat profil diisi." : "These are possible Form BE categories, but they are not included in your current draft because no amount or profile condition has been added."}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {unusedRows.map((row) => (
                              <div key={row.code} className="bg-neutral-50/30 border border-neutral-200/40 rounded-xl p-3 flex flex-col gap-1.5 text-left opacity-60">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="px-1.5 py-0.5 bg-neutral-400 text-white rounded font-mono text-[9px] font-black shrink-0 select-none">
                                      {row.code}
                                    </span>
                                    <span className="text-[11px] font-semibold text-neutral-400 truncate">
                                      {row.name}
                                    </span>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-[11px] font-medium text-neutral-400 font-mono">
                                      RM 0.00
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between gap-2 text-[9.5px] text-neutral-400 select-none">
                                  <span className="truncate max-w-[70%] font-medium">
                                    {row.note}
                                  </span>
                                  <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-400 border border-neutral-200/50 rounded-full font-bold text-[8px] tracking-wide uppercase whitespace-nowrap">
                                    {language === "BM" ? "Tidak disertakan" : "Not included"}
                                  </span>
                                </div>

                                <div className="text-[8px] text-neutral-450 italic mt-0.5 border-t border-neutral-100/60 pt-1 flex items-center gap-1 select-none">
                                  <Book className="w-2.5 h-2.5 text-neutral-300 shrink-0" />
                                  <span>
                                    {language === "BM"
                                      ? `Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025${row.code !== "Other" ? `, Item ${row.code.split(" ")[0]}` : ""}`
                                      : `Source: HASiL/LHDN Form BE 2025 Explanatory Notes${row.code !== "Other" ? `, Item ${row.code.split(" ")[0]}` : ""}`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {showSspnReminder && (
              <div className="p-3 bg-[#FFF8E8] border border-amber-500/15 rounded-xl flex items-start gap-2 text-left font-sans shadow-3xs animate-fadeIn">
                <Info className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#A16207] block">
                    {language === "BM" ? "Peringatan Penyata SSPN" : "SSPN Statement Reminder"}
                  </span>
                  <p className="text-[10.5px] text-[#6B7280] leading-normal font-semibold text-wrap">
                    {language === "BM" ? "Sila semak penyata caruman tahunan bersih anda untuk mengesahkan had kelayakan sebenar." : "Check your net annual contributions statement to confirm actual eligibility limit."}
                  </p>
                </div>
              </div>
            )}

            {/* Quick info tip for user */}
            <div className="p-3 bg-white border border-neutral-200/50 rounded-xl flex items-start gap-1.5 shadow-3xs text-left font-sans animate-fadeIn">
              <span className="text-teal-brand shrink-0 select-none text-xs">💡</span>
              <p className="text-[9.5px] text-[#6B7280] leading-normal font-bold text-wrap">
                {language === "BM" ? "Salin nilai-nilai ini terus ke medan yang sepadan di tapak web rasmi MyTax/LHDN untuk memudahkan proses pemfailan anda." : "Copy these values straight into the corresponding fields on the official MyTax/LHDN website to simplify your filing process."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Trust & safety absolute bottom lock message - Friendly & Simple */}
      <div className="text-center w-full pt-2 pb-1 z-10 relative font-sans">
        <p className="text-[9.5px] text-[#4F5B66] font-semibold leading-relaxed flex items-center justify-center gap-1.5 px-4 opacity-95">
          <HelpCircle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>{language === "BM" ? "Panduan penyediaan pra-pemfailan sahaja. Sahkan kelayakan akhir dengan LHDN/MyTax." : "Pre-filing preparation guide only. Verify final eligibility with LHDN/MyTax."}</span>
        </p>
      </div>

      {/* Secondary router buttons */}
      <div className="space-y-2.5 pt-2 z-10 relative">
        <button
          onClick={onBackToHome}
          className="w-full h-11 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-600 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
        >
          <span>{language === "BM" ? "Kembali ke Laman Utama" : "Back to Home"}</span>
        </button>
      </div>

      {/* Spacing element to allow thorough vertical scrolling below the absolute bottom navigation bar across custom heights */}
      <div className="h-14 w-full select-none pointer-events-none"></div>
    </div>
  );
};

export default TaxSummaryView;
