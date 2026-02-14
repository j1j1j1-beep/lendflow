import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Handshake, ShieldCheck, Calculator, AlertTriangle, ChevronDown } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const TIMELINE_DOCS = [
  {
    phase: "Offer",
    name: "Letter of Intent",
    desc: "Purchase price, deal structure, exclusivity period, key conditions, and the terms that must be met before you move to a definitive agreement.",
  },
  {
    phase: "Diligence",
    name: "Non-Disclosure Agreement",
    desc: "Protects what gets shared. Financials, customer lists, trade secrets, employee information. Rule 10b-5 MNPI provisions included.",
  },
  {
    phase: "Diligence",
    name: "Due Diligence Checklist",
    desc: "25 categories, 200+ items. Financial, legal, tax, environmental, IP, employment, real property, insurance, regulatory, and technology.",
  },
  {
    phase: "Negotiation",
    name: "Purchase Agreement",
    desc: "The definitive agreement. 25 to 40 seller reps, working capital adjustment, escrow, indemnification caps and baskets, MAC clause with 9 carveouts, and termination provisions.",
    highlight: true,
  },
  {
    phase: "Negotiation",
    name: "Disclosure Schedules",
    desc: "10 schedules: cap table, subsidiaries, material contracts, litigation, IP, real property, environmental, tax, insurance, employee benefits.",
  },
  {
    phase: "Close",
    name: "Closing Checklist",
    desc: "Every deliverable, signature, filing, and payoff. 11 categories covering corporate approvals, consents, regulatory filings, employment, and post-closing items.",
  },
];

const TRANSACTION_TYPES = [
  { name: "Stock Purchase", desc: "Buy the entity. Inherit all liabilities." },
  { name: "Asset Purchase", desc: "Pick which assets and liabilities you take." },
  { name: "Forward Merger", desc: "Target merges into acquirer. Target ceases to exist." },
  { name: "Reverse Triangular", desc: "Sub merges into target. Target survives with contracts." },
  { name: "Forward Triangular", desc: "Target merges into sub. Liability stays contained." },
  { name: "Reverse Merger", desc: "Acquirer merges into target. Target's licenses preserved." },
  { name: "Tender Offer", desc: "Go directly to shareholders. Can bypass the board." },
  { name: "Section 363 Sale", desc: "Assets out of bankruptcy, free and clear." },
];

