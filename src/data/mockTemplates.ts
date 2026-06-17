/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClaimCategory, ClaimStatus } from "../types";

export interface ScanTemplate {
  merchant: string;
  amount: number;
  category: ClaimCategory;
  claimStatus: ClaimStatus;
  notes: string;
  imagePlaceholder: string;
}

export const SCAN_TEMPLATES: ScanTemplate[] = [
  {
    merchant: "Popular Bookstore",
    amount: 85.90,
    category: ClaimCategory.Lifestyle,
    claimStatus: ClaimStatus.Claimable,
    notes: "Receipt scan simulation detected a book purchase. Eligible under Form BE Lifestyle relief (books/journals).",
    imagePlaceholder: "bookstore_receipt.png"
  },
  {
    merchant: "Pantai Hospital Kuala Lumpur",
    amount: 320.00,
    category: ClaimCategory.Medical,
    claimStatus: ClaimStatus.Claimable,
    notes: "Medical consultation and treatment. Fully claimable under Medical expenses for self/spouse/children.",
    imagePlaceholder: "hospital_receipt.png"
  },
  {
    merchant: "Decathlon KL East",
    amount: 189.00,
    category: ClaimCategory.Sports,
    claimStatus: ClaimStatus.Claimable,
    notes: "Purchased running gear and athletic equipment. Claimable under Sports/Lifestyle category tracker limit (RM1,000 for Sports block).",
    imagePlaceholder: "decathlon_receipt.png"
  },
  {
    merchant: "Prudential Assurance Malaysia",
    amount: 450.00,
    category: ClaimCategory.Insurance,
    claimStatus: ClaimStatus.CheckAgain,
    notes: "Monthly insurance payment. Check if this premium falls under Life Insurance (claimable) or Medical Protection (different section max limit limit).",
    imagePlaceholder: "prudential_statement.png"
  },
  {
    merchant: "Brickfields College (BAC)",
    amount: 1500.00,
    category: ClaimCategory.Education,
    claimStatus: ClaimStatus.Claimable,
    notes: "Semester fees receipt. Claimable under Education relief (up to RM7,000) for approved courses of study.",
    imagePlaceholder: "college_invoice.png"
  },
  {
    merchant: "FamilyMart Bangsar",
    amount: 32.40,
    category: ClaimCategory.Other,
    claimStatus: ClaimStatus.NonClaimable,
    notes: "Food & beverage purchase is generally NON-CLAIMABLE under standard Personal Tax Relief. Saved digitally for bookkeeping records.",
    imagePlaceholder: "familymart_receipt.png"
  },
  {
    merchant: "SSPN-i Deposit (PTPTN)",
    amount: 1200.00,
    category: ClaimCategory.Education,
    claimStatus: ClaimStatus.CheckAgain,
    notes: "SSPN child education savings deposit. Saved as an SSPN-related record. Note that deposit receipts alone may not show your net annual savings.",
    imagePlaceholder: "sspn_receipt.png"
  }
];
