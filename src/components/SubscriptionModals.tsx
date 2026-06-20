import React from "react";
import { Crown, X, Check, Lock, AlertCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface SubscriptionModalsProps {
  isPricingOpen: boolean;
  setIsPricingOpen: (open: boolean) => void;
  simulatedPlan: string;
  setSimulatedPlan: (plan: string) => void;
  selectedPlanForUpgrade: string | null;
  setSelectedPlanForUpgrade: (plan: string | null) => void;
  isSuccessOpen: boolean;
  setIsSuccessOpen: (open: boolean) => void;
}

export const SubscriptionModals: React.FC<SubscriptionModalsProps> = ({
  isPricingOpen,
  setIsPricingOpen,
  simulatedPlan,
  setSimulatedPlan,
  selectedPlanForUpgrade,
  setSelectedPlanForUpgrade,
  isSuccessOpen,
  setIsSuccessOpen,
}) => {
  const { language } = useLanguage();

  const handleSimulateUpgrade = (plan: string) => {
    localStorage.setItem("tax5_simulated_plan", plan);
    setSimulatedPlan(plan);
    setSelectedPlanForUpgrade(null);
    setIsPricingOpen(false);
    setIsSuccessOpen(true);
  };

  return (
    <>
      {/* 1. Subscription/Pricing Modal */}
      {isPricingOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          {/* Back click-out */}
          <div className="absolute inset-0" onClick={() => setIsPricingOpen(false)} />
          
          <div className="bg-white rounded-3xl p-5 shadow-2xl relative w-full max-w-[340px] max-h-[85vh] overflow-y-auto no-scrollbar z-10 flex flex-col border border-neutral-100">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4.5 h-4.5 text-amber-500 fill-amber-400 animate-pulse" />
                <h3 className="text-[13px] font-black text-navy uppercase tracking-wider">
                  {language === "BM" ? "Langganan" : "Subscription"}
                </h3>
              </div>
              <button 
                onClick={() => setIsPricingOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* 1. CURRENT PLAN SECTION */}
            <div className={`border rounded-2xl p-3.5 text-left mt-3.5 transition-all ${
              simulatedPlan === "Tax5 Pro"
                ? "bg-[#EBF5FF] border-[#3B82F6]/30"
                : "bg-[#EAF7F4]/45 border border-[#00A884]/25"
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                    {language === "BM" ? "Pelan Semasa" : "Current Plan"}
                  </span>
                  <h4 className={`text-[14px] font-black uppercase tracking-tight mt-0.5 ${
                    simulatedPlan === "Tax5 Pro" ? "text-[#1E40AF]" : "text-[#00A884]"
                  }`}>
                    {simulatedPlan === "Tax5 Pro" 
                      ? "Tax5 Pro" 
                      : (language === "BM" ? "Demo Percuma" : "Free Demo")}
                  </h4>
                  <span className="text-[11px] font-bold text-neutral-500 block mt-0.5 font-mono">
                    {simulatedPlan === "Tax5 Pro"
                      ? (language === "BM" ? "RM35 / setahun" : "RM35 / year")
                      : (language === "BM" ? "RM0" : "RM0")}
                  </span>
                </div>
                <span className={`border text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider select-none shrink-0 shadow-3xs ${
                  simulatedPlan === "Tax5 Pro"
                    ? "bg-[#DBEAFE] text-[#1E40AF] border-[#3B82F6]/20"
                    : "bg-[#EAFDF5] text-[#009170] border-[#00A884]/20"
                }`}>
                  {language === "BM" ? "Aktif" : "Active"}
                </span>
              </div>
            </div>

            {/* 2. INCLUDED FEATURES SECTION */}
            <div className="text-left mt-4 animate-fadeIn">
              <h5 className="text-[10px] font-black text-navy uppercase tracking-wider mb-2">
                {language === "BM" ? "Termasuk dalam pelan anda" : "Included in your plan"}
              </h5>
              <ul className="space-y-1.5 pl-0.5">
                {(language === "BM" ? [
                  "Muat naik resit asas",
                  "Ekstrak OCR demo asas",
                  "Masukkan resit secara manual",
                  "Edit butiran resit",
                  "Cadangan status tuntutan",
                  "Senarai resit asas",
                  "Ringkasan draf Form BE asas",
                  "Panduan asas Tanya Tax5",
                  "Simpanan demo tempatan"
                ] : [
                  "Basic receipt upload",
                  "Basic OCR demo extraction",
                  "Manual receipt entry",
                  "Edit receipt details",
                  "Claim status suggestion",
                  "Basic receipt list",
                  "Basic Form BE draft summary",
                  "Basic Ask Tax5 guidance",
                  "Local demo storage"
                ]).map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-[10px] text-neutral-600 font-semibold" id={`inc-feat-${idx}`}>
                    <Check className="w-3.5 h-3.5 text-[#00A884] stroke-[3.5] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. PREMIUM FEATURES PREVIEW SECTION */}
            <div className="text-left mt-4 border-t border-dashed border-neutral-200/80 pt-4 animate-fadeIn">
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <h5 className="text-[11px] font-black text-neutral-700 uppercase tracking-wider">
                    {language === "BM" ? "Tersedia dengan Tax5 Pro" : "Available with Tax5 Pro"}
                  </h5>
                </div>
                <span className="text-[10.5px] font-extrabold text-[#00A884] font-mono select-none">
                  RM35/{language === "BM" ? "tahun" : "year"}
                </span>
              </div>
              <ul className="space-y-1.5 pl-0.5">
                {(language === "BM" ? [
                  "Chat Tanya Tax5",
                  "Muat turun draf PDF",
                  "Muat turun semua resit sebagai ZIP",
                  "Sandaran awan",
                  "Eksport draf Form BE lanjutan",
                  "Peringatan pintar musim pemfailan"
                ] : [
                  "Ask Tax5 Chat",
                  "Download PDF draft",
                  "Download all receipts as ZIP",
                  "Cloud backup",
                  "Advanced Form BE draft export",
                  "Smart filing season reminders"
                ]).map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-[10px] text-neutral-400/75 font-medium select-none" id={`prem-feat-${idx}`}>
                    <Lock className="w-3 h-3 text-neutral-300/90 shrink-0" />
                    <span>{feat}</span>
                    <span className="bg-[#FEF6E0] text-[#78350F] font-black text-[7.5px] px-1 py-0.2 rounded shrink-0 uppercase border border-[#FDE68A]/80 ml-auto select-none scale-90 origin-right">
                      Pro
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. CTA BUTTON */}
            {simulatedPlan === "Tax5 Pro" ? (
              <button
                id="btn-downgrade-demo-plan"
                onClick={() => {
                  localStorage.setItem("tax5_simulated_plan", "Free Demo");
                  setSimulatedPlan("Free Demo");
                }}
                className="w-full py-2.5 mt-5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-[10px] font-black rounded-xl transition-all cursor-pointer text-center tracking-wider uppercase border border-neutral-200/50"
              >
                {language === "BM" ? "Tukar ke Demo Percuma" : "Switch to Free Demo"}
              </button>
            ) : (
              <button
                id="btn-upgrade-tax5-pro-plan"
                onClick={() => {
                  setSelectedPlanForUpgrade("Tax5 Pro");
                }}
                className="w-full py-2.5 mt-5 bg-[#00A884] hover:bg-[#009473] text-white text-[10px] font-black rounded-xl transition-all cursor-pointer text-center tracking-wider uppercase shadow-3xs"
              >
                {language === "BM" ? "Naik Taraf ke Tax5 Pro" : "Upgrade to Tax5 Pro"}
              </button>
            )}

            {/* 5. DEMO NOTICE */}
            <p className="text-[9px] text-neutral-400/80 font-semibold mt-3 text-center tracking-wide">
              {language === "BM" 
                ? "Demo sahaja — tiada pembayaran sebenar diproses." 
                : "Demo only — no real payment is processed."}
            </p>
          </div>
        </div>
      )}

      {/* 2. Soft Locked Upgrade Modal / Fake Confirmation Modal */}
      {selectedPlanForUpgrade && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-fadeIn">
          {/* Back click-out */}
          <div className="absolute inset-0" onClick={() => setSelectedPlanForUpgrade(null)} />
          
          <div className="bg-white rounded-3xl p-5 shadow-2xl relative w-full max-w-[320px] z-10 flex flex-col text-left border border-neutral-100 animate-slideDown">
            <div className="flex items-center gap-2 text-amber-500 pb-2 border-b border-neutral-100">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="text-[12px] font-black text-navy uppercase tracking-wider" id="modal-upgrade-title">
                {language === "BM" ? "Pratonton Tax5 Pro" : "Tax5 Pro preview"}
              </h4>
            </div>
            
            <p className="text-[11px] text-amber-800 font-semibold mt-4 leading-relaxed bg-amber-50/60 p-3.5 rounded-2xl border border-amber-250/35" id="modal-upgrade-description">
              {language === "BM" 
                ? "Ciri ini tersedia dalam Tax5 Pro. Ini hanyalah simulasi MVP dan tiada pembayaran sebenar akan diproses." 
                : "This feature is available in Tax5 Pro. This is an MVP simulation only, and no real payment will be processed."}
            </p>

            <div className="flex gap-2.5 mt-5">
              <button
                id="btn-cancel-upgrade"
                onClick={() => setSelectedPlanForUpgrade(null)}
                className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-[10px] font-black rounded-xl transition-all cursor-pointer text-center border border-neutral-250/30"
              >
                {language === "BM" ? "Batal" : "Cancel"}
              </button>
              <button
                id="btn-confirm-simulate-upgrade"
                onClick={() => handleSimulateUpgrade(selectedPlanForUpgrade)}
                className="flex-1 py-2 bg-[#00A884] hover:bg-[#009473] text-white text-[10px] font-black rounded-xl transition-all cursor-pointer text-center shadow-3xs"
              >
                {language === "BM" ? "Simulasikan Naik Taraf" : "Simulate Upgrade"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Success Modal */}
      {isSuccessOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          {/* Back click-out */}
          <div className="absolute inset-0" onClick={() => setIsSuccessOpen(false)} />
          
          <div className="bg-white rounded-3xl p-5 shadow-2xl relative w-full max-w-[320px] z-10 flex flex-col text-center border border-neutral-100 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-[#EAFDF5] flex items-center justify-center text-[#00A884] border border-[#BBF7D0]/30 shadow-3xs mx-auto mb-3">
              <Check className="w-5 h-5 stroke-[3]" />
            </div>
            
            <h4 className="text-[12.5px] font-black text-navy uppercase tracking-wider" id="modal-success-title">
              {language === "BM" ? "Berjaya Disimulasikan" : "Simulated Successfully"}
            </h4>
            
            <p className="text-[11px] text-neutral-600 font-semibold mt-2.5 leading-relaxed" id="modal-success-description">
              {language === "BM" 
                ? "Naik taraf berjaya disimulasikan. Ini bukan langganan sebenar." 
                : "Upgrade simulated successfully. This is not a real subscription."}
            </p>

            <button
              id="btn-close-success-modal"
              onClick={() => setIsSuccessOpen(false)}
              className="w-full py-2.5 bg-navy hover:bg-[#031427] text-white text-[10px] font-black rounded-xl transition-all cursor-pointer text-center mt-5 shadow-3xs"
            >
              {language === "BM" ? "Tutup" : "Close"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
