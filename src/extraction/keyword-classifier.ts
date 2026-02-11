// Deterministic Document Classifier
// Runs on Textract OCR output BEFORE any AI call. Classifies financial documents
// by matching keywords in the raw text and key-value pair keys.
//
// Three tiers of matching, checked in order:
//   TIER 1: Literal keyword/phrase matching on raw text (high confidence)
//   TIER 2: KV key name matching from Textract pairs (medium confidence)
//   TIER 3: Contextual text analysis for docs without explicit titles (medium confidence)
//
// Returns null docType if no confident match — caller falls back to Grok AI.
// No AI, no external dependencies — pure deterministic string matching.

// Valid Document Types

export type DocumentType =
  | "FORM_1040"
  | "FORM_1120"
  | "FORM_1120S"
  | "FORM_1065"
  | "SCHEDULE_K1"
  | "W2"
  | "BANK_STATEMENT_CHECKING"
  | "BANK_STATEMENT_SAVINGS"
  | "PROFIT_AND_LOSS"
  | "BALANCE_SHEET"
  | "RENT_ROLL";

export interface ClassificationResult {
  docType: DocumentType | null;
  confidence: "high" | "medium" | "none";
  method: "keyword" | "kv_key" | "none";
}

export interface KeyValuePair {
  key: string;
  value: string;
  confidence: number;
  page: number;
}

// Main Classifier

/**
 * Classify a document by matching keywords in OCR text and Textract KV pairs.
 *
 * Priority order:
 *   1. TIER 1 — keyword matching on raw text (high confidence)
 *   2. TIER 2 — KV key matching (medium confidence)
 *   3. TIER 3 — contextual text analysis (medium confidence)
 *
 * Returns docType: null if nothing matches — caller should fall back to AI.
 */
export function classifyByKeywords(
  rawText: string,
  keyValuePairs: Array<KeyValuePair>,
): ClassificationResult {
  // Normalize text once for all matching
  const text = rawText.toLowerCase();
  const keys = keyValuePairs.map((kv) => kv.key.toLowerCase());

  // TIER 1: Keyword matching on raw text
  // These are literal words/phrases that appear on the document.
  // Check more specific patterns first to avoid false matches.
  const tier1Result = matchTier1Keywords(text);
  if (tier1Result) {
    return { docType: tier1Result, confidence: "high", method: "keyword" };
  }

  // TIER 2: KV key matching
  // Textract extracts form field names as keys. Financial documents have
  // distinctive field names that identify the form type.
  const tier2Result = matchTier2KVKeys(keys);
  if (tier2Result) {
    return { docType: tier2Result, confidence: "medium", method: "kv_key" };
  }

  // TIER 3: Contextual text analysis
  // For bank statements, P&Ls, and balance sheets that may not have
  // explicit form titles — look for combinations of terms.
  const tier3Result = matchTier3Context(text);
  if (tier3Result) {
    return { docType: tier3Result, confidence: "medium", method: "keyword" };
  }

  // No confident match — caller should fall back to AI
  return { docType: null, confidence: "none", method: "none" };
}

// TIER 1: Keyword Matching
// Literal phrases that appear on official IRS forms and financial documents.
// Order matters: more specific patterns are checked first (e.g., 1120-S before 1120).

function matchTier1Keywords(text: string): DocumentType | null {
  // 1. Form 1120-S — must check BEFORE generic 1120
  //    Matches "Form 1120-S", "1120S", or the full title
  if (
    /form\s*1120[\s-]*s\b/.test(text) ||
    /\b1120s\b/.test(text) ||
    text.includes("income tax return for an s corporation")
  ) {
    return "FORM_1120S";
  }

  // 2. Form 1120 — generic C-Corp (only if NOT 1120-S)
  //    The 1120-S check above already returned, so any remaining "1120" is C-Corp
  if (
    /form\s*1120\b/.test(text) ||
    text.includes("u.s. corporation income tax return")
  ) {
    return "FORM_1120";
  }

  // 3. Form 1065 — Partnership return
  if (
    /form\s*1065\b/.test(text) ||
    text.includes("return of partnership income")
  ) {
    return "FORM_1065";
  }

  // 4. Schedule K-1 — Partner/Shareholder income allocation
  //    Check before 1040 because K-1s reference 1040 in their instructions
  if (
    /schedule\s*k[\s-]*1\b/.test(text) ||
    text.includes("partner's share of income") ||
    text.includes("shareholder's share of income")
  ) {
    return "SCHEDULE_K1";
  }

  // 5. Form 1040 — Individual income tax return
  //    Use word boundary to avoid matching "10400" or similar
  if (
    /form\s*1040\b/.test(text) ||
    text.includes("u.s. individual income tax return") ||
    /\b1040\b/.test(text)
  ) {
    return "FORM_1040";
  }

  // 6. Schedule C — Profit or Loss From Business (maps to P&L)
  if (
    /schedule\s*c\b/.test(text) ||
    text.includes("profit or loss from business")
  ) {
    return "PROFIT_AND_LOSS";
  }

  // 7. Schedule E — Supplemental Income and Loss (maps to 1040)
  //    This is a 1040 attachment for rental/partnership/S-Corp income
  if (
    /schedule\s*e\b/.test(text) ||
    text.includes("supplemental income and loss")
  ) {
    return "FORM_1040";
  }

  // 8. W-2 — Wage and Tax Statement
  if (/\bw[\s-]*2\b/.test(text) || text.includes("wage and tax statement")) {
    return "W2";
  }

  // 9. Rent Roll — explicit title or tenant + rent combination
  if (
    /rent\s*roll/.test(text) ||
    (/tenant/.test(text) && /monthly\s*rent/.test(text))
  ) {
    return "RENT_ROLL";
  }

  return null;
}

