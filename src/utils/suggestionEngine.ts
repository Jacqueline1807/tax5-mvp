import { ClaimCategory, ClaimStatus, Receipt, SmartSetupData } from "../types";
import { taxReliefGuidelines } from "../data/taxReliefGuidelines";

export interface AdjustedSuggestion {
  category: ClaimCategory;
  claimStatus: ClaimStatus;
  confidence: "High" | "Medium" | "Low";
  why: string;
  check: string;
}

export function calculateCompletionStatus(data: SmartSetupData | null): "Not started" | "Partly done" | "Ready" {
  if (!data) return "Not started";
  
  let answeredSections = 0;
  
  // Section 1
  if (data.salariedBE !== "" || data.eaUploadName !== "" || (data.availableContributions && data.availableContributions.length > 0)) {
    answeredSections++;
  }
  
  // Section 2
  if (data.childrenCount !== "" || (data.childDetails && data.childDetails.length > 0) || data.supportingParents !== "" || data.spouseSituation !== "") {
    answeredSections++;
  }
  
  // Section 3
  if ((data.disabilityJoint && data.disabilityJoint.length > 0) || data.medicalCertificateUploadName !== "" || (data.medicalReceiptTypes && data.medicalReceiptTypes.length > 0)) {
    answeredSections++;
  }
  
  // Section 4
  if ((data.insuranceRecords && data.insuranceRecords.length > 0) || data.insuranceStatementUploadName !== "") {
    answeredSections++;
  }
  
  // Section 5
  if (data.firstHomeBought !== "" || (data.homeOtherReliefs && data.homeOtherReliefs.length > 0) || data.homeUploadName !== "") {
    answeredSections++;
  }
  
  if (answeredSections === 0) return "Not started";
  if (answeredSections >= 3) return "Ready";
  return "Partly done";
}

export function normalizeGuidelineCode(code: string): string {
  const cleaned = (code || "").toLowerCase().trim();
  if (
    cleaned === "g6" ||
    cleaned === "g7" ||
    cleaned === "g6/g7" ||
    cleaned === "medical" ||
    cleaned === "health screening" ||
    cleaned === "medical / health screening" ||
    cleaned === "medical / health screening (g6/g7)" ||
    cleaned.includes("medical") ||
    cleaned.includes("health screening")
  ) {
    return "G6";
  }
  if (cleaned === "g17/g19") {
    return "G19";
  }
  return (code || "").toUpperCase().trim();
}

