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
  X
} from "lucide-react";
import { Logo } from "./Logo";
import { SuggestionInsightsCard } from "./SuggestionInsightsCard";
import { Receipt, ClaimStatus } from "../types";

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
  // Filters state
  const [searchMerchant, setSearchMerchant] = useState("");
  const [filterYear, setFilterYear] = useState<string>("All Years");
  const [filterMonth, setFilterMonth] = useState<string>("All Months");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  
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
          <h2 className="text-xl font-bold font-heading text-navy">View Receipts</h2>
          <p className="text-xs text-neutral-500">Review your scanned cash-in slips.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToScan}
            className="h-9 px-3 bg-teal-brand hover:bg-[#009170] border border-transparent rounded-xl text-xs font-bold text-white flex items-center gap-1 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
            <span>Add</span>
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
            <h3 className="font-bold text-navy text-base">Your saved receipts will appear here.</h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
              Scan or add your first receipt to see your estimated claim total update in real-time.
            </p>
          </div>

          <button
            onClick={onNavigateToScan}
            className="px-6 h-11 bg-gradient-to-br from-[#00B896] via-[#00A884] to-[#009170] hover:from-[#00A082] hover:to-[#008062] hover:scale-[1.01] active:scale-[0.99] transition-all text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>Scan Receipt</span>
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
                  placeholder="Search merchant, notes, category..."
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
                <span>Filters</span>
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
                    Assessment Year
                  </label>
                  <select
                    className="w-full h-8 px-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] font-extrabold text-neutral-750 outline-none focus:border-teal-brand focus:bg-white"
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                  >
                    <option value="All Years">All Years</option>
                    <option value="YA 2026">YA 2026</option>
                    <option value="YA 2025">YA 2025</option>
                    <option value="YA 2024">YA 2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Receipt Month
                  </label>
                  <select
                    className="w-full h-8 px-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] font-extrabold text-neutral-750 outline-none focus:border-teal-brand focus:bg-white"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                  >
                    <option value="All Months">All Months</option>
                    {[
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    Claim Status
                  </label>
                  <select
                    className="w-full h-8 px-2 bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] font-extrabold text-neutral-750 outline-none focus:border-teal-brand focus:bg-white"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value={ClaimStatus.Claimable}>Claimable</option>
                    <option value={ClaimStatus.CheckAgain}>Needs Review</option>
                    <option value={ClaimStatus.NonClaimable}>Not-eligible</option>
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
                      Reset All Filters
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
              <p className="text-xs text-navy font-bold">No match found</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Choose another status filter view</p>
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
                          {receipt.category}
                        </span>
                        <h4 className="font-extrabold text-xs text-navy tracking-tight truncate max-w-[200px]">
                          {receipt.merchant}
                        </h4>
                        <p className="text-[10px] text-neutral-400 font-mono font-medium">
                          {new Date(receipt.date).toLocaleDateString("en-MY", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Right column: Price Tag */}
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[11px] font-bold text-neutral-400 leading-none">RM</span>
                        <span className="text-sm font-black text-navy leading-tight">
                          {receipt.amount.toFixed(2)}
                        </span>
                        
                        {/* Compact Claim Status badge */}
                        <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold mt-1 border ${badgeStyle}`}>
                          {receipt.claimStatus}
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
                            <span>Hide Details</span>
                            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
                          </>
                        ) : (
                          <>
                            <span>Show Details</span>
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
                          <p className="text-[11px] font-bold text-red-700">Delete this receipt?</p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => confirmDelete(receipt.id)}
                            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold cursor-pointer"
                          >
                            Yes, Delete
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

                        <div className="space-y-1 mt-1">
                          <p className="font-bold text-navy flex items-center gap-1 text-[9px] uppercase tracking-wider">
                            <Info className="w-3 h-3 text-neutral-400 shrink-0" />
                            <span>Filing Notes & Reminders:</span>
                          </p>
                          <p className="leading-relaxed whitespace-pre-wrap font-sans text-neutral-500">
                            {receipt.notes ? receipt.notes : "No additional claim notes saved. Keep this digital copy as proof in case of LHDN audits."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default ReceiptListView;
