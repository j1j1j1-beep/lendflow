// Bio Document Classifier
// Two-tier classification for biopharmaceutical/IND documents:
//   TIER 1: Deterministic keyword matching on OCR text (fast, high confidence)
//   TIER 2: AI fallback via Grok for ambiguous documents
//
// Covers 6 bio document types aligned with FDA IND application sections:
//   - BATCH_RECORD (CMC manufacturing records, 21 CFR 211.188)
//   - CERTIFICATE_OF_ANALYSIS (release testing per ICH Q6B)
//   - STABILITY_DATA (ICH Q1A/Q1B/Q5C compliant studies)
//   - TOXICOLOGY_REPORT (GLP nonclinical safety, 21 CFR 58)
//   - PK_STUDY (pharmacokinetic/ADME/toxicokinetic studies)
//   - CLINICAL_PROTOCOL (Phase 1-3 study protocols per 21 CFR 312.23)

import { claudeJson } from "@/lib/claude";
import type { BioDocType } from "./schemas";

export interface BioClassificationResult {
  docType: string;
  confidence: number;
  method: string;
}

// Keyword sets per document type.
// Each keyword is a lowercase phrase. We count how many distinct keywords match
// in the normalized OCR text. If the top-scoring type has >= 3 matches, we
// classify deterministically without an AI call.
//
// Keywords sourced from FDA IND guidance (21 CFR 312), ICH guidelines (Q1A,
// Q5C, Q6B, M4), GLP regulations (21 CFR 58), and standard pharma terminology.

const KEYWORD_MAP: Record<BioDocType, string[]> = {
  BATCH_RECORD: [
    "batch record",
    "batch number",
    "lot number",
    "conjugation",
    "drug substance",
    "manufacturing record",
    "in-process control",
    "drug product",
    "batch size",
    "manufacturing date",
    "gmp",
    "cgmp",
    "current good manufacturing",
    "deviation report",
    "yield",
    "in-process testing",
    "process parameter",
    "fill weight",
    "bulk manufacture",
    "executed batch record",
    "master batch record",
    "release date",
    "equipment log",
    "environmental monitoring",
  ],
  CERTIFICATE_OF_ANALYSIS: [
    "certificate of analysis",
    "coa",
    "release testing",
    "acceptance criteria",
    "specification",
    "test result",
    "quality control",
    "analytical testing",
    "method reference",
    "out of specification",
    "oos",
    "test method",
    "disposition",
    "approved for release",
    "qa review",
    "residual host cell protein",
    "residual dna",
    "certificate of conformance",
    "certificate of compliance",
    "release certificate",
  ],
  STABILITY_DATA: [
    "stability study",
    "accelerated stability",
    "shelf life",
    "storage condition",
    "ich q1",
    "long-term stability",
    "photostability",
    "ich q5c",
    "stability protocol",
    "stability indicating",
    "degradation product",
    "real-time stability",
    "intermediate condition",
    "stability commitment",
    "stability budget",
    "trend analysis",
    "extrapolation",
    "container closure integrity",
    "freeze-thaw",
    "forced degradation",
    "25°c/60% rh",
    "40°c/75% rh",
    "5°c",
    "time point",
  ],
  TOXICOLOGY_REPORT: [
    "toxicology",
    "noael",
    "loael",
    "glp",
    "repeat-dose",
    "dose-finding",
    "maximum tolerated dose",
    "histopathology",
    "good laboratory practice",
    "toxicokinetic",
    "dose escalation",
    "dose-response",
    "target organ",
    "gross pathology",
    "clinical pathology",
    "hematology",
    "serum chemistry",
    "necropsy",
    "recovery period",
    "reversibility",
    "safety pharmacology",
    "genotoxicity",
    "tissue cross-reactivity",
    "immunotoxicity",
    "carcinogenicity",
    "reproductive toxicity",
    "developmental toxicity",
    "single-dose toxicity",
    "ld50",
    "mtd",
    "severely toxic dose",
    "organ weight",
    "study director",
  ],
  PK_STUDY: [
    "pharmacokinetic",
    "cmax",
    "auc",
    "clearance",
    "half-life",
    "bioavailability",
    "distribution",
    "adme",
    "absorption",
    "metabolism",
    "excretion",
    "volume of distribution",
    "tmax",
    "area under the curve",
    "dose proportionality",
    "bioanalytical",
    "lloq",
    "plasma concentration",
    "serum concentration",
    "compartmental",
    "non-compartmental",
    "pk parameter",
    "pharmacokinetics",
    "exposure",
    "steady state",
    "accumulation ratio",
    "mean residence time",
    "systemic exposure",
    "population pharmacokinetic",
  ],
  CLINICAL_PROTOCOL: [
    "clinical protocol",
    "study design",
    "eligibility criteria",
    "informed consent",
    "inclusion criteria",
    "exclusion criteria",
    "primary endpoint",
    "secondary endpoint",
    "investigational product",
    "clinical trial",
    "phase 1",
    "phase 2",
    "phase 3",
    "irb",
    "institutional review board",
    "ethics committee",
    "randomization",
    "dose limiting toxicity",
    "dlt",
    "data safety monitoring board",
    "dsmb",
    "adverse event",
    "serious adverse event",
    "study population",
    "sample size",
    "statistical analysis plan",
    "screening visit",
    "treatment arm",
    "control arm",
    "protocol amendment",
    "ind number",
    "nct number",
    "investigator's brochure",
  ],
};

