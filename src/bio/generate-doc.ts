// generate-doc.ts
// AI prose generation for bio IND documents. The AI writes ONLY narrative/prose
// sections — all numbers (DAR, free payload, NOAEL, HED, safety margins) come
// from the rules engine and are injected into the prompt as sacred context.

import type { BioDocumentInput } from "@/bio/templates/types";
import { claudeJson } from "@/lib/claude";
import { getBioRegulatoryReferences, getBioChecklistFull } from "@/bio/compliance";

// ---------------------------------------------------------------------------
// System prompt — shared across all bio doc types
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a senior regulatory affairs specialist with 20+ years of experience preparing FDA IND (Investigational New Drug) submissions for biologics and antibody-drug conjugates (ADCs). You draft production-quality regulatory prose for CTD-format IND modules per ICH M4.

ABSOLUTE RULES — VIOLATION WILL CAUSE CLINICAL HOLD OR IND REFUSAL:
1. NUMBERS ARE SACRED: Use the EXACT DAR, free payload percentages, NOAEL, HED, safety margins, batch potencies, stability timepoints, and dosing parameters provided. Never round, estimate, or invent any number. Every number in the program context MUST appear verbatim in your prose where relevant.
2. CITE SPECIFIC CFR SECTIONS AND ICH GUIDELINES: Reference the actual section (e.g., "per 21 CFR 312.23(a)(7)" not "per FDA regulations"; "per ICH S9 Section 6" not "per ICH guidance"; "per 21 CFR 50.25(a)" not "per informed consent regulations"). Use the regulatory references provided.
3. COMPLETE, PRODUCTION-QUALITY PROSE: Every section must be a complete regulatory narrative as it would appear in an executed IND submission. Do not write summaries, outlines, placeholders, or "[insert data]" markers. Write the actual text.
4. CTD MODULE FORMAT (ICH M4): Follow the Common Technical Document organization. Module 2 = summaries, Module 3 = Quality/CMC, Module 4 = Nonclinical, Module 5 = Clinical.
5. ADC-SPECIFIC SECTIONS: Include ADC-specific sections (DAR characterization, free payload, tissue cross-reactivity, linker stability, ADCC potency) ONLY when drugClass is "ADC" or contains "ADC". For non-ADC biologics, omit these entirely.
6. AFUCOSYLATED ANTIBODY HANDLING: If the antibody is afucosylated, include ADCC potency discussion, CRS monitoring plan (per ASTCT consensus grading), and MAS surveillance. Potency characterization MUST include both cytotoxicity AND ADCC biological assay.
7. PROJECT OPTIMUS COMPLIANCE: For oncology indications, dose optimization must identify Optimal Biological Dose (OBD), not just MTD. Protocol must include randomized parallel dose cohorts per FDA Project Optimus guidance (finalized Aug 2024).
8. THREE-ANALYTE PK (ADC): Per FDA ADC Clinical Pharmacology Guidance, PK sections MUST specify measurement of (1) conjugated ADC, (2) total antibody, and (3) free payload with adequate analytical sensitivity.
9. DIVERSITY (FDORA): Reference FDORA diversity requirements where applicable. Early voluntary DAP submission with IND is recommended.
10. OUTPUT: Respond ONLY with valid JSON matching the requested schema. No commentary, disclaimers, or markdown.`;

// ---------------------------------------------------------------------------
// Context builder — injects ALL program data into prompt
// ---------------------------------------------------------------------------

function buildProgramContext(input: BioDocumentInput): string {
  const isADC = input.drugClass?.toLowerCase().includes("adc");

  let context = `PROGRAM DATA (source of truth — use these exact values):
Drug Name: ${input.drugName}
Drug Class: ${input.drugClass}
Target: ${input.target ?? "Not specified"}
Mechanism of Action: ${input.mechanism ?? "Not specified"}
Indication: ${input.indication ?? "Not specified"}
Phase: ${input.phase ?? "Pre-IND"}
Program Name: ${input.programName}
Sponsor: ${input.sponsorName}
Sponsor Address: ${input.sponsorAddress ?? "Not specified"}
IND Number: ${input.indNumber ?? "To be assigned by FDA"}
NCT Number: ${input.nctNumber ?? "To be assigned upon registration"}
Regulatory Pathway: ${input.regulatoryPathway ?? "Standard IND (21 CFR 312)"}
Document Date: ${new Date(input.generatedAt).toISOString().split("T")[0]}`;

  // ADC-specific fields
  if (isADC) {
    context += `

ADC CHARACTERIZATION:
Antibody Type: ${input.antibodyType ?? "Not specified"}
Linker Type: ${input.linkerType ?? "Not specified"}
Payload Type: ${input.payloadType ?? "Not specified"}
Drug-to-Antibody Ratio (DAR): ${input.dar ?? "Not specified"}`;
    if (input.darSpec) {
      context += `
