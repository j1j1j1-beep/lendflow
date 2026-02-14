import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Landmark, FileText, Calculator, ShieldCheck, MapPin } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const PROGRAMS = [
  {
    name: "SBA 7(a)",
    amount: "Up to $5M",
    details: "4-tier rate caps per SBA SOP 50 10 8. Guaranty fees from 0% to 3.75% based on loan size and maturity. Up to 27 documents per deal including all required SBA forms.",
  },
  {
    name: "SBA 504",
    amount: "Up to $5M / $5.5M",
    details: "Two-part structure: conventional bank loan plus a fixed-rate CDC debenture. $5.5M cap for energy and manufacturing. Real estate and heavy equipment only.",
  },
  {
    name: "Commercial CRE",
    amount: "No cap",
    details: "Office, retail, industrial, mixed-use. 75% max LTV, 1.25x minimum DSCR. Purchase, refinance, or cash-out. Rates priced off the property cash flow and borrower credit.",
  },
  {
    name: "DSCR",
    amount: "Varies",
    details: "Qualified on property income, not personal tax returns. Tiers at 1.0x, 1.15x, and 1.25x with different LTV and rate treatment at each level. Popular for investors with complex returns.",
  },
  {
    name: "Bank Statement",
    amount: "Varies",
    details: "12 or 24 months of bank deposits replace tax return requirements. The system calculates average monthly deposits and applies the expense factor for the borrower's industry.",
  },
  {
    name: "Conventional",
    amount: "No cap",
    details: "Full financial underwriting with tax returns, P&L, and balance sheet. Term loans, working capital, or acquisition financing. Standard 5/1 and 7/1 ARM structures.",
  },
  {
    name: "Line of Credit",
    amount: "Varies",
    details: "Revolving facility against a borrowing base. Typically 80% of eligible accounts receivable and 50% of eligible inventory. Monthly borrowing base certificate required.",
  },
  {
    name: "Equipment Finance",
    amount: "Up to equipment value",
    details: "The equipment itself serves as collateral. 3 to 7 year terms matched to the asset's useful life. UCC filing on the specific equipment. Self-liquidating structure.",
  },
  {
    name: "Bridge",
    amount: "Varies",
    details: "6 to 24 months of interest-only payments while permanent financing closes. Higher rates offset by short duration. Exit strategy documented in the commitment letter.",
  },
  {
    name: "Multifamily",
    amount: "No cap",
    details: "5-unit minimum through large apartment complexes. Assignment of leases and rents. Rent roll analysis with unit-level detail. DSCR calculated from net operating income.",
  },
  {
    name: "Mezzanine",
    amount: "Varies",
    details: "Sits behind senior debt in the capital stack. Secured by equity pledge, not real property. Intercreditor agreement governs payment priority and cure rights with the senior lender.",
  },
  {
    name: "Construction",
    amount: "Varies",
    details: "Ground-up or gut rehab. Draw schedule tied to completion milestones with inspection requirements at each draw. Interest reserve built into the loan. Converts to permanent on completion.",
  },
  {
    name: "Hard Money",
    amount: "Varies",
    details: "Asset-based underwriting, 6 to 36 month terms. Fix-and-flip, land acquisition, time-sensitive closings. LTV based on as-is or after-repair value depending on the deal.",
  },
  {
    name: "Crypto-Collateralized",
    amount: "Varies",
    details: "Bitcoin, Ethereum, and other digital assets held in qualified custody. Margin call triggers at defined LTV thresholds. Automatic liquidation if the borrower doesn't post additional collateral.",
  },
];

const CORE_DOCS = [
  { name: "Promissory Note", desc: "Borrower's binding repayment obligation with rate, term, and payment schedule" },
  { name: "Loan Agreement", desc: "Complete lending terms: rate, covenants, reporting requirements, events of default, and remedies" },
  { name: "Security Agreement", desc: "Lender's claim on business assets, inventory, receivables, or equipment as collateral" },
  { name: "Guaranty Agreement", desc: "Personal or third-party guarantee with unlimited or capped liability" },
  { name: "Commitment Letter", desc: "Formal offer from the lender with all material terms, conditions precedent, and expiration" },
  { name: "Deed of Trust", desc: "Real property lien recorded in the county where the property sits" },
  { name: "Assignment of Leases & Rents", desc: "Lender collects rent directly if the borrower defaults" },
  { name: "SNDA", desc: "Subordination, non-disturbance, and attornment. Protects tenants and lender in foreclosure" },
  { name: "Subordination Agreement", desc: "Establishes payment priority between multiple lenders on the same collateral" },
  { name: "Tenant Estoppel Certificate", desc: "Tenant confirms lease terms, rent amount, and any landlord defaults" },
  { name: "Intercreditor Agreement", desc: "Senior/junior lender payment order, cure rights, and standstill provisions" },
  { name: "Environmental Indemnity", desc: "Borrower assumes responsibility for environmental cleanup costs" },
  { name: "Borrowing Base Agreement", desc: "Formula controlling how much the borrower can draw on a revolving facility" },
  { name: "UCC Financing Statement", desc: "Public notice of the lender's security interest filed with the Secretary of State" },
  { name: "Loan Estimate", desc: "Borrower's first look at estimated rates, fees, and closing costs" },
  { name: "Closing Disclosure", desc: "Final locked-in numbers delivered before closing" },
  { name: "Amortization Schedule", desc: "Month-by-month principal, interest, and remaining balance for the full loan term" },
  { name: "Settlement Statement", desc: "Every charge at closing itemized line by line" },
];

