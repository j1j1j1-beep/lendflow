// =============================================================================
// legal-references.ts
// Actual statutory text excerpts organized by document type. These get injected
// into AI prose generation prompts so the AI writes FROM the actual law.
// =============================================================================

const SECURITY_AGREEMENT_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

UCC Section 9-108(a)-(c) — Sufficiency of Description:
(a) "Except as otherwise provided in subsections (c), (d), and (e), a description of personal or real property is sufficient, whether or not it is specific, if it reasonably identifies what is described." (b) A description reasonably identifies collateral if it identifies by: (1) specific listing; (2) category; (3) a type of collateral defined in the UCC; (4) quantity; (5) computational or allocational formula; or (6) any other method if objectively determinable. Approved UCC Article 9 collateral categories include: accounts, chattel paper, commercial tort claims, deposit accounts, documents, equipment, general intangibles, goods, health-care-insurance receivables, instruments, inventory, investment property, letter-of-credit rights, letters of credit, money, oil/gas/minerals, proceeds, software, and supporting obligations. (c) CRITICAL: A description of collateral as "all the debtor's assets" or "all the debtor's personal property" or using words of similar import does NOT reasonably identify the collateral in a security agreement.

UCC Section 9-204(a)-(b) — After-Acquired Collateral:
(a) "Except as otherwise provided in subsection (b), a security agreement may create or provide for a security interest in after-acquired collateral." (b) Exception: a security interest does not attach under an after-acquired property clause to consumer goods (other than accessions given as additional security) or commercial tort claims.

UCC Section 9-315(a) — Disposition and Proceeds:
(a)(1) "A security interest or agricultural lien continues in collateral notwithstanding sale, lease, license, exchange, or other disposition thereof unless the secured party authorized the disposition free of the security interest." (a)(2) "A security interest attaches to any identifiable proceeds of collateral."

UCC Section 9-610(a)-(b) — Disposition of Collateral After Default:
(a) "After default, a secured party may sell, lease, license, or otherwise dispose of any or all of the collateral in its present condition or following any commercially reasonable preparation or processing." (b) "Every aspect of a disposition of collateral, including the method, manner, time, place, and other terms, must be commercially reasonable."

UCC Section 9-612(b) — Notification Before Disposition:
"In a transaction other than a consumer transaction, a notification of disposition sent after default and 10 days or more before the earliest time of disposition set forth in the notification is sent within a reasonable time before the disposition."`;

const PROMISSORY_NOTE_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

UCC Section 3-104 — Negotiable Instrument Requirements:
A negotiable instrument must contain: (1) an unconditional promise to pay, (2) a fixed amount of money, (3) be payable on demand or at a definite time, and (4) be payable to order or to bearer. No other undertaking or instruction by the person promising payment is stated other than as authorized by UCC Article 3.

Usury Savings Clause Principle:
The rate of interest payable under the note shall not exceed the maximum rate permitted by applicable law. In the event any interest charged, collected, or contracted for exceeds the maximum lawful rate, such excess shall be automatically credited against the outstanding principal balance (or refunded to the borrower if the principal has been fully repaid).

Interest Calculation Methods:
360/365 day calculation: interest may be calculated on the basis of a 360-day year for the actual number of days elapsed (30/360 convention), or on the basis of a 365-day year (actual/365). The method used must be clearly stated and consistently applied.`;

const GUARANTY_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

Guaranty of Payment vs. Guaranty of Collection:
A guaranty of PAYMENT means the creditor may proceed directly against the guarantor upon the borrower's default without first pursuing the borrower or exhausting any remedies against the borrower or collateral. A guaranty of COLLECTION requires the creditor to first exhaust all remedies against the borrower before proceeding against the guarantor.

Community Property States:
Arizona, California, Idaho, Louisiana, Nevada, New Mexico, Texas, Washington, and Wisconsin are community property states. In these jurisdictions, spousal consent may be required for a guaranty to be enforceable against community property assets. The guaranty should include a spousal consent form or waiver where applicable.

Restatement (Third) of Suretyship and Guaranty — Suretyship Defenses:
A secondary obligor (guarantor) may be discharged by: (1) modification of the underlying obligation without the guarantor's consent, (2) impairment of collateral by the creditor, and (3) extension of the time for payment of the underlying obligation. A well-drafted guaranty should include express waivers of these defenses.`;

const LOAN_AGREEMENT_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

Regulation Z (12 C.F.R. Section 1026.3(a)(1)) — Commercial Purpose Exemption:
An extension of credit primarily for a business, commercial, or agricultural purpose is exempt from the Truth in Lending Act (TILA) disclosure requirements under Regulation Z.

Equal Credit Opportunity Act (15 U.S.C. Section 1691) — ECOA:
It is unlawful for any creditor to discriminate against any applicant with respect to any aspect of a credit transaction on the basis of race, color, religion, national origin, sex, marital status, age, receipt of public assistance, or the good faith exercise of any right under the Consumer Credit Protection Act.

