import { ClaimCategory, ClaimStatus, TaxReliefGuideline } from "../types";

export const taxReliefGuidelines: Record<string, TaxReliefGuideline> = {
  G1: {
    formItemCode: "G1",
    displayName: "Personal & Dependent Relief",
    displayNameBM: "Pelepasan Diri & Tanggungan",
    evidenceType: "Profile-based",
    evidenceTypeBM: "Berasaskan Profil",
    keywords: [],
    suggestedAppCategory: ClaimCategory.Other,
    defaultStatus: ClaimStatus.Claimable,
    checkAgainConditions: "Not usually needed because this relief is applied automatically.",
    checkAgainConditionsBM: "Biasanya tidak diperlukan kerana pelepasan ini digunakan secara automatik.",
    userFacingNote: "You get this RM9,000 relief automatically for yourself and your dependents.",
    userFacingNoteBM: "Anda mendapat pelepasan RM9,000 ini secara automatik untuk diri sendiri dan saudara tanggungan anda.",
    claimLimit: "RM9,000 (Automatic)",
    claimLimitBM: "RM9,000 (Automatik)",
    requiredChecks: [
      "No manual action required. Applied for resident individual automatically by LHDN.",
      "Check that you are declared as a resident taxpayer for the year of assessment."
    ],
    requiredChecksBM: [
      "Tiada tindakan manual diperlukan. Digunakan untuk individu pemastautin secara automatik oleh LHDN.",
      "Pastikan anda diisytiharkan sebagai pembayar cukai pemastautin bagi tahun taksiran."
    ],
    sourceNote: "Paragraph 46(1)(a) of ITA 1967",
    lastReviewedYear: 2025
  },
  G2: {
    formItemCode: "G2",
    displayName: "Parents' Medical & Carer Expenses",
    displayNameBM: "Perbelanjaan Perubatan & Penjaga Ibu Bapa",
    evidenceType: "Receipt-based",
    evidenceTypeBM: "Berasaskan Resit",
    keywords: ["hospital", "klinik", "clinic", "carer", "dental", "nursing home", "medical", "treatment", "parent", "grandparent", "MMC", "MDC"],
    suggestedAppCategory: ClaimCategory.Medical,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If the medical/dental provider is not confirmed as registered, parents/grandparents are not resident in Malaysia, or certification/supporting documents are unclear.",
    checkAgainConditionsBM: "Jika penyedia perubatan/pergigian tidak sah/berdaftar, ibu bapa/datuk nenek bukan pemastautin di Malaysia, atau dokumen sokongan tidak lengkap.",
    userFacingNote: "May be claimable for medical, dental, special needs, or carer expenses for resident parents or grandparents. Please check supporting documents before filing.",
    userFacingNoteBM: "Boleh dituntut untuk perbelanjaan perubatan, pergigian, keperluan khas, atau penjaga untuk ibu bapa atau datuk nenek pemastautin. Sila semak dokumen sokongan sebelum memfail.",
    claimLimit: "RM8,000 (Dental restricted to RM1,000, Complete medical exam restricted to RM1,000)",
    claimLimitBM: "RM8,000 (Rawatan pergigian terhad RM1,000, Pemeriksaan perubatan penuh terhad RM1,000)",
    requiredChecks: [
      "Confirm parents or grandparents are residents of Malaysia for tax purposes.",
      "Medical treatment or care services must be provided within Malaysia.",
      "Carer status must be certified by a medical practitioner registered with the Malaysian Medical Council (MMC).",
      "Dental treatment must be certified by a dentist registered with the Malaysian Dental Council (MDC).",
      "Keep original receipts and official certification logs."
    ],
    requiredChecksBM: [
      "Sahkan ibu bapa atau datuk nenek adalah bermastautin di Malaysia untuk tujuan cukai.",
      "Rawatan perubatan atau perkhidmatan penjagaan mestilah disediakan di dalam Malaysia.",
      "Status penjaga mesti disokong oleh pengamal perubatan yang berdaftar dengan Majlis Perubatan Malaysia (MPM).",
      "Rawatan pergigian mestilah disahkan oleh doktor pergigian yang berdaftar dengan Majlis Pergigian Malaysia (MDC).",
      "Simpan resit asal dan log perakuan bertulis yang sah."
    ],
    sourceNote: "Paragraph 46(1)(c) of ITA 1967",
    lastReviewedYear: 2025
  },
  G3: {
    formItemCode: "G3",
    displayName: "Basic Supporting Equipment",
    displayNameBM: "Peralatan Sokongan Asas",
    evidenceType: "Receipt-based",
    evidenceTypeBM: "Berasaskan Resit",
    keywords: ["wheelchair", "hemodialysis", "dialysis", "artificial limb", "hearing aid", "OKU", "JKM", "disabled equipment"],
    suggestedAppCategory: ClaimCategory.Medical,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If the disabled person is not confirmed as registered with JKM/DSW or the item is not clearly supporting equipment.",
    checkAgainConditionsBM: "Jika individu kurang upaya (OKU) tidak disahkan daftar dengan JKM atau item tersebut bukan peralatan sokongan asas yang dibenarkan.",
    userFacingNote: "May be claimable for basic supporting equipment for a registered disabled self, spouse, child, or parent.",
    userFacingNoteBM: "Boleh dituntut untuk pembelian peralatan sokongan asas bagi individu kurang upaya (OKU) diri sendiri, pasangan, anak atau ibu bapa yang berdaftar.",
    claimLimit: "RM6,000",
    claimLimitBM: "RM6,000",
    requiredChecks: [
      "Confirm disabled individual (self, spouse, child, or parent) is registered with JKM (Department of Social Welfare).",
      "Item must be necessary basic supporting equipment (such as dialysis machine, wheelchair, artificial leg, hearing aids).",
      "Excludes purchase of spectacles and personal optical lenses."
    ],
    requiredChecksBM: [
      "Sahkan individu kurang upaya (OKU) (diri sendiri, pasangan, anak atau ibu bapa) berdaftar dengan Jabatan Kebajikan Masyarakat (JKM).",
      "Peralatan mestilah jentera/peralatan sokongan asas yang penting (seperti mesin hemodialisis, kerusi roda, kaki palsu, alat pendengaran).",
      "Tidak termasuk pembelian cermin mata dan kanta lekap."
    ],
    sourceNote: "Paragraph 46(1)(d) of ITA 1967",
    lastReviewedYear: 2025
  },
  G4: {
    formItemCode: "G4",
    displayName: "Disabled Individual Relief",
    displayNameBM: "Pelepasan Individu Kurang Upaya",
    evidenceType: "Profile-based",
    evidenceTypeBM: "Berasaskan Profil",
    keywords: ["OKU", "JKM", "disabled", "disability certificate"],
    suggestedAppCategory: ClaimCategory.Other,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If there is no official written certification from JKM/DSW.",
    checkAgainConditionsBM: "Jika tiada pengesahan bertulis rasmi daripada JKM.",
    userFacingNote: "Extra relief may apply if you are officially certified as a disabled individual.",
    userFacingNoteBM: "Pelepasan tambahan boleh dituntut sekiranya anda disahkan secara bertulis sebagai orang kurang upaya (OKU).",
    claimLimit: "RM7,000",
    claimLimitBM: "RM7,000",
    requiredChecks: [
      "Requires official written certification from the Department of Social Welfare (JKM) certifying disability.",
      "Must have a valid JKM card on file."
    ],
    requiredChecksBM: [
      "Sila sediakan bukti pengesahan bertulis rasmi daripada Jabatan Kebajikan Masyarakat (JKM) yang mengesahkan keadaan kurang upaya.",
      "Mesti mempunyai kad OKU JKM yang sah."
    ],
    sourceNote: "Paragraph 46(1)(e) of ITA 1967",
    lastReviewedYear: 2025
  },
  G5: {
    formItemCode: "G5",
    displayName: "Self-Education Fees",
    displayNameBM: "Yuran Pengajian Diri Sendiri",
    evidenceType: "Receipt-based",
    evidenceTypeBM: "Berasaskan Resit",
    keywords: ["university", "college", "education fee", "tuition", "course", "upskilling", "professional body", "master", "doctorate", "exam fee", "training"],
    suggestedAppCategory: ClaimCategory.Education,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If the institution, professional body, course type, or recognition status is unclear.",
    checkAgainConditionsBM: "Jika institusi, badan profesional, jenis kursus, atau status pengiktirafan tidak jelas.",
    userFacingNote: "May be claimable for your own education fees, but course and institution eligibility should be checked.",
    userFacingNoteBM: "Boleh dituntut untuk yuran pengajian diri sendiri, terutamanya untuk kelayakan profesional dan institut yang diiktiraf.",
    claimLimit: "RM7,000 (Upskilling or self-enhancement courses restricted to RM2,000)",
    claimLimitBM: "RM7,000 (Kursus peningkatan kemahiran atau kemajuan diri dihadkan sehingga RM2,000)",
    requiredChecks: [
      "Course of study up to tertiary level (other than Master/Doctorate) must be in law, accounting, Islamic finance, technical, vocational, industrial, scientific or technological course.",
      "Institution or professional body must be recognized by the Malaysian Government or approved by the Minister of Finance.",
      "Upskilling or self-enhancement courses must be in a skill area recognized by the Director General of Skills Development under National Skills Development Act 2006."
    ],
    requiredChecksBM: [
      "Kursus pengajian peringkat tertiari (selain Sarjana/Doktor Falsafah) mestilah dalam bidang undang-undang, perakaunan, kewangan Islam, teknikal, vokasional, industri, saintifik, atau teknologi.",
      "Institusi atau badan profesional mestilah diiktiraf oleh Kerajaan Malaysia atau diluluskan oleh Menteri Kewangan.",
      "Kursus peningkatan kemahiran atau kemajuan diri mestilah dalam bidang kemahiran yang diiktiraf oleh Ketua Pengarah Pembangunan Kemahiran di bawah Akta Pembangunan Kemahiran Kebangsaan 2006."
    ],
    sourceNote: "Paragraph 46(1)(f) of ITA 1967",
    lastReviewedYear: 2025
  },
  G6: {
    formItemCode: "G6",
    displayName: "Serious Diseases & Fertility Treatment",
    displayNameBM: "Penyakit Serius & Rawatan Kesuburan",
    evidenceType: "Receipt-based",
    evidenceTypeBM: "Berasaskan Resit",
    keywords: ["cancer", "renal", "kidney", "AIDS", "Parkinson", "leukemia", "heart", "IVF", "IUI", "fertility", "vaccine", "vaccination", "medical treatment", "MMC"],
    suggestedAppCategory: ClaimCategory.Medical,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If doctor certification, disease type, fertility condition, marital condition, or supporting documents are unclear.",
    checkAgainConditionsBM: "Jika sijil doktor, jenis penyakit tidak tergolong serius, rawatan kesuburan atau dokumen sokongan kurang jelas.",
    userFacingNote: "May be claimable under the medical relief group. Please check medical certification and supporting documents before filing.",
    userFacingNoteBM: "Boleh dituntut di bawah kumpulan pelepasan perubatan. Sila sahkan kelayakan perubatan dan simpan bukti resit/sijil rawatan doktor asal.",
    claimLimit: "RM10,000 (Shared with G7 and G8)",
    claimLimitBM: "RM10,000 (Kongsi bersama G7 dan G8)",
    requiredChecks: [
      "Treatment must be on serious diseases of own self, spouse, or child, or fertility treatment for self or spouse.",
      "Certification of the treatment must be issued by a medical practitioner registered with the Malaysian Medical Council (MMC).",
      "Vaccinations are capped up to RM1,000 and dental examination/treatment is capped up up to RM1,000."
    ],
    requiredChecksBM: [
      "Sahkan rawatan penyakit serius ke atas diri sendiri, pasangan, atau anak, atau rawatan kesuburan ke atas diri sendiri atau pasangan.",
      "Sijil atau perakuan rawatan perubatan mestilah dikeluarkan oleh pengamal perubatan yang berdaftar dengan Majlis Perubatan Malaysia (MPM).",
      "Suntikan vaksinasi dihadkan sehingga RM1,000 dan yuran pemeriksaan/rawatan pergigian dihadkan sehingga RM1,000."
    ],
    sourceNote: "Paragraph 46(1)(g)(i) & (g)(ii) of ITA 1967",
    lastReviewedYear: 2025
  },
  G7: {
    formItemCode: "G7",
    displayName: "Health Exams & Medical Devices",
    displayNameBM: "Pemeriksaan Kesihatan & Peranti Perubatan",
    evidenceType: "Receipt-based",
    evidenceTypeBM: "Berasaskan Resit",
    keywords: ["medical checkup", "health screening", "blood test", "ultrasound", "mammogram", "pap smear", "COVID test", "influenza test", "oximeter", "blood pressure monitor", "thermometer", "psychiatrist", "psychologist", "counsellor"],
    suggestedAppCategory: ClaimCategory.Medical,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If the device registration, medical provider, specialist qualification, or supporting receipt is unclear.",
    checkAgainConditionsBM: "Jika pendaftaran peranti tidak sah, pembekal perubatan tidak berdaftar, atau kelayakan pakar mental kurang jelas.",
    userFacingNote: "May be claimable for medical examination, disease detection tests, self-testing devices, or mental health consultation. Please verify details.",
    userFacingNoteBM: "Boleh dituntut untuk pemeriksaan perubatan penuh, ujian pengesanan penyakit, peranti pemeriksaan kendiri, atau konsultasi kesihatan mental.",
    claimLimit: "RM1,000 (Inside the RM10,000 Serious Disease limit)",
    claimLimitBM: "RM1,000 (Di dalam had RM10,000 Penyakit Serius)",
    requiredChecks: [
      "Complete medical examination must be conducted at a hospital or by a medical practitioner registered with the Malaysian Medical Council (MMC).",
      "Self-testing medical devices (oximeters, blood pressure monitors, thermometers, COVID/influenza self-test kits) must be registered under the Medical Device Act 2012.",
      "Mental health consultation or examination must be with a registered psychiatrist, psychologist (registered with Malaysia Allied Health Professions Council), or copy of counselor credentials."
    ],
    requiredChecksBM: [
      "Pemeriksaan perubatan penuh mestilah dijalankan di hospital atau oleh pengamal perubatan berdaftar dengan Majlis Perubatan Malaysia (MPM).",
      "Peralatan pemeriksaan kendiri (seperti oximeter nadi, mesin penunjuk tekanan darah, termometer, kit ujian COVID-19/influenza) mesti berdaftar di bawah Akta Peranti Perubatan 2012.",
      "Pemeriksaan atau konsultasi kesihatan mental mestilah dengan pakar psikiatri, ahli psikologi klinikal berdaftar, atau kaunselor berdaftar di bawah Akta Kaunselor."
    ],
    sourceNote: "Paragraph 46(1)(h)(i)-(iii) of ITA 1967",
    lastReviewedYear: 2025
  },
  G8: {
    formItemCode: "G8",
    displayName: "Learning Disability Support for Child",
    displayNameBM: "Sokongan Kurang Upaya Pembelajaran Anak",
    evidenceType: "Receipt-based",
    evidenceTypeBM: "Berasaskan Resit",
    keywords: ["autism", "ADHD", "down syndrome", "learning disability", "diagnosis", "early intervention", "rehabilitation", "speech therapy", "therapy", "child assessment"],
    suggestedAppCategory: ClaimCategory.Medical,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If the child age, diagnosis, practitioner registration, or treatment provider is unclear.",
    checkAgainConditionsBM: "Jika umur anak melebihi had, atau diagnosis pengamal perubatan/jenis terapi tidak jelas.",
    userFacingNote: "May be claimable for diagnosis or early intervention for a child with learning disability. Please check eligibility.",
    userFacingNoteBM: "Boleh dituntut untuk yuran penilaian diagnosis kurang upaya pembelajaran atau program intervensi awal anak. Sila pastikan kelayakan.",
    claimLimit: "RM6,000 (Inside the RM10,000 Serious Disease limit)",
    claimLimitBM: "RM6,000 (Di dalam had RM10,000 Penyakit Serius)",
    requiredChecks: [
      "Taxpayer must be a parent of a child certified has a learning disability.",
      "Child must be aged 18 years and below.",
      "Learning disability must be certified by a medical practitioner registered with the Malaysian Medical Council (MMC) or Allied Health Professions Council.",
      "Rehabilitation, early intervention programs, or diagnosis must be carried out in Malaysia."
    ],
    requiredChecksBM: [
      "Pembayar cukai mestilah ibu bapa kepada anak yang disahkan mengalami kurang upaya pembelajaran.",
      "Anak mestilah berumur 18 tahun dan ke bawah.",
      "Kurang upaya pembelajaran mesti disahkan oleh pengamal perubatan berdaftar dengan Majlis Perubatan Malaysia (MPM) atau Majlis Profesion Kesihatan Bersekutu.",
      "Rehabilitasi, program intervensi awal, atau diagnosis mestilah dijalankan di Malaysia."
    ],
    sourceNote: "Paragraph 46(1)(ha) of ITA 1967",
    lastReviewedYear: 2025
  },
  G9: {
    formItemCode: "G9",
    displayName: "Lifestyle - Reading, Tech & Internet",
    displayNameBM: "Gaya Hidup - Buku, Teknologi & Internet",
    evidenceType: "Receipt-based",
    evidenceTypeBM: "Berasaskan Resit",
    keywords: ["book", "books", "bookstore", "magazine", "newspaper", "journal", "e-book", "laptop", "computer", "smartphone", "tablet", "internet", "broadband", "wifi", "course", "self-enhancement"],
    suggestedAppCategory: ClaimCategory.Lifestyle,
    defaultStatus: ClaimStatus.Claimable,
    checkAgainConditions: "If the item is for business use, unclear, banned reading material, warranty charge, or course type is unclear.",
    checkAgainConditionsBM: "Jika item digunakan untuk perniagaan, bahan bacaan terlarang, caj jaminan tambahan/waranti, atau kursus tidak berkelayakan.",
    userFacingNote: "May be claimable for books, tech devices, internet bills, and selected self-enhancement courses for personal/family use.",
    userFacingNoteBM: "Boleh dituntut untuk buku, komputer peribadi, telefon pintar, tablet, atau bil langganan internet untuk kegunaan peribadi atau keluarga.",
    claimLimit: "RM2,500",
    claimLimitBM: "RM2,500",
    requiredChecks: [
      "Must be for the use/benefit of own self, spouse, or child.",
      "Must NOT be used for the purpose of the individual's or family's own business.",
      "Excludes additional charges for hardware warranties.",
      "Excludes banned or morally offensive publications.",
      "Monthly internet bill must be registered under the taxpayer's own name."
    ],
    requiredChecksBM: [
      "Mestilah untuk kegunaan atau manfaat diri sendiri, suami/isteri, atau anak sahaja.",
      "Sama sekali TIDAK BOLEH digunakan untuk tujuan perniagaan individu atau perniagaan keluarga.",
      "Tidak termasuk caj tambahan untuk jaminan perkakasan (warranty) atau insurans peranti.",
      "Tidak termasuk penerbitan yang dilarang atau menyalahi undang-undang.",
      "Bil langganan internet bulanan mestilah didaftarkan atas nama pembayar cukai sendiri."
    ],
    sourceNote: "Subparagraph 46(1)(p)(i), (ii), (iv) of ITA 1967",
    lastReviewedYear: 2025
  },
  G10: {
    formItemCode: "G10",
    displayName: "Lifestyle - Sports",
    displayNameBM: "Gaya Hidup - Sukan",
    evidenceType: "Receipt-based",
    evidenceTypeBM: "Berasaskan Resit",
    keywords: ["sports", "sport", "gym", "fitness", "racket", "badminton", "running", "marathon", "competition fee", "sports facility", "sports training", "decathlon", "equipment"],
    suggestedAppCategory: ClaimCategory.Sports,
    defaultStatus: ClaimStatus.Claimable,
    checkAgainConditions: "If the item is motorized equipment, business-related, or the sports facility/competition/training details are unclear.",
    checkAgainConditionsBM: "Jika alatan sukan adalah jenis bermotor, atau maklumat penganjur latihan/pertandingan sukan tidak jelas.",
    userFacingNote: "May be claimable for sports equipment, gym fees, sports facility fees, competition fees, or sports training.",
    userFacingNoteBM: "Boleh dituntut untuk bayaran pembelian peralatan sukan, sewaan kemudahan, yuran masuk atau pendaftaran pertandingan sukan, serta yuran latihan sukan berkelayakan.",
    claimLimit: "RM1,000",
    claimLimitBM: "RM1,000",
    requiredChecks: [
      "Purchase must be for sports equipment for any sports activity listed under the Sports Development Act 1997.",
      "Motorized two-wheel bicycles are strictly EXCLUDED.",
      "Rental of gym or sports facility, entrance fee, or registration fee for sports competitions must be from approved organizers.",
      "Gym membership or sports training fees must be provided by sports associations or clubs registered with the Commissioner of Sports, or licensed companies."
    ],
    requiredChecksBM: [
      "Pembelian mestilah untuk peralatan sukan bagi apa-apa aktiviti sukan yang tersenarai di bawah Akta Pembangunan Sukan 1997.",
      "Pembelian basikal roda dua bermotor adalah dilarang sama sekali daripada pelepasan ini.",
      "Sewa gim atau kemudahan sukan, yuran kemasukan, atau pendaftaran sekiranya penganjur diluluskan sahaja.",
      "Yuran keahlian gimnasium atau latihan sukan mestilah disediakan oleh persatuan sukan yang berdaftar dengan Pesuruhjaya Sukan atau syarikat berlesen."
    ],
    sourceNote: "Subparagraph 46(1)(p)(iii) and Section 46(1)(u) of ITA 1967",
    lastReviewedYear: 2025
  },
  G11: {
    formItemCode: "G11",
    displayName: "Breastfeeding Equipment",
    displayNameBM: "Peralatan Penyusuan Ibu",
    evidenceType: "Receipt-based",
    evidenceTypeBM: "Berasaskan Resit",
    keywords: ["breast pump", "breastfeeding", "ice pack", "cooler bag", "breast milk storage", "milk collection"],
    suggestedAppCategory: ClaimCategory.Other,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If the taxpayer is not a breastfeeding mother, the child is over 2 years old, or the claim was already made in the previous eligible period.",
    checkAgainConditionsBM: "Jika pembayar cukai bukan ibu menyusu, anak melebihi umur 2 tahun, atau pelepasan telah dituntut dalam tempoh kelayakan sebelumnya.",
    userFacingNote: "May be claimable for breastfeeding equipment, but eligibility depends on mother/child conditions and claim frequency.",
    userFacingNoteBM: "Boleh dituntut oleh pembayar cukai wanita untuk pembelian peralatan penyusuan anak yang berumur 2 tahun ke bawah.",
    claimLimit: "RM1,000",
    claimLimitBM: "RM1,000",
    requiredChecks: [
      "Deduction is exclusively allowed for female taxpayers.",
      "Must be a breastfeeding mother claiming for her own child aged 2 years and below.",
      "This deduction is only allowed ONCE in every two (2) years of assessment.",
      "In the case of a Combined Assessment, this deduction is only allowed if the assessment is made in the name of the wife."
    ],
    requiredChecksBM: [
      "Potongan ini dibenarkan khusus untuk pembayar cukai wanita sahaja.",
      "Mestilah ibu menyusukan anak sendiri yang berumur 2 tahun ke bawah.",
      "Potongan dibenarkan sekali sahaja bagi setiap dua (2) tahun taksiran.",
      "Untuk Taksiran Bersama, potongan ini hanya dibenarkan jika taksiran dibangkitkan atas nama isteri."
    ],
    sourceNote: "Paragraph 46(1)(q) of ITA 1967",
    lastReviewedYear: 2025
  },
  G12: {
    formItemCode: "G12",
    displayName: "Child Care Fees",
    displayNameBM: "Yuran Penghantaran Anak",
    evidenceType: "Receipt-based",
    evidenceTypeBM: "Berasaskan Resit",
    keywords: ["taska", "tadika", "kindergarten", "child care", "nursery", "preschool", "childcare fee"],
    suggestedAppCategory: ClaimCategory.Education,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If the child care centre/kindergarten registration, child age, or payment evidence is unclear.",
    checkAgainConditionsBM: "Jika tadika/taska tidak berdaftar secara sah, umur anak melebihi had, atau bukti yuran bayaran tidak lengkap.",
    userFacingNote: "May be claimable for registered child care centre or kindergarten fees for children aged 6 and below.",
    userFacingNoteBM: "Boleh dituntut untuk yuran taska atau tadika berdaftar bagi anak yang berumur 6 tahun dan ke bawah.",
    claimLimit: "RM3,000",
    claimLimitBM: "RM3,000",
    requiredChecks: [
      "Direct child care fees paid for a child aged 6 years and below.",
      "Childcare centre must be officially registered with the Department of Social Welfare (JKM) pursuant to Child Care Centre Act 1984.",
      "Kindergarten must be registered with the Ministry of Education Malaysia (MOE) pursuant to Education Act 1996.",
      "Must maintain birth certificate (MyKid) and official monthly tuition receipt."
    ],
    requiredChecksBM: [
      "Yuran penghantaran anak yang berperingkat umur 6 tahun dan ke bawah.",
      "Taman asuhan kanak-kanak (taska) mestilah berdaftar secara sah dengan Jabatan Kebajikan Masyarakat (JKM) di bawah Akta Taman Asuhan Kanak-Kanak 1984.",
      "Tadika mestilah berdaftar secara sah dengan Jabatan Pendidikan Negeri di bawah Akta Pendidikan 1996.",
      "Sila simpan dokumen pengenalan anak (MyKid/Sijil Lahir) dan resit rasmi bulanan asal."
    ],
    sourceNote: "Paragraph 46(1)(r) of ITA 1967",
    lastReviewedYear: 2025
  },
  G13: {
    formItemCode: "G13",
    displayName: "SSPN Net Savings",
    displayNameBM: "Simpanan Bersih SSPN",
    evidenceType: "Payment-record-based",
    evidenceTypeBM: "Rekod Pembayaran",
    keywords: ["SSPN", "PTPTN", "simpanan", "education savings", "net savings"],
    suggestedAppCategory: ClaimCategory.Education,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If the yearly net savings cannot be confirmed or withdrawals exceed deposits.",
    checkAgainConditionsBM: "Jika jumlah baki simpanan bersih tidak dapat disahkan atau jumlah pengeluaran melebihi deposit bagi tahun berkenaan.",
    userFacingNote: "May be claimable based on net SSPN savings during the year, not just total deposits.",
    userFacingNoteBM: "Boleh dituntut berdasarkan jumlah simpanan bersih dalam Skim Simpanan Pendidikan Nasional (SSPN) pada tahun semasa.",
    claimLimit: "RM8,000",
    claimLimitBM: "RM8,000",
    requiredChecks: [
      "The allowable deduction is restricted to the NET amount deposited in YA 2025 base (Total deposits minus Total withdrawals).",
      "Savings from previous cumulative years are not taken into account.",
      "Keep official account logs from the PTPTN portal handy."
    ],
    requiredChecksBM: [
      "Amaun pelepasan dihadkan kepada pelaburan atau deposit BERSIH pada YA 2025 sahaja (Jumlah deposit tolak pengeluaran).",
      "Baki simpanan terkumpul dari tahun-tahun sebelumnya tidak diambil kira.",
      "Sila simpan penyata ringkasan akaun rasmi yang dimuat turun dari portal PTPTN/SSPN."
    ],
    sourceNote: "Paragraph 46(1)(k) of ITA 1967",
    lastReviewedYear: 2025
  },
  G14: {
    formItemCode: "G14",
    displayName: "Spouse / Alimony Relief",
    displayNameBM: "Pelepasan Pasangan / Alimoni Bekas Isteri",
    evidenceType: "Profile-based",
    evidenceTypeBM: "Berasaskan Profil",
    keywords: ["spouse", "husband", "wife", "alimony", "former wife", "marriage", "separation"],
    suggestedAppCategory: ClaimCategory.Other,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If spouse income, joint assessment status, or formal alimony agreement is unclear.",
    checkAgainConditionsBM: "Jika pendapatan pasangan melebihi had, status taksiran bersama, atau perjanjian alimoni rasmi kurang jelas.",
    userFacingNote: "Relief may apply for spouse with no income or alimony paid to a former wife, subject to conditions.",
    userFacingNoteBM: "Pelepasan boleh dituntut bagi pasangan yang tiada pendapatan atau taksiran bersama, atau bayaran alimoni kepada bekas isteri, tertakluk kepada syarat.",
    claimLimit: "RM4,000",
    claimLimitBM: "RM4,000",
    requiredChecks: [
      "Wife living together gets RM4,000 if husband has no income/elects joint assessment, or husband gets RM4,000 if wife has no income/elects joint assessment.",
      "Deduction for payment of alimony to a former wife is limited to RM4,000 or actual amount paid, whichever is lower.",
      "Requires a formal written alimony agreement (voluntary separation agreements do not qualify)."
    ],
    requiredChecksBM: [
      "Suami/isteri yang tinggal bersama mendapat RM4,000 jika pasangan tiada punca pendapatan atau memilih taksiran bersama.",
      "Potongan bayaran alimoni kepada bekas isteri dihadkan kepada RM4,000 atau jumlah sebenar yang dibayar (mana yang lebih rendah).",
      "Memerlukan perjanjian alimoni bertulis rasmi mengikut undang-undang (perjanjian sukarela biasa tidak layak)."
    ],
    sourceNote: "Section 45A(1) and Paragraph 47(1)(a) & 47(2) of ITA 1967",
    lastReviewedYear: 2025
  },
  G15: {
    formItemCode: "G15",
    displayName: "Disabled Spouse Relief",
    displayNameBM: "Pasangan yang Kurang Upaya",
    evidenceType: "Profile-based",
    evidenceTypeBM: "Berasaskan Profil",
    keywords: ["disabled spouse", "OKU spouse", "disabled husband", "disabled wife", "JKM"],
    suggestedAppCategory: ClaimCategory.Other,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If official disability registration/certification for spouse is not confirmed.",
    checkAgainConditionsBM: "Jika pendaftaran atau kad OKU pasangan tidak lengkap atau tidak dapat disahkan.",
    userFacingNote: "Extra relief may apply if your spouse is officially certified as disabled.",
    userFacingNoteBM: "Pelepasan tambahan boleh dituntut sekiranya suami atau isteri anda didaftarkan secara rasmi sebagai orang kurang upaya (OKU).",
    claimLimit: "RM6,000",
    claimLimitBM: "RM6,000",
    requiredChecks: [
      "Spouse must be officially certified as disabled (must be registered with the Department of Social Welfare (JKM))."
    ],
    requiredChecksBM: [
      "Pasangan (suami atau isteri) mestilah disahkan secara bertulis dan berdaftar sebagai orang kurang upaya dengan Jabatan Kebajikan Masyarakat (JKM)."
    ],
    sourceNote: "Section 45A and Paragraph 47(1)(b) of ITA 1967",
    lastReviewedYear: 2025
  },
  G16: {
    formItemCode: "G16",
    displayName: "Child Relief",
    displayNameBM: "Pelepasan Anak",
    evidenceType: "Profile-based",
    evidenceTypeBM: "Berasaskan Profil",
    keywords: ["child", "anak", "student", "university", "college", "diploma", "degree", "disabled child", "OKU child"],
    suggestedAppCategory: ClaimCategory.Other,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If child age, marital status, study status, disability status, or income status is unclear.",
    checkAgainConditionsBM: "Jika status belajar anak, status perkahwinan, umur, kemasukan kolej, atau pendaftaran kurang upaya kurang jelas.",
    userFacingNote: "Relief may apply for children, with higher relief for children in higher education or disabled children.",
    userFacingNoteBM: "Pelepasan bagi anak yang belum berkahwin mengikut umur, status pendidikan, dan status kurang upaya.",
    claimLimit: "RM2,000 to RM16,000 (Dependent on age, studies, and disability status)",
    claimLimitBM: "RM2,000 hingga RM16,000 (Mengikut umur, pengajian, dan status kurang upaya)",
    requiredChecks: [
      "Child must be unmarried.",
      "RM2,000 per child under 18 years.",
      "RM2,000 for child 18 years and above receiving full-time school instruction.",
      "RM8,000 for child 18 years and above receiving full-time technical, diploma, degree or professional studies at higher education recognized establishment in Malaysia.",
      "RM8,000 for disabled child, plus an additional RM8,000 (total RM16,000) if the disabled child is unmarried and pursuing tertiary qualifications."
    ],
    requiredChecksBM: [
      "Anak mestilah belum berkahwin.",
      "RM2,000 untuk anak yang berumur di bawah 18 tahun.",
      "RM2,000 untuk anak yang berumur 18 tahun ke atas yang menerima pendidikan sepenuh masa.",
      "RM8,000 untuk anak 18 tahun ke atas yang menerima pendidikan peringkat diploma, ijazah, atau setaraf di universiti/maktab Malaysia yang diiktiraf.",
      "RM8,000 untuk anak yang kurang upaya (OKU), tambah tambahan RM8,000 (jumlah RM16,000) sekiranya anak kurang upaya tersebut belum berkahwin dan melanjutkan pengajian tertiari."
    ],
    sourceNote: "Subsection 48(1)(a)-(d) and 48(3)(a) of ITA 1967",
    lastReviewedYear: 2025
  },
  G17: {
    formItemCode: "G17",
    displayName: "Life Insurance & EPF",
    displayNameBM: "Insurans Nyawa & KWSP",
    evidenceType: "Payment-record-based",
    evidenceTypeBM: "Rekod Pembayaran",
    keywords: ["EPF", "KWSP", "life insurance", "takaful", "voluntary contribution", "premium"],
    suggestedAppCategory: ClaimCategory.Insurance,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If the policy is for a child, EPF/life insurance split is unclear, or taxpayer type affects the limit.",
    checkAgainConditionsBM: "Jika polisi atas nama anak, bahagian bukan hayat tidak dikecualikan, atau pembahagian insurans hayat dan EPF tidak jelas.",
    userFacingNote: "May be claimable for EPF contributions, life insurance premiums, or takaful contributions. Please check policy and contribution details.",
    userFacingNoteBM: "Boleh dituntut untuk bayaran premium insurans nyawa (takaful hayat) diri sendiri/pasangan, atau caruman pekerja KWSP.",
    claimLimit: "RM7,000 (EPF contributions restricted to RM4,000, Life insurance premiums restricted to RM3,000)",
    claimLimitBM: "RM7,000 (EPF dihadkan kepada RM4,000, Premium Insurans Nyawa dihadkan kepada RM3,000)",
    requiredChecks: [
      "Deduction is NOT allowed on life insurance policies contracted on the life of your children.",
      "The policy must be contracted on the life of self or spouse.",
      "EPF contributions can be voluntary or compulsory salary deductions.",
      "Check public servant pension scheme conditions (up to RM3,000 limit applies for public servants without EPF schemes)."
    ],
    requiredChecksBM: [
      "Pelepasan TIDAK dibenarkan bagi polisi insurans nyawa yang diambil atas hayat anak anda.",
      "Polisi mestilah didaftarkan atas hayat diri sendiri atau suami/isteri sahaja.",
      "Caruman kepada KWSP boleh merangkumi potongan bulanan wajib atau caruman sukarela tambahan.",
      "Penjawat awam berpencen (tanpa caruman EPF wajib) layak menuntut premium insurans nyawa sehingga RM7,000."
    ],
    sourceNote: "Paragraph 49(1)(a) & (b) of ITA 1967",
    lastReviewedYear: 2025
  },
  G18: {
    formItemCode: "G18",
    displayName: "PRS & Deferred Annuity",
    displayNameBM: "Caruman PRS & Anuiti Tertangguh",
    evidenceType: "Payment-record-based",
    evidenceTypeBM: "Rekod Pembayaran",
    keywords: ["PRS", "private retirement", "deferred annuity", "retirement scheme", "Securities Commission"],
    suggestedAppCategory: ClaimCategory.Other,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If the PRS provider is not confirmed as approved or contribution details are unclear.",
    checkAgainConditionsBM: "Jika status pengesahan siri kelulusan dana PRS oleh Suruhanjaya Sekuriti tidak disahkan.",
    userFacingNote: "May be claimable for approved private retirement scheme or deferred annuity contributions.",
    userFacingNoteBM: "Pelepasan dibenarkan untuk caruman kepada Skim Persaraan Swasta (PRS) atau premium anuiti tertangguh yang diluluskan.",
    claimLimit: "RM3,000",
    claimLimitBM: "RM3,000",
    requiredChecks: [
      "Contributions must be made to a Private Retirement Scheme (PRS) approved by the Securities Commission.",
      "Applies for deferred annuity or PRS paid premiums.",
      "The total deduction allowed is restricted to RM3,000 (or RM3,000 for individual and RM3,000 for spouse with income)."
    ],
    requiredChecksBM: [
      "Caruman mestilah dibuat kepada Skim Persaraan Swasta (PRS) yang diluluskan oleh Suruhanjaya Sekuriti.",
      "Dibenarkan juga untuk yuran premium anuiti tertangguh yang layak.",
      "Pelepasan maksimum dibenarkan adalah terhad kepada RM3,000 sahaja."
    ],
    sourceNote: "Subsections 49(1D), (1E) and 50(2) of ITA 1967",
    lastReviewedYear: 2025
  },
  G19: {
    formItemCode: "G19",
    displayName: "Education & Medical Insurance",
    displayNameBM: "Insurans Pendidikan & Perubatan",
    evidenceType: "Payment-record-based",
    evidenceTypeBM: "Rekod Pembayaran",
    keywords: ["medical insurance", "education insurance", "medical card", "education policy", "premium", "takaful", "rider"],
    suggestedAppCategory: ClaimCategory.Insurance,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If policy type, rider portion, medical/education coverage, travel insurance, or personal accident exclusion is unclear.",
    checkAgainConditionsBM: "Jika tipe polisi, bahagian rider perubatan, perlindungan perubatan/pendidikan, insurans perjalanan, atau perlindungan kemalangan peribadi kurang jelas.",
    userFacingNote: "May be claimable for qualifying education or medical insurance premiums. Please check policy details.",
    userFacingNoteBM: "Pelepasan boleh dituntut untuk premium insurans pendidikan atau perubatan (kad perubatan) untuk diri sendiri, pasangan, atau anak.",
    claimLimit: "RM4,000",
    claimLimitBM: "RM4,000",
    requiredChecks: [
      "Policy must satisfy criteria: medical treatments resulting from disease, accident or disability.",
      "Coverage must be for a period of 12 months or more.",
      "Waiver benefit riders, travel, and personal accident (PA) portion premiums are strictly EXCLUDED.",
      "If paid as a rider on a life policy, only the premium paid on the medical/education rider qualifies."
    ],
    requiredChecksBM: [
      "Polisi mestilah untuk manfaat bayaran rawatan perubatan akibat penyakit, kemalangan, atau kecacatan.",
      "Perlindungan polisi insurans mestilah bagi tempoh 12 bulan atau lebih.",
      "Yuran premium untuk perjalanan dan perlindungan kemalangan diri (Personal Accident) adalah dilarang keras.",
      "Jika premium dibayar sebagai rider dalam polisi insurans hayat, hanya bahagian premium medical/education rider sahaja yang layak dituntut."
    ],
    sourceNote: "Subsections 49(1B), 49(4) and 50(2) of ITA 1967",
    lastReviewedYear: 2025
  },
  G20: {
    formItemCode: "G20",
    displayName: "SOCSO & EIS",
    displayNameBM: "Caruman PERKESO (SOCSO)",
    evidenceType: "Payment-record-based",
    evidenceTypeBM: "Rekod Pembayaran",
    keywords: ["SOCSO", "PERKESO", "EIS", "SIP", "contribution", "payslip", "EA form"],
    suggestedAppCategory: ClaimCategory.Other,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If the contribution amount cannot be verified from EA form, payslip, or contribution record.",
    checkAgainConditionsBM: "Jika jumlah kumulatif PERKESO/EIS di payslip atau EA form tidak sepadan.",
    userFacingNote: "May be claimable for SOCSO or EIS contributions, usually shown in salary records.",
    userFacingNoteBM: "Boleh dituntut untuk caruman PERKESO (SOCSO) dan SIP (EIS), lazimnya dinyatakan di dalam Borang EA.",
    claimLimit: "RM350",
    claimLimitBM: "RM350",
    requiredChecks: [
      "Contributions must be made in accordance with Employees Social Security Act 1969 (SOCSO) or Employment Insurance System Act 2017 (EIS).",
      "Confirm cumulative monthly contributions match the values stated on your corporate EA Form."
    ],
    requiredChecksBM: [
      "Caruman mestilah dibuat selaras dengan Akta Keselamatan Sosial Pekerja 1969 atau Akta Sistem Insurans Pekerjaan 2017.",
      "Sahkan jumlah caruman terkumpul tahunan berpandukan kenyataan Borang EA korporat anda."
    ],
    sourceNote: "Paragraph 46(1)(n) of ITA 1967",
    lastReviewedYear: 2025
  },
  G21: {
    formItemCode: "G21",
    displayName: "EV Charging & Compost",
    displayNameBM: "Pengecas EV & Mesin Kompos",
    evidenceType: "Receipt-based",
    evidenceTypeBM: "Berasaskan Resit",
    keywords: ["EV charger", "electric vehicle charger", "wallbox", "charging facility", "compost machine", "food waste compost"],
    suggestedAppCategory: ClaimCategory.Other,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If EV charging is for business use, compost machine claim frequency is unclear, or the receipt does not show enough detail.",
    checkAgainConditionsBM: "Jika kos EV untuk perniagaan, mesin kompos sisa makanan telah dituntut dalam 3 tahun lepas, atau resit tidak mencukupi.",
    userFacingNote: "May be claimable for EV charging facility costs or household food waste compost machine, subject to conditions.",
    userFacingNoteBM: "Boleh dituntut bagi perbelanjaan pemasangan, sewa, atau langganan kemudahan pengecasan kenderaan elektrik (EV) sendiri, atau pembelian mesin kompos makanan isi rumah.",
    claimLimit: "RM2,500",
    claimLimitBM: "RM2,500",
    requiredChecks: [
      "EV charging facility costs include installation, rental, purchase (including hire-purchase) or subscription of equipment or charging subscription. (Must NOT be for business use).",
      "Compost machine is claimable once in every three (3) years of assessment (YA 2025 to 2027)."
    ],
    requiredChecksBM: [
      "Perbelanjaan pemasangan, sewaan, pembelian sewa-beli termasuk langganan kemudahan pengecasan elektrik EV dilarang jika untuk perniagaan.",
      "Pembelian mesin kompos sisa makanan isi rumah dibenarkan tuntutan sekali sahaja bagi setiap tiga (3) tahun taksiran (YA 2025 ke 2027)."
    ],
    sourceNote: "Paragraph 46(1)(v)(i) & (ii) of ITA 1967",
    lastReviewedYear: 2025
  },
  G22: {
    formItemCode: "G22",
    displayName: "First Home Loan Interest",
    displayNameBM: "Faedah Pinjaman Perumahan Pertama",
    evidenceType: "Payment-record-based",
    evidenceTypeBM: "Rekod Pembayaran",
    keywords: ["housing loan", "home loan", "interest", "first home", "SPA", "sale and purchase agreement", "residential property"],
    suggestedAppCategory: ClaimCategory.Other,
    defaultStatus: ClaimStatus.CheckAgain,
    checkAgainConditions: "If it is not the first home, SPA date is outside the eligible period, property price is unclear, or the home is not for own residence.",
    checkAgainConditionsBM: "Jika kediaman bukan dibeli sebagai rumah pertama, tarikh SPA di luar jangkaan kelayakan, atau rumah untuk tujuan disewakan.",
    userFacingNote: "May be claimable for interest on a first residential property, subject to property price and purchase conditions.",
    userFacingNoteBM: "Pelepasan faedah pinjaman perumahan kediaman pertama dibenarkan mengikut had harga rumah dan terma SPA.",
    claimLimit: "RM7,000 (Property price <= RM500k) or RM5,000 (Property price RM500k to RM750k)",
    claimLimitBM: "Terhad RM7,000 (Harga rumah <= RM500k) atau RM5,000 (Harga rumah RM500k hingga RM750k)",
    requiredChecks: [
      "The residential property is the FIRST residential property purchased by the individual.",
      "Must be occupied as taxpayer's place of residence, and limited to only one unit.",
      "The Sale and Purchase Agreement (SPA) must be executed on or after 1 January 2025 but not later than 31 December 2027.",
      "Taxpayer must not derive any rental or secondary income from that residential property.",
      "Relief is available for three (3) consecutive years of assessment beginning from the year in which the interest is first expended."
    ],
    requiredChecksBM: [
      "Rumah kediaman adalah rumah pertama yang dibeli oleh pembayar cukai.",
      "Rumah tersebut mestilah diduduki sendiri sebagai tempat tinggal dan terhad kepada satu unit sahaja.",
      "Perjanjian Jual Beli (SPA) mestilah disempurnakan antara 1 Januari 2025 hingga 31 Disember 2027.",
      "Pembayar cukai dilarang memperoleh sebarang hasil sewaan daripada rumah kediaman tersebut.",
      "Pelepasan layak dituntut untuk tiga (3) tahun taksiran berturut-turut bermula dari tahun faedah pinjaman mula dibayar."
    ],
    sourceNote: "Paragraph 46(1)(v)(i) & (ii) of ITA 1967",
    lastReviewedYear: 2025
  }
};
