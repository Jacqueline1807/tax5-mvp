import { useState, useEffect } from "react";
import { AppFrame } from "./components/AppFrame";
import { BottomNav } from "./components/BottomNav";
import { SplashView } from "./components/SplashView";
import { WelcomeView } from "./components/WelcomeView";
import { DemoAccessView } from "./components/DemoAccessView";
import { HomeView } from "./components/HomeView";
import { AddScanView } from "./components/AddScanView";
import { ReceiptListView } from "./components/ReceiptListView";
import { ReceiptEditView } from "./components/ReceiptEditView";
import { TaxSummaryView } from "./components/TaxSummaryView";
import { SmartTaxSetupView } from "./components/SmartTaxSetupView";
import { AskTax5View } from "./components/AskTax5View";
import { Receipt, ScreenType, ClaimCategory, ClaimStatus, SmartSetupData } from "./types";
import { CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { adjustReceiptSuggestion } from "./utils/suggestionEngine";
import { taxReliefGuidelines } from "./data/taxReliefGuidelines";
import { SubscriptionModals } from "./components/SubscriptionModals";

// Local storage key helper
const LOCAL_STORAGE_KEY = "tax5_receipts_data";
const SMART_SETUP_LOCAL_STORAGE_KEY = "tax5_smart_setup";

interface AppUser {
  id?: string;
  name: string;
  email: string;
  isDemo?: boolean;
}

export default function App() {
  // Navigation State Coordinator
  const [activeScreen, setActiveScreen] = useState<ScreenType>("SPLASH");
  const [previousScreen, setPreviousScreen] = useState<ScreenType | null>(null);
  
  // Auth loading check state
  const [authLoading, setAuthLoading] = useState(true);

  // Subscription Simulated Plan States
  const [simulatedPlan, setSimulatedPlan] = useState<string>(() => {
    return localStorage.getItem("tax5_simulated_plan") || "Free Demo";
  });
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<string | null>(null);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const triggerUpgrade = () => {
    setSelectedPlanForUpgrade("Tax5 Pro");
  };
  
  // App User state
  const [user, setUser] = useState<AppUser | null>(null);
  
  // Loaded Receipt List in local memory
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  
  // Edit Buffer (Receipt selected for editing)
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);

  // Smart setup context
  const [smartSetup, setSmartSetup] = useState<SmartSetupData | null>(null);

  // Success / Info Toast Alert states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"SUCCESS" | "WARNING" | "DELETE">("SUCCESS");

  // Load and populate receipts, setup, and check auth on initial boot
  useEffect(() => {
    // Checking current active Supabase Auth Session
    const checkAuthOnLaunch = async () => {
      setAuthLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const profileName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
          setUser({
            id: session.user.id,
            name: profileName,
            email: session.user.email || "",
            isDemo: false
          });
          // Do not interrupt Splash screen
          setActiveScreen((current) => {
            if (current === "SPLASH") return current;
            return (current === "WELCOME" || current === "DEMO_ACCESS") ? "HOME" : current;
          });
        } else {
          // Fallback check if they are logged in as simulated Demo User
          const demoUserStr = localStorage.getItem("tax5_simulated_user");
          if (demoUserStr) {
            try {
              const demoUser = JSON.parse(demoUserStr);
              setUser({
                name: demoUser.name || "Demo User",
                email: demoUser.email || "demo@example.com",
                isDemo: true
              });
              // Do not interrupt Splash screen
              setActiveScreen((current) => {
                if (current === "SPLASH") return current;
                return (current === "WELCOME" || current === "DEMO_ACCESS") ? "HOME" : current;
              });
            } catch (e) {
              console.error(e);
            }
          }
        }
      } catch (err) {
        console.error("Failed checking Supabase session on startup:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuthOnLaunch();

    // Subscribe to session transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        // Clear all demo metadata keys completely on real user sign-in detection
        localStorage.removeItem("tax5_simulated_user");
        localStorage.removeItem("tax5_demo_user");
        localStorage.removeItem("tax5_demo_mode");
        localStorage.removeItem("demoMode");

        const profileName = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
        setUser({
          id: session.user.id,
          name: profileName,
          email: session.user.email || "",
          isDemo: false
        });
        setActiveScreen((current) => {
          if (current === "SPLASH") return current;
          return (current === "WELCOME" || current === "DEMO_ACCESS") ? "HOME" : current;
        });
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem("tax5_simulated_user");
        localStorage.removeItem("tax5_demo_user");
        localStorage.removeItem("tax5_demo_mode");
        localStorage.removeItem("demoMode");
        setUser(null);
        setActiveScreen("WELCOME");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync smartSetup dynamically whenever the user switches (authenticated vs demo vs logged out)
  useEffect(() => {
    if (!user) {
      setSmartSetup(null);
      return;
    }

    const key = user.isDemo 
      ? "tax5_smart_setup_demo" 
      : `tax5_smart_setup_user_${user.id || user.email}`;

    try {
      const rawSetup = localStorage.getItem(key);
      if (rawSetup) {
        setSmartSetup(JSON.parse(rawSetup));
      } else {
        setSmartSetup(null);
      }
    } catch (err) {
      console.error("Failed to parse tax5 smart setup for user:", err);
      setSmartSetup(null);
    }
  }, [user]);

  // Sync receipts dynamically whenever the user switches (authenticated vs demo vs logged out)
  useEffect(() => {
    if (!user) {
      setReceipts([]);
      return;
    }

    const key = user.isDemo 
      ? "tax5_receipts_demo" 
      : `tax5_receipts_user_${user.id || user.email}`;

    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData) {
        setReceipts(JSON.parse(serializedData));
      } else {
        if (!user.isDemo) {
          // Check for legacy global data to migrate on first real user sign-in
          const globalData = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (globalData) {
            const parsed = JSON.parse(globalData);
            setReceipts(parsed);
            localStorage.setItem(key, globalData);
          } else {
            setReceipts([]);
          }
        } else {
          setReceipts([]);
        }
      }
    } catch (err) {
      console.error("Failed to parse receipts for user:", err);
      setReceipts([]);
    }
  }, [user]);

  const handleLogout = async () => {
    const wasDemo = user?.isDemo;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signOut error:", err);
    }
    localStorage.removeItem("tax5_simulated_user");
    localStorage.removeItem("tax5_demo_mode");
    setUser(null);
    setActiveScreen("WELCOME");
    if (wasDemo) {
      showToastAlert("Exited Demo Mode.", "SUCCESS");
    } else {
      showToastAlert("Signed out successfully.", "SUCCESS");
    }
  };

  // Sync receipts to local storage whenever list expands/contracts
  const saveAndSyncReceipts = (updatedList: Receipt[]) => {
    setReceipts(updatedList);
    const key = user?.isDemo 
      ? "tax5_receipts_demo" 
      : user 
      ? `tax5_receipts_user_${user.id || user.email}` 
      : LOCAL_STORAGE_KEY;
    try {
      localStorage.setItem(key, JSON.stringify(updatedList));
    } catch (err) {
      console.error("Local storage sync error:", err);
      showToastAlert("Failed to save data to your device storage.", "WARNING");
    }
  };

  const handleSaveSmartSetup = (data: SmartSetupData) => {
    setSmartSetup(data);
    const key = !user 
      ? SMART_SETUP_LOCAL_STORAGE_KEY 
      : user.isDemo 
      ? "tax5_smart_setup_demo" 
      : `tax5_smart_setup_user_${user.id || user.email}`;

    try {
      localStorage.setItem(key, JSON.stringify(data));
      // Proactively update standard user context so that Home page handles name and email updates immediately too!
      if (user) {
        setUser({
          ...user,
          name: data.fullName || user.name,
          email: data.email || user.email
        });
      }

      // Re-evaluate existing receipts according to new profile answers
      const updatedReceiptList = receipts.map((r): Receipt => {
        if (r.category === ClaimCategory.Other && r.claimStatus === ClaimStatus.NonClaimable) {
          return r;
        }

        const guideline = r.formBEItem ? taxReliefGuidelines[r.formBEItem.toUpperCase()] : null;
        const baseStatus = guideline ? guideline.defaultStatus : ClaimStatus.CheckAgain;

        const adjustment = adjustReceiptSuggestion(
          r.formBEItem || "",
          r.category,
          baseStatus,
          data
        );

        return {
          ...r,
          claimStatus: adjustment.claimStatus,
          confidence: adjustment.confidence,
          suggestionWhy: adjustment.why,
          suggestionCheck: adjustment.check,
          updatedAt: new Date().toISOString()
        };
      });

      saveAndSyncReceipts(updatedReceiptList);

      showToastAlert("Smart Claim Profile updated & existing claims re-evaluated! ✨", "SUCCESS");
    } catch (err) {
      console.error("Failed to save smart setup context", err);
      showToastAlert("Failed to save setup data.", "WARNING");
    }
  };

  // Toast notifier helper with auto-clean timers
  const showToastAlert = (message: string, type: "SUCCESS" | "WARNING" | "DELETE" = "SUCCESS") => {
    setToastMessage(message);
    setToastType(type);
    
    const duration = type === "SUCCESS" ? 2200 : 2500;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, duration);
    return () => clearTimeout(timer);
  };

  // Add a new scanned receipt to stack
  const handleAddNewReceipt = (fields: Omit<Receipt, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = new Date().toISOString();
    const newReceipt: Receipt = {
      ...fields,
      id: "rec_" + Math.random().toString(36).substring(2, 9),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const newList = [newReceipt, ...receipts];
    saveAndSyncReceipts(newList);
    
    // Play Logo saved success state, and then auto-route to List or Home
    showToastAlert("Receipt saved!", "SUCCESS");
    
    // Auto redirect to lists so they inspect their saved asset immediately
    setActiveScreen("RECEIPT_LIST");
  };

  // Modify existing receipt details
  const handleUpdateReceipt = (id: string, updatedFields: Partial<Receipt>) => {
    const newList = receipts.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          ...updatedFields,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    saveAndSyncReceipts(newList);
    setEditingReceiptId(null);
    showToastAlert("Changes saved.", "SUCCESS");
    setActiveScreen("RECEIPT_LIST");
  };

  // Remove receipt completely from stack
  const handleDeleteReceipt = (id: string) => {
    const newList = receipts.filter((r) => r.id !== id);
    saveAndSyncReceipts(newList);
    showToastAlert("Receipt deleted.", "DELETE");
  };

  // Route back to edit view
  const handleTriggerEdit = (id: string) => {
    setEditingReceiptId(id);
    setActiveScreen("RECEIPT_EDIT");
  };

  // Match screen selection safely
  const renderActiveScreen = () => {
    switch (activeScreen) {
      case "SPLASH":
        return (
          <SplashView 
            onComplete={() => {
              if (!authLoading) {
                if (user) {
                  setActiveScreen("HOME");
                } else {
                  setActiveScreen("WELCOME");
                }
              } else {
                setActiveScreen("WELCOME");
              }
            }} 
          />
        );
      
      case "WELCOME":
        return (
          <WelcomeView 
            onTryDemo={() => {
              const defaultDemo = { name: "Demo User", email: "demo@example.com", isDemo: true };
              localStorage.setItem("tax5_simulated_user", JSON.stringify(defaultDemo));
              localStorage.setItem("tax5_demo_mode", "true");
              setUser(defaultDemo);
              setActiveScreen("HOME");
              showToastAlert("Welcome to Tax5 Demo Mode! ✨", "SUCCESS");
            }}
            onUseMyApp={() => {
              setActiveScreen("DEMO_ACCESS");
            }}
          />
        );
      
      case "DEMO_ACCESS":
        return (
          <DemoAccessView
            onContinue={(authData) => {
              if (authData && authData.user) {
                // Real Supabase User successful sign-in
                localStorage.removeItem("tax5_simulated_user");
                localStorage.removeItem("tax5_demo_user");
                localStorage.removeItem("tax5_demo_mode");
                localStorage.removeItem("demoMode");

                const profileName = authData.user.user_metadata?.full_name || authData.user.email?.split("@")[0] || "User";
                setUser({
                  id: authData.user.id,
                  name: profileName,
                  email: authData.user.email || "",
                  isDemo: false
                });
              } else {
                // Explicitly launching default Demo Mode
                const demoUserStr = localStorage.getItem("tax5_simulated_user");
                if (demoUserStr) {
                  try {
                    const demoUser = JSON.parse(demoUserStr);
                    setUser({
                      name: demoUser.name || "Demo User",
                      email: demoUser.email || "demo@example.com",
                      isDemo: true
                    });
                  } catch (e) {
                    setUser({ name: "Demo User", email: "demo@example.com", isDemo: true });
                  }
                } else {
                  const defaultDemo = { name: "Demo User", email: "demo@example.com", isDemo: true };
                  localStorage.setItem("tax5_simulated_user", JSON.stringify(defaultDemo));
                  setUser(defaultDemo);
                }
              }
              setActiveScreen("HOME");
            }}
            onBack={() => setActiveScreen("WELCOME")}
          />
        );
      
      case "HOME":
        return (
          <HomeView
            receipts={receipts}
            smartSetup={smartSetup}
            userName={user?.name}
            userEmail={user?.email}
            isDemo={user?.isDemo}
            onLogout={handleLogout}
            onNavigateToScan={() => {
              setPreviousScreen("HOME");
              setActiveScreen("ADD_SCAN");
            }}
            onNavigateToList={() => setActiveScreen("RECEIPT_LIST")}
            onNavigateToSummary={() => setActiveScreen("TAX_SUMMARY")}
            onNavigateToSetup={() => setActiveScreen("SMART_SETUP")}
            onNavigateToAsk={() => setActiveScreen("ASK_TAX5")}
            simulatedPlan={simulatedPlan}
            setIsPricingOpen={setIsPricingOpen}
            setSelectedPlanForUpgrade={setSelectedPlanForUpgrade}
          />
        );
      
      case "ASK_TAX5":
        return (
          <AskTax5View
            onBackToHome={() => setActiveScreen("HOME")}
            userId={user?.id}
            isDemo={user?.isDemo}
            simulatedPlan={simulatedPlan}
            onTriggerUpgrade={triggerUpgrade}
          />
        );
      
      case "ADD_SCAN":
        return (
          <AddScanView
            onSaveReceipt={handleAddNewReceipt}
            onCancel={() => setActiveScreen(previousScreen || "HOME")}
            smartSetup={smartSetup}
            isDemo={user?.isDemo}
            simulatedPlan={simulatedPlan}
            onTriggerUpgrade={triggerUpgrade}
            receiptsCount={receipts.length}
          />
        );
      
      case "RECEIPT_LIST":
        return (
          <ReceiptListView
            receipts={receipts}
            onEditReceipt={handleTriggerEdit}
            onDeleteReceipt={handleDeleteReceipt}
            onNavigateToScan={() => {
              setPreviousScreen("RECEIPT_LIST");
              setActiveScreen("ADD_SCAN");
            }}
            onNavigateToSetup={() => setActiveScreen("SMART_SETUP")}
          />
        );
      
      case "RECEIPT_EDIT":
        const editTarget = receipts.find((r) => r.id === editingReceiptId);
        if (!editTarget) {
          // Fallback if target lost
          setActiveScreen("RECEIPT_LIST");
          return null;
        }
        return (
          <ReceiptEditView
            receipt={editTarget}
            onSave={handleUpdateReceipt}
            onCancel={() => {
              setEditingReceiptId(null);
              setActiveScreen("RECEIPT_LIST");
            }}
          />
        );
      
      case "TAX_SUMMARY":
        return (
          <TaxSummaryView
            receipts={receipts}
            smartSetup={smartSetup}
            onBackToHome={() => setActiveScreen("HOME")}
            onNavigateToScan={() => {
              setPreviousScreen("TAX_SUMMARY");
              setActiveScreen("ADD_SCAN");
            }}
            onNavigateToSetup={() => setActiveScreen("SMART_SETUP")}
            currentUser={user}
            onSaveSmartSetup={handleSaveSmartSetup}
            simulatedPlan={simulatedPlan}
            onTriggerUpgrade={triggerUpgrade}
          />
        );

      case "SMART_SETUP":
        return (
          <SmartTaxSetupView
            initialData={smartSetup}
            onSave={handleSaveSmartSetup}
            onCancel={() => setActiveScreen("HOME")}
            currentUser={user}
            receipts={receipts}
          />
        );
      
      default:
        return <SplashView onComplete={() => setActiveScreen("WELCOME")} />;
    }
  };

  return (
    <AppFrame>
      {/* Dynamic Pop-up Success / Warning / Delete Floating Banner */}
      {toastMessage && (
        <div className="absolute top-14 left-4 right-4 z-[99] flex items-center justify-center pointer-events-none animate-slideDown">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border w-fit ${
              toastType === "SUCCESS"
                ? "bg-teal-brand text-navy border-teal-brand ring-4 ring-teal-brand/15"
                : toastType === "DELETE"
                ? "bg-red-500 text-white border-red-500 ring-4 ring-red-500/15"
                : "bg-amber-brand text-navy border-amber-brand ring-4 ring-amber-brand/15"
            }`}
          >
            {toastType === "SUCCESS" && (
              <CheckCircle2 className="w-5 h-5 text-navy shrink-0 animate-bounce" />
            )}
            {toastType === "DELETE" && (
              <Trash2 className="w-5 h-5 text-white shrink-0 animate-pulse" />
            )}
            {toastType === "WARNING" && (
              <AlertTriangle className="w-5 h-5 text-navy shrink-0 animate-pulse" />
            )}
            <span className="text-xs font-extrabold tracking-wide">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Embedded view renderer */}
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden no-scrollbar relative">
        {renderActiveScreen()}
      </div>

      {/* Mobile Botton bar persistent nav buttons */}
      <BottomNav
        activeScreen={activeScreen}
        onChangeScreen={(screen) => setActiveScreen(screen)}
        receiptCount={receipts.length}
      />

      {/* Subscription/Billing/Upgrade validation overlay components */}
      <SubscriptionModals
        isPricingOpen={isPricingOpen}
        setIsPricingOpen={setIsPricingOpen}
        simulatedPlan={simulatedPlan}
        setSimulatedPlan={setSimulatedPlan}
        selectedPlanForUpgrade={selectedPlanForUpgrade}
        setSelectedPlanForUpgrade={setSelectedPlanForUpgrade}
        isSuccessOpen={isSuccessOpen}
        setIsSuccessOpen={setIsSuccessOpen}
      />
    </AppFrame>
  );
}
