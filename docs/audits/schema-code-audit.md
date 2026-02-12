# Prisma Schema Audit Report -- New Modules

**Date:** 2026-02-11
**Scope:** CapitalProject, CapitalDocument, MAProject, MADocument, SyndicationProject, SyndicationDocument, ComplianceProject, ComplianceDocument, new enums, and relation changes to Organization/User.
**Schema file:** `/Users/lgrmusa26/Projects/lendflow/prisma/schema.prisma`

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2     |
| HIGH     | 6     |
| MEDIUM   | 8     |
| LOW      | 5     |

---

## CRITICAL Issues

### C1. No indexes on any foreign key in any of the 8 new models

**Affected models:** All 8 new models (CapitalProject, CapitalDocument, MAProject, MADocument, SyndicationProject, SyndicationDocument, ComplianceProject, ComplianceDocument)

The existing codebase already has this problem (Deal, Document, etc. also lack explicit FK indexes), but scaling 4 new verticals without indexes will compound the cost. PostgreSQL auto-creates indexes on `@unique` columns and primary keys, but **not** on plain foreign key columns.

Missing indexes:

| Model | Missing Index | Why It Matters |
|-------|---------------|----------------|
| CapitalProject | `orgId`, `userId` | Every dashboard list query filters by org |
| CapitalDocument | `projectId` | Cascade deletes scan this; doc listing queries filter by project |
| MAProject | `orgId`, `userId` | Same as above |
| MADocument | `projectId` | Same as above |
| SyndicationProject | `orgId`, `userId` | Same as above |
| SyndicationDocument | `projectId` | Same as above |
| ComplianceProject | `orgId`, `userId` | Same as above |
| ComplianceDocument | `projectId` | Same as above |

**Also missing from existing models** (same issue, noting for completeness): Deal.orgId, Deal.userId, Document.dealId, Extraction.dealId, Extraction.documentId, ReviewItem.dealId, GeneratedDocument.dealId, Condition.dealId.

Without these indexes, queries like `WHERE orgId = ?` or `WHERE projectId = ?` perform full table scans. As data grows, this becomes a performance cliff.

**Recommendation:** Add `@@index([orgId])` and `@@index([userId])` to every project model; add `@@index([projectId])` to every document model. Consider composite indexes like `@@index([orgId, status])` for filtered listing pages.

---

### C2. Status fields on all Document models are untyped Strings instead of enums

**Affected models:** CapitalDocument, MADocument, SyndicationDocument, ComplianceDocument

All four document models use:
```prisma
status String @default("DRAFT")
```

The existing `GeneratedDocument` model has the same problem -- its `status`, `legalReviewStatus`, and `verificationStatus` are also plain Strings. This is an existing tech debt that is now replicated 4x.

**Risks:**
- No database-level constraint prevents invalid values like `"draft"`, `"Draft"`, `"DRAT"`, or empty string.
- Application-level typos in status checks will silently pass.
- No migration safety: adding a new status value requires grepping all code rather than updating an enum.

The same issue applies to `complianceStatus` and `verificationStatus` fields on all four document models.

**Recommendation:** Create shared enums:
```prisma
enum DocGenerationStatus {
  DRAFT
  REVIEWED
  APPROVED
  SIGNED
}

enum ComplianceCheckStatus {
  PENDING
  APPROVED
  FLAGGED
  PASSED
  FAILED
}

enum VerificationCheckStatus {
  PENDING
  PASSED
  FAILED
}
```

Apply them to the existing `GeneratedDocument` model as well as all 4 new document models.

---

## HIGH Issues

### H1. Decimal(14, 2) may be insufficient for large fund sizes

**Affected fields:** `targetRaise`, `fundSize`, `purchasePrice`, `totalEquityRaise`, `nav`, `totalContributions`, `totalDistributions`, `callAmount`, `distributionAmount`, and all other `@db.Decimal(14, 2)` fields across the 4 new modules (approximately 25 fields total).

`Decimal(14, 2)` supports a maximum value of `999,999,999,999.99` -- just under $1 trillion. For most use cases this is fine, but:

- Large infrastructure/sovereign wealth fund raises can exceed $100B.
- Aggregated reporting across multiple funds could overflow.
- The existing lending models use `Decimal(12, 2)` (max ~$10B), which is already tight for large CRE portfolios.

**Recommendation:** Use `Decimal(18, 2)` (max ~$10 quadrillion) for all monetary fields in the new modules. The storage cost difference is negligible (both use 8 bytes in PostgreSQL for values up to 18 digits). This provides headroom without any performance penalty.

---

### H2. Float used for percentage/ratio fields -- precision loss risk

