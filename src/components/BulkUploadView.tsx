import React from "react";
import { Camera, Sparkles, AlertCircle, Loader2, Info } from "lucide-react";
import { ClaimCategory, ClaimStatus } from "../types";
import { BulkReceiptQueueItem } from "./AddScanView";
import { SuggestionInsightsCard } from "./SuggestionInsightsCard";

interface BulkUploadViewProps {
  bulkQueue: BulkReceiptQueueItem[];
  editingItemId: string | null;
  isProcessingBulk: boolean;
  bulkError: string | null;
  language: "EN" | "BM";
  isDemo: boolean;
  dropdownOptions: Array<{ id: string; label: string; category: ClaimCategory; helper: string; displayName: string }>;
  setBulkQueue: React.Dispatch<React.SetStateAction<BulkReceiptQueueItem[]>>;
  setEditingItemId: (id: string | null) => void;
  setBulkError: (err: string | null) => void;
  handleSimulateBulkQueue: () => void;
  handleRemoveBulkItem: (id: string) => void;
  handleSaveBulkItem: (item: BulkReceiptQueueItem) => void;
  handleUpdateBulkItemField: (id: string, field: string, value: any) => void;
  handleAddManualDraft: () => void;
  bulkFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleBulkFileInit: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BulkUploadView: React.FC<BulkUploadViewProps> = ({
  bulkQueue,
  editingItemId,
  isProcessingBulk,
  bulkError,
  language,
  isDemo,
  dropdownOptions,
  setBulkQueue,
  setEditingItemId,
  setBulkError,
  handleSimulateBulkQueue,
  handleRemoveBulkItem,
  handleSaveBulkItem,
  handleUpdateBulkItemField,
  handleAddManualDraft,
  bulkFileInputRef,
  handleBulkFileInit,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Beta notice banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <span>Bulk Upload Beta (MVP)</span>
            <span className="bg-amber-500 text-white text-[8px] font-black px-1.2 py-0.2 rounded uppercase tracking-wider">BETA</span>
          </span>
          <p className="text-xs text-amber-700 leading-normal font-sans">
            {language === "BM"
              ? "Muat Naik Pukal Beta hanya menghasilkan draf resit. Sila semak setiap resit sebelum menyimpan."
              : "Bulk Upload Beta creates draft receipts only. Please review each receipt before saving."}
          </p>
        </div>
      </div>

      {/* Error warning */}
      {bulkError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="text-xs font-semibold text-red-600">{bulkError}</span>
        </div>
      )}

      {/* Empty State / Select files area */}
      {bulkQueue.length === 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200/60 flex flex-col items-center justify-center text-center">
          <div className="p-3.5 bg-[#FAFBFB] rounded-full text-teal-brand shadow-xs mb-3.5 border border-neutral-100">
            <Camera className="w-7.5 h-7.5 stroke-[2]" />
          </div>

          <p className="text-sm font-bold text-navy mb-1">{language === "BM" ? "Imbas Berbilang Resit Pukal" : "Bulk Scan Multi Receipts"}</p>
          <p className="text-xs text-neutral-400 mb-5 font-semibold max-w-xs px-2">
            {language === "BM" 
              ? "Pilih sehingga 5 gambar resit sekali gus untuk diekstrak oleh AI secara berturutan!" 
              : "Select up to 5 receipt images at once to be extracted by AI sequentially!"}
          </p>

          <div className="flex flex-col gap-2.5 w-full max-w-[280px]">
            {isDemo && (
              <button
                type="button"
                id="btn-try-bulk-demo"
                onClick={handleSimulateBulkQueue}
                className="w-full h-11 bg-amber-brand/10 hover:bg-amber-brand/20 text-[#B45309] border border-amber-brand/35 font-extrabold rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-pointer transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                <span>{language === "BM" ? "Cuba 3 Fail Demo Pukal" : "Try 3 Bulk Demo Files"}</span>
              </button>
            )}

            <button
              type="button"
              id="btn-choose-bulk-files"
              onClick={() => bulkFileInputRef.current?.click()}
              className="w-full h-10.5 bg-teal-brand hover:bg-[#009170] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>{language === "BM" ? "Pilih Fail Resit Pukal (Maks 5)" : "Select Bulk Receipt Files (Max 5)"}</span>
            </button>

            <button
              type="button"
              id="btn-bulk-manual-add"
              onClick={handleAddManualDraft}
              className="w-full h-10 bg-[#F3FBF8] hover:bg-[#EAF7F4] text-teal-brand border border-teal-500/10 font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs cursor-pointer transition-all"
            >
              <span>+ {language === "BM" ? "Tambah Draf Manual" : "Add Manual Draft"}</span>
            </button>
          </div>

          <input
            ref={bulkFileInputRef as React.RefObject<HTMLInputElement>}
            type="file"
            multiple
            accept="image/*"
            onChange={handleBulkFileInit}
            className="hidden"
          />
        </div>
      )}

