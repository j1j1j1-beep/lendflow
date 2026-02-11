import { SignInButton } from "@clerk/nextjs";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import {
  FileSearch,
  ShieldCheck,
  Brain,
  FileStack,
  Scale,
  Landmark,
  BookOpen,
  Lock,
  FileText,
  CheckCircle2,
  Zap,
  Calculator,
  AlertTriangle,
  ArrowRight,
  Upload,
  Download,
  Eye,
  Layers,
  BarChart3,
  Gavel,
} from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="dark flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* Gradient orbs for visual flair */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-primary/3 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/4 blur-3xl" />

      <MarketingNav />

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              Everything your lending team needs.
              <br />
              <span className="text-primary">Nothing it doesn&apos;t.</span>
            </h1>
            <p
              className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-3xl mx-auto leading-relaxed animate-fade-up"
              style={{ animationDelay: "75ms" }}
            >
              Replace weeks of manual data entry, spreadsheet analysis, and
              outside counsel with a single platform that extracts, verifies,
              analyzes, structures, and generates your complete loan
              package, every number recalculated, every document cited to
              the governing statute.
            </p>
            <div
              className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-up"
              style={{ animationDelay: "150ms" }}
            >
              <SignInButton mode="modal">
                <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                  Try It Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          DOCUMENT INTELLIGENCE
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6 animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <FileSearch className="h-3.5 w-3.5" />
              Document Intelligence
            </div>
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              Extract every data point. Verify every number. Automatically.
            </h2>
            <p
              className="mt-4 text-muted-foreground leading-relaxed animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              Borrower files arrive as PDFs, scans, and images. OpenShut
              processes every page through a specialized financial document
              engine to pull structured data, then independently verifies
              every figure against IRS field-level specifications.
            </p>
          </div>

          {/* Extraction capabilities */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
            {[
              {
                icon: Upload,
                title: "Multi-format document ingestion",
                desc: "Tax returns, bank statements, P&Ls, balance sheets, rent rolls, personal financial statements. Any format: PDF, scanned images, digital files. Every upload encrypted with AES-256 and processed automatically.",
                delay: "100ms",
              },
              {
                icon: FileSearch,
                title: "Dual-layer extraction engine",
                desc: "Dual-layer extraction pipeline. The first pass handles document parsing and table detection. A second independent system extracts semantic fields, resolves ambiguity, and maps data to IRS form specifications. Both layers run independently, then results are compared.",
                delay: "150ms",
              },
              {
                icon: Layers,
                title: "Auto-classification",
                desc: "Documents are automatically classified by type: Form 1040, Schedule C, Schedule E, K-1, bank statement, P&L, balance sheet. No manual sorting. Each document is identified and routed to the appropriate extraction pipeline.",
                delay: "200ms",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border bg-card p-7 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 animate-fade-up"
                style={{ animationDelay: item.delay }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-5 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-card-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* IRS field-level detail */}
          <div
            className="rounded-xl border bg-card p-8 sm:p-10 animate-fade-up"
            style={{ animationDelay: "250ms" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">
                IRS field-level extraction and verification
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-3xl">
              Every IRS form is extracted against its published field
              specification. Each line item is mapped to the correct field,
              every subtotal is recalculated, and every cross-reference is
              independently verified.
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  form: "Form 1040",
                  detail:
                    "Line-by-line extraction: wages (line 1a), interest (line 2b), dividends (line 3b), business income (line 8), capital gains (line 7), total income (line 9), AGI (line 11), taxable income (line 15), tax liability (line 24). Every sum independently recalculated.",
                },
                {
                  form: "Schedule C",
                  detail:
                    "Gross receipts (line 1), COGS (line 4), gross profit (line 7), total expenses (line 28), net profit/loss (line 31). Every expense category extracted. Net profit verified against Form 1040 line 8.",
                },
                {
                  form: "Schedule E",
                  detail:
                    "Rental income per property, total rents received (line 3), depreciation (line 18), total expenses (line 20), net rental income (line 21). Aggregated across all properties. Cross-referenced against P&L revenue and bank deposits.",
                },
                {
                  form: "K-1 (1065/1120S)",
                  detail:
                    "Ordinary income (Box 1), net rental income (Box 2), guaranteed payments (Box 4), capital gains (Box 9a). Ownership percentage verified. Pass-through income matched against 1040 Schedule E Part II.",
                },
              ].map((form) => (
                <div
                  key={form.form}
                  className="rounded-lg border border-border/50 bg-muted/30 p-5"
                >
                  <div className="text-sm font-semibold text-foreground mb-2">
                    {form.form}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {form.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Verification layers */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div
              className="rounded-xl border bg-card p-8 animate-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-card-foreground">
                  Mathematical verification
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Every sum, subtotal, and total in the borrower file is
                independently recalculated from its component line items. The
                system does not trust the printed totals on a tax return or
                financial statement. It recomputes them.
              </p>
              <ul className="space-y-3">
                {[
                  "Form 1040 total income recomputed from lines 1 through 8",
                  "Schedule C net profit verified as gross profit minus total expenses",
                  "Balance sheet total assets verified as sum of all asset line items",
                  "P&L net income verified as revenue minus total operating and non-operating expenses",
                  "Bank statement ending balance verified against opening balance plus deposits minus withdrawals",
                ].map((check) => (
                  <li
                    key={check}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-xl border bg-card p-8 animate-fade-up"
              style={{ animationDelay: "350ms" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-card-foreground">
                  Cross-document verification
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Numbers don&apos;t just have to add up internally. They
                have to match across documents. The platform cross-references
                every income figure, every deposit, every revenue line across
                the entire borrower file.
              </p>
              <ul className="space-y-3">
                {[
                  "Gross income on 1040 matched against total bank deposits over 12 months",
                  "Schedule C net profit matched against business bank account net deposits",
                  "Schedule E rental income matched against lease agreements and deposit history",
                  "K-1 ordinary income matched against partnership return and 1040 Schedule E Part II",
                  "P&L revenue matched against bank statement deposits and invoiced amounts",
                ].map((check) => (
                  <li
                    key={check}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Dual-engine comparison */}
          <div
            className="mt-10 rounded-xl border bg-card p-8 animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex items-center gap-3 mb-5">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-card-foreground">
                Dual-engine comparison layer
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              Both extraction engines run independently on every document.
              The platform then compares their outputs field by field.
              Agreements are accepted. Disagreements are flagged with both
              values, the confidence level of each, and the recommended
              resolution. This dual-path architecture catches misreads,
              ambiguous formatting, and extraction errors that either system
              alone would miss.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CREDIT ANALYSIS & DEAL STRUCTURING
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6 animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <Brain className="h-3.5 w-3.5" />
              Credit Analysis &amp; Deal Structuring
            </div>
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              From verified data to structured deal terms. No spreadsheets.
            </h2>
            <p
              className="mt-4 text-muted-foreground leading-relaxed animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              Once every data point is extracted and verified, the platform
              runs a full credit analysis and structures deal terms
              automatically. The rules engine owns every number. Rates, LTV,
              fees, and covenants are set by program-specific rules, not by
              interpretation.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: "DSCR calculation",
                desc: "Debt Service Coverage Ratio computed as Net Operating Income divided by Total Debt Service. NOI pulled from verified P&L or Schedule E. Debt service includes proposed loan payment plus all existing obligations. Minimum thresholds enforced per loan program.",
                delay: "100ms",
              },
              {
                icon: Calculator,
                title: "DTI calculation",
                desc: "Debt-to-Income Ratio computed as Total Monthly Debt Payments divided by Gross Monthly Income. Includes proposed housing expense, all installment and revolving debt, and contingent liabilities. Verified against ATR/QM thresholds where applicable.",
                delay: "150ms",
              },
              {
                icon: BarChart3,
                title: "Cash flow analysis",
                desc: "12-month cash flow reconstruction from bank statements. Average monthly deposits, withdrawals, and ending balances. Revenue trend analysis (growing, declining, or stable). Seasonal variation detection. NSF and overdraft flagging.",
                delay: "200ms",
              },
              {
                icon: Scale,
                title: "Liquidity assessment",
                desc: "Current and quick ratios calculated from verified balance sheet data. Working capital adequacy. Cash reserves relative to proposed loan payment (months of reserves). Assessment of liquid vs. illiquid assets.",
                delay: "250ms",
              },
              {
                icon: CheckCircle2,
                title: "Income verification",
                desc: "Every income source independently verified: W-2 wages against 1040 line 1a, self-employment against Schedule C line 31, rental income against Schedule E, partnership income against K-1 Box 1. Two-year trending with year-over-year variance flagging.",
                delay: "300ms",
              },
              {
                icon: AlertTriangle,
                title: "Risk flags and deal killers",
                desc: "Automatic detection of disqualifying conditions: DSCR below program minimum, DTI exceeding ATR/QM limits, declining revenue trend, negative working capital, tax liens, material litigation, environmental risk indicators, SBA size standard violations.",
                delay: "350ms",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border bg-card p-7 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 animate-fade-up"
                style={{ animationDelay: item.delay }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-5 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-card-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Rules engine callout */}
          <div
            className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-8 sm:p-10 animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <Gavel className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Rules engine owns all numbers
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  The platform generates prose, including credit analysis
                  narrative, risk commentary, and deal recommendations. It
                  never sets rates, LTV caps, fees, or covenants. Every
                  numerical deal term is determined by a deterministic rules
                  engine configured per loan program. Interest rates are set
                  by program-specific rate tables and borrower risk tier. LTV
                  is capped by collateral type and program rules. Fees follow
                  published schedules (SBA guaranty fee tiers, for example).
                  Covenants and conditions are assigned based on deal size,
                  property type, and risk factors. This architecture means
                  deal terms are auditable, consistent, and explainable,
                  never subject to variance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          DOCUMENT GENERATION
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6 animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <FileStack className="h-3.5 w-3.5" />
              Document Generation
            </div>
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              Up to 37 legal documents per deal. Each one verified.
            </h2>
            <p
              className="mt-4 text-muted-foreground leading-relaxed animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              Every loan program generates the documents it requires, no
              more, no less. Each document is either platform-generated (prose
              sections like recitals and covenants) or deterministic (pure
              calculation, no interpretation) and independently verified
              against applicable regulations. View inline, edit in the
              browser, download individually, or grab the entire package as
              a ZIP.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                category: "Core Loan Documents",
                count: "4 documents",
                docs: [
                  "Loan Agreement",
                  "Promissory Note",
                  "Deed of Trust / Mortgage",
                  "Security Agreement",
                ],
                desc: "The foundational instruments of every deal. Payment terms, interest calculation, collateral description, default provisions, and remedies. Each provision cites the governing UCC article or state statute.",
                delay: "100ms",
              },
              {
                category: "SBA-Specific Documents",
                count: "3 documents",
                docs: [
                  "SBA Authorization",
                  "CDC Debenture Note",
                  "SBA Note (Form 147)",
                ],
                desc: "SBA 7(a) and 504 programs require agency-specific forms and authorizations. Generated per SBA SOP 50 10, 13 CFR 120, and current guaranty fee schedules.",
                delay: "150ms",
              },
              {
                category: "Compliance & Disclosure",
                count: "4 documents",
                docs: [
                  "Closing Disclosure (TRID)",
                  "Loan Estimate (TRID)",
                  "Borrower Certification",
                  "Hazard Insurance Disclosure",
                ],
                desc: "TILA/Regulation Z integrated disclosures. APR and finance charge calculations are deterministic, pure math. Timing requirements and tolerance thresholds enforced per TRID rules.",
                delay: "200ms",
              },
              {
                category: "Guaranty & Collateral",
                count: "4 documents",
                docs: [
                  "Personal Guaranty",
                  "Corporate Guaranty",
                  "UCC Financing Statement",
                  "Collateral Assignment",
                ],
                desc: "Unlimited and limited personal guaranties. Corporate resolutions authorizing guaranty. UCC-1 financing statements with collateral descriptions per UCC 9-108 sufficiency standards and debtor names per UCC 9-503.",
                delay: "250ms",
              },
              {
                category: "Environmental & Insurance",
                count: "3 documents",
                docs: [
                  "Environmental Indemnity Agreement",
                  "Insurance Requirements Letter",
                  "Flood Zone Determination",
                ],
                desc: "CERCLA 42 USC 9607 liability allocation. Environmental indemnity provisions per ASTM E1527-21 Phase I ESA standards. Insurance requirements per loan program and collateral type. FEMA flood zone compliance.",
                delay: "300ms",
              },
              {
                category: "Specialty Documents",
                count: "3 documents",
                docs: [
                  "Digital Asset Pledge Agreement",
                  "Custody Agreement",
                  "Borrowing Base Certificate",
                ],
                desc: "Program-specific instruments for crypto-collateralized, asset-based, and line of credit programs. Digital asset custody, LTV monitoring, margin call mechanics, and borrowing base calculations.",
                delay: "350ms",
              },
            ].map((cat) => (
              <div
                key={cat.category}
                className="rounded-xl border bg-card p-7 animate-fade-up"
                style={{ animationDelay: cat.delay }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-card-foreground">
                    {cat.category}
                  </h3>
                  <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                    {cat.count}
                  </span>
                </div>
                <ul className="space-y-2 mb-4">
                  {cat.docs.map((doc) => (
                    <li
                      key={doc}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-4">
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Additional doc categories */}
          <div
            className="mt-10 rounded-xl border bg-card p-8 animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <h3 className="text-base font-semibold text-card-foreground mb-6">
              Additional documents generated per program
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[
                "Title Insurance Commitment",
                "Subordination Agreement",
                "Assignment of Leases & Rents",
                "Estoppel Certificate",
                "Intercreditor Agreement",
                "Compliance Certificate",
                "Officer Certificate",
                "Legal Opinion Letter",
                "Settlement Statement (HUD-1)",
                "Notice of Right to Cancel",
                "Servicing Disclosure",
                "Tax Escrow Agreement",
                "Construction Draw Schedule",
                "Completion Guaranty",
                "Operating Agreement Amendment",
                "Entity Formation Verification",
              ].map((doc) => (
                <div
                  key={doc}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-xs">{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform-generated vs deterministic */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div
              className="rounded-xl border bg-card p-8 animate-fade-up"
              style={{ animationDelay: "450ms" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <Brain className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-card-foreground">
                  Platform-generated documents
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Prose-heavy sections, including recitals, representations,
                covenant narratives, and credit analysis memos, are generated
                by the platform using verified deal data. After generation,
                every document passes through an independent compliance review
                that checks every provision against applicable statutes and
                flags deficiencies with recommended fixes.
              </p>
              <div className="text-xs text-muted-foreground/80 bg-muted/30 rounded-lg p-3">
                Examples: Loan Agreement recitals, Credit Memo narrative,
                Environmental Indemnity provisions, Guaranty representations
              </div>
            </div>

            <div
              className="rounded-xl border bg-card p-8 animate-fade-up"
              style={{ animationDelay: "500ms" }}
            >
              <div className="flex items-center gap-3 mb-5">
                <Calculator className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold text-card-foreground">
                  Deterministic documents (pure calculation)
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Financial calculations, payment schedules, disclosure
                figures, and regulatory thresholds are built from templates
                using verified data and deterministic calculation. Every APR,
                finance charge, payment amount, and fee is computed directly.
                Then verified independently.
              </p>
              <div className="text-xs text-muted-foreground/80 bg-muted/30 rounded-lg p-3">
                Examples: Closing Disclosure APR, Loan Estimate figures,
                amortization schedules, SBA guaranty fee calculations
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          COMPLIANCE & LEGAL REVIEW
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6 animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <Gavel className="h-3.5 w-3.5" />
              Compliance &amp; Legal Review
            </div>
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              Every document reviewed against the law that governs it.
            </h2>
            <p
              className="mt-4 text-muted-foreground leading-relaxed animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              After generation, every document undergoes an independent
              compliance review. The system checks every provision against
              the specific federal and state statutes that apply to the loan
              program, document type, property state, and deal structure.
              Deficiencies are flagged with the exact regulation and a
              recommended fix.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Scale,
                title: "50-state usury compliance",
                desc: "Interest rates and fees verified against the usury statute of the property state and, where applicable, the borrower state. Maximum rate, fee caps, and permitted exceptions checked per state law. Violations flagged before closing.",
                delay: "100ms",
              },
              {
                icon: Landmark,
                title: "Program-specific regulation",
                desc: "SBA SOP 50 10 for 7(a) and 504 programs. TILA/Regulation Z for consumer-purpose loans. TRID integrated disclosure requirements. ATR/QM ability-to-repay rules. Each program has its own regulatory checklist.",
                delay: "150ms",
              },
              {
                icon: ShieldCheck,
                title: "BSA/AML and OFAC",
                desc: "Bank Secrecy Act anti-money laundering compliance. OFAC sanctions screening requirements. USA PATRIOT Act Customer Identification Program provisions. FinCEN Customer Due Diligence Rule compliance. Suspicious activity monitoring requirements.",
                delay: "200ms",
              },
              {
                icon: FileText,
                title: "Legal checklist per document",
                desc: "Every document type has a regulatory checklist. A Promissory Note is checked against UCC Article 3 and state usury law. A UCC-1 is checked against UCC 9-108 and 9-503. An Environmental Indemnity is checked against CERCLA 9607. Nothing is generic.",
                delay: "250ms",
              },
              {
                icon: AlertTriangle,
                title: "Deficiency detection and resolution",
                desc: "When a compliance check fails, the system identifies the exact deficiency, cites the governing statute, explains why it fails, and provides a specific recommended fix. Deficiencies are categorized by severity: critical (blocks closing), material (requires correction), and advisory (best practice).",
                delay: "300ms",
              },
              {
                icon: Eye,
                title: "Full audit trail",
                desc: "Every action in the system is logged: document upload, extraction result, verification outcome, compliance check result, document generation, edit, download, and user action. Complete chain of custody for every data point from upload to final document.",
                delay: "350ms",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border bg-card p-7 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-foreground/15 animate-fade-up"
                style={{ animationDelay: item.delay }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-5 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-card-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Three-stage pipeline */}
          <div
            className="mt-10 rounded-xl border bg-card p-8 sm:p-10 animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <h3 className="text-lg font-semibold text-card-foreground mb-6">
              Three-stage document pipeline
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Generate",
                  desc: "The platform generates prose. Rules engine sets numbers. Template builds the document structure. Every field populated from verified deal data.",
                },
                {
                  step: "2",
                  title: "Review",
                  desc: "Independent compliance review checks every provision against applicable statutes. Deficiencies flagged with citation, explanation, and recommended fix.",
                },
                {
                  step: "3",
                  title: "Verify",
                  desc: "Deterministic verification confirms all numerical values, cross-references, and regulatory thresholds. Document is either cleared or returned with specific issues.",
                },
              ].map((stage) => (
                <div key={stage.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {stage.step}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    {stage.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          REGULATORY FRAMEWORK
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6 animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Regulatory Framework
            </div>
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              Built on the regulations that govern your deals
            </h2>
            <p
              className="mt-4 text-muted-foreground animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              Every document is verified against the actual federal and state
              statutes that apply to your loan program. Not summaries. Not
              interpretations. The law itself.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Landmark,
                category: "Federal Lending",
                items: [
                  "TILA / Regulation Z (Truth in Lending)",
                  "RESPA / Regulation X (Real Estate Settlement)",
                  "ECOA / Regulation B (Equal Credit Opportunity)",
                  "Dodd-Frank ATR/QM Rule",
                  "TRID Integrated Disclosures",
                  "HMDA / Regulation C (Home Mortgage Disclosure)",
                ],
                delay: "150ms",
              },
              {
                icon: BookOpen,
                category: "SBA Programs",
                items: [
                  "SBA SOP 50 10 (Standard Operating Procedure)",
                  "13 CFR 120 (Business Loan Programs)",
                  "13 CFR 121 (Small Business Size Standards)",
                  "SBA Guaranty Fee Tiers (by loan amount)",
                  "SBA Use of Proceeds Rules",
                  "CDC/504 Debenture Requirements",
                ],
                delay: "200ms",
              },
              {
                icon: Scale,
                category: "Commercial & Secured Lending",
                items: [
                  "UCC Article 9 (Secured Transactions)",
                  "CERCLA 42 USC 9601 (Environmental Liability)",
                  "FIRREA (Appraisal Requirements)",
                  "Flood Disaster Protection Act",
                  "50-State Usury Statutes",
                  "State Licensing Requirements",
                ],
                delay: "250ms",
              },
              {
                icon: ShieldCheck,
                category: "Compliance & Anti-Fraud",
                items: [
                  "BSA / Anti-Money Laundering (AML)",
                  "OFAC Sanctions Screening",
                  "USA PATRIOT Act (CIP Requirements)",
                  "GLBA Privacy Requirements",
                  "FinCEN Customer Due Diligence Rule",
                  "HPML Thresholds (Dodd-Frank 1026.35)",
                ],
                delay: "300ms",
              },
              {
                icon: FileText,
                category: "Document Standards",
                items: [
                  "UCC 9-108 (Collateral Description Sufficiency)",
                  "UCC 9-503 (Debtor Name Requirements)",
                  "CERCLA 9607 (Liability Standards)",
                  "ASTM E1527-21 (Phase I ESA Standard)",
                  "ABA Legal Opinion Standards",
                  "IRS Form Specifications (1040, C, E, K-1)",
                ],
                delay: "350ms",
              },
              {
                icon: Lock,
                category: "Security & Data",
                items: [
                  "AES-256 encryption on every upload",
                  "TLS encryption in transit",
                  "Full audit trail on all actions",
                  "Secure document access with expiring links",
                  "Org-level tenant isolation",
                  "Borrower data never stored in plaintext",
                ],
                delay: "400ms",
              },
            ].map((group) => (
              <div
                key={group.category}
                className="rounded-xl border bg-card p-7 animate-fade-up"
                style={{ animationDelay: group.delay }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <group.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-card-foreground">
                    {group.category}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          BOTTOM CTA
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div
            className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden animate-fade-up"
          >
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                See it work on a real deal.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                Upload a borrower file or run the built-in sample deal. Full
                extraction, verification, credit analysis, and document
                generation. One free deal, no credit card required.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <SignInButton mode="modal">
                  <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 ease-out hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
                    Try It Free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Every upload encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Full audit trail
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Verified against federal and state regulations
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
