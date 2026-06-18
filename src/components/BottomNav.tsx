import React from "react";
import { Home, FileText, ClipboardList, MessageSquare } from "lucide-react";
import { ScreenType } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface BottomNavProps {
  activeScreen: ScreenType;
  onChangeScreen: (screen: ScreenType) => void;
  receiptCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  onChangeScreen,
  receiptCount,
}) => {
  const { t } = useLanguage();

  // We map the main navigation buttons to their respective screen states
  const navItems = [
    {
      id: "HOME" as ScreenType,
      label: t("common", "navHome"),
      idString: "home",
      icon: Home,
    },
    {
      id: "RECEIPT_LIST" as ScreenType,
      label: t("common", "navReceipts"),
      idString: "receipts",
      icon: FileText,
      badge: receiptCount,
    },
    {
      id: "ASK_TAX5" as ScreenType,
      label: t("common", "navAskTax5"),
      idString: "asktax5",
      icon: MessageSquare,
    },
    {
      id: "TAX_SUMMARY" as ScreenType,
      label: t("common", "navSummary"),
      idString: "summary",
      icon: ClipboardList,
    },
  ];

  // We should only render bottom nav on core screens (not on splash, welcome, or demo screening)
  const isExcludedScreen =
    activeScreen === "SPLASH" ||
    activeScreen === "WELCOME" ||
    activeScreen === "DEMO_ACCESS";

  if (isExcludedScreen) return null;

  return (
    <div className="w-full h-16 bg-white border-t border-neutral-100 flex items-center justify-around px-2 pb-1 shrink-0 select-none z-40">
      {navItems.map((item) => {
        const Icon = item.icon;
        
        // Active checking - map view modes appropriately
        const isActive = activeScreen === item.id || 
                         (item.id === "RECEIPT_LIST" && activeScreen === "RECEIPT_EDIT");

        return (
          <button
            key={item.id}
            id={`nav-tab-${item.idString}`}
            onClick={() => onChangeScreen(item.id)}
            className="flex flex-col items-center justify-center flex-1 h-full relative focus:outline-none group transition-all duration-200"
          >
            {/* Nav Icon Container */}
            <div className={`p-1 rounded-xl transition-all duration-200 ${isActive ? 'bg-teal-brand-light text-teal-brand scale-110' : 'text-neutral-400 group-hover:text-navy'}`}>
              <Icon className="w-5 h-5 stroke-[2.25]" />
            </div>

            {/* Nav Label */}
            <span
              className={`text-[10px] font-medium tracking-tight mt-0.5 transition-colors duration-200 ${
                isActive ? "text-teal-brand font-bold" : "text-neutral-500 group-hover:text-navy"
              }`}
            >
              {item.label}
            </span>

            {/* Badge counts (for receipts list) */}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute top-2 right-[calc(50%-18px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-brand px-1 text-[8.5px] font-bold text-white ring-2 ring-white animate-scaleIn">
                {item.badge}
              </span>
            )}

            {/* Small underline indicator */}
            {isActive && (
              <div className="absolute bottom-0 w-8 h-0.5 bg-teal-brand rounded-t-full"></div>
            )}
          </button>
        );
      })}
    </div>
  );
};
export default BottomNav;
