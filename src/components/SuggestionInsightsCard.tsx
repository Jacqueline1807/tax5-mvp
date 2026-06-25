import React, { useState, useEffect } from "react";
import { Sparkles, Info, Check, AlertTriangle, Book, HelpCircle } from "lucide-react";
import { ClaimStatus, TaxReliefGuideline } from "../types";
import { taxReliefGuidelines } from "../data/taxReliefGuidelines";
import { useLanguage } from "../context/LanguageContext";
import { calculateCompletionStatus, normalizeGuidelineCode } from "../utils/suggestionEngine";

const DISPLAY_NAME_BM: Record<string, string> = {
  "Personal & Dependent Relief": "Pelepasan Diri & Tanggungan",
  "Parents' Medical & Carer Expenses": "Kos Perubatan & Penjagaan Ibu Bapa",
  "Basic Supporting Equipment": "Alatan Sokongan Asas",
  "Disabled Individual Relief": "Pelepasan Individu Kurang Upaya (OKU)",
  "Self-Education Fees": "Yuran Pendidikan Diri",
  "Serious Diseases & Fertility Treatment": "Rawatan Penyakit Serius & Rawatan Kesuburan",
  "Health Exams & Medical Devices": "Pemeriksaan Kesihatan & Peranti Perubatan",
  "Learning Disability Support for Child": "Sokongan Kurang Upaya Pembelajaran Anak",
  "Lifestyle - Reading, Tech & Internet": "Gaya Hidup - Membaca, Peranti & Internet",
  "Lifestyle - Sports": "Gaya Hidup - Sukan",
  "Breastfeeding Equipment": "Peralatan Penyusuan Susu Ibu",
  "Child Care Fees": "Yuran Pengasuhan Anak (Tadika/Taska)",
  "SSPN Net Savings": "Tabungan Bersih SSPN",
  "Spouse / Alimony Relief": "Pelepasan Pasangan / Alimoni",
  "Disabled Spouse Relief": "Pelepasan Pasangan Kurang Upaya",
  "Child Relief": "Pelepasan Anak",
  "Life Insurance & EPF": "Insurans Hayat & KWSP",
  "PRS & Deferred Annuity": "PRS & Anuiti Tertangguh",
  "Education & Medical Insurance": "Insurans Pendidikan & Perubatan",
  "SOCSO & EIS": "PERKESO & SIP",
  "EV Charging & Compost": "Pengecasan EV & Mesin Kompos",
  "First Home Loan Interest": "Faedah Pinjaman Perumahan Pertama"
};

const EVIDENCE_TYPE_BM: Record<string, string> = {
  "Profile-based": "Berasaskan Profil",
  "Receipt-based": "Berasaskan Resit",
  "Payment-record-based": "Berasaskan Rekod Pembayaran"
};

const CODE_WHY_BM: Record<string, string> = {
  G1: "Anda mendapat pelepasan RM9,000 ini secara automatik untuk diri sendiri dan tanggungan anda.",
  G2: "Boleh dituntut untuk perbelanjaan perubatan, pergigian, keperluan khas, atau penjaga bagi ibu bapa bermastautin. Sila semak dokumen sokongan sebelum memfailkan.",
  G3: "Boleh dituntut untuk peralatan sokongan asas bagi diri sendiri, pasangan, anak, atau ibu bapa yang kurang upaya yang berdaftar.",
  G4: "Pelepasan tambahan terpakai jika anda disahkan secara rasmi sebagai individu kurang upaya (OKU).",
  G5: "Boleh dituntut untuk yuran pendidikan anda sendiri, tetapi kelayakan kursus dan institusi harus diperiksa.",
  G6: "Boleh dituntut di bawah kumpulan pelepasan perubatan. Sila semak pensijilan perubatan dan dokumen sokongan.",
  G7: "Boleh dituntut untuk pemeriksaan perubatan, ujian pengesanan penyakit, peranti ujian sendiri, atau perundingan kesihatan mental.",
  G8: "Boleh dituntut untuk diagnosis atau intervensi awal bagi anak yang mempunyai kesukaran pembelajaran.",
  G9: "Boleh dituntut untuk buku, peranti teknologi, bil internet, dan kursus peningkatan diri terpilih untuk kegunaan peribadi/keluarga.",
  G10: "Boleh dituntut untuk peralatan sukan, yuran gim, yuran kemudahan sukan, yuran pertandingan, atau latihan sukan.",
  G11: "Boleh dituntut untuk peralatan menyusukan anak, tetapi kelayakan bergantung kepada keadaan ibu/anak dan kekerapan tuntutan.",
  G12: "Boleh dituntut untuk yuran pusat jagaan kanak-kanak atau tadika berdaftar bagi anak-anak berumur 6 tahun ke bawah.",
  G13: "Boleh dituntut berdasarkan simpanan bersih SSPN sepanjang tahun, bukan sekadar jumlah deposit.",
  G14: "Pelepasan untuk pasangan yang tiada pendapatan atau pembayaran alimoni kepada bekas isteri di bawah syarat tertentu.",
  G15: "Pelepasan tambahan jika pasangan anda adalah orang kurang upaya (OKU) berdaftar.",
  G16: "Pelepasan automatik untuk anak-anak di bawah umur 18 tahun atau yang sedang belajar di institusi pengajian tinggi.",
  G17: "Caruman kepada insurans hayat dan KWSP (KWSP terutamanya ditolak melalui Slip gaji EA).",
  G18: "Caruman yang dibayar ke Skim Persaraan Swasta (PRS) atau anuiti tertangguh yang diluluskan.",
  G19: "Insurans perubatan atau pendidikan yang dibayar untuk diri sendiri, pasangan, atau anak-anak.",
  G20: "Caruman yang dibuat kepada PERKESO (SOCSO) oleh pekerja di bawah Akta Keselamatan Sosial Pekerja 1969.",
  G21: "Bil langganan/pemasangan kemudahan pengecasan EV atau pembelian mesin kompos sisa makanan di rumah.",
  G22: "Pelepasan faedah pinjaman perumahan untuk rumah kediaman pertama anda yang dibeli dalam tempoh YA tertentu."
};