Cross-Default Standard Language Principles:
A cross-default clause provides that a default under any other obligation of the borrower to the lender (or to third parties, if broadly drafted) constitutes an event of default under the loan agreement. This clause should specify the threshold amount and any cure periods applicable to cross-defaults.`;

const ENVIRONMENTAL_INDEMNITY_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

CERCLA Section 9601(14) — Definition of "Hazardous Substance" (42 U.S.C. §9601(14)):
"Hazardous substance" means (A) any substance designated pursuant to section 1321(b)(2)(A) of title 33 (Clean Water Act), (B) any element, compound, mixture, solution, or substance designated pursuant to section 9602 of this title, (C) any hazardous waste having the characteristics identified under or listed pursuant to section 3001 of the Solid Waste Disposal Act (RCRA) [42 U.S.C. 6921], (D) any toxic pollutant listed under section 1317(a) of title 33 (Clean Water Act), (E) any hazardous air pollutant listed under section 112 of the Clean Air Act [42 U.S.C. 7412], and (F) any imminently hazardous chemical substance or mixture with respect to which the Administrator has taken action pursuant to section 2606 of title 15 (TSCA). IMPORTANT EXCLUSION: The term does NOT include petroleum, including crude oil or any fraction thereof which is not otherwise specifically listed or designated as a hazardous substance under subparagraphs (A) through (F), and does not include natural gas, natural gas liquids, liquefied natural gas, or synthetic gas usable for fuel.

CERCLA Section 9607(a) — Liable Parties:
The following parties are liable for costs of response and damages: (1) the current owner and operator of a vessel or facility, (2) any person who at the time of disposal of any hazardous substance owned or operated the facility, (3) any person who by contract, agreement, or otherwise arranged for disposal or treatment of hazardous substances, and (4) any person who accepts or accepted any hazardous substances for transport to disposal or treatment facilities.

CERCLA Section 9601(20)(E) — Secured Creditor Exemption (42 U.S.C. §9601(20)(E)):
"The term 'owner or operator' does not include a person that is a lender that, without participating in the management of a vessel or facility, holds indicia of ownership primarily to protect the security interest of the person in the vessel or facility." A lender does NOT participate in management solely by reason of: holding a security interest; including environmental compliance covenants in loan documents; monitoring or enforcing credit terms; conducting inspections; requiring response actions; providing financial advice to prevent default; restructuring credit terms; exercising remedies for breach; or conducting response actions under §9607(d)(1).

RCRA Section 6903(5) — Definition of "Hazardous Waste":
"Hazardous waste" means a solid waste, or combination of solid wastes, which because of its quantity, concentration, or physical, chemical, or infectious characteristics may: (A) cause or significantly contribute to an increase in mortality or an increase in serious irreversible or incapacitating reversible illness, or (B) pose a substantial present or potential hazard to human health or the environment when improperly treated, stored, transported, or disposed of, or otherwise managed.`;

const UCC_FINANCING_STATEMENT_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

UCC Section 9-503(a)(1) — Name of Debtor (Registered Organizations):
"A financing statement sufficiently provides the name of the debtor: (1) if the debtor is a registered organization, only if the financing statement provides the name that is stated to be the registered organization's name on the public organic record most recently filed with or issued or enacted by the registered organization's jurisdiction of organization which purports to state, amend, or restate the registered organization's name." A financing statement that provides only the debtor's trade name does NOT sufficiently provide the name of the debtor (§9-503(c)).

UCC Section 9-503(a)(4) — Name of Individual Debtor:
Alternative A (§9-503(a)(4)): only the name indicated on the debtor's unexpired driver's license or identification card issued by the state is sufficient. Alternative B (§9-503(a)(4)): the individual name of the debtor, the debtor's surname and first personal name, or the name on the driver's license are all sufficient. States choose one alternative when enacting the 2010 amendments.

UCC Section 9-509(a) — Filing Authorization:
A person may file an initial financing statement only if the debtor authorizes the filing in an authenticated record. By authenticating a security agreement, the debtor authorizes the filing of a financing statement covering the collateral described in the security agreement.

UCC Section 9-515(a) — Duration of Effectiveness:
A filed financing statement is effective for a period of five years after the date of filing.

UCC Section 9-515(d) — Continuation Statement:
A continuation statement may be filed only within six months before the expiration of the five-year period. Upon timely filing of a continuation statement, the effectiveness of the initial financing statement is continued for an additional five-year period.`;

const INTERCREDITOR_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

Bankruptcy Code Section 362(a) — Automatic Stay:
Upon the filing of a petition under the Bankruptcy Code, all entities are stayed from commencing or continuing actions against the debtor, enforcing judgments against the debtor, obtaining possession of or exercising control over property of the estate, and creating, perfecting, or enforcing any lien against property of the estate.

Bankruptcy Code Section 363(b)(1) — Use, Sale, or Lease of Property:
The trustee, after notice and a hearing, may use, sell, or lease property of the estate other than in the ordinary course of business.

Bankruptcy Code Section 364(c)-(d) — DIP Financing (11 U.S.C. §364):
Section 364(c): If the trustee is unable to obtain unsecured credit allowable as an administrative expense, the court may authorize obtaining credit: (1) with priority over any or all administrative expenses; (2) secured by a lien on property of the estate that is not otherwise subject to a lien; or (3) secured by a junior lien on property that is subject to a lien. Section 364(d)(1): The court may authorize a senior or equal lien on encumbered property (priming lien) only if: (A) the trustee is unable to obtain such credit otherwise, AND (B) there is adequate protection of the interest of the existing lienholder. The trustee bears the burden of proof on adequate protection.

Bankruptcy Code Section 1129(a)(7) — Best Interests Test:
A plan may be confirmed only if each holder of a claim or interest in an impaired class has accepted the plan or will receive at least as much under the plan as it would receive in a Chapter 7 liquidation.`;

