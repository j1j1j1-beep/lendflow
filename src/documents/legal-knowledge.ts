// =============================================================================
// legal-knowledge.ts
// Per-document-type legal checklists for enhanced AI legal review.
// Each checklist contains specific provisions the AI reviewer must verify.
// =============================================================================

export interface LegalChecklist {
  docType: string;
  requiredProvisions: string[];      // MUST be present — critical if missing
  standardProvisions: string[];      // SHOULD be present — warning if missing
  regulatoryReferences: string[];    // Specific statutes/regulations to verify compliance
  crossDocConsistency: string[];     // Things that must match other docs in the package
}

const CHECKLISTS: Record<string, LegalChecklist> = {
  // ---------------------------------------------------------------------------
  // Promissory Note
  // ---------------------------------------------------------------------------
  promissory_note: {
    docType: "promissory_note",
    requiredProvisions: [
      "Default provisions (what constitutes an event of default)",
      "Acceleration clause (entire balance due upon default)",
      "Late fee provision (amount/percentage and grace period)",
      "Governing law clause",
    ],
    standardProvisions: [
      "Business day convention (next business day if due date falls on weekend/holiday)",
      "Usury savings clause (rate shall not exceed maximum permitted by law)",
      "Waiver of presentment, demand, and protest",
    ],
    regulatoryReferences: [
      "State usury limits (interest rate must not exceed state maximum for loan type/amount)",
    ],
    crossDocConsistency: [],
  },

  // ---------------------------------------------------------------------------
  // Loan Agreement
  // ---------------------------------------------------------------------------
  loan_agreement: {
    docType: "loan_agreement",
    requiredProvisions: [
      "Definitions section (defined terms capitalized and cross-referenced)",
      "Representations and warranties (borrower reps about authority, financials, no litigation, etc.)",
      "Financial covenants (DSCR, leverage ratio, minimum liquidity, etc. with numeric thresholds)",
      "Events of default (comprehensive list including payment, covenant breach, cross-default, MAC, etc.)",
      "Remedies upon default (acceleration, set-off, enforcement rights)",
      "Conditions precedent to funding (documentation, legal opinions, insurance, etc.)",
      "Governing law clause",
    ],
    standardProvisions: [
      "Material adverse change (MAC) definition",
      "Cross-default provisions (default under other agreements triggers default here)",
      "Notice provisions (addresses, methods, deemed receipt timing)",
      "Amendment and waiver requirements (written consent, lender approval thresholds)",
      "Severability clause",
    ],
    regulatoryReferences: [
      "TILA disclosures (if consumer loan — APR, finance charge, amount financed, total of payments)",
      "Regulation Z (12 CFR Part 1026) — commercial purpose loans generally exempt per § 1026.3(a)(1)",
      "ECOA compliance (no discriminatory terms or conditions)",
      "State usury limits (rate within permissible bounds for jurisdiction and loan type)",
    ],
    crossDocConsistency: [
      "Loan amount matches promissory note",
      "Interest rate matches promissory note",
      "Covenant thresholds match compliance certificate thresholds",
    ],
  },

  // ---------------------------------------------------------------------------
  // Security Agreement
  // ---------------------------------------------------------------------------
  security_agreement: {
    docType: "security_agreement",
    requiredProvisions: [
      "Grant of security interest (debtor hereby grants to secured party a security interest in...)",
      "Collateral description using UCC Article 9 categories per section 9-108 (accounts, chattel paper, equipment, general intangibles, instruments, inventory, etc.)",
      "After-acquired property clause per UCC section 9-204 (security interest attaches to after-acquired collateral)",
      "Proceeds clause (all proceeds, products, rents, and profits of collateral)",
      "Perfection provisions (authorization to file financing statements, control agreements, etc.)",
      "Events of default (triggers for enforcement of security interest)",
      "Remedies upon default (right to take possession, sell, collect, etc.)",
    ],
    standardProvisions: [
      "Representations re: title and liens (debtor has good title, no prior liens except permitted)",
      "Maintenance covenants (keep collateral in good condition, repair, etc.)",
      "Insurance requirements (maintain insurance on collateral, lender as loss payee/additional insured)",
      "Inspection rights (lender may inspect collateral upon reasonable notice)",
      "Further assurances (debtor will execute additional documents to perfect)",
      "Commercially reasonable disposition per UCC section 9-610",
    ],
    regulatoryReferences: [
      "UCC section 9-108 (collateral description by type — must be sufficient, not supergeneric)",
      "UCC section 9-204 (after-acquired property — permitted for most collateral types)",
      "UCC section 9-315 (proceeds — security interest continues in identifiable proceeds)",
      "UCC section 9-610 (commercially reasonable disposition — notice, method, timing)",
      "UCC § 9-612 ten-day notice safe harbor for reasonableness of notification before disposition of collateral",
    ],
    crossDocConsistency: [
      "Collateral types match UCC financing statement filing",
      "Obligations secured match promissory note and loan agreement",
    ],
  },

  // ---------------------------------------------------------------------------
  // Guaranty
  // ---------------------------------------------------------------------------
  guaranty: {
    docType: "guaranty",
    requiredProvisions: [
      "Absolute and unconditional guaranty of payment (not merely collection)",
      "Waiver of defenses (suretyship defenses, marshaling, exhaustion, etc.)",
      "Subrogation waiver (guarantor waives subrogation rights until all obligations paid in full)",
      "Subordination of guarantor claims (guarantor claims subordinate to lender claims)",
    ],
    standardProvisions: [
      "Scope covers all obligations (principal, interest, fees, costs, enforcement expenses)",
      "Irrevocability (guaranty cannot be revoked while obligations remain outstanding)",
      "Joint and several liability (if multiple guarantors)",
      "Spousal consent (required in community property states: AZ, CA, ID, LA, NV, NM, TX, WA, WI (plus Alaska as opt-in community property state; TN, SD have community property trust statutes))",
      "Financial reporting requirements (guarantor must provide periodic financial statements)",
    ],
    regulatoryReferences: [
      "Community property states (AZ, CA, ID, LA, NV, NM, TX, WA, WI (plus Alaska as opt-in community property state; TN, SD have community property trust statutes)) may require spousal consent for enforceability",
    ],
    crossDocConsistency: [
      "Guaranteed amount matches promissory note principal",
      "Borrower name is consistent across all documents",
    ],
  },

  // ---------------------------------------------------------------------------
  // Commitment Letter
  // ---------------------------------------------------------------------------
  commitment_letter: {
    docType: "commitment_letter",
    requiredProvisions: [
      "Loan amount",
      "Interest rate (or rate determination mechanism)",
      "Term (maturity)",
      "Conditions precedent to closing and funding",
      "Expiration date (commitment expires if not accepted by date)",
      "Acceptance method (how borrower accepts — signature, return of executed copy, etc.)",
    ],
    standardProvisions: [
      "Commitment fee (amount, when due, refundability)",
      "Breakup provisions (consequences if deal does not close)",
      "Material adverse change termination right",
      "Time is of the essence clause",
    ],
    regulatoryReferences: [
      "State lending license requirements (lender must be properly licensed in borrower's state)",
    ],
    crossDocConsistency: [
      "Terms match loan agreement (rate, amount, term, fees)",
      "Fees match settlement statement",
    ],
  },

  // ---------------------------------------------------------------------------
  // Environmental Indemnity
  // ---------------------------------------------------------------------------
  environmental_indemnity: {
    docType: "environmental_indemnity",
    requiredProvisions: [
      "Hazardous substances definition (per CERCLA 42 USC section 9601 — includes petroleum, asbestos, PCBs, etc.)",
      "Environmental laws definition (comprehensive list: CERCLA, RCRA, Clean Water Act, Clean Air Act, state equivalents)",
      "Indemnification scope (losses, costs, damages, remediation, fines, penalties, attorneys fees)",
      "Survival clause (obligations survive repayment of loan, release of lien, foreclosure)",
      "Remediation obligations (indemnitor must remediate to applicable standards at own cost)",
    ],
    standardProvisions: [
      "Representations re: no existing contamination (property free of hazardous substances)",
      "Covenants re: ongoing compliance (will not use, store, generate, release hazardous substances)",
      "Right to conduct environmental assessments (Phase I, Phase II at indemnitor expense if triggered)",
      "Unsecured obligation (indemnity is not secured by any collateral — avoids lender liability)",
      "Subrogation waiver",
    ],
    regulatoryReferences: [
      "CERCLA 42 USC section 9601 (Comprehensive Environmental Response, Compensation, and Liability Act)",
      "RCRA 42 USC section 6901 (Resource Conservation and Recovery Act)",
      "Clean Water Act 33 USC section 1251",
    ],
    crossDocConsistency: [
      "Property address matches deed of trust and other loan documents",
      "Borrower/indemnitor name is consistent across all documents",
    ],
  },

  // ---------------------------------------------------------------------------
  // Assignment of Leases
  // ---------------------------------------------------------------------------
  assignment_of_leases: {
    docType: "assignment_of_leases",
    requiredProvisions: [
      "Assignment grant (borrower assigns all right, title, and interest in leases and rents)",
      "Revocable license to collect (borrower retains license to collect rents until default)",
      "Default triggers (license revoked upon event of default under loan documents)",
      "Receiver appointment rights (lender may seek appointment of receiver to collect rents)",
    ],
    standardProvisions: [
      "Representations about existing leases (all leases disclosed, in full force, no defaults)",
      "Covenants to maintain leases (will not modify, terminate, or accept surrender without consent)",
      "Cash management provisions (lockbox, sweep to lender-controlled account upon trigger event)",
      "SNDA requirements (lender may require tenant subordination, non-disturbance, and attornment agreements)",
      "Recording authorization (borrower authorizes recording of assignment in applicable jurisdiction)",
    ],
    regulatoryReferences: [
      "State recording requirements (assignment must be recorded in county where property is located)",
    ],
    crossDocConsistency: [
      "Property address matches deed of trust/security instrument",
      "Loan amount is consistent across all documents",
    ],
  },

  // ---------------------------------------------------------------------------
  // Subordination Agreement
  // ---------------------------------------------------------------------------
  subordination_agreement: {
    docType: "subordination_agreement",
    requiredProvisions: [
      "Blanket subordination clause (subordinate debt is subordinate in right of payment and priority)",
      "Payment restrictions (no payments on subordinate debt during blockage period or after default)",
      "Standstill provisions (subordinate creditor may not enforce remedies for specified period)",
      "Turnover obligations (any payments received in violation must be turned over to senior creditor)",
    ],
    standardProvisions: [
      "Definitions of senior debt and subordinate debt (clearly delineated)",
      "Permitted payments (scheduled interest, principal payments when no default exists)",
      "Cure rights (subordinate creditor may cure senior defaults to protect position)",
      "Notice requirements (senior creditor must notify subordinate creditor of defaults)",
    ],
    regulatoryReferences: [
      "UCC priority rules (subordination agreement modifies otherwise applicable priority)",
    ],
    crossDocConsistency: [
      "Senior debt description matches loan agreement",
      "Subordinate creditor name is consistent across all documents",
    ],
  },

  // ---------------------------------------------------------------------------
  // Intercreditor Agreement
  // ---------------------------------------------------------------------------
  intercreditor_agreement: {
    docType: "intercreditor_agreement",
    requiredProvisions: [
      "Lien priority establishment (first lien vs. second lien priority clearly stated)",
      "Payment waterfall (order of distribution: first lien obligations, then second lien, then residual)",
      "Standstill period (90-180 days during which second lien creditor may not enforce)",
      "Enforcement rights allocation (first lien controls enforcement; second lien standstill)",
      "Purchase option (second lien creditor may purchase first lien obligations at par plus accrued)",
      "Bankruptcy provisions (waivers, DIP financing consent, adequate protection allocation)",
    ],
    standardProvisions: [
      "Anti-marshaling (first lien creditor not required to marshal assets)",
      "DIP financing consent (second lien creditor consents to first lien DIP financing up to cap)",
      "Adequate protection waivers (second lien waives right to adequate protection payments)",
      "Plan voting (limitations on second lien creditor voting against first lien creditor-supported plan)",
      "Release provisions (second lien releases follow first lien releases of shared collateral)",
    ],
    regulatoryReferences: [
      "UCC Article 9 priority (consensual subordination of lien priority)",
      "Bankruptcy Code provisions (sections 363, 364, 1129 — sale, DIP financing, plan confirmation)",
      "Bankruptcy Code § 362 (automatic stay and relief from stay motion rights)",
      "Bankruptcy Code § 365 (executory contracts — assumption and rejection)",
    ],
    crossDocConsistency: [
      "First lien obligations match loan agreement",
      "Second lien terms are consistent with second lien loan documents",
    ],
  },

  // ---------------------------------------------------------------------------
  // Corporate Resolution
  // ---------------------------------------------------------------------------
  corporate_resolution: {
    docType: "corporate_resolution",
    requiredProvisions: [
      "WHEREAS recitals establishing the need for borrowing and authority to borrow",
      "RESOLVED authorization clause (entity authorizes execution of loan documents and borrowing)",
      "Authorized signers designation (specific individuals authorized to sign on behalf of entity)",
      "Ratification clause (all prior actions taken in connection with the loan are ratified)",
      "Secretary/manager certification (officer certifies resolution was duly adopted, remains in effect)",
    ],
    standardProvisions: [
      "Entity type identification (LLC, corporation, partnership — correct terminology)",
      "Good standing certification (entity is in good standing in state of formation)",
      "Organizational documents current (articles/certificate of formation, operating agreement/bylaws current)",
      "Counterparts clause (resolution may be executed in counterparts)",
    ],
    regulatoryReferences: [
      "State entity law requirements (LLC Act, Business Corporation Act, or Partnership Act as applicable)",
    ],
    crossDocConsistency: [
      "Entity name matches borrower name in loan documents",
      "Loan amount referenced matches promissory note",
    ],
  },

  // ---------------------------------------------------------------------------
  // UCC Financing Statement
  // ---------------------------------------------------------------------------
  ucc_financing_statement: {
    docType: "ucc_financing_statement",
    requiredProvisions: [
      "Debtor exact legal name (must match name on public organic record — articles, certificate of formation)",
      "Secured party name and address",
      "Collateral description by UCC Article 9 categories (accounts, chattel paper, deposit accounts, equipment, general intangibles, instruments, inventory, investment property, etc.)",
      "Filing state (state of debtor's location per UCC section 9-307)",
    ],
    standardProvisions: [
      "Organization ID number (state-issued organizational identification number)",
      "State of organization (jurisdiction of formation)",
      "Proceeds coverage (all proceeds and products of the foregoing)",
      "Filing instructions (file with Secretary of State of debtor's state of organization)",
    ],
    regulatoryReferences: [
      "UCC section 9-108 (collateral description must reasonably identify the collateral)",
      "UCC section 9-503 (debtor name sufficiency — must use exact legal name from organic record)",
      "UCC section 9-509 (authorization to file — debtor must authorize or authenticate security agreement)",
      "UCC section 9-515 (financing statement lapses 5 years after filing unless continuation filed)",
    ],
    crossDocConsistency: [
      "Collateral description matches security agreement",
      "Debtor name matches exactly (even minor differences can render filing ineffective)",
    ],
  },

  // ---------------------------------------------------------------------------
  // SNDA (Subordination, Non-Disturbance and Attornment)
  // ---------------------------------------------------------------------------
  snda: {
    docType: "snda",
    requiredProvisions: [
      "Subordination of lease to mortgage (tenant's lease is subordinate to lender's mortgage/deed of trust)",
      "Non-disturbance covenant (lender agrees not to disturb tenant's possession if tenant not in default)",
      "Attornment agreement (tenant agrees to attorn to successor landlord after foreclosure)",
      "Lender protection limitations (lender not bound by rent prepayments, offsets, or landlord obligations accruing pre-foreclosure)",
    ],
    standardProvisions: [
      "Tenant quiet enjoyment (so long as tenant performs, possession shall not be disturbed)",
      "Notice and cure rights for landlord default (tenant must give lender notice and opportunity to cure before exercising remedies)",
      "Insurance proceeds and casualty provisions (lender controls insurance proceeds allocation)",
      "Casualty and condemnation provisions (lender rights re: rebuild vs. terminate)",
    ],
    regulatoryReferences: [
      "State landlord-tenant law (SNDA must comply with applicable state lease subordination rules)",
    ],
    crossDocConsistency: [
      "Property address matches other loan documents",
      "Loan amount is consistent across documents",
      "Lender name matches other loan documents",
    ],
  },

  // ---------------------------------------------------------------------------
  // Estoppel Certificate
  // ---------------------------------------------------------------------------
  estoppel_certificate: {
    docType: "estoppel_certificate",
    requiredProvisions: [
      "Lease status confirmation (lease is in full force and effect, has not been modified except as stated)",
      "No defaults certification (no defaults by landlord or tenant, no events that with notice/time would become defaults)",
      "Rent current confirmation (rent is paid through specified date, no rent paid more than one month in advance)",
      "Security deposit amount (exact amount held by landlord)",
      "No prepaid rent (no rent has been prepaid beyond the current period)",
    ],
    standardProvisions: [
      "No purchase options or rights of first refusal (or if they exist, disclosure of terms)",
      "No assignments or subleases (or if they exist, disclosure)",
      "Improvements complete (all tenant improvement obligations have been satisfied)",
      "Reliance limitation (certificate may be relied upon by lender and its successors)",
    ],
    regulatoryReferences: [
      "None specific — estoppel certificates are contractual, not regulated",
    ],
    crossDocConsistency: [
      "Property address matches other loan documents",
    ],
  },

  // ---------------------------------------------------------------------------
  // Settlement Statement
  // ---------------------------------------------------------------------------
  settlement_statement: {
    docType: "settlement_statement",
    requiredProvisions: [
      "All loan fees itemized (origination fee, processing fee, underwriting fee, etc. — each separately listed)",
      "Prorated interest (per diem interest from closing date to first payment date)",
      "Net disbursement calculation (loan amount minus all borrower charges equals net to borrower)",
      "Borrower charges and lender charges clearly separated",
    ],
    standardProvisions: [
      "Recording fees (deed of trust, UCC, assignment recording fees)",
      "Title insurance premium (lender's title policy and owner's policy if applicable)",
      "Appraisal fee",
      "Escrow setup (tax and insurance escrow initial deposits if applicable)",
    ],
    regulatoryReferences: [
      "RESPA/TILA (if consumer loan — settlement statement must comply with Closing Disclosure requirements)",
    ],
    crossDocConsistency: [
      "Fees match commitment letter fee schedule",
      "Loan amount matches promissory note",
      "Interest rate matches promissory note",
    ],
  },

  // ---------------------------------------------------------------------------
  // Borrower's Certificate
  // ---------------------------------------------------------------------------
  borrowers_certificate: {
    docType: "borrowers_certificate",
    requiredProvisions: [
      "Representations and warranties reaffirmation (all reps in loan agreement remain true as of closing)",
      "No default certification (no event of default exists or would result from the borrowing)",
      "No material adverse change (no MAC since date of financial statements)",
      "Entity good standing confirmation (borrower is duly organized and in good standing)",
      "Authorized execution confirmation (person signing is authorized to execute loan documents)",
    ],
    standardProvisions: [
      "Financial statements accurate (most recent financial statements fairly present financial condition)",
      "Insurance in place (all required insurance has been obtained and is in effect)",
      "Government approvals obtained (all necessary governmental approvals have been received)",
      "Loan proceeds purpose (proceeds will be used for stated purpose only)",
    ],
    regulatoryReferences: [
      "None specific — borrower certificates are contractual",
    ],
    crossDocConsistency: [
      "Entity name matches borrower name in loan documents",
      "Loan document references are correct (dates, parties, amounts)",
    ],
  },

  // ---------------------------------------------------------------------------
  // Compliance Certificate
  // ---------------------------------------------------------------------------
  compliance_certificate: {
    docType: "compliance_certificate",
    requiredProvisions: [
      "Covenant thresholds from loan agreement (each financial covenant listed with required threshold)",
      "Actual values (blank fields for borrower to complete with actual calculated values)",
      "Compliance determination (in compliance / not in compliance for each covenant)",
    ],
    standardProvisions: [
      "Financial reporting status (confirmation that required financial reports have been delivered)",
      "Additional post-closing requirements (status of any outstanding post-closing items)",
    ],
    regulatoryReferences: [
      "None specific — compliance certificates are contractual",
    ],
    crossDocConsistency: [
      "Covenant thresholds match loan agreement exactly (DSCR, leverage ratio, liquidity, etc.)",
    ],
  },

  // ---------------------------------------------------------------------------
  // Amortization Schedule
  // ---------------------------------------------------------------------------
  amortization_schedule: {
    docType: "amortization_schedule",
    requiredProvisions: [
      "Payment amounts for each period (monthly payment amount clearly stated)",
      "Principal and interest breakdown (each payment split between principal and interest)",
      "Running balance (outstanding principal balance after each payment)",
      "Balloon payment notation (if applicable — final balloon amount clearly identified)",
    ],
    standardProvisions: [
      "Interest calculation method (30/360 or actual/360 or actual/365 — clearly stated)",
      "Prepayment note (schedule assumes no prepayments; actual balance may differ)",
      "Variable rate disclaimer (if variable rate — schedule based on current rate; actual payments may vary)",
    ],
    regulatoryReferences: [
      "TILA disclosure requirements (if consumer loan — payment schedule must comply with Regulation Z)",
    ],
    crossDocConsistency: [
      "Payment amount matches promissory note",
      "Interest rate matches promissory note",
      "Term matches loan agreement",
    ],
  },

  // ---------------------------------------------------------------------------
  // Deed of Trust
  // ---------------------------------------------------------------------------
  deed_of_trust: {
    docType: "deed_of_trust",
    requiredProvisions: [
      "Grant clause conveying property in trust to trustee for benefit of beneficiary (lender)",
      "Borrower covenants (insurance, taxes, maintenance, compliance with laws, no waste)",
      "Events of default (payment default, covenant breach, transfer without consent, bankruptcy, condemnation)",
      "Power of sale clause (non-judicial foreclosure authority, notice requirements per state law)",
      "Due-on-sale clause (transfer restriction — full balance due upon unauthorized transfer)",
      "Governing law clause",
    ],
    standardProvisions: [
      "Environmental covenants (no hazardous substances, compliance with environmental laws)",
      "Fixture filing under UCC (deed of trust serves as fixture filing for personal property attached to real estate)",
      "Assignment of rents (absolute assignment with revocable license to collect until default)",
      "Subordination to leases (optional, at lender's discretion)",
      "Recording information (space for recorder's use, recording instructions)",
    ],
    regulatoryReferences: [
      "State deed of trust statutes (power of sale requirements, notice periods, redemption rights)",
      "State non-judicial foreclosure procedures (notice of default, notice of sale, reinstatement rights)",
      "State anti-deficiency statutes (if applicable — AZ, CA, etc.)",
    ],
    crossDocConsistency: [
      "Property description matches assignment of leases and environmental indemnity",
      "Loan amount matches promissory note and loan agreement",
      "Trustor/borrower name consistent across all documents",
    ],
  },

  // ---------------------------------------------------------------------------
  // Closing Disclosure
  // ---------------------------------------------------------------------------
  closing_disclosure: {
    docType: "closing_disclosure",
    requiredProvisions: [
      "Closing information (date issued, closing date, disbursement date, settlement agent, file number)",
      "Loan terms (loan amount, interest rate, monthly P&I, prepayment penalty, balloon payment)",
      "Projected payments (principal and interest, mortgage insurance, estimated escrow, total monthly)",
      "Closing cost details (origination charges, services borrower did/did not shop for, government fees, prepaids)",
      "Cash to close calculation (total closing costs minus credits and loan amount)",
      "Loan calculations (total of payments, finance charge, amount financed, APR, TIP)",
    ],
    standardProvisions: [
      "Contact information (lender, mortgage broker, settlement agent)",
      "Confirm receipt signature block",
      "Other disclosures (appraisal, assumption, homeowner's insurance, late payment, servicing)",
    ],
    regulatoryReferences: [
      "TILA-RESPA Integrated Disclosure (TRID) rule — 12 CFR 1026.38",
      "Regulation Z (Truth in Lending) — model form H-25",
      "CFPB Closing Disclosure requirements — must be provided at least 3 business days before consummation",
    ],
    crossDocConsistency: [
      "Loan amount matches loan estimate and promissory note",
      "Interest rate matches loan estimate and promissory note",
      "Closing costs consistent with loan estimate (within tolerance thresholds)",
    ],
  },

  // ---------------------------------------------------------------------------
  // Loan Estimate
  // ---------------------------------------------------------------------------
  loan_estimate: {
    docType: "loan_estimate",
    requiredProvisions: [
      "Loan terms (loan amount, interest rate, monthly P&I, prepayment penalty, balloon payment)",
      "Projected payments (principal and interest, mortgage insurance, estimated escrow, total monthly)",
      "Estimated closing costs (total closing costs, estimated cash to close)",
      "Closing cost details (origination charges, services you can/cannot shop for, government fees, prepaids)",
    ],
    standardProvisions: [
      "Comparisons (in 5 years total paid, principal paid off, APR, TIP)",
      "Other considerations (appraisal, assumption, homeowner's insurance, late payment, servicing)",
      "Confirm receipt signature block",
    ],
    regulatoryReferences: [
      "TILA-RESPA Integrated Disclosure (TRID) rule — 12 CFR 1026.37",
      "Regulation Z (Truth in Lending) — model form H-24",
      "Must be provided within 3 business days of receiving application per TRID",
    ],
    crossDocConsistency: [
      "Loan terms must match commitment letter terms",
      "Fees must be within TRID tolerance thresholds at closing",
    ],
  },

  // ---------------------------------------------------------------------------
  // SBA Authorization
  // ---------------------------------------------------------------------------
  sba_authorization: {
    docType: "sba_authorization",
    requiredProvisions: [
      "Loan authorization details (loan amount, SBA guaranty percentage, guaranteed amount, interest rate, term)",
      "SBA guaranty fee calculation (fee rate applied to guaranteed portion)",
      "Use of proceeds description (must comply with SBA eligible use requirements)",
      "Standard SBA conditions (credit check, no delinquent federal debt, eligible small business, collateral, personal guaranty)",
      "Special conditions specific to the deal",
    ],
    standardProvisions: [
      "Authorization expiration (typically 6 months from date)",
      "Material change provision (changes in financial condition may cancel authorization)",
      "Life insurance assignment requirement (if applicable)",
      "IRS tax transcript review requirement",
    ],
    regulatoryReferences: [
      "SBA SOP 50 10 (Standard Operating Procedures for SBA lending)",
      "13 CFR Part 120 (SBA business loan program regulations)",
      "13 CFR 120.120 (eligible use of proceeds — acquiring land/buildings, construction, equipment, working capital, refinancing)",
      "SBA guaranty fee schedule per SOP 50 10",
    ],
    crossDocConsistency: [
      "Loan amount matches promissory note and loan agreement",
      "Interest rate matches promissory note",
      "SBA conditions match loan agreement conditions precedent",
    ],
  },

  // ---------------------------------------------------------------------------
  // CDC Debenture
  // ---------------------------------------------------------------------------
  cdc_debenture: {
    docType: "cdc_debenture",
    requiredProvisions: [
      "504 project structure (50% first lien bank, 40% CDC/SBA debenture, 10% borrower equity)",
      "Debenture terms (amount, interest rate, term, maturity date, payment schedule)",
      "Project description (what is being financed, location, expected use, public benefit)",
      "Job creation/retention requirement (1 job per $95,000 of debenture proceeds, $150,000 for small manufacturers/energy per Federal Register 2025-19072)",
      "Occupancy requirement (51% for existing business, 60% for new construction)",
    ],
    standardProvisions: [
      "Standard 504 conditions (eligible use, collateral, insurance, financial reporting, environmental compliance)",
      "No change of ownership without CDC and SBA consent",
      "Events of default (payment, job creation, occupancy, misrepresentation, covenant breach, bankruptcy)",
      "CDC terms and conditions (servicing, oversight, reporting)",
    ],
    regulatoryReferences: [
      "Section 504 of the Small Business Investment Act of 1958",
      "13 CFR Part 120 (SBA 504 program regulations)",
      "13 CFR 120.861-120.862 (job creation and retention requirements)",
      "SBA SOP 50 10 (standard operating procedures)",
    ],
    crossDocConsistency: [
      "Debenture amount consistent with 504 structure (40% of total project cost)",
      "First lien lender name matches loan agreement",
      "Borrower name consistent across all documents",
    ],
  },

  // ---------------------------------------------------------------------------
  // Borrowing Base Agreement
  // ---------------------------------------------------------------------------
  borrowing_base_agreement: {
    docType: "borrowing_base_agreement",
    requiredProvisions: [
      "Borrowing base definition (eligible accounts advance rate + eligible inventory advance rate minus reserves)",
      "Eligible accounts definition and eligibility criteria",
      "Eligible inventory definition and eligibility criteria",
      "Advance rates (typically 80% for eligible accounts, 50% for eligible inventory)",
      "Ineligible accounts list (past due >90 days, foreign, intercompany, government, cross-aged, disputed, encumbered)",
      "Ineligible inventory list (WIP, consigned, in transit, obsolete, third-party locations without waiver, encumbered)",
      "Borrowing base certificate delivery requirements (monthly, upon request, with advance requests)",
      "Events of default (late certificate, material misstatement, overadvance, covenant breach)",
    ],
    standardProvisions: [
      "Concentration limits (no single debtor >25% of eligible accounts)",
      "Dilution reserves and dilution triggers",
      "Field examination requirements (frequency, scope, cost allocation)",
      "Reporting requirements (aging reports, inventory reports, financial statements)",
      "Lender's right to adjust advance rates and establish additional reserves",
    ],
    regulatoryReferences: [
      "UCC Article 9 (security interest in accounts and inventory)",
      "UCC section 9-102 (definitions of accounts, inventory, proceeds)",
      "Federal Assignment of Claims Act (for government account debtors)",
    ],
    crossDocConsistency: [
      "Revolving commitment amount matches loan agreement",
      "Collateral description consistent with security agreement and UCC filing",
      "Events of default supplement loan agreement events of default",
    ],
  },

  // ---------------------------------------------------------------------------
  // Digital Asset Pledge
  // ---------------------------------------------------------------------------
  digital_asset_pledge: {
    docType: "digital_asset_pledge",
    requiredProvisions: [
      "Grant of security interest in all digital assets deposited in custody account",
      "Collateral description (digital assets, tokens, cryptocurrency, proceeds, forks, airdrops, staking rewards)",
      "LTV monitoring and margin requirements (continuous monitoring, margin call at 80%, liquidation at 90%)",
      "Margin call provisions (24-hour cure period, deposit additional assets or make cash payment, target 70% LTV post-cure)",
      "Automatic liquidation provisions (90% LTV trigger, no notice required, commercially reasonable disposition)",
      "Custody requirements (approved custodian, SOC 2, segregated cold storage, multi-sig, insurance)",
      "Valuation methodology (VWAP on approved exchanges, frequency, treatment of illiquid assets and stablecoins)",
    ],
    standardProvisions: [
      "Definitions (Digital Assets, Custody Account, Approved Custodian, Market Value, LTV Ratio)",
      "Representations and warranties (sole owner, no prior liens, lawfully acquired, authority to pledge)",
      "Covenants (maintain in custody, no transfer without consent, respond to margin calls, report fork/airdrop events)",
      "Hard fork and airdrop treatment (resulting assets constitute additional collateral)",
    ],
    regulatoryReferences: [
      "UCC Article 9 applicability to digital assets (evolving — may depend on state)",
      "Wyoming Digital Asset Act (if Wyoming governing law)",
      "BSA/AML compliance (31 CFR 1010) — KYC, suspicious activity reporting",
      "FinCEN virtual currency guidance (FIN-2019-G001)",
    ],
    crossDocConsistency: [
      "Loan amount matches promissory note and loan agreement",
      "Custody account references match custody agreement",
      "LTV thresholds consistent with loan agreement margin provisions",
    ],
  },

  // ---------------------------------------------------------------------------
  // Custody Agreement
  // ---------------------------------------------------------------------------
  custody_agreement: {
    docType: "custody_agreement",
    requiredProvisions: [
      "Three-party structure (Depositor/borrower, Secured Party/lender, Custodian)",
      "Custodian responsibilities (segregated cold storage, multi-sig authorization, accurate records, monthly statements, legal compliance, SOC 2)",
      "Access control (deposits without approval, withdrawals require secured party authorization, default provisions, repayment release)",
      "Insurance requirements (minimum coverage equal to loan amount, crime/theft/cyber coverage, secured party as loss payee)",
      "Transfer provisions (deposit procedures, withdrawal procedures, fork/airdrop treatment, staking/governance rights)",
      "Termination provisions (upon repayment, upon default, voluntary custodian termination with 90 days notice)",
    ],
    standardProvisions: [
      "Indemnification (each party indemnifies others for breach, negligence, fraud, legal non-compliance)",
      "Limitation of liability (no liability for force majeure, network failures, regulatory changes; excludes gross negligence/fraud)",
      "Additional access control (MFA, IP whitelisting, time-delayed large withdrawals, emergency access, key rotation)",
      "Custody terms (fiduciary duty, business continuity, minimum uptime 99.9%, security incident notification within 1 hour)",
    ],
    regulatoryReferences: [
      "State digital asset custody regulations (varies by jurisdiction)",
      "BSA/AML compliance (anti-money laundering, know your customer)",
      "SOC 2 Type II certification requirements",
      "State trust company or money transmitter licensing (if applicable to custodian)",
    ],
    crossDocConsistency: [
      "Custody account references match digital asset pledge agreement",
      "Approved custodian requirements consistent with pledge agreement",
      "Default triggers reference loan agreement and pledge agreement events of default",
    ],
  },

  // ---------------------------------------------------------------------------
  // Opinion Letter
  // ---------------------------------------------------------------------------
  opinion_letter: {
    docType: "opinion_letter",
    requiredProvisions: [
      "Documents reviewed list (all loan documents reviewed, identified by date and parties)",
      "Standard assumptions (genuineness of signatures, authority of other parties, authenticity of documents)",
      "Enforceability opinion with bankruptcy/equity carve-outs (documents are valid and enforceable except as limited by bankruptcy, insolvency, and equitable principles)",
      "Authority opinion (borrower has power and authority to execute and deliver loan documents)",
      "No conflicts opinion (execution does not violate organizational documents, applicable law, or existing agreements)",
    ],
    standardProvisions: [
      "Organization and good standing opinion (entity is duly organized, validly existing, in good standing)",
      "No litigation opinion (no pending litigation that would materially affect borrower or transaction)",
      "Compliance with laws opinion (transaction does not violate applicable laws)",
      "Qualifications and limitations (opinion limited to laws of specified jurisdictions, reliance on certificates, etc.)",
    ],
    regulatoryReferences: [
      "ABA Accord guidelines (legal opinion practices per American Bar Association standards)",
      "TriBar Opinion Committee standards (customary opinion practice and interpretation)",
    ],
    crossDocConsistency: [
      "Loan documents referenced by correct dates and parties",
      "Entity type matches organizational documents",
      "State law matches governing law clause in loan documents",
    ],
  },
};