DAR Specification: ${input.darSpec.target} ± ${input.darSpec.tolerance}`;
    }
  }

  // Extracted data summaries
  if (input.batchData && input.batchData.length > 0) {
    context += `

BATCH MANUFACTURING DATA (${input.batchData.length} batch${input.batchData.length > 1 ? "es" : ""}):
${JSON.stringify(input.batchData, null, 2)}`;
  }

  if (input.stabilityData && Object.keys(input.stabilityData).length > 0) {
    context += `

STABILITY DATA:
${JSON.stringify(input.stabilityData, null, 2)}`;
  }

  if (input.toxData && Object.keys(input.toxData).length > 0) {
    context += `

TOXICOLOGY DATA:
${JSON.stringify(input.toxData, null, 2)}`;
  }

  if (input.pkData && Object.keys(input.pkData).length > 0) {
    context += `

PHARMACOKINETICS DATA:
${JSON.stringify(input.pkData, null, 2)}`;
  }

  if (input.clinicalData && Object.keys(input.clinicalData).length > 0) {
    context += `

CLINICAL DATA:
${JSON.stringify(input.clinicalData, null, 2)}`;
  }

  return context;
}

// ---------------------------------------------------------------------------
// Regulatory references formatter
// ---------------------------------------------------------------------------

function formatRegulatoryRefs(docType: string): string {
  const refs = getBioRegulatoryReferences(docType);
  if (refs.length === 0) return "";

  const lines = refs.map(
    (r) => `  - ${r.regulation}: ${r.description}${r.url ? ` (${r.url})` : ""}`,
  );
  return `\nAPPLICABLE REGULATIONS AND GUIDANCES:\n${lines.join("\n")}\n`;
}

// ---------------------------------------------------------------------------
// Compliance checklist formatter
// ---------------------------------------------------------------------------

function formatChecklist(docType: string, drugClass: string): string {
  const cl = getBioChecklistFull(docType, drugClass);
  if (!cl) return "";

  const required = cl.requiredChecks.map((c) => `  - ${c}`).join("\n");
  const consistency = cl.crossModuleConsistency.map((c) => `  - ${c}`).join("\n");

  return `\nCOMPLIANCE CHECKLIST (your prose MUST satisfy all required checks):
Required:
${required}

Cross-Module Consistency (ensure your prose aligns with these):
${consistency}\n`;
}

// ---------------------------------------------------------------------------
// Per-doc-type prompt builders
// ---------------------------------------------------------------------------

function buildINDModule1Prompt(input: BioDocumentInput): string {
  return `${buildProgramContext(input)}
${formatRegulatoryRefs("ind_module_1")}${formatChecklist("ind_module_1", input.drugClass)}
Generate the prose sections for IND MODULE 1 (Administrative and Prescribing Information). The deterministic sections (Form 1571 fields, table of contents, environmental exclusion claim) are handled by the template. You provide the narrative sections.

The introductory statement must summarize the drug, its pharmacologic class, mechanism of action, proposed indication, and the rationale for clinical investigation per 21 CFR 312.23(a)(3). Include the specific target, the unmet medical need, and why existing therapies are insufficient.

The general investigational plan must describe the planned development program for the next year, including the proposed Phase 1 study design, estimated number of subjects, planned duration, and key milestones per 21 CFR 312.23(a)(3)(iv).${input.drugClass?.toLowerCase().includes("adc") ? " For this ADC, address the three supply chains (mAb, linker-payload, conjugation) and the DAR consistency strategy." : ""}

Return JSON matching this exact schema:
{
  "introductoryStatement": "string — 3-5 paragraph introductory statement per 21 CFR 312.23(a)(3): drug name, class, target, mechanism, indication, disease epidemiology, unmet need, rationale for clinical investigation, and brief summary of key nonclinical findings supporting first-in-human dosing",
  "generalInvestigationalPlan": "string — 2-3 paragraph plan for the next year's development per 21 CFR 312.23(a)(3)(iv): Phase 1 study overview, number of subjects, dose escalation strategy (must reference Project Optimus OBD approach for oncology), key endpoints, manufacturing milestones, and regulatory interaction timeline (pre-IND meeting, IND submission, 30-day review)"
}`;
}

function buildINDModule2Prompt(input: BioDocumentInput): string {
  const isADC = input.drugClass?.toLowerCase().includes("adc");
  return `${buildProgramContext(input)}
${formatRegulatoryRefs("ind_module_2")}${formatChecklist("ind_module_2", input.drugClass)}
Generate the prose sections for IND MODULE 2 (Summaries). This module provides the Quality Overall Summary (QOS), Nonclinical Overview, and Clinical Overview per ICH M4. These summaries synthesize data from Modules 3, 4, and 5 into concise narratives for the FDA reviewer.

