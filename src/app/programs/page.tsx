import { SignInButton } from "@clerk/nextjs";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Landmark,
  Building2,
  TrendingUp,
  Banknote,
  Briefcase,
  RefreshCcw,
  Wrench,
  Timer,
  Bitcoin,
  BookOpen,
  Scale,
  AlertCircle,
  Hash,
  type LucideIcon,
} from "lucide-react";

/* ──────────────────────────────────────────────
   Program Data
   ────────────────────────────────────────────── */

interface Program {
  name: string;
  icon: LucideIcon;
  description: string;
  useCase: string;
  documents: number;
  regulations: string[];
  notable: string[];
}

const PROGRAMS: Program[] = [
  {
    name: "SBA 7(a)",
    icon: Landmark,
    description:
      "The SBA's primary lending program for small businesses. Government-guaranteed loans up to $5M with favorable terms for qualifying borrowers.",
    useCase:
      "Small business acquisition, working capital, equipment, real estate",
    documents: 27,
    regulations: [
      "SBA SOP 50 10",
      "13 CFR 120",
      "13 CFR 121 (size standards)",
      "SBA guaranty fee tiers",
    ],
    notable: [
      "SBA authorization form generated automatically",
      "Guaranty percentage calculated based on loan amount",
      "SBA-specific promissory note with required provisions",
      "Size standard verification per NAICS code",
      "Use of proceeds validated against SBA rules",
    ],
  },
  {
    name: "SBA 504",
    icon: Building2,
    description:
      "Long-term fixed-rate financing for major assets through a Certified Development Company (CDC). Designed for owner-occupied commercial real estate and heavy equipment.",
    useCase: "Owner-occupied commercial real estate, heavy equipment",
    documents: 28,
    regulations: [
      "SBA SOP 50 10",
      "13 CFR 120",
      "CDC/504 debenture requirements",
    ],
    notable: [
      "Dual-lien structure: bank first mortgage + CDC debenture",
      "CDC debenture form with required SBA provisions",
      "10-20 year fixed-rate terms structured automatically",
      "Job creation/retention requirements documented",
      "Public policy goal verification built in",
    ],
  },
  {
    name: "Commercial CRE",
    icon: TrendingUp,
    description:
      "Conventional commercial real estate loans for investment properties and commercial developments. Full environmental and collateral documentation.",
    useCase: "Office, retail, industrial, multifamily investment properties",
    documents: 23,
    regulations: [
      "FIRREA (appraisal requirements)",
      "UCC Article 9",
      "CERCLA (environmental liability)",
      "State usury statutes",
    ],
    notable: [
      "Full environmental indemnity agreement",
      "Assignment of leases and rents",
      "Subordination, non-disturbance, and attornment agreements",
      "Deed of trust with property-specific provisions",
      "Tenant estoppel certificate templates",
    ],
  },
  {
    name: "DSCR",
    icon: TrendingUp,
    description:
      "Investment property loans qualified on property cash flow, not borrower income. The property's net operating income is the underwriting basis.",
    useCase:
      "Rental property investors who qualify on property NOI rather than personal income",
    documents: 18,
    regulations: [
      "TILA / Regulation Z",
      "ATR/QM rule",
      "Dodd-Frank",
      "State usury statutes",
    ],
    notable: [
      "DSCR calculation (NOI / Debt Service) verified automatically",
      "No personal income verification required",
      "Property cash flow analysis with rent roll validation",
      "Vacancy and expense ratio checks against market benchmarks",
      "Prepayment penalty structures per program guidelines",
    ],
  },
  {
    name: "Bank Statement",
    icon: Banknote,
    description:
      "Loans qualified using bank statement deposits instead of traditional income documentation. Purpose-built for self-employed borrowers with complex tax situations.",
    useCase:
      "Self-employed borrowers with complex tax situations",
    documents: 18,
    regulations: [
      "TILA / Regulation Z",
      "ATR/QM rule",
      "Dodd-Frank",
    ],
    notable: [
      "12-24 months of bank statements analyzed automatically",
      "Deposit patterns calculated for qualifying income",
      "Business vs. personal deposit classification",
      "Expense factor applied per self-employment type",
      "Non-sufficient funds and overdraft pattern flagging",
    ],
  },
  {
    name: "Conventional Business",
    icon: Briefcase,
    description:
      "Standard commercial term loans for established businesses. Full financial analysis with traditional underwriting documentation.",
    useCase: "Business expansion, working capital, refinancing",
    documents: 17,
    regulations: [
      "UCC Article 9",
      "State usury statutes",
      "BSA/AML",
    ],
    notable: [
      "Full financial analysis: P&L, balance sheet, cash flow",
      "Personal guaranty with net worth verification",
      "Global cash flow analysis across all borrower entities",
      "Debt schedule with existing obligation verification",
      "Financial covenant package (DSCR, leverage, liquidity)",
    ],
  },
  {
    name: "Line of Credit",
    icon: RefreshCcw,
    description:
      "Revolving credit facility with draw and repayment flexibility. Includes borrowing base monitoring and periodic compliance reporting.",
    useCase: "Working capital, seasonal businesses, cash flow management",
    documents: 18,
    regulations: [
      "UCC Article 9",
      "State usury statutes",
      "BSA/AML",
    ],
    notable: [
      "Borrowing base agreement with eligible collateral definitions",
      "Eligible receivables and inventory advance rates",
      "Periodic reporting requirements and compliance certificates",
      "Draw request and repayment procedures",
      "Annual renewal and re-margining provisions",
    ],
  },
  {
    name: "Equipment Financing",
    icon: Wrench,
    description:
      "Secured financing for equipment purchases with the equipment itself as collateral. UCC-compliant security interests with proper collateral descriptions.",
    useCase:
      "Manufacturing equipment, vehicles, technology, heavy machinery",
    documents: 17,
    regulations: [
      "UCC Article 9 (secured transactions)",
      "UCC 9-108 (collateral descriptions)",
    ],
    notable: [
      "Equipment-specific security agreement with serial numbers",
      "UCC-1 financing statement prepared for filing",
      "Depreciation schedule considerations in underwriting",
      "Vendor/supplier payment instructions and verification",
      "Equipment insurance requirements documented",
    ],
  },
  {
    name: "Bridge",
    icon: Timer,
    description:
      "Short-term financing to bridge gaps between transactions or until permanent financing is secured. Higher rates with structured exit strategies.",
    useCase:
      "Property acquisition before renovation, bridge to sale, bridge to permanent financing",
    documents: 20,
    regulations: [
      "State usury (higher rate thresholds)",
      "UCC Article 9",
      "CERCLA",
    ],
    notable: [
      "Short term (6-24 months) with extension options",
      "Exit strategy requirements documented and verified",
      "Interest reserve holdback calculations",
      "Renovation/construction draw schedules where applicable",
      "Takeout commitment verification for permanent financing",
    ],
  },
  {
    name: "Crypto-Collateralized",
    icon: Bitcoin,
    description:
      "Loans secured by digital asset collateral with custodial arrangements. Full compliance with BSA/AML, FinCEN, and OFAC requirements for digital asset lending.",
    useCase:
      "Borrowers pledging Bitcoin, Ethereum, or other digital assets as collateral",
    documents: 16,
    regulations: [
      "BSA/AML",
      "FinCEN CDD",
      "OFAC sanctions",
      "State money transmitter laws",
    ],
    notable: [
      "Digital asset pledge agreement with wallet addresses",
      "Three-party custody agreement (borrower, lender, custodian)",
      "Margin call provisions with LTV trigger levels",
      "Liquidation triggers and forced sale procedures",
      "Real-time valuation requirements and oracle sources",
    ],
  },
];