export function adjustReceiptSuggestion(
  formBEItem: string,
  category: ClaimCategory,
  initialStatus: ClaimStatus,
  setup: SmartSetupData | null
): AdjustedSuggestion {
  const bCode = normalizeGuidelineCode(formBEItem);
  const guidelineExists = !!taxReliefGuidelines[bCode];

  // Defaults
  let finalStatus = initialStatus;
  let confidence: "High" | "Medium" | "Low" = "Medium";
  let why = `This receipt appears to be for ${category.toLowerCase()} spending.`;
  let check = "Confirm it was for personal or family use and keep the digital receipt.";

  // Childcare centre or kindergarten (G12)
  if (bCode === "G12") {
    const hasChildUnder6 = setup?.hasChildUnder6 === "Yes" || setup?.childDetails?.includes("Child under 6 years old");
    const isUnsureOrNo = setup?.hasChildUnder6 === "No" || setup?.hasChildUnder6 === "Not sure" || setup?.hasChildUnder6 === "";
    
    if (hasChildUnder6) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Form BE 2025 childcare relief applies as you confirmed having a child aged 6 or below in Smart Claim Setup.";
      check = "Keep child’s birth document/MyKid and monthly fee receipts issued by the registered childcare centre/kindergarten.";
    } else if (isUnsureOrNo) {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Low";
      why = "Needs Review. Child care relief was not confirmed or is unsure in your Smart Claim Setup. Receipts are still allowed to track.";
      check = "Ensure the child is under 6 years old, taska/tadika is registered with JKM/MOE, and keep the monthly receipts & child’s birth document.";
    }
  }
  // Breastfeeding equipment (G11)
  else if (bCode === "G11") {
    const hasChildUnder2 = setup?.hasChildUnder2 === "Yes" || setup?.childDetails?.includes("Child under 2 years old");
    const isUnsureOrNo = setup?.hasChildUnder2 === "No" || setup?.hasChildUnder2 === "Not sure" || setup?.hasChildUnder2 === "";
    
    if (hasChildUnder2) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Breastfeeding equip claim matches your confirmed child aged 2 years or below in setup.";
      check = "Keep receipts for breastfeeding equipment (breast pump kit, milk storage, ice pack, or cooler bag) on file.";
    } else if (isUnsureOrNo) {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Low";
      why = "Needs Review. Child under 2 was not confirmed or is unsure in Smart Claim Setup. Receipts are allowed but need matching proof.";
      check = "Receipt is allowed, but keep receipts for breast pump/milk storage or cooler bag, and check child is under 2.";
    }
  }
  // Child education-related / higher studying (G15 or college)
  else if (bCode === "G15" || bCode === "G16" || formBEItem.toLowerCase().includes("child") && category === ClaimCategory.Education) {
    const studying = setup?.hasChild18Studying === "Yes" || setup?.childDetails?.includes("Child 18+ and studying");
    
    if (studying) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Matches child education relief since you confirmed having a child aged 18+ who is studying in setup.";
      check = "Keep proof of the child’s study status or education documents where relevant.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. Child studying status was not confirmed in Smart Claim Setup. This receipt is allowed but marked for checking.";
      check = "Confirm the child’s study status and keep school/college/university tuition fee payment documents.";
    }
  }
  // OKU / Disabled child or Disability تجهیزات (G3/G15 disability)
  else if (bCode === "G3" || formBEItem.toLowerCase().includes("disabled") || formBEItem.toLowerCase().includes("oku") || formBEItem.toLowerCase().includes("therapy")) {
    const hasOKU = setup?.registeredDisabled === "Yes" || setup?.hasDisabledChild === "Yes" || (setup?.childDetails && setup.childDetails.includes("Disabled child")) || (setup?.disabilityJoint && setup.disabilityJoint.length > 0 && !setup.disabilityJoint.includes("None"));
    
    if (hasOKU) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Matches disability-related supporting equipment or therapy based on your Smart Claim Setup.";
      check = "Keep written certification or registration proof from the Department of Social Welfare (DSW/JKM).";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Low";
      why = "Needs Review. OKU/disability registration was not confirmed or is unsure in your Smart Claim Setup. Claims are still tracked.";
      check = "Ensure JKM/DSW certification is available. Supporting equipment or therapy cannot be claimed without registration.";
    }
  }
  // Supporting parents or grandparents clinical/medical expense (G2)
  else if (bCode === "G2" || formBEItem.toLowerCase().includes("parent")) {
    const supportsParents = setup?.supportingParents === "Yes";
    const isUnsureOrNo = setup?.supportingParents === "No" || setup?.supportingParents === "Not sure" || setup?.supportingParents === "";
    
    if (supportsParents) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Parent support certified medical expenses matches your confirmed setup answers.";
      check = "Keep official hospital/clinic receipts and medical practitioner certification of parent needs.";
    } else if (isUnsureOrNo) {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Low";
      why = "Needs Review. Parent medical support was not confirmed in your Smart Claim Setup. Kept for records but requires certification.";
      check = "Confirm expenses are for medical treatment, special needs, or carer of resident parents, and keep practitioner certified proof.";
    }
  }
  // Serious disease medical treatment (G4 / G5 or similar medical)
  else if (formBEItem.toLowerCase().includes("serious") || bCode === "G4") {
    const isSerious = setup?.seriousDiseaseTreatment === "Yes";
    if (isSerious) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Form BE 2025 serious disease claim matches your declared medical setup details.";
      check = "Keep official treatment receipts and MMC-registered practitioner certification.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. Serious disease medical treatment was not confirmed in Smart Claim Setup. Kept for calculation but flagged.";
      check = "Official treatment receipts and medical practitioner registered certification are required for LHDN audit.";
    }
  }
  // Fertility treatment G14
  else if (bCode === "G14" || formBEItem.toLowerCase().includes("fertility")) {
    const isFertility = setup?.fertilityTreatment === "Yes";
    if (isFertility) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Fertility medical claim matches your declared IVF/IUI/consultation answer.";
      check = "Keep official receipts and registered medical practitioner certification.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. Fertility treatment was not checked in Smart Claim Setup. Kept for record but needs physician certification.";
      check = "Ensure medical receipts and official written certification from your physician are saved.";
    }
  }
  // Vaccinations, dental examination, medical check-up (G6)
  else if (
    bCode === "G6" || 
    bCode === "G7" || 
    bCode === "G6/G7" || 
    formBEItem.toLowerCase().includes("medical") || 
    formBEItem.toLowerCase().includes("health") || 
    formBEItem.toLowerCase().includes("dental") || 
    formBEItem.toLowerCase().includes("vaccin") || 
    formBEItem.toLowerCase().includes("screening")
  ) {
    const isScreening = setup?.vaccinationDentalCheckup === "Yes";
    if (isScreening) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Vaccination or health screenings are eligible under your active Medical options.";
      check = "Keep official receipts for health screening, examinations, or vaccines.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. Screenings or dental claims weren't selected in Smart Claim Setup but are tracked under medical limits.";
      check = "Keep official receipts. For dental check-ups, ensure a registered dental practitioner clinic receipt.";
    }
  }
  // Mental health guidance / consultation
  else if (formBEItem.toLowerCase().includes("mental") || formBEItem.toLowerCase().includes("psychology")) {
    const isMental = setup?.mentalHealthConsultation === "Yes";
    if (isMental) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Mental health consultation matches your confirmed guidance options in Smart Claim Setup.";
      check = "Keep official consultation receipts issued by registered psychiatrists, psychologists, or registered counsellors.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. Mental health guidance wasn't confirmed in setup. Flagged to verify professional provider type.";
      check = "Must be certified by psychiatrist, psychologist, or counsellor. Keep registered receipts.";
    }
  }
  // Child learning disability assessment/treatment
  else if (formBEItem.toLowerCase().includes("learning") || formBEItem.toLowerCase().includes("autism") || formBEItem.toLowerCase().includes("adhd")) {
    const isLearning = setup?.childLearningDisability === "Yes";
    if (isLearning) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Child learning disability assessments align with your Smart Claim Setup.";
      check = "Keep receipts from registered medical or allied health practitioners alongside child learning disability proof.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. Child learning disability wasn't selected in setup. Flagged for assessment verification.";
      check = "Assessment receipts must be from registered practitioners. Verify child is under 18.";
    }
  }
  // Insurance - Life Insurance / Family Takaful (G17 / G18)
  else if (bCode === "G17" || bCode === "G18" || (bCode === "G19" && setup?.lifeInsuranceFamilyTakaful === "Yes")) {
    const hasLifeInsu = setup?.lifeInsuranceFamilyTakaful === "Yes" || setup?.insuranceRecords?.includes("Life insurance / takaful statement");
    if (hasLifeInsu) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Premium matches your confirmed life insurance details in Smart Claim Setup.";
      check = "Keep insurance premium statement, annual statement, or official receipt.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Low";
      why = "Needs Review. Life insurance premium was not confirmed in Smart Setup. Flagged for policy statement matching.";
      check = "Ensure a valid premium statement is present. Keep insurance statement showing it is G17 eligible.";
    }
  }
  // Medical or Education Insurance (G19)
  else if (bCode === "G19") {
    const hasMedEdu = setup?.medicalEducationInsurance === "Yes" || setup?.insuranceRecords?.includes("Medical insurance statement") || setup?.insuranceRecords?.includes("Education insurance statement");
    if (hasMedEdu) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Matches your declared medical or education insurance policy setup.";
      check = "Keep insurance payment statement indicating medical or education rider details.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Low";
      why = "Needs Review. Medical/education insurance was not confirmed. Check policy details to identify the correct category.";
      check = "Keep insurance statement showing whether the policy is medical, education, or a general life rider.";
    }
  }
  // PRS - Private Retirement Scheme (G21)
  else if (bCode === "G21" || formBEItem.toLowerCase().includes("prs") || formBEItem.toLowerCase().includes("annuity")) {
    const hasPrs = setup?.prsDeferredAnnuity === "Yes" || setup?.insuranceRecords?.includes("PRS statement");
    if (hasPrs) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Matches your private retirement savings contributions declared in setup.";
      check = "Keep PRS or deferred annuity payment transaction statements.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. PRS contribution was not selected in Smart Claim Setup. Marked for statement checking.";
      check = "Keep official PRS/deferred annuity statements issued by approved providers.";
    }
  }
  // SSPN (G13)
  else if (bCode === "G13" || formBEItem.toLowerCase().includes("sspn")) {
    const hasSspn = setup?.sspnSavingsChild === "Yes" || setup?.insuranceRecords?.includes("SSPN statement");
    const isNotSure = setup?.sspnSavingsChild === "Not sure";
    
    if (hasSspn) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Child SSPN relief matches your child savings profile. Remember to check your SSPN statement and update the final amount if needed before finishing.";
      check = "Check your SSPN statement and update the final amount if needed.";
    } else if (isNotSure) {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Low";
      why = "Needs Review. SSPN receipt scanned but child savings is 'Not sure' in setup. Try to check your SSPN statement and update the final amount if needed.";
      check = "Check your SSPN statement and update the final amount if needed.";
    } else {
      // "No" or not set
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Low";
      why = "Needs Review. Tax5 detected an SSPN receipt but child education savings is turned off in setup.";
      check = "Check your SSPN statement and update the final amount if needed.";
    }
  }
  // First Residential property home loan (G22)
  else if (bCode === "G22") {
    const hasHome = setup?.firstResidentialProperty === "Yes" || setup?.firstHomeBought === "Yes";
    if (hasHome) {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "High";
      why = "Matches first home interest relief based on your home purchase declared in Smart Setup. Specific dates apply.";
      check = "Keep SPA, housing loan contracts, annual interest rate sheets, and evidence of sole residence.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Low";
      why = "Needs Review. First residential property interest claim is flagged due to strict eligibility constraints (SPA 2025-2027).";
      check = "Keep Sale & Purchase Agreement, loan ledger, interest statements, and proof it's your first dwelling.";
    }
  }
  // EV charging facility (G23 or EV)
  else if (formBEItem.toLowerCase().includes("ev") || formBEItem.toLowerCase().includes("charger") || bCode === "G23") {
    const hasEV = setup?.evChargingFacility === "Yes" || setup?.homeOtherReliefs?.includes("EV charging receipt/subscription");
    if (hasEV) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! EV charging subscription/installation matches your confirmed setup vehicle info.";
      check = "Keep official receipts/subscription bills. Must be for your own personal vehicle, not business.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. EV charger claiming wasn't checked in Smart Claim Setup. Flagged to check vehicle usage.";
      check = "Receipt must correspond to own vehicle charger purchase/rental/subscription. Personal use only.";
    }
  }
  // Composting machine (G24)
  else if (formBEItem.toLowerCase().includes("compost") || bCode === "G24") {
    const hasCompost = setup?.compostingMachine === "Yes" || setup?.homeOtherReliefs?.includes("Food waste compost machine receipt");
    if (hasCompost) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Composting machine receipt details match household compost answers.";
      check = "Keep composting machine purchase receipt on file. Limit is RM500 for household use.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. Composting machine selection was not active in Smart Claim Setup.";
      check = "Ensure the composting machine is for household food waste. Keep the standard purchase invoice.";
    }
  }
  // Approved donations (G25)
  else if (formBEItem.toLowerCase().includes("donation") || bCode === "G25") {
    const hasDonation = setup?.approvedDonationsGifts === "Yes";
    if (hasDonation) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Approved donation receipt matches your active donation profiles.";
      check = "Keep official approved donation receipts with tax exemption reference stamps.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. Exemption status is unverified. Flagged to confirm donation organization is LHDN approved.";
      check = "Keep official registered donation receipts. Donations must be to approved bodies under Sec 44(6).";
    }
  }
  // Departure levy for umrah / pilgrimage (G26)
  else if (formBEItem.toLowerCase().includes("departure") || formBEItem.toLowerCase().includes("umrah") || bCode === "G26") {
    const hasLevy = setup?.departureLevyReligious === "Yes";
    if (hasLevy) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Departure levy matches your confirmed religious travel setup answers.";
      check = "Keep boarding passes, air tickets, or visa copy for umrah/pilgrimage verification.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. Religious travel departure levy rebate has specific limits. Flight documents required.";
      check = "Keep air tickets, boarding cards, and written certification from pilgrimage bodies if non-umrah.";
    }
  }
  // SOCSO / PERKESO (G20)
  else if (bCode === "G20") {
    const hasSocsoRecords = setup?.availableContributions?.includes("SOCSO / PERKESO") || 
                            setup?.availableContributions?.includes("EIS / SIP") ||
                            setup?.insuranceRecords?.includes("SOCSO / EIS record") || 
                            !!setup?.eaUploadName;
    if (hasSocsoRecords) {
      finalStatus = ClaimStatus.Claimable;
      confidence = "High";
      why = "Suggested confidently! Matches contribution records confirmed in your Smart Claim Setup.";
      check = "Confirm contribution matches the values listed on your EA form or payslip.";
    } else {
      finalStatus = ClaimStatus.CheckAgain;
      confidence = "Medium";
      why = "Needs Review. Check against EA form or payroll statements.";
      check = "Ensure you have your EA form or payslip available to cross-reference SOCSO/EIS amounts.";
    }
  }
  // G9 Lifestyle standard (G9) / G10 Sports lifestyle (G10)
  else if (bCode === "G9") {
    finalStatus = ClaimStatus.Claimable;
    confidence = "High";
    why = "Matches standard Lifestyle (books, journals, personal electronics, internet) under BE 2025 guidelines.";
    check = "Confirm it was for personal or spouse/child use. Keep standard digital invoice.";
  } else if (bCode === "G10") {
    finalStatus = ClaimStatus.Claimable;
    confidence = "High";
    why = "Matches Sports Lifestyle (sports gear, rent, race fees) under BE 2025 guidelines.";
    check = "Personal or spouse/child use. Keep standard digital receipt/invoice.";
  } else {
    // Fallbacks
    if (finalStatus === ClaimStatus.Claimable) {
      confidence = "High";
      why = `This receipt appears to be for ${category.toLowerCase()} spending.`;
      check = "Confirm it was for personal or family use.";
    } else if (finalStatus === ClaimStatus.NonClaimable) {
      confidence = "Low";
      why = "This transaction does not match any allowed tax relief category under Form BE.";
      check = "Do not claim this on your personal tax return.";
    } else {
      confidence = "Medium";
      why = `This transaction matches ${formBEItem || category} which requires standard check guides.`;
      check = "Verify specific receipts, certifications, or registered providers before filing.";
    }
  }
  
  // Safeguards for consistency:
  // 1. If no valid insight guideline exists in our tax library, the claim status must be set to Needs Review (CheckAgain)
  if (!guidelineExists) {
    finalStatus = ClaimStatus.CheckAgain;
    confidence = "Low";
    why = "Tax5 could not match this receipt to a guideline yet.";
    check = "Please review manually using the latest LHDN/MyTax information.";
  }
  // 2. If the initial status indicates review (e.g. OCR needsReview, complex_bill, or manual unmatched), keep it as such
  else if (initialStatus === ClaimStatus.CheckAgain || initialStatus === ClaimStatus.NonClaimable) {
    finalStatus = initialStatus;
  }

  return {
    category,
    claimStatus: finalStatus,
    confidence,
    why,
    check
  };
}
