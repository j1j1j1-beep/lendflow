import type { Metadata } from "next";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Landmark, FileText, Calculator, ShieldCheck, MapPin, ChevronDown, AlertTriangle } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata: Metadata = {
  title: "Lending Deal Tools & Loan Document Automation",
  description:
    "Legal automation for lending. Generate loan packages, deal terms, and closing docs across 14 programs: SBA 7(a), SBA 504, CRE, DSCR, bridge, and more. 36 document types. 50-state compliance.",
  keywords: ["loan document automation", "lending deal tools", "SBA loan documents", "loan package generator", "CRE loan documents", "DSCR loan automation", "deal terms lending"],
  alternates: { canonical: "https://openshut.me/lending" },
  openGraph: {
    title: "Lending Deal Tools & Loan Document Automation | OpenShut",
    description: "Generate loan packages and deal terms across 14 programs. 36 document types ready in minutes.",
    url: "https://openshut.me/lending",
  },
};
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const PROGRAMS = [
  {
    name: "SBA 7(a)",
    amount: "Up to $5M",
    details: "4-tier rate caps per SBA SOP 50 10 8. Guaranty fees from 0% to 3.75% based on loan size and maturity. Up to 27 documents per deal including all required SBA forms. 85%/75%/50% guaranty by program type.",
  },
  {
    name: "SBA 504",
    amount: "Up to $5M / $5.5M",
    details: "Two-part structure: conventional bank loan plus a fixed-rate CDC debenture. $5.5M cap for energy and manufacturing. Real estate and heavy equipment only. Separate document sets for each tranche.",
  },
  {
    name: "Commercial CRE",
    amount: "No cap",
    details: "Office, retail, industrial, mixed-use. 75% max LTV, 1.25x minimum DSCR. Purchase, refinance, or cash-out. Rates priced off the property cash flow and borrower credit.",
  },
  {
    name: "DSCR",
    amount: "Varies",
    details: "Qualified on property income, not personal tax returns. Tiers at 1.0x, 1.15x, and 1.25x with different LTV and rate treatment at each level.",
  },
  {
    name: "Bank Statement",
    amount: "Varies",
    details: "12 or 24 months of bank deposits replace tax return requirements. Average monthly deposits calculated with industry expense factor applied.",
  },
  {
    name: "Conventional",
    amount: "No cap",
    details: "Full financial underwriting with tax returns, P&L, and balance sheet. Term loans, working capital, or acquisition financing. Standard 5/1 and 7/1 ARM structures.",
  },
  {
    name: "Line of Credit",
    amount: "Varies",
    details: "Revolving facility against a borrowing base. Typically 80% of eligible AR and 50% of eligible inventory. Monthly borrowing base certificate required.",
  },
  {
    name: "Equipment Finance",
    amount: "Equipment value",
    details: "The equipment itself serves as collateral. 3 to 7 year terms matched to the asset's useful life. UCC filing on the specific equipment.",
  },
  {
    name: "Bridge",
    amount: "Varies",
    details: "6 to 24 months of interest-only payments while permanent financing closes. Exit strategy documented in the commitment letter.",
  },
  {
    name: "Multifamily",
    amount: "No cap",
    details: "5-unit minimum through large apartment complexes. Assignment of leases and rents. Rent roll analysis with unit-level detail. DSCR from NOI.",
  },
  {
    name: "Mezzanine",
    amount: "Varies",
    details: "Behind senior debt in the capital stack. Secured by equity pledge, not real property. Intercreditor agreement governs payment priority with the senior lender.",
  },
  {
    name: "Construction",
    amount: "Varies",
    details: "Ground-up or gut rehab. Draw schedule tied to completion milestones with inspection requirements. Interest reserve built in. Converts to permanent on completion.",
  },
  {
    name: "Hard Money",
    amount: "Varies",
    details: "Asset-based underwriting, 6 to 36 month terms. Fix-and-flip, land, time-sensitive closings. LTV based on as-is or after-repair value.",
  },
  {
    name: "Crypto-Collateralized",
    amount: "Varies",
    details: "Bitcoin, Ethereum, and other digital assets in qualified custody. Margin call triggers at defined LTV thresholds. Automatic liquidation provisions.",
  },
];

