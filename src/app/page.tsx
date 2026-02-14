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
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

const MODULES = [
  {
    name: "Lending",
    href: "/lending",
    icon: Landmark,
    docs: 36,
    programs: 14,
    headline: "Full loan packages for 14 programs",
    what: "Upload borrower financials, pick a program, and get back up to 27 documents per deal. Promissory notes, loan agreements, SBA forms, deeds of trust, closing disclosures, amortization schedules. Rates and fees calculated from the actual program rules for your state.",
  },
  {
    name: "Capital",
    href: "/capital",
    icon: Building2,
    docs: 6,
    programs: 6,
    headline: "Fund formation docs for 6 fund types",
    what: "Enter your fund terms and get the PPM, subscription agreement, operating agreement, investor questionnaire, side letter, and Form D draft. Works for PE, VC, real estate, hedge, credit, and infrastructure funds under 506(b) or 506(c).",
  },
  {
    name: "Deals / M&A",
    href: "/deals",
    icon: Handshake,
    docs: 6,
    programs: 8,
    headline: "Acquisition docs from LOI to close",
    what: "Describe the deal and the structure. Get an LOI, NDA, purchase agreement with 25+ seller reps, due diligence checklist, disclosure schedules, and closing checklist. HSR thresholds calculated at current rates.",
  },
  {
    name: "Syndication",
    href: "/syndication",
    icon: Building,
    docs: 5,
    programs: 12,
    headline: "Investor docs and a pure-math financial model",
    what: "Enter the property, financing, and waterfall structure. Get a PPM, operating agreement, subscription agreement, investor questionnaire, and year-by-year pro forma with IRR, waterfall distributions, and sensitivity analysis across 12 property types.",
  },
  {
    name: "Compliance",
    href: "/compliance",
    icon: ShieldCheck,
    docs: 6,
    programs: 6,
    headline: "LP reports, K-1s, and fund admin",
    what: "Enter your fund data for the period and get quarterly LP reports in ILPA format, capital call notices, distribution notices with waterfall breakdowns, K-1 summaries covering all 23 IRS boxes, annual reports, and Form ADV.",
  },
];

const TRUST_ITEMS = [
  {
    icon: Lock,
    title: "Encrypted and isolated",
    desc: "Every file encrypted at rest and in transit. Download links expire after one hour. Each organization's data is completely separated at the database level.",
  },
  {
    icon: Calculator,
    title: "Numbers from rules, not AI",
    desc: "Interest rates, fees, LTV ratios, tax withholding, HSR thresholds, K-1 allocations. Every number comes from the program rules and regulatory requirements for your specific deal.",
  },
  {
    icon: FileCheck,
    title: "200+ compliance checks per document",
    desc: "After generation, documents are checked against federal and state regulations for your deal type, program, and jurisdiction. Usury limits, OFAC screening, SBA eligibility, Reg D requirements, ILPA standards.",
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
      <section className="relative w-full hero-light bg-noise">
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-32 relative z-10">
          <FadeIn>
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1]">
                59 document types.
                <br />
                Five modules.
                <br />
                <span className="text-muted-foreground">
                  Documents ready in minutes.
                </span>
              </h1>
              <p className="mt-8 text-lg text-muted-foreground sm:text-xl max-w-2xl leading-relaxed">
                OpenShut generates complete legal document packages for PE firms,
                lenders, and fund managers. 59 document types across lending,
                fund formation, M&A, real estate syndication, and compliance.
                Zero hallucination, guaranteed.
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
                One project free in any module.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <FadeIn>
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Sign up and run your first deal in minutes. The free tier is the
                full product with a one-project limit.
              </p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-3" staggerDelay={0.08} initialDelay={0.1}>
            {[
              {
                n: "01",
                title: "Enter the deal",
                desc: "Pick a module, select your program or deal type, and fill in the terms. Upload borrower financials, fund docs, or target company materials if the module calls for it.",
              },
              {
                n: "02",
                title: "Generate the package",
                desc: "Every document your deal requires is generated as a set. Numbers come from program rules. Legal language is written around those numbers, then checked against the regulations for your deal and state.",
              },
              {
                n: "03",
                title: "Review and close",
                desc: "Read through everything in the editor. Make changes inline. Download as Word or PDF and hand it to your attorney. They review a complete first draft instead of starting from scratch.",
              },
            ].map((step) => (
              <StaggerItem key={step.n}>
                <div className="rounded-xl bg-card p-6 sm:p-8 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground text-sm font-bold mb-5 font-mono inset-shine">
                    {step.n}
                  </div>
                  <h3 className="text-base font-semibold text-card-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Products */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20 bg-dot-pattern">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Five modules
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Each module covers a different type of deal with its own
                  document set, compliance rules, and calculations. License them
                  individually or run the full suite.
                </p>
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-1 gap-4" staggerDelay={0.06} initialDelay={0.1}>
              {MODULES.map((mod) => (
                <StaggerItem key={mod.name}>
                  <Link href={mod.href} className="block group">
                    <div className="rounded-xl bg-card p-6 sm:p-8 transition-all duration-300 ease-out hover:-translate-y-0.5 card-shine metallic-sheen">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                        <div className="flex items-center gap-3 sm:min-w-[200px]">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground transition-all duration-300 group-hover:scale-110 inset-shine">
                            <mod.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-card-foreground">{mod.name}</h3>
                            <span className="text-xs text-muted-foreground tabular-nums">{mod.docs} documents</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-1.5">{mod.headline}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{mod.what}</p>
                        </div>
                        <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground/40 mt-1 shrink-0 transition-all duration-200 group-hover:text-foreground group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
        <div className="section-divider" />
      </section>

      {/* Trust */}
      <section className="w-full relative">
        <div className="section-divider" />
        <div className="bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
            <FadeIn>
              <div className="max-w-2xl mx-auto text-center mb-14">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Built for firms that handle sensitive deals
                </h2>
              </div>
            </FadeIn>

            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2" staggerDelay={0.06} initialDelay={0.1}>
              {TRUST_ITEMS.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="rounded-xl bg-card p-6 sm:p-7 transition-all duration-200 ease-out hover:-translate-y-0.5 card-shine metallic-sheen h-full">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted inset-shine">
                        <item.icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-card-foreground mb-1.5">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <FadeIn delay={0.2}>
              <div className="mt-8 text-center">
                <Link href="/platform" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80">
                  Full security and compliance details
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
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
              <div className="absolute inset-0 bg-grid-pattern opacity-30" />
              <div className="relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Try it on a real deal.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                  One project free in any module. Full output. Sign up and run
                  a deal whenever you are ready.
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
      </section>

      <MarketingFooter />
    </div>
  );
}
