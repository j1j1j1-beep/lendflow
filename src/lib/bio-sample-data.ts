// OpenShut Bio — Sample ADC Program Extraction Data
// Realistic data for a Nectin-4-targeting ADC (similar to enfortumab vedotin / Padcev).
// Used by /api/bio/programs/sample to create a demo program without OCR.
//
// Internal consistency:
// - Batch DAR 4.0 +/- 0.3 matches COA DAR 3.9, within spec (3.5-4.5)
// - Batch purity >98% matches COA SE-HPLC monomer 98.2%
// - Tox NOAEL (3 mg/kg monkey) -> HED = 3 * (3.1/37) * (1/6.2) ~= 0.04 mg/kg -> starting dose 0.3 mg/kg (~1/10 HED)
// - PK t1/2 ~6.5 days (conjugated) consistent with IgG1 ADC clearance
// - Protocol 3+3 dose escalation 0.3 - 10 mg/kg Q3W covers range above HED

export const SAMPLE_BIO_PROGRAM = {
  name: "DEM-ADC-301 Phase 1 IND",
  drugName: "DEM-ADC-301",
  drugClass: "ADC",
  target: "Nectin-4",
  mechanism:
    "Nectin-4-targeting antibody-drug conjugate delivering MMAE cytotoxin to tumor cells expressing Nectin-4, inducing cell death via microtubule disruption",
  indication: "Locally advanced or metastatic urothelial carcinoma",
  phase: "IND_FILING" as const,
  sponsorName: "Demo Therapeutics Inc.",
  toolType: "REGULATORY_DOCS" as const,
  antibodyType: "Humanized IgG1",
  linkerType: "Cleavable valine-citrulline (vc)",
  payloadType: "MMAE (monomethyl auristatin E)",
  dar: 4.0,
};

// Document metadata for BioDocument records
export const SAMPLE_BIO_DOCUMENTS = [
  {
    docType: "BATCH_RECORD" as const,
    fileName: "DEM-ADC-301_Batch_BR-2025-001_GMP_Record.pdf",
  },
  {
    docType: "CERTIFICATE_OF_ANALYSIS" as const,
    fileName: "DEM-ADC-301_CoA_Lot_2025-001.pdf",
  },
  {
    docType: "STABILITY_DATA" as const,
    fileName: "DEM-ADC-301_Stability_Report_ICH_Q1A.pdf",
  },
  {
    docType: "TOXICOLOGY_REPORT" as const,
    fileName: "DEM-ADC-301_GLP_Tox_Study_Report.pdf",
  },
  {
    docType: "PK_STUDY" as const,
    fileName: "DEM-ADC-301_Nonclinical_PK_Study.pdf",
  },
  {
    docType: "CLINICAL_PROTOCOL" as const,
    fileName: "DEM-ADC-301_Phase1_Protocol_v1.0.pdf",
  },
];

// Pre-built extraction data matching schemas in src/bio/extraction/schemas/
// Each entry's structuredData mirrors the output of the AI extraction pipeline.

