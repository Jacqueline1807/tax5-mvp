import React, { useState } from "react";
import { Logo } from "./Logo";
import { User, Mail, Lock, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

interface DemoAccessViewProps {
  onContinue: (authData?: { user: any; session: any }) => void;
  onBack: () => void;
}

type ScreenType = "LOGIN" | "SIGNUP";

export const DemoAccessView: React.FC<DemoAccessViewProps> = ({ onContinue, onBack }) => {
  const { t } = useLanguage();
  const [screen, setScreen] = useState<ScreenType>("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [forgotActive, setForgotActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setForgotActive(false);
  };

  const handleToggleScreen = (target: ScreenType) => {
    resetMessages();
    setScreen(target);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg(t("demoAccess", "errEmail"));
      return;
    }
    if (!password) {
      setErrorMsg(t("demoAccess", "errPass"));
      return;
    }
    if (screen === "SIGNUP" && !name) {
      setErrorMsg(t("demoAccess", "errName"));
      return;
    }

    setIsLoading(true);

    try {
      if (screen === "LOGIN") {
        setSuccessMsg(t("demoAccess", "msgLoggingIn"));
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        // Successfully signed in
        onContinue({ user: data.user, session: data.session });
      } else {
        setSuccessMsg(t("demoAccess", "msgCreating"));
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          setSuccessMsg(t("demoAccess", "msgSuccessIn"));
          onContinue({ user: data.user, session: data.session });
        } else {
          setSuccessMsg(t("demoAccess", "msgSuccessVerify"));
          setEmail("");
          setPassword("");
          setName("");
          setScreen("LOGIN");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMsg(error.message || "An authentication error occurred.");
      setSuccessMsg("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setForgotActive(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F9FA] p-3.5 min-[370px]:p-4 text-center shrink-0 relative overflow-y-auto overflow-x-hidden select-none">
      {/* Circular background blobs */}
      <div className="absolute top-[-5%] left-[-15%] w-[220px] h-[220px] rounded-full bg-[#E5F5EF] blur-[85px] opacity-75 pointer-events-none z-0"></div>
      <div className="absolute bottom-[8%] right-[-10%] w-[200px] h-[200px] rounded-full bg-[#FFFBE3] blur-[75px] opacity-45 pointer-events-none z-0"></div>

      {/* 1. Top Section: Back navigation bar with Language Toggle */}
      <div className="relative z-10 pt-0.5 pb-1 flex justify-between items-center shrink-0">
        <button 
          onClick={onBack}
          className="text-[13px] font-bold text-neutral-500 hover:text-navy cursor-pointer py-1 px-2 rounded-lg hover:bg-neutral-100/55 transition-colors flex items-center gap-1 select-none border-none bg-transparent"
        >
          <span className="text-[13px] font-bold leading-none">←</span>
          <span>{t("common", "back")}</span>
        </button>
        <LanguageToggle />
      </div>

      {/* 2. Middle Section: Dynamic scrolling workspace for Brand Headers and Form Cards */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center overflow-y-auto overflow-x-hidden no-scrollbar min-h-0 py-1 w-full max-w-[325px] min-[370px]:max-w-[345px] mx-auto animate-fadeIn">
        <div className="w-full space-y-2.5 my-auto">
          {/* Logo and Headings Group */}
          <div className="text-center space-y-1">
            <div className="flex justify-center transition-transform hover:scale-105 duration-200">
              <Logo size="md" className="!w-[92px] min-[370px]:!w-[102px]" showText={true} />
            </div>
            <div className="space-y-0.5">
              <h1 className="font-heading font-extrabold text-[18px] min-[370px]:text-[20px] text-navy tracking-tight leading-tight select-none">
                {screen === "LOGIN" ? t("demoAccess", "loginTitle") : t("demoAccess", "signupTitle")}
              </h1>
              <p className="text-[11.5px] min-[370px]:text-[12.5px] text-neutral-500 leading-normal max-w-[260px] mx-auto font-semibold select-none">
                {t("demoAccess", "subtitle")}
              </p>
            </div>
          </div>

          {/* Highlight Notifications */}
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200/60 text-red-600 text-[12px] font-bold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-teal-50 border border-teal-200/60 text-teal-850 text-[12px] font-bold rounded-xl text-center animate-pulse">
              {successMsg}
            </div>
          )}

          {forgotActive && (
            <div className="p-2.5 bg-neutral-50 border border-neutral-200 text-neutral-600 text-[12px] rounded-xl text-left leading-normal space-y-0.5 animate-fadeIn">
              <div className="font-bold flex items-center gap-1 text-navy">
                <HelpCircle className="w-3.5 h-3.5 text-[#4FAE91]" />
                {t("demoAccess", "forgotPassTitle")}
              </div>
              <p className="font-semibold text-neutral-500 text-[11px]">
                {t("demoAccess", "forgotPassDesc")}
              </p>
            </div>
          )}

          {/* Compact white card for the form */}
          <div className="bg-white border border-[#EBEFEF] rounded-[16px] p-3.5 min-[370px]:p-4 shadow-sm space-y-2.5">
            <form onSubmit={handleFormSubmit} className="space-y-2.5">
              
              {/* Full Name input for SIGNUP screen */}
              {screen === "SIGNUP" && (
                <div className="space-y-1 text-left">
                  <label className="text-[12px] font-bold text-navy/80 block select-none">
                    {t("demoAccess", "nameLabel")}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                      <User className="w-[15px] h-[15px]" />
                    </span>
                    <input
                      type="text"
                      placeholder={t("demoAccess", "namePlace")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                      className="w-full h-[40px] pl-[34px] pr-3 bg-white border border-neutral-200 rounded-xl text-[13px] font-semibold text-navy placeholder-neutral-400 focus:outline-[#4FAE91] focus:outline-offset-0 focus:border-[#4FAE91] transition-colors shadow-sm"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1 text-left">
                <label className="text-[12px] font-bold text-navy/80 block select-none">
                  {t("demoAccess", "emailLabel")}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <Mail className="w-[15px] h-[15px]" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder={t("demoAccess", "emailPlace")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-[40px] pl-[34px] pr-3 bg-white border border-neutral-200 rounded-xl text-[13px] font-semibold text-navy placeholder-neutral-400 focus:outline-[#4FAE91] focus:outline-offset-0 focus:border-[#4FAE91] transition-colors shadow-sm"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center pr-0.5">
                  <label className="text-[12px] font-bold text-navy/80 block select-none">
                    {t("demoAccess", "passLabel")}
                  </label>
                  {screen === "LOGIN" && (
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11.5px] font-extrabold text-[#4FAE91] hover:text-[#459E84] hover:underline cursor-pointer py-0.5 px-0.5 rounded border-none bg-transparent"
                    >
                      {t("demoAccess", "forgotPass")}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-[#A3A3A3]">
                    <Lock className="w-[15px] h-[15px]" />
                  </span>
                  <input
                    type="password"
                    placeholder={t("demoAccess", "passPlace")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-[40px] pl-[34px] pr-3 bg-white border border-neutral-200 rounded-xl text-[13px] font-semibold text-navy placeholder-neutral-400 focus:outline-[#4FAE91] focus:outline-offset-0 focus:border-[#4FAE91] transition-colors shadow-sm"
                  />
                </div>
              </div>

              {/* Solid Brand Primary Button - Visually paired with Welcome screen */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[40px] bg-[#4FAE91] hover:bg-[#459E84] text-white font-extrabold flex items-center justify-center gap-1.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer text-[13px] border-none select-none mt-1 shadow-sm disabled:opacity-75 disabled:pointer-events-none"
              >
                <span>{screen === "LOGIN" ? t("demoAccess", "loginBtn") : t("demoAccess", "signupBtn")}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </form>

            {/* Toggle Screen Option */}
            <div className="text-center pt-0.5 text-[12.5px] text-neutral-500 font-semibold select-none">
              {screen === "LOGIN" ? (
                <span>
                  {t("demoAccess", "signupPrompt")}{" "}
                  <button 
                    type="button"
                    onClick={() => handleToggleScreen("SIGNUP")}
                    className="text-[#4FAE91] hover:text-[#459E84] font-extrabold hover:underline cursor-pointer border-none bg-transparent p-0"
                  >
                    {t("demoAccess", "signupToggle")}
                  </button>
                </span>
              ) : (
                <span>
                  {t("demoAccess", "loginPrompt")}{" "}
                  <button 
                    type="button"
                    onClick={() => handleToggleScreen("LOGIN")}
                    className="text-[#4FAE91] hover:text-[#459E84] font-extrabold hover:underline cursor-pointer border-none bg-transparent p-0"
                  >
                    {t("demoAccess", "loginToggle")}
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Anchor sandbox demo text and option securely */}
      <div className="relative z-10 pt-1 pb-0.5 shrink-0 flex flex-col items-center space-y-0.5">
        <button
          id="btn-continue-demo"
          onClick={onContinue}
          className="text-[13px] font-extrabold text-[#4FAE91] hover:text-[#459E84] hover:underline cursor-pointer inline-flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-neutral-100/10 transition-all text-center select-none border-none bg-transparent"
        >
          <span>{t("demoAccess", "tryDemoBtn")} →</span>
        </button>
        
        <p className="text-[10.5px] text-neutral-400 font-semibold leading-relaxed max-w-[250px] mx-auto select-none text-center">
          {t("demoAccess", "demoDisclaimer")}
        </p>
      </div>
    </div>
  );
};

export default DemoAccessView;