const CORE_DOCS = [
  { name: "Promissory Note", desc: "Binding repayment obligation with rate, term, and payment schedule" },
  { name: "Loan Agreement", desc: "Complete terms: rate, covenants, reporting, events of default, remedies" },
  { name: "Security Agreement", desc: "Lender's claim on business assets, inventory, receivables, or equipment" },
  { name: "Guaranty Agreement", desc: "Personal or third-party guarantee with unlimited or capped liability" },
  { name: "Commitment Letter", desc: "Formal offer with all material terms, conditions, and expiration" },
  { name: "Deed of Trust", desc: "Real property lien recorded in the county where the property sits" },
  { name: "Assignment of Leases & Rents", desc: "Lender collects rent directly on borrower default" },
  { name: "SNDA", desc: "Subordination, non-disturbance, attornment. Protects tenants and lender" },
  { name: "Subordination Agreement", desc: "Payment priority between multiple lenders on the same collateral" },
  { name: "Tenant Estoppel Certificate", desc: "Tenant confirms lease terms, rent, and any landlord defaults" },
  { name: "Intercreditor Agreement", desc: "Senior/junior payment order, cure rights, standstill provisions" },
  { name: "Environmental Indemnity", desc: "Borrower assumes responsibility for environmental cleanup" },
  { name: "Borrowing Base Agreement", desc: "Formula controlling draw availability on revolving facilities" },
  { name: "UCC Financing Statement", desc: "Public notice of security interest filed with Secretary of State" },
  { name: "Loan Estimate", desc: "Borrower's first look at estimated rates, fees, and closing costs" },
  { name: "Closing Disclosure", desc: "Final locked-in numbers delivered before closing" },
  { name: "Amortization Schedule", desc: "Month-by-month principal, interest, and balance for the full term" },
  { name: "Settlement Statement", desc: "Every charge at closing, itemized line by line" },
];

const SBA_DOCS = [
  { name: "SBA Form 1919", desc: "Borrower information" },
  { name: "SBA Form 159", desc: "Fee disclosure" },
  { name: "SBA Form 148", desc: "Unconditional guarantee" },
  { name: "SBA Form 1050", desc: "Settlement sheet" },
  { name: "SBA Authorization", desc: "Loan authorization" },
  { name: "CDC Debenture", desc: "504 debenture note" },
  { name: "IRS Form 4506-C", desc: "Tax transcript request" },
  { name: "IRS Form W-9", desc: "Taxpayer ID" },
];

const OTHER_DOCS = [
  "Flood Determination", "Borrower's Certificate", "Compliance Certificate",
  "Legal Opinion Letter", "Corporate Borrowing Resolution", "Privacy Notice (GLBA)",
  "USA PATRIOT Act Notice", "Commercial Financing Disclosure",
  "Disbursement Authorization", "Digital Asset Pledge Agreement",
];

