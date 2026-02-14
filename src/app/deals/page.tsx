import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Handshake } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "Letter of Intent (LOI)",
    desc: "Your opening offer. Lays out the purchase price, deal structure, exclusivity period, and the conditions that must be met before you sign a definitive agreement.",
  },
  {
    name: "Non-Disclosure Agreement (NDA)",
    desc: "Protects what gets shared during diligence. Covers confidential financials, customer lists, trade secrets, and anything else the seller discloses to you.",
  },
  {
    name: "Purchase Agreement",
    desc: "The binding contract. Changes shape based on your deal type. Includes 25 to 40 seller reps, working capital adjustment, escrow mechanics, indemnification caps, and a MAC clause with standard carveouts.",
  },
  {
    name: "Due Diligence Checklist",
    desc: "A structured list of everything your team needs to review before closing. Financial, legal, tax, environmental, IP, employment. No AI involved. Pure checklist.",
  },
  {
    name: "Disclosure Schedules",
    desc: "10 standard schedules where the seller documents exceptions to their reps. Cap table, subsidiaries, material contracts, litigation, IP, real property, environmental, tax, insurance, and employee benefits.",
  },
  {
    name: "Closing Checklist",
    desc: "Every deliverable, signature, and filing that needs to happen at close. Tracks what is done and what is outstanding. No AI. Just organized task tracking.",
  },
];

const TRANSACTION_TYPES = [
  {
    name: "Stock Purchase",
    desc: "You buy the entity's shares. Simpler to execute, but you inherit all liabilities. The purchase agreement reflects that.",
  },
  {
    name: "Asset Purchase",
    desc: "You pick which assets and liabilities to acquire. More complex closing, but you choose what you take on.",
  },
  {
    name: "Forward Merger",
    desc: "Target merges into your entity. Target ceases to exist. Good for absorbing a company completely.",
  },
  {
    name: "Reverse Triangular Merger",
    desc: "Your subsidiary merges into the target. Target survives. Preserves the target's contracts and licenses.",
  },
  {
    name: "Tender Offer",
    desc: "You go directly to shareholders with an offer to buy their shares. Bypasses the board. Faster timeline.",
  },
  {
    name: "Section 363 Sale",
    desc: "Buying assets out of bankruptcy. Court-supervised process. Buyer gets the assets free and clear of most claims.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Describe the deal",
    desc: "Target company, purchase price, transaction type, tax structure, and key terms. Takes a few minutes.",
  },
  {
    number: "2",
    title: "Get all 6 documents",
    desc: "LOI, NDA, purchase agreement, diligence checklist, disclosure schedules, and closing checklist. Generated together so the terms are consistent.",
  },
  {
    number: "3",
    title: "Edit, export, send to counsel",
    desc: "Make changes inline. Download as Word or PDF. Your attorney reviews a first draft instead of starting from scratch.",
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
                Your acquisition docs.
                <br />
                <span className="text-primary">
                  LOI through closing. One generation.
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                Tell us the target, the price, and how you want to structure it. We generate the
                LOI, NDA, purchase agreement, diligence checklist, disclosure schedules, and closing
                checklist. Your counsel gets a complete first draft instead of a blank page. That
                alone saves weeks of billable hours.
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
                First deal free. All 6 documents. No credit card required.
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
                Everything you need from offer to close
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Four of these are legal documents with real language your attorneys will review. Two are
                pure checklists with no legal language at all. All six are generated from the same
                deal terms so nothing contradicts.
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
                Pick your deal structure. The docs follow.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                The purchase agreement changes shape based on the transaction type you select. Reps,
                closing conditions, and indemnification all reflect whether you are buying stock,
                assets, or running a merger.
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
                The regulatory checks you would do anyway
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Before you close, someone on your team has to check filing thresholds, tax elections,
                and state law requirements. We surface those issues upfront so nothing gets missed.
                You still verify. We just make sure you are looking at the right things.
              </p>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
                {[
                  {
                    title: "Federal filing thresholds",
                    desc: "We calculate whether your deal size triggers a Hart-Scott-Rodino filing at current 2026 thresholds. You know before you sign the LOI.",
                  },
                  {
                    title: "Tax structure options",
                    desc: "7 tax election options surfaced based on your deal type. Stock vs. asset implications, QSBS eligibility, and reorganization structures identified.",
                  },
                  {
                    title: "State corporate requirements",
                    desc: "Board approvals, shareholder votes, and appraisal rights flagged based on where the target is incorporated. Foreign acquirer considerations included.",
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
                Sign up, describe the deal, download your docs. No sales call. No demo. No credit card.
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
                  Your next acquisition starts here.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  Generate all 6 documents for your first deal. Hand your attorney a first draft
                  instead of a retainer. Free, no credit card.
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
                    No credit card required
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Handshake className="h-3.5 w-3.5 text-primary" />
                    6 documents included
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    Download as Word or PDF
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
