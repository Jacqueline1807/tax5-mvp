import React from "react";

interface AppFrameProps {
  children: React.ReactNode;
}

export const AppFrame: React.FC<AppFrameProps> = ({ children }) => {
  return (
    <div className="min-h-dvh w-full bg-[#F0F4F8] flex items-center justify-center py-0 md:py-4 px-0 sm:px-4 overflow-x-hidden">
      {/* Clean Mobile Web-App Container (Centres on desktop, full-width on mobile) */}
      <div className="w-full max-w-full md:max-w-[440px] min-h-dvh md:min-h-[680px] md:h-[90vh] md:max-h-[820px] bg-white md:rounded-[24px] md:shadow-xl md:border md:border-neutral-200/60 flex flex-col overflow-hidden relative mx-auto transition-all duration-300">
        
        {/* App Workspace Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-white flex flex-col w-full relative">
          {children}
        </div>

      </div>
    </div>
  );
};

