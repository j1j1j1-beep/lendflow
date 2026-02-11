// legal-knowledge.ts
// Per-document-type legal checklists for enhanced AI legal review.
// Each checklist contains specific provisions the AI reviewer must verify.

export interface LegalChecklist {
  docType: string;
  requiredProvisions: string[];      // MUST be present — critical if missing
  standardProvisions: string[];      // SHOULD be present — warning if missing
  regulatoryReferences: string[];    // Specific statutes/regulations to verify compliance
  crossDocConsistency: string[];     // Things that must match other docs in the package
}

const CHECKLISTS: Record<string, LegalChecklist> = {
  // Promissory Note
  promissory_note: {
    docType: "promissory_note",
    requiredProvisions: [
      "Default provisions (what constitutes an event of default) (TEMPLATE-HANDLED: already in deterministic default events section, mark as passed)",
      "Acceleration clause (entire balance due upon default) (TEMPLATE-HANDLED: already in deterministic acceleration section, mark as passed)",
      "Late fee provision (amount/percentage and grace period) (TEMPLATE-HANDLED: already in deterministic late charges section, mark as passed)",
      "Governing law clause",
    ],
    standardProvisions: [
      "Business day convention (next business day if due date falls on weekend/holiday) (TEMPLATE-HANDLED: already in deterministic payment terms section, mark as passed)",
      "Usury savings clause (rate shall not exceed maximum permitted by law) (TEMPLATE-HANDLED: already in deterministic interest rate cap section, mark as passed)",
      "Waiver of presentment, demand, and protest",
    ],
    regulatoryReferences: [
      "State usury limits (interest rate must not exceed state maximum for loan type/amount)",
    ],
    crossDocConsistency: [],
  },

  // Loan Agreement
  loan_agreement: {
    docType: "loan_agreement",
    requiredProvisions: [
      "Definitions section (defined terms capitalized and cross-referenced) (TEMPLATE-HANDLED: already in deterministic definitions table, mark as passed)",
      "Representations and warranties (borrower reps about authority, financials, no litigation, etc.)",
      "Financial covenants (DSCR, leverage ratio, minimum liquidity, etc. with numeric thresholds) (TEMPLATE-HANDLED: already in deterministic financial covenants table, mark as passed)",
      "Events of default (comprehensive list including payment, covenant breach, cross-default, MAC, etc.) (TEMPLATE-HANDLED: already in deterministic events of default enumeration, mark as passed)",
      "Remedies upon default (acceleration, set-off, enforcement rights)",
      "Conditions precedent to funding (documentation, legal opinions, insurance, etc.) (TEMPLATE-HANDLED: already in deterministic conditions checklist, mark as passed)",
      "Governing law clause",
    ],
    standardProvisions: [
      "Material adverse change (MAC) definition",
      "Cross-default provisions (default under other agreements triggers default here) (TEMPLATE-HANDLED: already in deterministic events of default section, mark as passed)",
      "Notice provisions (addresses, methods, deemed receipt timing)",
      "Amendment and waiver requirements (written consent, lender approval thresholds)",
      "Severability clause",
    ],
    regulatoryReferences: [
      "TILA disclosures (if consumer loan — APR, finance charge, amount financed, total of payments)",
      "Regulation Z (12 CFR Part 1026) — commercial purpose loans generally exempt per § 1026.3(a)(1)",
      "Regulation Z § 1026.36 — Loan originator compensation rules (no term-based compensation, no dual compensation, steering prohibitions, SAFE Act qualification)",
      "ECOA compliance (no discriminatory terms or conditions) — when AI/automated models are used in credit decisions, specific adverse action reasons required per 12 CFR 1002.9; fair lending testing framework must be in place",
      "AI-assisted document generation fair lending disclaimer — per ECOA/CFPB guidance, loan documents generated with AI assistance should include language confirming fair lending compliance review and that AI-generated content has been reviewed for discriminatory language or terms",
      "OFAC screening — all transaction parties must be screened against the Consolidated Sanctions List (not just the SDN list; includes SDN, SSI, FSE, and all other OFAC lists)",
      "Section 1071 (Dodd-Frank) — small business lending data collection; Tier 1 institutions (2,500+ covered transactions/year) must begin collecting by July 1, 2026",
      "State usury limits (rate within permissible bounds for jurisdiction and loan type)",
    ],
    crossDocConsistency: [
      "Loan amount matches promissory note",
      "Interest rate matches promissory note",
      "Covenant thresholds match compliance certificate thresholds",
    ],
  },

  // Security Agreement
  security_agreement: {
    docType: "security_agreement",
    requiredProvisions: [
      "Grant of security interest (debtor hereby grants to secured party a security interest in...) (TEMPLATE-HANDLED: already in deterministic grant clause, mark as passed)",
      "Collateral description using UCC Article 9 categories per section 9-108 (accounts, chattel paper, equipment, general intangibles, instruments, inventory, etc.) (TEMPLATE-HANDLED: already in deterministic collateral enumeration, mark as passed)",
      "After-acquired property clause per UCC section 9-204 (security interest attaches to after-acquired collateral)",
      "Proceeds clause (all proceeds, products, rents, and profits of collateral) (TEMPLATE-HANDLED: already in deterministic proceeds language, mark as passed)",
      "Perfection provisions (authorization to file financing statements, control agreements, etc.)",
      "Events of default (triggers for enforcement of security interest) (TEMPLATE-HANDLED: already in deterministic events section, mark as passed)",
      "Remedies upon default (right to take possession, sell, collect, etc.) (TEMPLATE-HANDLED: already in deterministic remedies section, mark as passed)",
    ],
    standardProvisions: [
      "Representations re: title and liens (debtor has good title, no prior liens except permitted) (TEMPLATE-HANDLED: already in deterministic representations items, mark as passed)",
      "Maintenance covenants (keep collateral in good condition, repair, etc.) (TEMPLATE-HANDLED: already in deterministic covenants section, mark as passed)",
      "Insurance requirements (maintain insurance on collateral, lender as loss payee/additional insured) (TEMPLATE-HANDLED: already in deterministic covenant 6.2, mark as passed)",
      "Inspection rights (lender may inspect collateral upon reasonable notice) (TEMPLATE-HANDLED: already in deterministic covenant 6.3, mark as passed)",
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

  // Guaranty
  guaranty: {
    docType: "guaranty",
    requiredProvisions: [
      "Absolute and unconditional guaranty of payment (not merely collection) (TEMPLATE-HANDLED: already in deterministic scope statement, mark as passed)",
      "Waiver of defenses (suretyship defenses, marshaling, exhaustion, etc.) (TEMPLATE-HANDLED: already in deterministic waiver items (a-g), mark as passed)",
      "Subrogation waiver (guarantor waives subrogation rights until all obligations paid in full) (TEMPLATE-HANDLED: already in deterministic subrogation section, mark as passed)",
      "Subordination of guarantor claims (guarantor claims subordinate to lender claims) (TEMPLATE-HANDLED: already in deterministic subordination section, mark as passed)",
    ],
    standardProvisions: [
      "Scope covers all obligations (principal, interest, fees, costs, enforcement expenses) (TEMPLATE-HANDLED: already in deterministic guaranteed amount section, mark as passed)",
      "Irrevocability (guaranty cannot be revoked while obligations remain outstanding) (TEMPLATE-HANDLED: already in deterministic irrevocability statement, mark as passed)",
      "Joint and several liability (if multiple guarantors)",
      "Spousal consent (required in community property states: AZ, CA, ID, LA, NV, NM, TX, WA, WI (plus opt-in community property trust states: AK, FL, KY, SD, TN)) (TEMPLATE-HANDLED: already in deterministic spousal consent section, mark as passed)",
      "Financial reporting requirements (guarantor must provide periodic financial statements) (TEMPLATE-HANDLED: already in deterministic covenant 7.1, mark as passed)",
    ],
    regulatoryReferences: [
      "Community property states (AZ, CA, ID, LA, NV, NM, TX, WA, WI (plus opt-in community property trust states: AK, FL, KY, SD, TN)) may require spousal consent for enforceability",
    ],
    crossDocConsistency: [
      "Guaranteed amount matches promissory note principal",
      "Borrower name is consistent across all documents",
    ],
  },

  // Commitment Letter
  commitment_letter: {
    docType: "commitment_letter",
    requiredProvisions: [
      "Loan amount (TEMPLATE-HANDLED: already in deterministic Loan Terms Summary table, mark as passed)",
      "Interest rate (or rate determination mechanism) (TEMPLATE-HANDLED: already in deterministic terms table, mark as passed)",
      "Term (maturity) (TEMPLATE-HANDLED: already in deterministic terms table, mark as passed)",
      "Conditions precedent to closing and funding",
      "Expiration date (commitment expires if not accepted by date) (TEMPLATE-HANDLED: already in deterministic commitment termination section, mark as passed)",
      "Acceptance method (how borrower accepts — signature, return of executed copy, etc.)",
    ],
    standardProvisions: [
      "Commitment fee (amount, when due, refundability) (TEMPLATE-HANDLED: already in deterministic fees schedule, mark as passed)",
      "Breakup provisions (consequences if deal does not close) (TEMPLATE-HANDLED: already in deterministic Assignability section, mark as passed)",
      "Material adverse change termination right (TEMPLATE-HANDLED: already in deterministic MAC clause, mark as passed)",
      "Time is of the essence clause (TEMPLATE-HANDLED: already in deterministic section, mark as passed)",
    ],
    regulatoryReferences: [
      "State lending license requirements (lender must be properly licensed in borrower's state)",
    ],
    crossDocConsistency: [
      "Terms match loan agreement (rate, amount, term, fees)",
      "Fees match settlement statement",
    ],
  },

  // Environmental Indemnity
  environmental_indemnity: {
    docType: "environmental_indemnity",
    requiredProvisions: [
      "Hazardous substances definition (per CERCLA 42 USC section 9601 — includes petroleum, asbestos, PCBs, etc.) (TEMPLATE-HANDLED: already in deterministic CERCLA definition, mark as passed)",
      "Environmental laws definition (comprehensive list: CERCLA, RCRA, Clean Water Act, Clean Air Act, state equivalents) (TEMPLATE-HANDLED: already in deterministic environmental laws definition, mark as passed)",
      "Indemnification scope (losses, costs, damages, remediation, fines, penalties, attorneys fees) (TEMPLATE-HANDLED: already in deterministic indemnification section, mark as passed)",
      "Survival clause (obligations survive repayment of loan, release of lien, foreclosure) (TEMPLATE-HANDLED: already in deterministic survival statement, mark as passed)",
      "Remediation obligations (indemnitor must remediate to applicable standards at own cost)",
    ],
    standardProvisions: [
      "Representations re: no existing contamination (property free of hazardous substances)",
      "Covenants re: ongoing compliance (will not use, store, generate, release hazardous substances)",
      "Right to conduct environmental assessments (Phase I, Phase II at indemnitor expense if triggered)",
      "Unsecured obligation (indemnity is not secured by any collateral — avoids lender liability) (TEMPLATE-HANDLED: already in deterministic unsecured obligation statement, mark as passed)",
      "Subrogation waiver (TEMPLATE-HANDLED: already in deterministic subrogation waiver, mark as passed)",
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

  // Assignment of Leases
  assignment_of_leases: {
    docType: "assignment_of_leases",
    requiredProvisions: [
      "Assignment grant (borrower assigns all right, title, and interest in leases and rents) (TEMPLATE-HANDLED: already in deterministic assignment grant statement, mark as passed)",
      "Revocable license to collect (borrower retains license to collect rents until default) (TEMPLATE-HANDLED: already in deterministic license section, mark as passed)",
      "Default triggers (license revoked upon event of default under loan documents) (TEMPLATE-HANDLED: already in deterministic default trigger section, mark as passed)",
      "Receiver appointment rights (lender may seek appointment of receiver to collect rents) (TEMPLATE-HANDLED: already in deterministic receiver rights section, mark as passed)",
    ],
    standardProvisions: [
      "Representations about existing leases (all leases disclosed, in full force, no defaults)",
      "Covenants to maintain leases (will not modify, terminate, or accept surrender without consent)",
      "Cash management provisions (lockbox, sweep to lender-controlled account upon trigger event) (TEMPLATE-HANDLED: already in deterministic cash management section, mark as passed)",
      "SNDA requirements (lender may require tenant subordination, non-disturbance, and attornment agreements)",
      "Recording authorization (borrower authorizes recording of assignment in applicable jurisdiction) (TEMPLATE-HANDLED: already in deterministic recording section, mark as passed)",
    ],
    regulatoryReferences: [
      "State recording requirements (assignment must be recorded in county where property is located)",
    ],
    crossDocConsistency: [
      "Property address matches deed of trust/security instrument",
      "Loan amount is consistent across all documents",
    ],
  },

  // Subordination Agreement
  subordination_agreement: {
    docType: "subordination_agreement",
    requiredProvisions: [
      "Blanket subordination clause (subordinate debt is subordinate in right of payment and priority) (TEMPLATE-HANDLED: already in deterministic subordination statement, mark as passed)",
      "Payment restrictions (no payments on subordinate debt during blockage period or after default) (TEMPLATE-HANDLED: already in deterministic payment restrictions, mark as passed)",
      "Standstill provisions (subordinate creditor may not enforce remedies for specified period) (TEMPLATE-HANDLED: already in deterministic standstill provision, mark as passed)",
      "Turnover obligations (any payments received in violation must be turned over to senior creditor) (TEMPLATE-HANDLED: already in deterministic turnover section, mark as passed)",
    ],
    standardProvisions: [
      "Definitions of senior debt and subordinate debt (clearly delineated) (TEMPLATE-HANDLED: already in deterministic definitions section, mark as passed)",
      "Permitted payments (scheduled interest, principal payments when no default exists)",
      "Cure rights (subordinate creditor may cure senior defaults to protect position) (TEMPLATE-HANDLED: already in deterministic cure rights section, mark as passed)",
      "Notice requirements (senior creditor must notify subordinate creditor of defaults) (TEMPLATE-HANDLED: already in deterministic notices section, mark as passed)",
    ],
    regulatoryReferences: [
      "UCC priority rules (subordination agreement modifies otherwise applicable priority)",
    ],
    crossDocConsistency: [
      "Senior debt description matches loan agreement",
      "Subordinate creditor name is consistent across all documents",
    ],
  },

  // Intercreditor Agreement
  intercreditor_agreement: {
    docType: "intercreditor_agreement",
    requiredProvisions: [
      "Lien priority establishment (first lien vs. second lien priority clearly stated) (TEMPLATE-HANDLED: already in deterministic lien priority section, mark as passed)",
      "Payment waterfall (order of distribution: first lien obligations, then second lien, then residual) (TEMPLATE-HANDLED: already in deterministic payment waterfall section, mark as passed)",
      "Standstill period (90-180 days during which second lien creditor may not enforce) (TEMPLATE-HANDLED: already in deterministic standstill section, mark as passed)",
      "Enforcement rights allocation (first lien controls enforcement; second lien standstill) (TEMPLATE-HANDLED: already in deterministic enforcement rights, mark as passed)",
      "Purchase option (second lien creditor may purchase first lien obligations at par plus accrued) (TEMPLATE-HANDLED: already in deterministic purchase option, mark as passed)",
      "Bankruptcy provisions (waivers, DIP financing consent, adequate protection allocation) (TEMPLATE-HANDLED: already in deterministic bankruptcy section, mark as passed)",
    ],
    standardProvisions: [
      "Anti-marshaling (first lien creditor not required to marshal assets)",
      "DIP financing consent (second lien creditor consents to first lien DIP financing up to cap) (TEMPLATE-HANDLED: already in deterministic bankruptcy section, mark as passed)",
      "Adequate protection waivers (second lien waives right to adequate protection payments)",
      "Plan voting (limitations on second lien creditor voting against first lien creditor-supported plan) (TEMPLATE-HANDLED: already in deterministic bankruptcy section, mark as passed)",
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

  // Corporate Resolution
  corporate_resolution: {
    docType: "corporate_resolution",
    requiredProvisions: [
      "WHEREAS recitals establishing the need for borrowing and authority to borrow (TEMPLATE-HANDLED: already in deterministic recital paragraphs, mark as passed)",
      "RESOLVED authorization clause (entity authorizes execution of loan documents and borrowing) (TEMPLATE-HANDLED: already in deterministic resolved clause, mark as passed)",
      "Authorized signers designation (specific individuals authorized to sign on behalf of entity) (TEMPLATE-HANDLED: already in deterministic authorized signers list, mark as passed)",
      "Ratification clause (all prior actions taken in connection with the loan are ratified)",
      "Secretary/manager certification (officer certifies resolution was duly adopted, remains in effect) (TEMPLATE-HANDLED: already in deterministic certification language, mark as passed)",
    ],
    standardProvisions: [
      "Entity type identification (LLC, corporation, partnership — correct terminology) (TEMPLATE-HANDLED: already in deterministic entity type selector, mark as passed)",
      "Good standing certification (entity is in good standing in state of formation)",
      "Organizational documents current (articles/certificate of formation, operating agreement/bylaws current)",
      "Counterparts clause (resolution may be executed in counterparts) (TEMPLATE-HANDLED: already in deterministic counterparts language, mark as passed)",
    ],
    regulatoryReferences: [
      "State entity law requirements (LLC Act, Business Corporation Act, or Partnership Act as applicable)",
    ],
    crossDocConsistency: [
      "Entity name matches borrower name in loan documents",
      "Loan amount referenced matches promissory note",
    ],
  },

  // UCC Financing Statement
  ucc_financing_statement: {
    docType: "ucc_financing_statement",
    requiredProvisions: [
      "Debtor exact legal name (must match name on public organic record — articles, certificate of formation) (TEMPLATE-HANDLED: already in deterministic from input, mark as passed)",
      "Secured party name and address (TEMPLATE-HANDLED: already in deterministic from input, mark as passed)",
      "Collateral description by UCC Article 9 categories (accounts, chattel paper, deposit accounts, equipment, general intangibles, instruments, inventory, investment property, etc.) (TEMPLATE-HANDLED: already in deterministic enumerated collateral, mark as passed)",
      "Filing state (state of debtor's location per UCC section 9-307) (TEMPLATE-HANDLED: already in deterministic from input, mark as passed)",
    ],
    standardProvisions: [
      "Organization ID number (state-issued organizational identification number)",
      "State of organization (jurisdiction of formation)",
      "Proceeds coverage (all proceeds and products of the foregoing) (TEMPLATE-HANDLED: already in deterministic proceeds clause, mark as passed)",
      "Filing instructions (file with Secretary of State of debtor's state of organization) (TEMPLATE-HANDLED: already in deterministic filing instructions, mark as passed)",
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

  // SNDA (Subordination, Non-Disturbance and Attornment)
  snda: {
    docType: "snda",
    requiredProvisions: [
      "Subordination of lease to mortgage (tenant's lease is subordinate to lender's mortgage/deed of trust) (TEMPLATE-HANDLED: already in deterministic subordination statement, mark as passed)",
      "Non-disturbance covenant (lender agrees not to disturb tenant's possession if tenant not in default) (TEMPLATE-HANDLED: already in deterministic non-disturbance section, mark as passed)",
      "Attornment agreement (tenant agrees to attorn to successor landlord after foreclosure) (TEMPLATE-HANDLED: already in deterministic attornment section, mark as passed)",
      "Lender protection limitations (lender not bound by rent prepayments, offsets, or landlord obligations accruing pre-foreclosure) (TEMPLATE-HANDLED: already in deterministic lender protections section, mark as passed)",
    ],
    standardProvisions: [
      "Tenant quiet enjoyment (so long as tenant performs, possession shall not be disturbed) (TEMPLATE-HANDLED: already in deterministic tenant protections section, mark as passed)",
      "Notice and cure rights for landlord default (tenant must give lender notice and opportunity to cure before exercising remedies) (TEMPLATE-HANDLED: already in deterministic notice section, mark as passed)",
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

  // Estoppel Certificate
  estoppel_certificate: {
    docType: "estoppel_certificate",
    requiredProvisions: [
      "Lease status confirmation (TEMPLATE-HANDLED: already in deterministic certifications 1-9, mark as passed)",
      "No defaults certification (TEMPLATE-HANDLED: already in deterministic certifications 1-9, mark as passed)",
      "Rent current confirmation (TEMPLATE-HANDLED: already in deterministic certifications 1-9, mark as passed)",
      "Security deposit amount (TEMPLATE-HANDLED: already in deterministic certifications 1-9, mark as passed)",
      "No prepaid rent (TEMPLATE-HANDLED: already in deterministic certifications 1-9, mark as passed)",
    ],
    standardProvisions: [
      "No purchase options or rights of first refusal (TEMPLATE-HANDLED: already in deterministic certifications 1-9)",
      "No assignments or subleases (TEMPLATE-HANDLED: already in deterministic certifications 1-9)",
      "Improvements complete (TEMPLATE-HANDLED: already in deterministic certifications 1-9)",
      "Reliance limitation (TEMPLATE-HANDLED: already in deterministic Reliance section)",
    ],
    regulatoryReferences: [
      "None specific — estoppel certificates are contractual, not regulated",
    ],
    crossDocConsistency: [
      "Property address matches other loan documents",
    ],
  },

  // Settlement Statement
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

  // Borrower's Certificate
  borrowers_certificate: {
    docType: "borrowers_certificate",
    requiredProvisions: [
      "Representations and warranties reaffirmation (TEMPLATE-HANDLED: already in deterministic certifications 1-10, mark as passed)",
      "No default certification (TEMPLATE-HANDLED: already in deterministic certifications 1-10, mark as passed)",
      "No material adverse change (TEMPLATE-HANDLED: already in deterministic certifications 1-10, mark as passed)",
      "Entity good standing or legal capacity confirmation (TEMPLATE-HANDLED: already in deterministic certifications 1-10, mark as passed)",
      "Authorized execution confirmation (TEMPLATE-HANDLED: already in deterministic certifications 1-10, mark as passed)",
    ],
    standardProvisions: [
      "Financial statements accurate (TEMPLATE-HANDLED: already in deterministic certifications 1-10)",
      "Insurance in place (TEMPLATE-HANDLED: already in deterministic certifications 1-10)",
      "Government approvals obtained (TEMPLATE-HANDLED: already in deterministic certifications 1-10)",
      "Loan proceeds purpose (TEMPLATE-HANDLED: already in deterministic certifications 1-10)",
    ],
    regulatoryReferences: [
      "None specific — borrower certificates are contractual",
    ],
    crossDocConsistency: [
      "Entity name matches borrower name in loan documents",
      "Loan document references are correct (dates, parties, amounts)",
    ],
  },

  // Compliance Certificate
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

  // Amortization Schedule
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

  // Deed of Trust
  deed_of_trust: {
    docType: "deed_of_trust",
    requiredProvisions: [
      "Grant clause conveying property in trust to trustee for benefit of beneficiary (lender) (TEMPLATE-HANDLED: already in deterministic grant language, mark as passed)",
      "Borrower covenants (insurance, taxes, maintenance, compliance with laws, no waste) (TEMPLATE-HANDLED: already in deterministic covenants checklist, mark as passed)",
      "Events of default (payment default, covenant breach, transfer without consent, bankruptcy, condemnation) (TEMPLATE-HANDLED: already in deterministic default events, mark as passed)",
      "Power of sale clause (non-judicial foreclosure authority, notice requirements per state law) (TEMPLATE-HANDLED: already in deterministic power of sale, mark as passed)",
      "Due-on-sale clause (transfer restriction — full balance due upon unauthorized transfer) (TEMPLATE-HANDLED: already in deterministic transfer restriction, mark as passed)",
      "Governing law clause",
    ],
    standardProvisions: [
      "Environmental covenants (no hazardous substances, compliance with environmental laws)",
      "Fixture filing under UCC (deed of trust serves as fixture filing for personal property attached to real estate) (TEMPLATE-HANDLED: already in deterministic fixture filing section, mark as passed)",
      "Assignment of rents (absolute assignment with revocable license to collect until default) (TEMPLATE-HANDLED: already in deterministic assignment of rents, mark as passed)",
      "Subordination to leases (optional, at lender's discretion) (TEMPLATE-HANDLED: already in deterministic subordination option, mark as passed)",
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

  // Closing Disclosure
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

  // Loan Estimate
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

  // SBA Authorization
  sba_authorization: {
    docType: "sba_authorization",
    requiredProvisions: [
      "Loan authorization details (loan amount, SBA guaranty percentage, guaranteed amount, interest rate, term) (TEMPLATE-HANDLED: already in deterministic Loan Authorization table, mark as passed)",
      "SBA guaranty fee calculation (fee rate applied to guaranteed portion) (TEMPLATE-HANDLED: already in deterministic guaranty fee table, mark as passed)",
      "Use of proceeds description (must comply with SBA eligible use requirements)",
      "Standard SBA conditions (credit check, no delinquent federal debt, eligible small business, collateral, personal guaranty) (TEMPLATE-HANDLED: already in deterministic standard conditions list, mark as passed)",
      "Special conditions specific to the deal",
    ],
    standardProvisions: [
      "Authorization expiration (typically 6 months from date) (TEMPLATE-HANDLED: already in deterministic expiration section, mark as passed)",
      "Material change provision (changes in financial condition may cancel authorization)",
      "Life insurance assignment requirement (if applicable)",
      "IRS tax transcript review requirement",
    ],
    regulatoryReferences: [
      "SBA SOP 50 10 8 (Standard Operating Procedures for SBA lending, effective June 1, 2025)",
      "13 CFR Part 120 (SBA business loan program regulations)",
      "13 CFR 120.120 (eligible use of proceeds — acquiring land/buildings, construction, equipment, working capital, refinancing)",
      "SBA guaranty fee schedule per SOP 50 10 8",
      "SBA Form 1919 (revised April 2025 per Executive Order 14168) — Borrower Information Form must use the current revision",
    ],
    crossDocConsistency: [
      "Loan amount matches promissory note and loan agreement",
      "Interest rate matches promissory note",
      "SBA conditions match loan agreement conditions precedent",
    ],
  },

  // CDC Debenture
  cdc_debenture: {
    docType: "cdc_debenture",
    requiredProvisions: [
      "504 project structure (50% first lien bank, 40% CDC/SBA debenture, 10% borrower equity) (TEMPLATE-HANDLED: already in deterministic structure table, mark as passed)",
      "Debenture terms (amount, interest rate, term, maturity date, payment schedule) (TEMPLATE-HANDLED: already in deterministic debenture terms section, mark as passed)",
      "Project description (what is being financed, location, expected use, public benefit)",
      "Job creation/retention requirement (1 job per $90,000 of debenture proceeds, $140,000 for small manufacturers/energy per October 2025 adjustment) (TEMPLATE-HANDLED: already in deterministic job creation calculation, mark as passed)",
      "Occupancy requirement (51% for existing business, 60% for new construction) (TEMPLATE-HANDLED: already in deterministic occupancy section, mark as passed)",
    ],
    standardProvisions: [
      "Standard 504 conditions (eligible use, collateral, insurance, financial reporting, environmental compliance) (TEMPLATE-HANDLED: already in deterministic conditions list, mark as passed)",
      "No change of ownership without CDC and SBA consent",
      "Events of default (payment, job creation, occupancy, misrepresentation, covenant breach, bankruptcy) (TEMPLATE-HANDLED: already in deterministic events of default, mark as passed)",
      "CDC terms and conditions (servicing, oversight, reporting)",
    ],
    regulatoryReferences: [
      "Section 504 of the Small Business Investment Act of 1958",
      "13 CFR Part 120 (SBA 504 program regulations)",
      "13 CFR 120.861-120.862 (job creation and retention requirements)",
      "SBA SOP 50 10 8 (standard operating procedures, effective June 1, 2025)",
    ],
    crossDocConsistency: [
      "Debenture amount consistent with 504 structure (40% of total project cost)",
      "First lien lender name matches loan agreement",
      "Borrower name consistent across all documents",
    ],
  },

  // Borrowing Base Agreement
  borrowing_base_agreement: {
    docType: "borrowing_base_agreement",
    requiredProvisions: [
      "Borrowing base definition (eligible accounts advance rate + eligible inventory advance rate minus reserves) (TEMPLATE-HANDLED: already in deterministic definitions section, mark as passed)",
      "Eligible accounts definition and eligibility criteria (TEMPLATE-HANDLED: already in deterministic definitions, mark as passed)",
      "Eligible inventory definition and eligibility criteria (TEMPLATE-HANDLED: already in deterministic definitions, mark as passed)",
      "Advance rates (typically 80% for eligible accounts, 50% for eligible inventory) (TEMPLATE-HANDLED: already in deterministic definitions and table, mark as passed)",
      "Ineligible accounts list (past due >90 days, foreign, intercompany, government, cross-aged, disputed, encumbered) (TEMPLATE-HANDLED: already in deterministic ineligible accounts list, mark as passed)",
      "Ineligible inventory list (WIP, consigned, in transit, obsolete, third-party locations without waiver, encumbered) (TEMPLATE-HANDLED: already in deterministic ineligible inventory list, mark as passed)",
      "Borrowing base certificate delivery requirements (monthly, upon request, with advance requests)",
      "Events of default (late certificate, material misstatement, overadvance, covenant breach)",
    ],
    standardProvisions: [
      "Concentration limits (no single debtor >25% of eligible accounts) (TEMPLATE-HANDLED: already in deterministic definitions, mark as passed)",
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

  // Digital Asset Pledge
  digital_asset_pledge: {
    docType: "digital_asset_pledge",
    requiredProvisions: [
      "Grant of security interest in all digital assets deposited in custody account (TEMPLATE-HANDLED: already in deterministic grant language, mark as passed)",
      "Collateral description (digital assets, tokens, cryptocurrency, proceeds, forks, airdrops, staking rewards) (TEMPLATE-HANDLED: already in deterministic collateral definitions, mark as passed)",
      "LTV monitoring and margin requirements (continuous monitoring, margin call at 80%, liquidation at 90%) (TEMPLATE-HANDLED: already in deterministic LTV table, mark as passed)",
      "Margin call provisions (24-hour cure period, deposit additional assets or make cash payment, target 70% LTV post-cure) (TEMPLATE-HANDLED: already in deterministic LTV section, mark as passed)",
      "Automatic liquidation provisions (90% LTV trigger, no notice required, commercially reasonable disposition) (TEMPLATE-HANDLED: already in deterministic liquidation rules, mark as passed)",
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

  // Custody Agreement
  custody_agreement: {
    docType: "custody_agreement",
    requiredProvisions: [
      "Three-party structure (Depositor/borrower, Secured Party/lender, Custodian) (TEMPLATE-HANDLED: already in deterministic parties section, mark as passed)",
      "Custodian responsibilities (segregated cold storage, multi-sig authorization, accurate records, monthly statements, legal compliance, SOC 2) (TEMPLATE-HANDLED: already in deterministic subsections 3.1-3.6, mark as passed)",
      "Access control (deposits without approval, withdrawals require secured party authorization, default provisions, repayment release) (TEMPLATE-HANDLED: already in deterministic subsections 4.1-4.4, mark as passed)",
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

  // Opinion Letter
  opinion_letter: {
    docType: "opinion_letter",
    requiredProvisions: [
      "Documents reviewed list (TEMPLATE-HANDLED: already in deterministic Documents Reviewed section with dates and parties, mark as passed)",
      "Standard assumptions (TEMPLATE-HANDLED: already in deterministic Assumptions section, mark as passed)",
      "Enforceability opinion with bankruptcy/equity carve-outs (TEMPLATE-HANDLED: already in deterministic Opinions section, mark as passed)",
      "Authority opinion (TEMPLATE-HANDLED: already in deterministic Opinions section, mark as passed)",
      "No conflicts opinion (TEMPLATE-HANDLED: already in deterministic Opinions section, mark as passed)",
    ],
    standardProvisions: [
      "Organization and good standing opinion (TEMPLATE-HANDLED: already in deterministic Opinions section, mark as passed)",
      "No litigation opinion (TEMPLATE-HANDLED: already in deterministic Opinions section, mark as passed)",
      "Compliance with laws opinion (TEMPLATE-HANDLED: already in deterministic Opinions section, mark as passed)",
      "Qualifications and limitations (TEMPLATE-HANDLED: already in deterministic Qualifications section, mark as passed)",
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

// Program-specific overlays
// Each program can add provisions ON TOP of the base checklist for doc types
// that program uses. Only the fields specified are merged; unspecified fields
// are left as-is from the base checklist.

const PROGRAM_OVERLAYS: Record<string, Record<string, Partial<LegalChecklist>>> = {
  // SBA 7(a)
  sba_7a: {
    promissory_note: {
      requiredProvisions: [
        "SBA prepayment penalty per SBA SOP 50 10 8 (declining 5/3/1% in years 1-3 for loans with maturity >=15 years)",
        "SBA interest rate cap compliance per SOP 50 10 8 ($0-$50K: Prime + 6.5%, $50K-$250K: Prime + 6.0%, $250K-$350K: Prime + 4.5%, >$350K: Prime + 3.0%)",
      ],
      regulatoryReferences: [
        "13 CFR 120 compliance — all SBA 7(a) loans must comply with 13 CFR Part 120",
      ],
    },
    loan_agreement: {
      requiredProvisions: [
        "SBA Authorization reference — loan agreement must reference the SBA Authorization letter",
        "SBA use of proceeds restrictions per SBA SOP 50 10 8",
      ],
      regulatoryReferences: [
        "SBA Credit Elsewhere test reinstated under SOP 50 10 8 per 13 CFR 120.101 — lender must provide detailed narrative explaining why applicant cannot obtain credit on reasonable terms from non-Federal sources, plus personal resources test documenting that the applicant's personal resources (including liquid assets of 20%+ owners) are insufficient to fund the project without SBA assistance",
        "SBA Form 1919 (revised April 2025 per Executive Order 14168) — ensure the current revision of the Borrower Information Form is used for all new applications",
      ],
    },
    guaranty: {
      requiredProvisions: [
        "SBA unlimited personal guaranty requirement for owners with 20%+ ownership per SBA SOP 50 10 8",
      ],
    },
    commitment_letter: {
      requiredProvisions: [
        "SBA guaranty fee disclosure (tiered: 2% ≤$150K, 3% $150K-$700K, 3.5% $700K-$1M, 3.75% >$1M)",
        "FY2026 manufacturing guaranty fee waiver — SBA waives guaranty fees for small manufacturers (NAICS 31-33) in FY2026; verify borrower NAICS code for eligibility",
      ],
    },
  },

  // SBA 504
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

  // Commercial CRE
  commercial_cre: {
    loan_agreement: {
      requiredProvisions: [
        "FIRREA appraisal requirement for CRE loans >$500K (per 2019 interagency rule; the $1M threshold applies to certified-vs-licensed appraiser distinction, not to the appraisal requirement itself)",
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

  // DSCR
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
    closing_disclosure: {
      requiredProvisions: [
        "Non-QM disclosure — loan does not meet QM safe harbor; ATR analysis based on property DSCR rather than personal income",
        "Investment property designation — property is not borrower's primary residence",
      ],
      regulatoryReferences: [
        "12 CFR 1026.38 — TRID Closing Disclosure form must be provided at least 3 business days before consummation",
        "HPML escrow requirements apply if APR exceeds APOR + 1.5% (12 CFR 1026.35)",
      ],
    },
    loan_estimate: {
      requiredProvisions: [
        "Non-QM disclosure — loan does not meet QM safe harbor; ATR analysis based on property DSCR rather than personal income",
        "Investment property designation — property is not borrower's primary residence",
      ],
      regulatoryReferences: [
        "12 CFR 1026.37 — TRID Loan Estimate must be delivered within 3 business days of application",
        "Tolerance categories must be clearly identified per 12 CFR 1026.19(e)(3)",
      ],
    },
  },

  // Bank Statement (inherits DSCR overlays plus its own)
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
    closing_disclosure: {
      requiredProvisions: [
        "Non-QM disclosure — loan does not meet QM safe harbor; ATR documented via bank statement deposit analysis",
        "Alternative income documentation methodology reference (12-24 month bank deposits used in lieu of tax returns)",
      ],
      regulatoryReferences: [
        "12 CFR 1026.38 — TRID Closing Disclosure form must be provided at least 3 business days before consummation",
        "ATR compliance per 12 CFR 1026.43(c) — ability to repay documented through bank statement analysis",
        "HPML escrow requirements apply if APR exceeds APOR + 1.5% (12 CFR 1026.35)",
      ],
    },
    loan_estimate: {
      requiredProvisions: [
        "Non-QM disclosure — loan does not meet QM safe harbor; ATR documented via bank statement deposit analysis",
        "Alternative income documentation methodology reference (12-24 month bank deposits used in lieu of tax returns)",
      ],
      regulatoryReferences: [
        "12 CFR 1026.37 — TRID Loan Estimate must be delivered within 3 business days of application",
        "Tolerance categories must be clearly identified per 12 CFR 1026.19(e)(3)",
        "ATR compliance per 12 CFR 1026.43(c) — ability to repay documented through bank statement analysis",
      ],
    },
  },

  // Bridge
  bridge: {
    loan_agreement: {
      requiredProvisions: [
        "Exit strategy requirement — borrower must demonstrate viable exit (refinance or sale) with supporting evidence",
        "Maturity extension provisions — conditions for any extension of the short-term maturity",
      ],
      regulatoryReferences: [
        "Commercial financing disclosure laws — 11 states (CA, NY, VA, UT, FL, GA, CT, KS, MO, TX, LA) require TILA-like disclosures for commercial financing; verify borrower state and provide required disclosures if applicable",
      ],
    },
    commitment_letter: {
      requiredProvisions: [
        "Exit strategy milestones and timeline",
      ],
    },
  },

  // Crypto-Collateralized
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
        "GENIUS Act (P.L. 119-XX, signed July 18, 2025) — if stablecoin collateral, verify issuer is licensed payment stablecoin issuer with 1:1 reserve backing; SAB 122 replaces SAB 121 for crypto custody accounting",
        "OCC/FDIC/Fed 2025 crypto guidance withdrawal — banks no longer need prior supervisory non-objection for crypto activities but must maintain appropriate risk management",
      ],
    },
    security_agreement: {
      requiredProvisions: [
        "Digital asset custody and wallet control provisions — collateral must remain in lender-controlled or approved custodial wallet",
      ],
    },
  },

  // Equipment Financing
  equipment_financing: {
    loan_agreement: {
      regulatoryReferences: [
        "Commercial financing disclosure laws — 11 states (CA, NY, VA, UT, FL, GA, CT, KS, MO, TX, LA) require TILA-like disclosures for commercial financing; verify borrower state and provide required disclosures if applicable",
      ],
    },
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

  // Line of Credit
  line_of_credit: {
    loan_agreement: {
      requiredProvisions: [
        "Revolving credit mechanics — draw/repay/redraw provisions, maximum outstanding balance, advance request procedures",
        "Annual clean-up provision — zero balance for 30 consecutive days",
        "Borrowing base formula — eligible receivables and inventory percentages, concentration limits, dilution reserves",
      ],
      regulatoryReferences: [
        "Commercial financing disclosure laws — 11 states (CA, NY, VA, UT, FL, GA, CT, KS, MO, TX, LA) require TILA-like disclosures for commercial financing; verify borrower state and provide required disclosures if applicable",
      ],
    },
    security_agreement: {
      requiredProvisions: [
        "Floating lien on rotating collateral (accounts receivable, inventory) per UCC §9-204",
      ],
    },
  },

  // Conventional Business
  conventional_business: {
    loan_agreement: {
      regulatoryReferences: [
        "Commercial financing disclosure laws — 11 states (CA, NY, VA, UT, FL, GA, CT, KS, MO, TX, LA) require TILA-like disclosures for commercial financing; verify borrower state and provide required APR, total cost, and payment schedule disclosures if applicable",
      ],
    },
  },
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
