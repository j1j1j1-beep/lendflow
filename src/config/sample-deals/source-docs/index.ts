/**
 * Source Document Generators — All Modules
 *
 * These generate the OCR-style text content that would normally come from
 * Textract processing uploaded PDFs. For sample deals, we skip S3/Textract
 * and inject this content directly into SourceDocument records.
 *
 * Usage:
 *   import { getCapitalSourceDocs } from './source-docs';
 *   const docs = getCapitalSourceDocs('pe_506b_sample');
 *   // docs = { fund_business_plan: "...", formation_docs: "...", management_bios: "..." }
 */

export { getCapitalSourceDocs, getAllCapitalSourceDocs } from "./capital-source-docs";
export { getMASourceDocs, getAllMASourceDocs } from "./ma-source-docs";
export { getSyndicationSourceDocs, getAllSyndicationSourceDocs } from "./syndication-source-docs";
export { getComplianceSourceDocs, getAllComplianceSourceDocs } from "./compliance-source-docs";
