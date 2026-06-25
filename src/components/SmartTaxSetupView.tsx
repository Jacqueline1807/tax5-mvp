import React, { useState, useEffect, useRef } from "react";
import { SmartSetupData, ClaimCategory, Receipt } from "../types";
import { useLanguage } from "../context/LanguageContext";
import {
  User,
  Briefcase,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Building,
  Calendar,
  AlertTriangle,
  X,
  Check,
  FileText,
  Lock,
  ShieldCheck,
  BarChart3,
  Sliders,
  DollarSign,
  Heart,
  Baby,
  Activity,
  Maximize2,
  HelpCircle
} from "lucide-react";

interface Employer {
  id: string;
  name: string;
  tin: string;
  period: string;
  income: number;
  mtd: number;
  taxBorne: "Yes" | "No";
  epf?: number;
  socso?: number;
  eis?: number;
  docType?: "EA form" | "EC form";
}

interface SmartTaxSetupViewProps {
  initialData: SmartSetupData | null;
  onSave: (data: SmartSetupData) => void;
  onCancel: () => void;
  currentUser?: { id?: string; name: string; email: string; isDemo?: boolean } | null;
  receipts?: Receipt[];
}

export const SmartTaxSetupView: React.FC<SmartTaxSetupViewProps> = ({
  initialData,
  onSave,
  onCancel,
  currentUser,
  receipts = [],
}) => {
  const { language, t } = useLanguage();

  // Setup view state: "hub" | "profile" | "employment" | "claimsReview"
  const [viewMode, setViewMode] = useState<"hub" | "profile" | "employment" | "claimsReview">("profile");

  // Custom spouse situation dropdown state
  const [isSpouseDropdownOpen, setIsSpouseDropdownOpen] = useState(false);
  const [isA6DropdownOpen, setIsA6DropdownOpen] = useState(false);
  const [isG14DropdownOpen, setIsG14DropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isSituationDropdownOpen, setIsSituationDropdownOpen] = useState(false);

  // Keep a robust reactive local copy of SmartSetupData
  const [formData, setFormData] = useState<SmartSetupData>(() => {
    const fresh: SmartSetupData = {
      fullName: "",
      email: "",
      yearOfAssessment: "YA 2026",
      tin: "",
      identificationNumber: "",
      dateOfBirth: "",
      gender: "",
      salariedBE: "Yes",
      eaUploadName: "",
      availableContributions: ["EPF / KWSP", "SOCSO / PERKESO", "EIS / SIP"],
      annualEmploymentIncome: "",
      numberOfEmployments: "",
      pcbPaid: "",
      epfAmount: "",
      socsoAmount: "",
      eisAmount: "",
      childrenCount: "0",
      childDetails: [],
      supportingParents: "No",
      spouseSituation: "None",
      disabilityJoint: [],
      medicalCertificateUploadName: "",
      medicalReceiptTypes: [],
      insuranceRecords: [],
      insuranceStatementUploadName: "",
      firstHomeBought: "No",
      homeOtherReliefs: [],
      homeUploadName: "",
      hasChildUnder18: "No",
      hasChildUnder6: "No",
      hasChildUnder2: "No",
      hasChild18Studying: "No",
      hasDisabledChild: "No",
      registeredDisabled: "No",
      seriousDiseaseTreatment: "No",
      fertilityTreatment: "No",
      vaccinationDentalCheckup: "No",
      mentalHealthConsultation: "No",
      childLearningDisability: "No",
      lifeInsuranceFamilyTakaful: "No",
      medicalEducationInsurance: "No",
      prsDeferredAnnuity: "No",
      sspnSavingsChild: "No",
      firstResidentialProperty: "No",
      evChargingFacility: "No",
      compostingMachine: "No",
      approvedDonationsGifts: "No",
      departureLevyReligious: "No",
      maritalStatus: "Single",
      maritalStatusA4: "Single",
      spouseAssessmentSituation: "My spouse has income",
      spouseAssessmentChoice: "Separately from my spouse",
      disabledSpouse: "No",
      paidAlimony: "No",
      assessmentTypeA6: "5", // default to Self only if Single
      spouseReliefG14Type: "not_applicable",
      disabledSpouseG15: "No",
      alimonyFormerWifeG14: "No"
    };

    if (initialData) {
      const merged = { ...fresh, ...initialData };
      
      // Ensure maritalStatus and maritalStatusA4 are properly initialized and in sync
      if (merged.maritalStatusA4) {
        if (merged.maritalStatusA4 === "Single") {
          merged.maritalStatus = "Single";
        } else if (merged.maritalStatusA4 === "Married") {
          merged.maritalStatus = "Married";
        } else if (merged.maritalStatusA4 === "Divorcee") {
          merged.maritalStatus = "Divorced";
        } else if (merged.maritalStatusA4 === "Widow / Widower") {
          merged.maritalStatus = "Widowed";
        } else if (merged.maritalStatusA4 === "Not sure yet") {
          merged.maritalStatus = "Not sure";
        }
      } else if (merged.maritalStatus) {
        if (merged.maritalStatus === "Single") {
          merged.maritalStatusA4 = "Single";
        } else if (merged.maritalStatus === "Married") {
          merged.maritalStatusA4 = "Married";
        } else if (merged.maritalStatus === "Divorced") {
          merged.maritalStatusA4 = "Divorcee";
        } else if (merged.maritalStatus === "Widowed") {
          merged.maritalStatusA4 = "Widow / Widower";
        } else if (merged.maritalStatus === "Not sure") {
          merged.maritalStatusA4 = "Not sure yet";
        }
      } else {
        merged.maritalStatus = "Single";
        merged.maritalStatusA4 = "Single";
      }

      // Initialize alimonyFormerWifeG14 based on spouseReliefG14Type
      if (!merged.alimonyFormerWifeG14) {
        if (merged.spouseReliefG14Type === "formal_alimony") {
          merged.alimonyFormerWifeG14 = "Yes";
        } else if (merged.spouseReliefG14Type === "not_sure") {
          merged.alimonyFormerWifeG14 = "Not sure";
        } else {
          merged.alimonyFormerWifeG14 = "No";
        }
      }

      // Safely map old/legacy values if they are present and new ones aren't populated yet
      if (merged.spouseSituation) {
        if (!merged.assessmentTypeA6) {
          if (merged.spouseSituation === "None") {
            merged.assessmentTypeA6 = merged.maritalStatus === "Single" ? "5" : "3";
          } else if (merged.spouseSituation === "Spouse with no income") {
            merged.assessmentTypeA6 = "4"; // Married, spouse has no income
            if (!merged.spouseReliefG14Type) {
              merged.spouseReliefG14Type = "spouse_no_income";
            }
          } else if (merged.spouseSituation === "Paying alimony") {
            merged.assessmentTypeA6 = merged.maritalStatus === "Single" ? "5" : "3";
            if (!merged.spouseReliefG14Type) {
              merged.spouseReliefG14Type = "formal_alimony";
            }
          } else if (merged.spouseSituation === "Not sure") {
            merged.assessmentTypeA6 = "unknown";
            if (!merged.spouseReliefG14Type) {
              merged.spouseReliefG14Type = "not_sure";
            }
          }
        }
      }
      
      if (merged.disabledSpouse && !merged.disabledSpouseG15) {
        merged.disabledSpouseG15 = merged.disabledSpouse === "Yes" ? "Yes" : merged.disabledSpouse === "No" ? "No" : "Not sure";
      }

      if (!merged.assessmentTypeA6) {
        merged.assessmentTypeA6 = (merged.maritalStatus === "Single" || merged.maritalStatus === "Divorced" || merged.maritalStatus === "Widowed") ? "5" : "3";
      }
      if (!merged.spouseReliefG14Type) {
        merged.spouseReliefG14Type = "not_applicable";
      }
      if (!merged.disabledSpouseG15) {
        merged.disabledSpouseG15 = "No";
      }

      return merged;
    }
    return fresh;
  });

  // Dynamic storage key helper for EA employers
  const getEmployersKey = (user: any) => {
    if (!user) return "tax5_ea_employers";
    return user.isDemo 
      ? "tax5_ea_employers_demo" 
      : `tax5_ea_employers_user_${user.id || user.email}`;
  };

  const [employers, setEmployers] = useState<Employer[]>([]);

  // Sync employers state with the active user context
  useEffect(() => {
    try {
      const key = getEmployersKey(currentUser);
      const raw = localStorage.getItem(key);
      setEmployers(raw ? JSON.parse(raw) : []);
    } catch (e) {
      setEmployers([]);
    }
  }, [currentUser]);

  // Load and sync name and email from setup or active currentUser
  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.name || "",
        email: prev.email || currentUser.email || "",
      }));
    } else {
      try {
        const rawUser = localStorage.getItem("tax5_simulated_user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          setFormData((prev) => ({
            ...prev,
            fullName: prev.fullName || parsed.name || "",
            email: prev.email || parsed.email || "",
          }));
        }
      } catch (e) {}
    }
  }, [currentUser, initialData]);

  // Personal Profile collapsible sections: "family" | "health" | "lifestyle" | "insurance" | "other"
  const [profileSection, setProfileSection] = useState<"family" | "health" | "lifestyle" | "insurance" | "other">("family");
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  // Bottom drawer helper details setup
  const [activeHelp, setActiveHelp] = useState<{
    title: string;
    description: string;
    proof?: string;
    meaning?: string;
  } | null>(null);

  // Form states for creating/editing employer record
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmpDocType, setNewEmpDocType] = useState<"EA form" | "EC form">("EA form");
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpTin, setNewEmpTin] = useState("");
  const [newEmpPeriod, setNewEmpPeriod] = useState("01/01 - 31/12");
  const [newEmpIncome, setNewEmpIncome] = useState("");
  const [newEmpMtd, setNewEmpMtd] = useState("");
  const [newEmpEpf, setNewEmpEpf] = useState("");
  const [newEmpSocso, setNewEmpSocso] = useState("");
  const [newEmpEis, setNewEmpEis] = useState("");
  const [newEmpTaxBorne, setNewEmpTaxBorne] = useState<"Yes" | "No">("No");

  // Toast and autosave helpers
  const [showSavedToast, setShowSavedToast] = useState(false);
  const toastTimeoutRef = useRef<any>(null);

  const triggerAutosave = (newFormData: SmartSetupData) => {
    try {
      const rawUser = localStorage.getItem("tax5_simulated_user");
      let currentUserObj = { name: newFormData.fullName, email: newFormData.email };
      if (rawUser) {
        currentUserObj = { ...JSON.parse(rawUser), name: newFormData.fullName, email: newFormData.email };
      }
      localStorage.setItem("tax5_simulated_user", JSON.stringify(currentUserObj));
    } catch (e) {}

    onSave(newFormData);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setShowSavedToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowSavedToast(false);
    }, 1500);
  };

  const selectMainSpouse = (choice: "Yes" | "No" | "Not sure") => {
    setFormData((prev) => {
      const updated = { ...prev };
      
      const previousChoice = (
        prev.maritalStatus === "Married" 
          ? "Yes" 
          : (prev.maritalStatus === "Single" || prev.maritalStatus === "Divorced" || prev.maritalStatus === "Widowed")
            ? "No"
            : prev.maritalStatus === "Not sure"
              ? "Not sure"
              : ""
      );

      if (previousChoice === choice) return prev;

      if (choice === "Yes") {
        // No / Not sure changes to Yes
        // Clear Single/Divorcee/Widow-Widower selection and alimony answer
        updated.maritalStatus = "Married";
        updated.maritalStatusA4 = "Married";
        updated.alimonyFormerWifeG14 = "No";
        updated.paidAlimony = "No";
        updated.spouseReliefG14Type = "not_applicable";
        updated.spouseSituation = "None";
        updated.spouseAssessmentChoice = "Separately from my spouse";
        
        // Default married assessment
        updated.assessmentTypeA6 = "3"; // Separate assessment
        updated.disabledSpouseG15 = "No";
        updated.disabledSpouse = "No";
      } else if (choice === "No") {
        // Yes / Not sure changes to No
        // If Yes changes to No, clear married assessment and disabled spouse
        updated.maritalStatus = "Single";
        updated.maritalStatusA4 = "Single";
        updated.assessmentTypeA6 = "5"; // Self only
        updated.disabledSpouseG15 = "No";
        updated.disabledSpouse = "No";
        
        // Clear alimony answer
        updated.alimonyFormerWifeG14 = "No";
        updated.paidAlimony = "No";
        updated.spouseReliefG14Type = "not_applicable";
        updated.spouseSituation = "None";
        updated.spouseAssessmentChoice = "Separately from my spouse";
      } else if (choice === "Not sure") {
        // Not sure was selected, clear all dependent spouse details
        updated.maritalStatus = "Not sure";
        updated.maritalStatusA4 = "Not sure yet";
        updated.assessmentTypeA6 = "unknown";
        updated.disabledSpouseG15 = "No";
        updated.disabledSpouse = "No";
        updated.alimonyFormerWifeG14 = "No";
        updated.paidAlimony = "No";
        updated.spouseReliefG14Type = "not_applicable";
        updated.spouseSituation = "None";
        updated.spouseAssessmentChoice = "Not sure yet";
      }

      triggerAutosave(updated);
      return updated;
    });
  };

  const selectNoSituationOption = (value: "Single" | "Divorcee" | "Widow / Widower" | "Not sure yet") => {
    setFormData((prev) => {
      const updated = { ...prev };

      if (value === "Single") {
        updated.maritalStatus = "Single";
        updated.maritalStatusA4 = "Single";
        updated.assessmentTypeA6 = "5"; // Set assessment as self-only
        // Hide alimony question (and clear it)
        updated.alimonyFormerWifeG14 = "No";
        updated.paidAlimony = "No";
        updated.spouseReliefG14Type = "not_applicable";
        updated.spouseSituation = "None";
        // Hide disabled spouse
        updated.disabledSpouseG15 = "No";
        updated.disabledSpouse = "No";
      } else if (value === "Widow / Widower") {
        updated.maritalStatus = "Widowed";
        updated.maritalStatusA4 = "Widow / Widower";
        updated.assessmentTypeA6 = "5"; // Set assessment as self-only
        // Hide alimony question (and clear it)
        updated.alimonyFormerWifeG14 = "No";
        updated.paidAlimony = "No";
        updated.spouseReliefG14Type = "not_applicable";
        updated.spouseSituation = "None";
        // Hide disabled spouse
        updated.disabledSpouseG15 = "No";
        updated.disabledSpouse = "No";
      } else if (value === "Divorcee") {
        updated.maritalStatus = "Divorced";
        updated.maritalStatusA4 = "Divorcee";
        updated.assessmentTypeA6 = "5"; // Set assessment as self-only
        // Reset alimony initially or default to No
        updated.alimonyFormerWifeG14 = "No";
        updated.paidAlimony = "No";
        updated.spouseReliefG14Type = "not_applicable";
        updated.spouseSituation = "None";
        // Hide disabled spouse
        updated.disabledSpouseG15 = "No";
        updated.disabledSpouse = "No";
      } else if (value === "Not sure yet") {
        updated.maritalStatus = "Not sure";
        updated.maritalStatusA4 = "Not sure yet";
        updated.assessmentTypeA6 = "5"; // Self-only
        // Hide alimony question
        updated.alimonyFormerWifeG14 = "No";
        updated.paidAlimony = "No";
        updated.spouseReliefG14Type = "not_applicable";
        updated.spouseSituation = "None";
        // Hide disabled spouse
        updated.disabledSpouseG15 = "No";
        updated.disabledSpouse = "No";
      }

      triggerAutosave(updated);
      return updated;
    });
  };

  // Sync state helpers
  const handleProfileFieldChange = (field: keyof SmartSetupData, value: any) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Handle marital status switches and sync defaults
      if (field === "maritalStatus" || field === "maritalStatusA4") {
        const statusValue = value;
        let mappedMarital: "Single" | "Married" | "Divorced" | "Widowed" | "Not sure" = "Single";
        let mappedA4 = "Single";

        if (statusValue === "Single") {
          mappedMarital = "Single";
          mappedA4 = "Single";
        } else if (statusValue === "Married") {
          mappedMarital = "Married";
          mappedA4 = "Married";
        } else if (statusValue === "Divorced" || statusValue === "Divorcee") {
          mappedMarital = "Divorced";
          mappedA4 = "Divorcee";
        } else if (statusValue === "Widowed" || statusValue === "Widow / Widower") {
          mappedMarital = "Widowed";
          mappedA4 = "Widow / Widower";
        } else if (statusValue === "Not sure" || statusValue === "Not sure yet") {
          mappedMarital = "Not sure";
          mappedA4 = "Not sure yet";
        }

        updated.maritalStatus = mappedMarital;
        updated.maritalStatusA4 = mappedA4;

        if (mappedMarital === "Single" || mappedMarital === "Widowed") {
          // Clear married assessment, disabled spouse, and alimony
          updated.assessmentTypeA6 = "5"; // Self Only
          updated.spouseSituation = "None";
          updated.spouseAssessmentChoice = "Separately from my spouse";
          updated.spouseReliefG14Type = "not_applicable";
          updated.alimonyFormerWifeG14 = "No";
          updated.disabledSpouseG15 = "No";
          updated.disabledSpouse = "No";
        } else if (mappedMarital === "Divorced") {
          // Divorcee - Self Only but can have alimony
          updated.assessmentTypeA6 = "5"; // Self Only
          updated.spouseSituation = "None";
          updated.spouseAssessmentChoice = "Separately from my spouse";
          updated.disabledSpouseG15 = "No";
          updated.disabledSpouse = "No";
          if (!updated.alimonyFormerWifeG14) {
            updated.alimonyFormerWifeG14 = "No";
          }
          updated.spouseReliefG14Type = updated.alimonyFormerWifeG14 === "Yes" ? "formal_alimony" : updated.alimonyFormerWifeG14 === "Not sure" ? "not_sure" : "not_applicable";
          if (updated.spouseReliefG14Type === "formal_alimony") {
            updated.spouseSituation = "Paying alimony";
          }
        } else if (mappedMarital === "Married") {
          // Married - default separate filing initially
          updated.assessmentTypeA6 = "3"; // Separate assessment
          updated.spouseSituation = "None";
          updated.spouseAssessmentChoice = "Separately from my spouse";
          updated.spouseReliefG14Type = "not_applicable";
          updated.alimonyFormerWifeG14 = "No";
          updated.disabledSpouseG15 = "No";
          updated.disabledSpouse = "No";
        } else if (mappedMarital === "Not sure") {
          // Not sure yet - Needs Review
          updated.assessmentTypeA6 = "unknown";
          updated.spouseSituation = "Not sure";
          updated.spouseAssessmentChoice = "Not sure yet";
          updated.spouseReliefG14Type = "not_applicable";
          updated.alimonyFormerWifeG14 = "No";
          updated.disabledSpouseG15 = "No";
          updated.disabledSpouse = "No";
        }
      }

      // Sync alimonyFormerWifeG14
      if (field === "alimonyFormerWifeG14") {
        if (value === "Yes") {
          updated.spouseReliefG14Type = "formal_alimony";
          updated.spouseSituation = "Paying alimony";
        } else if (value === "Not sure") {
          updated.spouseReliefG14Type = "not_sure";
          updated.spouseSituation = "None";
        } else {
          updated.spouseReliefG14Type = "not_applicable";
          updated.spouseSituation = "None";
        }
      }

      // Sync disabledSpouseG15
      if (field === "disabledSpouseG15") {
        updated.disabledSpouse = value;
      }

      // Sync assessmentTypeA6
      if (field === "assessmentTypeA6") {
        if (value === "4") {
          updated.spouseSituation = "Spouse with no income";
          updated.spouseAssessmentChoice = "My spouse has no income";
          updated.spouseReliefG14Type = "spouse_no_income";
        } else if (value === "3") {
          updated.spouseSituation = "None";
          updated.spouseAssessmentChoice = "Separately from my spouse";
          updated.spouseReliefG14Type = "not_applicable";
        } else if (value === "1") {
          updated.spouseSituation = "None";
          updated.spouseAssessmentChoice = "Together under my name";
          updated.spouseReliefG14Type = "not_applicable";
        } else if (value === "2") {
          updated.spouseSituation = "None";
          updated.spouseAssessmentChoice = "Together under my spouse's name";
          updated.spouseReliefG14Type = "not_applicable";
        } else {
          updated.spouseSituation = "Not sure";
          updated.spouseAssessmentChoice = "Not sure yet";
          updated.spouseReliefG14Type = "not_applicable";
        }
      }

      triggerAutosave(updated);
      return updated;
    });
  };

  const handleProfileCheckbox = (field: keyof SmartSetupData, value: "Yes" | "No" | "Not sure") => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      triggerAutosave(updated);
      return updated;
    });
  };

  // Save the profile view changes back to App state
  const handleSaveProfile = () => {
    // 1. Also update simulated user so top headers stay in sync!
    try {
      const rawUser = localStorage.getItem("tax5_simulated_user");
      let currentUserObj = { name: formData.fullName, email: formData.email };
      if (rawUser) {
        currentUserObj = { ...JSON.parse(rawUser), name: formData.fullName, email: formData.email };
      }
      localStorage.setItem("tax5_simulated_user", JSON.stringify(currentUserObj));
    } catch (e) {}

    // 2. Save directly to correct storage key to be absolutely sure
    try {
      const key = !currentUser 
        ? "tax5_smart_setup" 
        : currentUser.isDemo 
        ? "tax5_smart_setup_demo" 
        : `tax5_smart_setup_user_${currentUser.id || currentUser.email}`;
      localStorage.setItem(key, JSON.stringify(formData));
    } catch (e) {
      console.error("Local save error:", e);
    }

    // 3. Trigger onSave callback to commit to React state & parent
    onSave(formData);

    // 4. Show a small temporary "Saved" toast inside container
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setShowSavedToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowSavedToast(false);
    }, 1500);
  };

  // Add Employer record & recalculate totals dynamically
  const handleAddEmployerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpTin) return;

    const newEmp: Employer = {
      id: "emp_" + Date.now().toString(),
      name: newEmpName,
      tin: newEmpTin,
      period: newEmpPeriod,
      income: parseFloat(newEmpIncome) || 0,
      mtd: parseFloat(newEmpMtd) || 0,
      epf: parseFloat(newEmpEpf) || 0,
      socso: parseFloat(newEmpSocso) || 0,
      eis: parseFloat(newEmpEis) || 0,
      taxBorne: newEmpTaxBorne,
      docType: newEmpDocType,
    };

    const updatedEmployers = [...employers, newEmp];
    setEmployers(updatedEmployers);
    saveEmployersAndPropagateTotals(updatedEmployers);

    // Reset fields
    setNewEmpName("");
    setNewEmpTin("");
    setNewEmpPeriod("01/01 - 31/12");
    setNewEmpIncome("");
    setNewEmpMtd("");
    setNewEmpEpf("");
    setNewEmpSocso("");
    setNewEmpEis("");
    setNewEmpTaxBorne("No");
    setNewEmpDocType("EA form");
    setShowAddEmp(false);
  };

  // Remove employer record and update totals
  const handleDeleteEmployer = (id: string) => {
    const updatedEmployers = employers.filter((emp) => emp.id !== id);
    setEmployers(updatedEmployers);
    saveEmployersAndPropagateTotals(updatedEmployers);
  };

  // Sum employer details & propagate to smartSetup data so calculations are synchronized
  const saveEmployersAndPropagateTotals = (list: Employer[]) => {
    // 1. Save list to localStorage under key loaded by TaxSummaryView
    const key = getEmployersKey(currentUser);
    localStorage.setItem(key, JSON.stringify(list));

    // 2. Compute summed values
    const sumIncome = list.reduce((acc, current) => acc + (current.income || 0), 0);
    const sumMtd = list.reduce((acc, current) => acc + (current.mtd || 0), 0);
    const sumEpf = list.reduce((acc, current) => acc + (current.epf || 0), 0);
    const sumSocso = list.reduce((acc, current) => acc + (current.socso || 0), 0);
    const sumEis = list.reduce((acc, current) => acc + (current.eis || 0), 0);

    const updatedFormData: SmartSetupData = {
      ...formData,
      numberOfEmployments: list.length === 0 ? "" : list.length === 1 ? "1" : list.length === 2 ? "2" : "3 or more",
      annualEmploymentIncome: sumIncome > 0 ? sumIncome.toString() : "",
      pcbPaid: sumMtd > 0 ? sumMtd.toString() : "",
      epfAmount: sumEpf > 0 ? sumEpf.toString() : "",
      socsoAmount: sumSocso > 0 ? sumSocso.toString() : "",
      eisAmount: sumEis > 0 ? sumEis.toString() : "",
    };

    setFormData(updatedFormData);
    onSave(updatedFormData);
  };

  // Receipt claims calculators for Claims Review dashboard
  const categoryTotals: Record<ClaimCategory, number> = {
    [ClaimCategory.Medical]: 0,
    [ClaimCategory.Lifestyle]: 0,
    [ClaimCategory.Education]: 0,
    [ClaimCategory.Sports]: 0,
    [ClaimCategory.Insurance]: 0,
    [ClaimCategory.Other]: 0,
  };

  receipts.forEach((r) => {
    // Sum only claimable/check again receipts and cap accordingly
    if (r.status === "Claimable" || r.status === "Needs Review") {
      const amt = parseFloat(r.amount) || 0;
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + amt;
    }
  });

  const categoryLimits: Record<ClaimCategory, number> = {
    [ClaimCategory.Lifestyle]: 2500,
    [ClaimCategory.Medical]: 10000,
    [ClaimCategory.Education]: 7000,
    [ClaimCategory.Sports]: 1000,
    [ClaimCategory.Insurance]: 4000,
    [ClaimCategory.Other]: 1000,
  };

  // Completion calculation for setup layers indicators
  const isProfileConfigured = !!formData.fullName && !!formData.email;
  const isEmploymentConfigured = employers.length > 0;

  return (
    <div className="flex-1 flex flex-col p-4 bg-[#F5FAF7] space-y-4 pb-12 relative overflow-x-hidden no-scrollbar">
      {/* Absolute design aesthetic blobs */}
      <div className="absolute top-[-5%] left-[-15%] w-[250px] h-[250px] rounded-full bg-[#E5F5EF] blur-[85px] opacity-75 pointer-events-none z-0"></div>
      <div className="absolute bottom-[8%] right-[-10%] w-[220px] h-[220px] rounded-full bg-[#FFFBE3] blur-[75px] opacity-65 pointer-events-none z-0"></div>

      {showSavedToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-neutral-905 bg-neutral-900/90 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all duration-300 pointer-events-none">
          <Check className="w-3.5 h-3.5 text-teal-400 font-extrabold" />
          <span>Saved</span>
        </div>
      )}

      {/* RENDER VIEW: SETUP HUB HOME */}
      {false && viewMode === "hub" && (
        <div className="space-y-4 z-10 relative flex-1 flex flex-col animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="w-7 h-7 bg-white border border-neutral-200/55 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-500" />
              </button>
              <div>
                <h2 className="text-xl font-bold font-heading text-navy">Tax5 Setup Hub</h2>
                <p className="text-xs text-neutral-500 font-semibold leading-tight mt-0.5 mt-0.5">Dual-Layer Tax Preparation Setup</p>
              </div>
            </div>
          </div>

          {/* Core Introduction Info Card */}
          <div className="bg-[#FFFDF0] border border-[#FFF1C2]/30 rounded-2xl p-4 shadow-3xs space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block font-heading">
                  Compliance Preparation
                </span>
                <p className="text-[11.5px] text-[#4F5B66] font-semibold leading-relaxed">
                  Tax5 organizes files into stable year-round profile rules and optional tax-season EA statements. Scan and organize receipts anytime; add EA summaries near tax-filing month.
                </p>
              </div>
            </div>
            
            {/* Quick Progress Bar */}
            <div className="pt-1.5 border-t border-[#FFF1C2]/30 flex items-center justify-between gap-4">
              <div className="flex-1 bg-neutral-200/50 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-brand h-full rounded-full transition-all duration-500"
                  style={{ width: `${(isProfileConfigured ? 50 : 0) + (isEmploymentConfigured ? 50 : 0)}%` }}
                ></div>
              </div>
              <span className="text-[10.5px] font-bold text-navy shrink-0">
                {isProfileConfigured && isEmploymentConfigured && "Setup Ready"}
                {isProfileConfigured && !isEmploymentConfigured && "Profile Ready • EA Optional"}
                {!isProfileConfigured && "Awaiting Profile Setup"}
              </span>
            </div>
          </div>

          {/* LAYER 1 SECTION: PERSONAL PROFILE */}
          <div className="bg-white border border-neutral-200/55 rounded-2xl p-4.5 shadow-3xs space-y-3.5 transition-all text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-500/10 flex items-center justify-center text-teal-brand shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-navy font-heading">
                    1. Personal Profile Setup
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-semibold mt-0.5 leading-normal">
                    Tell Tax5 about your situation, family details, and claim areas that apply to you.
                  </p>
                </div>
              </div>

              {isProfileConfigured ? (
                <span className="bg-[#EAFDF5] text-[#009170] text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-teal-500/10 shrink-0">
                  Configured
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/10 shrink-0">
                  Not set up yet
                </span>
              )}
            </div>

            {/* Quick mini info tags if configured */}
            {isProfileConfigured && (
              <div className="grid grid-cols-2 gap-1.5 bg-neutral-50 p-2.5 rounded-xl text-[10.5px] font-semibold text-neutral-600 font-mono">
                <div>Name: <span className="text-navy font-bold">{formData.fullName}</span></div>
                <div>Resident Status: <span className="text-navy font-bold">{formData.salariedBE === "Yes" ? "Resident" : "Non-Resident"}</span></div>
                <div>Tax Status: <span className="text-navy font-bold">{formData.maritalStatus}</span></div>
                <div>YA: <span className="text-navy font-bold">{formData.yearOfAssessment || "YA 2026"}</span></div>
              </div>
            )}

            <button
              onClick={() => setViewMode("profile")}
              className="w-full bg-teal-brand hover:bg-[#009473] text-white py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isProfileConfigured ? "Update Personal Profile" : "Start Profile Setup"}</span>
            </button>
          </div>

          {/* LAYER 2 SECTION: EMPLOYMENT & EA FORM (OPTIONAL) */}
          <div className="bg-white border border-neutral-200/55 rounded-2xl p-4.5 shadow-3xs space-y-3.5 transition-all text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                  <Briefcase className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-navy font-heading">
                    2. Employment & EA Forms
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-semibold mt-0.5 leading-normal">
                    Tax-season details from employer EA statements. Add annual income, MTD paid, EPF, and SOCSO.
                  </p>
                </div>
              </div>

              {isEmploymentConfigured ? (
                <span className="bg-indigo-50 text-indigo-600 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-indigo-550/10 shrink-0">
                  {employers.length} Added
                </span>
              ) : (
                <span className="bg-neutral-100 text-neutral-500 text-[9.5px] font-semibold px-2 py-0.5 rounded-full border border-neutral-200 shrink-0">
                  Optional
                </span>
              )}
            </div>

            {/* Quick mini info tags if configured */}
            {isEmploymentConfigured ? (
              <div className="bg-[#EEF2F6] p-2.5 rounded-xl flex justify-between items-center text-[10.5px] font-bold text-neural-600 font-mono">
                <div>
                  <span className="text-xs font-black text-indigo-900 block font-heading">{employers[0].name}</span>
                  <span className="text-[9px] text-[#4F5B66] font-semibold font-sans">{employers.length === 1 ? "1 employer statement" : `${employers.length} employer statements`}</span>
                </div>
                <div className="text-right">
                  <span className="text-indigo-900 font-black block">RM {(parseFloat(formData.annualEmploymentIncome || "0")).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <span className="text-[9px] text-neutral-500 font-medium font-sans">PCB Paid: RM {(parseFloat(formData.pcbPaid || "0")).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 border border-indigo-100/50 bg-indigo-50/20 rounded-xl text-[10.5px] text-indigo-800 leading-normal font-semibold">
                ℹ️ Use Tax5 year-round with receipts only. Add actual EA forms when you receive them from your employer.
              </div>
            )}

            <button
              onClick={() => setViewMode("employment")}
              className="w-full bg-[#0B2545]/90 hover:bg-[#0B2545] text-white py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Configure EA Forms & Employers</span>
            </button>
          </div>

          {/* LAYER 3 SECTION: RECEIPT CLAIMS REVIEW */}
          <div className="bg-white border border-neutral-200/55 rounded-2xl p-4.5 shadow-3xs space-y-3.5 transition-all text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-500/10 flex items-center justify-center text-teal-brand shrink-0">
                  <BarChart3 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-navy font-heading">
                    3. Receipt Claims Review
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-semibold mt-0.5 leading-normal">
                    Track spending and matching limits for categorized receipts (Lifestyle, Sports, Medical, Education).
                  </p>
                </div>
              </div>

              <span className="bg-teal-50 text-teal-800 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-teal-200 shrink-0">
                {receipts.length} Receipts
              </span>
            </div>

            <button
              onClick={() => setViewMode("claimsReview")}
              className="w-full bg-white hover:bg-neutral-50 text-navy border border-neutral-300 py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Analyze Claim Limits</span>
            </button>
          </div>

          <div className="text-center w-full pt-2 flex items-center justify-center gap-1 opacity-80 mt-auto">
            <Lock className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-[9px] text-[#4F5B66] font-bold">Secure local storage • No raw records leave browser.</span>
          </div>
        </div>
      )}

      {/* RENDER VIEW: PERSONAL PROFILE SETUP */}
      {viewMode === "profile" && (
        <div className="space-y-4 z-10 relative flex-1 flex flex-col animate-fadeIn">
          {/* Sub Header */}
          <div className="flex items-start pb-2 border-b border-neutral-100">
            <div className="flex items-start gap-2.5 min-w-0">
              <button
                onClick={onCancel}
                className="w-8 h-8 bg-white border border-neutral-200/55 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer shrink-0 mt-0.5"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-500" />
              </button>
              <div className="min-w-0 flex-1 text-left">
                <h2 className="text-base font-bold font-heading text-navy leading-tight truncate">
                  {language === "BM" ? "Sediakan Profil" : "Profile Setup"}
                </h2>
                <p className="text-xs text-neutral-500 font-semibold leading-tight mt-1 truncate">
                  {language === "BM" ? "Beritahu Tax5 apa yang berkenaan dengan anda." : "Tell Tax5 what applies to you."}
                </p>
              </div>
            </div>
          </div>

          {/* Intro block */}
          <div className="border rounded-2xl p-3.5 shadow-3xs space-y-1.5 text-left animate-slideDown" style={{ backgroundColor: "#FFF8E8", borderColor: "#F5D98B" }}>
            <h3 className="font-extrabold text-navy text-sm block font-heading">
              {language === "BM" ? "Beberapa soalan ringkas" : "A few quick questions"}
            </h3>
            <p className="text-[11.5px] text-neutral-700 font-semibold leading-relaxed">
              {language === "BM" ? "Tax5 menggunakan jawapan anda untuk mencadangkan kategori tuntutan dan mengingatkan anda bukti yang perlu disimpan." : "Tax5 uses your answers to suggest claim categories and remind you what proof to keep."}
            </p>
            <p className="text-[10.5px] text-neutral-500 italic mt-1 leading-relaxed font-normal">
              {language === "BM" ? "Nota: Anda boleh melangkau apa-apa sahaja. Sesetengah tuntutan mungkin ditandakan \"Perlu Semak Semula\" sehingga butiran lanjut ditambah." : "Note: You can skip anything. Some claims may be marked “Need Review” until more details are added."}
            </p>
          </div>

          {/* Basic details (fully collapsed by default) */}
          <div className="bg-white border border-neutral-200/50 rounded-2xl p-3.5 shadow-3xs text-left">
            <button
               type="button"
               onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
               className="w-full flex items-center justify-between font-bold text-[#0B2545] text-xs font-heading cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-brand" />
                <span>{language === "BM" ? "Butiran asas" : "Basic details"}</span>
                <span className="text-[9px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded font-black tracking-wide shrink-0">
                  {language === "BM" ? "Pilihan" : "Optional"}
                </span>
              </span>
              <span className="text-[10px] text-teal-brand font-black hover:underline shrink-0 ml-2">
                {showAdvancedDetails ? (language === "BM" ? "Sembunyi" : "Hide") : (language === "BM" ? "Edit" : "Edit")}
              </span>
            </button>
            <p className="text-[10.5px] text-neutral-500 font-semibold mt-1 max-w-[90%] leading-normal">
              {language === "BM" ? "Tambah nama, e-mel, dan status mastautin untuk ringkasan draf yang lebih lengkap." : "Add name, email, and resident status for a more complete draft summary."}
            </p>

            {showAdvancedDetails && (
              <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3.5 text-xs animate-slideDown">
                <div>
                  <label className="block font-bold text-neutral-500 text-[10px] uppercase mb-1.5">{language === "BM" ? "Nama Penuh (Seperti MyKad / Pasport)" : "Full Name (As per MyKad / Passport)"}</label>
                  <input
                    type="text"
                    className="w-full h-9 px-3 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-brand/35 focus:border-teal-brand transition-all"
                    value={formData.fullName || ""}
                    onChange={(e) => handleProfileFieldChange("fullName", e.target.value)}
                    placeholder="e.g. Tan Boon Seng"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4F5B66] text-[10px] uppercase mb-1.5">{language === "BM" ? "Alamat E-mel Peribadi" : "Personal Email Address"}</label>
                  <input
                    type="email"
                    className="w-full h-9 px-3 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-brand/35 focus:border-teal-brand transition-all"
                    value={formData.email || ""}
                    onChange={(e) => handleProfileFieldChange("email", e.target.value)}
                    placeholder="e.g. boon.seng@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-neutral-500 text-[10px] uppercase mb-1.5">{language === "BM" ? "Tahun Taksiran" : "Year of Assessment"}</label>
                    <select
                      className="w-full h-9 px-3 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold text-neutral-700 outline-none focus:bg-white focus:ring-[0.5px] focus:ring-teal-brand transition-all"
                      value={formData.yearOfAssessment || "YA 2026"}
                      onChange={(e) => handleProfileFieldChange("yearOfAssessment", e.target.value)}
                    >
                      <option value="YA 2026">YA 2026 ({language === "BM" ? "Semasa" : "Current"})</option>
                      <option value="YA 2025">YA 2025</option>
                      <option value="YA 2024">YA 2024</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <label className="block font-bold text-neutral-500 text-[10px] uppercase">{language === "BM" ? "Status Mastautin" : "Resident Status"}</label>
                    </div>
                    <select
                      className="w-full h-9 px-3 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold text-neutral-700 outline-none"
                      value={formData.salariedBE || "Yes"}
                      onChange={(e) => handleProfileFieldChange("salariedBE", e.target.value)}
                    >
                      <option value="Yes">{language === "BM" ? "Mastautin Malaysia (Borang BE)" : "Malaysian Resident (Form BE)"}</option>
                      <option value="No">{language === "BM" ? "Individu Bukan Mastautin" : "Non-Resident Individual"}</option>
                      <option value="Not sure">{language === "BM" ? "Kurang pasti" : "Not sure"}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-neutral-500 text-[10px] uppercase mb-1.5">{language === "BM" ? "Nombor Rujukan Cukai (TIN)" : "Tax Ref Number (TIN)"}</label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold font-mono text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-brand/35 transition-all"
                      value={formData.tin || ""}
                      onChange={(e) => handleProfileFieldChange("tin", e.target.value)}
                      placeholder="e.g. IG 2919485"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-neutral-500 text-[10px] uppercase mb-1.5">{language === "BM" ? "No. Kad Pengenalan" : "Identification Number"}</label>
                    <input
                      type="text"
                      className="w-full h-9 px-3 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-brand/35 transition-all"
                      value={formData.identificationNumber || ""}
                      onChange={(e) => handleProfileFieldChange("identificationNumber", e.target.value)}
                      placeholder="e.g. 881204-14-5231"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Questionnaire Horizonal Tabs selection */}
          <div className="flex gap-1 p-1 bg-neutral-100/80 rounded-xl overflow-x-auto no-scrollbar scroll-smooth shrink-0">
            {(["family", "health", "lifestyle", "insurance", "other"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setProfileSection(tab)}
                className={`py-1.5 px-3 whitespace-nowrap text-[10.5px] font-black rounded-lg transition-all cursor-pointer flex-1 text-center ${
                  profileSection === tab
                    ? "bg-white text-navy shadow-3xs"
                    : "text-neutral-500 hover:text-neutral-700 font-bold"
                }`}
              >
                {tab === "family" && (language === "BM" ? "Keluarga" : "Family")}
                {tab === "health" && (language === "BM" ? "Kesihatan" : "Health")}
                {tab === "lifestyle" && (language === "BM" ? "Pembelajaran & Gaya Hidup" : "Learning & Lifestyle")}
                {tab === "insurance" && (language === "BM" ? "Insurans & Simpanan" : "Insurance & Savings")}
                {tab === "other" && (language === "BM" ? "Tuntutan Lain" : "Other Claims")}
              </button>
            ))}
          </div>

                    <div className="bg-white border border-neutral-200/55 rounded-2xl p-4 shadow-3xs text-left space-y-4 flex-1 flex flex-col justify-between overflow-y-auto min-h-[365px]">
            <div className="space-y-4">
              {/* TAB 1: FAMILY */}
              {profileSection === "family" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h3 className="font-extrabold text-sm text-navy font-heading">Family Claims Profile</h3>
                    <p className="text-[11px] text-neutral-500 font-semibold leading-normal mt-1">
                      Configure your spouse, parents, and children support options.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Spouse Question */}
                    <div className="p-5 bg-white border border-neutral-200 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start gap-3 flex-wrap">
                        <span className="font-bold text-navy text-[13px] block leading-tight font-heading">Do you currently have a spouse?</span>
                        <button
                          type="button"
                          onClick={() => setActiveHelp({
                            title: "Marital Status Reliefs",
                            description: "Your marital status determines which tax reliefs (Spouse Relief, Alimony Relief, Joint vs Separate Assessment) apply under Malaysian tax law.",
                            proof: "Keep marriage certificates, separation deeds, divorce decrees or death certificates if relevant.",
                            meaning: "These legal documents prove eligibility for family and spouse-related claims."
                          })}
                          className="text-[11px] text-teal-brand font-black hover:underline cursor-pointer shrink-0"
                        >
                          Need help?
                        </button>
                      </div>

                      {/* Main Choice Buttons: Yes, No, Not sure */}
                      <div className="flex gap-2 font-sans">
                        {[
                          { key: "Yes", label: "Yes" },
                          { key: "No", label: "No" },
                          { key: "Not sure", label: "Not sure" }
                        ].map((btn) => {
                          const currentMainVal = (
                            formData.maritalStatus === "Married"
                              ? "Yes"
                              : (formData.maritalStatus === "Single" || formData.maritalStatus === "Divorced" || formData.maritalStatus === "Widowed")
                                ? "No"
                                : formData.maritalStatus === "Not sure"
                                  ? "Not sure"
                                  : ""
                          );
                          const isSelected = currentMainVal === btn.key;
                          return (
                            <button
                              key={btn.key}
                              type="button"
                              onClick={() => selectMainSpouse(btn.key as any)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                                isSelected
                                  ? "bg-teal-brand text-white border-teal-brand font-black"
                                  : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>

                      {formData.maritalStatus === "Married" && (
                        <div className="p-3.5 bg-white border border-neutral-200 rounded-xl space-y-4 animate-slideDown mt-2">
                          {/* Part A6 Assessment Dropdown */}
                          <div className="space-y-1.5 text-left">
                            <label className="block font-bold text-neutral-450 text-[9px] uppercase">
                              Which Form BE assessment type sounds closest?
                            </label>
                            
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsA6DropdownOpen(!isA6DropdownOpen)}
                                className="w-full min-h-[36px] px-3 py-1.5 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold text-neutral-700 outline-none flex items-center justify-between cursor-pointer select-none text-left"
                              >
                                <span className="pr-2 leading-relaxed break-words">
                                  {formData.assessmentTypeA6 === "1" && "Joint assessment in husband’s name"}
                                  {formData.assessmentTypeA6 === "2" && "Joint assessment in wife’s name"}
                                  {formData.assessmentTypeA6 === "3" && "Separate assessment"}
                                  {formData.assessmentTypeA6 === "4" && "Married, spouse has no income / no source of income / tax-exempt income"}
                                  {formData.assessmentTypeA6 === "unknown" && "Not sure yet"}
                                  {!formData.assessmentTypeA6 && "Separate assessment"}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 self-center" style={{ transform: isA6DropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                              </button>
                              
                              {isA6DropdownOpen && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40 bg-transparent" 
                                    onClick={() => setIsA6DropdownOpen(false)}
                                  />
                                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border border-neutral-250 rounded-lg shadow-lg py-1 animate-fadeIn font-sans">
                                    {[
                                      { value: "1", label: "Joint assessment in husband’s name" },
                                      { value: "2", label: "Joint assessment in wife’s name" },
                                      { value: "3", label: "Separate assessment" },
                                      { value: "4", label: "Married, spouse has no income / no source of income / tax-exempt income" },
                                      { value: "unknown", label: "Not sure yet" }
                                    ].map((option) => (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                          handleProfileFieldChange("assessmentTypeA6", option.value);
                                          setIsA6DropdownOpen(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs font-bold block border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors ${
                                          (formData.assessmentTypeA6 || "3") === option.value 
                                            ? "text-teal-brand bg-teal-brand/5" 
                                            : "text-neutral-700"
                                        }`}
                                        style={{ whiteSpace: "normal" }}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Part G15 Disabled Spouse Options */}
                          <div className="space-y-1.5 pt-1 text-left">
                            <label className="block font-bold text-neutral-450 text-[9px] uppercase">
                              Is your husband/wife registered as disabled?
                            </label>
                            <div className="flex gap-2 font-sans">
                              {["Yes", "No", "Not sure"].map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleProfileFieldChange("disabledSpouseG15", opt)}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                                    (formData.disabledSpouseG15 || "No") === opt
                                      ? "bg-teal-brand text-white border-teal-brand font-black"
                                      : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Dynamic Hints */}
                          {formData.assessmentTypeA6 === "4" && (
                            <p className="text-[10px] text-teal-850 font-bold bg-[#EAF7F4] p-2.5 rounded-lg mt-1 leading-relaxed">
                              💡 Spouse Relief (G14) of up to RM4,000 applies when your spouse has no income/source of income.
                            </p>
                          )}
                          {(formData.assessmentTypeA6 === "1" || formData.assessmentTypeA6 === "2") && (
                            <p className="text-[10px] text-teal-850 font-bold bg-[#EAF7F4] p-2.5 rounded-lg mt-1 leading-relaxed font-sans">
                              💡 Joint Assessment Reminder: All incomes and reliefs are aggregated under one name. Make sure joint filing is more tax-advantageous than separate assessment.
                            </p>
                          )}
                          {formData.disabledSpouseG15 === "Yes" && (
                            <p className="text-[10px] text-teal-850 font-bold bg-[#EAF7F4] p-2.5 rounded-lg mt-1 leading-relaxed">
                              💡 An additional Disabled Spouse Relief (G15) of RM5,000 is claimable.
                            </p>
                          )}
                        </div>
                      )}

                      {/* PART 2 — If user selects No */}
                      {(formData.maritalStatus === "Single" || formData.maritalStatus === "Divorced" || formData.maritalStatus === "Widowed") && (
                        <div className="p-3.5 bg-white border border-neutral-200 rounded-xl space-y-4 animate-slideDown mt-2">
                          {/* Situation Dropdown */}
                          <div className="space-y-1.5 text-left font-sans">
                            <label className="block font-bold text-neutral-450 text-[9px] uppercase">
                              Which situation sounds closest?
                            </label>
                            
                            <div className="relative font-sans">
                              <button
                                type="button"
                                onClick={() => setIsSituationDropdownOpen(!isSituationDropdownOpen)}
                                className="w-full min-h-[36px] px-3 py-1.5 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold text-neutral-700 outline-none flex items-center justify-between cursor-pointer select-none text-left whitespace-normal leading-relaxed break-words font-sans"
                              >
                                <span className="pr-2 leading-relaxed break-words whitespace-normal text-xs">
                                  {formData.maritalStatusA4 === "Single" && "Single"}
                                  {formData.maritalStatusA4 === "Divorcee" && "Divorcee"}
                                  {formData.maritalStatusA4 === "Widow / Widower" && "Widow / Widower"}
                                  {formData.maritalStatusA4 === "Not sure yet" && "Not sure yet"}
                                  {!formData.maritalStatusA4 && (formData.maritalStatus === "Divorced" ? "Divorcee" : formData.maritalStatus === "Widowed" ? "Widow / Widower" : formData.maritalStatus === "Not sure" ? "Not sure yet" : formData.maritalStatus || "Single")}
                                </span>
                                <ChevronDown 
                                  className="w-3.5 h-3.5 text-neutral-400 shrink-0 self-center" 
                                  style={{ transform: isSituationDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} 
                                />
                              </button>
                              
                              {isSituationDropdownOpen && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40 bg-transparent" 
                                    onClick={() => setIsSituationDropdownOpen(false)}
                                  />
                                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border border-neutral-250 rounded-lg shadow-lg py-1 animate-fadeIn font-sans">
                                    {[
                                      { value: "Single", label: "Single" },
                                      { value: "Divorcee", label: "Divorcee" },
                                      { value: "Widow / Widower", label: "Widow / Widower" },
                                      { value: "Not sure yet", label: "Not sure yet" }
                                    ].map((option) => (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                          selectNoSituationOption(option.value as any);
                                          setIsSituationDropdownOpen(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-xs font-bold block border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors ${
                                          (formData.maritalStatusA4 || "Single") === option.value
                                            ? "text-teal-brand bg-teal-brand/5" 
                                            : "text-neutral-700"
                                        }`}
                                        style={{ whiteSpace: "normal" }}
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Default Self-Only Info */}
                          <div className="space-y-1.5 text-left font-sans">
                            <label className="block font-bold text-neutral-450 text-[9px] uppercase">
                              Form BE assessment type
                            </label>
                            <div className="w-full min-h-[36px] px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-500 flex items-center leading-relaxed font-sans">
                              Self only: single / divorcee / widow / widower
                            </div>
                          </div>

                          {/* Alimony Question only for Divorcee */}
                          {formData.maritalStatus === "Divorced" && (
                            <div className="space-y-4 pt-1 border-t border-neutral-100 mt-2">
                              <div className="space-y-1.5 text-left font-sans">
                                <label className="block font-bold text-neutral-450 text-[9px] uppercase">
                                  Do you pay formal alimony to a former wife?
                                </label>
                                <div className="flex gap-2">
                                  {["Yes", "No", "Not sure"].map((opt) => {
                                    const isSelected = (formData.alimonyFormerWifeG14 || "No") === opt;
                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handleProfileFieldChange("alimonyFormerWifeG14", opt)}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                                          isSelected
                                            ? "bg-teal-brand text-white border-teal-brand font-black"
                                            : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {formData.alimonyFormerWifeG14 === "Yes" && (
                                <div className="space-y-1.5 mt-2">
                                  <p className="text-[10px] text-teal-850 font-bold bg-[#EAF7F4] p-2.5 rounded-lg leading-relaxed font-sans">
                                    💡 Formal alimony may be considered under G14 if payment is made under a formal deed or agreement. Voluntary payment without formal agreement is not eligible.
                                  </p>
                                </div>
                              )}

                              {formData.alimonyFormerWifeG14 === "Not sure" && (
                                <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-200 text-amber-850 rounded-lg text-[10px] font-bold mt-2 font-sans">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>Status: Need Review (Please confirm formal alimony agreement)</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* PART 3 — If user selects Not sure */}
                      {formData.maritalStatus === "Not sure" && (
                        <div className="p-3.5 bg-white border border-neutral-200 rounded-xl space-y-2 animate-slideDown mt-2 text-left font-sans font-semibold">
                          <p className="text-[11px] text-[#B45309] bg-amber-50/70 p-3 rounded-lg leading-relaxed border border-amber-100 font-medium">
                            💡 Tax5 will mark this part as Need Review until more details are added.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Parents Question */}
                    <div className="p-5 bg-white border border-neutral-200 rounded-2xl space-y-4 font-semibold">
                      <div className="flex justify-between items-start gap-3">
                        <span className="font-bold text-navy text-[13.5px] block leading-tight font-heading">Do you support parents or grandparents?</span>
                        <button
                          type="button"
                          onClick={() => setActiveHelp({
                            title: "Parent / Grandparent Support",
                            description: "Tax5 uses this to understand whether parent or grandparent medical, dental, special needs, or carer expenses may apply to your receipts.",
                            proof: "Keep care receipts, medical or dental bills, or doctor checkup invoices if available.",
                            meaning: "These documents show that care expenses were paid for your parent or grandparent support."
                          })}
                          className="text-[11px] text-teal-brand font-black hover:underline cursor-pointer shrink-0 mt-0.5"
                        >
                          Need help?
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {(["Yes", "No", "Not sure"] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleProfileFieldChange("supportingParents", opt)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                              formData.supportingParents === opt
                                ? "bg-teal-brand text-white border-teal-brand font-black"
                                : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Children Question */}
                    <div className="p-5 bg-white border border-neutral-200 rounded-2xl space-y-4">
                      <div className="flex justify-between items-start gap-3">
                        <span className="font-bold text-navy text-[13.5px] block leading-tight font-heading">Do you have children?</span>
                        <button
                          type="button"
                          onClick={() => setActiveHelp({
                            title: "Children & Childcare Claims",
                            description: "Tax5 uses this to help organize receipts for childcare, kindergarten, school files, and SSPN savings.",
                            proof: "Keep birth certificates, childcare receipts, school enrolment documents, or SSPN statements.",
                            meaning: "These documents show children's ages, schooling details, or savings records."
                          })}
                          className="text-[11px] text-teal-brand font-black hover:underline cursor-pointer shrink-0 mt-0.5"
                        >
                          Need help?
                        </button>
                      </div>
                      <div className="flex gap-2">
                        {["1", "0", "Not sure"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              handleProfileFieldChange("childrenCount", opt === "0" ? "0" : "1");
                            }}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                              (opt === "0" && formData.childrenCount === "0") || (opt !== "0" && formData.childrenCount !== "0")
                                ? "bg-teal-brand text-white border-teal-brand font-black"
                                : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                            }`}
                          >
                            {opt === "1" ? "Yes" : opt === "0" ? "No" : "Not sure"}
                          </button>
                        ))}
                      </div>

                      {formData.childrenCount !== "0" && (
                        <div className="p-3.5 bg-white border border-neutral-200 rounded-xl space-y-3.5 animate-slideDown mt-2 font-semibold text-neutral-600">
                          <div>
                            <label className="block text-[9.5px] text-navy font-extrabold uppercase mb-1">How many children do you support?</label>
                            <select
                              className="w-full h-8.5 px-3 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold outline-none"
                              value={formData.childrenCount || "1"}
                              onChange={(e) => handleProfileFieldChange("childrenCount", e.target.value)}
                            >
                              <option value="1">1 child</option>
                              <option value="2">2 children</option>
                              <option value="3 or more">3 or more children</option>
                            </select>
                          </div>

                          <div className="space-y-2 border-t border-neutral-100 pt-2 font-semibold">
                            <label className="block text-[9.5px] text-navy font-extrabold uppercase mb-1">Which age groups apply? (Check all)</label>
                            {[
                              { field: "hasChildUnder6", label: "Under 6 (kindergarten, nurseries)" },
                              { field: "hasChildUnder18", label: "Under 18 (school / living support)" },
                              { field: "hasChild18Studying", label: "18 & studying full-time (tertiary degree)" },
                              { field: "hasDisabledChild", label: "Disabled / learning needs child" }
                            ].map((group) => (
                              <label key={group.field} className="flex items-center gap-2 text-[11px] font-bold text-neutral-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded border-neutral-300 text-teal-brand focus:ring-teal-brand w-3.5 h-3.5"
                                  checked={formData[group.field as keyof SmartSetupData] === "Yes"}
                                  onChange={(e) => handleProfileCheckbox(group.field as keyof SmartSetupData, e.target.checked ? "Yes" : "No")}
                                />
                                <span>{group.label}</span>
                              </label>
                            ))}
                          </div>

                          {formData.hasChildUnder6 === "Yes" && (
                            <div className="border-t border-neutral-100 pt-2 space-y-1.5">
                              <span className="block text-[11px] font-bold text-neutral-700 mb-1 leading-tight">Do you pay childcare or kindergarten fees?</span>
                              <div className="flex gap-2">
                                {(["Yes", "No"] as const).map((val) => {
                                  const isSelected = (val === "Yes" && formData.hasChildUnder6 === "Yes") || (val === "No" && formData.hasChildUnder6 === "No");
                                  return (
                                    <button
                                      key={val}
                                      type="button"
                                      onClick={() => handleProfileCheckbox("hasChildUnder6", val === "Yes" ? "Yes" : "No")}
                                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                                        val === "Yes"
                                          ? "bg-[#0B2545] text-white border-[#0B2545] font-black"
                                          : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                                      }`}
                                    >
                                      {val === "Yes" ? "Yes, I pay fees" : "No"}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="border-t border-neutral-100 pt-2 space-y-1.5">
                            <span className="block text-[11px] font-bold text-neutral-700 mb-1 leading-tight">Do you save in SSPN for your child?</span>
                            <div className="flex gap-2 font-sans">
                              {(["Yes", "No", "Not sure"] as const).map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleProfileFieldChange("sspnSavingsChild", val)}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                                    formData.sspnSavingsChild === val
                                      ? "bg-[#0B2545] text-white border-[#0B2545] font-black"
                                      : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: HEALTH */}
              {profileSection === "health" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h3 className="font-extrabold text-sm text-navy font-heading">Medical & Health Claims</h3>
                    <p className="text-[11px] text-neutral-500 font-semibold leading-normal mt-1">
                      Configure treatment and wellness questions to suggestion list rules.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-neutral-700">
                    {[
                      {
                        key: "vaccinationDentalCheckup",
                        label: "Did you pay for medical checkups, vaccinations, or dental care?",
                        tip: "Vaccinations, dental exams, or diagnostic screenings are claimable up to RM1,000 under medical limits."
                      },
                      {
                        key: "seriousDiseaseTreatment",
                        label: "Did you pay for serious disease treatment or medical devices?",
                        tip: "Treatment for cancer, kidney, heart disease, or self-testing kits is claimable up to RM10,000 with doctor statement."
                      },
                      {
                        key: "fertilityTreatment",
                        label: "Did you pay for fertility treatments?",
                        tip: "IVF, IUI, or fertility consultations are claimable up to RM10,000 for couples."
                      },
                      {
                        key: "mentalHealthConsultation",
                        label: "Did you pay for mental health care or counselling?",
                        tip: "Consultations by registered psychiatrists or clinical counsellors are claimable under the medical limits."
                      },
                      {
                        key: "childLearningDisability",
                        label: "Did you pay for a child's learning disability assessment?",
                        tip: "Autism, ADHD, or Down-syndrome clinical assessments are claimable up to RM10,000 for child wellness."
                      }
                    ].map((q) => (
                      <div key={q.key} className="p-5 bg-white border border-neutral-200 rounded-2xl space-y-4 font-semibold">
                        <div className="flex justify-between items-start gap-3">
                          <span className="font-bold text-navy text-[13.5px] leading-tight font-heading">{q.label}</span>
                          <button
                            type="button"
                            onClick={() => setActiveHelp({
                              title: "Medical & Health Claims",
                              description: "Tax5 uses this to verify if medical checkups, wellness checkups, vaccinations, dental bills, or disease treatment receipts will qualify for your claims.",
                              proof: "Keep clinic invoices, pharmacy bills, doctor advice notes, or vaccination records.",
                              meaning: "These documents show treatment reasons, dates, and registered clinic or counsellor details."
                            })}
                            className="text-[11px] text-teal-brand font-black hover:underline cursor-pointer shrink-0 mt-0.5"
                          >
                            Need help?
                          </button>
                        </div>
                        <div className="flex gap-2 font-bold font-sans">
                          {(["Yes", "No", "Not sure"] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleProfileCheckbox(q.key as keyof SmartSetupData, opt === "Yes" ? "Yes" : opt === "No" ? "No" : "Not sure")}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                                formData[q.key as keyof SmartSetupData] === (opt === "Yes" ? "Yes" : opt === "No" ? "No" : "Not sure")
                                  ? "bg-teal-brand text-white border-teal-brand font-black"
                                  : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {formData[q.key as keyof SmartSetupData] === "Yes" && (
                          <p className="text-[10.5px] text-[#004D3C] font-semibold bg-teal-50/50 p-2.5 rounded-xl animate-slideDown mt-1 leading-normal">
                            💡 {q.tip}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: LEARNING & LIFESTYLE */}
              {profileSection === "lifestyle" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h3 className="font-extrabold text-sm text-navy font-heading">Learning & Lifestyle Claims</h3>
                    <p className="text-[11px] text-neutral-500 font-semibold leading-normal mt-1">
                      Personalize spending on learning materials, tech, books, and sports.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-neutral-700">
                    {[
                      {
                        key: "lifeInsuranceFamilyTakaful", // proxy representing Lifestyle / books subscription
                        label: "Did you buy books, academic journals, newspapers, or custom internet plans?",
                        tip: "Claimable up to RM2,500 per year under the standard Lifestyle tax relief."
                      },
                      {
                        key: "medicalEducationInsurance", // proxy representing sports
                        label: "Did you pay sports membership fees, purchased sports gear, or lane rentals?",
                        tip: "Claimable up to RM1,000 per year under dedicated Sports Lifestyle relief."
                      },
                      {
                        key: "prsDeferredAnnuity", // proxy representing personal degree courses
                        label: "Did you study or pay for self-development or university courses?",
                        tip: "Courses registered with HRD Corp, or general degree tuition fees are claimable up to RM7,000."
                      }
                    ].map((q) => (
                      <div key={q.key} className="p-5 bg-white border border-neutral-200 rounded-2xl space-y-4 font-semibold">
                        <div className="flex justify-between items-start gap-3">
                          <span className="font-bold text-navy text-[13.5px] leading-tight font-heading">{q.label}</span>
                          <button
                            type="button"
                            onClick={() => setActiveHelp({
                              title: "Lifestyle, Sports & Education",
                              description: "Tax5 uses this to automatically spot claims for books, internet plans, computing gears, gym plans, or degree fees.",
                              proof: "Keep receipt invoices, course payment slips, or custom athletic/sports store receipts.",
                              meaning: "These documents show purchase descriptions, when they were paid, and who bought them."
                            })}
                            className="text-[11px] text-teal-brand font-black hover:underline cursor-pointer shrink-0 mt-0.5"
                          >
                            Need help?
                          </button>
                        </div>
                        <div className="flex gap-2 font-bold font-sans">
                          {(["Yes", "No", "Not sure"] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleProfileCheckbox(q.key as keyof SmartSetupData, opt === "Yes" ? "Yes" : opt === "No" ? "No" : "Not sure")}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                                formData[q.key as keyof SmartSetupData] === (opt === "Yes" ? "Yes" : opt === "No" ? "No" : "Not sure")
                                  ? "bg-teal-brand text-white border-teal-brand font-black"
                                  : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {formData[q.key as keyof SmartSetupData] === "Yes" && (
                          <p className="text-[10.5px] text-[#004D3C] font-semibold bg-teal-50/50 p-2.5 rounded-xl animate-slideDown mt-1 leading-normal">
                            💡 {q.tip}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: INSURANCE & SAVINGS */}
              {profileSection === "insurance" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h3 className="font-extrabold text-sm text-navy font-heading">Insurance Policy & PRS Claims</h3>
                    <p className="text-[11px] text-neutral-500 font-semibold leading-normal mt-1">
                      Establish protection guidelines for insurance premiums and retirement deposits.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-neutral-700">
                    {[
                      {
                        key: "lifeInsuranceFamilyTakaful",
                        label: "Do you pay for your own life insurance or family takaful premiums?",
                        tip: "Premium payments are claimable up to RM3,000 (or up to RM7,000 if inclusive of EPF balances)."
                      },
                      {
                        key: "medicalEducationInsurance",
                        label: "Do you pay for medical or education insurance policies?",
                        tip: "Policy premium statements are claimable up to RM3,000 for you, your spouse, or child's coverage."
                      },
                      {
                        key: "prsDeferredAnnuity",
                        label: "Do you contribute into a Private Retirement Scheme (PRS)?",
                        tip: "Approved Private Retirement Scheme deposits are claimable up to RM3,000 per year."
                      }
                    ].map((q) => (
                      <div key={q.key} className="p-5 bg-white border border-neutral-200 rounded-2xl space-y-4 font-semibold">
                        <div className="flex justify-between items-start gap-3">
                          <span className="font-bold text-[#0B2545] text-[13.5px] leading-tight font-heading">{q.label}</span>
                          <button
                            type="button"
                            onClick={() => setActiveHelp({
                              title: "Insurance & Savings",
                              description: "Tax5 uses this to help check life insurance policies, medical premiums, EPF contributions, and Private Retirement Schemes (PRS).",
                              proof: "Keep your year-end insurance statements, EPF statements, or PRS certificate receipt slips.",
                              meaning: "These annual statements show the exact contribution totals saved for your relief."
                            })}
                            className="text-[11px] text-teal-brand font-black hover:underline cursor-pointer shrink-0 mt-0.5"
                          >
                            Need help?
                          </button>
                        </div>
                        <div className="flex gap-2 font-bold font-sans">
                          {(["Yes", "No", "Not sure"] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleProfileCheckbox(q.key as keyof SmartSetupData, opt === "Yes" ? "Yes" : opt === "No" ? "No" : "Not sure")}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                                formData[q.key as keyof SmartSetupData] === (opt === "Yes" ? "Yes" : opt === "No" ? "No" : "Not sure")
                                  ? "bg-teal-brand text-white border-teal-brand font-black"
                                  : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {formData[q.key as keyof SmartSetupData] === "Yes" && (
                          <p className="text-[10.5px] text-[#004D3C] font-semibold bg-teal-50/50 p-2.5 rounded-xl animate-slideDown mt-1 leading-normal">
                            💡 {q.tip}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: OTHER CLAIMS */}
              {profileSection === "other" && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h3 className="font-extrabold text-sm text-navy font-heading">Other Eco & Special Claims</h3>
                    <p className="text-[11px] text-neutral-500 font-semibold leading-normal mt-1">
                      Check special claims like EV, composter, home loans, and OKU support.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-neutral-700">
                    {[
                      {
                        key: "evChargingFacility",
                        label: "Did you buy/rent an EV charger or charging subscription?",
                        tip: "Electric vehicle charging equipment or subscriptions are claimable up to RM2,500."
                      },
                      {
                        key: "compostingMachine",
                        label: "Did you buy a household organic composting machine?",
                        tip: "Organic waste composting machines are claimable up to RM500 per year."
                      },
                      {
                        key: "firstResidentialProperty",
                        label: "Did you pay interest on a home loan for your first residential property?",
                        tip: "Special interest relief applies for properties purchased under SPA 2025-2027 directions."
                      },
                      {
                        key: "registeredDisabled",
                        label: "Is your self, spouse, or child registered officially as disabled (OKU)?",
                        tip: "Enables special equipment allowances up to RM6,000 or general disabled status reliefs."
                      },
                      {
                        key: "approvedDonationsGifts",
                        label: "Did you make official donations to LHDN-approved charity bodies?",
                        tip: "Approved donations with exemption reference numbers are deductible up to 10% of income."
                      },
                      {
                        key: "departureLevyReligious",
                        label: "Did you make official pilgrimage or umrah religious travels?",
                        tip: "Departure levy rebate applies for up to two transit flights in a lifetime."
                      }
                    ].map((q) => (
                      <div key={q.key} className="p-5 bg-white border border-neutral-200 rounded-2xl space-y-4 font-semibold">
                        <div className="flex justify-between items-start gap-3">
                          <span className="font-bold text-[#0B2545] text-[13.5px] leading-tight font-heading">{q.label}</span>
                          <button
                            type="button"
                            onClick={() => setActiveHelp({
                              title: "Special Eco & Support Claims",
                              description: "Tax5 uses this to look for eco claims like EV chargers and composters, first-time home loan interest, donations, or religious travel.",
                              proof: "Keep charger invoices, official charity receipts, bank interest statements, or travel ticket copies.",
                              meaning: "These documents show that your expenses match approved green or welfare support claims."
                            })}
                            className="text-[11px] text-teal-brand font-black hover:underline cursor-pointer shrink-0 mt-0.5"
                          >
                            Need help?
                          </button>
                        </div>
                        <div className="flex gap-2 font-sans font-bold">
                          {(["Yes", "No", "Not sure"] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleProfileCheckbox(q.key as keyof SmartSetupData, opt === "Yes" ? "Yes" : opt === "No" ? "No" : "Not sure")}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                                formData[q.key as keyof SmartSetupData] === (opt === "Yes" ? "Yes" : opt === "No" ? "No" : "Not sure")
                                  ? "bg-teal-brand text-white border-teal-brand font-black"
                                  : "bg-white text-neutral-600 border-neutral-250 hover:bg-neutral-50"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {formData[q.key as keyof SmartSetupData] === "Yes" && (
                          <p className="text-[10.5px] text-[#004D3C] font-semibold bg-teal-50/50 p-2.5 rounded-xl animate-slideDown mt-1 leading-normal">
                            💡 {q.tip}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom tab step navigations */}
            <div className="pt-4 border-t border-neutral-100 flex flex-col gap-3 shrink-0 mt-6 font-semibold">
              {/* First row: Skip Section & Next */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const sequence = ["family", "health", "lifestyle", "insurance", "other"] as const;
                    const idx = sequence.indexOf(profileSection);
                    if (idx < sequence.length - 1) {
                      setProfileSection(sequence[idx + 1]);
                    }
                  }}
                  disabled={profileSection === "other"}
                  className={`py-2.5 px-4 text-xs font-bold rounded-xl cursor-pointer transition-all text-center ${
                    profileSection === "other"
                      ? "bg-neutral-150 text-neutral-400 opacity-40 cursor-not-allowed"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-extrabold"
                  }`}
                >
                  Skip Section
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sequence = ["family", "health", "lifestyle", "insurance", "other"] as const;
                    const idx = sequence.indexOf(profileSection);
                    if (idx < sequence.length - 1) {
                      setProfileSection(sequence[idx + 1]);
                    }
                  }}
                  disabled={profileSection === "other"}
                  className={`py-2.5 px-4 text-xs font-black rounded-xl cursor-pointer transition-all text-center ${
                    profileSection === "other"
                      ? "bg-neutral-150 text-neutral-400 opacity-40 cursor-not-allowed"
                      : "bg-[#0B2545] text-white hover:bg-[#081C35] shadow-3xs"
                  }`}
                >
                  Next
                </button>
              </div>

              {/* Second row: Save Profile */}
              <button
                type="button"
                onClick={handleSaveProfile}
                className="w-full py-3 px-5 bg-teal-brand hover:bg-[#009473] text-white rounded-xl text-xs font-black shadow-3xs cursor-pointer text-center transition-all border-none outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009473] focus-visible:ring-offset-2"
              >
                Save Profile
              </button>
            </div>
            {/* Subtle skip link at the bottom of the setup flow */}
            <div className="flex justify-center pt-2 pb-1">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-neutral-450 hover:text-neutral-600 underline font-semibold transition-all cursor-pointer"
              >
                Skip Setup for Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW: EMPLOYMENT & EA FORM LIST / EDITOR */}
      {false && viewMode === "employment" && (
        <div className="space-y-4 z-10 relative flex-1 flex flex-col animate-fadeIn">
          {/* Sub Header */}
          <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("hub")}
                className="w-7 h-7 bg-white border border-neutral-200/55 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-500" />
              </button>
              <div>
                <h2 className="text-xl font-bold font-heading text-navy">Employment & EA</h2>
                <p className="text-xs text-neutral-500 font-semibold leading-tight mt-0.5">Manage Employer Tax Slips</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveHelp({
                  title: "What is an EA/EC Form?",
                  description: "If you are an employee, your company issues an EA form (private sector) or an EC form (government sector) showing your annual earnings and monthly tax deductions. This is normally given to you early in the year (around Feb or March) for you to file taxes.",
                  meaning: "You don't need to produce this form all year round. It's only needed when completing your final tax draft near April."
                })}
                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-[#0B2545] rounded-full text-[10px] font-black cursor-pointer transition-all"
              >
                What is EA/EC?
              </button>
              <button
                onClick={() => setShowAddEmp(!showAddEmp)}
                className="px-3 py-1.5 bg-[#0B2545] hover:bg-navy text-white rounded-full text-[10.5px] font-bold shadow-3xs cursor-pointer active:scale-95 transition-all flex items-center gap-1 shrink-0"
              >
                {showAddEmp ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{showAddEmp ? "Close form" : "Add Employer"}</span>
              </button>
            </div>
          </div>

          {!showAddEmp && (
            <div className="bg-[#EEF4F2] border border-teal-500/10 p-4.5 rounded-2xl text-left space-y-3 font-semibold text-[#00241A] text-xs leading-normal">
              <div className="flex gap-2 text-navy items-center font-black">
                <Briefcase className="w-5 h-5 text-teal-brand animate-pulse" />
                <span>Employer Income Details</span>
              </div>
              <p className="text-[11px] text-neutral-600">
                These are tax-season details issued by your employer near calendar tax-filing months. You can save and categorize receipts all year round without employer entries. If you do not have your EA/EC form yet, feel free to skip this section entirely!
              </p>
            </div>
          )}

          {/* Render Active Add Employer Form */}
          {showAddEmp ? (
            <form onSubmit={handleAddEmployerSubmit} className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-sm text-left space-y-4 animate-slideDown">
              <div>
                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest block font-heading">
                  Save Employer Slip
                </span>
                <p className="text-[10.5px] text-neutral-500 mt-1 leading-normal font-semibold">
                  These details will be used to automatically propose your draft tax summary. You can skip any field you don't know.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-neutral-500 text-[9px] uppercase mb-1 font-heading">Document Type</label>
                    <div className="flex gap-2">
                      {(["EA form", "EC form"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewEmpDocType(type)}
                          className={`flex-1 h-8 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            newEmpDocType === type
                              ? "bg-[#0B2545] text-white border-[#0B2545] font-black"
                              : "bg-neutral-50 text-neutral-500 border-neutral-250 hover:bg-neutral-100"
                          }`}
                        >
                          {type === "EA form" ? "EA (Private)" : "EC (Govt)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block font-bold text-neutral-500 text-[9px] uppercase">Company / Employer Name</label>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Tech Malaysia Sdn Bhd"
                      className="w-full h-8 px-2.5 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold text-neutral-700 outline-none focus:bg-white focus:ring-[0.5px] focus:ring-teal-brand"
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block font-bold text-neutral-500 text-[9px] uppercase">Employer TIN / E-Ref</label>
                      <button
                        type="button"
                        onClick={() => setActiveHelp({
                          title: "Employer E-Reference Number",
                          description: "An employer registration code issued by LHDN. It typically begins with an 'E' followed by several digits (e.g., E 2919485).",
                          proof: "Usually printed on the top head block of your EA/EC form."
                        })}
                        className="text-[8.5px] text-teal-brand font-black hover:underline cursor-pointer"
                      >
                        What is this?
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. E 2919485"
                      className="w-full h-8 px-2.5 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold font-mono text-neutral-700 outline-none focus:bg-white focus:ring-[0.5px] focus:ring-teal-brand"
                      value={newEmpTin}
                      onChange={(e) => setNewEmpTin(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block font-bold text-neutral-500 text-[9px] uppercase">Employment Period</label>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 01/01 - 31/12"
                      className="w-full h-8 px-2.5 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold font-mono text-neutral-700 outline-none focus:bg-white focus:ring-[0.5px] focus:ring-teal-brand"
                      value={newEmpPeriod}
                      onChange={(e) => setNewEmpPeriod(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block font-bold text-neutral-500 text-[9px] uppercase">Total Annual Income before deductions (RM)</label>
                      <button
                        type="button"
                        onClick={() => setActiveHelp({
                          title: "Annual gross income",
                          description: "This is your total gross salaries, rewards, bonuses, and commission payments received during the year. In your EA Form, look at Section B (Gross Salary/Wages).",
                          proof: "Section B1(a) of the EA Form.",
                          meaning: "Represents salary earnings paid on or before Dec 31."
                        })}
                        className="text-[8.5px] text-teal-brand font-black hover:underline cursor-pointer"
                      >
                        Help
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 84000.00"
                      className="w-full h-8 px-2.5 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold font-mono text-neutral-700 outline-none focus:bg-white"
                      value={newEmpIncome}
                      onChange={(e) => setNewEmpIncome(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block font-bold text-neutral-500 text-[9px] uppercase">My Tax Paid During the Year (MTD/PCB) (RM)</label>
                      <button
                        type="button"
                        onClick={() => setActiveHelp({
                          title: "Monthly Tax Deductions (MTD/PCB)",
                          description: "This is the amount already deducted directly from your salary and paid to LHDN during the calendar year.",
                          proof: "Section D of your EA Form.",
                          meaning: "These pre-payments reduce the final net tax amount you must declare or pay."
                        })}
                        className="text-[8.5px] text-teal-brand font-black hover:underline cursor-pointer"
                      >
                        Help
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 1500.00"
                      className="w-full h-8 px-2.5 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-bold font-mono text-neutral-700 outline-none"
                      value={newEmpMtd}
                      onChange={(e) => setNewEmpMtd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block font-bold text-neutral-500 text-[9px] uppercase">EPF Contribution (RM)</label>
                      <button
                        type="button"
                        onClick={() => setActiveHelp({
                          title: "EPF Provident Fund Savings",
                          description: "Total employee EPF contributions registered with KWSP during the assessment framework year.",
                          proof: "Section G1 of your EA Form.",
                          meaning: "Claimable as tax relief up to RM4,000."
                        })}
                        className="text-[8.5px] text-teal-brand font-black hover:underline cursor-pointer"
                      >
                        Help
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 962.00"
                      className="w-full h-8 px-2 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold font-mono text-neutral-700 outline-none"
                      value={newEmpEpf}
                      onChange={(e) => setNewEmpEpf(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block font-bold text-neutral-500 text-[9px] uppercase">SOCSO (RM)</label>
                      <button
                        type="button"
                        onClick={() => setActiveHelp({
                          title: "SOCSO payments",
                          description: "Standard worker health and safety insurance payment contributions.",
                          proof: "Section G2 of your EA Form.",
                          meaning: "Assists worker relief up to RM350."
                        })}
                        className="text-[8.5px] text-teal-brand font-black hover:underline cursor-pointer"
                      >
                        Help
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 35.00"
                      className="w-full h-8 px-2 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold font-mono text-neutral-700 outline-none"
                      value={newEmpSocso}
                      onChange={(e) => setNewEmpSocso(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="block font-bold text-neutral-500 text-[9px] uppercase">EIS / SIP (RM)</label>
                      <button
                        type="button"
                        onClick={() => setActiveHelp({
                          title: "Employment Insurance System Detail",
                          description: "A small employee insurance scheme safeguarding workers against job displacements.",
                          meaning: "Can be grouped alongside SOCSO for Malaysian filing rules."
                        })}
                        className="text-[8.5px] text-teal-brand font-black hover:underline cursor-pointer"
                      >
                        Help
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 7.90"
                      className="w-full h-8 px-2 bg-neutral-50 border border-neutral-250 rounded-lg text-xs font-semibold font-mono text-neutral-700 outline-none"
                      value={newEmpEis}
                      onChange={(e) => setNewEmpEis(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-neutral-500 text-[9px] uppercase mb-1">Tax Borne By Employer?</label>
                  <div className="flex gap-2">
                    {(["Yes", "No"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setNewEmpTaxBorne(opt)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          newEmpTaxBorne === opt
                            ? "bg-indigo-950 text-white border-indigo-950"
                            : "bg-neutral-50 text-neutral-500 border-neutral-250 hover:bg-neutral-100"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-150">
                <button
                  type="button"
                  onClick={() => setShowAddEmp(false)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-500 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-brand hover:bg-[#009473] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3.5 flex-1 flex flex-col">
              {employers.length === 0 ? (
                <div className="bg-white border border-neutral-200/55 rounded-2xl p-8 shadow-3xs flex-1 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 bg-neutral-100/70 border rounded-full flex items-center justify-center text-neutral-400">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[13px] text-navy font-heading">No Employers Added</h4>
                    <p className="text-[11px] text-neutral-400 font-semibold px-4 max-w-xs leading-normal mt-1">
                      Save receipts first to monitor relief limits. Complete EA employer statement inputs near tax season to construct your Form BE draft.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddEmp(true)}
                    className="px-4 py-1.5 border border-indigo-200 hover:bg-neutral-50 text-indigo-950 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-indigo-900" />
                    <span>Add First Employer</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar max-h-[360px]">
                  {employers.map((emp) => (
                    <div key={emp.id} className="p-4 border border-neutral-250/50 bg-white rounded-2xl shadow-3xs text-left relative flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                              (emp.docType || "EA form") === "EA form"
                                ? "bg-teal-brand-light text-teal-brand border border-teal-brand/10"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200/50"
                            }`}>
                              {(emp.docType || "EA form") === "EA form" ? "EA" : "EC"}
                            </span>
                            <h4 className="font-extrabold text-[#0B2545] text-xs font-heading shrink-0">{emp.name}</h4>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-semibold font-mono block mt-1">TIN: {emp.tin} • Period: {emp.period}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteEmployer(emp.id)}
                          className="w-7 h-7 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-2.5 rounded-xl text-[10.5px] font-bold text-neutral-600 font-mono">
                        <div>Income: <span className="text-navy font-extrabold">RM {emp.income.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                        <div>MTD Paid: <span className="text-navy font-extrabold">RM {emp.mtd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                        <div>EPF sum: <span className="text-navy font-bold">RM {(emp.epf || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                        <div>Social Sec: <span className="text-navy font-bold">RM {((emp.socso || 0) + (emp.eis || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-[#EAF7F5] border border-teal-500/10 p-3.5 rounded-2xl flex justify-between items-center text-[11px] font-bold text-teal-900 block font-heading">
                    <div>
                      <span className="block font-black">Employer summary totals:</span>
                      <span className="text-[9.5px] text-neutral-500 font-sans font-medium">{employers.length} statements registered</span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="block font-black text-teal-900">
                        RM {(parseFloat(formData.annualEmploymentIncome || "0")).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] font-sans text-neutral-500 font-medium">Sum MTD: RM {(parseFloat(formData.pcbPaid || "0")).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* RENDER VIEW: RECEIPT CLAIMS REVIEW DASHBOARD */}
      {false && viewMode === "claimsReview" && (
        <div className="space-y-4 z-10 relative flex-1 flex flex-col animate-fadeInBox">
          {/* Sub Header */}
          <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("hub")}
                className="w-7 h-7 bg-white border border-neutral-200/55 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-neutral-500" />
              </button>
              <div>
                <h2 className="text-xl font-bold font-heading text-navy">Claims Analysis</h2>
                <p className="text-xs text-neutral-500 font-semibold leading-tight mt-0.5">Scanned Receipts vs Limits</p>
              </div>
            </div>
          </div>

          {/* Quick instructions */}
          <div className="p-3 bg-[#EEFAF3] border border-teal-500/10 rounded-2xl text-[11px] font-semibold text-neutral-600 text-left leading-relaxed">
            Receipt claims below reflect your scanned files currently saved in Tax5. Progress capped automatically at maximum LHDN limits:
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-3xs text-left space-y-4 flex-1">
            <h3 className="font-extrabold text-[12px] text-[#0B2545] font-heading border-b border-neutral-100 pb-1 uppercase tracking-wider">
              Category Claim Capping Analysis
            </h3>

            <div className="space-y-3.5">
              {[
                { category: ClaimCategory.Lifestyle, limit: 2500, label: "G9 Lifestyle (Books, Tech, Internet)" },
                { category: ClaimCategory.Sports, limit: 1000, label: "G10 Sports Equipment & Gym" },
                { category: ClaimCategory.Medical, limit: 10000, label: "G6/G7 Medical (Self/Spouse/Children)" },
                { category: ClaimCategory.Education, limit: 7000, label: "G5 Education Courses" }
              ].map((c) => {
                const total = categoryTotals[c.category] || 0;
                const progress = Math.min(100, (total / c.limit) * 100);

                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between items-baseline text-[11px] font-bold text-neutral-700">
                      <span>{c.label}</span>
                      <span className="font-mono text-xs">
                        RM {total.toFixed(2)} of RM{c.limit.toLocaleString("en-US")}
                      </span>
                    </div>

                    <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progress >= 100 ? "bg-amber-500" : "bg-teal-brand"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl space-y-2 text-[10.5px] text-neutral-550 border border-neutral-200/50 leading-normal">
              <span className="font-black text-navy block font-heading">DIAGNOSTIC VERIFICATION</span>
              <div className="flex items-center gap-1.5 font-semibold text-[#00140D]">
                <CheckCircle className="w-4 h-4 text-teal-brand shrink-0" />
                <span>Camera scan and smart categorization active</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#00140D]">
                <CheckCircle className="w-4 h-4 text-teal-brand shrink-0" />
                <span>Malaysian tax year 7-year keeping mandate reminder enabled</span>
              </div>
            </div>

            <button
              onClick={onCancel}
              className="w-full bg-[#0B2545] text-white py-2 px-4 rounded-xl text-xs font-bold hover:bg-navy transition-all cursor-pointer shadow-3xs"
            >
              Back to Receipts List
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM DRAWER FOR HELPER TRIGGERS */}
      {activeHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-end justify-center z-50 animate-fadeIn" onClick={() => setActiveHelp(null)}>
          <div 
            className="w-full max-w-md bg-white rounded-t-3xl p-5 text-left space-y-4 shadow-xl border-t border-neutral-100 max-h-[85vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <h3 className="font-extrabold text-navy text-sm font-heading flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-teal-brand" />
                <span>{activeHelp.title}</span>
              </h3>
              <button
                onClick={() => setActiveHelp(null)}
                className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center font-bold text-xs text-neutral-550 hover:bg-neutral-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
              {activeHelp.description}
            </p>

            {(activeHelp.proof || activeHelp.meaning) && (
              <div className="bg-[#FAFDFD] border border-teal-500/10 p-3 rounded-2xl text-[11px] space-y-3 font-semibold text-[#002B21]">
                {activeHelp.proof && (
                  <div>
                    <span className="font-extrabold text-teal-brand uppercase text-[9.5px] block font-heading">Proof to Keep</span>
                    <p className="text-neutral-750 leading-normal mt-0.5 font-bold">{activeHelp.proof}</p>
                  </div>
                )}
                {activeHelp.meaning && (
                  <div>
                    <span className="font-extrabold text-teal-brand uppercase text-[9.5px] block font-heading">What this proof means</span>
                    <p className="text-neutral-550 leading-normal mt-0.5">{activeHelp.meaning}</p>
                  </div>
                )}
              </div>
            )}

            <div className="text-[11px] font-semibold text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-200/50 leading-normal">
              💡 <span className="font-bold text-neutral-600">If you are not sure:</span> Choose &ldquo;Not sure&rdquo;. Tax5 can still save your receipt and mark it as Need Review until more details are added.
            </div>

            <button
              onClick={() => setActiveHelp(null)}
              className="w-full py-2 bg-teal-brand hover:bg-[#009473] text-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer transition-all"
            >
              I understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