const OPINION_LETTER_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

ABA Legal Opinion Accord (1991) — Standardized Opinion Framework:
The ABA Legal Opinion Accord provides a framework for customary legal opinions in business transactions. Opinions are qualified, based on stated assumptions of fact, and may rely on certificates of officers and public officials. The Accord establishes that opinions are given as of their date and speak only to matters of law, not matters of fact or business judgment.

TriBar Opinion Committee — Customary Practice for Enforceability Opinions:
The customary enforceability opinion is subject to standard qualifications including: (1) applicable bankruptcy, insolvency, reorganization, moratorium, receivership, and similar laws affecting the rights of creditors generally, (2) general principles of equity (whether considered in a proceeding in equity or at law), and (3) the qualification that certain remedial provisions may be limited or rendered unenforceable by applicable law but do not affect the overall enforceability of the documents.

Standard Qualifications and Limitations:
The opinion is limited to the laws of the specified jurisdiction(s) and the federal laws of the United States. No opinion is rendered as to federal or state securities laws unless specifically stated. The opinion is based on laws in effect on the date of the opinion and the opinion giver assumes no obligation to update the opinion for subsequent changes in law.`;

const SUBORDINATION_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

Contractual Subordination vs. Equitable Subordination:
Contractual subordination arises from an agreement between creditors establishing the priority of their respective claims. Equitable subordination is a court-ordered remedy under Bankruptcy Code Section 510(c), permitting a court to subordinate a claim to the level of an equity interest based on inequitable conduct, resulting injury to other creditors, and consistency with the provisions of the Bankruptcy Code.

Turnover Obligation:
Any payments received by the subordinate creditor in violation of the subordination agreement must be held in trust for the benefit of the senior creditor and promptly turned over to the senior creditor for application against the senior debt. This obligation extends to payments received in any insolvency or bankruptcy proceeding.`;

const COMMITMENT_LETTER_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

Good Faith Obligation:
Commitment letters are subject to an implied covenant of good faith and fair dealing. Both parties are expected to act in good faith in fulfilling conditions precedent and in consummating the loan transaction.

Market-Standard Expiration:
Commercial loan commitment letters customarily expire within 30 to 90 days from the date of issuance. Acceptance must be evidenced by the borrower's execution and return of the commitment letter together with any required deposit or commitment fee.

Material Adverse Change Termination Right:
The lender typically reserves the right to terminate the commitment upon the occurrence of a material adverse change in the financial condition, business, operations, or prospects of the borrower, or a material adverse change in the financial or capital markets.`;

const CORPORATE_RESOLUTION_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

State LLC Act Provisions — Authority to Bind Entity:
Under the applicable state's Limited Liability Company Act, the managers (in a manager-managed LLC) or members (in a member-managed LLC) have the authority to bind the entity. Actions taken within the scope of the operating agreement and consistent with the LLC's purpose are binding on the entity.

State Business Corporation Act — Board Resolution Requirements:
Under the applicable state's Business Corporation Act, the board of directors may authorize specific corporate actions by resolution adopted at a duly convened meeting at which a quorum is present, or by unanimous written consent in lieu of a meeting. Borrowing and granting security interests in corporate assets typically require board authorization.

Ultra Vires Doctrine:
The ultra vires doctrine (actions beyond the scope of the entity's authority) has been abolished for most purposes under modern corporation statutes. However, a resolution provides affirmative evidence that the entity has authorized the transaction and that the persons executing the documents have been duly empowered to do so.`;

const SNDA_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

Non-Disturbance Market Standard:
The lender covenants that so long as the tenant is not in default under its lease beyond any applicable notice and cure periods, the tenant's possessory rights, use and occupancy of the premises, and all other rights under the lease shall not be disturbed, diminished, or interfered with by the lender in the exercise of any of its rights under the mortgage or deed of trust, including foreclosure.

Attornment:
The tenant agrees that upon any foreclosure, deed in lieu of foreclosure, or other transfer of the landlord's interest, the tenant shall recognize and attorn to the successor landlord as the tenant's landlord under the lease and shall be bound by all terms of the lease for the balance of the lease term. The successor landlord shall not be bound by certain obligations of the prior landlord, including offsets for prepaid rent or security deposits not actually received.`;

const ASSIGNMENT_OF_LEASES_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

Assignment as Additional Security:
The assignment of leases and rents is made as additional and collateral security for the loan obligations, and is not an absolute assignment. The borrower retains a revocable license to collect and receive rents and profits from the property until the occurrence of an event of default.

Revocable License to Collect Rents:
Until the occurrence of an event of default, the borrower is granted a license to collect rents, issues, and profits from the property as they become due. Upon default, this license is automatically revoked without notice, and the lender may collect rents directly from tenants.

State Recording Requirements:
Assignments of leases and rents affecting real property should be recorded in the land records of the county or jurisdiction where the property is located to provide constructive notice and establish priority against subsequent purchasers and encumbrancers.`;

