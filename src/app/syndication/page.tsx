import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Building } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const DOCUMENTS = [
  {
    name: "Private Placement Memorandum (PPM)",
    desc: "The document you hand to investors. Property details, deal structure, projected returns, risk factors, and every required legal disclosure. Ready for counsel review.",
  },
  {
    name: "LLC Operating Agreement",
    desc: "Sets up the syndication entity. Who manages, who votes, how capital comes in, how distributions go out, and what happens on a transfer or dissolution.",
  },
  {
    name: "Subscription Agreement",
    desc: "What each investor signs to commit money. Investment amount, accreditation reps, suitability confirmations. One per investor.",
  },
  {
    name: "Investor Questionnaire",
    desc: "Collects the info you need before accepting capital. Accreditation status, tax ID, entity type, address. You need this for every investor.",
  },
  {
    name: "Pro Forma Financial Projections",
    desc: "Pure math. Year-by-year projections from your actual inputs. Revenue, expenses, debt service, waterfall distributions, exit proceeds. IRR calculated with Newton-Raphson iteration. Zero AI involved.",
  },
];

const PROPERTY_TYPES = [
  {
    name: "Multifamily",
    desc: "Apartments, garden-style, mid-rise, high-rise. Expense ratio built for residential operations.",
  },
  {
    name: "Office",
    desc: "Class A through C. Single-tenant or multi-tenant. TI and leasing commissions modeled separately.",
  },
  {
    name: "Retail",
    desc: "Strip centers, power centers, neighborhood retail. NNN and gross lease structures supported.",
  },
  {
    name: "Industrial",
    desc: "Warehouses, distribution, flex space. Lower expense ratios reflected in the model.",
  },
  {
    name: "Mixed Use",
    desc: "Retail plus residential or office. Each component modeled with its own income and expense assumptions.",
  },
  {
    name: "Self Storage",
    desc: "Climate-controlled and drive-up. High-margin operations with property-specific expense categories.",
  },
  {
    name: "Manufactured Housing",
    desc: "Mobile home parks. Lot rent income, low capex. Residents own the homes, you own the land.",
  },
  {
    name: "Hotel",
    desc: "Limited-service, full-service, extended-stay. Highest expense ratio (up to 65%) built into projections.",
  },
  {
    name: "Triple Net (NNN)",
    desc: "Single-tenant. Tenant pays taxes, insurance, maintenance. Expense ratio as low as 15%.",
  },
  {
    name: "Senior Living",
    desc: "Independent living, assisted living, memory care. Specialized operating expense categories.",
  },
  {
    name: "Student Housing",
    desc: "Purpose-built near universities. By-the-bed or by-the-unit leasing. Seasonal occupancy modeled.",
  },
  {
    name: "Build-to-Rent",
    desc: "New construction single-family built for rental income. Construction draw schedule supported.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Tell us about the deal",
    desc: "Property type, purchase price, financing, hold period, rent growth, and how you want the waterfall structured. Takes about 10 minutes.",
  },
  {
    number: "2",
    title: "Get 5 documents and a full financial model",
    desc: "PPM, operating agreement, subscription docs, investor questionnaire, and year-by-year pro forma projections. All generated together.",
  },
  {
    number: "3",
    title: "Review, edit, download",
    desc: "Read everything in the editor. Make changes. Download individually or as a ZIP. Send to your attorney before you send to investors.",
  },
];

export default function SyndicationPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      {/* Gradient orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/3 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-emerald-500/4 blur-3xl" />

      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-32">
          <FadeIn>
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Building className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-widest text-emerald-500">
                  Syndication
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                PPM, operating agreement, and financial model.
                <br />
                <span className="text-emerald-500">
                  From one set of deal inputs.
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                Enter the property, the structure, and your assumptions. Get back 5 investor-ready
                documents and a year-by-year pro forma with waterfall distributions, IRR,
                equity multiples, and sensitivity analysis. The financial model is pure math. No AI touches the numbers.
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
                First deal free. All 5 documents plus pro forma. No credit card.
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
                Everything you need before you talk to investors
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                5 documents generated from one set of inputs. PPM, operating agreement,
                subscription agreement, investor questionnaire, and a complete financial model.
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
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
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

      {/* Property Types */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                12 property types. Each one modeled differently.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Pick your asset class. The financial model adjusts expense ratios, depreciation
                schedules, and operating assumptions to match. A hotel does not run like a
                triple net lease, and the numbers should reflect that.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            staggerDelay={0.06}
            initialDelay={0.1}
          >
            {PROPERTY_TYPES.map((type) => (
              <StaggerItem key={type.name}>
                <div className="group rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Building className="h-4 w-4 text-emerald-500 shrink-0" />
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

      {/* Financial Model */}
      <section className="w-full border-y border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                The pro forma is 100% math. Zero AI.
              </h2>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                This is the part most people ask about. The financial model does not use AI at all.
                Every number is calculated from your inputs. Revenue, vacancy, expenses, debt
                service, distributions, exit proceeds. IRR uses Newton-Raphson iteration, the same
                method your Excel model uses. You can check every line.
              </p>
              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
                {[
                  {
                    title: "Year-by-year projections",
                    desc: "Revenue, expenses, NOI, debt service, and free cash flow for every year of the hold. Depreciation on a 27.5 or 39-year schedule depending on property type.",
                  },
                  {
                    title: "Multi-tier waterfall",
                    desc: "Preferred return, catch-up, promote splits. Cumulative hurdle tracking across the entire hold period. You set the tiers.",
                  },
                  {
                    title: "Every return metric that matters",
                    desc: "IRR, equity multiple (MOIC), cash-on-cash, DPI, RVPI, TVPI. Plus sensitivity analysis on exit cap rates and breakeven occupancy.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border bg-card p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
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
                Sign up, enter your deal, get your documents. No demo call required.
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
                  <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white text-sm font-bold">
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
                <div className="h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl" />
              </div>

              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Model a deal for free. See what you get.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  One deal, no credit card. You get all 5 documents and the full financial model.
                  Download everything and send it to your attorney.
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
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    5 documents included
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Full financial model
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
