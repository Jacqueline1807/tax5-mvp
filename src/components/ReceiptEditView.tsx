import React, { useState, useEffect } from "react";
import { AlertCircle, ShieldAlert, Check, HelpCircle } from "lucide-react";
import { ClaimCategory, ClaimStatus, Receipt } from "../types";
import { SuggestionInsightsCard } from "./SuggestionInsightsCard";

interface ReceiptEditViewProps {
  receipt: Receipt;
  onSave: (id: string, updatedFields: Partial<Receipt>) => void;
  onCancel: () => void;
}

export const ReceiptEditView: React.FC<ReceiptEditViewProps> = ({
  receipt,
  onSave,
  onCancel,
}) => {
  // Input fields binding states
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ClaimCategory>(ClaimCategory.Lifestyle);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>(ClaimStatus.Claimable);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form with existing parameters
  useEffect(() => {
    if (receipt) {
      setMerchant(receipt.merchant);
      setDate(receipt.date);
      setAmount(receipt.amount.toString());
      setCategory(receipt.category);
      setClaimStatus(receipt.claimStatus);
      setNotes(receipt.notes || "");
    }
  }, [receipt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!merchant.trim()) {
      newErrors.merchant = "Please enter the receipt name.";
    }
    if (!date) {
      newErrors.date = "Please choose the receipt date.";
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Pass back updated values
    onSave(receipt.id, {
      merchant,
      date,
      amount: parseFloat(amount),
      category,
      claimStatus,
      notes,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-5 bg-[#F7F9FA] space-y-4 pb-12 relative overflow-x-hidden">
      {/* Soft circular low-opacity decorative gradient background blobs (Lightest version for editing receipts) */}
      <div className="absolute top-[-5%] left-[-15%] w-[250px] h-[250px] rounded-full bg-[#E5F5EF] blur-[95px] opacity-25 pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[220px] h-[220px] rounded-full bg-[#FFFBE3] blur-[85px] opacity-25 pointer-events-none z-0"></div>

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
        <div>
          <h2 className="text-xl font-bold font-heading text-navy">Check Receipt Details</h2>
          <p className="text-xs text-neutral-500">Update anything that looks wrong before filing.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ================= TAX5 AI CLASSIFICATION GUIDANCE BLOCK ================= */}
        {receipt.formBEItem && (
          <SuggestionInsightsCard
            formBEItem={receipt.formBEItem}
            claimStatus={receipt.claimStatus}
            confidence={receipt.confidence}
            suggestionWhy={receipt.suggestionWhy}
            suggestionCheck={receipt.suggestionCheck}
          />
        )}
        
        {/* Core fields card wrapping */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200/60 space-y-4">
          
          {/* Merchant inputs */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-600">
              Receipt Name / Merchant <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="edit-merchant"
              value={merchant}
              onChange={(e) => {
                setMerchant(e.target.value);
                if (errors.merchant) setErrors((prev) => ({ ...prev, merchant: "" }));
              }}
              className={`w-full h-10 px-3 rounded-xl bg-neutral-50/50 border text-xs focus:bg-white focus:outline-none transition-all ${
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

          {/* Quick date & value horizontal grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Purchase Date */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-600">
                Receipt Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="edit-date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: "" }));
                }}
                className={`w-full h-10 px-3 rounded-xl bg-neutral-50/50 border text-xs focus:bg-white focus:outline-none transition-all ${
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

            {/* Expensed Money Amount */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-neutral-600">
                Amount in RM <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-bold">RM</span>
                <input
                  type="text"
                  id="edit-amount"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
                  }}
                  className={`w-full h-10 pl-9 pr-3 rounded-xl bg-neutral-50/50 border text-xs focus:bg-white focus:outline-none transition-all font-mono font-semibold ${
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

          <div className="h-px bg-neutral-100 my-1"></div>

          {/* Form BE Category Selector Option */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-600">
              Claim Category <span className="text-red-500">*</span>
            </label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ClaimCategory)}
              className="w-full h-10 px-3 rounded-xl bg-neutral-50/50 border border-neutral-250 text-xs focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value={ClaimCategory.Lifestyle}>Lifestyle (Capped RM2,500)</option>
              <option value={ClaimCategory.Medical}>Medical Expenses (Capped RM10,000)</option>
              <option value={ClaimCategory.Education}>Education fees (Capped RM7,000)</option>
              <option value={ClaimCategory.Sports}>Sports Equipment / Activities (Capped RM1,000)</option>
              <option value={ClaimCategory.Insurance}>Life & Takaful Premiums (Capped RM3,000)</option>
              <option value={ClaimCategory.Other}>Other allowed reliefs</option>
            </select>
          </div>

          {/* Claim Status Option Badge Pills */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-600">
              Claim Status <span className="text-red-500">*</span>
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { 
                  id: ClaimStatus.Claimable, 
                  label: "Claimable", 
                  style: "border-teal-brand/35 bg-[#F1FBF9] text-teal-brand",
                  activeStyle: "border-teal-brand bg-teal-brand text-white rounded-xl ring-2 ring-teal-brand/20 shadow-sm"
                },
                { 
                  id: ClaimStatus.CheckAgain, 
                  label: "Needs Review", 
                  style: "border-amber-brand/35 bg-[#FFFDF5] text-amber-brand",
                  activeStyle: "border-amber-brand bg-amber-brand text-white rounded-xl ring-2 ring-amber-brand/30 shadow-sm"
                },
                { 
                  id: ClaimStatus.NonClaimable, 
                  label: "Not-eligible", 
                  style: "border-neutral-250 bg-neutral-50 text-neutral-500",
                  activeStyle: "border-neutral-700 bg-neutral-800 text-white rounded-xl shadow-sm"
                }
              ].map((pill) => {
                const isSelected = claimStatus === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setClaimStatus(pill.id)}
                    className={`h-10 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center text-center ${
                      isSelected ? pill.activeStyle : `${pill.style} border-neutral-200`
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Description Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-neutral-600">
              Filing Notes / Explanations
            </label>
            <textarea
              id="edit-notes"
              placeholder="Provide context like purchase item or vendor details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-16 p-3 rounded-xl bg-neutral-50/50 border border-neutral-250 text-xs focus:bg-white focus:outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Preparation Guide Reminder Box */}
        <div className="bg-amber-brand-light/30 border border-amber-brand/10 rounded-xl p-3 flex gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-brand shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-brand font-medium leading-relaxed">
            🎓 <strong>Preparation Guide Reminder:</strong> This status value is only a pre-filing aid. Please confirm final category eligibility and legal claim parameters using official MyTax/e-Filing manuals.
          </p>
        </div>

        {/* Submit Actions button group */}
        <div className="grid grid-cols-2 gap-3.5 pt-1.5 font-bold">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 bg-white hover:bg-neutral-50 border border-neutral-250 rounded-xl text-neutral-500 text-xs flex items-center justify-center cursor-pointer transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            id="btn-confirm-edit"
            className="h-11 bg-teal-brand hover:bg-[#009170] text-white rounded-xl text-xs flex items-center justify-center font-semibold cursor-pointer transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
export default ReceiptEditView;
