import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  Landmark,
  Building2,
  Handshake,
  Building,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileCheck,
  Calculator,
  Scale,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { FadeIn, Stagger, StaggerItem, CountUp } from "@/components/motion";

const MODULES = [
  {
    name: "Lending",
    href: "/lending",
    icon: Landmark,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    borderColor: "group-hover:border-blue-500/30",
    docs: 36,
    programs: 14,
    headline: "Full loan packages for 14 programs",
    what: "Upload borrower financials and pick a program. Get back up to 27 documents per deal: promissory notes, loan agreements, SBA forms, deeds of trust, closing disclosures, amortization schedules. Rates, LTVs, and fees calculated from program rules for your state.",
  },
  {
    name: "Capital",
    href: "/capital",
    icon: Building2,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    borderColor: "group-hover:border-violet-500/30",
    docs: 6,
    programs: 6,
    headline: "Fund formation docs for 6 fund types",
    what: "Enter your fund terms once. Get the PPM, subscription agreement, operating agreement, investor questionnaire, side letter, and Form D draft. 506(b) or 506(c). Consistent terms across every document.",
  },
  {
    name: "Deals / M&A",
    href: "/deals",
    icon: Handshake,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    borderColor: "group-hover:border-amber-500/30",
    docs: 6,
    programs: 8,
    headline: "Acquisition docs from LOI to close",
    what: "Describe the deal and the structure. Get an LOI, NDA, purchase agreement with 25+ seller reps, due diligence checklist, disclosure schedules, and closing checklist. HSR thresholds auto-calculated at current rates.",
  },
  {
    name: "Syndication",
    href: "/syndication",
    icon: Building,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    borderColor: "group-hover:border-emerald-500/30",
    docs: 5,
    programs: 12,
    headline: "Investor docs and a pure-math financial model",
    what: "Enter the property, financing, and waterfall. Get a PPM, operating agreement, subscription agreement, investor questionnaire, and year-by-year pro forma with IRR, waterfall distributions, and sensitivity analysis. The financial model is 100% math.",
  },
  {
    name: "Compliance",
    href: "/compliance",
    icon: ShieldCheck,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    borderColor: "group-hover:border-cyan-500/30",
    docs: 6,
    programs: 6,
    headline: "LP reports, K-1s, and fund admin",
    what: "Enter your fund data for the period. Get quarterly LP reports (ILPA format), capital call notices, distribution notices, K-1 summaries covering all 23 IRS boxes, annual reports, and Form ADV. Withholding rates calculated per investor type.",
  },
];

