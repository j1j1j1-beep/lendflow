# FDA Regulatory Reference — ADC IND Filing (Verified Feb 2026)

Source: Cross-referenced against FDA.gov, clinicaltrials.gov, DEM BioPharma Jan 2026 disclosures.

## DEM301 Specifics (Verified via Jan 2026 Disclosures)

- DEM301 is a "first-in-class bifunctional ADC" targeting DEM-TXX (DEM-T02)
- Antibody is afucosylated (enhances ADCC — immune-mediated killing)
- Pre-IND studies underway, Phase 1 planned 2H 2026
- Afucosylation means potency assay MUST include ADCC biological assay, not just payload killing
- Bifunctional = heightened scrutiny vs standard ADCs

## FDA Regulatory Requirements (Verified)

| Area | Source | Status |
|------|--------|--------|
| Dose Optimization | FDA "Project Optimus" (Finalized Aug 2024) | VERIFIED. Must identify Optimal Biological Dose (OBD), not just MTD. Protocol needs randomized parallel cohorts. |
| Diversity Plans | FDORA (Food and Drug Omnibus Reform Act) | VERIFIED. Must submit DAP no later than Phase 3/pivotal trial protocol submission. Voluntary early submission with IND is recommended but not required. |
| ADC Safety PK | FDA "Clinical Pharmacology Considerations for ADCs" | VERIFIED. Must measure 3 analytes: (1) Conjugated ADC, (2) Total Antibody, (3) Free Payload. Insufficient sensitivity = Clinical Hold. |
| Electronic Data | 21 CFR Part 11 | VERIFIED (federal law). AI tools need time-stamped audit trail that cannot be edited. |

## Bifunctional ADC Risks (Verified)

- CRS (Cytokine Release Syndrome): Afucosylated antibodies activate NK cells and macrophages, releasing cytokines
- Protocol Safety Section MUST have CRS grading/management plan (ASTCT consensus grading)
- MAS (Macrophage Activation Syndrome) monitoring required
- On-Target/Off-Tumor risk: DEM-T02 on mucosal epithelial cells = risk of severe colitis/GI bleed
- Tissue Cross-Reactivity (TCR) study scrutiny — tox species must express DEM-T02 similarly to humans

## Correction: ADCC Potency Assay

Original research missed this: Since antibody is afucosylated, IND Potency Assay (Module 3) CANNOT just measure payload killing. Must ALSO include validated biological assay demonstrating ADCC activity, or FDA rejects potency characterization.

## IND Application Structure (Verified)

| Section | Content | Pages |
|---------|---------|-------|
| Form FDA 1571 | Sponsor cover sheet, commitments, signatures | 2-3 |
| Table of Contents | Comprehensive file listing | 10-20 |
| Introductory Statement | Drug summary, rationale, study plan | 3-5 |
| General Investigational Plan | Dev plan for next year | 2-3 |
| Investigator's Brochure (IB) | Preclinical data, safety, tox, dosing | 80-150 |
| Clinical Protocol | Phase 1 design, objectives, eligibility, dosing, endpoints | 60-100 |
| CMC Information | Manufacturing: Antibody + Linker + Payload + Drug Product | 200+ |
| Pharm/Tox Information | Nonclinical safety studies (GLP) | 100+ |

## CTD Module Structure (Verified)

- Module 1: Administrative — Forms (1571, 1572, 3674), labeling, fast-track requests
- Module 2: Summaries — Quality Overall Summary (QOS), Nonclinical Overview, Clinical Overview (synthesize M3-M5)
- Module 3: Quality (CMC) — 3.2.S (Drug Substance: mAb + drug-linker), 3.2.P (Drug Product: final ADC)
- Module 4: Nonclinical Study Reports — Full tox/PK/PD reports in PDF + SEND format
- Module 5: Clinical — Protocol + IB (actual study reports come later)

## ADC-Specific CMC Requirements (Verified)

- DAR (Drug-to-Antibody Ratio): Must prove consistency (e.g., 4.0 +/- 0.5)
- Free Drug: Strict limits on unconjugated toxic payload
- Potency Assay: Cytotoxicity assay + ADCC assay (for afucosylated) required for release testing
- Three supply chains: mAb, Linker, Conjugation — delay in one delays entire IND

## Key Pain Points for Small Biotechs

- Document versioning: MOA text in Module 2 must match IB and Protocol exactly
- SEND dataset conversion: Converting raw tox data to FDA XML standard (error-prone)
- Reference checks: Figures/tables referenced across modules must be consistent
- CMC "three-body problem": Managing mAb + Linker + Conjugation supply chains

## 21 CFR Part 11 Requirements

- Audit trails: Computer-generated, time-stamped, records all operator actions, data cannot be overwritten (only amended)
- Access controls: Unique logins, automatic timeouts
- Digital signatures: Legal equivalent of handwritten (requires 2FA or password re-entry)
- AI tools must operate within Part 11 wrapper (private instance with audit logging)

## Ongoing Obligations After IND

- 15-day IND Safety Reports: Serious, unexpected suspected adverse reactions
- 7-day Reports: Fatal or life-threatening unexpected reactions
- Annual Reports: Year's progress, new manufacturing info, safety summary

## Project Optimus Impact on Phase 1

- Cannot just use 3+3 dose escalation
- Must include backfill or expansion cohort strategy to test multiple doses
- Must compare at least two dose levels to find Optimal Biological Dose