const ESTOPPEL_CERTIFICATE_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

Estoppel certificates are contractual instruments, not governed by specific statutes. Their enforceability derives from the common law doctrine of estoppel — the certifying party is precluded from later asserting facts inconsistent with its certifications.

Reliance Language:
The certificate must clearly state who may rely on it. The reliance clause should specify that the lender, its successors and assigns, and any purchaser of the loan or the property are entitled to rely on the certifications contained in the certificate in making the loan or purchasing the property.`;

const BORROWERS_CERTIFICATE_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

Borrower's certificates are contractual instruments, not governed by specific statutes. Their enforceability derives from the reliance placed upon them by the lender in making the loan.

Reliance Language:
The certificate must clearly state that the lender is relying on the accuracy and completeness of the certifications in making the loan. Any material misrepresentation or omission may constitute an event of default under the loan agreement.`;

// =============================================================================
// Program-Specific Statutory References
// Appended to base doc-type references when a program is specified
// =============================================================================

const SBA_PROGRAM_REFS = `SBA SOP 50 10 7 — SBA Standard Operating Procedures:

Interest Rate Maximums (Maturity < 7 years):
- Loans ≤$25,000: Base rate + 4.25%
- Loans $25,001-$50,000: Base rate + 3.25%
- Loans >$50,000: Base rate + 2.25%

Interest Rate Maximums (Maturity ≥ 7 years):
- Loans ≤$25,000: Base rate + 4.75%
- Loans $25,001-$50,000: Base rate + 3.75%
- Loans >$50,000: Base rate + 2.75%
Base rate is Prime Rate (Wall Street Journal) or optional peg rate. Spreads are the same for variable and fixed rates; the tier is based on loan maturity, not rate type.

SBA Guaranty Fee Schedule:
- Loans ≤$150,000: 2.0% of guaranteed portion
- Loans $150,001-$700,000: 3.0% of guaranteed portion
- Loans $700,001-$1,000,000: 3.5% of guaranteed portion
- Loans >$1,000,000: 3.75% of guaranteed portion
Fee is based on the SBA-guaranteed portion (typically 75-85% of loan amount).

Prepayment Penalty (SBA SOP 50 10 7, Chapter 5):
Required for loans with maturity of 15 years or more. Penalty applies only during first 3 years:
- Year 1: 5% of prepaid amount
- Year 2: 3% of prepaid amount
- Year 3: 1% of prepaid amount
No prepayment penalty after year 3 or for loans with maturity <15 years.

13 CFR 120.101 — Credit Elsewhere Test:
The Applicant must demonstrate it cannot obtain credit from other sources on reasonable terms.

13 CFR 120.120 — Use of Proceeds:
SBA loan proceeds may be used for: acquiring land and existing buildings, constructing new buildings, purchasing equipment, providing working capital, refinancing existing debt (with conditions). Proceeds may NOT be used for: speculation, lending activities, passive real estate investment, gambling enterprises.

Personal Guaranty Requirement (SBA SOP 50 10):
SBA requires unlimited personal guaranty from each owner with 20% or more ownership interest. Guaranty must be of payment, not collection.`;

const SBA_504_ADDITIONAL_REFS = `SBA 504 Program Structure (13 CFR 120.800 et seq.):
- First Lien: Bank loan (up to 50% of project cost) — conventional terms, bank sets rate
- Second Lien: CDC/SBA Debenture (up to 40% of project cost) — fixed rate, 10 or 20 year term
- Equity: Borrower injection (minimum 10% of project cost; 15% if new business OR special-use property; 20% if BOTH new business AND special-use property)

13 CFR 120.861-862 — Job Creation Requirements:
For every $95,000 of CDC debenture ($150,000 for small manufacturers and energy projects), at least one job must be created or retained. Community development goals may substitute for job creation in certain circumstances.

Occupancy Requirement:
Existing buildings: Borrower must occupy at least 51% of total usable square footage.
New construction: Borrower must occupy at least 60% at time of loan, with plan to occupy 80% within 3 years.`;