// =============================================================================
// Program-specific overlays
// Each program can add provisions ON TOP of the base checklist for doc types
// that program uses. Only the fields specified are merged; unspecified fields
// are left as-is from the base checklist.
// =============================================================================

const PROGRAM_OVERLAYS: Record<string, Record<string, Partial<LegalChecklist>>> = {
  // ---------------------------------------------------------------------------
  // SBA 7(a)
  // ---------------------------------------------------------------------------
  sba_7a: {
    promissory_note: {
      requiredProvisions: [
        "SBA prepayment penalty per SBA SOP 50 10 7 (declining 5/3/1% in years 1-3 for loans with maturity >=15 years)",
        "SBA interest rate cap compliance (Prime + 4.5% max for $250K-$350K, Prime + 3.0% max for >$350K per SBA SOP 50 10)",
      ],
      regulatoryReferences: [
        "13 CFR 120 compliance — all SBA 7(a) loans must comply with 13 CFR Part 120",
      ],
    },
    loan_agreement: {
      requiredProvisions: [
        "SBA Authorization reference — loan agreement must reference the SBA Authorization letter",
        "SBA use of proceeds restrictions per SBA SOP 50 10",
      ],
      regulatoryReferences: [
        "SBA Credit Elsewhere test documentation per 13 CFR 120.101",
      ],
    },
    guaranty: {
      requiredProvisions: [
        "SBA unlimited personal guaranty requirement for owners with 20%+ ownership per SBA SOP 50 10",
      ],
    },
    commitment_letter: {
      requiredProvisions: [
        "SBA guaranty fee disclosure (tiered: 2% ≤$150K, 3% $150K-$700K, 3.5% $700K-$1M, 3.75% >$1M)",
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // SBA 504
  // ---------------------------------------------------------------------------
  sba_504: {
    loan_agreement: {
      requiredProvisions: [
        "CDC dual-lien structure (50% bank first lien + 40% CDC second lien + borrower equity: 10% standard, 15% if new business OR special-use property, 20% if both)",
        "SBA 504 occupancy requirement — borrower must occupy 51%+ of property",
      ],
      regulatoryReferences: [
        "SBA 504 job creation/retention requirements per 13 CFR 120.861-120.862",
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Commercial CRE
  // ---------------------------------------------------------------------------
  commercial_cre: {
    loan_agreement: {
      requiredProvisions: [
        "FIRREA appraisal requirement for loans >$1M secured by commercial real estate (threshold raised from $500K per 2024 interagency rule)",
      ],
    },
    environmental_indemnity: {
      requiredProvisions: [
        "Phase I ESA requirement prior to closing",
      ],
    },
    assignment_of_leases: {
      requiredProvisions: [
        "Cash management/lockbox provisions triggered upon DSCR falling below covenant threshold",
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // DSCR
  // ---------------------------------------------------------------------------
  dscr: {
    promissory_note: {
      regulatoryReferences: [
        "Non-QM disclosure — this loan does not meet Qualified Mortgage standards under CFPB ATR rule (12 CFR 1026.43)",
      ],
    },
    loan_agreement: {
      regulatoryReferences: [
        "TILA/Reg Z disclosures required (APR, finance charge, amount financed, total of payments)",
        "HMDA data collection requirements per Reg C (12 CFR 1003)",
        "HPML check — if rate exceeds APOR + 1.5%, Higher-Priced Mortgage Loan requirements apply (escrow, appraisal)",
      ],
    },
    commitment_letter: {
      regulatoryReferences: [
        "TRID timing — Loan Estimate within 3 business days of application, Closing Disclosure 3 business days before consummation",
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Bank Statement (inherits DSCR overlays plus its own)
  // ---------------------------------------------------------------------------
  bank_statement: {
    promissory_note: {
      regulatoryReferences: [
        "Non-QM disclosure — this loan does not meet Qualified Mortgage standards under CFPB ATR rule (12 CFR 1026.43)",
      ],
    },
    loan_agreement: {
      requiredProvisions: [
        "Alternative income documentation methodology (12-24 month bank deposit analysis in lieu of tax returns)",
      ],
      regulatoryReferences: [
        "TILA/Reg Z disclosures required (APR, finance charge, amount financed, total of payments)",
        "HMDA data collection requirements per Reg C (12 CFR 1003)",
        "HPML check — if rate exceeds APOR + 1.5%, Higher-Priced Mortgage Loan requirements apply (escrow, appraisal)",
        "ATR compliance — ability to repay must be documented through bank statement analysis per 12 CFR 1026.43(c)",
      ],
    },
    commitment_letter: {
      regulatoryReferences: [
        "TRID timing — Loan Estimate within 3 business days of application, Closing Disclosure 3 business days before consummation",
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Bridge
  // ---------------------------------------------------------------------------
  bridge: {
    loan_agreement: {
      requiredProvisions: [
        "Exit strategy requirement — borrower must demonstrate viable exit (refinance or sale) with supporting evidence",
        "Maturity extension provisions — conditions for any extension of the short-term maturity",
      ],
    },
    commitment_letter: {
      requiredProvisions: [
        "Exit strategy milestones and timeline",
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Crypto-Collateralized
  // ---------------------------------------------------------------------------
  crypto_collateral: {
    loan_agreement: {
      requiredProvisions: [
        "Margin call provisions — specific LTV triggers (80% margin call with 24-hour cure, 90% automatic liquidation)",
        "Digital asset valuation methodology (pricing source, frequency, averaging method)",
      ],
      regulatoryReferences: [
        "BSA/AML compliance per 31 CFR 1010 — Customer Identification Program, Suspicious Activity Reporting",
        "FinCEN virtual currency guidance (FIN-2019-G001) compliance",
        "State digital asset lending law compliance (varies by jurisdiction)",
      ],
    },
    security_agreement: {
      requiredProvisions: [
        "Digital asset custody and wallet control provisions — collateral must remain in lender-controlled or approved custodial wallet",
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Equipment Financing
  // ---------------------------------------------------------------------------
  equipment_financing: {
    security_agreement: {
      requiredProvisions: [
        "Equipment-specific collateral description including make, model, serial number, year of manufacture, and location",
        "Equipment useful life depreciation acknowledgment — term must not exceed useful life of equipment",
      ],
    },
    ucc_financing_statement: {
      requiredProvisions: [
        "Equipment-specific UCC filing with detailed equipment description per §9-108",
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Line of Credit
  // ---------------------------------------------------------------------------
  line_of_credit: {
    loan_agreement: {
      requiredProvisions: [
        "Revolving credit mechanics — draw/repay/redraw provisions, maximum outstanding balance, advance request procedures",
        "Annual clean-up provision — zero balance for 30 consecutive days",
        "Borrowing base formula — eligible receivables and inventory percentages, concentration limits, dilution reserves",
      ],
    },
    security_agreement: {
      requiredProvisions: [
        "Floating lien on rotating collateral (accounts receivable, inventory) per UCC §9-204",
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // Conventional Business — no special overlays beyond base checklists
  // ---------------------------------------------------------------------------
};

/**
 * Returns the legal checklist for the given document type, optionally merged
 * with program-specific provisions. If programId is provided and overlays
 * exist for that program + docType combo, the overlay provisions are appended
 * to the base checklist (no duplicates).
 */
export function getLegalChecklist(docType: string, programId?: string): LegalChecklist | null {
  const base = CHECKLISTS[docType];
  if (!base) return null;

  // No program specified or no overlays for this program — return base
  if (!programId) return base;
  const programOverlays = PROGRAM_OVERLAYS[programId];
  if (!programOverlays) return base;
  const overlay = programOverlays[docType];
  if (!overlay) return base;

  // Merge: base + overlay (deduplicate by exact string match)
  const merge = (baseArr: string[], overlayArr?: string[]): string[] => {
    if (!overlayArr || overlayArr.length === 0) return baseArr;
    const existing = new Set(baseArr);
    const additions = overlayArr.filter((item) => !existing.has(item));
    return [...baseArr, ...additions];
  };

  return {
    docType: base.docType,
    requiredProvisions: merge(base.requiredProvisions, overlay.requiredProvisions),
    standardProvisions: merge(base.standardProvisions, overlay.standardProvisions),
    regulatoryReferences: merge(base.regulatoryReferences, overlay.regulatoryReferences),
    crossDocConsistency: merge(base.crossDocConsistency, overlay.crossDocConsistency),
  };
}
