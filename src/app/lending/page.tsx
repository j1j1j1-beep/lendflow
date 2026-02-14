import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Landmark, FileText, Calculator } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const CORE_DOCS = [
  { name: "Promissory Note", desc: "Borrower's binding repayment obligation" },
  { name: "Loan Agreement", desc: "Rate, term, covenants, default triggers" },
  { name: "Security Agreement", desc: "Claim on business assets as collateral" },
  { name: "Guaranty Agreement", desc: "Personal or third-party guarantee" },
  { name: "Commitment Letter", desc: "Formal offer with all lending terms" },
  { name: "Deed of Trust", desc: "Real property lien for the lender" },
  { name: "Assignment of Leases & Rents", desc: "Lender collects rent on default" },
  { name: "SNDA", desc: "Protects tenants and lender in foreclosure" },
  { name: "Subordination Agreement", desc: "Priority between multiple lenders" },
  { name: "Tenant Estoppel Certificate", desc: "Tenant confirms lease terms" },
  { name: "Intercreditor Agreement", desc: "Senior/junior debt payment order" },
  { name: "Environmental Indemnity", desc: "Borrower covers cleanup costs" },
  { name: "Borrowing Base Agreement", desc: "Formula controlling line availability" },
  { name: "UCC Financing Statement", desc: "Public notice of collateral claim" },
  { name: "Loan Estimate", desc: "Borrower's first cost estimate" },
  { name: "Closing Disclosure", desc: "Final locked-in numbers at closing" },
  { name: "Amortization Schedule", desc: "Month-by-month payment breakdown" },
  { name: "Settlement Statement", desc: "Every charge at closing, line by line" },
];

const SBA_DOCS = [
  "SBA Form 1919", "SBA Form 159", "SBA Form 148", "SBA Form 1050",
  "SBA Authorization", "CDC Debenture", "IRS Form 4506-C", "IRS Form W-9",
];

const OTHER_DOCS = [
  "Flood Determination", "Borrower's Certificate", "Compliance Certificate",
  "Legal Opinion Letter", "Corporate Borrowing Resolution", "Privacy Notice (GLBA)",
  "USA PATRIOT Act Notice", "Commercial Financing Disclosure",
  "Disbursement Authorization", "Digital Asset Pledge Agreement",
];

const PROGRAMS = [
  { name: "SBA 7(a)", highlight: "Up to 27 documents per deal. Government-backed, 4-tier rate caps per SBA SOP." },
  { name: "SBA 504", highlight: "Fixed-rate CDC debenture structure for real estate and heavy equipment." },
  { name: "Commercial CRE", highlight: "Office, retail, industrial, mixed-use. Purchase, refinance, or cash-out." },
  { name: "DSCR", highlight: "Qualified on property income instead of personal tax returns." },
  { name: "Bank Statement", highlight: "12 or 24 months of deposits replace tax return requirements." },
  { name: "Conventional", highlight: "Full financials underwriting. Term, working capital, or acquisition." },
  { name: "Line of Credit", highlight: "Revolving draw against a borrowing base." },
  { name: "Equipment", highlight: "The equipment itself serves as collateral." },
  { name: "Bridge", highlight: "6 to 24 months while permanent financing closes." },
  { name: "Multifamily", highlight: "5-unit to large complexes with assignment of leases." },
  { name: "Mezzanine", highlight: "Behind senior debt in the capital stack. Higher rate, more leverage." },
  { name: "Construction", highlight: "Ground-up or gut rehab with draw schedules and inspection requirements." },
  { name: "Hard Money", highlight: "Asset-based, fast close. Fix-and-flip, land, time-sensitive deals." },
  { name: "Crypto-Collateralized", highlight: "Bitcoin, Ethereum, digital assets with custody and liquidation terms." },
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
                Your team spends days assembling loan packages that follow the
                same rules every time. Pick the program, upload the borrower's
                financials, and OpenShut generates everything from the commitment
                letter through the closing disclosure. 36 document types across
                14 loan programs, with rates and fees calculated from the actual
                program rules for your state.
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
                Each program has its own document set, rate calculations, and
                compliance requirements. You pick the program and the system
                handles everything downstream.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" staggerDelay={0.03} initialDelay={0.1}>
            {PROGRAMS.map((program) => (
              <StaggerItem key={program.name}>
                <div className="rounded-xl bg-card p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                    <h3 className="text-sm font-semibold text-card-foreground">{program.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-4">{program.highlight}</p>
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
                  Up to 36 document types per generation
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  The system pulls exactly what the program and state require for
                  your deal.
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
                        <span className="text-sm text-muted-foreground ml-1.5">{doc.desc}</span>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            {/* SBA + Other */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
              <FadeIn delay={0.15}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">SBA-specific forms</h3>
                <div className="flex flex-wrap gap-2">
                  {SBA_DOCS.map((doc) => (
                    <span key={doc} className="inline-flex items-center gap-1.5 rounded-lg bg-muted border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {doc}
                    </span>
                  ))}
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Additional documents</h3>
                <div className="flex flex-wrap gap-2">
                  {OTHER_DOCS.map((doc) => (
                    <span key={doc} className="inline-flex items-center rounded-md bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      {doc}
                    </span>
                  ))}
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Compliance */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-6">
                Compliance checks that run before you see anything
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-10">
                The system checks your documents against the lending laws that
                apply to your specific deal, program, and state. If something
                is off, it gets flagged for your review before you download.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "State usury limits", detail: "TX 28% commercial, GA 60% criminal cap, CA Art XV exemptions, and 47 more" },
                  { label: "OFAC screening", detail: "Full Consolidated Sanctions List: SDN, SSI, FSE" },
                  { label: "SBA compliance", detail: "Rate caps per SOP 50 10 8, size standards, guaranty fee tiers" },
                  { label: "Required disclosures", detail: "Commercial financing disclosure in 11 states, TRID, GLBA, BSA/AML" },
                  { label: "Flood zone checks", detail: "National Flood Insurance Act requirements" },
                  { label: "Number verification", detail: "Two independent systems check every figure, flagged if they disagree by more than $1" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-xl bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 card-shine">
                    <Calculator className="h-4 w-4 text-foreground/50 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-card-foreground">{item.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
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
