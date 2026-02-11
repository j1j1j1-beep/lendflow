// generate-doc.ts
// AI prose generation for loan documents. Claude writes ONLY prose sections —
// all numbers are injected into the prompt as context so Claude writes around
// them but never invents numbers.

import type {
  DocumentInput,
  AiDocProse,
} from "@/documents/types";
import {
  formatCurrency,
  formatCurrencyDetailed,
  formatPercent,
  formatDate,
  numberToWords,
} from "@/documents/doc-helpers";
import { claudeJson } from "@/lib/claude";
import { getLegalReferences } from "./legal-references";

// Shared deal context builder — injects ALL numbers into prompt

function buildDealContext(input: DocumentInput): string {
  const ratePercent = (input.terms.interestRate * 100).toFixed(3);
  const termYears = (input.terms.termMonths / 12).toFixed(1);
  const amortYears = (input.terms.amortizationMonths / 12).toFixed(1);

  const feesBlock = input.terms.fees
    .map((f) => `  - ${f.name}: ${formatCurrency(f.amount)} (${f.description})`)
    .join("\n");

  const covenantsBlock = input.terms.covenants
    .map(
      (c) =>
        `  - ${c.name}: ${c.description}${c.threshold !== undefined ? ` (threshold: ${c.threshold})` : ""} [${c.frequency}]`,
    )
    .join("\n");

  const conditionsBlock = input.terms.conditions
    .map((c) => `  - [${c.category}] ${c.description} (${c.priority})`)
    .join("\n");

  const specialTermsBlock = input.terms.specialTerms
    ? input.terms.specialTerms.map((s) => {
        // Handle both SpecialTerm objects and plain strings
        if (typeof s === "string") return `  - ${s}`;
        return `  - ${s.title}: ${s.description}`;
      }).join("\n")
    : "  None";

  return `DEAL TERMS (source of truth — use these exact numbers):
Borrower: ${input.borrowerName}
Loan Program: ${input.programName} (${input.programCategory})
Loan Purpose: ${input.loanPurpose ?? "General commercial purposes"}
Property/Collateral: ${input.propertyAddress ?? "As described in security agreement"}
State: ${input.stateAbbr ?? "Not specified"}

Principal Amount: ${formatCurrency(input.terms.approvedAmount)} (${numberToWords(input.terms.approvedAmount)} dollars)
Interest Rate: ${ratePercent}% per annum (${input.terms.baseRateType} ${(input.terms.baseRateValue * 100).toFixed(2)}% + ${(input.terms.spread * 100).toFixed(3)}% spread)
Term: ${input.terms.termMonths} months (${termYears} years)
Amortization: ${input.terms.amortizationMonths} months (${amortYears} years)
Monthly Payment: ${formatCurrencyDetailed(input.terms.monthlyPayment)}
LTV: ${input.terms.ltv ? (input.terms.ltv * 100).toFixed(1) + "%" : "N/A"}
Interest Only: ${input.terms.interestOnly ? "Yes" : "No"}
Prepayment Penalty: ${input.terms.prepaymentPenalty ? "Yes" : "No"}
Personal Guaranty Required: ${input.terms.personalGuaranty ? "Yes" : "No"}
Requires Appraisal: ${input.terms.requiresAppraisal ? "Yes" : "No"}
Late Fee: ${(input.terms.lateFeePercent * 100).toFixed(1)}% after ${input.terms.lateFeeGraceDays} day grace period
Lender Name: ${input.lenderName ?? "Not specified"}
Guarantor: ${input.guarantorName ?? "None"}
Entity Type: ${input.entityType ?? "Not specified"}
Subordinate Creditor: ${input.subordinateCreditorName ?? "None"}
Second Lien Lender: ${input.secondLienLenderName ?? "None"}

Maturity Date: ${formatDate(input.maturityDate)}
First Payment Date: ${formatDate(input.firstPaymentDate)}
Document Date: ${formatDate(input.generatedAt)}

Collateral Types: ${input.collateralTypes.join(", ")}

FEES:
${feesBlock || "  None"}

COVENANTS:
${covenantsBlock || "  None"}

CONDITIONS:
${conditionsBlock || "  None"}

SPECIAL TERMS:
${specialTermsBlock}`;
}

// System prompt (shared for all doc types)

