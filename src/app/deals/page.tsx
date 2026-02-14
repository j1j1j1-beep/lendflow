import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Handshake } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "Letter of Intent",
    desc: "Your opening offer. Purchase price, deal structure, exclusivity period, and the conditions before you move to a definitive agreement.",
  },
  {
    name: "Non-Disclosure Agreement",
    desc: "Protects what gets shared during diligence. Financials, customer lists, trade secrets, and any other seller disclosures.",
  },
  {
    name: "Purchase Agreement",
    desc: "The binding contract. 25 to 40 seller reps, working capital adjustment, escrow mechanics, indemnification caps, and a MAC clause with 9 standard carveouts. Adapts to your deal structure.",
  },
  {
    name: "Due Diligence Checklist",
    desc: "Structured list of everything your team reviews before close. Financial, legal, tax, environmental, IP, employment.",
  },
  {
    name: "Disclosure Schedules",
    desc: "10 standard schedules: cap table, subsidiaries, material contracts, litigation, IP, real property, environmental, tax, insurance, employee benefits.",
  },
  {
    name: "Closing Checklist",
    desc: "Every deliverable, signature, and filing at close. Tracks status across workstreams.",
  },
];

const TRANSACTION_TYPES = [
  { name: "Stock Purchase", desc: "Buy the entity. Simpler execution, but you inherit all liabilities." },
  { name: "Asset Purchase", desc: "Pick which assets and liabilities you take on. More complex closing." },
  { name: "Forward Merger", desc: "Target merges into your entity. Target ceases to exist." },
  { name: "Reverse Triangular", desc: "Your subsidiary merges into the target. Target survives with its contracts." },
  { name: "Tender Offer", desc: "Go directly to shareholders. Bypasses the board. Faster timeline." },
  { name: "Section 363 Sale", desc: "Assets out of bankruptcy, court-supervised. Free and clear of most claims." },
];

export default function DealsPage() {
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
                <Handshake className="h-3.5 w-3.5" />
                Deals / M&A
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                Six acquisition documents
                <br />
                <span className="text-muted-foreground">
                  from one set of deal terms.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                Speed matters in M&A. The longer it takes to produce an LOI,
                the longer someone else has to outbid you. OpenShut generates
                all six acquisition documents from one set of deal terms, with
                regulatory thresholds calculated at current rates and the
                purchase agreement tailored to your transaction structure.
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
                First acquisition free. All 6 documents. 8 transaction types.
              </p>
            </div>
          </FadeIn>
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
                  Six documents, from offer to close
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  All six are generated from the same deal terms so nothing
                  contradicts. Four are legal documents with real language, two
                  are structured checklists.
                </p>
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
              {DOCUMENTS.map((doc) => (
                <StaggerItem key={doc.name}>
                  <div className="rounded-xl bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                    <div className="flex items-center gap-2.5 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-foreground/40 shrink-0" />
                      <h3 className="text-sm font-semibold text-card-foreground">{doc.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{doc.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Transaction Types */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                The purchase agreement follows the deal structure
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Reps, closing conditions, indemnification, and tax treatment
                all change depending on whether you are buying stock, buying
                assets, or running a merger. Pick the structure and the
                documents adapt.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {TRANSACTION_TYPES.map((type) => (
              <StaggerItem key={type.name}>
                <div className="rounded-xl bg-card p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
                    <h3 className="text-sm font-semibold text-card-foreground">{type.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-4">{type.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Regulatory */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                  Regulatory thresholds calculated at current rates
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-10">
                  M&A deals trigger filing requirements, tax elections, and
                  state law considerations that depend on deal size, structure,
                  and jurisdiction. The system surfaces these before you sign.
                </p>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {[
                    {
                      title: "HSR filing thresholds",
                      items: [
                        "$119.5M minimum transaction size (2025)",
                        "All 6 fee tiers calculated ($30K to $2.335M)",
                        "30-day waiting period flagged",
                        "$54,540/day gun-jumping penalty noted",
                      ],
                    },
                    {
                      title: "Tax structure",
                      items: [
                        "Section 338(h)(10) election mechanics",
                        "Section 453 installment treatment",
                        "Section 280G golden parachute calculations",
                        "Tax-free reorg continuity requirements",
                      ],
                    },
                    {
                      title: "Deal mechanics",
                      items: [
                        "MAC clause with 9 standard carveouts",
                        "Indemnification caps, baskets, survival periods",
                        "Non-compete: sale-of-business exception + state bans",
                        "CFIUS mandatory filing for TID businesses",
                      ],
                    },
                  ].map((col) => (
                    <div key={col.title} className="rounded-xl bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 card-shine">
                      <h3 className="text-sm font-semibold text-foreground mb-4">{col.title}</h3>
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
              { n: "01", title: "Enter the deal terms", desc: "Target, price, structure, tax elections, and key terms. A few minutes." },
              { n: "02", title: "Get all 6 documents", desc: "LOI, NDA, purchase agreement, DD checklist, disclosure schedules, and closing checklist." },
              { n: "03", title: "Edit, export, close", desc: "Make changes inline. Download as Word or PDF. Your attorney reviews instead of drafts." },
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
                    Your next acquisition starts here.
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                    Run a real deal through it. All 6 documents, all 8
                    transaction types. First deal free.
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