For each section, write complete regulatory prose — not bullet points or outlines.${isADC ? `

ADC-SPECIFIC REQUIREMENTS:
- Quality summary must address DAR consistency (${input.dar ?? "target DAR"} ± ${input.darSpec?.tolerance ?? "tolerance"}), free payload limits, and three-component supply chain (mAb, linker-payload, conjugation)
- Nonclinical overview must address tissue cross-reactivity in the context of the target antigen
- Starting dose justification must derive HED from NOAEL using FDA-recommended body surface area conversion. For oncology: use 1/6 the HNSTD per ICH S9 Section 8. For non-oncology biologics: apply a 10-fold safety factor per FDA 2005 Guidance
- If antibody is afucosylated, safety margin analysis must account for enhanced ADCC and CRS risk` : ""}

Return JSON matching this exact schema:
{
  "qualitySummary": "string — Quality Overall Summary per ICH M4Q: drug substance description, manufacturing process overview, critical quality attributes, release specifications, stability profile, and control strategy. For ADCs: DAR, free payload, potency assay strategy (cytotoxicity + ADCC if afucosylated)",
  "nonclinicalOverview": "string — Nonclinical Overview per ICH M4S: pharmacology (primary and secondary), pharmacokinetics (ADME), toxicology summary (GLP studies, species, duration, key findings, NOAEL), safety pharmacology (cardiovascular, respiratory, CNS). For ADCs: tissue cross-reactivity, DAR in tox species, free payload toxicity",
  "clinicalOverview": "string — Clinical Overview per ICH M4E: clinical development rationale, Phase 1 study design synopsis, dose escalation strategy, primary/secondary endpoints, PK sampling plan. For ADCs: three-analyte PK plan per FDA guidance",
  "startingDoseJustification": "string — Starting dose derivation per ICH S9/S6(R1): NOAEL from most sensitive species, HED calculation (body surface area conversion using species Km factors per FDA 2005 Guidance), safety factor applied (1/6 HNSTD for oncology per ICH S9 Section 8, or 1/10 HED for non-oncology per FDA 2005 Guidance), justification for selected starting dose, comparison to pharmacologically active dose in animal models",
  "safetyMarginAnalysis": "string — Safety margin analysis: therapeutic index estimation, comparison of human equivalent exposures to nonclinical NOAEL exposures, discussion of dose-limiting toxicities observed in animal studies, relevance to predicted human pharmacology. For afucosylated ADCs: additional margin considerations for CRS/immune-mediated toxicity"
}`;
}

function buildINDModule3Prompt(input: BioDocumentInput): string {
  const isADC = input.drugClass?.toLowerCase().includes("adc");
  return `${buildProgramContext(input)}
${formatRegulatoryRefs("ind_module_3")}${formatChecklist("ind_module_3", input.drugClass)}
Generate the prose sections for IND MODULE 3 (Quality / CMC). This module contains the Chemistry, Manufacturing, and Controls information per 21 CFR 312.23(a)(7) and ICH M4Q(R1). Write complete regulatory prose for each section.${isADC ? `

ADC-SPECIFIC CMC REQUIREMENTS:
- Manufacturing must describe three supply chains: (1) antibody drug substance, (2) linker-payload intermediate, (3) conjugation to final drug product
- DAR must be characterized with specification: ${input.dar ?? "target"} ± ${input.darSpec?.tolerance ?? "tolerance"}
- Free unconjugated payload must have strict release limit
- Potency assay must include cytotoxicity assay${input.antibodyType?.toLowerCase().includes("afucosylat") ? " AND validated ADCC biological assay (afucosylated antibody)" : ""}
- Per FDA ADC Clinical Pharmacology Guidance: demonstrate DAR consistency across batches` : ""}

Return JSON matching this exact schema:
{
  "manufacturingProcessDescription": "string — Manufacturing process description per ICH M4Q: cell line development, upstream process (bioreactor), downstream purification, formulation, fill-finish. For ADCs: additionally describe linker-payload synthesis, conjugation chemistry, conjugation process controls, and drug product (final ADC) manufacturing. Reference batch data provided",
  "controlStrategy": "string — Control strategy per ICH Q6B: critical quality attributes (CQAs), in-process controls, release specifications (identity, purity, potency, sterility, endotoxin), reference standard qualification. For ADCs: DAR specification and testing method (e.g., HIC, RP-HPLC), free payload limit and testing (LC-MS/MS), aggregation (SEC-HPLC), potency assay details",
  "stabilityConclusions": "string — Stability data summary per ICH Q5C: conditions tested (2-8°C, 25°C/60%RH, 40°C/75%RH), timepoints, attributes monitored (potency, purity, aggregation, pH, particulates), trends observed, proposed shelf life and storage conditions. For ADCs: linker stability under storage conditions, DAR drift, free payload accumulation over time. Reference stability data provided",
  "impurityProfile": "string — Impurity characterization: process-related impurities (HCP, residual DNA, Protein A), product-related impurities (aggregates, fragments, charge variants, oxidation). For ADCs: unconjugated antibody (DAR-0), free payload, quenched linker, small-molecule impurities from conjugation. Specification limits and analytical methods for each"
}`;
}

function buildINDModule4Prompt(input: BioDocumentInput): string {
  const isADC = input.drugClass?.toLowerCase().includes("adc");
  return `${buildProgramContext(input)}
