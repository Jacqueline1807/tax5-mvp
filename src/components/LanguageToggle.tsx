import React from "react";
import { useLanguage } from "../context/LanguageContext";

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center bg-white/95 border border-[#DCE3E8] shadow-3xs rounded-full p-0.5 text-[9px] font-extrabold tracking-wide text-[#09244A] gap-0.5 select-none shrink-0 pointer-events-auto h-6">
      <button
        onClick={() => setLanguage("EN")}
        className={`cursor-pointer px-1.5 h-full rounded-full transition-all flex items-center justify-center ${
          language === "EN" 
            ? "bg-teal-brand text-white shadow-3xs" 
            : "text-[#09244A]/60 hover:text-[#09244A]"
        }`}
        style={{ fontSize: "8.5px" }}
      >
        EN
      </button>
      <span className="text-[#DCE3E8]/80 font-light font-sans scale-y-75">|</span>
      <button
        onClick={() => setLanguage("BM")}
        className={`cursor-pointer px-1.5 h-full rounded-full transition-all flex items-center justify-center ${
          language === "BM" 
            ? "bg-teal-brand text-white shadow-3xs" 
            : "text-[#09244A]/60 hover:text-[#09244A]"
        }`}
        style={{ fontSize: "8.5px" }}
      >
        BM
      </button>
    </div>
  );
};

export default LanguageToggle;