const RESIDENTIAL_REFS = `Truth in Lending Act / Regulation Z (12 CFR 1026):

TRID Rule (TILA-RESPA Integrated Disclosure):
- Loan Estimate: Must be delivered within 3 business days of receiving an "application" (defined as receipt of borrower's name, income, SSN, property address, estimated property value, and mortgage loan amount sought).
- Closing Disclosure: Must be received by consumer at least 3 business days before consummation. New 3-day waiting period triggered if: (1) APR increases by more than 1/8% for fixed-rate or 1/4% for adjustable, (2) prepayment penalty is added, or (3) loan product changes (e.g., fixed to adjustable).

APR Calculation (12 CFR 1026.22):
The APR must be calculated as a measure of the cost of credit, expressed as a yearly rate. For closed-end credit, APR is computed using the actuarial method. APR tolerance: for regular transactions, disclosed APR is accurate if not more than 1/8 of 1% above or below the actual APR; for irregular transactions, tolerance is 1/4 of 1%.

ATR/QM Rule (12 CFR 1026.43):
(c) Repayment ability — creditor must make reasonable, good-faith determination of consumer's ability to repay. Must consider: (1) current or reasonably expected income or assets, (2) current employment status, (3) monthly payment on the covered transaction, (4) monthly payment on simultaneous loans, (5) monthly payment for mortgage-related obligations, (6) current debt obligations, (7) monthly DTI ratio or residual income, (8) credit history.

Non-QM loans must still comply with ATR — they just don't get the QM safe harbor/rebuttable presumption.

HPML — Higher-Priced Mortgage Loans (12 CFR 1026.35):
A first-lien mortgage is higher-priced if APR exceeds APOR (Average Prime Offer Rate) by 1.5 percentage points or more. HPML triggers: (1) mandatory escrow for taxes and insurance, (2) additional appraisal requirements for certain transactions, (3) prohibition on prepayment penalties.

HMDA / Regulation C (12 CFR 1003):
Requires collection and reporting of mortgage lending data including: loan amount, interest rate, loan purpose, property type, census tract, applicant demographic information. Reports filed annually with CFPB.`;

const CRYPTO_REFS = `BSA/AML Requirements (31 CFR 1010):
Bank Secrecy Act compliance requires: Customer Identification Program (CIP) — verify identity of each customer; Customer Due Diligence (CDD) — understand the nature and purpose of customer relationships; Suspicious Activity Reports (SARs) — file with FinCEN for transactions >$5,000 that involve potential money laundering, terrorist financing, or other suspicious activity; Currency Transaction Reports (CTRs) — for cash transactions >$10,000.

FinCEN Guidance on Convertible Virtual Currency (FIN-2019-G001):
Persons accepting and transmitting convertible virtual currency are money transmitters and must register with FinCEN unless an exception applies. Lenders accepting digital assets as collateral must ensure compliance with applicable money transmission laws.

SEC Staff Guidance on Digital Assets:
Framework for "Investment Contract" Analysis of Digital Assets — whether a particular digital asset is a security depends on facts and circumstances under the Howey test (SEC v. W.J. Howey Co., 328 U.S. 293 (1946)).

State Digital Asset Lending Laws:
Several states have enacted digital asset-specific lending regulations. Wyoming (W.S. 34-29-101 et seq.) — Digital Asset Act providing for custody and lending. New York BitLicense (23 NYCRR 200) — requires license for virtual currency business activity. California — Digital Financial Assets Law (licensure effective July 2026 per AB 1934). Lender must comply with all applicable state digital asset and money transmission laws in the borrower's state.`;

const BRIDGE_REFS = `Bridge Loan Specific Requirements:
Exit strategy documentation must demonstrate viable path to permanent financing or property disposition. Acceptable exit strategies include: (1) refinance with permanent lender (provide term sheet or pre-qualification), (2) property sale (provide market analysis or listing agreement), (3) construction completion and lease-up (provide pro forma and lease pipeline).

Maturity Extension Provisions:
Extension options must specify: (1) maximum number and duration of extensions (typically 2 x 6 months), (2) extension fee (typically 0.25-0.50% of outstanding balance), (3) conditions precedent (no default, minimum LTV maintained, satisfactory progress on exit strategy), (4) updated appraisal or broker opinion of value required.`;

const COMMERCIAL_CRE_REFS = `Commercial Real Estate Lending Regulations:

FIRREA Appraisal Requirements (12 U.S.C. § 3331 et seq.):
The Financial Institutions Reform, Recovery, and Enforcement Act requires that federally related transactions involving commercial real estate with a value exceeding the applicable de minimis threshold (currently $1,000,000 per the 2024 interagency rule) must be supported by an appraisal performed by a state-certified or licensed appraiser. The appraisal must conform to the Uniform Standards of Professional Appraisal Practice (USPAP).

CRA — Community Reinvestment Act (12 U.S.C. § 2901 et seq.):
The Community Reinvestment Act requires regulated financial institutions to help meet the credit needs of the communities in which they do business, including low- and moderate-income neighborhoods. Examiners consider the institution's record of lending, investment, and service in CRA evaluations.

Dodd-Frank Act — Risk Retention (15 U.S.C. § 78o-11):
For commercial real estate loans that are securitized, the risk retention rules require the sponsor of a securitization to retain not less than 5% of the credit risk of the assets, unless the assets qualify as "qualified commercial real estate loans" under the exemption criteria. Qualifying loan criteria include maximum LTV ratios and minimum DSCR thresholds.`;

const CONVENTIONAL_BUSINESS_REFS = `Commercial Lending Regulatory Framework:

Regulation Z (12 CFR 1026.3(a)(1)) — Commercial Purpose Exemption:
Extensions of credit primarily for business, commercial, or agricultural purposes are exempt from TILA/Regulation Z disclosure requirements. However, the lender must still comply with the Equal Credit Opportunity Act, flood insurance requirements, and applicable state lending laws.

UCC Article 9 — Secured Transactions:
Conventional business term loans secured by personal property (equipment, inventory, accounts receivable, or blanket liens) are governed by UCC Article 9 for perfection and priority of security interests. Filing a UCC-1 financing statement with the Secretary of State in the debtor's state of organization is required for perfection.

Prudential Lending Standards — Interagency Guidelines:
The OCC, FDIC, Federal Reserve, and NCUA have issued interagency guidelines on prudent commercial lending practices, including appropriate underwriting standards, loan administration, and credit risk management. These guidelines emphasize the importance of documented repayment sources, appropriate collateral coverage, and regular portfolio monitoring.`;