${formatRegulatoryRefs("ind_module_4")}${formatChecklist("ind_module_4", input.drugClass)}
Generate the prose sections for IND MODULE 4 (Nonclinical Study Reports). This module contains the pharmacology and toxicology narratives per 21 CFR 312.23(a)(8) and ICH S9/S6(R1). Write complete regulatory narratives for each section.

Species selection must be justified per ICH S6(R1) — tox species must express the target antigen with similar tissue distribution to humans. GLP-compliant pivotal studies per 21 CFR Part 58 are required.${isADC ? `

ADC-SPECIFIC NONCLINICAL REQUIREMENTS:
- Toxicology must address both antibody-mediated and payload-mediated toxicity separately
- PK narrative must describe catabolism (not just clearance) — ADC-specific PK includes deconjugation kinetics
- Tissue cross-reactivity (TCR) study is critical for target antigen expressed on normal tissues
- DAR in tox species must be characterized and compared to clinical material
- If afucosylated: ADCC-mediated toxicity must be discussed, including on-target/off-tumor risk` : ""}

Return JSON matching this exact schema:
{
  "toxicologyNarrative": "string — Toxicology study narrative per ICH S9: GLP study design (species, route, doses, duration, recovery), dose-limiting toxicities, target organ toxicity, NOAEL determination, dose-response relationship, reversibility of findings. Reference tox data provided. For ADCs: distinguish on-target (antibody-mediated) vs off-target (payload-mediated) toxicity",
  "pharmacologyNarrative": "string — Primary and secondary pharmacology per ICH S6(R1): in vitro binding affinity and selectivity, in vivo efficacy models (tumor models for oncology), mechanism of action confirmation, dose-response in efficacy models. For ADCs: ADCC/CDC assessment, internalization kinetics, bystander killing evaluation",
  "pkNarrative": "string — Nonclinical pharmacokinetics per ICH S6(R1): absorption (bioavailability by route), distribution (tissue distribution, FcRn-mediated recycling), metabolism/catabolism, excretion, dose-linearity assessment, immunogenicity (ADA) and impact on PK. For ADCs: three-analyte PK (conjugated ADC, total antibody, free payload), deconjugation rate, DAR kinetics in vivo",
  "safetyPharmacologyNarrative": "string — Safety pharmacology per ICH S7A: cardiovascular assessment (hERG, telemetry), respiratory function, CNS evaluation. For biologics: often addressed within repeat-dose tox studies per ICH S6(R1) rather than standalone studies — justify approach"${isADC ? `,
  "tissueCrossReactivityNarrative": "string — Tissue cross-reactivity (TCR) study per ICH S6(R1): panel of normal human tissues tested, specific binding pattern, comparison to target expression profile, implications for on-target/off-tumor toxicity risk. Must address any normal tissues with target expression (e.g., mucosal epithelium) and clinical monitoring implications",
  "darCharacterizationNarrative": "string — DAR characterization in tox species: DAR of material used in GLP studies, comparison to clinical material DAR specification, in vivo DAR stability (deconjugation kinetics in tox species vs expected human), impact of DAR differences on toxicity interpretation"` : ""}
}`;
}

function buildINDModule5Prompt(input: BioDocumentInput): string {
  const isADC = input.drugClass?.toLowerCase().includes("adc");
  const isAfucosylated = input.antibodyType?.toLowerCase().includes("afucosylat");
  return `${buildProgramContext(input)}
${formatRegulatoryRefs("ind_module_5")}${formatChecklist("ind_module_5", input.drugClass)}
Generate the prose sections for IND MODULE 5 (Clinical Study Information). This module contains the clinical protocol summary and Investigator's Brochure reference per 21 CFR 312.23(a)(6). Write complete regulatory narratives.

CRITICAL — PROJECT OPTIMUS COMPLIANCE: For oncology indications, dose escalation must identify Optimal Biological Dose (OBD), not just Maximum Tolerated Dose (MTD). Protocol must include randomized parallel dose cohorts or backfill/expansion strategy to compare at least two dose levels per FDA Project Optimus guidance. A 3+3 design alone is NOT sufficient.