const SYSTEM_PROMPT = `You are a senior commercial lending attorney with 20+ years of experience at a top-tier law firm. You draft enforceable, production-ready loan document prose for institutional lenders. Your documents must withstand judicial scrutiny and regulatory examination.

ABSOLUTE RULES — VIOLATION OF ANY RULE MAKES THE DOCUMENT UNENFORCEABLE:
1. NUMBERS ARE SACRED: Use the EXACT dollar amounts, interest rates, fees, dates, term lengths, and percentages provided. Never round, estimate, approximate, or omit any number. Every number in the deal terms MUST appear verbatim in your prose where relevant.
2. CITE SPECIFIC STATUTES: When referencing laws, cite the actual section number (e.g., "pursuant to UCC §9-610(b)" not "under the UCC"; "as defined in 42 U.S.C. §9601(14)" not "under CERCLA"). Use the statutory text provided in the legal references.
3. COMPLETE PROVISIONS: Every section must be a complete, standalone legal provision. Do not write summaries, outlines, or placeholders. Write the actual clause as it would appear in an executed document.
4. ENFORCEABILITY REQUIREMENTS:
   - Every waiver must be explicit and specific (courts do not enforce general waivers)
   - Default provisions must include specific cure periods and notice requirements
   - Governing law must specify the exact state, include conflict-of-laws exclusion, and specify federal/state court venue
   - Jury trial waivers must be conspicuous and mutual
   - Severability clauses must include reformation language
5. STATE-SPECIFIC COMPLIANCE: If a state is provided, your prose must comply with that state's:
   - Usury limits and usury savings clause requirements
   - Notice requirements for acceleration and foreclosure
   - Anti-deficiency protections if applicable
   - Consumer protection statutes that apply to commercial loans
6. STANDARD OF CARE: Write as if this document will be:
   - Reviewed by opposing counsel before execution
   - Examined by bank regulators during an audit
   - Tested in litigation if the borrower defaults
7. OUTPUT: Respond ONLY with valid JSON matching the requested schema. No commentary, disclaimers, or template language.

AI-GENERATED CONTENT DISCLAIMER AND FAIR LENDING COMPLIANCE:
This AI-generated content is for document drafting assistance only and does not constitute legal advice. The output must not be used as the sole basis for credit decisions. All credit decisions must comply with the Equal Credit Opportunity Act (ECOA, 15 U.S.C. Section 1691 et seq.), the Fair Housing Act (42 U.S.C. Section 3601 et seq.), and all applicable federal and state fair lending laws and regulations. This platform does not make, recommend, or influence credit approval or denial decisions. The generated documents must be reviewed by qualified legal counsel before execution. Do not include any language in the generated prose that could be construed as a credit decision, credit recommendation, or assessment of borrower creditworthiness.`;

// Per-doc-type prompt builders

