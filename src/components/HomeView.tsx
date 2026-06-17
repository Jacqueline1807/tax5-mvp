import React, { useState, useRef, useEffect } from "react";
import { 
  Scan, 
  Upload, 
  Edit2, 
  FileText, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  Ban, 
  User, 
  Info,
  ChevronRight, 
  ChevronDown,
  HelpCircle
} from "lucide-react";
import { Logo } from "./Logo";
import { Receipt, ClaimStatus, SmartSetupData } from "../types";
import { calculateCompletionStatus } from "../utils/suggestionEngine";

interface HomeViewProps {
  receipts: Receipt[];
  smartSetup: SmartSetupData | null;
  userName?: string;
  userEmail?: string;
  isDemo?: boolean;
  onLogout?: () => void;
  onNavigateToScan: () => void;
  onNavigateToList: () => void;
  onNavigateToSummary: () => void;
  onNavigateToSetup: () => void;
  onNavigateToAsk: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  receipts,
  smartSetup,
  userName,
  userEmail,
  isDemo,
  onLogout,
  onNavigateToScan,
  onNavigateToList,
  onNavigateToSummary,
  onNavigateToSetup,
  onNavigateToAsk,
}) => {
  // Calculations based on actual store
  const savedReceiptsCount = receipts.length;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);
  
  // Rule: Only receipts marked "Claimable" should be included in the main claim total
  const claimableReceipts = receipts.filter(r => r.claimStatus === ClaimStatus.Claimable);
  const currentClaimTotal = claimableReceipts.reduce((sum, r) => sum + r.amount, 0);

  // Status Counts
  const claimableCount = receipts.filter(r => r.claimStatus === ClaimStatus.Claimable).length;
  const checkAgainCount = receipts.filter(r => r.claimStatus === ClaimStatus.CheckAgain).length;
  const nonClaimableCount = receipts.filter(r => r.claimStatus === ClaimStatus.NonClaimable).length;

  const completionStatus = calculateCompletionStatus(smartSetup);

  const getSetupSectionsCount = (data: SmartSetupData | null): number => {
    if (!data) return 0;
    let count = 0;
    if (data.salariedBE !== "" || data.eaUploadName !== "" || (data.availableContributions && data.availableContributions.length > 0)) {
      count++;
    }
    if (data.childrenCount !== "" || (data.childDetails && data.childDetails.length > 0) || data.supportingParents !== "" || data.spouseSituation !== "") {
      count++;
    }
    if ((data.disabilityJoint && data.disabilityJoint.length > 0) || data.medicalCertificateUploadName !== "" || (data.medicalReceiptTypes && data.medicalReceiptTypes.length > 0)) {
      count++;
    }
    if ((data.insuranceRecords && data.insuranceRecords.length > 0) || data.insuranceStatementUploadName !== "") {
      count++;
    }
    if (data.firstHomeBought !== "" || (data.homeOtherReliefs && data.homeOtherReliefs.length > 0) || data.homeUploadName !== "") {
      count++;
    }
    return count;
  };

  const setupSectionsCount = getSetupSectionsCount(smartSetup);

  return (
    <div className="flex-1 flex flex-col p-4 bg-[#F5FAF7] justify-start h-full space-y-3.5 overflow-y-auto overflow-x-hidden no-scrollbar relative">
      {/* Soft circular low-opacity decorative gradient background blobs */}
      <div className="absolute top-[-5%] left-[-15%] w-[250px] h-[250px] rounded-full bg-[#E5F5EF] blur-[85px] opacity-75 pointer-events-none"></div>
      <div className="absolute bottom-[8%] right-[-10%] w-[220px] h-[220px] rounded-full bg-[#FFFBE3] blur-[75px] opacity-65 pointer-events-none"></div>

      {/* 1. Compact Header */}
      <div className="flex items-center justify-between pb-0.5 z-20 relative">
        <Logo size="sm" showText={true} />
        
        <div className="flex items-center gap-1.5 justify-end relative" ref={dropdownRef}>
          {isDemo && (
            <div className="bg-[#EAFDF5] border border-[#00A884]/15 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-[#00A884] select-none shadow-3xs shrink-0">
              Demo Mode
            </div>
          )}
          
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[10px] font-bold cursor-pointer shadow-3xs select-none transition-all active:scale-[0.98] border shrink-0 hover:bg-[#F2FAF6]"
            style={{
              backgroundColor: "#F9FCFB",
              borderColor: "#D7E7E1",
              color: "#09244A"
            }}
          >
            <User className="w-3 h-3 stroke-[2.5] text-[#09244A]/80 shrink-0" />
            <span className="text-[10.5px]">
              {isDemo ? "Demo" : (userName?.trim().split(/\s+/)[0] || "Account")}
            </span>
            {!isDemo && completionStatus !== "Ready" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0 ml-1" />
            )}
            <ChevronDown className="w-3 h-3 stroke-[2.5] text-[#09244A]/60 shrink-0 transition-transform duration-200" style={{ transform: isDropdownOpen ? "rotate(180deg)" : "none" }} />
          </button>

          {/* Account Dropdown Menu */}
          {isDropdownOpen && (
            <>
              {/* Invisible full-screen backdrop layer that captures click-outs and instantly closes the dropdown, self-removing completely */}
              <div 
                className="fixed inset-0 z-40 bg-transparent cursor-default pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(false);
                }}
              />
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1.5 w-[265px] max-w-[calc(100vw-32px)] sm:max-w-[265px] bg-white border border-[#E1ECE8] rounded-2xl shadow-xl p-4.5 z-50 animate-fadeIn text-left pointer-events-auto"
              >
                <div className="space-y-2.5">
                  {/* User info container */}
                  <div className="space-y-1">
                    <div className="text-[13px] font-extrabold text-[#09244A] tracking-tight leading-none animate-fadeIn">
                      {isDemo ? "Demo User" : (userName || "User")}
                    </div>
                    {(!isDemo && userEmail) && (
                      <div className="text-[10.5px] font-semibold text-neutral-500 break-all select-all leading-normal">
                        {userEmail}
                      </div>
                    )}
                    {isDemo && (
                      <div className="text-[10.5px] font-semibold text-neutral-500 leading-normal">
                        Demo Mode
                      </div>
                    )}
                  </div>

                  {/* Profile status row */}
                  <div className="pt-2.5 border-t border-[#DCE3E8]">
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigateToSetup();
                      }}
                      className="w-full text-left flex items-center justify-between py-1.5 px-2 hover:bg-[#F2FAF6] rounded-xl transition-all cursor-pointer border-none bg-transparent select-none group"
                    >
                      <span className="text-[11.5px] font-extrabold text-[#09244A] group-hover:text-[#4FAE91] transition-colors">
                        Profile Setup
                      </span>
                      {completionStatus === "Ready" ? (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-[#00A884]/20 bg-[#EAFDF5] text-[#009170] uppercase shrink-0">
                          Ready
                        </span>
                      ) : completionStatus === "Partly done" ? (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-[#FFF1C2]/45 bg-[#FFFDF0] text-amber-700 uppercase shrink-0">
                          In progress
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-600 uppercase shrink-0">
                          Needs review
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Sign out custom action with top spacing */}
                  {onLogout && (
                    <div className="pt-0.5">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left text-[11.5px] font-extrabold text-[#A94A44] hover:text-[#8D342E] transition-colors flex items-center cursor-pointer border-none bg-transparent p-0"
                      >
                        <span>{isDemo ? "Exit Demo Mode" : "Sign Out"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Greeting Section */}
      <div className="z-10 relative">
        <div className="space-y-0.5 text-left">
          <h3 className="text-xl font-bold tracking-tight text-navy font-heading">
            Hi, {isDemo ? "Demo User" : (userName || "User")} 👋
          </h3>
          <p className="text-[11.5px] text-[#4F5B66] font-semibold">
            {isDemo ? "Demo Mode • Scanned receipts stay locally." : "Your Form BE receipt draft is being prepared."}
          </p>
        </div>
      </div>

      {/* 3. Smaller Premium Hero Card: Form BE Draft */}
      <div className="bg-gradient-to-br from-[#EAF7F4] to-[#F1F9F7] border border-teal-500/10 rounded-2xl p-4.5 shadow-[0_4px_12px_rgba(0,168,132,0.02)] space-y-3.5 relative overflow-hidden z-10 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[#0B2545]/85 font-black text-[10px] tracking-wider uppercase font-heading">
              Form BE Draft
            </span>
            <span className="bg-white/80 text-[#009170] text-[9px] font-black px-2 py-0.5 rounded-full border border-teal-500/10">
              Y/A 2026
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onNavigateToSummary}
              className="text-[10.5px] font-bold px-2.5 py-1 rounded-full border transition-all hover:brightness-95 active:scale-[0.98] shadow-3xs cursor-pointer shrink-0"
              style={{
                backgroundColor: "#F3FBF7",
                borderColor: "#9FD6C2",
                color: "#2F8F72"
              }}
            >
              View Summary
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-[#0B2545]/60 font-mono">RM</span>
            <span className="text-3xl font-extrabold text-[#0B2545] tracking-tight font-mono">
              {currentClaimTotal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <p className="text-[10px] text-[#4F5B66] font-semibold">
            Claimable total from saved receipts
          </p>
        </div>

        {/* Compact status chips in a single row */}
        <div className="flex flex-row flex-nowrap justify-between gap-1 pt-0.5 w-full select-none">
          {/* Claimable pill */}
          <div 
            className="h-6 px-1.5 min-[360px]:px-2.5 rounded-full flex items-center gap-1 text-[9px] min-[360px]:text-[10px] font-bold border shadow-[0_1px_2px_rgba(0,168,132,0.015)] shrink-0"
            style={{
              backgroundColor: "#EAFDF5",
              borderColor: "rgba(187, 247, 208, 0.3)",
              color: "#166534"
            }}
          >
            <span className="w-1 h-1 min-[360px]:w-1.5 min-[360px]:h-1.5 rounded-full bg-[#16A34A] shrink-0"></span>
            <span className="truncate">{claimableCount} Claimable</span>
          </div>

          {/* Needs Review pill */}
          <div 
            className="h-6 px-1.5 min-[360px]:px-2.5 rounded-full flex items-center gap-1 text-[9px] min-[360px]:text-[10px] font-bold border shadow-[0_1px_2px_rgba(217,119,6,0.015)] shrink-0"
            style={{
              backgroundColor: "#FEF3C7",
              borderColor: "rgba(253, 230, 138, 0.3)",
              color: "#B45309"
            }}
          >
            <span className="w-1 h-1 min-[360px]:w-1.5 min-[360px]:h-1.5 rounded-full bg-[#D97706] shrink-0"></span>
            <span className="truncate">{checkAgainCount} Need review</span>
          </div>

          {/* Not Eligible pill */}
          <div 
            className="h-6 px-1.5 min-[360px]:px-2.5 rounded-full flex items-center gap-1 text-[9px] min-[360px]:text-[10px] font-bold border shrink-0"
            style={{
              backgroundColor: "#F3F4F6",
              borderColor: "rgba(226, 232, 240, 0.3)",
              color: "#4B5563"
            }}
          >
            <span className="w-1 h-1 min-[360px]:w-1.5 min-[360px]:h-1.5 rounded-full bg-[#6B7280] shrink-0"></span>
            <span className="truncate">{nonClaimableCount} Not eligible</span>
          </div>
        </div>
      </div>

      {/* 4. Grouped Add Receipt Block */}
      <div className="bg-white border border-[#E1EDE8] rounded-2xl p-5 shadow-3xs flex flex-col space-y-4 z-10 relative">
        <div className="space-y-0.5">
          <h4 className="font-bold text-xs text-navy font-heading">
            Add receipt
          </h4>
          <p className="text-[10px] text-[#4F5B66] font-medium leading-normal">
            Scan, upload, or enter a receipt manually.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Main action: Prominent yet balanced Scan receipt tile */}
          <button
            id="btn-main-scan-receipt"
            onClick={onNavigateToScan}
            className="w-full bg-gradient-to-br from-[#00B896] via-[#00A884] to-[#009170] hover:from-[#00A082] hover:to-[#008062] text-white py-5 px-4 rounded-xl flex flex-col items-center justify-center text-center gap-2.5 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-[#00A884]/15 border border-white/10 relative overflow-hidden group shrink-0"
          >
            {/* Subtle glow highlights */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-teal-300/10 rounded-full blur-[18px] pointer-events-none"></div>
            
            {/* Tasteful watermark decoration */}
            <FileText className="absolute -right-2 -bottom-2 text-white/[0.04] w-18 h-18 pointer-events-none -rotate-12" />
            
            {/* Soft circular highlight behind icon */}
            <div className="w-9.5 h-9.5 rounded-full bg-white/15 border border-white/15 flex items-center justify-center text-white shrink-0 shadow-3xs relative z-10 transition-transform duration-300 group-hover:scale-105">
              <Scan className="w-4.5 h-4.5 stroke-[2.5]" />
            </div>
            
            <div className="space-y-0.5 relative z-10">
              <span className="font-bold text-[13.5px] tracking-wide">
                Scan receipt
              </span>
            </div>
          </button>

          {/* Secondary actions: Upload and Manual side-by-side rounded rectangles */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onNavigateToScan}
              className="bg-[#F4FAF7] hover:bg-[#EAF5EF] border border-[#00A884]/8 rounded-lg h-8 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#008F6B] cursor-pointer active:scale-[0.98] transition-all"
            >
              <Upload className="w-3 h-3 stroke-[2] text-[#00A884]" />
              <span>Upload file</span>
            </button>
            <button
              onClick={onNavigateToScan}
              className="bg-[#F4FAF7] hover:bg-[#EAF5EF] border border-[#00A884]/8 rounded-lg h-8 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#008F6B] cursor-pointer active:scale-[0.98] transition-all"
            >
              <Edit2 className="w-3 h-3 stroke-[2] text-[#00A884]" />
              <span>Manual entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Tax Records Card (formerly Receipt Organizer) */}
      <div className="bg-white border border-neutral-200/50 rounded-2xl p-3.5 shadow-3xs flex items-center justify-between gap-3 z-10 relative">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8.5 h-8.5 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0 border border-neutral-200/40 shadow-3xs">
            <FileText className="w-4.5 h-4.5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-[#0B2545] font-heading">
              Tax Records
            </h4>
            <p className="text-[11px] text-[#4F5B66] font-medium mt-0.5">
              {savedReceiptsCount} {savedReceiptsCount === 1 ? 'receipt' : 'receipts'} saved for Y/A 2026
            </p>
          </div>
        </div>
        <button
          onClick={onNavigateToList}
          className="flex items-center gap-0.5 text-[11px] font-bold bg-white hover:bg-neutral-50 active:bg-neutral-100 py-1 px-2.5 rounded-lg border shadow-3xs transition-all cursor-pointer shrink-0"
          style={{
            borderColor: "#D1D9E0",
            color: "#09244A"
          }}
        >
          <span>View</span>
          <ChevronRight className="w-2.5 h-2.5 stroke-[2.5]" />
        </button>
      </div>

      {/* 6. Ask Tax5 Support Card */}
      <div className="bg-[#FFFDF0] border border-[#FFF1C2]/30 rounded-2xl p-3.5 shadow-3xs flex items-center justify-between gap-3 hover:bg-[#FFFDF0]/95 transition-all z-10 relative">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8.5 h-8.5 rounded-xl bg-[#FEFCE8] flex items-center justify-center text-[#B45309] shrink-0 border border-[#FFF1C2]/45 shadow-3xs">
            <MessageSquare className="w-4 h-4.5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-[#0B2545] font-heading">
              Unsure about a claim?
            </h4>
            <p className="text-[11px] text-[#4F5B66] font-medium leading-normal mt-0.5">
              Ask Tax5 before filing.
            </p>
          </div>
        </div>
        <button
          onClick={onNavigateToAsk}
          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all hover:brightness-95 active:scale-[0.98] shadow-3xs cursor-pointer shrink-0"
          style={{
            backgroundColor: "#FFF9E8",
            borderColor: "#F1D89A",
            color: "#9A6500"
          }}
        >
          <span>Ask Tax5</span>
          <ChevronRight className="w-3 h-3 stroke-[2.5]" />
        </button>
      </div>

      {/* 7. Trust note */}
      <div className="text-center w-full mt-auto pt-3 pb-0.5 z-10 relative">
        <p className="text-[8.5px] text-[#4F5B66] font-semibold leading-relaxed flex items-center justify-center gap-1 px-2 opacity-95">
          <HelpCircle className="w-3 h-3 text-neutral-400 shrink-0" />
          <span>Pre-filing guidance only. Verify final eligibility with LHDN/MyTax.</span>
        </p>
      </div>
    </div>
  );
};
export default HomeView;


