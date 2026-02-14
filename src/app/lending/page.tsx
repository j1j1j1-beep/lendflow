import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Landmark } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  { name: "Promissory Note", desc: "The borrower's written promise to repay the loan" },
  { name: "Loan Agreement", desc: "The full terms of the loan between lender and borrower" },
  { name: "Security Agreement", desc: "Grants the lender a security interest in the borrower's assets" },
  { name: "Guaranty Agreement", desc: "A third party guarantees repayment if the borrower defaults" },
  { name: "Commitment Letter", desc: "The lender's formal offer to provide the loan" },
  { name: "Deed of Trust", desc: "Secures the loan against real property" },
  { name: "Assignment of Leases & Rents", desc: "Gives the lender rights to rental income if the borrower defaults" },
  { name: "SNDA", desc: "Protects tenants and lenders during foreclosure" },
  { name: "Subordination Agreement", desc: "Establishes priority between multiple lenders" },
  { name: "Tenant Estoppel Certificate", desc: "Confirms lease terms with existing tenants" },
  { name: "Intercreditor Agreement", desc: "Defines rights and priorities between senior and junior lenders" },
  { name: "Environmental Indemnity Agreement", desc: "Borrower indemnifies lender for environmental liability" },
  { name: "Borrowing Base Agreement", desc: "Sets the formula for how much the borrower can draw" },
  { name: "UCC Financing Statement", desc: "Public filing that perfects the lender's security interest" },
  { name: "SBA Form 1919", desc: "Borrower Information Form for SBA loans" },
  { name: "SBA Form 159", desc: "Fee Disclosure and Compensation Agreement" },
  { name: "SBA Form 148", desc: "Unconditional Guarantee for SBA loans" },
  { name: "SBA Form 1050", desc: "Settlement Sheet for SBA loans" },
  { name: "IRS Form 4506-C", desc: "Authorizes release of tax transcripts" },
  { name: "IRS Form W-9", desc: "Taxpayer identification and certification" },
  { name: "Flood Determination", desc: "Standard flood hazard determination for the property" },
  { name: "SBA Authorization", desc: "SBA's formal authorization to fund the loan" },
  { name: "CDC Debenture", desc: "Funding instrument for SBA 504 loans" },
  { name: "Settlement Statement", desc: "Itemized breakdown of all charges at closing" },
  { name: "Loan Estimate", desc: "Initial disclosure of estimated loan costs" },
  { name: "Closing Disclosure", desc: "Final disclosure of actual loan costs" },
  { name: "Borrower's Certificate", desc: "Borrower certifies representations are true at closing" },
  { name: "Compliance Certificate", desc: "Certifies ongoing compliance with loan covenants" },
  { name: "Legal Opinion Letter", desc: "Attorney's opinion on enforceability and compliance" },
  { name: "Corporate Borrowing Resolution", desc: "Board authorization for the entity to borrow" },
  { name: "Amortization Schedule", desc: "Payment schedule showing principal and interest over the loan term" },
  { name: "Privacy Notice (GLBA)", desc: "Required notice about how borrower data is shared" },
  { name: "USA PATRIOT Act Notice", desc: "Required anti-money laundering disclosure" },
  { name: "Commercial Financing Disclosure", desc: "State-required disclosure of financing terms" },
  { name: "Disbursement Authorization", desc: "Authorizes how loan proceeds are distributed" },
  { name: "Digital Asset Pledge Agreement", desc: "Secures loans collateralized by cryptocurrency" },
];

const PROGRAMS = [
  { name: "SBA 7(a)", desc: "Small business loans backed by the federal government, up to $5M" },
  { name: "SBA 504", desc: "Long-term fixed-rate financing for major assets like real estate and equipment" },
  { name: "Commercial CRE", desc: "Loans for purchasing or refinancing commercial real estate" },
  { name: "DSCR", desc: "Loans underwritten based on the property's cash flow, not the borrower's income" },
  { name: "Bank Statement", desc: "Loans for self-employed borrowers using bank deposits instead of tax returns" },
  { name: "Conventional Business", desc: "Standard business loans with traditional underwriting" },
  { name: "Line of Credit", desc: "Revolving credit facility the borrower can draw from as needed" },
  { name: "Equipment Financing", desc: "Loans specifically for purchasing business equipment" },
  { name: "Bridge", desc: "Short-term loans to bridge the gap until permanent financing is secured" },
  { name: "Multifamily", desc: "Loans for apartment buildings and multifamily residential properties" },
  { name: "Mezzanine", desc: "Subordinated debt that sits between senior debt and equity" },
  { name: "Construction", desc: "Loans for ground-up construction or major renovations" },
  { name: "Hard Money", desc: "Asset-based loans with fast funding, typically for fix-and-flip" },
  { name: "Crypto-Collateralized", desc: "Loans secured by digital assets like Bitcoin or Ethereum" },
];

const STEPS = [
  {
    number: "1",
    title: "Fill in your deal details",
    desc: "Enter the loan terms, borrower info, and upload their financials. Tax returns, bank statements, entity docs. The system reads them automatically.",
  },
  {
    number: "2",
    title: "We generate the full loan package",
    desc: "Every document for your loan program is generated at once. Rates, fees, and disclosures are set by the rules for your state and program type. Nothing is made up.",
  },
  {
    number: "3",
    title: "Review, edit, and download",
    desc: "Read through everything. Make changes directly. Download the full package as PDFs or Word docs when you are ready to close.",
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
                Upload your borrower's financials.
                <br />
                <span className="text-blue-500">Get a complete loan package back.</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                You fill in the deal details and upload the borrower's documents. OpenShut generates
                up to 36 legal documents for your loan, checked against federal and state lending laws.
                Promissory notes, loan agreements, SBA forms, closing disclosures. The whole package,
                ready to review.
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
                One project free. Full output. No credit card.
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
                36 documents. One upload.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every document a lender needs from commitment letter to closing disclosure.
                The system picks the right ones based on your loan program and generates
                the full package at once.
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
                14 loan programs
              </h2>
              <p className="mt-4 text-muted-foreground">
                Pick your program. The system knows which documents that program requires,
                which SBA forms to include, and which state and federal rules apply.
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
                Every document is checked before you close
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Every document is checked against the actual lending laws that apply to your deal
                and your state. If your interest rate exceeds the legal limit, if a required
                disclosure is missing, or if an SBA form has an error, the system catches it
                before you close.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  Federal lending laws
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  State-specific rules
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  SBA program requirements
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  Usury limits
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  Disclosure requirements
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
                  Try it on a real deal.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  One project free, full output, no credit card.
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