**Affected fields across all 4 modules:**
- CapitalProject: `managementFee`, `carriedInterest`, `preferredReturn`
- MAProject: `escrowPercent`
- SyndicationProject: `interestRate`, `preferredReturn`, `projectedIrr`, `projectedEquityMultiple`, `acquisitionFee`, `assetMgmtFee`, `dispositionFee`, `vacancyRate`, `rentGrowthRate`, `expenseGrowthRate`, `exitCapRate`
- ComplianceProject: `netIrr`, `grossIrr`, `moic`, `dpi`, `rvpi`, `tvpi`

The existing lending models also use `Float` for percentages (e.g., `Analysis.globalDscr`, `DealTerms.interestRate`), so this is consistent with the codebase. However, IEEE 754 floating point cannot exactly represent values like `0.08` (8% preferred return). In financial calculations this leads to rounding errors.

**Trade-off:** Using `Decimal` for percentages would require explicit casting in TypeScript (Prisma returns Decimal as a string). The existing codebase has established the Float convention and the application layer likely handles rounding.

**Recommendation:** Accept Float for display-only percentages (IRR, cap rates). For fields that feed into financial calculations (interest rates, fee percentages, preferred returns), strongly consider `Decimal(6, 5)` to avoid compounding rounding errors. At minimum, document the convention.

---

### H3. ComplianceProject.fundType is a String, but CapitalProject.fundType is an enum

**Affected:** ComplianceProject.fundType (line 810)

`ComplianceProject.fundType` is declared as `String?` with a comment listing values `"PE", "VC", "RE", "Hedge", "Credit"`. Meanwhile, `CapitalProject.fundType` uses the proper `FundType` enum with values `PRIVATE_EQUITY`, `VENTURE_CAPITAL`, `REAL_ESTATE`, `HEDGE_FUND`, `CREDIT`, `INFRASTRUCTURE`.

This creates two problems:
1. The string values don't match the enum values (e.g., `"PE"` vs `PRIVATE_EQUITY`).
2. No validation on the ComplianceProject field.

**Recommendation:** Reuse the `FundType` enum on `ComplianceProject.fundType`. If the abbreviated forms are needed for display, handle that in the application layer.

---

### H4. SyndicationProject.entityType is a String, should be an enum

**Affected:** SyndicationProject.entityType (line 692)

```prisma
entityType String @default("LLC") // "LLC" or "LP"
```

Only two valid values. This should be an enum for type safety.

**Recommendation:**
```prisma
enum EntityType {
  LLC
  LP
}
```

---

### H5. No createdBy / updatedBy audit trail on any new model

**Affected:** All 8 new models.

The project models have a `userId` field indicating the creator, but:
1. There is no `updatedBy` field to track who last modified a project.
2. The document models have no user attribution at all -- no `createdBy`, `uploadedBy`, or `editedBy`.
3. The existing `GeneratedDocument` model has the same gap.

For a platform handling legal and financial documents, audit trail of who created/modified each document is important for compliance.

**Recommendation:** Add `createdBy String?` and `updatedBy String?` to all document models (CapitalDocument, MADocument, SyndicationDocument, ComplianceDocument). These should store the Clerk user ID. The project-level `userId` suffices as `createdBy` for projects, but `updatedBy` should be added.

---

### H6. No status index for project listing queries

**Affected:** CapitalProject, MAProject, SyndicationProject, ComplianceProject.

Dashboard pages will filter projects by status (e.g., show all COMPLETE projects, or all ERROR projects). Without an index on `status`, these queries require a full scan after the orgId filter.

**Recommendation:** Add composite indexes:
```prisma
@@index([orgId, status])
@@index([orgId, createdAt])
```

---

## MEDIUM Issues

### M1. Four identical project status enums that could be unified

**Affected enums:** `CapitalProjectStatus`, `MAProjectStatus`, `SyndicationStatus`, `ComplianceProjectStatus`

All four enums have identical values:
```
CREATED, GENERATING_DOCS, COMPLIANCE_REVIEW, NEEDS_REVIEW, COMPLETE, ERROR
```

This creates maintenance overhead: if a new status is needed (e.g., `GENERATING_COMPLIANCE_REPORT`), it must be added to 4 enums.

**Trade-off:** Separate enums allow each vertical to diverge independently. If the verticals are expected to have different pipeline stages in the future, keeping them separate is justified.

**Recommendation:** If the statuses are expected to stay aligned, create a single `ProjectStatus` enum. If divergence is planned, keep them separate but add a comment explaining the intentional duplication.

---

### M2. No soft delete support

**Affected:** All 8 new models.

None of the models have a `deletedAt DateTime?` field for soft delete. Hard deletes are permanent and unrecoverable. For financial/legal documents, accidental deletion is a significant risk.

The existing models (Deal, GeneratedDocument, etc.) also lack soft delete, so this is consistent but remains a gap.