/* ──────────────────────────────────────────────
   Document Coverage Matrix
   ────────────────────────────────────────────── */

interface DocCategory {
  label: string;
  icon: LucideIcon;
  description: string;
  programs: string;
}

const DOC_CATEGORIES: DocCategory[] = [
  {
    label: "Core Loan Documents",
    icon: FileText,
    description:
      "Loan Agreement, Promissory Note, Security Agreement, Personal Guaranty",
    programs: "All 10 programs",
  },
  {
    label: "SBA-Specific Forms",
    icon: Landmark,
    description:
      "SBA Authorization, SBA Note, SBA Guaranty Forms, CDC Debenture",
    programs: "SBA 7(a), SBA 504",
  },
  {
    label: "Real Estate Documents",
    icon: Building2,
    description:
      "Deed of Trust, Environmental Indemnity, Assignment of Leases, SNDA",
    programs: "Commercial CRE, DSCR, Bridge",
  },
  {
    label: "Digital Asset Documents",
    icon: Bitcoin,
    description:
      "Digital Asset Pledge, Custody Agreement, Margin Call Notice, Liquidation Agreement",
    programs: "Crypto-Collateralized",
  },
  {
    label: "Revolving Credit Documents",
    icon: RefreshCcw,
    description:
      "Borrowing Base Certificate, Draw Request, Compliance Certificate",
    programs: "Line of Credit",
  },
  {
    label: "Compliance & Regulatory",
    icon: ShieldCheck,
    description:
      "TRID Disclosures, BSA/AML Certification, OFAC Verification, State-Specific Riders",
    programs: "All programs (program-specific checks)",
  },
];