const SBA_DOCS = [
  { name: "SBA Form 1919", desc: "Borrower information" },
  { name: "SBA Form 159", desc: "Fee disclosure and compensation" },
  { name: "SBA Form 148", desc: "Unconditional guarantee" },
  { name: "SBA Form 1050", desc: "Settlement sheet" },
  { name: "SBA Authorization", desc: "Loan authorization and agreement" },
  { name: "CDC Debenture", desc: "504 program debenture note" },
  { name: "IRS Form 4506-C", desc: "Tax transcript request" },
  { name: "IRS Form W-9", desc: "Taxpayer identification" },
];

const OTHER_DOCS = [
  "Flood Determination", "Borrower's Certificate", "Compliance Certificate",
  "Legal Opinion Letter", "Corporate Borrowing Resolution", "Privacy Notice (GLBA)",
  "USA PATRIOT Act Notice", "Commercial Financing Disclosure",
  "Disbursement Authorization", "Digital Asset Pledge Agreement",
];

const ANALYSIS_ITEMS = [
  {
    title: "Income and cash flow",
    items: [
      "Gross and net income from tax returns, P&L, or bank statements",
      "Monthly and annual cash flow with seasonal adjustments",
      "Debt service coverage ratio calculated from actual NOI",
      "Debt-to-income ratio across all borrower obligations",
      "Global cash flow analysis for multi-entity borrowers",
    ],
  },
  {
    title: "Collateral and risk",
    items: [
      "Loan-to-value against appraised or as-is value",
      "Collateral coverage ratio across all pledged assets",
      "Liquidity analysis: cash reserves relative to debt service",
      "49 risk flags checked per deal (fraud patterns, concentration, tenant quality)",
      "Borrowing base calculations for revolving facilities",
    ],
  },
  {
    title: "Program eligibility",
    items: [
      "SBA size standards by NAICS code",
      "Owner-occupancy requirements (51% for SBA 7(a), 60% for 504)",
      "Use of proceeds restrictions per program",
      "Rate cap compliance for government-backed programs",
      "Guaranty fee calculations based on loan size and maturity",
    ],
  },
];

