/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ClaimCategory {
  Lifestyle = "Lifestyle",
  Medical = "Medical",
  Education = "Education",
  Sports = "Sports",
  Insurance = "Insurance",
  Other = "Other"
}

export enum ClaimStatus {
  Claimable = "Claimable",
  CheckAgain = "Check Again",
  NonClaimable = "Non-claimable"
}

export interface TaxReliefGuideline {
  formItemCode: string;
  displayName: string;
  evidenceType: string;
  keywords: string[];
  suggestedAppCategory: ClaimCategory;
  defaultStatus: ClaimStatus;
  checkAgainConditions: string;
  userFacingNote: string;
  claimLimit?: string;
  requiredChecks: string[];
  sourceNote: string;
  lastReviewedYear: number;
}

export interface Receipt {
  id: string;
  merchant: string;
  date: string;
  amount: number;
  category: ClaimCategory;
  claimStatus: ClaimStatus;
  notes: string;
  imageName?: string;
  createdAt: string;
  updatedAt: string;
  formBEItem?: string;
  tax5DisplayName?: string;
  evidenceType?: string;
  note?: string;
  detectedText?: string;
  confidence?: "High" | "Medium" | "Low";
  suggestionWhy?: string;
  suggestionCheck?: string;
}

export type ScreenType = 
  | "SPLASH"
  | "WELCOME"
  | "DEMO_ACCESS"
  | "HOME"
  | "ADD_SCAN"
  | "RECEIPT_LIST"
  | "RECEIPT_EDIT"
  | "TAX_SUMMARY"
  | "SMART_SETUP"
  | "ASK_TAX5";

export interface SmartSetupData {
  fullName?: string;
  email?: string;
  yearOfAssessment?: string;
  tin?: string;
  identificationNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  salariedBE: "Yes" | "No" | "Not sure" | "";
  eaUploadName: string;
  availableContributions: string[];
  annualEmploymentIncome?: string;
  numberOfEmployments?: "1" | "2" | "3 or more" | "Not sure" | "";
  pcbPaid?: string;
  epfAmount?: string;
  socsoAmount?: string;
  eisAmount?: string;
  childrenCount: "0" | "1" | "2" | "3 or more" | "Prefer not to say" | "Yes" | "No" | "Not sure" | "";
  childDetails: string[];
  supportingParents: "Yes" | "No" | "Not sure" | "";
  spouseSituation: "Spouse with no income" | "Paying alimony" | "None" | "Not sure" | "Prefer not to say" | "";
  disabilityJoint: string[];
  medicalCertificateUploadName: string;
  medicalReceiptTypes: string[];
  insuranceRecords: string[];
  insuranceStatementUploadName: string;
  firstHomeBought: "Yes" | "No" | "Not sure" | "";
  homeOtherReliefs: string[];
  homeUploadName: string;
  
  // New specific questions for the tax-explanatory guide UI
  hasChildUnder18?: "Yes" | "No" | "Not sure" | "";
  hasChildUnder6?: "Yes" | "No" | "Not sure" | "";
  hasChildUnder2?: "Yes" | "No" | "Not sure" | "";
  hasChild18Studying?: "Yes" | "No" | "Not sure" | "";
  hasDisabledChild?: "Yes" | "No" | "Not sure" | "";
  
  registeredDisabled?: "Yes" | "No" | "Not sure" | "";
  seriousDiseaseTreatment?: "Yes" | "No" | "Not sure" | "";
  fertilityTreatment?: "Yes" | "No" | "Not sure" | "";
  vaccinationDentalCheckup?: "Yes" | "No" | "Not sure" | "";
  mentalHealthConsultation?: "Yes" | "No" | "Not sure" | "";
  childLearningDisability?: "Yes" | "No" | "Not sure" | "";

  lifeInsuranceFamilyTakaful?: "Yes" | "No" | "Not sure" | "";
  medicalEducationInsurance?: "Yes" | "No" | "Not sure" | "";
  prsDeferredAnnuity?: "Yes" | "No" | "Not sure" | "";
  sspnSavingsChild?: "Yes" | "No" | "Not sure" | "";

  firstResidentialProperty?: "Yes" | "No" | "Not sure" | "";
  evChargingFacility?: "Yes" | "No" | "Not sure" | "";
  compostingMachine?: "Yes" | "No" | "Not sure" | "";
  approvedDonationsGifts?: "Yes" | "No" | "Not sure" | "";
  departureLevyReligious?: "Yes" | "No" | "Not sure" | "";

  // Spouse refined fields
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed" | "Divorced / Widowed" | "Prefer not to say" | "";
  spouseAssessmentSituation?: "My spouse has income" | "My spouse has no income" | "Choosing joint assessment" | "Not sure yet" | "";
  spouseAssessmentChoice?: "Separately from my spouse" | "Together under my name" | "Together under my spouse's name" | "My spouse has no income" | "Not sure yet" | "";
  disabledSpouse?: "Yes" | "No" | "Not sure" | "";
  paidAlimony?: "Yes" | "No" | "Not sure" | "";
  assessmentTypeA6?: string;
  spouseReliefG14Type?: string;
  disabledSpouseG15?: string;
  maritalStatusA4?: string;
  alimonyFormerWifeG14?: "Yes" | "No" | "Not sure" | "";
}

export interface CategoryInfo {
  name: ClaimCategory;
  limit: number;
  description: string;
}

export const CATEGORY_LIMITS: Record<ClaimCategory, CategoryInfo> = {
  [ClaimCategory.Lifestyle]: {
    name: ClaimCategory.Lifestyle,
    limit: 2500,
    description: "Reading materials, personal computer/smartphone, internet subscription, gym membership, printed newspaper."
  },
  [ClaimCategory.Medical]: {
    name: ClaimCategory.Medical,
    limit: 10000,
    description: "Serious illness treatment, vaccination, complete medical examination, mental health guidance."
  },
  [ClaimCategory.Education]: {
    name: ClaimCategory.Education,
    limit: 7000,
    description: "Course of study in recognized institutions (self, master's or doctorate degree)."
  },
  [ClaimCategory.Sports]: {
    name: ClaimCategory.Sports,
    limit: 1000,
    description: "Purchase of sports equipment, rental, entrance fee, registration fee for competition."
  },
  [ClaimCategory.Insurance]: {
    name: ClaimCategory.Insurance,
    limit: 3000,
    description: "Life insurance premium paid to approved companies."
  },
  [ClaimCategory.Other]: {
    name: ClaimCategory.Other,
    limit: 1000,
    description: "Other allowable direct reliefs under Form BE guidelines."
  }
};
