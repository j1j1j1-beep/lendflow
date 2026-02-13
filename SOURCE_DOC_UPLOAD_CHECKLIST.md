# Source Doc Upload Implementation Checklist

## ALL COMPLETE

- [x] Step 1: Schema — `SourceDocument.docType` nullable + `ocrText`, `textractOutput`, `classifiedAt`, `classificationConfidence` fields
- [x] Step 2: Rewrite `src/components/source-doc-checklist.tsx` — drag-and-drop zone, file list with delete, classification badges, updated `fetchMissingSourceDocs` to call classify endpoint
- [x] Step 3: Upload API `src/app/api/source-documents/upload/route.ts` — docType optional, skip validation when null, skip soft-delete when no docType
- [x] Step 4: NEW `src/lib/source-doc-classifier.ts` — `classifyAndExtractSourceDoc(s3Key, module)` → Textract + Grok classification
- [x] Step 5: NEW `src/app/api/source-documents/classify/route.ts` — POST endpoint, classifies unclassified docs, returns missing doc info
- [x] Step 6: Feed source doc content into generation — all 4 `generate-doc.ts` files updated:
  - [x] `src/documents/capital/generate-doc.ts` — `setCapitalSourceDocContent` + `buildProjectContext` reads module-level var
  - [x] `src/documents/deals/generate-doc.ts` — `setMASourceDocContent` + `appendSourceDocContent` helper (module-level var pattern)
  - [x] `src/documents/syndication/generate-doc.ts` — `setSyndicationSourceDocContent` + `buildProjectContext` reads module-level var
  - [x] `src/documents/compliance/generate-doc.ts` — `setComplianceSourceDocContent` + `buildProjectContext` reads module-level var
- [x] Step 7a: `src/inngest/capital-functions.ts` — `load-source-doc-content` step + `setCapitalSourceDocContent` before generation
- [x] Step 7b: `src/inngest/ma-functions.ts` — `load-source-doc-content` step + `setMASourceDocContent` before generation
- [x] Step 7c: `src/inngest/syndication-functions.ts` — `load-source-doc-content` step + `setSyndicationSourceDocContent` before generation
- [x] Step 7d: `src/inngest/compliance-functions.ts` — `load-source-doc-content` step + `setComplianceSourceDocContent` before generation
- [x] Step 8a: `src/app/dashboard/capital/[projectId]/page.tsx` — `classifying` state + "Analyzing documents..." spinner
- [x] Step 8b: `src/app/dashboard/deals/[projectId]/page.tsx` — same
- [x] Step 8c: `src/app/dashboard/syndication/[projectId]/page.tsx` — same
- [x] Step 8d: `src/app/dashboard/compliance/[projectId]/page.tsx` — same
- [x] Step 9: Enhanced `MissingDocsDialog` — placeholder warning banner, affected doc badges, "Continue with Placeholders" button
- [x] Step 10: `prisma generate` + `tsc --noEmit` — 0 errors
- [x] Step 11: Fix `source-doc-check.ts` — `getMissingSourceDocKeys` filters nulls from uploaded set

## ARCHITECTURE
- All 4 modules use module-level vars + setter pattern for source doc content injection
- Capital: `setCapitalSourceDocContent()` → `buildProjectContext()` reads `_sourceDocContent`
- Deals/MA: `setMASourceDocContent()` → `buildMAContext()` reads `_sourceDocContent`
- Syndication: `setSyndicationSourceDocContent()` → `buildProjectContext()` reads `_sourceDocContent`
- Compliance: `setComplianceSourceDocContent()` → `buildProjectContext()` reads `_sourceDocContent`
- Inngest pipelines: load source doc content from DB → call setter → generate docs
- Detail pages: handleGenerate → classifying spinner → fetchMissingSourceDocs (calls classify endpoint) → MissingDocsDialog or doGenerate

## FILES CREATED
- `src/lib/source-doc-classifier.ts`
- `src/app/api/source-documents/classify/route.ts`

## FILES MODIFIED
- `prisma/schema.prisma`
- `src/components/source-doc-checklist.tsx` (full rewrite)
- `src/components/missing-docs-dialog.tsx` (enhanced)
- `src/app/api/source-documents/upload/route.ts`
- `src/documents/capital/generate-doc.ts`
- `src/documents/deals/generate-doc.ts`
- `src/documents/syndication/generate-doc.ts`
- `src/documents/compliance/generate-doc.ts`
- `src/inngest/capital-functions.ts`
- `src/inngest/ma-functions.ts`
- `src/inngest/syndication-functions.ts`
- `src/inngest/compliance-functions.ts`
- `src/app/dashboard/capital/[projectId]/page.tsx`
- `src/app/dashboard/deals/[projectId]/page.tsx`
- `src/app/dashboard/syndication/[projectId]/page.tsx`
- `src/app/dashboard/compliance/[projectId]/page.tsx`
- `src/lib/source-doc-check.ts`