const LINE_OF_CREDIT_REFS = `Revolving Credit Facility Regulations:

UCC Article 9 — Floating Liens and Future Advances:
UCC Section 9-204(c) provides that a security agreement may provide that collateral secures future advances, whether or not the advances are given pursuant to commitment. This is fundamental to revolving credit facilities where the outstanding balance fluctuates. A properly perfected security interest in accounts receivable and inventory under a revolving facility has priority from the date of the initial filing, not the date of each subsequent advance.

UCC Section 9-102(a)(2) and (a)(48) — Accounts and Inventory:
Revolving credit facilities typically use accounts receivable and inventory as the borrowing base collateral. The advance rate applied to eligible collateral determines the maximum amount available for borrowing at any given time.

Federal Reserve Regulation H — Lending Limits:
National banks and state member banks are subject to lending limits that restrict the total amount of loans and extensions of credit to any single borrower. The general lending limit is 15% of the bank's unimpaired capital and surplus for unsecured loans and 25% for loans fully secured by readily marketable collateral. Revolving credit commitments count against these limits.`;

const EQUIPMENT_FINANCING_REFS = `Equipment Financing — UCC Article 9 Framework:

UCC Section 9-102(a)(33) — Equipment:
"Equipment" means goods other than inventory, farm products, or consumer goods. Equipment is the primary collateral in equipment financing transactions. The security interest attaches when the debtor has rights in the collateral and value has been given.

UCC Section 9-311(a) — Perfection by Filing vs. Certificate of Title:
For most equipment, perfection is achieved by filing a UCC-1 financing statement. However, for equipment that is covered by a certificate of title statute (e.g., motor vehicles, trailers, and certain construction equipment), perfection must be noted on the certificate of title rather than by UCC filing.

UCC Section 9-324(a) — Purchase Money Security Interest (PMSI):
A perfected purchase money security interest in goods other than inventory has priority over a conflicting security interest in the same goods if the PMSI is perfected when the debtor receives possession of the collateral or within 20 days thereafter. This super-priority is critical for equipment lenders who want priority over an existing blanket lien holder.

IRS Section 179 and Bonus Depreciation:
Equipment acquisitions may qualify for accelerated depreciation under IRC Section 179 (up to the annual limit) or bonus depreciation provisions. While these are tax provisions rather than lending regulations, they are relevant to the economic analysis of equipment financing transactions and may be referenced in the loan documentation.`;

const PROGRAM_REFS: Record<string, string> = {
  sba_7a: SBA_PROGRAM_REFS,
  sba_504: SBA_PROGRAM_REFS + "\n\n" + SBA_504_ADDITIONAL_REFS,
  dscr: RESIDENTIAL_REFS,
  bank_statement: RESIDENTIAL_REFS,
  crypto_collateral: CRYPTO_REFS,
  bridge: BRIDGE_REFS,
  commercial_cre: COMMERCIAL_CRE_REFS,
  conventional_business: CONVENTIONAL_BUSINESS_REFS,
  line_of_credit: LINE_OF_CREDIT_REFS,
  equipment_financing: EQUIPMENT_FINANCING_REFS,
};

// Document types that return empty strings (pure deterministic docs)
const EMPTY_REFS_TYPES = new Set([
  "settlement_statement",
  "compliance_certificate",
  "amortization_schedule",
]);

const DEED_OF_TRUST_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

State Deed of Trust Statutes — Power of Sale and Foreclosure:
Deeds of trust are used in "title theory" and many "lien theory" states as the primary real property security instrument. The deed of trust conveys legal title to a trustee who holds it for the benefit of the beneficiary (lender). Upon default, the trustee may exercise the power of sale without judicial proceedings in states that authorize non-judicial foreclosure (e.g., Cal. Civ. Code §§ 2924–2924k; Tex. Prop. Code §§ 51.002–51.005; Va. Code §§ 55.1-320 through 55.1-337). Notice of default and notice of sale periods vary by state (typically 90–120 days for notice of default, 20–30 days for notice of sale). Some states provide a statutory right of reinstatement (cure the default before sale) and/or a right of redemption (redeem after sale).

UCC Section 1-201(b)(35) — Due-on-Sale / Security Interest:
A security interest includes any interest in personal property or fixtures that secures payment or performance of an obligation. The Garn-St Germain Depository Institutions Act of 1982 (12 U.S.C. § 1701j-3) generally permits lenders to enforce due-on-sale clauses upon transfer of a secured property, preempting state laws that had restricted their enforcement. Certain transfers are exempt (e.g., transfers by devise, descent, or operation of law; transfer to a spouse or children; transfer resulting from a decree of dissolution of marriage).

