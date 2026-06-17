export interface TaxKnowledgeBaseEntry {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
  sourceLabel: string;
}

export const taxKnowledgeBase: TaxKnowledgeBaseEntry[] = [
  {
    id: "lifestyle-limit",
    title: "Lifestyle Relief Limit",
    keywords: ["lifestyle", "g9", "reading", "books", "computer", "smartphone", "tablet", "internet", "magazine", "devices", "wifi"],
    answer: "The Lifestyle tax relief has a maximum limit of RM 2,500. It covers purchases of reading materials (books, journals, magazines), personal computers, smartphones, tablets, internet bills registered under your own name, and self-enhancement course fees. All claims must be supported by official receipts.",
    sourceLabel: "LHDN Form BE 2025 Explanatory Notes, Item G9"
  },
  {
    id: "sports-lifestyle",
    title: "Sports Equipment and Activities under Lifestyle",
    keywords: ["sport", "sports", "equipment", "gym", "rental", "entrance fee", "sports facility", "venue", "competition", "training", "g10", "badminton", "fitness", "decathlon"],
    answer: "There is an additional, separate Lifestyle relief for Sports with a maximum limit of RM 1,000. It covers purchasing sports equipment listed under the Sports Development Act 1997 (excluding motorized bicycles), gym memberships, sports training fees, rental or entry fees to sports facilities, and competition registration fees.",
    sourceLabel: "LHDN Form BE 2025 Explanatory Notes, Item G10"
  },
  {
    id: "medical-limit",
    title: "Medical Relief Limit",
    keywords: ["medical", "health", "serious disease", "fertility", "vaccination", "treatment", "illness", "g6", "parents medical", "grandparents medical"],
    answer: "The total relief limit for Medical Expenses is RM 10,000. This is a combined group threshold that covers treatment of serious diseases, fertility treatments, vaccinations (up to RM 1,000), complete medical examinations or health screening (up to RM 1,000), self-testing medical devices, and certified mental health consultation.",
    sourceLabel: "LHDN Form BE 2025 Explanatory Notes, Item G6"
  },
  {
    id: "health-screening",
    title: "Health Screening under Medical",
    keywords: ["screening", "health examination", "checkup", "check-up", "examination", "blood test", "ultrasound", "mammogram", "pap smear", "covid test", "disease detection", "clinical lab", "g7"],
    answer: "Complete medical examinations and disease detection tests (including blood tests, ultrasounds, mammograms, pap smears, influenza, and COVID-19 self-tests) are claimable with a sub-limit of RM 1,000. This RM 1,000 sub-limit is part of the overall RM 10,000 maximum medical expenses relief group.",
    sourceLabel: "LHDN Form BE 2025 Explanatory Notes, Item G7"
  },
  {
    id: "education-relief",
    title: "Self-Education Relief",
    keywords: ["education", "self-education", "study", "course", "fees", "degree", "master", "doctorate", "upskilling", "professional qualification", "g5"],
    answer: "You can claim up to RM 7,000 for self-education fees at recognized institutions in Malaysia. This covers master's or doctorate courses, any course up to tertiary level in fields like law, accounting, Islamic finance, STEM, or technical/vocational courses, and general up-skilling or self-enhancement courses (capped up to RM 2,000).",
    sourceLabel: "LHDN Form BE 2025 Explanatory Notes, Item G5"
  },
  {
    id: "food-general-spending",
    title: "Non-claimable general personal or dining expenses",
    keywords: ["food", "meals", "dining", "groceries", "cafe", "restaurant", "lunch", "dinner", "eating", "supermarket", "starbucks", "mcdonalds", "kfc", "grocer", "personal spend", "general expense", "grabfood", "foodpanda"],
    answer: "General meals, dining, groceries, and normal personal spending are not usually claimable under standard Form BE personal relief categories. Tax5 can still save the receipt as a record, but mark it as Not eligible unless it matches a specific LHDN relief item.",
    sourceLabel: "LHDN Form BE 2025 Explanatory Notes, General Guidance"
  },
  {
    id: "receipt-evidence",
    title: "Receipt Evidence Reminder",
    keywords: ["evidence", "proof", "receipt", "receipts", "documentation", "invoice", "payment proof", "audit evidence", "tax audit"],
    answer: "Keep official receipts, invoices, vouchers, or relevant supporting documents. Payment slips or bank records may help, but users should keep the original supporting document where available.",
    sourceLabel: "LHDN Form BE 2025 Explanatory Notes, Basic Particulars"
  },
  {
    id: "record-keeping",
    title: "Record Keeping Requirement",
    keywords: ["keep", "record", "records", "years", "7 years", "audits", "storing", "storage", "saving"],
    answer: "Keep all records, receipts, working sheets, and supporting documents for seven (7) years after the end of the year in which the return form is submitted.",
    sourceLabel: "LHDN Form BE 2025 Explanatory Notes, Basic Particulars"
  },
  {
    id: "form-be-purpose",
    title: "Form BE Basic Purpose",
    keywords: ["form be", "what is form be", "be purpose", "resident individual", "salaried", "employee", "no business", "income tax form"],
    answer: "Form BE is the official Malaysian tax return filing form designed for resident individuals who do not carry on any business. Salaried employees, wage earners, and pensioners file their taxes annually using this form to declare statutory employment income, other non-business income, and claim eligible personal reliefs.",
    sourceLabel: "LHDN Form BE 2025 Explanatory Notes, Intro"
  }
];