FDORA DIVERSITY: Reference the Diversity Action Plan requirement. Early voluntary submission with IND is recommended per FDORA Section 3602.${isADC ? `

ADC-SPECIFIC CLINICAL REQUIREMENTS:
- PK sampling must measure three analytes per FDA ADC Clinical Pharmacology Guidance: (1) conjugated ADC, (2) total antibody, (3) free payload
- Analytical methods must have adequate sensitivity or FDA may issue Clinical Hold
- Immunogenicity (ADA) assessment is mandatory` : ""}${isAfucosylated ? `

AFUCOSYLATED ANTIBODY CLINICAL REQUIREMENTS:
- CRS monitoring plan is MANDATORY per ASTCT consensus grading (Grade 1-4)
- Must include tocilizumab availability and CRS management algorithm
- MAS (Macrophage Activation Syndrome) surveillance protocol required
- On-target/off-tumor monitoring for tissues expressing the target antigen` : ""}

Return JSON matching this exact schema:
{
  "studyRationale": "string — Study rationale per 21 CFR 312.23(a)(6): scientific rationale linking nonclinical data to clinical hypothesis, unmet medical need quantification, therapeutic landscape analysis (approved therapies, their limitations), differentiation of this drug, and why the proposed patient population is appropriate for first-in-human study",
  "safetyMonitoringPlan": "string — Safety monitoring plan: dose-limiting toxicity (DLT) definitions and evaluation window, Safety Review Committee (SRC) composition and charter, dose escalation decision rules (modified Fibonacci or Bayesian), stopping rules, SAE/SUSAR reporting per 21 CFR 312.32 (15-day and 7-day reports), DSMB involvement if applicable. For ADCs: specific monitoring for payload-class toxicities. For afucosylated: CRS grading per ASTCT, CRS management algorithm, MAS surveillance",
  "statisticalApproach": "string — Statistical methods per ICH E9(R1): sample size justification for Phase 1 (dose escalation + expansion), dose-escalation model (BOIN, CRM, or i3+3 — NOT traditional 3+3 alone per Project Optimus), DLT rate estimation, PK parameter estimation approach, interim analysis plan, estimand framework for primary and secondary endpoints"${isAfucosylated ? `,
  "crsMonitoringPlan": "string — CRS Monitoring Plan (MANDATORY for afucosylated antibody): CRS grading criteria per ASTCT consensus (Grade 1: fever only; Grade 2: fever + hypotension responding to fluids or hypoxia requiring low-flow O2; Grade 3: hypotension requiring vasopressors or hypoxia requiring high-flow O2; Grade 4: life-threatening), pre-medication protocol, tocilizumab dosing algorithm (8 mg/kg IV, max 800 mg, repeat q8h x3 if needed), corticosteroid escalation pathway, ICU transfer criteria, CRS biomarker monitoring (IL-6, CRP, ferritin), MAS differentiation criteria"` : ""},
  "diversityPlanNarrative": "string — Diversity plan summary per FDORA Section 3602: enrollment goals by race/ethnicity reflecting disease epidemiology, eligibility criteria review to remove unnecessary barriers, site selection strategy emphasizing diverse geographies and community sites, language access plan, and voluntary early submission rationale"
}`;
}

function buildInvestigatorBrochurePrompt(input: BioDocumentInput): string {
  const isADC = input.drugClass?.toLowerCase().includes("adc");
  const isAfucosylated = input.antibodyType?.toLowerCase().includes("afucosylat");
  return `${buildProgramContext(input)}
${formatRegulatoryRefs("investigator_brochure")}${formatChecklist("investigator_brochure", input.drugClass)}
Generate the prose sections for the INVESTIGATOR'S BROCHURE (IB) per 21 CFR 312.23(a)(5) and ICH E6(R2) Section 7. The IB is the primary safety document given to clinical investigators. Write comprehensive, production-quality narratives.

The IB must provide investigators with sufficient information to:
1. Understand the rationale for the proposed study
2. Make informed risk/benefit assessments for study participants
3. Manage adverse events with specific guidance${isADC ? `

ADC-SPECIFIC IB REQUIREMENTS:
- Drug description must explain the ADC construct: antibody, linker, payload, and conjugation
- Safety profile must address both antibody-mediated and payload-mediated toxicities
- Dosing rationale must reference three-analyte PK (conjugated ADC, total antibody, free payload)
- If DAR = ${input.dar ?? "target"}: explain clinical significance of DAR for efficacy and safety` : ""}

