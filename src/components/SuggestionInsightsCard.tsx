import React, { useState } from "react";
import { Sparkles, Info, Check, AlertTriangle, Book, HelpCircle } from "lucide-react";
import { ClaimStatus, TaxReliefGuideline } from "../types";
import { taxReliefGuidelines } from "../data/taxReliefGuidelines";

interface SuggestionInsightsCardProps {
  formBEItem?: string;
  claimStatus?: ClaimStatus | string;
  confidence?: "High" | "Medium" | "Low";
  suggestionWhy?: string;
  suggestionCheck?: string;
  id?: string;
}

export const SuggestionInsightsCard: React.FC<SuggestionInsightsCardProps> = ({
  formBEItem,
  claimStatus,
  confidence,
  suggestionWhy,
  suggestionCheck,
  id = "tax5-suggestion-card",
}) => {
  const code = (formBEItem || "").toUpperCase().trim();
  const guideline: TaxReliefGuideline | undefined = taxReliefGuidelines[code];

  // Load smart setup dynamically to allow instant actions
  const rawSetup = localStorage.getItem("tax5_smart_setup");
  const smartSetupFromStorage = rawSetup ? JSON.parse(rawSetup) : null;

  const isSspnSection = code === "G13" || (formBEItem || "").toLowerCase().includes("sspn") || (guideline?.displayName || "").toLowerCase().includes("sspn");
  const isSspnDisabled = !smartSetupFromStorage || smartSetupFromStorage.sspnSavingsChild === "No" || !smartSetupFromStorage.sspnSavingsChild;

  const handleTurnOnSSPN = () => {
    let updated;
    if (smartSetupFromStorage) {
      updated = {
        ...smartSetupFromStorage,
        sspnSavingsChild: "Yes"
      };
    } else {
      updated = {
        sspnSavingsChild: "Yes",
        childrenCount: "Yes"
      };
    }
    localStorage.setItem("tax5_smart_setup", JSON.stringify(updated));
    window.location.reload();
  };

  // Map "Check Again" to "Needs Review" in display label
  const getDisplayStatus = (status?: string | ClaimStatus) => {
    if (!status) return "Needs Review";
    const normal = status.trim();
    if (normal === "Check Again" || normal === "Check_Again" || normal === "Needs Review") {
      return "Needs Review";
    }
    return normal;
  };

  const getStatusColor = (statusText: string) => {
    const s = statusText.toLowerCase();
    if (s.includes("claimable")) {
      return "text-teal-brand bg-teal-brand-light/40 border-teal-brand/10";
    } else if (s.includes("review") || s.includes("check")) {
      return "text-amber-brand bg-[#FFFDF5] border-amber-brand/20";
    } else {
      return "text-neutral-450 bg-neutral-100 border-neutral-200";
    }
  };

  // State to track checklist items checked. Key: guideline item + index
  const [checkedChecks, setCheckedChecks] = useState<Record<string, boolean>>({});

  const toggleCheck = (index: number) => {
    const key = `${code}-${index}`;
    setCheckedChecks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!code) return null;

  if (!guideline) {
    return (
      <div id={id} className="bg-[#FAFBFB] rounded-2xl p-4 border border-neutral-200 shadow-xs space-y-3 animate-fadeIn">
        <div className="flex items-center gap-1.5 text-neutral-500 text-[10.5px] font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Tax5 Suggestion Insights</span>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-neutral-150 text-xs text-neutral-600 font-medium whitespace-pre-wrap">
          Tax5 could not match this receipt to a guideline yet. Please review manually using the latest LHDN/MyTax information.
        </div>
        <div className="text-[9px] text-[#71717A] leading-normal italic bg-zinc-50 p-2 rounded-lg border border-neutral-100/90 font-sans">
          ⚠️ <strong>Note:</strong> Tax5 is a pre-filing support tool only. Final claim eligibility must be verified using official LHDN/MyTax information.
        </div>
      </div>
    );
  }

  const normalizedStatus = getDisplayStatus(claimStatus || guideline.defaultStatus);
  const displayConfidence = confidence || (guideline.defaultStatus === ClaimStatus.Claimable ? "High" : "Medium");

  return (
    <div
      id={id}
      className={`rounded-2xl p-4 border shadow-xs space-y-3.5 animate-fadeIn ${
        normalizedStatus === "Claimable"
          ? "bg-[#F4FBF9] border-teal-brand/15"
          : "bg-amber-100/10 border-amber-brand/15"
      }`}
    >
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-teal-brand text-[10.5px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 fill-teal-brand-light animate-pulse" />
          <span>Tax5 Suggestion Insights</span>
        </div>
        <span className="text-[9px] text-neutral-400 font-bold tracking-tight">
          YA {guideline.lastReviewedYear} Guide
        </span>
      </div>

      <div className="bg-white rounded-xl p-3.5 border border-neutral-150 space-y-3.5 shadow-sm text-xs">
        {/* Row 1: Item Code & Status */}
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-neutral-100">
          <div>
            <span className="text-neutral-400 font-bold block text-[9px] uppercase tracking-wider">
              Form BE Item code
            </span>
            <span className="bg-navy text-white px-2 py-0.5 rounded text-[10px] font-black inline-block mt-1 tracking-wide uppercase font-mono">
              {guideline.formItemCode}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 font-bold block text-[9px] uppercase tracking-wider">
              Claim Status Advice
            </span>
            <span
              className={`inline-block font-extrabold mt-1 text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(
                normalizedStatus
              )}`}
            >
              {normalizedStatus}
            </span>
          </div>
        </div>

        {/* Row 2: Category & Confidence */}
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-neutral-100">
          <div>
            <span className="text-neutral-400 font-bold block text-[9px] uppercase tracking-wider">
              Relief Category
            </span>
            <span className="text-navy font-bold block mt-1 truncate">
              {guideline.displayName}
            </span>
            <span className="text-[9px] text-neutral-500 font-semibold block bg-neutral-50 px-1 inline-block rounded border border-neutral-150 mt-0.5">
              {guideline.evidenceType}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 font-bold block text-[9px] uppercase tracking-wider">
              Confidence Level
            </span>
            <span
              className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-full border mt-1 ${
                displayConfidence === "High"
                  ? "bg-[#F1FBF9] text-teal-brand border-teal-brand/15"
                  : displayConfidence === "Low"
                  ? "bg-red-50 text-red-500 border-red-200/50"
                  : "bg-[#FFFDF5] text-amber-brand border-amber-brand/15"
              }`}
            >
              Tax5 Conf: {displayConfidence}
            </span>
          </div>
        </div>

        {/* Dynamic Why Tax5 Suggested */}
        <div className="space-y-1">
          <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">
            Why suggested:
          </span>
          <p className="text-neutral-700 leading-relaxed font-sans text-xs">
            {suggestionWhy || guideline.userFacingNote}
          </p>
        </div>

        {/* Checklist for normal taxpayers */}
        <div className="space-y-2 pt-1">
          <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">
            What to check before filing:
          </span>
          <div className="bg-[#FAFBFB] rounded-xl border border-neutral-150 p-2.5 space-y-1.5">
            {guideline.requiredChecks.map((checkStr, idx) => {
              const isChecked = !!checkedChecks[`${code}-${idx}`];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className="flex items-start gap-2.5 cursor-pointer hover:bg-neutral-50 p-1.5 rounded-lg transition-colors select-none"
                >
                  <div
                    className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all mt-0.5 ${
                      isChecked
                        ? "bg-teal-brand border-teal-brand text-white"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    className={`leading-normal transition-all text-[11px] ${
                      isChecked ? "text-neutral-400 line-through font-normal" : "text-neutral-700 font-medium"
                    }`}
                  >
                    {checkStr}
                  </span>
                </div>
              );
            })}
            {suggestionCheck && (
              <div className="text-[10px] text-neutral-500 mt-1 pt-1.5 border-t border-dashed border-neutral-200">
                <strong>Receipt context:</strong> {suggestionCheck}
              </div>
            )}
          </div>
        </div>

        {/* SSPN Scanned Receipt Reminders & Quick Setup Activations */}
        {isSspnSection && (
          <div className="space-y-2 pt-1">
            {/* Action Statement Requirement Reminder */}
            <div className="bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#D97706]/15 flex items-start gap-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <Info className="w-3.5 h-3.5 text-[#D97706]/75 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-neutral-600 font-semibold leading-relaxed font-sans">
                Check your SSPN statement and update the final amount if needed.
              </div>
            </div>

            {/* Quick Profile Turn-On Prompt if SSPN savings is disabled */}
            {isSspnDisabled && (
              <div className="bg-[#FAF8F5] px-3.5 py-2.5 rounded-xl border border-[#D97706]/20 space-y-1.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span className="text-[11px] text-navy font-bold leading-tight block">
                  Do you save in SSPN for your child?
                </span>
                <p className="text-[10.5px] text-neutral-500 leading-normal font-sans font-semibold">
                  Tax5 detected an SSPN receipt but your SSPN education savings is turned off in setup. Turning it on will show proof checklists and track this claim correctly.
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleTurnOnSSPN}
                    className="px-2.5 py-1 text-[10px] font-bold text-white bg-teal-brand hover:bg-teal-brand-dark rounded-lg cursor-pointer transition-colors shadow-5xs"
                  >
                    Yes, turn on SSPN savings
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Claim Limit */}
        {guideline.claimLimit && (
          <div className="space-y-1 bg-teal-brand/5 border border-teal-brand/10 p-2.5 rounded-xl">
            <span className="text-[9.5px] text-teal-brand font-extrabold uppercase tracking-widest block">
              Claim Limit (YA 2025):
            </span>
            <span className="text-navy font-bold text-xs font-sans">
              {guideline.claimLimit}
            </span>
          </div>
        )}

        {/* Warning Notes / Check Again conditions */}
        {normalizedStatus === "Needs Review" && guideline.checkAgainConditions && (
          <div className="bg-[#FFFDF5] p-2.5 rounded-xl border border-amber-brand/10 space-y-1">
            <span className="text-[9px] text-[#D97706] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Warning & Review Notes:</span>
            </span>
            <p className="text-neutral-700 leading-normal font-sans text-[11px]">
              {guideline.checkAgainConditions}
            </p>
          </div>
        )}

        {/* Source Note */}
        {guideline.sourceNote && (
          <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 pt-1">
            <Book className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold">{guideline.sourceNote}</span>
          </div>
        )}

        {/* Disclaimer */}
        <div className="h-px bg-neutral-150 w-full my-2"></div>
        <div className="text-[9px] text-neutral-450 leading-normal italic font-sans">
          ⚠️ <strong>Disclaimer:</strong> Tax5 is a pre-filing support tool only. Final claim eligibility must be verified using official LHDN/MyTax information.
        </div>
      </div>
    </div>
  );
};