/**
 * Classify a biopharmaceutical document from OCR text.
 *
 * Two-tier approach:
 *   1. Keyword scoring — count distinct keyword matches per doc type.
 *      If the top scorer has >= 3 matches, return it deterministically.
 *   2. AI fallback — if keyword scoring is inconclusive (top score < 3),
 *      call Grok to classify with a structured prompt listing all 6 types.
 */
export async function classifyBioDocument(
  ocrText: string,
): Promise<BioClassificationResult> {
  // TIER 1: Keyword-based classification
  const keywordResult = classifyByKeywords(ocrText);
  if (keywordResult) {
    return keywordResult;
  }

  // TIER 2: AI fallback
  return classifyWithAI(ocrText);
}

/**
 * Score OCR text against each doc type's keyword set.
 * Returns a classification if the top scorer has >= 3 distinct keyword matches.
 */
function classifyByKeywords(ocrText: string): BioClassificationResult | null {
  const text = ocrText.toLowerCase();

  const scores: { docType: BioDocType; matchCount: number }[] = [];

  for (const [docType, keywords] of Object.entries(KEYWORD_MAP) as [BioDocType, string[]][]) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matchCount++;
      }
    }
    scores.push({ docType, matchCount });
  }

  // Sort by match count descending
  scores.sort((a, b) => b.matchCount - a.matchCount);

  const top = scores[0];
  const runner = scores[1];

  // Require at least 3 keyword matches for a deterministic classification
  if (top.matchCount < 3) {
    return null;
  }

  // Confidence scales with match count and separation from runner-up.
  // Base confidence: 0.6 at 3 matches, +0.05 per additional match, capped at 0.95.
  // Bonus if there's clear separation from the runner-up.
  const separation = top.matchCount - (runner?.matchCount ?? 0);
  let confidence = Math.min(0.95, 0.6 + (top.matchCount - 3) * 0.05 + separation * 0.02);
  confidence = Math.round(confidence * 100) / 100;

  return {
    docType: top.docType,
    confidence,
    method: "keyword",
  };
}

/**
 * AI fallback classifier. Sends the first 6000 characters of OCR text to Grok
 * with a structured prompt listing all 6 bio doc types and their descriptions.
 */
async function classifyWithAI(ocrText: string): Promise<BioClassificationResult> {
  // Truncate to avoid excessive token usage — first 6000 chars is enough for classification
  const truncated = ocrText.length > 6000
    ? ocrText.slice(0, 6000) + "\n\n[... truncated for classification ...]"
    : ocrText;

  const systemPrompt = `You are a biopharmaceutical document classifier for FDA IND (Investigational New Drug) applications.
Classify the provided document text into exactly one of these 6 document types:

1. BATCH_RECORD — Manufacturing batch records for drug substance or drug product. Contains batch/lot numbers, process parameters, in-process controls, yield data, equipment logs, and GMP compliance information. Per 21 CFR 211.188.

2. CERTIFICATE_OF_ANALYSIS — Release testing certificates (CoA) documenting analytical test results against acceptance criteria/specifications. Contains test names, methods, results, pass/fail determinations, and QA approval. Per ICH Q6B.

3. STABILITY_DATA — Stability study reports documenting product quality over time under various storage conditions. Contains timepoints, test results at each timepoint, degradation trends, shelf life determination. Per ICH Q1A/Q5C.

4. TOXICOLOGY_REPORT — Nonclinical toxicology/safety study reports. Contains dose groups, NOAEL/LOAEL, histopathology findings, clinical pathology, toxicokinetics, recovery data. GLP-compliant per 21 CFR 58.

5. PK_STUDY — Pharmacokinetic/ADME study reports. Contains Cmax, AUC, clearance, half-life, volume of distribution, dose proportionality, bioanalytical methods. Nonclinical or clinical PK.

6. CLINICAL_PROTOCOL — Clinical study protocols for Phase 1-3 trials. Contains study design, eligibility criteria, endpoints, dosing, safety monitoring, statistical plan. Per 21 CFR 312.23.

Respond with a JSON object containing:
- "docType": one of the 6 types above (exact string)
- "confidence": a number between 0.0 and 1.0 indicating your confidence
- "reasoning": a brief explanation of why you chose this type

If the document does not match any of these 6 types, use the closest match but set confidence below 0.3.`;

  try {
    const result = await claudeJson<{
      docType: string;
      confidence: number;
      reasoning?: string;
    }>({
      systemPrompt,
      userPrompt: truncated,
      maxTokens: 500,
    });

    // Validate the returned docType
    const validTypes = new Set<string>([
      "BATCH_RECORD",
      "CERTIFICATE_OF_ANALYSIS",
      "STABILITY_DATA",
      "TOXICOLOGY_REPORT",
      "PK_STUDY",
      "CLINICAL_PROTOCOL",
    ]);

    const docType = validTypes.has(result.docType)
      ? result.docType
      : "BATCH_RECORD"; // fallback — shouldn't happen with a well-behaved model

    const confidence = typeof result.confidence === "number"
      ? Math.min(1, Math.max(0, Math.round(result.confidence * 100) / 100))
      : 0.5;

    return {
      docType,
      confidence,
      method: "ai",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[BioClassifier] AI classification failed: ${message}`);

    // Return low-confidence fallback rather than throwing — let the pipeline
    // continue and the extraction step will surface validation errors.
    return {
      docType: "BATCH_RECORD",
      confidence: 0.1,
      method: "ai_error",
    };
  }
}
