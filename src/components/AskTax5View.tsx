import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Sparkles, HelpCircle, ArrowLeft, ChevronRight, Check } from "lucide-react";
import { ClaimCategory, CATEGORY_LIMITS } from "../types";
import tax5Logo from "../assets/tax5-logo.png";
import { taxKnowledgeBase } from "../data/taxKnowledgeBase";
import { useLanguage } from "../context/LanguageContext";

interface AskTax5ViewProps {
  onBackToHome: () => void;
  userId?: string;
  isDemo?: boolean;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export const AskTax5View: React.FC<AskTax5ViewProps> = ({ onBackToHome, userId, isDemo }) => {
  const { t, language } = useLanguage();
  const storageKey = isDemo
    ? "tax5_chat_history_demo"
    : userId
    ? `tax5_chat_history_${userId}`
    : "tax5_chat_history_guest";

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error reading initial chat history", e);
    }
    return [];
  });

  // Ensure there is always at least one message (the initial greeting) in the correct language
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "initial",
          sender: "bot",
          text: language === "BM"
            ? "Hai! Saya Tax5, pembantu cukai pra-pemfailan anda. Tanya saya soalan tentang kategori pelepasan cukai Borang BE, had maksimum, atau garis panduan kelayakan di Malaysia."
            : "Hi there! I'm Tax5, your pre-filing tax assistant. Ask me questions about Form BE tax relief categories, maximum limits, or eligibility guidelines in Malaysia.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
    }
  }, [language, messages.length]);

  // Keep saved messages in sync with localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.error("Error saving chat history", e);
      }
    }
  }, [messages, storageKey]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleClearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error("Error clearing chat history", e);
    }
  };

  const helpTopics = [
    {
      label: language === "BM" ? "Had Gaya Hidup" : "Lifestyle limit",
      question: language === "BM" ? "Berapakah had pelepasan untuk Gaya Hidup?" : "What is the relief limit for Lifestyle?"
    },
    {
      label: language === "BM" ? "Tuntutan sukan" : "Sports claims",
      question: language === "BM" ? "Bolehkah saya menuntut peralatan sukan di bawah Gaya Hidup?" : "Can I claim sports equipment under Lifestyle?"
    },
    {
      label: language === "BM" ? "Saringan kesihatan" : "Health screening",
      question: language === "BM" ? "Adakah saringan kesihatan boleh ditolak di bawah Perubatan?" : "Is health screening deductible under Medical?"
    },
    {
      label: language === "BM" ? "Yuran pendidikan" : "Education fees",
      question: language === "BM" ? "Berapakah yang boleh saya tuntut untuk pendidikan diri?" : "How much can I claim for self-education?"
    }
  ];

  // Helper taxonomy classifier to ensure queries remain within Malaysian Form BE and tax preparation scope
  const isTaxRelated = (query: string): boolean => {
    const q = query.toLowerCase().trim();
    
    // Handled onboarding / app steps keywords (Bilingual)
    if (
      q.includes("after sign up") ||
      q.includes("should do what") ||
      q.includes("what should i do") ||
      q.includes("how to start") ||
      q.includes("where do i start") ||
      q.includes("how to use") ||
      q.includes("next step") ||
      q.includes("first step") ||
      q.includes("onboarding") ||
      q.includes("demo mode") ||
      q.includes("profile") ||
      q.includes("receipt") ||
      q.includes("summary") ||
      q.includes("sign up") ||
      // BM Equivalents
      q.includes("selepas daftar") ||
      q.includes("patut buat apa") ||
      q.includes("bagaimana hendak mula") ||
      q.includes("langkah pertama") ||
      q.includes("langkah ke depan") ||
      q.includes("uji") ||
      q.includes("mod demo") ||
      q.includes("profil") ||
      q.includes("penyediaan") ||
      q.includes("resit") ||
      q.includes("ringkasan") ||
      q.includes("daftar masuk") ||
      q.includes("daftar")
    ) {
      return true;
    }

    const taxKeywords = [
      "tax", "relief", "claim", "deduct", "eligib", "qualif", "lhdn", "mytax", "be form", "form be", "formbe",
      "lifestyle", "book", "journal", "read", "computer", "laptop", "smartphone", "tablet", "device", "internet",
      "broadband", "wifi", "sports", "sport", "gym", "exercise", "equipment", "gear", "race", "active", "fitness",
      "education", "course", "fees", "university", "college", "tuition", "degree", "master", "phd", "study",
      "health", "medical", "screening", "examination", "checkup", "check-up", "doctor", "specialist", "vaccin",
      "disease", "dental", "dentist", "spectacles", "glasses", "insurance", "annuity", "prs", "retirement",
      "receipt", "evidence", "proof", "audit", "store", "keep", "record", "invoice", "voucher", "payment",
      "epf", "kwsp", "socso", "perkeso", "eis", "sip", "sspn", "child", "spouse", "parent", "dependent",
      "salary", "income", "payroll", "ea form", "cp58", "pcb", "mtd", "refund", "bracket", "declare", "filing",
      "pre-filing", "my tax", "malaysia", "irb", "hasil", "revenue", "allowance", "assessment", "individual",
      "husband", "wife", "married", "joint", "separate", "rebate",
      // BM Equivalents
      "cukai", "pelepasan", "tuntut", "tolak", "kelayakan", "layak", "resit", "buku", "jurnal", "baca", "komputer",
      "telefon pintar", "tablet", "peranti", "sukan", "gim", "keahlian", "senaman", "alatan", "yuran", "pendidikan",
      "universiti", "kolej", "pengajian", "sarjana", "doktor", "perubatan", "kesihatan", "saringan", "pemeriksaan",
      "doktor", "vaksin", "penyakit", "gigi", "cermin mata", "insurans", "persaraan", "bukti", "audit", "simpan",
      "rekod", "invois", "baucar", "bayaran", "kwsp", "perkeso", "anak", "pasangan", "suami", "isteri", "ibu bapa",
      "gaji", "pendapatan", "borang be", "borangbe", "isytihar", "pemfailan", "taksiran", "pembayar", "rebate"
    ];
    return taxKeywords.some(keyword => q.includes(keyword));
  };

  // Keyword matching and direct scoring algorithm from LHDN BE 2025 Explanatory Notes PDF
  const findLocalAnswer = (query: string): { answer: string; sourceLabel: string } | null => {
    const lowerQuery = query.toLowerCase().trim();

    // 1. Summary Questions
    if (
      lowerQuery.includes("what is summary") ||
      lowerQuery.includes("summary for") ||
      lowerQuery.includes("summary do") ||
      lowerQuery.includes("why need summary") ||
      lowerQuery.includes("form be summary") ||
      lowerQuery.includes("tax summary") ||
      lowerQuery.includes("summary") ||
      lowerQuery.includes("ringkasan") ||
      lowerQuery.includes("tujuan ringkasan") ||
      lowerQuery.includes("apa itu ringkasan")
    ) {
      return {
        answer: language === "BM"
          ? "Ringkasan menunjukkan draf gaya Borang BE anda berdasarkan resit dan butiran yang disimpan dalam Tax5. Ia membantu anda menyemak jumlah yang boleh dituntut, resit yang memerlukan semakan, item yang tidak layak, dan sebarang butiran yang hilang sebelum menyediakan serahan MyTax/e-Filing sebenar anda."
          : "Summary shows your Form BE-style draft based on the receipts and details saved in Tax5. It helps you review claimable totals, receipts that need review, non-eligible items, and any missing details before preparing your actual MyTax/e-Filing submission.",
        sourceLabel: language === "BM" ? "Panduan Ringkasan" : "Summary Guide"
      };
    }

    // 2. Profile Setup Guide
    if (
      lowerQuery.includes("profile setup") || 
      lowerQuery.includes("penyediaan profil") ||
      lowerQuery.includes("tetapan profil") ||
      (lowerQuery.includes("profile") && (lowerQuery.includes("set") || lowerQuery.includes("setup") || lowerQuery.includes("config"))) ||
      (lowerQuery.includes("profil") && (lowerQuery.includes("atur") || lowerQuery.includes("sedia") || lowerQuery.includes("tetap")))
    ) {
      return {
        answer: language === "BM"
          ? "Penyediaan Profil ialah tempat anda memasukkan butiran pemfailan anda seperti status perkahwinan dan sebarang kelayakan pelepasan pasangan atau anak. Ini membantu Tax5 menyesuaikan pelepasan dan had yang boleh dituntut pada papan pemuka Ringkasan anda mengikut tanggungan sebenar Borang BE anda."
          : "Profile Setup is where you enter your filing details like marital status and any spouse or child relief eligibility. This helps Tax5 customize the claimable reliefs and limits on your Summary dashboard according to your actual Form BE dependencies.",
        sourceLabel: language === "BM" ? "Panduan Penyediaan Profil" : "Profile Setup Guide"
      };
    }

    // 3. Receipt Scanning / Capture Guide
    if (
      (lowerQuery.includes("receipt") || lowerQuery.includes("resit")) && 
      (lowerQuery.includes("how") || lowerQuery.includes("add") || lowerQuery.includes("upload") || lowerQuery.includes("scan") || lowerQuery.includes("photo") || lowerQuery.includes("picture") || lowerQuery.includes("bagaimana") || lowerQuery.includes("tambah") || lowerQuery.includes("muat naik") || lowerQuery.includes("imbas") || lowerQuery.includes("gambar") || lowerQuery.includes("foto"))
    ) {
      return {
        answer: language === "BM"
          ? "Anda boleh menambah resit dalam Tax5 dengan mengambil gambar, memuat naik fail, atau menaip butiran secara manual. Sebaik sahaja ditambah, sistem kami akan mengkategorikan resit secara automatik, menyemak sama ada jumlahnya melebihi had LHDN untuk kategori tersebut, dan menambahkannya ke ringkasan cukai anda."
          : "You can add receipts in Tax5 by taking a picture, uploading a file, or typing the details manually. Once added, our system automatically categorizes the receipt, checks if the amount exceeds the LHDN limit for that category, and adds it to your tax summary.",
        sourceLabel: language === "BM" ? "Panduan Tangkapan Resit" : "Receipt Capture Guide"
      };
    }

    // 4. Onboarding / What to do after sign-up
    if (
      lowerQuery.includes("sign up") ||
      lowerQuery.includes("signup") ||
      lowerQuery.includes("after sign up") ||
      lowerQuery.includes("start") ||
      lowerQuery.includes("first step") ||
      lowerQuery.includes("how to use app") ||
      lowerQuery.includes("where to begin") ||
      lowerQuery.includes("next step") ||
      lowerQuery.includes("daftar") ||
      lowerQuery.includes("mula") ||
      lowerQuery.includes("langkah pertama") ||
      lowerQuery.includes("buat apa") ||
      lowerQuery.includes("bagaimana guna")
    ) {
      return {
        answer: language === "BM"
          ? "Selepas mendaftar, mulakan dengan Penyediaan Profil supaya Tax5 dapat memahami pelepasan yang mungkin terpakai kepada anda. Kemudian tambah resit dengan mengambil foto, memuat naik imej, atau memasukkan butiran secara manual. Selepas resit dibaca, semak kategori dan status tuntutan, simpan resit, dan semak draf Borang BE anda di Ringkasan. Jika anda mempunyai butiran EA/EC anda, tambahkannya kemudian untuk draf yang lebih lengkap."
          : "After signing up, start with Profile Setup so Tax5 can understand which reliefs may apply to you. Then add a receipt by taking a photo, uploading an image, or entering the details manually. After the receipt is read, check the category and claim status, save the receipt, and review your Form BE draft in Summary. If you have your EA/EC details, add them later for a more complete draft.",
        sourceLabel: language === "BM" ? "Langkah Aplikasi" : "App Steps"
      };
    }

    // 5. Demo Mode Guide
    if (
      lowerQuery.includes("demo mode") || 
      lowerQuery.includes("demo user") || 
      lowerQuery.includes("test mode") ||
      lowerQuery.includes("mod demo") ||
      lowerQuery.includes("pengguna demo")
    ) {
      return {
        answer: language === "BM"
          ? "Mod Demo mengisi beberapa data ujian supaya anda boleh meneroka Tax5 tanpa memerlukan dokumen sebenar. Anda boleh mencuba menambah resit demo, melihat ringkasan draf, dan melihat bagaimana tuntutan dan had bertindak balas terhadap tetapan profil yang berbeza."
          : "Demo Mode populates some test data so you can explore Tax5 without needing real documents. You can try adding a demo receipt, view mock summaries, and see how claims and limits react to different profile settings.",
        sourceLabel: language === "BM" ? "Panduan Mod Demo" : "Demo Mode Guide"
      };
    }

    // Direct mappings to local FAQ entries (Bilingual support for popular quick questions)
    if (lowerQuery === "what is the relief limit for lifestyle?" || lowerQuery === "berapakah had pelepasan untuk gaya hidup?") {
      const entry = taxKnowledgeBase.find(e => e.id === "lifestyle-limit");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }
    if (lowerQuery === "can i claim sports equipment under lifestyle?" || lowerQuery === "bolehkah saya menuntut peralatan sukan di bawah gaya hidup?") {
      const entry = taxKnowledgeBase.find(e => e.id === "sports-lifestyle");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }
    if (lowerQuery === "is health screening deductible under medical?" || lowerQuery === "adakah saringan kesihatan boleh ditolak di bawah perubatan?") {
      const entry = taxKnowledgeBase.find(e => e.id === "health-screening");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }
    if (lowerQuery === "how much can i claim for self-education?" || lowerQuery === "berapakah yang boleh saya tuntut untuk pendidikan diri?") {
      const entry = taxKnowledgeBase.find(e => e.id === "education-relief");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }

    // 1. Direct explicit phrases or specific categories match
    if ((lowerQuery.includes("lifestyle") || lowerQuery.includes("gaya hidup")) && (lowerQuery.includes("equipment") || lowerQuery.includes("sport") || lowerQuery.includes("gym") || lowerQuery.includes("activities") || lowerQuery.includes("sukan") || lowerQuery.includes("alatan") || lowerQuery.includes("aktiviti"))) {
      const entry = taxKnowledgeBase.find(e => e.id === "sports-lifestyle");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }
    if ((lowerQuery.includes("lifestyle") || lowerQuery.includes("gaya hidup")) && (lowerQuery.includes("limit") || lowerQuery.includes("max") || lowerQuery.includes("how much") || lowerQuery.includes("cap") || lowerQuery.includes("f12") || lowerQuery.includes("g9") || lowerQuery.includes("had") || lowerQuery.includes("maksimum") || lowerQuery.includes("berapa"))) {
      const entry = taxKnowledgeBase.find(e => e.id === "lifestyle-limit");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }
    if (lowerQuery.includes("screening") || lowerQuery.includes("examination") || lowerQuery.includes("checkup") || lowerQuery.includes("check-up") || lowerQuery.includes("disease detection") || lowerQuery.includes("blood test") || lowerQuery.includes("mammogram") || lowerQuery.includes("saringan") || lowerQuery.includes("pemeriksaan") || lowerQuery.includes("kesihatan") || lowerQuery.includes("darah")) {
      const entry = taxKnowledgeBase.find(e => e.id === "health-screening");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }
    if (lowerQuery.includes("education") || lowerQuery.includes("self-education") || lowerQuery.includes("study") || lowerQuery.includes("course") || lowerQuery.includes("fees") || lowerQuery.includes("university") || lowerQuery.includes("pendidikan") || lowerQuery.includes("belajar") || lowerQuery.includes("yuran") || lowerQuery.includes("ijazah") || lowerQuery.includes("sarjana")) {
      const entry = taxKnowledgeBase.find(e => e.id === "education-relief");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }
    if ((lowerQuery.includes("medical") || lowerQuery.includes("perubatan")) && (lowerQuery.includes("limit") || lowerQuery.includes("max") || lowerQuery.includes("how much") || lowerQuery.includes("cap") || lowerQuery.includes("serious") || lowerQuery.includes("had") || lowerQuery.includes("maksimum") || lowerQuery.includes("penyakit"))) {
      const entry = taxKnowledgeBase.find(e => e.id === "medical-limit");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }
    if (lowerQuery.includes("food") || lowerQuery.includes("meal") || lowerQuery.includes("dining") || lowerQuery.includes("groceries") || lowerQuery.includes("restaurant") || lowerQuery.includes("cafe") || lowerQuery.includes("supermarket") || lowerQuery.includes("eating") || lowerQuery.includes("lunch") || lowerQuery.includes("dinner") || lowerQuery.includes("grocery") || lowerQuery.includes("makanan") || lowerQuery.includes("makan") || lowerQuery.includes("kedai runcit") || lowerQuery.includes("pasar raya") || lowerQuery.includes("restoran")) {
      const entry = taxKnowledgeBase.find(e => e.id === "food-general-spending");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }
    if (lowerQuery.includes("evidence") || lowerQuery.includes("receipt") || lowerQuery.includes("proof") || lowerQuery.includes("invoice") || lowerQuery.includes("documentation") || lowerQuery.includes("bukti") || lowerQuery.includes("resit") || lowerQuery.includes("invois") || lowerQuery.includes("dokumen")) {
      const entry = taxKnowledgeBase.find(e => e.id === "receipt-evidence");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }
    if (lowerQuery.includes("keep") || lowerQuery.includes("record") || lowerQuery.includes("years") || lowerQuery.includes("storage") || lowerQuery.includes("saving") || lowerQuery.includes("storing") || lowerQuery.includes("simpan") || lowerQuery.includes("tahun") || lowerQuery.includes("rekod") || lowerQuery.includes("pelihara")) {
      const entry = taxKnowledgeBase.find(e => e.id === "record-keeping");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }
    if (lowerQuery.includes("purpose") || lowerQuery.includes("form be") || lowerQuery.includes("what is be") || lowerQuery.includes("salaried") || lowerQuery.includes("wage") || lowerQuery.includes("tujuan") || lowerQuery.includes("apa itu be") || lowerQuery.includes("pekerja")) {
      const entry = taxKnowledgeBase.find(e => e.id === "form-be-purpose");
      if (entry) return { answer: language === "BM" ? entry.answerBM || entry.answer : entry.answer, sourceLabel: language === "BM" ? entry.sourceLabelBM || entry.sourceLabel : entry.sourceLabel };
    }

    // 2. Keyword fallback scoring matching
    let bestEntry: typeof taxKnowledgeBase[number] | null = null;
    let maxScore = 0;

    for (const entry of taxKnowledgeBase) {
      let score = 0;
      for (const keyword of entry.keywords) {
        if (lowerQuery.includes(keyword)) {
          // Weighted scoring: longer matching keywords are worth more points
          score += keyword.length;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestEntry = entry;
      }
    }

    // Return the entry if there's any matching keyword score
    if (bestEntry && maxScore >= 3) {
      return {
        answer: language === "BM" ? bestEntry.answerBM || bestEntry.answer : bestEntry.answer,
        sourceLabel: language === "BM" ? bestEntry.sourceLabelBM || bestEntry.sourceLabel : bestEntry.sourceLabel
      };
    }

    return null;
  };

  // Function to manage and enforce token protect limits
  const checkAndIncrementGeminiLimit = (): boolean => {
    try {
      const today = new Date().toISOString().split("T")[0]; // Daily granularity
      const limitKey = isDemo 
        ? "tax5_custom_chat_count_demo" 
        : `tax5_custom_chat_count_${userId || "guest"}_${today}`;
      
      const currentCountStr = localStorage.getItem(limitKey);
      const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
      const maxLimit = isDemo ? 5 : 10;

      if (currentCount >= maxLimit) {
        return false; // Limit reached
      }

      localStorage.setItem(limitKey, (currentCount + 1).toString());
      return true; // Go ahead
    } catch (e) {
      console.error("Error managing custom chat limits", e);
      return true; // Graceful bypass in case of persistent storage hiccups
    }
  };

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Look for matching local answer first to prioritize token protection
    const matchedLocal = findLocalAnswer(textToSend);

    if (matchedLocal) {
      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: "bot",
          text: matchedLocal.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, botMsg]);
      }, 350);
    } else {
      // Out-of-scope taxonomy guard: restrict external Gemini queries to relevant Malaysian Form BE domain
      if (!isTaxRelated(textToSend)) {
        setTimeout(() => {
          const botMsg: ChatMessage = {
            id: `msg-${Date.now()}-bot`,
            sender: "bot",
            text: language === "BM"
              ? "Saya boleh membantu dengan persediaan awal Borang BE Malaysia, kategori pelepasan cukai, bukti resit, dan panduan kelayakan tuntutan. Cuba tanya tentang kategori tuntutan atau resit."
              : "I can help with Malaysian Form BE pre-filing, tax relief categories, receipt proof, and claim eligibility guidance. Try asking about a claim category or receipt.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, botMsg]);
        }, 350);
        return;
      }

      // Enforcement of Token protection ceilings
      const isAllowed = checkAndIncrementGeminiLimit();

      if (!isAllowed) {
        setTimeout(() => {
          const limitMsg = isDemo
            ? (language === "BM"
                ? "Dalam mod demo, anda boleh bertanya sehingga 5 soalan tersuai. Sila ketik mana-mana soalan pantas atau butang had popular di atas untuk jawapan segera tanpa had!"
                : "In demo mode, you can ask up to 5 custom questions. Please tap any of our quick questions or popular limit buttons above for unlimited instant answers!")
            : (language === "BM"
                ? "Anda telah mencapai had harian 10 soalan pembantu cukai yang dijana secara tersuai. Sila gunakan had popular atau soalan pantas di atas untuk mendapatkan panduan segera!"
                : "You've reached your daily limit of 10 auto-generated custom tax helper questions. Please utilize the popular limits or quick questions above to receive instant guidance!");
          
          const botMsg: ChatMessage = {
            id: `msg-${Date.now()}-bot`,
            sender: "bot",
            text: limitMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, botMsg]);
        }, 400);
        return;
      }

      // Fallback: request custom answer from Gemini
      setIsTyping(true);
      fetch("/api/ask-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, language }),
      })
        .then((res) => res.json())
        .then((data) => {
          // If server returned a local prep mode placeholder, replace with requested fallback
          const defaultFallback = language === "BM"
            ? "Saya tidak dapat memberikan jawapan yang jelas buat masa ini. Anda boleh bertanya tentang resit, kategori tuntutan, Penyediaan Profil, Ringkasan, atau persediaan draf Borang BE."
            : "I could not answer that clearly right now. You can ask about receipts, claim categories, Profile Setup, Summary, or Form BE draft preparation.";
          const responseText = (data.text && data.text.includes("local preparation mode"))
            ? defaultFallback
            : (data.text || defaultFallback);

          const botMsg: ChatMessage = {
            id: `msg-${Date.now()}-bot`,
            sender: "bot",
            text: responseText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, botMsg]);
        })
        .catch((err) => {
          console.error("Gemini chatbot call failing:", err);
          const defaultFallback = language === "BM"
            ? "Saya tidak dapat memberikan jawapan yang jelas buat masa ini. Anda boleh bertanya tentang resit, kategori tuntutan, Penyediaan Profil, Ringkasan, atau persediaan draf Borang BE."
            : "I could not answer that clearly right now. You can ask about receipts, claim categories, Profile Setup, Summary, or Form BE draft preparation.";
          const fallbackBotMsg: ChatMessage = {
            id: `msg-${Date.now()}-bot`,
            sender: "bot",
            text: defaultFallback,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, fallbackBotMsg]);
        })
        .finally(() => {
          setIsTyping(false);
        });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F7F9FA] h-full overflow-hidden relative">
      {/* Soft circular low-opacity decorative gradient background blobs (Lightest version for Ask Tax5) */}
      <div className="absolute top-[-5%] left-[-15%] w-[250px] h-[250px] rounded-full bg-[#E5F5EF] blur-[95px] opacity-25 pointer-events-none z-0"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[220px] h-[220px] rounded-full bg-[#FFFBE3] blur-[85px] opacity-25 pointer-events-none z-0"></div>

      {/* Top compact header using robust 3-column grid for absolute centering */}
      <div className="bg-white border-b border-neutral-100 px-4 py-2.5 shrink-0 grid grid-cols-3 items-center z-10">
        <div className="flex justify-start"></div>
        <div className="text-center">
          <span className="text-[12.5px] font-bold text-navy tracking-wide font-heading">
            {language === "BM" ? "Tanya Tax5" : "Ask Tax5"}
          </span>
        </div>
        <div className="flex justify-end">
          {messages.length > 1 ? (
            <button
              onClick={handleClearChat}
              className="text-[10px] font-bold text-[#A94A44] hover:text-[#8D342E] transition-colors cursor-pointer shrink-0"
            >
              {t("common", "clear")}
            </button>
          ) : (
            <div className="w-6 h-1 bg-transparent"></div>
          )}
        </div>
      </div>

      {/* Main chat display body */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
      >
        {/* Compact Greeting Box (Prevents empty chatbot state in a clean, non-cluttered card) */}
        {messages.length === 1 && (
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/50 shadow-3xs space-y-3.5 animate-fadeIn">
            <h3 className="text-[10px] font-bold text-navy uppercase tracking-wider font-heading flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-brand" />
              <span>{language === "BM" ? "Topik bantuan pantas" : "Quick help topics"}</span>
            </h3>
            <p className="text-[10.5px] text-neutral-500 leading-normal font-semibold">
              {language === "BM" ? "Dapatkan panduan pantas mengenai kategori pelepasan cukai Malaysia, had, dan bukti resit." : "Get quick guidance about Malaysian tax relief categories, limits, and receipt evidence."}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {helpTopics.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(topic.question)}
                  className="bg-[#F3FBF8] hover:bg-[#EAF7F4] text-teal-brand text-[9.5px] font-bold p-2.5 rounded-xl border border-teal-500/10 transition-all text-left cursor-pointer active:scale-[0.98] flex items-center justify-between"
                >
                  <span className="truncate pr-1">{topic.label}</span>
                  <ChevronRight className="w-3 h-3 text-teal-brand/50 shrink-0" />
                </button>
              ))}
            </div>

            {/* Popular limits section with soft, gentle style matching Home page */}
            <div className="pt-3 border-t border-neutral-100 mt-3 space-y-1.5">
              <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest">{language === "BM" ? "Had popular" : "Popular limits"}</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSendMessage("What is the relief limit for Lifestyle?")}
                  className="bg-[#FBFDFD] hover:bg-[#F2FAF6] border border-[#E1EDE8]/80 p-2.5 rounded-xl text-left transition-all cursor-pointer hover:border-[#00A884]/25 active:scale-95"
                >
                  <span className="block text-[7.5px] font-bold text-neutral-400 truncate uppercase tracking-wider">{language === "BM" ? "Gaya Hidup" : "Lifestyle"}</span>
                  <span className="block text-[10px] font-bold text-neutral-600 mt-0.5 font-mono">RM 2,500</span>
                </button>
                <button
                  onClick={() => handleSendMessage("What is the Medical limit?")}
                  className="bg-[#FBFDFD] hover:bg-[#F2FAF6] border border-[#E1EDE8]/80 p-2.5 rounded-xl text-left transition-all cursor-pointer hover:border-[#00A884]/25 active:scale-95"
                >
                  <span className="block text-[7.5px] font-bold text-neutral-400 truncate uppercase tracking-wider">{language === "BM" ? "Perubatan" : "Medical"}</span>
                  <span className="block text-[10px] font-bold text-neutral-600 mt-0.5 font-mono">RM 10,000</span>
                </button>
                <button
                  onClick={() => handleSendMessage("What is the self-education limit?")}
                  className="bg-[#FBFDFD] hover:bg-[#F2FAF6] border border-[#E1EDE8]/80 p-2.5 rounded-xl text-left transition-all cursor-pointer hover:border-[#00A884]/25 active:scale-95"
                >
                  <span className="block text-[7.5px] font-bold text-neutral-400 truncate uppercase tracking-wider">{language === "BM" ? "Pendidikan" : "Education"}</span>
                  <span className="block text-[10px] font-bold text-neutral-600 mt-0.5 font-mono">RM 7,000</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m) => {
            const isBot = m.sender === "bot";
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 max-w-[90%] ${
                  !isBot ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {isBot ? (
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-neutral-200/50 shadow-3xs">
                    <div className="w-[23px] h-[23px] overflow-hidden relative flex items-center justify-start">
                      <img 
                        src={tax5Logo} 
                        className="absolute left-0 top-0 h-full max-w-none object-contain" 
                        alt="Tax5 Avatar" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center shrink-0 font-bold text-[9px] shadow-3xs uppercase">
                    ME
                  </div>
                )}

                <div className="space-y-0.5">
                  <div
                    className={`p-2.5 px-3 rounded-2xl text-[11px] leading-relaxed ${
                      !isBot
                        ? "bg-navy text-white rounded-tr-none shadow-3xs"
                        : "bg-white border border-neutral-200/55 text-navy rounded-tl-none shadow-3xs"
                    }`}
                  >
                    {((m.id === "initial") 
                      ? (language === "BM" ? "Hai di sana! Saya Tax5, pembantu cukai pra-pemfailan anda. Tanya saya soalan tentang kategori pelepasan cukai Borang BE, had maksimum, atau garis panduan kelayakan di Malaysia." : m.text)
                      : m.text).split("\n").map((para, i) => (
                      <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                        {para}
                      </p>
                    ))}
                  </div>
                  <span className={`text-[8.5px] text-neutral-400 block px-1 ${!isBot ? "text-right" : "text-left"}`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing state dynamic indicator */}
          {isTyping && (
            <div className="flex items-start gap-2.5 mr-auto">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-neutral-200/50 shadow-3xs animate-pulse">
                <div className="w-[23px] h-[23px] overflow-hidden relative flex items-center justify-start">
                  <img 
                    src={tax5Logo} 
                    className="absolute left-0 top-0 h-full max-w-none object-contain" 
                    alt="Tax5 Avatar" 
                  />
                </div>
              </div>
              <div className="bg-white border border-neutral-200/55 rounded-2xl rounded-tl-none p-3 shadow-3xs flex items-center gap-1">
                <span className="w-1.2 h-1.2 bg-neutral-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.2 h-1.2 bg-neutral-400 rounded-full animate-bounce delay-200"></span>
                <span className="w-1.2 h-1.2 bg-neutral-400 rounded-full animate-bounce delay-300"></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested question chips visible before the user types and when chat has message history */}
      {messages.length > 1 && inputText.trim() === "" && (
        <div className="bg-white px-4 py-2.5 shrink-0 border-t border-neutral-100 space-y-1.5 animate-fadeIn">
          <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest">
            {language === "BM" ? "Topik bantuan pantas" : "Quick help topics"}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {helpTopics.map((topic, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(topic.question)}
                className="bg-[#F3FBF8] hover:bg-[#EAF7F4] text-teal-brand text-[9.5px] font-bold p-2.5 rounded-xl border border-teal-500/10 transition-all text-left cursor-pointer active:scale-[0.98] flex items-center justify-between"
              >
                <span className="truncate pr-1">{topic.label}</span>
                <ChevronRight className="w-3 h-3 text-teal-brand/50 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message input field bar with clean, rounded-full input bar */}
      <div className="bg-white border-t border-neutral-150 p-3 shrink-0 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage(inputText);
            }
          }}
          placeholder={language === "BM" ? "Taip kategori pelepasan atau soalan..." : "Type a relief category or question..."}
          className="flex-1 bg-[#FAFBFB] border border-neutral-250 rounded-full h-10 px-4 text-xs text-neutral-850 placeholder-neutral-400 focus:outline-none focus:bg-white focus:border-teal-brand transition-all"
        />
        <button
          onClick={() => handleSendMessage(inputText)}
          className="w-10 h-10 rounded-full bg-teal-brand hover:bg-[#009170] text-white flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-sm hover:indigo-glow active:scale-95"
        >
          <Send className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