Return JSON matching this exact schema:
{
  "drugDescription": "string — Comprehensive drug description per ICH E6(R2) Section 7: drug name, structural description (for biologics: molecular weight, glycosylation, post-translational modifications), pharmacologic class, mechanism of action, target biology, and rationale for development. For ADCs: describe each component (antibody, linker type, payload class and mechanism), conjugation chemistry, average DAR and specification",
  "nonclinicalSummary": "string — Nonclinical data summary for investigators: key pharmacology findings (binding affinity, selectivity, in vivo efficacy), toxicology highlights (species, NOAEL, target organ toxicities, reversibility), PK summary (half-life, clearance, distribution). Presented in clinician-friendly language, not raw data tables",
  "safetyProfile": "string — Known and anticipated safety risks: toxicities observed in nonclinical studies mapped to potential clinical manifestations, class-effect risks (for the drug class and mechanism), anticipated dose-limiting toxicities, organ systems requiring monitoring (labs, imaging, clinical assessments), and recommended monitoring schedule",
  "riskManagement": "string — Risk management guidance for investigators: specific adverse event management algorithms, dose modification guidelines (hold, reduce, discontinue criteria), concomitant medication restrictions, contraindications, special populations considerations (hepatic/renal impairment, elderly, reproductive toxicity), and when to contact the sponsor medical monitor",
  "dosingRationale": "string — Dosing rationale: starting dose derivation (NOAEL → HED → safety factor → proposed dose), dose escalation scheme, route and schedule justification, PK-based rationale for dosing interval, projected therapeutic window based on nonclinical efficacy data"${isADC ? `,
  "payloadToxicityProfile": "string — Payload-specific toxicity profile: known toxicities of the payload class (e.g., microtubule inhibitors: neutropenia, neuropathy; topoisomerase inhibitors: diarrhea, neutropenia), free payload contribution to systemic toxicity, expected payload-driven DLTs, monitoring recommendations specific to payload class"` : ""}${isAfucosylated ? `,
  "adccMechanism": "string — ADCC mechanism and clinical implications: explanation of afucosylation and enhanced FcγRIIIa binding, ADCC as a dual mechanism of action (immune-mediated killing + payload delivery), CRS risk and management (reference ASTCT grading), impact on dosing strategy, and how ADCC potency is measured in release testing"` : ""}${isADC ? `,
  "freePayloadRisk": "string — Free payload risk assessment: sources of free payload (manufacturing residual, in vivo deconjugation, target-mediated catabolism), relationship between free payload levels and systemic toxicity, manufacturing controls to minimize free payload, clinical monitoring for payload-specific toxicities unrelated to target engagement"` : ""}
}`;
}

function buildClinicalProtocolPrompt(input: BioDocumentInput): string {
  const isADC = input.drugClass?.toLowerCase().includes("adc");
  return `${buildProgramContext(input)}
${formatRegulatoryRefs("clinical_protocol")}${formatChecklist("clinical_protocol", input.drugClass)}
Generate the prose sections for the CLINICAL PROTOCOL per 21 CFR 312.23(a)(6) and ICH E6(R2). This is the Phase 1 first-in-human study protocol. Write complete regulatory prose for each section.

CRITICAL — PROJECT OPTIMUS: The dose escalation design must comply with FDA Project Optimus guidance:
- Must identify Optimal Biological Dose (OBD), not just Maximum Tolerated Dose (MTD)
- Traditional 3+3 design alone is NOT sufficient
- Must include backfill or expansion cohort strategy to compare at least two dose levels
- Must evaluate dose-response for both efficacy biomarkers and toxicity

FDORA: Protocol must reference diversity enrollment goals per FDORA Section 3602.${isADC ? `

ADC-SPECIFIC PROTOCOL REQUIREMENTS:
- PK sampling for three analytes: conjugated ADC, total antibody, free payload (per FDA ADC Clinical Pharmacology Guidance)
- Immunogenicity (ADA) assessment schedule
- DAR pharmacokinetics (in vivo DAR decline characterization)` : ""}

Return JSON matching this exact schema:
{
  "backgroundRationale": "string — Background and rationale per ICH E6(R2): disease epidemiology and burden, current standard of care and its limitations, target biology and validation, drug mechanism of action, key nonclinical data supporting clinical investigation (efficacy models, toxicology, PK), and rationale for the proposed patient population",
  "studyDesignRationale": "string — Study design rationale: Phase 1 open-label, dose-escalation + dose-expansion design. Dose escalation model (BOIN, CRM, or i3+3 — per Project Optimus, NOT traditional 3+3 alone), number of planned dose levels, starting dose and justification, dose increment rationale, DLT evaluation window, planned expansion cohorts at ≥2 dose levels to characterize OBD. For ADCs: address three-analyte PK sampling schedule and immunogenicity assessment timepoints",
  "safetyMonitoringPlan": "string — Safety monitoring: DLT definitions (specific adverse events, grade thresholds, attribution, evaluation window), Safety Review Committee (SRC) review schedule and escalation decision process, stopping rules for excessive toxicity, SAE/SUSAR reporting timelines per 21 CFR 312.32, DSMB charter if applicable, specific monitoring requirements for drug-class toxicities (labs, imaging, clinical assessments, and frequency)",
  "statisticalMethods": "string — Statistical methods per ICH E9(R1): sample size justification (dose escalation: target toxicity probability; expansion: precision-based), dose-escalation model parameters and decision rules, DLT rate estimation with confidence intervals, PK parameter estimation (non-compartmental + population PK if planned), futility analysis for expansion cohorts, estimand framework",
  "ethicalConsiderations": "string — Ethical considerations: informed consent process per 21 CFR 50, IRB oversight per 21 CFR 56, risk-benefit assessment for first-in-human study, vulnerable population protections if applicable, data and safety monitoring provisions, participant compensation, insurance/indemnification for research-related injury, and trial registration on ClinicalTrials.gov"
}`;
}

function buildPreINDBriefingPrompt(input: BioDocumentInput): string {
  const isADC = input.drugClass?.toLowerCase().includes("adc");
  return `${buildProgramContext(input)}
