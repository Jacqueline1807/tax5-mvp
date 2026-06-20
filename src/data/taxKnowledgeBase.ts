export interface TaxKnowledgeBaseEntry {
  id: string;
  title: string;
  titleBM?: string;
  keywords: string[];
  answer: string;
  answerBM?: string;
  sourceLabel: string;
  sourceLabelBM?: string;
}

export const taxKnowledgeBase: TaxKnowledgeBaseEntry[] = [
  {
    id: "lifestyle-limit",
    title: "Lifestyle Relief Limit",
    titleBM: "Had Pelepasan Gaya Hidup",
    keywords: ["lifestyle", "g9", "reading", "books", "computer", "smartphone", "tablet", "internet", "magazine", "devices", "wifi", "gaya hidup", "bacaan", "buku", "komputer", "telefon pintar", "peranti"],
    answer: "The Lifestyle tax relief has a maximum limit of RM 2,500. It covers purchases of reading materials (books, journals, magazines), personal computers, smartphones, tablets, internet bills registered under your own name, and self-enhancement course fees. All claims must be supported by official receipts.",
    answerBM: "Pelepasan cukai Gaya Hidup mempunyai had maksimum RM2,500. Ia merangkumi pembelian bahan bacaan (buku, jurnal, majalah), komputer peribadi, telefon pintar, tablet, bil internet yang didaftarkan di bawah nama anda sendiri, dan yuran kursus peningkatan diri. Semua tuntutan mesti disokong oleh resit rasmi.",
    sourceLabel: "Source: HASiL/LHDN Form BE 2025 Explanatory Notes, Item G9",
    sourceLabelBM: "Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025, Item G9"
  },
  {
    id: "sports-lifestyle",
    title: "Sports Equipment and Activities under Lifestyle",
    titleBM: "Peralatan Sukan dan Aktiviti di bawah Gaya Hidup",
    keywords: ["sport", "sports", "equipment", "gym", "rental", "entrance fee", "sports facility", "venue", "competition", "training", "g10", "badminton", "fitness", "decathlon", "sukan", "alatan", "yuran gim", "gimnasium", "fasiliti", "sewaan"],
    answer: "There is an additional, separate Lifestyle relief for Sports with a maximum limit of RM 1,000. It covers purchasing sports equipment listed under the Sports Development Act 1997 (excluding motorized bicycles), gym memberships, sports training fees, rental or entry fees to sports facilities, and competition registration fees.",
    answerBM: "Terdapat pelepasan Gaya Hidup berasingan tambahan untuk Sukan dengan had maksimum RM1,000. Ia merangkumi pembelian peralatan sukan yang disenaraikan di bawah Akta Pembangunan Sukan 1997 (tidak termasuk basikal bermotor), keahlian gimnasium, yuran latihan sukan, yuran sewaan atau kemasukan ke kemudahan sukan, dan yuran pendaftaran pendaftaran.",
    sourceLabel: "Source: HASiL/LHDN Form BE 2025 Explanatory Notes, Item G10",
    sourceLabelBM: "Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025, Item G10"
  },
  {
    id: "medical-limit",
    title: "Medical Relief Limit",
    titleBM: "Had Pelepasan Perubatan",
    keywords: ["medical", "health", "serious disease", "fertility", "vaccination", "treatment", "illness", "g6", "parents medical", "grandparents medical", "perubatan", "kesihatan", "saringan", "rawatan", "vaksin", "penyakit", "ibu bapa"],
    answer: "The total relief limit for Medical Expenses is RM 10,000. This is a combined group threshold that covers treatment of serious diseases, fertility treatments, vaccinations (up to RM 1,000), complete medical examinations or health screening (up to RM 1,000), self-testing medical devices, and certified mental health consultation.",
    answerBM: "Jumlah had pelepasan untuk Perbelanjaan Perubatan ialah RM10,000. Ini adalah nilai ambang kumpulan gabungan yang merangkumi rawatan penyakit serius, rawatan kesuburan, vaksinasi (sehingga RM1,000), pemeriksaan perubatan lengkap atau saringan kesihatan (sehingga RM1,000), peranti perubatan ujian kendiri, dan rundingan kesihatan mental yang disahkan.",
    sourceLabel: "Source: HASiL/LHDN Form BE 2025 Explanatory Notes, Item G6",
    sourceLabelBM: "Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025, Item G6"
  },
  {
    id: "health-screening",
    title: "Health Screening under Medical",
    titleBM: "Saringan Kesihatan di bawah Perubatan",
    keywords: ["screening", "health examination", "checkup", "check-up", "examination", "blood test", "ultrasound", "mammogram", "pap smear", "covid test", "disease detection", "clinical lab", "g7", "saringan kesihatan", "pemeriksaan perubatan", "ujian darah", "mammogram", "pap smear", "ujian kendiri"],
    answer: "Complete medical examinations and disease detection tests (including blood tests, ultrasounds, mammograms, pap smears, influenza, and COVID-19 self-tests) are claimable with a sub-limit of RM 1,000. This RM 1,000 sub-limit is part of the overall RM 10,000 maximum medical expenses relief group.",
    answerBM: "Pemeriksaan perubatan lengkap dan ujian pengesanan penyakit (termasuk ujian darah, ultrasound, mammogram, pap smear, influenza, dan ujian kendiri COVID-19) boleh dituntut dengan had kecil RM1,000. Had kecil RM1,000 ini adalah sebahagian daripada keseluruhan kumpulan pelepasan perbelanjaan perubatan maksimum RM10,000.",
    sourceLabel: "Source: HASiL/LHDN Form BE 2025 Explanatory Notes, Item G7",
    sourceLabelBM: "Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025, Item G7"
  },
  {
    id: "education-relief",
    title: "Self-Education Relief",
    titleBM: "Pelepasan Pendidikan Diri",
    keywords: ["education", "self-education", "study", "course", "fees", "degree", "master", "doctorate", "upskilling", "professional qualification", "g5", "pendidikan", "yuran", "pengajian", "kursus", "sarjana", "ijazah", "sijil"],
    answer: "You can claim up to RM 7,000 for self-education fees at recognized institutions in Malaysia. This covers master's or doctorate courses, any course up to tertiary level in fields like law, accounting, Islamic finance, STEM, or technical/vocational courses, and general up-skilling or self-enhancement courses (capped up to RM 2,000).",
    answerBM: "Anda boleh menuntut sehingga RM7,000 untuk yuran pendidikan diri di institusi yang diiktiraf di Malaysia. Ini merangkumi kursus sarjana atau doktor falsafah, sebarang kursus sehingga peringkat pengajian tinggi dalam bidang seperti undang-undang, perakaunan, kewangan Islam, STEM, atau kursus teknikal/vokasional, dan kursus peningkatan kemahiran atau peningkatan diri umum (dihadkan sehingga RM2,000).",
    sourceLabel: "Source: HASiL/LHDN Form BE 2025 Explanatory Notes, Item G5",
    sourceLabelBM: "Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025, Item G5"
  },
  {
    id: "food-general-spending",
    title: "Non-claimable general personal or dining expenses",
    titleBM: "Perbelanjaan peribadi atau makan umum yang tidak boleh dituntut",
    keywords: ["food", "meals", "dining", "groceries", "cafe", "restaurant", "lunch", "dinner", "eating", "supermarket", "starbucks", "mcdonalds", "kfc", "grocer", "personal spend", "general expense", "grabfood", "foodpanda", "makanan", "makan", "kedai runcit", "restoran", "perbelanjaan peribadi"],
    answer: "General meals, dining, groceries, and normal personal spending are not usually claimable under standard Form BE personal relief categories. Tax5 can still save the receipt as a record, but mark it as Not eligible unless it matches a specific LHDN relief item.",
    answerBM: "Makanan umum, makan di luar, barangan runcit, dan perbelanjaan peribadi biasa biasanya tidak boleh dituntut di bawah kategori pelepasan cukai peribadi standard Borang BE. Tax5 masih boleh menyimpan resit tersebut sebagai rekod, tetapi menandakannya sebagai Tidak layak melainkan ia sepadan dengan item pelepasan LHDN yang khusus.",
    sourceLabel: "Source: HASiL/LHDN Form BE 2025 Explanatory Notes",
    sourceLabelBM: "Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025"
  },
  {
    id: "receipt-evidence",
    title: "Receipt Evidence Reminder",
    titleBM: "Peringatan Bukti Resit",
    keywords: ["evidence", "proof", "receipt", "receipts", "documentation", "invoice", "payment proof", "audit evidence", "tax audit", "bukti resit", "resit", "dokumen sokongan", "invois", "bukti pembayaran"],
    answer: "Keep official receipts, invoices, vouchers, or relevant supporting documents. Payment slips or bank records may help, but users should keep the original supporting document where available.",
    answerBM: "Simpan resit rasmi, invois, baucar, atau dokumen sokongan yang berkaitan. Slip pembayaran atau rekod bank boleh membantu, tetapi pengguna harus menyimpan dokumen sokongan asal jika ada.",
    sourceLabel: "Source: HASiL/LHDN Form BE 2025 Explanatory Notes",
    sourceLabelBM: "Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025"
  },
  {
    id: "record-keeping",
    title: "Record Keeping Requirement",
    titleBM: "Keperluan Menyimpan Rekod",
    keywords: ["keep", "record", "records", "years", "7 years", "audits", "storing", "storage", "saving", "simpan rekod", "7 tahun", "pelihara rekod", "simpanan resit"],
    answer: "Keep all records, receipts, working sheets, and supporting documents for seven (7) years after the end of the year in which the return form is submitted.",
    answerBM: "Simpan semua rekod, resit, helaian kerja, dan dokumen sokongan selama tujuh (7) tahun selepas akhir tahun borang nyata itu dikemukakan.",
    sourceLabel: "Source: HASiL/LHDN Form BE 2025 Explanatory Notes",
    sourceLabelBM: "Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025"
  },
  {
    id: "form-be-purpose",
    title: "Form BE Basic Purpose",
    titleBM: "Tujuan Asas Borang BE",
    keywords: ["form be", "what is form be", "be purpose", "resident individual", "salaried", "employee", "no business", "income tax form", "tujuan borang be", "apa itu borang be", "pekerja bergaji"],
    answer: "Form BE is the official Malaysian tax return filing form designed for resident individuals who do not carry on any business. Salaried employees, wage earners, and pensioners file their taxes annually using this form to declare statutory employment income, other non-business income, and claim eligible personal reliefs.",
    answerBM: "Borang BE ialah borang nyata cukai rasmi Malaysia yang direka untuk individu pemastautin yang tidak menjalankan sebarang perniagaan. Pekerja bergaji, penerima upah, dan pesara memfailkan cukai mereka setiap tahun menggunakan borang ini untuk mengisytiharkan pendapatan penggajian berkanun, pendapatan bukan perniagaan lain, dan menuntut pelepasan peribadi yang layak.",
    sourceLabel: "Source: HASiL/LHDN Form BE 2025 Explanatory Notes",
    sourceLabelBM: "Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025"
  }
];