State Non-Judicial Foreclosure Procedures:
In non-judicial foreclosure states, the trustee conducts a public sale after complying with statutory notice requirements. The trustee's deed conveys the property to the successful bidder. Anti-deficiency statutes in some states (e.g., Cal. Code Civ. Proc. §§ 580b, 580d; Ariz. Rev. Stat. § 33-814) may bar the lender from obtaining a deficiency judgment after a non-judicial foreclosure sale or for purchase money obligations.`;

const CLOSING_DISCLOSURE_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

12 CFR 1026.38 — TRID Closing Disclosure Requirements:
(a) The Closing Disclosure must be provided using the standard form prescribed by the CFPB (model form H-25). It must include: (1) general information (date issued, closing date, disbursement date, settlement agent, file number, property address); (2) loan terms (loan amount, interest rate, monthly principal and interest, whether prepayment penalty or balloon payment applies); (3) projected payments table (principal and interest, mortgage insurance, estimated escrow, estimated total monthly payment for each applicable period); (4) costs at closing (total closing costs, cash to close).

(b) Loan Calculations: Total of payments, finance charge, amount financed, annual percentage rate (APR), and total interest percentage (TIP) must be disclosed accurately.

(c) Closing Cost Details: Origination charges, services borrower did not shop for, services borrower did shop for, taxes and other government fees, prepaids (homeowner's insurance, mortgage insurance, prepaid interest, property taxes), and initial escrow payment at closing must each be itemized.

12 CFR 1026.19(f) — Timing Requirements:
The Closing Disclosure must be received by the consumer at least three (3) business days before consummation of the transaction. A new three-day waiting period is required if: (1) the APR increases by more than 1/8 of 1 percentage point for a fixed-rate loan or 1/4 of 1 percentage point for an adjustable-rate loan; (2) a prepayment penalty is added; or (3) the loan product changes (e.g., fixed rate to adjustable rate).`;

const LOAN_ESTIMATE_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

12 CFR 1026.37 — TRID Loan Estimate Requirements:
(a) The Loan Estimate must be provided using the standard form prescribed by the CFPB (model form H-24). It must include: (1) loan terms (loan amount, interest rate, monthly principal and interest, prepayment penalty, balloon payment); (2) projected payments (principal and interest, mortgage insurance, estimated escrow, estimated total monthly payment); (3) costs at closing (estimated total closing costs, estimated cash to close).

(b) Closing Cost Details: Origination charges (points, origination fees), services you cannot shop for (appraisal, credit report, flood determination), services you can shop for (title services, survey, pest inspection), taxes and government fees (recording fees, transfer taxes), prepaids (homeowner's insurance premium, mortgage insurance premium, prepaid interest, property taxes), and initial escrow payment at closing.

(c) Comparisons Section: Must include total cost over the first 5 years, principal paid off in 5 years, APR, and TIP (Total Interest Percentage).

12 CFR 1026.19(e) — Timing and Tolerance:
The Loan Estimate must be delivered or placed in the mail no later than 3 business days after receiving the consumer's application (defined as receipt of consumer's name, income, SSN, property address, estimated value, and mortgage loan amount sought). Tolerance categories: (1) zero tolerance — fees that cannot increase (lender charges, transfer taxes); (2) 10% cumulative tolerance — fees for services the consumer can shop for but uses the lender's preferred provider; (3) no limit — fees for services the consumer shops for independently, prepaid interest, property insurance.`;

const BORROWING_BASE_AGREEMENT_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

UCC Article 9 — Security Interests in Accounts and Inventory:
UCC Section 9-102(a)(2) — "Account" means a right to payment of a monetary obligation, whether or not earned by performance, for property that has been or is to be sold, leased, licensed, assigned, or otherwise disposed of, for services rendered or to be rendered, for a policy of insurance issued or to be issued, for a secondary obligation incurred or to be incurred, or arising out of the use of a credit or charge card.

UCC Section 9-102(a)(48) — "Inventory" means goods, other than farm products, which: (A) are leased by a person as lessor; (B) are held by a person for sale or lease or to be furnished under a contract of service; (C) are furnished by a person under a contract of service; or (D) consist of raw materials, work in process, or materials used or consumed in a business.

UCC Section 9-204 — After-Acquired Property and Future Advances:
A security agreement may provide for a security interest in after-acquired collateral and may secure future advances. This is critical for revolving credit facilities where the borrowing base fluctuates as receivables are created and collected and inventory is acquired and sold.

Federal Assignment of Claims Act (41 U.S.C. § 6305):
Assignments of claims against the United States are generally prohibited unless: (1) made to a bank, trust company, or other financing institution, (2) adequate written notice is provided to the contracting officer, and (3) the assignment covers all amounts payable under the contract. This affects the eligibility of government account debtors in the borrowing base.`;

const DIGITAL_ASSET_PLEDGE_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

FinCEN Guidance on Convertible Virtual Currency (FIN-2019-G001):
Persons that accept and transmit convertible virtual currency are money transmitters under the Bank Secrecy Act unless an exemption applies. Lenders accepting digital assets as collateral must implement a Customer Identification Program (CIP) and Customer Due Diligence (CDD) procedures. Suspicious Activity Reports (SARs) must be filed with FinCEN for transactions exceeding $5,000 that involve potential money laundering or other suspicious activity.

Bank Secrecy Act / AML Requirements (31 CFR 1010, 1020, 1022):
Financial institutions must: (1) establish an AML compliance program; (2) file Currency Transaction Reports (CTRs) for cash transactions exceeding $10,000; (3) maintain records of funds transfers of $3,000 or more (travel rule); (4) conduct ongoing monitoring of customer relationships for suspicious activity.

State Money Transmitter Laws:
Most states require licensure for persons engaged in the business of money transmission, which may encompass digital asset custody and transfer activities. Notable frameworks include: New York BitLicense (23 NYCRR Part 200), Wyoming Digital Asset Act (W.S. 34-29-101 et seq.), California Digital Financial Assets Law (effective July 2026 per AB 1934). Lender must ensure that its digital asset collateral activities comply with applicable state money transmitter or digital asset laws in every state where borrowers are located.

UCC Article 12 (Adopted in Select States) — Controllable Electronic Records:
The 2022 UCC amendments add Article 12, providing a framework for taking a security interest in "controllable electronic records," including certain digital assets. Control is established when the secured party has the power to avail itself of substantially all the benefit of the electronic record and the exclusive power to prevent others from doing so. States that have enacted Article 12 provide a clear perfection-by-control mechanism for digital asset collateral.`;

const CUSTODY_AGREEMENT_REFS = `APPLICABLE LEGAL STANDARDS — Reference these when drafting:

Investment Advisers Act of 1940 — Custody Rule (17 CFR 275.206(4)-2):
An investment adviser is deemed to have custody of client assets if it holds, directly or indirectly, client funds or securities, or has authority to obtain possession of them. Advisers with custody must: (1) maintain client assets with a "qualified custodian" (banks, registered broker-dealers, futures commission merchants, certain foreign financial institutions); (2) have a reasonable basis for believing the qualified custodian sends quarterly account statements directly to clients; (3) undergo an annual surprise examination by an independent public accountant. The custody rule is designed to safeguard client assets from misuse, loss, or misappropriation.

State Trust Company Laws and Digital Asset Custody:
Several states have enacted specific trust company or digital asset custody frameworks: Wyoming Special Purpose Depository Institutions (W.S. 13-12-101 et seq.) may provide custodial services for digital assets under state banking supervision; South Dakota and Nevada trust company charters are commonly used for institutional digital asset custody; New York trust companies operating under the NY Banking Law may provide digital asset custody subject to DFS oversight and BitLicense requirements.

SOC 2 Type II Compliance:
Custodians handling digital assets should maintain a SOC 2 Type II report, which evaluates the design and operating effectiveness of controls relevant to security, availability, processing integrity, confidentiality, and privacy. The report must cover a minimum of six months and be performed by an independent auditing firm. Key controls include segregation of duties, access management, encryption of assets at rest and in transit, disaster recovery, and incident response procedures.`;

const REFS_MAP: Record<string, string> = {
  security_agreement: SECURITY_AGREEMENT_REFS,
  promissory_note: PROMISSORY_NOTE_REFS,
  guaranty: GUARANTY_REFS,
  loan_agreement: LOAN_AGREEMENT_REFS,
  environmental_indemnity: ENVIRONMENTAL_INDEMNITY_REFS,
  ucc_financing_statement: UCC_FINANCING_STATEMENT_REFS,
  intercreditor_agreement: INTERCREDITOR_REFS,
  opinion_letter: OPINION_LETTER_REFS,
  subordination_agreement: SUBORDINATION_REFS,
  commitment_letter: COMMITMENT_LETTER_REFS,
  corporate_resolution: CORPORATE_RESOLUTION_REFS,
  snda: SNDA_REFS,
  assignment_of_leases: ASSIGNMENT_OF_LEASES_REFS,
  estoppel_certificate: ESTOPPEL_CERTIFICATE_REFS,
  borrowers_certificate: BORROWERS_CERTIFICATE_REFS,
  deed_of_trust: DEED_OF_TRUST_REFS,
  closing_disclosure: CLOSING_DISCLOSURE_REFS,
  loan_estimate: LOAN_ESTIMATE_REFS,
  borrowing_base_agreement: BORROWING_BASE_AGREEMENT_REFS,
  digital_asset_pledge: DIGITAL_ASSET_PLEDGE_REFS,
  custody_agreement: CUSTODY_AGREEMENT_REFS,
};

/**
 * Returns formatted statutory text excerpts relevant to the given document type.
 * These get injected into AI prose generation prompts so the AI drafts from
 * actual operative legal language.
 *
 * When programId is provided, program-specific statutory references are appended
 * to the base document-type references (e.g. SBA SOP text for SBA programs,
 * TILA/TRID for residential, BSA/AML for crypto).
 *
 * Returns empty string for purely deterministic document types that have no
 * statutory references (settlement_statement, compliance_certificate,
 * amortization_schedule).
 */
export function getLegalReferences(docType: string, programId?: string): string {
  if (EMPTY_REFS_TYPES.has(docType)) {
    return "";
  }
  const base = REFS_MAP[docType] ?? "";
  const programExtra = programId ? PROGRAM_REFS[programId] ?? "" : "";
  if (!base && !programExtra) return "";
  if (!programExtra) return base;
  if (!base) return programExtra;
  return base + "\n\n" + programExtra;
}
