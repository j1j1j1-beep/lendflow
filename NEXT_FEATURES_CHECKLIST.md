# Next Features Checklist

## Feature 1: AI Document Assistant (Chat with your docs)
**Priority:** HIGH — cross-module, highest "wow" factor
**Scope:** Chat panel on every project detail page. After docs are generated, users can ask questions about their documents.

### What it does:
- "What's the preferred return in the PPM?"
- "Summarize the indemnification clause"
- "What compliance issues should I worry about?"
- Context-aware: knows which project, has access to all generated docs + source doc OCR text

### Implementation notes:
- Chat sidebar/panel on each project detail page (all 5 modules)
- Uses Grok (already in src/lib/claude.ts) with generated doc content as context
- Persistent chat history per project (new Prisma model: ProjectChat / ChatMessage)
- Stream responses for good UX
- Context: project data + generated doc content (from S3 or cached) + source doc OCR text

---

## Feature 2: Contacts Directory (per-module directories with cross-module switcher)
**Priority:** HIGH — solves real pain point
**Scope:** Each module gets its own contacts directory tailored to its contact type. Users with multiple products can toggle between directories or view all at once.

### Directories per module:
- **Lending** → Borrowers Directory (borrower name, loan history, contact info, credit profile)
- **Capital** → Investors Directory (investor name, type, accreditation status, commitments, preferences)
- **Syndication** → Investors Directory (same investor fields, but syndication-specific: property investments, ownership %)
- **Deals/MA** → Buyers & Sellers Directory (company name, role, deal history, counsel, entity info)
- **Compliance** → LPs Directory (LP name, capital account, K-1 history, distribution history, contact info)

### What it does:
- Each module has its own directory with fields tailored to that contact type
- Store contact info once per module — auto-populates when adding to projects
- Track total activity across all projects within that module
- Flag stale data (e.g. accreditation expiry for investors, outdated borrower info)
- **Multi-product switcher:** If user has multiple modules, top-level toggle to show one directory, two, or all at once
- **Single-product users:** Just show their one directory, no switcher, no clutter

### Implementation notes:
- New Prisma models: one per module (Borrower, Investor, BuyerSeller, LPContact) — all org-level
- Each module's existing project-level contacts (capitalInvestors, syndicationInvestors, etc.) get optional FK to directory entry
- New page: /dashboard/contacts — with module tab switcher (only shows tabs for modules user has)
- New API: /api/contacts/{module} (CRUD + search)
- Autocomplete component for contact selection in project forms
- Switcher state persisted in localStorage
- NOTE: Premium feature opportunity — charge per-directory or bundle with multi-module plans

---

## Feature 3: Universal Dashboard
**Priority:** MEDIUM — helpful but most users are in 1 module
**Scope:** Home dashboard showing all active projects + deadlines + AI insights.

### What it does:
- Single view of all active projects across whichever modules user has
- Deadline tracker (Form D filing dates, K-1 deadlines, closing dates, call due dates)
- AI-generated alerts ("Oak Street PPM has 3 compliance flags")
- Quick stats: deals in pipeline, compliance pass rate, docs generated this month

### Implementation notes:
- Replace or enhance current /dashboard page
- Query all project types for the user's org
- Extract deadline fields from each project type
- Simple AI summary call on load (cached, not real-time)
- NOTE: Even for single-module users, this replaces the current bare module list page with something useful

---

## Implementation Order
1. **Investor Directory** — standalone value, simpler to implement
2. **AI Document Assistant** — high wow factor, needs streaming + chat UI
3. **Universal Dashboard** — nice-to-have, build last