export default function LendingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background bg-ambient relative overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-light bg-noise">
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32 relative z-10">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-sm text-muted-foreground mb-6">
                <Landmark className="h-3.5 w-3.5" />
                Lending
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                Complete loan packages.
                <br />
                <span className="text-muted-foreground">
                  Every number verified.
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
                    See a Sample Deal
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
                Free demo in any of the 14 programs. No credit card required.
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

      {/* Risk / Why This Matters */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="rounded-2xl bg-card p-8 sm:p-12 card-shine metallic-sheen">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted inset-shine">
                  <AlertTriangle className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Manual loan packages are where mistakes happen
                  </h2>
                  <p className="mt-3 text-muted-foreground leading-relaxed max-w-3xl">
                    A loan officer quotes Prime + 3.5% on an SBA 7(a) over $350K when the SOP cap is Prime + 3%. A paralegal copies last quarter&apos;s rate into a new commitment letter. Someone rounds a guaranty fee down and the SBA flags it in review. The closing disclosure doesn&apos;t match the loan estimate and you blow the TRID tolerance.
                  </p>
                  <p className="mt-3 text-muted-foreground leading-relaxed max-w-3xl">
                    These aren&apos;t edge cases. They happen on deals every week. OpenShut calculates every rate, fee, and payment to the exact specification of the loan program, then checks the output against federal and state regulations before you see it. The numbers are right because they&apos;re calculated, not typed.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* 14 Loan Programs - Collapsible */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  14 loan programs
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Each program has its own document set, rate calculations,
                  eligibility rules, and compliance requirements. Expand any
                  program to see what it covers.
                </p>
              </div>
            </FadeIn>

            <div className="space-y-2">
              {PROGRAMS.map((program) => (
                <details key={program.name} className="group rounded-xl bg-card transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen">
                  <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-4">
                      <h3 className="text-sm font-semibold text-card-foreground">{program.name}</h3>
                      <span className="text-xs font-medium text-muted-foreground tabular-nums bg-muted px-2 py-0.5 rounded">{program.amount}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0" />
                  </summary>
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                    <div className="border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">{program.details}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Documents - Grouped with tabs feel */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                36 document types
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                An SBA 7(a) deal can generate up to 27 documents. A simple
                bridge loan might need 8. The system pulls exactly what your
                program and state require.
              </p>
            </div>
          </FadeIn>

          {/* Core docs - 2 column list style */}
          <FadeIn delay={0.05}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">18 Core Loan Documents</h3>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-14">
            {CORE_DOCS.map((doc) => (
              <div key={doc.name} className="flex items-start gap-3 py-2.5 border-b border-border/50">
                <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-1 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-foreground">{doc.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">{doc.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* SBA + Other in expandable sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <details className="group rounded-xl bg-card card-shine metallic-sheen" open>
              <summary className="flex items-center justify-between cursor-pointer p-5 list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-foreground/50" />
                  <h3 className="text-sm font-semibold text-card-foreground">8 SBA-Specific Forms</h3>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 space-y-2">
                {SBA_DOCS.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between py-1.5">
                    <span className="text-sm font-medium text-foreground">{doc.name}</span>
                    <span className="text-xs text-muted-foreground">{doc.desc}</span>
                  </div>
                ))}
              </div>
            </details>

            <details className="group rounded-xl bg-card card-shine metallic-sheen" open>
              <summary className="flex items-center justify-between cursor-pointer p-5 list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-foreground/50" />
                  <h3 className="text-sm font-semibold text-card-foreground">10 Additional Documents</h3>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5">
                <div className="flex flex-wrap gap-2">
                  {OTHER_DOCS.map((doc) => (
                    <span key={doc} className="inline-flex items-center rounded-md bg-muted border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* Financial Analysis - Horizontal cards */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Financial analysis on every deal
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Upload the borrower&apos;s financials and the system extracts
                  the numbers, calculates the ratios, and checks program
                  eligibility before generating documents.
                </p>
              </div>
            </FadeIn>

            <Stagger className="space-y-4" staggerDelay={0.06} initialDelay={0.1}>
              {[
                {
                  title: "Income and cash flow",
                  icon: Calculator,
                  items: "Gross and net income from tax returns, P&L, or bank statements. Monthly and annual cash flow. DSCR from actual NOI. Debt-to-income across all obligations. Global cash flow for multi-entity borrowers.",
                },
                {
                  title: "Collateral and risk",
                  icon: ShieldCheck,
                  items: "Loan-to-value against appraised value. Collateral coverage across all pledged assets. Liquidity relative to debt service. 49 risk flags per deal. Borrowing base calculations for revolving facilities.",
                },
                {
                  title: "Program eligibility",
                  icon: Landmark,
                  items: "SBA size standards by NAICS code. Owner-occupancy (51% for 7(a), 60% for 504). Use of proceeds restrictions. Rate cap compliance. Guaranty fee calculations by loan size and maturity.",
                },
              ].map((item) => (
                <StaggerItem key={item.title}>
                  <div className="rounded-xl bg-card p-6 sm:p-8 transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted inset-shine">
                        <item.icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-card-foreground mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.items}</p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Compliance - Two column split */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Compliance checks on every document
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                After documents are generated, they run through regulatory
                checks for your specific deal, program, and state.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FadeIn delay={0.05}>
              <div className="rounded-xl bg-card p-6 sm:p-8 card-shine metallic-sheen h-full">
                <div className="flex items-center gap-2 mb-5">
                  <ShieldCheck className="h-4 w-4 text-foreground/50" />
                  <h3 className="text-sm font-semibold text-foreground">Federal</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "OFAC Consolidated Sanctions List (SDN, SSI, FSE)",
                    "BSA/AML identification and record-keeping",
                    "USA PATRIOT Act customer identification",
                    "TRID disclosure timing and tolerances",
                    "National Flood Insurance Act",
                    "SBA SOP rate caps, size standards, guaranty fees",
                    "HPML thresholds against FFIEC APOR tables",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="rounded-xl bg-card p-6 sm:p-8 card-shine metallic-sheen h-full">
                <div className="flex items-center gap-2 mb-5">
                  <MapPin className="h-4 w-4 text-foreground/50" />
                  <h3 className="text-sm font-semibold text-foreground">State</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Usury limits (TX 28%, GA 60%, CA Art XV exemptions)",
                    "Commercial financing disclosure in 11 states",
                    "Community property rules in 9 states",
                    "State-specific mortgage and deed of trust requirements",
                    "Recording and filing requirements by county",
                    "UCC filing requirements and perfection rules",
                    "Day-count conventions (Actual/360 vs 365)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* How It Works - Horizontal flow */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-0">
                {[
                  { n: "01", title: "Upload financials", desc: "Tax returns, bank statements, rent rolls, or whatever the program requires." },
                  { n: "02", title: "Pick the program", desc: "Choose from 14 loan programs. Enter the deal terms." },
                  { n: "03", title: "Get the full package", desc: "Every document generated, checked, and ready to download." },
                ].map((step, i) => (
                  <div key={step.n} className="flex-1 flex items-start gap-4 sm:flex-col sm:items-center sm:text-center">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground text-sm font-bold font-mono inset-shine">
                      {step.n}
                    </div>
                    <div className="sm:mt-4">
                      <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                    {i < 2 && <ArrowRight className="hidden sm:block h-5 w-5 text-muted-foreground/30 absolute" style={{ display: 'none' }} />}
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Bottom CTA */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="relative rounded-2xl bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 card-shine hero-light bg-noise">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  See what a full loan package looks like.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Pick any of the 14 programs and generate a sample deal.
                  Check every number yourself.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <SignInButton mode="modal">
                    <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                      See a Sample Deal
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
      </section>

      <MarketingFooter />
    </div>
  );
}