**Recommendation:** Add `deletedAt DateTime?` to all project and document models. Filter queries with `WHERE deletedAt IS NULL`. This is especially important for document models that store S3 references -- hard-deleting the database record orphans the S3 object.

---

### M3. No version/revision tracking on project models

**Affected:** CapitalProject, MAProject, SyndicationProject, ComplianceProject.

Document models have a `version Int @default(1)` field, but the project models do not. If a project's terms change (e.g., fund size increases, purchase price renegotiated), there is no history of previous values.

**Recommendation:** Consider adding a `ProjectRevision` model or a `revisionHistory Json?` field to track material changes. Alternatively, rely on the AuditLog for change tracking -- but the AuditLog currently only has a `dealId` field, not a generic `projectId` field (see M7).

---

### M4. Cascade delete on all document models -- data loss risk

**Affected:** CapitalDocument, MADocument, SyndicationDocument, ComplianceDocument (all use `onDelete: Cascade` on the project relation).

When a project is deleted, all its documents are automatically deleted. This is the same pattern used by the existing models (Document -> Deal, GeneratedDocument -> Deal, etc.).

**Risks:**
- Accidental project deletion destroys all document records.
- S3 objects referenced by `s3Key` are orphaned (database records deleted but files remain in S3).
- No recovery path without database backups.

**Recommendation:** This behavior is acceptable IF:
1. Soft delete is implemented (see M2) so "deletion" is reversible.
2. A pre-delete hook or application-level check warns users before deleting projects with documents.
3. S3 cleanup is handled by a background job that processes deleted document records.

If soft delete is not implemented, consider changing to `onDelete: Restrict` to prevent project deletion while documents exist.

---

### M5. DealTerms and several existing models use String for status with no enum

**Affected (existing models, for reference):**
- `DealTerms.status`: `String @default("DRAFT")` -- should be an enum
- `DealTerms.complianceStatus`: `String @default("PENDING")` -- should be an enum
- `Condition.status`: `String @default("OPEN")` -- should be an enum
- `Condition.priority`: `String @default("required")` -- should be an enum
- `Condition.source`: plain String -- should be an enum

These are existing issues, not introduced by the new modules, but the new modules copy the same anti-pattern (see C2). Noting for completeness.

---

### M6. Inconsistent naming: SyndicationStatus vs SyndicationPropertyType

The syndication module's project status enum is named `SyndicationStatus` (not `SyndicationProjectStatus`), while all other modules use the `*ProjectStatus` suffix:
- `CapitalProjectStatus`
- `MAProjectStatus`
- `ComplianceProjectStatus`
- `SyndicationStatus` (inconsistent)

**Recommendation:** Rename to `SyndicationProjectStatus` for consistency.

---

### M7. AuditLog has no generic projectId field -- new modules can't be audited

**Affected:** AuditLog model (lines 70-84).

The existing AuditLog has `dealId String?` for linking audit entries to deals. The 4 new modules have no equivalent column. Audit entries for capital/MA/syndication/compliance projects would need to either:
1. Leave `dealId` null (losing the ability to filter by project), or
2. Abuse `dealId` to store a project ID (confusing and breaks referential integrity), or
3. Use the `metadata Json?` field (not indexable, not queryable).

**Recommendation:** Add a polymorphic reference:
```prisma
model AuditLog {
  // ... existing fields ...
  entityType  String?  // "deal", "capital", "ma", "syndication", "compliance", "bio"
  entityId    String?  // The project/deal ID

  @@index([entityType, entityId, createdAt])
}
```

Or add individual nullable FK columns: `capitalProjectId`, `maProjectId`, `syndicationProjectId`, `complianceProjectId`.

---

### M8. SyndicationProject has required non-nullable Decimal fields

**Affected fields:**
- `purchasePrice Decimal @db.Decimal(14, 2)` (line 710) -- required
- `totalEquityRaise Decimal @db.Decimal(14, 2)` (line 715) -- required

All other monetary fields across all 4 modules are nullable (`Decimal?`). These two fields being required means a syndication project cannot be created in a draft state without knowing the purchase price and equity raise amount.

By contrast, `CapitalProject.targetRaise` is nullable, allowing draft creation.

**Recommendation:** Make these fields nullable (`Decimal?`) to allow draft/in-progress project creation, consistent with the pattern used elsewhere.

---

## LOW Issues

### L1. No composite unique constraint on document models for (projectId, docType, version)

**Affected:** CapitalDocument, MADocument, SyndicationDocument, ComplianceDocument.

Nothing prevents two documents with the same `projectId`, `docType`, and `version` from existing. The existing `GeneratedDocument` has the same gap.

**Recommendation:** Add:
```prisma
@@unique([projectId, docType, version])
```

This prevents duplicate document versions and ensures `findUnique` can be used for lookups.

---

### L2. MAProject.governingLaw has a default but is nullable