const CODE_CONDITIONS_BM: Record<string, string> = {
  G1: "Biasanya tidak diperlukan kerana pelepasan ini digunakan secara automatik.",
  G2: "Jika penyedia perubatan/pergigian tidak sahkan berdaftar, ibu bapa/datuk nenek tidak bermastautin di Malaysia, atau dokumen sokongan tidak jelas.",
  G3: "Jika individu kurang upaya tidak sah diisytiharkan berdaftar dengan JKM atau barangan bukan peralatan sokongan asas yang jelas.",
  G4: "Jika tidak mempunyai pensijilan rasmi bertulis dari JKM.",
  G5: "Jika institusi, badan profesional, jenis kursus, atau status pengiktirafan tidak jelas.",
  G6: "Jika pensijilan doktor, jenis penyakit, keadaan kesuburan, status perkahwinan, atau dokumen sokongan tidak jelas.",
  G7: "Jika pendaftaran peranti, penyedia perubatan, kelayakan pakar, atau resit sokongan tidak jelas.",
  G8: "Jika umur anak, diagnosis, pendaftaran pengamal, atau penyedia rawatan tidak jelas.",
  G9: "Jika barangan untuk kegunaan perniagaan, tidak jelas, bahan bacaan yang diharamkan, caj jaminan, atau jenis kursus tidak jelas.",
  G10: "Jika ia peranti bermotor, berkaitan perniagaan, atau butiran kemudahan sukan/pertandingan/latihan tidak jelas.",
  G11: "Jika pembayar cukai bukan ibu yang menyusukan anak, umur anak melebihi 2 tahun, atau tuntutan sudah dibuat dalam tempoh YA yang layak.",
  G12: "Jika pendaftaran pusat jagaan/tadika, umur anak, atau bukti pembayaran tidak jelas.",
  G13: "Jika simpanan bersih tahunan tidak dapat disahkan atau jumlah pengeluaran melebihi deposit.",
  G14: "Jika pasangan mempunyai pendapatan melebihi had atau tiada bukti sah pembayaran alimoni.",
  G15: "Jika status OKU pasangan tidak disahkan secara rasmi dari JKM.",
  G16: "Jika had umur anak, status pengajian, atau dokumen pengiktirafan tidak dapat disahkan.",
  G17: "Jika penyata insurans tidak sepadan dengan kriteria pengecualian LHDN atau KWSP terlebih dituntut.",
  G18: "Jika caruman PRS bukan dengan pembekal berlesen bersandarkan LHDN Malaysia.",
  G19: "Jika polisi bukan untuk perlindungan perubatan/pendidikan yang sah atau tidak sepadan had.",
  G20: "Jika caruman SOCSO tidak dipaparkan dalam borang EA atau perisytiharan sukarela tidak jelas.",
  G21: "Jika langganan EV bukan atas nama sendiri atau mesin kompos bukan jenis isi rumah yang diluluskan.",
  G22: "Jika SPA bukan dalam julat tarikh yang layak (2025-2027) atau bukan kediaman pertama."
};

const CODE_CHECKS_BM: Record<string, string[]> = {
  G1: [
    "Tiada tindakan manual diperlukan. Digunakan untuk individu pemastautin secara automatik oleh LHDN.",
    "Sahkan bahawa anda diisytiharkan sebagai pembayar cukai pemastautin untuk tahun taksiran."
  ],
  G2: [
    "Sahkan ibu bapa atau datuk nenek adalah pemastautin Malaysia untuk tujuan cukai.",
    "Rawatan perubatan atau perkhidmatan penjagaan mesti disediakan di Malaysia.",
    "Status penjaga mesti disahkan oleh pengamal perubatan yang berdaftar dengan Majlis Perubatan Malaysia (MMC).",
    "Rawatan pergigian mestilah disahkan oleh doktor gigi yang berdaftar dengan Majlis Pergigian Malaysia (MDC).",
    "Simpan resit asal dan log pensijilan rasmi."
  ],
  G3: [
    "Sahkan individu kurang upaya (diri, pasangan, anak, atau ibu bapa) berdaftar dengan JKM (Jabatan Kebajikan Masyarakat).",
    "Barangan mestilah peralatan sokongan asas yang kritikal (seperti mesin dialisis, kerusi roda, kaki palsu, alat bantu pendengaran).",
    "Mengecualikan pembelian cermin mata dan kanta optik peribadi."
  ],
  G4: [
    "Memerlukan pensijilan rasmi bertulis daripada Jabatan Kebajikan Masyarakat (JKM).",
    "Mesti mempunyai kad JKM yang sah dalam fail."
  ],
  G5: [
    "Kursus pengajian sehingga peringkat tertiari (selain Sarjana/Doktor Falsafah) mestilah dalam bidang undang-undang, perakaunan, kewangan Islam, teknikal, vokasional, industri, saintifik atau teknologi.",
    "Institusi atau badan profesional mesti diiktiraf oleh Kerajaan Malaysia atau diluluskan oleh Menteri Kewangan.",
    "Kursus peningkatan kemahiran atau peningkatan diri mestilah dalam bidang kemahiran yang diiktiraf oleh Ketua Pengarah Pembangunan Kemahiran di bawah Akta Pembangunan Kemahiran Kebangsaan 2006."
  ],
  G6: [
    "Rawatan mestilah untuk penyakit serius diri sendiri, pasangan, atau anak, atau rawatan kesuburan sendiri atau pasangan.",
    "Pensijilan rawatan mestilah dikeluarkan oleh pengamal perubatan yang berdaftar dengan Majlis Perubatan Malaysia (MMC).",
    "Vaksinasi dihadkan sehingga RM1,000 dan pemeriksaan/rawatan pergigian dihadkan sehingga RM1,000."
  ],
  G7: [
    "Pemeriksaan perubatan lengkap mesti dilakukan di hospital atau oleh pengamal perubatan yang berdaftar dengan Majlis Perubatan Malaysia (MMC).",
    "Peranti perubatan ujian sendiri (oksimeter, pemantau tekanan darah, termometer, kit ujian kendiri COVID/influenza) mestilah berdaftar di bawah Akta Peranti Perubatan 2012.",
    "Rundingan atau pemeriksaan kesihatan mental mestilah dengan pakar psikiatri berdaftar, pakar psikologi berdaftar, atau kaunselor bertauliah."
  ],
  G8: [
    "Pembayar cukai mestilah ibu bapa kepada anak yang disahkan mempunyai kurang upaya pembelajaran.",
    "Anak mestilah berumur 18 tahun dan ke bawah.",
    "Kurang upaya pembelajaran mesti disahkan oleh pengamal perubatan yang berdaftar dengan Majlis Perubatan Malaysia (MMC) atau Majlis Profesion Kesihatan Bersekutu.",
    "Pemulihan, program intervensi awal, atau diagnosis mesti dijalankan di Malaysia."
  ],
  G9: [
    "Mestilah untuk kegunaan/faedah diri sendiri, pasangan, atau anak.",
    "Must NOT be used for the purpose of the individual's or family's own business.",
    "Mengecualikan caj tambahan untuk jaminan perkakasan (warranty).",
    "Mengecualikan penerbitan yang dilarang atau menyalahi undang-undang.",
    "Bil internet bulanan mestilah didaftarkan di bawah nama pembayar cukai sendiri."
  ],
  G10: [
    "Pembelian mestilah untuk peralatan sukan bagi sebarang aktiviti sukan yang disenaraikan di bawah Akta Pembangunan Sukan 1997.",
    "Basikal dua roda bermotor adalah dilarang sama sekali daripada dituntut.",
    "Sewa gimnasium atau kemudahan sukan, yuran masuk, atau yuran pendaftaran untuk pertandingan sukan mestilah daripada penganjur yang diluluskan.",
    "Yuran keahlian gim atau latihan sukan mestilah disediakan oleh persatuan sukan atau kelab yang berdaftar, atau syarikat berlesen."
  ],
  G11: [
    "Pelepasan dibenarkan secara eksklusif untuk pembayar cukai wanita sahaja.",
    "Mestilah ibu yang menyusukan anak yang menuntut untuk anaknya sendiri berumur 2 tahun dan ke bawah.",
    "Potongan ini hanya dibenarkan SEKALI setiap dua (2) tahun taksiran.",
    "Dalam kes Taksiran Bersama, pelepasan ini hanya dibenarkan jika taksiran dibuat atas nama isteri."
  ],
  G12: [
    "Yuran jagaan anak langsung dibayar untuk anak berumur 6 tahun dan ke bawah.",
    "Pusat jagaan kanak-kanak mestilah berdaftar rasmi dengan Jabatan Kebajikan Masyarakat (JKM) di bawah Akta Pusat Jagaan Kanak-Kanak 1984.",
    "Tadika mestilah berdaftar dengan Kementerian Pendidikan Malaysia (KPM) bawah Akta Pendidikan 1996.",
    "Mesti menyimpan sijil kelahiran anak (MyKid) dan resit yuran bulanan rasmi."
  ],
  G13: [
    "Potongan yang dibenarkan adalah terhad kepada jumlah BERSIH yang disimpan dalam tahun taksiran (Jumlah deposit tolak Jumlah pengeluaran).",
    "Simpanan terkumpul dari tahun-tahun sebelumnya tidak diambil kira.",
    "Simpan log akaun rasmi daripada portal PTPTN bersedia."
  ],
  G14: [
    "Isteri atau suami yang tinggal bersama tidak mempunyai sumber pendapatan, atau memilih taksiran bersama.",
    "Bayaran alimoni kepada bekas isteri dihadkan terhad kepada jumlah yang dipersetujui secara sah."
  ],
  G15: [
    "Suami/isteri mestilah OKU yang disahkan dengan kad JKM yang sah pada fail."
  ],
  G16: [
    "Pelepasan am anak bawah 18 tahun atau atas 18 tahun yang sedang belajar sepenuh masa di kolej/universiti."
  ],
  G17: [
    "Had premium insurans hayat dan caruman KWSP yang diluluskan.",
    "Kakitangan awam berpencen layak mendapat tuntutan sehingga had optimum."
  ],
  G18: [
    "Caruman dibuat kepada Skim Persaraan Swasta (PRS) yang diluluskan Suruhanjaya Sekuriti.",
    "Transaksi mesti disahkan oleh penyata tahunan PRS pemegang akaun cukai."
  ],
  G19: [
    "Mesti dibayar untuk polisi perlindungan penyakit ubat atau insurans pendidikan anak.",
    "Polisi mesti mempunyai rider/bukti perbelanjaan yang jelas."
  ],
  G20: [
    "Caruman pekerja kepada PERKESO dikesan menerusi slip gaji EA.",
    "Sahkan jumlah bersih tahunan sepadan borang nyata cukai."
  ],
  G21: [
    "Pengecasan bateri kenderaan elektrik (pembelian, sewa, langganan atau pemasangan).",
    "Mesin pengkomposan sisa organik isi rumah bertujuan mesra alam."
  ],
  G22: [
    "Rumah kediaman pertama pemegang taksiran cukai.",
    "Faedah atas pinjaman perumahan terhad mengikut had kelayakan tarikh SPA."
  ]
};

