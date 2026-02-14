import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Building, Calculator } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "Private Placement Memorandum",
    desc: "Property details, deal structure, projected returns, risk factors, and legal disclosures. What your investors read before committing.",
  },
  {
    name: "LLC Operating Agreement",
    desc: "The syndication entity. Management, capital contributions, waterfall distributions, transfers, and dissolution.",
  },
  {
    name: "Subscription Agreement",
    desc: "Each investor signs this to commit capital. Investment amount, accreditation reps, suitability confirmations.",
  },
  {
    name: "Investor Questionnaire",
    desc: "Accreditation status, tax ID, entity type. Collected for every investor before accepting capital.",
  },
  {
    name: "Pro Forma Financial Projections",
    desc: "Year-by-year model from your inputs. Revenue, expenses, debt service, waterfall distributions, exit proceeds. IRR calculated with Newton-Raphson iteration. 100% math, zero AI.",
    highlight: true,
  },
];

const PROPERTY_TYPES = [
  { name: "Multifamily", expense: "35-45%", depreciation: "27.5yr" },
  { name: "Office", expense: "40-50%", depreciation: "39yr" },
  { name: "Retail", expense: "30-40%", depreciation: "39yr" },
  { name: "Industrial", expense: "25-35%", depreciation: "39yr" },
  { name: "Mixed Use", expense: "35-50%", depreciation: "39yr" },
  { name: "Self Storage", expense: "25-40%", depreciation: "39yr" },
  { name: "Manufactured Housing", expense: "30-40%", depreciation: "27.5yr" },
  { name: "Hotel", expense: "55-75%", depreciation: "39yr" },
  { name: "Triple Net (NNN)", expense: "10-20%", depreciation: "39yr" },
  { name: "Senior Living", expense: "55-70%", depreciation: "27.5yr" },
  { name: "Student Housing", expense: "40-50%", depreciation: "27.5yr" },
  { name: "Build-to-Rent", expense: "30-40%", depreciation: "27.5yr" },
];

export default function SyndicationPage() {
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
                <Building className="h-3.5 w-3.5" />
                Syndication
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                Five investor-ready documents
                <br />
                <span className="text-muted-foreground">
                  and a year-by-year pro forma.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                Enter the property, the financing, and how you want the
                waterfall structured. Get back 5 investor-ready documents and a
                year-by-year pro forma with IRR, equity multiples, waterfall
                distributions, and sensitivity analysis. The financial model
                is pure math across 12 property types.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <SignInButton mode="modal">
                  <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                    Model a Deal Free
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
                First deal free. All 5 documents plus full pro forma.
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
                  Everything you need before you talk to investors
                </h2>
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
              {DOCUMENTS.map((doc) => (
                <StaggerItem key={doc.name}>
                  <div className={`rounded-xl bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full ${doc.highlight ? "sm:col-span-2 lg:col-span-1 ring-1 ring-border" : ""}`}>
                    <div className="flex items-center gap-2.5 mb-3">
                      {doc.highlight ? (
                        <Calculator className="h-4 w-4 text-foreground/50 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-foreground/40 shrink-0" />
                      )}
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

      {/* Financial Model */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                The pro forma is 100% math
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                The financial model doesn't use AI at all. Every line is
                calculated from your inputs using the same methods your Excel
                model uses.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-3" staggerDelay={0.06} initialDelay={0.1}>
            {[
              {
                title: "Year-by-year projections",
                items: ["Revenue and vacancy", "Operating expenses by category", "NOI and debt service", "Depreciation (27.5yr or 39yr by property type)", "Free cash flow per year"],
              },
              {
                title: "Waterfall distributions",
                items: ["Preferred return hurdle", "GP catch-up (100% to GP during catch-up)", "Promote tiers you define", "Cumulative tracking across the hold", "LP/GP split at every level"],
              },
              {
                title: "Return metrics",
                items: ["IRR (Newton-Raphson iteration)", "Equity multiple / MOIC", "Cash-on-cash return", "DPI, RVPI, TVPI", "Sensitivity on exit cap rate and occupancy"],
              },
            ].map((col) => (
              <StaggerItem key={col.title}>
                <div className="rounded-xl bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 card-shine h-full">
                  <h3 className="text-sm font-semibold text-foreground mb-4">{col.title}</h3>
                  <ul className="space-y-2">
                    {col.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-foreground/30 mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Property Types */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  12 property types, each modeled differently
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  A hotel runs at 55-75% expenses. Industrial runs at 25-35%.
                  Residential depreciates over 27.5 years, commercial over 39.
                  The model adjusts based on what you are buying.
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
                      <span className="tabular-nums">{type.depreciation}</span>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <FadeIn delay={0.2}>
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground/60">
                <span>Expense ratio range</span>
                <span>|</span>
                <span>Depreciation schedule</span>
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
              { n: "01", title: "Enter the deal", desc: "Property type, purchase price, financing, hold period, rent growth, and waterfall structure. About 10 minutes." },
              { n: "02", title: "Get 5 docs and a full model", desc: "PPM, operating agreement, subscription docs, investor questionnaire, and year-by-year pro forma projections." },
              { n: "03", title: "Review, edit, download", desc: "Read everything in the editor. Make changes. Download individually or as a ZIP. Send to your attorney, then to investors." },
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
                    Model a deal for free. Check every number.
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                    One deal. All 5 documents and the full financial model.
                    Download everything and verify it yourself.
                  </p>
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <SignInButton mode="modal">
                      <button className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98]">
                        Model a Deal Free
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
