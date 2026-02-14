import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Building, Calculator, ShieldCheck, AlertTriangle, TrendingUp } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "Private Placement Memorandum",
    desc: "19 sections covering property details, deal structure, projected returns, sponsor track record, risk factors, fee disclosure, tax treatment, and legal disclosures.",
  },
  {
    name: "LLC Operating Agreement",
    desc: "Management authority, capital contributions, distribution waterfall with preferred return and promote tiers, transfer restrictions, dissolution.",
  },
  {
    name: "Subscription Agreement",
    desc: "Capital commitment, accreditation representations, suitability confirmations. Adjusts for 506(b) or 506(c).",
  },
  {
    name: "Investor Questionnaire",
    desc: "Accreditation, tax ID, entity type. Collected for every investor. Pure template.",
  },
];

const PROPERTY_TYPES = [
  { name: "Multifamily", expense: "35-45%", dep: "27.5yr" },
  { name: "Office", expense: "40-50%", dep: "39yr" },
  { name: "Retail", expense: "30-40%", dep: "39yr" },
  { name: "Industrial", expense: "25-35%", dep: "39yr" },
  { name: "Mixed Use", expense: "35-50%", dep: "39yr" },
  { name: "Self Storage", expense: "25-40%", dep: "39yr" },
  { name: "Manufactured Housing", expense: "30-40%", dep: "27.5yr" },
  { name: "Hotel", expense: "55-75%", dep: "39yr" },
  { name: "Triple Net (NNN)", expense: "10-20%", dep: "39yr" },
  { name: "Senior Living", expense: "55-70%", dep: "27.5yr" },
  { name: "Student Housing", expense: "40-50%", dep: "27.5yr" },
  { name: "Build-to-Rent", expense: "30-40%", dep: "27.5yr" },
];

export default function SyndicationPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background bg-ambient relative overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-light bg-noise">
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32 relative z-10">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3.5 py-1.5 text-sm text-muted-foreground mb-6">
                <Building className="h-3.5 w-3.5" />
                Syndication
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                Investor docs and a
                <br />
                <span className="text-muted-foreground">
                  pure-math financial model.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                Enter the property, financing, and waterfall structure. Get
                back 5 investor-ready documents and a year-by-year pro forma
                with IRR, equity multiples, waterfall distributions, and
                sensitivity analysis across 12 property types.
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
                Free demo. All 5 documents plus full pro forma.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Pro Forma - Featured section */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="rounded-2xl bg-card p-8 sm:p-12 card-shine metallic-sheen ring-1 ring-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background inset-shine">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground sm:text-2xl">Pro Forma Financial Projections</h2>
                    <p className="text-sm text-muted-foreground">100% math. Zero AI. The same methods your Excel model uses.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Year-by-year projections</h3>
                    <ul className="space-y-2">
                      {["Gross potential rent with vacancy", "Operating expenses by category", "NOI and debt service coverage", "Depreciation (27.5yr or 39yr)", "Free cash flow per year"].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Return metrics</h3>
                    <ul className="space-y-2">
                      {["IRR (Newton-Raphson iteration)", "Equity multiple / MOIC", "Cash-on-cash return by year", "DPI, RVPI, and TVPI", "Sensitivity on exit cap + occupancy"].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Exit analysis</h3>
                    <ul className="space-y-2">
                      {["Exit cap rate vs. going-in", "Sale proceeds and costs", "Waterfall at exit", "LP and GP distributions", "Total return over hold period"].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Waterfall - Stepped visual */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Waterfall distributions calculated, not estimated
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                You define the tiers. The system calculates cumulative returns
                at every level across the full hold period.
              </p>
            </div>
          </FadeIn>

          <Stagger className="space-y-3" staggerDelay={0.06} initialDelay={0.1}>
            {[
              { step: "1", title: "Return of capital", desc: "LPs get their invested capital back first before any profits are split.", color: "bg-muted" },
              { step: "2", title: "Preferred return", desc: "LPs receive their preferred return hurdle (typically 6-8% annual). Cumulative, not reset each year.", color: "bg-muted" },
              { step: "3", title: "GP catch-up", desc: "100% of distributions go to the GP until the GP has received their promote share of all profits distributed so far.", color: "bg-foreground/10" },
              { step: "4", title: "Promote tiers", desc: "Remaining profits split according to tiers you define. Common structures: 70/30, then 60/40, then 50/50 at higher return thresholds.", color: "bg-foreground/10" },
            ].map((tier) => (
              <StaggerItem key={tier.step}>
                <div className="flex gap-4 items-start">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tier.color} text-foreground text-sm font-bold font-mono inset-shine`}>
                    {tier.step}
                  </div>
                  <div className="flex-1 rounded-xl bg-card p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 card-shine metallic-sheen">
                    <h3 className="text-sm font-semibold text-card-foreground mb-1">{tier.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tier.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Investor Documents */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Four investor documents
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Plus the pro forma above. Five documents total, generated
                  from the same deal inputs.
                </p>
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.06} initialDelay={0.1}>
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

      {/* Property Types */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                12 property types, each modeled differently
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                A hotel runs at 55-75% expenses. Industrial runs at 25-35%.
                Residential depreciates over 27.5 years, commercial over 39.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" staggerDelay={0.03} initialDelay={0.1}>
            {PROPERTY_TYPES.map((type) => (
              <StaggerItem key={type.name}>
                <div className="rounded-xl bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 card-shine h-full">
                  <h3 className="text-sm font-semibold text-card-foreground mb-2">{type.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="tabular-nums">{type.expense}</span>
                    <span className="text-border">|</span>
                    <span className="tabular-nums">{type.dep}</span>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
          <FadeIn delay={0.2}>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground/60">
              <span>Expense ratio</span>
              <span>|</span>
              <span>Depreciation</span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Tax + Risk - Side by side */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FadeIn delay={0.05}>
                <div className="rounded-xl bg-card p-6 sm:p-8 card-shine metallic-sheen h-full">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="h-4 w-4 text-foreground/50" />
                    <h3 className="text-base font-semibold text-foreground">Tax structures in the documents</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Bonus depreciation tracked at current TCJA phase-down rates",
                      "Cost segregation assumptions by property type",
                      "1031 exchange: 45-day ID, 180-day close, QI requirements",
                      "Qualified Opportunity Zone: 10-year hold, 90% asset test",
                      "Passive loss rules: $100K/$150K phase-out (Section 469)",
                      "Real Estate Professional Status: 750+ hours noted in PPM",
                      "UBTI threshold ($1K) flagged for IRA and trust investors",
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
                    <ShieldCheck className="h-4 w-4 text-foreground/50" />
                    <h3 className="text-base font-semibold text-foreground">Deal feasibility checks</h3>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "DSCR minimum 1.25x on the senior debt",
                      "LTV maximum 75% against appraised value",
                      "Exit cap rate vs. going-in cap rate sanity check",
                      "Breakeven occupancy flagged if above 85%",
                      "Capital stack balance verified",
                      "IRR plausibility check against the property type",
                      "Waterfall distributions verified against OA terms",
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

            <FadeIn delay={0.15}>
              <div className="mt-6 rounded-xl bg-card p-5 card-shine flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-foreground/50 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  An IRR that doesn&apos;t match the waterfall. A depreciation schedule using the wrong useful life. A pro forma that shows Year 3 distributions from an exit that happens in Year 5. These mistakes show up in investor decks all the time. The model catches them because every line connects to every other line.
                </p>
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
                  See the full syndication package.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  All 5 documents and the full financial model. Free demo.
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