const TRUST_ITEMS = [
  {
    icon: Lock,
    title: "Encrypted and isolated",
    desc: "Every file encrypted at rest and in transit. Download links expire. Each organization's data is completely separated at the database level.",
  },
  {
    icon: Calculator,
    title: "Numbers from rules, not AI",
    desc: "Interest rates, fees, LTV ratios, tax withholding, HSR thresholds, K-1 allocations. Every number comes from the program rules and regulatory requirements. The AI writes legal language only.",
  },
  {
    icon: FileCheck,
    title: "200+ compliance checks per document",
    desc: "After generation, your documents are checked against the federal and state regulations that apply to your specific deal. Usury limits, OFAC screening, SBA eligibility, Reg D requirements, ILPA standards.",
  },
  {
    icon: Scale,
    title: "50-state regulatory coverage",
    desc: "State usury limits, commercial financing disclosures, blue sky filings, community property rules, non-compete enforceability, mini-WARN acts. The system knows which rules apply where.",
  },
];

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background relative overflow-x-hidden">
      <MarketingNav />

      {/* Hero */}
      <section className="relative w-full hero-glow">
        <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32 relative z-10">
          <FadeIn>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                Your deals close faster when
                <br />
                <span className="text-gradient">
                  documents aren't the bottleneck.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                OpenShut generates complete legal document packages for PE firms,
                lenders, and fund managers. 59 document types across lending,
                fund formation, M&A, real estate syndication, and compliance.
                Every number is calculated from program rules and checked against
                the actual regulations for your deal and state before you see it.
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
                One project free in any module. No credit card. No sales call.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full relative">
        <div className="section-glow-divider" />
        <div className="bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <FadeIn delay={0} className="text-center">
                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums number-glow">
                  <CountUp to={59} />
                </div>
                <div className="mt-1.5 text-sm text-muted-foreground">
                  document types
                </div>
              </FadeIn>
              <FadeIn delay={0.05} className="text-center">
                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums number-glow">
                  <CountUp to={5} />
                </div>
                <div className="mt-1.5 text-sm text-muted-foreground">
                  modules
                </div>
              </FadeIn>
              <FadeIn delay={0.1} className="text-center">
                <div className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl tabular-nums number-glow">
                  <CountUp to={50} />
                </div>
                <div className="mt-1.5 text-sm text-muted-foreground">
                  states covered
                </div>
              </FadeIn>
              <FadeIn delay={0.15} className="text-center">
                <div className="text-3xl font-bold tracking-tight sm:text-4xl tabular-nums text-gradient">
                  $1M+
                </div>
                <div className="mt-1.5 text-sm text-muted-foreground">
                  saved per year vs. outside counsel
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
        <div className="section-glow-divider" />
      </section>

      {/* How It Works */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Three steps. Full document package.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                No onboarding call, no implementation timeline.
                Sign up and run your first deal in minutes.
              </p>
            </div>
          </FadeIn>

          <Stagger
            className="grid grid-cols-1 gap-6 sm:grid-cols-3"
            staggerDelay={0.08}
            initialDelay={0.1}
          >
            {[
              {
                n: "01",
                title: "Enter the deal",
                desc: "Pick a module, select your program or deal type, and fill in the terms. Upload borrower financials, fund docs, or target company materials. The platform reads and extracts the numbers.",
              },
              {
                n: "02",
                title: "Generate the full package",
                desc: "Every document your deal requires is generated as a set. Numbers from program rules, legal language written around those numbers, then checked against federal and state regulations before you see anything.",
              },
              {
                n: "03",
                title: "Review, edit, close",
                desc: "Read through every document in the editor. Make changes inline. Download as Word or PDF and take it to your attorney. They review a package instead of drafting from scratch.",
              },
            ].map((step) => (
              <StaggerItem key={step.n}>
                <div className="rounded-xl border bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 card-glow-border h-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold mb-5 font-mono">
                    {step.n}
                  </div>
                  <h3 className="text-base font-semibold text-card-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Products */}
      <section className="w-full relative">
        <div className="section-glow-divider" />
        <div className="bg-muted/20 bg-dot-pattern">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Five modules. Pick the ones your firm needs.
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Each module covers a different type of deal with its own
                  document set, compliance rules, and calculations. License them
                  individually or run the full suite.
                </p>
              </div>
            </FadeIn>

            <Stagger
              className="grid grid-cols-1 gap-5"
              staggerDelay={0.06}
              initialDelay={0.1}
            >
              {MODULES.map((mod) => (
                <StaggerItem key={mod.name}>
                  <Link href={mod.href} className="block group">
                    <div
                      className={`rounded-xl border bg-card p-6 sm:p-8 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl ${mod.borderColor} card-glow-border`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                        <div className="flex items-center gap-3 sm:min-w-[200px]">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${mod.bg} ${mod.color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
                          >
                            <mod.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-card-foreground">
                              {mod.name}
                            </h3>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {mod.docs} documents
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${mod.color} mb-1.5`}
                          >
                            {mod.headline}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {mod.what}
                          </p>
                        </div>
                        <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground/40 mt-1 shrink-0 transition-all duration-200 group-hover:text-primary group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
        <div className="section-glow-divider" />
      </section>

      {/* Cost */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Replace what you spend on outside counsel
                  </h2>
                  <p className="mt-6 text-muted-foreground leading-relaxed">
                    A mid-market PE firm typically spends $1.5 million or more
                    per year on outside counsel for document preparation. Most of
                    that goes to drafting work that follows the same regulatory
                    rules every time.
                  </p>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    The full OpenShut suite costs $420K a year after year one.
                    Your attorneys still review everything, but they start from
                    a complete, compliant first draft instead of a blank page.
                  </p>
                  <div className="mt-8">
                    <Link
                      href="/pricing"
                      className="group inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      See full pricing breakdown
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-8 card-glow-border">
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Typical outside counsel spend
                      </div>
                      <div className="text-3xl font-bold text-foreground tabular-nums">
                        $1,500,000+
                      </div>
                      <div className="mt-2 h-3 rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-full rounded-full bg-destructive/60" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        OpenShut full suite (year 2+)
                      </div>
                      <div className="text-3xl font-bold text-gradient tabular-nums">
                        $419,988
                      </div>
                      <div className="mt-2 h-3 rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-[28%] rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Annual savings
                        </span>
                        <span className="text-xl font-bold text-emerald-500">
                          $1,080,012+
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Trust */}
      <section className="w-full relative">
        <div className="section-glow-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mx-auto text-center mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Built for firms that handle sensitive deals
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Your deal data, financials, and investor information are
                  treated the way you would expect from a system built for this
                  industry.
                </p>
              </div>
            </FadeIn>

            <Stagger
              className="grid grid-cols-1 gap-5 sm:grid-cols-2"
              staggerDelay={0.06}
              initialDelay={0.1}
            >
              {TRUST_ITEMS.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="rounded-xl border bg-card p-6 sm:p-7 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:border-foreground/15 card-glow-border h-full">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-card-foreground mb-1.5">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <FadeIn delay={0.2}>
              <div className="mt-8 text-center">
                <Link
                  href="/platform"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Full security and compliance details
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
        <div className="section-glow-divider" />
      </section>

      {/* Bottom CTA */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="relative rounded-2xl border bg-card p-12 sm:p-16 text-center overflow-hidden transition-all duration-300 hover:border-foreground/15 hover:shadow-xl hero-glow">
              <div className="absolute inset-0 bg-grid-pattern opacity-40" />

              <div className="relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Try it on a real deal.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  One project free in any module. Full output. No credit card.
                  No demo call. Just sign up and run a deal.
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
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    Encrypted
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    No credit card
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    50-state compliant
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