```prisma
governingLaw String? @default("Delaware")
```

A field with both `?` (nullable) and `@default(...)` means: the default is used when the field is omitted in a create call, but it can still be explicitly set to `null`. This is valid Prisma behavior but potentially confusing -- does `null` mean "no governing law specified" or "not Delaware"?

Similarly, SyndicationProject.stateOfFormation:
```prisma
stateOfFormation String? @default("Delaware")
```

**Recommendation:** Either make these required (remove `?`) with the default, or keep them nullable without a default and handle the "Delaware" default in application code. The current state works but is ambiguous.

---

### L3. No `@db.Text` annotation on long text fields

**Affected fields:**
- CapitalProject.investmentStrategy: has `@db.Text` (correct)
- MAProject: no text fields that need it (names/addresses are short)
- ComplianceProject.callPurpose: has `@db.Text` (correct)

This is fine as-is. Most String fields are short enough for `varchar(255)` or Prisma's default. Just noting that if `errorMessage` fields grow long (e.g., full stack traces), they may need `@db.Text`.

---

### L4. ExemptionType enum is shared between Capital and Syndication -- good, but could diverge

`SyndicationProject.exemptionType` reuses the `ExemptionType` enum defined for Capital. This is correct today (both can use Reg D or Reg A). However, if Syndication needs exemptions that Capital doesn't (e.g., Reg CF for crowdfunding), the shared enum would need to accommodate both.

**Recommendation:** This is fine for now. Monitor and split if divergence is needed.

---

### L5. Organization and User back-references are present and correct

The new relation arrays on Organization (lines 24-27) and User (lines 95-98) correctly reference all 4 new project models. Back-references are properly defined on both sides of each relation. No issues found here.

---

## Relation Integrity Check (Pass/Fail)

| Relation | FK Defined | Back-ref on Parent | onDelete | Result |
|----------|-----------|-------------------|----------|--------|
| CapitalProject -> Organization | orgId -> id | Organization.capitalProjects | (none -- default Restrict) | PASS |
| CapitalProject -> User | userId -> id | User.capitalProjects | (none -- default Restrict) | PASS |
| CapitalDocument -> CapitalProject | projectId -> id | CapitalProject.capitalDocuments | Cascade | PASS |
| MAProject -> Organization | orgId -> id | Organization.maProjects | (none) | PASS |
| MAProject -> User | userId -> id | User.maProjects | (none) | PASS |
| MADocument -> MAProject | projectId -> id | MAProject.maDocuments | Cascade | PASS |
| SyndicationProject -> Organization | orgId -> id | Organization.syndicationProjects | (none) | PASS |
| SyndicationProject -> User | userId -> id | User.syndicationProjects | (none) | PASS |
| SyndicationDocument -> SyndicationProject | projectId -> id | SyndicationProject.syndicationDocuments | Cascade | PASS |
| ComplianceProject -> Organization | orgId -> id | Organization.complianceProjects | (none) | PASS |
| ComplianceProject -> User | userId -> id | User.complianceProjects | (none) | PASS |
| ComplianceDocument -> ComplianceProject | projectId -> id | ComplianceProject.complianceDocuments | Cascade | PASS |

All 12 relations are properly defined with back-references on both sides. No orphaned relations.

---

## Consistency Check vs Existing Models

| Pattern | Existing (Deal/GeneratedDocument) | New Modules | Consistent? |
|---------|----------------------------------|-------------|-------------|
| ID generation | `@id @default(cuid())` | Same | Yes |
| Timestamps | `createdAt` + `updatedAt` | Same | Yes |
| Status as enum (project) | DealStatus enum | 4 separate enums | Yes |
| Status as String (document) | GeneratedDocument.status String | Same pattern | Yes (but both should be enums) |
| Error tracking | errorMessage + errorStep | Same | Yes |
| Document version | `version Int @default(1)` | Same | Yes |
| Document S3 ref | `s3Key String` | Same | Yes |
| Cascade on child docs | Document onDelete: Cascade | Same | Yes |
| FK indexes | None on Deal | None on new models | Yes (both missing) |
| Monetary precision | Decimal(12,2) on Deal | Decimal(14,2) on new | Intentional upgrade |

---

## Priority Action Items

1. **Immediate (before first migration):** Add `@@index` on all FK columns (C1). Create status enums for document models (C2).
2. **Before launch:** Add `createdBy`/`updatedBy` to document models (H5). Fix ComplianceProject.fundType to use enum (H3). Add composite indexes for dashboard queries (H6).
3. **Soon after launch:** Implement soft delete (M2). Extend AuditLog for new modules (M7). Evaluate Decimal vs Float for financial percentages (H2).
4. **Backlog:** Unify project status enums if they stay identical (M1). Add unique constraint on (projectId, docType, version) (L1). Rename SyndicationStatus enum (M6).
