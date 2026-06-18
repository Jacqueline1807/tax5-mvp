import React, { useState } from "react";
import { 
  FileText, 
  Trash2, 
  Edit2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Filter, 
  Plus, 
  Info,
  BadgeAlert,
  Settings,
  Sparkles,
  Search,
  SlidersHorizontal,
  X,
  Download
} from "lucide-react";
import { Logo } from "./Logo";
import { SuggestionInsightsCard } from "./SuggestionInsightsCard";
import { Receipt, ClaimStatus } from "../types";
import { useLanguage } from "../context/LanguageContext";

const downloadReceiptImage = (receipt: Receipt) => {
  if (!receipt.receiptImageDataUrl) return;
  
  const getExtensionFromDataUrl = (dataUrl: string): string => {
    if (dataUrl.startsWith("data:image/png")) return "png";
    if (dataUrl.startsWith("data:image/webp")) return "webp";
    if (dataUrl.startsWith("data:image/gif")) return "gif";
    if (dataUrl.startsWith("data:image/svg+xml")) return "svg";
    return "jpg"; // Default
  };

  const ext = getExtensionFromDataUrl(receipt.receiptImageDataUrl);
  
  const merchantClean = (receipt.merchant || "receipt")
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  let dateStr = receipt.date;
  if (!dateStr) {
    if (receipt.createdAt) {
      dateStr = new Date(receipt.createdAt).toISOString().split('T')[0];
    } else {
      dateStr = "2026-06-17";
    }
  }

  const filename = `${merchantClean}_${dateStr}_receipt.${ext}`;

  try {
    const parts = receipt.receiptImageDataUrl.split(",");
    if (parts.length >= 2) {
      const header = parts[0];
      const mimeMatch = header.match(/data:(.*?);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const binaryStr = atob(parts[1]);
      const len = binaryStr.length;
      const u8arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        u8arr[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([u8arr], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      return;
    }
  } catch (err) {
    console.error("Direct download fallback failed, attempting regular href download", err);
  }

  const link = document.createElement("a");
  link.href = receipt.receiptImageDataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ReceiptImagePreview = ({ 
  src, 
  onOpenViewer, 
  onDownload 
}: { 
  src: string; 
  onOpenViewer: () => void; 
  onDownload: () => void;
}) => {
  const { language } = useLanguage();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-bold text-navy flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>{language === "BM" ? "Imej resit:" : "Receipt image:"}</span>
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="flex items-center gap-1 text-[9px] font-extrabold text-teal-brand hover:text-[#009473] transition-colors uppercase tracking-wider cursor-pointer"
        >
          <Download className="w-3 h-3 shrink-0" />
          <span>{language === "BM" ? "Muat turun imej" : "Download image"}</span>
        </button>
      </div>
      <div 
        className="relative bg-neutral-100 border border-neutral-200 rounded-xl overflow-hidden cursor-pointer group transition-all"
        onClick={onOpenViewer}
      >
        <img 
          src={src} 
          alt="Receipt Proof" 
          referrerPolicy="no-referrer"
          className="w-full max-h-[140px] object-cover block bg-neutral-50 group-hover:scale-[1.01] transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors flex items-center justify-center">
          <div className="bg-black/60 text-white rounded-lg px-2.5 py-1 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <span>{language === "BM" ? "Klik untuk besar & zum" : "Click to expand & zoom"}</span>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/65 text-white rounded-md px-1.5 py-0.5 text-[8px] font-bold">
          {language === "BM" ? "Klik untuk lihat" : "Click to view"}
        </div>
      </div>
    </div>
  );
};

const getCategoryDisplayName = (cat: string, lang: string) => {
  if (lang === "BM") {
    switch (cat) {
      case "Lifestyle": return "Gaya Hidup";
      case "Medical": return "Perubatan";
      case "Education": return "Pendidikan";
      case "Sports": return "Sukan";
      case "Insurance": return "Insurans";
      case "Other": return "Tuntutan Lain";
      default: return cat;
    }
  }
  return cat;
};

interface ReceiptListViewProps {
  receipts: Receipt[];
  onEditReceipt: (id: string) => void;
  onDeleteReceipt: (id: string) => void;
  onNavigateToScan: () => void;
  onNavigateToSetup: () => void;
}

export const ReceiptListView: React.FC<ReceiptListViewProps> = ({
  receipts,
  onEditReceipt,
  onDeleteReceipt,
  onNavigateToScan,
  onNavigateToSetup,
}) => {
  const { language, t } = useLanguage();

  // Filters state
  const [searchMerchant, setSearchMerchant] = useState("");
  const [filterYear, setFilterYear] = useState<string>("All Years");
  const [filterMonth, setFilterMonth] = useState<string>("All Months");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  
  // Image gallery viewer state
  const [activeViewerReceipt, setActiveViewerReceipt] = useState<Receipt | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Tracking expanded states of receipt indices
  const [expandedReceipts, setExpandedReceipts] = useState<Record<string, boolean>>({});

  // Trigger Simple Delete Confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedReceipts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = (id: string) => {
    onDeleteReceipt(id);
    setConfirmDeleteId(null);
  };

  // Filter application
  const filteredReceipts = receipts.filter((receipt) => {
    // 1. Merchant / Search Query filter
    if (searchMerchant.trim() !== "") {
      const query = searchMerchant.toLowerCase();
      const matchMerchant = receipt.merchant.toLowerCase().includes(query);
      const matchNotes = (receipt.notes || "").toLowerCase().includes(query);
      const matchCategory = receipt.category.toLowerCase().includes(query);
      if (!matchMerchant && !matchNotes && !matchCategory) return false;
    }

    // 2. Status filter
    if (filterStatus !== "All") {
      if (receipt.claimStatus !== filterStatus) return false;
    }

    // 3. Year of Assessment filter (parsed from receipt date)
    if (filterYear !== "All Years") {
      const year = new Date(receipt.date).getFullYear();
      const targetYear = filterYear.replace("YA ", "");
      if (year.toString() !== targetYear) return false;
    }

    // 4. Month filter (parsed from receipt date)
    if (filterMonth !== "All Months") {
      const monthIndex = new Date(receipt.date).getMonth();
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      if (monthNames[monthIndex] !== filterMonth) return false;
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col p-5 bg-[#F7F9FA] space-y-4 pb-12 relative overflow-x-hidden">
      {/* Soft circular low-opacity decorative gradient background blobs (Lightest version for Receipts) */}
      <div className="absolute top-[-5%] left-[-15%] w-[250px] h-[250px] rounded-full bg-[#E5F5EF] blur-[95px] opacity-25 pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[220px] h-[220px] rounded-full bg-[#FFFBE3] blur-[85px] opacity-25 pointer-events-none z-0"></div>

      {/* Search and Top Filter Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-navy">
            {language === "BM" ? "Lihat Resit" : "View Receipts"}
          </h2>
          <p className="text-xs text-neutral-500">
            {language === "BM" ? "Semak slip tunai yang telah diimbas." : "Review your scanned cash-in slips."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToScan}
            className="h-9 px-3 bg-teal-brand hover:bg-[#009170] border border-transparent rounded-xl text-xs font-bold text-white flex items-center gap-1 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
            <span>{language === "BM" ? "Tambah" : "Add"}</span>
          </button>
        </div>
      </div>

      {/* Conditional: Empty State */}
      {receipts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-neutral-100 shadow-sm space-y-4 my-4">
          <div className="p-5 bg-teal-brand-light rounded-full border border-teal-brand/10 text-teal-brand">
            <FileText className="w-8 h-8 text-teal-brand stroke-[2]" />
          </div>
          
          <div className="space-y-1.5 max-w-xs">
            <h3 className="font-bold text-navy text-base">
              {language === "BM" ? "Resit anda yang disimpan akan dipaparkan di sini." : "Your saved receipts will appear here."}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
              {language === "BM"
                ? "Imbas atau tambah resit pertama anda untuk melihat jumlah tuntutan anggaran anda dikemas kini dalam masa nyata."
                : "Scan or add your first receipt to see your estimated claim total update in real-time."}
            </p>
          </div>

          <button
            onClick={onNavigateToScan}
            className="px-6 h-11 bg-gradient-to-br from-[#00B896] via-[#00A884] to-[#009170] hover:from-[#00A082] hover:to-[#008062] hover:scale-[1.01] active:scale-[0.99] transition-all text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>{language === "BM" ? "Imbas Resit" : "Scan Receipt"}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Search & Advanced Filters Controller Bar */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={language === "BM" ? "Cari peniaga, nota, kategori..." : "Search merchant, notes, category..."}
                  className="w-full h-9 pl-9 pr-8 bg-white border border-neutral-250 rounded-xl text-xs font-bold text-neutral-700 outline-none focus:ring-1 focus:ring-teal-brand/35 focus:border-teal-brand transition-all"
                  value={searchMerchant}
                  onChange={(e) => setSearchMerchant(e.target.value)}
                />
                {searchMerchant && (
                  <button
                    onClick={() => setSearchMerchant("")}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`h-9 px-3 border rounded-xl flex items-center gap-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                  showFiltersPanel || filterYear !== "All Years" || filterMonth !== "All Months" || filterStatus !== "All"
                    ? "bg-[#EAF7F4] border-[#9AE5D3]/60 text-teal-brand shadow-3xs"
                    : "bg-white border-neutral-250 text-neutral-600 hover:text-navy hover:border-neutral-300"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{language === "BM" ? "Penapis" : "Filters"}</span>
                {(filterYear !== "All Years" || filterMonth !== "All Months" || filterStatus !== "All") && (
                  <span className="w-2 h-2 rounded-full bg-teal-brand"></span>
                )}
              </button>
            </div>

            {/* Collapsible Filter Panel */}
            {(showFiltersPanel || filterYear !== "All Years" || filterMonth !== "All Months" || filterStatus !== "All") && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-3 shadow-3xs text-left animate-slideDown grid grid-cols-3 gap-2 relative">
                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    {language === "BM" ? "Tahun Taksiran" : "Assessment Year"}
                  </label>
                  <select
                    className="w-full h-8 px-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] font-extrabold text-neutral-750 outline-none focus:border-teal-brand focus:bg-white"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="All Years">{language === "BM" ? "Semua Tahun" : "All Years"}</option>
                    <option value="YA 2026">YA 2026</option>
                    <option value="YA 2025">YA 2025</option>
                    <option value="YA 2024">YA 2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    {language === "BM" ? "Bulan Resit" : "Receipt Month"}
                  </label>
                  <select
                    className="w-full h-8 px-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] font-extrabold text-neutral-750 outline-none focus:border-teal-brand focus:bg-white"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    <option value="All Months">{language === "BM" ? "Semua Bulan" : "All Months"}</option>
                    {[
                      { en: "January", bm: "Januari" },
                      { en: "February", bm: "Februari" },
                      { en: "March", bm: "Mac" },
                      { en: "April", bm: "April" },
                      { en: "May", bm: "Mei" },
                      { en: "June", bm: "Jun" },
                      { en: "July", bm: "Julai" },
                      { en: "August", bm: "Ogos" },
                      { en: "September", bm: "September" },
                      { en: "October", bm: "Oktober" },
                      { en: "November", bm: "November" },
                      { en: "December", bm: "Disember" }
                    ].map((m) => (
                      <option key={m.en} value={m.en}>
                        {language === "BM" ? m.bm : m.en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    {language === "BM" ? "Status Tuntutan" : "Claim Status"}
                  </label>
                  <select
                    className="w-full h-8 px-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] font-extrabold text-neutral-750 outline-none focus:border-teal-brand focus:bg-white"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All">{language === "BM" ? "Semua Status" : "All Statuses"}</option>
                    <option value={ClaimStatus.Claimable}>
                      {language === "BM" ? "Boleh Dituntut" : "Claimable"}
                    </option>
                    <option value={ClaimStatus.CheckAgain}>
                      {language === "BM" ? "Semak Semula" : "Needs Review"}
                    </option>
                    <option value={ClaimStatus.NonClaimable}>
                      {language === "BM" ? "Tidak Boleh Dituntut" : "Not-eligible"}
                    </option>
                  </select>
                </div>

                {(filterYear !== "All Years" || filterMonth !== "All Months" || filterStatus !== "All" || searchMerchant !== "") && (
                  <div className="col-span-3 pt-1 border-t border-neutral-100 flex justify-end">
                    <button
                      onClick={() => {
                        setFilterYear("All Years");
                        setFilterMonth("All Months");
                        setFilterStatus("All");
                        setSearchMerchant("");
                      }}
                      className="text-[10px] font-extrabold text-[#EF4444] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {language === "BM" ? "Set Semula Semua Penapis" : "Reset All Filters"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Conditional Empty Filter State */}
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white border border-neutral-200/50 rounded-2xl">
              <BadgeAlert className="w-10 h-10 text-amber-brand mx-auto mb-2" />
              <p className="text-xs text-navy font-bold">
                {language === "BM" ? "Tiada padanan ditemui" : "No match found"}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {language === "BM" ? "Pilih penapis status yang lain" : "Choose another status filter view"}
              </p>
            </div>
          ) : (
            /* Receipts listing stack */
            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5 pb-2">
              {filteredReceipts.map((receipt) => {
                const isExpanded = !!expandedReceipts[receipt.id];
                const isConfirming = confirmDeleteId === receipt.id;

                // Design rules badge assignment matching brand guide
                let badgeStyle = "bg-teal-brand-light text-teal-brand border-teal-brand/10";
                if (receipt.claimStatus === ClaimStatus.CheckAgain) {
                  badgeStyle = "bg-amber-brand-light text-amber-brand border-amber-brand/10";
                } else if (receipt.claimStatus === ClaimStatus.NonClaimable) {
                  badgeStyle = "bg-neutral-100 text-neutral-500 border-neutral-200/60";
                }

                return (
                  <div
                    key={receipt.id}
                    className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-sm hover:shadow-md transition-all flex flex-col space-y-3"
                  >
                    {/* Upper row: Receipt Header */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase font-sans">
                          {getCategoryDisplayName(receipt.category, language)}
                        </span>
                        <h4 className="font-extrabold text-xs text-navy tracking-tight truncate max-w-[200px]">
                          {receipt.merchant}
                        </h4>
                        <p className="text-[10px] text-neutral-400 font-mono font-medium">
                          {new Date(receipt.date).toLocaleDateString(language === "BM" ? "ms-MY" : "en-MY", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Right column: Price Tag */}
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[11px] font-bold text-neutral-400 leading-none font-sans">RM</span>
                        <span className="text-sm font-black text-navy leading-tight">
                          {receipt.amount.toFixed(2)}
                        </span>
                        
                        {/* Compact Claim Status badge */}
                        <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold mt-1 border ${badgeStyle}`}>
                          {receipt.claimStatus === ClaimStatus.Claimable 
                            ? (language === "BM" ? "Boleh Dituntut" : "Claimable")
                            : receipt.claimStatus === ClaimStatus.CheckAgain
                            ? (language === "BM" ? "Semak Semula" : "Needs Review")
                            : (language === "BM" ? "Tidak Layak" : "Not-eligible")}
                        </span>
                      </div>
                    </div>

                    {/* Bottom row action tools */}
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                      {/* Check expandable details prompt text */}
                      <button
                        onClick={() => toggleExpand(receipt.id)}
                        className="flex items-center gap-1 text-neutral-500 hover:text-navy font-semibold cursor-pointer py-1 text-[11px]"
                      >
                        {isExpanded ? (
                          <>
                            <span>{language === "BM" ? "Sembunyikan Butiran" : "Hide Details"}</span>
                            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                          </>
                        ) : (
                          <>
                            <span>{language === "BM" ? "Lihat Butiran" : "Show Details"}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => onEditReceipt(receipt.id)}
                          className="h-8 w-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-navy flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteClick(receipt.id, e)}
                          className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-[#EF4444] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Simple Delete Confirmation Panel overlay inside card */}
                    {isConfirming && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2 animate-scaleIn mt-1.5">
                        <div className="flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-bold text-red-700">
                            {language === "BM" ? "Padam resit ini?" : "Delete this receipt?"}
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 font-bold cursor-pointer"
                          >
                            {language === "BM" ? "Batal" : "Cancel"}
                          </button>
                          <button
                            onClick={() => confirmDelete(receipt.id)}
                            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold cursor-pointer"
                          >
                            {language === "BM" ? "Ya, Padam" : "Yes, Delete"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expandable note detail display area */}
                    {isExpanded && !isConfirming && (
                      <div className="p-3 bg-neutral-50 border border-neutral-150 rounded-xl text-[11px] text-neutral-600 space-y-2.5 animate-slideDown">
                        {receipt.formBEItem && (
                          <SuggestionInsightsCard
                            formBEItem={receipt.formBEItem}
                            claimStatus={receipt.claimStatus}
                            confidence={receipt.confidence}
                            suggestionWhy={receipt.suggestionWhy}
                            suggestionCheck={receipt.suggestionCheck}
                          />
                        )}

                        <div className="space-y-1 mt-1 font-sans text-left">
                          <p className="font-bold text-navy flex items-center gap-1 text-[9px] uppercase tracking-wider">
                            <Info className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span>{language === "BM" ? "Nota & Peringatan Pemfailan:" : "Filing Notes & Reminders:"}</span>
                          </p>
                          <p className="leading-relaxed whitespace-pre-wrap font-sans text-neutral-500">
                            {receipt.notes 
                              ? receipt.notes 
                              : (language === "BM" 
                                  ? "Tiada nota tuntutan tambahan disimpan. Simpan salinan digital ini sebagai bahan bukti jika diaudit LHDN." 
                                  : "No additional claim notes saved. Keep this digital copy as proof in case of LHDN audits.")}
                          </p>
                        </div>

                        {receipt.receiptImageDataUrl && (
                           <div className="pt-2 border-t border-neutral-150">
                            <ReceiptImagePreview 
                              src={receipt.receiptImageDataUrl} 
                              onOpenViewer={() => {
                                setZoomLevel(1);
                                setActiveViewerReceipt(receipt);
                              }}
                              onDownload={() => downloadReceiptImage(receipt)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Contained fullscreen Interactive Image Gallery Viewer Modal */}
      {activeViewerReceipt && (
        <div className="absolute inset-0 bg-neutral-950/95 z-55 flex flex-col justify-between overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-white/10 text-white z-10 bg-gradient-to-b from-black/85 to-transparent">
            <div className="min-w-0 pr-4 text-left">
              <h3 className="font-extrabold text-xs truncate uppercase tracking-widest text-[#00D7AA]">
                {activeViewerReceipt.merchant || (language === "BM" ? "Resit" : "Receipt")}
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                {activeViewerReceipt.date || (language === "BM" ? "Tarikh tidak dinyatakan" : "Date unspecified")}
              </p>
            </div>
            <button 
              onClick={() => setActiveViewerReceipt(null)}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Zoomable Body viewport */}
          <div className="flex-1 relative flex items-center justify-center p-6 overflow-auto bg-neutral-900/90 select-none">
            <div 
              className="transition-transform duration-200 ease-out max-w-full max-h-[50vh]"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img 
                src={activeViewerReceipt.receiptImageDataUrl} 
                alt="Receipt Full Preview" 
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-2xl border border-white/5 bg-neutral-950"
              />
            </div>
          </div>

          {/* Controls & Gallery actions footer */}
          <div className="p-4 flex flex-col gap-3.5 bg-gradient-to-t from-black/90 via-black/45 to-transparent border-t border-white/5 z-10 text-white">
            {/* Zoom Controls */}
            <div className="flex items-center justify-center gap-2 bg-black/40 backdrop-blur-md rounded-full py-1.5 px-3 mx-auto border border-white/5">
              <button 
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-xs font-black transition-all cursor-pointer text-white"
                title="Zoom Out"
              >
                -
              </button>
              <span className="text-[10px] font-mono select-none w-14 text-center text-neutral-300 font-black">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-xs font-black transition-all cursor-pointer text-white"
                title="Zoom In"
              >
                +
              </button>
              {zoomLevel !== 1 && (
                <button 
                  onClick={() => setZoomLevel(1)}
                  className="ml-1.5 text-[9px] font-extrabold uppercase bg-white/15 hover:bg-white/25 text-white/90 px-2 py-0.5 rounded transition-all cursor-pointer"
                >
                  {language === "BM" ? "Set Semula" : "Reset"}
                </button>
              )}
            </div>
            
            {/* Action Group Buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => downloadReceiptImage(activeViewerReceipt!)}
                className="flex-1 h-10 rounded-xl bg-teal-brand text-white font-bold text-xs hover:bg-[#009473] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>{language === "BM" ? "Muat Turun Bukti" : "Download Proof"}</span>
              </button>
              <button 
                onClick={() => setActiveViewerReceipt(null)}
                className="flex-1 h-10 rounded-xl bg-white/10 border border-white/20 text-white font-black text-xs hover:bg-white/15 transition-all text-center cursor-pointer"
              >
                {language === "BM" ? "Tutup Galeri" : "Close Gallery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReceiptListView;