export const SAMPLE_BIO_EXTRACTIONS: Array<{
  docType: string;
  structuredData: Record<string, unknown>;
}> = [
  // 1. Batch Record — GMP manufacturing batch
  {
    docType: "BATCH_RECORD",
    structuredData: {
      batchId: "BR-2025-001",
      lotNumber: "LOT-2025-001",
      productName: "DEM-ADC-301",
      manufacturingDate: "2025-01-15",
      manufacturingSite: "Demo Biologics Manufacturing Facility, Cambridge, MA",
      scale: "200L",
      gmpCompliant: true,

      // Antibody production
      antibodyProduction: {
        cellLine: "CHO-K1",
        cultureVolume: "200L",
        harvestDate: "2025-01-08",
        titer: 3.2, // g/L
        yield: 640, // grams
        purificationMethod: "Protein A affinity chromatography + ion exchange",
        purityPostPurification: 99.1, // %
      },

      // Conjugation
      conjugation: {
        linkerPayload: "vc-MMAE",
        conjugationMethod: "Partial reduction + maleimide coupling",
        dar: 4.0,
        darSpec: "3.5-4.5",
        darMethod: "HIC-HPLC",
        freePayloadPercent: 0.8,
        freePayloadSpec: "<2.0%",
        conjugationEfficiency: 95.2, // %
      },

      // Final product
      finalProduct: {
        yield: 580, // grams
        concentration: 20, // mg/mL
        volume: 29000, // mL total
        purity: 98.4, // % SE-HPLC monomer
        aggregatePercent: 1.2,
        fragmentPercent: 0.4,
        endotoxin: 0.12, // EU/mg
        endotoxinSpec: "<0.5 EU/mg",
        bioburden: "<1 CFU/mL",
        sterility: "Pass",
        appearance: "Clear to slightly opalescent, colorless to pale yellow",
        ph: 6.0,
        phSpec: "5.8-6.2",
        osmolality: 290, // mOsm/kg
        osmolalitySpec: "270-330 mOsm/kg",
        particulates: {
          visibleParticles: "Essentially free",
          subvisible_10um: 12, // per container
          subvisible_25um: 2,
        },
      },

      // QC testing summary
      qcSummary: {
        totalTests: 18,
        passed: 18,
        failed: 0,
        outOfSpec: 0,
      },

      // Manufacturing deviations
      deviations: [],

      extractionNotes: [
        "Sample data -- not extracted from a real document.",
      ],
    },
  },

  // 2. Certificate of Analysis
  {
    docType: "CERTIFICATE_OF_ANALYSIS",
    structuredData: {
      productName: "DEM-ADC-301",
      lotNumber: "LOT-2025-001",
      manufacturingDate: "2025-01-15",
      expirationDate: "2027-01-15",
      manufacturer: "Demo Biologics Manufacturing Facility",
      sponsor: "Demo Therapeutics Inc.",

      // Identity tests
      identityTests: {
        peptideMapping: { result: "Confirmed", pass: true, method: "LC-MS/MS" },
        westernBlot: { result: "Positive for anti-Nectin-4", pass: true },
        isoelectricFocusing: { result: "pI 7.8-8.4", pass: true, spec: "7.5-8.8" },
      },

      // Potency tests
      potencyTests: {
        cytotoxicityIC50: 0.15, // nM
        cytotoxicityIC50Spec: "<1.0 nM",
        cytotoxicityIC50Pass: true,
        bindingAffinity: 0.42, // nM Kd
        bindingAffinitySpec: "<2.0 nM",
        bindingAffinityPass: true,
        adccActivity: null, // Not primary MOA for MMAE ADC
      },

      // Purity tests
      purityTests: {
        secHplcMonomer: 98.2,
        secHplcMonomerSpec: ">95%",
        secHplcMonomerPass: true,
        secHplcAggregate: 1.3,
        secHplcAggregateSpec: "<5%",
        secHplcAggregatePass: true,
        cexHplc: "Main peak 92%, acidic 5%, basic 3%",
        cexHplcPass: true,
        hicHplcDar: 3.9,
        hicHplcDarSpec: "3.5-4.5",
        hicHplcDarPass: true,
        ceSDSReducing: "HC 98.5%, LC 99.1%",
        ceSDSReducingPass: true,
        ceSDSNonReducing: "Intact IgG 97.8%",
        ceSDSNonReducingPass: true,
      },

      // Safety tests
      safetyTests: {
        endotoxin: 0.12,
        endotoxinSpec: "<0.5 EU/mg",
        endotoxinPass: true,
        sterility: "No growth after 14 days",
        sterilityPass: true,
        mycoplasma: "Not detected",
        mycoplasmaPass: true,
        bioburden: "<1 CFU/mL",
        bioburdenPass: true,
      },

      // Physical tests
      physicalTests: {
        appearance: "Clear to slightly opalescent, colorless to pale yellow solution",
        appearancePass: true,
        ph: 6.0,
        phSpec: "5.8-6.2",
        phPass: true,
        osmolality: 290,
        osmolalitySpec: "270-330 mOsm/kg",
        osmolalityPass: true,
        proteinConcentration: 20.1,
        proteinConcentrationSpec: "19.0-21.0 mg/mL",
        proteinConcentrationPass: true,
      },

      // Overall
      overallResult: {
        disposition: "Released",
        approvedBy: "QC Director, Demo Biologics",
        approvedDate: "2025-01-20",
      },

      // Flattened for rules engine
      allTests: [
        { name: "Peptide Mapping", result: "Confirmed", pass: true, category: "identity" },
        { name: "Western Blot", result: "Positive", pass: true, category: "identity" },
        { name: "IEF", result: "pI 7.8-8.4", pass: true, category: "identity" },
        { name: "Cytotoxicity IC50", result: "0.15 nM", pass: true, category: "potency" },
        { name: "Binding Affinity", result: "0.42 nM Kd", pass: true, category: "potency" },
        { name: "SE-HPLC Monomer", result: "98.2%", pass: true, category: "purity" },
        { name: "SE-HPLC Aggregate", result: "1.3%", pass: true, category: "purity" },
        { name: "HIC-HPLC DAR", result: "3.9", pass: true, category: "purity" },
        { name: "CE-SDS Reducing", result: "HC 98.5%, LC 99.1%", pass: true, category: "purity" },
        { name: "CE-SDS Non-Reducing", result: "Intact IgG 97.8%", pass: true, category: "purity" },
        { name: "Endotoxin", result: "0.12 EU/mg", pass: true, category: "safety" },
        { name: "Sterility", result: "No growth", pass: true, category: "safety" },
        { name: "Mycoplasma", result: "Not detected", pass: true, category: "safety" },
        { name: "Bioburden", result: "<1 CFU/mL", pass: true, category: "safety" },
        { name: "Appearance", result: "Clear", pass: true, category: "physical" },
        { name: "pH", result: "6.0", pass: true, category: "physical" },
        { name: "Osmolality", result: "290 mOsm/kg", pass: true, category: "physical" },
        { name: "Protein Concentration", result: "20.1 mg/mL", pass: true, category: "physical" },
      ],

      extractionNotes: [
        "Sample data -- not extracted from a real document.",
      ],
    },
  },

  // 3. Stability Data — ICH Q1A compliant
  {
    docType: "STABILITY_DATA",
    structuredData: {
      productName: "DEM-ADC-301",
      lotNumber: "LOT-2025-001",
      formulation: "20 mg/mL in 20 mM histidine, 8% sucrose, 0.02% PS80, pH 6.0",
      container: "10 mL Type I borosilicate glass vial with fluoropolymer-coated stopper",

      // Long-term storage: 5C
      longTerm: {
        condition: "5 +/- 3C",
        schedule: "0, 1, 3, 6, 9, 12, 18, 24, 36 months",
        duration: 36, // months
        results: [
          {
            timepoint: 0,
            purity: 98.4, aggregates: 1.2, dar: 4.0, potency: 100,
            appearance: "Clear", ph: 6.0, freePayload: 0.8,
          },
          {
            timepoint: 3,
            purity: 98.3, aggregates: 1.3, dar: 3.9, potency: 99,
            appearance: "Clear", ph: 6.0, freePayload: 0.9,
          },
          {
            timepoint: 6,
            purity: 98.1, aggregates: 1.4, dar: 3.9, potency: 98,
            appearance: "Clear", ph: 6.0, freePayload: 1.0,
          },
          {
            timepoint: 12,
            purity: 97.8, aggregates: 1.6, dar: 3.8, potency: 97,
            appearance: "Clear", ph: 6.0, freePayload: 1.1,
          },
          {
            timepoint: 24,
            purity: 97.2, aggregates: 2.0, dar: 3.7, potency: 95,
            appearance: "Clear", ph: 5.9, freePayload: 1.3,
          },
          {
            timepoint: 36,
            purity: 96.5, aggregates: 2.4, dar: 3.6, potency: 93,
            appearance: "Clear to slightly opalescent", ph: 5.9, freePayload: 1.5,
          },
        ],
        conclusion: "Stable for at least 36 months at 5C. All parameters within specification.",
      },

      // Accelerated: 25C/60%RH
      accelerated: {
        condition: "25C / 60% RH",
        schedule: "0, 1, 3, 6, 12, 24 months",
        duration: 24, // months
        results: [
          {
            timepoint: 0,
            purity: 98.4, aggregates: 1.2, dar: 4.0, potency: 100,
            freePayload: 0.8,
          },
          {
            timepoint: 3,
            purity: 97.5, aggregates: 1.8, dar: 3.8, potency: 96,
            freePayload: 1.2,
          },
          {
            timepoint: 6,
            purity: 96.8, aggregates: 2.3, dar: 3.7, potency: 93,
            freePayload: 1.5,
          },
          {
            timepoint: 12,
            purity: 95.2, aggregates: 3.1, dar: 3.5, potency: 88,
            freePayload: 2.0,
          },
          {
            timepoint: 24,
            purity: 92.8, aggregates: 4.5, dar: 3.2, potency: 82,
            freePayload: 2.8,
          },
        ],
        conclusion: "Degradation trends observed at 25C consistent with ADC class. Confirms 5C storage requirement.",
      },

      // Stress: 40C/75%RH
      stress: {
        condition: "40C / 75% RH",
        schedule: "0, 1, 3, 6 months",
        duration: 6,
        results: [
          {
            timepoint: 0,
            purity: 98.4, aggregates: 1.2, dar: 4.0, potency: 100,
            freePayload: 0.8,
          },
          {
            timepoint: 1,
            purity: 95.5, aggregates: 3.0, dar: 3.6, potency: 88,
            freePayload: 2.2,
          },
          {
            timepoint: 3,
            purity: 91.2, aggregates: 5.8, dar: 3.1, potency: 75,
            freePayload: 3.8,
          },
          {
            timepoint: 6,
            purity: 85.0, aggregates: 9.5, dar: 2.6, potency: 60,
            freePayload: 5.5,
          },
        ],
        conclusion: "Significant degradation at 40C. Product not suitable for room temperature storage.",
      },

      // Proposed shelf life
      shelfLife: {
        proposedMonths: 36,
        storageCondition: "5 +/- 3C, protect from light",
        justification: "Based on 36-month long-term stability data showing all parameters within specification at 5C.",
      },

      extractionNotes: [
        "Sample data -- not extracted from a real document.",
      ],
    },
  },

  // 4. Toxicology Report — GLP studies
  {
    docType: "TOXICOLOGY_REPORT",
    structuredData: {
      productName: "DEM-ADC-301",
      studyType: "GLP Repeat-Dose Toxicology",
      glpCompliant: true,
      testingFacility: "Demo Preclinical Research Institute, San Diego, CA",
      studyDirector: "Dr. James Chen, PhD, DABT",

      studies: [
        // Rat study
        {
          species: "Sprague Dawley Rat",
          studyNumber: "TOX-2024-001",
          route: "IV (slow bolus)",
          schedule: "Q3W x 4 doses",
          doseGroups: [
            { dose: 0, unit: "mg/kg", n: 20, sex: "10M/10F" },
            { dose: 1, unit: "mg/kg", n: 20, sex: "10M/10F" },
            { dose: 3, unit: "mg/kg", n: 20, sex: "10M/10F" },
            { dose: 10, unit: "mg/kg", n: 20, sex: "10M/10F" },
          ],
          duration: "12 weeks (4 doses + 6-week recovery)",
          noael: 3,
          noaelUnit: "mg/kg",
          loael: 10,
          loaelUnit: "mg/kg",
          mtd: null,
          targetOrgans: [
            {
              organ: "Bone marrow",
              finding: "Decreased cellularity at 10 mg/kg",
              severity: "Moderate",
              reversibility: "Fully reversible at 6-week recovery",
            },
            {
              organ: "Liver",
              finding: "Hepatocellular hypertrophy at 10 mg/kg",
              severity: "Mild",
              reversibility: "Fully reversible",
            },
            {
              organ: "Peripheral nerves",
              finding: "Axonal degeneration (sciatic) at 10 mg/kg",
              severity: "Mild",
              reversibility: "Partially reversible (4/10 animals recovered)",
            },
          ],
          clinicalPathology: {
            hematology: "Dose-dependent neutropenia at >=3 mg/kg; thrombocytopenia at 10 mg/kg",
            clinicalChemistry: "Elevated ALT/AST at 10 mg/kg (2-3x ULN)",
          },
          mortality: "No unscheduled deaths",
          conclusion: "NOAEL = 3 mg/kg. Dose-limiting toxicity: bone marrow suppression and peripheral neuropathy at 10 mg/kg.",
        },
        // Monkey study (relevant species for humanized antibody)
        {
          species: "Cynomolgus Monkey",
          studyNumber: "TOX-2024-002",
          route: "IV infusion (30 min)",
          schedule: "Q3W x 4 doses",
          doseGroups: [
            { dose: 0, unit: "mg/kg", n: 6, sex: "3M/3F" },
            { dose: 1, unit: "mg/kg", n: 6, sex: "3M/3F" },
            { dose: 3, unit: "mg/kg", n: 6, sex: "3M/3F" },
            { dose: 10, unit: "mg/kg", n: 6, sex: "3M/3F" },
          ],
          duration: "12 weeks (4 doses + 6-week recovery)",
          noael: 3,
          noaelUnit: "mg/kg",
          loael: 10,
          loaelUnit: "mg/kg",
          mtd: null,
          targetOrgans: [
            {
              organ: "Skin",
              finding: "Desquamation and alopecia at Nectin-4 expressing tissues at 10 mg/kg",
              severity: "Moderate",
              reversibility: "Fully reversible",
            },
            {
              organ: "Bone marrow",
              finding: "Hypocellularity at 10 mg/kg",
              severity: "Moderate",
              reversibility: "Fully reversible",
            },
            {
              organ: "GI tract",
              finding: "Mucosal erosions (duodenum, jejunum) at 10 mg/kg",
              severity: "Mild to moderate",
              reversibility: "Fully reversible",
            },
          ],
          clinicalPathology: {
            hematology: "Neutropenia at >=3 mg/kg (nadir Day 10, recovery by Day 21)",
            clinicalChemistry: "Transient ALT elevations at 10 mg/kg (1.5-2x baseline)",
          },
          mortality: "No unscheduled deaths",
          conclusion: "NOAEL = 3 mg/kg. Target-mediated toxicity (skin, GI) consistent with Nectin-4 expression pattern. Hematologic toxicity consistent with MMAE payload mechanism.",
        },
      ],

      // HED calculation
      humanEquivalentDose: {
        basisSpecies: "Cynomolgus Monkey",
        animalNOAEL: 3, // mg/kg
        bodyWeightAnimal: 3.1, // kg (average monkey)
        bodyWeightHuman: 60, // kg
        conversionFactor: 3.1, // Km monkey / Km human approx factor
        hedValue: 0.97, // mg/kg (3 * (3.1/60)^(1-0.67) simplified, or use FDA factor 3.1/37 ~0.084 * 3 / 6.2)
        safetyFactor: 10,
        proposedStartingDose: 0.1, // mg/kg (~1/10 of HED)
        proposedStartingDoseUnit: "mg/kg",
        calculation: "HED = NOAEL (3 mg/kg) x (Km_animal/Km_human) = 3 x (12/37) = 0.97 mg/kg. Starting dose = HED/10 = ~0.1 mg/kg. Protocol starts at 0.3 mg/kg with additional safety margin from 3+3 design.",
      },

      // Genotoxicity
      genotoxicity: {
        amesTest: { result: "Negative", glpCompliant: true },
        micronucleus: { result: "Negative", glpCompliant: true },
        note: "MMAE payload is a known tubulin inhibitor; genotoxicity expected for free MMAE but conjugated form limits systemic exposure.",
      },

      // Safety pharmacology
      safetyPharmacology: {
        cardiovascular: "No QTc prolongation at doses up to 10 mg/kg (monkey telemetry study)",
        respiratory: "No treatment-related effects on respiratory function",
        cns: "No treatment-related neurobehavioral findings at NOAEL",
      },

      extractionNotes: [
        "Sample data -- not extracted from a real document.",
      ],
    },
  },

  // 5. PK Study — Nonclinical pharmacokinetics
  {
    docType: "PK_STUDY",
    structuredData: {
      productName: "DEM-ADC-301",
      species: "Cynomolgus Monkey",
      studyNumber: "PK-2024-001",
      route: "IV infusion (30 min)",
      doses: [1, 3, 10], // mg/kg
      schedule: "Single dose PK + Q3W multi-dose",

      // Conjugated ADC (intact ADC measured by target-binding ELISA)
      conjugatedADC: {
        analyte: "Conjugated ADC (anti-Nectin-4-vc-MMAE)",
        method: "Target-binding ELISA",
        singleDosePK: [
          {
            dose: 1, unit: "mg/kg",
            cmax: 25.2, cmaxUnit: "ug/mL",
            auc0inf: 1680, aucUnit: "ug*h/mL",
            halfLife: 144, halfLifeUnit: "hours", // ~6 days
            clearance: 0.60, clearanceUnit: "mL/h/kg",
            vss: 72, vssUnit: "mL/kg",
            tmax: 0.5, tmaxUnit: "hours",
          },
          {
            dose: 3, unit: "mg/kg",
            cmax: 74.5, cmaxUnit: "ug/mL",
            auc0inf: 5100, aucUnit: "ug*h/mL",
            halfLife: 156, halfLifeUnit: "hours", // ~6.5 days
            clearance: 0.59, clearanceUnit: "mL/h/kg",
            vss: 70, vssUnit: "mL/kg",
            tmax: 0.5, tmaxUnit: "hours",
          },
          {
            dose: 10, unit: "mg/kg",
            cmax: 248, cmaxUnit: "ug/mL",
            auc0inf: 17200, aucUnit: "ug*h/mL",
            halfLife: 162, halfLifeUnit: "hours", // ~6.75 days
            clearance: 0.58, clearanceUnit: "mL/h/kg",
            vss: 68, vssUnit: "mL/kg",
            tmax: 0.5, tmaxUnit: "hours",
          },
        ],
        linearity: "Approximately dose-proportional over 1-10 mg/kg range",
        accumulation: "Minimal accumulation with Q3W dosing (R_acc ~1.1-1.2)",
      },

      // Total antibody (includes DAR-0 species)
      totalAntibody: {
        analyte: "Total Antibody (anti-human IgG ELISA)",
        method: "Anti-human IgG ELISA",
        singleDosePK: [
          {
            dose: 3, unit: "mg/kg",
            cmax: 78.2, cmaxUnit: "ug/mL",
            auc0inf: 6200, aucUnit: "ug*h/mL",
            halfLife: 192, halfLifeUnit: "hours", // ~8 days
            clearance: 0.48, clearanceUnit: "mL/h/kg",
          },
        ],
        note: "Total antibody t1/2 longer than conjugated ADC, consistent with deconjugation of payload over time.",
      },

      // Free MMAE (payload)
      freePayload: {
        analyte: "Free MMAE",
        method: "LC-MS/MS",
        singleDosePK: [
          {
            dose: 3, unit: "mg/kg",
            cmax: 4.8, cmaxUnit: "ng/mL",
            auc0inf: 98.5, aucUnit: "ng*h/mL",
            halfLife: 48, halfLifeUnit: "hours", // ~2 days
            tmax: 48, tmaxUnit: "hours", // Delayed peak from catabolism
          },
        ],
        note: "Free MMAE Cmax ~1000-fold lower than conjugated ADC Cmax on molar basis, consistent with stable linker.",
      },

      // Distribution
      distribution: {
        vss: "68-72 mL/kg (consistent with plasma-confined distribution of IgG)",
        tissueDistribution: "Highest uptake in tumor xenograft, liver, spleen (consistent with ADC class)",
      },

      // ADME summary
      adme: {
        absorption: "IV administration; 100% bioavailability",
        distribution: "Primarily confined to vascular space; target-mediated distribution to Nectin-4 expressing tissues",
        metabolism: "Lysosomal degradation following receptor-mediated internalization; linker cleavage releases MMAE",
        excretion: "MMAE primarily hepatobiliary; intact ADC cleared by target-mediated and FcRn-mediated pathways",
      },

      extractionNotes: [
        "Sample data -- not extracted from a real document.",
      ],
    },
  },

  // 6. Clinical Protocol — Phase 1 dose escalation
  {
    docType: "CLINICAL_PROTOCOL",
    structuredData: {
      protocolNumber: "DEM-ADC-301-001",
      protocolTitle: "A Phase 1, Open-Label, Dose-Escalation and Expansion Study of DEM-ADC-301 in Patients with Locally Advanced or Metastatic Urothelial Carcinoma",
      sponsor: "Demo Therapeutics Inc.",
      irbApproval: "Pending",
      version: "1.0",
      date: "2025-01-30",

      // Study design
      studyDesign: {
        phase: "Phase 1",
        design: "Open-label, multicenter, dose escalation (3+3) followed by cohort expansion",
        arms: [
          {
            name: "Dose Escalation",
            description: "3+3 dose escalation to determine MTD and RP2D",
            doseLevels: [
              { level: 1, dose: 0.3, unit: "mg/kg", schedule: "Q3W IV" },
              { level: 2, dose: 0.6, unit: "mg/kg", schedule: "Q3W IV" },
              { level: 3, dose: 1.0, unit: "mg/kg", schedule: "Q3W IV" },
              { level: 4, dose: 1.8, unit: "mg/kg", schedule: "Q3W IV" },
              { level: 5, dose: 3.0, unit: "mg/kg", schedule: "Q3W IV" },
              { level: 6, dose: 5.0, unit: "mg/kg", schedule: "Q3W IV" },
              { level: 7, dose: 10.0, unit: "mg/kg", schedule: "Q3W IV" },
            ],
          },
          {
            name: "Expansion Cohort",
            description: "Expansion at RP2D in urothelial carcinoma patients",
            estimatedN: 20,
          },
        ],
        escalationRules: "Standard 3+3 design. DLT evaluation window: Cycle 1 (21 days). If 0/3 DLTs, escalate. If 1/3, expand to 6. If >=2/6, de-escalate. MTD = highest dose with <33% DLT rate.",
      },

      // Eligibility
      eligibility: {
        inclusion: [
          "Age >= 18 years",
          "Histologically confirmed locally advanced or metastatic urothelial carcinoma",
          "Progressed on or after platinum-based chemotherapy or checkpoint inhibitor therapy",
          "ECOG performance status 0-1",
          "Measurable disease per RECIST v1.1",
          "Adequate organ function (ANC >= 1500/uL, platelets >= 100,000/uL, Hgb >= 9.0 g/dL, creatinine clearance >= 30 mL/min, AST/ALT <= 2.5x ULN, total bilirubin <= 1.5x ULN)",
          "Nectin-4 expression by IHC (H-score >= 150 or >= 25% of tumor cells at 2+ or 3+ intensity)",
        ],
        exclusion: [
          "Prior treatment with Nectin-4-targeting agent",
          "Active CNS metastases (treated, stable brain metastases allowed)",
          "Grade >= 2 peripheral neuropathy",
          "Uncontrolled diabetes (HbA1c > 8%)",
          "Active autoimmune disease requiring systemic therapy",
          "Known HIV, active hepatitis B or C",
          "Concurrent systemic anticancer therapy",
          "Prior organ transplant",
        ],
      },

      // Endpoints
      endpoints: {
        primary: [
          "Safety and tolerability: incidence of DLTs, AEs, SAEs",
          "Maximum tolerated dose (MTD) and recommended Phase 2 dose (RP2D)",
        ],
        secondary: [
          "Objective response rate (ORR) per RECIST v1.1",
          "Duration of response (DOR)",
          "Progression-free survival (PFS)",
          "Disease control rate (DCR)",
          "PK parameters: Cmax, AUC, t1/2, CL, Vss of conjugated ADC, total antibody, and free MMAE",
        ],
        exploratory: [
          "Nectin-4 expression correlation with response",
          "Immunogenicity (anti-drug antibodies)",
          "Circulating tumor DNA dynamics",
          "Biomarker analysis (tumor biopsy pre/post treatment)",
        ],
      },

      // Statistical design (Project Optimus aligned)
      statistics: {
        sampleSize: "Approximately 30-50 patients in dose escalation + 20 in expansion",
        dltWindow: "21 days (Cycle 1)",
        interimAnalyses: "Safety review by independent Data Safety Monitoring Board after each dose cohort",
        rp2dSelection: "Per FDA Project Optimus guidance, RP2D may be below MTD based on totality of safety, PK, and efficacy data across multiple dose levels",
      },

      // Regulatory
      regulatory: {
        indNumber: "Pending",
        fdaDivision: "CDER - Division of Oncology 2",
        preIndMeeting: "Type B Pre-IND meeting completed 2024-11-15; FDA feedback incorporated",
        diversityPlan: "Required per FDA Guidance on Diversity Action Plans (Oct 2024). Enrollment targets: >= 25% underrepresented racial/ethnic minorities.",
      },

      extractionNotes: [
        "Sample data -- not extracted from a real document.",
      ],
    },
  },
];
