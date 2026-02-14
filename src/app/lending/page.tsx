import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Landmark } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  { name: "Promissory Note", desc: "The borrower's signed promise to pay back the loan on the agreed schedule" },
  { name: "Loan Agreement", desc: "All the terms of the deal in one place: rate, term, covenants, default triggers" },
  { name: "Security Agreement", desc: "Gives the lender a claim on the borrower's business assets as collateral" },
  { name: "Guaranty Agreement", desc: "A personal or third-party guarantee that the loan gets repaid" },
  { name: "Commitment Letter", desc: "Your formal offer to the borrower, spelling out what you will lend and on what terms" },
  { name: "Deed of Trust", desc: "Ties the loan to the real property so the lender has a lien" },
  { name: "Assignment of Leases & Rents", desc: "Lets the lender collect rent payments if the borrower stops paying" },
  { name: "SNDA", desc: "Keeps tenants in place and protects lender rights if the property goes to foreclosure" },
  { name: "Subordination Agreement", desc: "Sets the pecking order when there is more than one lender on a deal" },
  { name: "Tenant Estoppel Certificate", desc: "Gets existing tenants on record confirming their lease terms" },
  { name: "Intercreditor Agreement", desc: "Spells out who gets paid first when senior and junior debt are both on the table" },
  { name: "Environmental Indemnity Agreement", desc: "Borrower takes responsibility for any environmental cleanup costs on the property" },
  { name: "Borrowing Base Agreement", desc: "Defines the formula that controls how much the borrower can draw on a line" },
  { name: "UCC Financing Statement", desc: "Filed publicly so everyone knows the lender has a claim on the collateral" },
  { name: "SBA Form 1919", desc: "Borrower information form required on every SBA loan" },
  { name: "SBA Form 159", desc: "Discloses all fees and compensation paid to agents or packagers" },
  { name: "SBA Form 148", desc: "The unconditional personal guarantee the SBA requires from owners" },
  { name: "SBA Form 1050", desc: "Settlement sheet showing exactly how SBA loan funds are distributed" },
  { name: "IRS Form 4506-C", desc: "Lets you pull the borrower's tax transcripts directly from the IRS" },
  { name: "IRS Form W-9", desc: "Collects the borrower's taxpayer ID and certification" },
  { name: "Flood Determination", desc: "Checks whether the property sits in a flood zone" },
  { name: "SBA Authorization", desc: "The SBA's green light to fund the loan" },
  { name: "CDC Debenture", desc: "The funding instrument that makes SBA 504 loans work" },
  { name: "Settlement Statement", desc: "Line-by-line breakdown of every charge at closing" },
  { name: "Loan Estimate", desc: "The borrower's first look at what the loan will actually cost" },
  { name: "Closing Disclosure", desc: "Final, locked-in numbers the borrower signs at closing" },
  { name: "Borrower's Certificate", desc: "Borrower confirms everything they told you is still true at closing" },
  { name: "Compliance Certificate", desc: "Ongoing confirmation that the borrower is meeting loan covenants" },
  { name: "Legal Opinion Letter", desc: "Outside counsel's sign-off that the docs are enforceable" },
  { name: "Corporate Borrowing Resolution", desc: "Board resolution authorizing the company to take on the debt" },
  { name: "Amortization Schedule", desc: "Month-by-month payment table showing principal, interest, and balance" },
  { name: "Privacy Notice (GLBA)", desc: "Required notice telling borrowers how their data is used and shared" },
  { name: "USA PATRIOT Act Notice", desc: "Anti-money laundering notice required on every loan" },
  { name: "Commercial Financing Disclosure", desc: "State-level disclosure of rates and terms, required in many jurisdictions" },
  { name: "Disbursement Authorization", desc: "Tells the closer exactly where to send the loan proceeds" },
  { name: "Digital Asset Pledge Agreement", desc: "Pledges cryptocurrency as collateral and covers custody and liquidation" },
];

const PROGRAMS = [
  { name: "SBA 7(a)", desc: "The most common SBA loan. Up to $5M, government-backed, with all required SBA forms included. A single deal can produce up to 27 documents." },
  { name: "SBA 504", desc: "Fixed-rate, long-term financing for real estate and heavy equipment. Uses a CDC debenture structure with separate docs for each piece." },
  { name: "Commercial CRE", desc: "Purchase, refinance, or cash-out on office, retail, industrial, and mixed-use properties." },
  { name: "DSCR", desc: "Qualified on the property's rental income, not the borrower's personal tax returns. Popular for investor-owned rentals." },
  { name: "Bank Statement", desc: "Built for self-employed borrowers. Uses 12 or 24 months of bank deposits to prove income instead of tax returns." },
  { name: "Conventional Business", desc: "Traditional underwriting with full financials. Term loans, working capital, or acquisition financing." },
  { name: "Line of Credit", desc: "Revolving credit the borrower draws against as needed, with a borrowing base that controls availability." },
  { name: "Equipment Financing", desc: "Finances the purchase of specific equipment. The equipment itself serves as collateral." },
  { name: "Bridge", desc: "Short-term financing to cover the gap while permanent financing or a sale closes. Usually 6 to 24 months." },
  { name: "Multifamily", desc: "Loans for apartment buildings, from small 5-unit properties to large complexes. Includes assignment of leases and rents." },
  { name: "Mezzanine", desc: "Sits behind the senior lender in the capital stack. Higher rate, but lets the borrower get more leverage on a deal." },
  { name: "Construction", desc: "Finances ground-up builds or gut renovations. Draw schedules, inspection requirements, and completion guarantees built in." },
  { name: "Hard Money", desc: "Asset-based, fast-close loans. Common for fix-and-flip, land, and deals that need to fund in days, not weeks." },
  { name: "Crypto-Collateralized", desc: "Loans backed by Bitcoin, Ethereum, or other digital assets. Includes custody terms and liquidation triggers." },
];