function buildPromissoryNotePrompt(input: DocumentInput): string {
  const refs = getLegalReferences("promissory_note", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a PROMISSORY NOTE. The deterministic sections (principal amount, payment schedule, interest rate) are handled by the template. You provide the legal clauses. Include a usury savings clause providing that the interest rate shall not exceed the maximum rate permitted by applicable law, and any excess shall be credited against principal.

Return JSON matching this exact schema:
{
  "defaultProvisions": "string — describe events of default including failure to pay, breach of covenants, bankruptcy, material adverse change, cross-default provisions",
  "accelerationClause": "string — clause allowing lender to declare full balance due upon default, including notice requirements",
  "lateFeeProvision": "string — late payment penalty terms, grace period, calculation method",
  "waiverProvisions": "string — borrower waivers (presentment, demand, protest, notice of dishonor, etc.)",
  "governingLawClause": "string — governing law, jurisdiction, venue, jury trial waiver",
  "miscellaneousProvisions": "string — severability, amendments, successors and assigns, entire agreement"
}`;
}

function buildLoanAgreementPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("loan_agreement", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a LOAN AGREEMENT. The deterministic sections (definitions, key terms table, payment mechanics) are handled by the template. You provide the legal clauses.

Return JSON matching this exact schema:
{
  "recitals": "string — WHEREAS clauses establishing the purpose and parties",
  "representations": ["array of strings — each is a borrower representation and warranty (financial statements accurate, no litigation, authority to execute, compliance with laws, etc.)"],
  "eventsOfDefault": ["array of strings — each is an event of default (payment default, covenant breach, cross-default, bankruptcy, judgment, material adverse change, etc.)"],
  "remediesOnDefault": "string — lender remedies upon event of default including acceleration, setoff, collection costs",
  "waiverAndAmendment": "string — amendment requirements (written consent), waiver not constituting future waiver",
  "noticeProvisions": "string — notice delivery requirements (written, addresses, deemed receipt)",
  "miscellaneous": "string — severability, counterparts, entire agreement, no third-party beneficiaries",
  "governingLaw": "string — governing law, jurisdiction, venue, jury trial waiver"
}`;
}

function buildSecurityAgreementPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("security_agreement", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a SECURITY AGREEMENT. The deterministic sections (parties, secured obligations reference) are handled by the template. You provide the legal clauses.

Return JSON matching this exact schema:
{
  "collateralDescription": "string — comprehensive description of collateral using the specific UCC Article 9 §9-108 categories provided in the legal references — must reasonably identify the collateral without being supergeneric",
  "perfectionLanguage": "string — how the security interest is perfected (UCC filing, possession, control agreements)",
  "representationsAndWarranties": ["array of strings — each is a grantor representation about the collateral (ownership, no prior liens, location, insurance, etc.)"],
  "remediesOnDefault": "string — secured party remedies upon default under UCC Article 9 (take possession, dispose of collateral, collect receivables)",
  "dispositionOfCollateral": "string — commercially reasonable disposition requirements, notice periods, application of proceeds",
  "governingLaw": "string — governing law and jurisdiction"
}`;
}

function buildGuarantyPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("guaranty", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a GUARANTY AGREEMENT. This is a ${input.terms.personalGuaranty ? "full personal" : "limited"} guaranty. The deterministic sections (parties, guaranteed amount) are handled by the template. You provide SUPPLEMENTARY legal clauses ONLY.

The template ALREADY includes all of the following — do NOT repeat, expand, or rephrase any of them:
- Section 3.1: "absolute, unconditional, and continuing guaranty of payment and not merely a guaranty of collection" (guarantor directly liable — lender need not first pursue borrower)
- Full enumerated list of guaranteed obligations (principal, interest, fees, late charges, collection costs, attorney fees)
- "This Guaranty covers all amounts owing without limitation"
- Waivers (a) through (g) covering specific suretyship defenses: (a) notice of acceptance, (b) presentment/demand/protest, (c) notice of default or non-payment, (d) any right to require lender to proceed against borrower first, (e) marshaling of assets, (f) any defense based on modifications to loan terms, (g) any other suretyship defense under applicable law
- Subrogation waiver (no subrogation until all obligations paid in full)
- Subordination of guarantor's claims against borrower to lender's claims
- Spousal consent section

You provide ONLY supplementary legal clauses NOT covered above (e.g., reinstatement after avoided payments, joint and several liability if multiple guarantors, financial reporting obligations, net worth maintenance covenants, death/incapacity provisions, notice addresses, integration clause). If a field has no additional content needed, return a brief statement that the template provisions are sufficient.

Return JSON matching this exact schema:
{
  "guarantyScope": "string — SUPPLEMENTARY scope provisions only (e.g., reinstatement of guaranty if any payment is avoided/recovered in bankruptcy, continuing nature surviving renewals/extensions). Do NOT restate that this is unconditional/absolute/continuing or re-list guaranteed amounts — the template already covers that",
  "waiverOfDefenses": ["array of strings — each is a SUPPLEMENTARY defense waiver NOT already in the template's (a)-(g) list (e.g., waiver of anti-deficiency statutes, waiver of right to trial by jury, waiver of statute of limitations defenses, waiver of Regulation Z rescission rights if applicable)"],
  "subrogationWaiver": "string — SUPPLEMENTARY subrogation provisions only (e.g., if subrogation rights vest after full payment, any limitations or conditions). Do NOT restate the basic subrogation waiver — template already includes it",
  "subordination": "string — SUPPLEMENTARY subordination provisions only (e.g., turnover obligations if guarantor receives payment in violation, treatment in bankruptcy). Do NOT restate the basic subordination — template already includes it",
  "miscellaneous": "string — amendments, successors, counterparts, entire agreement, notices, integration",
  "governingLaw": "string — governing law, jurisdiction, venue, jury trial waiver"
}`;
}

function buildCommitmentLetterPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("commitment_letter", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a COMMITMENT LETTER. The deterministic sections (loan terms table, fees schedule, collateral list, covenants table) are handled by the template. You provide the legal/contextual language.

Return JSON matching this exact schema:
{
  "openingParagraph": "string — formal opening ('We are pleased to offer...') referencing the borrower, loan program, and purpose. Set the tone for the commitment.",
  "conditionsPrecedent": ["array of strings — each is a condition that must be satisfied before closing (e.g., satisfactory appraisal, title insurance, environmental report, insurance certificates, organizational documents, legal opinion)"],
  "representationsRequired": "string — describe the representations and warranties the borrower must make at closing (financial accuracy, no litigation, authority, compliance, no material adverse change)",
  "expirationClause": "string — when this commitment expires (typically 30-60 days from date), what constitutes acceptance, and consequences of non-acceptance",
  "governingLaw": "string — governing law, jurisdiction, venue, jury trial waiver"
}`;
}

function buildEnvironmentalIndemnityPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("environmental_indemnity", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for an ENVIRONMENTAL INDEMNITY AGREEMENT. The deterministic sections (parties, key terms table, recitals) are handled by the template. You provide SUPPLEMENTARY legal clauses ONLY.

The template ALREADY includes all of the following — do NOT repeat, expand, or rephrase any of them:
- Hazardous Substances definition referencing CERCLA (42 U.S.C. Section 9601(14)), including petroleum products, asbestos, PCBs, mold, and radioactive materials
- Environmental Laws definition (CERCLA, RCRA, CWA, CAA, TSCA, and all applicable federal, state, and local environmental statutes and regulations)
- Indemnification scope covering all losses, costs, damages, liabilities, claims, fines, penalties, and expenses (including attorney fees and remediation costs)
- Statement that indemnity obligations are unsecured obligations of the indemnitor
- Survival clause (obligations survive loan repayment, foreclosure, and deed-in-lieu)
- Subrogation waiver

You provide ONLY supplementary provisions NOT covered above (e.g., deal-specific environmental representations about the actual property, property-specific covenants, remediation procedures and obligations, additional survival/successor terms, lender inspection rights, environmental insurance requirements). If a field has no additional content needed, return a brief statement that the template provisions are sufficient.

Return JSON matching this exact schema:
{
  "indemnificationScope": "string — SUPPLEMENTARY indemnification provisions only (e.g., deal-specific carve-outs, contribution rights, indemnification procedures including notice/defense/settlement mechanics). Do NOT restate the definitions of Hazardous Substances or Environmental Laws, and do NOT restate the indemnification scope — the template already covers all of that",
  "representationsAndWarranties": ["array of strings — each is a deal-specific environmental representation about the ACTUAL property (e.g., Phase I/II results disclosed, no known contamination, no underground storage tanks, no pending environmental actions, compliance history). These should be specific to this deal, not generic definitions"],
  "covenants": ["array of strings — each is an ongoing environmental covenant (comply with environmental laws, no new hazardous substances, notify lender of environmental issues, permit lender inspections, maintain environmental insurance if required, deliver copies of environmental reports)"],
  "remediationObligations": "string — obligations upon discovery of contamination including prompt notice, investigation, remediation plan, completion of cleanup to applicable standards, cooperation with governmental authorities, and lender approval of remediation plans",
  "survivalClause": "string — SUPPLEMENTARY survival provisions only (e.g., binding on successors and assigns, survival independent of other loan documents, no release upon transfer of property). Do NOT restate the basic survival or subrogation waiver — template already includes those",
  "governingLaw": "string — governing law, jurisdiction, venue, jury trial waiver"
}`;
}

function buildAssignmentOfLeasesPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("assignment_of_leases", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for an ASSIGNMENT OF LEASES AND RENTS. The deterministic sections (parties, key terms table, recitals) are handled by the template. You provide the legal clauses.

Return JSON matching this exact schema:
{
  "assignmentGrant": "string — the actual assignment grant language transferring all right, title, and interest in leases, rents, issues, and profits to the lender as additional security, with license back to borrower to collect rents until default",
  "representationsAndWarranties": ["array of strings — each is a representation about the leases (all leases disclosed, leases in full force, no defaults, rents current, no prepaid rents beyond one month, authority to assign)"],
  "covenants": ["array of strings — each is an ongoing covenant (maintain leases in good standing, not modify or cancel leases without consent, enforce lease terms, deliver copies of new leases, collect rents diligently, deposit rents as required)"],
  "lenderRights": "string — lender rights upon default including direct collection of rents, notification of tenants, appointment of receiver, application of rents to loan obligations",
  "tenantNotification": "string — requirements for notifying tenants of the assignment, form of tenant notification, tenant estoppel certificates",
  "governingLaw": "string — governing law, jurisdiction, venue"
}`;
}

function buildSubordinationPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("subordination_agreement", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a SUBORDINATION AGREEMENT. The deterministic sections (parties, key terms table, recitals) are handled by the template. You provide the legal clauses establishing priority between creditors.

If the subordinate creditor is not specifically named, use "the Subordinate Creditor" as a placeholder throughout.

Return JSON matching this exact schema:
{
  "subordinationTerms": "string — the core subordination language: the subordinate debt is and shall at all times remain junior, inferior, and subordinate in right of payment and priority to the senior debt, regardless of time of creation, attachment, or perfection",
  "seniorDebtDescription": "string — description of the senior debt including all obligations, indebtedness, and liabilities owed to the senior creditor under the loan agreement, note, and all related documents, including interest, fees, costs, and expenses",
  "subordinateDebtDescription": "string — description of the subordinate debt including all obligations owed to the subordinate creditor, with acknowledgment that such debt is subject to this agreement",
  "paymentRestrictions": "string — restrictions on payments to subordinate creditor (no principal or interest payments while senior debt outstanding or during default, permitted payments if any, exceptions for regularly scheduled payments if no default exists)",
  "standstillProvisions": "string — standstill period during which subordinate creditor may not take enforcement action (typically 90-180 days after notice to senior creditor), conditions for lifting standstill",
  "turnoverProvisions": "string — requirement to turn over any payments received in violation of subordination, including payments received in bankruptcy or insolvency proceedings, to the senior creditor",
  "governingLaw": "string — governing law, jurisdiction, venue, jury trial waiver"
}`;
}

function buildIntercreditorPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("intercreditor_agreement", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for an INTERCREDITOR AGREEMENT. This is the most complex document — it governs the relationship between first lien and second lien lenders on the same collateral. The deterministic sections (parties, key terms table, recitals) are handled by the template. You provide the legal articles.

If the second lien lender is not specifically named, use "the Second Lien Lender" as a placeholder throughout.

Return JSON matching this exact schema:
{
  "definitionsAndInterpretation": "string — key definitions including First Lien Obligations, Second Lien Obligations, Collateral, Discharge of First Lien Obligations, DIP Financing, Adequate Protection, and rules of interpretation",
  "lienPriority": "string — establish that first lien has priority over second lien on all shared collateral regardless of order of attachment, perfection, or recording; anti-marshaling provisions; no contest of priority; agreement not to acquire liens except as permitted",
  "paymentWaterfall": "string — order of application of proceeds from collateral: first to costs of enforcement, then first lien obligations in full, then second lien obligations; restrictions on second lien payments during first lien default",
  "standstillAndCure": "string — standstill period for second lien lender (typically 90-180 days) before it can take enforcement action; first lien lender's right to cure second lien defaults; notice requirements between lenders",
  "enforcementRights": "string — first lien lender has exclusive right to enforce remedies against shared collateral during standstill; second lien lender may exercise remedies after standstill expiration subject to limitations; first lien lender may take actions without consent of second lien lender",
  "purchaseOption": "string — second lien lender's option to purchase first lien debt at par plus accrued interest upon acceleration or enforcement action; exercise period, mechanics, and closing requirements",
  "releaseAndAmendment": "string — second lien lender must release liens if first lien lender releases in connection with permitted disposition; restrictions on amendments to second lien documents that would conflict; consent requirements",
  "bankruptcyProvisions": "string — waivers and agreements in bankruptcy including DIP financing consent, adequate protection provisions, Section 363 sale provisions, plan support obligations, no contest of first lien claims",
  "governingLaw": "string — governing law, jurisdiction, venue, jury trial waiver"
}`;
}

function buildCorporateResolutionPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("corporate_resolution", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a CORPORATE BORROWING RESOLUTION. The deterministic sections (entity header, key terms table) are handled by the template. You provide the resolution language.

Return JSON matching this exact schema:
{
  "resolutionRecitals": "string — WHEREAS clauses establishing the entity's need for financing, the loan terms being offered, and the authority of the governing body (board of directors, members, partners) to authorize the borrowing",
  "authorizationClause": "string — RESOLVED clause authorizing the entity to borrow the specified amount from the lender, enter into the loan agreement and all related documents, grant security interests, and take all actions necessary to consummate the transaction",
  "authorizedSigners": "string — designation of specific officers/members/managers authorized to execute loan documents on behalf of the entity, including authority to negotiate terms, deliver documents, and bind the entity",
  "ratificationClause": "string — ratification of all actions heretofore taken by any officer/member/manager in connection with the loan transaction, confirming such actions are approved and adopted as acts of the entity",
  "certificateOfSecretary": "string — certification language for the secretary/manager attesting that the resolution was duly adopted, the entity is in good standing, the organizational documents are current, and the authorized signers hold the positions stated",
  "governingLaw": "string — governing law clause"
}`;
}

function buildUccFinancingPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("ucc_financing_statement", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a UCC FINANCING STATEMENT (UCC-1). The deterministic sections (debtor/secured party information, filing information table) are handled by the template. You provide the collateral and filing language. The debtor name MUST match the exact legal name from the debtor's public organic record per UCC §9-503(a). Include continuation statement requirements per §9-515.

Return JSON matching this exact schema:
{
  "collateralDescription": "string — comprehensive UCC Article 9 collateral description covering all applicable categories: accounts, chattel paper, deposit accounts, documents, equipment, general intangibles, instruments, inventory, investment property, letter-of-credit rights, and all other personal property appropriate for this loan type and collateral types",
  "proceedsClause": "string — all proceeds and products of the foregoing, including insurance proceeds, all accessions, additions, replacements, and substitutions, and all supporting obligations",
  "filingInstructions": "string — where to file (Secretary of State office for the debtor's state of organization), filing fees, continuation statement requirements (every 5 years before lapse), and amendment procedures",
  "additionalProvisions": "string — any additional provisions including description of real-property-related collateral if applicable (as-extracted collateral, timber to be cut, fixtures), manufactured home designation if applicable, and transmitting utility designation if applicable"
}`;
}

function buildSndaPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("snda", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a SUBORDINATION, NON-DISTURBANCE AND ATTORNMENT AGREEMENT (SNDA). The deterministic sections (parties, key terms table, recitals) are handled by the template. You provide the legal clauses.

Return JSON matching this exact schema:
{
  "subordinationTerms": "string — language subordinating the lease to the lender's mortgage/deed of trust, with carve-outs for tenant protections",
  "nonDisturbanceTerms": "string — lender's covenant not to disturb tenant's possession upon foreclosure, provided tenant is not in default under its lease",
  "attornmentTerms": "string — tenant's agreement to attorn to and recognize any successor landlord, including the lender or purchaser at foreclosure",
  "lenderProtections": "string — additional protections for the lender regarding the lease, including restrictions on lease modifications and rent prepayments without lender consent",
  "governingLaw": "string — governing law, jurisdiction, venue"
}`;
}

function buildEstoppelPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("estoppel_certificate", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a TENANT ESTOPPEL CERTIFICATE. The template ALREADY includes these 9 standard certifications — do NOT repeat, expand, or rephrase any of them:
1. Lease in full force and effect
2. No defaults by landlord or tenant
3. No claims/defenses/offsets against landlord
4. Rent paid through date, none prepaid
5. Security deposit amount
6. No purchase option or ROFR
7. No assignments or subleases
8. Improvements complete
9. No notice of sale/transfer/assignment

You provide ONLY additional deal-specific certifications that are NOT covered above (e.g., CAM charges, percentage rent, tenant improvement allowances, renewal options, parking rights, signage rights). If there are no additional deal-specific items needed, return a brief statement that no additional certifications are required.

Return JSON matching this exact schema:
{
  "additionalCertifications": "string — deal-specific tenant certifications NOT already in the template's standard 9 items"
}`;
}

function buildBorrowersCertificatePrompt(input: DocumentInput): string {
  const refs = getLegalReferences("borrowers_certificate", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a BORROWER'S CERTIFICATE. The template ALREADY includes these 10 standard certifications — do NOT repeat, expand, or rephrase any of them:
1. Reps and warranties remain true
2. No event of default
3. Conditions precedent satisfied
4. Financial statements true and correct
5. No material adverse change
6. Entity good standing / legal capacity
7. Authorized execution
8. Loan proceeds for stated purpose
9. Insurance in effect
10. Governmental approvals obtained

You provide ONLY additional deal-specific certifications NOT covered above (e.g., environmental compliance, specific collateral conditions, program-specific requirements). If there are no additional items needed, return a brief statement that no additional certifications are required.

Return JSON matching this exact schema:
{
  "additionalCertifications": "string — deal-specific borrower certifications NOT already in the template's standard 10 items",
  "governingLaw": "string — governing law, jurisdiction"
}`;
}

function buildOpinionLetterPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("opinion_letter", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a LEGAL OPINION LETTER. The deterministic sections (parties, key terms table) are handled by the template. You provide additional deal-specific opinions. Follow ABA Legal Opinion Accord standards.

The template ALREADY includes these 6 standard opinions — do NOT repeat, expand, or rephrase any of them:
1. Entity organization and good standing (or individual capacity for natural persons)
2. Authority to execute and perform the loan documents
3. Non-violation of laws, organizational documents, or material agreements
4. Enforceability of loan documents (with standard bankruptcy/insolvency/equitable principles carve-out per TriBar standards)
5. No pending litigation that would materially affect the transaction
6. Compliance with applicable laws

You provide ONLY additional deal-specific opinions NOT covered above (e.g., UCC perfection opinions, real property lien opinions, usury compliance for the specific state, regulatory opinions for specialized borrowers, tax opinions, environmental compliance opinions, ERISA opinions if applicable). If there are no additional deal-specific opinions needed, return a brief statement that no additional opinions are required.

Return JSON matching this exact schema:
{
  "additionalOpinions": "string — deal-specific legal opinions NOT already in the template's standard 6 opinions, tailored to this loan program, collateral type, and state law requirements",
  "governingLaw": "string — governing law"
}`;
}

function buildDeedOfTrustPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("deed_of_trust", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a DEED OF TRUST. This is a real property security instrument used in trust-deed states. The deterministic sections (parties, key terms, legal description, payment mechanics, recording) are handled by the template. You provide the legal clauses.

The property is located in ${input.stateAbbr ?? "[STATE]"}. Ensure all provisions comply with that state's deed of trust statutes, including non-judicial foreclosure (power of sale) requirements if available.

Return JSON matching this exact schema:
{
  "grantClause": "string — the granting clause conveying the property in trust to the trustee for the benefit of the beneficiary (lender), describing the nature of the conveyance and the trust",
  "borrowerCovenants": ["array of strings — each is a borrower covenant: maintain insurance, pay taxes, maintain property, no waste, no further encumbrances without consent, comply with laws, permit inspections, etc."],
  "defaultProvisions": "string — events of default including payment default (with grace period), covenant breach (with cure period), transfer without consent (due-on-sale), bankruptcy, condemnation, environmental contamination, material adverse change",
  "powerOfSale": "string — non-judicial foreclosure power of sale clause: trustee's authority to sell upon default after required notice periods per state law, sale procedure, application of proceeds, deficiency rights if permitted by state law",
  "environmentalCovenants": "string — borrower covenants regarding environmental compliance: no hazardous substances, compliance with environmental laws, right to conduct Phase I/II assessments, remediation obligations, environmental indemnification",
  "governingLaw": "string — governing law, jurisdiction, venue, jury trial waiver"
}`;
}

function buildSbaAuthorizationPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("sba_authorization", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for an SBA AUTHORIZATION letter. The deterministic sections (SBA guaranty fee calculations, standard SBA conditions, fee schedule, key terms) are handled by the template. You provide the deal-specific language.

This is an SBA ${input.programId === "sba_504" ? "504" : "7(a)"} loan. Ensure all provisions comply with SBA SOP 50 10 requirements.

Return JSON matching this exact schema:
{
  "specialConditions": ["array of strings — each is a special condition specific to this deal beyond the standard SBA conditions (e.g., specific collateral requirements, additional insurance, environmental assessment, business plan requirements, management change restrictions)"],
  "useOfProceeds": "string — detailed description of how loan proceeds will be used, consistent with SBA use of proceeds requirements per 13 CFR 120.150 (acquiring land/buildings, construction, equipment, working capital, refinancing). Must NOT include prohibited uses (speculation, lending, passive investment, gambling).",
  "governingLaw": "string — governing law clause"
}`;
}

function buildCdcDebenturePrompt(input: DocumentInput): string {
  const refs = getLegalReferences("cdc_debenture", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a CDC DEBENTURE for an SBA 504 loan. The deterministic sections (504 structure table, job creation calculations, occupancy requirements, standard conditions, key terms) are handled by the template. You provide the project description and CDC-specific terms.

Return JSON matching this exact schema:
{
  "projectDescription": "string — detailed description of the project being financed: what is being acquired/constructed/renovated, location, expected use, public benefit (job creation, community development), timeline for completion",
  "cdcTermsAndConditions": "string — CDC-specific terms including debenture maturity, prepayment provisions, CDC servicing obligations, SBA oversight requirements, borrower reporting obligations to CDC, and CDC authority to take action on behalf of SBA",
  "governingLaw": "string — governing law clause"
}`;
}

function buildBorrowingBasePrompt(input: DocumentInput): string {
  const refs = getLegalReferences("borrowing_base_agreement", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a BORROWING BASE AGREEMENT for a revolving line of credit. The deterministic sections (parties, key terms, definitions, borrowing base formula table, ineligible accounts list, ineligible inventory list, borrowing base certificate form, events of default) are handled by the template. You provide SUPPLEMENTARY deal-specific criteria and requirements ONLY.

The template ALREADY includes these standard ineligibility categories — do NOT repeat, expand, or rephrase any of them:

Ineligible Accounts Receivable (already in template):
- Past due more than 90 days from invoice date
- Foreign accounts (obligor located outside the United States)
- Intercompany accounts
- Government accounts (without valid assignment of claims under the Assignment of Claims Act)
- Accounts of bankrupt or insolvent debtors
- Contra accounts (mutual debts/credits between borrower and account debtor)
- Bonded/retainage accounts

Ineligible Inventory (already in template):
- Work-in-process (WIP)
- Consigned inventory
- In-transit inventory for more than 30 days
- Obsolete or slow-moving inventory
- Inventory held on memorandum
- Inventory located outside the United States
- Inventory subject to third-party liens

You provide ONLY additional deal-specific or industry-specific criteria NOT covered above. If a field has no additional content needed, return a brief statement that the template provisions are sufficient.

Return JSON matching this exact schema:
{
  "eligibilityCriteria": "string — SUPPLEMENTARY eligibility criteria NOT already in the template's standard ineligibility lists above. Include industry-specific criteria, concentration limits (no single debtor >25% of eligible accounts), dilution triggers, cross-aging provisions, and any deal-specific eligibility requirements",
  "advanceRates": "string — detailed advance rate provisions including how rates may be adjusted by lender, seasonal adjustments if applicable, advance rate step-downs for specific collateral categories, and the process for lender to modify advance rates upon deterioration of collateral quality",
  "reportingRequirements": "string — comprehensive reporting obligations including monthly borrowing base certificates, accounts receivable aging reports, inventory reports, accounts payable aging, financial statements (monthly/quarterly/annual), field examination requirements (frequency, scope, who bears cost), and consequences of late or inaccurate reporting",
  "reserveProvisions": "string — reserve provisions including dilution reserves (based on historical dilution rate), concentration reserves, seasonal reserves if applicable, availability reserves for rent/taxes/insurance, and lender's right to establish additional reserves in its commercially reasonable discretion",
  "governingLaw": "string — governing law, jurisdiction, venue, jury trial waiver"
}`;
}

function buildDigitalAssetPledgePrompt(input: DocumentInput): string {
  const refs = getLegalReferences("digital_asset_pledge", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a DIGITAL ASSET PLEDGE AND SECURITY AGREEMENT for a crypto-collateralized loan. The deterministic sections (parties, key terms, collateral description, definitions, LTV monitoring table, representations, covenants) are handled by the template. You provide the substantive security interest and operational provisions.

This is a novel asset class — ensure provisions address the unique characteristics of digital assets including volatility, custody risk, fork events, and regulatory uncertainty.

Return JSON matching this exact schema:
{
  "pledgeGrant": "string — grant of security interest in all digital assets, tokens, and cryptocurrency now or hereafter deposited in the custody account, including all proceeds, products, forks, airdrops, staking rewards, and any other rights arising from ownership. Must address UCC Article 9 applicability to digital assets and any state-specific digital asset security interest provisions (e.g., Wyoming Digital Asset Act)",
  "valuationMethodology": "string — how digital assets are valued for LTV calculations: approved exchanges for price discovery, volume-weighted average price methodology, frequency of valuation (continuous monitoring with formal calculation at minimum every 4 hours), treatment of illiquid assets, treatment of stablecoins (valued at par unless de-pegged), and dispute resolution for valuation disagreements",
  "marginCallProvisions": "string — detailed margin call mechanics: notification method (email + on-chain notification if available), cure period (24 hours), acceptable cure methods (deposit additional digital assets OR make cash payment), minimum post-cure LTV target (70%), repeated margin call escalation, and borrower's obligation to monitor its own LTV ratio",
  "liquidationProvisions": "string — automatic liquidation process: trigger threshold (90% LTV), no notice or cure period required, liquidation method (market sell on approved exchange(s) using TWAP or VWAP algorithm to minimize slippage), target post-liquidation LTV (65%), distribution of proceeds (loan balance first, excess to borrower), and borrower's acknowledgment that automatic liquidation is commercially reasonable given digital asset volatility",
  "custodyRequirements": "string — requirements for digital asset custody: must use approved custodian with SOC 2 Type II certification, segregated cold storage wallets, multi-signature authorization (minimum 2-of-3), geographic distribution of key shards, insurance requirements (minimum coverage equal to loan amount), prohibition on custodian rehypothecation or lending of collateral, and borrower's right to verify custody through on-chain proof-of-reserves",
  "governingLaw": "string — governing law, jurisdiction, venue, jury trial waiver. Must address potential conflict-of-laws issues for digital assets that exist on decentralized networks"
}`;
}

function buildCustodyAgreementPrompt(input: DocumentInput): string {
  const refs = getLegalReferences("custody_agreement", input.programId);
  return `${buildDealContext(input)}
${refs ? `\n${refs}\n` : ""}
Generate the prose sections for a DIGITAL ASSET CUSTODY AGREEMENT. This is a three-party agreement between Depositor (borrower), Secured Party (lender), and Custodian. The deterministic sections (parties, key terms, custodian responsibilities, access control provisions) are handled by the template. You provide the deal-specific operational and legal terms.

Return JSON matching this exact schema:
{
  "custodyTerms": "string — custodian's obligations and standard of care: fiduciary duty to safeguard assets, commercially reasonable security measures, business continuity and disaster recovery plans, minimum uptime requirements (99.9%), notification obligations for security incidents (within 1 hour of discovery), annual penetration testing and security audits, and custodian's obligation to maintain technology infrastructure current with industry best practices",
  "accessControl": "string — additional access control provisions beyond the deterministic sections: multi-factor authentication requirements, IP whitelisting, time-delayed withdrawals for large amounts (>10% of custody value requires 48-hour delay), emergency access procedures, key rotation schedule, and process for adding or removing authorized signatories",
  "insuranceRequirements": "string — insurance requirements on digital assets in custody: minimum coverage amount (equal to or greater than the outstanding loan amount), types of coverage required (crime/theft, errors and omissions, cyber liability), approved insurance carriers (A-rated or better), policy must name Secured Party as loss payee, evidence of insurance delivered annually, notification of any policy changes or lapses within 5 business days",
  "transferProvisions": "string — how digital assets are transferred into and out of custody: deposit procedures (whitelisted addresses only, confirmation requirements based on blockchain), withdrawal procedures (multi-sig approval, processing windows, network fee allocation), treatment of hard forks and airdrops (custodian must support or provide access to forked assets), and staking/governance participation rights (Depositor retains governance voting rights but may not stake without Secured Party consent)",
  "terminationProvisions": "string — how to terminate the custody arrangement: upon repayment in full (Secured Party provides written release, custodian transfers all assets to Depositor within 5 business days), upon default (transition to Secured Party-directed custody), voluntary termination by custodian (minimum 90 days written notice, must assist in transfer to replacement custodian at custodian's expense), and survival of indemnification obligations after termination",
  "governingLaw": "string — governing law, jurisdiction, venue, jury trial waiver"
}`;
}

// Generic fallback for unsupported doc types

function buildGenericProse(docType: string, input: DocumentInput): AiDocProse {
  const state = input.stateAbbr ? `the State of ${input.stateAbbr}` : "the applicable state";
  return {
    generalProvisions: `This ${docType.replace(/_/g, " ")} is entered into as of ${formatDate(input.generatedAt)} by and between the Lender and ${input.borrowerName} ("Borrower") in connection with a ${input.programName} loan in the principal amount of ${formatCurrency(input.terms.approvedAmount)}.`,
    governingLaw: `This agreement shall be governed by and construed in accordance with the laws of ${state}, without regard to its conflicts of law principles.`,
  };
}

// Main entry point

export async function generateDocProse(
  docType: string,
  input: DocumentInput,
  feedback?: string,
): Promise<AiDocProse> {
  // For unsupported doc types, return generic placeholder (no AI call)
  const supportedTypes: Record<string, (i: DocumentInput) => string> = {
    promissory_note: buildPromissoryNotePrompt,
    loan_agreement: buildLoanAgreementPrompt,
    security_agreement: buildSecurityAgreementPrompt,
    guaranty: buildGuarantyPrompt,
    commitment_letter: buildCommitmentLetterPrompt,
    environmental_indemnity: buildEnvironmentalIndemnityPrompt,
    assignment_of_leases: buildAssignmentOfLeasesPrompt,
    subordination_agreement: buildSubordinationPrompt,
    intercreditor_agreement: buildIntercreditorPrompt,
    corporate_resolution: buildCorporateResolutionPrompt,
    ucc_financing_statement: buildUccFinancingPrompt,
    snda: buildSndaPrompt,
    estoppel_certificate: buildEstoppelPrompt,
    borrowers_certificate: buildBorrowersCertificatePrompt,
    opinion_letter: buildOpinionLetterPrompt,
    deed_of_trust: buildDeedOfTrustPrompt,
    sba_authorization: buildSbaAuthorizationPrompt,
    cdc_debenture: buildCdcDebenturePrompt,
    borrowing_base_agreement: buildBorrowingBasePrompt,
    digital_asset_pledge: buildDigitalAssetPledgePrompt,
    custody_agreement: buildCustodyAgreementPrompt,
  };

  const promptBuilder = supportedTypes[docType];
  if (!promptBuilder) {
    return buildGenericProse(docType, input);
  }

  try {
    // Complex doc types with many prose sections need more tokens
    const complexTypes = new Set(["loan_agreement", "intercreditor_agreement", "digital_asset_pledge", "custody_agreement", "deed_of_trust", "borrowing_base_agreement"]);
    const maxTokens = complexTypes.has(docType) ? 6000 : 4000;

    let userPrompt = promptBuilder(input);

    // DSCR business-purpose exemption guidance: DSCR loans on investment properties
    // are typically exempt from TRID/Reg Z consumer protections.
    if (input.programId === "dscr" && ["loan_agreement", "closing_disclosure"].includes(docType)) {
      userPrompt += `\n\nDSCR BUSINESS-PURPOSE EXEMPTION GUIDANCE:
DSCR (Debt Service Coverage Ratio) loans on investment properties are typically classified as business-purpose loans exempt from the Truth in Lending Act (TILA) / Real Estate Settlement Procedures Act (RESPA) Integrated Disclosure (TRID) requirements and Regulation Z consumer protections under 12 CFR 1026.3(a)(1), which excludes credit extended primarily for a business, commercial, or agricultural purpose.
IMPORTANT: If a DSCR loan is secured by the borrower's primary residence (owner-occupied), TRID and Regulation Z consumer protections MAY apply regardless of the stated business purpose. Do NOT include TRID-specific disclosures (Loan Estimate, Closing Disclosure timing requirements, 3-day review periods, tolerance thresholds) for investment-property DSCR loans unless the property is owner-occupied. For non-owner-occupied investment properties, use standard commercial loan documentation without consumer disclosure requirements.`;
    }

    // If feedback from legal review is provided, append it so AI corrects its output
    if (feedback) {
      userPrompt += `\n\n=== MANDATORY CORRECTIONS ===\nA legal review of your previous draft found the following issues. You MUST fix ALL of them in this revision. Do not repeat these mistakes.\n\n${feedback}`;
    }

    const prose = await claudeJson<AiDocProse>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens,
    });

    return prose;
  } catch (error) {
    console.error(`AI prose generation failed for ${docType}, returning generic:`, error);
    return buildGenericProse(docType, input);
  }
}