export default function DealsPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background bg-ambient relative overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-light bg-noise">
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32 relative z-10">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-sm text-muted-foreground mb-6">
                <Handshake className="h-3.5 w-3.5" />
                Deals / M&A
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                From LOI to close.
                <br />
                <span className="text-muted-foreground">
                  Six documents, one set of terms.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                The longer it takes to produce an LOI, the longer someone
                else has to outbid you. OpenShut generates all six acquisition
                documents from one set of deal terms. Regulatory thresholds
                calculated at current rates. Purchase agreement tailored to
                your transaction structure.
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
                Free demo. All 6 documents. 8 transaction structures.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Risk callout */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <FadeIn>
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-foreground/50 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Where M&A deals go wrong</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
                    A miscalculated HSR threshold is $54,540 per day in penalties. A missed WARN Act notice triggers employee litigation. A non-compete that violates California law is unenforceable. These are the kinds of things that get caught in review when someone remembers to check. OpenShut checks them automatically against current thresholds before you download.
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Documents - Timeline layout */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Six documents across the deal timeline
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                From first offer through closing. Generated from the same
                deal terms so nothing contradicts.
              </p>
            </div>
          </FadeIn>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border hidden sm:block" />

            <Stagger className="space-y-4" staggerDelay={0.06} initialDelay={0.1}>
              {TIMELINE_DOCS.map((doc, i) => (
                <StaggerItem key={doc.name}>
                  <div className={`flex gap-5 ${doc.highlight ? "" : ""}`}>
                    {/* Timeline dot */}
                    <div className="hidden sm:flex flex-col items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${doc.highlight ? "bg-foreground text-background" : "bg-muted"} inset-shine`}>
                        <span className="text-xs font-bold font-mono">{String(i + 1).padStart(2, "0")}</span>
                      </div>
                    </div>

                    <div className={`flex-1 rounded-xl bg-card p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen ${doc.highlight ? "ring-1 ring-border" : ""}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{doc.phase}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-card-foreground mb-1.5">{doc.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{doc.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* Purchase Agreement Deep Dive */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Inside the purchase agreement
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  The purchase agreement adapts to your transaction structure.
                  Stock purchases, asset deals, and mergers each get different
                  reps, conditions, and tax treatment.
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { article: "I", title: "Definitions", desc: "Defined terms used throughout" },
                { article: "II", title: "Purchase & Sale", desc: "What's being bought and sold" },
                { article: "III", title: "Consideration", desc: "Price, adjustments, earnouts" },
                { article: "IV", title: "Seller Reps", desc: "25-40 representations and warranties" },
                { article: "V", title: "Buyer Reps", desc: "Buyer's representations" },
                { article: "VI", title: "Covenants", desc: "Pre-closing conduct, access, filings" },
                { article: "VII", title: "Conditions", desc: "What must happen before close" },
                { article: "VIII", title: "Indemnification", desc: "Caps, baskets, survival periods" },
                { article: "IX", title: "Termination", desc: "Breakup fees, walk-away rights" },
                { article: "X", title: "Miscellaneous", desc: "Governing law, notices, amendments" },
              ].map((item) => (
                <FadeIn key={item.article} delay={0.03}>
                  <div className="rounded-xl bg-card p-4 card-shine h-full">
                    <div className="text-xs font-bold text-muted-foreground/50 font-mono mb-2">Art. {item.article}</div>
                    <h4 className="text-xs font-semibold text-card-foreground mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Transaction Types - Compact grid */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                8 transaction structures
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                The reps, closing conditions, indemnification, and tax
                treatment all change based on the structure you pick.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" staggerDelay={0.03} initialDelay={0.1}>
            {TRANSACTION_TYPES.map((type) => (
              <StaggerItem key={type.name}>
                <div className="rounded-xl bg-card p-4 sm:p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                  <h3 className="text-sm font-semibold text-card-foreground mb-1.5">{type.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{type.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Regulatory - Collapsible deep dives */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Regulatory thresholds at current rates
                </h2>
              </div>
            </FadeIn>

            <div className="space-y-3">
              {[
                {
                  title: "HSR Act and antitrust",
                  icon: ShieldCheck,
                  items: [
                    "$119.5M minimum transaction size threshold (2026)",
                    "6 filing fee tiers: $30K / $105K / $260K / $415K / $830K / $2.335M",
                    "30-day waiting period flagged in timeline",
                    "$54,540/day penalty for gun-jumping violations",
                    "CFIUS mandatory filing for TID US businesses (FIRRMA, Feb 2020)",
                  ],
                },
                {
                  title: "Tax elections and treatment",
                  icon: Calculator,
                  items: [
                    "Section 338(h)(10) stock-to-asset election mechanics",
                    "Section 453 installment sale treatment",
                    "Section 280G golden parachute calculations (3x base amount)",
                    "Section 368 tax-free reorganization continuity requirements",
                    "Section 197 goodwill amortization (15-year schedule)",
                    "QSBS Section 1202 exclusion where applicable",
                  ],
                },
                {
                  title: "Employment and state law",
                  icon: Handshake,
                  items: [
                    "WARN Act: 100+ employees, 60-day notice required",
                    "State mini-WARNs: CA (75 employees), NY (50), NJ (90-day notice)",
                    "Non-compete: sale-of-business exception + state bans (CA, MN, ND, OK)",
                    "FIRPTA Section 1445 (15%) for real property interests",
                  ],
                },
              ].map((section) => (
                <details key={section.title} className="group rounded-xl bg-card transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen">
                  <summary className="flex items-center justify-between cursor-pointer p-5 sm:p-6 list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-3">
                      <section.icon className="h-4 w-4 text-foreground/50" />
                      <h3 className="text-sm font-semibold text-card-foreground">{section.title}</h3>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180 shrink-0" />
                  </summary>
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                    <div className="border-t border-border pt-4">
                      <ul className="space-y-2.5">
                        {section.items.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </details>
              ))}
            </div>
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
                  See the full acquisition package.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  All 6 documents, all 8 structures. Free demo.
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