const STEPS = [
  {
    number: "1",
    title: "Enter the deal and upload financials",
    desc: "Pick your loan program, enter the terms, and upload the borrower's documents. Tax returns, bank statements, entity docs, personal financial statements. The system reads and extracts the numbers for you.",
  },
  {
    number: "2",
    title: "Get the full loan package back",
    desc: "Every document your program requires is generated together. Rates, LTVs, fees, and payments are calculated from the program rules for your state. The legal language is written around those numbers. Nothing is guessed.",
  },
  {
    number: "3",
    title: "Review it, edit it, close the deal",
    desc: "Read through the package. Make edits directly in the platform. When you are satisfied, download everything as PDFs or Word docs and take it to closing.",
  },
];

export default function LendingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-blue-500/3 blur-3xl" />

      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm text-blue-500 mb-6">
                <Landmark className="h-3.5 w-3.5" />
                Lending
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Upload the financials.
                <br />
                <span className="text-blue-500">Get the entire loan package back.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                You pick the loan program and upload the borrower's documents. OpenShut generates
                up to 27 documents for a single deal: promissory notes, loan agreements, SBA forms,
                guarantees, closing disclosures, amortization schedules, and every required filing.
                Every number is calculated from program rules. Every document is checked against
                the lending laws for your state. You review it, edit it, and close.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <SignInButton mode="modal">
                  <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                    Try It Free
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </SignInButton>
                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-foreground/15"
                >
                  View Pricing
                </Link>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                First project free. Full document output. No credit card.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
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
      </section>

      {/* 36 Documents */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                36 document types. One upload.
              </h2>
              <p className="mt-4 text-muted-foreground">
                From the commitment letter all the way through closing disclosure. You pick
                the program and the system pulls the right documents for that deal type.
                An SBA 7(a) might need 27. A bridge loan might need 12. You get exactly
                what the deal requires.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            staggerDelay={0.03}
            initialDelay={0.1}
          >
            {DOCUMENTS.map((doc) => (
              <StaggerItem key={doc.name}>
                <div className="rounded-xl border bg-card p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-card-foreground">{doc.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{doc.desc}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* 14 Loan Programs */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                14 loan programs built in
              </h2>
              <p className="mt-4 text-muted-foreground">
                Each program has its own document set, its own compliance rules, and its own
                calculations. Pick the program, and the system handles the rest. SBA forms
                for SBA deals. DSCR math for investor loans. State-specific disclosures
                wherever they are required.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            staggerDelay={0.04}
            initialDelay={0.1}
          >
            {PROGRAMS.map((program) => (
              <StaggerItem key={program.name}>
                <div className="rounded-xl border bg-card p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <h3 className="text-sm font-semibold text-card-foreground">{program.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{program.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Compliance */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                23 compliance checks run on every deal
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Before you download anything, the system checks your documents against the
                lending laws that actually apply to your deal. If the rate exceeds the usury
                limit in your state, you will know. If a required disclosure is missing, you
                will know. If an SBA form has a number that does not match the loan agreement,
                you will know. You review every flagged item before closing.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  50-state usury validation
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  OFAC screening
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  SBA size and eligibility
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  Flood zone checks
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  Required disclosures
                </span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How it works
              </h2>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            staggerDelay={0.08}
            initialDelay={0.1}
          >
            {STEPS.map((step) => (
              <StaggerItem key={step.number}>
                <div className="rounded-xl border bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 text-sm font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-base font-semibold text-card-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 hover:border-foreground/15 hover:shadow-xl">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
              </div>

              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Run a real deal through it.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Your first project is free. Full document output, all 14 programs, no credit card required.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <SignInButton mode="modal">
                    <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                      Try It Free
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </button>
                  </SignInButton>
                  <Link
                    href="/pricing"
                    className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted hover:border-foreground/15"
                  >
                    View Pricing
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5 text-blue-500" />
                    36 documents
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    14 loan programs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    No credit card
                  </span>
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