      {/* Active Processing Queue Progress */}
      {bulkQueue.length > 0 && (
        <div className="space-y-4">
          
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                <span>{language === "BM" ? "Status Giliran Pukal" : "Bulk Queue Status"}</span>
                <span className="bg-neutral-100 text-neutral-500 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                  {bulkQueue.length} {language === "BM" ? "Resit" : "Receipts"}
                </span>
              </span>

              {!isProcessingBulk && (
                <button
                  type="button"
                  onClick={() => setBulkQueue([])}
                  className="text-[10px] text-neutral-400 hover:text-red-500 font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>{language === "BM" ? "Kosongkan Giliran" : "Clear Queue"}</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-neutral-100">
              {bulkQueue.map((item, index) => {
                let statusLabel = "";
                let statusColor = "";
                if (item.status === "waiting") {
                  statusLabel = language === "BM" ? "Menunggu" : "Waiting";
                  statusColor = "text-neutral-400 bg-neutral-50";
                } else if (item.status === "scanning") {
                  statusLabel = language === "BM" ? "Mengimbas..." : "Scanning";
                  statusColor = "text-teal-brand bg-[#F3FBF8] animate-pulse";
                } else if (item.status === "ready") {
                  statusLabel = language === "BM" ? "Sedia untuk disemak" : "Ready for review";
                  statusColor = "text-[#008064] bg-[#F1FBF9]";
                } else {
                  statusLabel = language === "BM" ? "Gagal, guna Tambah Manual" : "Failed, use Manual Add";
                  statusColor = "text-red-500 bg-red-50";
                }

                return (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-neutral-400 font-mono w-4">{index + 1}.</span>
                      <span className="text-neutral-600 font-bold truncate max-w-[120px] sm:max-w-[180px]">
                        {item.file.name || `Receipt_${index + 1}`}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.8 rounded-full text-[10px] font-bold ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-3">
              <span className="text-[10px] text-neutral-400 font-semibold leading-tight">
                {isProcessingBulk 
                  ? (language === "BM" ? "Sila tunggu seketika semasa AI mengekstrak data resit secara bergilir." : "Please hold on while AI extracts receipt data one by one.")
                  : (language === "BM" ? "Semua resit telah diproses. Semak draf di bawah sebelum menyimpan!" : "All receipts processed. Review drafts below before saving!")}
              </span>
              <button
                type="button"
                onClick={handleAddManualDraft}
                className="text-[11px] text-teal-brand hover:text-teal-bold shrink-0 font-bold border border-teal-brand/10 bg-teal-brand-light/40 px-2.5 py-1 rounded-xl transition-all"
              >
                + {language === "BM" ? "Draf Manual" : "Manual Draft"}
              </button>
            </div>
          </div>

          {/* Draft cards of receipts */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider pl-1">{language === "BM" ? "Draf Resit untuk Semakan" : "Draft Receipts to Review"}</h3>

            {bulkQueue.map((item, index) => {
              const isEditing = editingItemId === item.id;
              const isFailed = item.status === "failed";
              const isScanning = item.status === "scanning";
              const isWaiting = item.status === "waiting";

              if (isWaiting) {
                return (
                  <div key={item.id} className="bg-neutral-50/75 border border-dashed border-neutral-200 rounded-2xl p-4 flex items-center gap-3 animate-fadeIn">
                    <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                      <Camera className="w-5 h-5 opacity-40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-400 truncate">{item.file.name}</p>
                      <p className="text-[10px] text-neutral-400">{language === "BM" ? "Menunggu giliran imbasan..." : "Waiting in queue..."}</p>
                    </div>
                  </div>
                );
              }

              if (isScanning) {
                return (
                  <div key={item.id} className="bg-white border border-teal-brand/20 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center text-center gap-2 animate-fadeIn py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-brand mb-1" />
                    <p className="text-xs font-bold text-navy">{language === "BM" ? "AI Sedang Mengambil Data..." : "AI Reading Receipt Details..."}</p>
                    <p className="text-[10px] text-neutral-400 max-w-[200px] truncate">{item.file.name}</p>
                  </div>
                );
              }

              return (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isFailed 
                      ? "border-red-200 shadow-2xs" 
                      : isEditing 
                        ? "border-teal-brand ring-1 ring-teal-brand/10 shadow-sm" 
                        : "border-neutral-200/60 hover:border-neutral-300 shadow-3xs"
                  }`}
                >
                  <div className="p-4 space-y-3.5">
                    
                    <div className="flex gap-3">
                      {item.previewUrl ? (
                        <img 
                          src={item.previewUrl} 
                          alt="Proof" 
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 object-cover rounded-xl border border-neutral-250 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-neutral-50 border border-neutral-200/60 rounded-xl flex items-center justify-center text-neutral-400 shrink-0">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-navy truncate leading-tight">
                            {item.merchant || (language === "BM" ? "Draf Tanpa Nama" : "Unnamed Draft")}
                          </p>
                          <span className="text-[11px] font-mono font-bold text-navy shrink-0">
                            {item.amount ? `RM ${item.amount}` : "RM --"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9.5px] text-neutral-500 font-semibold font-mono">
                            {item.date || "YYYY-MM-DD"}
                          </span>
                          <span>•</span>
                          <span className="bg-[#FAFBFB] border border-neutral-250 text-neutral-600 px-1.5 py-0.5 rounded text-[9.5px] font-semibold truncate max-w-[110px]">
                            {item.category 
                              ? (language === "BM" 
                                ? (item.category === ClaimCategory.Lifestyle ? "Gaya Hidup" : item.category === ClaimCategory.Medical ? "Perubatan" : item.category === ClaimCategory.Education ? "Pendidikan" : item.category === ClaimCategory.Sports ? "Sukan" : item.category === ClaimCategory.Insurance ? "Insurans" : "Lain-lain")
                                : item.category)
                              : (language === "BM" ? "Tiada Kategori" : "No Category")}
                          </span>
                          {item.claimStatus && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              item.claimStatus === ClaimStatus.Claimable 
                                ? "bg-teal-brand-light text-teal-brand"
                                : item.claimStatus === ClaimStatus.CheckAgain
                                  ? "bg-amber-brand/10 text-[#B45309]"
                                  : "bg-neutral-100 text-neutral-500"
                            }`}>
                              {item.claimStatus === ClaimStatus.Claimable 
                                ? (language === "BM" ? "Sedia Tuntut" : "Claimable")
                                : item.claimStatus === ClaimStatus.CheckAgain
                                  ? (language === "BM" ? "Semak Semula" : "Check")
                                  : (language === "BM" ? "Tidak Layak" : "No-claim")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isFailed && item.confidence && (
                      <div className="bg-[#F3FBF8]/60 border border-teal-500/5 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[10px]">
                        <span className="text-neutral-500 font-medium">{language === "BM" ? "Keyakinan Pengekstrakan AI:" : "AI Extraction Confidence:"}</span>
                        <span className={`font-black uppercase tracking-wider ${
                          item.confidence === "High" ? "text-[#008064]" : item.confidence === "Medium" ? "text-amber-600" : "text-red-500"
                        }`}>
                          {item.confidence}
                        </span>
                      </div>
                    )}

                    {isFailed && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-semibold text-red-600 leading-relaxed font-sans">
                          {item.errorMsg}
                        </p>
                      </div>
                    )}

                    {isEditing && (
                      <div className="bg-neutral-50/60 rounded-xl p-3 border border-neutral-200 space-y-3.5 animate-fadeIn mt-2">
                        <div className="space-y-1">
                          <label className="block text-[10.5px] font-bold text-neutral-500">
                            {language === "BM" ? "Nama Resit / Peniaga" : "Receipt Name / Merchant"} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.merchant}
                            onChange={(e) => handleUpdateBulkItemField(item.id, "merchant", e.target.value)}
                            className={`w-full h-9 px-3 rounded-xl bg-white border text-xs focus:outline-none transition-all ${
                              item.validationErrors?.merchant ? "border-red-400 focus:border-red-500" : "border-neutral-200 focus:border-teal-brand"
                            }`}
                          />
                          {item.validationErrors?.merchant && (
                            <p className="text-[10px] text-red-500 font-medium">
                              {item.validationErrors.merchant}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="block text-[10.5px] font-bold text-neutral-500">
                              {language === "BM" ? "Tarikh Resit" : "Receipt Date"} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={item.date}
                              onChange={(e) => handleUpdateBulkItemField(item.id, "date", e.target.value)}
                              className={`w-full h-9 px-3 rounded-xl bg-white border text-xs focus:outline-none transition-all ${
                                item.validationErrors?.date ? "border-red-400 focus:border-red-500" : "border-neutral-200 focus:border-teal-brand"
                              }`}
                            />
                            {item.validationErrors?.date && (
                              <p className="text-[10px] text-red-500 font-medium">
                                {item.validationErrors.date}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10.5px] font-bold text-neutral-500">
                              {language === "BM" ? "Jumlah dalam RM" : "Amount in RM"} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2.5 text-xs text-neutral-400 font-bold">RM</span>
                              <input
                                type="text"
                                value={item.amount}
                                onChange={(e) => handleUpdateBulkItemField(item.id, "amount", e.target.value)}
                                className={`w-full h-9 pl-8 pr-2 rounded-xl bg-white border text-xs focus:outline-none transition-all font-semibold font-mono ${
                                  item.validationErrors?.amount ? "border-red-400 focus:border-red-500" : "border-neutral-200 focus:border-teal-brand"
                                }`}
                              />
                            </div>
                            {item.validationErrors?.amount && (
                              <p className="text-[10px] text-red-500 font-medium">
                                {item.validationErrors.amount}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10.5px] font-bold text-neutral-500">
                            {language === "BM" ? "Kategori Pelepasan Pelepasan (Malaysia)" : "Claim Category (Malaysia)"} <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={item.formBEItem}
                            onChange={(e) => handleUpdateBulkItemField(item.id, "formBEItem", e.target.value)}
                            className="w-full h-9 px-3 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none transition-all cursor-pointer"
                          >
                            <option value="">{language === "BM" ? "-- Pilih Kategori --" : "-- Choose Category --"}</option>
                            {dropdownOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label} ({opt.id})
                              </option>
                            ))}
                          </select>
                          {item.formBEItem && (
                            <div className="text-[9.5px] bg-[#F1FBF9] text-[#008064] p-1.5 rounded-lg font-bold border border-teal-500/5 mt-1 leading-normal">
                              💡 {language === "BM" ? "Had Maksimum" : "Limit status"}: {dropdownOptions.find(o => o.id === item.formBEItem)?.helper}
                            </div>
                          )}
                          {item.validationErrors?.category && (
                            <p className="text-[10px] text-red-500 font-medium">
                              {item.validationErrors.category}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10.5px] font-bold text-neutral-500 mb-1">
                            {language === "BM" ? "Status Tuntutan Malaysia" : "Malaysian Claim Status"} <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2">
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
                              const isSelected = item.claimStatus === pill.id;
                              return (
                                <button
                                  key={pill.id}
                                  type="button"
                                  onClick={() => handleUpdateBulkItemField(item.id, "claimStatus", pill.id)}
                                  className={`h-9 px-1 rounded-xl text-[10.5px] font-semibold border transition-all flex items-center justify-center cursor-pointer text-center ${
                                    isSelected ? pill.activeStyle : pill.style
                                  }`}
                                >
                                  {pill.label}
                                </button>
                              );
                            })}
                          </div>
                          {item.validationErrors?.claimStatus && (
                            <p className="text-[10px] text-red-500 font-medium">
                              {item.validationErrors.claimStatus}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10.5px] font-bold text-neutral-500">
                            {language === "BM" ? "Nota (Pilihan)" : "Notes (Optional)"}
                          </label>
                          <textarea
                            placeholder={language === "BM" ? "Sebut perincian pembelian..." : "Specific items purchased details..."}
                            value={item.notes}
                            onChange={(e) => handleUpdateBulkItemField(item.id, "notes", e.target.value)}
                            className="w-full h-12 p-2 bg-white border border-neutral-200 rounded-xl text-xs focus:outline-none transition-all resize-none"
                          />
                        </div>

                        {/* Tax5 Suggestion Insights card for this draft receipt */}
                        {item.formBEItem && (
                          <div className="pt-2 text-left">
                            <SuggestionInsightsCard
                              formBEItem={item.formBEItem}
                              claimStatus={item.claimStatus}
                              confidence={item.confidence}
                              suggestionWhy={item.suggestionWhy}
                              suggestionCheck={item.suggestionCheck}
                              receiptId={item.id}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => setEditingItemId(isEditing ? null : item.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-neutral-200 bg-[#FAFBFB] text-neutral-600 hover:text-navy cursor-pointer transition-colors"
                      >
                        {isEditing 
                          ? (language === "BM" ? "Tutup Editor" : "Close Editor") 
                          : (language === "BM" ? "Edit" : "Edit")}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveBulkItem(item.id)}
                          className="text-xs font-semibold px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                        >
                          {language === "BM" ? "Buang" : "Remove"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveBulkItem(item)}
                          className="text-xs font-semibold px-3 py-1.5 bg-teal-brand hover:bg-[#009170] text-white rounded-xl shadow-3xs cursor-pointer transition-transform duration-75 active:scale-95"
                        >
                          {language === "BM" ? "Simpan Resit" : "Save Receipt"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