export default function LendingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-light bg-noise">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32 relative z-10">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-sm text-muted-foreground mb-6">
                <Landmark className="h-3.5 w-3.5" />
                Lending
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                Up to 27 documents
                <br />
                <span className="text-muted-foreground">
                  in a single generation.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                Pick the program, upload the borrower&apos;s financials, and get
                the full loan package back. 36 document types across 14 loan
                programs, with rates and fees calculated from the actual program
                requirements for your state.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <SignInButton mode="modal">
                  <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                    Start a Deal Free
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </SignInButton>
                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-foreground/15"
                >
                  See Pricing
                </Link>
              </div>
              <p className="mt-5 text-sm text-muted-foreground/70">
                First deal free across all 14 programs.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="grid grid-cols-3 gap-8 text-center">
              <FadeIn delay={0}>
                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">36</div>
                <div className="mt-1.5 text-sm text-muted-foreground">document types</div>
              </FadeIn>
              <FadeIn delay={0.05}>
                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">14</div>
                <div className="mt-1.5 text-sm text-muted-foreground">loan programs</div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">50</div>
                <div className="mt-1.5 text-sm text-muted-foreground">states covered</div>
              </FadeIn>
            </div>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* 14 Loan Programs */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                14 loan programs built in
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Each program has its own document set, rate calculations,
                eligibility rules, and compliance requirements. You pick the
                program, the system handles everything else.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.03} initialDelay={0.1}>
            {PROGRAMS.map((program) => (
              <StaggerItem key={program.name}>
                <div className="rounded-xl bg-card p-5 sm:p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-card-foreground">{program.name}</h3>
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">{program.amount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{program.details}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Documents */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20 bg-dot-pattern">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  36 document types
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  The system pulls the right documents for your program, deal
                  structure, and state. An SBA 7(a) deal can generate up to 27
                  documents. A simple bridge loan might generate 8.
                </p>
              </div>
            </FadeIn>

            {/* Core docs */}
            <FadeIn delay={0.05}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Core loan documents</h3>
            </FadeIn>
            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" staggerDelay={0.02} initialDelay={0.1}>
              {CORE_DOCS.map((doc) => (
                <StaggerItem key={doc.name}>
                  <div className="rounded-lg bg-card px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 card-shine h-full">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-foreground/40 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-card-foreground">{doc.name}</span>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{doc.desc}</p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            {/* SBA docs */}
            <FadeIn delay={0.15}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 mt-12">SBA-specific forms</h3>
            </FadeIn>
            <Stagger className="grid grid-cols-2 sm:grid-cols-4 gap-3" staggerDelay={0.02} initialDelay={0.15}>
              {SBA_DOCS.map((doc) => (
                <StaggerItem key={doc.name}>
                  <div className="rounded-lg bg-card px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 card-shine h-full">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-foreground/40 shrink-0" />
                      <span className="text-xs font-medium text-card-foreground">{doc.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{doc.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            {/* Other docs */}
            <FadeIn delay={0.2}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 mt-12">Additional documents</h3>
              <div className="flex flex-wrap gap-2">
                {OTHER_DOCS.map((doc) => (
                  <span key={doc} className="inline-flex items-center rounded-md bg-muted border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {doc}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Financial Analysis */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Financial analysis built into every deal
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Upload the borrower&apos;s financials and the system extracts
                the numbers, calculates the ratios, and checks program
                eligibility before generating documents. Every figure in the
                output is calculated, not estimated.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {ANALYSIS_ITEMS.map((col) => (
              <StaggerItem key={col.title}>
                <div className="rounded-xl bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="h-4 w-4 text-foreground/50" />
                    <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {col.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                        <span className="text-xs text-muted-foreground leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Compliance */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                  Compliance checks on every document
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-10">
                  After documents are generated, they run through regulatory
                  checks for your specific deal, program, and state. Anything
                  out of compliance gets flagged before you download.
                </p>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {[
                    {
                      title: "Federal requirements",
                      icon: ShieldCheck,
                      items: [
                        "OFAC Consolidated Sanctions List: SDN, SSI, FSE",
                        "BSA/AML identification and record-keeping",
                        "USA PATRIOT Act customer identification",
                        "TRID disclosure timing and tolerances",
                        "National Flood Insurance Act checks",
                        "SBA SOP rate caps, size standards, and guaranty fees",
                      ],
                    },
                    {
                      title: "State regulations",
                      icon: MapPin,
                      items: [
                        "Usury limits (TX 28%, GA 60%, CA Art XV exemptions)",
                        "Commercial financing disclosure in 11 states",
                        "Community property rules in 9 states",
                        "State-specific mortgage and deed of trust requirements",
                        "Recording and filing requirements by county",
                        "UCC filing requirements by state",
                      ],
                    },
                    {
                      title: "Number verification",
                      icon: Calculator,
                      items: [
                        "Every rate, fee, and payment independently calculated",
                        "Figures checked against program maximums",
                        "Amortization schedules verified to the penny",
                        "Guaranty fees matched to SBA fee tiers",
                        "Closing costs cross-referenced with loan estimate",
                        "DSCR and LTV validated against program floors",
                      ],
                    },
                  ].map((col) => (
                    <div key={col.title} className="rounded-xl bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 card-shine">
                      <div className="flex items-center gap-2 mb-4">
                        <col.icon className="h-4 w-4 text-foreground/50" />
                        <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
                      </div>
                      <ul className="space-y-2.5">
                        {col.items.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                            <span className="text-xs text-muted-foreground leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* How It Works */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-3" staggerDelay={0.08} initialDelay={0.1}>
            {[
              { n: "01", title: "Pick the program and upload", desc: "Choose one of 14 loan programs, enter the deal terms, and upload the borrower's financials. Tax returns, bank statements, rent rolls, or whatever the program requires." },
              { n: "02", title: "Get the full loan package", desc: "Every document your deal requires is generated together. Rates, fees, and payments are calculated from the program rules. Legal language is written around those numbers." },
              { n: "03", title: "Review, edit, and close", desc: "Read everything in the editor. Make changes inline. Download as Word or PDF and hand it to your attorney. They review a complete first draft instead of starting from scratch." },
            ].map((step) => (
              <StaggerItem key={step.n}>
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground text-sm font-bold font-mono inset-shine">
                    {step.n}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="relative rounded-2xl bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 card-shine hero-light bg-noise">
                <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Run a real deal through it.
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                    Pick any of the 14 loan programs. Upload real borrower
                    financials. Your first deal is free.
                  </p>
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <SignInButton mode="modal">
                      <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                        Start a Deal Free
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </button>
                    </SignInButton>
                    <Link
                      href="/pricing"
                      className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-foreground/15"
                    >
                      See Pricing
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