// TIER 2: KV Key Matching
// Textract extracts key-value pairs from forms. The KEY names themselves
// are distinctive enough to identify the document type.

function matchTier2KVKeys(keys: string[]): DocumentType | null {
  const joinedKeys = keys.join(" ");

  // Form 1040 — has fields like "Adjusted gross income", "Filing status", "Taxable income"
  if (
    joinedKeys.includes("adjusted gross income") ||
    joinedKeys.includes("filing status") ||
    joinedKeys.includes("taxable income")
  ) {
    return "FORM_1040";
  }

  // W-2 — has "Wages, tips" + "Federal income tax withheld" + "Employer"
  if (
    (joinedKeys.includes("wages, tips") ||
      joinedKeys.includes("wages,tips")) &&
    joinedKeys.includes("federal income tax withheld") &&
    joinedKeys.includes("employer")
  ) {
    return "W2";
  }

  // Form 1065 — "Ordinary business income" + "Partner"
  if (
    joinedKeys.includes("ordinary business income") &&
    joinedKeys.includes("partner")
  ) {
    return "FORM_1065";
  }

  // Balance Sheet — "Total assets" + "Total liabilities"
  if (
    joinedKeys.includes("total assets") &&
    joinedKeys.includes("total liabilities")
  ) {
    return "BALANCE_SHEET";
  }

  // P&L — ("Net income" or "Net profit") + ("Revenue" or "Sales")
  if (
    (joinedKeys.includes("net income") || joinedKeys.includes("net profit")) &&
    (joinedKeys.includes("revenue") || joinedKeys.includes("sales"))
  ) {
    return "PROFIT_AND_LOSS";
  }

  // Bank Statement (savings) — check before generic bank statement
  // "Savings" + ("Balance" or "Account")
  if (
    joinedKeys.includes("savings") &&
    (joinedKeys.includes("balance") || joinedKeys.includes("account"))
  ) {
    return "BANK_STATEMENT_SAVINGS";
  }

  // Bank Statement (checking, default) — "Beginning balance" or "Ending balance" + "Account number"
  if (
    (joinedKeys.includes("beginning balance") ||
      joinedKeys.includes("ending balance")) &&
    joinedKeys.includes("account number")
  ) {
    return "BANK_STATEMENT_CHECKING";
  }

  return null;
}

// TIER 3: Contextual Text Analysis
// For documents without explicit titles — detect by combinations of terms
// commonly found together in specific document types.

// Major US banks — used to identify bank statements
const BANK_NAMES = [
  "chase",
  "wells fargo",
  "bank of america",
  "citibank",
  "citi bank",
  "pnc",
  "us bank",
  "u.s. bank",
  "capital one",
  "td bank",
  "truist",
  "fifth third",
  "regions bank",
  "citizens bank",
  "huntington",
  "m&t bank",
  "keybank",
  "ally bank",
  "discover bank",
  "synchrony",
  "bmo",
  "first republic",
  "silicon valley bank",
  "comerica",
  "zions",
  "webster bank",
  "east west bank",
  "popular bank",
  "new york community bank",
  "valley national bank",
];

function matchTier3Context(text: string): DocumentType | null {
  // Bank Statement (savings) — check before generic bank statement
  if (
    text.includes("savings account") ||
    text.includes("savings statement")
  ) {
    return "BANK_STATEMENT_SAVINGS";
  }

  // Bank Statement (checking, default) — bank name + "Statement" + "Account"
  const hasBankName = BANK_NAMES.some((bank) => text.includes(bank));
  if (
    hasBankName &&
    text.includes("statement") &&
    text.includes("account")
  ) {
    return "BANK_STATEMENT_CHECKING";
  }

  // Balance Sheet — "Assets" + "Liabilities" + "Equity"
  // Check before P&L because some P&Ls mention assets, but not equity
  if (
    /\bassets\b/.test(text) &&
    /\bliabilities\b/.test(text) &&
    /\bequity\b/.test(text)
  ) {
    return "BALANCE_SHEET";
  }

  // Profit & Loss / Income Statement — "Revenue" + "Expenses" + "Net" (income/profit/loss)
  if (
    /\brevenue\b/.test(text) &&
    /\bexpenses\b/.test(text) &&
    /\bnet\s+(income|profit|loss)\b/.test(text)
  ) {
    return "PROFIT_AND_LOSS";
  }

  // Rent Roll — unit numbers + tenant names + rent amounts in table-like format
  // Look for patterns like "Unit", "Tenant", and dollar amounts together
  if (
    /\bunit\b/.test(text) &&
    /\btenant\b/.test(text) &&
    /\brent\b/.test(text) &&
    /\$[\d,]+/.test(text)
  ) {
    return "RENT_ROLL";
  }

  return null;
}
