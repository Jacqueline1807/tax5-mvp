import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "EN" | "BM";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (section: string, key: string) => string;
}

const translations: Record<Language, Record<string, Record<string, string>>> = {
  EN: {
    common: {
      demoMode: "Demo Mode",
      ready: "Ready",
      inProgress: "In progress",
      needsReview: "Needs review",
      exitDemo: "Exit Demo Mode",
      signOut: "Sign Out",
      profileSetup: "Profile Setup",
      account: "Account",
      back: "Back",
      save: "Save",
      cancel: "Cancel",
      clear: "Clear",
      send: "Send",
      noReceipts: "No receipts available. Click 'Scan Receipt' or 'Manual Add' above to begin.",
      statusClaimable: "Claimable",
      statusCheckAgain: "Check Again",
      statusNonClaimable: "Non-claimable",
      close: "Close",
      navHome: "Home",
      navReceipts: "Receipts",
      navAskTax5: "Ask Tax5",
      navSummary: "Summary"
    },
    splash: {
      tagline: "Your Form BE pre-filing assistant",
      badge: "Pre-filing MVP Demo v1.0",
      preparing: "Preparing your tax helpers...",
      footer: "Digitize receipts. Plan, sort, and draft claims safely."
    },
    welcome: {
      title: "Take 5 minutes to get tax-ready.",
      subtitle: "Scan receipts, organize claims, and prepare your Form BE draft.",
      badge: "Pre-filing MVP Demo v1.0",
      tryDemo: "Try Demo",
      startApp: "Start App",
      disclaimer: "Preparation guide only. Final filing is done through MyTax/e-Filing."
    },
    demoAccess: {
      titleWelcome: "Get Started with Tax5",
      subtitle: "Scan receipts, manage claims, and prepare your Form BE draft.",
      subtitleWelcome: "Sign up or log in to store actual receipts on our secure cloud account, or access offline demo profile.",
      emailLabel: "Email Address",
      emailPlace: "e.g. name@domain.com",
      passLabel: "Password",
      passPlace: "Enter password",
      nameLabel: "Your Full Name",
      namePlace: "e.g. Ali bin Ahmad",
      forgotPass: "Forgot password?",
      orDivider: "OR CHOOSE DEMO PROFILE",
      dontNeedAcc: "Don't need an account? Test the complete Tax5 interactive demo securely without registering:",
      tryDemoBtn: "Launch Demo Mode",
      demoDisclaimer: "For quick MVP testing only. Data stays on this device/browser.",
      loginTitle: "Sign in to Tax5",
      signupTitle: "Create Account",
      loginBtn: "Sign in",
      signupBtn: "Create Account",
      signupPrompt: "Don’t have an account?",
      loginPrompt: "Already have an account?",
      loginToggle: "Sign In",
      signupToggle: "Create Account",
      backToWelcome: "Back to welcome page",
      forgotPassTitle: "Password Reset",
      forgotPassDesc: "Password reset will be available after account setup.",
      errEmail: "Please enter an email address.",
      errPass: "Please enter a password.",
      errName: "Please enter your full name.",
      msgLoggingIn: "Welcome back! Signing you in...",
      msgCreating: "Creating your account...",
      msgSuccessIn: "Success! Account created and signing you in...",
      msgSuccessVerify: "Success! Please check your email to confirm registration."
    },
    home: {
      totalClaimed: "Total Claimed",
      estRelief: "Estimated Relief",
      taxesSaved: "Taxes Saved",
      claimsAdded: "Claims added",
      smartSetupCardTitle: "Profile & Smart Tax Setup",
      smartSetupCardDesc: "Verify your assessment info and pre-fill automatic G1 individual relief or G17 EPF limits.",
      smartBtnEdit: "Edit Setup",
      smartBtnStart: "Complete Setup",
      sectionHeaderCategories: "Tax Relief Categories",
      secAddReceipt: "Add Receipt",
      secManualBtn: "Manual Add",
      secScanBtn: "Scan Receipt",
      receiptStatusHeader: "Claim Status Summary"
    },
    addScan: {
      scanTitle: "Scan Receipt",
      uploadTitle: "Upload Photo/File",
      takePhotoTitle: "Take Raw Photo",
      orChooseTitle: "OR CHOOSE A DEMO RECEIPT",
      demoReceiptsInstruction: "Want to try scanning without sharing actual receipts? Click a demo template to simulate immediate extraction:",
      templateBookstore: "Popular Bookstore (Education)",
      templatePharmacy: "Caring Pharmacy (Medical/Dental)",
      templateSports: "Decathlon Malaysia (Sports)",
      dropActive: "Drop the file here...",
      dragPrompt: "Drag & drop receipt image, or click to browse",
      processingSecurely: "Scanning receipt with Gemini OCR...",
      detectedTextHeader: "Extracted Text Results",
      confidenceHeader: "AI Confidence Status",
      reviewFormTitle: "Match & Verify Details",
      merchantLabel: "Merchant / Vendor Name",
      merchantPlace: "Merchant name",
      dateLabel: "Transaction Date",
      datePlace: "YYYY-MM-DD",
      amountLabel: "Spent Amount (RM)",
      amountPlace: "0.00",
      notesLabel: "Custom Notes / Claim Purpose",
      notesPlace: "e.g. Purchase of Java textbooks...",
      categoryLabel: "Assigned Claim Category",
      guidelinesTitle: "Form BE Relief & Eligibility Guidelines"
    },
    receipts: {
      receiptsTitle: "Receipt Proofs",
      allStatus: "All Claims",
      checkInvoicesNote: "Upload files or complete scans in PNG, JPEG or PDF formats. Real-time extraction runs server-side securely.",
      searchPlaceholder: "Search receipts (merchant, category, notes, status)...",
      scanHelpBtn: "Scan Receipt",
      setupProfileHelpBtn: "Setup Profile",
      detailsViewTitle: "Receipt Details Proof",
      detailsCategory: "Category",
      detailsAmount: "Amount",
      detailsDate: "Date",
      detailsRef: "Reference ID",
      detailsStatus: "Claim Status",
      detailsNotes: "Notes",
      detailsConfidence: "OCR Confidence",
      detailsReasoning: "Receipt Analysis Note",
      detailsSuggestedCheck: "Recommended Checks",
      detailsEditBtn: "Edit Receipt Details",
      detailsDeleteBtn: "Delete Receipt Proof"
    },
    receiptEdit: {
      editTitle: "Edit Receipt Details",
      guidelineCheckHeader: "Smart Category Insights",
      saveChangesBtn: "Save Changes",
      discardChangesBtn: "Cancel"
    },
    summary: {
      pageTitle: "Form BE Draft & Summary",
      personalInfoTitle: "Form BE Summary Preview",
      personalInfoDesc: "Your tax assessment estimate modeled directly on official LHDN Form BE structure.",
      sectionA: "PART A: INDIVIDUAL PARTICULARS",
      taxPayerName: "Taxpayer Name",
      tinNo: "TIN",
      idNo: "Identification No.",
      sectionB: "PART B: STATUTORY INCOME & TAX PAREMETERS",
      employmentIncome: "B1 Employment Income",
      aggregateIncome: "B5 Aggregate Income",
      totalIncome: "B7 Total Income",
      totalRelief: "B13 Total Relief",
      chargeableIncome: "B14 Chargeable Income",
      taxOnChargeable: "B15 Tax on Chargeable Income",
      totalTaxChargeable: "BC14 Total Tax Chargeable",
      pcbPaid: "PCB/CP500 Monthly Deductions Paid",
      taxUnderpaidOverpaid: "Tax Underpaid / (Overpaid)",
      overpaymentRefund: "Refundable estimate",
      underpaymentPay: "Tax to pay LHDN",
      sectionG: "PART G: RELIEF & MAPPED CLAIM CATEGORIES (DECLARED TAX RELIEFS)",
      sectionGSub: "Full table showing detailed claims, max limits, capped claims, and compliance status.",
      tableColItem: "Item",
      tableColDetails: "Details",
      tableColDeclared: "Declared Spent",
      tableColMaxLimit: "Max Limit",
      tableColClaimed: "Claimed (Capped)",
      tableColStatus: "Status Note",
      evidenceSection: "RECEIPT EVIDENCE ATTACHMENT SUMMARY",
      evidenceSub: "Below you will find the verified receipt evidence that will be bundled with your file.",
      noReceiptImages: "No receipt images have been uploaded yet."
    },
    setup: {
      pageTitle: "Smart Tax Profile Setup",
      mainInstructions: "Configure your personal particulars, employment statistics, and family variables. Tax5 will map and cap claim status dynamically according to current Income Tax Act rules.",
      step1: "1. Personal & Income",
      step2: "2. Family & Dependants",
      step3: "3. Health & Medical Setup",
      step4: "4. Future Assets & Protections",
      step5: "5. Real Estate & Green Tech",
      assessmentYear: "Assessment Year",
      fullNameLabel: "Full Name (Official)",
      emailLabel: "Email Address",
      tinLabel: "Tax Identification Number (TIN)",
      idLabel: "MyKad / ID Passport No.",
      dobLabel: "Date of Birth",
      genderLabel: "Gender",
      salariedCheck: "Are you a salaried employee in Malaysia? (Form BE filer)",
      annualIncomeLabel: "Annual Gross Employment Income (RM)",
      monthlyPcbLabel: "Total PCB (Schedular Tax Deductions) Paid (RM)",
      childrenCountLabel: "Number of children under your care",
      maritalStatusLabel: "Marital Status",
      supportingParentsLabel: "Are you actively supporting elderly parents (medical status/care)?",
      spouseSituationLabel: "Spouse primary assessment situation",
      disabilityJointLabel: "Applicable joint disability scenarios",
      medicalReceiptTypesLabel: "Self/spouse/children medical expenses paid this year",
      insuranceStatementUpload: "Upload Life/Medical Insurance Annual Statement",
      prsVoluntaryContribution: "Are you making Private Retirement Scheme (PRS) contributions?",
      firstHomeQuestion: "Did you buy your first residential property recently (housing loan interest claim)?",
      evChargingQuestion: "Do you have charges/receipts for Electric Vehicle (EV) charging facilities?",
      compostingQuestion: "Did you purchase a domestic waste composting machine?",
      approvedDonatLabel: "Have you made cash donations to approved institutions/bodies?",
      saveAllHeader: "Save Setup Profile",
      saveAllDesc: "Save your answers to automatically load claim caps and personal statutory income limits on the main dashboard.",
      saveSetupBtn: "Save Profile Setup"
    }
  },
  BM: {
    common: {
      demoMode: "Mod Demo",
      ready: "Sedia",
      inProgress: "Dalam proses",
      needsReview: "Perlu semakan",
      exitDemo: "Keluar Mod Demo",
      signOut: "Log Keluar",
      profileSetup: "Tetapan Profil",
      account: "Akaun",
      back: "Kembali",
      save: "Simpan",
      cancel: "Batal",
      clear: "Padam Chat",
      send: "Hantar",
      noReceipts: "Tiada resit tersedia. Klik 'Imbas Resit' atau 'Tambah Manual' di atas untuk mulakan.",
      statusClaimable: "Boleh Dituntut",
      statusCheckAgain: "Semak Semula",
      statusNonClaimable: "Tidak Boleh Dituntut",
      close: "Tutup",
      navHome: "Utama",
      navReceipts: "Resit",
      navAskTax5: "Tanya Tax5",
      navSummary: "Ringkasan"
    },
    splash: {
      tagline: "Pembantu pra-pemfailan Borang BE anda",
      badge: "Demo MVP Pra-pemfailan v1.0",
      preparing: "Menyediakan pembantu cukai anda...",
      footer: "Digitalkan resit. Rancang, isih, dan draf tuntutan anda dengan selamat."
    },
    welcome: {
      title: "Sediakan cukai anda dalam masa 5 minit.",
      subtitle: "Imbas resit, urus tuntutan, dan sediakan draf Borang BE anda.",
      badge: "Demo MVP Pra-pemfailan v1.0",
      tryDemo: "Cuba Demo",
      startApp: "Mula Aplikasi",
      disclaimer: "Panduan penyediaan sahaja. Pemfailan akhir dilakukan melalui MyTax/e-Filing."
    },
    demoAccess: {
      titleWelcome: "Mulakan dengan Tax5",
      subtitle: "Imbas resit, urus tuntutan, dan sediakan draf Borang BE anda.",
      subtitleWelcome: "Daftar atau log masuk untuk menyimpan resit sebenar dalam akaun awan selamat kami, atau akses profil demo luar talian.",
      emailLabel: "Alamat E-mel",
      emailPlace: "cth. nama@domain.com",
      passLabel: "Kata Laluan",
      passPlace: "Masukkan kata laluan",
      nameLabel: "Nama Penuh Anda",
      namePlace: "cth. Ali bin Ahmad",
      forgotPass: "Lupa kata laluan?",
      orDivider: "ATAU PILIH PROFIL DEMO",
      dontNeedAcc: "Tidak memerlukan akaun? Log masuk ke mod demo interaktif Tax5 secara selamat tanpa mendaftar:",
      tryDemoBtn: "Lancarkan Mod Demo",
      demoDisclaimer: "Untuk ujian MVP pantas sahaja. Data kekal pada peranti/pelayar ini.",
      loginTitle: "Log Masuk ke Tax5",
      signupTitle: "Daftar Akaun",
      loginBtn: "Log Masuk",
      signupBtn: "Daftar Akaun",
      signupPrompt: "Belum mempunyai akaun?",
      loginPrompt: "Sudah mempunyai akaun?",
      loginToggle: "Log Masuk",
      signupToggle: "Daftar Akaun",
      backToWelcome: "Kembali ke halaman utama",
      forgotPassTitle: "Set Semula Kata Laluan",
      forgotPassDesc: "Set semula kata laluan akan tersedia selepas persediaan akaun.",
      errEmail: "Sila masukkan alamat e-mel.",
      errPass: "Sila masukkan kata laluan.",
      errName: "Sila masukkan nama penuh anda.",
      msgLoggingIn: "Selamat kembali! Log masuk untuk anda...",
      msgCreating: "Mencipta akaun anda...",
      msgSuccessIn: "Berjaya! Akaun dicipta dan log masuk untuk anda...",
      msgSuccessVerify: "Berjaya! Sila semak e-mel anda untuk mengesahkan pendaftaran."
    },
    home: {
      totalClaimed: "Jumlah Dituntut",
      estRelief: "Anggaran Pelepasan",
      taxesSaved: "Cukai Dijimatkan",
      claimsAdded: "Tuntutan ditambah",
      smartSetupCardTitle: "Profil & Tetapan Cukai Pintar",
      smartSetupCardDesc: "Sahkan butiran penilaian cukai anda dan isi-siap pelepasan individu G1 automatik atau had KWSP G17.",
      smartBtnEdit: "Ubah Tetapan",
      smartBtnStart: "Lengkapkan Pentafsiran",
      sectionHeaderCategories: "Kategori Pelepasan Cukai",
      secAddReceipt: "Tambah Resit",
      secManualBtn: "Tambah Manual",
      secScanBtn: "Imbas Resit",
      receiptStatusHeader: "Ringkasan Status Tuntutan"
    },
    addScan: {
      scanTitle: "Imbas Resit",
      uploadTitle: "Muat Naik Foto/Fail",
      takePhotoTitle: "Ambil Foto Kasar",
      orChooseTitle: "ATAU PILIH RESIT DEMO",
      demoReceiptsInstruction: "Mahu mencuba imbasan tanpa berkongsi resit sebenar? Klik mana-mana templat demo untuk simulasi pengekstrakan segera:",
      templateBookstore: "Kedai Buku Popular (Pendidikan)",
      templatePharmacy: "Farmasi Caring (Perubatan/Gigi)",
      templateSports: "Decathlon Malaysia (Sukan)",
      dropActive: "Lepaskan fail ke sini...",
      dragPrompt: "Seret & lepas imej resit, atau klik untuk pilih fail",
      processingSecurely: "Mengimbas resit dengan Gemini OCR...",
      detectedTextHeader: "Keputusan Teks Diekstrak",
      confidenceHeader: "Status Keyakinan AI",
      reviewFormTitle: "Padan & Sahkan Maklumat",
      merchantLabel: "Nama Penjual / Ahli Perniagaan",
      merchantPlace: "Nama penjual",
      dateLabel: "Tarikh Transaksi",
      datePlace: "YYYY-MM-DD",
      amountLabel: "Jumlah Dibelanjakan (RM)",
      amountPlace: "0.00",
      notesLabel: "Nota Tersuai / Tujuan Tuntutan",
      notesPlace: "cth. Membeli buku rujukan Java...",
      categoryLabel: "Kategori Tuntutan Ditugaskan",
      guidelinesTitle: "Pelepasan Borang BE & Garis Panduan Kelayakan"
    },
    receipts: {
      receiptsTitle: "Bukti Resit",
      allStatus: "Semua Tuntutan",
      checkInvoicesNote: "Muat naik fail atau lengkapkan imbasan dalam format PNG, JPEG atau PDF. Pengekstrakan masa nyata berjalan dengan selamat di pelayan.",
      searchPlaceholder: "Cari resit (penjual, kategori, nota, status)...",
      scanHelpBtn: "Imbas Resit",
      setupProfileHelpBtn: "Sediakan Profil",
      detailsViewTitle: "Bukti Butiran Resit",
      detailsCategory: "Kategori",
      detailsAmount: "Jumlah",
      detailsDate: "Tarikh",
      detailsRef: "ID Rujukan",
      detailsStatus: "Status Tuntutan",
      detailsNotes: "Nota",
      detailsConfidence: "Nilai Keyakinan OCR",
      detailsReasoning: "Nota Analisis Resit",
      detailsSuggestedCheck: "Semakan yang Disyorkan",
      detailsEditBtn: "Edit Butiran Resit",
      detailsDeleteBtn: "Padam Bukti Resit"
    },
    receiptEdit: {
      editTitle: "Edit Butiran Resit",
      guidelineCheckHeader: "Wawasan Kategori Pintar",
      saveChangesBtn: "Simpan Perubahan",
      discardChangesBtn: "Batal"
    },
    summary: {
      pageTitle: "Draf & Ringkasan Borang BE",
      personalInfoTitle: "Pratonton Ringkasan Borang BE",
      personalInfoDesc: "Anggaran penilaian cukai anda dimodelkan secara langsung berdasarkan struktur rasmi Borang BE LHDN.",
      sectionA: "BAHAGIAN A: BUTIRAN PERIBADI INDIVIDU",
      taxPayerName: "Nama Pembayar Cukai",
      tinNo: "TIN",
      idNo: "No. Kad Pengenalan",
      sectionB: "BAHAGIAN B: PENDAPATAN BERKANUN & PARAMETER CUKAI",
      employmentIncome: "B1 Pendapatan Penggajian",
      aggregateIncome: "B5 Pendapatan Agregat",
      totalIncome: "B7 Jumlah Pendapatan",
      totalRelief: "B13 Jumlah Pelepasan",
      chargeableIncome: "B14 Pendapatan Bercukai",
      taxOnChargeable: "B15 Cukai atas Pendapatan Bercukai",
      totalTaxChargeable: "BC14 Jumlah Cukai Dikenakan",
      pcbPaid: "Potongan Bulanan PCB/CP500 Dibayar",
      taxUnderpaidOverpaid: "Cukai Kurang Dibayar / (Lebih Dibayar)",
      overpaymentRefund: "Tuntutan Bayaran Balik",
      underpaymentPay: "Baki Cukai Perlu Dibayar LHDN",
      sectionG: "BAHAGIAN G: PELEPASAN & KATEGORI TUNTUTAN PEMETAAN (PELEPASAN CUKAI ISTIHAR)",
      sectionGSub: "Jadual penuh menunjukkan tuntutan terperinci, had maksimum, tuntutan terhad, dan status pematuhan.",
      tableColItem: "Item",
      tableColDetails: "Butiran",
      tableColDeclared: "Perbelanjaan Diisytiharkan",
      tableColMaxLimit: "Had Maksimum",
      tableColClaimed: "Dituntut (Dihadkan)",
      tableColStatus: "Nota Status",
      evidenceSection: "RINGKASAN LAMPIRAN BUKTI RESIT",
      evidenceSub: "Di bawah adalah bukti resit yang disahkan yang akan disertakan bersama fail draf anda.",
      noReceiptImages: "Tiada imej resit telah dimuat naik lagi."
    },
    setup: {
      pageTitle: "Penyediaan Profil Cukai Pintar",
      mainInstructions: "Konfigurasikan maklumat peribadi, statistik pekerjaan, dan pembolehubah keluarga anda. Tax5 akan memetakan dan mengehadkan status tuntutan secara dinamik mengikut peraturan Akta Cukai Pendapatan semasa.",
      step1: "1. Peribadi & Pendapatan",
      step2: "2. Keluarga & Tanggungan",
      step3: "3. Kesihatan & Doktor Setup",
      step4: "4. Aset Masa Depan & Perlindungan",
      step5: "5. Hartanah & Teknologi Hijau",
      assessmentYear: "Tahun Taksiran",
      fullNameLabel: "Nama Penuh (Rasmi)",
      emailLabel: "Alamat E-mel",
      tinLabel: "Nombor Cukai Pendapatan (TIN)",
      idLabel: "No. MyKad / Kad Pengenalan",
      dobLabel: "Tarikh Lahir",
      genderLabel: "Jantina",
      salariedCheck: "Adakah anda pekerja bergaji di Malaysia? (Pengisytihar Borang BE)",
      annualIncomeLabel: "Pendapatan Kasar Penggajian Tahunan (RM)",
      monthlyPcbLabel: "Jumlah Bulanan PCB (Potongan Cukai Berjadual) Dibayar (RM)",
      childrenCountLabel: "Bilangan anak di bawah jagaan anda",
      maritalStatusLabel: "Status Perkahwinan",
      supportingParentsLabel: "Adakah anda menyokong ibu bapa yang uzur (kos perubatan/penjagaan)?",
      spouseSituationLabel: "Situasi penilaian cukai utama pasangan",
      disabilityJointLabel: "Senario ketidakupayaan bersama yang berkenaan",
      medicalReceiptTypesLabel: "Perbelanjaan perubatan diri/pasangan/anak tahun ini",
      insuranceStatementUpload: "Muat Naik Penyata Tahunan Insurans Nyawa/Perubatan",
      prsVoluntaryContribution: "Adakah anda membuat caruman Skim Persaraan Swasta (PRS)?",
      firstHomeQuestion: "Adakah anda membeli kediaman pertama anda baru-baru ini (tuntutan faedah pinjaman perumahan)?",
      evChargingQuestion: "Adakah anda mempunyai resit kemudahan pengecasan Kenderaan Elektrik (EV)?",
      compostingQuestion: "Adakah anda membeli mesin kompos sisa domestik?",
      approvedDonatLabel: "Adakah anda membuat sumbangan tunai kepada institusi/badan yang diluluskan?",
      saveAllHeader: "Simpan Profil Tetapan",
      saveAllDesc: "Simpan jawapan anda untuk memuatkan had tuntutan dan had pendapatan berkanun peribadi secara automatik pada papan pemuka utama.",
      saveSetupBtn: "Simpan Tetapan Cukai"
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("tax5_lang");
      if (saved === "BM" || saved === "EN") {
        return saved as Language;
      }
    } catch (e) {
      console.error(e);
    }
    return "EN";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("tax5_lang", lang);
    } catch (e) {
      console.error(e);
    }
  };

  const t = (section: string, key: string): string => {
    const sect = translations[language]?.[section];
    if (sect && sect[key] !== undefined) {
      return sect[key];
    }
    // Deep fallback to English
    const engSect = translations["EN"]?.[section];
    if (engSect && engSect[key] !== undefined) {
      return engSect[key];
    }
    return `${section}.${key}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
