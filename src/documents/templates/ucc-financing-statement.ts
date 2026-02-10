// =============================================================================
// ucc-financing-statement.ts
// Generates a DOCX UCC-1 Financing Statement to perfect a security interest
// in personal property collateral (equipment, inventory, accounts, etc.).
// =============================================================================

import {
  Document,
  Paragraph,
  Table,
  buildLegalDocument,
  documentTitle,
  sectionHeading,
  bodyText,
  bulletPoint,
  spacer,
  signatureBlock,
  keyTermsTable,
  collateralLabel,
  COLORS,
} from "../doc-helpers";

import type { DocumentInput, UccFinancingProse } from "../types";

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildUccFinancingStatement(
  input: DocumentInput,
  prose: UccFinancingProse,
): Document {
  const debtorAddress = input.debtorAddress ?? input.propertyAddress ?? "Address on file";
  const filingState = input.stateAbbr ?? "___";

  const children: (Paragraph | Table)[] = [];

  // -----------------------------------------------------------------------
  // 1. Title
  // -----------------------------------------------------------------------
  children.push(documentTitle("UCC-1 FINANCING STATEMENT WORKSHEET"));

  // -----------------------------------------------------------------------
  // 2. Filing Information Table
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Filing Information"));
  const stateOfOrg = input.debtorStateOfOrganization ?? filingState;
  const orgId = input.debtorOrganizationId ?? "_______________";
  children.push(
    keyTermsTable([
      { label: "Debtor", value: input.borrowerName },
      { label: "Debtor Address", value: debtorAddress },
      { label: "State of Organization", value: stateOfOrg },
      { label: "Organization ID", value: orgId },
      { label: "Secured Party", value: input.lenderName },
      { label: "Filing Office", value: `Secretary of State, ${stateOfOrg}` },
      { label: "Filer Reference Number", value: `REF-${input.dealId.substring(0, 8).padEnd(8, "0").toUpperCase()}` },
    ]),
  );
  children.push(spacer(8));

  // -----------------------------------------------------------------------
  // 3. Collateral Description (AI)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("1. Collateral Description"));
  children.push(
    bodyText(
      "The Collateral in which Secured Party holds a security interest includes all of the following, whether now owned or hereafter acquired by Debtor:",
    ),
  );
  // Enumerate specific collateral types from deal
  if (input.collateralTypes && input.collateralTypes.length > 0) {
    for (const ct of input.collateralTypes) {
      children.push(bulletPoint(collateralLabel(ct)));
    }
  }
  children.push(spacer(2));
  children.push(
    bodyText(
      "Including all accessions, additions, replacements, and substitutions thereto, all products and proceeds thereof (including insurance proceeds), and all records and data relating thereto. A security interest in the above types of Collateral attaches under UCC § 9-203 and a description using UCC Article 9 categories is sufficient under UCC § 9-108.",
    ),
  );
  children.push(spacer(2));
  children.push(
    bodyText("Additional Collateral Description:", { bold: true }),
  );
  children.push(bodyText(prose.collateralDescription));

  // -----------------------------------------------------------------------
  // 4. Proceeds (AI)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("2. Proceeds and Products"));
  children.push(
    bodyText(
      "This financing statement covers all proceeds and products of the Collateral in accordance with UCC § 9-315, including but not limited to: insurance proceeds; tort claims; accounts arising from the sale, lease, license, or other disposition of the Collateral; chattel paper; instruments; and all other forms of proceeds as defined in UCC § 9-102(a)(64). The security interest in proceeds is automatic and does not require a separate filing.",
    ),
  );
  children.push(spacer(2));
  children.push(bodyText(prose.proceedsClause));

  // -----------------------------------------------------------------------
  // 5. Additional Provisions (AI)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("3. Additional Provisions"));
  children.push(bodyText(prose.additionalProvisions));

  // -----------------------------------------------------------------------
  // 6. Filing Instructions (AI)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("4. Filing Instructions"));
  children.push(
    bodyText(
      `FILING INSTRUCTIONS: For personal property (non-fixtures), file this UCC-1 with the Secretary of State of ${input.debtorStateOfOrganization ?? input.stateAbbr ?? "[STATE]"}, the state of Debtor's organization. For fixtures, file with the county recorder in the county where the real property is located. This worksheet is for preparation purposes and must be transferred to the official UCC-1 form (National UCC Financing Statement, Form UCC1) for actual filing.`,
    ),
  );
  children.push(spacer(2));
  children.push(bodyText(prose.filingInstructions));

  // -----------------------------------------------------------------------
  // 7. Authorized Signature — Secured Party (Lender)
  // -----------------------------------------------------------------------
  children.push(sectionHeading("Authorization"));
  children.push(
    bodyText(
      "The Secured Party authorizes the filing of this Financing Statement. Under UCC § 9-509, the Secured Party may file without Debtor's signature if the Debtor has authenticated a security agreement authorizing the filing. The Security Agreement of even date herewith constitutes such authorization.",
    ),
  );

  children.push(spacer(4));
  children.push(
    bodyText("SECURED PARTY:", { bold: true, color: COLORS.primary }),
  );
  children.push(
    ...signatureBlock(input.lenderName, "Authorized Signatory"),
  );

  // -----------------------------------------------------------------------
  // Wrap in legal document shell
  // -----------------------------------------------------------------------
  return buildLegalDocument({
    title: "UCC-1 Financing Statement Worksheet",
    headerRight: `UCC-1 Worksheet — ${input.borrowerName}`,
    children,
  });
}