${formatRegulatoryRefs("pre_ind_briefing")}${formatChecklist("pre_ind_briefing", input.drugClass)}
Generate the prose sections for a PRE-IND BRIEFING BOOK per 21 CFR 312.82 and FDA Guidance on Formal Meetings (2017). This document is sent to FDA ≥30 days before the pre-IND meeting. Questions should be formatted as yes/no or specific-answer questions per FDA guidance.

The briefing book summarizes the entire IND package and poses specific questions to FDA to resolve before filing.${isADC ? `

ADC-SPECIFIC PRE-IND QUESTIONS should address:
- Acceptability of tox species (target antigen expression)
- DAR specification and manufacturing controls
- Three-analyte PK strategy adequacy
- Starting dose derivation approach
- CRS monitoring plan adequacy (if afucosylated)` : ""}

Return JSON matching this exact schema:
{
  "executiveSummary": "string — Executive summary: drug name, class, target, mechanism, indication, development stage, purpose of the pre-IND meeting, and key questions for FDA. Written as a 2-3 paragraph overview that orients the FDA review division",
  "cmcSummary": "string — CMC summary for pre-IND: manufacturing process overview, analytical characterization status, release testing panel, stability data available, supply strategy for Phase 1. For ADCs: DAR specification and testing, free payload limits, potency assay strategy (cytotoxicity + ADCC if afucosylated)",
  "nonclinicalSummary": "string — Nonclinical summary for pre-IND: completed and planned studies, species justification, key toxicology findings (NOAEL, target organ toxicity), PK data, starting dose derivation, safety margin. For ADCs: tissue cross-reactivity results, in vivo DAR characterization",
  "clinicalPlanSummary": "string — Clinical plan summary: Phase 1 design (dose escalation model, dose levels, expansion), patient population, key endpoints, PK sampling strategy, safety monitoring plan, projected enrollment and timeline. Reference Project Optimus OBD approach",
  "fdaQuestions": ["array of 5-8 strings — each is a specific question for FDA, formatted as yes/no or specific-answer per FDA guidance. Questions should address the most critical regulatory uncertainties: tox species acceptability, starting dose adequacy, dose escalation design, CMC controls, PK strategy, and any drug-class-specific concerns"]
}`;
}

function buildInformedConsentPrompt(input: BioDocumentInput): string {
  const isADC = input.drugClass?.toLowerCase().includes("adc");
  return `${buildProgramContext(input)}
${formatRegulatoryRefs("informed_consent")}${formatChecklist("informed_consent", input.drugClass)}
Generate the prose sections for an INFORMED CONSENT FORM (ICF) per 21 CFR 50.25 and ICH E6(R2) Section 4.8. ALL text MUST be written at an 8th grade reading level (Flesch-Kincaid Grade Level ≤ 8.0). Use simple words, short sentences, and avoid medical jargon — when medical terms are necessary, define them in plain language immediately.

The ICF must contain all required elements per 21 CFR 50.25(a) and additional elements per 21 CFR 50.25(b) that are applicable. It must be understandable by a lay person.${isADC ? `

ADC-SPECIFIC CONSENT REQUIREMENTS:
- Explain the drug in simple terms: "a medicine made of an antibody (a protein that finds cancer cells) attached to a cell-killing drug"
- Risks must include both antibody-related and drug-related side effects
- If afucosylated: explain CRS risk in plain language ("your immune system may become very active, causing fever and other symptoms")` : ""}

Return JSON matching this exact schema:
{
  "studyPurpose": "string — Study purpose in lay language: what the drug is, what it is being tested for, why this study is being done, that this is research (not standard treatment), the phase of the study, and approximately how many people will participate. Must be understandable by someone with no medical background",
  "procedures": "string — Study procedures in lay language: what will happen at each visit (screening, treatment, follow-up), how the drug is given (IV, injection, pill), how often and for how long, what tests will be done (blood draws, scans, physical exams) and why, how long participation lasts, and what happens at end of study",
  "risks": "string — Risks in lay language: known and possible side effects organized by how common they are (very common, common, less common, rare), specific risks of this drug class, risks of study procedures (blood draws, scans), reproductive risks and contraception requirements, unknown risks statement. For ADCs: payload-specific risks in plain terms. For afucosylated: CRS explanation in plain language with symptoms to watch for",
  "benefits": "string — Benefits in lay language: possible benefits (the drug might help treat the cancer, might not help directly but information gained may help others), statement that there is no guarantee of benefit, this is research and the purpose is to learn about the drug",
  "alternatives": "string — Alternatives in lay language: other treatment options available (approved therapies, other clinical trials, no treatment/supportive care), statement that participation is voluntary and the patient can receive standard treatment instead",
  "confidentiality": "string — Confidentiality in lay language: how personal information is protected, who can see medical records (study team, sponsor, FDA, IRB), use of coded identifiers, HIPAA authorization reference, how data is stored and for how long, what happens to samples after the study"
}`;
}

function buildDiversityActionPlanPrompt(input: BioDocumentInput): string {
  return `${buildProgramContext(input)}