function translateLimitBM(limitText: string): string {
  if (!limitText) return "";
  let text = limitText;
  text = text.replace(/Automatic/gi, "Automatik");
  text = text.replace(/Dental restricted to/gi, "Pergigian terhad kepada");
  text = text.replace(/Complete medical exam restricted to/gi, "Pemeriksaan perubatan penuh terhad kepada");
  text = text.replace(/Upskilling or self-enhancement courses restricted to/gi, "Kursus peningkatan kemahiran atau peningkatan diri terhad kepada");
  text = text.replace(/Shared with/gi, "Berkongsi dengan");
  text = text.replace(/Inside the/gi, "Di dalam had");
  text = text.replace(/Serious Disease limit/gi, "Penyakit Serius");
  text = text.replace(/Dependent on age, studies, and disability status/gi, "Bergantung kepada umur, pengajian, dan status kurang upaya");
  text = text.replace(/EPF contributions restricted to/gi, "Caruman KWSP terhad kepada");
  text = text.replace(/Life insurance premiums restricted to/gi, "Premium insurans hayat terhad kepada");
  text = text.replace(/Property price/gi, "Harga hartanah");
  text = text.replace(/to/gi, "hingga");
  return text;
}

function translateDynamicWhyBM(whyText: string): string {
  if (!whyText) return "";
  let text = whyText;
  
  // Replace standard phrases
  text = text.replace(/This receipt appears to be for (.*) spending\./gi, (m, cat) => {
    const malayCat = cat.trim().toLowerCase() === "lifestyle" ? "gaya hidup" 
                     : cat.trim().toLowerCase() === "medical" ? "perubatan"
                     : cat.trim().toLowerCase() === "sports" ? "sukan"
                     : cat.trim().toLowerCase() === "insurance" ? "insurans"
                     : cat.trim().toLowerCase() === "education" ? "pendidikan"
                     : "pelepasan cukai dibenarkan";
    return `Resit ini nampaknya adalah untuk perbelanjaan ${malayCat}.`;
  });

  text = text.replace(/Suggested confidently!/gi, "Dicadangkan dengan yakin!");
  text = text.replace(/Form BE 2025 childcare relief applies as you confirmed having a child aged 6 or below in Smart Claim Setup\./gi, "Pelepasan penjagaan anak Borang BE 2025 terpakai kerana anda mengesahkan mempunyai anak berumur 6 tahun ke bawah dalam Smart Setup.");
  text = text.replace(/Needs Review\./gi, "Perlu Semak.");
  text = text.replace(/Child care relief was not confirmed or is unsure in your Smart Claim Setup\. Receipts are still allowed to track\./gi, "Pelepasan penjagaan anak tidak disahkan atau tidak pasti dalam Smart Setup. Resit masih dijejak.");
  text = text.replace(/Breastfeeding equip claim matches your confirmed child aged 2 years or below in setup\./gi, "Tuntutan peralatan penyusuan sepadan dengan anak berumur 2 tahun ke bawah yang disahkan dalam Smart Setup.");
  text = text.replace(/Child under 2 was not confirmed or is unsure in Smart Claim Setup\. Receipts are allowed but need matching proof\./gi, "Anak di bawah umur 2 tahun tidak disahkan atau tidak pasti dalam Smart Setup. Resit dibenarkan dan dijejak.");
  text = text.replace(/Matches child education relief since you confirmed having a child aged 18\+ who is studying in setup\./gi, "Sepadan dengan pelepasan pendidikan anak kerana anda mengesahkan mempunyai anak berumur 18+ tahun yang sedang belajar dalam Smart Setup.");
  text = text.replace(/Child studying status was not confirmed in Smart Claim Setup\. This receipt is allowed but marked for checking\./gi, "Status anak sedang belajar tidak disahkan dalam Smart Setup. Resit ini dibenarkan tetapi ditandakan untuk semakan.");
  text = text.replace(/Matches disability-related supporting equipment or therapy based on your Smart Claim Setup\./gi, "Sepadan dengan peralatan sokongan atau terapi berkaitan kurang upaya berdasarkan Smart Setup.");
  text = text.replace(/OKU\/disability registration was not confirmed or is unsure in your Smart Claim Setup\. Claims are still tracked\./gi, "Pendaftaran OKU/kurang upaya tidak disahkan atau tidak pasti dalam Smart Setup. Tuntutan tetap dijejak.");
  text = text.replace(/Parent support certified medical expenses matches your confirmed setup answers\./gi, "Perbelanjaan perubatan disahkan sokongan ibu bapa sepadan dengan jawapan Smart Setup anda.");
  text = text.replace(/Parent medical support was not confirmed in your Smart Claim Setup\. Kept for records but requires certification\./gi, "Sokongan perubatan ibu bapa tidak disahkan dalam Smart Setup anda. Disimpan untuk rekod tetapi memerlukan pensijilan.");
  text = text.replace(/Form BE 2025 serious disease claim matches your declared medical setup details\./gi, "Tuntutan penyakit serius Borang BE 2025 sepadan dengan butiran persediaan perubatan anda.");
  text = text.replace(/Serious disease medical treatment was not confirmed in Smart Claim Setup\. Kept for calculation but flagged\./gi, "Rawatan perubatan penyakit serius tidak disahkan dalam Smart Setup. Disimpan untuk pengiraan tetapi ditandakan.");
  text = text.replace(/Fertility medical claim matches your declared IVF\/IUI\/consultation answer\./gi, "Tuntutan perubatan kesuburan sepadan dengan jawapan IVF/IUI/perundingan yang diisytiharkan.");
  text = text.replace(/Fertility treatment was not checked in Smart Claim Setup\. Kept for record but needs physician certification\./gi, "Rawatan kesuburan tidak ditandakan dalam Smart Setup. Disimpan untuk rekod tetapi memerlukan pensijilan doktor.");
  text = text.replace(/Vaccination or health screenings are eligible under your active Medical options\./gi, "Penyaringan kesihatan atau vaksinasi adalah layak di bawah pilihan perkhidmatan Perubatan anda yang aktif.");
  text = text.replace(/Screenings or dental claims weren't selected in Smart Claim Setup but are tracked under medical limits\./gi, "Tuntutan saringan atau pergigian tidak dipilih dalam Smart Setup tetapi dijejak di bawah pelepasan perubatan.");
  text = text.replace(/Mental health consultation matches your confirmed guidance options in Smart Claim Setup\./gi, "Rundingan kesihatan mental sepadan dengan pilihan anda dalam Smart Setup.");
  text = text.replace(/Mental health guidance wasn't confirmed in setup\. Flagged to verify professional provider type\./gi, "Panduan kesihatan mental tidak disahkan dalam persediaan. Ditandakan untuk mengesahkan penyedia profesional.");
  text = text.replace(/Child learning disability assessments align with your Smart Claim Setup\./gi, "Penilaian kesukaran pembelajaran anak selaras dengan Smart Setup anda.");
  text = text.replace(/Child learning disability wasn't selected in setup\. Flagged for assessment verification\./gi, "Kesukaran pembelajaran anak tidak dipilih dalam persediaan. Ditandakan untuk pengesahan penilaian.");
  text = text.replace(/Premium matches your confirmed life insurance details in Smart Claim Setup\./gi, "Premium sepadan dengan insurans hayat anda yang disahkan dalam Smart Setup.");
  text = text.replace(/Life insurance premium was not confirmed in Smart Setup\. Flagged for policy statement matching\./gi, "Insurans hayat tidak disahkan dalam Smart Setup. Ditandakan untuk pemadanan penyata.");
  text = text.replace(/Matches your declared medical or education insurance policy setup\./gi, "Sepadan dengan polisi insurans perubatan atau pendidikan yang diisytiharkan.");
  text = text.replace(/Medical\/education insurance was not confirmed\. Check policy details to identify the correct category\./gi, "Insurans perubatan/pendidikan tidak disahkan. Sila semak butiran polisi.");
  text = text.replace(/Matches your private retirement savings contributions declared in setup\./gi, "Sepadan dengan caruman simpanan persaraan swasta (PRS) anda dalam silp.");
  text = text.replace(/PRS contribution was not selected in Smart Claim Setup\. Marked for statement checking\./gi, "Caruman PRS tidak dipilih dalam Smart Setup. Ditandakan untuk semakan.");
  text = text.replace(/Child SSPN relief matches your child savings profile\. Remember to check your SSPN statement and update the final amount if needed before finishing\./gi, "Pelepasan SSPN anak sepadan dengan profil simpanan anak anda. Sila semak penyata SSPN dan kemas kini jumlah bersih.");
  text = text.replace(/SSPN receipt scanned but child savings is 'Not sure' in setup\. Try to check your SSPN statement and update the final amount if needed\./gi, "Resit SSPN diimbas tetapi simpanan adalah 'Tidak Pasti'. Sila semak penyata SSPN dan kemas kini jumlah bersih.");
  text = text.replace(/Tax5 detected an SSPN receipt but child education savings is turned off in setup\./gi, "Tax5 mengesan resit SSPN tetapi simpanan pendidikan dimatikan dalam Smart Setup.");
  text = text.replace(/Matches first home interest relief based on your home purchase declared in Smart Setup\. Specific dates apply\./gi, "Sepadan dengan pelepasan faedah rumah pertama mengikut tarikh SPA.");
  text = text.replace(/First residential property interest claim is flagged due to strict eligibility constraints \(SPA 2025-2027\)\./gi, "Tuntutan faedah rumah kediaman pertama ditandakan kerana prasyarat tarikh.");
  text = text.replace(/EV charging subscription\/installation matches your confirmed setup vehicle info\./gi, "Pengecasan EV sepadan dengan kenderaan yang disahkan dalam Smart Setup.");
  text = text.replace(/EV charger claiming wasn't checked in Smart Claim Setup\. Flagged to check vehicle usage\./gi, "Pengecas EV tidak ditandakan dalam Smart Setup. Ditandakan untuk pemeriksaan.");
  text = text.replace(/Bio-waste compost machine expenses matches your green home setup\./gi, "Perbelanjaan mesin kompos sisa seleras dengan pilihan rumah hijau.");
  text = text.replace(/Composting machine expenses was not confirmed in Smart Claim Setup\. Kept for record\./gi, "Mesin kompos tidak disahkan dalam Smart Setup. Disimpan untuk rekod.");
  return text;
}

function translateDynamicCheckBM(checkText: string): string {
  if (!checkText) return "";
  let text = checkText;
  text = text.replace(/Keep child’s birth document\/MyKid and monthly fee receipts issued by the registered childcare centre\/kindergarten\./gi, "Simpan dokumen kelahiran anak/MyKid dan resit yuran bulanan tadika/taska berdaftar.");
  text = text.replace(/Ensure the child is under 6 years old, taska\/tadika is registered with JKM\/MOE, and keep the monthly receipts & child’s birth document\./gi, "Pastikan anak berumur <6 tahun, tadika/taska berdaftar JKM/KPM, simpan resit & sijil lahir.");
  text = text.replace(/Keep receipts for breastfeeding equipment \(breast pump kit, milk storage, ice pack, or cooler bag\) on file\./gi, "Simpan resit peralatan penyusuan susu (pam, simpanan, pek ais).");
  text = text.replace(/Receipt is allowed, but keep receipts for breast pump\/milk storage or cooler bag, and check child is under 2\./gi, "Resit dibenarkan, simpan resit pam/simpanan susu dan pastikan anak <2 tahun.");
  text = text.replace(/Keep proof of the child’s study status or education documents where relevant\./gi, "Simpan bukti pengajian atau dokumen sokongan pendidikan anak.");
  text = text.replace(/Confirm the child’s study status and keep school\/college\/university tuition fee payment documents\./gi, "Sahkan pengajian anak dan simpan bukti yuran kolej/universiti.");
  text = text.replace(/Keep written certification or registration proof from the Department of Social Welfare \(DSW\/JKM\)\./gi, "Simpan bukti pendaftaran JKM (kad OKU) atau dokumen sokongan.");
  text = text.replace(/Ensure JKM\/DSW certification is available\. Supporting equipment or therapy cannot be claimed without registration\./gi, "Sahkan kad OKU JKM tersedia. Tuntutan memerlukan pendaftaran rasmi.");
  text = text.replace(/Keep official hospital\/clinic receipts and medical practitioner certification of parent needs\./gi, "Simpan resit hospital/klinik dan pensijilan pengamal perubatan.");
  text = text.replace(/Confirm expenses are for medical treatment, special needs, or carer of resident parents, and keep practitioner certified proof\./gi, "Sahkan rawatan perubatan ibu bapa dan simpan bukti pengamal perubatan.");
  text = text.replace(/Keep official treatment receipts and MMC-registered practitioner certification\./gi, "Simpan resit rawatan rasmi dan sijil pengamal perubatan berdaftar MMC.");
  text = text.replace(/Official treatment receipts and medical practitioner registered certification are required for LHDN audit\./gi, "Resit rawatan rasmi dan sijil pengamal MMC diperlukan sisi undang-undang.");
  text = text.replace(/Keep official receipts and registered medical practitioner certification\./gi, "Simpan resit rasmi dan sijil pengamal perubatan berdaftar.");
  text = text.replace(/Ensure medical receipts and official written certification from your physician are saved\./gi, "Pastikan resit perubatan dan sijil bertulis doktor anda ada disimpan.");
  text = text.replace(/Keep official receipts for health screening, examinations, or vaccines\./gi, "Simpan resit rasmi untuk saringan kesihatan, ujian kesihatan lengkap atau vaksin.");
  text = text.replace(/Keep official receipts\. For dental check-ups, ensure a registered dental practitioner clinic receipt\./gi, "Simpan resit pemeriksaan pergigian daripada klinik pengamal berdaftar.");
  text = text.replace(/Keep official consultation receipts issued by registered psychiatrists, psychologists, or registered counsellors\./gi, "Simpan resit psikiatri/psikologi/kaunselor berdaftar yang sah.");
  text = text.replace(/Must be certified by psychiatrist, psychologist, or counsellor\. Keep registered receipts\./gi, "Mesti disahkan oleh pakar psikiatri, pakar psikologi, atau kaunselor berdaftar.");
  text = text.replace(/Keep receipts from registered medical or allied health practitioners alongside child learning disability proof\./gi, "Simpan resit rawatan bersama kad pembelajaran khas anak.");
  text = text.replace(/Assessment receipts must be from registered practitioners\. Verify child is under 18\./gi, "Resit semakan mestilah daripada pengamal berdaftar dan anak <18 tahun.");
  text = text.replace(/Keep insurance premium statement, annual statement, or official receipt\./gi, "Simpan penyata premium tahunan insurans hayat.");
  text = text.replace(/Ensure a valid premium statement is present\. Keep insurance statement showing it is G17 eligible\./gi, "Sahkan penyata premium hayat (G17) tahunan anda disimpan.");
  text = text.replace(/Keep insurance payment statement indicating medical or education rider details\./gi, "Simpan penyata insurans medikal/pendidikan.");
  text = text.replace(/Keep insurance statement showing whether the policy is medical, education, or a general life rider\./gi, "Simpan penyata polisi menunjukkan pembagian premium perubatan/hayat.");
  text = text.replace(/Keep PRS or deferred annuity payment transaction statements\./gi, "Simpan penyata caruman Skim Persaraan Swasta (PRS) atau anuiti.");
  text = text.replace(/Keep official PRS\/deferred annuity statements issued by approved providers\./gi, "Simpan penyata tahunan PRS yang dikeluarkan oleh ejen berlesen.");
  text = text.replace(/Check your SSPN statement and update the final amount if needed\./gi, "Semak penyata tahunan SSPN di portal PTPTN.");
  text = text.replace(/Keep SPA, housing loan contracts, annual interest rate sheets, and evidence of sole residence\./gi, "Simpan SPA, kontrak pinjaman perumahan serta penyata faedah tahunan.");
  text = text.replace(/Keep Sale & Purchase Agreement, loan ledger, interest statements, and proof it's your first dwelling\./gi, "Simpan Perjanjian S&P, lejar pinjaman, dan bukti kediaman pertama.");
  text = text.replace(/Keep official receipts\/subscription bills\. Must be for your own personal vehicle, not business\./gi, "Simpan resit bil pemasangan/langganan pengecas EV persendirian.");
  text = text.replace(/Receipt must correspond to own vehicle charger purchase\/rental\/subscription\. Personal use only\./gi, "Mestilah resit sewaan/pemasangan kotak pengecas milik kenderaan sendiri.");
  text = text.replace(/Keep official invoice or receipt showing purchase of bio-waste machine\./gi, "Simpan resit pembelian rasmi mesin kompos sisa makanan.");
  text = text.replace(/Verify composting machine is for household use\. Keep purchase invoices and evidence of payment\./gi, "Sahkan pembelian pengkompos sisa rumah dan bukti pembayarannya.");
  text = text.replace(/Confirm it was for personal or family use and keep the digital receipt\./gi, "Sahkan utiliti peribadi/keluarga dan simpan dokumen digital.");
  return text;
}

interface SuggestionInsightsCardProps {
  formBEItem?: string;
  claimStatus?: ClaimStatus | string;
  confidence?: "High" | "Medium" | "Low";
  suggestionWhy?: string;
  suggestionCheck?: string;
  id?: string;
  receiptId?: string;
}

export const SuggestionInsightsCard: React.FC<SuggestionInsightsCardProps> = ({
  formBEItem,
  claimStatus,
  confidence,
  suggestionWhy,
  suggestionCheck,
  id = "tax5-suggestion-card",
  receiptId,
}) => {
  const { t, language } = useLanguage();
  const code = normalizeGuidelineCode(formBEItem);
  const guideline: TaxReliefGuideline | undefined = taxReliefGuidelines[code];

  // Load smart setup dynamically to allow instant actions
  const rawSetup = localStorage.getItem("tax5_smart_setup");
  const smartSetupFromStorage = rawSetup ? JSON.parse(rawSetup) : null;

  const isSspnSection = code === "G13" || (formBEItem || "").toLowerCase().includes("sspn") || (guideline?.displayName || "").toLowerCase().includes("sspn");
  const isSspnDisabled = !smartSetupFromStorage || smartSetupFromStorage.sspnSavingsChild === "No" || !smartSetupFromStorage.sspnSavingsChild;

  const handleTurnOnSSPN = () => {
    let updated;
    if (smartSetupFromStorage) {
      updated = {
        ...smartSetupFromStorage,
        sspnSavingsChild: "Yes"
      };
    } else {
      updated = {
        sspnSavingsChild: "Yes",
        childrenCount: "Yes"
      };
    }
    localStorage.setItem("tax5_smart_setup", JSON.stringify(updated));
    window.location.reload();
  };

  // Map "Check Again" to "Needs Review" in display label
  const getDisplayStatus = (status?: string | ClaimStatus) => {
    if (!status) return "Needs Review";
    const normal = status.trim();
    if (normal === "Check Again" || normal === "Check_Again" || normal === "Needs Review") {
      return "Needs Review";
    }
    return normal;
  };

  const getStatusColor = (statusText: string) => {
    const s = statusText.toLowerCase();
    if (s.includes("claimable")) {
      return "text-teal-brand bg-teal-brand-light/40 border-teal-brand/10";
    } else if (s.includes("review") || s.includes("check")) {
      return "text-amber-brand bg-[#FFFDF5] border-amber-brand/20";
    } else {
      return "text-neutral-450 bg-neutral-100 border-neutral-200";
    }
  };

  // State to track checklist items checked. Key: guideline item + index
  const [checkedChecks, setCheckedChecks] = useState<Record<string, boolean>>(() => {
    const storageKey = receiptId ? `tax5_checklist_ticked_${receiptId}` : `tax5_checklist_ticked_${code}`;
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  });

  // Sync checklist state when receiptId or code changes
  useEffect(() => {
    const storageKey = receiptId ? `tax5_checklist_ticked_${receiptId}` : `tax5_checklist_ticked_${code}`;
    const saved = localStorage.getItem(storageKey);
    setCheckedChecks(saved ? JSON.parse(saved) : {});
  }, [receiptId, code]);

  const toggleCheck = (index: number) => {
    const key = `${code}-${index}`;
    setCheckedChecks((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key],
      };
      const storageKey = receiptId ? `tax5_checklist_ticked_${receiptId}` : `tax5_checklist_ticked_${code}`;
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  if (!code) return null;

  if (!guideline) {
    return (
      <div id={id} className="bg-[#FAFBFB] rounded-2xl p-4 border border-neutral-200 shadow-xs space-y-3 animate-fadeIn">
        <div className="flex items-center gap-1.5 text-neutral-500 text-[10.5px] font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{language === "BM" ? "Wawasan Cadangan Tax5" : "Tax5 Suggestion Insights"}</span>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-neutral-150 text-xs text-neutral-600 font-medium whitespace-pre-wrap">
          {language === "BM" ? "Tax5 belum dapat memadankan resit ini dengan panduan. Sila semak secara manual menggunakan maklumat rasmi LHDN/MyTax." : "Tax5 could not match this receipt to a guideline yet. Please review manually using the latest LHDN/MyTax information."}
        </div>
        <div className="text-[9px] text-[#71717A] leading-normal italic bg-zinc-50 p-2 rounded-lg border border-neutral-100/90 font-sans space-y-1">
          <div>
            ⚠️ <strong>{language === "BM" ? "Nota:" : "Note:"}</strong> {language === "BM" ? "Tax5 hanyalah alat sokongan pra-pemfailan sahaja. Kelayakan tuntutan akhir mesti disahkan menggunakan maklumat rasmi LHDN/MyTax." : "Tax5 is a pre-filing support tool only. Final claim eligibility must be verified using official LHDN/MyTax information."}
          </div>
          <div className="text-[8.5px] text-neutral-400 not-italic pt-1 border-t border-neutral-200/40 flex items-center gap-1">
            <Book className="w-3 h-3 text-neutral-400 shrink-0" />
            <span>
              {language === "BM"
                ? "Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025"
                : "Source: HASiL/LHDN Form BE 2025 Explanatory Notes"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const normalizedStatus = getDisplayStatus(claimStatus || guideline.defaultStatus);
  const displayConfidence = confidence || (guideline.defaultStatus === ClaimStatus.Claimable ? "High" : "Medium");

  const getDisplayStatusText = (status: string) => {
    if (status === "Claimable") return language === "BM" ? "Boleh Dituntut" : "Claimable";
    if (status === "Needs Review" || status === "Need Review") return language === "BM" ? "Perlu Semakan" : "Need Review";
    if (status === "Not-eligible" || status === "NonClaimable" || status === "Not Eligible") return language === "BM" ? "Tidak Layak" : "Not Eligible";
    return status;
  };

  const getConfidenceText = (conf: string) => {
    if (conf === "High") return language === "BM" ? "Tinggi" : "High";
    if (conf === "Medium") return language === "BM" ? "Sederhana" : "Medium";
    if (conf === "Low") return language === "BM" ? "Rendah" : "Low";
    return conf;
  };

  // Localized values based on language
  const localizedDisplayName = language === "BM" ? (DISPLAY_NAME_BM[guideline.displayName] || guideline.displayName) : guideline.displayName;
  const localizedEvidenceType = language === "BM" ? (EVIDENCE_TYPE_BM[guideline.evidenceType] || guideline.evidenceType) : guideline.evidenceType;
  const localizedUserFacingNote = language === "BM" ? (CODE_WHY_BM[guideline.formItemCode] || guideline.userFacingNote) : guideline.userFacingNote;
  const localizedCheckAgainConditions = language === "BM" ? (CODE_CONDITIONS_BM[guideline.formItemCode] || guideline.checkAgainConditions) : guideline.checkAgainConditions;
  const localizedRequiredChecks = language === "BM" ? (CODE_CHECKS_BM[guideline.formItemCode] || guideline.requiredChecks) : guideline.requiredChecks;
  const localizedClaimLimit = language === "BM" && guideline.claimLimit ? translateLimitBM(guideline.claimLimit) : guideline.claimLimit;

  // Localized dynamic why & check context statements
  const localizedSuggestionWhy = language === "BM" && suggestionWhy ? translateDynamicWhyBM(suggestionWhy) : suggestionWhy;
  const localizedSuggestionCheck = language === "BM" && suggestionCheck ? translateDynamicCheckBM(suggestionCheck) : suggestionCheck;

  const allTicked = localizedRequiredChecks.length > 0 && localizedRequiredChecks.every((_, idx) => !!checkedChecks[`${code}-${idx}`]);

  return (
    <div
      id={id}
      className={`rounded-2xl p-4 border shadow-xs space-y-3.5 animate-fadeIn ${
        normalizedStatus === "Claimable"
          ? "bg-[#F4FBF9] border-teal-brand/15"
          : "bg-amber-100/10 border-amber-brand/15"
      }`}
    >
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-teal-brand text-[10.5px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 fill-teal-brand-light animate-pulse" />
          <span>{language === "BM" ? "Wawasan Cadangan Tax5" : "Tax5 Suggestion Insights"}</span>
        </div>
        <span className="text-[9px] text-neutral-400 font-bold tracking-tight">
          {language === "BM" ? `Panduan YA ${guideline.lastReviewedYear}` : `YA ${guideline.lastReviewedYear} Guide`}
        </span>
      </div>

      {/* Profile Complete / Incomplete Reminder */}
      {!smartSetupFromStorage || calculateCompletionStatus(smartSetupFromStorage) !== "Ready" ? (
        <div className="bg-amber-50/45 border border-amber-500/10 rounded-xl p-2.5 text-[11px] text-amber-900 leading-normal font-sans shadow-3xs flex items-start gap-2">
          <span className="shrink-0 text-amber-600">⚠️</span>
          <div>
            <strong>{language === "BM" ? "Profil Cukai Tidak Lengkap:" : "Incomplete Tax Profile:"}</strong>{" "}
            {language === "BM" 
              ? "Sila semak kelayakan tuntutan anda dengan teliti kerana profil Setup Cukai Pintar anda belum selesai." 
              : "Please review your claim eligibility carefully as your Smart Tax Setup profile is incomplete."}
          </div>
        </div>
      ) : (
        (smartSetupFromStorage.maritalStatus === "Married" || (smartSetupFromStorage.childrenCount && smartSetupFromStorage.childrenCount !== "0")) && (
          <div className="bg-teal-50/40 border border-teal-500/10 rounded-xl p-2.5 text-[11px] text-[#00604A] leading-normal font-sans shadow-3xs flex items-start gap-2">
            <span className="shrink-0 text-teal-600">👥</span>
            <div>
              <strong>{language === "BM" ? "Panduan Diperibadikan:" : "Personalized Guidance:"}</strong>{" "}
              {language === "BM" 
                ? "Resit boleh dituntut untuk kegunaan diri sendiri, pasangan anda, atau anak-anak anda (maklumat keluarga dikesan daripada profil anda)." 
                : "Receipts can be claimed for the use/benefit of yourself, your spouse, or your children (family info detected from your profile)."}
            </div>
          </div>
        )
      )}

      <div className="bg-white rounded-xl p-3.5 border border-neutral-150 space-y-3.5 shadow-sm text-xs">
        {/* Row 1: Item Code & Status */}
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-neutral-100">
          <div>
            <span className="text-neutral-400 font-bold block text-[9px] uppercase tracking-wider">
              {language === "BM" ? "Kod Item Borang BE" : "Form BE Item code"}
            </span>
            <span className="bg-navy text-white px-2 py-0.5 rounded text-[10px] font-black inline-block mt-1 tracking-wide uppercase font-mono">
              {guideline.formItemCode}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 font-bold block text-[9px] uppercase tracking-wider">
              {language === "BM" ? "Nasihat Status Tuntutan" : "Claim Status Advice"}
            </span>
            <span
              className={`inline-block font-extrabold mt-1 text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(
                normalizedStatus
              )}`}
            >
              {getDisplayStatusText(normalizedStatus)}
            </span>
          </div>
        </div>

        {/* Row 2: Category & Confidence */}
        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-neutral-100">
          <div>
            <span className="text-neutral-400 font-bold block text-[9px] uppercase tracking-wider">
              {language === "BM" ? "Kategori Pelepasan" : "Relief Category"}
            </span>
            <span className="text-navy font-bold block mt-1 truncate">
              {localizedDisplayName}
            </span>
            <span className="text-[9px] text-neutral-500 font-semibold block bg-neutral-50 px-1 inline-block rounded border border-neutral-150 mt-0.5">
              {localizedEvidenceType}
            </span>
          </div>
          <div>
            <span className="text-neutral-400 font-bold block text-[9px] uppercase tracking-wider">
              {language === "BM" ? "Tahap Keyakinan" : "Confidence Level"}
            </span>
            <span
              className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-full border mt-1 ${
                displayConfidence === "High"
                  ? "bg-[#F1FBF9] text-teal-brand border-teal-brand/15"
                  : displayConfidence === "Low"
                  ? "bg-red-50 text-red-500 border-red-200/50"
                  : "bg-[#FFFDF5] text-amber-brand border-amber-brand/15"
              }`}
            >
              {language === "BM" ? `Keyakinan Tax5: ${getConfidenceText(displayConfidence)}` : `Tax5 Conf: ${displayConfidence}`}
            </span>
          </div>
        </div>

        {/* Dynamic Why Tax5 Suggested */}
        <div className="space-y-1">
          <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">
            {language === "BM" ? "Sebab dicadangkan:" : "Why suggested:"}
          </span>
          <p className="text-neutral-700 leading-relaxed font-sans text-xs">
            {localizedSuggestionWhy || localizedUserFacingNote}
          </p>
        </div>

        {/* Checklist for normal taxpayers */}
        <div className="space-y-2 pt-1">
          <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">
            {language === "BM" ? "Apa yang perlu disemak sebelum memfail:" : "What to check before filing:"}
          </span>
          <div className="bg-[#FAFBFB] rounded-xl border border-neutral-150 p-2.5 space-y-1.5">
            {localizedRequiredChecks.map((checkStr, idx) => {
              const isChecked = !!checkedChecks[`${code}-${idx}`];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className="flex items-start gap-2.5 cursor-pointer hover:bg-neutral-50 p-1.5 rounded-lg transition-colors select-none"
                >
                  <div
                    className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all mt-0.5 ${
                      isChecked
                        ? "bg-teal-brand border-teal-brand text-white"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    className={`leading-normal transition-all text-[11px] ${
                      isChecked ? "text-neutral-400 line-through font-normal" : "text-neutral-700 font-medium"
                    }`}
                  >
                    {checkStr}
                  </span>
                </div>
              );
            })}
            {localizedSuggestionCheck && (
              <div className="text-[10px] text-neutral-500 mt-1 pt-1.5 border-t border-dashed border-neutral-200">
                <strong>{language === "BM" ? "Konteks resit:" : "Receipt context:"}</strong> {localizedSuggestionCheck}
              </div>
            )}
            {allTicked && (
              <div className="flex items-center gap-1.5 text-[10.5px] text-[#008064] font-bold bg-[#E8F8F5] px-2 py-1 rounded-lg border border-teal-500/10 self-start animate-fadeIn mt-1.5 w-max">
                <Check className="w-3.5 h-3.5 text-[#008064] stroke-[3.5]" />
                <span>{language === "BM" ? "Senarai semak disemak" : "Checklist reviewed"}</span>
              </div>
            )}
          </div>
        </div>

        {/* SSPN Scanned Receipt Reminders & Quick Setup Activations */}
        {isSspnSection && (
          <div className="space-y-2 pt-1">
            {/* Action Statement Requirement Reminder */}
            <div className="bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#D97706]/15 flex items-start gap-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <Info className="w-3.5 h-3.5 text-[#D97706]/75 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-neutral-600 font-semibold leading-relaxed font-sans">
                {language === "BM" ? "Semak penyata SSPN anda dan kemas kini jumlah akhir jika perlu." : "Check your SSPN statement and update the final amount if needed."}
              </div>
            </div>

            {/* Quick Profile Turn-On Prompt if SSPN savings is disabled */}
            {isSspnDisabled && (
              <div className="bg-[#FAF8F5] px-3.5 py-2.5 rounded-xl border border-[#D97706]/20 space-y-1.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] border-dashed">
                <span className="text-[11px] text-navy font-bold leading-tight block">
                  {language === "BM" ? "Adakah anda menyimpan dalam SSPN untuk anak anda?" : "Do you save in SSPN for your child?"}
                </span>
                <p className="text-[10.5px] text-neutral-500 leading-normal font-sans font-semibold">
                  {language === "BM" ? "Tax5 mengesan resit SSPN tetapi simpanan pendidikan SSPN anda dimatikan dalam tetapan. Mengaktifkannya akan menunjukkan senarai semak bukti dan menjejak tuntutan ini dengan betul." : "Tax5 detected an SSPN receipt but your SSPN education savings is turned off in setup. Turning it on will show proof checklists and track this claim correctly."}
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleTurnOnSSPN}
                    className="px-2.5 py-1 text-[10px] font-bold text-white bg-teal-brand hover:bg-teal-brand-dark rounded-lg cursor-pointer transition-colors shadow-5xs"
                  >
                    {language === "BM" ? "Ya, aktifkan simpanan SSPN" : "Yes, turn on SSPN savings"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Claim Limit */}
        {localizedClaimLimit && (
          <div className="space-y-1 bg-teal-brand/5 border border-teal-brand/10 p-2.5 rounded-xl">
            <span className="text-[9.5px] text-teal-brand font-extrabold uppercase tracking-widest block">
              {language === "BM" ? "Had Tuntutan (YA 2025):" : "Claim Limit (YA 2025):"}
            </span>
            <span className="text-navy font-bold text-xs font-sans">
              {localizedClaimLimit}
            </span>
          </div>
        )}

        {/* Warning Notes / Check Again conditions */}
        {normalizedStatus === "Needs Review" && localizedCheckAgainConditions && (
          <div className="bg-[#FFFDF5] p-2.5 rounded-xl border border-amber-brand/10 space-y-1">
            <span className="text-[9px] text-[#D97706] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{language === "BM" ? "Amaran & Nota Semakan:" : "Warning & Review Notes:"}</span>
            </span>
            <p className="text-neutral-700 leading-normal font-sans text-[11px]">
              {localizedCheckAgainConditions}
            </p>
          </div>
        )}

        {/* Source Note */}
        <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 pt-1">
          <Book className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="font-semibold">
            {language === "BM"
              ? `Sumber: Nota Penerangan HASiL/LHDN Borang BE 2025${guideline.formItemCode ? `, Item ${guideline.formItemCode}` : ""}`
              : `Source: HASiL/LHDN Form BE 2025 Explanatory Notes${guideline.formItemCode ? `, Item ${guideline.formItemCode}` : ""}`}
          </span>
          {guideline.sourceNote && (
            <span className="text-[8px] text-neutral-350 shrink-0">({guideline.sourceNote})</span>
          )}
        </div>

        {/* Disclaimer */}
        <div className="h-px bg-neutral-150 w-full my-2"></div>
        <div className="text-[9px] text-neutral-450 leading-normal italic font-sans">
          ⚠️ <strong>{language === "BM" ? "Penafian:" : "Disclaimer:"}</strong> {language === "BM" ? "Tax5 hanyalah alat sokongan pra-pemfailan sahaja. Kelayakan tuntutan akhir mesti disahkan menggunakan maklumat rasmi LHDN/MyTax." : "Tax5 is a pre-filing support tool only. Final claim eligibility must be verified using official LHDN/MyTax information."}
        </div>
      </div>
    </div>
  );
};
