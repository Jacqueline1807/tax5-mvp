import React from "react";
import { Logo } from "./Logo";
import { ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

interface WelcomeViewProps {
  onTryDemo: () => void;
  onUseMyApp: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onTryDemo, onUseMyApp }) => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 bg-[#F7F9FA] flex flex-col justify-between scroll-smooth relative overflow-y-auto overflow-x-hidden min-h-full pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      {/* Language Toggle in top right */}
      <div className="absolute top-3.5 right-3.5 z-50">
        <LanguageToggle />
      </div>

      {/* Background ombre blobs only - kept behind all content - pointer-events-none and z-0 */}
      <div className="absolute top-[-5%] left-[-15%] w-[250px] h-[250px] rounded-full bg-[#E5F5EF] blur-[85px] opacity-75 pointer-events-none z-0" />
      <div className="absolute bottom-[3%] right-[-18%] w-[220px] h-[220px] rounded-full bg-[#FFFBE3] blur-[90px] opacity-20 pointer-events-none z-0" />

      {/* Actual page content - gap based layout with adaptive spacing */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center flex-1 px-5 py-4 min-h-0 justify-between gap-y-4 sm:gap-y-6 md:gap-y-8">
        
        {/* Top area: Logo */}
        <div className="flex flex-col items-center w-full pt-4 sm:pt-6 transition-transform duration-300 transform hover:scale-105 select-none">
          <Logo size="xl" showText={true} />
        </div>

        {/* Middle area: Title & Subtitle */}
        <div className="flex flex-col items-center text-center space-y-2.5 sm:space-y-3 px-2 w-full my-auto">
          <h2 className="font-heading font-extrabold text-[19px] min-[360px]:text-[21px] sm:text-[23px] text-navy tracking-tight leading-tight">
            {t("welcome", "title")}
          </h2>

          <p className="text-[11.5px] sm:text-xs text-neutral-500 leading-relaxed font-semibold max-w-[280px]">
            {t("welcome", "subtitle")}
          </p>
        </div>

        {/* Bottom area: MVP badge & Action panel */}
        <div className="w-full space-y-3 sm:space-y-4 mt-auto">
          {/* MVP badge */}
          <div className="flex justify-center select-none">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:py-1 bg-white border border-teal-brand/10 shadow-[0_1px_2px_rgba(0,0,0,0.03)] rounded-full text-[9px] sm:text-[10px] text-teal-brand font-bold tracking-wider uppercase">
              <Sparkles className="w-3.0 h-3.0 text-teal-brand" />
              {t("welcome", "badge")}
            </span>
          </div>

          {/* Soft action panel */}
          <div className="bg-teal-brand-light/75 border border-teal-brand/15 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-3.5 flex flex-col items-center">
            {/* Try Demo (Solid primary button) */}
            <button
              id="btn-try-demo"
              onClick={onTryDemo}
              className="
                w-full max-w-[260px] h-11 sm:h-12
                text-white font-extrabold
                flex items-center justify-center gap-2
                rounded-[18px]
                active:scale-[0.98]
                transition-transform
                cursor-pointer text-[13px]
                border-0
              "
              style={{
                background: "#4FAE91",
                backgroundColor: "#4FAE91",
                backgroundImage: "none",
                color: "white",
                opacity: 1,
                boxShadow: "0 6px 14px rgba(79, 174, 145, 0.22)",
              }}
            >
              <span>{t("welcome", "tryDemo")}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Use My App (Secondary white outline button) */}
            <button
              id="btn-use-my-app"
              onClick={onUseMyApp}
              className="
                w-full max-w-[260px] h-11 sm:h-12
                text-[#2F8F72] hover:text-[#25735B] font-extrabold
                flex items-center justify-center gap-2
                rounded-[18px]
                active:scale-[0.98]
                transition-transform
                cursor-pointer text-[13px]
                bg-white border border-[#9FD6C2] hover:bg-neutral-50/50
              "
            >
              <span>{t("welcome", "startApp")}</span>
            </button>

            <p className="text-[9.5px] sm:text-[10px] text-neutral-500 font-semibold leading-relaxed text-center max-w-[250px]">
              {t("welcome", "disclaimer")}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WelcomeView;