${formatRegulatoryRefs("diversity_action_plan")}${formatChecklist("diversity_action_plan", input.drugClass)}
Generate the prose sections for a DIVERSITY ACTION PLAN (DAP) per FDORA Section 3602 and FDA Draft Guidance on Diversity Plans (2024). While not required until Phase 3/pivotal, early voluntary submission with IND demonstrates sponsor commitment and may inform Phase 1 site selection.

The DAP must address enrollment of participants from underrepresented racial and ethnic populations, and should include specific, measurable goals. The disease epidemiology should drive enrollment targets — if the disease disproportionately affects certain populations, enrollment should reflect that.

Return JSON matching this exact schema:
{
  "epidemiologySummary": "string — Disease epidemiology by race/ethnicity per FDORA: incidence and prevalence data by racial/ethnic group for ${input.indication ?? "the target indication"}, disparities in diagnosis, treatment access, and outcomes, populations disproportionately affected, geographic distribution of disease burden, and how these data inform enrollment goals",
  "recruitmentStrategy": "string — Recruitment strategy: specific enrollment targets by race/ethnicity (with percentages reflecting disease epidemiology), eligibility criteria review to identify and remove unnecessary barriers to diverse enrollment (e.g., overly restrictive organ function requirements, English-only requirement, transportation barriers), multi-language recruitment materials, and partnerships with community-based clinical sites",
  "communityEngagement": "string — Community engagement plan: partnerships with community organizations, patient advocacy groups, and community health centers serving underrepresented populations, community advisory board composition and role, culturally appropriate education materials, community feedback mechanisms, and plan for sharing trial results with participating communities",
  "accommodations": "string — Accommodations to reduce barriers: transportation assistance or reimbursement, flexible scheduling (including evening/weekend visits), telemedicine options for follow-up visits where safety permits, childcare support, language interpretation services, culturally competent study staff training, decentralized trial elements (local labs, home nursing for select procedures), and financial burden mitigation (parking, meal vouchers)"
}`;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function generateBioDocProse(
  docType: string,
  input: BioDocumentInput,
  feedback?: string,
): Promise<Record<string, unknown>> {
  // fda_form_1571 is zero-AI — deterministic template only
  if (docType === "fda_form_1571") {
    return {};
  }

  const supportedTypes: Record<string, (i: BioDocumentInput) => string> = {
    ind_module_1: buildINDModule1Prompt,
    ind_module_2: buildINDModule2Prompt,
    ind_module_3: buildINDModule3Prompt,
    ind_module_4: buildINDModule4Prompt,
    ind_module_5: buildINDModule5Prompt,
    investigator_brochure: buildInvestigatorBrochurePrompt,
    clinical_protocol: buildClinicalProtocolPrompt,
    pre_ind_briefing: buildPreINDBriefingPrompt,
    informed_consent: buildInformedConsentPrompt,
    diversity_action_plan: buildDiversityActionPlanPrompt,
  };

  const promptBuilder = supportedTypes[docType];
  if (!promptBuilder) {
    console.warn(`[Bio] Unknown doc type for prose generation: ${docType}`);
    return {};
  }

  try {
    // Module 4, Module 5, IB, and Clinical Protocol need more tokens due to
    // multiple long narrative sections and ADC-specific optional fields
    const complexTypes = new Set([
      "ind_module_4",
      "ind_module_5",
      "investigator_brochure",
      "clinical_protocol",
      "ind_module_2",
    ]);
    const maxTokens = complexTypes.has(docType) ? 6000 : 4000;

    let userPrompt = promptBuilder(input);

    // If feedback from compliance review is provided, append corrections
    if (feedback) {
      userPrompt += `\n\n=== MANDATORY CORRECTIONS ===\nA regulatory compliance review of your previous draft found the following deficiencies. You MUST fix ALL of them in this revision. Do not repeat these mistakes.\n\n${feedback}`;
    }

    const prose = await claudeJson<Record<string, unknown>>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens,
    });

    return prose;
  } catch (error) {
    console.error(
      `[Bio] AI prose generation failed for ${docType}:`,
      error,
    );
    return {};
  }
}
