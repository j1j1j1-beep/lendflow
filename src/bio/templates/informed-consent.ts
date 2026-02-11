// informed-consent.ts
// Generates a DOCX Informed Consent Form from deterministic data + AI prose.
// All text must be written at an 8th grade reading level per FDA requirements.
// Per 21 CFR 50.25 and ICH E6(R2).

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  bodyText,
  bodyTextRuns,
  bulletPoint,
  spacer,
  signatureBlock,
  COLORS,
  formatDate,
} from "../../documents/doc-helpers";

import type { BioDocumentInput, InformedConsentProse } from "./types";

export function buildInformedConsent(
  input: BioDocumentInput,
  prose: InformedConsentProse,
): Document {
  const children: (Paragraph | Table)[] = [];
  const dateFormatted = formatDate(input.generatedAt);
  const phase = input.phase ?? "Phase 1";

  // Plain-language study title
  const plainTitle = input.indication
    ? `A Study of ${input.drugName} in People With ${input.indication}`
    : `A Study of ${input.drugName}`;

  // -------------------------------------------------------------------------
  // Header / Title
  // -------------------------------------------------------------------------
  children.push(documentTitle("Informed Consent Form"));
  children.push(spacer(2));
  children.push(bodyText("CONSENT TO TAKE PART IN A RESEARCH STUDY", { bold: true }));
  children.push(spacer(4));

  // Study identification (deterministic)
  children.push(bodyText(`Study Title: ${plainTitle}`, { bold: true }));
  children.push(bodyText(`Study Drug: ${input.drugName} (${input.drugClass})`));
  children.push(bodyText(`Study Phase: ${phase}`));
  children.push(bodyText(`Sponsor: ${input.sponsorName}`));
  if (input.indNumber) {
    children.push(bodyText(`IND Number: ${input.indNumber}`));
  }
  if (input.nctNumber) {
    children.push(bodyText(`ClinicalTrials.gov Number: ${input.nctNumber}`));
  }
  children.push(bodyText(`Date of This Form: ${dateFormatted}`));

  children.push(spacer(2));
  children.push(
    bodyText(
      "Please read this form carefully. It tells you important things about a research study. A member of the research team will also talk with you about taking part in this study. Taking part in research is your choice. If you decide to take part, please sign this form. You will get a copy to keep.",
      { italic: true },
    ),
  );

  // -------------------------------------------------------------------------
  // 1. Why is this study being done?
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("1. Why Is This Study Being Done?"));
  children.push(bodyText(prose.studyPurpose));

  children.push(spacer(2));
  children.push(
    bodyText(
      `${input.drugName} is a new medicine that has not been approved by the Food and Drug Administration (FDA). It is being studied for the first time in people. The purpose of this study is to find out how safe ${input.drugName} is, what dose works best, and how the body handles the drug.`,
    ),
  );

  // -------------------------------------------------------------------------
  // 2. What will happen if you take part?
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("2. What Will Happen If You Take Part?"));
  children.push(bodyText(prose.procedures));

  children.push(spacer(2));
  children.push(bodyText("If you agree to be in this study, the following will happen:", { bold: true }));

  children.push(
    bulletPoint(
      "Screening Visit: You will have tests to see if you can take part. These tests include blood draws, a physical exam, heart tests, and imaging scans. Screening may take up to 28 days.",
    ),
  );
  children.push(
    bulletPoint(
      `Treatment: You will receive ${input.drugName} through an IV (a needle placed into a vein in your arm) at the clinic. Each treatment visit takes about 3-4 hours, including time for the medicine to be given and for the team to watch you afterward.`,
    ),
  );
  children.push(
    bulletPoint(
      "Treatment cycles: Each cycle is 21 days long (about 3 weeks). You will come to the clinic on the first day of each cycle for treatment.",
    ),
  );
  children.push(
    bulletPoint(
      "Extra visits: During the first cycle, you will also come to the clinic on Days 2, 8, and 15 for blood draws and safety checks.",
    ),
  );
  children.push(
    bulletPoint(
      "Blood draws: We will draw blood many times during the study to check your health and to measure how much drug is in your body. About 15-20 tablespoons of blood will be drawn in total during the first cycle.",
    ),
  );
  children.push(
    bulletPoint(
      "Imaging scans: You will have CT scans or MRI scans every 6 weeks to see if the cancer has changed.",
    ),
  );
  children.push(
    bulletPoint(
      "End of treatment: When you stop getting the study drug, you will have a final visit for tests. After that, the study team will contact you about every 3 months to see how you are doing.",
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("How long will you be in the study?", { bold: true }));
  children.push(
    bodyText(
      "You may keep getting the study drug for as long as it seems to be helping you and you are not having bad side effects. If the cancer gets worse or if you have serious side effects, the study doctor will stop treatment.",
    ),
  );

  // -------------------------------------------------------------------------
  // 3. What are the risks?
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("3. What Are the Risks?"));
  children.push(bodyText(prose.risks));

  children.push(spacer(2));
  children.push(
    bodyText(
      `Because ${input.drugName} has not been given to people before, we do not know all the side effects it may cause. Based on studies done in animals and in the laboratory, possible risks include:`,
    ),
  );

  children.push(bulletPoint("Nausea, vomiting, or loss of appetite"));
  children.push(bulletPoint("Feeling very tired (fatigue)"));
  children.push(bulletPoint("Low blood cell counts, which may increase the risk of infection, bleeding, or feeling tired"));
  children.push(bulletPoint("Changes in blood tests that show how your liver or kidneys are working"));
  children.push(bulletPoint("Pain, redness, or swelling where the IV is placed (infusion reactions)"));
  children.push(bulletPoint("Hair loss"));
  children.push(bulletPoint("Numbness or tingling in hands or feet (nerve problems)"));
  children.push(bulletPoint("Eye problems (blurred vision, dry eyes)"));

  // CRS risk for afucosylated ADCs
  const isAfucosylated =
    input.antibodyType?.toLowerCase().includes("afucosylat") ||
    input.drugClass?.toLowerCase().includes("afucosylat") ||
    input.drugClass?.toLowerCase().includes("bifunctional");

  if (isAfucosylated) {
    children.push(spacer(2));
    children.push(
      bodyText(
        "There is also a risk of a reaction called cytokine release syndrome (CRS). This happens when the immune system reacts strongly to the medicine. Signs of CRS include:",
        { bold: true },
      ),
    );
    children.push(bulletPoint("Fever (high temperature)"));
    children.push(bulletPoint("Feeling dizzy or lightheaded"));
    children.push(bulletPoint("Trouble breathing"));
    children.push(bulletPoint("Fast heartbeat"));
    children.push(
      bodyText(
        "The study team is trained to watch for CRS and treat it quickly. Medicine to treat CRS will be available at the clinic at all times.",
      ),
    );
  }

  children.push(spacer(2));
  children.push(
    bodyText(
      "There may be other risks that we do not know about yet. The study team will tell you right away about any new information that could affect your decision to stay in the study.",
      { italic: true },
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("Risks to an unborn baby:", { bold: true }));
  children.push(
    bodyText(
      `${input.drugName} may harm an unborn baby. If you can become pregnant, you must use effective birth control during the study and for at least 6 months after your last dose. If you think you might be pregnant, tell the study team right away. If you are a man with a partner who can become pregnant, you must also use birth control during the study and for at least 3 months after your last dose.`,
    ),
  );

  // -------------------------------------------------------------------------
  // 4. What are the benefits?
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("4. What Are the Benefits?"));
  children.push(bodyText(prose.benefits));

  children.push(spacer(2));
  children.push(
    bodyText(
      "We cannot promise that you will benefit from being in this study. Your cancer may or may not get better. The information learned from this study may help other people with cancer in the future.",
    ),
  );

  // -------------------------------------------------------------------------
  // 5. What other choices do you have?
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("5. What Other Choices Do You Have?"));
  children.push(bodyText(prose.alternatives));

  children.push(spacer(2));
  children.push(
    bodyText(
      "You do not have to join this study. Other options may include:",
    ),
  );
  children.push(bulletPoint("Other cancer treatments that are already approved by the FDA"));
  children.push(bulletPoint("Other research studies"));
  children.push(bulletPoint("Supportive care (treatment to help with symptoms, but not to treat the cancer directly)"));
  children.push(bulletPoint("No treatment"));
  children.push(spacer(2));
  children.push(
    bodyText(
      "Talk to your doctor about all of your options before you decide.",
    ),
  );

  // -------------------------------------------------------------------------
  // 6. How will your information be kept private?
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("6. How Will Your Information Be Kept Private?"));
  children.push(bodyText(prose.confidentiality));

  children.push(spacer(2));
  children.push(
    bodyText(
      "We will do our best to protect your personal information. Your name and other identifying information will not appear in any published reports. Instead, you will be given a study code number. However, complete privacy cannot be guaranteed. The following groups may need to look at your study records:",
    ),
  );
  children.push(bulletPoint("The study sponsor and its representatives"));
  children.push(bulletPoint("The U.S. Food and Drug Administration (FDA)"));
  children.push(bulletPoint("The Institutional Review Board (IRB) that oversees this research"));
  children.push(bulletPoint("Government agencies, as required by law"));

  children.push(spacer(2));
  children.push(
    bodyText(
      "A description of this study will be available on ClinicalTrials.gov. This website will not include information that can identify you. At most, the website will include a summary of the results.",
    ),
  );

  // -------------------------------------------------------------------------
  // 7. Taking part is voluntary
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("7. Taking Part Is Voluntary"));
  children.push(
    bodyText(
      "Taking part in this study is completely voluntary. You may choose not to take part. If you decide to take part now, you can change your mind and leave the study at any time. Your decision will not affect your regular medical care in any way.",
    ),
  );

  children.push(spacer(2));
  children.push(
    bodyText(
      "If you leave the study, the study team may ask you to come in for a final visit and to let us know how you are doing. Data collected before you leave the study may still be used in the research.",
    ),
  );

  children.push(spacer(2));
  children.push(bodyText("The study doctor may take you off the study if:", { bold: true }));
  children.push(bulletPoint("Staying in the study would be harmful to you."));
  children.push(bulletPoint("You do not follow the study rules."));
  children.push(bulletPoint("The sponsor or the FDA decides to stop the study."));
  children.push(bulletPoint("New information shows the study drug is not safe."));

  // -------------------------------------------------------------------------
  // 8. What about costs and payment?
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("8. What About Costs and Payment?"));
  children.push(
    bodyText(
      `There is no charge to you for the study drug (${input.drugName}) or for study-related tests and procedures. However, standard medical care that you would receive whether or not you were in the study may be billed to you or your insurance.`,
    ),
  );

  children.push(spacer(2));
  children.push(
    bodyText(
      "If you are injured as a direct result of being in this study, the sponsor will pay for reasonable medical treatment of that injury. This does not mean you give up any legal rights.",
    ),
  );

  // -------------------------------------------------------------------------
  // 9. Who should you contact?
  // -------------------------------------------------------------------------
  children.push(spacer(4));
  children.push(sectionHeading("9. Who Should You Contact?"));

  children.push(bodyText("For questions about the study:", { bold: true }));
  children.push(bodyText("Principal Investigator: [Name]"));
  children.push(bodyText("Phone: [Phone Number]"));
  children.push(bodyText("Available 24 hours a day for urgent questions"));

  children.push(spacer(2));
  children.push(bodyText("For questions about your rights as a research participant:", { bold: true }));
  children.push(bodyText("Institutional Review Board (IRB): [Name of IRB]"));
  children.push(bodyText("Phone: [Phone Number]"));

  children.push(spacer(2));
  children.push(bodyText("Study Sponsor:", { bold: true }));
  children.push(bodyText(`${input.sponsorName}`));
  if (input.sponsorAddress) {
    children.push(bodyText(`${input.sponsorAddress}`));
  }

  // -------------------------------------------------------------------------
  // 10. Signature Block
  // -------------------------------------------------------------------------
  children.push(spacer(8));
  children.push(sectionHeading("10. Consent Signatures"));

  children.push(
    bodyText(
      "By signing below, you confirm that:",
      { bold: true },
    ),
  );
  children.push(bulletPoint("You have read this form (or it was read to you)."));
  children.push(bulletPoint("The research study has been explained to you."));
  children.push(bulletPoint("Your questions have been answered."));
  children.push(bulletPoint("You agree to take part in this study."));
  children.push(bulletPoint("You know that you can leave the study at any time."));

  // Patient signature
  children.push(spacer(4));
  children.push(
    bodyText("PARTICIPANT:", { bold: true, color: COLORS.primary }),
  );
  children.push(...signatureBlock("[Participant Name]", "Research Participant"));

  children.push(spacer(2));
  children.push(
    bodyTextRuns([
      { text: "Printed Name: ", bold: true },
      { text: "________________________________________" },
    ]),
  );

  // Witness signature
  children.push(spacer(8));
  children.push(
    bodyText("WITNESS (if applicable):", { bold: true, color: COLORS.primary }),
  );
  children.push(
    bodyText(
      "A witness signature is required if the consent form is read to the participant.",
      { italic: true },
    ),
  );
  children.push(...signatureBlock("[Witness Name]", "Witness"));

  children.push(spacer(2));
  children.push(
    bodyTextRuns([
      { text: "Printed Name: ", bold: true },
      { text: "________________________________________" },
    ]),
  );

  // Person obtaining consent
  children.push(spacer(8));
  children.push(
    bodyText("PERSON OBTAINING CONSENT:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    bodyText(
      "I have explained this research study to the participant and have answered all questions. I believe the participant understands the information in this form and freely consents to take part.",
    ),
  );
  children.push(...signatureBlock("[Investigator/Designee Name]", "Investigator or Authorized Designee"));

  children.push(spacer(2));
  children.push(
    bodyTextRuns([
      { text: "Printed Name: ", bold: true },
      { text: "________________________________________" },
    ]),
  );
  children.push(
    bodyTextRuns([
      { text: "Title/Role: ", bold: true },
      { text: "________________________________________" },
    ]),
  );

  // Wrap in document shell
  return buildLegalDocument({
    title: "Informed Consent Form",
    headerRight: `Informed Consent -- ${input.drugName} ${phase}`,
    children,
  });
}
