import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Handshake } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "Letter of Intent (LOI)",
    desc: "The initial offer outlining key deal terms. Purchase price, structure, exclusivity period, conditions.",
  },
  {
    name: "Non-Disclosure Agreement (NDA)",
    desc: "Protects confidential information shared during due diligence.",
  },
  {
    name: "Purchase Agreement",
    desc: "The definitive agreement that governs the acquisition. Representations, warranties, indemnification, closing conditions.",
  },
  {
    name: "Due Diligence Checklist",
    desc: "Organized list of everything that needs to be reviewed before closing. Financial, legal, operational, tax, environmental.",
  },
  {
    name: "Disclosure Schedules",
    desc: "The exceptions to the seller's representations and warranties. Where known issues are documented.",
  },
  {
    name: "Closing Checklist",
    desc: "Every item that needs to be completed, signed, or delivered at closing. Tracks status of each.",
  },
];

const TRANSACTION_TYPES = [
  {
    name: "Stock Purchase",
    desc: "Buy the entity's shares.",
  },
  {
    name: "Asset Purchase",
    desc: "Buy specific assets and liabilities.",
  },
  {
    name: "Forward Merger",
    desc: "Target merges into buyer.",
  },
  {
    name: "Reverse Triangular Merger",
    desc: "Buyer's subsidiary merges into target.",
  },
  {
    name: "Tender Offer",
    desc: "Direct offer to shareholders.",
  },
  {
    name: "Section 363 Sale",
    desc: "Acquisition out of bankruptcy.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Enter your deal details",
    desc: "Target company, purchase price, deal structure, key terms.",
  },
  {
    number: "2",
    title: "We generate all 6 documents",
    desc: "LOI, NDA, purchase agreement, DD checklist, disclosure schedules, closing checklist.",
  },
  {
    number: "3",
    title: "Review, edit, and download",
    desc: "View inline, make changes, download individually or as a ZIP.",
  },
];

export default function DealsPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-primary/3 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/4 blur-3xl" />

      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Handshake className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-widest text-amber-500">
                  Deals / M&A
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Structure your acquisition.
                <br />
                <span className="text-primary">
                  Get every document from LOI to closing.
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                You define the deal. OpenShut generates the 6 documents you need to take it from
                letter of intent through closing. Filing thresholds calculated. Tax structures
                validated. Ready to review and sign.
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

      {/* Documents */}
      <section className="w-full border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                6 documents. Every deal.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                From the first offer to the final signature. Each document is generated from your
                deal terms and reviewed for compliance before you download it.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            staggerDelay={0.06}
            initialDelay={0.1}
          >
            {DOCUMENTS.map((doc) => (
              <StaggerItem key={doc.name}>
                <div className="group rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {doc.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {doc.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Transaction Types */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Supports every transaction structure
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Pick your deal type. The documents adjust to match the structure,
                including the purchase agreement, representations, and closing conditions.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            staggerDelay={0.06}
            initialDelay={0.1}
          >
            {TRANSACTION_TYPES.map((type) => (
              <StaggerItem key={type.name}>
                <div className="group rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Handshake className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {type.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {type.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Compliance */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Compliance built in
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Filing thresholds are calculated at current rates so you know if a federal filing
                is required before you close. Tax structures are validated. State corporate law
                requirements are met.
              </p>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
                {[
                  {
                    title: "HSR filing thresholds",
                    desc: "Hart-Scott-Rodino thresholds calculated at current rates. You see immediately whether your deal requires a federal filing.",
                  },
                  {
                    title: "Tax structure validation",
                    desc: "Stock vs. asset purchase tax implications surfaced. Section 338(h)(10) elections flagged where applicable.",
                  },
                  {
                    title: "State corporate law",
                    desc: "Board approvals, shareholder consents, and appraisal rights requirements identified based on entity state of incorporation.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <h3 className="text-sm font-semibold text-card-foreground">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-muted-foreground">
                No demo call. No sales pitch. No credit card.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-6 sm:grid-cols-3"
            staggerDelay={0.08}
            initialDelay={0.1}
          >
            {STEPS.map((step) => (
              <StaggerItem key={step.number}>
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
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
                <div className="h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
              </div>

              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Try it on your next deal.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  One project free. Full output. No credit card.
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
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Handshake className="h-3.5 w-3.5 text-primary" />
                    6 documents per deal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    All 6 transaction types
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
