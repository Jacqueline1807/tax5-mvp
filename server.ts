import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dns from "dns";

dotenv.config();

// Fix Node.js fetch ipv4/ipv6 dual stack connection timeout issues in Docker
dns.setDefaultResultOrder("ipv4first");

// Detailed definitions of G1 to G22 matching LHDN Form BE 2025 Explanatory Notes
interface TaxItemDef {
  code: string;
  displayName: string;
  category: "Lifestyle" | "Medical" | "Education" | "Sports" | "Insurance" | "Other";
  evidenceType: "Receipt-based" | "Profile-based" | "Payment-record-based" | string;
  defaultStatus: "Claimable" | "Check Again" | "Non-claimable";
  reason: string;
  userNote: string;
}

const TAX5_GUIDE_ITEMS: Record<string, TaxItemDef> = {
  G1: {
    code: "G1",
    displayName: "Personal & Dependent Relief",
    category: "Other",
    evidenceType: "Profile-based",
    defaultStatus: "Claimable",
    reason: "This is the automatic RM9,000 personal relief. Applied automatically to all resident individuals.",
    userNote: "You get this RM9,000 relief automatically for yourself and your dependents."
  },
  G2: {
    code: "G2",
    displayName: "Parents' Medical & Carer Expenses",
    category: "Medical",
    evidenceType: "Receipt-based",
    defaultStatus: "Check Again",
    reason: "This may be Medical, but it needs checking because medical claims for parents require certified bills or registered carer documents.",
    userNote: "May be claimable for medical, dental, special needs, or carer expenses for resident parents or grandparents. Please check supporting documents before filing."
  },
  G3: {
    code: "G3",
    displayName: "Basic Supporting Equipment",
    category: "Medical",
    evidenceType: "Receipt-based",
    defaultStatus: "Check Again",
    reason: "Supporting equipment for disabled family members requires verifying that the user/dependent is officially registered with JKM/DSW.",
    userNote: "May be claimable for basic supporting equipment for a registered disabled self, spouse, child, or parent."
  },
  G4: {
    code: "G4",
    displayName: "Disabled Individual Relief",
    category: "Other",
    evidenceType: "Profile-based",
    defaultStatus: "Check Again",
    reason: "Extra static relief for certified disabled individuals. Please ensure JKM registration is active.",
    userNote: "Extra relief may apply if you are officially certified as a disabled individual."
  },
  G5: {
    code: "G5",
    displayName: "Self-Education Fees",
    category: "Education",
    evidenceType: "Receipt-based",
    defaultStatus: "Check Again",
    reason: "Self-education course fees need to be verified against LHDN's list of recognized institutions and eligible courses of study.",
    userNote: "May be claimable for your own education fees, but course and institution eligibility should be checked."
  },
  G6: {
    code: "G6",
    displayName: "Serious Diseases & Fertility Treatment",
    category: "Medical",
    evidenceType: "Receipt-based",
    defaultStatus: "Check Again",
    reason: "Expenses for serious diseases require official written certification by a registered medical practitioner (MMC-registered).",
    userNote: "May be claimable under the medical relief group. Please check medical certification and supporting documents before filing."
  },
  G7: {
    code: "G7",
    displayName: "Health Exams & Medical Devices",
    category: "Medical",
    evidenceType: "Receipt-based",
    defaultStatus: "Check Again",
    reason: "Medical examination (capped RM1,000) and self-testing devices are claimable but require receipts from registered clinical labs/pharmacies.",
    userNote: "May be claimable for medical examination, disease detection tests, self-testing devices, or mental health consultation. Please verify details."
  },
  G8: {
    code: "G8",
    displayName: "Learning Disability Support for Child",
    category: "Medical",
    evidenceType: "Receipt-based",
    defaultStatus: "Check Again",
    reason: "Early intervention treatment for learning disabilities (ADHD, Down Syndrome, Autism) is limited to practitioners registered under AHPA/MMC.",
    userNote: "May be claimable for diagnosis or early intervention for a child with learning disability. Please check eligibility."
  },
  G9: {
    code: "G9",
    displayName: "Lifestyle - Reading, Tech & Internet",
    category: "Lifestyle",
    evidenceType: "Receipt-based",
    defaultStatus: "Claimable",
    reason: "This looks like a Lifestyle receipt for reading, tech, or internet. Please confirm it was for personal or family use.",
    userNote: "May be claimable for books, tech devices, internet bills, and selected self-enhancement courses for personal/family use."
  },
  G10: {
    code: "G10",
    displayName: "Lifestyle - Sports",
    category: "Sports",
    evidenceType: "Receipt-based",
    defaultStatus: "Claimable",
    reason: "This looks like a Lifestyle Sports receipt. Please confirm it was for personal or family use and not motorized/commercial sports.",
    userNote: "May be claimable for sports equipment, gym fees, sports facility fees, competition fees, or sports training."
  },
  G11: {
    code: "G11",
    displayName: "Breastfeeding Equipment",
    category: "Other",
    evidenceType: "Receipt-based",
    defaultStatus: "Check Again",
    reason: "Breastfeeding equipment (capped RM1,000 every 2 years) is limited to female taxpayers for child under 2 years old.",
    userNote: "May be claimable for breastfeeding equipment, but eligibility depends on mother/child conditions and claim frequency."
  },
  G12: {
    code: "G12",
    displayName: "Child Care Fees",
    category: "Education",
    evidenceType: "Receipt-based",
    defaultStatus: "Check Again",
    reason: "Pre-school or kindergarten care fees (capped RM3,000) require verifying that the Tadika/Taska is registered with MOE or JKM.",
    userNote: "May be claimable for registered child care centre or kindergarten fees for children aged 6 and below."
  },
  G13: {
    code: "G13",
    displayName: "SSPN Net Savings",
    category: "Education",
    evidenceType: "Payment-record-based",
    defaultStatus: "Check Again",
    reason: "Claims are based on net savings (total deposit minus total withdrawal in the tax year), not just pure deposit payment receipts.",
    userNote: "May be claimable based on net SSPN savings during the year, not just total deposits."
  },
  G14: {
    code: "G14",
    displayName: "Spouse / Alimony Relief",
    category: "Other",
    evidenceType: "Profile-based",
    defaultStatus: "Check Again",
    reason: "Claimable if spouse has no source of income or pays legal alimony, subject to proof of formal separations or joint assessment rules.",
    userNote: "Relief may apply for spouse with no income or alimony paid to a former wife, subject to conditions."
  },
  G15: {
    code: "G15",
    displayName: "Disabled Spouse Relief",
    category: "Other",
    evidenceType: "Profile-based",
    defaultStatus: "Check Again",
    reason: "Requires official disability registration/certification of spouse (certified by JKM/DSW).",
    userNote: "Extra relief may apply if your spouse is officially certified as disabled."
  },
  G16: {
    code: "G16",
    displayName: "Child Relief",
    category: "Other",
    evidenceType: "Profile-based",
    defaultStatus: "Check Again",
    reason: "Depends on child age (under 18 or above 18 studying), study level (diploma, degree), or disability status.",
    userNote: "Relief may apply for children, with higher relief for children in higher education or disabled children."
  },
  G17: {
    code: "G17",
    displayName: "Life Insurance & EPF",
    category: "Insurance",
    evidenceType: "Payment-record-based",
    defaultStatus: "Check Again",
    reason: "This looks like an insurance payment. Please check the policy type before filing. Pensionable public servants have different limits.",
    userNote: "May be claimable for EPF contributions, life insurance premiums, or takaful contributions. Please check policy and contribution details."
  },
  G18: {
    code: "G18",
    displayName: "PRS & Deferred Annuity",
    category: "Other",
    evidenceType: "Payment-record-based",
    defaultStatus: "Check Again",
    reason: "Private Retirement Scheme contributions (capped RM3,000) require verifying the provider is approved by SC.",
    userNote: "May be claimable for approved private retirement scheme or deferred annuity contributions."
  },
  G19: {
    code: "G19",
    displayName: "Education & Medical Insurance",
    category: "Insurance",
    evidenceType: "Payment-record-based",
    defaultStatus: "Check Again",
    reason: "This looks like a medical or education insurance. Verify policy premium breakdown, as standard life riders have different limits.",
    userNote: "May be claimable for qualifying education or medical insurance premiums. Please check policy details."
  },
  G20: {
    code: "G20",
    displayName: "SOCSO & EIS",
    category: "Other",
    evidenceType: "Payment-record-based",
    defaultStatus: "Check Again",
    reason: "SOCSO & EIS employee contributions are standard, but the exact total must be verified from your yearly employee Form EA.",
    userNote: "May be claimable for SOCSO or EIS contributions, usually shown in salary records."
  },
  G21: {
    code: "G21",
    displayName: "EV Charging & Compost",
    category: "Other",
    evidenceType: "Receipt-based",
    defaultStatus: "Check Again",
    reason: "EV home charger or compost machine installation (capped RM2,500) must be for personal household use only (non-business).",
    userNote: "May be claimable for EV charging facility costs or household food waste compost machine, subject to conditions."
  },
  G22: {
    code: "G22",
    displayName: "First Home Loan Interest",
    category: "Other",
    evidenceType: "Payment-record-based",
    defaultStatus: "Check Again",
    reason: "Housing loan interest relief requires verifying the SPA date, first residential home eligibility, and purchase price rules.",
    userNote: "May be claimable for interest on a first residential property, subject to property price and purchase conditions."
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set higher request payloads limit to support Base64 images passing
  app.use(express.json({ limit: "15mb" }));

  // API Route to parse physical receipt images via Gemini
  app.post("/api/read-receipt", async (req, res) => {
    console.log("OCR request received");
    let timeoutId: any = null;
    try {
      const { image, mimeType } = req.body;
      if (!image || !mimeType) {
        return res.status(400).json({ success: false, error: "Missing required fields: image or mimeType" });
      }

      // Check if API key is present
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ success: false, error: "GEMINI_API_KEY is not defined in the server environment variables." });
      }

      const controller = new AbortController();
      timeoutId = setTimeout(() => {
        console.log("Gemini timeout triggered after 45 seconds");
        controller.abort();
      }, 45000);

      // Lazy initialization of Gemini client with custom AbortController fetch integration
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
          fetch: (url: any, init: any) => {
            return fetch(url, { ...init, signal: controller.signal });
          }
        } as any,
      });

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: image,
        },
      };

      const prompt = `You are an expert tax receipt parser. Your job is to extract basic details from the attached receipt image and map them according to the Malaysian Form BE tax relief guide.

Analyze the image carefully and extract:
1. merchant (merchant, seller, shop, or vendor name)
2. date (date of purchase in YYYY-MM-DD format; if missing or unclear, output an empty string)
3. amount (total amount paid, e.g. "89.50" or "105.00", as a string; if missing or unclear, output an empty string)
4. detectedText (all raw transcribed text you can read on the receipt, exactly as it appears)
5. note (a brief, clear description of what was purchased or any special notes)
6. formBEItem (Identify the best matching Tax5 Code from G1 to G22. Select ONE of the codes below that fits best based on keywords, store name and text content. If none fit or the document is completely unrelated, output "Other"):
   - G2: Parents' Medical & Carer Expenses (hospital, klinik, clinic, carer, dental, treatment)
   - G3: Basic Supporting Equipment (wheelchair, dialysis, artificial limb, JKM)
   - G5: Self-Education Fees (university, college, course, tuition, master, training)
   - G6: Serious Diseases & Fertility Treatment (cancer, cardiovascular, IVF, heavy treatment)
   - G7: Health Exams & Medical Devices (health screen, blood test, ultrasound, COVID test, thermometer, oximeter)
   - G8: Learning Disability Support for Child (autism, ADHD, therapy, child assessment)
   - G9: Lifestyle Books & Devices (books, bookstore, popular, mph, laptop, computer, smartphone, wifi, internet)
   - G10: Lifestyle Sports (sports, gym, Decathlon, runners, badminton, court fee)
   - G11: Breastfeeding Equipment (breast pump, milk cooler bag)
   - G12: Child Care Fees (taska, tadika, kindergarten, childcare nursery)
   - G13: SSPN Net Savings (SSPN, PTPTN savings deposit)
   - G17: Life Insurance & EPF (life insurance, takaful premium, EPF, KWSP)
   - G18: PRS (Private Retirement Scheme, Securities Commission)
   - G19: Education & Medical Insurance (medical card premium, medical insurance t_rider)
   - G20: SOCSO / PERKESO EIS contributions
   - G21: EV Charging or Food waste compost machine
   - G22: First housing loan interest SPA payment record

Output the extracted details strictly under the expected JSON format. Do not include any HTML markdown around the json in your output.`;

      let response: any = null;
      let attempt = 0;
      const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest"];
      const maxAttempts = modelsToTry.length;
      let isFallback = false;
      let isTimeout = false;

      console.log("Gemini request started");
      while (attempt < maxAttempts) {
        const modelToUse = modelsToTry[attempt];
        try {
          console.log(`Trying Gemini call using model: ${modelToUse} (attempt ${attempt + 1}/${maxAttempts})`);
          const apiCallPromise = ai.models.generateContent({
            model: modelToUse,
            contents: [imagePart, prompt],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  merchant: { type: Type.STRING },
                  date: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  detectedText: { type: Type.STRING },
                  note: { type: Type.STRING },
                  formBEItem: { type: Type.STRING },
                },
                required: ["merchant", "date", "amount", "detectedText", "note", "formBEItem"],
              },
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) => {
            controller.signal.addEventListener("abort", () => {
              reject(new Error("TimeoutError"));
            });
          });

          response = await Promise.race([apiCallPromise, timeoutPromise]);
          console.log(`Gemini response received successfully on attempt ${attempt + 1}`);
          break; // Success!
        } catch (err: any) {
          attempt++;
          if (err?.name === "AbortError" || err?.message?.includes("abort") || err?.message === "TimeoutError") {
            isTimeout = true;
            console.warn(`Gemini timeout occurred on attempt ${attempt}`);
            break;
          }
          console.warn(`Gemini API call with ${modelToUse} failed:`, err.message || err);
          if (attempt >= maxAttempts) {
            if (err?.status === "RESOURCE_EXHAUSTED" || err?.message?.includes("quota") || err?.message?.includes("429")) {
              console.warn("Gemini quota limit exceeded. Falling back gracefully to manual draft entry template.");
            } else {
              console.warn("Gemini failed after trying all available models. Falling back gracefully to manual draft entry template:", err.message || err);
            }
            isFallback = true;
            break;
          } else {
            console.log("Waiting briefly before using fallback model...");
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        }
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (isTimeout) {
        return res.status(408).json({
          success: false,
          error: "Receipt reading took too long. Please try again or enter the receipt manually."
        });
      }

      let responseText = "";
      if (response && response.text) {
        responseText = response.text;
      } else {
        isFallback = true;
        responseText = JSON.stringify({
          merchant: "Merchant (Input Manually)",
          date: new Date().toISOString().split("T")[0],
          amount: "0.00",
          detectedText: "[Service Notice: Gemini API was temporarily overloaded or unavailable. Standard automated fields have been bypassed to prevent blocking you. Please use the manual input form below to edit details.]",
          note: "Draft template loaded due to AI service high demand.",
          formBEItem: "G9",
        });
      }

      // Attempt parsing of raw JSON response
      let extracted: any;
      try {
        extracted = JSON.parse(responseText.trim());
      } catch (parseErr) {
        console.warn("Gemini output was not valid JSON or parsing failed, loaded default template.");
        isFallback = true;
        extracted = {
          merchant: "Merchant (Input Manually)",
          date: new Date().toISOString().split("T")[0],
          amount: "0.00",
          detectedText: "[Service Notice: Could not read receipt clearly. Pre-populated lifestyle template loaded. Please enter correct details manually.]",
          note: "Manual review requested.",
          formBEItem: "G9",
        };
      }

      // Safeguard returned fields
      const parsedText = extracted.detectedText || "";
      const parsedMerchant = extracted.merchant || "";
      const parsedDate = extracted.date || "";
      const parsedAmount = extracted.amount || "";
      const parsedNote = extracted.note || "";
      let matchedBEItem = (extracted.formBEItem || "Other").trim().toUpperCase();

      // If G_NONE or something similar came back, fallback to "Other"
      if (!TAX5_GUIDE_ITEMS[matchedBEItem]) {
        matchedBEItem = "Other";
      }

      // Programmatic rule validation as required in guidelines:
      // "Simple lifestyle and sports receipts may default to Claimable if they are clearly personal/family use."
      // Let's secondary match by keyword rules inside the server too to make sure our system is robust!
      const combinedLower = `${parsedMerchant} ${parsedText}`.toLowerCase();
      if (matchedBEItem === "Other") {
        if (/bookstore|book|books|popular|mph|stationery/.test(combinedLower)) {
          matchedBEItem = "G9";
        } else if (/sports|gym|decathlon|equipment|badminton|fitness/.test(combinedLower)) {
          matchedBEItem = "G10";
        } else if (/pharmacy|clinic|hospital|medical|medicine|guardian|watsons|klinik/.test(combinedLower)) {
          matchedBEItem = "G7"; // Health Exams / Devices or Medical
        } else if (/university|tuition|course|education|school|training|college/.test(combinedLower)) {
          matchedBEItem = "G5"; // Self-Education
        } else if (/insurance|takaful|premium/.test(combinedLower)) {
          matchedBEItem = "G17"; // Insurance
        }
      }

      let tax5DisplayName = "Other allowable relief";
      let category: "Lifestyle" | "Medical" | "Education" | "Sports" | "Insurance" | "Other" = "Other";
      let claimStatus: "Claimable" | "Check Again" | "Non-claimable" = "Check Again";
      let evidenceType = "Receipt-based";
      let classificationReason = "This transaction does not match a straightforward tax relief category. Please check details manually.";
      let finalNote = parsedNote || "Preparatory record saved.";

      if (matchedBEItem && TAX5_GUIDE_ITEMS[matchedBEItem]) {
        const itemInfo = TAX5_GUIDE_ITEMS[matchedBEItem];
        tax5DisplayName = itemInfo.displayName;
        category = itemInfo.category;
        claimStatus = itemInfo.defaultStatus;
        evidenceType = itemInfo.evidenceType;
        classificationReason = itemInfo.reason;
        
        if (!parsedNote) {
          finalNote = itemInfo.userNote;
        }
      } else {
        // If it looks like foods/dinings/groceries or business utilities, mark as Non-claimable
        if (/food|dining|restaurant|grocery|supermarket|baking|cafe|starbucks|mcdonald|grabfood|eats/.test(combinedLower)) {
          category = "Other";
          claimStatus = "Non-claimable";
          classificationReason = "This looks like a food, dining, or grocery receipt. General meals are NOT claimable under standard personal tax reliefs.";
          finalNote = "Non-eligible personal dining expenses.";
        } else {
          category = "Other";
          claimStatus = "Check Again";
          classificationReason = "Unclear tax category. Tax5 recommends confirming the relief guide eligibility first.";
        }
        matchedBEItem = "Other";
      }

      // Evidentiary medical bundles warning
      if (["G6", "G7", "G8"].includes(matchedBEItem)) {
        classificationReason += " Note: Serious disease, health screen, and learning disability categories share a combined RM10,000 threshold group.";
      }

      // Appended disclaimer automatically:
      let fullReasonWithDisclaimer = `${classificationReason} \n\nDisclaimer: Tax5 gives a preparation suggestion only. Final claim eligibility must be checked using official LHDN/MyTax information.`;
      if (isFallback) {
        fullReasonWithDisclaimer = "The AI service is currently experiencing extremely high demand. Tax5 loaded a generic pre-filing template for you so you are not blocked. Please inspect and manually enter the correct receipt values below.";
      }

      // Construct and return JSON in the exact expected client format
      const finalResult = {
        merchant: parsedMerchant,
        date: parsedDate,
        amount: parsedAmount,
        detectedText: parsedText,
        formBEItem: matchedBEItem,
        tax5DisplayName: tax5DisplayName,
        category: category,
        claimStatus: claimStatus,
        evidenceType: evidenceType,
        note: finalNote,
        classificationReason: fullReasonWithDisclaimer,
        confidence: isFallback ? "Low" as const : "High" as const,
        fallback: isFallback,
      };

      console.log("OCR JSON returned to client");
      return res.json(finalResult);
    } catch (error: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota") || error?.message?.includes("429")) {
        console.warn("Receipt processing quota limit exceeded, fallback manual option is recommended.");
      } else {
        console.warn("Error processing receipt:", error.message || error);
      }
      return res.status(500).json({ success: false, error: error.message || "An unexpected error occurred while reading the receipt." });
    }
  });

  // API Route for Ask Tax5 custom queries (Gemini-powered chatbot helper with plain text requirements)
  app.post("/api/ask-chat", async (req, res) => {
    try {
      const { message, language } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Missing required field: message" });
      }

      const isBM = language === "BM";

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          text: isBM
            ? "Saya tidak dapat memberikan jawapan yang jelas buat masa ini. Anda boleh bertanya tentang resit, kategori tuntutan, Penyediaan Profil, Ringkasan, atau persediaan draf Borang BE."
            : "I could not answer that clearly right now. You can ask about receipts, claim categories, Profile Setup, Summary, or Form BE draft preparation."
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      let systemInstruction = `You are Tax5, an expert tax assistant for Malaysian citizens preparing Form BE tax filings.
Guidelines for your responses:
- DO NOT use any Markdown symbols or markdown formats under any circumstances.
- DO NOT use any bolding, asterisks, italics, bullet points, tables, or headings.
- Output clean, plain text only.
- Keep answers short, friendly, readable, and highly mobile-friendly (strictly between 3 to 5 short sentences).
- Remind users to verify final eligibility with LHDN or MyTax when relevant.
- Do not provide final tax filing decisions; always present answers as preparation guidance.
- Make sure to keep the answers accurate according to Malaysia LHDN rules of assessment.
- Avoid any marketing fluff.`;

      if (isBM) {
        systemInstruction = `Anda adalah Tax5, pembantu cukai pakar untuk warganegara Malaysia yang menyediakan pengisian cukai Borang BE.
Garis panduan untuk jawapan anda (Mati-matian mesti dijawab dalam Bahasa Melayu):
- JAWAB DALAM BAHASA MELAYU SAHAJA. JANGAN gunakan Bahasa Inggeris.
- JANGAN gunakan sebarang simbol Markdown atau format markdown dalam apa jua keadaan.
- JANGAN gunakan sebarang huruf tebal, asterisk (*), huruf condong, butiran, jadual, atau tajuk.
- Hasilkan output teks biasa yang bersih sahaja.
- Pastikan jawapan pendek, mesra, mudah dibaca, dan sangat mesra peranti mudah alih (antara 3 hingga 5 ayat pendek sahaja).
- Ingatkan pengguna untuk mengesahkan kelayakan akhir dengan LHDN atau MyTax apabila relevan.
- Jangan berikan keputusan fail cukai akhir; sentiasa bentangkan jawapan sebagai panduan persediaan sahaja.
- Pastikan jawapan tepat mengikut peraturan taksiran LHDN Malaysia.
- Elakkan sebarang elemen pemasaran.`;
      }

      let response: any = null;
      let attempt = 0;
      const chatModelsToTry = ["gemini-3.5-flash", "gemini-flash-latest"];
      const maxChatAttempts = chatModelsToTry.length;

      while (attempt < maxChatAttempts) {
        const modelToUse = chatModelsToTry[attempt];
        try {
          console.log(`Trying chatbot Gemini call with model: ${modelToUse} (attempt ${attempt + 1}/${maxChatAttempts})`);
          response = await ai.models.generateContent({
            model: modelToUse,
            contents: message,
            config: {
              systemInstruction: systemInstruction,
            }
          });
          console.log(`Chatbot response successfully retrieved using model ${modelToUse}`);
          break;
        } catch (err: any) {
          attempt++;
          console.warn(`Chatbot call failed on model ${modelToUse}:`, err.message || err);
          if (attempt >= maxChatAttempts) {
            throw err; // throw and let general catch handle it with fallback text
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      const responseText = (response?.text || "").trim();
      return res.json({ text: responseText || (isBM ? "Maaf, saya tidak dapat merumuskan jawapan pada masa ini. Sila semak had biasa yang lain di atas." : "I'm sorry, I could not formulate a response at this moment. Please check other common limits above.") });
    } catch (err: any) {
      const isBM = req.body?.language === "BM";
      if (err?.status === "RESOURCE_EXHAUSTED" || err?.message?.includes("quota") || err?.message?.includes("429")) {
        console.warn("Gemini chatbot quota limit exceeded. Loaded fallback response.");
      } else {
        console.warn("Gemini chatbot query failed:", err.message || err);
      }
      return res.json({
        text: isBM
          ? "Saya tidak dapat memberikan jawapan yang jelas buat masa ini. Anda boleh bertanya tentang resit, kategori tuntutan, Penyediaan Profil, Ringkasan, atau persediaan draf Borang BE."
          : "I could not answer that clearly right now. You can ask about receipts, claim categories, Profile Setup, Summary, or Form BE draft preparation."
      });
    }
  });

  // Serve static client assets in production, use Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