/* ──────────────────────────────────────────────
   Page Component
   ────────────────────────────────────────────── */

export default function ProgramsPage() {
  return (
    <div className="dark flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-[40%] -left-40 h-[500px] w-[500px] rounded-full bg-primary/3 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[20%] right-1/4 h-[400px] w-[400px] rounded-full bg-primary/4 blur-3xl" />

      <MarketingNav />

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-8 animate-fade-up"
              style={{ animationDelay: "0ms" }}
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              10 loan programs supported
            </div>
            <h1
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              10 loan programs.
              <br />
              <span className="text-primary">
                Each with its own regulatory framework.
              </span>
            </h1>
            <p
              className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-3xl mx-auto leading-relaxed animate-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              Every program has program-specific compliance checks, document
              requirements, and regulatory references. From SBA government-guaranteed
              loans to crypto-collateralized lending -- every document cites the
              governing statute.
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
          STATS BAR
      ══════════════════════════════════════════════ */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "10", label: "Loan programs", delay: "100ms" },
              { value: "202", label: "Total documents across all programs", delay: "150ms" },
              { value: "75", suffix: "+", label: "Federal & state regulations", delay: "200ms" },
              { value: "50", suffix: "-state", label: "Compliance coverage", delay: "250ms" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center animate-fade-up"
                style={{ animationDelay: stat.delay }}
              >
                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-muted-foreground">{stat.suffix}</span>
                  )}
                </div>
                <div className="mt-1.5 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PROGRAM CARDS
      ══════════════════════════════════════════════ */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              Every program, built to regulatory spec
            </h2>
            <p
              className="mt-4 text-muted-foreground animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              Each card below is a full loan program with its own document set,
              compliance checks, and regulatory citations.
            </p>
          </div>

          <div className="space-y-6">
            {PROGRAMS.map((program, i) => (
              <div
                key={program.name}
                className="group rounded-xl border bg-card overflow-hidden transition-all duration-200 ease-out hover:border-foreground/15 hover:shadow-lg animate-fade-up"
                style={{ animationDelay: `${100 + i * 75}ms` }}
              >
                {/* Card Header */}
                <div className="border-b border-border/50 bg-muted/20 px-8 py-5 sm:px-10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                        <program.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-card-foreground">
                          {program.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {program.useCase}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-semibold text-primary tabular-nums">
                          {program.documents} documents
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-8 py-6 sm:px-10 sm:py-8">
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                    {program.description}
                  </p>

                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Regulations */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Regulations
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {program.regulations.map((reg) => (
                          <span
                            key={reg}
                            className="inline-flex items-center rounded-md border border-border/60 bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground font-medium"
                          >
                            {reg}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Notable Features */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Notable Features
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {program.notable.map((item) => (
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          DOCUMENT COVERAGE MATRIX
      ══════════════════════════════════════════════ */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl animate-fade-up"
            >
              Document coverage by program
            </h2>
            <p
              className="mt-4 text-muted-foreground animate-fade-up"
              style={{ animationDelay: "50ms" }}
            >
              Every program shares core loan documents. Specialized programs add
              program-specific forms, disclosures, and regulatory filings.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DOC_CATEGORIES.map((cat, i) => (
              <div
                key={cat.label}
                className="rounded-xl border bg-card p-7 animate-fade-up"
                style={{ animationDelay: `${100 + i * 75}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <cat.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-card-foreground">
                    {cat.label}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {cat.description}
                </p>
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {cat.programs}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary row */}
          <div
            className="mt-10 rounded-xl border bg-card p-8 animate-fade-up"
            style={{ animationDelay: "600ms" }}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-card-foreground mb-2">
                  Every document verified against the governing regulation
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  It is not enough to generate documents. Every provision in
                  every document is checked against the actual statute: UCC
                  Article 9 for security interests, TILA/Reg Z for consumer
                  disclosures, CERCLA 9601 for environmental liability, SBA SOP
                  50 10 for government-guaranteed loans, BSA/AML for
                  anti-money-laundering, and 50-state usury statutes for rate
                  compliance. Issues are flagged with the exact regulation and
                  the recommended fix.
                </p>
              </div>
            </div>
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
                Pick your program.
                <br className="hidden sm:block" /> We handle the rest.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                Upload borrower documents, select the loan program, and get a
                complete loan package -- every document verified against the
                regulations that govern your deal.
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
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Up to 28 documents per deal
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Full regulatory verification
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  50-state compliance
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
